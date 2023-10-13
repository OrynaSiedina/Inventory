const express = require('express');
const {registerUser} = require("../controlers/userController");
const router = express.Router();

/*const {registerUser} = require("../controllers/userController");*/

router.post("/register", registerUser)

module.exports = router;
