/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/error', 'N/file', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/transaction'],
    /**
     * @param {email} email
     * @param {error} error
     * @param {file} file
     * @param {https} https
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     * @param {transaction} transaction
     */
    function (email, error, file, https, record, runtime, search, transaction) {
	 var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

     function sendToSlack(method, text, error) {
         var slack_hook = 'https://hooks.slack.com/services/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';
         var slack_obj = {};
         var env = '';
         if (runtime.envType === 'SANDBOX') {
             env = 'SANDBOX';
         } else {
             env = 'LIVE';
         }
         slack_obj['text'] = '```' + method + ': ' + text + ' ' + env + ' ' + runtime.getCurrentUser().name + '```';
         if (error) {
             slack_obj['text'] += ' <!here>';
         }
         https.post({
             url: slack_hook,
             body: JSON.stringify(slack_obj)
         });
     }

     function doValidation(args, argNames, methodName) {
         for (var i = 0; i < args.length; i++)
             if (!args[i] && args[i] !== 0)
                 throw error.create({
                     name: 'MISSING_REQ_ARG',
                     message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
                 });
     }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(context) {
    	try {
    	log.debug(context);
    	var ap_id = context.id;
    	var subsidiary = context.subsidiary;
    	var apOrder = [];

    	var searchResults = search.global({
    	    keywords: 'sales: '+ap_id
    	});
        return searchResults;

    	/*var searchResults = search.create({
                    "type": "salesorder",
                    "columns": [search.createColumn({
                        "name": "internalid"
                    }),
                        search.createColumn({
                            "name": "otherrefnum"
                        })],
                    "filters": [search.createFilter({
                        "name": "otherrefnum",
                        "operator": search.Operator.EQUALTO,
                        "values": [ap_id]
                    }),
                    search.createFilter({
                        "name": "subsidiary",
                        "operator": search.Operator.ANYOF,
                        "values": [subsidiary]
                    }),
                    search.createFilter({
                        "name": "mainline",
                        "operator": search.Operator.IS,
                        "values": true
                    })]
                });*/

    	 /*searchResults.run().each(function (result) {
             log.debug('Results', result);
             if (result === null) {
                 emptyObj = {};

             } else {
                 item = {
                     'internalid': result.getValue({
                         'name': 'internalid'
                     }),
                     'otherrefnum': result.getValue({
                         'name': 'otherrefnum'
                     })
                 };
                 apOrder.push(item);
                 log.debug('item', item);
             }
             return true;
         });


         log.debug('apOrder', apOrder);
         return apOrder;*/
    	} catch (e) {
    		log.error('Error',e);
    		return e
    	}

    }

    return {
        post: doPost,
    };

});
