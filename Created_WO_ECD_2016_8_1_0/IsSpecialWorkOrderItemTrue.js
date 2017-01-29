/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2016     cmw
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function SpecialWOMassUpdate(recType, recId) {
	try{
	nlapiSubmitField(recType, recId, 'isspecialworkorderitem', 'T');
	nlapiLogExecution('debug', [recType,recId]);
	} catch (e) {
		nlapiLogExecution('error', e);
	}
}
