const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");


const protect = asyncHandler( async(req, res, next) => {
  try {
    const token = req.cookies.token

    //What if this token does not exist?
    if(!token) {
      res.status(401)
      throw new Error("Not authorized, please login");
    }

    //What if the request came with a token, then we need to verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    //Get user from token after user has been authorized
    const user = await User.findById(verified.id).select("-password")

    if(!user) {
      res.status(401)
      throw new Error("User Not found");
    }

    //What if the user is found in the database?
    req.user = user
    next();

  } catch (error) {
    res.status(401)
      throw new Error("Not authorized, please login");
  }
});

module.exports = protect
