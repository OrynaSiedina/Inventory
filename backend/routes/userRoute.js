const express = require('express');
const {registerUser,loginUser, logoutUser,getUser, loginStatus, updateUser, changePassword, restorePassword,
    resetPassword
} = require("../controlers/userController");
const protect = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/logout", logoutUser)
router.get("/loggedin", loginStatus)

router.get("/getuser", protect, getUser)
router.patch("/update",protect, updateUser)

router.patch("/changepassword",protect, changePassword)
router.post("/forgotpassword", restorePassword)
router.put("/resetpassword/:resetToken", resetPassword)


module.exports = router;
