function delete_records(rec_type, rec_id)
{
   try {
  nlapiDeleteRecord(rec_type, rec_id);
   } catch (e) {
     nlapiLogExecution('DEBUG','FAIL',e);
   }
}
