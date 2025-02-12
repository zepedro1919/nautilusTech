const bcrypt = require("bcryptjs");

const newPassword = "EGDCMCBOPI-1919"; // The password you want to set
bcrypt.hash(newPassword, 10).then((hash) => {
  console.log("New Hashed Password:", hash);
});
