console.log("main_script.js loaded!");

//Global variables
let stocksList= new Array(); //will be populated with RestletApi: symbols in portfolio
let portfolioList = new Array();
let restlet_API="https://stockportfolio.restlet.net:443/v1/stocks/?%24page=1";
let alpha_vantage_key = "51017XKAAOF0FWZS";
let stocks_nyse=new Array();
let temp_price=99;
//JS Objects
function stock_realTimeQuote(symbol,stock_investment,total_num_stocks) {
    this.symbol=symbol;
    this.current=0;
    this.open; //use later
    this.stock_investment=stock_investment; //total amount invested on this stock
    this.total_num_stocks=total_num_stocks; //total number of stocks
}
//Function
function stock_avgEntry(stock) {
    return (stock.stock_investment/stock.total_num_stocks);
}
function stock_gain(stock) { 
    var yield= ((stock.current/stock_avgEntry(stock))-1)*100;                         //when added new, gain result is wrong for 1st iteration.
    return yield;
}
function ROI() {
    //implement later
}
function reset_addStock() {
    $("#search, #add_quantity, #add_unitprice, #add_totalPrice").val("");
}
//deleting stock from the array
function delete_stock(array, attr, value){
   var i = array.length;
   while(i--){
      if(array[i] && array[i].hasOwnProperty(attr) && array[i][attr] === value){
          array.splice(i,1);
      }
   }
   return array;
}
//adding new stock to the viewPortfolio table
function add_To_ViewPortfolio(newStock,cur_price) {
    let i_portfioList_newStock= portfolioList.findIndex(function(s) { return s["symbol"] === newStock.symbol});
    portfolioList[i_portfioList_newStock].current = cur_price;
    $("#tbl_portfolio").append(
        "<tr symbol='"+newStock.symbol+"'><td>"+newStock.symbol+"</td><td>"+ portfolioList[i_portfioList_newStock].current.toFixed(2)+"</td><td>"
        + stock_avgEntry(portfolioList[i_portfioList_newStock]).toFixed(2)
        +"</td><td>"+newStock.total_num_stocks+"</td><td>"+ stock_gain(portfolioList[i_portfioList_newStock]).toFixed(2) +"%</td><td>"
        +"<button id='btnDelete' value='"+newStock.symbol+"' style='background-color:#ffff25;'>Delete</button>"+"</td></tr>"
    );
}
//editing portfolio for an existing stock
function edit_portfolio(stock) {
    $.ajax({
        url:"https://stockportfolio.restlet.net/v1/stocks/"+stock.symbol,
        type:"PUT",
        data:JSON.stringify(stock),
        contentType: "application/json",
        success:function () {
            console.log("successfully editted " +stock.symbol );
        },
        error:function(){
            console.log("Error in editing existing stock!");
        }
    });
}

//setting instant quote
function get_instantQuote(symbol_instant){
    let alphavantage_instantQuote= "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + symbol_instant
        + "&apikey=" + alpha_vantage_key;
    console.log(alphavantage_instantQuote);
    //API instantQuote call
    $.getJSON(alphavantage_instantQuote,function (instantQuote) {
        var temp_price = instantQuote['Global Quote']['05. price'];
        $("#add_unitprice").val(temp_price);
        $("#add_totalPrice").val(temp_price);
        console.log(instantQuote['Global Quote']['05. price']);
    });
}

//Functions to load portfolio in a table
function loadPortfolioData(portfolioArray) {
    $("#tbl_portfolio").html("");
    $("#tbl_a").table("rebuild"); //or "rebuild" or "refresh"
    for(i=0;i<portfolioList.length;i++){
        $("#tbl_portfolio").append(
            "<tr symbol='"+portfolioList[i].symbol+"'><td>"+portfolioList[i].symbol+"</td><td>"+
            parseFloat(portfolioList[i].current).toFixed(2)+"</td><td>"+
            stock_avgEntry(portfolioList[i]).toFixed(2)+"</td><td>"+portfolioList[i].total_num_stocks+"</td><td>"+
            stock_gain(portfolioList[i]).toFixed(2)+"%</td><td>"+"<button id='btnDelete' value='"+portfolioList[i].symbol+"' style='background-color:#ffff25;'>Delete</button>"
            +"</td></tr>"
        );
    }
}
//$("#tbl_portfolio").load(" #tbl_portfolio");

//CSS
$("#tbl_a tr:odd").css('background-color', '#ddd');

//API-Restlet call for loading stocksList
$(document).on("pagecreate","#pg_homePage",function(){
    //portfolioList will be loaded before homePage
    $.getJSON(restlet_API,function(portfolio_data){
        console.log(portfolio_data);
        for(i=0;i<portfolio_data.length;i++){
            let newStock_realTimeQuote = new stock_realTimeQuote(portfolio_data[i].symbol,portfolio_data[i].investment,portfolio_data[i].total_num_stocks);
            portfolioList.push(newStock_realTimeQuote);
            //symbols will be loaded to stocksList
            stocksList.push(portfolioList[i]['symbol']);
        }//loop ends
    });
    //NYSE-data loaded before homePage
    $.getJSON("https://nyselisting.restlet.net:443/v1/data/data_nyse.json", function(nyseData) {
        $.each(nyseData, function(i, content) {
            stocks_nyse.push(content);
        })
    });
    console.log(stocks_nyse);
}); //pagebeforecreate load ends

//API-alpha vantage call for Real-time data--->scope problem solved
function update_realtime_stock_price(){
    console.log("update_realtime_stock_price triggered!");
    var alphaVantage_API = "https://www.alphavantage.co/query?function=BATCH_QUOTES_US&symbols=" +stocksList.toString()+ "&apikey=" + alpha_vantage_key;
    if(stocksList.length>0){
        $.getJSON(alphaVantage_API, function(daily_quotes_data){
            console.log("after stocksList: "+ stocksList.toString());
            console.log("after: "+ alphaVantage_API);
            console.log(daily_quotes_data);
            var start= daily_quotes_data['Stock Batch Quotes']; console.log(start);
            //error handling and matching with portfolioList and daily_quotes_data
            if (start.length >0){
                for(let i=0; i<portfolioList.length;i++){
                    //j is appropriate index for API result
                    let j= start.findIndex(function(s) { return s['1. symbol']=== portfolioList[i].symbol});
                    //console.log(portfolioList[i].symbol);
                    //console.log(j);
                    //console.log(start[j]['1. symbol']);
                    if(j>=0){                                                   //if only found an appropriate matching symbol
                        //console.log("got him: "+ j + " for: i= " + i);
                        portfolioList[i].current=start[j]['5. price'];  //updating realtime price
                    }
                }//loop ends
                loadPortfolioData(portfolioList);
            }
        })
        .fail(function (error) {
            console.log(error);
        });
    } else {
        alert("No stocks in your portfolio.");
    }
}

$(document).one("pagecreate", "#pg_portfolio",function () {
    update_realtime_stock_price();
});
//function calculating total investment
$("#add_totalPrice").on("calc_total", function(event, temp_price, temp_unit){
    //console.log("calc_total being called");
    $(this).val(Number.parseFloat(temp_price * temp_unit).toFixed(2));

});
//triggering total investment
$("#add_quantity").change(function(){
    var p = $("#add_unitprice").val();
    var q= $("#add_quantity").val();
    $("#add_totalPrice").trigger("calc_total", [p,q]);

});

//AutoComplete stocks search
$(document).ready(function(){
    $("#search").autocomplete({
        minLength: 1,
        source: stocks_nyse,
        select: function (event, ui) {
            get_instantQuote(ui.item.value);
            $("#add_quantity").val(1);
        }
    })
});

//Navigation between pages
$(document).on("click", "#btnViewPortfolio", function(){
    $.mobile.changePage("#pg_portfolio", {transition:"slide"});
});
$(document).on("click", "#btnManagePortfolio", function(){
    $.mobile.changePage("#pg_addStocks", {transition:"slide"});
});
$(document).on("click","#reset_add", function () {
    reset_addStock();
});

//add stocks
$(document).on("click", "#add_stock", function () {
    console.log("add triggered!");
    let temp_symbol = $("#search").val();
    let temp_investment = Number($("#add_totalPrice").val());
    let temp_total_num_stocks= Number($("#add_quantity").val());
    let temp_unitprice = Number($("#add_unitprice").val());
    //checking if any fields are empty
    if(temp_symbol == "" || temp_investment==""|| temp_total_num_stocks ==""|| temp_unitprice==""){
        alert("All the fields must be filled!");
        return;                                         //breaking out of the function
    }
    var newStock = new stock_realTimeQuote(temp_symbol,temp_investment,temp_total_num_stocks);
    var data= {"symbol": temp_symbol,"investment": temp_investment,"total_num_stocks": temp_total_num_stocks};
    if($.inArray(temp_symbol,stocksList) !== -1){                               //if stock is already on the stocksList
        let index_existing_stock= portfolioList.findIndex(function(s) { return s["symbol"] === temp_symbol});
        //modify the data object and send it to edit
        portfolioList[index_existing_stock].stock_investment += temp_investment;        //problem is here //it's concatenating but not adding
        portfolioList[index_existing_stock].total_num_stocks += temp_total_num_stocks;  //problem is here //not adding
        console.log(data.symbol);
        data = {"symbol": temp_symbol,
                "investment": portfolioList[index_existing_stock].stock_investment,
                "total_num_stocks": portfolioList[index_existing_stock].total_num_stocks};
        $("#tbl_portfolio > tr[symbol='"+data.symbol+"']").remove();    //removing existing stock from the table first

        add_To_ViewPortfolio(data,temp_unitprice);
        edit_portfolio(data,index_existing_stock);                              //editing portfolio on DB using API
    }else{                                                                      //if stock is not on list
        $.ajax({
            url: "https://stockportfolio.restlet.net:443/v1/stocks/",
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function (res) {
                console.log("TESTING PRICE: "+temp_unitprice );
                stocksList.push(data.symbol);
                portfolioList.push(newStock);
                add_To_ViewPortfolio(newStock,temp_unitprice);
                console.log(res);
            },
            error: function () {
                console.log("Error in adding stock to portfolioList");
            }
        });
    }
    reset_addStock();
    $.mobile.changePage("#pg_homePage", {transition:"slide"});
});

//Delete button
$(document).on("click","#btnDelete", function () {
    //console.log($(this));
    var tr = $(this).closest('tr');
    var del_symbol= $(this).attr("value");

    //console.log("Delete triggering: "+ del_symbol);
    $.ajax({
        url: 'https://stockportfolio.restlet.net:443/v1/stocks/' + del_symbol,
        cache: false,
        type: 'DELETE',
        success: function() {
                    tr.fadeOut(200, function () {
                        $(this).remove();       //removing the row from the table
                })
            //console.log("deleted: "+ del_symbol); //confirmed
             //calling delete function
            stocksList.splice($.inArray(del_symbol, stocksList),1);             //DELETE from stocksList //1 is for deleting one item
            delete_stock(portfolioList,"symbol",del_symbol);
            console.log(portfolioList);
            console.log(stocksList);//printing array to confirm DELETE - confirmed
        }//success ends
    });
});

//solve adding problem with real-time pricing on viewPortfolio refresh- think about refreshing a div periodically.
	window.setInterval(update_realtime_stock_price, 180000);                    //refreshes every 3 min
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
