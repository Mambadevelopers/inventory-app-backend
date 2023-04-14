const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const contactRoute = require("./routes/contactRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");


const app = express();

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:3000", "https://inventory-app-frontend.vercel.app"],
  credentials: true,
}));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//Routes middleware
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactus", contactRoute);




//ROUTES
app.get("/", (req, res) => {
  res.send("Home Page")
})

const PORT = process.env.PORT || 5000;


//ERROR MIDDLEWARE(the error handler must come above the server in order to be accessible in all your app)
app.use(errorHandler);



//Connect to mongodb and start the server
mongoose
.connect(process.env.MONGO_URI)
.then(() => {
  app.listen(PORT, () => {
    console.log('====================================');
    console.log(`Server Running on port ${PORT}`);
    console.log('====================================');
  })
})
.catch((err) => console.log(err))
