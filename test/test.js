const assert = require('assert');
const should = require('should');
const legit = require('../');

describe('Testing Emails', function(){
	describe('Email is legit', function(){
		it('should return true when email is legit', function(){
			legit('martyn@martyndavies.me', function(validation, addresses, err){
				validation.should.be.true;
				should.exist(addresses);
			});
		});
	});

	describe('Email is not legit', function(){
		it('should return false when email is not legit', function(){
			legit('nosir@neverwouldibuythisdomainladdyohno.com', function(validation, addresses, err){
				validation.should.be.false;
				should.not.exist(addresses);
				should.exist(err);
			});
		});
	});
});
