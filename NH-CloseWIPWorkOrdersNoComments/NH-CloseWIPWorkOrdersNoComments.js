function WorkOrderClose()
{
var records = nlapiSearchRecord('transaction', 748, null, null);
for ( var i = 0; records != null && i < records.length; i++ )
{
var intid = records[i].getId();
var transformRecord = nlapiTransformRecord('workorder', intid, 'workorderclose');
transformRecord.setFieldValue("trandate", "08/31/2015");
var WOCid = nlapiSubmitRecord(transformRecord, false, true);
}
} 