function DeleteEntity()
{
var records = nlapiSearchRecord('entity', 570, null, null);

for ( var i = 0; records != null && i < records.length; i++ )
	{
	var rectype = records[i].getRecordType();
	nlapiDeleteRecord(rectype, records[i].getId());
	}
} 