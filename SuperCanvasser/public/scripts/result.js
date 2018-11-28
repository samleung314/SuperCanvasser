$('#tableToggle').on('click', function() { // Click to toggle table view, hide other views
    document.getElementById('table').style.display = 'block';
    document.getElementById('stats').style.display = 'none';
    document.getElementById('visual').style.display = 'none';
    document.getElementById('tableToggle').disabled = true;
    document.getElementById('tableToggle').classList.add('btn-primary');
    document.getElementById('statsToggle').disabled = false;
    document.getElementById('statsToggle').classList.remove('btn-primary');
    document.getElementById('visualToggle').disabled = false;
    document.getElementById('visualToggle').classList.remove('btn-primary');
});

$('#statsToggle').on('click', function() { // Click to toggle stats view, hide other views
    document.getElementById('table').style.display = 'none';
    document.getElementById('stats').style.display = 'block';
    document.getElementById('visual').style.display = 'none';
    document.getElementById('tableToggle').disabled = false;
    document.getElementById('tableToggle').classList.remove('btn-primary');
    document.getElementById('statsToggle').disabled = true;
    document.getElementById('statsToggle').classList.add('btn-primary');
    document.getElementById('visualToggle').disabled = false;
    document.getElementById('visualToggle').classList.remove('btn-primary');
});

$('#visualToggle').on('click', function() { // Click to toggle visual view, hide other views
    document.getElementById('table').style.display = 'none';
    document.getElementById('stats').style.display = 'none';
    document.getElementById('visual').style.display = 'block';
    document.getElementById('tableToggle').disabled = false;
    document.getElementById('tableToggle').classList.remove('btn-primary');
    document.getElementById('statsToggle').disabled = false;
    document.getElementById('statsToggle').classList.remove('btn-primary');
    document.getElementById('visualToggle').disabled = true;
    document.getElementById('visualToggle').classList.add('btn-primary');
});

function generateRatingPieChart() { // Generate the ratings pie chart
    var data = {
        values: [],
        labels: ['0', '1', '2', '3', '4', '5'],
        type: 'pie'
    };
    data.values.push(parseInt(document.getElementById('rating0').innerHTML)); // Get the amount of each rating
    data.values.push(parseInt(document.getElementById('rating1').innerHTML));
    data.values.push(parseInt(document.getElementById('rating2').innerHTML));
    data.values.push(parseInt(document.getElementById('rating3').innerHTML));
    data.values.push(parseInt(document.getElementById('rating4').innerHTML));
    data.values.push(parseInt(document.getElementById('rating5').innerHTML));

    var layout = {
        height: 400,
        width: 500
    };
    Plotly.newPlot('ratingsPlot', [data], layout);
}

function generateResponsePieChart(i) { // Generate the yes/no response pie chart for a given question
    var data = {
        values: [],
        labels: ['Yes', 'No', 'No Answer'],
        type: 'pie',
    };
    data.values.push(parseInt(document.getElementById('response' + i + 'Yes').innerHTML)); // Get the amount of each response
    data.values.push(parseInt(document.getElementById('response' + i + 'No').innerHTML));
    data.values.push(parseInt(document.getElementById('response' + i + 'Na').innerHTML));

    var layout = {
        height: 400,
        width: 500
    };
    Plotly.newPlot('response' + i + 'Plot', [data], layout);
}

// Initialize: generate the ratings pie chart and all response pie charts
generateRatingPieChart();
for (var i = 0;i < document.getElementById('responses').children.length;i += 1) {
    generateResponsePieChart(i);
}

// Get the list of locations from the locations field and the corresponding rating
function getLocations() {
    var locations = [];
    for (var i = 0;i < document.getElementById('table').children[0].children[0].children.length - 1;i += 1) { // Iterate over each list element
        var loc = {};

        loc.location = document.getElementById('location' + i).innerHTML.trim();
        loc.rating = parseInt(document.getElementById('ratingresponse' + i).innerHTML);
        locations.push(loc)
    }
    return locations;
}

// URL for geocaching, used to convert addresses to Lat and Long
var geocachingURL = 'https://maps.googleapis.com/maps/api/geocode/json?';
// Google Maps API Key
var key = '&key=AIzaSyCIMd_lgKT8jSNhU6h-wDl2mu6ekkYMvGc';

// Initialize the map using the locations
function initMap() {
    var locations = getLocations();
    var promises = [];
    locations.forEach(function(loc) { // For each location, make a geocaching request to get the Lat and Long
        var p = jQuery.get(geocachingURL + 'address=' + encodeURIComponent(loc.location) + key, function(result) {
            loc.coords = result.results[0].geometry.location; // Store the coordinates in the location object
        });
        promises.push(p); // Add the promise for that geocaching request
    });

    Promise.all(promises).then(function() { // After all promises are finished (so all geocaching requests are complete)
        avgloc = getAverageLocation(locations); // Get the average location for the coordinates

        var bounds = new google.maps.LatLngBounds(); // Define and extend the Lat Long bounds
        for (var i = 0;i < locations.length;i += 1) {
            bounds.extend(locations[i].coords);
        }

        // Create the map
        var map = new google.maps.Map(document.getElementById('map'), {zoom: 12, center: avgloc, gestureHandling: 'greedy'});
        map.fitBounds(bounds);
        for (var i = 0;i < locations.length;i += 1) { // Iterate over location coordinates, add markers
            var icon = 'http://maps.google.com/mapfiles/ms/micons/lightblue.png';
            if (locations[i].rating == 5) { // Change marker based on location rating
                icon = 'http://maps.google.com/mapfiles/ms/micons/purple.png';
            } else if (locations[i].rating == 4) {
                icon = 'http://maps.google.com/mapfiles/ms/micons/blue.png';
            } else if (locations[i].rating == 3) {
                icon = 'http://maps.google.com/mapfiles/ms/micons/green.png';
            } else if (locations[i].rating == 2) {
                icon = 'http://maps.google.com/mapfiles/ms/micons/yellow.png';
            } else if (locations[i].rating == 1) {
                icon = 'http://maps.google.com/mapfiles/ms/micons/orange.png';
            } else if (locations[i].rating == 0) {
                icon = 'http://maps.google.com/mapfiles/ms/micons/red.png';
            }
            var marker = new google.maps.Marker({position: locations[i].coords, map: map, icon});
        }
    });
}

// Get average location of coordinates
function getAverageLocation(locations) {
    avgloc = {
        lat: 0,
        lng: 0,
    };
    for (var i = 0;i < locations.length;i += 1) { // Iterate over all location coordinates
        avgloc.lat += locations[i].coords.lat; // Add all Lats and Longs
        avgloc.lng += locations[i].coords.lng;
    }
    avgloc.lat = avgloc.lat / locations.length; // Divide by number of coordinates to get average
    avgloc.lng = avgloc.lng / locations.length;
    return avgloc;
}

setTimeout(function() { // Allow the map to load first, then hide it
    document.getElementById('visualToggle').disabled = false;
    document.getElementById('visual').style.display = 'none';
}, 1500);
