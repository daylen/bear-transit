var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var path = require('path');
var express = require('express');
var app = express();

function error_handler(err, req, res, next) {
	if (err.message == '400') {
		if (req.xhr)
			res.status(400).json({ error: 'Bad request' });
		else
			res.status(400).send('400 Bad request');
	} else if (err.message == '403') {
		if (req.xhr)
			res.status(403).json({ error: 'Forbidden' });
		else
			res.status(403).send('403 Forbidden');
	} else if (err.message == '404') {
		if (req.xhr)
			res.status(404).json({ error: 'Not found' });
		else
			res.status(404).send('404 Not found');
	} else {
		console.log(err.stack);
		if (req.xhr)
			res.status(500).json({ error: 'Internal server error' });
		else
			res.status(500).send('500 Internal server error');
	}
}

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
} else {
	app.set('view engine', 'jade');

	app.use(express.static(path.join(__dirname, 'public')));

	require('./app/routes')(app);

	app.use(error_handler);

	var server = app.listen(Number(process.env.PORT || 3000), function() {
		console.log('Server started');
	});
}

cluster.on('exit', function(worker, code, signal) {
	console.log('worker %d died (%s). restarting...',
		worker.process.pid, signal || code);
	cluster.fork();
});