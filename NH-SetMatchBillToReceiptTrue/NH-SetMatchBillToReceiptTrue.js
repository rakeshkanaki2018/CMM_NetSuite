function SetMatchBillToReceiptTrue()
{

var records = nlapiSearchRecord('transaction', 598, null, null); //you will have to specify the internalid of the saved search you need to grab specifically the records you need to update. Refer to the dev guide this API

for ( var i = 0; records != null && i < records.length; i++ )
{
//nlapiLogExecution('DEBUG', 'test', 'Start IntId ' + records[i].getId() );
var record = nlapiLoadRecord( records[i].getRecordType(), records[i].getId() );
//nlapiLogExecution('DEBUG', 'test', '# of Lines:  ' record.getLineItemCount('item') );

	for (var line = 1; line <= record.getLineItemCount('item'); ++line) {
		record.setLineItemValue('item', 'matchbilltoreceipt', line, 'T');
	}

nlapiSubmitRecord(record, false, true);

}

} 