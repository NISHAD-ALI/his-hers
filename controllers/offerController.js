const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Category = require("../models/categoryModel");
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Offers = require('../models/offerModel');
const product = require('../models/productModel');

const loadOffers = async (req, res) => {
    try {
        const offerDB = await Offers.find({ });
    
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
        const newOffer = new Offers({
            product: req.body.product,
            percentage: req.body.percentage,
            expiryDate: req.body.EndingDate,
        });
        await newOffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error.message);
    }
};




module.exports = {
    loadOffers,
    loadAddOffer,
    addOffers
}