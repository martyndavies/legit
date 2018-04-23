const dns = require("dns");

const validateEmailAddress = emailAddress => {
  return new Promise((resolve, reject) => {
    const splitEmail = emailAddress.split("@");

    dns.resolveMx(splitEmail[1], (err, mx) => {
      if (typeof mx != "undefined") {
        resolve({ isValid: true, mxArray: mx });
      } else {
        reject({ isValid: false, errors: err });
      }
    });
  });
};

module.exports = validateEmailAddress;
