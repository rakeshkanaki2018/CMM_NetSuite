function updateWOLocation()
{

var records = nlapiSearchRecord('transaction', 580, null, null); //you will have to specify the internalid of the saved search you need to grab specifically the records you need to update. Refer to the dev guide this API

for ( var i = 0; records != null && i < records.length; i++ )
{
var record = nlapiLoadRecord( records[i].getRecordType(), records[i].getId() );
record.setFieldValue('location', 17 ); //17 = Gemline:ATX
nlapiSubmitRecord(record, false, true);

}

} 