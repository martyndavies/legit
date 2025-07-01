import 'should';
import legit from '../src';
import { MxRecord } from 'dns';

// Define the result type based on the implementation
interface LegitResult {
  isValid: boolean;
  mxArray: MxRecord[] | null;
  mxRecordSetExists?: boolean;
}

describe('Testing Emails', function () {
  this.timeout(5000); // Increase timeout for DNS lookups

  describe('Email is legit', function () {
    it('should return true when email is legit', () => {
      return legit('martyn@vonage.com').then((result: LegitResult) => {
        result.isValid.should.be.true();
        should(result.mxArray).not.be.null();
      });
    });
  });

  describe('Email is not legit', function () {
    it('should return false when email is not legit', () => {
      return legit('nosir@neverwouldibuythisdomainladdyohno.com').then((result: LegitResult) => {
        result.isValid.should.be.false();
        should(result.mxArray).be.null();
        result.mxRecordSetExists!.should.be.false();
      });
    });
  });
});
