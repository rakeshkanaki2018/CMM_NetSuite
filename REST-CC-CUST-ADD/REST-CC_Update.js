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

        function doCustCheck(email) {
        	sendToSlack('EMAIL_CONTEXT', [time, email], false);

            doValidation(email, 'email', 'POST');
            log.debug('POST', 'Customer Check: ' + email);

            try {
                var emailObj = {};
                var emails = [];

                var searchResults = search.create({
                    "type": "customer",
                    "columns": [search.createColumn({
                        "name": "internalid"
                    }),
                        search.createColumn({
                            "name": "entityid"
                        })],
                    "filters": [search.createFilter({
                        "name": "email",
                        "operator": "is",
                        "values": email
                    })]
                });
                searchResults.run().each(function (result) {
                    log.debug('Results', result);
                    if (result === null) {
                        emailObj = {};

                    } else {
                        emailObj = {
                            'internalid': result.getValue({
                                'name': 'internalid'
                            }),
                            'name': result.getValue({
                                'name': 'entityid'
                            })
                        };
                        emails.push(emailObj);
                    }
                    return true;
                });
                log.debug('Emails Return: ', emails);
            	sendToSlack('EMAIL_ARRAY', [time, emails], false);
                return emails;

            } catch (e) {
                log.error(e.name);
                sendToSlack('POST_FAIL', [time, context.type, internalid.internalid, e.name, e.type, e.message], false);

                throw error.create({
                    name: 'FAILURE_POST_RETURN',
                    message: 'Failure to return Obj' + e
                });
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
            sendToSlack('POST_INIT', [time, context.type, JSON.stringify(context)]);

            try {
                var emailCheck = doCustCheck(context.customer.fields.email);
                log.debug('Email', context.customer.fields.email);
                log.debug('DEBUG', emailCheck);

            } catch (e) {
                log.error(e);
                return e;
            }
            try {
                if (emailCheck.length == 0 && context.customer) {
                    custRecord = record.create({
                        type: 'customer',
                        isDynamic: true
                    });
                } else {
                    custRecord = record.load({
                        type: 'customer',
                        id: emailCheck[0].internalid,
                        isDynamic: true
                    });
                }
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

                            if (cc_key != 'ccnumber') {
                                log.debug('CC Key + Value', [cc_key, context.customer.creditcards[line][cc_key]]);
                            }
                        }
                        
                        custRecord.setCurrentSublistValue({
                            sublistId: 'creditcards',
                            fieldId: 'ccdefault',
                            value: true
                        });
                        
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

                //begin record create


                var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                log.debug('Time', time);
                sendToSlack('POST_SUCCESS', [time, context.type, custId]);
                return custId;
            }
            catch (e) {
                log.error('Error', e);

                if (e.name == "DUP_RCRD") {
                    var internalid = {};
                    /*
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
                     searchResults.run().each(function (result) {
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
                     */
                    sendToSlack('POST_FAIL', [time, context.type, internalid.internalid, e.name, e.type, e.message], false);

                    return e;
                } else {
                    var error = {};
                    error.error = e;
                    sendToSlack('POST_FAIL', [time, context.type, context.id, e.name, e.type, e.message], false);
                    return error;
                }
            }
        }

        return {
            'post': doPost,
        };

    });