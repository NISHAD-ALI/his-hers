const admin = require('../models/adminModel')
const bcrypt = require('bcrypt')
const user = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const Order = require('../models/orderModel')
const Address = require('../models/addressModel')
// require('dotenv').config();


// ++++++++++++++++++++++++++++++++++++++CHECKING WITH REGEX++++++++++++++++++++++++++++++++++++++++++++++
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
// ++++++++++++++++++++++++++++++++++++++RENDER ADMIN LOGIN PAGE++++++++++++++++++++++++++++++++++++++++++++++

const loadAdminSignin = async(req,res)=>{         
    try {
        res.render('adminLogin')
        
    } catch (error) {
        console.log(error.message);
        
    }
}
// ++++++++++++++++++++++++++++++++++++++VALIDATION OF EMAIL++++++++++++++++++++++++++++++++++++++++++++++

const loginAdmin = async (req, res) => {
  const { emailAdmin, passwordAdmin } = req.body;

  try {
    if (!emailAdmin || !passwordAdmin) {
      return res.render('adminLogin', { message: 'Email and password are required' });
    }

    if (!validateEmail(emailAdmin)) {
      return res.render('adminLogin', { message: 'Invalid email format' });
    }

    // Query the admin user from the database
    const adminData = await admin.findOne({ email: emailAdmin });

    if (!adminData) {
      return res.render('adminLogin', { message: 'Admin not found' });
    }
    
    const passwordMatch = await bcrypt.compare(passwordAdmin, adminData.password);

    if (passwordMatch) {
      req.session.admin_id = adminData._id;
          req.session.save();

      return res.redirect('/admin/dashboard');
      
    } else {
      return res.render('adminLogin', { message: 'Incorrect password' });
    }
  } catch (error) {
    console.error(error.message);
    return res.render('adminLogin', { message: 'An error occurred' });
  }
};



// ++++++++++++++++++++++++++++++++++++++LOGOUT CURRENT ADMIN++++++++++++++++++++++++++++++++++++++++++++++


// const logoutAdmin = async (req, res) => {
//   try {
    
//     req.session.admin_id = false;

    
//     res.redirect('/admin/adminLogin');
    

//   } catch (error) {
//     console.log(error.message);
    
//   }
// };
    const logoutAdmin = async (req, res) => {
      try {
        req.session.destroy((err) => {
          if (err) {
            console.error(err);
          }
          res.redirect('/admin/adminLogin'); 
        });
      } catch (error) {
        console.log(error.message);
      }
    };


// ++++++++++++++++++++++++++++++++++++++LOAD ADMIN DASHBOARD++++++++++++++++++++++++++++++++++++++++++++++

const loadAdminDash = async (req, res) => {
  try {
    const orderDat = await Order.find({})
      .populate({
        path: 'userid',
        select: 'name'
      })
      .populate('products.productId');

    const orderCount = await Order.countDocuments();
    
    // Fetch total revenue
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Check if totalRevenue array is not empty
    const formattedTotalRevenue = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;

    res.render('dashboard', { orderDat, orderCount, totalRevenue: formattedTotalRevenue });
  } catch (error) {
    console.log(error.message);
  }
};



// ++++++++++++++++++++++++++++++++++++++LOAD USER MANAGEMENT++++++++++++++++++++++++++++++++++++++++++++++


  const loadUserManag = async (req, res) => {
    try {
      const usersData = await user.find({  });
      res.render("userManagement",{ user: usersData });
    } catch (error) {
      console.log(error.message);
      
    }
  };
  
// ++++++++++++++++++++++++++++++++++++++UNBLOCK OR BLOCK USER++++++++++++++++++++++++++++++++++++++++++++++

  const blockUser = async (req, res) => {
    try {
      const blockedUser = await user.findOne({ _id: req.query.id });
      if (blockedUser.is_block == 0) {
        await user.updateOne({ _id: req.query.id }, { $set: { is_block: 1 } });
        req.session.user_id = false;
        console.log('User session cleared:', req.session.user_id,'logout successfull');
        res.redirect("/admin/userManagement");
      } else {
        await user.updateOne({ _id: req.query.id }, { $set: { is_block: 0 } });
        res.redirect("/admin/userManagement");
      }
    } catch (error) {
      console.log(error.message);
      
    }
  };

 
  // ++++++++++++++++++++++++++++++++++++++LOAD ADD CATEGORY MANAGE++++++++++++++++++++++++++++++++++++++++++++++

  const addNewCategory = async (req,res) =>{
    try{
      res.render('addCategory')
    }
    catch(error){
      console.log(error.message);
      
    }
  }

// ++++++++++++++++++++++++++++++++++++++ ADD CATEGORY TO DATABASE++++++++++++++++++++++++++++++++++++++++++++++

  const addCategoryDB = async (req, res) => {
    try {
      const name = req.body.catName;
      const data = new category({
        name: req.body.catName,
      });
      const exists = await category.findOne({
        name: { $regex: name, $options: "i" },
      });
      if (exists) {
        res.render("addCategory", {
          message: "Entered category already exists.",
        });
      } else {
        const catData = await data.save();
        res.redirect("/admin/categoryManagement");
      }
    } catch (error) {
      console.log(error.message);
      
    }
  };
 // ++++++++++++++++++++++++++++++++++++++LOAD CATEGORY MANAGE++++++++++++++++++++++++++++++++++++++++++++++

 const loadCategoryManag = async (req, res) => {
  try {
    const categories = await category.find();
    res.render("categoryManagement", { cats: categories });
  } catch (error) {
    console.log(error.message);
    
  }
};

// ++++++++++++++++++++++++++++++++++++++BLOCK / UNBLOCK CATEGORY ++++++++++++++++++++++++++++++++++++++++++++++

const blockCat = async (req, res) => {
  try {
    const blockedCat = await category.findOne({ _id: req.query.id });
    if (!blockedCat) {
      return res.status(404).send('Category not found');
    }

    // Toggle the is_block status
    blockedCat.blocked = blockedCat.blocked === 0 ? 1 : 0;
    await blockedCat.save();

    res.redirect('/admin/categoryManagement');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error blocking/unblocking category');
  }
};

// ++++++++++++++++++++++++++++++++++++++EDIT CATEGORY ++++++++++++++++++++++++++++++++++++++++++++++
  const editcat = async (req, res) => {
    try {
      const catsId = req.query.id;
      const cate =  await category.findOne({ _id: catsId });
      res.render("editCategory", { cats: cate });
    } catch (error) {
      console.log(error.message);
      
    }
  };
// ++++++++++++++++++++++++++++++++++++++EDIT CATEGORY POST ++++++++++++++++++++++++++++++++++++++++++++++
const editcatPOST = async (req, res) => {
  try {
    const categoryId = req.body.categoryId; 
    const newCatname = req.body.catName;
    const categ = await category.findOne({ _id: categoryId });

    if (!categ) {
      return res.status(404).send('Category not found');
    }

  
    categ.name = newCatname;
    await categ.save();

    res.redirect('/admin/categoryManagement');
  } catch (error) {
    console.log(error.message);
    
    
  }
};

// ++++++++++++++++++++++++++++++++++++++ 404 ERROR PAGE++++++++++++++++++++++++++++++++++++++++++++++

const loadAdminError = async (req, res) => {
  try {
    res.render("404");
  } catch (error) {
    console.log(error.message);
  }
}; 

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

  
   const orderStatus = await Order.updateOne({ _id: orderId }, { status: newStatus });
   console.log(orderStatus);

    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


  
 module.exports = {
    loadAdminSignin,
    loginAdmin,
    logoutAdmin,
    loadAdminDash,
    loadUserManag,
    blockUser,
    loadCategoryManag,
    addNewCategory,
    addCategoryDB,
    blockCat,
    editcat,
    editcatPOST,
    loadAdminError,
    updateOrderStatus
  }