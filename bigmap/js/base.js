var displaymarkers = [];
var markers = [];
var imgurls = [];
var nolocurls = [];
var listofimgs = [];
var markerslayer = null;
var mymaplayer = null;
var map = null;
var prevMarker = null;
var initlonlat = new OpenLayers.LonLat(-71.0851427, 42.3288756);
var minx = 100000000;
var maxx = -100000000;
var miny = 100000000;
var maxy = -100000000;
var x_unit = 0;
var y_unit = 0;
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var objids = [];

function hourlyUpdate() {
  	makeBasicQuery(42.371227435069805, -71.02455139160156); // Logan Airport
  	makeBasicQuery(42.36057345238455, -71.09561920166016); // MIT
	makeBasicQuery(42.373002923187165, -71.1141586303711); // Harvard
	makeBasicQuery(42.35296235855687, -71.08034133911133); // BackBay
	makeBasicQuery(42.361207668593636, -71.06077194213867); // Beacon Hill
	makeBasicQuery(42.34915646596519, -71.06952667236328); // Boston Gardens
	makeBasicQuery(42.342939679141914, -71.08634948730469); // South End
	makeBasicQuery(42.341797753508665, -71.10763549804688); // Brighton
	makeBasicQuery(42.337737405512826, -71.07398986816406); //Roxbury Crossing
	makeBasicQuery(42.31590854308647, -71.08394622802734); //Roxbury
	makeBasicQuery(42.32986973516181, -71.10694885253906); //Mission Hill
	makeBasicQuery(42.30964086428392, -71.11542463302612); //Jamaica PLain
	makeBasicQuery(42.30930762844371, -71.05948448181152); //Dorchester South Boston
	makeBasicQuery(42.32961592295752, -71.05888366699219); //North Dorchester
	makeBasicQuery(42.28619897559957, -71.07742309570312); //South Dorchester
	makeBasicQuery(42.28061099545887, -71.09699249267578); //Mattapan
	makeBasicQuery(42.28264304558087, -71.1203384399414) ;//Roslinedale
	makeBasicQuery(42.28875467633035, -71.08325958251953);//Harambee

	window.setTimeout('hourlyUpdate()',300000); 
  	//window.setTimeout('hourlyUpdate()',3600000); 
}
function tenMinuteClear() {
        objids = [];
        window.setTimeout('tenMinuteClear()', 1800000);
}
function parseData(data) {
	for (var i=0; i<data.data.length; i++) {
		var obj = data.data[i];
		// check whether it's from today
		var d = new Date();
		var today = d.getDay();
		d.setTime(obj.created_time*1000);

		if (today == d.getDay()) {
			var my_point = new OpenLayers.LonLat(obj.location.longitude, obj.location.latitude);
			var idval = getRegion(obj.location.longitude, obj.location.latitude);
			var city ="";
			if (idval != null) city = region_names[idval];
			var lonLat = my_point.transform(
                                  new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
                                  map.getProjectionObject() //to Spherical Mercator Projection
                                );
			var dateString = dateToString(obj.created_time);
			var caption = "";
			if (obj.caption != null) caption = obj.caption.text;
			if (obj.location.name != undefined) {
				city = obj.location.name; //user location trumps extracted location
			}

			var visiblecaption = "http://http://10.100.50.131/snap/label/makelabelid.php?imgurl="+obj.images.standard_resolution.url+"&func="+"pushimgurl"+
			"&dateline="+dateString[1]+
			"&timestamp="+dateString[0]+
			"&capline="+caption+
			"&id="+obj.user.username+
			"&lat="+lonLat.lat+"&lon="+lonLat.lon+
			"&uploadtime="+obj.created_time+
			"&location="+city+
			"&idnum="+obj.id;

			// push it into the region vectors
			var plotted = false;                
			if (objids.length > 500) objids = [];
			if (!(obj.id in oc(objids))) {
                        	if (idval != null) {
                                	try{
                                	imgurls[idval].push(visiblecaption);
                               		}
                                	catch(err)
                                	{
                                	alert(idval);
                                	}
                       		}
                		else {
                        		nolocurls.push(visiblecaption);
                		}
				objids.push(obj.id);
        		}
		}
	}
}

function oc(a)
{
        var o = {};
        for(var i=0;i<a.length;i++)
        {
                o[a[i]]='';
        }
        return o;
}

function pushimgurl(data) {
	var lonLat = new OpenLayers.LonLat(data.lon, data.lat);
	var size = new OpenLayers.Size(data.width,data.height);
        var offset = new OpenLayers.Pixel(-size.w + 375, 80 -size.h);
        var icon = new OpenLayers.Icon(data.url,size,offset);
	var marker = new OpenLayers.Marker(lonLat, icon);
	markers.push(marker);
}

function MapThing() {
	alert("You can pan around: Version A");
	map = new OpenLayers.Map("basicMap");
	      
        mymaplayer = new OpenLayers.Layer.OSM();
        map.addLayer(mymaplayer);
        var lonLat = initlonlat.transform(
                                  new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
                                  map.getProjectionObject() //to Spherical Mercator Projection
                                );

	map.setCenter(lonLat, 15); // Zoom level	

	for (var i=0; i<region_coords.length; i++) {
		drawRegion(region_coords[i]);
		drawCanvas(region_coords[i], i);
	}

	// Now add the marker layer
	markerslayer = new OpenLayers.Layer.Markers( "Markers" );
        map.addLayer(markerslayer);
	
}

function drawRegion(testregion) {
	style_green = {
	  strokeColor: "#fefeef",
	  strokeOpacity: 1,
	  strokeWidth: 1,
          fillColor: "#000022",
 	  fillOpacity: 0.1
	};
	var vectors = new OpenLayers.Layer.Vector('Vector Layer');
	map.addLayer(vectors);
	var site_points = [];
	for (var i=0; i<testregion.length; i++) {
		point = new OpenLayers.Geometry.Point(testregion[i].lon, testregion[i].lat);
		point.transform(
                        new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
                        map.getProjectionObject() //to Spherical Mercator Projection
		);
		// also test for min and max values
		if (point.x < minx) minx = point.x;
		if (point.x > maxx) maxx = point.x;
		if (point.y < miny) miny = point.y;
		if (point.y > maxy) maxy = point.y;
		site_points.push(point);
	}
	site_points.push(site_points[0]);
	
	var linear_ring = new OpenLayers.Geometry.LinearRing(site_points);
	polygonFeature = new OpenLayers.Feature.Vector(
		new OpenLayers.Geometry.Polygon([linear_ring]), null, style_green);
	vectors.addFeatures([polygonFeature]);
	return false;
}

function dateToString(machdate) {
	var d = new Date();
	d.setTime(machdate*1000);
	suffix = "am";
	hour = d.getHours();
	mins = d.getUTCMinutes();
	if (mins < 10) mins = "0"+mins;
	if (hour > 11) {
		suffix = "pm";
		hour = hour - 12;
	}
	if (hour == 0) hour = 12;
	dayofmonth = d.getUTCDate();
	month = months[d.getMonth()];
	day = days[d.getDay()];
	dateStringA = hour+":"+mins+suffix
	dateStringB = " "+day+" "+(d.getMonth()+1)+"/"+dayofmonth+"/11";
	
	return [dateStringA, dateStringB];
}


function injectScript(srcstring) {
	var headID = document.getElementsByTagName("head")[0];
	var newScript = document.createElement('script');
	newScript.type = 'text/javascript';
	newScript.src = srcstring
	headID.appendChild(newScript);
	return false;
}

function makeBasicQuery(geolatval, geolonval) {
	var srcstring = 'https://api.instagram.com/v1/media/search?lat='+geolatval+'\&lng='+geolonval+'\&access_token=4631317.f59def8.641387c270af429785d087d3b8aaa821&distance=4000&callback=parseData&count=15' //5000 is the largest supported radius
	injectScript(srcstring);
	return false;
}

function minutelyUpdate() {
	//for (var i=0; i<markers.length; i++) {
	if (markers.length > 0) {
		displaymarkers.push(markers.shift());
		if (displaymarkers.length > 18) {
			markerslayer.removeMarker(displaymarkers.shift());
		}
		markerslayer.addMarker(displaymarkers[displaymarkers.length-1]);
	}
	//}

	for (var i=0; i<imgurls.length; i++) {
		if (imgurls.length > 0) {
			injectScript(imgurls[i].splice(Math.floor(Math.random()*imgurls.length),1));
		}
	}
	if (nolocurls.length > 0) injectScript(nolocurls.splice(Math.floor(Math.random()*nolocurls.length),1));
	window.setTimeout('minutelyUpdate()', 12000);
}

function getRegion(lon, lat) {
	var canvas = document.getElementById('drawnMap');
	var c2 = canvas.getContext('2d');
	point = new OpenLayers.Geometry.Point(lon, lat);
	point.transform(
        	new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
                map.getProjectionObject() //to Spherical Mercator Projection
	);
	var testx = (point.x-minx)*x_unit;
	var testy = (canvas.height-(point.y-miny)*y_unit);
	var color = c2.getImageData(testx, testy, 1, 1).data;
	if(color[2] != 0) return color[2]-1;
	else return null;
}

function drawCanvas(testregion, id) {
	var canvas = document.getElementById('drawnMap');
	var c2 = canvas.getContext('2d');
	var testid = id+1;
	c2.fillStyle = "rgb(0, 0,"+testid+")"; //picked based on id

	var x_coord = [];
	var y_coord = [];
	x_unit = canvas.width/(maxx-minx);
	y_unit = canvas.height/(maxy-miny);
	for (var i=0; i<testregion.length; i++) {
		point = new OpenLayers.Geometry.Point(testregion[i].lon, testregion[i].lat);
		point.transform(
                        new OpenLayers.Projection("EPSG:4326"), //transform from WGS 1984
                        map.getProjectionObject() //to Spherical Mercator Projection
		);
		x_coord.push((point.x-minx)*x_unit);
		y_coord.push(canvas.height-(point.y-miny)*y_unit);
	}
	c2.beginPath();
	c2.moveTo(x_coord[0], y_coord[0]);
	for (var i=1; i<x_coord.length; i++) {
		c2.lineTo(x_coord[i],y_coord[i]);
	}
	c2.closePath();
	c2.fill();
}

// Main function calls
$(document).ready(function() {
	//intialize image list
	for (var i=0; i<region_names.length; i++) {
		imgurls[i] = [];
	}
	myMap = new MapThing();
	tenMinuteClear();
	hourlyUpdate();
	minutelyUpdate();
});
