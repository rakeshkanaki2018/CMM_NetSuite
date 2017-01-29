/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Dec 2016     cmw
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

var GLOBALS = {};
GLOBALS.numResults = 0;
GLOBALS.govThresh = 200;


function scheduledWO(type) {
    try {
        var searchId = "customsearch_ecd_missing_wo_search";
        var numResults = 1000;
        var woSearch = nlapiLoadSearch("transaction", searchId);
        var resultSet = woSearch.runSearch();
        var searchresults = resultSet.getResults(0, numResults);
        if (searchresults != null) {
            while (searchresults.length > 0) {
                for (var i = 0; i < searchresults.length; i++) {
                    var item = searchresults[i].getValue('item', null, 'GROUP');
                    var quantity = searchresults[i].getValue('quantity', null, 'SUM');
                    var date = searchresults[i].getValue('trandate', null, 'GROUP');
                    var location = searchresults[i].getValue('location', null, 'GROUP');

                    nlapiLogExecution('AUDIT','createWO',[date,location,item,quantity]);


                    createWO(date, location, item, quantity);

                }
                searchresults = resultSet.getResults(numResults, numResults + 1000);
                numResults = numResults + 1000;
            }
        }

    } catch (e) {
        nlapiLogExecution('DEBUG', 'Search Error', e);
    }

}

function createWO(date, location, item, quantity) {

    try {
        checkGovernance();
        var WO = nlapiCreateRecord('workorder');

        WO.setFieldValue('assemblyitem', item);
        WO.setFieldValue('entity', 945);
        WO.setFieldValue('subsidiary', 6);
        WO.setFieldValue('location', location);
        WO.setFieldValue('trandate', date);
        WO.setFieldValue('quantity', quantity);
        WO.setFieldValue('iswip', 'T');
        WO.setFieldValue('custbody_ns_crud_mr', 'T');


        var ID = nlapiSubmitRecord(WO);

        nlapiLogExecution('DEBUG', 'ID', ID);

        checkGovernance();
        var workOrderIssue = nlapiTransformRecord("workorder", ID, "workorderissue");
        workOrderIssue.setFieldValue('trandate', date);
        var workOrderIssueID = nlapiSubmitRecord(workOrderIssue);

        checkGovernance();
        var workOrderCompletion = nlapiTransformRecord("workorder", ID, "workordercompletion");
        workOrderCompletion.setFieldValue("quantity", quantity);
        workOrderCompletion.setFieldValue('trandate', date);

        var workOrderCompletionID = nlapiSubmitRecord(workOrderCompletion);

        checkGovernance();
        var workOrderClose = nlapiTransformRecord("workorder", ID, "workorderclose");
        workOrderClose.setFieldValue('trandate', date);
        var workOrderCloseID = nlapiSubmitRecord(workOrderClose);
    } catch (e) {
        nlapiLogExecution('DEBUG', 'WO Error', e)
    }
}


function checkGovernance() {
//	var context = nlapiGetContext();
    var remainingUsage = nlapiGetContext().getRemainingUsage();
    //nlapiLogExecution("DEBUG", "remainingUsage", remainingUsage);
    if ((remainingUsage * 1.0) <= (GLOBALS.govThresh * 1.0)) {
        var state = nlapiYieldScript();
        if (state.status == 'FAILURE') {
            nlapiLogExecution("DEBUG",
                "Failed to yield script, exiting: Reason = " + state.reason
                + " / Size = " + state.size);
            throw "Failed to yield script";
        } else if (state.status == 'RESUME') {
            nlapiLogExecution("DEBUG", "Resuming script because of "
                + state.reason + ".  Size = " + state.size);
        }
        // state.status will never be SUCCESS because a success would imply a
        // yield has occurred. The equivalent response would be yield
    }
}