/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Aug 2015     greg.smith
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){	
	var customerId = nlapiGetFieldValue("entity");	
	if(customerId != '945') { //Only Update Tax Rate for the ECD integration Customer
		return;
	}	
	var salesOrderId = nlapiGetFieldValue("createdfrom");
	if(!(!!salesOrderId)) {
		return;
	}
	updateTaxRate();	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	
}

/**
 * updateTaxRate()
 * 
 * Updates the tax rates for each item on the Invoice to match the Tax Rates on the Sales Order.
 * 
 * @param {null}
 * @returns {null}
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
//		nlapiLogExecution("DEBUG", "itemid",itemid);
//		nlapiLogExecution("DEBUG", "newTaxItem",newTaxItem);
//		nlapiLogExecution("DEBUG", "itemNewTaxArray[itemid]",itemNewTaxArray[itemid]);
				
		if(itemid != newTaxItem) {
			newTaxRate = itemNewTaxArray[itemid];
		}
		
//		nlapiLogExecution("DEBUG", "newTaxRate",newTaxRate);
		if(newTaxRate == "") {
			newTaxRate = 0.00;
		}
		
		nlapiSetLineItemValue('item', 'taxrate1', i, newTaxRate);		
		
	}
}
