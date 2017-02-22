// jscs:disable
/**
 * Enables new-relic stat emitting
 *
 * @module newrelic
 */
// jscs:enable
if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'staging') {
    Newrelic = Npm.require('newrelic');
}