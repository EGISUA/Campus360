dojo.require("esri.IdentityManager");

var cred = "65465460398h5h5";  // cookie/local storage name
var count = 0;
function initSecurity() {
  // TODO: uncomment the following line if the user should be able to load their credentials from their local storage
  // dojo.addOnUnload(storeCredentials);

  // immediately prevent users from zooming in too far
  activateZoomBlocker();  
  
  // set up listener for the login button
  $('#login').click(function(){
    if (!isLoggedIn){
      //attempt creation of layer open to anyone with a NetID
      auth_layer = new esri.layers.ArcGISDynamicMapServiceLayer(restEndpoint+"authTest/MapServer");
      dojo.connect(auth_layer,"onLoad", function(){
        //this code will execute for anyone with a NetID
        console.log("successfully logged in, destroying dialog and adding secured layers");
        //hide dialog so that user is not bothered with failures during adding of secured layers
        esri.id.dialog.hide();
        addSecuredLayers();
      });
      dojo.connect(auth_layer,"onError", function() {
        console.log("Error while attempting to authenticate NetID");
      });
    } else {
      loggedOut();
    }
  });

  // TODO: uncomment the following line if the user should be able to save their credentials to their local storage
  // loadCredentials();
}

function loadCredentials() {
  //function that loads user's saved credentials
      var idJson, idObject;
      if ( supports_local_storage() ) {
        // read from local storage
        idJson = window.localStorage.getItem(cred);
        console.log("getting from local storage" + idJson);
      } else {
        // read from a cookie
        idJson = dojo.cookie(cred);
        console.log("getting from cookie" + idJson);        
      }

      if ( idJson && idJson != "null" && idJson.length > 4) {
        idObject = dojo.fromJson(idJson);
        esri.id.initialize(idObject);
      } else {
         console.log("didn't find anything to load :(");
      }
}

function storeCredentials() {
  //function that saves user's credentials for loading next time
      // make sure there are some credentials to persist
      if ( esri.id.credentials.length === 0 ) {
        return;
      }

      // serialize the ID manager state to a string
      var idString = dojo.toJson(esri.id.toJson());
      // store it client side
      if ( supports_local_storage() ) {
        // use local storage
        window.localStorage.setItem(cred, idString);
        // console.log("wrote to local storage");
      } else {
        // use a cookie
        dojo.cookie(cred, idString, { expires: 1 });
        // console.log("wrote a cookie :-/");
      }
}

function supports_local_storage() {
  //function that checks the user's client to see if can use local storage
      try {
        return "localStorage" in window && window["localStorage"] !== null;
      } catch( e ) {
        return false;
      }
}

function activateZoomBlocker(){
  //function that prevents user from zooming in beyond the campus_tiles/aerial max zoom
        //first check to see if they need to be bounced out right away
        if (map.getZoom() == 21) {
            map.setZoom(20);
        }
        if (aerialOnTop && map.getZoom() > 19){
          map.setZoom(19);
        }
        //then prevent them from zooming in too far
        dojo.disconnect(zoomBlockHandle);
        zoomBlockHandle = dojo.connect(map, "onZoomEnd", function(extent, zoomFactor, anchor, level) {
          if (level == 21) {
            map.setZoom(20);
          }
          if (aerialOnTop && map.getZoom() > 19) {
            map.setZoom(19);
          }
        });
}
       
function deactivateZoomBlocker(){
  dojo.disconnect(zoomBlockHandle);
}

function loggedIn(){
  //function that is executed if the user logged in successfully and has access to CampusBI, Infrastructure or Emergency
  if (!isLoggedIn){
    isLoggedIn = true;

    //switch campus tiles for enterprise tiles
    enterprise_tile.show();
    campus_tile.hide();

    //change login button's icon and tooltip
    $("#login").css('background', 'url("images/signout.png") no-repeat center');
    $("#login").attr('title','Sign Out');

    //remove zoom restrictions
    deactivateZoomBlocker();

    //show Identify tool in TOC
    $('.identifyDiv').css('display','inline-block'); 
  }
}

function loggedOut(){
  //function that is executed when the user logs out
  if (isLoggedIn){
    isLoggedIn = false;  

    //remove secured layers (do this within a try/catch to avoid errors?) from map and TOC
    map.removeLayer(campus_BI);
    campus_BI_layers.forEach(function(lyrClass){
      hideTreeItem("." + lyrClass);
    });

    //map.removeLayer(infrastructure);
    //campus_BI_layers.forEach(function(lyrClass){
    //  hideTreeItem("." + lyrClass);
    //});

    //switch enterprise tiles for campus tiles
    campus_tile.show();
    enterprise_tile.hide();

    //change login button's icon and tooltip back to their original state
    $("#login").css('background', 'url("images/signin_icon_3.png") no-repeat center');
    $("#login").attr('title','Login');
    
    //re-impose zoom restrictions
    activateZoomBlocker();
    $('.identifyDiv').css('display','none'); //Once logged-out, remove Identify tool from TOC

    //destroy credentials so that the user must present them again if they click the login button
    esri.id.credentials[0].destroy();
    
  }
}

function addSecuredLayers(){
  //function that adds the three secured layers to the map and calls loggedIn() on any success.
  
  // infrastructure = new esri.layers.ArcGISDynamicMapServiceLayer(restEndpoint+"Infrastructure/MapServer");
  // infrastructure.id = "infrastructure";
  // infrastructure.setVisibleLayers([-1]);
  // map.addLayer(infrastructure);
  // dojo.connect(infrastructure, "onLoad", function() {
  //   loggedIn();
  //   user_roles.push("infrastructure");
  // });

  campus_BI = new esri.layers.ArcGISDynamicMapServiceLayer(restEndpoint+"CampusBI/MapServer");
  campus_BI.id = "campus_BI";
  campus_BI.setVisibleLayers([-1]);
  map.addLayer(campus_BI);
  dojo.connect(campus_BI, "onLoad", function() {
    loggedIn();
    user_roles.push("campus_BI");
    $.each(campus_BI_layers, function(index, lyrClass){
      showTreeItem("." + lyrClass);
    });
  }); 

//   emergency_response = new esri.layers.ArcGISDynamicMapServiceLayer("http://pdc-betagis2.catnet.arizona.edu:6080/arcgis/rest/services/adminanalysis/MapServer");
//   emergency_response.id = "emergency_response";
//   emergency_response.setVisibleLayers([-1]);
//   map.addLayer(emergency_response);
//   dojo.connect(emergency_response, "onLoad", function() {
//     loggedIn();
//     $("#tocTree").jqxTree('enableItem', $("#lyrBikePaths")[0]);
//     $("#lyrBikePaths").show();
//   });
}

function showTreeItem(itemClass) {
  //function that shows hidden TOC items given their CSS class
  $("#tocTree").jqxTree('enableItem', $(itemClass)[0]);
  $(itemClass).show();
}

function hideTreeItem(itemClass) {
  //function that hides TOC items given their CSS class
  $("#tocTree").jqxTree('disableItem', $(itemClass)[0]);
  $(itemClass).hide();
}
