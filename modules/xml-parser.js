/**
 * =============================
 *
 * XML Parser to encode JSON objects into XML strings
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *		- convert(rootElement, object)
 *
 * Events : /
 *
 * =============================
 */



/**
 * Convert a JSON object into an XML string
 *
 * @param name The name of the root element
 * @param json The JSON object to convert
 * @return the XML string
 */
var convert = function (root, json) {
	var xml = '<?xml version="1.0" encoding="UTF-8"?>';
	xml += _convertAny(root, json);
	return xml;
};

/**
 * Convert any variable into an XML string (object, array, string)
 *
 * @param name The name of the element
 * @param any The element to convert
 * @return the XML string
 */
var _convertAny = function (name, any) {
	var xml = '<' + name + '>';
	if (Array.isArray(any)) {
		for (var key in any) {
			xml += _convertAny(name.substring(0, name.length - 1), any[key]);
		}
	} else if (typeof any === 'object' && any.toString() === '[object Object]') {
		for (var key in any) {
			xml += _convertAny(key, any[key]);
		}
	} else {
		xml += '<![CDATA[' + any + ']]>';
	}
	xml += '</' + name + '>'
	return xml;
};

/**
 * Parse the given XML string into a JSON object
 */
var parse = function (xml, callback) {
	var xml2js = require('xml2js');
	var parser = new xml2js.Parser({explicitArray: false});
	parser.parseString(xml, function (err, json) {
		_cleanJSON(json);
		if (callback) {
			callback(json);
		}
	});
};

/**
 * Clean the JSON object parsed by XML2JS.
 * Remove the single properties. For example:
 * notes -> note -> [] becomes notes -> [].
 */
var _cleanJSON = function (json) {
	for (var i in json) {
		// If not an object, no clean needed
		if (typeof json[i] !== 'object') {
			continue;
		}
		// Clean
		var keys = Object.keys(json[i]);
		if (keys.length === 1 && Array.isArray(json[i][keys[0]])) {
			json[i] = json[i][keys[0]];
		}
		// Clean recursively
		_cleanJSON(json[i]);
	}
};



/**
 * Exports
 */

// Methods
exports.convert = convert;
exports.parse = parse;