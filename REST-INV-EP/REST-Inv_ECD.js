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
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {

    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

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
    	var item_id = context.internalid;
    	var onHand = [];

    	var searchResults = search.create({
                    "type": "item",
                    "columns": [search.createColumn({
                        "name": "internalid"
                    }),
                        search.createColumn({
                            "name": "quantityonhand"
                        })],
                    "filters": [search.createFilter({
                        "name": "internalidnumber",
                        "operator": search.Operator.EQUALTO,
                        "values": [item_id]
                    })]
                });
    	 searchResults.run().each(function (result) {
             log.debug('Results', result);
             if (result === null) {
                 emailObj = {};

             } else {
                 item = {
                     'internalid': result.getValue({
                         'name': 'internalid'
                     }),
                     'quantityonhand': result.getValue({
                         'name': 'quantityonhand'
                     })
                 };
                 onHand.push(item);
                 log.debug('item', item);
             }
             return true;
         });
         log.debug('onHand', onHand);
         return onHand;
    	} catch (e) {
    		log.error('Error',e);
    		return e
    	}

    }

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        'get': doGet,
        put: doPut,
        post: doPost,
        'delete': doDelete
    };

});
