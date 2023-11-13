const mongoose = require('mongoose');

const orderdetails = mongoose.Schema({
  userid: {
    type: String,
    ref: "User",
    required: true
  },
  deliveryDetails: {
    type: Object,

  },
  products: [{
    productId: {
      type: String,
      required: true,
      ref: "product",
    },
    count: {
      type: Number,
      default: 1
    },
    total: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: 'Pending'

    }
  }],
  purchaseDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    required: true
  },
  shippingMethod: {
    type: String,

  },
  shippingFee: {
    type: String,
    required: true
  }
});


module.exports = mongoose.model('order', orderdetails)