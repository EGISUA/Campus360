// Code snippets involved in getting the user content and submitting it to UA EGIS is done in Feedback.js
// This is done to validate the attachment files added to the application in Feedback section.
// File extension with GIF, JPEG, BMP, PNG  with size less than 3MB are allowed as valid attachments
function validateAttachment(){
    
    var f = this.files[0];
    var p = f.size;
    var fup = document.getElementById('file');
    var fileName = fup.value;
    var ext = fileName.substring(fileName.lastIndexOf('.') + 1);

    // Check for file extension
    if (ext == "GIF" || ext == "gif" || ext == "jpg" || ext == "JPG" || ext == "jpeg" || ext == "JPEG" || ext == "bmp" || ext == "BMP" || ext == "png" || ext == "PNG") {
        
        // Check for file size
        if ((p <= 3146152)) {

            $('#results').html('');
            return true;

        } else {

            $('#results').html("Please upload the image max.size of 3 MB");
            $("#file").val('');
            $("#file").attr('enabled', 'enabled');

        }

    } else {

        $('#results').html("Please upload images only");
        $("#file").val('');
        $("#file").attr('enabled', 'enabled');

    }
    
} 


// Once submit button is clicked, this function is called, which executes a Print task
function printBeforeSubmit(){
    
    $('#submit').addClass('waiting');
    $('#results').html('Submitting.. Please wait.');
    
    sketchGraphics.graphics.forEach(function(graphic){
        document.getElementById("geometry").value+=dojo.toJson(graphic.geometry.toJson());        
    });
    
    // Initialize print task with parameters like format, layout, label
    var printTask=new esri.tasks.PrintTask(printUrl);
    template = new esri.tasks.PrintTemplate();
    
    template.exportOptions = {
      width: 1904,
      height: 400,
      dpi: 96
    };
    template.format = "PNG32";
    template.layout = "A3 Landscape";
    template.label = "EGIS Map";
    
    var params = new esri.tasks.PrintParameters();
    params.map = map;
    params.template=template;
    
    // Execute print task
    printTask.execute(params);

    // If print task fails, report it to user and don't submit any contents to UA EGIS
    dojo.connect(printTask,"onError",function(error){
        $("#results").html("Failed to submit feedback. Please try again.");
        $('#submit').removeClass('waiting');
    });

    // Once print is complete, send the entire results to Python script via AJAX
    dojo.connect(printTask,"onComplete",function(result){

        document.getElementById('Print_Image').value=result.url;

        var formData = new FormData($('#form')[0]); // http://stackoverflow.com/questions/11341067/ajax-form-submit-with-file-upload-using-jquery 

        // AJAX request to send the contents over the Python file - save_file.py
        $.ajax({
          url:'py/save_file.py',
          type: 'POST',
          data: formData,
          async: false,
          
          success: function (data) {
            $("#form")[0].reset();
            $("#results").html("Feedback submitted.");
            $('#submit').removeClass('waiting');
          },

          fail:function(jqXHR, textStatus) {
            $("#results").html("Request failed: " + textStatus );
          },
          cache: false,
          contentType: false,
          processData: false
        });

    });

} /*End of function printBeforeSubmit */


// Function to draw graphics on the map - Feedback tool + Measure tool
function addGraphic(geometry) {
    
    var markerPath;
    
    // Override the default symbology -- This color code is for features drawn using Feedback/Meausre draw tools    
    SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([109,26,144]), 4);
    SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([223,161,255]), 2),new dojo.Color([232,190,254,0.6]));
    
    // For point symbols, SVG markers are created based on the tool
    // How to create SVG Paths: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths    
    if (geometry.type=="point"){
        if (measureOpen){ // If measure is active tool, the point symbol should be Crosshair
            
            markerPath="M230 80 A 70 70, 0, 1, 1, 229.9 80 z l0,140 M300,150 L160,150";
            symbol = createSymbol(markerPath,'white',10);
                                    
        } else { // If feedback is active tool, the point symbol should be Bulls-eye
            
            markerPath="M230 80 A 10 10, 0, 1, 0, 229 80 Z M230 75 A 5 5, 0, 1, 0, 229 75 Z M230 70 A 0 0, 0, 1, 0, 229 70 Z";
            symbol = createSymbol(markerPath,null,1.5);

        }
        
    }else if (geometry.type=="polyline"){
        symbol = SimpleLineSymbol;
          
    }else if (geometry.type=="polygon" || geometry.type=="extent"){
        symbol = SimpleFillSymbol;
        
    }
    
    // Add these graphics to the map once the symbology is assigned to it.
    sketchGraphics.add(new esri.Graphic(geometry, symbol));

    if (geometry.type=="point"){
        screenExtent = new esri.geometry.toScreenGeometry(map.extent,map.width,map.height,sketchGraphics.graphics[0].geometry); // To be used for Measure pop-ups
    } else {
        screenExtent = new esri.geometry.toScreenGeometry(map.extent,map.width,map.height,new esri.graphicsExtent(sketchGraphics.graphics)); // To be used for Measure pop-ups
    }


    if (measureOpen){
        measureOpen=false; //Measure tool is set to false, not in active state
    } 

        
    tb.deactivate();
    reenableClickActions();
        
        
} /*End of function addGraphic*/


// This function is to create a simplemarkersymbol from SVG 
//http://forums.arcgis.com/threads/91383-How-to-apply-CSS-effects-to-custom-graphics-layer?highlight=SVG
//https://code.google.com/p/sputniktests/source/browse/trunk/app/dynamic/bullseye.svg?r=88

function createSymbol(path, color, outlineWidth){
    var markerSymbol = new esri.symbol.SimpleMarkerSymbol();
    markerSymbol.setPath(path);
    markerSymbol.setColor(color);
    markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([109,26,144])).setWidth(outlineWidth));
    return markerSymbol;
};

function addEditableText(){
    var text = new esri.symbol.TextSymbol("Editable Text");
    text.font.setSize("20pt");
    var point = new esri.geometry.Point(map.extent.getCenter());
    textGraphic = new esri.Graphic(point, text);
    sketchGraphics.add(textGraphic);
    
    if (typeof editing_tb == "undefined") {
	editing_tb = new esri.toolbars.Edit(map);
    }
    else {
	editing_tb.deactivate();
    }

    if (typeof enablingBeforeText == "undefined") {
	enablingBeforeText = sketchGraphics.on("click", function(evt){
            dojo.stopEvent(evt);
	    console.log("activating toolbar");
	    disableClickActions();
            activateToolbar(evt.graphic);
	    
	    disablingAfterText = map.on("click", function(evt) {
		console.log("deactivating editing toolbar");
		editing_tb.deactivate();
		disablingAfterText.remove();
		reenableClickActions();
	    });
	});
    }
    

}

function activateToolbar(graphic){
    var tool = 0;

    tool = tool | esri.toolbars.Edit.MOVE | esri.toolbars.Edit.SCALE | esri.toolbars.Edit.ROTATE;
    if ( graphic.symbol.declaredClass === "esri.symbol.TextSymbol") {
        tool = tool | esri.toolbars.Edit.EDIT_TEXT;
    }

    var options = {uniformScaling: true,
                   allowAddVertices: true,
                   allowDeleteVertices: true};
    editing_tb.activate(tool, graphic, options);
}