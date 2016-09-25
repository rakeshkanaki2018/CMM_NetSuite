/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Oct 2014     Ardeeka
 *
 */

function InventoryItem(item, quantity, units, description) {
    this.item= item;
    this.quantity= quantity;
    this.units= units;
    this.description= description;    
    
}

/**
 * createWorkOrders()
 * 
 * @returns {Void} Any or no return value
 */
function createBOMTicket() {
	
	nlapiLogExecution("DEBUG", "Start");
	var context = nlapiGetContext();
	var folderid = context.getSetting('SCRIPT', 'custscript_ad_crtbom_folderid');
	
	try {
		var originalFileId = nlapiGetFieldValue("custbody_ard_cons_bom_file");
	    var originalFile = nlapiLoadFile(originalFileId);
		if(!!originalFile) {
			nlapiDeleteFile(originalFile.getId());
		}
	}
	catch(e) {
		nlapiLogExecution("DEBUG", "Error", e.message);
	}
			
	var xml = createPDFXML();
	createPDFFile(xml, folderid);
	
}

function createPDFXML() {
	var subsidiary = nlapiGetFieldValue("subsidiary");
	var subsidiaryRec = nlapiLoadRecord("subsidiary", subsidiary);
	var subsidiaryLogo = subsidiaryRec.getFieldValue("logo");
	var imageURL = "/core/media/media.nl?id=35&amp;c=3703754&amp;h=e75c35fa6f0646d6b176";
	if(!!subsidiaryLogo) {
		imageURL = nlapiEscapeXML(nlapiLoadFile(subsidiaryLogo).getURL());
	}
	nlapiLogExecution("DEBUG", "imageURL", nlapiEscapeXML(imageURL));
	
	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">" +
			 "\n<pdf>\n" +
			 	"<head>" +
			 		"<style>" +
			 			"div.imagewithtable {width:100%;height:220px}" +
			 			"div.titlewithtable {position:absolute;left:50%;width:50%;margin:0px;padding:0px;}" +
			 			".imagewithbarcode {  position:absolute;} " +
			 			"img {  margin-bottom:10px;} " +
			 			"barcode {  margin:20px 0px;} " +
			 			"p.title { margin-top:0px;padding:0px;font-size:20;font-weight:bold }" +
			 			"p.itemtitle { margin:0px;padding:5px;font-size:12;font-weight:bold;text-align:center; }" +
			 			//"table.header { position:absolute;left:60%;width:40% }" +	
			 			"table.header td { white-space:normal;overflow: hidden;}" +
			 			"table.items { font-size:9pt; width:100%; border: 1px solid black; border-collapse:collapse;margin-bottom:10px}" +			 			
			 			"table.items th { border: 1px solid black; padding:2px; background-color: #F0F0F0; white-space:nowrap;font-weight:bold}" +			 			
			 			"table.items td { border: 1px solid black; white-space:normal;overflow: hidden;}" +			 			
			 		"</style>" +
			 	"</head>" +
			 	"<body size=\"letter\" margin=\"0.0in\" font-size=\"12\">" +
			 		"<div class=\"imagewithtable\">" +
			 			"<div>" +
			 				"<img src=\"" + imageURL + "\"/>" +			 				
			 			"</div>" +			 			
			 			"<div class=\"titlewithtable\">" +
			 				"<p class=\"title\">Bill Of Materials</p>" +			 				
			 				"<table class=\"header\" >" +			 					
			 					"<tr>" +
			 						"<td>" + "<b>Date</b>" +"</td>" +
			 						"<td>" + nlapiGetFieldValue("trandate") +"</td>" +
			 					"</tr>" +
			 					"<tr>" +
	 								"<td>" + "<b>Customer</b>" +"</td>" +
	 								"<td>" + convertHTMLAscii(nlapiGetFieldText("entity")) +"</td>" +
	 							"</tr>" +
	 							"<tr>" +
 									"<td>" + "<b>Retail Label</b>" +"</td>" +
 									"<td><span>" + convertHTMLAscii(nlapiGetFieldText("custbody_ad_so_custlbl_markup")) +"</span></td>" +
 								"</tr>" +
	 							"<tr>" +
		 							"<td>" + "<b>Order #</b>" +"</td>" +
		 							"<td>" + convertHTMLAscii(nlapiGetFieldValue("tranid")) +"</td>" +
		 						"</tr>" +		 						
		 					"</table>" +		 					
		 					"<barcode codetype=\"code128\" showtext=\"true\" value=\" " + nlapiGetFieldValue("tranid") + " \"/>" +		 					
		 				"</div>" +
			 		"</div>";
			 		
	xml = addItemsToXML(xml);		 					
	xml = xml + "</body></pdf>";	
	return xml;
}

function addItemsToXML(xml) {
	var assemblyTableXML = "";
	var inventoryTableXML = "";
	
	var inventoryItemsArray = new Array();
	var inventoryItemsValuesArray = new Array();
	
	
	inventoryTableXML = 
		"<p class=\"itemtitle\">Inventory Item Totals</p>" +
		"<table class=\"items\">" +	
			"<thead>" +
				"<tr>" +	    
					"<th>" + "Inventory Item" +"</th>" +
					"<th>" + "Total Qty. Required" +"</th>" +
					"<th>" + "Units" +"</th>" +
					"<th>" + "Description" +"</th>" +		 					
				"</tr>" +
			"</thead>";
	
	assemblyTableXML = 
		"<p class=\"itemtitle\">Assembly Item Build</p>" +
		"<table class=\"items\">" +
			"<thead>" +
				"<tr>" +
					"<th>" + "Assembly Item" +"</th>" +	
					"<th>" + "Assembly Qty." +"</th>" +	
					"<th>" + "Inventory/Assembly Item" +"</th>" +
					"<th>" + "Qty. Required" +"</th>" +			 					
				"</tr>" +
			"</thead>";
	
	var workOrderInternalIds = new Array();
	var assemblyItems = new Array();
	var assemblyQuantities = new Array();
	
	var searchFilters = new Array();
	searchFilters.push(new nlobjSearchFilter("createdfrom", null, "is", nlapiGetRecordId()));
	
	var searchColumns = new Array();
	searchColumns.push(new nlobjSearchColumn("item"));
	searchColumns.push(new nlobjSearchColumn("quantity"));
	searchColumns.push(new nlobjSearchColumn("unit"));
	searchColumns.push(new nlobjSearchColumn("type","item"));
	
	
	var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);
	if(!!searchresults) {
		for(var i = 0, j = searchresults.length; i < j; i++) {
			var internalId = searchresults[i].getId();
			workOrderInternalIds.push(internalId);
			var itemType = searchresults[i].getValue("type", "item");			
			assemblyItems[internalId] = convertHTMLAscii(searchresults[i].getText(new nlobjSearchColumn("item")));
			//nlapiLogExecution("DEBUG", "itemType Assembly", "Item:" + assemblyItems[internalId] + " Type:" + itemType);
			assemblyQuantities[internalId] = searchresults[i].getValue(new nlobjSearchColumn("quantity"));						
		}
	}
	
	var searchFilters = new Array();
	searchFilters.push(new nlobjSearchFilter("internalid", null, "anyof", workOrderInternalIds));
	searchFilters.push(new nlobjSearchFilter("account", null, "noneof", "145"));
	searchFilters.push(new nlobjSearchFilter("quantity", null, "greaterthan", "0"));
	
	var searchColumns = new Array();
	searchColumns.push(new nlobjSearchColumn("item"));
	//searchColumns.push(searchColumns[0].setSort());
	searchColumns.push(new nlobjSearchColumn("quantity"));
	searchColumns.push(new nlobjSearchColumn("unit"));
	searchColumns.push(new nlobjSearchColumn("memo"));
	searchColumns.push(new nlobjSearchColumn("type","item"));
	
	var searchresults = nlapiSearchRecord("workorder", null, searchFilters, searchColumns);
	if(!!searchresults) {
		var previousAssemblyItem = null;
		var previousAssemblyTableXML = "";
		var numInventoryItems = 0;
		var currentAssemblyItem = null;
		var currentAssemblyQuantity = null;
		for(var i = 0, j = searchresults.length; i < j; i++) {
			var internalId = searchresults[i].getId();
			var assemblyItem = searchresults[i].getText(new nlobjSearchColumn("item"));
			assemblyItem = convertHTMLAscii(assemblyItem);
			var itemType = searchresults[i].getValue("type", "item");
			if(itemType != "InvtPart" && itemType != "Assembly") {
				continue;
			}
                       //nlapiLogExecution("DEBUG", "itemType Inventory", "CurrentAssembly" + assemblyItems[internalId] + "Item:" + assemblyItem + " Type:" + itemType);
			if(assemblyItem == assemblyItems[internalId] && itemType == "Assembly") {
				continue;
			}
			//nlapiLogExecution("DEBUG", "itemType Inventory", "Item:" + assemblyItem + " Type:" + itemType);
			var assemblyQuantity = searchresults[i].getValue(new nlobjSearchColumn("quantity"));
			var assemblyUnit = searchresults[i].getValue(new nlobjSearchColumn("unit"));
			var assemblyMemo = searchresults[i].getValue(new nlobjSearchColumn("memo"));
			assemblyMemo = convertHTMLAscii(assemblyMemo);
			
			var inventoryItemObj = inventoryItemsValuesArray[assemblyItem];
			
			if(!!inventoryItemObj) {
				nlapiLogExecution("DEBUG", "quantity", inventoryItemObj.quantity);
				inventoryItemObj.quantity = inventoryItemObj.quantity*1 + assemblyQuantity*1;				
				inventoryItemsValuesArray[assemblyItem] = inventoryItemObj;
			}
			else {
				if(itemType == "InvtPart") {
					inventoryItemsArray.push(assemblyItem);
					inventoryItemsValuesArray[assemblyItem] = new InventoryItem(assemblyItem, assemblyQuantity, assemblyUnit, assemblyMemo);
				}				
			}
			
			if(previousAssemblyItem != assemblyItems[internalId] && previousAssemblyItem != null) {	
				var mergedRowXML =	"<tr>" +
									"<td rowspan=\"" + numInventoryItems + "\">" + currentAssemblyItem +"</td>" +
									"<td rowspan=\"" + numInventoryItems + "\">" + currentAssemblyQuantity +"</td>";				
				assemblyTableXML =  assemblyTableXML + mergedRowXML + previousAssemblyTableXML;
				
			}
			
			if(previousAssemblyItem != assemblyItems[internalId]) {
				currentAssemblyItem = assemblyItems[internalId];
				currentAssemblyQuantity = assemblyQuantities[internalId];	
				numInventoryItems = 0;
				previousAssemblyTableXML = "";
				
			}
			else {
				previousAssemblyTableXML = previousAssemblyTableXML + "<tr>";
			}
			numInventoryItems++;
			if(itemType == "Assembly") {
				assemblyItem  = "<b>" + assemblyItem + "</b>";
				assemblyQuantity  = "<b>" + assemblyQuantity + "</b>";
			}
			previousAssemblyTableXML = previousAssemblyTableXML + 
										"<td>" + assemblyItem +"</td>" +
										"<td>" + assemblyQuantity +"</td>" +
										"</tr>";
			
			previousAssemblyItem = assemblyItems[internalId];
			
		}
		var mergedRowXML =	"<tr>" +
							"<td rowspan=\"" + numInventoryItems + "\">" + currentAssemblyItem +"</td>" +
							"<td rowspan=\"" + numInventoryItems + "\">" + currentAssemblyQuantity +"</td>";		
		assemblyTableXML =  assemblyTableXML + mergedRowXML + previousAssemblyTableXML;
				
	}
	for(var i = 0, j = inventoryItemsArray.length; i < j; i++) {
		var inventoryItem = inventoryItemsArray[i];
		var inventoryItemObj = inventoryItemsValuesArray[inventoryItem];
		inventoryTableXML = inventoryTableXML +	"<tr>" +		
				"<td>" + inventoryItemObj.item +"</td>" +
				"<td>" + inventoryItemObj.quantity +"</td>" +
				"<td>" + inventoryItemObj.units +"</td>" +
				"<td>" + inventoryItemObj.description +"</td>" +							
			"</tr>";	
	}
	inventoryTableXML = inventoryTableXML + "</table>";
	assemblyTableXML = assemblyTableXML + "</table>";
	
	xml = xml + inventoryTableXML + assemblyTableXML;
	return xml;
}
function createPDFFile(xml, folderid) {	
	var file = nlapiXMLToPDF( xml );
	file.setName(nlapiGetFieldValue("tranid") + "-ConsolidatedBOM.pdf");
	folderid = getFolderId(folderid);
	file.setFolder(folderid);
	var fileId = nlapiSubmitFile(file);
	
	nlapiSetFieldValue("custbody_ard_cons_bom_file", fileId, false);
}

function getFolderId(folderid)
{	
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth();
	month++;
	var day = date.getDate();	
	var monthDay = month + "-" + day;	
	year = year.toString();
	
	var yearFolderId = createFolder(folderid,year);
	var monthDayFolderId = createFolder(yearFolderId,monthDay);
	
	return monthDayFolderId;	
}

function createFolder(parentID,folderName)
{
	var folderId = null;
	var folder;
	nlapiLogExecution("DEBUG", "parentID", parentID);
	nlapiLogExecution("DEBUG", "folderName", folderName);
		
	var filtersFolders = new Array();
	filtersFolders[0] = new nlobjSearchFilter('name', null, 'is', folderName); //year folder
	
	if(parentID > 0 )
	{
		filtersFolders[1] = new nlobjSearchFilter('parent', null, 'is', parentID); //folder parent
	}
		
	var foldersSearchResults = nlapiSearchRecord('folder', null, filtersFolders, null);
	
	if (foldersSearchResults != null) 
	{
		folderId = foldersSearchResults[0].getId();
			
	}
	else
	{
		folder = nlapiCreateRecord('folder');
		if(folder)
		{
    		folder.setFieldValue('parent', parentID);    
    		folder.setFieldValue('name', folderName);
    		folderId = nlapiSubmitRecord(folder);
    		
		}  
	}
	return folderId;
}

function convertHTMLAscii(value) {
	value = value.replace(/&/g, '&amp;');
	value = value.replace(/</g, '&lt;');
	value = value.replace(/>/g, '&gt;');
	return value;
}
