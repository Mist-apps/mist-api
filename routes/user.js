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
var logger = require('../modules/logger');
var db = require('../modules/db');



/**
 * Variables
 */

// DAO
var userDao = new db.Dao('user');



/**
 * Get the user with the given id.
 *
 * @method	findById
 * @name	Get a user
 * @param	id {String} required The user id
 */
var findById = function(request, response) {
	userDao.findById(request.params.id, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (item) { response.send(200, item); }
			else { response.send(404, {error: 'Unable to find user with id ' + request.params.id}); }
		}
	});
};

/**
 * Get all the users.
 *
 * @method 	findAll
 * @name 	Get all the users
 */
var findAll = function(request, response) {
	userDao.findAll(function (err, items) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, items);
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
	userDao.insert(request.body, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, item[0]);
		}
	});
};

/**
 * Update the user with the given id.
 *
 * @method 	update
 * @name 	Update a user
 * @param 	id {String} required The id of the user to update
 * TODO param body
 */
var update = function(request, response) {
	delete(request.body._id);
	userDao.update(request.params.id, request.body, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.send(404, {error: 'Unable to find user with id ' + request.params.id}); }
			else { response.send(200, {updated: result}); }
		}
	});
};

/**
 * Remove the user with the given id.
 *
 * @method 	remove
 * @name 	Remove a user
 * @param 	id {String} required The id of the user to remove
 */
var remove = function(request, response) {
	userDao.remove(request.params.id, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.send(404, {error: 'Unable to find user with id ' + request.params.id}); }
			else { response.send(200, {removed: result}); }
		}
	});
};



/**
 * Exports
 */

// Methods
exports.findById = findById;
exports.findAll = findAll;
exports.insert = insert;
exports.update = update;
exports.remove = remove;