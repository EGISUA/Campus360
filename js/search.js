// Perform search when "Enter" is pressed in keyboard. Keycode for Enter = 13
function search_keydown(e){

  	if (e == "doSearch" || e.keyCode=="13") { // Run this code only if user has pressed "Enter" (Keycode = 13) in the search box OR clicked the search button

      findTaskLayerIds = [];
      findTaskSearchFields = [];
      checkboxCheckedCount = 0; // To check the number of checkboxes checked under "Refine your search"

      // Loop through each checkbox to find the checked ones and build Layer IDs to search for and search fields
      $('.refineSearch-content input:checked').each(function() {

        checkboxCheckedCount = checkboxCheckedCount + 1;
        switch ($(this).attr('id'))
        {
          case "uaStreets":
            findTaskLayerIds.push(106,102); // Streets (106), Intersections (102)
            findTaskSearchFields.push("Name","NameLabels","Name2","NameIntersection");
            break;

          case "uaAttractionsLandmarks":
            findTaskLayerIds.push(85,19,86,87,88); // Libraries (85), Places To Eat (19), Museums (86), Galleries (87), Performance Venues (88)
            findTaskSearchFields.push("HighlightName","name","building_name","Name","HomeBuildingName");
            break;

          case "uaLandscapeInformation":
            findTaskLayerIds.push(15); // Tree 1128minus (15)
            findTaskSearchFields.push("CommonName","Genus","SpecificEpithet","Family","AccessionID");
            break;

          case "uaProjects":
            findTaskLayerIds.push(139); // Projects (139)
            findTaskSearchFields.push("project_num","title","status");
            break;

          case "basicSearch":
            findTaskLayerIds.push(74,91,129,128,112); //Buildings(74), Major Athletic Sites(91), UA Sites Statewide(129), Parking Lots(128), Outdoor Destinations(112)
            findTaskSearchFields.push("SpaceNumLetter","Address","Name","PTSNum","AliasName"); // Search fields for basic search
            break;
        }

      });

      if (checkboxCheckedCount > 0) { // Run search function only if atleast one checkbox is checked
        search_layers();
      } else {
        $('#search_error').html("Please select atleast one category to search for.");
      }


    }

}

// Whenever a search result is clicked, this function is called to zoom to the feature and show the information in "More Info" panel
function zoomToFeature(feature,layerName){
    $('#search-results-2').panel("open");
    map.graphics.clear();

    if (feature.geometry.type !="point"){
      map.setExtent(feature.geometry.getExtent().expand(5));
    }else {
      map.centerAndZoom(feature.geometry,20);
    }

    var tocItem, moreInfoLabels;

    // Define which attributes will show up in the "More Info" panel depending on the layer name
    switch (layerName)
    {
      case "Buildings":
        searchAttr=["Name","Address","SpaceNumLetter","BuildingUse"];
        moreInfoLabels=["","Address","Building Number","Building Use"];
        break;
      case "Parking Lots":
        searchAttr=["Name","Address","Type","PTSNum"];
        moreInfoLabels=["","Address","Lot Type","Lot Number"];
        break;
      case "Major Athletic Sites":
        searchAttr=["Name","Users","Location"];
        moreInfoLabels=["","Users","Location"];
        tocItem = ".lyrAthletics";
        break;
      case "UA Sites Statewide":
        searchAttr=["Name","Phone","Address","City","County","Type","UASiteID"];
        moreInfoLabels=["","Phone","Address","City","County","Site Type","UA Site ID"];
        tocItem = ".lyrStateLocations";
        break;
      case "Outdoor Destinations":
        searchAttr=["Name","Type"];
        moreInfoLabels=["","Open Space Type"];
        tocItem = ".lyrOutdoorDestinations";
        break;
      case "Libraries":
        searchAttr=["HighlightName","Name","SpaceNum"];
        moreInfoLabels=["","Building Name","Building Number"];
        tocItem = ".lyrLibraries";
        break;
      case "Places To Eat1128":
        searchAttr=["name","building_name","building_number","url"];
        moreInfoLabels=["","Building Name","Building Number","Website"];
        tocItem = ".lyrPlacesToEat";
        break;
      case "Museums":
        searchAttr=["Name","HomeBuildingName","HomeSpaceNumLetter","url"];
        moreInfoLabels=["","Building Name","Building Number","Website"];
        tocItem = ".lyrMuseums";
        break;
      case "Galleries":
        searchAttr=["Name","HomeBuildingName","HomeSpaceNumLetter","url"];
        moreInfoLabels=["","Building Name","Building Number","Website"];
        tocItem = ".lyrGalleries";
        break;
      case "Performance Venues":
        searchAttr=["Name","HomeBuildingName","HomeSpaceNumLetter","url"];
        moreInfoLabels=["","Building Name","Building Number","Website"];
        tocItem = ".lyrPerformanceVenues";
        break;
      case "Streets":
        searchAttr=["Name"];
        moreInfoLabels=[""];
        break;
      case "IntersectionLabels564_282":
        searchAttr=["NameIntersection"];
        moreInfoLabels=[""];
        break;
      case "Tree 1128minus":
        searchAttr=["CommonName","Genus","SpecificEpithet","Family","AccessionID","LifeformDescription","GeographicOrigin"];
        moreInfoLabels=["","","","Family","Accession ID Number","Plant Form","Origin of Plant"];
        tocItem = ".lyrTrees";
        break;
      case "Projects":
        searchAttr=["title","project_num","status","URL"];
        moreInfoLabels=["","Project Number","Project Status","Project Website"];
        tocItem = ".lyrProjects";
        break;
    }

    // turn on the appropriate layer in the TOC
    if (tocItem !== undefined) {
      var item = $("#tocTree").jqxTree('getItem', $(tocItem)[0]);
      if (item.disabled) {
        $("#tocTree").jqxTree('enableItem', $(tocItem)[0]);
        $("#tocTree").jqxTree('checkItem', $(tocItem)[0], true);
        $("#tocTree").jqxTree('disableItem', $(tocItem)[0]);
      }
      else {
        $("#tocTree").jqxTree('checkItem', $(tocItem)[0], true);
      }
    }

    // Generate the content as an HTML string and append it to the "More Info" panel
    var content="";
    content="<h2 id='h2_outputInfo'>"+feature.attributes[searchAttr[0]]+"</h2><p id='p_outputInfo'>";

    for (var i=1;i<searchAttr.length;i++){
      if (feature.attributes[searchAttr[i]] !== null && feature.attributes[searchAttr[i]] !== "Null" && feature.attributes[searchAttr[i]] !== undefined && feature.attributes[searchAttr[i]] !== " "){
        //If Species isn't null, print Genus and Species together in one line
        if (searchAttr[i] == "Genus" && feature.attributes[searchAttr[i+1]] !== null && feature.attributes[searchAttr[i+1]] !== "Null") {
          content+= "<em>"+feature.attributes[searchAttr[i]]+" "+feature.attributes[searchAttr[i+1]]+"</em><br/>";
          i++;
        }
        else {
          content+= moreInfoLabels[i]+": "+feature.attributes[searchAttr[i]]+"<br/>";
        }
      }
    }

    //Generate photo for the designate layers
    var layersWithPhotos = ["Buildings","Libraries","Places To Eat1128","Museums","Galleries","Performance Venues","Tree 1128minus","Major Athletic Sites","UA Sites Statewide","Parking Lots"];
    if (layersWithPhotos.indexOf(layerName) > -1){
      content+="<img class='img_panel' src='http://maps.arizona.edu/WebBuildingPhotos/"+feature.attributes["SpaceNumLetter"]+".jpg' onerror='missingBuildingPhoto(this);'/>";
    }

    $('#search_output_2').html(content);

    highlightSymbol_Point=new esri.symbol.PictureMarkerSymbol('images/esriRedPin_64x64.png', 64, 64);
    highlightSymbol_Polygon=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,2]), 2), new dojo.Color([254,0,0,0.8]));
    // We are highlighting only polygon and point features. TODO: For Lines. Function is in customQuery.js
    highlightFeatureinGL('searchOutputGL_Polygon',SimpleFillSymbol,highlightSymbol_Polygon,feature);
    highlightFeatureinGL('searchOutputGL_Point',SimpleMarkerSymbol,highlightSymbol_Point,feature);

    //Show infowindow only for UA Sites Statewide and if the screen width is >= 768 (will show up only on Tablets and Desktops)
    if (layerName=="UA Sites Statewide" && $(window).width() >= 768){

      map.infoWindow.setTitle("UA State Sites");
      map.infoWindow.setContent(content);
      setTimeout(function(){map.infoWindow.show(feature.geometry)},500);

    } else if (map.infoWindow.isShowing){
        map.infoWindow.hide();
    }
}

// When there is no image for a building, it shows up the "NoImage" icon pre-loaded on our web server
function missingBuildingPhoto(image) {
    image.onerror = "";
    image.src = "images/noimage.gif";
    return true;
}

// Functionality yet to be implemented
function advanced_search(){
  search_layers();
}

// Initializing and executing Esri Find task when search button is clicked
// searchFields had to be changed here, if needed
function search_layers(){
	if ($('#search_input').val()){
		$('#search_error').html("Searching.. Please wait..");
    $('#search_button').addClass("waiting");

    findTask = new esri.tasks.FindTask(findTaskUrl);
    findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = findTaskLayerIds;
    findParams.searchFields = findTaskSearchFields;
    findParams.outSpatialReference = map.spatialReference;
    findParams.searchText = $('#search_input').val();
	  findTask.execute(findParams,showResults,findFailed);

	}else {
		$('#search_error').html("Enter a valid keyword to search");
    $('#search_button').removeClass("waiting");
    clearGraphics();
	}
}

// Once the Esri find task is complete, this function is called to show up the results on the map + showing the results as listviews in the right panel
function showResults(results){
	  map.graphics.clear();

    $('#search_button').removeClass("waiting");
    if (results.length>0) {
      clearGraphics();
      $('#search_ul').empty();
      $('#search_error').html("");
      $('#search-results').panel("open");
      $('#search_results_header').html("Search results for '"+$('#search_input').val()+"'");

      var i=0;

      // Here's a more flexible version, which allows you to create
      // reusable sort functions, and sort by any field
      var sort_by = function(field, reverse, primer){

         var key = primer ?
             function(x) {return primer(x[field])} :
             function(x) {return x[field]};

         reverse = [-1, 1][+!!reverse];

         return function (a, b) {
             return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
           }

      }
      // End of sort_by function

      // This code is to sort the output features obtained after find task
      resultsByLayerId=results; // The resultant features aren't sorted based on Layer ID. The order in which search layer IDs are mentioned in the code, the results are going to be in the same order.
      //results.sort(sort_by('layerId',false,parseInt)); // This sorting isn't used after configuring advanced search
      layerIds=[];
      for (var i=0;i<resultsByLayerId.length;i++){
        if (jQuery.inArray(resultsByLayerId[i].layerId,layerIds)==-1){
          layerIds.push(resultsByLayerId[i].layerId);
        }

      }

      featuresPerLayer=[];
      for (var i=0;i<layerIds.length;i++){
        count=0;
        for (var j=0;j<resultsByLayerId.length;j++){
          if (resultsByLayerId[j].layerId==layerIds[i]){
            count=count+1;
          }
        }
        featuresPerLayer.push(count);
      }

      sortedFeatures=[]; startIndex=0;
      for (var i=0;i<layerIds.length;i++){
        tempArray=resultsByLayerId.slice(startIndex,featuresPerLayer[i]+startIndex);
        startIndex=featuresPerLayer[i]+startIndex;
        tempArray.sort(sort_by('foundFieldName',false,function(a){return a.toUpperCase()})); //sortByKey function is not used here, as it doesn't have the ability to sort descending
        for (var j=0;j<tempArray.length;j++){
          sortedFeatures.push(tempArray[j]);
        }

      }
      // End of sorting code

      // Loop through the sorted results to show up information in right panel and add all these results as graphics to the graphic layers
      // If you don't need the search results to be sorted, replace 'sortedFeatures' with 'results' variable
      var items = dojo.map(sortedFeatures,function(result){

        //Only loop through results that contain a full word match for the search keyword
        var pattern = new RegExp('\\b' + $('#search_input').val() + '\\b','i');
        if (pattern.test(result.value)) {

          var graphic = result.feature;
          var primaryDisplayField;
          var secondaryDisplayField;
          var firstLabel = "", 
              secondLabel = "";

          // Override the default symbology to show up the search results in different color code
          SimpleMarkerSymbol=new esri.symbol.PictureMarkerSymbol('images/esriYellowPin_64x64.png', 48, 48);
          SimpleLineSymbol=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,new dojo.Color([255,0,0]), 3);
          SimpleFillSymbol=new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([255,255,2]), 2),new dojo.Color([253,253,138,0.6]));

          // Depending on the geometry type, assign the symbol to the graphic and add them to the corresponding graphic layers
          switch (graphic.geometry.type)
          {
            case "point":
            graphic.setSymbol(SimpleMarkerSymbol);
            setTimeout(function(){searchOutputGL_Point.add(graphic);},0);
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

          // Once the search is complete, the search results had to be shown as a Listview in the "Search Results" panel.
          // The search results had to be grouped based on the layer name, which should have the ability to collapse/expand
          // This code generates a List divider (jQuery Mobile term) to have a layer name for each category
          if ($('#li_'+result.layerId).length==0){
            $('#search_ul').append('<li class="li_searchCategory" id="li_'+result.layerId+'" data-role="list-divider"><div class="img_collapse_expand"/>'+result.layerName+'</li>');

            // This is to add a different class to advanced search categories, so that a different color could be applied, also fix labels
            switch (result.layerName)
            {
              case "Streets":
              $('#li_'+result.layerId).addClass('advancedSearch_Streets');
              break;

              case "IntersectionLabels564_282":
              $('#li_'+result.layerId).addClass('advancedSearch_Streets');
              $('#li_'+result.layerId).html('<div class="img_collapse_expand"></div>Intersections');
              break;

              case "Places To Eat1128":
              $('#li_'+result.layerId).addClass('advancedSearch_uaAttractionsLandmarks');
              $('#li_'+result.layerId).html('<div class="img_collapse_expand"></div>Places To Eat');
              break;

              case "Libraries":
              case "Museums":
              case "Galleries":
              case "Performance Venues":
              $('#li_'+result.layerId).addClass('advancedSearch_uaAttractionsLandmarks');
              break;

              case "Tree 1128minus":
              $('#li_'+result.layerId).addClass('advancedSearch_LandscapeInformation');
              $('#li_'+result.layerId).html('<div class="img_collapse_expand"></div>Landscape Information');
              break;

              case "Projects":
              $('#li_'+result.layerId).addClass('advancedSearch_uaProjects');
              $('#li_'+result.layerId).html('<div class="img_collapse_expand"></div>UA Projects');
              break;

            }
          }


          // Each search result had to be formatted in a different way to show up on the right panel, which depends on layer name
          // This switch case is written in order to create listview for each feature with a primary and secondary display field
          // The field where the Find task found a match with the input text is the Primary display field
          // Depending on the Primary display field, secondary display field was set for each layer (As per the spreadsheet in the sharepoint)
          switch(result.layerName)
          {
            case "Buildings":
            if (result.foundFieldName=="Name"){
              secondaryDisplayField="Address";
            }else if (result.foundFieldName=="AliasName"){
              secondaryDisplayField="Name";
              firstLabel="AKA: ";
              secondLabel="Building Name: ";
            }else if (result.foundFieldName=="SpaceNumLetter"){
              secondaryDisplayField="Name";
              firstLabel="Building Number: ";
            }else {
              secondaryDisplayField="Name";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Parking Lots":
            if (result.foundFieldName=="Name"){
              secondaryDisplayField="Address";
              secondLabel = "Address: ";
            }else if (result.foundFieldName=="PTSNum"){
              secondaryDisplayField="Name";
              secondLabel = "Lot type: ";
            }else if (result.foundFieldName=="Address"){
              secondaryDisplayField="PTSNum";
              secondaryLabel = "Lot Number :";
            }else {
              secondaryDisplayField="Name";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Major Athletic Sites":
            secondaryDisplayField="Location";
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "UA Sites Statewide":
            if (result.foundFieldName=="Name"){
              secondaryDisplayField="Address";
            }else {
              secondaryDisplayField="Name";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Outdoor Destinations":
            if (result.foundFieldName=="Name"){
              secondaryDisplayField="Type";
            }else {
              secondaryDisplayField="Name";
            }
            secondLabel = "Open Space Type: ";
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Streets":
            if (result.foundFieldName=="NameLabels"){
              secondaryDisplayField="Name";
            }else if (result.foundFieldName=="Name"){
              secondaryDisplayField=null;
            }else if (result.foundFieldName=="Name2"){
              secondaryDisplayField="Name";
            }
            if (result.feature.attributes["NameLabels"] != "Null") {
              if (secondaryDisplayField == null){
                $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">Street Segment</p></a></li>');
              }
              else {
                $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
              }
            }
            break;

            case "IntersectionLabels564_282":
            secondaryDisplayField="";
            if (result.feature.attributes["NameIntersection"] != "Null") {
              $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">Street Intersection</p></a></li>');
            }
            break;

            case "Libraries":
            if (result.foundFieldName=="HighlightName"){
              secondaryDisplayField="Name";
              secondLabel = "Building Name: ";
              $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            }
            break;

            case "Places To Eat1128":
            if (result.foundFieldName=="name"){
              secondaryDisplayField="building_name";
              secondLabel = "Building: ";
            }else if (result.foundFieldName=="building_name"){
              secondaryDisplayField="name";
              firstLabel = "Building: ";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Museums":
            case "Galleries":
            case "Performance Venues":
            if (result.foundFieldName=="Name"){
              secondaryDisplayField="HomeBuildingName";
              secondLabel = "Building: ";
            }else if (result.foundFieldName=="HomeBuildingName"){
              secondaryDisplayField="Name";
              firstLabel = "Building: ";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;

            case "Tree 1128minus":
            if (result.foundFieldName=="CommonName"){
              firstLabel = "";
            }else if (result.foundFieldName=="Family"){   
              firstLabel = "Family: ";           
            }else if (result.foundFieldName=="Genus"){   
              firstLabel = "Genus: ";           
            }else if (result.foundFieldName=="SpecificEpithet"){ 
              firstLabel = "Species: ";             
            }else if (result.foundFieldName=="AccessionID"){   
              firstLabel = "Accession ID Number: ";           
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+result.feature.attributes["Genus"]+' '+result.feature.attributes["SpecificEpithet"]+'</p></a></li>');
            break;

            case "Projects":
            if (result.foundFieldName=="project_num"){
              secondaryDisplayField="title";
              firstLabel = "Project Number: ";
            }else if (result.foundFieldName=="title"){
              secondaryDisplayField="project_num";
              secondLabel = "Project Number: ";
            }else if (result.foundFieldName=="status"){
              secondaryDisplayField="title";
              firstLabel = "Project Status: ";
            }
            $('#search_ul').append('<li class="li_'+result.layerId+'"><a id="a_li_'+i+'"><h2 class="h2_li">'+firstLabel+result.feature.attributes[result.foundFieldName]+'</h2><p id="p_li">'+secondLabel+result.feature.attributes[secondaryDisplayField]+'</p></a></li>');
            break;
          }

          // On each feature click(row click on listview), I am binding it to a function with the feature (to retrieve the geometry) and layer name (to format the fields showing up in the panel)
          $('#a_li_'+i).bind('click',function(){
            zoomToFeature(result.feature,result.layerName);
          });
          i=i+1;

          return result.feature.attributes;
        }
      });

      $('#search_ul').listview('refresh',true);


      // This code snippet is responsible for making the list view collapsible/expand when the list divider (layer name) is clicked
      // Also, this changes the image icon associated with those dividers
      $('.ui-li-divider').click( function( ev ){
        var li = $(ev.target).next(':not(.ui-li-divider)');
        var b = li.is(':visible');
        /*When divider is clicked, change the image associated with divider to either collapsible/expanded icon*/
        if (b){
          $(ev.target).children().css('background-image','url(images/collapse.png)');
        }else {
          $(ev.target).children().css('background-image','url(images/expand.png)');
        }
        /*Expand or collapse li's inside the divider*/
        while ( li.length > 0 ) {
          if (b)
            li.hide()
          else
            li.show();
          li = li.next(':not(.ui-li-divider)');
        }
      });

      //Unless there's a search in the querystring (from a shared URL), Zoom to Search Results output extent
      if(disableZoomToSearchResultsList === false) {
          // If campus Tiled map service extent contains the Search output (polygon) extent, Set the map extent to the Search output (polygon)
          if (searchOutputGL_Polygon.graphics.length > 0) {
            if (campusExtent.contains(esri.graphicsExtent(searchOutputGL_Polygon.graphics))){
              map.setExtent(esri.graphicsExtent(searchOutputGL_Polygon.graphics));
            }

            else { // Else set the extent to campusExtent
              map.setExtent(campusExtent);
            }
          }
      }
      //Assigned to true if "search" exisited in QueryString. If so, set back to false now that the search launched by the qs has run once.
      disableZoomToSearchResultsList = false;

    } else {
      $('#search_error').html("No features found");
      $('#search_button').removeClass("waiting");
      clearGraphics();
    }

    // Call the highlight function to highlight the search'ed text in the entire "Search results" panel
    // Don't search the dividers - These are headers, showing layer names
    $('#search_ul > li:not([data-role="list-divider"]) > div > div > a').each(function(index){
      customHighlight($(this)[0], $('#search_input').val(),'jqm-search-results-highlight');
    });
    $('.ui-li-desc > span[class="jqm-search-results-highlight"]').css('background','none'); //Highlighting was done on secondary fields as well, which is removed here

}

// Function called whenever the Find task fails
function findFailed(error){
	$('#search_error').html("No features found");
  $('#search_button').removeClass("waiting");
  clearGraphics();
}

// Function to clear the graphics added to these graphic layers
function clearGraphics(){
  map.getLayer('searchOutputGL_Point').clear();
  map.getLayer('searchOutputGL_Polyline').clear();
  map.getLayer('searchOutputGL_Polygon').clear();
}

/* THIS CODE IS NO LONGER USED - THIS DOESN'T HAVE THE ABILITY TO SORT DESCENDING
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
*/

// This function is to highlight the search'ed text in the search-results panel
function customHighlight(container,what,spanClass) {
    var content = container.innerHTML,
        pattern = new RegExp('(>[^<.]*)\\b(' + what + ')\\b([^<.]*)','ig'),
        replaceWith = '$1<span ' + ( spanClass ? 'class="' + spanClass + '"' : '' ) + '">$2</span>$3',
        highlighted = content.replace(pattern,replaceWith);
    return (container.innerHTML = highlighted) !== content;
}

