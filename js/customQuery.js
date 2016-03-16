// The main aim of this tool is to provide users with the ability to generate Custom Query strings with various Campus GIS datasets
// By default, the Query tool shows up one drop-down list having the layer names
// Once the layer is selected, all other controls show up specific to the layer. Whenever a layer name is changed, this function is called.
function layerChange(sel){
	if (sel.value !== ""){

		$('#select_a_field').empty();
		$('#query_string').empty();
		$('#select_a_operator').prop('selectedIndex',0);
		
		$('#select_a_field').append($('<option>',{value:'',text:'Select a Field'}).prop('selected',true));
		$('#select_a_field').selectmenu('refresh', true);
		$('#select_a_operator').selectmenu('refresh', true);
		$('#select_a_value').selectmenu('refresh', true);

		// If the selected layer is Buildings (74 is the layer ID from REST endpoint), generate the field list (As per the spreadsheet from Sharepoint), queryOutFields (These are the ones set to display in the bottom table) and field name that should be used for sorting
		if (sel.value == "74"){ 
			
			$('#select_a_field').append($('<option>',{value:'BuildingUse',text:'BuildingUse'}));
			$('#select_a_field').append($('<option>',{value:'GrossArea',text:'GrossArea'}));
			$('#select_a_field').append($('<option>',{value:'UASiteID',text:'UASiteID'}));
			$('#select_a_field').append($('<option>',{value:'Shape_Area',text:'Shape_Area'}));
			queryOutFields = ["Name","SpaceNum","SpaceNumLetter","Address","AliasName","SISAbbrev","City","GrossArea","UASiteID","BID","Shape_Area"];
			queryOrderByFields = ["Name"];

		} else if (sel.value == "128"){ // If the selected layer is Parking Lots (128 is the layer ID from REST endpoint), generate the field list (As per the spreadsheet from Sharepoint), queryOutFields (These are the ones set to display in the bottom table) and field name that should be used for sorting
			
			$('#select_a_field').append($('<option>',{value:'Name',text:'Name'}));
			$('#select_a_field').append($('<option>',{value:'Category',text:'Category'}));
			$('#select_a_field').append($('<option>',{value:'Location',text:'Location'}));
			$('#select_a_field').append($('<option>',{value:'UASiteID',text:'UASiteID'}));
			$('#select_a_field').append($('<option>',{value:'Shape_Area',text:'Shape_Area'}));
			queryOutFields = ["Name","Address","PTSNum","SpaceNum","Category","Location","UASiteID","Shape_Area"];
			queryOrderByFields = ["PTSNum"];
			
		} else if (sel.value == "15"){ // If the selected layer is Trees (15 is the layer ID from REST endpoint), generate the field list (As per the spreadsheet from Sharepoint), queryOutFields (These are the ones set to display in the bottom table) and field name that should be used for sorting
			
			$('#select_a_field').append($('<option>',{value:'Taxa.CommonName',text:'CommonName'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.Family',text:'Family'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.Genus',text:'Genus'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.SpecificEpithet',text:'SpecificEpithet'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.Compound',text:'Compound'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.LifeformDescription',text:'LifeformDescription'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.GeographicOrigin',text:'GeographicOrigin'}));
			$('#select_a_field').append($('<option>',{value:'Taxa.EcozoneOrigin',text:'EcozoneOrigin'}));
			$('#select_a_field').append($('<option>',{value:'accessions.AccType',text:'AccType'}));
			$('#select_a_field').append($('<option>',{value:'accessions.AccessionID',text:'AccessionID'}));
			$('#select_a_field').append($('<option>',{value:'accessions.TaxonID',text:'TaxonID'}));
			queryOutFields = ["Taxa.CommonName","Taxa.Family","Taxa.Genus","Taxa.SpecificEpithet","Taxa.Compound","Taxa.LifeformDescription","Taxa.GeographicOrigin","Taxa.EcozoneOrigin","accessions.AccType","accessions.AccessionID","accessions.TaxonID"];
			queryOrderByFields = ["Taxa.CommonName"];
			
		} else if (sel.value == "107"){ // If the selected layer is Streets (107 is the layer ID from REST endpoint), generate the field list (As per the spreadsheet from Sharepoint), queryOutFields (These are the ones set to display in the bottom table) and field name that should be used for sorting
			
			$('#select_a_field').append($('<option>',{value:'Name',text:'Name'}));
			$('#select_a_field').append($('<option>',{value:'Class',text:'Class'}));
			$('#select_a_field').append($('<option>',{value:'Orientation',text:'Orientation'}));
			$('#select_a_field').append($('<option>',{value:'Shape_Area',text:'Shape_Area'}));
			queryOutFields = ["Name","Class","OneTwo","Orientation","UASiteID","Shape_Area"];
			queryOrderByFields = ["Name"]

		}

		$('#options_wrapper').css('display','block');
	} else {
		$('#options_wrapper').css('display','none');
	}
	
}


// Whenever a field is selected/changed from the drop-down list, this function will be called to update another drop-down list with all the values from that field.
// Generally, if the field doesn't have any domain assigned to it, values can be directly retrieve from them. 
// If the field has domain assigned, Esri JS API will, by default, provide the Code associated with the Coded value domain. 
// Here is the workflow suggested by Esri JS API Developer in the forums: http://forums.arcgis.com/threads/69363-get-coded-value-from-layer-in-DynamicMapService-Layer?highlight=coded+values%2Bquery
// Below code snippet follows the same workflow with added modifications as per our functionality
function fieldChange(sel){

	var uniqueValues = [];
    var testVals={};

    // 1) Fire a Query task on the selected layer
	// 2) Once the Query is completed, send a request to the same QueryURL (This is to know which fields has Coded Value Domain associated with it)
	// 3) Get the value associated with the code for the fields with Domain. Build an array with this to be used in the later parts of code.
	var query = new esri.tasks.Query();
	var queryUrl=restEndpoint + "EnterpriseFeatures/MapServer/" + $('#select_a_layer option:selected').val();
	query.where="1=1";
	query.outFields = ["*"];
	query.returnGeometry=false;
	var queryTask = new esri.tasks.QueryTask(queryUrl);
	queryTask.execute(query,function(featureSet){

		fieldDomains = [];
	    esriRequestHandle = esri.request({
	        url: queryUrl,
	        content: {
	            f: "json"
	        },
	        callbackParamName: "callback",
	        load: function (res) {
	            dojo.forEach(res.fields, function (f) {
	                if (f.domain != null) {
	                    fieldDomains[f.name] = f.domain.codedValues;
	                }
	            });
	            dojo.forEach(featureSet.features, function (f) {
	            	attr = sel.value;

            		if (attr in fieldDomains) {
	                    dojo.forEach(fieldDomains[attr], function (d) {
	                        if (!testVals[d.name]) {
	                        	testVals[d.name]=true;
	                        	uniqueValues.push({name:d.name, code:d.code});
	                        }
	                    });
	                } else {
	                	var featureValue = f.attributes[sel.value];
						if (featureValue != " " && featureValue != "" && featureValue != null && !testVals[featureValue]){
							testVals[featureValue]=true;
							isFinite(String(featureValue)) ? uniqueValues.push({name:featureValue, code: featureValue}) : uniqueValues.push({name:featureValue, code: "'"+featureValue+"'"}) ; //Append quotes to the Query string only if the featureValue isn't string
						}
	                }

	            });
	            
	        },
	        error: function (res) {
	            
	        }
	    }, {
	        useProxy: false
	    });

		
		// Once the Esri Request is complete, fill the drop-down list with the values from the fields (If domain is associated, populate with Values and not with Code)
		esriRequestHandle.then(function(){
			$('#select_a_value').empty();

			uniqueValues.sort(function (a, b) {
				if (a.name > b.name)
					return 1;
				if (a.name < b.name)
					return -1;
				return 0;
			});

			for (var i=0;i<uniqueValues.length;i++){
				$('#select_a_value').append($('<option>',{value: uniqueValues[i].code, text: uniqueValues[i].name}));
			}
		});
		
	});


}

// Function called when the Blue button (with an arrow) is clicked to generate the Query string into the Textbox
function generate_query(){
	$('#query_string').val ($('#select_a_field option:selected').text() + " " + $('#select_a_operator option:selected').text() + " " + $('#select_a_value option:selected').text());
	queryWhereClause = $('#select_a_field').val() + " " + $('#select_a_operator').val() + " " + $('#select_a_value').val();
}

// When "Query" button is clicked, Esri JS API Query task is fired with the string as specified in the textbox  
function queryLayer(){

	$('#query_error').html("");

	var query = new esri.tasks.Query();
	var queryUrl = restEndpoint + "EnterpriseFeatures/MapServer/" + $('#select_a_layer option:selected').val();
	var layerQueried = $('#select_a_layer option:selected').attr("turnOnLayer");
	query.where = queryWhereClause;
	query.outFields = queryOutFields;
	//query.orderByFields = queryOrderByFields;
	query.returnGeometry = true;
	var queryTask = new esri.tasks.QueryTask(queryUrl);
	queryTask.execute(query,function(featureSet) {

		
		// Showing the Query Results window only on Tablets and Desktop browsers AND number of features returned is > 0
		if ($(window).width() >= 768 && featureSet.features.length > 0) { 

			//If the layer queried has a "turnOnLayer" attribute, turn on that layer in the TOC when queried
			if (layerQueried) {
				console.log("turning on queried layer: " + layerQueried);
				setTimeout(function() {
					$("#tocTree").jqxTree('checkItem', $("." + layerQueried)[0], true);
				}, 800);
			}

			var queryResultsWidth = $(window).width() - $('#search-panel').width();
			$('#query-results').css('width', queryResultsWidth + "px");
			$('#query-results').css('display','block');

			// First, clear all the contents in the graphic layers (Search results, if any)
			map.getLayer("searchOutputGL_Point").clear();
			map.getLayer("searchOutputGL_Polyline").clear();
			map.getLayer("searchOutputGL_Polygon").clear();	

							
			// Create table header with the fields
			$('#tableHeaderRow-Query').empty();
			$.each(featureSet.fieldAliases, function(header,value) {
			  $('#tableHeaderRow-Query').append("<td>"+header+"</td>");
			});

			//sort featureSet
			console.log("sorting results");
			featureSet.features.sort(function(a, b){
				var x, y;
				x = a.attributes[queryOrderByFields[0]];
				y = b.attributes[queryOrderByFields[0]];
				if (x < y)
					return -1;
				if (x > y)
					return 1;
				return 0;
			});
			console.log("done sorting results");


			// Create table body dynamically with the values from Query
			$('#tableBody-Query').empty();
			$.each(featureSet.features,function(index,feature){

				// TO DISPLAY GRAPHICS ON THE MAP
				var graphic = feature;
		        
		        SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
		        SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
		        SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([79,160,134]), 2),new dojo.Color([71,255,159,0.5]));

		        switch (graphic.geometry.type)
		        {
		          case "point":
		            graphic.setSymbol(SimpleMarkerSymbol);
		            searchOutputGL_Point.add(graphic);
		            break;
		          case "polyline":
		            graphic.setSymbol(SimpleLineSymbol);
		            searchOutputGL_Polyline.add(graphic);
		            break;
		          case "polygon":
		            graphic.setSymbol(SimpleFillSymbol);
		            searchOutputGL_Polygon.add(graphic);
		            break;
		        }


				// TO DISPLAY RESULTS IN THE TABLE
				// Just to differentiate class name for each row, so that different syling can be applied in CSS
				index%2 == 0 ? $('#tableBody-Query').append("<tr id='tableBodyRow-Query_"+index+"' class='tableBodyOddRow-Query'>") : $('#tableBody-Query').append("<tr id='tableBodyRow-Query_"+index+"' class='tableBodyEvenRow-Query'>") ;

				$.each(feature.attributes,function(field,value){
					if (field in fieldDomains){ // By default, the query results contain the Code, if the field is coded value domain. This code is written to display the values associated with them.
						dojo.forEach(fieldDomains[field], function(arrayValues){
							if (arrayValues.code == value){
								$('#tableBodyRow-Query_'+index).append("<td>"+arrayValues.name+"</td>")
							}
						});
					} else {
						$('#tableBodyRow-Query_'+index).append("<td>"+value+"</td>")	
					}
					
				});
				$('#tableBody-Query').append("</tr>");

				// On row click, zoom to the feature
				$('#tableBodyRow-Query_'+index).bind('click',function(){
				  $('#tableBody-Query tr').removeClass("tableBodyRow-Selected");
		          zoomToRow(feature);
		          $(this).addClass("tableBodyRow-Selected");
		        });

		        
			});

			// If campus Tiled map service extent contains the Search output (polygon) extent, Set the map extent to the Search output (polygon)
			if (campusExtent.contains(esri.graphicsExtent(featureSet.features))){ 
		        map.setExtent(esri.graphicsExtent(featureSet.features));
		    } else { // Else set the extent to campusExtent
		        map.setExtent(campusExtent);  
		    }	
						
			
		} else if (featureSet.features.length == 0){ // If 0 features returned
			$('#query_error').html("0 features returned.");

			// Clear all the contents in the graphic layers (To clear off the previous query results) and hide the Query results window
			map.getLayer("searchOutputGL_Point").clear();
			map.getLayer("searchOutputGL_Polyline").clear();
			map.getLayer("searchOutputGL_Polygon").clear();	

			$('#query-results').css('display','none');

		} else if ($(window).width() < 768) { // If the tool is run on mobile or any device whose screen width is < 768
			$('#query_error').html("Your device isn't compatible to display the results.");

			// Clear all the contents in the graphic layers (To clear off the previous query results) and hide the Query results window
			map.getLayer("searchOutputGL_Point").clear();
			map.getLayer("searchOutputGL_Polyline").clear();
			map.getLayer("searchOutputGL_Polygon").clear();	

			$('#query-results').css('display','none');
		}
		
	}, function(error){ // If there is any error with Query task
		$('#query_error').html("Unable to Query selected layer.");

		// Clear all the contents in the graphic layers (To clear off the previous query results) and hide the Query results window
		map.getLayer("searchOutputGL_Point").clear();
		map.getLayer("searchOutputGL_Polyline").clear();
		map.getLayer("searchOutputGL_Polygon").clear();	

		$('#query-results').css('display','none');
	});

}


// When each row is clicked in the results table, the map had to zoom to the corresponding feature
function zoomToRow(feature){

	var graphic=feature;

	SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
	SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
	SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([79,160,134]), 2),new dojo.Color([71,255,159,0.5]));
	highlightSymbol_Point=new esri.symbol.PictureMarkerSymbol('images/esriGreenPin_64x64.png', 64, 64);
    highlightSymbol_Polyline=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
	highlightSymbol_Polygon=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([79,160,134]), 2), new dojo.Color([79,160,134,0.9]));

	switch (graphic.geometry.type)
    {
      case "point":
      	highlightFeatureinGL('searchOutputGL_Point',SimpleMarkerSymbol,highlightSymbol_Point,feature);
        break;
      case "polyline":
      	highlightFeatureinGL('searchOutputGL_Polyline',SimpleLineSymbol,highlightSymbol_Polyline,feature);
        break;
      case "polygon":
      	highlightFeatureinGL('searchOutputGL_Polygon',SimpleFillSymbol,highlightSymbol_Polygon,feature);
        break;
    }

	if (feature.geometry.type !="point"){
		map.setExtent(feature.geometry.getExtent().expand(5));
	}else {
	    map.centerAndZoom(feature.geometry,20);
	}
}


// This function is used to highlight features in different graphic layers with the symbology specified in the parameter.
function highlightFeatureinGL(layerID,defaultSymbol,highlightSymbol,feature){ 

	var gl=map.getLayer(layerID);
  
	for (var i=0;i<gl.graphics.length;i++){
	  gl.graphics[i].setSymbol(defaultSymbol);
	}

	if (gl.graphics.indexOf(feature)!=-1){
		//move the found graphic to the top and color it
	  setTimeout(function(){
	  	gl.graphics[gl.graphics.indexOf(feature)].getDojoShape().moveToFront();
	  	gl.graphics[gl.graphics.indexOf(feature)].setSymbol(highlightSymbol);
	  }, 1000);
	}

}

// This function is to enable/disable the controls based on Query switch -- Add to existing query OR Generate a new one
function querySwitchButton ( event, ui ) { 
	if (event.target.value == "ADD"){
		$('#generate_connecting_query').removeClass('ui-disabled');
		$('#select_a_connecting_operator').selectmenu('enable');
		$('#generate_query').addClass('ui-disabled');
		$('#select_a_layer').selectmenu('disable');
	} else {
		$('#generate_connecting_query').addClass('ui-disabled');
		$('#select_a_connecting_operator').selectmenu('disable');
		$('#generate_query').removeClass('ui-disabled');
		$('#select_a_layer').selectmenu('enable');
	}
}

// This function is used to generate/append additional query strings 
function generate_connecting_query() { 

	$('#query_string').val ($('#query_string')[0].value + " " + $('#select_a_connecting_operator option:selected').text() + " " + $('#select_a_field option:selected').text() + " " + $('#select_a_operator option:selected').text() + " " + $('#select_a_value option:selected').text());
	queryWhereClause = queryWhereClause + " " + $('#select_a_connecting_operator option:selected').val() + " " + $('#select_a_field option:selected').val() + " " + $('#select_a_operator option:selected').val() + " " + $('#select_a_value option:selected').val()

}

// This function is used to convert Table to CSV and download to client (WORKS ONLY ON FIREFOX AND CHROME. IE ISN'T SUPPORTED)
function exportTableToCSV($table, filename) { 

    var $rows = $table.find('tr:has(td)'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace('"', '""'); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

    $(this)
        .attr({
        'download': filename,
            'href': csvData,
            'target': '_blank'
    });
}