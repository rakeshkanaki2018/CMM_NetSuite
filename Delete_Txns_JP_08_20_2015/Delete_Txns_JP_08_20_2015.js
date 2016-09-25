var USAGE_LIMIT = 50;
function DeleteTxns()
{
	//if you are only getting sales orders then declare explicitly for safety
	var context = nlapiGetContext();
	var REC_TYPE = context.getSetting('SCRIPT', 'custscript_mtd_record_type');
	var searchId = context.getSetting('SCRIPT', 'custscript_mtd_saved_search_id');
	var records = nlapiSearchRecord(REC_TYPE, searchId, null, null);
	nlapiLogExecution('DEBUG', 'test', 'Total Recs: ' + records.length);
	for ( var i = 0; records != null && i < records.length; i ++ ) {
		var RecID = records[i].getId();
		try{
			context = nlapiGetContext();
			rectype = records[i].getRecordType();
			if ((i%10)==0) {
				nlapiLogExecution('DEBUG', 'i==`' + i + '`', rectype + ': ' + RecID);
				nlapiLogExecution('DEBUG', 'RemainingUsage', context.getRemainingUsage());
			}
			nlapiDeleteRecord(REC_TYPE, RecID);
				
				 if (context.getRemainingUsage()<=USAGE_LIMIT) {
					// nlapiScheduleScript(
						// context.getScriptId(),
						// context.getDeploymentId(),
						// {
							// 'custscript_mtd_record_type':REC_TYPE,
							// 'custscript_mtd_saved_search_id':searchId
						// }
						
					// );
					 return;
				 }
			}
		catch(e)
			{
				//Check for nlobjError
				var msg = e.toString();
				if (e instanceof nlobjError) {
					msg = "nlobjError::" +
						"\r\n\tCode:`" + e.getCode() + 
						"`\r\n\tMessage:`" + e.getDetails() + "`" +
						"ID:`" + e.getId() + "`" +
						"StackTrace:`" + JSON.stringify(e.getStackTrace()) + "`"
					;
				}
				//F.Y.I this log should throw an error since recType is out of scope
				nlapiLogExecution('DEBUG', 'Error: i==`' + i + '`', REC_TYPE + ': ' + RecID + "::" + msg);
			}
	} 
}