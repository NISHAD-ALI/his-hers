const Coupon = require('../models/couponModel')
const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const { log } = require('npmlog')

// +++++++++++++++++++++++++++++ RENDER COUPON MANAGEMENT +++++++++++++++++++++++++++++++++
const loadCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.find({})
        res.render('couponManagement', { coupon })
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
}
// +++++++++++++++++++++++++++++ RENDER ADD COUPON +++++++++++++++++++++++++++++++++
const loadAddCoupon = async (req, res) => {
    try {
        res.render('addCoupon')
    }
    catch (error) {
        console.log(error.message)
        res.render('500')
    }
}
// +++++++++++++++++++++++++++++  ADD COUPON TO DB +++++++++++++++++++++++++++++++++
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
        res.render('500')
    }
}
// +++++++++++++++++++++++++++++ RENDER EDIT COUPON +++++++++++++++++++++++++++++++++
const loadEditCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ _id: req.query.id })

        res.render('editCoupon', { coupon })
    }
    catch (error) {
        console.log(error.message)
        res.render('500')
    }
}
// +++++++++++++++++++++++++++++ EDIT COUPON TO DB +++++++++++++++++++++++++++++++++
const editCoupon = async (req, res) => {
    try {
        const id = req.query.id

        await Coupon.updateOne({ _id: id }, {
            $set: {
                couponname: req.body.couponname,
                couponcode: req.body.couponcode,
                discountamount: req.body.discountamount,
                activationdate: req.body.activationdate,
                expirydate: req.body.expirydate,
                criteriaamount: req.body.criteriaamount,
                userslimit: req.body.userslimit,
                description: req.body.description
            }
        })
        res.redirect('/admin/loadCoupon')

    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
}

// +++++++++++++++++++++++++++++ DELETE COUPON FROM DB +++++++++++++++++++++++++++++++++
const deletecoupon = async (req, res) => {
    try {

        await Coupon.deleteOne({ _id: req.query.id })
        res.redirect('/admin/loadCoupon');

    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
}

// +++++++++++++++++++++++++++++ CALCULATE DISCOUNT ON COUPON +++++++++++++++++++++++++++++++++
const calculateDiscountedTotal = (total, discountAmount) => {
    // Your discount calculation logic here
    return total - discountAmount;
};

// +++++++++++++++++++++++++++++ APPLY COUPON +++++++++++++++++++++++++++++++++
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user_id;

        const currentDate = new Date();

        const coupon = await Coupon.findOne({ couponcode: couponCode });
        console.log(coupon);
        if (!coupon) {
            return res.json({ success: false, message: 'Invalid coupon code' });
        }
        console.log("1");
        if (!userId) {
            return res.json({ success: false, message: 'User not found' });
        }
        console.log("2");
        // Check activation date
        if (currentDate < coupon.activationdate) {
            return res.json({ success: false, message: 'Coupon is not yet active' });
        }
        console.log("3");
        // Check expiry date
        if (currentDate > coupon.expirydate) {
            return res.json({ success: false, message: 'Coupon has expired' });
        }
        console.log("4");
        // criteria of amount
        const cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            return res.json({ success: false, message: 'User cart not found' });
        }
        console.log("15");
        if (cart.total < coupon.criteriaamount) {
            return res.json({ success: false, message: 'Order total does not meet coupon criteria' });
        }
        console.log("6");
        // Update the cart with the discounted total
        const discountedTotal = calculateDiscountedTotal(cart.total, coupon.discountamount);
        await Cart.updateOne({ userid: userId }, { $set: { total: discountedTotal } });

        // Send the updated total back to the client
        return res.status(200).json({
            success: true, message: 'Coupon applied successfully!', discountedTotal,
            couponDiscountAmount: coupon.discountamount,
        });
    } catch (error) {
        console.error(error.message);
        res.render('500')
    }
};

module.exports = {
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    editCoupon,
    loadEditCoupon,
    deletecoupon,
    applyCoupon
}