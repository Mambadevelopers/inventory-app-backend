const express = require("express");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");
const { contactUs } = require("../controllers/contactController");


router.post("/", protect, contactUs );

//export the router so that we can use it in our server
module.exports = router;
