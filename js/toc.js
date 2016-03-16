//function that allows checking strings to see what characters they startwith
if ( typeof String.prototype.startsWith != 'function' ) {
  String.prototype.startsWith = function( str ) {
    return this.substring( 0, str.length ) === str;
  }
};

//initialize TOC
$(document).ready(function () {
    // create collapsible tree out of the TOC using jqxTree
    var theme = "fresh";
	var tocheight = $("#toc-panel").height() - $("#tocHeader").height() - $("#aerialDiv").height() - $(".using-toc").outerHeight(true) - 50; //http://api.jquery.com/outerHeight/ //97
    $('#tocTree').jqxTree({
    	width: '272px',
    	height: tocheight + "px",
    	hasThreeStates: true,
    	checkboxes: true,
    	enableHover: false,
    	theme: theme
    });

    /*EXAMPLES on how to use jqxTree:
	To programatically check/uncheck...
	$("#tocTree").jqxTree('checkItem', $("#lyrBoundary")[0], true);
	$("#tocTree").jqxTree('checkItem', $("#lyrBoundary")[0], false);

	To programtacially enable/disable
	$("#tocTree").jqxTree('enableItem', $("#lyrBoundary")[0]);
	$("#tocTree").jqxTree('disableItem', $("#lyrBoundary")[0]);

	To get the state of a checkbox
	var item = $("#tocTree").jqxTree('getItem', $(".lyrBoundary")[0]);
	var isChecked = item.checked;
	var isExpanded = item.isExpanded;
	var isSelected = item.selected;
	var itemLabel = item.label;
	var itemValue = item.value;
	var itemID = item.id;
	var itemLIElement = item.element;
	var itemLevel = item.level;
	var hasItems = item.hasItems;
	var isDisabled = item.disabled;
	var parentLIElement = item.parentElement;
	var arrowElement = item.arrow;
	var checkBoxElement = item.checkBoxElement;

	To enable/disable ALL checkboxes
	$('#tocTree').jqxTree({ disabled:true });

	To disable a CHECKBOX, you need to disable the
	$('#tocTree').jqxTree('disableItem', element);
	*/

	//set up array for linking each TOC element's CSS class to their layerInfo names and to their layerids
	var myLayerInfos = [
	 new TOCElement(".lyrDirectories", ["Directory Map Locations1128","Directory Map Locations4514","Directory Map Locations9028"], [0,1,2]),
	 new TOCElement(".lyrSurveyControlPoints", ["Survey Points"], [3]),
	 new TOCElement(".lyrPublicArt", ["Public Art"], [7]),
	 new TOCElement(".lyrGreenTourSites", ["Sustainability Sites"], [8]),
	 new TOCElement(".lyrWaterFeatures", ["Water Features"], [10]),
	 new TOCElement(".lyrProjectsWebCams", ["Web Cameras"], [11]),
	 new TOCElement(".lyrTreesPlantID", ["Tree IDLabels1128minus"], [12]),
	 new TOCElement(".lyrTreesGenSpec", ["Tree ShortNameLabels1128minus"], [13]),
	 new TOCElement(".lyrTreesCommonName", ["Tree NameLabels564minus"], [14]),
	 new TOCElement(".lyrTrees", ["Tree 1128minus"], [15]),
	 new TOCElement(".lyrAccessibleEntrances", ["Accessible Entrances1128","Accessible Entrances2257","Accessible Entrances4514"], [16,17,18]),
	 new TOCElement(".lyrPlacesToEat", ["Places To Eat1128","Places To Eat2257"], [19,20]),
	 new TOCElement(".lyrRestrooms", ["Restrooms1128"], [21]),
	 new TOCElement(".lyrListeningDevices", ["Audible Device Classrooms1128"], [22]),
	 new TOCElement(".lyrAEDs", ["Automated External Defibrillators1128"], [23]),
	 new TOCElement(".lyrBluelightPhones", ["Bluelight Emergency Phones564","Bluelight Emergency Phones1128","Bluelight Emergency Phones2257","Bluelight Emergency Phones4514"], [25,26,27,28]),
	 new TOCElement(".lyrCatTranStops", ["CatTran Shuttle Stops564","CatTran Shuttle Stops1128","CatTran Shuttle Stops2257","CatTran Shuttle Stops4514"], [29,30,31,32]),
	 new TOCElement(".lyrSunTranStops", ["SunTran Stops1128"], [34]),
	 new TOCElement(".lyrStreetCarStops", ["SunLink Streetcar Stops1128"], [35]),
	 new TOCElement(".lyrCatTranGreen", ["Outer Campus Loop"], [36]),
	 new TOCElement(".lyrCatTranNight", ["Night Cat Route"], [37]),
	 new TOCElement(".lyrCatTranOrange", ["Mountain Ave. Route"], [38]),
	 new TOCElement(".lyrCatTranPurple", ["North South Route"], [39]),
	 new TOCElement(".lyrCatTranTeal", ["Inner Campus Route"], [40]),
	 //new TOCElement(".lyrCatTranMauve", ["Southwest Off Campus UA Mall Route"], [41]),
	 new TOCElement(".lyrCatTranUSA", ["USA Downtown Route"], [42]),
	 new TOCElement(".lyrDisabledParking", ["Disabled Parking564","Disabled Parking1128","Disabled Parking2257","Disabled Parking4514"], [44,45,46,47]),
	 new TOCElement(".lyrBikeParkingAreas", ["Bicycle Parking564","Bicycle Parking1128","Bicycle Parking2257","Bicycle Parking4514"], [48,49,50,51]),
	 new TOCElement(".lyrRegionalBikeRoutes", ["Bike Routes"], [52]),
     new TOCElement(".lyrCampusBikeways", ["Bikepaths"], [53]),
     new TOCElement(".lyrRainWaterHarvestingSites", ["Rain Water Harvesting Sites"], [54]),
	 new TOCElement(".lyrFitnessStations", ["UA Fit Stations", "UA Fit Course"], [55,56]),
	 new TOCElement(".lyrElevators", ["Elevators1128", "Elevators2257"], [57,58]),
	 new TOCElement(".lyrServiceElevators", ["Service Elevators1128"], [59]),
	 new TOCElement(".lyrName", ["Buildings2257_1128", "Buildings564", "BuildingNameLabels564_282", "BuildingNameLabels2257_1128"], [61,64,71,73]),
	 new TOCElement(".lyrNumber", ["Buildings2257_1128", "Buildings564", "BuildingNumLabels564_282", "BuildingNumLabels2257_1128"], [62,65,71,73]),
	 new TOCElement(".lyrAddress", ["Buildings2257_1128", "Buildings564", "BuildingAddressLabels564_282", "BuildingAddressLabels2257_1128"], [63,66,71,73]),
	 new TOCElement(".lyrNameAddressNumber", ["Buildings1128", "Buildings564", "BuildingNameNumAddLabels564_282", "BuildingNameNumAddLabels2257_1128"], [67,68,71,72]),
	 new TOCElement(".lyrConstructionSites", ["Construction Sites"], [70]),
	 new TOCElement(".lyrNoBuildingLabels", ["Buildings"], [74]),
	 new TOCElement(".lyrBollards", ["Vehicle Bollards"], [76]),
     new TOCElement(".lyrNationalRegisterBuildings", ["Historic Buildings"], [79]),
	 new TOCElement(".lyrUAPD", ["UA Police"], [81]),
	 new TOCElement(".lyrHospital", ["Hospital (UAMC)"], [82]),
	 new TOCElement(".lyrCampusHealth", ["Campus Health"], [83]),
	 new TOCElement(".lyrRecCenter", ["Student Recreation Center"], [84]),
	 new TOCElement(".lyrLibraries", ["Libraries"], [85]),
	 new TOCElement(".lyrMuseums", ["Museums"], [86]),
	 new TOCElement(".lyrGalleries", ["Galleries"], [87]),
	 new TOCElement(".lyrPerformanceVenues", ["Performance Venues"], [88]),
	 new TOCElement(".lyrAthletics", ["Major Athletic Sites", "Athletic Buildings"], [90,91]),
	 new TOCElement(".lyrCampusResidential", ["UA Residence Life Housing", "Greek Houses"], [92,93]),
	 new TOCElement(".lyrLEEDCertifiedBuildings", ["LEED Buildings"], [96]),
	 new TOCElement(".lyrBuildingUse", ["Building Use"], [97]),
	 new TOCElement(".lyrBuildingSizeGSF", ["Building GSF"], [99]),
	 new TOCElement(".lyrStreetLabels", ["StreetLabels564_282","StreetLabels2257_1128", "StreetsLabelMask564_282", "StreetsLabelMask2257_1128"], [100,101,104,105]),
	 new TOCElement(".lyrIntersectionLabels", ["IntersectionLabels564_282","IntersectionLabels2257_1128","StreetsLabelMask564_282", "StreetsLabelMask2257_1128"], [102,103,104,105]),
	 new TOCElement(".lyrNoStreetLabels", ["Streets"], [106]),
	 new TOCElement(".lyrRamps", ["Pedestrian Ramps1128"], [108]),
	 new TOCElement(".lyrWalkways", ["Walks"], [110]),
	 new TOCElement(".lyrService", ["Service Parking Space Points1128","Service Parking Space Points2257"], [118,119]),
	 new TOCElement(".lyrLotSpecific", ["Disabled Parking Lots"], [121]),
	 new TOCElement(".lyrAllSurfaceLots", ["All Surface Parking Lots"], [126]),
	 new TOCElement(".lyrAllParkingGarages", ["All Parking Garages"], [127]),
	 new TOCElement(".lyrStateLocations", ["UA Sites Statewide"], [129]),
	 new TOCElement(".lyrFireLanes", ["Fire Lanes"], [130]),
	 new TOCElement(".lyrSafeRideBoundary", ["Safe Ride Radius", "Safe Ride Boundaries Anno"], [132,134]),
	 new TOCElement(".lyrSunLinkStreetCarRoute", ["Sunlink Streetcar Route"], [135]),
	 new TOCElement(".lyrPlanningAreaBoundary", ["Planning Area Boundary"], [136]),
	 new TOCElement(".lyrProjectsNamesLabels", ["Projects IDLabels", "Projects NamesLabels"], [137,138]),
	 new TOCElement(".lyrProjects", ["Projects"], [139]),
	];

	//loop through the array and make the link between CSS class and names/ids by saving them to the jqxTree object
	var len = myLayerInfos.length;
	for (var i = 0; i < len; i++) {
		var cssClass = myLayerInfos[i].cssClass;
		var layerIdsArray = myLayerInfos[i].layerIds;
		var layerNamesArray = myLayerInfos[i].layerNames;
		$("#tocTree").jqxTree('getItem', $(cssClass)[0]).layerids = layerIdsArray;
		$("#tocTree").jqxTree('getItem', $(cssClass)[0]).layernames = layerNamesArray;
	}

	//set up TOC elements for transparent op layers by manually adding layer ids, names and which map layer they should be displayed on (called layerName).
	//60% transparency layers first
	$("#tocTree").jqxTree('getItem', $('.lyrLandscapeCover')[0]).layerids = [113];
	$("#tocTree").jqxTree('getItem', $('.lyrLandscapeCover')[0]).layernames = ["Landscape Cover"];
	$("#tocTree").jqxTree('getItem', $('.lyrLandscapeCover')[0]).layerName = "transparent60OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrNationalRegisterDistrict')[0]).layerids = [80];
	$("#tocTree").jqxTree('getItem', $('.lyrNationalRegisterDistrict')[0]).layernames = ["HistoricBoundary"];
	$("#tocTree").jqxTree('getItem', $('.lyrNationalRegisterDistrict')[0]).layerName = "transparent60OpLayer";

	//then the 30% transparency layers
	$("#tocTree").jqxTree('getItem', $('.lyrOutdoorDestinations')[0]).layerids = [112];
	$("#tocTree").jqxTree('getItem', $('.lyrOutdoorDestinations')[0]).layernames = ["Outdoor Destinations"];
	$("#tocTree").jqxTree('getItem', $('.lyrOutdoorDestinations')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrUAProperty')[0]).layerids = [75];
	$("#tocTree").jqxTree('getItem', $('.lyrUAProperty')[0]).layernames = ["UA Property"];
	$("#tocTree").jqxTree('getItem', $('.lyrUAProperty')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrUnderpasses')[0]).layerids = [78];
	$("#tocTree").jqxTree('getItem', $('.lyrUnderpasses')[0]).layernames = ["Underpasses"];
	$("#tocTree").jqxTree('getItem', $('.lyrUnderpasses')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrSLD')[0]).layerids = [124];
	$("#tocTree").jqxTree('getItem', $('.lyrSLD')[0]).layernames = ["Misc. S/L/D Lots"];
	$("#tocTree").jqxTree('getItem', $('.lyrSLD')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrSSL')[0]).layerids = [122];
	$("#tocTree").jqxTree('getItem', $('.lyrSSL')[0]).layernames = ["South of Sixth Parking Lots"];
	$("#tocTree").jqxTree('getItem', $('.lyrSSL')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrZone1')[0]).layerids = [123];
	$("#tocTree").jqxTree('getItem', $('.lyrZone1')[0]).layernames = ["Zone 1 Parking Lots"];
	$("#tocTree").jqxTree('getItem', $('.lyrZone1')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrMotorcycles')[0]).layerids = [43,125];
	$("#tocTree").jqxTree('getItem', $('.lyrMotorcycles')[0]).layernames = ["Motorcycle Parking1128","Motorcycle Parking Lots"];
	$("#tocTree").jqxTree('getItem', $('.lyrMotorcycles')[0]).layerName = "transparent30OpLayer";

	$("#tocTree").jqxTree('getItem', $('.lyrVisitor')[0]).layerids = [114,115,120];
	$("#tocTree").jqxTree('getItem', $('.lyrVisitor')[0]).layernames = ["Visitor Parking Points1128","Visitor Parking Points2257","Visitor Parking Lots"];
	$("#tocTree").jqxTree('getItem', $('.lyrVisitor')[0]).layerName = "transparent30OpLayer";

	//Identify which layers are to be used later when turning off the Buildings' label layers
    var buildings564LayerId = 71;
    var buildings2257_1128LayerId = 73;
	var buildingLabelClasses = [".lyrName", ".lyrAddress", ".lyrNumber"];

	//build an array with just the layerids for the buildings' labels (filtering out layerids that represent the buildings themselves)
	buildingLabelClasses.forEach(function (labelClass) {
		var currentIds = $("#tocTree").jqxTree('getItem', $(labelClass)[0]).layerids;
		buildingLabelIds = buildingLabelIds.concat(currentIds);
        var targetIndex = buildingLabelIds.indexOf(buildings564LayerId);
        if (targetIndex > -1) {
            buildingLabelIds.splice(targetIndex, 1);
        }
        targetIndex = buildingLabelIds.indexOf(buildings2257_1128LayerId);
        if (targetIndex > -1) {
            buildingLabelIds.splice(targetIndex, 1);
        }
	});

	//Identify which layers are to be used later when turning off the Streets' label layers
    var streetLayerMask564_282Id = 104;
    var streetLayerMask2257_1128Id = 105;
	var streetLabelClasses = [".lyrStreetLabels", ".lyrIntersectionLabels"];

	//build an array with just the layerids for the buildings' labels (filtering out layerids that represent the buildings themselves)
	streetLabelClasses.forEach(function (labelClass) {
		var currentIds = $("#tocTree").jqxTree('getItem', $(labelClass)[0]).layerids;
		streetLabelIds = streetLabelIds.concat(currentIds);
        var targetIndex = streetLabelIds.indexOf(streetLayerMask564_282Id);
        if (targetIndex > -1) {
            streetLabelIds.splice(targetIndex, 1);
        }
        targetIndex = streetLabelIds.indexOf(streetLayerMask2257_1128Id);
        if (targetIndex > -1) {
            streetLabelIds.splice(targetIndex, 1);
        }
	});

	//designate which TOC elements will center and zoom on a feature when it is enabled, and set its zoomlevel
	$("#tocTree").jqxTree('getItem', $(".lyrUAPD")[0]).centerOnFeature = true;
	$("#tocTree").jqxTree('getItem', $(".lyrUAPD")[0]).zoomLevel = 17;
	$("#tocTree").jqxTree('getItem', $(".lyrHospital")[0]).centerOnFeature = true;
	$("#tocTree").jqxTree('getItem', $(".lyrHospital")[0]).zoomLevel = 17;
	$("#tocTree").jqxTree('getItem', $(".lyrCampusHealth")[0]).centerOnFeature = true;
	$("#tocTree").jqxTree('getItem', $(".lyrCampusHealth")[0]).zoomLevel = 17;
	$("#tocTree").jqxTree('getItem', $(".lyrRecCenter")[0]).centerOnFeature = true;
	$("#tocTree").jqxTree('getItem', $(".lyrRecCenter")[0]).zoomLevel = 17;
	$("#tocTree").jqxTree('getItem', $(".lyrUnderpasses")[0]).centerOnFeature = true;
	$("#tocTree").jqxTree('getItem', $(".lyrUnderpasses")[0]).zoomLevel = 17;

	//set up TOC elements for Campus BI users
	campus_BI_layers = new Array();
	$(".campusBI").each(function (index){
		var lyrName = $(this).attr('class').split(' ')[0];
		//TODO: use this array for hiding/disabling and showing/enabling based on isLoggedIn
		campus_BI_layers.push(lyrName);
		//TODO: the next line will be replaced with a hard coded list I imagine (in order to match up layer numbers properly)
		//either that, or we'll have to modify initSecuredTOCItem to go find the appropriate layer off of the REST endpoint's layer list
		initSecuredTOCItem("."+lyrName, "campus_BI", [0]);
	});

	//set up TOC elements for Infrastructure users
	// var infrastructure_layers = new Array();
	// $(".infrastructure").each(function (index){
	// 	var lyrName = $(this).attr('class').split(' ')[0];
	// 	infrastructure_layers.push(lyrName);
	// });

	//TODO: set up TOC elements for Emergency Response

	//prepare Cat Tran TOC elements with Bus IDs
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranGreen")[0]).busid = 8002000;
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranNight")[0]).busid = 8002920;
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranOrange")[0]).busid = 8002916;
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranPurple")[0]).busid = 8002004;
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranTeal")[0]).busid = 8002012;
	//$("#tocTree").jqxTree('getItem', $(".lyrCatTranMauve")[0]).busid = 8002024;
	$("#tocTree").jqxTree('getItem', $(".lyrCatTranUSA")[0]).busid = 8002924;

	//set up listener that responds when a TOC element is "selected" (the label is clicked). It should toggle the accompanying checkbox
	$('#tocTree').on('select', function (event) {
		var args = event.args;
		var item = $('#tocTree').jqxTree('getItem', args.element);
		var label = item.label;
		if (item.checked)
			$('#tocTree').jqxTree('checkItem', item, false);
		else
			$('#tocTree').jqxTree('checkItem', item, true);
		$('#tocTree').jqxTree('selectItem', null);
	});

	//set up listener that responds to TOC elements being checked on/off
	$('#tocTree').on('checkChange', function (event)
	{
	    var chkbox = event.args;
	    var _class = chkbox.element.className.split(" ")[0];

	    //get hardcoded layername from checkbox element, assume opLayer if null
	    var layerName = $("#tocTree").jqxTree('getItem', $("."+_class)[0]).layerName;
	    if (!layerName || layerName == '') {
	    	layerName = "opLayer";
	    }
	    var prevLayerIds = map.getLayer(layerName).visibleLayers;

	    //Do nothing extra if the user is interacting with a section heading
	    if(chkbox.element.id.startsWith("group")) {
	    	return;
	    }
	    //Do the following if a user is checking ON a TOC element
	    if(chkbox.checked) {
	    	//Turn on the appropriate GIS layers from the appropriate JS layer
			var newLayerIds = $("#tocTree").jqxTree('getItem', $("."+_class)[0]).layerids;
			if (typeof(newLayerIds) != "undefined") {
				map.getLayer(layerName).setVisibleLayers(prevLayerIds.concat(newLayerIds));
			}

			//go check all other checkboxes with the same class
			$("." + _class).each(function (index){
				if (!$("#tocTree").jqxTree('getItem', $(this)[0]).checked) {
					$('#tocTree').jqxTree('checkItem', $(this)[0], true);
				}
			});

			//show correct Cat Tran Route if they checked one
			var busId = $('#tocTree').jqxTree('getItem', $("."+_class)[0]).busid;
			if (typeof(busId) != "undefined") {
				if (visibleBuses.indexOf(busId) == -1)
					visibleBuses.push(busId);
				if (busesRunning == false) {
					busesRunning = true;
					startLiveGPSFeed(visibleBuses);
				}
			}

			//react if they clicked on a TOC element that triggers a centerOnFeature
			var centerOn = $("#tocTree").jqxTree('getItem', $("."+_class)[0]).centerOnFeature;
			if (typeof(centerOn) != "undefined" && alreadyCentering == false
					&& getParameterByName("shareId") == "") {
				console.log("panning to feature!");
				alreadyCentering = true;
				centerOnFeatureQuery(_class);
			}

	    }
	    //Do the following if the user is UNchecking a TOC element
	    else {
			//go UNcheck all other checkboxes with the same class
			$("." + _class).each(function (index){
				if ($("#tocTree").jqxTree('getItem', $(this)[0]).checked) {
					$('#tocTree').jqxTree('checkItem', $(this)[0], false);
				}
			});

			//hide correct Cat Tran Route if they UNchecked one
			var busId = $('#tocTree').jqxTree('getItem', $("."+_class)[0]).busid;
			if (typeof(busId) != "undefined") {
				var newBusIds = new Array();
				var keepId = new Boolean();
				visibleBuses.forEach(function (prev_id) {
					keepId = true;
					if (prev_id == busId)
						keepId = false;
					if (keepId == true && newBusIds.indexOf(busId) == -1)
						newBusIds.push(prev_id);
				});
				visibleBuses = newBusIds;
			}

	    	//empty Array that will get populated and assigned to the layer.visibleLayers[].
	    	var newLayerIds = new Array();
	    	var keepId = new Boolean();

	    	//an array of ids to be removed from the layer.visibleLayers[] (slice of 0 gets a copy of the array so we don't mutate it)
	    	var removeLayerIds = $("#tocTree").jqxTree('getItem', $("."+_class)[0]).layerids.slice(0);

	    	//looping through existing visible layers
	    	if(typeof(prevLayerIds) != "undefined" && typeof(removeLayerIds) != "undefined") {

	    	    //check to see if Buildings layer is being turned off. If so, check prevLayerIds
	    	    //to see if any of the other Buildings Labels layers are on. If so, remove Buildings layer
	    	    //from removeLayerIds (also check for NoStreetLabels layer)
                if (removeLayerIds.indexOf(buildings564LayerId) > -1) {
                    var labelsFound = false;

                    buildingLabelIds.forEach(function (label_id) {
                        //looping through all labels, ignoring the one being turned off...see if any of the others remains On
                        if (removeLayerIds.indexOf(label_id) == -1 && prevLayerIds.indexOf(label_id) > -1) {
                            labelsFound = true;
                        }
                    });

                    if (labelsFound == true) {
                        var targetIndex = removeLayerIds.indexOf(buildings564LayerId);
                        while (targetIndex > -1) {
                            removeLayerIds.splice(targetIndex, 1);
                            var targetIndex = removeLayerIds.indexOf(buildings564LayerId);
                        }
                    }
                }

                if (removeLayerIds.indexOf(buildings2257_1128LayerId) > -1) {
                    var labelsFound = false;

                    buildingLabelIds.forEach(function (label_id) {
                        //looping through all labels, ignoring the one being turned off...see if any of the others remains On
                        if (removeLayerIds.indexOf(label_id) == -1 && prevLayerIds.indexOf(label_id) > -1) {
                            labelsFound = true;
                        }
                    });

                    if (labelsFound == true) {
                        var targetIndex = removeLayerIds.indexOf(buildings2257_1128LayerId);
                        while (targetIndex > -1) {
                            removeLayerIds.splice(targetIndex, 1);
                            var targetIndex = removeLayerIds.indexOf(buildings2257_1128LayerId);
                        }
                    }
                }

                if (removeLayerIds.indexOf(streetLayerMask2257_1128Id) > -1) {
                    var labelsFound = false;

                    streetLabelIds.forEach(function (label_id) {
                        //looping through all labels, ignoring the one being turned off...see if any of the others remains On
                        if (removeLayerIds.indexOf(label_id) == -1 && prevLayerIds.indexOf(label_id) > -1) {
                            labelsFound = true;
                        }
                    });

                    if (labelsFound == true) {
                        var targetIndex = removeLayerIds.indexOf(streetLayerMask2257_1128Id);
                        while (targetIndex > -1) {
                            removeLayerIds.splice(targetIndex, 1);
                            var targetIndex = removeLayerIds.indexOf(streetLayerMask2257_1128Id);
                        }
                    }
                }

                if (removeLayerIds.indexOf(streetLayerMask564_282Id) > -1) {
                    var labelsFound = false;

                    streetLabelIds.forEach(function (label_id) {
                        //looping through all labels, ignoring the one being turned off...see if any of the others remains On
                        if (removeLayerIds.indexOf(label_id) == -1 && prevLayerIds.indexOf(label_id) > -1) {
                            labelsFound = true;
                        }
                    });

                    if (labelsFound == true) {
                        var targetIndex = removeLayerIds.indexOf(streetLayerMask564_282Id);
                        while (targetIndex > -1) {
                            removeLayerIds.splice(targetIndex, 1);
                            var targetIndex = removeLayerIds.indexOf(streetLayerMask564_282Id);
                        }
                    }
                }

                //remove appropriate GIS layers from the appropriate JS layer
	    		prevLayerIds.forEach(function (prev_id) {
	    		    //looping through the ids to be removed from the checkbox
	    		    keepId = true;
	    		    removeLayerIds.forEach(function (remove_id) {
	    			    if(prev_id == remove_id)
	    				    keepId = false;
	    		    });
	    		    if(keepId == true)
	    			    newLayerIds.push(prev_id);
	    	    });
	    		map.getLayer(layerName).setVisibleLayers(newLayerIds);
	        }
		}
		//console.log("changing visible layers to: " + map.getLayer(layerName).visibleLayers);
	});

//end $(document).ready()
});

function dimTOCCheckboxes() {
//This function will make sure to "disable" TOC elements and grey them out if none of the GIS layers they turn on are visible at the current scale
	if (typeof(map.getLayer("opLayer")) != "undefined") {
		visibleLayerNames = new Array();
		visibleLayerIds = new Array();
		//loop through each GIS layer and check to see which are currently visible
		map.getLayer("opLayer").layerInfos.forEach(function (lyr) {
			if((lyr.maxScale == 0 || map.getScale() > lyr.maxScale) && (lyr.minScale == 0 || map.getScale() < lyr.minScale)) {
				visibleLayerNames.push(lyr.name);
				visibleLayerIds.push(lyr.id);
			}

		});

		//Loop thru jqxtree...if current TOC element represents a layer found in visibleLayerIds, make sure it is enabled, otherwise disable it;
		$.each($("#tocTree").jqxTree("getItems"), function() {
			if(!this.element.id.startsWith("group")) {
				var keepThisLayer = false;
				var _class = this.element.className.split(" ")[0];
				var currentLayers = $("#tocTree").jqxTree('getItem', $("."+_class)[0]).layernames;

				if (typeof(currentLayers) != "undefined") {
					$.each(currentLayers, function () {
						if (visibleLayerNames.indexOf(this.valueOf()) > -1) {
							keepThisLayer = true;
							return false;
						}
					});
				}
				if (keepThisLayer) {
					$('#tocTree').jqxTree('enableItem', this.element);
                    //visibleLayerIds.concat($("#tocTree").jqxTree('getItem', $("."+_class)[0]).layerids);
				}
				else {
					$('#tocTree').jqxTree('disableItem', this.element);
				}
			}
		});
	}

}

function initSecuredTOCItem(itemClass, layerName, layerIds) {
//This function initializes secured TOC elements that are disabled and hidden until after authorization
	$("#tocTree").jqxTree('getItem', $(itemClass)[0]).layerids = layerIds;
	$("#tocTree").jqxTree('getItem', $(itemClass)[0]).layerName = layerName;
	$(itemClass).each(function (index){
		$("#tocTree").jqxTree('disableItem', $(this)[0]);
		$(this).hide();
	});
}

function TOCElement(cssClass, layerNames, layerIds) {
//A javascript object representing the TOC elements that control GIS layers within the opLayer
	this.cssClass = cssClass;
	this.layerNames = layerNames;
	this.layerIds = layerIds;
}

function activateDefaultTOCElements(){
//This function initializes TOC elements that should be checked when the application first loads
    $("#tocTree").jqxTree('checkItem', $(".lyrStateLocations")[0], true);
}

function clearTOC(){
//Loop through the TOC tree and un-check any elements that are currently checked
	$.each($("#tocTree").jqxTree("getItems"), function() {
		if(!this.element.id.startsWith("group")) {
			if (this.checked) {
				$('#tocTree').jqxTree('checkItem', this.element, false);
			}
		}
    });
}

function centerOnFeatureQuery(cssClass) {
//This function will "Zoom to" the given TOC element. The coordinates are determined by taking the
//center of all the features represented by all the GIS layers turned on by that TOC element.
	var layerids = $("#tocTree").jqxTree('getItem', $("." + cssClass)[0]).layerids;
	var zoomLevel = $("#tocTree").jqxTree('getItem', $("." + cssClass)[0]).zoomLevel;
	var graphics = new Array();
	var url;
	var queryTask;
	var numTasks = layerids.length;
	var allQueryTasks = new Array();
	allQueryGraphics = new Array();

	//send off a query for each feature and gather all graphics returned into an array
	for (var i=0; i<numTasks; i++) {
		url = restEndpoint + "EnterpriseFeatures/MapServer/" + layerids[i];
		queryTask = new esri.tasks.QueryTask(url);
		query = new esri.tasks.Query();
		query.returnGeometry = true;
		query.where = "1=1";
		allQueryTasks.push(queryTask.execute(query, pushResultsToArray));
	}

	//use DeferredList for determining when all queries have completed
	var dl = new dojo.DeferredList(allQueryTasks);

	//once all queries have completed, center and zoom to the center of all graphics for all queries
	dl.then(function() {
		centerOnFeature(zoomLevel);
	});

}

function pushResultsToArray(featureSet) {
//This function adds the Graphic returned by the centerOnFeatureQuery to an array of all Graphics for all queries
	for (var i=0; i<featureSet.features.length; i++){
		allQueryGraphics.push(featureSet.features[i]);
	}
}

function centerOnFeature(zoomLevel) {
//This function centers and zooms to the center of all the graphics returned by all centerOnFeatureQueries
	if (allQueryGraphics.length > 0 ) {
		var newExtent = esri.graphicsExtent(allQueryGraphics);
		map.centerAndZoom(newExtent.getCenter(), zoomLevel);
	}
	alreadyCentering = false;
}