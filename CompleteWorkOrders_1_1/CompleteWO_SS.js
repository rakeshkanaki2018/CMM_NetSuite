/**
 * Created by cmw on 1/17/17.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Oct 2014     greg.smith
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function completeWorkOrders() {
    nlapiLogExecution("DEBUG", "Start");

    var rec_id = nlapiGetContext().getSetting('SCRIPT', 'custscript_gem_complete_wo_id');

    if (rec_id == null) {
        nlapiLogExecution('ERROR','Null ID Error', rec_id);
        return;
    }

    nlapiLogExecution("DEBUG", "Sales ID", rec_id);


    var salesOrderId = rec_id; // formerly nlapiGetRecordId()
    var workOrderIds = new Array();
    var workOrderItems = new Array();
    var workOrderItemIds = new Array();
    var workOrderQuantities = new Array();
    var workOrderCompletionIds = new Array();
    var currentWorkOrderID = null;
    var currentWorkOrderItem = null;
    var currentWorkOrderItemID = null;

    //Run a search for all Work Orders associated with this Sales Order
    var searchFilters = new Array();
    searchFilters.push(new nlobjSearchFilter("createdfrom", null, "is", salesOrderId));
    searchFilters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
    searchFilters.push(new nlobjSearchFilter("status", null, "noneof", "WorkOrd:H")); // don't try to close Closed WOs


    var searchColumns = new Array();
    searchColumns.push(new nlobjSearchColumn("item"));
    searchColumns.push(new nlobjSearchColumn("quantity"));
    searchColumns.push(new nlobjSearchColumn("built"));
    searchColumns.push(new nlobjSearchColumn("statusref"));

    var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);
    if(!!searchresults) {
        nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
        for(var i = 0; i < searchresults.length; i++) {
            //Complete the Work Order
            var workOrderId = searchresults[i].getId();
            var quantity = searchresults[i].getValue("quantity");
            var builtQty = searchresults[i].getValue("built");
            var status = searchresults[i].getValue("statusref");
            //nlapiLogExecution("DEBUG", "status", status);
            var workOrderQuantity = quantity - builtQty;
            if(workOrderQuantity > 0) {
                workOrderIds.push(workOrderId);
                workOrderQuantities.push(workOrderQuantity);
                workOrderItems.push(searchresults[i].getText("item"));
                workOrderItemIds.push(searchresults[i].getValue("item"));
            }
        }

        try {
            for(var i = 0, j = workOrderIds.length; i < j; i++ ) {
                currentWorkOrderID = workOrderIds[i];
                currentWorkOrderItem = workOrderItems[i];
                currentWorkOrderItemID = workOrderItemIds[i];
                var workOrderCompletion = nlapiTransformRecord("workorder", workOrderIds[i], "workordercompletion",{'isbackflush' : 'T'});

                workOrderCompletion.setFieldValue("quantity", workOrderQuantities[i]);
                var workOrderCompletionID = nlapiSubmitRecord(workOrderCompletion);
                nlapiLogExecution("DEBUG", "workOrderCompletionID", workOrderCompletionID);
                workOrderCompletionIds.push(workOrderCompletionID);
            }
        }
        catch(err) { //Error When creating Work Order Completions, delete any that were generated.
            /*for(var i = 0, j = workOrderCompletionIds.length; i < j; i++ ) {
             nlapiDeleteRecord("workordercompletion", workOrderCompletionIds[i]);
             }*/
            nlapiLogExecution("DEBUG", "ERROR", err.toString() + " Work Order:" + currentWorkOrderID);
            throw new Error("<strong>Could not complete Completing all the Work Orders.<br>"
                + "Please go back and click the Complete WO button again to finish Completing the remaining Work Orders.</strong>")
            + "<br><br>Assembly Item: <a href=\"https://system.na1.netsuite.com/app/common/item/item.nl?id="
            + currentWorkOrderItemID + "\" target=\"blank\">" + currentWorkOrderItem + "</a>"
            + "<br>NetSuite Error Message: " + err.toString();

        }
    }
    return "T";
}

function closeWorkOrders() {
    nlapiLogExecution("DEBUG", "Start");

    var rec_id = nlapiGetContext().getSetting('SCRIPT', 'custscript_gem_close_wo_id');

    if (rec_id == null) {
        nlapiLogExecution('ERROR','Null ID Error', rec_id);
        return;
    }

    nlapiLogExecution("DEBUG", "Sales ID", rec_id);


    var salesOrderId = rec_id; // Formerly nlapiGetRecordId()
    var isError = false;
    var errorWorkOrders = "";
    var workOrderIds = new Array();
    var workOrderItems = new Array();
    var workOrderItemIds = new Array();
    var workOrderCloseIds = new Array();
    var currentWorkOrderID = null;
    var currentWorkOrderItem = null;
    var currentWorkOrderItemID = null;

    //Run a search for all Work Orders associated with this Sales Order
    var searchFilters = new Array();
    searchFilters.push(new nlobjSearchFilter("createdfrom", null, "is", salesOrderId));
    searchFilters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
    searchFilters.push(new nlobjSearchFilter("status", null, "noneof", "WorkOrd:H")); // don't try to close Closed WOs


    var searchColumns = new Array();
    searchColumns.push(new nlobjSearchColumn("quantity"));
    searchColumns.push(new nlobjSearchColumn("built"));
    searchColumns.push(new nlobjSearchColumn("tranid"));
    searchColumns.push(new nlobjSearchColumn("status"));

    var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);
    if(!!searchresults) {
        nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
        for(var i = 0; i < searchresults.length; i++) {
            //Close the Work Order
            var workOrderId = searchresults[i].getId();
            var quantity = searchresults[i].getValue("quantity");
            var builtQty = searchresults[i].getValue("built");
            var tranID = searchresults[i].getValue("tranid");
            var status = searchresults[i].getValue("status");
            //nlapiLogExecution("DEBUG", "status", status);
            if(quantity == builtQty && status.toLowerCase() != "closed") {
                workOrderIds.push(workOrderId);
                workOrderItems.push(searchresults[i].getText("item"));
                workOrderItemIds.push(searchresults[i].getValue("item"));
            }
        }
        try {
            for(var i = 0, j = workOrderIds.length; i < j; i++ ) {
                currentWorkOrderID = workOrderIds[i];
                currentWorkOrderItem = workOrderItems[i];
                currentWorkOrderItemID = workOrderItemIds[i];
                var workOrderClose = nlapiTransformRecord("workorder", workOrderIds[i], "workorderclose");
                var workOrderCloseID = nlapiSubmitRecord(workOrderClose);
                workOrderCloseIds.push(workOrderCloseID);
            }
        }
        catch(err) { //Error When creating Work Order Completions, delete any that were generated.
            /*for(var i = 0, j = workOrderCloseIds.length; i < j; i++ ) {
             nlapiDeleteRecord("workorderclose", workOrderCloseIds[i]);
             }*/
            nlapiLogExecution("DEBUG", "ERROR", err.toString());
            throw new Error("<br>Could not complete Closing all the Work Orders.<br>" +
                "Please go back and click the Assemble/Close WO button again to finish closing the remaining Work Orders.")
            + "<br><br>Assembly Item: <a href=\"https://system.na1.netsuite.com/app/common/item/item.nl?id="
            + currentWorkOrderItemID + "\" target=\"blank\">" + currentWorkOrderItem + "</a>"
            + "<br>NetSuite Error Message: " + err.toString();
        }
    }
    return "T";
}