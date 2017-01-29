/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Dec 2016     cmw
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function apOrderSuitelet(request, response){
	
	var id = request.getParameter('id');
	nlapiLogExecution('DEBUG',request);
	
	var searchresults = nlapiSearchGlobal('sales: '+id );
	for ( var i = 0; i < searchresults.length; i++ )
	{
	   var searchresult = searchresults[ i ];
	   var record = searchresult.getId( );
	   var rectype = searchresult.getRecordType( );

	   var name = searchresult.getValue( 'name' );
	   var type = searchresult.getValue( 'type' );
	   var info1 = searchresult.getValue( 'info1' );
	   var info2 = searchresult.getValue( 'info2' );
	}
	return searchresult;
	
}
