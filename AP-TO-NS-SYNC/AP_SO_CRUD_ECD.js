/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/http', 'N/https', 'N/record', 'N/render', 'N/runtime', 'N/search', 'N/task', 'N/transaction', 'N/log', 'N/format'],
    /**
     * @param {http} http
     * @param {https} https
     * @param {record} record
     * @param {render} render
     * @param {runtime} runtime
     * @param {search} search
     * @param {task} task
     * @param {transaction} transaction
     */
    function (http, https, record, render, runtime, search, task, transaction, log, format) {

        var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

        var toMmDdYy = function (input) {
            var ptrn = /(\d{4})\-(\d{2})\-(\d{2})/;
            if (!input || !input.match(ptrn)) {
                return null;
            }
            return input.replace(ptrn, '$2/$3/$1');
        };

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

        function createCustomer(custInfo) {

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

        function updateAPOrderID(soID){
            var request = https.post({
                url: 'https://admin.erincondren.com/workflow_api/update_ns_id',
                body: soID
            });

            // need to test and debug ..
        }


        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {

            var response = https.get({
                url: 'https://admin.erincondren.com/workflow_api/pending_ns_order'
            });
            log.debug(response.code);

            var apObject = JSON.parse(response.body);
            log.debug('object', apObject);
            log.debug('length', apObject.length);
            sendToSlack('GETINPUTDATA', 'Orders: ' + apObject.length, false);

            return apObject;

        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {

            //log.debug('Map Stage 1', context);

            var apObject = JSON.parse(context.value);
            //log.debug('Context 1', apObject);
            try {
                var salesOrder = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: false
                });
                salesOrder.setValue('custbody_ap_json', JSON.stringify(apObject));  // ECD ANONYMOUS CUSTOMER

                salesOrder.setValue('externalid', 'E-' + apObject['order_id']);


                salesOrder.setValue('entity', 945);  // ECD ANONYMOUS CUSTOMER
                salesOrder.setValue('trandate', new Date(Date.parse((apObject['order_date']).replace(/-/g, '/'))));
                salesOrder.setValue('otherrefnum', apObject['order_id']);

                salesOrder.setValue('custbody_mapreduce', true);

                salesOrder.setValue('orderstatus', 'B');


                salesOrder.setValue('shipmethod', 23418); // Generic Shipping

                salesOrder.setValue('shippingcost', (apObject['shipping_amount'] - apObject['shipping_discount']));

                salesOrder.setValue('pnrefnum', apObject['transaction_key'][0]); // Request ID

                salesOrder.setValue('discountitem', 62468); // ECD Discount Item
                salesOrder.setValue('discountrate', -1 * (apObject['discount']));

                if (apObject['production_state'] == "1") {
                    salesOrder.setValue('location', 19); // ATX
                } else if (apObject['production_state'] == "2") {
                    salesOrder.setValue('location', 14); // LA
                }

                // (discount total + shipping discount) * -1
                var billaddress = "";
                billaddress += apObject['billing_info'][0]['first_name'] + ' ' + apObject['billing_info'][0]['last_name'] + ' \n';
                billaddress += apObject['billing_info'][0]['address1'] + ' \n';
                billaddress += apObject['billing_info'][0]['address2'] + ' \n';
                billaddress += apObject['billing_info'][0]['city'] + ', ' + apObject['billing_info'][0]['state'] + ' \n';
                billaddress += apObject['billing_info'][0]['zip'] + ' \n';
                billaddress += apObject['billing_info'][0]['country_name'] + ' \n';
                billaddress += apObject['billing_info'][0]['country_code'] + ' \n';
                billaddress += apObject['billing_info'][0]['phone'] + ' \n';


                var shipaddress = "";
                shipaddress += apObject['shipping_info']['first_name'] + ' ' + apObject['shipping_info']['last_name'] + ' \n';
                shipaddress += apObject['shipping_info']['address1'] + ' \n';
                shipaddress += apObject['shipping_info']['address2'] + ' \n';
                shipaddress += apObject['shipping_info']['city'] + ', ' + apObject['shipping_info']['state'] + ' \n';
                shipaddress += apObject['shipping_info']['zip'] + ' \n';
                shipaddress += apObject['shipping_info']['country_name'] + ' \n';
                shipaddress += apObject['shipping_info']['country_code'] + ' \n';


                salesOrder.setValue('billaddress', billaddress); // bill address
                salesOrder.setValue('shipaddress', shipaddress); // ship address

                salesOrder.setValue('memo', JSON.stringify(apObject['customer_info'])); // customer information

                var taxcode = -8; // Not Taxable

                if (apObject['shipping_info']['state'] == 'California') {
                    taxcode = -412; // CA_
                } else if (apObject['shipping_info']['state'] == 'Texas') {
                    taxcode = -3413; // TX
                }
                var shiptax = -8;
                var shiptaxrate = 0;

                if (apObject['shipping_info']['state'] == 'California') {
                    shiptax = -412;
                    shiptaxrate = 0;

                } else if (apObject['shipping_info']['state'] == 'Texas') {
                    shiptaxrate = apObject.item_info[0]['tax_rate'].toString();
                    shiptax = -3413;
                }

                salesOrder.setValue('shippingtax1rate', shiptaxrate);

                salesOrder.setValue('shippingtaxcode', shiptax); // ECD Discount Item


                if (apObject.item_info) {
                    for (var line in apObject.item_info) {
                        if (apObject.item_info[line]['netsuite_id'] == null) {
                            // sendToSlack('MAP ERROR', ['AP#' + apObject['order_id'], 'Item is null', apObject.item_info[line]['product_name']], false);
                            return;
                        }

                        //log.debug('Line', line);
                        //log.debug('Item value', apObject.item_info[line]);

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: apObject.item_info[line]['netsuite_id'], // item internalid
                            line: line
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: apObject.item_info[line]['quantity'].toString(), // item quantity
                            line: line
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: apObject.item_info[line]['final_price'].toString(), // item price
                            line: line
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: -1, // custom price level
                            line: line
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: taxcode, // custom price level
                            line: line
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            value: apObject.item_info[line]['tax_rate'].toString(), // tax rate
                            line: line
                        });

                    }
                }

                var extra_lines = apObject.item_info.length;

                // apply giftcard
                if (apObject['gift_certificate_amount'] > 0) {

                    log.debug('GC ' + apObject['order_id'], apObject['gift_certificate_amount'].toString());


                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: 32517, // item internalid
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: -1, // custom price level
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: (-1 * apObject['gift_certificate_amount']).toString(), // item price
                        line: extra_lines
                    });

                    log.debug('GC ' + apObject['order_id'], (-1 * apObject['gift_certificate_amount']).toString());

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: -8, // not taxable
                        line: extra_lines
                    });
                    extra_lines++;
                }

                // apply shipping cost -- might be better to apply it to the shippingcost line?
                /*
                if (apObject['shipping_amount'] > 0) {

                    log.debug('SH ' + apObject['order_id'], apObject['shipping_amount'].toString());


                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: 64892, // item internalid
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: -1, // custom price level
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: apObject['shipping_amount'].toString(), // item price
                        line: extra_lines
                    });

                    log.debug('SH ' + apObject['order_id'], (-1 * apObject['shipping_amount']).toString());

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: taxcode,
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        value: shiptaxrate,
                        line: extra_lines
                    });

                    extra_lines++;
                }*/

                // apply priority processing fees
                if (apObject['priority_processing_fees'] > 0) {

                    log.debug('PPF ' + apObject['order_id'], apObject['priority_processing_fees'].toString());


                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: 29192, // item internalid
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: -1, // custom price level
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: (-1 * apObject['priority_processing_fees']).toString(), // item price
                        line: extra_lines
                    });

                    log.debug('SD ' + apObject['order_id'], (-1 * apObject['priority_processing_fees']).toString());

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: -8, // not taxable .. ?
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        value: 0, // are PPF taxable .. ?
                        line: extra_lines
                    });


                    extra_lines++;
                }

                // apply shipping discount
                /*
                if (apObject['shipping_discount'] > 0) {

                    log.debug('SD ' + apObject['order_id'], apObject['shipping_discount'].toString());


                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: 62467, // item internalid
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: -1, // custom price level
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: (-1 * apObject['shipping_discount']).toString(), // item price
                        line: extra_lines
                    });

                    log.debug('SD ' + apObject['order_id'], (-1 * apObject['shipping_discount']).toString());

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: taxcode, // not taxable
                        line: extra_lines
                    });

                    salesOrder.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        value: shiptaxrate,
                        line: extra_lines
                    });


                    extra_lines++;
                }
                */

                // AP JSON Check
                salesOrder.setValue('custbody_ap_order_total', apObject['total'].toString()); // ECD Discount Item
                salesOrder.setValue('custbody_ap_tax_total', apObject['tax'].toString()); // ECD Discount Item
                salesOrder.setValue('custbody_ap_ship_discount', apObject['shipping_discount'].toString()); // ECD Discount Item
                salesOrder.setValue('custbody_ap_ship_tax', apObject['shipping_tax'].toString()); // ECD Discount Item


                var soId = salesOrder.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                sendToSlack('MAP', ['GC: ' + apObject['gift_certificate_amount'], apObject['order_id'], soId, apObject['shipping_info']['state'], 'https://system.sandbox.netsuite.com/app/accounting/transactions/salesord.nl?id=' + soId], false);

            } catch (e) {
                log.debug('Error', e);
                //sendToSlack('MAP ERROR', ['GC:'+ apObject['gift_certificate_amount'],apObject['order_id'], e.message], false);
            }
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }


        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            var seconds = summary.seconds;
            var usage = summary.usage;
            var yields = summary.yields;

            sendToSlack('SUMMARY', ['Time: ' + seconds, 'Usage: ' + usage, 'Yields: ' + yields], false);


        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
