# Legit

![Travis CI](https://travis-ci.org/martyndavies/legit.svg?branch=master)

A wrapper for the NodeJS Dns.resolveMx method that checks the domain of an email address for valid/existence of MX records.

## Installation

```html
$ npm install legit
```
## Usage

```javascript
const legit = require('legit');

legit('martyn@martyndavies.me')
  .then(result => {
    console.log('This is a real email that can accept emails!');
    console.log(JSON.stringify(result));
  })
  .catch(err => console.log('This domain cannot accept emails.'));
```

If an email addresses domain is legit then the object returned will include an `isValid` key that will be set to `true` as well as an `mxArray` key with all the MX record information for the valid domain.

If the domain has no MX or cannot resolve any MX then it will return `isValid` as `false`, along with `errors`.


## License

(The MIT License)

Copyright (c) 2015-2018 Martyn Davies, and contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
