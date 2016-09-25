function DeleteWOs()

{
var records = nlapiSearchRecord('transaction', 574, null, null);
nlapiLogExecution('DEBUG', 'test', 'Total Recs: ' + records.length);

for ( var i = 0; records != null && i < records.length; i ++ )
	{
	var rectype = records[i].getRecordType();
//nlapiLogExecution('DEBUG', 'test', rectype + ': ' + records[i].getId());
	nlapiDeleteRecord(rectype, records[i].getId());
	}
} 