const express = require('express');
const userRoute = express()
const bodyParser = require('body-parser')
userRoute.use(bodyParser.json())
userRoute.use(bodyParser.urlencoded({extended:true}))
const userAuth = require('../middleware/userAuth')
userRoute.set('view engine','ejs')
userRoute.set('views','./views/user/users')
userController = require('../controllers/userController')
productController = require('../controllers/productController')
cartController = require('../controllers/cartController')
orderController = require('../controllers/orderController')
couponController = require('../controllers/couponController')

// Render the home page
userRoute.get('/',userController.loadHome)
userRoute.get('/login',userAuth.isLogOut,userController.loadSignup)
userRoute.post('/login', userController.loginUser)
userRoute.post('/signup',userController.insertNewUser)    
userRoute.get('/logout',userAuth.isLogin,userController.logoutUser)
userRoute.get('/otpResend',userController.resendOTP)
userRoute.post('/verify', userController.verifymail)


userRoute.get('/viewMore',productController.loadProductList)
userRoute.get('/productView',productController.loadUserProduct)


userRoute.get('/myAccount',userController.loadAcc)
userRoute.get('/editAddress',userController.loadEditAddress)
userRoute.post('/editAddress',userController.editAddress)
userRoute.get('/addAddress',userController.loadAddAddress)
userRoute.post('/addAddress',userController.addAddress)
userRoute.get('/deleteAddress',userController.deleteAddress)
userRoute.post('/updateUserDetails',userController.updateUserDetails)


// userRoute.post('/editImage',userController.updateProfilePhoto)
userRoute.get('/loadreset',userController.loadResetPassEmail)
userRoute.post('/reset-password',userController.resetPasswordEmailLink)
userRoute.post('/verify', userController.verifymail)
userRoute.get('/loadpassReset',userController.loadpassReset)
userRoute.post('/resetpassPost',userController.resetPasswordPost)

userRoute.get('/cart',cartController.loadCart)
userRoute.post('/addToCart',cartController.addToCart)
userRoute.post('/updateCartQuantity',cartController.updateCartQuantity)
userRoute.get('/deleteCartProduct',cartController.deleteCartProduct)

userRoute.get('/checkout',orderController.loadCheckout)
userRoute.post('/orderPlace',orderController.placeOrder)
userRoute.get('/order-success',orderController.orderSuccess)
userRoute.get('/order-Cancel',orderController.orderCancel)
userRoute.post('/cancelOrder',orderController.cancelOrder)
userRoute.get('/cancelPage',orderController.orderCancel)
userRoute.get('/returnPage',orderController.returnOrder)
userRoute.post('/returnOrder',orderController.orderReturnPOST)
userRoute.post('/verify-payment',orderController.verifypayment)
userRoute.get('/invoice/:id',orderController.orderInvoice)


userRoute.post('/applyCoupon',couponController.applyCoupon)

module.exports = userRoute