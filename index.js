const dns = require('dns');

module.exports = function(emailAddress, cb) {
	'use strict';
	let splitEmail = emailAddress.split('@');
	dns.resolveMx(splitEmail[1], function(err, addresses){
		if (addresses) {
			cb(true, addresses, null);
		} else {
			cb(false, null, err);
		}
	});
};
