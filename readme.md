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

legit('validemail@validdomain.com')
  .then(result => {
    result.isValid ? console.log('Valid!') : console.log('Invalid!');
    console.log(JSON.stringify(result));
  })
  .catch(err => console.log(err));
```

If an email addresses domain is legit then the object returned will include an `isValid` key that will be set to `true` as well as an `mxArray` key with all the MX record information for the valid domain.

If the domain has no MX or cannot resolve any MX then it will return `isValid` as `false`.

Anything else is considered an error and you'll get it in the `.catch`

## Async/Await Usage

For a more modern approach using ES6, you can `await` the reponse before acting on it.

```javascript
const legit = require('legit');

(async () => {
  try {
    const response = await legit('validemail@validdomain.com');
    response.isValid ? console.log('valid') : console.log('invalid');
  } catch (e) {
    console.log(e);
  }
})();
```

## Example Response

For a valid email address, you'll get the following response object:

```json
{
  "isValid": true,
  "mxArray": [
    {
      "exchange": "aspmx.l.google.com",
      "priority": 1
    },
    {
      "exchange": "alt1.aspmx.l.google.com",
      "priority": 5
    },
    {
      "exchange": "alt2.aspmx.l.google.com",
      "priority": 5
    },
    {
      "exchange": "alt3.aspmx.l.google.com",
      "priority": 10
    },
    {
      "exchange": "alt4.aspmx.l.google.com",
      "priority": 10
    }
  ]
}
```

## License

(The MIT License)

Copyright (c) 2015-2019 Martyn Davies, and contributors.
