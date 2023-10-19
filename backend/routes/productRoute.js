const express = require('express');
const router = express.Router();
const {createProduct} = require("../controlers/productController");
const protect = require("../middlewares/authMiddleware");

router.post("/",protect, createProduct)

module.exports = router;
