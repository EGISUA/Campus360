//this function overrides other click actions and activates the Selection tool
function startSelecting(action){
    if (currentlySelecting === false) {
        $("#selectionAlert").show();
        map.setMapCursor("crosshair");
        if (action == "add") {
            var callback = addToSelection;
            $("#selection-add").addClass("selectedButton");
        }
        disableClickActions();
        mapOnClickHandler = dojo.connect(map, "onClick", callback);
        currentlySelecting = true;
    }
    else {
        stopSelecting();
    }
    //listen to clicks in multiple locations so the user can stop selecting
    //we don't need a listener on the first button since it toggles start stop automatically
    $(".stopSelections").on("click.selections", stopSelecting);
}

//this function is called when the user no longer wants to keep adding/subtracting from their current selection
//it will disable whatever selection tool is in use and reactivate all the other click actions
function stopSelecting(){
    if (currentlySelecting) {
        $("#selectionAlert").hide();
        map.setMapCursor("default");
        $("#selection-add").removeClass("selectedButton");
        //TODO: visually de-select button for removing selections
        currentlySelecting = false;
        disableClickActions();
        setTimeout(reenableClickActions, 100);
        $(".stopSelections").off('click.selections');
    }
}

function clearSelection(){
    selectionSet = new Object();
    selectPoint.clear();
    selectPolyline.clear();
    selectPolygon.clear();
}

// This code allows the user to create selection sets of features they would otherwise have access to Identify. Instead of getting an infowindow and clearing the graphics every time like in Identify,
// Selections will add to a set of previous selections, with options to clear the entire selection set
function addToSelection(evt){

	// This variable is the list of pre-defined layers for the Selection Task (copied from Identify Task)
    // This had to be changed if the Layer IDs are changed in the map document/service
	var popupLayerIds=[15,11,139,129,29,30,31,32,7,93,92,19,20,112,79]; //Tree 1128minus(15), Web Cameras(11), Projects(139), UA Sites Statewide(129), CatTran Shuttle Stops(29,30,31,32), Public Art(7), Greek Houses(93), UA Residence Life Housing(92), Places to Eat (19,20), Outdoor Destinations (112), Historic Buildings (79), Major Athletic Sites (91)

	identifyParams.layerIds=[];

    // Check if the layers are turned ON and visible in the map before passing it to the Selection task
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
            var layerId = identifyResult.layerId;

            var identifier = layerIdentifiers[layerId];
            if (identifier === null || identifier === undefined) {
                identifier = "OBJECTID";
            }

            var objectID = feature.attributes[identifier];
    		feature.attributes.layerId = layerId;

            //TODO: figure out if this feature's already been put in the selectionSet
            if (!(layerId in selectionSet)) {
                selectionSet[layerId] = new Array();
            }

            //if this feature is already in this selectionset, remove it instead of adding it
            if ($.inArray(objectID, selectionSet[layerId] ) > -1) {
                console.log("feature already added");
                var graphic = feature;
                //remove the feature from the appropriate graphics layer
                if (graphic.geometry.type=="point"){
                    removeFeatureFromGL(selectPoint, layerId, identifier, objectID);
                }else if (graphic.geometry.type=="polyline"){
                    removeFeatureFromGL(selectPolyline, layerId, identifier, objectID);
                }else if (graphic.geometry.type=="polygon" || graphic.geometry.type=="extent"){
                    removeFeatureFromGL(selectPolygon, layerId, identifier, objectID);
                }
                //remove it from the selectionset as well
                selectionSet[layerId].splice(selectionSet[layerId].indexOf(objectID), 1);
                return 0;
            }
            else {
                selectionSet[layerId].push(objectID);
                console.log("added feature to selectionset");
            }

            // Override the default symbols to show up the Identify results features in a unique symbology
            SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriOrangePin_64x64.png', 48, 48);
            SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,153,0]), 3);
            SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([255,153,0]), 2),new dojo.Color([255,185,79,0.8]));

            // Symbolize the Identified features
            var graphic = feature;
            if (graphic.geometry.type=="point"){
                graphic.setSymbol(SimpleMarkerSymbol);
                selectPoint.add(graphic);
            }else if (graphic.geometry.type=="polyline"){
                graphic.setSymbol(SimpleLineSymbol);
                selectPolyline.add(graphic);
            }else if (graphic.geometry.type=="polygon" || graphic.geometry.type=="extent"){
                graphic.setSymbol(SimpleFillSymbol);
                selectPolygon.add(graphic);
            }

    		return feature;
    	}); // End of Dojo.map

    }); // End of Dojo deferred callback function


} // End of doSelection function

//This function removes the given feature from the given selection-specific graphics layer
function removeFeatureFromGL(graphicsLayer, targetLayerId, targetIdentifier, targetValue) {
    var graphics = graphicsLayer.graphics;
    var currentGraphic;
    for (var i=0; i < graphics.length; i++) {
        currentGraphic = graphics[i];
        if (currentGraphic.attributes["layerId"] == targetLayerId && currentGraphic.attributes[targetIdentifier] == targetValue) {
            graphicsLayer.remove(currentGraphic);
            break;
        }
    }

}

//This function will clear all selection graphics and redraw them based off of the global selectionSet variable
function redrawSelectionSet(){
    selectPoint.clear();
    selectPolyline.clear();
    selectPolygon.clear();            

    // Override the default symbols to show up the Identify results features in a unique symbology
    SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriOrangePin_64x64.png', 48, 48);
    SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,153,0]), 3);
    SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([255,153,0]), 2),new dojo.Color([255,185,79,0.8]));

    var currentLayerId, currentObjIds, url, queryTask, query;

    for (currentLayerId in selectionSet) {
        currentObjIds = selectionSet[currentLayerId];

        var identifier = layerIdentifiers[currentLayerId];

        //issue a query for this layer/objids and put results on appropriate graphics layer
        url = restEndpoint + "EnterpriseFeatures/MapServer/" + currentLayerId;
        queryTask = new esri.tasks.QueryTask(url);
        query = new esri.tasks.Query();
        query.returnGeometry = true;

        if (identifier === null || identifier === undefined) {
            query.objectIds = currentObjIds;
        }
        else {
            var whereClause = "";
            for (var i=0; i<currentObjIds.length; i++) {
                whereClause = whereClause + identifier + "=" + currentObjIds[i] + " OR ";
            }
            //chomp off excess OR
            whereClause = whereClause.substring(0, whereClause.length - 4);
            query.where = whereClause;
        }

        queryTask.execute(query, function(featureSet) {
            for (var i=0; i<featureSet.features.length; i++) {
                // Symbolize the Identified features
                var graphic = featureSet.features[i];
                if (graphic.geometry.type=="point"){
                    graphic.setSymbol(SimpleMarkerSymbol);
                    selectPoint.add(graphic);
                }else if (graphic.geometry.type=="polyline"){
                    graphic.setSymbol(SimpleLineSymbol);
                    selectPolyline.add(graphic);
                }else if (graphic.geometry.type=="polygon" || graphic.geometry.type=="extent"){
                    graphic.setSymbol(SimpleFillSymbol);
                    selectPolygon.add(graphic);
                }
            }
        });
    }

}