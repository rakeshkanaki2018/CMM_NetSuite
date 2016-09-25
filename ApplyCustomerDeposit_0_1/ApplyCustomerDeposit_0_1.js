/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2014     greg.smith
 *
 */

/**
 * applyCustomerDeposit()
 * 
 * @returns {Void} Any or no return value
 */
function applyCustomerDeposit() {
	nlapiLogExecution("DEBUG", "START");
	var searchId = "customsearch_ad_need_to_create_depapp";
	var numResults = 1000;
	var invoiceSearch = nlapiLoadSearch("invoice", searchId);
	var resultSet = invoiceSearch.runSearch();
	var searchresults = resultSet.getResults(0, numResults);	
	if(searchresults != null) {
		while(searchresults.length > 0) {
			nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
			for (var i = 0; i < searchresults.length; i++) {
				var invoiceRecordID = searchresults[i].getId();
				var invoiceRecord = nlapiLoadRecord("invoice", invoiceRecordID);
				invoiceRecord.setFieldValue("custbody4", "T");
				nlapiSubmitRecord(invoiceRecord, true);
				//var customerDepositID = searchresults[i].getValue("custbody_ard_so_customer_deposit", "createdfrom");
				//var invoiceDate = searchresults[i].getValue("trandate");
				//createDepositApplication(invoiceRecordID, customerDepositID, invoiceDate);
			}
			searchresults = resultSet.getResults(numResults, numResults + 1000);
			numResults = numResults + 1000;
		}
	}
}

/**
 * createDepositApplication(invoiceRecordID, customerDepositID, invoiceDate)
 * 
 * @param invoiceRecordID
 * @param customerDepositID
 */
function createDepositApplication(invoiceRecordID, customerDepositID, invoiceDate) {	
	var depApplication  = nlapiTransformRecord("invoice", invoiceRecordID, "customerpayment");
        depApplication.setFieldValue("trandate", invoiceDate);
	var lineNum = depApplication.findLineItemValue('deposit', 'doc', customerDepositID);
	//lineNum  = 1;

	if(lineNum == -1) {
		nlapiLogExecution("DEBUG", "Customer Deposit Not Found For this Invoice", "Customer Deposit:" + customerDepositID +
				"</br>Invoice ID:" + invoiceRecordID);
		return;
	}
	var amount = depApplication.getLineItemValue('deposit', 'remaining', lineNum);
		
	depApplication.setLineItemValue('deposit', 'apply', lineNum, 'T');
	depApplication.setLineItemValue('deposit', 'amount', lineNum, amount);
	depApplication.setFieldValue('payment', amount);

	for(var i = depApplication.getLineItemCount('apply'); i> 0; i--){
		depApplication.setLineItemValue('apply', 'amount', i, amount);
	}
	nlapiSubmitRecord(depApplication, true, true);	
}
