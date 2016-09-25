/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Aug 2016     cw
 *
 */

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
function getItemFulfillmentId(create) {

    nlapiLogExecution('DEBUG', 'Test', nlapiGetRecordId());

	if (nlapiLookupField('itemfulfillment',nlapiGetRecordId(), 'subsidiary') != 6) return;

    try {

        var rec_id = nlapiLookupField('itemfulfillment',nlapiGetRecordId(), 'createdfrom');
        
        nlapiLogExecution('DEBUG', 'ItF ID', rec_id);

        var params = new Array();
        params["custscript_ecd_cc_wo_id"] = rec_id;
        params["custscript_ecd_cc_wo_type"] = 'salesorder';

        //nlapiLogExecution('DEBUG', 'Params', params);

        nlapiScheduleScript('customscript_ecd_ss_closecomplete', 'customdeploy_ecd_ss_closecomplete_deploy', params);
    } catch (e) {
        nlapiLogExecution('ERROR','UE WO Error', e);
    }
}

function getWOId(create){
	
	if (nlapiLookupField('workorder',nlapiGetRecordId(), 'subsidiary') != 6) return;

    try {
        var rec_id = nlapiLookupField('workorder',nlapiGetRecordId(), 'createdfrom');
        
        nlapiLogExecution('DEBUG', 'WO ID', rec_id);

        var params = new Array();
        params["custscript_ecd_is_so_id"] = rec_id;
        params["custscript_ecd_is_so_type"] = 'salesorder';

        nlapiScheduleScript('customscript_ecd_ss_wo_issue', 'customdeploy_ecd_ss_wo_issue', params);
        
    } catch (e) {
        nlapiLogExecution('ERROR','UE WO SO Error', e);
    }
}
