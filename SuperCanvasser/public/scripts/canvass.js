// URL for geocaching, used to convert addresses to Lat and Long
var geocachingURL = 'https://maps.googleapis.com/maps/api/geocode/json?';
// Google Maps API Key
var key = '&key=AIzaSyCIMd_lgKT8jSNhU6h-wDl2mu6ekkYMvGc';
var map;
var directionsService;
var directionsDisplay;

// Convert a location to a latitude longitude object
async function getLatLng(loc) {
    return new Promise(function(resolve, reject) { // Return a promise
        jQuery.get(geocachingURL + 'address=' + encodeURIComponent(loc) + key, function(result) { // Query geocache for latitude and longitude of location
            if (result.results.length > 0) {
                resolve(result.results[0].geometry.location); // Return the location values
            }
            resolve();
        });
    })
}

// Initialize map
async function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();

    var location = document.getElementById('location').innerHTML;
    location = await getLatLng(location); // Get the initial location latitude and longitude

    map = new google.maps.Map(document.getElementById('map'), {zoom: 12, center: location, gestureHandling: 'greedy'});
    directionsDisplay.setMap(map); // Create the map, connect direction display to it

    updateMap(); // Update the map
}

// Update the map with new destination
async function updateMap() {
    var location = document.getElementById('location').innerHTML;
    location = await getLatLng(location); // Get the initial location

    var destination = document.getElementById('destination').innerHTML; // Get the destination
    destination = await getLatLng(destination);

    var bounds = new google.maps.LatLngBounds(); // Define and extend the Lat Long bounds
    bounds.extend(location);
    bounds.extend(destination);
    map.fitBounds(bounds);

    // Create the directions service API request
    var request = {
        origin: location,
        destination,
        travelMode: 'DRIVING'
    };
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(result); // Update the map with the directions results

            var directionList = document.createElement('ol'); // Create a new list of directions
            var legs = result.routes[0].legs;
            for (var i = 0;i < legs.length;i += 1) { // For each leg of the directions, 
                var steps = legs[i].steps;
                for (var j = 0;j < steps.length;j += 1) { // For each step of each leg of the directions
                    var direction = document.createElement('li');
                    direction.innerHTML = steps[j].instructions; // Add the instructions as a list element
                    directionList.appendChild(direction);
                }
            }
            var directions = document.getElementById('directions');
            $('#directions').empty();
            directions.appendChild(directionList); // Reset the directions and add the updated directions
        }
    });
}

// Update the destination (called by clicking the button)
function updateDestination() {
    var destination = document.getElementById('destination');
    var newDestinationID = document.getElementById('updateDestination').value; // Get the updated destination id and value
    var newDestination = document.getElementById('location' + newDestinationID).innerHTML; 
    destination.innerHTML = newDestination; // Update the destination with it

    var destinationForm = document.getElementById('destinationForm');
    destinationForm.value = newDestination; // Update the destination in the destinationForm so the server receives the value
    var destinationFormID = document.getElementById('destinationFormID');
    destinationFormID.value = newDestinationID; // Update the destination id in the destinationFormID so the server receives the value

    updateMap(); // Update the map with the new destination so the directions are recalculated
}

$('#changeDestination').on('click', updateDestination);
