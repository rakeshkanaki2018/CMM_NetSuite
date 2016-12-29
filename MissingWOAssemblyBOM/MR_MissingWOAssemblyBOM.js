/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/runtime', 'N/search'],
/**
 * @param {error} error
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(error, record, runtime, search) {

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

        return search.load({
            id: 'customsearch_my_so_search'
        });

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {

        var woRecord = record.create({
            type: record.Type.WORK_ORDER,
            isDynamic: true,

        });

        woRecord.setValue({
            fieldId: 'subsidiary',
            value: new Date('11/25/2016'),
        });

        woRecord.setValue({
            fieldId: 'subsidiary',
            value: 6,
        });
        woRecord.setValue({
            fieldId: 'location',
            value: 19,
        });
        woRecord.setValue({
            fieldId: 'entity',
            value: 945,
        });
        woRecord.setValue({
            fieldId: 'iswip',
            value: true,
        });
        woRecord.setValue({
            fieldId: 'quantity',
            value: 10,
        });

        var woId = woRecord.save();
        log.debug('ID',woId);


        /*
         * var WO = nlapiCreateRecord('workorder');

WO.setFieldValue('assemblyitem', 56700);
WO.setFieldValue('subsidiary', 6);
WO.setFieldValue('location', 19);
WO.setFieldValue('trandate', '11/25/2016');
WO.setFieldValue('iswip', 'T');


var ID = nlapiSubmitRecord(WO);

nlapiLogExecution('DEBUG','ID',ID);
         */
    }

    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };

});
