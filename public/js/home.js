function populate_next_bus (stop_id) {
	// Now look up the stop
	var time = (new Date()).getTime();
	// TODO REMOVE
	time += (1000 * 60 * 60 * 24);
	// TODO ^ REMOVE
	$.get('/api/v1/stop/' + stop_id, {'time': time}, function(data) {
		var next = data.next;

		console.log(next);

		if (next.length == 0) {
			$('#no-next-bus').fadeIn();
		} else {
			for (var i = 0; i < next.length; i++) {

			}
		}
	});
}

function location_success (position) {
	var lat = position.coords.latitude;
	var lon = position.coords.longitude;

	$.get('/api/v1/stops', {'lat': lat, 'lon': lon}, function(data) {
		var stop = data[0];
		$('#stop-name').text(stop.name);
		$('#stop-dist').text(stop.dist.toFixed(2));

		var map_options = {
			center: {
				lat: stop.lat,
				lng: stop.lon
			},
			draggable: false,
			zoom: 15
		};

		var map = new google.maps.Map(document.getElementById('map'), map_options);

		var image = {
			url: '/img/curr-loc-small.png',
			scaledSize: new google.maps.Size(15, 15)
		};

		var curr_loc = new google.maps.Marker({
			icon: image,
			position: new google.maps.LatLng(lat, lon),
			map: map,
			title: "Current Location"
		});

		var stop_marker = new google.maps.Marker({
			position: new google.maps.LatLng(stop.lat, stop.lon),
			map: map,
			title: stop.name,
			animation: google.maps.Animation.BOUNCE
		});

		populate_next_bus(stop.id);
	});
}

function location_error (err) {
	alert('Bear Transit could not determine your location.');
}

$(document).ready(function() {
	navigator.geolocation.getCurrentPosition(location_success, location_error);
});