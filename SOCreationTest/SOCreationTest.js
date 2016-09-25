/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/transaction', 'N/log', 'N/email', 'N/file'],
    function (record, runtime, search, transaction, log, email, file) {

        function _get(context) {
            var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
            log.debug('Time', time);
            return record.load({
                id: 9597395,
                type: "salesorder",
                isDyanmic: true
            });
            var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
            log.debug('Time', time);
        };

        function _post(context) {
            try {
                var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                log.debug('Time', time);
                var objRecord = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: false,
                    defaultValues: {
                        entity: 31913,
                        subsidiary: 4
                    }
                });
                //paymentmethod
                objRecord.setValue({
                    fieldId: 'paymentmethod',
                    value: 6,
                });
                                //paymentmethod
                objRecord.setValue({
                    fieldId: 'ccnumber',
                    value: '378750631231028',
                });                //paymentmethod
                objRecord.setValue({
                    fieldId: 'cczipcode',
                    value: '78753',
                });                //paymentmethod
                objRecord.setValue({
                    fieldId: 'ccexpiredate',
                    value: '08/2016',
                });                //paymentmethod
                objRecord.setValue({
                    fieldId: 'ccname',
                    value: 'Adam Hill',
                });
                                //paymentmethod
                objRecord.setValue({
                    fieldId: 'getauth',
                    value: true,
                });
                objRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: 56241,
                    line: 0
                });
                objRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: 4,
                    line: 0
                });

                var recordId = objRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.debug('SO ID', recordId);

                var cc_fields = search.lookupFields({
                type: 'salesorder',
                id: recordId,
                columns: ['tranid', 'internalid', 'authcode', 'pnrefnum', 'paymenteventholdreason', 'paymenteventresult']
                });

                var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
                log.debug('Time', time);
                return cc_fields
            } catch (e) {
                log.error('Error', e);
            }
        };

        function _put(context) {
            return context
        };

        return {
            get: _get,
            post: _post,
            put: _put
        };
    });