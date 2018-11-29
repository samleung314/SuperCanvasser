// Get the list of locations from the locations field
function getLocations() {
    var locationsList = document.getElementById('locations').children;
    var locations = [];
    for (var i = 0;i < locationsList.length;i += 1) { // Iterate over each list element
        var location = locationsList[i];
        locations.push(location.innerHTML); // Add to the list of locations
    }
    return locations;
}

function writeCoords(coords, locmap) {
    var form = document.getElementById('form');
    var distanceMat = [];
    for (var i = 0;i < coords.length;i += 1) {
        var input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', 'location' + i);
        input.setAttribute('value', JSON.stringify(coords[i]));
        form.appendChild(input);
        var distanceArray = [];
        for (var j = 0;j < coords.length;j += 1) {
            var ax = new google.maps.LatLng(
                parseFloat(coords[i].lat),
                parseFloat(coords[i].lng),
            );
            var bx = new google.maps.LatLng(
                parseFloat(coords[j].lat),
                parseFloat(coords[i].lng),
            );
            var ay = new google.maps.LatLng(
                parseFloat(coords[i].lat),
                parseFloat(coords[i].lng),
            );
            var by = new google.maps.LatLng(
                parseFloat(coords[i].lat),
                parseFloat(coords[j].lng),
            );
            if (i != j) {
                var xdist = google.maps.geometry.spherical.computeDistanceBetween(ax, bx);
                var ydist = google.maps.geometry.spherical.computeDistanceBetween(ay, by);
                distanceArray.push((xdist + ydist) / 1609.344);
            } else {
                distanceArray.push(0);
            }
        }
        distanceMat.push(distanceArray);
    }
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', 'locationn');
    input.setAttribute('value', coords.length);
    form.appendChild(input);
    var input2 = document.createElement('input');
    input2.setAttribute('type', 'hidden');
    input2.setAttribute('name', 'distancemat');
    input2.setAttribute('value', JSON.stringify(distanceMat));
    form.appendChild(input2);
    var input3 = document.createElement('input');
    input3.setAttribute('type', 'hidden');
    input3.setAttribute('name', 'locmap');
    input3.setAttribute('value', JSON.stringify(locmap));
    form.appendChild(input3);

    if (parseInt(document.getElementById('flag').innerHTML) == 1) {
        document.getElementById('generate').disabled = false;
    }
}

// URL for geocaching, used to convert addresses to Lat and Long
var geocachingURL = 'https://maps.googleapis.com/maps/api/geocode/json?';
// Google Maps API Key
var key = '&key=AIzaSyCIMd_lgKT8jSNhU6h-wDl2mu6ekkYMvGc';

// Initialize the map using the locations
function initMap() {
    var locations = getLocations(); // Get the list of locations
    var locmap = {};
    var coords = [];
    var promises = [];
    locations.forEach(function(loc, i) { // For each location, make a geocaching request to get the Lat and Long
        var p = jQuery.get(geocachingURL + 'address=' + encodeURIComponent(loc) + key, function(result) {
            coords.push(result.results[0].geometry.location); // Add it to the list of coordinates
            locmap[coords.length - 1] = i;
        });
        promises.push(p); // Add the promise for that geocaching request
    });

    Promise.all(promises).then(function() { // After all promises are finished (so all geocaching requests are complete)
        console.log(locmap);
        avgloc = getAverageLocation(coords); // Get the average location for the coordinates

        var bounds = new google.maps.LatLngBounds(); // Define and extend the Lat Long bounds
        for (var i = 0;i < coords.length;i += 1) {
            bounds.extend(coords[i]);
        }

        // Create the map
        var map = new google.maps.Map(document.getElementById('map'), {zoom: 12, center: avgloc, gestureHandling: 'greedy'});
        map.fitBounds(bounds);
        for (var i = 0;i < coords.length;i += 1) { // Iterate over location coordinates, add markers
            var marker = new google.maps.Marker({position: coords[i], map: map});
        }

        writeCoords(coords, locmap);
    });
}

// Get average location of coordinates
function getAverageLocation(coords) {
    avgloc = {
        lat: 0,
        lng: 0,
    };
    for (var i = 0;i < coords.length;i += 1) { // Iterate over all location coordinates
        avgloc.lat += coords[i].lat; // Add all Lats and Longs
        avgloc.lng += coords[i].lng;
    }
    avgloc.lat = avgloc.lat / coords.length; // Divide by number of coordinates to get average
    avgloc.lng = avgloc.lng / coords.length;
    return avgloc;
}
