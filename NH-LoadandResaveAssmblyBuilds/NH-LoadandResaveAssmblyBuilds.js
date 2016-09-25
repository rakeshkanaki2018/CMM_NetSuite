function updateGLonVendorBillLine()

{
var linenbr = new nlobjSearchColumn('line', null, null);
var records = nlapiSearchRecord('transaction', 556, null, linenbr); //you will have to specify the internalid of the saved search you need to grab specifically the records you need to update. Refer to the dev guide this API
nlapiLogExecution('Debug', 'Test', 'Initiated at InternalID: '+ records[1].getId() );
for ( var i = 0; records != null && i < records.length; i++ )
{
var record = nlapiLoadRecord( records[i].getRecordType(), records[i].getId() );

	
//record.setLineItemValue('expense', 'account', records[i].getValue(linenbr), '988');


nlapiSubmitRecord(record, false, true);

}

} 