const dns = require('dns');

interface LegitResult {
  isValid: boolean;
  mxArray: any[] | null;
  mxRecordSetExists?: boolean;
}

const validateEmailAddress = (emailAddress: string): Promise<LegitResult> => {
  return new Promise((resolve, reject) => {
    const splitEmail = emailAddress.split('@');

    dns.resolveMx(splitEmail[1], (err: NodeJS.ErrnoException | null, mx: any) => {
      if (typeof mx != 'undefined') {
        mx
          ? resolve({ isValid: true, mxArray: mx })
          : resolve({ isValid: false, mxArray: null });
      } else if (err && err.code == 'ENOTFOUND') {
        resolve({ isValid: false, mxArray: null, mxRecordSetExists: false});
      } else if (err) {
        reject(new Error(err.code));
      }
    });
  });
};

export default validateEmailAddress;
