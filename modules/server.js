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
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
// Custom
var logger = require('./logger');
var config = require('./config');
var noteRoutes = require('../routes/note.js');
var userRoutes = require('../routes/user.js');



/**
 * Variables
 */

// Server
var app = express();
var server;
// Host/port
var host = config.server.host;
var port = config.server.port;



/**
 * Configure application:
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
	app.use(allowCrossDomain);
	app.use(bodyParser());

	app.set('jwtTokenSecret', 'L[<;fPmWVt;4TN+ufbHX#Z6<{N/@fU+X(nV/JF&>');
};

/**
 * Authentication checker middelware
 * If the request has a valid token, set the user id and continue, else,
 * return a 401 code with a message
 */
var _jwtauth = function (request, response, next) {
	var token = request.headers['api-token'];
	if (token) {
		try {
			var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
			if (decoded.exp <= new Date().getTime()) {
				response.end('Access token has expired', 401);
			} else {
				request.user = decoded.iss;
				next();
			}
		} catch (err) {
			response.end('Unable to parse token', 401);
		}
	} else {
		response.end('A token is mandatory', 401);
	}
};

/**
 * Configure application routes
 */
var _configureRoutes = function () {
	// Add authentication middelware for some routes
	app.all('/note*', [_jwtauth]);
	app.all('/user*', [_jwtauth]);

	// Authentication
	app.post('/login', userRoutes.login);

	// Note
	app.get('/note', noteRoutes.findAll);
	app.get('/note/:id', noteRoutes.findById);
	app.put('/note/:id', noteRoutes.update);
	app.post('/note', noteRoutes.insert);
	app.delete('/note/:id', noteRoutes.remove);

	// User
	app.get('/user', userRoutes.find);
	app.put('/user', userRoutes.update);
	app.delete('/user', userRoutes.remove);
};

/**
 * Start the API Server
 *
 * @param callback function called when the web server is listening
 */
var start = function (callback) {
	_configureServer();
	_configureRoutes();
	server = app.listen(port, host, function () {
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
	if (server && typeof server.close == 'function') {
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