/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
    function(search, record, email, runtime, error)
    {

        function getInputData()
        {
            log.debug('Loading Search');
            return search.load({
                id: 'customsearch_ecd_wo_delete_search'
            });
        }

        function map(context)
        {
            try {
                var searchResult = JSON.parse(context.value);
                var woId = searchResult.id;

                log.debug('WO', woId);

                var objRecord = record.delete({
                    type: record.Type.WORK_ORDER_ISSUE,
                    id: woId
                });

                log.audit('Deleted', woId);
            } catch (e) {
                log.error(e);
            }

        }

        /**
         *
         * WORK_ORDER
         * WORK_ORDER_CLOSE
         * WORK_ORDER_COMPLETION
         * WORK_ORDER_ISSUE
         */


        function summarize(summary)
        {
            var seconds = summary.seconds;
            var usage = summary.usage;
            var yields = summary.yields;

            log.debug('Summary', [seconds, usage, yields]);
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });