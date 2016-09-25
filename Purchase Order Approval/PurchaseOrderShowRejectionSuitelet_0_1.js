/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2014     greg.smith
 *
 */



/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function showRejectionSuitelet(request, response){
	if ( request.getMethod() == 'GET' )
	{
		nlapiLogExecution('DEBUG','START: Method',request.getMethod());
		var purchaseOrderId = request.getParameter('custscript_ard_po_id');
		nlapiLoadRecord('purchaseorder', purchaseOrderId);
		nlapiLogExecution('DEBUG','purchaseOrderId',purchaseOrderId);
		
		var form = nlapiCreateForm('Provide Rejection Reasons');
		
		var rejectionReasonsField = form.addField('custpage_rejectionreasons', 'longtext', 'Rejection Reasons');
		var purchaseOrderField = form.addField('custpage_purchaseorderid', 'text', 'Purchase Order Id');
		rejectionReasonsField.setMandatory(true);
		purchaseOrderField.setDisplayType('hidden');
		purchaseOrderField.setDefaultValue(purchaseOrderId);
		
		form.addSubmitButton("Reject Purchase Order");
		
		var environment = nlapiGetContext().getEnvironment();
		var netsuiteHost = 'system.na1.netsuite.com';
		if(environment === 'SANDBOX') {
			netsuiteHost = 'system.sandbox.netsuite.com';
		}
		var purchaseOrderUrl = "https://" + netsuiteHost + "/app/accounting/transactions/purchord.nl?id=" + purchaseOrderId;
		var cancelScript = "window.location.assign('" + purchaseOrderUrl + "');";
		
		form.addButton('custpage_cancelbutton', 'Cancel Rejection', cancelScript);
		response.writePage(form);
	}	
	
	else //POST
	{
		
		var rejectionReasons = request.getParameter('custpage_rejectionreasons');
		var purchaseOrderId = request.getParameter('custpage_purchaseorderid');
		nlapiSubmitField('purchaseorder', purchaseOrderId, 'custbody_ard_poapprv_rejectingemployee', nlapiGetContext().getUser(), false);
		nlapiSubmitField('purchaseorder', purchaseOrderId, 'custbody_ard_poapprv_rejectionreasons', rejectionReasons, false);		
		nlapiSetRedirectURL('RECORD', 'purchaseorder', purchaseOrderId);
	}
}

function redirectToRejectionSuitelet() {
	var poInternalId = nlapiGetRecordId();	
	var paramObj = {
						'custscript_ard_po_id': poInternalId
				   };
	nlapiSetRedirectURL('SUITELET', 'customscript_ard_po_show_rej_window', 'customdeploy_ard_po_show_rej_window', false, paramObj);
	
}
