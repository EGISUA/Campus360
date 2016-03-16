// This part of code is required to load all the Esri JS API modules that are used in the application
// This is the old way of loading the modules and might be changed if we migrate to AMD way (Esri suggests to use AMD mainly because of load times in the client and the application performance)
dojo.require("esri.map");
dojo.require("esri.toolbars.draw");
dojo.require("esri.toolbars.edit");
dojo.require("esri.tasks.PrintTask");
dojo.require("esri.dijit.Measurement");
dojo.require("esri.dijit.Print");
dojo.require("esri.tasks.find");
dojo.require("esri.layers.graphics");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.tasks.identify");
dojo.require("esri.dijit.Legend");
dojo.require("esri.tasks.query");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.LocateButton");

// These are global variables, meaning they can be used anywhere in the JS scripts
var map, geometryService;
var scalebar;
var app={};
var SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol;
var symbol;
var position;
var printUrl, customPrintUrl;
var findTaskUrl;
var findTaskLayerIds=[]; //Buildings(74), Major Athletic Sites(91), UA Sites Statewide(129), Parking Lots(128), Outdoor Destinations(112)
var findTaskSearchFields = []; // Search fields for basic search
var template;
var measureOptions;
var disableZoomToSearchResultsList = false;
//var loadedInitParams = false;
var isLoggedIn = false;
var findTask, findParams;
var timer;
var searchOutputGL_Point,searchOutputGL_Polyline,searchOutputGL_Polygon;
var highlightSymbol_Point,highlightSymbol_Polyline,highlightSymbol_Polygon;
var catTranLocations;
var sketchGraphics;
var defaultSymbol;
var zoomBlockHandle;
var campus_BI;
var infrastructure;
var campus_tile;
var enterprise_tile;
var opLayer, transparentOpLayer;
var imagery, streetsLayer;
var identifyTask, identifyParams;
var mapOnClickHandler;
var restEndpoint;
var campus_BI_layers;
var user_roles = new Array();
var ajaxGPSRequest;
var abortFeed = false;
var visibleBuses = new Array();
var busesRunning = false;
var identifyTool=false;
var visibleLayerNames, visibleLayerIds;
var identifyResultsPanelOpen=new Boolean();
identifyResultsPanelOpen=false;
var measureOpen=new Boolean();
measureOpen=false;
var aerialOnTop = false;
var alreadyCentering = false;
var buildingLabelIds = new Array();
var streetLabelIds = new Array();
var legend;
var zoomMenuOpen = false;
var allQueryGraphics = new Array();
var screenExtent; //This variable is used to position the Measure pop-ups
var campusExtent; //Extent of campus Tiled map service
var queryOutFields, queryOrderByFields, queryWhereClause, esriRequestHandle; //These variables are used in customQuery.js
var fieldDomains = [];
var searchAttr=[]; // Arrays for displaying search results
var layersVisibleInExtent;
var printAreaWidth = 782;
var printAreaHeight = 490;
var selectionSet = new Object;
var currentlySelecting = false;
var textGraphic;
var editing_tb;
var enablingBeforeText;
var disablingAfterText;
var layerIdentifiers = { //Used for identifying unique features (selection tool)
    7:"EGISID", //Public Art
    11:"EGISID", //Web Cameras
    15:"AccessionID", //Trees
    20:"EGISID", //Places To Eat2257,
    29:"EGISID", //Cat Tran Shuttle Stops564,
    30:"EGISID", //Cat Tran Shuttle Stops1128,
    31:"EGISID", //Cat Tran Shuttle Stops2257,
    32:"EGISID", //Cat Tran Shuttle Stops4514,
    74:"BID", //Buildings
    79:"BID", //Historic Buildings
    91:"EGISID", //Major Athletic Sites
    92:"BID", //UA residence life
    93:"BuildingNonUAID", //Greek Houses
    112:"MajorOpenSpaceID", //Outdoor Destinations
    128:"LotID", //Parking Lots
    129:"UASiteID", //UA Sites Statewide
    139:"ProjectNumber", //Projects
};

// End of variable declaration

// Start of init function. This is the function that will be called initially on application load.
// This has main components like initializing the map object and adding layers to it.

function init() {

  // This will be called whenever the browser window is resized. This calls another function to resize the height of the panels and jQXTree (For TOC)
  window.onresize=function(){

    //http://www.jquery4u.com/events/jquery-capture-window-resize-event/
    changePanelHeight(['#toc-panel','#identify-results','#search-panel','#search-results','#search-results-2','#tools-panel','#help-panel','#legend-panel']);

    if ($('.using-toc-content').is(':visible')){
      resizejQXTree([$('.using-toc-content').outerHeight(true)-17]);
    } else {
      resizejQXTree([0]);
    }

  };


  // This code was written to direct the application to use the correct proxy file. But, since the proxy is available both of Proto and Live, this code might be removed.
  if (window.location.port=="1980"){
    esri.config.defaults.io.proxyUrl = "http://maps.arizona.edu/proxy/proxy.ashx";
  }else {
    esri.config.defaults.io.proxyUrl = "../proxy/proxy.ashx";
  }

  // A function is called to read the REST endpoint of the services specified in config.txt file
  restEndpoint = getRestEndpointFromConfig();

  printUrl=restEndpoint+"Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
  customPrintUrl=restEndpoint+"CustomPrintJob/GPServer/Export%20Web%20Map";
  findTaskUrl=restEndpoint+"EnterpriseFeatures/MapServer";
  identifyTask = new esri.tasks.IdentifyTask(restEndpoint+"EnterpriseFeatures/MapServer");
  identifyParams = new esri.tasks.IdentifyParameters();

  // Determine if we should zoom into a building, and if so, do it!
    if (getParameterByName("shareId") == "" && getParameterByName("buildingId") != "") { 
	zoomToBuilding(getParameterByName("buildingId"));
    }

  // Extent of campus Tiled map service - Used to check for search results extent
  campusExtent=new esri.geometry.Extent(-12355180,3791408,-12348965,3795827,new esri.SpatialReference({wkid:3857}));

  // Different symbols used throughout the application. These are basic and they might be changed depending on functionality.
  SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
  SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
  SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([255,255,2]), 2),new dojo.Color([253,253,138,0.6]));
  highlightSymbol_Point=new esri.symbol.PictureMarkerSymbol('images/pushpin_24x24.png', 24, 24);
  highlightSymbol_Polyline=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
  highlightSymbol_Polygon=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,2]), 2), new dojo.Color([254,0,0,0.8]));


  // Setup the popup window
  var popup = new esri.dijit.Popup({
    fillSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([0,165,214]), 2),new dojo.Color([1,197,255,0.9])),
    lineSymbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3),
    markerSymbol: new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48)
  }, dojo.create("div"));


  // Creation of map object with the initial extent
  map = new esri.Map("map",{

    center: [-110.953, 32.232], // long, lat of UA Old main
    zoom:17,
    slider:false,
    logo:false,
    showAttribution:false,
    infoWindow:popup

  });


  // Scale bar object to be attached to the map object
  scalebar = new esri.dijit.Scalebar({map:map,attachTo:"bottom-left",scalebarStyle:"line"});


  // Adding Enterprise tiled map service and listening for errors
  enterprise_tile = new esri.layers.ArcGISTiledMapServiceLayer(restEndpoint+"enterprise/MapServer", {
    id: "enterprise",
    visible: false
  });
  dojo.connect(enterprise_tile, "onError", reportError);
  map.addLayer(enterprise_tile);


  // Adding Campus tiled map service and listening for errors
  campus_tile = new esri.layers.ArcGISTiledMapServiceLayer(restEndpoint+"campus/MapServer");
  campus_tile.id = "campus";
  dojo.connect(campus_tile, "onError", reportError);
  map.addLayer(campus_tile);


  // Adding Esri Streets Basemap
  streetsLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
  streetsLayer.id = "streetsLayer";
  streetsLayer.visible = true;
  map.addLayer(streetsLayer);
  map.reorderLayer(streetsLayer, 0);


  // Adding Esri World Imagery basemap
  imagery = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
  imagery.id = "imagery";
  imagery.visible = false;
  map.addLayer(imagery);


  // Adding a separate graphic layer to the map object to show up Real-time CatTran routing
  catTranLocations = new esri.layers.GraphicsLayer({id:"catTranLocations"});
  map.addLayer(catTranLocations);

  // Adding graphic layers for Search output. This has to be tested to see if a single graphic layer can hold features with different geometries - Point, Line and Polygon. If yes, 2 of these graphic layer could be removed.
  searchOutputGL_Point=new esri.layers.GraphicsLayer({id:"searchOutputGL_Point"});
  searchOutputGL_Polyline=new esri.layers.GraphicsLayer({id:"searchOutputGL_Polyline"});
  searchOutputGL_Polygon=new esri.layers.GraphicsLayer({id:"searchOutputGL_Polygon"});
  map.addLayers([searchOutputGL_Polygon,searchOutputGL_Polyline,searchOutputGL_Point]);

  // Adding graphic layers for Selection tool. This has to be tested to see if a single graphic layer can hold features with different geometries - Point, Line and Polygon. If yes, 2 of these graphic layer could be removed.
  selectPoint=new esri.layers.GraphicsLayer({id:"selectPoint"});
  selectPolyline=new esri.layers.GraphicsLayer({id:"selectPolyline"});
  selectPolygon=new esri.layers.GraphicsLayer({id:"selectPolygon"});
  map.addLayers([selectPoint,selectPolyline,selectPolygon]);

  // Adding transparent opLayers to the map object
  transparent60OpLayer = new esri.layers.ArcGISDynamicMapServiceLayer(
  restEndpoint+"EnterpriseFeatures/MapServer", {
      id: "transparent60OpLayer",
      visible: true
  });
  transparent60OpLayer.setVisibleLayers([-1]);
  transparent60OpLayer.setOpacity(0.4);
  map.addLayer(transparent60OpLayer);

  transparent30OpLayer = new esri.layers.ArcGISDynamicMapServiceLayer(
  restEndpoint+"EnterpriseFeatures/MapServer", {
      id: "transparent30OpLayer",
      visible: true
  });
  transparent30OpLayer.setVisibleLayers([-1]);
  transparent30OpLayer.setOpacity(0.7);
  map.addLayer(transparent30OpLayer);


  // This is the layer that is used to show all dynamic map features on the map
  opLayer = new esri.layers.ArcGISDynamicMapServiceLayer(
  restEndpoint+"EnterpriseFeatures/MapServer", {
      id: "opLayer",
      visible: true
  });
  opLayer.setVisibleLayers([-1]);
  map.addLayer(opLayer);


  // Adding a separate graphic layer to the map object for feedback and sketching
  sketchGraphics = new esri.layers.GraphicsLayer({id:"sketchGraphics"});
  map.addLayer(sketchGraphics);

  // This is the way we connect to any events on Esri JS API - Dojo way of connecting to different events
  dojo.connect(map, "onLoad", mapLoadHandler);


  // Connecting to map's onZoomEnd event, where function is called to disable the checkboxes
  dojo.connect(map, "onZoomEnd", function(extent, zoomFactor, anchor, level) {
    dimTOCCheckboxes();
    setTimeout(reformatLegendLabels, 10);
  });
  dojo.connect(opLayer, "onLoad", dimTOCCheckboxes);


  // Initializing the geometry service to be used for Measure task
  geometryService = new esri.tasks.GeometryService(restEndpoint+"Utilities/Geometry/GeometryServer");


  // Preventing the default form submission (in Feedback tool), so that a Python script is called when you hit on Submit
  $('#form').bind('submit',function(e){e.preventDefault();});


  // Validating any attachments uploaded to the Feedback tool
  $('#file').change(validateAttachment);

  // Measure pop-up shows ability to change different units for measurement. This is an event handler connected to a function whenever the measure unit is changed
  $('#measure_options').change(measureChange);

  // Configure listeners for all the "help" buttons
  // This is to show the help text when you click on "Refine your search" under Search tool
  $('.refineSearch').click(function(){
    $('.refineSearch-content').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Search Tool" under Search tool
  $('.howToSearch').click(function(){
    $('.howToSearch-content').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Query Tool" under Search tool
  $('.howToQuery').click(function(){
    $('.howToQuery-content').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Share Tool" under Share tool
  $('.howToShare').click(function(){
    $('.howToShare-content').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Measure Tool" under Measure tool
  $('.measure-help').click(function(){
    $('.measure-help-text').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Sketch Tool" under Sketch tool
  $('.sketch-help').click(function(){
    $('.sketch-help-text').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the Select Features Tool" under Select Features tool
  $('.howToSelectFeatures').click(function(){
    $('.howToSelectFeatures-content').slideToggle("slow");
  });

  // This is the help text shown when you click on "Tool summary" under Feedback tool
  $('.feedbackSummary').click(function(){
    $('.feedbackSummaryText').slideToggle("slow");
  });

  // This is the help text shown when you click on "Print Help" under the Print tool
  $('.print-help').click(function(){
    $('.print-help-text').slideToggle("slow");
  });

  // This is the help text shown when you click on "Using the TOC" under TOC
  // Once this happens, we need to call the function to resize the jQXTree as well, so that the complete layer list is shown without being cut-off + resize TOC panel height
  $('.using-toc').click(function(){
    $('.using-toc-content').slideToggle("slow",function(){
      changePanelHeight(['#toc-panel']);

      if ($('.using-toc-content').is(':visible')){
        resizejQXTree([$('.using-toc-content').outerHeight(true)-17]);
      } else {
        resizejQXTree([0]);
      }

    });
  });

  // This is for the delete button shown inside the Search textbox. This will be shown only when you type some text in the textbox.
  // When this button is clicked, clear off all the graphics added to the Search output graphic layers.
  $('.ui-input-clear').click(function(){
    map.getLayer("searchOutputGL_Point").clear();
    map.getLayer("searchOutputGL_Polyline").clear();
    map.getLayer("searchOutputGL_Polygon").clear();
  });

  // This is to add the loading bar (Red) to the map class whenever map is in loading state.
  // Removed when the map update is done
  dojo.connect(map,"onUpdateStart",function(){
    $("#map").addClass("mapUpdate");
  });

  dojo.connect(map,"onUpdateEnd",function(){
    $("#map").removeClass("mapUpdate");
  });

  // Connecting to all secured functionalities like authenticating the user credentials, logging out etc. Toby could explain it better
  initSecurity();
  $('#login.logoutButton').click(loggedOut);

  // Function to connect to display legend in the right panel
  $('#legendButton').click(function() {
    legend.refresh();
    reformatLegendLabels();
  });
  esri.bundle.widgets.legend.NLS_noLegend = "Go back and click on a layer";

  // By default, connecting the map's onclick event handler to perform Identify task, showing up the results in Info window/Pop-ups
  mapOnClickHandler=dojo.connect(map,"onClick",doIdentify);

  // Identify tool will be active only till the left panel is open. Once its closed, the variable is set to false.
  // Further map onclick events will show up Info window/Pop-ups
  $('#identify-results').panel({
    beforeclose: function (event, ui){
      identifyResultsPanelOpen=false;
      map.graphics.clear(); //Clear graphics when Identify results window is closed
    }
  });

  // Clear graphics when infowindow is closed
  dojo.connect(map.infoWindow,'onHide',function(evt){map.graphics.clear();});

  // For showing/hiding Identify tool
  if (isLoggedIn){
    $('.identifyDiv').css('display','inherit'); //Once logged-in during map load, show Identify tool in TOC
  } else {
    $('.identifyDiv').css('display','none'); //If not logged-in during map load, remove Identify tool from TOC
  }


  // Once the tool is activated, it remained active even after collapsing the container.
  // De-activate draw tools when Feedback/Measure is collapsed
  $('#collapseFeedback').bind('collapse',function(){
    tb.deactivate();
  });
  $('#collapseMeasure').bind('collapse',function(){
    tb_measure.deactivate();
  });


  // Calculate the new height of the panel excluding the header heights to have scrollbars visible
  changePanelHeight(['#identify-results','#search-panel','#search-results','#search-results-2','#tools-panel','#help-panel','#legend-panel']);

  // Function to trigger tabbed view for logged in users - Function present in Identify.js
  dojo.connect(map.infoWindow,'onSelectionChange',popupSelectionChange);

  // Apply CSS for Query tool (Available in Search)
  $('#select_a_value, #select_a_connecting_operator').parent().parent().css('width','78%');
  $('#select_a_value, #select_a_connecting_operator').parent().parent().css('display','inline-block');
  $('#generate_connecting_query').addClass('ui-disabled');
  $( "#appendQueryString" ).on( "slidestop", querySwitchButton ); //Function to activate the mode of adding additional query strings. Function is available in customQuery.js
  $(".downloadTable").on('click', function (event) {exportTableToCSV.apply(this, [$('#queryResults-table'), 'Query-Results.csv'])}); //Function to download output table as CSV. Function available in customQuery.js

  if ($.browser.name == "chrome" || $.browser.name == "firefox"){ //Show Download table option only in Chrome and Firefox
      $('.downloadTable').css('display','inline-block');
  } else {
      $('.downloadTable').css('display','none');
  }

  // Determine if the user is accessing the web system through an iframe on someone else's site, if so, hide some elements
  if (window!=window.top){ 
    // $("#banner-div").hide(); //hide top banner 
    $(".ui-block-d").remove();  //hide login button

  } else {//functionality only availablitiy in non-iframe map
    var geoLocate = new esri.dijit.LocateButton({
      map: map,
      useTracking: true,
      scale: 2446,
      geolocationOptions: {
        maximumAge: 0,
        timeout: 15000,
        enableHighAccuracy: false
      }
        //pointerGraphic: new Graphic(null, marker), // ex: new Graphic(null, new PictureMarkerSymbol('images/bluedot_retina.png', 21, 21)),
    }, "LocateButton");
    geoLocate.startup();
  }
} /*End of init*/

function reportError(error) {
  //this function is triggered by many error listeners. It sends the nature of the error to a python script that emails it to the proper authorities.
  //It then redirects the user to an error page.
  $("#errorMessage").val(error.message);
  var formData = new FormData($('#customError')[0]); // http://stackoverflow.com/questions/11341067/ajax-form-submit-with-file-upload-using-jquery
  // AJAX request to email the error message using the Python script: mail_error.py
  $.ajax({
    url:'py/mail_error.py',
    type: 'POST',
    data: formData,
    async: false,

    success: function (data) {
      //redirect users to the EGIS error page
      window.location="http://maps.arizona.edu/egis-error.html";
    },

    fail:function(jqXHR, textStatus) {
      //if for some reason the email didn't send, we can do things here, then finally redirect to the EGIS error page
      window.location="http://maps.arizona.edu/egis-error.html";
    },
    cache: false,
    contentType: false,
    processData: false
  });
}

// Function that cleans up strange labels in the TOC Legend
function reformatLegendLabels() {
//search through each legend label and strip all numbers off of the end of each string
  $(".esriLegendLayerLabel td").each(function(){
    var oldName = this.innerHTML;
    var newName = oldName.match(/^[^0-9]*/);
    if (newName) {
      this.innerHTML = newName[0];
    }
  });
}


// Function that will be called when the map is done loading.
function mapLoadHandler(map) {

  // Initialize the draw toolbars for Feedback tool
  tb = new esri.toolbars.Draw(map);
  dojo.connect(tb, "onDrawEnd", addGraphic);

  // Initialize the draw toolbars for Measure tool.
  // These had to be initialized during map load, so that they can be used anytime in the application
  tb_measure = new esri.toolbars.Draw(map);
  dojo.connect(tb_measure, "onDrawEnd", measure);

  //Build legend
  legend = new esri.dijit.Legend({
    map                   :map,
    respectCurrentMapScale:true,
    layerInfos            :[
    {
      layer:opLayer, title:"Layers Currently Visible:",
      hideLayers:[61,62,63,64,65,66,67,68,71,72,73,100,101,102,103,104,105,106]
    },
    {
      layer:transparent60OpLayer, title:"Layers with 60% Opacity",
    },
    {
      layer:transparent30OpLayer, title:"Layers with 30% Opacity",
    }
    ]
  }, "legendDiv");
  legend.startup();

  //listen to Layout dropdown, then adjust printOutline and print-recommendations accordingly
  $('#print_options').change(function(){
    var layout = $('#print_options option:selected').val();
    if (layout == "maponlyLetter") {
      printAreaWidth = 930;
      printAreaHeight = 680;
      $("#printOutline").css("border", "4px dotted red");
      $("#printOutline").css("width", printAreaWidth + "px");
      $("#printOutline").css("height", printAreaHeight + "px");
      $("#printOutline").css("margin-left", "-" + (printAreaWidth / 2) + "px");
      $("#printOutline").css("margin-bottom", "-" + (printAreaHeight / 2) + "px");

      $("#print-recommendations").html("Best results when printed in Landscape Orientation");
    }
    else if (layout == "legendandmapLetter") {
      printAreaWidth = 790;
      printAreaHeight = 490;
      $("#printOutline").css("border", "4px dotted red");
      $("#printOutline").css("width", printAreaWidth + "px");
      $("#printOutline").css("height", printAreaHeight + "px");
      $("#printOutline").css("margin-left", "-" + (printAreaWidth / 2) + "px");
      $("#printOutline").css("margin-bottom", "-" + (printAreaHeight / 2) + "px");

      $("#print-recommendations").html("Best results when printed in Portrait Orientation");
    }
    else if (layout == "legendonly") {
      printAreaWidth = -1;
      printAreaHeight = -1;
      $("#printOutline").css("border", "none");

      $("#print-recommendations").html("Best results when printed in Portrait Orientation");
    }
    else if (layout == "legendandmapTabloid") {
      $("#print-recommendations").html("Best results when printed in Portrait Orientation");
    }
    else if (layout == "maponlyTabloid") {
      $("#print-recommendations").html("Best results when printed in Landscape Orientation");
    }
  });

  //check TOC elements for layers that should be on from the beginning
  activateDefaultTOCElements();

  //Listen to panels opening and closing in order to assign the "selectedButton" class to the appropriate menu button
  $('div[data-role="panel"]').on("panelbeforeopen", function(evt){
    var panelMenuId = evt.target.id.split("-")[0];
    $('#'+panelMenuId).addClass('selectedButton');
    setTimeout(function(){
      $('#'+panelMenuId).addClass('selectedButton');
    }, 200);
  });

  $('div[data-role="panel"]').on("panelbeforeclose", function(evt){
    var panelMenuId = evt.target.id.split("-")[0];
    $('#'+panelMenuId).removeClass('selectedButton');
  });

}//end mapLoadHandler function

// This function is used to close the given panel
function closePanel(panel){
  if (panel == "query-results"){
    $('#'+panel).css('display','none');
  } else {
    $('#'+panel).panel('close');
  }
}


// Functions to Show/Hide the "Zoom to Extent" menu
function closeZoomMenu() {
  zoomMenuOpen = false;
  $("#zoomToExtentMenu").hide();
}
function showZoomMenu() {
  if (!zoomMenuOpen){
    zoomMenuOpen = true;
    $("#zoomToExtentMenu").show();
  }
  else{
    closeZoomMenu();
  }
}

// determine the configured REST endpoint for GIS services from the config file
function getRestEndpointFromConfig() {
  var restEndpoint;
  dojo.xhrGet({
      url: "config.txt",
      handleAs: "text",
      sync: true,
      handle: function (restEndpoints, args) {
          var endpointsArray = restEndpoints.split("\n");
          for (var i=0; i < endpointsArray.length; i++) {
              var url = endpointsArray[i];
              if (url.substring(0, 2) != "//") {
                  restEndpoint = url;
                  break;
              }
          }
      }
  });
  return restEndpoint;
}

// Helper functions for zooming in/out 1 level
function zoomIn(){
  map.setZoom(map.getZoom()+1);
}
function zoomOut(){
  map.setZoom(map.getZoom()-1);
}

// Function that zooms to the desired lat/lon + zoomlevel
// this is mainly used by the ZoomToExtent Menu
function zoomToExtent(lat,lon,zoomLevel) {
  var point = new esri.geometry.Point({
    latitude: lat,
    longitude: lon
  });

  map.centerAndZoom(point, zoomLevel);
}

// Zoom to the given UA Site Point given UA Site Id, wait 0.5 seconds, then open an InfoWindow with details
// this function is used by some of the elements on the ZoomToExtent Menu
function zoomToSitePoint(siteId, zoomLevel) {
  var queryTask;
  //TODO: Add this spot in the code to the spreadsheet of hard-coded layerids/layernames
  url = restEndpoint + "EnterpriseFeatures/MapServer/129";
  queryTask = new esri.tasks.QueryTask(url);
  query = new esri.tasks.Query();
  query.returnGeometry = true;
  query.outFields = ["*"];
  query.where = "UASiteID = " + siteId;
  queryTask.execute(query, function(featureSet) {
    var content = "";
    var feature = featureSet.features[0];
    var attributes = feature.attributes;
    if (attributes["Name"]!==null){
      content="<h2 class='infoHeader'> ${Name} </h2>";
    }
    if (attributes["Address"]!==null){
      content+="<p class='infoPara'> ${Address} <br/>";
    }
    if (attributes["County"]!==null){
      content+="County: ${County} <br/>";
    }
    if (attributes["URL"]!==null){
      content+="Site Website: <a href='${URL}' target='_blank'>Site Website</a> </p>";
    }

    map.centerAndZoom(feature.geometry, zoomLevel);

    var template = new esri.InfoTemplate("UA State Sites", content);
    feature.setInfoTemplate(template);

    setTimeout(function(){
      map.infoWindow.setFeatures([feature]);
      if ($(window).width() >= 768){map.infoWindow.show(feature.geometry);}
    }, 500);

  });

}

// Function used to send requests to Transloc API to get real time CatTran feeds
function getLiveGPSFeed(routeIds){

  // Transloc - UofA - Agent id -- http://api.transloc.com/1.2/agencies.json?geo_area=32.232,-110.953|75.5
  // Transloc - UofA - Routes -- http://api.transloc.com/1.2/routes.json?agencies=371
  // Transloc - UofA - USA/Downtown route -- http://api.transloc.com/1.2/vehicles.json?agencies=371&routes=8001996
  // Transloc Doc -- http://api.transloc.com/doc/
  // USA/Downtown = 8002924, Outer Campus Loop = 8002000, North/South = 8002004, Mountain Avenue = 8002916, Inner Campus Loop = 8002012, Nightcat = 8002920, SE Off Campus/UA Mall = 8002024

  ajaxGPSRequest = $.ajax({
    type: "GET",
    data: {},
    dataType:'json',
    url: 'https://transloc-api-1-2.p.mashape.com/vehicles.json?agencies=371&callback=successGPSRequest&routes='+routeIds,
    success: successGPSRequest,
    error: errorGPSRequest,
    beforeSend: function(xhr) {
        xhr.setRequestHeader('X-Mashape-Authorization', 'LkxL7NhCRxEnnkB5frdi3i4iprLYgS6h');
    }
  });

}

// Function called when the request to Transloc API failed
function errorGPSRequest(XMLHttpRequest, textStatus, errorThrown){
    console.log(textStatus+" "+errorThrown);
}


// Function called when the request to Transloc API is successfull
function successGPSRequest(data){
    if (abortFeed == false && visibleBuses.length > 0 && data.data[371] !== undefined) {
      // Fire this request every 1 sec to get the real-time CatTran GPS feed
      setTimeout('getLiveGPSFeed([' + visibleBuses + '])',1000);
      catTranLocations.clear();

      // 371 is the agency code for University of Arizona, set by Transloc
      for (var i=0;i<data.data[371].length;i++){

        lat=data.data[371][i].location.lat;
        lng=data.data[371][i].location.lng;

        switch (data.data[371][i].route_id) {
          case "8002924": //USA/Downtown
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriBluePin_64x64.png', 48, 48);
            break;
          case "8002000": //Outer Campus Loop
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriGreenPin_64x64.png', 48, 48);
            break;
          case "8002004": //North/South
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriPurplePin_64x64.png', 48, 48);
            break;
          case "8002916": //Mountain Avenue
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriOrangePin_64x64.png', 48, 48);
            break;
          case "8002012": //Inner Campus Loop
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriTealPin_64x64.png', 48, 48);
            break;
          case "8002920": //Nightcat -- Need dark green symbol
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriBlackPin_64x64.png', 48, 48);
            break;
          case "8002024": //SE Off Campus/UA Mall -- Need pink symbol
            SimpleMarkerSymbolB=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 48, 48);
            break;
        }

        SimpleMarkerSymbolB.setOffset(0,23);
        //add current location to the map
        mapPoint=new esri.geometry.Point(lng,lat);
        catTranLocations.add(new esri.Graphic(mapPoint,SimpleMarkerSymbolB));

      }
    } else {
      stopLiveGPSFeed();
    }
}

// Start Live GPS feed - Once the checkbox is enabled in TOC
// Stop Live GPS feed - Once the layer is turned OFF in TOC
function startLiveGPSFeed(busIds){
  abortFeed = false;
  console.log("Starting Live GPS Feed...");
  getLiveGPSFeed(busIds);
}

function stopLiveGPSFeed(){
  abortFeed = true;
  if (ajaxGPSRequest){
    console.log("Stopping Live GPS Feed...");
    ajaxGPSRequest.abort();
    catTranLocations.clear();
    busesRunning = false;
  }
}

// Whenever draw tool is active, it disabled map pan and Info windows/Pop-ups
function disableClickActions(){
  console.log("DISABLING CLICK ACTIONS");
  map.disablePan();
  dojo.disconnect(mapOnClickHandler);
  console.log("POPUP SHOULD BE DISABLED!");
  mapOnClickHandler = null;
}

// Re-enabling the map pan and Info windows/Pop-ups
function reenableClickActions(){
  console.log("Re-enabling click actions");
  map.enablePan();
  mapOnClickHandler = dojo.connect(map,"onClick",doIdentify);
}

//Function called when Identify tool is active
function identifyActive(){
  identifyTool=true; //This variable will be set to true, so that Info window doesn't show up on map click. Instead, attributes will be shown in left panel
}

// Function to toggle Esri basemaps (Street/Imagery) and UofA campus/enterprise map service
// This also changes the background image of "Toggle Aerial/Basemap" button
function toggleAerial(){
  if(aerialOnTop) {
    aerialOnTop = false;
    map.getLayer("imagery").setVisibility(false);
    $('#toggleAerialButton').removeClass("aerialMap").addClass("normalMap");
    if (isLoggedIn) {
      deactivateZoomBlocker();
    }
  }
  else {
    aerialOnTop = true;
    activateZoomBlocker();
    map.getLayer("imagery").setVisibility(true);
    $('#toggleAerialButton').removeClass("normalMap").addClass("aerialMap");
  }
}

// Function that will clear all temporary graphics + map's graphic layers, when "Clear All Graphics" button is clicked
function clearMap(){
  map.graphics.clear();
    sketchGraphics.clear();

  for (var i=0;i<map.graphicsLayerIds.length;i++){
    map.getLayer(map.graphicsLayerIds[i]).clear();
  }

  //Once Clear All Graphics button is clicked, it should clear all temporary graphics, map graphic layers. Plus, the Search results and More Info panel to be reverted to main Search page.
  if ($('#search-results.ui-panel-open').is(':visible') || $('#search-results-2.ui-panel-open').is(':visible')){
    $('#search-panel').panel('open');
  }

}


// This changes all the panel heights to have scrollbar relative to the current browser height
function changePanelHeight(panelIDList){
  var panelheight=$(window).height() - 73;
  $.each(panelIDList,function(index,panelID){
    $(panelID).css('height',panelheight+"px");
    $(panelID).css('min-height',panelheight+"px");
  });
}


// A separate function to resize the jQXTree height (TOC Layers) to avoid text cut-offs
function resizejQXTree(excludedHeight){
  var jqxTreeHeight = $(window).height() - 73 - $("#tocHeader").height() - $("#aerialDiv").height() - $(".using-toc").outerHeight(true) - excludedHeight[0] - 69;
  $('#tocTree').jqxTree({height:jqxTreeHeight + "px"});
  $('#tocTree').jqxTree('refresh');
}

//check for parameters in the URL. If no results are found return null, else return results or 0.
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//this function will check to see if a Javascript Object is empty (without jquery!)
function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }

  return true;
}

function openSharePanel() {
  $('#tools-panel').panel('open');
  $("#shareHeader").trigger("expand");
  generateShareURL();
}

function openEmbedPanel() {
  $('#tools-panel').panel('open');
  $("#embedHeader").trigger("expand");
  generateEmbedMapHTML();
}

function zoomToBuilding(buildingId) {
  var queryTask;
  //TODO: Add this spot in the code to the spreadsheet of hard-coded layerids/layernames
  url = restEndpoint + "EnterpriseFeatures/MapServer/74";

  queryTask = new esri.tasks.QueryTask(url);
  query = new esri.tasks.Query();
  query.returnGeometry = true;
  query.outFields = ["*"];
  //query.where = "BID = " + buildingId;
  query.where = "SpaceNumLetter = '" + buildingId + "'";
  queryTask.execute(query, function(featureSet) {
    //var content = "";
    var feature = featureSet.features[0];
    //var attributes = feature.attributes;
    //if (attributes["Name"]!==null){
      //content="<h2 class='infoHeader'> ${Name} </h2>";
    //}
    //if (attributes["Address"]!==null){
      //content+="<p class='infoPara'> ${Address} <br/>";
    //}
    //if (attributes["County"]!==null){
      //content+="County: ${County} <br/>";
    //}
    //if (attributes["URL"]!==null){
      //content+="Site Website: <a href='${URL}' target='_blank'>Site Website</a> </p>";
    //}
      map.centerAndZoom(feature.geometry.getCentroid(), 19);

      var evt = new Object();
      evt.mapPoint = feature.geometry.getCentroid();

      setTimeout(function(){doIdentify(evt);}, 200);

//    var template = new esri.InfoTemplate("UA State Sites", content);
//    feature.setInfoTemplate(template);

//    setTimeout(function(){
//      map.infoWindow.setFeatures([feature]);
//      if ($(window).width() >= 768){map.infoWindow.show(feature.geometry);}
//    }, 500);

  });

}

// This is where the init function is called. dojo.ready will be fired as soon as Esri JS API loads, as it is based on Dojo framework
dojo.ready(init);