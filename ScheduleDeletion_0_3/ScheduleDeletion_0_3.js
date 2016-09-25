/**
 * Module Description
 * 
 * Version Date Author Remarks 1.00 19 Feb 2013 greg.smith
 * 
 */
var GLOBALS = {};
GLOBALS.numResults = 0;
GLOBALS.govThresh = 200;
function ScheduleDeletion() {
	nlapiLogExecution("DEBUG", "======START======");
	var context = nlapiGetContext();
	var recordType = context.getSetting('SCRIPT','custscript_pl_delete_rectype');
	var savedSearchid = context.getSetting('SCRIPT','custscript_pl_delete_searchid');

	var search = nlapiLoadSearch(recordType, savedSearchid);
	nlapiLogExecution("DEBUG", "======SEARCH LOADED======");
	var numResults = 1000;
	var resultSet = search.runSearch();
	nlapiLogExecution("DEBUG", "======SEARCH EXECUTED======");
	nlapiLogExecution("DEBUG", "======CALLING CALLBACK======");
	resultSet.forEachResult(cbForEachResult);
	nlapiLogExecution("DEBUG", "======CALLBACK COMPLETE======");

	nlapiLogExecution("DEBUG", "NumResults max @ 4000", GLOBALS.numResults);
	nlapiLogExecution("DEBUG", "======END======");

}

/**
 * Callback Method.
 * 
 * @param {nlobjSearchResult}
 *            searchResult
 */
function cbForEachResult(searchResult) {
	GLOBALS.numResults++;
/*	 try
	 {
	 	nlapiDeleteRecord(searchResult.getRecordType(), searchResult.getId());			
	 }
	 catch(e)
	 {
	 	nlapiLogExecution("DEBUG", "Order could not be Deleted",e);
	 }
*/
	return true;
}
function checkGovernance() {
//	var context = nlapiGetContext();
	var remainingUsage = nlapiGetContext().getRemainingUsage();
	nlapiLogExecution("DEBUG", "remainingUsage", remainingUsage);
	if ((remainingUsage*1.0) <= (GLOBALS.govThresh*1.0)) {
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