const bcrypt = require("bcryptjs");

const newPassword = "password123"; // The password you want to set
bcrypt.hash(newPassword, 10).then((hash) => {
  console.log("New Hashed Password:", hash);
});
