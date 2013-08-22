# Legit

A wrapper for the NodeJS Dns.resolveMx method that checks the domain of an email address for valid/existence of MX records.

## Installation

```html
$ npm install legit
```
## Usage

```javascript
var checkEmail = require('legit');

checkEmail('martyn@sendgrid.com', function(validation, addresses) {
	if (validation === true) {
		console.log('This is a real email that can accept emails!');
		console.log(JSON.stringify(addresses));
	} else {
		console.log('This domain cannot accept emails, you might want to remove it.');
	}
});
```

If an email addresses domain is legit then the `validation` will be true and an array of MX records will be returned as well. If the domain has no MX or cannot resolve any MX then it will return false and the `addresses` will be `null`.
