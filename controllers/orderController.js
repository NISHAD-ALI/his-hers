const User = require('../models/userModel')
const product = require('../models/productModel');
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')
const { log } = require('npmlog');
const Razorpay = require('razorpay');
const crypto = require("crypto")
require('dotenv').config()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAYKEYID,
  key_secret: process.env.RAZORPAYSECRETKEY,
});
// ++++++++++++++++RENDER CHECKOUT++++++++++++++++++

const loadCheckout = async (req, res) => {
  try {
    let accountDetails
    let userName
    let UserAddress;
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      const addresses = await Address.find({ User: req.session.user_id });



      if (user) {
        userName = user.name;
        accountDetails = user;
        UserAddress = addresses;

      }
    }

    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userid: userId }).populate("products.productId");

    if (cartData) {
      console.log(cartData);
      const coupon = await Coupon.find({ status: 0 })
      const discAmount = coupon.discountamount
      const datatotal = cartData.products.map((products) => {
        return products.totalPrice * products.count;
      });
      console.log(datatotal[0]+'hee');
      await Cart.updateOne({ userid: userId },{$set:{total:datatotal[0]}})
      // grand total
      let totalamount = 0;
      if (datatotal.length > 0) {
        totalamount = datatotal.reduce((x, y) => {
          return x + y;
        });
      }
      console.log(totalamount);


      res.render('checkout', { accountDetails, UserAddress, userName, totalamount, datatotal, cartData: cartData, coupon, discAmount });
    } else {
     

      res.redirect('/')
    }

  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}


// ++++++++++++++++++++++++++++++++PLACE ORDER +++++++++++++++++++++++++++++

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.selectedAddress;
    const paymentMethod = req.body['payment-method'];
    const status = paymentMethod === 'cod' || paymentMethod === 'Wallet' ? 'placed' : 'pending';

    console.log('XP 1');

    const user = await User.findOne({ _id: userId });
    const address = await Address.findOne({ _id: addressId });

    if (!user || !address) {
      console.log('User or address not found');
      return res.status(400).json({ error: 'User or address not found' });
    }
    console.log('XP 2');
    const cartData = await Cart.findOne({ userid: userId });
    const totalAmount = cartData.total;
    const orderProducts = [];
   console.log(cartData + 'total amount')
    for (const cartProduct of cartData.products) {
      orderProducts.push({
        productId: cartProduct.productId,
        quantity: cartProduct.count,
        total: cartProduct.totalPrice
      });
    }
    console.log('XP 3');
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

    const savedOrder = await newOrder.save();

    // Function to decrease product quantities
    async function decreaseProductQuantities(orderProducts) {
      for (const orderProduct of orderProducts) {
        const productData = await product.findOne({ _id: orderProduct.productId });

        if (productData) {
          const newQuantity = productData.quantity - orderProduct.quantity;
          const qa = await product.updateOne({ _id: orderProduct.productId }, { quantity: newQuantity });
          console.log(qa);
        }
      }
    }


    console.log('XP 4');
    // Clear the user's cart
    await Cart.updateOne({ userid: userId }, { $set: { products: [] } });

    if (paymentMethod === 'Wallet') {
      const walletData = await Wallet.findOne({ userid: userId });
      const balWallet = walletData.balance;

      if (balWallet >= totalAmount) {
        const newTransaction = {
          date: new Date(),
          amount: totalAmount,
          type: 'debit',
        };

        await decreaseProductQuantities(orderProducts);
        return res.json({ success: true, orderId: savedOrder._id });
      } else {
        res.json({ error: 'Insufficient funds in wallet' });
      }
    } else if (paymentMethod === 'online') {
      const options = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: "" + savedOrder._id
      };
      console.log(options.totalAmount+'--options');
      razorpay.orders.create(options, function (err, order) {
        console.log(order+'XP 6');
        console.log('THIS IS THE ERROR --->'+err)
        return res.json({ order });
      });
      await decreaseProductQuantities(orderProducts);
      console.log('XP 7');
    } else if (paymentMethod === 'cod') {
      console.log('cod');

      await decreaseProductQuantities(orderProducts);
      await Cart.deleteOne({ userid: userId });
      return res.json({ success: true });
    } else {
      console.log('Invalid payment method');
      return res.status(400).json({ error: 'Invalid payment method' });
    }

  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};



// ++++++++++++++++ORDER PLACED PAGE++++++++++++++++++


const orderSuccess = async (req, res) => {
  try {
    const userId = req.session.user_id;


    const couponCode = req.body.couponCode;


    await Coupon.updateOne(
      { couponcode: couponCode },
      { $push: { claimedusers: userId } }
    );

    console.log('Order placed successfully');
    res.render('orderSuccess');
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++ VERIFY ONLINE PAYMENT +++++++++++++++++++++++++++++
const verifypayment = async (req, res) => {
  try {
    console.log('verifff');

    const user_id = req.session.user_id
    const paymentData = req.body
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAYSECRETKEY);
    hmac.update(paymentData.payment.razorpay_order_id + "|" + paymentData.payment.razorpay_payment_id);
    const hmacValue = hmac.digest("hex");
    if (hmacValue === paymentData.payment.razorpay_signature) {
      await Order.findByIdAndUpdate(
        { _id: paymentData.order.receipt },
        { $set: { paymentStatus: "placed", paymentId: paymentData.payment.razorpay_payment_id } }
      );

      await Cart.deleteOne({ userid: user_id })
      console.log('XP 9');
      res.json({ placed: true })
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}
// ++++++++++++++++++++++++++++++++ CANCEL ORDER PAGE +++++++++++++++++++++++++++++

const orderCancel = async (req, res) => {
  try {
    console.log('3');
    res.render('orderCancel')
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++ CANCEL ORDER +++++++++++++++++++++++++++++
const cancelOrder = async (req, res) => {
  try {
    const type = req.body.type;
    const id = req.body.id;
    const reason = "REASON FOR CANCEL :" + req.body.reason;
    if (type === 'order') {
      // Handle order cancellation
      const order = await Order.findOne({ _id: id });
      const user = order.userid
      const tAmount = order.totalAmount
      console.log(tAmount);
      const count = order.products[0].count;
      const walletData = await Wallet.findOne({ userid: user })
      const balWallet = walletData.balance
      if (order) {
        order.status = 'cancelled';
        order.notes = reason
        if (order.paymentMethod === 'online') {

          const newTransaction = {
            date: new Date(),
            amount: tAmount,
            type: 'credit',
          };




        }
        await order.save();
        for (const orderProduct of order.products) {
          const proDB = await product.findOne({ _id: orderProduct.productId });
          if (proDB) {
            proDB.quantity += count;
            await proDB.save();
          }
        }
        res.json({ success: true });

      }

      else {
        res.status(400).json({ error: 'Order not found' });
      }

    } else {
      res.status(400).json({ error: 'Invalid request type' });
    }
  } catch (error) {
    console.error(error);
    res.render('500')
  }
}
// ++++++++++++++++++++++++++++++++ RETURN ORDER PAGE +++++++++++++++++++++++++++++
const returnOrder = async (req, res) => {
  try {

    res.render('orderReturn')
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++ RETURN ORDER +++++++++++++++++++++++++++++
const orderReturnPOST = async (req, res) => {
  try {
    const type = req.body.type;
    const id = req.body.id;

    if (type === 'order') {
      // Handle order return
      const order = await Order.findOne({ _id: id });
      const count = order.products[0].count;
      const tAmount = order.totalAmount
      const user = order.userid
      const walletData = await Wallet.findOne({ userid: user })
      const balWallet = walletData.balance
      if (order) {
        order.status = 'Returned';
        await order.save();
        for (const orderProduct of order.products) {
          const proDB = await product.findOne({ _id: orderProduct.productId });
          if (proDB) {
            proDB.quantity += count;
            await proDB.save();
          }
        }
        const newTransaction = {
          date: new Date(),
          amount: tAmount,
          type: 'credit',
        };


        res.json({ success: true });

      }

      else {
        res.status(400).json({ error: 'Order not found' });
      }

    } else {
      res.status(400).json({ error: 'Invalid request type' });
    }
  } catch (error) {
    console.error(error);
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++ ORDER INVOICE DOWNLOAD +++++++++++++++++++++++++++++

const orderInvoice = async (req, res) => {
  try {
    const proid = req.params.id;
    const user = req.session.user_id;


    const userData = await User.findOne({ _id: user });

    const orderData = await Order.findOne({ userid: user, "products.productId": proid }).populate("products.productId");


    // console.log(orderData);
    const date = new Date()

    data = {
      order: orderData,
      user: userData,
      date

    };

    res.render('invoice', { order: orderData, user: userData, date })

  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};




module.exports = {
  loadCheckout,
  placeOrder,
  orderSuccess,
  orderCancel,
  cancelOrder,
  returnOrder,
  orderReturnPOST,
  verifypayment,
  orderInvoice,
  // viewrazor,

}