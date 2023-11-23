const mongoose = require('mongoose');

const walletdata = new mongoose.Schema({
    userid:{
        type:String,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,
        
    },
    items:[{
        date:{
            type:Date  
        },
        amount:{
            type:Number   
        },
        type:{
            type:String
        },
       
    }]
})

module.exports = mongoose.model('Wallet',walletdata)