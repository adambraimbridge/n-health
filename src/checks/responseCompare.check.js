'use strict';
const status = require('./status');
const Check = require('./check');
require('promise.prototype.finally');

function allEqual(responses){
	for(var i = 1, l = responses.length; i < l; i++){
		if(responses[i] !== responses[0]){
			return false;
		}
	}

	return true;
}

class ResponseCompareCheck extends Check {

	constructor(options){
		super(options);
		this.comparison = options.comparison;
		this.urls = options.urls;
	}

	get checkOutput(){
		if(this.status === status.PENDING){
			return 'this test has not yet run';
		}

		var urls = this.urls.join(' & ');
		if(this.comparison === ResponseCompareCheck.comparisons.EQUAL){
			return `${urls} are ${this.status === status.PASSED ? '' : 'not'} equal`;
		}
	}

	tick(){
		let check = this;
		Promise.all(this.urls.map(url => fetch(url)))
			.then(function(responses){
				return Promise.all(responses.map(r => r.text()));
			})
			.then(function(responses){
				if(check.comparison === ResponseCompareCheck.comparisons.EQUAL){
					check.status = allEqual(responses) ? status.PASSED : status.FAILED;
				}
			})
			.catch(function(err){
				console.error(err);
				setTimeout(() => {throw err; }, 0);
			})
			.finally(function(){
				check.lastUpdated = new Date();
			});
	}
}

ResponseCompareCheck.comparisons = {
	EQUAL : 'equal'
};

module.exports = ResponseCompareCheck;
