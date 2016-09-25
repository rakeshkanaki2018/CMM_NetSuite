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
            slack_obj['text'] = '```'+ method + ': ' + text + ' ' + env + ' ' + runtime.getCurrentUser().name + '```';
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
        function doGet(context) {
            doValidation([context.id, context.type], ['id', 'type'], 'GET');
            log.debug('GET', [time, context.type, context.id]);
            try {
                sendToSlack('GET', [time, context.type, context.id]);
                return record.load({
                    type: context.type,
                    id: context.id
                });
            } catch (e) {
                log.error(e.name);
                sendToSlack('GET_FAIL', [time, context.type, context.id, e.name, e.type, e.message], true);

                throw error.create({
                    name: 'FAILURE_GET_RETURN',
                    message: 'Failure to process: ' + [time, context.id, context.type, e.name, e.type, e.message]
                });
            }
        }

        /**
         * Function called upon sending a PUT request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPut(context) {
            var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

            // Used to send CC again
            doValidation([context.id, context.type], ['id', 'type'], 'PUT');
            log.debug('PUT', [time, context.type, context.id]);
            sendToSlack('PUT', [time, context.type, context.id]);

            try {
                var objRecord = record.load({
                    type: context.type,
                    id: context.id,
                    isDynamic: false,
                    defaultValues: {
                        subsidiary: context.fields.subsidiary
                    }
                });
                //paymentmethod
                for (var fldName in context.paymentevent)
                    if (context.paymentevent.hasOwnProperty(fldName)) {
                        objRecord.setValue(fldName, context.paymentevent[fldName]);
                    }

                var recordId = objRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.debug('REC ID', recordId);

                var cc_fields = search.lookupFields({
                    type: context.type,
                    id: recordId,
                    columns: ['status', 'tranid', 'entity', 'subsidiary', 'internalid', 'externalid', 'authcode', 'pnrefnum', 'paymenteventholdreason', 'paymenteventresult', 'amount']
                });

                var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                log.debug('Time', time);
                sendToSlack('PUT_SUCCESS', [time, context.type, cc_fields.tranid, cc_fields.amount, cc_fields.paymenteventresult, cc_fields.paymenteventholdreason]);

                return cc_fields;
            } catch (e) {
                log.error('Error', e);
                sendToSlack('PUT_FAIL', [time, context.type, context.id, e.name, e.type, e.message], false);
            }
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
            // Used to send initial record
            // If customer, create customer, then send back the id, wait for ID on SO create
            // Customer needs address information
            var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

            log.debug('POST', [time, context.type]);
            sendToSlack('POST', [time, context.type]);

            try {
                if (context.customer) {
                    custRecord = record.create({
                        type: 'customer',
                        isDynamic: true,
                        defaultValue: {
                            subsidiary: context.fields.subsidiary
                        }
                    });
                    for (var fldName in context.customer.fields) {
                        if (context.customer.fields.hasOwnProperty(fldName)) {
                            custRecord.setValue(fldName, context.customer.fields[fldName]);
                        }
                    }
                    //address fields
                    //address line
                    var addrLineNum = 0;
                    if (context.customer) {
                        if (context.customer.addressbook) {
                            for (var address in context.customer.addressbook) {
                                log.debug('Address #', address);
                                for (var key in context.customer.addressbook[address]) {
                                    log.debug('Key', [address, key]);

                                    custRecord.selectLine('addressbook', addrLineNum);
                                    if (key == 'defaultbilling' || 'defaultshipping' || 'isresidential') {
                                        custRecord.setCurrentSublistValue({
                                            sublistId: 'addressbook',
                                            fieldId: key,
                                            value: context.customer.addressbook[address][key]
                                        });
                                        log.debug('K,v', [address, key, context.customer.addressbook[address][key]]);
                                    }
                                    var subRecord = custRecord.getCurrentSublistSubrecord({
                                        sublistId: 'addressbook',
                                        fieldId: 'addressbookaddress'
                                    });
                                    subRecord.setValue(key.slice(0, key.indexOf('_')), context.customer.addressbook[address][key]);
                                    custRecord.commitLine('addressbook');
                                }
                                addrLineNum++;
                            }
                        }
                    }
                    //creditcard fields
                    if (context.customer.creditcards) {
                    for (var line in context.customer.creditcards) {
                        log.debug('Line', line);
                        log.debug('CC value', context.customer.creditcards[line]);
                        custRecord.selectNewLine({
                            sublistId: 'creditcards'
                        });
                        for (var cc_key in context.customer.creditcards[line]) {
                            log.debug('CC Key', cc_key);
                            
                            var cc_value = (cc_key == 'ccexpiredate') ? new Date(context.customer.creditcards[line][cc_key]) : context.customer.creditcards[line][cc_key];
                            log.debug('CC Value', cc_value);

                            custRecord.setCurrentSublistValue({
                                sublistId: 'creditcards',
                                fieldId: cc_key,
                                value: cc_value
                            });
                            
                        	if (cc_key != 'ccnumber'){
                            log.debug('CC Key + Value', [cc_key, context.customer.creditcards[line][cc_key]]);
                            }
                        }
                        custRecord.commitLine({
                            sublistId: 'creditcards'
                        });
                    }
                }

                    custId = custRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });
                    log.debug('Customer ID', custId);
                }
                //begin record create

                //var customer = custId ? custId : context.fields.entity;
                var customer = context.fields.entity ? context.fields.entity : custId;

                var objRecord = record.create({
                    type: context.type,
                    isDynamic: false,
                    defaultValues: {
                        entity: customer,
                        subsidiary: context.fields.subsidiary
                    }
                });

                // SO mainline fields
                for (var fldName in context.fields) {
                    if (context.fields.hasOwnProperty(fldName)) {
                        objRecord.setValue(fldName, context.fields[fldName]);
                    }
                }

                //item lines

                if (context.sublists.items) {
                    for (var line in context.sublists.items) {
                        log.debug('Line', line);
                        log.debug('Item value', context.sublists.items[line]);
                        for (var item_key in context.sublists.items[line]) {
                            log.debug('Item Key', item_key);

                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: item_key,
                                value: context.sublists.items[line][item_key],
                                line: line
                            });
                            log.debug('Item Key + Value', [item_key, context.sublists.items[line][item_key]]);

                        }
                    }
                }

                //paymentmethod
                for (var fldName in context.paymentevent)
                    if (context.paymentevent.hasOwnProperty(fldName)) {
                        objRecord.setValue(fldName, context.paymentevent[fldName]);
                        log.debug('CC k,v', [fldName, context.paymentevent[fldName]]);
                    }

                var recordId = objRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.debug('SO ID', recordId);

                var cc_fields = search.lookupFields({
                    type: 'salesorder',
                    id: recordId,
                    columns: ['status', 'tranid', 'entity', 'subsidiary', 'internalid', 'externalid', 'authcode', 'pnrefnum', 'paymenteventholdreason', 'paymenteventresult', 'amount']
                });

                var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                log.debug('Time', time);
                sendToSlack('POST_SUCCESS', [time, context.type, cc_fields.tranid, cc_fields.amount, cc_fields.paymenteventresult, cc_fields.paymenteventholdreason]);
                return cc_fields;
            }

            catch (e) {
                log.error('Error', e);                
                log.debug('Context Error', context.fields.externalid);
                                                           
                if (e.name == "DUP_RCRD"){
                	var internalid = {};

    				var searchResults = search.create({
    					"type": "salesorder",
    					"columns": [search.createColumn({
    						"name": "internalid"
    					})],
    					"filters": [search.createFilter({
    						"name": "externalid",
    						"operator": "is",
    						"values": context.fields.externalid
    					})]
    				});
    				searchResults.run().each(function(result) {
    					log.debug('Results', result);
    					if (result === null) {
    						internalid = {};
    					} else {
    						internalid = {
    							'internalid': result.id,
    						};
    					}
    					return true;
    				});
    			
                	
                	var dup = {};
                	dup.duplicateid = internalid;
                	dup.error = e;
                	
                    sendToSlack('POST_FAIL', [time, context.type, internalid.internalid, e.name, e.type, e.message], false);

                	return dup;
                } else {
                var error = {}
                error.error = e;
                sendToSlack('POST_FAIL', [time, context.type, context.id, e.name, e.type, e.message], false);
                return error; 
                }
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
            return
        }

        return {
            'get': doGet,
            'put': doPut,
            'post': doPost,
            'delete': doDelete
        };

    });