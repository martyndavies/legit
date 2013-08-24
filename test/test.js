var assert = require('assert');
var should = require('should');
var legit = require('../');

describe('Testing Emails', function(){
	describe('Email is legit', function(){
		it('should return true when email is legit', function(){
			legit('martyn@sendgrid.com', function(validation, addresses){
				validation.should.be.true;
				should.exist(addresses);
			});
		});
	});

	describe('Email is not legit', function(){
		it('should return false when email is not legit', function(){
			legit('nosir@neverwouldibuythisdomainladdyohno.com', function(validation, addresses){
				validation.should.be.false;
				should.not.exist(addresses);
			});
		});
	});
});