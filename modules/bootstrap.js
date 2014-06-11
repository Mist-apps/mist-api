/**
 * =============================
 *
 * Bootstrap and gracefull exit the application. This module
 *		- registers listeners on process signals
 *		- open database connections
 *
 * If an error occurs during the bootstrap process, the module throws an error.
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *		- bootstrap(gracefulExitCallback, [callback])
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Built-in
var fs  = require('fs');
var async = require('async');
// Custom
var logger = require('./logger');
var db = require('./db');
var config = require('./config');



/**
 * Variables
 */

// Application gracefull exit method
var appGracefulExit;



/**
 * Bootstrap the application. Opens database connections, set exit handlers...
 *
 * @param gracefulExitCallback The application gracefull exit callback, a function called before exiting
 * the server, he must close all the ressources an call a callback ! the execution time may not exceed 5 seconds...
 * @param callback a callback executed after the bootstrap is ended. No error is given, the errors are thrown.
 */
var bootstrap = function (gracefulExitCallback, callback) {
	// Set the application gracefull exit callback
	appGracefulExit = gracefulExitCallback;
	// Set gracefull exit handler
	process.on('SIGTERM', _gracefulExit);
	process.on('SIGINT', _gracefulExit);
	process.on('uncaughtException', _gracefulExit);
	// Open the databases
	var tasks = [
		// Load bootstrap config file
		function (serieCallback) { config.load(serieCallback); },
		// Open database connections
		function (serieCallback) { console.log(JSON.stringify(config)); db.open(config.database.host, config.database.port, config.database.database, config.database.database, serieCallback); },
	];
	// Execute tasks
	async.series(tasks, function (err) {
		if (err) {
			throw new Error('[Bootstrap] Unable to bootstrap the application: ' + err.message);
		} else {
			if (callback) callback(null);
		}
	});
};

/**
 * Graceful Exit method, executed when the application is killed
 * or when a fatal error occurs.
 *
 * This method calls the callback method given at bootstrap time,
 * and after it, clode DB connections and exit the process.
 * If the callback execution time is greater than 5 seconds, the
 * db connections are automatically closed.
 * If the DB connections cannot be closed, the process is hard killed
 * after 10 seconds.
 *
 * So, the application's process is ALWAYS exited after 10 seconds.
 */
var _gracefulExit = function () {
	logger.warn('[Bootstrap] Gracefull exit started')

	// Close the database, after, exit gracefully
	var closeDbAndExit = function () {
		db.close(function () {
			logger.info('[Bootstrap] Server gracefully closed');
			process.exit();
		});
	};

	// Set timer to force close the DB in 5 seconds, if the appGracefulExit does not work.
	setTimeout(function() {
		closeDbAndExit();
	}, 5000);

	// Set timer to force exit in 10 seconds
	setTimeout(function() {
		logger.info('[Bootstrap] Server forced closed');
		process.exit();
	}, 10000);

	// Call the Application gracefull exit method
	appGracefulExit(function () {
		closeDbAndExit();
	});
};



/**
 * Exports
 */

// Methods
exports.bootstrap = bootstrap;