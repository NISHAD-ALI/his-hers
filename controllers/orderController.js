const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel');
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel');
const { log } = require('npmlog');

// ++++++++++++++++RENDER CHECKOUT++++++++++++++++++

const loadCheckout = async (req, res) => {
  try {
    let accountDetails
    let userName
    let UserAddress;
    let addressId = req.query.id
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      const addresses = await Address.find({ User: req.session.user_id });
      console.log(addresses);

      if (user) {
        userName = user.name;
        accountDetails = user;
        UserAddress = addresses;

      }
    }

    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userid: userId }).populate("products.productId");

    // total of single product
    const datatotal = cartData.products.map((products) => {
      return products.totalPrice * products.count;
    });
    console.log(datatotal);

    // grand total
    let totalamount = 0;
    if (datatotal.length > 0) {
      totalamount = datatotal.reduce((x, y) => {
        return x + y;
      });
    }
    console.log(totalamount);

    res.render('checkout', { accountDetails, UserAddress, userName, totalamount, datatotal, cartData: cartData });

  } catch (error) {
    console.log(error.message);
  }
}


// ++++++++++++++++PLACE ORDER++++++++++++++++++
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.selectedAddress;
    const paymentMethod = req.body['payment-method'];
    const status = paymentMethod === "cod" ? "placed" : "pending";
    const statusLevel = status === "placed" ? 1 : 0;


    const user = await User.findOne({ _id: userId });
    const address = await Address.findOne({ _id: addressId });

    if (!user || !address) {

      console.log('User or address not found');
      return res.status(400).json({ error: 'User or address not found' });
    }


    const cartData = await Cart.findOne({ userid: userId })
    console.log('cartDta>');
    console.log(cartData);
    const orderProducts = [];

    // Loop through the products in the cart and add them to the orderProducts array
    for (const cartProduct of cartData.products) {
      orderProducts.push({
        productId: cartProduct.productId,

        quantity: cartProduct.count,

      });
    }
    // Calculate the total amount from the cart
    let totalAmount = 0;
    cartData.products.forEach((product) => {
      totalAmount += product.totalPrice * product.count;
    });

    // Create a new order document
    const newOrder = new Order({
      userid: userId,
      deliveryDetails: {
        address: address,
      },
      products: orderProducts,
      purchaseDate: new Date(),
      totalAmount: totalAmount,
      status: status,
      paymentMethod: paymentMethod,
      paymentStatus: 'paid',

      shippingFee: '0',
    });
    console.log(newOrder);
    // Save the order to the database
    const savedOrder = await newOrder.save();

    // decresing quantity

    for (const orderProduct of orderProducts) {
      const productnew = await product.findOne({ _id: orderProduct.productId });
      console.log(productnew.quantity);
      if (productnew) {
        // Decrement the product quantity
        const newQuantity = productnew.quantity - orderProduct.quantity;
        const productne = await product.updateOne({ _id: orderProduct.productId }, { $set: { quantity: newQuantity } });
        console.log(productne);
      }
    }




    // Clear the user's cart
    await Cart.updateOne({ userid: userId }, { $set: { products: [] } });


    const successPageURL = '/order-success';

    res.json({ successPage: successPageURL });
    console.log('2');
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// ++++++++++++++++ORDER PLACED PAGE++++++++++++++++++


const orderSuccess = async (req, res) => {
  try {
    console.log('3'); 
    res.render('orderSuccess')
  } catch (error) {
    console.log(error.message)
  }
}
// ++++++++++++++++ORDER CANCEL PAGE++++++++++++++++++

const orderCancel = async (req, res) => {
  try {
    console.log('3');
    res.render('orderCancel')
  } catch (error) {
    console.log(error.message)
  }
}

// ++++++++++++++++ORDER CANCEL ++++++++++++++++++
const cancelOrder = async (req, res) => {
  try {
    const type = req.body.type;
    const id = req.body.id;

    if (type === 'order') {
      // Handle order cancellation
      const order = await Order.findOne({ _id: id });

      if (order) {
        order.status = 'cancelled';
        await order.save();
        res.json({ success: true });

      }

      else {
        res.status(400).json({ error: 'Order not found' });
      }
    } else if (type === 'product') {
      // Handle product cancellation
      const product = await product.findOne({ _id: id });
      if (product) {

        product.orderStatus = 'cancelled';
        await product.save();
        res.json({ success: true });

      } else {
        res.status(400).json({ error: 'Product not found' });
      }
    } else {
      res.status(400).json({ error: 'Invalid request type' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
// ++++++++++++++++ORDER RETURN PAGE++++++++++++++++++
const returnOrder = async (req,res) => {
  try {
    res.render('orderReturn')
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  loadCheckout,
  placeOrder,
  orderSuccess,
  orderCancel,
  cancelOrder,
  returnOrder
}