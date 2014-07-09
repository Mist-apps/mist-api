/**
 * This API allows to CRUD the contacts.
 *
 * @module	contact
 * @name	Contact
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
var contactDao = new db.Dao('contact');



/**
 * Get a the contact with the given id.
 *
 * @method 	findById
 * @name 	Get a contact
 * @param 	id {String} required The id of the contact to retrieve
 */
var findById = function (request, response) {
	contactDao.findById(request.params.id, request.user, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (item) { response.send(200, item); }
			else { response.send(404, {error: 'Unable to find contact with id ' + request.params.id}); }
		}
	});
};

/**
 * Get all the contacts.
 *
 * @method 	findAll
 * @name 	Get all the contacts
 */
var findAll = function (request, response) {
	contactDao.findAll(request.user, function (err, items) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, items);
		}
	});
};

/**
 * Add a contact.
 *
 * @method 	insert
 * @name 	Add a contact
 * TODO param body
 */
var insert = function (request, response) {
	contactDao.insert(request.user, request.body, function (err, item) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			response.send(200, item[0]);
		}
	});
};

/**
 * Update the contact with the given id.
 * If a conflict occurs, return a 409 conflict
 *
 * @method 	update
 * @name 	Update a contact
 * @param 	id {String} required The id of the contact to update
 * TODO param body
 */
var update = function (request, response) {
	delete(request.body._id);
	delete(request.body._user);
	contactDao.update(request.params.id, request.user, request.body, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			// If no update, there is maybe a conflict, or item not found
			if (!result) {
				contactDao.findById(request.params.id, request.user, function (err, item) {
					if (err) {
						response.send(503, {error: 'Database error: ' + err.message});
					} else {
						// Item found but not updated just before because of conflict !
						if (item) { response.send(409, item); }
						// No item found, it was normal that the update not worked
						else { response.send(404, {error: 'Unable to find contact with id ' + request.params.id}); }
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
 * Remove the contact with the given id.
 *
 * @method 	remove
 * @name 	Remove a contact
 * @param 	id {String} required The id of the contact to remove
 */
var remove = function (request, response) {
	contactDao.remove(request.params.id, request.user, function (err, result) {
		if (err) {
			response.send(503, {error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.send(404, {error: 'Unable to find contact with id ' + request.params.id}); }
			else { response.send(200, result); }
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