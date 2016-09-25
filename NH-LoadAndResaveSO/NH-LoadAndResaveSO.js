function LoadAndResaveSO()
{
var records = nlapiSearchRecord('transaction', 610, null, null);
for ( var i = 0; records != null && i < records.length; i++ )
{
try{
var rec = records[i].getId();
//nlapiLogExecution('DEBUG', 'test', 'Load: ' + rec );
var SOLoad = nlapiLoadRecord( 'salesorder' , rec );
var SOSave = nlapiSubmitRecord(SOLoad, false, true);
//nlapiLogExecution('DEBUG', 'test', 'Save: ' + SOSave);
}catch(e){
nlapiLogExecution('DEBUG', 'test', 'Error :' + e + ' Rec: ' + rec);
}

}
} 