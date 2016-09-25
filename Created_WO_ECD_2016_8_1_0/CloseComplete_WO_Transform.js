/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       31 Aug 2016     cw@casamarco.com
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function issueWOs(ondemand) {
    checkGovernance();
    var rec_type = nlapiGetContext().getSetting('SCRIPT', 'custscript_ecd_is_so_type');
    var rec_id = nlapiGetContext().getSetting('SCRIPT', 'custscript_ecd_is_so_id');
    
    if (rec_id == null) {
    	nlapiLogExecution('ERROR','Null ID Error', [rec_type,rec_id]);
    	return;
    }

    nlapiLogExecution('DEBUG', 'Received Params', [rec_type, rec_id]);
    try {
        issueWorkOrders(rec_id);
    } catch (e) {
        nlapiLogExecution('ERROR', 'WO Issue Error', e);
        return;
    }

    function issueWorkOrders(so_id) {

    	// ensure WIP
        nlapiLogExecution("DEBUG", "Start Issues");
        var salesOrderId = so_id;
        var workOrderIds = new Array();
        var workOrderItems = new Array();
        var workOrderItemIds = new Array();
        var workOrderQuantities = new Array();
        var workOrderIssueIds = new Array();
        var currentWorkOrderID = null;
        var currentWorkOrderItem = null;
        var currentWorkOrderItemID = null;

        //Run a search for all Work Orders associated with this Sales Order
        var searchFilters = new Array();
        searchFilters.push(new nlobjSearchFilter("createdfrom", null, "is", salesOrderId));
        searchFilters.push(new nlobjSearchFilter("mainline", null, "is", "T"));

        var searchColumns = new Array();
        searchColumns.push(new nlobjSearchColumn("item"));
        searchColumns.push(new nlobjSearchColumn("quantity"));
        searchColumns.push(new nlobjSearchColumn("built"));
        searchColumns.push(new nlobjSearchColumn("statusref"));

        checkGovernance();

        var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);
        if (!!searchresults) {
            //nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
            for (var i = 0; i < searchresults.length; i++) {
                //Complete the Work Order
                var workOrderId = searchresults[i].getId();
                var quantity = searchresults[i].getValue("quantity");
                var builtQty = searchresults[i].getValue("built");
                var status = searchresults[i].getValue("statusref");
                //nlapiLogExecution("DEBUG", "status", status);
                var workOrderQuantity = quantity - builtQty;
                if (workOrderQuantity > 0) {
                    workOrderIds.push(workOrderId);
                    workOrderQuantities.push(workOrderQuantity);
                    workOrderItems.push(searchresults[i].getText("item"));
                    workOrderItemIds.push(searchresults[i].getValue("item"));
                }
            }

            try {
                for (var i = 0, j = workOrderIds.length; i < j; i++) {
                    currentWorkOrderID = workOrderIds[i];
                    currentWorkOrderItem = workOrderItems[i];
                    currentWorkOrderItemID = workOrderItemIds[i];

                    checkGovernance();
                	nlapiSubmitField("workorder",workOrderIds[i],"iswip","T");
                    
                    var workOrderIssue = nlapiTransformRecord("workorder", workOrderIds[i], "workorderissue");

                    //workOrderIssue.setFieldValue("quantity", workOrderQuantities[i]);
                    var workOrderIssueID = nlapiSubmitRecord(workOrderIssue);
                    //nlapiLogExecution("DEBUG", "workOrderIssueID", workOrderIssueID);
                    workOrderIssueIds.push(workOrderIssueID);
                }
                nlapiLogExecution('DEBUG', 'Issued', workOrderIssueIds);
            }
            catch (err) { //Error When creating Work Order Completions, delete any that were generated.
                /*for(var i = 0, j = workOrderCompletionIds.length; i < j; i++ ) {
                 nlapiDeleteRecord("workordercompletion", workOrderCompletionIds[i]);
                 }*/
                nlapiLogExecution("DEBUG", "ERROR", err.toString() + " Work Order:" + currentWorkOrderID);
                return;
                throw new Error("<strong>Could not complete Completing all the Work Orders.<br>"
                    + "Please go back and click the Complete WO button again to finish Completing the remaining Work Orders.</strong>")
                + "<br><br>Assembly Item: <a href=\"https://system.na1.netsuite.com/app/common/item/item.nl?id="
                + currentWorkOrderItemID + "\" target=\"blank\">" + currentWorkOrderItem + "</a>"
                + "<br>NetSuite Error Message: " + err.toString();

            }
        }
        return true;
    }
}

function transformWOs(ondemand) {
    checkGovernance();
    var rec_type = nlapiGetContext().getSetting('SCRIPT', 'custscript_ecd_cc_wo_type');
    var rec_id = nlapiGetContext().getSetting('SCRIPT', 'custscript_ecd_cc_wo_id');

    nlapiLogExecution('DEBUG', 'Received Params', [rec_type, rec_id]);

    try {
        completeWorkOrders(rec_id);
    } catch (e) {
        nlapiLogExecution('ERROR', 'WO Completion Error', e);
        return true;
    }
    try {
        closeWorkOrders(rec_id);
    } catch (e) {
        nlapiLogExecution('ERROR', 'WO Close Error', e);
        return true;
    }

    function completeWorkOrders(so_id) {

        nlapiLogExecution("DEBUG", "Start Completions", so_id);
        var salesOrderId = so_id;
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

        var searchColumns = new Array();
        searchColumns.push(new nlobjSearchColumn("item"));
        searchColumns.push(new nlobjSearchColumn("quantity"));
        searchColumns.push(new nlobjSearchColumn("built"));
        searchColumns.push(new nlobjSearchColumn("statusref"));

        checkGovernance();

        var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);

        if (!!searchresults) {
            //nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
            for (var i = 0; i < searchresults.length; i++) {
                //Complete the Work Order
                var workOrderId = searchresults[i].getId();
                nlapiLogExecution('DEBUG','Complete WO ID', workOrderId);

                var quantity = searchresults[i].getValue("quantity");
                var builtQty = searchresults[i].getValue("built");
                var status = searchresults[i].getValue("statusref");
                //nlapiLogExecution("DEBUG", "status", status);
                var workOrderQuantity = quantity - builtQty;
                if (workOrderQuantity > 0) {
                    workOrderIds.push(workOrderId);
                    workOrderQuantities.push(workOrderQuantity);
                    workOrderItems.push(searchresults[i].getText("item"));
                    workOrderItemIds.push(searchresults[i].getValue("item"));
                }
            }

            try {
                for (var i = 0, j = workOrderIds.length; i < j; i++) {
                    currentWorkOrderID = workOrderIds[i];
                    currentWorkOrderItem = workOrderItems[i];
                    currentWorkOrderItemID = workOrderItemIds[i];

                    checkGovernance();

                    var workOrderCompletion = nlapiTransformRecord("workorder", workOrderIds[i], "workordercompletion"); //{'isbackflush': 'T'} removed because we issue components

                    workOrderCompletion.setFieldValue("quantity", workOrderQuantities[i]);
                    var workOrderCompletionID = nlapiSubmitRecord(workOrderCompletion);
                    //nlapiLogExecution("DEBUG", "workOrderCompletionID", workOrderCompletionID);
                    workOrderCompletionIds.push(workOrderCompletionID);
                }
                nlapiLogExecution('DEBUG', 'Completed', workOrderCompletionIds);

            }
            catch (err) { //Error When creating Work Order Completions, delete any that were generated.
                /*for(var i = 0, j = workOrderCompletionIds.length; i < j; i++ ) {
                 nlapiDeleteRecord("workordercompletion", workOrderCompletionIds[i]);
                 }*/
                nlapiLogExecution("DEBUG", "ERROR", err.toString() + " Work Order:" + currentWorkOrderID);
                return;
                throw new Error("<strong>Could not complete Completing all the Work Orders.<br>"
                    + "Please go back and click the Complete WO button again to finish Completing the remaining Work Orders.</strong>")
                + "<br><br>Assembly Item: <a href=\"https://system.na1.netsuite.com/app/common/item/item.nl?id="
                + currentWorkOrderItemID + "\" target=\"blank\">" + currentWorkOrderItem + "</a>"
                + "<br>NetSuite Error Message: " + err.toString();

            }
        }
        return true;
    }

    function closeWorkOrders(so_id) {

        nlapiLogExecution("DEBUG", "Start Close", so_id);
        var salesOrderId = so_id;
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

        var searchColumns = new Array();
        searchColumns.push(new nlobjSearchColumn("quantity"));
        searchColumns.push(new nlobjSearchColumn("built"));
        searchColumns.push(new nlobjSearchColumn("tranid"));
        searchColumns.push(new nlobjSearchColumn("status"));

        checkGovernance();

        var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);

        if (!!searchresults) {
            //nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
            for (var i = 0; i < searchresults.length; i++) {
                //Close the Work Order
                var workOrderId = searchresults[i].getId();
                var quantity = searchresults[i].getValue("quantity");
                var builtQty = searchresults[i].getValue("built");
                var tranID = searchresults[i].getValue("tranid");
                nlapiLogExecution('DEBUG','Closed WO ID', workOrderId);
                var status = searchresults[i].getValue("status");
                //nlapiLogExecution("DEBUG", "status", status);
                if (quantity == builtQty && status.toLowerCase() != "closed") {
                    workOrderIds.push(workOrderId);
                    workOrderItems.push(searchresults[i].getText("item"));
                    workOrderItemIds.push(searchresults[i].getValue("item"));
                }
            }
            try {
                for (var i = 0, j = workOrderIds.length; i < j; i++) {
                    currentWorkOrderID = workOrderIds[i];
                    currentWorkOrderItem = workOrderItems[i];
                    currentWorkOrderItemID = workOrderItemIds[i];


                    checkGovernance();


                    var workOrderClose = nlapiTransformRecord("workorder", workOrderIds[i], "workorderclose");
                    var workOrderCloseID = nlapiSubmitRecord(workOrderClose);
                    workOrderCloseIds.push(workOrderCloseID);
                }
                nlapiLogExecution('DEBUG','Closed',workOrderCloseIds);
            }
            catch (err) { //Error When creating Work Order Completions, delete any that were generated.
                /*for(var i = 0, j = workOrderCloseIds.length; i < j; i++ ) {
                 nlapiDeleteRecord("workorderclose", workOrderCloseIds[i]);
                 }*/
                nlapiLogExecution("DEBUG", "ERROR", err.toString());
                return;
                throw new Error("<br>Could not complete Closing all the Work Orders.<br>" +
                    "Please go back and click the Assemble/Close WO button again to finish closing the remaining Work Orders.")
                + "<br><br>Assembly Item: <a href=\"https://system.na1.netsuite.com/app/common/item/item.nl?id="
                + currentWorkOrderItemID + "\" target=\"blank\">" + currentWorkOrderItem + "</a>"
                + "<br>NetSuite Error Message: " + err.toString();
            }
        }
        return true;
    }

}


function checkGovernance() {

    var context = nlapiGetContext();
    var remainingUsage = parseInt(context.getRemainingUsage());
    context.setPercentComplete(((10000 - remainingUsage) / 10000 * 100).toFixed(2));
    if (remainingUsage <= 500) {
        nlapiYieldScript();
    }
}