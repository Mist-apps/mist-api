/**
 * =============================
 *
 * API Express server
 * Set the route listening on, start/stop the server...
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *		- start([callback])
 *		- stop([callback])
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Built-in
var express = require('express');
var bodyParser = require('body-parser')
// Custom
var logger = require('./logger');
var config = require('./config');
var noteRoutes = require('../routes/note.js');
var userRoutes = require('../routes/user.js');


/**
 * Variables
 */

// Server
var server = express();
// Host/port
var host = config.server.host;
var port = config.server.port;


/**
 * Configure server:
 * 		- use logger
 *		- allow cross-domain
 */
var _configureServer = function () {
	var allowCrossDomain = function(req, res, next) {
		// Send headers
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Api-Token');
		// Intercept OPTIONS method
		if ('OPTIONS' == req.method) {
			res.send(200);
		} else {
			next();
		}
	};
	server.use(allowCrossDomain);
	server.use(bodyParser());
};

/**
 * Configure server routes
 */
var _configureRoutes = function () {
	// Note
	server.get('/note', noteRoutes.findAll);
	server.get('/note/:id', noteRoutes.findById);
	server.put('/note/:id', noteRoutes.update);
	server.post('/note', noteRoutes.insert);
	server.delete('/note/:id', noteRoutes.remove);

	// User
	server.get('/user', userRoutes.findAll);
	server.get('/user/:id', userRoutes.findById);
	server.put('/user/:id', userRoutes.update);
	server.post('/user', userRoutes.insert);
	server.delete('/user/:id', userRoutes.remove);
};

/**
 * Start the API Server
 *
 * @param callback function called when the web server is listening
 */
var start = function (callback) {
	_configureServer();
	_configureRoutes();
	server = server.listen(port, host, function () {
		logger.info('[Server] Web server listening on ' + host + ':' + port);
		if (callback) callback();
	});
};

/**
 * Stop the API Server
 *
 * @param callback function called when the web server is no more listening
 */
var stop = function (callback) {
	if (typeof server.close == 'function') {
		server.close(function () {
			logger.info('[Server] Web server no more listening on ' + host + ':' + port);
			if (callback) callback();
		});
	} else {
		logger.info('[Server] Cannot stop web server listening on ' + host + ':' + port);
		if (callback) callback();
	}
};



/**
 * Exports
 */

// Methods
exports.start = start;
exports.stop = stop;