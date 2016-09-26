/**
 * Ardeeka_MarkupFunction_Event.js
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Jun 2014     Ardeeka
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * 
 * @appliedtorecord salesorder   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function MarkupFunction_EventBeforeLoad(type, form, request){
	var itemList = form.getSubList("item");	
}

/**
 * MarkupFunction_EventBeforeSubmit(type)
 * 
 * @appliedtorecord salesorder 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function MarkupFunction_EventBeforeSubmit(type)
{
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	nlapiLogExecution("DEBUG", "execution", executionContext);
	
	var customer = nlapiGetFieldValue("entity");
	var numLineItems = nlapiGetLineItemCount("item");
	var retailPrices = null;
	try {
		retailPrices = getRetailPricesFromCustomRecord(customer);
	}
	catch(err) {
		nlapiLogExecution("DEBUG", "Error", err.message);
	}
	
	for(var i = 1; i <= numLineItems; i++)
	{
		nlapiSelectLineItem("item", i);		
		var amount = nlapiGetCurrentLineItemValue("item", "rate");
		var item = nlapiGetCurrentLineItemValue("item", "item");
		nlapiLogExecution("DEBUG", "Amount", amount);
		var customerPrice = amount;
		try
		{
			var retailPrice = null;
			if(!!retailPrices) {
				retailPrice = retailPrices[item];
			}			
			
			var markupId = nlapiGetFieldValue("custbody_ad_so_custlbl_markup");
			if(!!markupId && !!amount && retailPrice == null)
			{
				retailPrice = GetCustomerPriceFromAmount(markupId, amount);
			}
			if(!!retailPrice) {
				customerPrice = retailPrice;
			}
		}
		catch(err)
		{
			nlapiLogExecution("DEBUG", "Error", err.message);
		}			
		nlapiSetCurrentLineItemValue("item", "custcol_ad_so_customer_price", customerPrice, true);
		nlapiCommitLineItem("item");		
	}
}

/**
 * getRetailPricesFromCustomRecord(customer)
 * 
 * @param customer
 * @returns
 */
function getRetailPricesFromCustomRecord(customer) {
	var retailPrices = new Array();
	
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_ard_custretailprice_cust', null, 'is', customer, null));
	
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_ard_custretailprice_item'));
	columns.push(new nlobjSearchColumn('custrecord_ard_custretailprice_price'));
	
	var searchresults = nlapiSearchRecord('customrecord_ard_cust_retail_price', null, filters, columns);
	if(searchresults == null || searchresults.length == 0) {
		return null;
	}
	nlapiLogExecution("DEBUG", "searchresults.length", searchresults.length);
	for(var i=0; i < searchresults.length; i++) {
		var retailPrice = searchresults[i].getValue('custrecord_ard_custretailprice_price');
		var item = searchresults[i].getValue('custrecord_ard_custretailprice_item');
		retailPrices[item] = retailPrice;
		nlapiLogExecution("DEBUG", "retailPrice", retailPrice);
		nlapiLogExecution("DEBUG", "item", item);
	}
	
	return retailPrices;
	
}
/**
 * GetCustomerPriceFromAmount(markupId, amount)
 * 
 * This function takes the internal id of the Retail Markup Record and the amount and returns the Customer price based
 * on the values on the Retail Markup record.
 * 
 * @param markupId
 * @param amount
 * @returns customerPrice
 */
function GetCustomerPriceFromAmount(markupId, amount)
{
	var customerPrice = amount;
	
	var markupRecord = nlapiLoadRecord("customrecord_ad_retail_label_markup", markupId);	
	var markupPercentage = markupRecord.getFieldValue("custrecord_ad_markup_percentage");
	var markupDirection = markupRecord.getFieldText("custrecord_ad_retlbl_direction");
	var markupAdd = markupRecord.getFieldValue("custrecord_ad_retlbl_add");	
	
	markupPercentage = parseFloat(markupPercentage) / 100.0;	
	if(markupPercentage != null && markupPercentage != "")
    {		
		customerPrice = (amount * markupPercentage) + amount*1;
    }
	
	if(markupDirection != null && markupDirection !== "")
	{
		switch(markupDirection)
		{
			case "Up":
				customerPrice = Math.ceil(customerPrice);
				break;
			case "Nearest":
				customerPrice = Math.round(customerPrice);
				break;
			case "Down":
				customerPrice = Math.floor(customerPrice);
				break;
		}
	}	
	
	if(markupAdd != null && markupAdd != "")
	{
		customerPrice = customerPrice*1 + markupAdd*1;
	}
	
	return customerPrice;
}