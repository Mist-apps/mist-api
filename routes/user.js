/**
 * This API allows to CRUD the users.
 *
 * @module	user
 * @name	User
 */



/**
 * Load modules
 */

// Custom
var crypto = require('crypto');
var jwt = require('jwt-simple');
var logger = require('../modules/logger');
var db = require('../modules/db');



/**
 * Variables
 */

// DAO
var userDao = new db.Dao('user');



/**
 * Log a user in. Returns a token in exchange of valid credentials. This token
 * is valid 14 days.
 *
 * @method	login
 * @name	Log a user in
 */
var login = function (request, response) {
	// Prepare credentials
	var hash = crypto.createHash('sha512');
	hash.update(request.body.password);
	var credentials = {
		login:		request.body.login,
		password:	hash.digest('base64')
	};
	// Search for user to log in
	userDao._findOne(credentials, function (err, item) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (item) {
				// Remove password from item
				delete(item.password);
				// Create token
				var expires = new Date().getTime() + 14 * 24 * 60 * 60 * 1000;
				var token = jwt.encode({
					iss: item._id,
					exp: expires
				}, request.app.get('jwtTokenSecret'));
				// Send the token and the user
				response.status(200).send({token: token, expires: expires, user: item});
			} else {
				response.status(401).send({error: 'Invalid login or password'});
			}
		}
	});
};

/**
 * Get the currenlty logged in user
 *
 * @method	find
 * @name	Get a user
 */
var find = function(request, response) {
	userDao._findOne({_id: new db.ObjectID(request.user)}, function (err, item) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (item) {
				delete(item.password);
				response.status(200).send(item);
			} else {
				response.status(404).send({error: 'Unable to find user'});
			}
		}
	});
};

/**
 * Add a user.
 *
 * @method 	insert
 * @name 	Add a user
 * TODO param body
 */
var insert = function(request, response) {
	userDao._insert(request.body, {continueOnError: true, w: 1}, function (err, item) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			response.status(200).send(item[0]);
		}
	});
};

/**
 * Update the currently logged in user
 *
 * @method 	update
 * @name 	Update the currently logged in user
 * TODO param body
 */
var update = function(request, response) {
	delete(request.body._id);
	// Prepare password
	if (request.body.password) {
		var hash = crypto.createHash('sha512');
		hash.update(request.body.password);
		request.body.password = hash.digest('base64');
	}
	// Update user
	userDao._update({_id: new db.ObjectID(request.user)}, {$set: request.body}, {}, function (err, item) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (!item) {
				response.status(404).send({error: 'Unable to find user'});
			} else {
				// Remove password from item
				delete(item.password);
				// Sent item
				response.status(200).send(item);
			}
		}
	});
};

/**
 * Remove the currently logged in user
 *
 * @method 	remove
 * @name 	Remove the currently logged in user
 */
var remove = function(request, response) {
	userDao._remove({_id: new db.ObjectID(request.user)}, {}, function (err, result) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.status(404).send({error: 'Unable to find user'}); }
			else { response.status(200).send(result); }
		}
	});
};



/**
 * Exports
 */

// Methods
exports.login = login;
exports.find = find;
exports.insert = insert;
exports.update = update;
exports.remove = remove;