const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const { fileSizeFormatter } = require('../utils/fileUpload');
const cloudinary = require('cloudinary').v2;



const createProduct = asyncHandler(async(req, res) => {
  const {name, sku, category, quantity, price, description} = req.body;

  //Validation
  if(!name || !category || !quantity || !price || !description) {
    res.status(400)
    throw new Error("Please fill in all fields");
  }

  //Manage image upload
  let fileData = {}
  if(req.file) {
    //SAVE IMAGE TO CLOUDINARY
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Mamba App", resource_type: "image"})
    } catch (error) {
      res.status(500)
      throw new Error("Image could not be uploaded");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    }
  }


  //Create a product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product)

});

//Get all Products from the DB

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({user: req.user.id}).sort("-createdAt");
  res.status(200).json(products);
});


//Get single product from the DB
const getProduct = asyncHandler(async(req, res) => {
  const product = await Product.findById(req.params.id);
  //If products doesn't exist
  if(!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  //We want to make sure the user is authorized to access the product(Match product to its user)
  if(product.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error("User not authorized");
  }

  res.status(200).json(product);
});


//Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "User not authorized to delete product" });
    }

    await product.deleteOne();
    res.status(200).json({message: "Product deleted successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



// Update Product on DB
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // if product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user on DB
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized to view product");
  }

  // Handle Image upload to DB
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Mamba App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      //image: fileData || product.image, This line of code didn't save the previous image already uploaded while uploading a file.
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});


module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct
}
