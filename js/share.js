function generateShareURL () {
	var centerX = Math.round(map.extent.getCenter().x);
	var centerY = Math.round(map.extent.getCenter().y);
	var lod = map.getZoom();


        var longUrl =  window.location.href.split('?')[0] + "?shareId="

	var checkedLayers = "";
	//loop through each jqxTree item
	$.each($("#tocTree").jqxTree("getItems"), function() {

		// if the checkbox is checked and the checkbox does NOT start with an ID of "group"
		if(this.checked && !this.element.id.startsWith("group")) {

			// get the element's first Class name and remove the "lyr" from it.
			var lyr = this.element.className.split(" ")[0].substring(3);

			// there are duplicate layer entries in the TOC... check for em!
			if (checkedLayers.search(lyr) === -1)
				checkedLayers = checkedLayers + lyr + ",";
		}
	});

	//if toc has at least one checked layer, remove trailing comma
	if (checkedLayers.length > 0) {
		checkedLayers = checkedLayers.substring(0, checkedLayers.length - 1);
	}

	//Check for info window
	if (map.infoWindow.isShowing === true) {
		var iwx = Math.round(map.infoWindow.location.x);
		var iwy = Math.round(map.infoWindow.location.y);
    }

	//Check for search terms
	if($("#search_input").val()) {
		var searchTerms = $("#search_input").val();
	}

    //Check for imagery layer
    if (map.getLayer("imagery").visible) {
    	var imageryLayer = true;
    }

    //Check for selection set
    if (!isEmpty(selectionSet)) {
    	var selections = "";
    	for (layerId in selectionSet) {
    		selections = selections + layerId + "-" + selectionSet[layerId] + ";";
    	}
    }

    //Check for Sketched Graphics
    if (sketchGraphics.graphics.length > 0) {
	var sketches = []
	for (var i=0; i < sketchGraphics.graphics.length; i++) {
	    sketches.push(sketchGraphics.graphics[i].toJson());
	}
    }

	var shareObject = {
		centerX: centerX,
		centerY: centerY,
		lod: lod,
		checkedLayers: checkedLayers,
		infoWindowX: iwx,
		infoWindowY: iwy,
		searchTerms: searchTerms,
		imageryLayer: imageryLayer,
	        selectionSet: selections,
	        sketches: sketches
	};

    document.getElementById("shareData").value = dojo.toJson(shareObject);
    
    var formData = new FormData($("#shareForm")[0]);

//send AJAX request to python script
	$.ajax({
          url:'py/create_share_link.py',
          type: 'POST',
          data: formData,
          async: false,
          
          success: function (data) {
            $("#embedUrl").html("Feedback submitted. Creating shortlink");
	      
//	      var storedData = $.parseJSON(data);
//	      console.log(storedData);
	      longUrl = longUrl + data;
	      console.log(longUrl);

	      $("#embedUrl").val(longUrl);
	      $("#embedHtml").val('<iframe src="' + longUrl + '" width="480" height="480"</iframe>');
          },

          fail:function(jqXHR, textStatus) {
            $("#embedUrl").html("Request failed: " + textStatus );
            console.error("Request failed: " + textStatus);
          },
          cache: false,
          contentType: false,
          processData: false
    });

}

function generateEmbedMapHTML() {
	generateShareURL();
}

// Sharing the URL to Facebook
function shareFacebook(){
	window.open("http://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent($('#embedUrl').val()),'_blank');
}

// Sharing the URL to Twitter
function shareTwitter(){
	window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent("EGIS") + "&url=" + encodeURIComponent($('#embedUrl').val()),'_blank');
}

// Sharing the URL to Google+
function shareGoogle(){
	window.open("http://plus.google.com/share?url="+encodeURIComponent($('#embedUrl').val()),'_blank');
}

// Sharing the URL to LinkedIn
function shareLinkedin(){
	window.open("http://www.linkedin.com/shareArticle?title="+encodeURIComponent('EGIS')+"&url="+encodeURIComponent($('#embedUrl').val()),'_blank');
}

// Sharing the URL via Email
function shareEmail(){
	// Yet to be implemented
}

//detect shareId upon initial load and react accordingly
$(window).load(function() {  
    if (getParameterByName("shareId") != "") {
	//go fetch JSON for the given shareId, then inspect it for components
	var shareId = getParameterByName("shareId");
	$.get("py/shareConfigs/" + shareId + ".txt", function (data) {
	    var savedData = JSON.parse(data);

	//check the querystring for the key "toc"...
	if ('checkedLayers' in savedData) {
		var lyrs = savedData.checkedLayers.split(",");
		//loop through the qs parameters...
		for (var i=0; i<lyrs.length; i++) {
			var lyr = ".lyr" + lyrs[i];
			//check the corresponding jqxTree item in the TOC
			//if the item is "disabled" we need to temporarily enable it first
			var item = $("#tocTree").jqxTree('getItem', $(lyr)[0]);
			if (item.disabled) {
				$("#tocTree").jqxTree('enableItem', $(lyr)[0]);
				$("#tocTree").jqxTree('checkItem', $(lyr)[0], true);
				$("#tocTree").jqxTree('disableItem', $(lyr)[0]);
			}
			else {
				$("#tocTree").jqxTree('checkItem', $(lyr)[0], true);
			}
		}
	}

	//check the querystring for an InfoWindow click...
	//if (getParameterByName("iwx") != "" && getParameterByName("iwy") != "") {
	    if ("infoWindowX" in savedData && "infoWindowY" in savedData) {
	
		//createt new geometry.Point based on the x and y found in the querystring
		var mapPoint = new esri.geometry.Point(savedData.infoWindowX, savedData.infoWindowY, new esri.SpatialReference({ wkid: 102100  }));

		//we'll call doIdentify(evt), found in Identify.js, to programatically do an Identify task based on mapPoint.
		//doIdentify is expecting an event object that has many properties, including "mapPoint".
		//Create an empty object...
		var evt = new Object();

		//Assign a property called "mapPoint" to the object.
		evt.mapPoint = mapPoint;

		//perform the Identify Task and add a little delay to allow for panning.
		setTimeout(function() {
			doIdentify(evt);
		},1000);
	}

	//check for search query and reproduce it
	if("searchTerms" in savedData) {
		$('#search_input').val(savedData.searchTerms);
		search_keydown('doSearch');
	        
	}

	//check for imagery layer is turned on...
	if ("imageryLayer" in savedData) {
	    map.getLayer("imagery").setVisibility(true);
	}

	//check for sketches, add each graphic to sketchGraphic
	if ("sketches" in savedData) {
	    var sharedGraphics = savedData.sketches;
	    for (var i=0; i < sharedGraphics.length; i++) {
			sketchGraphics.add(new esri.Graphic(sharedGraphics[i]));
	    }
	}

	//check for selection set
	if("selectionSet" in savedData) {
		//fill in selectionSet object
		selectionSet = new Object();

		var selectQuery = savedData.selectionSet.replace(/;+$/, "");
		var explodedQuery = selectQuery.split(";");
		var currentLayer, currentLayerId, currentObjIds;
		for (var i = 0; i < explodedQuery.length; i++) {
			currentLayer = explodedQuery[i].split("-");
			currentLayerId = currentLayer[0];
			currentObjIds = currentLayer[1].split(",");
			selectionSet[currentLayerId] = currentObjIds;
		}

		//call function to re-draw graphics from selectionSet
		redrawSelectionSet();
	}

	// Check querystring parameters to change map extent
	    if("centerX" in savedData && "centerY" in savedData && "lod" in savedData){
	    map.centerAndZoom(new esri.geometry.Point(savedData.centerX, savedData.centerY, new esri.SpatialReference({ wkid: 102100 })),savedData.lod);
	    

		if("searchTerms" in savedData){ //if search exists, disable the function that zooms users to search results. That way, the extent will be honored.
	            disableZoomToSearchResultsList = true;
		}
	    }

	});
    }
});
