const admin = require('../models/adminModel')
const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const multer = require("../middleware/multer");
const Offers = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');
const sharp = require('sharp');
let path = require('path')
const { log } = require('async');


let userName
// ++++++++++++++++++++++++++++++++++++++RENDER PRODUCT MANAGEMENT++++++++++++++++++++++++++++++++++++++++++++++

const loadProduct = async (req, res) => {
  try {
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      console.log(user);
      if (user) {
        userName = user.name;
        const productData = await product.find({});
        res.render("productManagement", { products: productData, userName });
      } else {
        const productData = await product.find({});
        res.render("productManagement", { products: productData });
      }
    }
    else {
      const productData = await product.find({});
      res.render("productManagement", { products: productData });
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ADD NEW PRODUCT LOAD ++++++++++++++++++++++++++++++++++++++++++++++
``
const loadNewProduct = async (req, res) => {
  try {
    const categories = await category.find({ blocked: 0 });
    res.render("addProduct", { categories });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ ADD FULL DETAILS OF PRODUCTS AND SAVE TO DB ++++++++++++++++++++++++++++++++++++++++++++++

const newproduct = async (req, res) => {
  try {
    multer.productImagesUpload(req, res, async (uploadError) => {
      if (uploadError) {
        console.error(uploadError);
        return res.status(500).send('File upload error');
      }

      try {
        const productData = {
          productname: req.body.proName,
          quantity: req.body.qty,
          price: req.body.price,
          category: req.body.category,
          description: req.body.description,
          additionalInfo: req.body.additionalInfo,
          size: req.body.options,
        };

        productData.image = req.files.map((file) => file.filename);
        console.log(productData.image);
        const item = new product(productData);
        await item.save();
        for (let i = 0; i < req.files.length; i++) {
          const filePath = path.join(__dirname, '../public/products/images/', req.files[i].filename);
          await sharp(filePath).resize(800, 800).toFile("public/products/images/upload/" + req.files[i].filename);


        };



        if (item) {
          res.redirect('/admin/productManagement');
        }
        else {
          console.log("Failed upload");
        }




      } catch (error) {
        console.log(error.message);

      }
    });
  } catch (error) {
    console.error(error);
    res.render('500')
  }
};


// ++++++++++++++++++++++++++++++++++++++ BLOCK PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const blockPro = async (req, res) => {
  try {
    const blockedPro = await product.findOne({ _id: req.query.id });
    if (!blockedPro) {
      return res.status(404).send('product not found');
    }

    // Toggle the is_block status
    blockedPro.blocked = blockedPro.blocked === 0 ? 1 : 0;
    await blockedPro.save();

    res.redirect('/admin/productManagement');
  } catch (error) {
    console.error(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++LOAD EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const loadEditProduct = async (req, res) => {
  try {
    const catData = await category.find({ blocked: 0 });
    const editProducts = await product.findOne({ _id: req.query.id });
    res.render("editProduct", { currentData: editProducts, catData, image: editProducts.image });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++


const editProduct = async (req, res) => {
  try {
    const editid = req.query.id;
    console.log(editid);

    await product.updateOne(
      { _id: editid },
      {
        $set: {
          productname: req.body.proName,
          quantity: req.body.qty,
          price: req.body.price,
          category: req.body.category,
          description: req.body.description,
          additionalInfo: req.body.additionalInfo,
          size: req.body.options,
        },
        $push: {
          image: { $each: req.files.map((file) => file.filename) }
        },
      }
    );



    res.redirect('/admin/productManagement');
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ DELETE IMAGE OF PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const deleteImage = async (req, res) => {
  try {
    console.log('334');

    const productid = req.body.productid
    const imageid = req.body.imageid
    const productimage = await product.updateOne({ _id: productid }, { $pull: { image: imageid } })
    if (productimage) {
      res.json({ result: true })
    }
    else {
      res.json({ result: false })
    }
    console.log(productimage);
  } catch (error) {
    console.error('Error deleting image:', error);
    res.render('500')
  }
}




// ++++++++++++++++++++++++++++++++++++++ DELETE PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const deleteProduct = async (req, res) => {
  try {


    const currentData = await product.findOne({ _id: req.query.id });

    if (!currentData) {
      return res.status(404).send('Product not found');
    }
    await product.deleteOne({ _id: req.query.id });
    res.redirect('/admin/productManagement');
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ LOAD LIST OF PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++

const loadProductList = async (req, res) => {
  try {
    let userName = '';
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      console.log(user);
      if (user) {
        userName = user.name;
      }
    }
    const availableCategories = await category.find();
    const discount = await Offers.find({ is_block: 0 })
    const discountcategory = await CategoryOffer.find({ is_block: 0 });
    const productData = await product.find({ blocked: 0 });
    const renderData = { products: productData, discPrice: discount, discCat: discountcategory, availableCategories };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('productList', renderData);
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++++++++ LOAD INDIVIDUAL PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++


const loadUserProduct = async (req, res) => {
  let userName = '';

  if (req.session.user_id) {
    const user = await User.findOne({ _id: req.session.user_id });

    if (user) {
      userName = user.name;
    }
  }

  try {
    const viewProduct = await product.findOne({ _id: req.query.id });

    const discount = await Offers.find({ is_block: 0 })
    const discountcategory = await CategoryOffer.find({ is_block: 0 });



    if (viewProduct) {
      const products = await product.find({ blocked: 0 });
      const renderData = { viewProduct, productId: req.query.id, discPrice: discount, discCat: discountcategory };

      if (userName) {
        renderData.userName = userName;
      }

      res.render("productView", renderData);
    } else {
      res.status(404).render("404");
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ SEARCH PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
const searchProducts = async (req, res) => {
  try {
    const data = req.query.searchdata;
    console.log(data);
    const discount = await Offers.find({ is_block: 0 });
    const productData = await product.find({
      productname: { $regex: new RegExp(data, "i") },
    });
    console.log(productData);
    const renderData = { products: productData, discPrice: discount };
    res.render('productList', renderData);
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};


// ++++++++++++++++++++++++++++++++++++++ LOAD SORTED PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++

const sortProducts = async (req, res) => {
  try {
    let sortOption = req.query.sortby;
    console.log('Sort Option:', sortOption);

    let sortCriteria = {};

    switch (sortOption) {
      case 'priceLowToHigh':
        sortCriteria = { price: 1 };
        break;
      case 'priceHighToLow':
        sortCriteria = { price: -1 };
        break;
      default:
        sortCriteria = { price: 1 };
        break;
    }

    console.log('Sort Criteria:', sortCriteria);
    const availableCategories = await category.find();
    const discountProducts = await Offers.find({ is_block: 0 });
    const discountcategory = await CategoryOffer.find({ is_block: 0 });
    const sortedProducts = await product.find().sort(sortCriteria);

    const renderData = { products: sortedProducts, discPrice: discount, availableCategories };
    console.log(sortedProducts)
    res.render('productList', renderData);

  } catch (error) {
    console.error(error);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD FILTER PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
const filteredProducts = async (req, res) => {
  try {

    const availableCategories = await category.find();

    const selectedCategories = req.body.categories;


    const filteredProducts = await product.find({
      category: selectedCategories,

    });
    const discount = await Offers.find({ is_block: 0 });
    const renderData = { products: filteredProducts, discPrice: discount, availableCategories };


    res.render('productList', renderData);
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD MEN CATEGORY PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
const menCat = async (req, res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }
    const availableCategories = await category.find();
    const discount = await Offers.find({ is_block: 0 });


    const productData = await product.find({
      blocked: 0,
      category: { $regex: /^men/, $options: 'i' }
    });

    const renderData = { products: productData, discPrice: discount, availableCategories };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('menCategory', renderData);
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD WOMEN CATEGORY PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
const womenCat = async (req, res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }
    const availableCategories = await category.find();
    const discount = await Offers.find({ is_block: 0 });

    const productData = await product.find({
      blocked: 0,
      category: { $regex: 'women', $options: 'i' }
    });

    const renderData = { products: productData, discPrice: discount, availableCategories };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('womenCategory', renderData);
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD FRESH ARRIVAL PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
const loadfreshArrivals = async (req, res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }
    const availableCategories = await category.find();
    const discount = await Offers.find({ is_block: 0 });


    const productData = await product.find({ blocked: 0 }).sort({ _id: -1 }).limit(8)
    const renderData = { products: productData, discPrice: discount, availableCategories };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('freshArrivals', renderData);
  } catch (error) {
    console.log(error.message)
    res.render('500')

  }
}

module.exports = {
  loadProduct,
  loadNewProduct,
  newproduct,
  blockPro,
  loadEditProduct,
  editProduct,
  deleteProduct,
  loadProductList,
  loadUserProduct,
  searchProducts,
  sortProducts,
  filteredProducts,
  menCat,
  womenCat,
  loadfreshArrivals,
  deleteImage
}