// Function called when Printing the map using Print under Tools section (This isn't called when Feedback executes a print task at the backend)
function print(){

    $('#print').addClass('waiting');
    $("#print-results").html("Printing. Please wait..");

	var printMap=new esri.tasks.PrintTask(customPrintUrl, {async: true}); // Create a print task from Esri JS API with the Print url set in the map.js
	template = new esri.tasks.PrintTemplate(); // Set the print template with all the options

  // Construct a whitelist for what will appear on the legend (features that are turned on and visible at the current scale and extents)
  // First, build array of layers that are turned ON and visible at the current scale
  var layersCurrentlyVisible = [];
  layersVisibleInExtent = [];
  $.each(visibleLayerIds,function(index,value){
    if ((jQuery.inArray(value,map.getLayer("opLayer").visibleLayers) !== -1) || (jQuery.inArray(value,map.getLayer("transparent30OpLayer").visibleLayers) !== -1) || (jQuery.inArray(value,map.getLayer("transparent60OpLayer").visibleLayers) !== -1)){
      layersCurrentlyVisible.push(value);
    }
  });

  var url;
  var queryTask;
  var query;
  var allQueryTasks = new Array();
  var printExtent;

  //determine x and y distance based on print area
  var xDistance = printAreaWidth / 2;
  var yDistance = printAreaHeight / 2;

  //calculate extent for print area
  if (printAreaWidth > 0) {
    var minScreenX = map.toScreen(map.extent.getCenter()).x - xDistance;
    var minScreenY = map.toScreen(map.extent.getCenter()).y + yDistance;
    var maxScreenX = map.toScreen(map.extent.getCenter()).x + xDistance;
    var maxScreenY = map.toScreen(map.extent.getCenter()).y - yDistance;

    var minScreen = new esri.geometry.ScreenPoint(minScreenX, minScreenY);
    var maxScreen = new esri.geometry.ScreenPoint(maxScreenX, maxScreenY);

    var minPoint = map.toMap(minScreen);
    var maxPoint = map.toMap(maxScreen);

    printExtent = new esri.geometry.Extent(minPoint.x, minPoint.y, maxPoint.x, maxPoint.y, map.spatialReference);

    console.log(printExtent);
  }
  else {
    //User must be printing Legend Only, so we'll set the extent to be the map extent
    printExtent = map.extent;
  }


  //Second, loop through array of visible layers and query for all features within the print extent
  for (var i=0; i<layersCurrentlyVisible.length; i++){
    url = restEndpoint + "EnterpriseFeatures/MapServer/" + layersCurrentlyVisible[i];
    queryTask = new esri.tasks.QueryTask(url);
    query = new esri.tasks.Query();
    query.geometry = printExtent;
    query.outFields = ["OBJECTID"];
    allQueryTasks.push(queryTask.execute(query, new asyncResponder(onLegendQuerySuccess, onLegendQueryFail, layersCurrentlyVisible[i])));
  }

  //Create deferred list to keep track of all these queries
  var dl = new dojo.DeferredList(allQueryTasks);

  //Once all queries have completed, the "layersVisibleInExtent" array should be a filtered-down version of "layersCurrentlyVisible" 
  //that no longer includes layers that have no features within the current map extent. Include only these layers on the printout's legend.
  dl.then(function() {
    var legendLayer = new esri.tasks.LegendLayer();
    var transparent60Legend = new esri.tasks.LegendLayer();
    var transparent30Legend = new esri.tasks.LegendLayer();

    legendLayer.layerId = "opLayer";
    transparent60Legend.layerId = "transparent60OpLayer";
    transparent30Legend.layerId = "transparent30OpLayer";

    legendLayer.subLayerIds = layersVisibleInExtent;
    transparent60Legend.subLayerIds = layersVisibleInExtent;
    transparent30Legend.subLayerIds = layersVisibleInExtent;

    // Set the printout's dpi. Width and height seem to be ignored.
    template.exportOptions = {
      width: 20,
      height: 20,
      dpi: 192
    };

    // Capture user's inputs for format, layout and title
    template.format = $('#print_output_format option:selected').val();
    template.layout = $('#print_options option:selected').val();
    template.layoutOptions={
      titleText: $('#printTitle').val(),
        legendLayers: [legendLayer, transparent30Legend, transparent60Legend]
      };

    var params=new esri.tasks.PrintParameters();
    params.map=map;
    params.template=template; // Assign the template and map to the print parameters to be executed by print task

    printMap.execute(params);

    // Once print is complete, call this function to show the output in a separate window
    dojo.connect(printMap,"onComplete",function(result){
      $("#print-results").html("Print successful..Make sure popup is allowed in your browser.");
      window.open(result.url,'_blank');
      $('#print').removeClass('waiting');
    });

    // If print fails, show a error message to the user in the UI
    dojo.connect(printMap,"onError",function(error){
      $("#print-results").html("Unable to print. Please try again.");
      $('#print').removeClass('waiting');
    });
  });  
}

function onLegendQuerySuccess(featureSet, layerId) {
  //This function will add any layer containing features within the current map extent to the "layersVisibleInExtent"
  //array to be used once all queries have completed.
  if (featureSet.features.length > 0) {
    layersVisibleInExtent.push(layerId);
  }
}

function onLegendQueryFail(featureSet, layerId) {
  console.log("error generating legend for printout");
}

function togglePrintPreview() { // Function showing the print preview window on the map (the extent that will be visible on the printout)

    if ($("#printOutline").is(":hidden")) {

      $("#printOutline").show();
      $('#printPreview').buttonMarkup({ theme: "a" });
      $('#printPreview .ui-btn-text').text("Hide Print Area");

    }
    else {

      $("#printOutline").hide();
      $('#printPreview').buttonMarkup({ theme: "b" });
      $('#printPreview .ui-btn-text').text("Show Print Area");

    }
}

function asyncResponder(callback, error, layerId) {
  //This helper function was created so that we could use a function that took custom arguments for successful queries.
  //I needed to attach the "layerid" along with every query executed so that when it came back it could be included in the array of layerids if deemed appropriate.
  return function(featureSet) {
    callback(featureSet, layerId);
  };
}