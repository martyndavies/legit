var dns = require('dns');

module.exports = function(emailAddress, cb) {
	'use strict';
	var splitEmail = emailAddress.split('@');
	dns.resolveMx(splitEmail[1], function(err, addresses){
		if (addresses) {
			cb(true, addresses);
		} else {
			cb(false, null);
		}
	});
};