var gStopId = null;
var gCurrentLocation = null;
var gAllStops = {};

/*
time - Integer
*/
function getTimeDifference(time) {
	if (!time) {
		return "";
	}

	var curr = new Date();
	var to = new Date();
	var to_h = Math.floor(time / 100);
	var to_m = time % 100;
	to.setHours(to_h, to_m);

	var min = Math.abs(to - curr)/(1000 * 60);
	if (min < 60) {
		return '' + min + ' min';
	} else {
		return Math.floor(min / 60) + 'h ' + Math.round(min % 60) + 'm';
	}
}

/*
info - Object
*/
function addCell (info) {
	var html = '<div class="next-cell"><div class="next-left"><div class="next-line">';
	html += info.line;
	html += '</div><div class="next-line-note"><span class="glyphicon glyphicon-circle-arrow-right"></span>';
	html += ' ' + info.line_note;
	html += '</div></div><div class="next-right"><div class="next-first">';
	html += getTimeDifference(info.times[0]);
	html += '</div><div class="next-second">';
	html += getTimeDifference(info.times[1]);
	html += '</div></div></div>';
	$('#next-bus').append(html);
}

function refreshNextBusCells() {
	if (!gStopId) return;
	// Now look up the stop
	var time = (new Date()).getTime();
	$.get('/api/v1/stop/' + gStopId, {'time': time}, function(data) {
		var next = data.next;

		$('#next-bus').html('');
		if (next.length === 0) {
			$('#no-next-bus').fadeIn();
		} else {
			$('#no-next-bus').fadeOut();
			for (var i = 0; i < next.length; i++) {
				addCell(next[i]);
			}
		}
	});
}

setInterval(refreshNextBusCells, 60000);

function locationSuccess(position) {
	gCurrentLocation = position;
	loadDepartureBrowser(null, position);
}

function locationError(err) {
	loadDepartureBrowser(err, null);
}

function loadDepartureBrowser(err, position) {
	$('#loading').fadeOut(200, function() {
		$('#main').fadeIn();
		if (err) $('#error').show();
		populateDropdown(position);
	});
}

function populateDropdown(position) {
	var params = {};
	if (position) {
		params.lat = position.coords.latitude;
		params.lon = position.coords.longitude;
	}
	$.get('/api/v1/stops', params, function(data) {
		for (var i = 0; i < data.length; i++) {
			gAllStops[data[i].id] = data[i];
		}

		$('#stop-select').selectize({
			valueField: 'id',
			labelField: 'name',
			searchField: ['name'],
			sortField: [],
			options: data,
			render: {
				item: function(item) {
					var str = '<div><b>' + item.name + '</b>';
					if (item.dist) {
						str += '<span class="text-muted"> ' + item.dist.toFixed(2) + ' miles away</span>';
					}
					return str + '</div>';
				},
				option: function(item) {
					var str = '<div><div>' + item.name + '</div>';
					if (item.dist) {
						str += '<div class="text-muted small">' + item.dist.toFixed(2) + ' miles away</div>';
					}
					return str + '</div>';
				}
			}
		});
		$('.selectize-input input').prop('disabled', true);

		if (data[0].dist) {
			$('#stop-select')[0].selectize.addItem(data[0].id);
			loadStopInfo(data[0].id);
		}

		$('#stop-select')[0].selectize.on('change', loadStopInfo);

	});
}

function loadStopInfo(stopId) {
	gStopId = stopId;
	refreshNextBusCells();
	loadMap(gAllStops[stopId]);
}

function loadMap(stop) {
	var map_options = {
		center: {
			lat: stop.lat,
			lng: stop.lon
		},
		zoom: 15
	};

	var map = new google.maps.Map(document.getElementById('map'), map_options);

	var image = {
		url: '/img/curr-loc-small.png',
		scaledSize: new google.maps.Size(15, 15)
	};

	if (gCurrentLocation) {
		var curr_loc = new google.maps.Marker({
			icon: image,
			position: new google.maps.LatLng(gCurrentLocation.coords.latitude, gCurrentLocation.coords.longitude),
			map: map,
			title: "Current Location"
		});
	}

	var stop_marker = new google.maps.Marker({
		position: new google.maps.LatLng(stop.lat, stop.lon),
		map: map,
		title: stop.name,
		animation: google.maps.Animation.DROP
	});
}

$('#cancel-location').click(function() {
	loadDepartureBrowser(true, null);
});

setTimeout(function() {
	$('#cancel-location').fadeIn();
}, 5000);

$(document).ready(function() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(locationSuccess, locationError, {
			enableHighAccuracy: true,
			timeout: 10000
		});
	} else {
		loadDepartureBrowser(true, null);
	}
});