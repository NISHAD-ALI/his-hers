const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    ref: "User",
  },
  userName: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: String,
        required: true,
        ref: "product",
      },
      count: {
        type: Number,
        default: 1,
      },
      sum: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
    },
  ],
});

module.exports = mongoose.model("cart", cartSchema);