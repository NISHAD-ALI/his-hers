const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel');
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel');
const { log } = require('npmlog');
const Razorpay = require('razorpay');
const crypto = require("crypto")
require('dotenv').config()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAYKEYID,
  key_secret: process.env.RAZORPAYSECRETKEY,
});
console.log();
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
    const updatedCart = await Cart.findOneAndUpdate(
      { userid: userId },
      { $set: { total: totalamount } },
      { new: true }
    );
    console.log('CartTotal' + updatedCart);

    res.render('checkout', { accountDetails, UserAddress, userName, totalamount, datatotal, cartData: cartData });

  } catch (error) {
    console.log(error.message);
  }
}


// ++++++++++++++++PLACE ORDER++++++++++++++++++
// const placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const addressId = req.body.selectedAddress;
//     const paymentMethod = req.body['payment-method'];
//     const status = paymentMethod === "cod" ? "placed" : "pending";
//     const statusLevel = status === "placed" ? 1 : 0;


//     const user = await User.findOne({ _id: userId });
//     const address = await Address.findOne({ _id: addressId });

//     if (!user || !address) {

//       console.log('User or address not found');
//       return res.status(400).json({ error: 'User or address not found' });
//     }


//     const cartData = await Cart.findOne({ userid: userId })
//     console.log('cartDta>');
//     console.log(cartData);
//     const orderProducts = [];

//     // Loop through the products in the cart and add them to the orderProducts array
//     for (const cartProduct of cartData.products) {
//       orderProducts.push({
//         productId: cartProduct.productId,

//         quantity: cartProduct.count,

//       });
//     }
//     // Calculate the total amount from the cart
//     let totalAmount = 0;
//     cartData.products.forEach((product) => {
//       totalAmount += product.totalPrice * product.count;
//     });

//     // Create a new order document
//     const newOrder = new Order({
//       userid: userId,
//       deliveryDetails: {
//         address: address,
//       },
//       products: orderProducts,
//       purchaseDate: new Date(),
//       totalAmount: totalAmount,
//       status: status,
//       paymentMethod: paymentMethod,
//       paymentStatus: 'paid',

//       shippingFee: '0',
//     });
//     console.log(newOrder);
//     // Save the order to the database
//     const savedOrder = await newOrder.save();

//     // decresing quantity

//     for (const orderProduct of orderProducts) {
//       const productnew = await product.findOne({ _id: orderProduct.productId });
//       console.log(productnew.quantity);
//       if (productnew) {
//         // Decrement the product quantity
//         const newQuantity = productnew.quantity - orderProduct.quantity;
//         const productne = await product.updateOne({ _id: orderProduct.productId }, { $set: { quantity: newQuantity } });
//         console.log(productne);
//       }
//     }




//     // Clear the user's cart
//     await Cart.updateOne({ userid: userId }, { $set: { products: [] } });


//     const successPageURL = '/order-success';

//     res.json({ successPage: successPageURL });
//     console.log('2');
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }

// };
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.body.selectedAddress;
    const paymentMethod = req.body['payment-method'];
    const status = paymentMethod === 'cod' ? 'placed' : 'pending';
    const statusLevel = status === 'placed' ? 1 : 0;
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

    for (const cartProduct of cartData.products) {
      orderProducts.push({
        productId: cartProduct.productId,
        quantity: cartProduct.count,
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
          await product.updateOne({ _id: orderProduct.productId }, { quantity: newQuantity });
        }
      }
    }
    console.log('XP 4');
    // Clear the user's cart
    await Cart.updateOne({ userid: userId }, { $set: { products: [] } });
    const successPageURL = '/order-success';

    if (paymentMethod === 'wallet') {
      const walletBalance = user.wallet;

      if (walletBalance >= totalAmount) {
        // Handle payment using wallet balance
        const result = await User.findOneAndUpdate(
          { _id: userId },
          {
            $inc: { wallet: -totalAmount },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: totalAmount,
                reason: 'Purchased Amount Debited.',
              },
            },
          },
          { new: true }
        );
        console.log('XP 5');
        if (result) {
          // Decrease product quantities, clear the cart, and update the order
          await decreaseProductQuantities(orderProducts);

          if (req.session.code) {
            const coupon = await Coupon.findOne({ couponCode: req.session.code });

            if (coupon) {
              await Order.updateOne({ _id: savedOrder._id }, { discount: coupon.discountAmount });
            }
          }

          return res.json({ success: true, orderid: savedOrder._id });
        }
      } else {
        return res.json({ walletFailed: true });
      }
    } else if (paymentMethod === 'online') {
      const options = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: ""+savedOrder._id
      };
      console.log('XP 6');
      razorpay.orders.create(options, function (err, order) {
  
        return res.json({ order });
       });
      
       console.log('XP 7');
      }else if (paymentMethod === 'cod') {
      console.log('cod');
      
      await decreaseProductQuantities(orderProducts);
      await Cart.deleteOne({ userid: userId });
      return res.json({ success : true });
    } else {
      console.log('Invalid payment method');
      return res.status(400).json({ error: 'Invalid payment method' });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: 'Internal server error' });
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
// const verifypayment = async (req, res) => {
//   try {
//     const user_id =  req.session.user_id
//     const paymentData = req.body
//     const cartData = await Cart.findOne({ userid: user_id })
//     console.log(cartData+"kk");
// console.log("HHHJ"+paymentData);
//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAYSECRETKEY);
//     hmac.update(paymentData.payment.razorpay_order_id + "|" + paymentData.payment.razorpay_payment_id);
//     const hmacValue = hmac.digest("hex");

//     if (hmacValue == paymentData.payment.razorpay_signature) {
//       let data = cartData.items

//       for (let i = 0; i < data.length; i++) {
//         let products = data[i].productid
//         let count = data[i].count
//         console.log(product);

//         await product.updateOne({ _id: products }, { $inc: { quantity: -count } })
//       }

//       await Order.findByIdAndUpdate(
//         { _id: paymentData.order.receipt },
//         { $set: { paymentStatus: "placed", paymentId: paymentData.payment.razorpay_payment_id } }
//       );

//       await Cart.deleteOne({ userid: user_id })
//       res.json({ placed: true })
//     }



//   } catch (error) {
//     console.log(error.message);
//   }
// }
const verifypayment = async(req,res)=>{
  try { 
    console.log('verifff');
    
    const user_id =  req.session.user_id
      const paymentData = req.body
      const cartData = await Cart.findOne({userid:user_id})
      console.log(cartData);
  
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAYSECRETKEY);
      hmac.update( paymentData.payment.razorpay_order_id  +"|" +  paymentData.payment.razorpay_payment_id );
      const hmacValue = hmac.digest("hex");
  
      if(hmacValue == paymentData.payment.razorpay_signature){
          let data = cartData.products
          
          for( let i=0;i<data.length;i++){
              let products = data[i].productId
              let count = data[i].count
              console.log(product);
              
              await product.updateOne({_id:products},{$inc:{quantity:-count}})
        }
  
        await Order.findByIdAndUpdate(
          { _id: paymentData.order.receipt },
          { $set: { paymentStatus: "placed", paymentId: paymentData.payment.razorpay_payment_id } }
        );
    
        await Cart.deleteOne({userid:user_id})
       
        res.json({placed:true})
      }
  
    
      
  } catch (error) {
      console.log(error.message);
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
      const count = order.products[0].count;


      if (order) {
        order.status = 'cancelled';
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
    res.status(500).json({ error: 'Internal server error' });
  }
}
// ++++++++++++++++ORDER RETURN PAGE++++++++++++++++++
const returnOrder = async (req, res) => {
  try {

    res.render('orderReturn')
  } catch (error) {
    console.log(error.message)
  }
}

// ++++++++++++++++ORDER RETURN ++++++++++++++++++
const orderReturnPOST = async (req, res) => {
  try {
    const type = req.body.type;
    const id = req.body.id;

    if (type === 'order') {
      // Handle order return
      const order = await Order.findOne({ _id: id });
      const count = order.products[0].count;


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
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  loadCheckout,
  placeOrder,
  orderSuccess,
  orderCancel,
  cancelOrder,
  returnOrder,
  orderReturnPOST,
  verifypayment,
  // viewrazor
}