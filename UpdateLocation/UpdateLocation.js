function UpdateLocation()
{
var records = nlapiSearchRecord('transaction', 543, null, null);
for ( var i = 0; records != null && i < records.length; i++ )
{
var intid = records[i].getId();
var record = nlapiLoadRecord( 'workordercompletion' , intid );
//nlapiLogExecution('DEBUG', 'test', 'Loaded Intid '+intid);
record.setFieldValue('location', '17' );
var id = nlapiSubmitRecord(record, false, true);
}
}