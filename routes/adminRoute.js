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
adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')
adminController = require('../controllers/adminController')
productController = require('../controllers/productController')
couponController = require('../controllers/couponController')

adminRoute.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    next();
  });




adminRoute.get('/adminLogin',auth.isLogOut,adminController.loadAdminSignin);
adminRoute.post('/adminLogin', adminController.loginAdmin);
adminRoute.get('/dashboard', adminController.loadAdminDash);
adminRoute.get('/userManagement', adminController.loadUserManag);
adminRoute.get('/block-user', adminController.blockUser);
adminRoute.get('/categoryManagement', adminController.loadCategoryManag);
adminRoute.get('/adminLogout',auth.isLogin,adminController.logoutAdmin)
adminRoute.get('/addCategory', adminController.addNewCategory)
adminRoute.post('/addCat', adminController.addCategoryDB)
adminRoute.get('/block-cat', adminController.blockCat);
adminRoute.get('/edit-cat', adminController.editcat);
adminRoute.post('/edit-cat', adminController.editcatPOST);

adminRoute.get('/productManagement', productController.loadProduct);
adminRoute.get('/addPro', productController.loadNewProduct)
adminRoute.post('/addPro', productController.newproduct)
adminRoute.get('/block-pro', productController.blockPro);
adminRoute.get('/editPro', productController.loadEditProduct);
adminRoute.post('/edit-Pro', productController.editProduct);
adminRoute.get('/deletePro', productController.deleteProduct);

adminRoute.post('/update-order-status', adminController.updateOrderStatus);
// adminRoute.get('*', adminController.loadAdminError);

adminRoute.get('/loadCoupon', couponController.loadCoupon);
adminRoute.get('/loadAddCoupon', couponController.loadAddCoupon);
adminRoute.post('/addCouponDB', couponController.addCoupon);


module.exports = adminRoute
