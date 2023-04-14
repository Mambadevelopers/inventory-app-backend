const express = require("express");
const protect = require("../middleWare/authMiddleware");
const { createProduct, getProducts, getProduct, deleteProduct, updateProduct } = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");
const router = express.Router();


router.post("/", protect, upload.single("image"), createProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.get("/", protect, getProducts );
router.get("/:id", protect, getProduct );
router.delete("/:id", protect, deleteProduct );


//export the router so that we can use it in our server
module.exports = router;
