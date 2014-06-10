/**
 * =============================
 *
 * Main application.
 *
 * Provide a REST API for all the clients who
 * wants to manage the OMS ecosystem (agents, db...)
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods : /
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Global
var bootstrap = require('bootstrap');
// Custom
var server;



/**
 * Graceful exit callback, called when
 * the application is killed or exited.
 *
 * @callback function called when the callback is done
 */

var gracefulExit = function (callback) {
	if (server) {
		server.stop(callback);
	} else {
		if (callback) callback();
	}
};



/**
 * Bootstrap the application.
 * Start the Server.
 */

bootstrap.bootstrap(gracefulExit, function () {
	// Load Modules
	server = require('server');
	// Start
	server.start();
});