const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
         type:Number,
         required:true
    },
    discountPrice:{
        type:Number,
        
   },
    category:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    size:{
        type:Array,
        required:true
    },
    image: {
        type: [String],
        required: true
    },
    additionalInfo:{
        type:String,
        required:true
    },
    blocked:{
        type:Number,
        default:0
    }

   
})
const product = mongoose.model("product", productSchema);
module.exports = product;