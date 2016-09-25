/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Dec 2014     greg.smith
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function updateTaxRate() {
	//nlapiLogExecution("DEBUG", "START");
	var itemTaxArray = new Array();
	var itemArray = new Array();
	var itemNewTaxArray = new Array();
	var salesOrderId = nlapiGetFieldValue("createdfrom");
	var salesOrder = nlapiLoadRecord("salesorder", salesOrderId);
	var numSOItems = salesOrder.getLineItemCount("item");
	//nlapiLogExecution("DEBUG", "numSOItems",numSOItems);
	for(var i = 1; i <= numSOItems; i++)
	{		
		var taxRate = salesOrder.getLineItemValue('item', 'taxrate1', i);	
		var itemid = salesOrder.getLineItemValue('item', 'item', i);
		//nlapiLogExecution("DEBUG", "taxRateSO",taxRate);	
		//nlapiLogExecution("DEBUG", "itemidSO",itemid);
		
		itemTaxArray[i] = taxRate;
		itemArray[i] = itemid;
		itemNewTaxArray[itemid] = taxRate;
	}
	var numItems = nlapiGetLineItemCount("item");
	//nlapiLogExecution("DEBUG", "numItems",numItems);
	
	for(var i = 1; i <= numItems; i++)
	{
		var taxCode = nlapiGetLineItemValue('item', 'taxcode', i);
		//nlapiLogExecution("DEBUG", "taxCode",taxCode);
		if(!(!!taxCode) || taxCode == "-7") {
			continue;
		}
		var taxRate = nlapiGetLineItemValue('item', 'taxrate1', i);
		if(!(!!taxRate)) {
			continue;
		}
		var itemid = nlapiGetLineItemValue('item', 'item', i);		
		var newTaxRate = itemTaxArray[i];
		var newTaxItem = itemArray[i];
		nlapiLogExecution("DEBUG", "itemid",itemid);
		nlapiLogExecution("DEBUG", "newTaxItem",newTaxItem);
		nlapiLogExecution("DEBUG", "itemNewTaxArray[itemid]",itemNewTaxArray[itemid]);
				
		if(itemid != newTaxItem) {
			newTaxRate = itemNewTaxArray[itemid];
		}
		
		nlapiLogExecution("DEBUG", "newTaxRate",newTaxRate);
		if(newTaxRate == "") {
			newTaxRate = 0.00;
		}
		
		nlapiSetLineItemValue('item', 'taxrate1', i, newTaxRate);		
		
	}
}