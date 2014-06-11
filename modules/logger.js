/**
 * =============================
 *
 * Logger to log messages for the application.
 * This is a simple wrapper for the "winston" logger.
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *		- info(message)
 *		- warn(message)
 *		- error(message)
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Built-in
var winston = require('winston');



/**
 * Initialize logger
 */

var logger = new (winston.Logger)({
	transports: [
		//new winston.transports.File({ filename: 'debug.log', json: false, level: 'info' }),
		new (winston.transports.Console)({ json: false, timestamp: true })
	],
	exceptionHandlers: [
		//new winston.transports.File({ filename: 'exceptions.log', json: false, level: 'info' }),
		new (winston.transports.Console)({ json: false, timestamp: true })
	],
	exitOnError: false
});



/**
 * Exports
 */

// Methods
exports = module.exports = logger;