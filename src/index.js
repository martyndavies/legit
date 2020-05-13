const dns = require('dns');

const validateEmailAddress = emailAddress => {
  return new Promise((resolve, reject) => {
    const splitEmail = emailAddress.split('@');

    dns.resolveMx(splitEmail[1], (err, mx) => {
      if (typeof mx != 'undefined') {
        mx
          ? resolve({ isValid: true, mxArray: mx })
          : resolve({ isValid: false, mxArray: null });
      } else if (err.code == 'ENOTFOUND') {
        resolve({ isValid: false, mxArray: null, mxRecordSetExists: false});
      } else {
        reject(new Error(err.code));
      }
    });
  });
};

module.exports = validateEmailAddress;
