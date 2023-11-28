const admin = require('../models/adminModel')
const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const multer = require("../middleware/multer");
const Offers = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');
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
    res.status(404).render("404");
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

        const item = new product(productData);

        await item.save();
        res.redirect('/admin/productManagement');
      } catch (error) {
        console.log(error.message);

      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
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
    res.status(500).send('Error blocking/unblocking product');
  }
};
// ++++++++++++++++++++++++++++++++++++++LOAD EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const loadEditProduct = async (req, res) => {
  try {
    const catData = await category.find({ blocked: 0 });
    const editProducts = await product.findOne({ _id: req.query.id });
    res.render("editProduct", { currentData: editProducts, catData });
  } catch (error) {
    console.log(error.message);
    res.status(404).render("404");
  }
};

// ++++++++++++++++++++++++++++++++++++++ EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++


const editProduct = async (req, res) => {
  try {
    const editid = req.query.id;
    console.log(editid);
    const newDetails = {
      productname: req.body.proName,
      quantity: req.body.qty,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      additionalInfo: req.body.additionalInfo,
      size: req.body.options,
    }

    const edit = await product.updateOne({ _id: editid }, newDetails)

    res.redirect('/admin/productManagement');

  } catch (error) {
    console.log(error.message);
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
    res.status(500).send('An error occurred');
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
    const discount = await Offers.find({ is_block: 0 })
    const discountcategory = await CategoryOffer.find({ is_block: 0 });
    const productData = await product.find({ blocked: 0 });
    const renderData = { products: productData, discPrice: discount ,discCat : discountcategory};

    if (userName) {
      renderData.userName = userName;
    }

    res.render('productList', renderData);
  } catch (error) {
    console.log(error.message);
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
      const renderData = { viewProduct, productId: req.query.id,discPrice: discount ,discCat : discountcategory };

      if (userName) {
        renderData.userName = userName;
      }

      res.render("productView", renderData);
    } else {
      res.status(404).render("404");
    }
  } catch (error) {
    console.log(error.message);
  }
};

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
      res.status(500).json({ error: 'Internal Server Error' });
  }
};




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

        const discountProducts = await Offers.find({ is_block: 0 });
        const discountcategory = await CategoryOffer.find({ is_block: 0 });
        const sortedProducts = await product.find().sort(sortCriteria);

        const renderData = { products: sortedProducts, discPrice: discount };
     console.log(sortedProducts)
        res.render('productList', renderData);
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  };


const filteredProducts = async (req, res) => {
  try {

    console.log(req.body);
    
      const selectedCategories = req.body.categories;
      const filteredProducts = await product.find({ category:selectedCategories  });
      const discount = await Offers.find({ is_block: 0 });
      const renderData = { products: filteredProducts, discPrice: discount };
     console.log(selectedCategories);
     
      res.render('productList', renderData);
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const menCat = async (req, res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }

    const discount = await Offers.find({ is_block: 0 });
    
  
    const productData = await product.find({
      blocked: 0,
      category: { $regex: /^men/, $options: 'i' } 
    });

    const renderData = { products: productData, discPrice: discount };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('menCategory', renderData);
  } catch (error) {
    console.log(error.message);
  }
};

const womenCat = async (req, res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }

    const discount = await Offers.find({ is_block: 0 });

    const productData = await product.find({
      blocked: 0,
      category: { $regex: 'women', $options: 'i' } 
    });

    const renderData = { products: productData, discPrice: discount };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('womenCategory', renderData);
  } catch (error) {
    console.log(error.message);
  }
};


const loadfreshArrivals = async(req,res) => {
  try {
    let userName = '';

    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
      }
    }

    const discount = await Offers.find({ is_block: 0 });
    
 
    const productData = await product.find({ blocked: 0 }).sort({ _id: -1 }).limit(8)
    const renderData = { products: productData, discPrice: discount };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('freshArrivals', renderData);
  } catch (error) {
    console.log(error.message)

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
}