var express = require('express');
var app = express();

require('./app/routes')(app);

var server = app.listen(Number(process.env.PORT || 3000), function() {
	console.log('Server started');
});