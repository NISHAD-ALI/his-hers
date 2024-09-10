const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Product = require('../models/productModel')
const Wishlist = require('../models/wishlistModel');
const Wallet = require('../models/walletModel')
const Offers = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');
const { log } = require('npmlog');
require('dotenv').config();

let email2;
let nameResend;
let otpsend = 0;
let user_id;


function validateEmail(email) {
  const regex = /^[^\s@]+([\._][^\s@]+)*@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const hashPassword = async (password) => {
  try {
    const passHash = await bcrypt.hash(password, 10)
    return passHash
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}
const loadSignup = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}

const insertNewUser = async (req, res) => {
  try {
    // Validate email using regex
    const validEmail = validateEmail(req.body.newEmail);
    if (!validEmail) {
      return res.render('login', { message1: 'Invalid email format' });
    }
    const user = await User.findOne({ email: req.body.newEmail });
    console.log(user);
    if (user) {
      return res.render('login', { message1: 'Email is already Registered' });
    }


    const secPass = await hashPassword(req.body.newPassword);
    const userNew = new User({
      name: req.body.newUsername,
      email: req.body.newEmail,
      Mobile: req.body.newMobile,
      password: secPass,
      is_verified: 0,
    });

    const userData = await userNew.save();

    const newuser = await User.findOne({ email: req.body.newEmail })

    const defaultWallet = new Wallet({
      userid: newuser._id,
      balance: 0,
      items: [],
    });

    // Save the default wallet

    if (userData) {
      // Send verification email
      sendVerifyMail(req.body.newUsername, req.body.newEmail, userData._id);
      email2 = req.body.newEmail;
      nameResend = req.body.newUsername;
      user_id = userData._id;

      res.render('otppage', { message: 'Check your email for the OTP.', newuser });
    } else {
      res.render('login', { message1: 'Failed to register' });
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};


function otpgenerator() {
  otpsend = Math.floor(100000 + Math.random() * 900000);
  console.log(otpsend);
}

const sendVerifyMail = async (name, email) => {
  try {
    await otpgenerator();
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD

      },
    });


    const mailoptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Sign up Verification',
      html: `<p>Hi ${name},</p><p>Your OTP is: <strong>${otpsend}</strong><br><br><br>regards,<br><b>TEAM HIS&HERS<b></p>`,
    };

    const info = await transporter.sendMail(mailoptions);
    console.log('Email has been sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.render('500')
  }
};
const resendOTP = async (req, res) => {
  try {

    otp = await Math.floor(10000 + Math.random() * 90000);
    console.log(otp)
    sendVerifyMail(nameResend, email2, user_id);
    res.render('otppage', { message: 'A new OTP has been sent to your email.' });

  }

  catch (error) {
    console.log(error);
    res.render('500')
  }
}

const verifymail = async (req, res) => {
  try {
    console.log('Current OTP:', otpsend);
    console.log('User entered OTP:', req.body.otp);


    if (req.body.otp == otpsend) {
      const use = req.body.usermon
      console.log(use);
      let a = await User.updateOne({ _id: use }, { $set: { is_verified: 1 } });
      console.log(a)
      res.render('login', { message: 'Your Account has been created.' });
    } else {
      res.render('otppage', { message: 'Invalid OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error.message);
    res.render('500')
  }
};


const loginUser = async (req, res) => {




  const { newEmail, newPassword } = req.body;

  try {
    if (!newEmail || !newPassword) {
      return res.render('login', { message: 'Email and password are required' });
    }

    if (!validateEmail(newEmail)) {
      return res.render('login', { message: 'Invalid email format' });
    }

    const user = await User.findOne({ email: newEmail });
    if (!user) {
      return res.render('login', { message: 'User not found' });
    }
    if (user.is_block == 1) {
      return res.render('login', { message: "Your account has been BLOCKED" })
    }
    if (user.is_verified === 0) {

      sendVerifyMail(user.name, user.email, user._id);
      return res.render('otppage', { message: 'Check your email for the OTP.', user });
    }
    const passwordMatch = await bcrypt.compare(newPassword, user.password);

    if (passwordMatch) {


      req.session.user_id = user._id
      res.redirect('/');

    } else {
      res.render('login', { message: 'Incorrect password' });
    }

  } catch (error) {
    console.log(error.message);
    res.render('login', { message: 'An error occurred' });
  }
};
// ++++++++++++++++++++++++++++++++++++++LOAD HOME+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const loadHome = async (req, res) => {
  try {
    let userName
    const discount = await Offers.find({ is_block: 0 })
    const discountcategory = await CategoryOffer.find({ is_block: 0 });
    const productData = await Product.find({
      $and: [
        { blocked: 0 },
        {
          $or: [
            { discountPricepro: { $exists: true, $ne: null } },
            { discountPricecat: { $exists: true, $ne: null } }
          ]
        }
      ]
    });



    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
        return res.render('home', { userName, products: productData, discPrice: discount, discCat: discountcategory });
      }
    }
    else {
      res.render('home', { userName, products: productData, discPrice: discount });
    }
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}



// ++++++++++++++++++++++++++++++++++++++LOGOUT CURRENT USER++++++++++++++++++++++++++++++++++++++++++++++

const logoutUser = (req, res) => {
  try {
    req.session.user_id = false;
    console.log('User session cleared:', req.session.user_id, 'logout successfull');
    res.redirect('/login');
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++++++++ 404 ERROR PAGE++++++++++++++++++++++++++++++++++++++++++++++

const loadUserError = async (req, res) => {
  try {
    res.status(404).render("404");
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ACCOUNT DASH LOAD++++++++++++++++++++++++++++++++++++++++++++++


const loadAcc = async (req, res) => {
  try {

    let accountDetails;
    let userName;
    let UserAddress;
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      const addresses = await Address.find({ User: req.session.user_id });
      const orderData = await Order.find({ userid: req.session.user_id })
        .populate("products.productId")
        .sort({ purchaseDate: -1 });
      const walletData = await Wallet.findOne({ userid: req.session.user_id })

      if (walletData && walletData.items && walletData.items.length > 0) {
        const sortedItems = walletData.items.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
        walletData.items = sortedItems;
      }

      if (user) {
        userName = user.name;
        accountDetails = user;
        UserAddress = addresses;

        return res.render('account', { accountDetails, orderData, UserAddress, userName, walletData });
      }
    }

    // If user or address is not found
    res.render('account', { userName, UserAddress: [], accountDetails: [], orderData: [], walletData: [] });
  } catch (error) {
    console.error(error.message);

    res.render('account', { userName, UserAddress: [], accountDetails: [], orderData: [], walletData: [] });
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD EDIT ADDRESS +++++++++++++++++++++++++++++++++++++++++++++++++++


const loadEditAddress = async (req, res) => {
  try {
    let userName;
    // Initialize userAdd as an empty array
    let userAdd = [];
    const addressid = req.query.id
    console.log(addressid);
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      const UserAddress = await Address.findOne({ _id: addressid });


      if (user) {
        userName = user.name;
        if (UserAddress) {
          userAdd = UserAddress.address; // Set userAdd to the address data if available
        }
      }
    }

    res.render('editAddress', { userName, userAdd });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};


// ++++++++++++++++++++++++++++++++++++++ LOAD ADD ADDRESS +++++++++++++++++++++++++++++++++++++++++++++++++++
const loadAddAddress = async (req, res) => {
  try {
    let userName
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      console.log(user);
      if (user) {
        userName = user.name;
        return res.render('addAddress', { userName });
      }
    }
    else {
      res.render('addAddress', { userName });
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++  ADD ADDRESS TO DB +++++++++++++++++++++++++++++++++++++++++++++++++++
const addAddress = async (req, res) => {

  try {
    let userId
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      userId = user._id
      const addressData = {
        User: user._id,
        address: {
          fullname: req.body.fullname,
          mobile: req.body.mobile,
          email: req.body.email,
          houseNo: req.body.houseNo,
          city: req.body.city,
          state: req.body.state,
          zipcode: req.body.zipcode,
          additionalDetails: req.body.additionalDetails,
        },
      };
      const newAddress = new Address(addressData);

      await newAddress.save();
      res.redirect('/myAccount');
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++++++++  EDIT ADDRESS IN DB +++++++++++++++++++++++++++++++++++++++++++++++++++

const editAddress = async (req, res) => {
  try {
    const id = req.query.id;

    // Create an object with the fields to update
    const updateFields = {
      "address.$.fullname": req.body.fullname,
      "address.$.mobile": req.body.mobile,
      "address.$.email": req.body.email,
      "address.$.houseNo": req.body.houseNo,
      "address.$.city": req.body.city,
      "address.$.state": req.body.state,
      "address.$.zipcode": req.body.zipcode,
      "address.$.additionalDetails": req.body.additionalDetails,
    };

    // Use updateOne to update the specified subdocument in the array
    const updatedAddress = await Address.updateOne(
      { "address._id": id },
      { $set: updateFields }
    );
    console.log(updateFields);
    console.log(updatedAddress);


    res.redirect('/myAccount');

  } catch (error) {
    console.error(error.message);
    res.render('editAddress', { message: 'An error occurred' });
  }
};

// ++++++++++++++++++++++++++++++++++++++  DELETE ADDRESS IN DB +++++++++++++++++++++++++++++++++++++++++++++++++++
const deleteAddress = async (req, res) => {
  try {

    const currentAddress = await Address.findOne({ _id: req.query.id });

    if (!currentAddress) {
      return res.status(404).send('Product not found');
    }
    await Address.deleteOne({ _id: req.query.id });
    res.redirect('/myAccount');
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
// ++++++++++++++++++++++++++++++++++++++ SEND RESET PASSWORD EMAIL +++++++++++++++++++++++++++++++++++++++++++++++++++


const resetPasswordEmailLink = async (req, res) => {
  try {
    // Retrieve the email from the form submission
    const email = req.body.email;
    console.log(email);
    // Check if the email exists in the user database
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      // If the email is not found, send an error message
      return res.json({ error: 'Email not found' });
    }
    const generateUniqueToken = (length = 32) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
      }
      return token;
    };
    const storeTokenInDatabase = async (userId, token, expiration) => {
      try {
        const user = await User.findOneAndUpdate(
          { _id: userId },
          { resetPasswordToken: token, resetPasswordExpires: expiration }
        );
        console.log(user + 'success token')
        if (!user) {
          console.error('User not found for storing token.');
        }
      } catch (error) {
        console.error('Error storing token in the database:', error);
      }
    };
    const token = generateUniqueToken();
    const tokenExpiration = new Date(Date.now() + 3600000);
    console.log(token);
    storeTokenInDatabase(user.id, token, tokenExpiration);
    const resetPasswordLink = `https://hisandhers.up.railway.app/loadpassReset?token=${token}`;
    // const resetPasswordLink = `http://localhost:3000/loadpassReset?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `   <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f3f3f3;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px #ccc;
          }
          .header {
            background-color: #007BFF;
            color: #fff;
            text-align: center;
            padding: 20px;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
          }
          .button-container {
            text-align: center;
          }
          .button {
            background-color: #007BFF;
            color: #fff; 
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Click the button below to reset your password:</p>
            <div class="button-container">
              <a href="${resetPasswordLink}" class="button">Reset Password</a>
            </div>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <br>
            <p>Regards,Team <b>HIS&HERS</b><p>
          </div>
        </div>
      </body>
    </html>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({ error: 'Email sending failed' });
      } else {
        console.log('Email sent:', info.response);
        return res.json({ success: true });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ RENDER RESET PASSWORD EMAIL PAGE +++++++++++++++++++++++++++++++++++++++++++++++++++   
const loadResetPassEmail = async (req, res) => {
  try {
    res.render('verifyEmail')
  } catch (error) {
    console.log(error.message)
  }
}
// ++++++++++++++++++++++++++++++++++++++ RENDER RESET PASSWORD PAGE +++++++++++++++++++++++++++++++++++++++++++++++++++   
const loadpassReset = async (req, res) => {
  try {
    const token = req.query.token;
    console.log(token);
    res.render('resetPassword', { token })
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}
// ++++++++++++++++++++++++++++++++++++++  RESET PASSWORD POST +++++++++++++++++++++++++++++++++++++++++++++++++++   
const resetPasswordPost = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(token);

    const user = await User.findOne({
      resetPasswordToken: token,
    });
    console.log(user);
    if (!user) {
      return res.json({ error: 'Invalid or expired token' });
    }
    const hashedPassword = await hashPassword(newPassword);
    // Reset the user's password
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    req.session.passwordUpdateSuccess = true;
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++++++++ UPDATE USER PROFILE +++++++++++++++++++++++++++++++++++++++++++++++++++   

const updateUserDetails = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.confirmPassword);
    const newDetails = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      Mobile: req.body.Mobile,
    };

    await User.updateOne({ _id: req.session.user_id }, { $set: newDetails });
    console.log('hi');

    res.redirect('/');
  } catch (error) {
    console.log('hello');

    console.error(error.message);
    res.render('account', { message: 'An error occurred' });
  }
};

// ++++++++++++++++++++++++++++++++++++++ RENDER WISHLIST +++++++++++++++++++++++++++++++++++++++++++++++++++  
const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user_id;
    let userName;
    let wishlist
    if (user) {
      const userData = await User.findOne({ _id: user });

      if (!userData) {
        console.log('User not found');
        return res.status(404).render('error', { errorMessage: 'User not found' });
      }

      userName = userData.name;

      wishlist = await Wishlist.find({ userid: user }).populate('productid');

      res.render('wishlist', { wishlist, userName });
    } else {
      console.log('User not authenticated');
      res.render('wishlist', { wishlist: wishlist || [], userName });
    }
  } catch (error) {
    console.error(error.message);

    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ ADD PRODUCT TO WISHLIST +++++++++++++++++++++++++++++++++++++++++++++++++++  
const addtoWishlist = async (req, res) => {
  try {
    const user = req.session.user_id;
    const pro_id = req.body.id;
    const wishlist = await Wishlist.findOne({ userid: user });
    const checkwishlistdata = await Wishlist.findOne({ userid: user, productid: pro_id });

    if (user) {
      if (wishlist) {
        if (checkwishlistdata) {
          res.json({ result: false });
        } else {
          await Wishlist.updateOne({ userid: user }, { $push: { productid: pro_id } });
          res.json({ result: true });
        }
      } else {
        const data = new Wishlist({
          userid: user,
          productid: [pro_id],
        });

        await data.save();
        res.json({ result: true });
      }
    } else {
      res.json({ result: false });
    }
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};

// ++++++++++++++++++++++++++++++++++++++ DELETE PRODUCT FROM WISHLIST +++++++++++++++++++++++++++++++++++++++++++++++++++  
const deleteWishproduct = async (req, res) => {
  try {
    const user = req.session.user_id;
    const pro_id = req.query.id;
    console.log(user);
    console.log(pro_id);
    await Wishlist.updateOne({ userid: user }, { $pull: { productid: pro_id } });
    res.redirect('/wishlist')

  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}

// ++++++++++++++++++++++++++++++++++++++ RENDER ABOUT US +++++++++++++++++++++++++++++++++++++++++++++++++++  
const loadAboutUs = async (req, res) => {
  try {


    res.render('aboutus')
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
}



module.exports = {

  loadSignup,
  insertNewUser,
  loginUser,
  logoutUser,
  verifymail,
  loadUserError,
  resendOTP,
  loadAcc,
  loadHome,
  loadEditAddress,
  loadAddAddress,
  addAddress,
  editAddress,
  deleteAddress,
  resetPasswordEmailLink,
  // updateProfilePhoto,
  updateUserDetails,
  loadResetPassEmail,
  loadpassReset,
  resetPasswordPost,
  loadWishlist,
  addtoWishlist,
  deleteWishproduct,
  loadAboutUs,

};

