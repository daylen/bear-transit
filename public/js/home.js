function time_diff (time) {
	var curr = new Date();
	var to = new Date();
	var to_h = Math.floor(time / 100);
	var to_m = time % 100;
	to.setHours(to_h, to_m);

	var min = Math.abs(to - curr)/(1000 * 60);
	if (min < 60) {
		return '' + min + ' min';
	} else {
		return Math.floor(min / 60) + 'h ' + (min % 60) + 'm';
	}
}

function add_cell (info) {
	var html = '<div class="next-cell"><div class="next-left"><div class="next-line">';
	html += info.line;
	html += '</div><div class="next-line-note">';
	html += info.line_note;
	html += '</div></div><div class="next-right"><div class="next-first">';
	html += time_diff(info.times[0]);
	html += '</div><div class="next-second">';
	html += time_diff(info.times[1]);
	html += '</div></div></div>';
	$('#next-bus').append(html);
}

function populate_next_bus (stop_id) {
	// Now look up the stop
	var time = (new Date()).getTime();
	if (window.location.hash === '#demo') {
		time += (1000 * 60 * 60 * 24);
	}
	$.get('/api/v1/stop/' + stop_id, {'time': time}, function(data) {
		var next = data.next;

		console.log(next);

		if (next.length === 0) {
			$('#no-next-bus').fadeIn();
		} else {
			for (var i = 0; i < next.length; i++) {
				add_cell(next[i]);
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