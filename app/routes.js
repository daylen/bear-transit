var _ = require('underscore');
var moment = require('moment-timezone');
var request = require('request');

var lines = require('../data/lines');
var stops = require('../data/stops');

module.exports = function(app) {

	app.get('/', function(req, res) {
		res.render('index');
	});

	app.get('/api-terms', function(req, res) {
		res.render('api-terms');
	});

	app.get('/api/v1/live', function(req, res, next) {
		res.json([]);
	});

	app.get('/api/v1/lines', function(req, res, next) {
		res.json(lines);
	});

	/*
	Required: id
	*/
	app.get('/api/v1/line/:id', function(req, res, next) {
		if (_.has(lines, req.params.id)) {
			res.json(lines[req.params.id]);
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
				stop_obj.dist = 0;
			}
			return stop_obj;
		});

		if (lat && lon) {
			stops_arr.sort(function(a, b) {
				return a.dist - b.dist;
			});
		}

		res.json(stops_arr);
	});

	/*
	Required: id
	Optional: time
	*/
	app.get('/api/v1/stop/:id', function(req, res, next) {
		res.json({
			'name': '',
			'lat': 0,
			'lon': 0,
			'next': [],
			'message': 'Unfortunately, this app has been discontinued. Try nextbus.com instead!'
		});
	});

};