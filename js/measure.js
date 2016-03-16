// Function that will be called when the measure task is complete for Line and Polygon
function measure_output(result) {

    var measureUnit=$('#measure_options :selected').text();

    // Limit Feet and Meters length values to 1 decimal places, rest of the units with 2 decimal places
    if (measureUnit=="Feet" || measureUnit=="Meter"){
        $("#popup-content").html("Length: "+result.lengths[0].toFixed(1) + " ");
    } else {
        $("#popup-content").html("Length: "+result.lengths[0].toFixed(2) + " ");
    }
    
    
    // Limit Sq. Feet and Sq. Meters area values to 1 decimal places, rest of the units with 2 decimal places
    if (result.areas){
        if (measureUnit=="Sq. Feet" || measureUnit=="Sq. Meters"){
            $("#popup-content").html("Area: "+result.areas[0].toFixed(1) + " ");
        }else {
            $("#popup-content").html("Area: "+result.areas[0].toFixed(2) + " ");
        }
    }
    
    // Measure output is shown in a pop-up (from jQuery Mobile) with an offset, so that the pop-up doesn't overlap on the drawn feature. If it is, just modify the Offset values
    $("#measure-popup").popup( "open", {x:screenExtent.xmax+20,y:screenExtent.ymax-10});
    $('#measure_options').selectmenu('refresh',true); // Drop-down list with units had to be refresh'ed to see the changes
         

} /*End of function measure_output */


// Whenever the unit of the measure output is changed (in the jQuery Mobile Pop-up), this function is called
function measureChange(){

    $('#measure_options option:selected').each(function() {

        var geometry=sketchGraphics.graphics[0].geometry;
        var unit=$(this).val();

        // Depending on the geometry type, call the corresponding function to re-calculate the graphic measurements
        if (geometry.type=='polyline'){
            measure_length(geometry,unit);
        }else if (geometry.type=='polygon'){
            measure_area(geometry,unit);
        }else if (geometry.type=='point'){
            measure_point(geometry,unit);
        }

    });

}


// Once the measure is complete, this function is called to add the graphic to the map and call function to calculate measurements depending on the geometry type
function measure(geometry) {

    measureOpen=true;

    if (geometry.type=='point') { // If the drawn graphic is Point

        addGraphic(geometry); // Display the graphic in the map using addGraphic function that is already written in feedback.js

        measureOptions = { esriLatLong : 'Lat,Long' , esriStatePlane: 'State Plane'};
        $('#measure_options').empty();
        
        // Populate the drop-down in the measure with different units
        $.each(measureOptions, function(val, text) {
           $('#measure_options').append(new Option(text, val));
        });
        
        $('#measure_options').val('Lat,Long'); // Default unit that shows up first when the measure for point is complete
        $('#measure_options').selectmenu('refresh');

        // Display the measurement values and offset the pop-up by a distance, so that they don't overlap with the drawn graphic
        $("#popup-content").html("X: "+dojo.number.format(geometry.getLongitude()) + "<br/> Y: "+ dojo.number.format(geometry.getLatitude())+"<br/>");
        $( "#measure-popup" ).popup( "open", {x:screenExtent.x+20,y:screenExtent.y-10} );
        

    } else if (geometry.type=='polyline') { // If the drawn graphic is Polyline

        addGraphic(geometry); // Display the graphic in the map using addGraphic function that is already written in feedback.js

        /*http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnitType.htm*/
        measureOptions = { "esri.9030" : 'Miles', "esri.9002" : 'Feet', "esri.9036" : 'Km', "esri.9001" : 'Meter'};
        $('#measure_options').empty();
        
        // Populate the drop-down in the measure with different units
        $.each(measureOptions, function(val, text) {
           $('#measure_options').append(new Option(text, val));
        });
        
        measure_length(geometry,'esri.9002'); // Call the function to measure the geometry in Feet units
        $('#measure_options').val('esri.9002'); // Default unit for length: Feet
        $('#measure_options').selectmenu('refresh',true);


    } else if (geometry.type=='polygon') { // If the drawn graphic is Polygon

        addGraphic(geometry); // Display the graphic in the map using addGraphic function that is already written in feedback.js

        /*http://resources.arcgis.com/en/help/arcobjects-net/componenthelp/index.html#//004200000015000000*/
        measureOptions = { esriAcres : 'Acres', esriHectares : 'Hectares', esriSquareFeet: 'Sq. Feet', esriSquareKilometers: 'Sq. Km', esriSquareMeters: 'Sq. Meters', esriSquareMiles: 'Sq. Miles'};
        $('#measure_options').empty();
        
        // Populate the drop-down in the measure with different units
        $.each(measureOptions, function(val, text) {
           $('#measure_options').append(new Option(text, val));
        });
        
        $('#measure_options').val('esriSquareFeet'); // Default unit for area: Square Feet
        $('#measure_options').selectmenu('refresh',true);

        measure_area(geometry,'esriSquareFeet'); // Call the function to measure the geometry in Esri Sq Feet units

    }
    
    // Deactivate the measure tool and activate the map onClick events (to show Pop-ups)
    tb_measure.deactivate();
    if (mapOnClickHandler == null) {
        reenableClickActions();
    }

} /*End of function measure */


// Function to measure the length of line geometries
function measure_length(geometry,unit) {

    var lengthParams = new esri.tasks.LengthsParameters();
    lengthParams.polylines = [geometry];
    lengthParams.lengthUnit = unit.substring(5,unit.length);
    lengthParams.geodesic = true;
    geometryService.lengths(lengthParams,measure_output); // Using Geometry service to find the length of line feature. Once the measure is complete, call measure_output function

}

// Function to measure the area of polygon geometries
function measure_area(geometry,unit) {

    // Simplify the geometries before calculating the area of the polygon. Unit is specified when being called in the code. 
    var areasAndLengthParams = new esri.tasks.AreasAndLengthsParameters();
    areasAndLengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_FOOT;
    areasAndLengthParams.areaUnit = unit;
    areasAndLengthParams.calculationType = 'preserveShape';
    geometryService.simplify([geometry], function(simplifiedGeometries) {
      areasAndLengthParams.polygons = simplifiedGeometries;
      geometryService.areasAndLengths(areasAndLengthParams,measure_output); // Once the measure is complete, call the measure_output function
    });

}

// Function called when the units of measure changed for point features (when users chose different units than what shows up by default)
function measure_point(geometry,unit) {

    var projectParams = new esri.tasks.ProjectParameters();
    projectParams.geometries = [geometry];
    
    if (unit=='esriLatLong'){
        $("#popup-content").html("X: "+dojo.number.format(geometry.getLongitude()) + "<br/> Y: "+ dojo.number.format(geometry.getLatitude())+"<br/>");
    }else if (unit=='esriStatePlane'){
        /*https://developers.arcgis.com/en/javascript/jshelp/pcs.html*/
        projectParams.outSR = new esri.SpatialReference(2223)
        geometryService.project(projectParams,project_output);
    }

}

// For point graphics, the geometry has to be projected from one Co-ordinate system to other to show up units in State plane
function project_output(result) {

    $("#popup-content").html("X: "+dojo.number.format(result[0].x) + "<br/> Y: "+ dojo.number.format(result[0].y)+"<br/>");
    $('#measure_options').selectmenu('refresh',true);

}

// Function to close the pop-up when the top right red x button is clicked
function closePopup(){
    $( "#measure-popup" ).popup( "close" );
}