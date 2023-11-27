const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userid: {
        type: String,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0 
    },
    items: [{
        date: {
            type: Date,
            default: Date.now 
        },
        amount: {
            type: Number,
            default: 0 
        },
        type: {
            type: String,
            default: 'credit' 
        }
    }]
});

module.exports = mongoose.model('Wallet', walletSchema);
