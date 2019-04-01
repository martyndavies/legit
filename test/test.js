const assert = require('assert');
const should = require('should');
const legit = require('../src');

describe('Testing Emails', function() {
  describe('Email is legit', function() {
    it('should return true when email is legit', function() {
      legit('martyn@nexmo.com')
        .then(
          result =>
            result.isValid.should.be.true && should.exist(result.mxArray)
        )
        .catch(err => should.exist(err.errors));
    });
  });

  describe('Email is not legit', function() {
    it('should return false when email is not legit', function() {
      legit('nosir@neverwouldibuythisdomainladdyohno.com')
        .then(result => result.isValid.should.not.exist)
        .catch(err => should.exist(err.errors));
    });
  });
});
