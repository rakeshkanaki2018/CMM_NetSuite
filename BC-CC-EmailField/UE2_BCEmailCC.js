/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/log', 'N/email'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, log, email) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {
    	try {

    	var id = context.newRecord.id;
    	log.debug('ID', [id, typeof(id)]);
    	return;
    	if (id != 147489) return;
    	log.debug('Search attempt', id);

    	var emails = [];
    	var contactSearch = search.create({
            type: search.Type.CONTACT,
            columns: ['entity', 'subsidiary', 'name', 'email'],
            filters: [
                ['company', 'is', id],
                'and', ['subsidiary', 'is', 4]
                ]
                });
    	log.debug('Create Search', id);

    	contactSearch.run().each(function(result) {
    	    var entity = result.getValue({
    	        name: 'entity'
    	    });
    	    var subsidiary = result.getValue({
    	        name: 'subsidiary'
    	    });
    	    var email = result.getValue({
    	        name: 'email'
    	    });
        	log.debug('Push attempt', email);

    	    emails.push(email);
    	    
    	    return true;
    	});
    	log.debug('Emails', emails);
    	
    	return;
    	} catch (e) {
    		log.error('Error', e);
    	}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
