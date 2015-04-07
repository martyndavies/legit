# Legit

A wrapper for the NodeJS Dns.resolveMx method that checks the domain of an email address for valid/existence of MX records.

[![Build Status](https://travis-ci.org/martyndavies/legit.png?branch=master)](https://travis-ci.org/martyndavies/legit)

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


## License

(The MIT License)

Copyright (c) 2013 Martyn Davies

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.