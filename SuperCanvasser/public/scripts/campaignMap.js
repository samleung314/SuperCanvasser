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

// URL for geocaching, used to convert addresses to Lat and Long
var geocachingURL = 'https://maps.googleapis.com/maps/api/geocode/json?';
// Google Maps API Key
var key = '&key=AIzaSyCIMd_lgKT8jSNhU6h-wDl2mu6ekkYMvGc';

// Initialize the map using the locations
function initMap() {
    var locations = getLocations(); // Get the list of locations
    var coords = [];
    var promises = [];
    locations.forEach(function(loc) { // For each location, make a geocaching request to get the Lat and Long
        var p = jQuery.get(geocachingURL + 'address=' + encodeURIComponent(loc) + key, function(result) {
            coords.push(result.results[0].geometry.location); // Add it to the list of coordinates
        });
        promises.push(p); // Add the promise for that geocaching request
    });

    Promise.all(promises).then(function() { // After all promises are finished (so all geocaching requests are complete)
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
