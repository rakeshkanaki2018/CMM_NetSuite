/**
 * Ardeeja_Export_SOitems_To_Excel.js
 * 
 * This script file is used to create an Excel file that can be used for Retail Label Printing.
 * The Excel file will be temporarily stored in the file cabinet, and the user can download
 * the file by clicking on the file link in the file field on the Sales Order.
 * 
 * Version    Date            Author           
 * 1.00       20 Jun 2014     Ardeeka
 *
 */


/**
 * Export_Soitems_To_Excel()
 * 
 * This is the main function that gets the Excel data and creates the file to display on the Sales Order.
 * The function also deletes the original file so any existing orders no longer display the file.
 * 
 * @param folderid
 *  * 
 */
function Export_Soitems_To_Excel() {
	
	nlapiLogExecution("DEBUG", "Start");
	
	var retailLabelType = nlapiGetFieldText('custbody_ad_so_retaillbl_type');
	var context = nlapiGetContext();
	var folderid = context.getSetting('SCRIPT', 'custscript_ad_so_exportitemstoexcel_fold');
	
	/* Use for creating a CSV File
	 * 
	 * var excelData = CreateCSVFile();
	 * var fileType = "CSV";
	 * var filename = context.getSetting('SCRIPT', 'custscript_ad_so_exportitemstoexcel_name') + retailLabelType + ".csv";
	 */
	
	//Setup the Excel file with the data, type, and filename
	var excelData = CreateExcelFile();
	excelData = nlapiEncrypt(excelData, 'base64');	
	//var fileType = "XMLDOC";
	var fileType = "EXCEL";
	var filename = context.getSetting('SCRIPT', 'custscript_ad_so_exportitemstoexcel_name') + retailLabelType + ".xls";	
	
	var file = nlapiCreateFile(filename, fileType, excelData);
	file.setFolder(folderid);
	file.setEncoding("windows-1252");
		
	//Create and Delete the file to remove it from any existing Sales Order Records
	var fileId = nlapiSubmitFile(file);	
	nlapiDeleteFile(fileId);
	
	//Create the file again and set it on the Sales Order Record
	var fileId = nlapiSubmitFile(file);
	nlapiSetFieldValue("custbody_ad_so_retail_label_file", fileId, false);	
}

/**
 * CreateExcelFile()
 * 
 * This function will create the Excel String to be used for an xls format spreadsheet.
 * It will create a row for each item, so if an item has quantity 10, there will be 10 rows.
 * 
 * @returns {String}
 */
function CreateExcelFile()
{	
	var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>'; 
	xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
	xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
	xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
	xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
	xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">'; 

	xmlString += '<Worksheet ss:Name="Sheet1"><Table>';
	
	//Setup the Headers on the spreadsheet
	xmlString += '<Row>' +
	            	'<Cell><Data ss:Type="String">CUST_ITEM</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">RETAIL</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">UPC</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ITEM</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">CUST-NAME</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">COMPARE</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">CUST-BILL-NAME</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">CUST-BILL-1ST-12-NAME</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">CUST-BILL-ADDR-1</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">CUST-BILL-ADDR-2CUST-BILL-ADDR-3</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-SHIP-TO-NAME</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">1ST-DIGIT-ORDER-SHIP-TO</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-ADDR-LINE-1</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-ADDR-LINE-2</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-ADDR-LINE-3</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-PO-NUMBER</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER-REQ-DATE-YYYYMMDD</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">MATRIX-PACK-PER-UNIT</Data></Cell>' +
	            	'<Cell><Data ss:Type="String">ORDER/BO</Data></Cell>' +
	            '</Row>';

	var numLineItems = nlapiGetLineItemCount("item");
	var customerName = nlapiGetFieldText("entity");
	
	//Loop through all the items on the Sales Order
	for(var i = 1; i <= numLineItems; i++)
	{
		nlapiSelectLineItem("item", i);		
		var itemID = nlapiGetCurrentLineItemValue("item", "item");
		var itemName = nlapiGetCurrentLineItemText("item", "item");
		var customerRetailPrice = nlapiGetCurrentLineItemValue("item", "custcol_ad_so_customer_price");
		var itemDescription = nlapiGetCurrentLineItemValue("item", "description");		
		var quantity = nlapiGetCurrentLineItemValue("item", "quantity");
		var upcCode = nlapiLookupField("item", itemID, "upccode");		
		var customerItemDescription = nlapiLookupField("item", itemID, "salesdescription");
		
		// Add a row for each item
		for(var j = 0; j < quantity; j++)
		{
			xmlString += '<Row>' + 
							'<Cell><Data ss:Type="String">' + '' + '</Data></Cell>' + 
            				'<Cell><Data ss:Type="String">' + customerRetailPrice + '</Data></Cell>' + 
            				'<Cell><Data ss:Type="String">' + upcCode + '</Data></Cell>' + 
            				'<Cell><Data ss:Type="String">' + itemName + '</Data></Cell>' + 
            				'<Cell><Data ss:Type="String">' + customerName + '</Data></Cell>' +             				
            			 '</Row>';			
		}		
	}
	
	xmlString += '</Table></Worksheet></Workbook>';		
	
	return xmlString;
}

/**
 * CreateCSVFile()
 * 
 * This function will create the CSV String to be used for an csv format spreadsheet.
 * It will create a row for each item, so if an item has quantity 10, there will be 10 rows.
 * 
 * @returns {String}
 */
function CreateCSVFile()
{
	
	var CSVfileHeader = "CUST_ITEM,RETAIL,UPC,ITEM,CUST-NAME,COMPARE,CUST-BILL-NAME,CUST-BILL-1ST-12-NAME," +
			"CUST-BILL-ADDR-1,CUST-BILL-ADDR-2CUST-BILL-ADDR-3,ORDER-SHIP-TO-NAME,1ST-DIGIT-ORDER-SHIP-TO" +
			"ORDER-ADDR-LINE-1,ORDER-ADDR-LINE-2,ORDER-ADDR-LINE-3,ORDER-PO-NUMBER,ORDER-REQ-DATE-YYYYMMDD" +
			"MATRIX-PACK-PER-UNIT,ORDER/BO,\r\n";
	var CSVfileData = "";	
	
	var numLineItems = nlapiGetLineItemCount("item");
	var customerName = nlapiGetFieldText("entity");
	for(var i = 1; i <= numLineItems; i++)
	{
		nlapiSelectLineItem("item", i);		
		var itemID = nlapiGetCurrentLineItemValue("item", "item");
		var itemName = nlapiGetCurrentLineItemText("item", "item");
		var upcCode = nlapiLookupField("item", itemID, "upccode");
		var customerRetailPrice = nlapiGetCurrentLineItemValue("item", "custcol_ad_so_customer_price");
		var customerItemDescription = nlapiLookupField("item", itemID, "salesdescription");
		var itemDescription = nlapiGetCurrentLineItemValue("item", "description");		
		var quantity = nlapiGetCurrentLineItemValue("item", "quantity");
		
		// Add a row for each item
		for(var j = 0; j < quantity; j++)
		{
			CSVfileData = CSVfileData 
						+ "" + "," 
						+ FixFieldForCSV(customerRetailPrice) + "," 
						+ FixFieldForCSV(upcCode) + ","
						+ FixFieldForCSV(itemName) + "," 
						+ FixFieldForCSV(customerName);// + "," 
						//+ FixFieldForCSV(customerItemDescription) + "," 
						//+ FixFieldForCSV(itemDescription);
			CSVfileData = CSVfileData + "\r\n";
		}		
	}
	
	var CSVfileContent = CSVfileHeader + CSVfileData;
	
	return CSVfileContent;
}

/**
 * FixFieldForCSV(fieldValue)
 * 
 * This function takes a field value and escapes any double quotes and adds quotes around
 * the entire value to allow comma's within the value and returns the resulting value.
 * 
 * @param fieldValue
 * @returns newFieldValue
 */
function FixFieldForCSV(fieldValue)
{
	var newFieldValue = fieldValue;
	
	newFieldValue = newFieldValue.replace(/"/g, '""');
	newFieldValue = '"' + newFieldValue + '"';
	
	return newFieldValue;
}
