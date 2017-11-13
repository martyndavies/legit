const dns = require('dns');

module.exports = function(emailAddress, cb) {
	var splitEmail = emailAddress.split('@');
	dns.resolveMx(splitEmail[1], function(err, addresses) {
        if (err) {
            if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
                cb(null, false, null);
            } else {
                cb(err, false, null);
            }
        } else {
            cb(null, addresses.length > 0, addresses);
        }
	});
};
