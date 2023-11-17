const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Category = require("../models/categoryModel");
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Offers = require('../models/offerModel');
const product = require('../models/productModel');

const loadOffers = async (req, res) => {
    try {
        const offerDB = await Offers.find({ }).lean();
       
        res.render('offerManagement', { offerDB });
    } catch (error) {
        console.log(error.message);
        res.render('offerManagement', { offerDB: [] });
    }
};


const loadAddOffer = async (req, res) => {
    try {
        const product = await Product.find({ blocked: 0 });
        res.render('addOffer', { product });
    } catch (error) {
        console.log(error.message);
    }
}


const addOffers = async (req, res) => {
    try {
        const productData = await Product.findOne({ productname: req.body.product });
       
        
        console.log(productData);
        if (!productData) {
            console.log('Product not found');
            return res.redirect('/admin/offers');
        }
        const percent = req.body.percentage
        const newOffer = new Offers({
            product: productData._id,
            productname:req.body.product,
            percentage: percent,
            expiryDate: req.body.EndingDate,
        });

        await newOffer.save();
        const productDB =  await product.findOne({ _id : productData._id })

        console.log(productDB);
        const offerPrice = Math.floor((productDB.price * percent) / 100);
       const updateProductPrice = await product.updateOne({ _id : productData._id },{ $set:{ discountPrice : offerPrice}})
       console.log(updateProductPrice);

        console.log('Offer added successfully');
 
        
        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/offers');
    }
};
const blockOff = async (req, res) => {
    try {
      const blockOffer = await Offers.findOne({ _id: req.query.id });
      if (!blockOffer) {
        return res.status(404).send('offer not found');
      }
  
      // Toggle the is_block status
      blockOffer.is_block = blockOffer.is_block === 0 ? 1 : 0;
      await blockOffer.save();
  
      res.redirect('/admin/offers');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Error blocking/unblocking offer');
    }
  };
  // const deleteOffer = async (req, res) => {
  //   try {
     
  //     const currentData = await Offers.findOne({ _id: req.query.id });
  
  //     if (!currentData) {
  //       return res.status(404).send('Offers not found');
  //     }
  //     await Offers.deleteOne({ _id: req.query.id });
  //     const productDB = await Product.findOne({ _id: currentData.product });
      
  //       if (productDB) {
  //          console.log('kk');
  //          productDB.discountPrice = null;
  //           await productDB.save();
  //       }
  //     res.redirect('/admin/offers');
  //   } catch (error) {
  //     console.log(error.message);
  //     res.status(500).send('An error occurred');
  //   }
  // };
  const deleteOffer = async (req, res) => {
    try {
        const currentData = await Offers.findOne({ _id: req.query.id });

        if (!currentData) {
            return res.status(404).send('Offers not found');
        }

        // Check if the offer is expired
        if (currentData.expiryDate < new Date()) {
            console.log('Offer is expired');
        } else {
            // If the offer is not expired, update the product's discountPrice
            const productDB = await Product.findOne({ _id: currentData.product });

            if (productDB) {
                console.log('Offer is not expired');
                // Set the discountPrice to null
                productDB.discountPrice = null;
                await productDB.save();
            }
        }

        // Delete the offer
        await Offers.deleteOne({ _id: req.query.id });

        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred');
    }
};

module.exports = {
    loadOffers,
    loadAddOffer,
    addOffers,
    blockOff,
    deleteOffer
    
}