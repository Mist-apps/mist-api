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
		xml += any;
	}
	xml += '</' + name + '>'
	return xml;
}



/**
 * Exports
 */

// Methods
exports.convert = convert;