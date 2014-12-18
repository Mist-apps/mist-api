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
var parser = require('../modules/contactsParser.js');



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
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (item) { response.status(200).send(item); }
			else { response.status(404).send({error: 'Unable to find contact with id ' + request.params.id}); }
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
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			response.status(200).send(items);
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
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			response.status(200).send(item[0]);
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
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			// If no update, there is maybe a conflict, or item not found
			if (!result) {
				contactDao.findById(request.params.id, request.user, function (err, item) {
					if (err) {
						response.status(503).send({error: 'Database error: ' + err.message});
					} else {
						// Item found but not updated just before because of conflict !
						if (item) { response.status(409).send(item); }
						// No item found, it was normal that the update not worked
						else { response.status(404).send({error: 'Unable to find contact with id ' + request.params.id}); }
					}
				});
			}
			// If update done
			else {
				response.status(200).send(result);
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
			response.status(503).send({error: 'Database error: ' + err.message});
		} else {
			if (result === 0) { response.status(404).send({error: 'Unable to find contact with id ' + request.params.id}); }
			else { response.status(200).send(result); }
		}
	});
};

/**
 * Export all the contacts of the user in JSON format
 *
 * @method 	exportAll
 * @name 	Export all the contacts
 */
var exportAll = function (request, response) {
	contactDao.findAll(request.user, function (err, items) {
		if (err) {
			response.status(503).send({error: 'Database error: ' + err.message});
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
				response.status(200).send(items);
			} else {
				response.status(406).send({error: 'Accepted response formats: JSON'});
			}
		}
	});
};

/**
 * Import all the contacts of the user in Google CSV format or the Mist JSON format
 * Content-Type header must be
 *		- text/csv; app=google
 *		- application/json; app=mist
 */
var importAll = function (request, response) {
	// Google CSV
	if (request.is('csv') && request.get('Content-Type').indexOf('app=google') > -1) {
		// Parse the data
		parser.parseGoogle(request.body, function (err, contacts) {
			if (err) {
				response.send(400).send({error: 'The CSV file cannot be parsed: ' + err.message});
			} else {
				// Clean the groups
				_cleanGroups(request.user, contacts, function (err) {
					if (err) {
						response.send(503).send({error: 'Unable to manage the groups: ' + err.message});
					} else {
						// Insert the contacts
						contactDao.insert(request.user, contacts, function (err, items) {
							if (err) {
								response.status(503).send({error: 'Database error: ' + err.message});
							} else {
								response.status(200).send({message: 'Import successful, ' + items.length + ' contacts imported.', number: items.length});
							}
						});
					}
				});
			}
		})
	}
	// Mist JSON
	else if (request.is('json') && request.get('Content-Type').indexOf('app=mist') > -1) {
		contactDao.insert(request.user, request.body, function (err, items) {
			if (err) {
				response.status(503).send({error: 'Database error: ' + err.message});
			} else {
				response.status(200).send({message: 'Import successful, ' + items.length + ' contacts imported.', number: items.length});
			}
		});
	}
	// Unknown
	else {
		response.status(415).send({error: 'Accepted formats: CSV (Google), JSON (Mist)'});
	}
};

/**
 * Clean the contacts adding the groups or removing them if
 * they already exists.
 * The contacts are directly modified, no other data is returned.
 *
 * @param user the user making the query
 * @param contacts the contacts to clean
 * @param callback a callback with an error, or null
 */
var _cleanGroups = function (user, contacts, callback) {
	contactDao.find(user, {name: {$exists: 1}}, function (err, items) {
		// If there is an error
		if (err) {
			if (callback) callback(new Error('[Contact] Unable to clean groups: ' + err.message));
			return;
		}
		// Get groups names (the starred group is default)
		var groups = ['Starred'];
		for (var i in items) {
			groups.push(items[i].name);
		}
		// Check contacts
		for (var i in contacts) {
			// If it is a group
			if (contacts[i].name) {
				// If the group already exists, delete it
				if (groups.indexOf(contacts[i].name) > -1) {
					delete contacts[i].name;
				}
			}
			// If it is a contact and it has groups
			else if (contacts[i].groups) {
				// Check each group
				for (var j in contacts[i].groups) {
					// If the group does not exist yet, add it
					if (groups.indexOf(contacts[i].groups[j]) === -1) {
						contacts.push({
							creationDate: new Date().getTime(),
							name: contacts[i].groups[j],
							icon: 'fa-users'
						});
						groups.push(contacts[i].groups[j]);
					}
				}
			}
		}
		// Callback
		if (callback) callback(null);
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
exports.exportAll = exportAll;
exports.importAll = importAll;