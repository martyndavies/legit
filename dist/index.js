"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dns = require('dns');
const validateEmailAddress = (emailAddress) => {
    return new Promise((resolve, reject) => {
        const splitEmail = emailAddress.split('@');
        dns.resolveMx(splitEmail[1], (err, mx) => {
            if (typeof mx != 'undefined') {
                mx
                    ? resolve({ isValid: true, mxArray: mx })
                    : resolve({ isValid: false, mxArray: null });
            }
            else if (err && err.code == 'ENOTFOUND') {
                resolve({ isValid: false, mxArray: null, mxRecordSetExists: false });
            }
            else if (err) {
                reject(new Error(err.code));
            }
        });
    });
};
exports.default = validateEmailAddress;
