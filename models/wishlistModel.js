const mongoose = require('mongoose');

const wishlist = mongoose.Schema({
  userid: {
    type: String,
    ref: "User",
    required: true
  },
  productid:{
    type:Array,
    required:true,
    ref:"product"
}
})

module.exports = mongoose.model('Wishlist', wishlist)