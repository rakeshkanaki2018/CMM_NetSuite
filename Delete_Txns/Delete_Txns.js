function DeleteTxns()
{
                //if you are only getting sales orders then declare explicitly for safety
				//Code provided by J.P. as teaching critique
                var records = nlapiSearchRecord('salesorder', 625, null, null); //don’t need the two nulls it will auto-pass null
                nlapiLogExecution('DEBUG', 'test', 'Total Recs: ' + records.length);
                for ( var i = 0; records != null && i < records.length; i ++ ) {//neat I’ve never thought of checking null in my loop condition. It’s elegant but I wonder if it adds additional load (probably in ms so it doesn’t matter)
                                var rectype=null;
                                try{
                                                rectype = records[i].getRecordType(); 
                                                if ((i%100)==0) {
nlapiLogExecution('DEBUG', 'test', rectype + ': ' + records[i].getId());
}
                                                nlapiDeleteRecord('salesorder', records[i].getId());
                                                }
                                catch(e)
                                                {
                                                                //Check for nlobjError
                                                                var msg = e.toString();
                                                                if (e instanceof nlobjError) {
                                                                                msg = "nlobjError::" +
                                                                                                "\r\n\tCode:`" + e.getCode() +
                                                                                                "`\r\n\tMessage:`" + e.getMessage() + "`"
                                                                                ;
                                                                }
                                                                //F.Y.I this log should throw an error since recType is out of scope but I corrected by moving rectype initialization out of try block
                                                                nlapiLogExecution('DEBUG', 'Error:', rectype + ': ' + records[i].getId() + "::" + msg);
                                                }
                }
}