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
                id: 'customsearch1491'
            });
        }

        function map(context) {
        	try {
            var searchResult = JSON.parse(context.value);
            log.debug('context', searchResult);

/*
            var createdfrom = searchResult.values.applyingtransaction.value;

            log.debug('created from', createdfrom);

            var mySalesOrderSearch = search.create({
                type: record.Type.WORK_ORDER_ISSUE,
                columns: ['internalid'],
                filters: [
                    ['createdfrom', 'is', createdfrom], 'and',
                    ['mainline', 'is', 'T']
                ]
            });

var myPagedData = mySalesOrderSearch.runPaged();
            myPagedData.pageRanges.forEach(function(pageRange){
                var myPage = myPagedData.fetch({index: pageRange.index});
                myPage.data.forEach(function(result){
                    var entity = result.getValue({
                        name: 'internalid'
                    });
                    var wo_iss_record = record.delete({
                        type: record.Type.WORK_ORDER_ISSUE,
                    	id: entity
                    });
                    log.debug('deleted wo issue', entity);
                    
                });
            });
*/

            if (searchResult.values.applyingtransaction.value){
            var wo_record = record.delete({
                type: record.Type.WORK_ORDER,
            	id: searchResult.values.applyingtransaction.value
            });
            }

            //log.debug('Deleted SO', [searchResult.values['GROUP(type)'].value, searchResult.values['GROUP(internalid)'].value]);
        	} catch (E) {
        		log.error('Error', E);
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