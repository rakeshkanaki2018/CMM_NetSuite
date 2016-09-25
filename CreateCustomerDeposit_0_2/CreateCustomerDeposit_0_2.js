/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Jul 2014     greg.smith
 *
 */

/**
 * CreateCustomerDeposit()
 * 
 * @returns {Void} Any or no return value
 */
function CreateCustomerDeposit() {
	nlapiLogExecution("DEBUG", "START");	
	var customerDepositId = null;
	
	try {
		var salesOrderId = nlapiGetRecordId();
		var salesOrderTotal = nlapiGetFieldValue("total");
		if(!!!salesOrderTotal || Number(salesOrderTotal) == 0) {
			nlapiLogExecution("DEBUG", "ZERO ORDER");	
			return "";
		}
		var salesOrderCustomer = nlapiGetFieldValue("entity");
		var salesOrderPaymentMethod = nlapiGetFieldValue("custbody_ad_adm_payment_method");
        var orderDate = nlapiGetFieldValue("trandate");
		var authNetTranID = nlapiGetFieldValue("custbody_ad_authnet_dep_id");
		
		//Check if a customer Deposit already exists for this sales order
		try {
			var filters = new Array();
			filters.push(new nlobjSearchFilter('salesorder', null, 'is', salesOrderId));
			
			var searchResults = nlapiSearchRecord("customerdeposit", null, filters, null);
			if(!!searchResults && searchResults.length > 0) {
				nlapiLogExecution("DEBUG", "searchResults.length", searchResults.length);	
				customerDepositId = searchResults[0].getId();
				nlapiSetFieldValue('custbody_ard_so_customer_deposit', customerDepositId, false);				
				return customerDepositId;
			}
		} catch(err) {
			return "";
		}
		
		nlapiLogExecution("DEBUG", "salesOrderId", salesOrderId);
		nlapiLogExecution("DEBUG", "salesOrderTotal", salesOrderTotal);
		nlapiLogExecution("DEBUG", "salesOrderCustomer", salesOrderCustomer);
		
		var cdRecord = nlapiCreateRecord("customerdeposit");
        cdRecord.setFieldValue("trandate", orderDate);
		cdRecord.setFieldValue("customer", salesOrderCustomer);
		cdRecord.setFieldValue("salesorder", salesOrderId);
		cdRecord.setFieldValue("payment", salesOrderTotal);	
		cdRecord.setFieldValue("undepfunds", "T");
		cdRecord.setFieldValue("paymentmethod", salesOrderPaymentMethod);
		cdRecord.setFieldValue("custbody_ad_authnet_dep_id", authNetTranID);
		
		customerDepositId = nlapiSubmitRecord(cdRecord, true, true);
		
		nlapiSetFieldValue('custbody_ard_so_customer_deposit', customerDepositId, false);
		
		return customerDepositId;
	}
	catch(err) {
		nlapiLogExecution("DEBUG", "ERROR", err.message);
		if(!!customerDepositId) {
			nlapiDeleteRecord("customerdeposit", customerDepositId);
		}
		return "";
	}
	
	return "";	
}