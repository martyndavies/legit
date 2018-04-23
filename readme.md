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