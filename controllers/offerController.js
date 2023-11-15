const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel');
const Order = require('../models/orderModel');


const loadOffers = async (req , res) => {
    try {
        res.render('offerManagement')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadOffers,
}