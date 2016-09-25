/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Dec 2014     greg.smith
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduleFixTaxRate(type) {
	var searchId = "customsearch338";
	var numResults = 1000;
	var invoiceSearch = nlapiLoadSearch("invoice", searchId);
	var resultSet = invoiceSearch.runSearch();
	var searchresults = resultSet.getResults(0, numResults);
	if(searchresults != null) {
		while(searchresults.length > 0) {
			for (var i = 0; i < searchresults.length; i++) {
				var invoiceRecordID = searchresults[i].getId();
				var invoiceRecord = nlapiLoadRecord("invoice", invoiceRecordID);
				updateTaxRate(invoiceRecord);				
				
			}
                        searchresults = resultSet.getResults(numResults, numResults + 1000);
			numResults = numResults + 1000;
		}
	}

}

function updateTaxRate(invoiceRecord) {
	//nlapiLogExecution("DEBUG", "START");
	var itemTaxArray = new Array();
	
	
	var salesOrderId = invoiceRecord.getFieldValue("createdfrom");
	var salesOrder = nlapiLoadRecord("salesorder", salesOrderId);
	var numSOItems = salesOrder.getLineItemCount("item");
	nlapiLogExecution("DEBUG", "numSOItems",numSOItems);
	for(var i = 1; i <= numSOItems; i++)
	{		
		var taxRate = salesOrder.getLineItemValue('item', 'taxrate1', i);	
		var itemid = salesOrder.getLineItemValue('item', 'item', i);
		var itemValue= salesOrder.getLineItemText('item', 'item', i);
		
		nlapiLogExecution("DEBUG", "itemValueSO",itemValue);
		nlapiLogExecution("DEBUG", "itemidSO",itemid);
		nlapiLogExecution("DEBUG", "taxRateSO",taxRate);	
		
		itemTaxArray[itemid] = taxRate;		
	}
	
	var numItems = invoiceRecord.getLineItemCount("item");
	nlapiLogExecution("DEBUG", "numINVItems",numItems);
	
	for(var i = 1; i <= numItems; i++)
	{		
		var taxCode = invoiceRecord.getLineItemValue('item', 'taxcode', i);
		nlapiLogExecution("DEBUG", "taxCode",taxCode);
		if(!(!!taxCode) || taxCode == "-7") {
			continue;
		}
		
		var taxRate = invoiceRecord.getLineItemValue('item', 'taxrate1', i);
		nlapiLogExecution("DEBUG", "taxRate",taxRate);
		if(!(!!taxRate)) {
			continue;
		}
		
		var itemid = invoiceRecord.getLineItemValue('item', 'item', i);
		var itemValue= invoiceRecord.getLineItemText('item', 'item', i);
		nlapiLogExecution("DEBUG", "itemValue",itemValue);
		nlapiLogExecution("DEBUG", "itemid",itemid);
		var newTaxRate = itemTaxArray[itemid];
		nlapiLogExecution("DEBUG", "newTaxRate",newTaxRate);
		if(newTaxRate == "") {
			newTaxRate = 0.00;
		}		
		invoiceRecord.setLineItemValue('item', 'taxrate1', i, newTaxRate);
		
	}
	
	nlapiSubmitRecord(invoiceRecord, true);
}