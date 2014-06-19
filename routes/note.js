/**
 * This API allows to CRUD the notes.
 *
 * @module	note
 * @name	Note
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
var noteDao = new db.Dao('note');



/**
 * Get a the note with the given id.
 *
 * @method 	findById
 * @name 	Get a note
 * @param 	id {String} required The id of the note to retrieve
 */
var findById = function (request, response) {
	noteDao.findById(request.params.id, request.user, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (item) { response.send(200, item); }
			else { response.send(404, {error: 'Unable to find note with id ' + request.params.id}); }
		}
	});
};

/**
 * Get all the notes.
 *
 * @method 	findAll
 * @name 	Get all the notes
 */
var findAll = function (request, response) {
	noteDao.findAll(request.user, function (err, items) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, items);
		}
	});
};

/**
 * Add a note.
 *
 * @method 	insert
 * @name 	Add a note
 * TODO param body
 */
var insert = function (request, response) {
	noteDao.insert(request.user, request.body, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, item[0]);
		}
	});
};

/**
 * Update the note with the given id.
 *
 * @method 	update
 * @name 	Update a note
 * @param 	id {String} required The id of the note to update
 * TODO param body
 */
var update = function (request, response) {
	delete(request.body._id);
	delete(request.body._user);
	noteDao.update(request.params.id, request.user, request.body, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.send(404, {error: 'Unable to find note with id ' + request.params.id}); }
			else { response.send(200, {updated: result}); }
		}
	});
};

/**
 * Remove the note with the given id.
 *
 * @method 	remove
 * @name 	Remove a note
 * @param 	id {String} required The id of the note to remove
 */
var remove = function (request, response) {
	noteDao.remove(request.params.id, request.user, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.send(404, {error: 'Unable to find note with id ' + request.params.id}); }
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