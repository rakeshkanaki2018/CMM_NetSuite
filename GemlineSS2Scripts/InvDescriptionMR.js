/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/transaction', 'N/log', 'N/email', 'N/file'],
    function (record, runtime, search, transaction, log, email, file) {
        function getInputData() {
            return search.load({
                //id: 'customsearch_gemline_invoice_fix' //sandbox
                id: 'customsearch_gemline_missing_descripti_2'
            });
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);
            var inv_record = record.load({
                id: searchResult.id,
                type: searchResult.recordType,
                isDynamic: false
            });
            var id = searchResult.id;
            var fileObj = file.create({
                name: id.toString() + '_gemline.txt',
                fileType: file.Type.PLAINTEXT,
                contents: JSON.stringify(inv_record)
            });
            fileObj.folder = 239034;
            var fileId = fileObj.save();

            var lineCount = inv_record.getLineCount('item');
            log.debug('Line #', lineCount);
            for (var i = 0; i < lineCount; i++) {
                var item_rec = inv_record.getSublist({
                    sublistId: 'item',
                });
                log.debug('Item Sub', item_rec);

                var item_id = inv_record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                log.debug('Item Id', item_id);

                var fieldLookUp = search.lookupFields({
                    type: 'ITEM',
                    id: item_id,
                    columns: 'description'
                });

                log.debug('Item Desc', fieldLookUp.description);

                var item_set = inv_record.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i,
                    value: fieldLookUp.description
                });
            }
            inv_record.save();
            log.debug('Saved Inv', id);

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