var moment = require('moment');

/*
Parameter: unix_time
Return: ISO Weekday. Monday=1. 7=Sunday
*/
module.exports.day_of_week = function(unix_time) {
	var date = moment(Number(unix_time));
	return date.isoWeekday();
}