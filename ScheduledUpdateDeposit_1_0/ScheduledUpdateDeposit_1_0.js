/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Mar 2015     greg.smith
 *
 */

var GLOBALS = {};
GLOBALS.numResults = 0;
GLOBALS.govThresh = 200;

var customerDepositIds = [];
var commonDepositTransactionId = null;
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduleUpdatDeposit(type) {
	nlapiLogExecution("DEBUG", "START");
	
	nlapiLogExecution("DEBUG", "======START======");
	var context = nlapiGetContext();
	var recordType = "customerdeposit";
	var savedSearchid = "413";

	var search = nlapiLoadSearch(recordType, savedSearchid);
	nlapiLogExecution("DEBUG", "======SEARCH LOADED======");	
	var resultSet = search.runSearch();
	nlapiLogExecution("DEBUG", "======SEARCH EXECUTED======");
	nlapiLogExecution("DEBUG", "======CALLING CALLBACK======");
	resultSet.forEachResult(cbForEachResult);
	updateDepositRecord();
	nlapiLogExecution("DEBUG", "======CALLBACK COMPLETE======");
		
	nlapiLogExecution("DEBUG", "NumResults max @ 4000", GLOBALS.numResults);
	nlapiLogExecution("DEBUG", "======END======");
}

function updateDepositRecord() {
	
	var depositRecord = nlapiLoadRecord("deposit", commonDepositTransactionId);
	var numPayments = depositRecord.getLineItemCount("payment");
	nlapiLogExecution("DEBUG", "numPayments", numPayments);
	//nlapiLogExecution("DEBUG", "line value", depositRecord.getLineItemValue("payment", "id", 1));
	nlapiLogExecution("DEBUG", "commonDepositTransactionId", commonDepositTransactionId);
	for(var i in customerDepositIds) {
		nlapiLogExecution("DEBUG", "custDepositId", customerDepositIds[i]);
		var foundValue = depositRecord.findLineItemValue("payment", "id", customerDepositIds[i]);
		nlapiLogExecution("DEBUG", "foundValue", foundValue);
		
		depositRecord.selectLineItem("payment", foundValue);
		depositRecord.setCurrentLineItemValue("payment", "deposit", "F");
		depositRecord.commitLineItem("payment");
	}	
	
	nlapiSubmitRecord(depositRecord, true, true);
}
/**
 * Callback Method.
 * 
 * @param {nlobjSearchResult}
 *            searchResult
 */
function cbForEachResult(searchResult) {
	GLOBALS.numResults++;
	var custDepositId = searchResult.getId();
	var depositTransactionId = searchResult.getValue("deposittransaction");
	if(commonDepositTransactionId == null) {
		commonDepositTransactionId = depositTransactionId;
	}
	//nlapiLogExecution("DEBUG", "commonDepositTransactionId", commonDepositTransactionId);
	if(commonDepositTransactionId != null && commonDepositTransactionId != depositTransactionId) {		
		updateDepositRecord();
		customerDepositIds = [];
		commonDepositTransactionId = depositTransactionId;
	}
	customerDepositIds.push(custDepositId);
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
