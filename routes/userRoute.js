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
userRoute.get('/searchProducts',productController.searchProducts)
userRoute.get('/sortProducts', productController.sortProducts);
userRoute.post('/filter',productController.filteredProducts)

userRoute.get('/categoryMen', productController.menCat);
userRoute.get('/categorywoMen', productController.womenCat);
userRoute.get('/freshArrivals', productController.loadfreshArrivals);

userRoute.get('/myAccount',userAuth.isLogin,userController.loadAcc)
userRoute.get('/editAddress',userAuth.isLogin,userController.loadEditAddress)
userRoute.post('/editAddress',userAuth.isLogin,userController.editAddress)
userRoute.get('/addAddress',userAuth.isLogin,userController.loadAddAddress)
userRoute.post('/addAddress',userAuth.isLogin,userController.addAddress)
userRoute.get('/deleteAddress',userAuth.isLogin,userController.deleteAddress)
userRoute.post('/updateUserDetails',userAuth.isLogin,userController.updateUserDetails)


// userRoute.post('/editImage',userController.updateProfilePhoto)
userRoute.get('/loadreset',userController.loadResetPassEmail)
userRoute.post('/reset-password',userController.resetPasswordEmailLink)
userRoute.post('/verify', userController.verifymail)
userRoute.get('/loadpassReset',userController.loadpassReset)
userRoute.post('/resetpassPost',userController.resetPasswordPost)

userRoute.get('/cart',userAuth.isLogin,cartController.loadCart)
userRoute.post('/addToCart',cartController.addToCart)
userRoute.post('/updateCartQuantity',userAuth.isLogin,cartController.updateCartQuantity)
userRoute.get('/deleteCartProduct',userAuth.isLogin,cartController.deleteCartProduct)

userRoute.get('/checkout',userAuth.isLogin,orderController.loadCheckout)
userRoute.post('/orderPlace',userAuth.isLogin,orderController.placeOrder)
userRoute.get('/order-success',userAuth.isLogin,orderController.orderSuccess)
userRoute.get('/order-Cancel',userAuth.isLogin,orderController.orderCancel)
userRoute.post('/cancelOrder',userAuth.isLogin,orderController.cancelOrder)
userRoute.get('/orderCancel',userAuth.isLogin,orderController.orderCancel)
userRoute.get('/returnPage',userAuth.isLogin,orderController.returnOrder)
userRoute.post('/returnOrder',userAuth.isLogin,orderController.orderReturnPOST)
userRoute.post('/verify-payment',orderController.verifypayment)
userRoute.get('/invoice/:id',orderController.orderInvoice)

userRoute.post('/applyCoupon',userAuth.isLogin,couponController.applyCoupon)

userRoute.get('/wishlist',userAuth.isLogin,userController.loadWishlist)
userRoute.post('/addToWishlist', userController.addtoWishlist);
userRoute.get('/deleteWishproduct',userAuth.isLogin,userController.deleteWishproduct)
userRoute.get('/aboutUs',userController.loadAboutUs)


module.exports = userRoute