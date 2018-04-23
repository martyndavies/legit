# Legit

![Travis CI](https://travis-ci.org/martyndavies/legit.svg?branch=master)

A wrapper for the NodeJS Dns.resolveMx method that checks the domain of an email address for valid/existence of MX records.

## Installation

```html
$ npm install legit
```
## Usage

```javascript
const legit = require("legit");

legit("validemail@validdomain.com")
  .then(result => {
    result.isValid ? console.log("Valid!") : console.log("Invalid!");
    console.log(JSON.stringify(result));
  })
  .catch(err => console.log(err));

```

If an email addresses domain is legit then the object returned will include an `isValid` key that will be set to `true` as well as an `mxArray` key with all the MX record information for the valid domain.

If the domain has no MX or cannot resolve any MX then it will return `isValid` as `false`.

Anything else is considered an error and you'll get it in the `.catch`


## License

(The MIT License)

Copyright (c) 2015-2018 Martyn Davies, and contributors.