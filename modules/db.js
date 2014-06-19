/**
 * =============================
 *
 * Manage the database connections: open, close, get...
 *
 * Provide a convenient way to CRUD data through DAO's.
 * New DAO objects can be created from this module
 *
 * =============================
 *
 * Attributes :
 *		- BSON
 *
 * Methods :
 *		- open(host, port, database(s), defaultDb, [callback])
 *		- close([database(s)], [callback])
 *		- DAO(collectionName, [database])
 *				- findOne()
 *				- findById()
 *				- find()
 *				- findAll()
 *				- insert()
 *				- update()
 *				- replace()
 *				- delete()
 *				- listen()
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Built-in
var mongo = require('mongodb');
var async = require('async');
// Custom
var logger = require('./logger');



/**
 * Variables
 */

// DB Connections
var connections = {};
// BSON
var BSON = mongo.BSONPure;
// Default database used when getting a Dao without specifying the database
var defaultDatabase;



/**
 * Open a database connection
 * If an argument is missing, callback an error
 * If database already opened, just callback and return
 *
 * The database argument can be an array or a string to
 * open multiple connections once.
 *
 * @param host the database host to connect with (hostname or ip)
 * @param port the database port to connect with
 * @param databases the database(s) to connect to, may be a string or an array to open multiple databases
 * @param defaultDb the database to use by default when getting a Dao without specifying the database
 * @param callback a function called after the database(s) are opened, first argument is en error and may be null
 */
var open = function (host, port, databases, defaultDb, callback) {
	// Check for missing or invalid arguments
	if (host === undefined) {
		if (callback) callback(new Error('[DB] Unable to open database: undefined host'));
		return;
	}
	if (port === undefined) {
		if (callback) callback(new Error('[DB] Unable to open database: undefined port'));
		return;
	}
	if (databases === undefined) {
		if (callback) callback(new Error('[DB] Unable to open database: undefined database'));
		return;
	}
	if (!(databases instanceof Array) && typeof databases !== 'string') {
		if (callback) callback(new Error('[DB] Unable to open database: database(s) argument must be an array or a string'));
		return;
	}

	// Save defaultDatabase
	if (typeof defaultDb !== 'function') {
		defaultDatabase = defaultDb;
	} else {
		callback = defaultDb;
	}

	// Open multiple databases
	if (databases instanceof Array) {
		// Add host/port information
		for (var key in databases) {
			databases[key] = {host: host, port: port, database: databases[key]};
		}
		// Open each database
		async.each(databases, _openDatabase, function (err) {
			if (err) {
				if (callback) callback(new Error('[DB] Unable to open multiple databases on ' + host + ':' + port + ' : ' + err.message));
			} else {
				if (callback) callback(null);
			}
		});
	}
	// Open a single database
	else if (typeof databases === 'string') {
		_openDatabase({host: host, port: port, database: databases}, function (err) {
			if (err) {
				if (callback) callback(new Error('[DB] Unable to open database ' + databases + ' on ' + host + ':' + port + ' : ' + err.message));
			} else {
				if (callback) callback(null);
			}
		});
	}
	// Unknown state
	else {
		if (callback) callback(new Error('[DB] Unable to open database: unknown error'));
	}
};

/**
 * Close a database connection
 * If no database given, close all the connections
 * If database not opened, just callback and return
 *
 * @param database the database name to disconnect, may be null if all the databases must be closed
 * @param callback function called when done returning an error or null
 */
var close = function (database, callback) {
	// Check for missing arguments
	if (typeof database === 'function') {
		callback = database;
		database = undefined;
	}

	// Close all the databases
	if (!database) {
		// Search opened databases
		var databases = [];
		for (var key in connections) {
			databases.push(key);
		}
		// Close each database
		async.each(databases, _closeDatabase, function (err) {
			if (err) {
				if (callback) callback(new Error('[DB] Unable to close multiple databases: ' + err.message));
			} else {
				if (callback) callback(null);
			}
		});
	}
	// Close only the asked database
	else {
		_closeDatabase(database, function (err) {
			if (err) {
				if (callback) callback(new Error('[DB] Unable to close database ' + database + ': ' + err.message));
			} else {
				if (callback) callback(null);
			}
		});
	}
};

/**
 * Open a single database.
 * If the database is already opened, only log a warning
 * and callback.
 *
 * @param database an object with the host, port and database name to connect to
 * @param callback function called when done returning an error or null
 */
var _openDatabase = function (database, callback) {
	var dbName = database.database;
	// Check if a connection exists, if exists, callback and return
	if (connections[dbName] !== undefined) {
		logger.warn('[DB] Unable to open "' + dbName + '" database connection: database already opened');
		if (callback) callback(null);
		return;
	}
	// Create the database connection
	var server = new mongo.Server(database.host, database.port, {auto_reconnect: true});
	connections[dbName] = new mongo.Db(dbName, server, {safe: true});
	// Connect to the DB
	connections[dbName].open(function (err, newDb) {
		if (err) {
			connections[dbName] = undefined;
			if (callback) callback(new Error('Unable to connect to "' + dbName + '" database on ' + database.host + ':' + database.port + ' : ' + err));
		} else {
			connections[dbName] = newDb;
			// Listen to database connection problems
			connections[dbName].on('close', function() {
				logger.error('[DB] Connection to "' + dbName + '" database loosed !');
			});
			logger.info('[DB] Connected to "' + dbName + '" database');
			if (callback) callback(null);
		}
	});
};

/**
 * Close a single database.
 * If the database is not opened, only log a warning and callback.
 *
 * @param database the name of the database to close
 * @param callback function called when done returning an error or null
 */
 var _closeDatabase = function (database, callback) {
	// Check if a connection exists, if not exists, callback and return
	if (connections[database] === undefined) {
		logger.warn('[DB] Unable to close "' + database + '" database connection: database not opened');
		if (callback) callback(null);
		return;
	}
	// Force close the connection
	connections[database].close(true, function (err) {
		// If error or not, delete the connection
		connections[database] = undefined
		// Log and callback
		if (err) {
			if (callback) callback(new Error('Unable to close "' + database + '" database connection: ' + err.message));
		} else {
			logger.info('[DB] Connection to "' + database + '" database closed');
			if (callback) callback(null);
		}
	});
};

/**
 * Get the connection for a given database.
 * If there is no connection, return null
 * If the connection exists but is not currently connected
 * because of a network problem, return null too.
 *
 * @param the name of the database of which a connection is needed
 * @return an active connection object, or null
 */
var _getConnection = function (database) {
	// If no database set, set the default database (to avoid problems because of creating dao in modules before open db);
	if (this.database === undefined) {
		database = defaultDatabase;
	}
	// Return connection or null if not connected
	if (connections[database] && connections[database].serverConfig.isConnected()) {
		return connections[database];
	}
	return null;
};



/**
 * DAO class definition
 */

function Dao(collectionName, database) {
	this.database = database ? database : defaultDatabase;
	this.collectionName = collectionName;
};



/**
 * Raw method: Find one item in collection
 *
 * @param query the mongoDB selector object
 * @param callback a callback containing an error or null and the found object
 */
Dao.prototype._findOne = function (query, callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to find a document'));
		return;
	}
	// Define locally the collectionName to use it in the nested functions
	var collectionName = this.collectionName;
	logger.info('[DB] Find one item from ' + this.collectionName + ' matching ' + JSON.stringify(query));
	connection.collection(this.collectionName, function (err, collection) {
		collection.findOne(query, function (err, result) {
			if (err) {
				var message = '[DB] Error while searching one item in ' + collectionName + ' matching ' + JSON.stringify(query) + ': ' + err.message;
				logger.warn(message);
				if (callback) callback(new Error(message), null);
			} else {
				logger.info('[DB] Item found in ' + collectionName + ': ' + JSON.stringify(result));
				if (callback) callback(null, result);
			}
		});
	});
};

/**
 * Raw method: Find items in collection
 *
 * @param query the mongoDB selector object
 * @param callback a callback containing an error or null and the found objects
 */
Dao.prototype._find = function (query, callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to find documents'));
		return;
	}
	// Define locally the collectionName to use it in the nested functions
	var collectionName = this.collectionName;
	logger.info('[DB] Find all items from ' + this.collectionName + ' matching ' + JSON.stringify(query));
	connection.collection(this.collectionName, function (err, collection) {
		collection.find(query).toArray(function (err, result) {
			if (err) {
				var message = '[DB] Error while searching multiple items in ' + collectionName + ' matching ' + JSON.stringify(query) + ': ' + err.message;
				logger.warn(message);
				if (callback) callback(new Error(message), null);
			} else {
				logger.info('[DB] Item found in ' + collectionName + ': ' + JSON.stringify(result));
				if (callback) callback(null, result);
			}
		});
	});
};

/**
 * Raw method: Update items in collection
 *
 * @param selector the mongoDB selector object
 * @param item the mongoDB data object
 * @param options the mongoDB options object
 * @param callback a callback containing an error or null and the number of updated records
 */
Dao.prototype._update = function (selector, item, options, callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to update documents'));
		return;
	}
	// Define locally the collectionName to use it in the nested functions
	var collectionName = this.collectionName;
	logger.info('[DB] Update/Replace item from ' + this.collectionName + ' set ' + JSON.stringify(item) + ' matching ' + JSON.stringify(selector));
	connection.collection(this.collectionName, function (err, collection) {
		collection.update(selector, item, options, function (err, result) {
			if (err) {
				var message = '[DB] Error while updating items in ' + collectionName + ': ' + err.message;
				logger.warn(message);
				if (callback) callback(new Error(message), null);
			} else {
				logger.info('[DB] ' + result + ' items updated in ' + collectionName);
				if (callback) callback(null, result);
			}
		});
	});
};

/**
 * Raw method: Insert items in collection
 *
 * @param items the mongoDB data object (array or single object)
 * @param options the mongoDB options object
 * @param callback a callback containing an error or null and an array of the inserted records
 */
Dao.prototype._insert = function (items, options, callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to insert documents'));
		return;
	}
	// Define locally the collectionName to use it in the nested functions
	var collectionName = this.collectionName;
	logger.info('[DB] Insert item(s) in ' + this.collectionName + ': ' + JSON.stringify(items));
	connection.collection(this.collectionName, function (err, collection) {
		collection.insert(items, options, function (err, result) {
			if (err) {
				var message = '[DB] Error while inserting items in ' + collectionName + ': ' + err.message;
				logger.warn(message);
				if (callback) callback(new Error(message), null);
			} else {
				logger.info('[DB] ' + result.length + ' items inserted in ' + collectionName);
				if (callback) callback(null, result);
			}
		});
	});
};

/**
 * Raw method: Remove items in collection
 *
 * @param item the mongoDB data object
 * @param options the mongoDB options object
 * @param callback a callback containing an error or null and the number of removed objects
 */
Dao.prototype._remove = function (selector, options, callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to remove documents'));
		return;
	}
	// Define locally the collectionName to use it in the nested functions
	var collectionName = this.collectionName;
	logger.info('[DB] Delete item(s) from ' + this.collectionName + ' matching ' + JSON.stringify(selector));
	connection.collection(this.collectionName, function (err, collection) {
		collection.remove(selector, options, function (err, result) {
			if (err) {
				var message = '[DB] Error while deleting items in ' + collectionName + ': ' + err.message;
				logger.warn(message);
				if (callback) callback(new Error(message), null);
			} else {
				logger.info('[DB] ' + result + ' items deleted in ' + collectionName);
				if (callback) callback(null, result);
			}
		});
	});
};

/**
 * Convenient method: Find one item in collection
 *
 * @param user the string id of the user owning the object to get
 * @param query the mongoDB selector object
 * @param callback a callback containing an error or null and the found object
 */
Dao.prototype.findOne = function (user, query, callback) {
	// Add user to query
	try {
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback();
		return;
	}
	query._user = user;
	this._findOne(query, callback);
};

/**
 * Convenient method: Find one item in collection by id
 *
 * @param user the string id of the user owning the object to get
 * @param id the string id of the object to search in collection
 * @param callback a callback containing an error or null and the found object
 */
Dao.prototype.findById = function (id, user, callback) {
	try {
		id = new BSON.ObjectID(id);
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback();
		return;
	}
	this._findOne(user, {_id: id, _user: user}, callback);
};

/**
 * Convenient method: Find multiple items in collection
 *
 * @param user the string id of the user owning the objects to get
 * @param query the mongoDB selector object
 * @param callback a callback containing an error or null and the found objects
 */
Dao.prototype.find = function (user, query, callback) {
	// Add user to query
	try {
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback();
		return;
	}
	query._user = user;
	this._find({_user: user}, callback);
};

/**
 * Convenient method: Find all items in collection
 *
 * @param user the string id of the user owning the objects to get
 * @param callback a callback containing an error or null and the found objects
 */
Dao.prototype.findAll = function (user, callback) {
	this.find(user, {}, callback);
};

/**
 * Convenient method: Insert items in collection
 *
 * @param user the string id of the user owning the object to insert
 * @param items the mongoDB data object (array or single object)
 * @param callback a callback containing null or an array of the inserted records
 */
Dao.prototype.insert = function (user, item, callback) {
	try {
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback(null, 0);
		return;
	}
	item._user = user;
	this._insert(item, {continueOnError: true, w: 1}, callback);
};

/**
 * Convenient method: Update items in collection
 *
 * @param id the string id of the object to update in collection
 * @param user the string id of the user owning the object to update
 * @param item the mongoDB data object
 * @param callback a callback containing an error or null and the number of updated records
 */
Dao.prototype.update = function (id, user, item, callback) {
	try {
		id = new BSON.ObjectID(id);
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback(null, 0);
		return;
	}
	item = {$set: item};
	this._update({_id: id, _user: user}, item, {}, callback);
};

/**
 * Convenient method: Replace items in collection
 *
 * @param id the string id of the object to replace in collection
 * @param user the string id of the user owning the object to replace
 * @param item the mongoDB data object
 * @param callback a callback containing an error or null and the number of replaced records
 */
Dao.prototype.replace = function (id, user, item, callback) {
	try {
		id = new BSON.ObjectID(id);
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback(null, 0);
		return;
	}
	this._update({_id: id, _user: user}, item, {}, callback);
};

/**
 * Convenient method: Remove one item in collection
 *
 * @param id the string id of the object to remove of the collection
 * @param user the string id of the user owning the object to remove
 * @param callback a callback containing an error or null and the number of removed records
 */
Dao.prototype.remove = function (id, user, callback) {
	try {
		id = new BSON.ObjectID(id);
		user = new BSON.ObjectID(user);
	} catch (err) {
		if (callback) callback(null, 0);
		return;
	}
	this._remove({_id: id, _user: user}, {}, callback);
};

/**
 * Convenient method: Listen to new documents in collection
 *
 * @param callback a callback containing an error or null and the new inserted document
 */
Dao.prototype.listen = function (callback) {
	// Get connection
	var connection = _getConnection(this.database);
	if (!connection) {
		if (callback) callback(new Error('[DB] Unable to get connection to "' + this.database + '" to listen to new documents'));
		return;
	}
	logger.info('[DB] Listen for new documents from ' + this.collectionName);
	connection.collection(this.collectionName, function (err, collection) {
		var latest = collection.find({}).sort({ $natural: -1 }).limit(1);
		latest.nextObject(function (err, doc) {
			var query = {_id: { $gt: doc._id }};
			var options = {tailable: true, awaitdata: true, numberOfRetries: -1};
			var cursor = collection.find(query, options).sort({ $natural: 1 });
			var next = function () {
				cursor.nextObject(function (err, item) {
				callback(err, item);
				next();
				});
			};
			next();
		});
	});
};



/**
 * Exports
 */

// Variables
exports.BSON = BSON;
// Methods
exports.open = open;
exports.close = close;
exports.Dao = Dao;
exports._getConnection = _getConnection		// Do not use ! Only for DB initialization