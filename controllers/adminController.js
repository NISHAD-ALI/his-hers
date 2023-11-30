const admin = require('../models/adminModel')
const bcrypt = require('bcrypt')
const user = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const Order = require('../models/orderModel')
const Address = require('../models/addressModel')
let pdf = require('html-pdf')
let ejs = require('ejs')
let path = require('path')
const ExcelJS = require('exceljs');
const zip = require('express-zip'); 



// ++++++++++++++++++++++++++++++++++++++CHECKING WITH REGEX++++++++++++++++++++++++++++++++++++++++++++++
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
// ++++++++++++++++++++++++++++++++++++++RENDER ADMIN LOGIN PAGE++++++++++++++++++++++++++++++++++++++++++++++

const loadAdminSignin = async (req, res) => {
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


const logoutAdmin = async (req, res) => {
  try {
    req.session.admin_id = false;
      res.redirect('/admin/adminLogin');
  
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
    const newProduct = await product.find({}).sort({ _id: -1 }).limit(1)

    const orderCount = await Order.countDocuments();
    const userCount = await user.countDocuments();
    // Fetch total revenue
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);


    let totalCod = await Order.aggregate([
      { $match: { status: 'Delivered', paymentMethod: 'cod' } },

      { $group: { _id: null, total1: { $sum: 1 } } }
    ])

    let totalOnline = await Order.aggregate([
      { $match: { status: 'Delivered', paymentMethod: 'online' } },

      { $group: { _id: null, total2: { $sum: 1 } } }
    ])

    let totalWallet = await Order.aggregate([
      { $match: { status: 'Delivered', paymentMethod: 'Wallet' } },

      { $group: { _id: null, total3: { $sum: 1 } } }
    ])

    totalCod = totalCod.length > 0 ? totalCod[0].total1 : 0;
    totalOnline = totalOnline.length > 0 ? totalOnline[0].total2 : 0;
    totalWallet = totalWallet.length > 0 ? totalWallet[0].total3 : 0;

    const formattedTotalRevenue = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
    if (newProduct.length > 0) {
      res.render('dashboard', { orderDat, orderCount, totalRevenue: formattedTotalRevenue, userCount, totalCod, totalOnline, totalWallet, newProduct });
    } else {
      res.render('dashboard', { orderDat, orderCount, totalRevenue: formattedTotalRevenue, userCount, totalCod, totalOnline, totalWallet, newProduct: {} });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const chartFilterWeek = async (req, res) => {
  try {
    const totalCodWeek = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'cod',

      purchaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const totalOnlineWeek = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'online',

      purchaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const totalWalletWeek = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'Wallet',

      purchaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json([totalCodWeek, totalOnlineWeek, totalWalletWeek]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const chartFilterMonth = async (req, res) => {
  try {
    const totalCodMonth = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'cod',
      purchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const totalOnlineMonth = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'online',
      purchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const totalWalletMonth = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'Wallet',
      purchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    res.json([totalCodMonth, totalOnlineMonth, totalWalletMonth]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
const chartFilterYear = async (req, res) => {
  try {
    const totalCodYear = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'cod',
      purchaseDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    });

    const totalOnlineYear = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'online',
      purchaseDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    });

    const totalWalletYear = await Order.countDocuments({
      status: 'Delivered',
      paymentMethod: 'Wallet',
      purchaseDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    });

    res.json([totalCodYear, totalOnlineYear, totalWalletYear]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
// ++++++++++++++++++++++++++++++++++++++LOAD USER MANAGEMENT++++++++++++++++++++++++++++++++++++++++++++++


const loadUserManag = async (req, res) => {
  try {
    const usersData = await user.find({});
    res.render("userManagement", { user: usersData });
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
      console.log('User session cleared:', req.session.user_id, 'logout successfull');
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

const addNewCategory = async (req, res) => {
  try {
    res.render('addCategory')
  }
  catch (error) {
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
    const cate = await category.findOne({ _id: catsId });
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

const loadOrder = async (req, res) => {
  try {
    const orderDat = await Order.find({})
      .populate({
        path: 'userid',
        select: 'name'
      })
      .populate('products.productId');
    
    if(orderDat){
      res.render('orderManagement', { orderDat })
    } else{
      res.render('orderManagement', { orderDat:{} })
    }
   
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Internal server error' });
  }
}

const loadSalesSum = async (req, res) => {
  try {
    const orderDat = await Order.find({})
      .populate({
        path: 'userid',
        select: 'name'
      })
      .populate('products.productId');
    const newProduct = await product.find({})
    res.render('salesSummary', { orderDat, newProduct })
  } catch (error) {
    console.log(error.message)
  }
}


const filterSaleYear = async (req, res) => {
  try {
    let filter = {};

    if (req.query.filter) {
      const filterType = req.query.filter;

      switch (filterType) {
        case 'week':
          filter = {
            purchaseDate: {
              $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
            },
          };
          break;

        case 'month':
          filter = {
            purchaseDate: {
              $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
            },
          };
          break;

        case 'year':
          filter = {
            purchaseDate: {
              $gte: new Date(new Date() - 365 * 24 * 60 * 60 * 1000),
            },
          };
          break;

        case 'custom':
          if (req.query.fromDate && req.query.toDate) {
            filter = {
              purchaseDate: {
                $gte: new Date(req.query.fromDate),
                $lte: new Date(req.query.toDate),
              },
            };
          }
          break;

        default:
          break;
      }
    }

    const orderDat = await Order.find(filter)
      .populate({
        path: 'userid',
        select: 'name',
      })
      .populate('products.productId');

    // Render EJS template
    ejs.renderFile(
      path.join(__dirname, '..', 'views', 'admin', 'salesReport.ejs'),
      { orderDat },
      async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        }

        // Generate PDF
        const pdfOptions = {
          height: '11.25in',
          width: '8.5in',
          header: {
            height: '0mm',
          },
          footer: {
            height: '0mm',
          },
        };

        const pdfPromise = new Promise((resolve, reject) => {
          pdf.create(data, pdfOptions).toFile((err, pdfPath) => {
            if (err) {
              console.log(err);
              reject('Error generating PDF');
            } else {
              resolve(pdfPath.filename);
            }
          });
        });

        // Generate Excel
        const excelOptions = {
          filename: 'report.xlsx',
          useStyles: true,
          useSharedStrings: true,
        };

        const excelPromise = new Promise((resolve, reject) => {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sales Report');

          // Add headers
          worksheet.addRow(['Order Date', 'Product Name', 'Quantity', 'Price', 'Total Price']);

          // Add data
          orderDat.forEach(order => {
            order.products.forEach(product => {
              worksheet.addRow([
                order.purchaseDate.toLocaleString('en-US'),
                product.productId.productname,
                product.count,
                `$${product.productId.price.toFixed(2)}`,
                `$${(product.count * product.productId.price).toFixed(2)}`,
              ]);
            });
          });

          workbook.xlsx.writeFile(excelOptions.filename).then(() => {
            resolve(excelOptions.filename);
          }).catch((err) => {
            console.log(err);
            reject('Error generating Excel');
          });
        });

        // Wait for both promises to resolve
        try {
          const [pdfPath, excelPath] = await Promise.all([pdfPromise, excelPromise]);

          // Send both files using express-zip
          res.zip([
            { path: pdfPath, name: 'sales_report.pdf' },
            { path: excelPath, name: 'sales_report.xlsx' },
          ]);
        } catch (error) {
          console.log(error);
          res.status(500).send('Error sending files');
        }
      }
    );
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
  updateOrderStatus,
  loadOrder,
  chartFilterWeek,
  chartFilterMonth,
  chartFilterYear,
  loadSalesSum,
  filterSaleYear
}