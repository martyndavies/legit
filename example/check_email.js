const legit = require("../src/index.js");

legit("martyn@martyndavies.me")
  .then(result => {
    console.log("This is a real email that can accept emails!");
    console.log(JSON.stringify(result));
  })
  .catch(err => console.log("This domain cannot accept emails."));
