/**
 * =============================
 *
 * Load config for the application from a config file
 * and allow access it easily.
 *
 * The values are in read-only mode. Please NEVER
 * update them. Any update will impact all the app...
 *
 * =============================
 *
 * Attributes :
 *		- All the config key-values in read-only mode.
 *
 * Methods :
 *		- load([callback])
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Built-in
var fs  = require('fs');
// Custom
var logger = require('logger');



/**
 * Variables
 */

// Config
var config = {};
// An array of files that will be used to find the bootstrap.properties file
var files = ['config.json'];



/**
 * Load configuration found in the config file.
 *
 * @param callback return an error or null
 */
var load = function (callback) {
	// Search config file
	var file;
	for (key in files) {
		if (fs.existsSync(files[key])) {
			file = files[key];
			break;
		}
	}
	// If no config file found
	if (file === undefined) {
		if (callback) callback(new Error('[Bootstrap] No config file found in the following places: ' + files.join(', ')));
		return;
	}

	// Start loading config
	logger.info('[Bootstrap] Start loading config file: ' + file);
	// Read file content
	var fileContents = fs.readFileSync(file, 'UTF-8');
	// Populate config
	bootstrapConfig = {};
	try {
		var parsedConfig = JSON.parse(fileContents);
		for (var key in parsedConfig) {
			config[key] = parsedConfig[key];
		}
	} catch (err) {
		if (callback) callback(new Error('[Bootstrap] Unable to parse the configuration file ' + file + ': ' + err.message));
		return;
	}
	// Done
	logger.info('[Bootstrap] Config file ' + file + ' loaded');
	if (callback) callback(null);
};



/**
 * Exports
 */

// Variables
module.exports = exports = config;
// Methods
exports.load = load;