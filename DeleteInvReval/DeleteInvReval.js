function DeleteInvReval()
//Note this was designed for inventory revaluation transactions. the saved search returns
//2 lines for each internalid.  So I set the loop increment to 2
{
var records = nlapiSearchRecord('transaction', 572, null, null);
nlapiLogExecution('DEBUG', 'test', 'Total Recs: ' + records.length);

for ( var i = 0; records != null && i < records.length; i +=2 )
	{
	var rectype = records[i].getRecordType();
nlapiLogExecution('DEBUG', 'test', rectype + ': ' + records[i].getId());
	nlapiDeleteRecord(rectype, records[i].getId());
	}
} 