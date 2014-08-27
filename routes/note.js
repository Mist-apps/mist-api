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
var xml = require('../modules/xml-parser');



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
 * If a conflict occurs, return a 409 conflict
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
			// If no update, there is maybe a conflict, or item not found
			if (!result) {
				noteDao.findById(request.params.id, request.user, function (err, item) {
					if (err) {
						response.send(503, {error: 'Database error: ' + err.message});
					} else {
						// Item found but not updated just before because of conflict !
						if (item) { response.send(409, item); }
						// No item found, it was normal that the update not worked
						else { response.send(404, {error: 'Unable to find note with id ' + request.params.id}); }
					}
				});
			}
			// If update done
			else {
				response.send(200, result);
			}
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
			else { response.send(200, result); }
		}
	});
};

/**
 * Export all the notes of the user in XML/JSON formats
 *
 * @method 	exportAll
 * @name 	Export all the notes
 */
var exportAll = function (request, response) {
	noteDao.findAll(request.user, function (err, items) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			// Clean data
			for (var i in items) {
				for (var key in items[i]) {
					if (key.substr(0, 1) === '_') {
						delete items[i][key];
					}
				}
			}
			// Send data
			if (request.accepts('json')) {
				response.set('Content-Type', 'application/json');
				response.send(200, items);
			} else if (request.accepts('xml')) {
				response.set('Content-Type', 'application/xml');
				response.send(200, xml.convert('notes', items));
			} else {
				response.send(406, {error: 'Accepted response formats: JSON/XML'});
			}
		}
	});
};

/**
 * Import all the notes of the use in XML/JSON formats
 */
var importAll = function (request, response) {
	if (request.is('json')) {
		noteDao.insert(request.user, request.body, function (err, items) {
			if (err) {
				response.send(503, {error: 'Database error: ' + err.message});
			} else {
				response.send(200, items);
			}
		});
	} else if (request.is('xml')) {
		response.send(200, 'XML OK');
	} else {
		response.send(415, {error: 'Accepted formats: JSON/XML'});
	}
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
exports.exportAll = exportAll;
exports.importAll = importAll;