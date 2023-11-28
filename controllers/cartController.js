const user = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const Cart = require('../models/cartModel')

// +++++++++++++++++++++++++++++RENDER CART+++++++++++++++++++++++++++++++++



const loadCart = async (req, res) => {
  try {
    var userName;
    if (req.session.user_id) {
      var userData = await user.findOne({ _id: req.session.user_id });

      if (userData) {
        userName = userData.name;
      }
    }

    // Load the user's cart data
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userid: userId }).populate("products.productId");

    if (!cartData || !cartData.products || cartData.products.length === 0) {
      console.log("Your cart is empty.");
      return res.render('cart', { user: req.session.name, cartData: null, userId, totalamount: 0, userName });
    }


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
    res.render('cart', { user: req.session.name, cartData: cartData, userId, datatotal, totalamount, userName });
  } catch (error) {
    console.log(error.message);
  }
};
// +++++++++++++++++++++++++++++ADD TO CART+++++++++++++++++++++++++++++++++
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;

    const productData = await product.findOne({ _id: productId });

    const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });

    if (userId) {
      if (productData.quantity >= 1) {
        if (cartData) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": 1 } }
          );
          // Product is already in the cart
          console.log("Cart product count increased");
          res.json({ alreadyAdded: true });
        } else {

          const discountPrices = [productData.discountPricepro, productData.price, productData.discountPricecat];
          const validDiscounts = discountPrices.filter(discount => discount !== null && discount !== undefined);
        
          let smallestDiscount = validDiscounts ? Math.min(...validDiscounts) : undefined;
          console.log(smallestDiscount+"00000000");
          const cartItem = {
            productId: productId,
            count: 1,
            totalPrice: smallestDiscount  ? smallestDiscount : productData.price,
          };
          

          const newCart = await Cart.findOneAndUpdate(
            { userid: userId },
            { $set: { userid: userId }, $push: { products: cartItem } },
            { upsert: true, new: true }
          );
          console.log('newCart' + newCart);
          console.log("product added to the cart");
          res.json({ result: true });
        }
      } else {
        res.json({ result: false });
      }
    } else {
      res.json({ login: true });
      console.log("Login required");
    }
  } catch (error) {
    console.log(error.message);
  }
};


// +++++++++++++++++++++++++++++ADD QUANTITY TO CART+++++++++++++++++++++++++++++++++


const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;
    const val = req.body.val;

    const productData = await product.findOne({ _id: productId });

    if (productData.quantity > 0) {
      const cartData = await Cart.findOne({ userid: userId, "products.productId": productId });
      const currentCount = cartData.products.find(item => item.productId === productId).count;

      if (val === 1) {
        if (currentCount < productData.quantity) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": 1 } });

          console.log("Count increased");
          res.json({ result: true });
        } else {
          // Display a "stock exceeded" alert
          res.json({ result: "stock_exceeded" });
        }
      } else if (val === -1) {
        if (currentCount > 1) {
          await Cart.updateOne(
            { userid: userId, "products.productId": productId },
            { $inc: { "products.$.count": -1 } });

          console.log("Count decreased");
          res.json({ result: true });
        } else {
          // Handle the case when the count is already 1
          res.json({ result: "quantity_below_1" });
        }
      }
    } else {
      // Display SweetAlert if the product is out of stock
      res.json({ result: "out_of_stock" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// +++++++++++++++++++++++++++++DELETE PRODUCT FROM CART+++++++++++++++++++++++++++++++++


const deleteCartProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user_id;


    const cartData = await Cart.findOneAndUpdate(
      { userid: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );
    if (cartData) {
      res.redirect('/cart');
    }
    else {
      console.log("No matching items found in the cart.");

      res.redirect('/cart');
    }
  } catch (error) {
    console.log(error.message);

    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = {
  loadCart,
  addToCart,
  updateCartQuantity,
  deleteCartProduct
}