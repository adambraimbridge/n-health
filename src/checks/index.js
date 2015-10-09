'use strict';
const AggregateCheck = require('./aggregate.check');
const ResponseCompareCheck = require('./responseCompare.check');
const JsonCheck = require('./json.check');
const PingdomCheck = require('./pingdom.check');

module.exports = {
	aggregate : AggregateCheck,
	responseCompare : ResponseCompareCheck,
	json : JsonCheck,
	pingdom : PingdomCheck
};