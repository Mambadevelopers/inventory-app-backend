const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");




const generateToken = (id) => {
return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"});
};



//Register User section

const registerUser = asyncHandler( async (req, res) => {
  const {name, email, password } = req.body
  

  //Validation(This is just for users who bypass the first requirement, we can catch them from this validation method)
  if(!name || !email || !password) {
    res.status(400)
    throw new Error("Please fill in all required fields");
  }

  //We want to make sure the users also have upto 6 password minimum
  if(password.length < 6) {
    res.status(400)
    throw new Error("Password must be upto 6 characters")
  }

  //Check if user email already exist
  const userExists = await User.findOne({email})

  if(userExists) {
    res.status(400)
    throw new Error("Email has already been registered")
  }


  //What if the does not exist? now we can create a new user in the database

  //Create a user
  const user = await User.create({
    //note that if we are to specify what the user is suppose to provide the property name and value is the same, we can simply write the in this form
    //name: name,
    //email:email,
    //password: password,  (this above is the same as the code below since the have the same value as the property name)
    name,
    email,
    password,
  });

    //GENERATE TOKEN FOR USER
    const token = generateToken(user._id);

    //SEND HTTP-only COOKIE(sending our cookies to the front end of the browser)
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //I DAY
      sameSite: "none",
      secure: true,
    });



      if (user) {
      const {_id, name, email, photo, phone, bio} = user
      res.status(201).json({
        _id,
        name, 
        email, 
        photo, 
        phone, 
        bio,
        token,
      });
      
    } else {
      res.status(400)
      throw new Error("Invalid user data");
    }
  

});


//Login a user section

const loginUser = asyncHandler(async(req, res) => {
  
  const {email, password} = req.body

  //Validate the request
  if (!email || !password) {
    res.status(400)
    throw new Error("Please add email and password");
  }

  //Check if user exist in DB
  const user = await User.findOne({email});

  if (!user) {
    res.status(400)
    throw new Error("User not found, please sign up");
  };

  //User exist, cool. Now check if password exist
  const passwordIsCorrect =  await bcrypt.compare(password, user.password);


    //GENERATE TOKEN FOR USER
    const token = generateToken(user._id);

    //SEND HTTP-only COOKIE(sending our cookies to the front end of the browser)
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //I DAY
      sameSite: "none",
      secure: true,
    });

  //We are going to get the user information now
  if(user && passwordIsCorrect) {
    const {_id, name, email, photo, phone, bio} = user
      res.status(200).json({
        _id,
        name, 
        email, 
        photo, 
        phone, 
        bio,
        token,
      });
      
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
})
  
      //LOGOUT THE USER FUNCTION
const logout = asyncHandler( async(req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), //Expire the cookie right away after user hit the logout button
    sameSite: "none",
    secure: true,
  });

  return res.status(200).json({message: "Successfully Logged Out"});
});


//Get user data(user profile);
const getUser = asyncHandler(async(req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    const {_id, name, email, photo, phone, bio} = user;
    res.status(200).json({
      _id,
      name, 
      email, 
      photo, 
      phone, 
      bio,
    });
    
  } else {
    res.status(400)
    throw new Error("User not found");
  }
});

//GET LOGIN STATUS FUNCTION
const loginStatus = asyncHandler( async(req, res) => {
  const token = req.cookies.token;
  if(!token) {
    return res.json(false);
  }

  //Verified token?
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if(verified) {
    return res.json(true);
  }

  return res.json(false);
});


//Update user information section
    const updateUser = asyncHandler(async(req, res) => {
      const user = await User.findById(req.user._id);

      if (user) {
        const {name, email, photo, phone, bio} = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        const updatedUser = await user.save();
        res.status(200).json({
          _id: updatedUser._id,
          name: updatedUser.name, 
          email: updatedUser.email, 
          photo: updatedUser.photo, 
          phone: updatedUser.phone, 
          bio: updatedUser.bio,
        });
      } else {
        res.status(404)
        throw new Error("User not found");
      }
    });


    //CHANGE PASSWORD OF USERS
    const changePassword = asyncHandler(async(req, res) => {
      const user = await User.findById(req.user._id);
      const {oldPassword, password} = req.body;


      if(!user) {
        res.status(400)
        throw new Error("User not found, please signup");
      }


      //Validate
      if(!oldPassword || !password) {
        res.status(400)
        throw new Error("Please add old & new password");
      }

      //Check if password matches password in the DB
      const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

      //Save new password
      if(user && passwordIsCorrect) {
        user.password = password
        await user.save();
        res.status(200).send("Password changed successful")
      } else {
        res.status(400);
        throw new Error("Old password is incorrect");
      }
    });


    //FORGOT PASSWORD SECTION
  const forgotPassword = asyncHandler(async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email});

    if(!user) {
      res.status(404);
      throw new Error("User does not exist");
    };

    //Delete token if it exist in the database(this section works when a user request to reset their password but couldnt reset it within 30 minutes, so we want the users token to be reset again because the first one has elapsed)
    let token = await Token.findOne({userId: user._id})
    if(token) {
      await token.deleteOne();
    };

    //Create reset token for user who wants to reset their password
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log('====================================');
    console.log(resetToken);
    console.log('====================================');
    
    //Hash token before saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    //Save token to mongoDB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000) //30 minutes reset timeline
    }).save();

    //Construct Reset url
    const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`

    //Reset Email
    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to reset your password.</p>
    <p>This reset link is valid for only 30 minutes.</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...😊</p>
    <p>Mamba Group</p>
    `;

    const subject = "Password Reset Request From Mamba Group"
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try {
      await sendEmail(subject, message, send_to, sent_from)
      res.status(200).json({success: true, message: "Reset Email Send"})
    } catch (error) {
      res.status(500)
      throw new Error("Email not sent, please try again");
    }
  });

  //Reset Password
  const resetPassword = asyncHandler(async (req, res) => {
    const {password} = req.body;
    const {resetToken} = req.params;

     //Hash token , then compare the token with the one in DB
    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    //Find token in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: {$gt: Date.now()}
    });

    if(!userToken) {
      res.status(404)
      throw new Error("Invalid or Expired Token");
    }

   //Find user
    const user = await User.findOne({_id: userToken.userId})
    user.password = password;

    await user.save();
    res.status(200).json({
      message: "Password Reset Successful, Please Login."
    });
  });




module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
}
