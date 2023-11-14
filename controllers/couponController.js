const Coupon = require('../models/couponModel')
const Cart = require('../models/cartModel')
const { log } = require('npmlog')


const loadCoupon = async( req,res ) => {
    try {
     const coupon = await Coupon.find({ status:0 })
        res.render('couponManagement',{coupon})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCoupon = async(req,res) => {
    try{
        res.render('addCoupon')
    }
    catch(error){
        console.log(error.message)
    }
}

const addCoupon = async (req, res) => {
    try {

        const data = new Coupon({
            couponname: req.body.couponname,
            couponcode: req.body.couponcode,
            discountamount: req.body.discountamount,
            activationdate: req.body.activationdate,
            expirydate: req.body.expirydate,
            criteriaamount: req.body.criteriaamount,
            userslimit: req.body.userslimit,
            description: req.body.description

        })
        await data.save()
        console.log(data);
        res.redirect('/admin/loadCoupon')

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadCoupon,
    loadAddCoupon,
    addCoupon
}