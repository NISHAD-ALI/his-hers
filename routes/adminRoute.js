const express = require('express');
const session = require('express-session'); 
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const config = require('../config/config')
const adminRoute = express()
adminRoute.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.sessionSecret,
}));
adminRoute.use(bodyParser.json())
adminRoute.use(bodyParser.urlencoded({extended:true}))
const auth = require('../middleware/adminAuth')
const multer = require('../middleware/multer')
adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')
adminController = require('../controllers/adminController')
productController = require('../controllers/productController')
couponController = require('../controllers/couponController')
offerController = require('../controllers/offerController')
adminRoute.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    next();
  });




adminRoute.get('/adminLogin',auth.isLogOut,adminController.loadAdminSignin);
adminRoute.post('/adminLogin', adminController.loginAdmin);
adminRoute.get('/dashboard',auth.isLogin,adminController.loadAdminDash);
adminRoute.get('/userManagement',auth.isLogin, adminController.loadUserManag);
adminRoute.get('/block-user',auth.isLogin, adminController.blockUser);
adminRoute.get('/categoryManagement',auth.isLogin, adminController.loadCategoryManag);
adminRoute.get('/adminLogout',auth.isLogin,adminController.logoutAdmin)
adminRoute.get('/addCategory',auth.isLogin, adminController.addNewCategory)
adminRoute.post('/addCat',auth.isLogin, adminController.addCategoryDB)
adminRoute.get('/block-cat',auth.isLogin, adminController.blockCat);
adminRoute.get('/edit-cat',auth.isLogin, adminController.editcat);
adminRoute.post('/edit-cat',auth.isLogin, adminController.editcatPOST);

adminRoute.get('/chartWeek',auth.isLogin, adminController.chartFilterWeek);
adminRoute.get('/chartMonth',auth.isLogin, adminController.chartFilterMonth);
adminRoute.get('/chartYear',auth.isLogin, adminController.chartFilterYear);


adminRoute.get('/productManagement',auth.isLogin, productController.loadProduct);
adminRoute.get('/addPro',auth.isLogin, productController.loadNewProduct)
adminRoute.post('/addPro',auth.isLogin, productController.newproduct)
adminRoute.get('/block-pro',auth.isLogin, productController.blockPro);
adminRoute.get('/editPro',auth.isLogin, productController.loadEditProduct);
adminRoute.post('/edit-Pro',auth.isLogin, productController.editProduct);
adminRoute.get('/deletePro',auth.isLogin, productController.deleteProduct);
adminRoute.post('/delete-image',auth.isLogin, productController.deleteImage);
 
adminRoute.post('/update-order-status',auth.isLogin, adminController.updateOrderStatus);
adminRoute.get('/orderManagement',auth.isLogin, adminController.loadOrder);

// adminRoute.get('*', adminController.loadAdminError);

adminRoute.get('/loadCoupon',auth.isLogin, couponController.loadCoupon);
adminRoute.get('/loadAddCoupon',auth.isLogin, couponController.loadAddCoupon);
adminRoute.post('/addCouponDB',auth.isLogin, couponController.addCoupon);
adminRoute.post('/editCouponDB',auth.isLogin, couponController.editCoupon);
adminRoute.get('/loadEditCoupon',auth.isLogin, couponController.loadEditCoupon);
adminRoute.get('/blockCoupon', auth.isLogin,couponController.blockCoupon);
adminRoute.get('/deleteCoupon',auth.isLogin, couponController.deletecoupon);


adminRoute.get('/offers',auth.isLogin, offerController.loadOffers);
adminRoute.get('/addOff',auth.isLogin, offerController.loadAddOffer);
adminRoute.post('/addOfferDB',auth.isLogin, offerController.addOffers);
adminRoute.get('/block-off',auth.isLogin, offerController.blockOff);
adminRoute.get('/delete-Off',auth.isLogin, offerController.deleteOffer);

adminRoute.get('/offersCat',auth.isLogin, offerController.loadCategoryOffers);
adminRoute.get('/addoffersCat',auth.isLogin, offerController.loadAddCategoryOffer);
adminRoute.post('/addOfferCatDB',auth.isLogin, offerController.addCategoryOffer);
adminRoute.get('/deletecatOff',auth.isLogin, offerController.deleteCategoryOffer);

adminRoute.get('/salesSum',auth.isLogin, adminController.loadSalesSum);
adminRoute.get('/sales',auth.isLogin, adminController.filterSaleYear);


module.exports = adminRoute
