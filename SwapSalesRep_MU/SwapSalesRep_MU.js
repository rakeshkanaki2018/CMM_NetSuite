/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Oct 2016     cmw
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function massUpdate(recType, recId) {
	try {
	nlapiSubmitField(recType, recId, 'salesrep', 6490, false)
	} catch (e) {
		nlapiLogExecution('DEBUG','FAILED', [recType, recId]);
	}
}
