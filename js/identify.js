// The code snippets in Identify.js will be used to display the Pop-ups as well as the results in the left panel (when Identify tool is active - Logged-in users)
// Function called once a map onClick event is fired
function doIdentify(evt){
    map.graphics.clear();
    map.infoWindow.hide();

	// This variable is the list of pre-defined layers for Identify task (to show Pop-ups)
    // This had to be changed if the Layer IDs are changed in the map document/service
	popupLayerIds=[15,11,139,129,48,49,50,51,29,30,31,32,7,93,92,19,20,23,22,112,79]; //Tree 1128minus(15), Web Cameras(11), Projects(139), UA Sites Statewide(129), Bicycle Parking(48,49,50,51), CatTran Shuttle Stops(29,30,31,32), Public Art(7), Greek Houses(93), UA Residence Life Housing(92), Places to Eat (19,20), Automated External Defibrillators1128 (23), Audible Devices (22), Outdoor Destinations (112), Historic Buildings

	identifyParams.layerIds=[];

    // Check if the layers are turned ON and visible in the map before passing it to the Identify task
	$.each(popupLayerIds,function(index,value){
		if ((jQuery.inArray(value,map.getLayer("opLayer").visibleLayers) !== -1) || (jQuery.inArray(value,map.getLayer("transparent30OpLayer").visibleLayers) !== -1) || (jQuery.inArray(value,map.getLayer("transparent60OpLayer").visibleLayers) !== -1)){
			if (jQuery.inArray(value,visibleLayerIds) !== -1){
				identifyParams.layerIds.push(value);
			}
		}
	});
	identifyParams.layerIds.push(74,128); //By default, Identify works on Buildings(74) and Parking Lots(128) layer -- THIS IS FOR INFOWINDOW/FLYOUT -- Doesn't require the layer to be turned ON

	identifyParams.tolerance = 5;
    identifyParams.returnGeometry = true;
    identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE; //http://forums.arcgis.com/threads/49289-IdentifyParameters.LAYER_OPTION_VISIBLE-still-gives-identify-results-on-all-layers
    identifyParams.width  = map.width;
    identifyParams.height = map.height;

    identifyParams.geometry = evt.mapPoint; // Pass the map onClick point as an input to the Identify task
    identifyParams.mapExtent = map.extent;
    var identifyDeferred=identifyTask.execute(identifyParams);


    // Runs once Identify task is complete
    // Identify task returns a Dojo deferred object, this is then looped through to create an array of features (geometry + attributes)
    identifyDeferred.addCallback(function(identifyResults){

    	return dojo.map(identifyResults,function(identifyResult){

            var feature=identifyResult.feature;
    		feature.attributes.layerName=identifyResult.layerName;


            if (identifyTool || identifyResultsPanelOpen){ // If Identify tool is active OR Identify results panel (left) is Open, add the graphic to the map and show the attributes in the left panel.

                // Override the default symbols to show up the Identify results features in a unique symbology
                SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
                SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
                SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([171,0,131]), 2),new dojo.Color([255,1,196,0.8]));

                // Symbolize the Identified features
                var graphic = feature;
                if (graphic.geometry.type=="point"){
                    graphic.setSymbol(SimpleMarkerSymbol);

                }else if (graphic.geometry.type=="polyline"){
                    graphic.setSymbol(SimpleLineSymbol);

                }else if (graphic.geometry.type=="polygon" || graphic.geometry.type=="extent"){
                    graphic.setSymbol(SimpleFillSymbol);

                }

                // Add these features to the map and call the function to show the results in a table format in left panel
                map.graphics.add(graphic);
                openLeftPanel(identifyResults);

            } else { // Build the Infotemplate only if Identify tool isn't active.

                if (identifyResult.layerName==='Buildings') { // Since the fields displayed in Pop-ups are layer based, a check is made with the Layer name (MUST MATCH THE ONES IN REST ENDPOINT)

                    // http://forums.arcgis.com/threads/55036-Hide-values-in-infoWindow-Popup-if-value-null
                    // This method is done in order to display the values if they are not "Null" in the database
                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content+="<div class='infoContentDiv'><h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["Address"]!=="Null"){
                        content+="<p class='infoPara'> ${Address} <br/>";
                    }
                    if (attributes["SpaceNumLetter"]!=="Null"){
                        content+="Building No: ${SpaceNumLetter} <br/>";
                    }
                    if (attributes["SpaceNumLetter"]=="100"){
                        content+="Phone Number: (520) 621-8273 <br/>";
                        content+="Emergencies: DIAL 911 <br/><br/>";
                    }
                    content+="<img class='img_panel' src='http://maps.arizona.edu/WebBuildingPhotos/${SpaceNumLetter}.jpg' onerror='missingBuildingPhoto(this);'/></div>";
                    content+='<a href="javascript:openSharePanel()">Share</a> | ';
                    content+='<a href="javascript:openEmbedPanel()">Embed Map</a>';

                    var template = new esri.InfoTemplate("Building Info", content); // Generate Info template content and assign it to the feature
                    feature.setInfoTemplate(template);

                    if (isLoggedIn){ // If the application is in logged-in state, show a tabbed view for Buildings layer. This is currently done only for Buildings. More layers to come.
                        var tabBar= "<div data-role='controlgroup' data-type='horizontal'><a data-role='button' data-corners='false' class='tab_info' id='info_home' title='Home' ></a>"+
                            "<a data-role='button' data-corners='false' class='tab_info' id='info_bi' title='Campus_BI' ></a>"+
                            "<a data-role='button' data-corners='false' class='tab_info' id='info_infra' title='Infra' ></a>"+
                            "<a data-role='button' data-corners='false' class='tab_info' id='info_emergency' title='Emergency' ></a></div>";
                        feature.setInfoTemplate(new esri.InfoTemplate("Building Info", tabBar+feature.getContent()));
                    }

                } else if (identifyResult.layerName==='Parking Lots'){ // Pop-ups for Parking lots

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["PTSNum"]!=="Null"){
                        content="<h2 class='infoHeader'> Lot Number: ${PTSNum} </h2>";
                    }
                    if (attributes["Category"]!=="Null"){
                        content+="<p class='infoPara'> Lot Type: ${Category} <br/>";
                    }
                    content+="</br/><strong>Space Count</strong> </br/>";
                    
                    if (attributes["CountZ1"]!=="Null"){
                        content+="<p class='infoPara'> Zone 1: ${CountZ1} <br/>";
                    }
                    if (attributes["CountLS"]!=="Null"){
                        content+="<p class='infoPara'> Lot Specific: ${CountLS} <br/>";
                    }
                    if (attributes["CountSSL"]!=="Null"){
                        content+="<p class='infoPara'> SSL: ${CountSSL} <br/>";
                    }
                    if (attributes["CountStSpecific"]!=="Null"){
                        content+="<p class='infoPara'> St Specific: ${CountStSpecific} <br/>";
                    }
                    if (attributes["CountGarage"]!=="Null"){
                        content+="<p class='infoPara'> Garage: ${CountGarage} <br/>";
                    }
                    if (attributes["CountService"]!=="Null"){
                        content+="<p class='infoPara'> Service: ${CountService} <br/>";
                    }
                    if (attributes["CountLoading"]!=="Null"){
                        content+="<p class='infoPara'> Loading: ${CountLoading} <br/>";
                    }
                    if (attributes["CountHC"]!=="Null"){
                        content+="<p class='infoPara'> Disabled: ${CountHC} <br/>";
                    }
                    if (attributes["CountRes"]!=="Null"){
                        content+="<p class='infoPara'> Reserved: ${CountRes} <br/>";
                    }
                    if (attributes["CountCP"]!=="Null"){
                        content+="<p class='infoPara'> CP: ${CountCP} <br/>";
                    }
                    if (attributes["CountMC"]!=="Null"){
                        content+="<p class='infoPara'> Motorcycle: ${CountMC} <br/>";
                    }
                    if (attributes["CountMeterPBS"]!=="Null"){
                        content+="<p class='infoPara'> Meter: ${CountMeterPBS} <br/>";
                    }
                    if (attributes["CountHCMeterPBS"]!=="Null"){
                        content+="<p class='infoPara'> Meter Disabled: ${CountHCMeterPBS} <br/>";
                    }
                    if (attributes["CountMCMeterPBS"]!=="Null"){
                        content+="<p class='infoPara'> Meter MC: ${CountMCMeterPBS} <br/>";
                    }
                    if (attributes["CountVisitor"]!=="Null"){
                        content+="<p class='infoPara'> Visitor: ${CountVisitor} <br/>";
                    }
                    if (attributes["CountG10Min"]!=="Null"){
                        content+="<p class='infoPara'> Garage 10Min: ${CountG10Min} <br/>";
                    }
                    if (attributes["CountOther"]!=="Null"){
                        content+="<p class='infoPara'> Other: ${CountOther} <br/>";
                    }
                    if (attributes["CountLeased"]!=="Null"){
                        content+="<p class='infoPara'> Leased: ${CountLeased} <br/>";
                    }

                    if (attributes["Address"]!=="Null"){
                        content+="<br/>${Address} <br/>";
                    }
                    content+="More Info: <a href='http://parking.arizona.edu' target='_blank'>UA Parking</a> </p>";


                    var template = new esri.InfoTemplate("Parking Lot Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Tree 1128minus'){ // Pop-ups for Tress

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["CommonName"]!=="Null"){
                        content="<h2 class='infoHeader'> ${CommonName} </h2>";
                    }
                    if (attributes["Genus"]!=="Null" && attributes["SpecificEpithet"]!=="Null"){
                        content+="<p class='infoPara'> Botanical Name: ${Genus} ${SpecificEpithet} <br/>";
                    }
                    if (attributes["AccessionID"]!=="Null"){
                        content+="Plant ID Number: ${AccessionID} </p>";
                    }

                    var template = new esri.InfoTemplate("Arboretum Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Web Cameras'){ // Pop-ups for Web Cameras

                    var content="";
                    var attributes=feature.attributes;
                    if (attributes["PointedAt"]!=="Null"){
                        content="<h2 class='infoHeader'> Building Number Pointed At: ${PointedAt} </h2>";
                    }
                    if (attributes["Label"]!=="Null"){
                        content+="<p class='infoPara'> Camera Location: ${Label} <br/>";
                    }
                    if (attributes["Webpage"]!=="Null"){
                        content+="More Info: <a href='${Webpage}' target='_blank'>View Cam</a> ";
                    }

                    var template = new esri.InfoTemplate("Project Web Cam", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Projects'){ // Pop-ups for Projects

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["title"]!=="Null"){
                        content="<h2 class='infoHeader'> ${title} </h2>";
                    }
                    if (attributes["project_num"]!=="Null"){
                        content+="<p class='infoPara'> Project #: ${project_num} <br/>";
                    }
                    if (attributes["start_date"]!=="Null" || attributes["end_date"]!=="Null"){
                        content+="Forecasted Construction: "+ formatDate(attributes["start_date"]) + " - " + formatDate(attributes["end_date"]) +" <br/>";
                    }
                    if (attributes["status"]!=="Null"){
                        content+="Status: ${status} <br/>";
                    }
                    if (attributes["URL"]!=="Null"){
                        content+="More Info: <a href='${URL}' target='_blank'>Project Details</a> </p>";
                    }
                    if (attributes["project_num"]!=="Null"){
                        content+='<br/><a href="http://www.pdc.arizona.edu:1982/Default.aspx?Project='+ attributes["project_num"] +'" target="_blank">Emergency Contact Information</a>';
                    }


                    var template = new esri.InfoTemplate("Project Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='UA Sites Statewide'){ // Pop-ups for UA Sites Statewide

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["Address"]!=="Null"){
                        content+="<p class='infoPara'> ${Address} <br/>";
                    }
                    if (attributes["County"]!=="Null"){
                        content+="County: ${County} <br/>";
                    }
                    if (attributes["URL"]!=="Null"){
                        content+="Site Website: <a href='${URL}' target='_blank'>Site Website</a> </p>";
                    }

                    var template = new esri.InfoTemplate("UA State Sites", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Bicycle Parking564' || identifyResult.layerName==='Bicycle Parking1128' || identifyResult.layerName==='Bicycle Parking2257' || identifyResult.layerName==='Bicycle Parking4514'){ // Pop-ups for Bicycle parking

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Type"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Type} </h2>";
                    }
                    if (attributes["Spaces"]!=="Null"){
                        content+="<p class='infoPara'> Number of Spaces: ${Spaces} <br/>";
                    }
                    if (attributes["RackType"]!=="Null"){
                        content+="Rack Type: ${RackType} <br/>";
                    }
                    content+="More Info: <a href='http://parking.arizona.edu/alternative/indexBike.php' target='_blank'>Parking Details</a> </p>";

                    var template = new esri.InfoTemplate("Bike Parking Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='CatTran Shuttle Stops564' || identifyResult.layerName==='CatTran Shuttle Stops1128' || identifyResult.layerName==='CatTran Shuttle Stops2257' || identifyResult.layerName==='CatTran Shuttle Stops4514'){ // Pop-ups for CatTran shuttle stops

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["TimedStopName"]!=="Null"){
                        content="<h2 class='infoHeader'> ${TimedStopName} </h2>";
                    }
                    if (attributes["RoutesServed"]!=="Null"){
                        content+="<p class='infoPara'> Routes Served: ${RoutesServed} <br/>";
                    }
                    content+="Schedule Info: <a href='http://parking.arizona.edu/alternative/cattran.php' target='_blank'>Route Schedules</a> </p>";

                    var template = new esri.InfoTemplate("Cat Tran Stop Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Public Art'){ // Pop-ups for Public art

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${name} </h2>";
                    }
                    if (attributes["artist"]!=="Null"){
                        content+="<p class='infoPara'> Artist: ${artist} <br/>";
                    }
                    if (attributes["type"]!=="Null"){
                        content+="Art Type: ${type} <br/> </p>";
                    }

                    var template = new esri.InfoTemplate("Public Art Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Greek Houses'){ // Pop-ups for Greek houses

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["Address"]!=="Null"){
                        content+="<p class='infoPara'> ${Address} <br/>";
                    }
                    if (attributes["GreekType"]!=="Null"){
                        content+="Greek Type: ${GreekType} <br/></p>";
                    }

                    var template = new esri.InfoTemplate("Greek House Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='UA Residence Life Housing') { // Pop-ups for UA Residence Life Housing

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["Address"]!=="Null"){
                        content+="<p class='infoPara'> ${Address} <br/><br/>";
                    }
                    content+="<img class='img_panel' src='http://maps.arizona.edu/WebBuildingPhotos/${SpaceNumLetter}.jpg' onerror='missingBuildingPhoto(this);'/>";

                    var template = new esri.InfoTemplate("Residence Hall Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==='Places To Eat1128' || identifyResult.layerName==='Places To Eat2257') {

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${name} </h2>";
                    }
                    if (attributes["building_name"]!=="Null"){
                        content+="<p class='infoPara'> ${building_name} <br/>";
                    }
                    if (attributes["url"]!=="Null"){
                        content+="More Info: <a href='${url}' target='_blank'>Restaurant Website</a> </p>";
                    }

                    var template = new esri.InfoTemplate("Places to Eat", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==="Automated External Defibrillators1128") {

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["BuildingNum"]!=="Null"){
                        content="<h2 class='infoHeader'> Building Number: ${BuildingNum} </h2>";
                    }
                    if (attributes["Floor"]!=="Null"){
                        content+="<p class='infoPara'> Floor: ${Floor} <br/>";
                    }

                    var template = new esri.InfoTemplate("Automated External Defibrillator", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==="Audible Device Classrooms1128") {

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["name"]!=="Null"){
                        content="<h2 class='infoHeader'> Device Location: ${name} </h2>";
                    }
                    if (attributes["building_name"]!=="Null"){
                        content+="<p class='infoPara'> Building: ${building_name} <br/>";
                    }
                    if (attributes["url"]!=="Null"){
                        content+="<a href='${url}' target='_blank'>More Info</a> </p>";
                    }

                    var template = new esri.InfoTemplate("Audible Device", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==="Outdoor Destinations") {

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["Type"]!=="Null"){
                        content+="<p class='infoPara'> Open Space Type: ${Type} <br/>";
                    }
                    if (attributes["MajorOpenSpaceID"]!=="Null"){
                        content+="<p class='infoPara'> Open Space ID: ${MajorOpenSpaceID} <br/>";
                    }

                    var template = new esri.InfoTemplate("Outdoor Destination Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } else if (identifyResult.layerName==="Historic Buildings") {

                    var content="";

                    var attributes=feature.attributes;
                    if (attributes["Name"]!=="Null"){
                        content="<h2 class='infoHeader'> ${Name} </h2>";
                    }
                    if (attributes["SpaceNum"]!=="Null"){
                        content+="<p class='infoPara'> Building Number: ${SpaceNum} <br/>";
                    }
                    if (attributes["OriginalConstructionDate"]!=="Null"){
                        content+="<p class='infoPara'> Original Construction Date: ${OriginalConstructionDate} <br/>";
                    }
                    if (attributes["HistoricRegisterAddDate"]!=="Null"){
                        content+="<p class='infoPara'> Date Added to Historic Register: ${HistoricRegisterAddDate} <br/>";
                    }
                    if (attributes["Architect"]!=="Null"){
                        content+="<p class='infoPara'> Architect: ${Architect} <br/>";
                    }
                    if (attributes["Style1"]!=="Null"){
                        content+="<p class='infoPara'> Style: ${Style1} <br/><br/>";
                    }
                    content+="<img class='img_panel' src='http://maps.arizona.edu/WebBuildingPhotos/${SpaceNumLetter}.jpg' onerror='missingBuildingPhoto(this);'/>";

                    var template = new esri.InfoTemplate("Historic Building Info", content);
                    feature.setInfoTemplate(template); // Check for null values and assign the Info template to the feature

                } // End of Info template

            } // End of Identify tool check


    		return feature;
    	}); // End of Dojo.map



    }); // End of Dojo deferred callback function



    // Once deferred is complete, show the Pop-ups showing the attribute information
    identifyDeferred.then(function(value){
        // If Identify Feature tool is clicked/active, don't open the info window. Open the Left panel to display the results.
        if (identifyTool || identifyResultsPanelOpen){
            //openLeftPanel(identifyResults);

        //NOT SURE WHY THIS WAS CHECKING FOR WINDOW WIDTH COMMENTING OUT.
        //} else if (value.length >= 1 && $(window).width() >= 768) {
        } else if (value.length >= 1)  {
            
            // Show Pop-ups only on Tablets and desktop browsers: http://css-tricks.com/snippets/css/media-queries-for-standard-devices/
            map.infoWindow.setFeatures([ identifyDeferred ]);

            // if doIdentify was called from a mouse click
            if(evt.screenPoint != null) {
                map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
            }
            else { //doIdentify was called from toc.js. The "click" that opens the InfoWindow is being programatically clicked from the querystring.
                map.infoWindow.show(map.toScreen(evt.mapPoint), map.getInfoWindowAnchor(map.toScreen(evt.mapPoint)));
            }
        }
    });



} // End of doIdentify function


// Function called when Identify task is failed
function identifyFailed(){

}

// This is only for Buildings layer in logged-in state. When different tabs in the pop-ups are clicked, this function is called to change their information
function tabChange(feature,domNode){

	tabId=domNode[0].id;
	if (tabId=="info_home"){ // Home tab
		$(".infoContentDiv").empty();
		$(".infoContentDiv").append("<h2 id='infoHeader'>"+feature.attributes["Name"]+"</h2>"+
			"<p id='infoPara'>"+feature.attributes["Address"]+ "</br><br/></p>"+
			"<img class='img_panel' src='http://maps.arizona.edu/WebBuildingPhotos/"+feature.attributes["SpaceNumLetter"]+".jpg' onerror='missingBuildingPhoto(this);'/>");

	} else if (tabId=="info_bi"){ // Campus BI tab
		$(".infoContentDiv").empty();
		$(".infoContentDiv").append("<h2 id='infoHeader'>"+feature.attributes["Name"]+"</h2>"+
			"<p id='infoPara'>BuildingID: "+feature.attributes["BID"]+ "<br/><br/><a href='http://pdc-web.catnet.arizona.edu:1980/Default.aspx?Building=" +feature.attributes["BID"]+
            "' target='_blank'>Download Drawings</a><br/></p>");

	} else if (tabId=="info_infra"){ // Infrastructure tab
		$(".infoContentDiv").empty();
		$(".infoContentDiv").append("<h2 id='infoHeader'>"+feature.attributes["Name"]+"</h2>"+
			"<p id='infoPara'>Building Use: "+feature.attributes["BuildingUse"]+ "<br/></p>");

	} else if (tabId=="info_emergency"){ // Emergency tab
		$(".infoContentDiv").empty();
		$(".infoContentDiv").append("<h2 id='infoHeader'>"+feature.attributes["Name"]+"</h2>"+
			"<p id='infoPara'>Label Level: "+feature.attributes["LabelLevel"]+"<br/></p>");

	}

}

// When Identify tool is active, the map onClick event should show up the attributes in the Identify results panel (left). openLeftPanel function is used to perform this task.
function openLeftPanel(identifyResults){

    // Open Left panel and clear existing contents
    $('#identify-results').panel('open');
    $('#identifyLayerSelect').remove();


    // Add a drop-down list of layers (from Identify results)
    var identifyLayerSelect= $('<select/>');
    identifyLayerSelect.attr('id','identifyLayerSelect');

    for (var i=0;i<identifyResults.length;i++){
    	identifyLayerSelect.append($('<option id="identifyResult_'+i+'"/>').html(identifyResults[i].layerName));
    }

    $('#identifyResultsHeader').append(identifyLayerSelect);
    $('#identifyResultsHeader').trigger('create');

    // Generate HTML table dynamically to show all the attributes corresponding to the feature
    $('#identifyLayerSelect').change(function(){
    	createIdentifyTable(identifyResults[this.selectedIndex].feature);
    });

    createIdentifyTable(identifyResults[0].feature); // Call function to create table from 0th feature

}

// Function to create the table dynamically using the feature's attributes information
function createIdentifyTable(feature){

	// Add the table to the panel showing up feature's attributes
	$('#identifyTable').remove();
    var table = $('<table></table>').addClass('ui-responsive table-stroke');
    table.attr('data-role','table');
    table.attr('id','identifyTable');
    table.append($('<tbody<</tbody>'));

    // Loop through the feature attributes object and build the HTML string to be appended into the table
	for(i=0; i<Object.keys(feature.attributes).length; i++) {

	    var row = $('<tr></tr>');
	    if (i % 2 == 0){
	    	row.addClass('evenRow');
	    } else {
	    	row.addClass('oddRow');
	    }

	    var colKey = $('<td></td>').addClass('colKey').text( Object.keys(feature.attributes)[i]); // http://the-jquerymobile-tutorial.org/jquery-mobile-tutorial-CH05.php
	    row.append(colKey);
	    var colValue = $('<td></td>').addClass('colValue').text( feature.attributes[Object.keys(feature.attributes)[i]]);
	    row.append(colValue);
	    table.append(row);
	}

    map.graphics.clear(); // Clear previous graphic and add the graphic for the corresponding selected feature from the drop-down list
    SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
    SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
    SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([171,0,131]), 2),new dojo.Color([255,1,196,0.8]));

    //Symbolize the Identified features
    var graphic = feature;
    if (graphic.geometry.type=="point"){
        graphic.setSymbol(SimpleMarkerSymbol);

    }else if (graphic.geometry.type=="polyline"){
        graphic.setSymbol(SimpleLineSymbol);

    }else if (graphic.geometry.type=="polygon" || graphic.geometry.type=="extent"){
        graphic.setSymbol(SimpleFillSymbol);

    }

    // Add these features into map's graphics (Not in a separate graphics layer)
    map.graphics.add(graphic);

	identifyTool=false;
	identifyResultsPanelOpen=true;
	$('#identifyResultsHeader').append(table);
	$('#identifyResultsHeader').trigger('create');
}


// Function from Projects Map - To format Forecasted Construction Date in Pop-ups for Projects layerIds
// http://forums.arcgis.com/threads/14510-Dojo-Datagrid-doesn-t-return-SDE-date-format-field-correctly-for-related-table
function formatDate(value) {
    if (value != null) {
        var inputDate = new Date(value);
        return dojo.date.locale.format(inputDate, {
            selector: 'date',
            datePattern: 'MMM yyyy'
        });
    } else {
        return "";
    }
}


// This function is used to show the Tabbed view in Pop-ups for logged-in users
function popupSelectionChange(){
    if (isLoggedIn){
        $('.esriPopup .contentPane').trigger('create');

        $(".tab_info").bind("click",function(){
            tabChange(map.infoWindow.getSelectedFeature(),$(this));
        });

    }

}