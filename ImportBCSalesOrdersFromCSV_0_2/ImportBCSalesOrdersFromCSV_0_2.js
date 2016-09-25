/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Oct 2014     greg.smith
 *
 */

var customerCSVHeader = "BATCHRECORDID,EXTERNALID,CUSTOMERID,CUSTOMERFULLNAME,FIRSTNAME,LASTNAME,COMPANY,ADDRESS1,ADDRESS2,CITY,STATE,ZIP,COUNTRY,PHONE,EMAIL,TERMS," +
						"ISINDIVIDUAL,PRINTSTATEMENT,CREDITLIMIT";
var invoiceCSVHeader = "BATCHRECORDID,EXTERNALID,DATE,INVOICENUMBER,PONUMBER,CUSTOMER,CUSTOMERNAME,COMPANY,ADDRESS1,ADDRESS2,CITY,STATE,ZIP,COUNTRY,PHONE,EMAIL," +
		                  "ITEM,ITEMPRICE,ITEMQTY,TERMS,PAYMENTMETHOD,CREDITCARDTYPE,CCNUMBER,AUTCODE,AVSMATCH,CCEXP,AFIRSTNAME";

MOTHERSHIP_LIST_ID = 5;
var mothershipItemSearchID = "";
var mothershipInvoiceSearchID = "";
var mothershipCustomerSearchID = "";

var MOTHERSHIP_IMPORT = {};
MOTHERSHIP_IMPORT.NUMBEROFCOLUMNS = 27;
MOTHERSHIP_IMPORT.FIRSTNAME = 0;
MOTHERSHIP_IMPORT.LASTNAME = 1;
MOTHERSHIP_IMPORT.COMPANY= 2;
MOTHERSHIP_IMPORT.EMAIL = 3;
MOTHERSHIP_IMPORT.ADDR1 = 4;
MOTHERSHIP_IMPORT.ADDR2 = 5;
MOTHERSHIP_IMPORT.CITY = 6;
MOTHERSHIP_IMPORT.STATE = 7;
MOTHERSHIP_IMPORT.ZIP = 8;
MOTHERSHIP_IMPORT.PRODUCTSID = 9;
MOTHERSHIP_IMPORT.SKU = 10;
MOTHERSHIP_IMPORT.QUANTITY = 11;
MOTHERSHIP_IMPORT.UNITPRICE = 12;
MOTHERSHIP_IMPORT.TOTAL =13;
MOTHERSHIP_IMPORT.COUNTRY = 14;
MOTHERSHIP_IMPORT.CCTYPE = 15;
MOTHERSHIP_IMPORT.CCNUMBER = 16;
MOTHERSHIP_IMPORT.AUTCODE = 17;
MOTHERSHIP_IMPORT.AVSMATCH = 18;
MOTHERSHIP_IMPORT.CCEXP =19;
MOTHERSHIP_IMPORT.AFIRSTNAME = 20;
MOTHERSHIP_IMPORT.ORDERSID = 21;
MOTHERSHIP_IMPORT.PAYMENTMETHOD =22;
MOTHERSHIP_IMPORT.PRODUCTSNAME = 23;
MOTHERSHIP_IMPORT.ISNET30= 24;
MOTHERSHIP_IMPORT.CUSTOMERID= 25;
MOTHERSHIP_IMPORT.PO= 26;


function CustomerRecord(id, name, email, phone) {
	this.id = id;
	this.name = name;
	this.email = email;
	this.phone = phone;
}
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function importSalesOrdersFromCSV(request, response){
	nlapiLogExecution("DEBUG", "Start");
	var batchRecordID = null;
	var form = nlapiCreateForm("Import Invoices and Customers From Mothership");
	var host = request.getURL().substring(0,(request.getURL().indexOf('.com') + 4));
	var context = nlapiGetContext();
	var folderid = context.getSetting('SCRIPT', 'custscript_ar_impinvcsv_folderid');
	var csvImportIDCustomers = context.getSetting('SCRIPT', 'custscript_ar_impinvcsv_impidcust');
	var csvImportIDInvoices = context.getSetting('SCRIPT', 'custscript_ar_impinvcsv_impidinv');
	var csvImportBatchID = context.getSetting('SCRIPT', 'custscript_ar_csvimpbatch_batchid');
	mothershipItemSearchID = context.getSetting('SCRIPT', 'custscript_ad_impinvcsv_itemsrch');
	mothershipCustomerSearchID = context.getSetting('SCRIPT', 'custscript_ad_impinvcsv_custsrch');
	mothershipInvoiceSearchID = context.getSetting('SCRIPT', 'custscript_ad_impinvcsv_invsrch');
	
	var doNotImportCustomersField = form.addField("donotimportcust", "checkbox", "Do Not Import Customers");
	var ignoreDuplicatesField = form.addField("ignoreduplicateorders", "checkbox", "Ignore Duplicate Invoices");		
	var csvFileField = form.addField("csvfile", "file", "CSV File To Upload");
	csvFileField.setDefaultValue("");
	var customerImportIDField = form.addField("customercsvimportid", "text", "Customer CSV Import ID");
	var salesorderImportIDField = form.addField("invoicecsvimportid", "text", "Invoice CSV Import ID");	
	
	customerImportIDField.setMandatory(true);
	salesorderImportIDField.setMandatory(true);	
	csvFileField.setMandatory(true);
	
	customerImportIDField.setDefaultValue(csvImportIDCustomers);
	salesorderImportIDField.setDefaultValue(csvImportIDInvoices);
	
	doNotImportCustomersField.setLayoutType("startrow", "startcol");
	customerImportIDField.setLayoutType("startrow", "startcol");
	
	form.addSubmitButton("Upload");
	
	if(request.getMethod() == "POST"){
		var csvFile = request.getFile("csvfile");		
		csvImportIDCustomers = request.getParameter("customercsvimportid");
		csvImportIDInvoices = request.getParameter("invoicecsvimportid");
		var doNotImportCustomers = request.getParameter("donotimportcust");
		var ignoreDuplicateOrders = request.getParameter("ignoreduplicateorders");
		var campaignIdentifier = request.getParameter("campaignidentifier");
		doNotImportCustomersField.setDefaultValue(doNotImportCustomers);
		ignoreDuplicatesField.setDefaultValue(ignoreDuplicateOrders);
		
		try {
			if(!!csvFile) {	
				var originalFileId = saveFileToFileCabinet(csvFile, folderid);
				var fileValue = getFileValue(csvFile);
				var csvDataArray = csvToArray( fileValue);
				if(!(!!csvDataArray) || csvDataArray.length == 0) {
					throw "There is no data in the CSV spreadsheet.";
				}
				
				var csvBatchRecord = nlapiCreateRecord("customrecord_ard_csvimport_batchrec");
				batchRecordID = nlapiSubmitRecord(csvBatchRecord, false, true);
				csvBatchRecord = nlapiLoadRecord("customrecord_ard_csvimport_batchrec", batchRecordID);
				
				csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_orderchannel", MOTHERSHIP_LIST_ID);
				csvBatchRecord.setFieldValue("custrecord_ard_cust_csv_import_id", csvImportIDCustomers);
				csvBatchRecord.setFieldValue("custrecord_ard_so_csv_import_id", csvImportIDInvoices);
				
				csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_original", originalFileId);
				csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_numcustupl", "0");
				csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_numordupl", "0");
				
				convertToMothershipImport(csvDataArray,folderid, csvBatchRecord, ignoreDuplicateOrders, 
						doNotImportCustomers, batchRecordID,campaignIdentifier);
								
				var csvBatchRecordID = nlapiSubmitRecord(csvBatchRecord, false, true);
			}
		}
		catch(err) {
			if(!!batchRecordID) {
				nlapiDeleteRecord("customrecord_ard_csvimport_batchrec", batchRecordID);
			}
			nlapiLogExecution("DEBUG","Error",err.toString());
			var warningItemsField = form.addField("upload_warning", "inlinehtml", "Warning Field");
			warningItemsField.setDefaultValue("<span style=\"font-weight:bold;color:red;\"></br></br>" + err.toString() + "</span>");
		}
	}
	
	showCSVBatchSublist(form, host, csvImportBatchID);
	response.writePage(form);
}

function showCSVBatchSublist(form, host, csvImportBatchID) {
	
	var csvBatchUploadSublist = form.addSubList("csvbatchsublist", "list","CSV Batch Upload List",null);
	var batchIdField = csvBatchUploadSublist.addField("csvbatchid", "textarea", "Batch ID/Link", null);
	var dateCreatedField = csvBatchUploadSublist.addField("csvbatchdatecreated", "datetimetz", "Date Created", null);
	var createdByField = csvBatchUploadSublist.addField("csvbatchcreatedby", "text", "Created By", null);
	var orderChannelField = csvBatchUploadSublist.addField("csvbatchorderchannel", "text", "From Location", null);
	var statusField = csvBatchUploadSublist.addField("csvbatchstatus", "text", "Status", null);
	var numCustomersField = csvBatchUploadSublist.addField("csvbatchnumcustomers", "integer", "Number Of Customers", null);
	var numOrdersField = csvBatchUploadSublist.addField("csvbatchnumorders", "integer", "Number Of Orders", null);
	csvBatchUploadSublist.addRefreshButton();
	
	//Only show the first 1000 records to keep the search results low
	var searchresults = nlapiSearchRecord("customrecord_ard_csvimport_batchrec", "customsearch_ar_bc_csvimpbatchview");
	if(!!searchresults && searchresults.length > 0)	{
		var currentRow = 1;
		
		for(var i = 0; i < searchresults.length && i < 50; i++) {
			var batchId = searchresults[i].getId();
						
			var dateCreated = searchresults[i].getValue(new nlobjSearchColumn("created"));
			var createdBy = searchresults[i].getText(new nlobjSearchColumn("owner"));
			var orderChannel = searchresults[i].getText(new nlobjSearchColumn("custrecord_ard_csvimpbatch_orderchannel"));
			var status = searchresults[i].getText(new nlobjSearchColumn("custrecord_ard_csvimpbatch_status"));
			var numCustomers = searchresults[i].getValue(new nlobjSearchColumn("custrecord_ard_csvimpbatch_numcust"));
			var numOrders = searchresults[i].getValue(new nlobjSearchColumn("custrecord_ard_csvimpbatch_numorders"));
						
			var dateCreatedTZ = nlapiStringToDate(dateCreated,"datetimetz");
			var dateCreatedTZString = nlapiDateToString(dateCreatedTZ, "datetimetz");
			
			var url = host + "/app/common/custom/custrecordentry.nl?rectype=" + csvImportBatchID + "&id=" + batchId;
			
			csvBatchUploadSublist.setLineItemValue("csvbatchid", currentRow, "<a href=" + url + " target = '_blank'>" + batchId + "</a>");	
			csvBatchUploadSublist.setLineItemValue("csvbatchdatecreated", currentRow, dateCreatedTZString);
			csvBatchUploadSublist.setLineItemValue("csvbatchcreatedby", currentRow, createdBy);
			csvBatchUploadSublist.setLineItemValue("csvbatchorderchannel", currentRow, orderChannel);
			csvBatchUploadSublist.setLineItemValue("csvbatchstatus", currentRow, status);
			csvBatchUploadSublist.setLineItemValue("csvbatchnumcustomers", currentRow, numCustomers);
			csvBatchUploadSublist.setLineItemValue("csvbatchnumorders", currentRow, numOrders);
			
			currentRow++;
		}
	}
} 

function saveFileToFileCabinet(fileToSave, folderid) {
	var today = new Date();
	var todaytimestamp = today.toISOString();	
	
	fileToSave.setEncoding("windows-1252");
	var fileType = fileToSave.getType();
	var fileName = fileToSave.getName();
	if(!(!!fileName) || !(!!fileType))	{
		throw "You did not provide a valid file. Please check the file and retry.";
	}
	var fileExt = (fileName.split('.').pop()).toUpperCase();
	if(fileExt != "CSV") {
		throw "You must select a valid CSV file only. Please verify the file is a CSV file.";
	}
	
	folderid = getMonthYearFolders(folderid);
	
	fileToSave.setName(fileName.split('.')[0] + todaytimestamp + ".csv");	
	fileToSave.setFolder(folderid);
	var fileId = nlapiSubmitFile(fileToSave);
	return fileId;
}


function convertToMothershipImport(csvDataArray,folderid, csvBatchRecord, 
		ignoreDuplicateOrders, doNotImportCustomers, batchRecordID,campaignIdentifier) {	
	nlapiLogExecution("DEBUG", "mothership upload");
	nlapiLogExecution("DEBUG", "CSV Data", csvDataArray.length);
	
	var today = new Date();
	var netSuiteOrderDate = nlapiDateToString(today);
	var todaytimestamp = today.toISOString();
	
	var orderNumberArray = new Array();
	var orderNumberValueArray = new Array();
	var numberOfOrders = 0;
	var numberOfCustomers = 0;
	var itemArray = getAllInventoryItems("custitem_ard_sample_sku");
	
	var currentCustomerName = new Array();
	
	var customerArray = new Array();
	if(doNotImportCustomers != "T") {
		customerArray = getAllCustomersArray();
	}
	var invoiceArray = new Array();
	if(ignoreDuplicateOrders != "T") {
		invoiceArray = getAllInvoicesArray();
	}
	
	var columnsArray = csvDataArray[0];
	if(!(!!columnsArray) || columnsArray.length != MOTHERSHIP_IMPORT.NUMBEROFCOLUMNS) {
		throw "The Columns in the CSV spreadsheet do not match the number of columns expected.";
	}
	nlapiLogExecution("DEBUG", "columnsArray", columnsArray.length);
	var customerCSV = customerCSVHeader + "\r\n";
	var invoiceCSV = invoiceCSVHeader + "\r\n";
    var externalOrderNumber = 0;
	for (var i = 1, j = csvDataArray.length; i < j; i++) {
		var dataRowArray = csvDataArray[i];
		var orderid = dataRowArray[MOTHERSHIP_IMPORT.ORDERSID];
		
		if(!(!!orderid)) {
			//There is no invoice
			continue;
		}	
		externalOrderNumber++;
		var createCustomer = true;
		var firstName = dataRowArray[MOTHERSHIP_IMPORT.FIRSTNAME];
		var lastName = dataRowArray[MOTHERSHIP_IMPORT.LASTNAME];

		var companyName = dataRowArray[MOTHERSHIP_IMPORT.COMPANY];
		var customerName = "";
		if(!!firstName) {
			customerName = firstName;
			if(!!lastName) {
				customerName = firstName + " " + lastName;
			}
		}
		else {
			if(!!lastName) {
				customerName = lastName;
			}
		}
		
		/*
		if(!(!!customerName)) {
			throw "No name or company name for Customer on row " + (i + 1) + "<br/>" 
			+ "Please edit the spreadsheet and add a name or company name for this customer.";
		}
		*/
		var originalCustomerName = customerName;
		var extraCustomerNumber = 2;		
		var customerID = dataRowArray[MOTHERSHIP_IMPORT.CUSTOMERID];
		var invoiceFullCustomerName = customerID;
		var isIndividual = "YES";
		if(!!companyName) {
			isIndividual = "NO";
			invoiceFullCustomerName += " " + companyName;
		}
		else {
			invoiceFullCustomerName += " " + customerName;
		}
		var upperCaseCustomerID = customerID.toUpperCase();
		if(!!currentCustomerName[upperCaseCustomerID]) {
			createCustomer = false;
		}
		else {
			if(!!customerArray[upperCaseCustomerID]) {
				createCustomer = false;
			}
		}
			
		var zipcode = dataRowArray[MOTHERSHIP_IMPORT.ZIP];
		while(zipcode.length < 5) {
			zipcode = "0" + zipcode;
		}
		var isNet30 = dataRowArray[MOTHERSHIP_IMPORT.ISNET30];
		var terms = "";
		if(isNet30 != "0") {
			terms = "Net 30";
		}				
		
		if (createCustomer && doNotImportCustomers != "T") {
			
			customerCSV = customerCSV + "\"" 
			        + batchRecordID + "\",\""
			        + "BCCUST-" + numberOfCustomers + "-" + todaytimestamp + "\",\""
			        + customerID + "\",\"" //Customer ID
					+ customerName + "\",\""
					+ firstName + "\",\""
					+ lastName + "\",\""
					+ dataRowArray[MOTHERSHIP_IMPORT.COMPANY] + "\",\"" //Company Name
					+ dataRowArray[MOTHERSHIP_IMPORT.ADDR1] + "\",\""
					+ removeNull(dataRowArray[MOTHERSHIP_IMPORT.ADDR2]) + "\",\""
					+ dataRowArray[MOTHERSHIP_IMPORT.CITY] + "\",\""
					+ dataRowArray[MOTHERSHIP_IMPORT.STATE] + "\",\""
					+ zipcode + "\",\""
					+ dataRowArray[MOTHERSHIP_IMPORT.COUNTRY] + "\",\""
					+ "" + "\",\"" //Phone
					+ dataRowArray[MOTHERSHIP_IMPORT.EMAIL] + "\",\""
			        + terms + "\",\""
			        + isIndividual + "\",\""
			        + "" + "\",\"" //Print Statement
			        + "" + "\""; //Credit Limit
			customerCSV = customerCSV + "\r\n";
			numberOfCustomers++;
			currentCustomerName[upperCaseCustomerID] = customerName;			
		}

		nlapiLogExecution("DEBUG", "customerCSV", customerCSV);
		nlapiLogExecution("DEBUG", "MOTHERSHIP_IMPORT.PRODUCTSID", dataRowArray[MOTHERSHIP_IMPORT.PRODUCTSID]);
		var itemName = itemArray[dataRowArray[MOTHERSHIP_IMPORT.PRODUCTSID]];
		if (!(!!itemName)) {
			throw "Could not find a matching item Sku of: <b>"
					+ dataRowArray[MOTHERSHIP_IMPORT.PRODUCTSID]
					+ "</b> in NetSuite. <br/>"
					+ "Please verify that the item is in NetSuite before continuing.";
		}
		if(!!invoiceArray[dataRowArray[MOTHERSHIP_IMPORT.ORDERSID]]) {
			throw "Duplicate invoice found on spreadsheet: " + dataRowArray[MOTHERSHIP_IMPORT.ORDERSID] + "<br/>" +
				  "Please verify that this CSV file was not already previously uploaded.<br/>" +
				  "If you still want to upload these orders, please check the Ignore Duplicate Invoices checkbox and re-upload.";
		}
		
		var zipcode = dataRowArray[MOTHERSHIP_IMPORT.ZIP];
		while(zipcode.length < 5) {
			zipcode = "0" + zipcode;
		}
		var invoiceExternalID = "BCINV-" + numberOfOrders + "-" + todaytimestamp;
		if(!!orderNumberArray[orderid]) {
			invoiceExternalID = orderNumberArray[orderid];
		}
		else {
			orderNumberArray[orderid] = invoiceExternalID;
			numberOfOrders++;
		}
		
		invoiceCSV = invoiceCSV + "\"" + batchRecordID + "\",\""
				+ invoiceExternalID + "\",\""				
				+ netSuiteOrderDate + "\",\""				
				+ "BC" + dataRowArray[MOTHERSHIP_IMPORT.ORDERSID] + "\",\""
				+ dataRowArray[MOTHERSHIP_IMPORT.PO] + "\",\""
				+ invoiceFullCustomerName + "\",\""
				+ customerName + "\",\""
				+ removeNull(dataRowArray[MOTHERSHIP_IMPORT.COMPANY]) + "\",\""
				+ removeNull(dataRowArray[MOTHERSHIP_IMPORT.ADDR1]) + "\",\""
				+ removeNull(dataRowArray[MOTHERSHIP_IMPORT.ADDR2]) + "\",\""
				+ dataRowArray[MOTHERSHIP_IMPORT.CITY] + "\",\""
				+ dataRowArray[MOTHERSHIP_IMPORT.STATE] + "\",\""
				+ zipcode+ "\",\""
				+ dataRowArray[MOTHERSHIP_IMPORT.COUNTRY] + "\",\""
				+ "" + "\",\"" //Phone
				+ removeNull(dataRowArray[MOTHERSHIP_IMPORT.EMAIL]) + "\",\""				
				+ itemName + "\",\"" 
				+ dataRowArray[MOTHERSHIP_IMPORT.UNITPRICE] + "\",\""
				+ dataRowArray[MOTHERSHIP_IMPORT.QUANTITY] + "\",\"" //Item Quantity
				+ terms + "\",\"" //Terms
				+ dataRowArray[MOTHERSHIP_IMPORT.PAYMENTMETHOD ] + "\",\"" //Payment Method
				+ dataRowArray[MOTHERSHIP_IMPORT.CCTYPE] + "\",\"" //Credit Card Type
				+ dataRowArray[MOTHERSHIP_IMPORT.CCNUMBER] + "\",\"" //CC Number
				+ dataRowArray[MOTHERSHIP_IMPORT.AUTCODE] + "\",\"" //Auth Code
				+ dataRowArray[MOTHERSHIP_IMPORT.AVSMATCH] + "\",\"" //AVS Match
				+ dataRowArray[MOTHERSHIP_IMPORT.CCEXP] + "\",\"" //CC EXP
				+ dataRowArray[MOTHERSHIP_IMPORT.AFIRSTNAME] + "\""; //AFIRSTNAME
		invoiceCSV = invoiceCSV + "\r\n";

		
		dataRowArray["CUSTOMERNAME"] = customerName;
		dataRowArray["EXTERNALID"] = invoiceExternalID;
		
		

	}
	
	if(numberOfOrders == 0) {
		throw "There are no orders to process. Please verify the csv file.";
	}
	if(numberOfCustomers == 0) {
		csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_custfinished", "T");
	}
	csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_numcust", numberOfCustomers);
	csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_numorders", numberOfOrders);
	
	if(numberOfCustomers > 0) {
		var customerFile = nlapiCreateFile("CustomerImport.csv", "CSV", customerCSV);
		var customerFileId = saveFileToFileCabinet(customerFile, folderid);
		csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_custupload", customerFileId);
	}
	
	var invoiceFile = nlapiCreateFile("InvoiceImport.csv", "CSV", invoiceCSV);
	var invoiceFileId = saveFileToFileCabinet(invoiceFile, folderid);
	csvBatchRecord.setFieldValue("custrecord_ard_csvimpbatch_soupload", invoiceFileId);	
	
}

function removeNull(value) {
	var upperCaseValue = value.toUpperCase();
	if(upperCaseValue == "NULL") {
		value = "";
	}
	return value;
	
}

function getAllInvoicesArray() {
	var invoicesArray = new Array;
		
	var search = nlapiLoadSearch("invoice", mothershipInvoiceSearchID);
	
	var numResults = 1000;		
	var resultSet = search.runSearch();
	var searchresults = resultSet.getResults(0, numResults);	
	if(!!searchresults)	{		
		while(!!searchresults && searchresults.length > 0) {
			for(var i = 0; i < searchresults.length; i++) {		
				var invoiceId = searchresults[i].getId();
				var invoicePONumber = searchresults[i].getValue(new nlobjSearchColumn("otherrefnum"));				
				invoicesArray[invoicePONumber] = invoiceId;					
			}
			searchresults = resultSet.getResults(numResults, numResults + 1000);
			numResults = numResults + 1000;
		}		
	}	
	return invoicesArray;
}

function getAllCustomersArray() {
	var customerArray = new Array;
	
	var search = nlapiLoadSearch("customer", mothershipCustomerSearchID);
	var numResults = 1000;		
	var resultSet = search.runSearch();
	var searchresults = resultSet.getResults(0, numResults);	
	if(!!searchresults)	{
		while(!!searchresults && searchresults.length > 0) {
			for(var i = 0; i < searchresults.length; i++) {		
				var customerId = searchresults[i].getId();
				var customerName = searchresults[i].getValue(new nlobjSearchColumn("entityid"));
				var customerEmail = searchresults[i].getValue(new nlobjSearchColumn("email"));
				var customerPhone = searchresults[i].getValue(new nlobjSearchColumn("phone"));
				var upperCaseCustomerID = customerName.toUpperCase();				
				customerArray[upperCaseCustomerID] = new CustomerRecord(customerId, customerName, customerEmail, customerPhone);
			}
			searchresults = resultSet.getResults(numResults, numResults + 1000);
			numResults = numResults + 1000;
		}		
	}	
	return customerArray;
}

function getAllInventoryItems(orderChannelSkuId) {
	var itemArray = new Array();
	nlapiLogExecution("DEBUG", "mothershipItemSearchID", mothershipItemSearchID);
	var search = nlapiLoadSearch("customrecord_ad_mothership_item_match", mothershipItemSearchID);
	
	var numResults = 1000;		
	var resultSet = search.runSearch();
	var searchresults = resultSet.getResults(0, numResults);	
	if(!!searchresults && searchresults.length != 0)	{
		while(!!searchresults && searchresults.length > 0) {
			for(var i = 0; i < searchresults.length; i++) {					
				var itemName = searchresults[i].getValue("itemid","custrecord_ad_mothshipmatch_item");
				var mothershipID = searchresults[i].getValue("custrecord_ad_mothshipmatch_prodid");
				nlapiLogExecution("DEBUG", "mothershipID", mothershipID);
				itemArray[mothershipID] = itemName;
			}
			searchresults = resultSet.getResults(numResults, numResults + 1000);
			numResults = numResults + 1000;
		}		
	}
	else {
		throw "No items found with a Mothership Product ID.";
	}
	return itemArray;
}
/**
 * convertNameToFirstAndLast(recipientFullName)
 * 
 * @param recipientFullName
 * @returns {recipientFirstName,recipientLastName}
 */
function convertNameToFirstAndLast(recipientFullName) {
	var recipientFirstName = recipientFullName;
	var recipientLastName = "";
	if(!!recipientFullName) {
		var nameSplit = recipientFullName.split(" ");
		
		if(nameSplit.length == 2) {					
			recipientFirstName = nameSplit[0];
			recipientLastName = nameSplit[1];
		}
		else if(nameSplit.length > 2) {
			recipientFirstName = "";
			for(var k = 0; k < (nameSplit.length - 1); k++) {
				if(k > 0) {
					recipientFirstName = recipientFirstName + " ";
				}
				recipientFirstName = recipientFirstName + nameSplit[k];
			}
			recipientLastName = nameSplit[nameSplit.length - 1];
		}
	}
	return {recipientFirstName:recipientFirstName,recipientLastName:recipientLastName};
}

/**
 * getFileValue(file)
 * 
 * @param file
 * @returns
 */
function getFileValue(file){
    if(file.getType() == "EXCEL") return normalize(decodeBase64(file.getValue()));
    return normalize(file.getValue());
}

function normalize(val){ return val.replace("\r\n","\n");}


decodeBase64 = function(s) {
    var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
};

//This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function csvToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}


		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			var strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

/**
 * getMonthYearFolders(folderid)
 * 
 * @param folderid
 * @returns
 */
function getMonthYearFolders(folderid) {
	var today = new Date();
	var year = today.getFullYear();
	year = year.toString();
	var month = today.getMonth();
	month++;
	month = getMonthName(month.toString());
	var day = today.getDate();
	day = day.toString();
	todaytimestamp = today.toISOString();	
	var yearFolderId = createFolder(folderid, year);
	var monthFolderId = createFolder(yearFolderId, month);
	var dayFolderId = createFolder(monthFolderId, day);		
	return dayFolderId;
}

/**
 * createFolder(parentID,folderName)
 * 
 * @param parentID
 * @param folderName
 * @returns
 */
function createFolder(parentID,folderName)
{
	var folderId = parentID;
	var folder;
			
	var filtersFolders = new Array();
	filtersFolders[0] = new nlobjSearchFilter('name', null, 'is', folderName);
	
	if(!!parentID){
		filtersFolders[1] = new nlobjSearchFilter('parent', null, 'is', parentID); //folder parent
	}
		
	var foldersSearchResults = nlapiSearchRecord('folder', null, filtersFolders, null);
	
	if (foldersSearchResults != null) {
		folderId = foldersSearchResults[0].getId();			
	}
	else {
		folder = nlapiCreateRecord('folder');
		if(!!folder) {
    		folder.setFieldValue('parent', parentID);    
    		folder.setFieldValue('name', folderName);
    		folderId = nlapiSubmitRecord(folder);    		
		}  
	}
	return folderId;
}

/**
 * getMonthName(monthnumber)
 * 
 * @param monthnumber
 * @returns {String}
 */
function getMonthName(monthnumber) {
	switch (monthnumber) {
	case "1":
		return "Jan";
	case "2":
		return "Feb";
	case "3":
		return "Mar";
	case "4":
		return "Apr";
	case "5":
		return "May";
	case "6":
		return "Jun";
	case "7":
		return "Jul";
	case "8":
		return "Aug";
	case "9":
		return "Sep";
	case "10":
		return "Oct";
	case "11":
		return "Nov";
	case "12":
		return "Dec";
	}
}