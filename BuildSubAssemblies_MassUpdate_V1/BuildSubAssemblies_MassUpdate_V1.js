/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/transaction', 'N/log', 'N/email', 'N/file'],
    function (record, runtime, search, transaction, log, email, file) {
        function getInputData() {
            return search.load({
                id: 'customsearch1222'
            });
        }

        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var ass_item_bom = record.load({
                    id: searchResult.id,
                    type: searchResult.recordType,
                    isDynamic: false
                });
                var id = searchResult.id;

                ass_item_bom.setValue({
                    fieldId: 'buildentireassembly',
                    value: true
                });


                ass_item_bom.save();
                log.debug('Saved Item', id);
            } catch (e) {
                log.error('Error', e);
                return;
            }

        }

        function reduce(context) {

        }

        function summarize(summary) {
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });
 