/**
 * =============================
 *
 * Logger to log messages for the application.
 * This is a simple wrapper for the "winston" logger.
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *		- info(message)
 *		- warn(message)
 *		- error(message)
 *
 * Events : /
 *
 * =============================
 */



/**
 * Load modules
 */

// Custom
var csvParser = require('csv-parse');



/**
 * Parse a Google CSV File and transform it in a Contact JSON Object
 */
var parseGoogle = function (csv, callback) {
	// If no callback, does nothing...
	if (!callback) {
		return;
	}
	// Parse the CSV string
	csvParser(csv, {columns: true, skip_empty_lines: true}, function (err, googleContacts) {
		// If an error occurs during parsing
		if (err) {
			callback(err);
		}
		// If no error, create contacts JSON objects and return them
		else {
			_cleanEmptyFields(googleContacts);
			var mistContacts = [];
			// Parse each contact
			for (var i in googleContacts) {
				// New Mist contact
				var contact = {};
				mistContacts.push(contact);
				// First name
				if (googleContacts[i]['Given Name']) {
					contact.firstName = googleContacts[i]['Given Name'];
				}
				// Second name
				if (googleContacts[i]['Additional Name']) {
					if (contact.firstName) {
						contact.firstName += ' ' + googleContacts[i]['Additional Name'];
					} else {
						contact.firstName = googleContacts[i]['Additional Name'];
					}
				}
				// Last name
				if (googleContacts[i]['Family Name']) {
					contact.lastName = googleContacts[i]['Family Name'];
				}
				// If no first/last name
				if (!contact.firstName || !contact.lastName) {
					contact.firstName = googleContacts[i]['Name'];
				}
				// Nick name
				if (googleContacts[i]['Nickname']) {
					contact.nickname = googleContacts[i]['Nickname'];
				}
				// Organization
				if (googleContacts[i]['Organization 1 - Name']) {
					contact.organization = googleContacts[i]['Organization 1 - Name'];
				}
				// Title
				if (googleContacts[i]['Organization 1 - Title']) {
					contact.title = googleContacts[i]['Organization 1 - Title'];
				}
				// Note
				if (googleContacts[i]['Notes']) {
					contact.note = googleContacts[i]['Notes'];
				}
				// Birthday
				if (googleContacts[i]['Birthday']) {
					contact.birthday = Date.parse(googleContacts[i]['Birthday']);
				}
				// Website
				if (googleContacts[i]['Website 1 - Value']) {
					contact.url = googleContacts[i]['Website 1 - Value'];
				}
				// Phones
				for (var j = 1; googleContacts[i]['Phone ' + j + ' - Value']; j++) {
					// Look for phone type
					var type = '';
					switch (googleContacts[i]['Phone ' + j + ' - Type']) {
						case 'Pager':		type = 'pager'; break;
						case 'Mobile':		type = 'cell'; break;
						case 'Work Fax':	type = 'fax'; break;
						case 'Home Fax':	type = 'fax'; break;
						case 'Work':		type = 'home'; break;
						case 'Main':		type = 'home'; break;
						case 'Home':		type = 'home'; break;
						default:			type = 'home'; break;
					}
					// Add phones array if not present
					if (!contact.phones) {
						contact.phones = [];
					}
					// Get number
					var number = googleContacts[i]['Phone ' + j + ' - Value'];
					// If multiple values
					if (number.indexOf(' ::: ') > -1) {
						var numbers = number.split(' ::: ')
						for (var key in numbers) {
							contact.phones.push({type: type, number: numbers[key]});
						}
					}
					// If only one value
					else {
						contact.phones.push({type: type, number: number});
					}
				}
				// Emails
				for (var j = 1; googleContacts[i]['E-mail ' + j + ' - Value']; j++) {
					// Look for email type
					var type = '';
					switch (googleContacts[i]['E-mail ' + j + ' - Type']) {
						case 'Work':		type = 'professional'; break;
						case 'Home':		type = 'personal'; break;
						default:			type = 'personal'; break;
					}
					// Add emails array if not present
					if (!contact.mails) {
						contact.mails = [];
					}
					// Get address
					var address = googleContacts[i]['E-mail ' + j + ' - Value'];
					// If multiple values
					if (address.indexOf(' ::: ') > -1) {
						var addresses = address.split(' ::: ')
						for (var key in addresses) {
							contact.mails.push({type: type, address: addresses[key]});
						}
					}
					// If only one value
					else {
						contact.mails.push({type: type, address: address});
					}
				}
				// Addresses
				for (var j = 1; googleContacts[i]['Address ' + j + ' - Formatted']; j++) {
					// Prepare address
					var address = {};
					// Type
					address.type = '';
					switch (googleContacts[i]['Address ' + j + ' - Type']) {
						case 'Work':		address.type = 'work'; break;
						case 'Home':		address.type = 'home'; break;
						default:			address.type = 'home'; break;
					}
					// Street
					if (googleContacts[i]['Address ' + j + ' - Street']) {
						address.street = googleContacts[i]['Address ' + j + ' - Street'];
					}
					// Number
					if (address.street) {
						var regex = /,?\s*(\d+[a-zA-Z]?),?\s*/mg;
						// If multiple streets
						if (address.street.indexOf(' ::: ') > -1) {
							var streets = address.street.split(' ::: ');
							var numbers = [];
							for (var k in streets) {
								var matches = regex.exec(streets[k]);
								// If exactly one item found, and one captured item, and no more matches after
								if (matches && matches.length === 2 && !regex.exec(streets[k])) {
									// Remove the number
									streets[k] = streets[k].replace(regex, '');
									// Save it
									numbers[k] = matches[1];
								}
							}
							address.street = streets.join(' ::: ');
							address.number = numbers.join(' ::: ');
						}
						// If one street
						else {
							var matches = regex.exec(address.street);
							// If exactly one item found, and one captured item, and no more matches after
							if (matches && matches.length === 2 && !regex.exec(address.street)) {
								// Remove the number
								address.street = address.street.replace(regex, '');
								// Save it
								address.number = matches[1];
							}
						}
					}
					// Box
					if (googleContacts[i]['Address ' + j + ' - PO Box']) {
						address.box = googleContacts[i]['Address ' + j + ' - PO Box'];
					}
					// Postal Code
					if (googleContacts[i]['Address ' + j + ' - Postal Code']) {
						address.postalCode = googleContacts[i]['Address ' + j + ' - Postal Code'];
					}
					// City
					if (googleContacts[i]['Address ' + j + ' - City']) {
						address.locality = googleContacts[i]['Address ' + j + ' - City'];
					}
					// Region
					if (googleContacts[i]['Address ' + j + ' - Region']) {
						address.region = googleContacts[i]['Address ' + j + ' - Region'];
					}
					// Country
					if (googleContacts[i]['Address ' + j + ' - Country']) {
						address.country = googleContacts[i]['Address ' + j + ' - Country'];
					}
					// Add addresses array if not present
					if (!contact.addresses) {
						contact.addresses = [];
					}
					// If multiple addresses
					if (googleContacts[i]['Address ' + j + ' - Formatted'].indexOf(' ::: ') > -1) {
						// Separate the fields
						var streets = address.street ? address.street.split(' ::: ') : null;
						var numbers = address.number ? address.number.split(' ::: ') : null;
						var boxes = address.box ? address.box.split(' ::: ') : null;
						var postalCodes = address.postalCode ? address.postalCode.split(' ::: ') : null;
						var localities = address.locality ? address.locality.split(' ::: ') : null;
						var regions = address.region ? address.region.split(' ::: ') : null;
						var countries = address.country ? address.country.split(' ::: ') : null;
						// Iterate over each address
						for (var k in googleContacts[i]['Address ' + j + ' - Formatted'].split(' ::: ')) {
							var newAddress = {};
							newAddress.type = address.type;
							if (streets && streets[k]) { newAddress.street = streets[k]; }
							if (numbers && numbers[k]) { newAddress.number = numbers[k]; }
							if (boxes && boxes[k]) { newAddress.box = boxes[k]; }
							if (postalCodes && postalCodes[k]) { newAddress.postalCode = postalCodes[k]; }
							if (localities && localities[k]) { newAddress.locality = localities[k]; }
							if (regions && regions[k]) { newAddress.region = regions[k]; }
							if (countries && countries[k]) { newAddress.country = countries[k]; }
							contact.addresses.push(newAddress);
						}
					}
					// If single address
					else {
						contact.addresses.push(address);
					}
				}
				// Groups
				if (googleContacts[i]['Group Membership']) {
					var groups = googleContacts[i]['Group Membership'].split(' ::: ');
					for (var j in groups) {
						// Get group name
						var group = groups[j].replace(/^\* /, '');
						// Skip 'My Contacts' built-in group
						if (group === 'My Contacts') {
							continue;
						}
						// If no groups array
						if (!contact.groups) {
							contact.groups = [];
						}
						// Add group to contact
						contact.groups.push(group);
					}
				}
			}
			// Return the Mist contacts
			callback(null, mistContacts);
		}
	});
};


/**
 * Remove all empty fields in the contacts.
 * An empty field is an empty string.
 */
var _cleanEmptyFields = function (contacts)  {
	for (var i in contacts) {
		for (var j in contacts[i]) {
			if (contacts[i][j] === '') {
				delete contacts[i][j];
			}
		}
	}
};


/**
 * Exports
 */

// Methods
exports.parseGoogle = parseGoogle;