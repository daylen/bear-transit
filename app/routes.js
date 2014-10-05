var _ = require('underscore');
var moment = require('moment');

var lines = require('../data/lines');
var stops = require('../data/stops');

if (typeof Number.prototype.toRadians == 'undefined') {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

function calc_distance (lat1, lat2, lon1, lon2) {
	var R = 6371; // km
	var φ1 = lat1.toRadians();
	var φ2 = lat2.toRadians();
	var Δφ = (lat2-lat1).toRadians();
	var Δλ = (lon2-lon1).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;

	return d;
}

function increment_time (time, inc) {
	var hours = Math.floor(time / 100);
	var minutes = time % 100 + inc;
	if (minutes >= 60) {
		hours += Math.floor(minutes / 60);
		minutes %= 60;
	}
	return hours * 100 + minutes;
}

function calc_upcoming_times (m_date, inc, segment) {
	var all_times = segment.fixed || [];

	if (segment.intervals) {
		_.each(segment.intervals, function(interval) {
			var curr = interval[0];
			do {
				all_times.push(curr);
				curr = increment_time(curr, inc);
			} while (curr <= interval[1]);
		});
	}

	var curr_time_formatted = m_date.hour() * 100 + m_date.minute();

	var future_times = _.filter(all_times, function(time) {
		return time >= curr_time_formatted;
	});

	return future_times;
}

module.exports = function(app) {
	
	app.get('/', function(req, res) {
		res.send('Bear Transit API');
	});

	app.get('/api/v1/lines', function(req, res, next) {
		res.json(lines);
	});

	/*
	Required: id
	*/
	app.get('/api/v1/line', function(req, res, next) {
		if (_.has(lines, req.query.id)) {
			res.json(lines[req.query.id]);
		} else {
			next(new Error(404));
		}
	});

	/*
	Optional: lat, lon
	*/
	app.get('/api/v1/stops', function(req, res, next) {
		var lat = req.query.lat ? Number(req.query.lat) : null;
		var lon = req.query.lon ? Number(req.query.lon) : null;

		var stops_arr = _.map(stops, function(value, key) {
			var stop_obj = _.clone(value);
			stop_obj.id = key;
			if (lat && lon) {
				stop_obj.dist = calc_distance(lat, value.lat, lon, value.lon);
			}
			return stop_obj;
		});

		if (lat && lon) {
			stops_arr.sort(function(a, b) {
				if (a.dist < b.dist) return -1;
				else return 1;
			});
		}

		res.json(stops_arr);
	});

	/*
	Required: id
	Optional: time
	*/
	app.get('/api/v1/stop', function(req, res, next) {
		if (_.has(stops, req.query.id)) {
			var stop = _.clone(stops[req.query.id]);

			if (req.query.time) {
				var next_bus = [];

				var m_date = moment(Number(req.query.time));
				var day_of_week = m_date.isoWeekday();

				_.each(lines, function(line) {
					// Weekend check
					if (_.contains(line.days, day_of_week)) {
						_.each(line.schedule, function(segment) {
							if (segment.from == req.query.id) {
								var times = calc_upcoming_times(m_date, line.inc, segment);
								if (times.length > 0) {
									next_bus.push({
										"line": line.name,
										"line_note": "To " + stops[segment.to].name,
										"times": times
									});
								}
							}
						});
					}
				});

				stop.next = next_bus;
			}

			res.json(stop);
		} else {
			next(new Error(404));
		}
	});

};