'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const ms = require('ms');

const logEventPrefix = 'GRAPHITE_THRESHOLD_CHECK';

// Detects when the value of a metric climbs above/below a threshold value

class GraphiteThresholdCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'above';

		this.samplePeriod = options.samplePeriod || '10min';

		this.ftGraphiteBaseUrl = 'https://graphite-api.ft.com/render/?';
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		if (!options.metric || !options.metric.match(/next\./)) {
			throw new Error(`You must prepend the metric (${options.metric}) with "next." - e.g., "heroku.article.*.express.start" needs to be "next.heroku.article.*.express.start"`);
		}
		this.metric = options.metric;

		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	generateUrl(metric, period) {
		return this.ftGraphiteBaseUrl + `format=json&from=-${period}&target=` + metric;
	}

	tick(){

		return fetch(this.sampleUrl, { headers: { key: this.ftGraphiteKey } })
			.then(fetchres.json)
			.then(sample => {
				const failed = sample.some(result => {
					return result.datapoints.some(value => {
						return this.direction === 'above' ?
							value[0] && value[0] > this.threshold :
							value[0] && value[0] < this.threshold;
					});
				});

				this.status = failed ? status.FAILED : status.PASSED;

				// The metric crossed a threshold
				this.checkOutput = failed ?
					`In the last ${this.samplePeriod}, ${this.metric} has moved ${this.direction} the threshold value of ${this.threshold}.` :
					`No threshold error detected in graphite data for ${this.metric}.`;
			})
			.catch(err => {
				logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite threshold check failed to fetch data: ' + err.message;
			});
	}

}

module.exports = GraphiteThresholdCheck;