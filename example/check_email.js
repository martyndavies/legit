const legit = require("../src/index.js");

legit("martyn@martyndavies.me")
  .then(result => {
    result.isValid ? console.log("Valid!") : console.log("Invalid!");
    console.log(JSON.stringify(result));
  })
  .catch(err => console.log(err));
