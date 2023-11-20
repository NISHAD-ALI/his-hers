const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Order = require('../models/orderModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const multer = require("../middleware/multer");
const Cart = require('../models/cartModel')
const Product = require('../models/productModel')
require('dotenv').config();

let email2;
let nameResend;
let otpsend = 0;
let user_id;
// ++++++++++++++++++++++++++++++++++++++REGEX FOR VALIDATION EMAIL++++++++++++++++++++++++++++++++++++++++++++++

function validateEmail(email) {
  // const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regex = /^[^\s@]+@(gmail\.com|icloud\.com|yahoo\.com)$/;
  return regex.test(email);
}

// ++++++++++++++++++++++++++++++++++++++HASHING PASSWORD++++++++++++++++++++++++++++++++++++++++++++++
const hashPassword = async (password) => {
  try {
    const passHash = await bcrypt.hash(password, 10)
    return passHash
  } catch (error) {
    console.log(error.message)
  }
}
// ++++++++++++++++++++++++++++++++++++++LOGIN SIGNUP(BOTH IN SAMEPAGE)++++++++++++++++++++++++++++++++++++++++++++++
const loadSignup = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message);
  }
}







// ++++++++++++++++++++++++++++++++++++++NEW USER REGISTRATION++++++++++++++++++++++++++++++++++++++++++++++


const insertNewUser = async (req, res) => {
  try {
    // Validate email using regex
    const validEmail = validateEmail(req.body.newEmail);
    if (!validEmail) {
      return res.render('login', { message: 'Invalid email format' });
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

    if (userData) {
      // Send verification email
      sendVerifyMail(req.body.newUsername, req.body.newEmail, userData._id);
      email2 = req.body.newEmail;
      nameResend = req.body.newUsername;
      user_id = userData._id;
      res.render('otppage', { message: 'Check your email for the OTP.' });
    } else {
      res.render('login', { message: 'Failed to register' });
    }
  } catch (error) {
    console.log(error.message);
  }
};



// ++++++++++++++++++++++++++++++++++++++SEND OTP +++++++++++++++++++++++++++++++++++++++++++++


function otpgenerator() {
  otpsend = Math.floor(100000 + Math.random() * 900000);
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
  }
};
// // ++++++++++++++++++++++++++++++++++++++RESEND OTP +++++++++++++++++++++++++++++++++++++++++++++

const resendOTP = async (req, res) => {
  try {
    otp = await Math.floor(10000 + Math.random() * 90000);
    console.log(otp)
    sendVerifyMail(nameResend, email2, user_id);
    res.render('otppage', { message: 'A new OTP has been sent to your email.' });

  }

  catch (error) {
    console.log(error);
  }
}

// ++++++++++++++++++++++++++++++++++++++VERIFY OTP ++++++++++++++++++++++++++++++++++++++++++++++

const verifymail = async (req, res) => {
  try {
    console.log('Current OTP:', otpsend);
    console.log('User entered OTP:', req.body.otp);

    if (req.body.otp == otpsend) {
      const updateinfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
      console.log(updateinfo);
      // res.redirect('/login');
      res.render('login', { message: 'Your Account has been created.' });
    } else {
      res.render('otppage', { message: 'Invalid OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error.message);
  }
};



// ++++++++++++++++++++++++++++++++++++++LOGIN AFTER SIGNUP++++++++++++++++++++++++++++++++++++++++++++++
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
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });

      if (user) {
        userName = user.name;
        return res.render('home', { userName });
      }
    }
    else {
      res.render('home', { userName });
    }
  } catch (error) {
    console.log(error.message)
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
  }
}

// ++++++++++++++++++++++++++++++++++++++ 404 ERROR PAGE++++++++++++++++++++++++++++++++++++++++++++++

const loadUserError = async (req, res) => {
  try {
    res.status(404).render("404");
  } catch (error) {
    console.log(error.message);
  }
};
// ++++++++++++++++++++++++++++++++++++++ACCOUNT DASH LOAD++++++++++++++++++++++++++++++++++++++++++++++

// const loadAcc = async (req, res) => {
//   try {
//     let accountDetails;
//     let userName;
//     let UserAddress;
//     let addressId = req.query.id
//     if (req.session.user_id) {

//       const user = await User.findOne({ _id: req.session.user_id });
//       const addresses = await Address.find({ User: req.session.user_id });
//       const orderData = await Order.find({ userid: req.session.user_id }).populate("products.productId");

//       console.log("kk"+addresses);

//       if (user ) {
//         userName = user.name;
//         accountDetails = user;
//          UserAddress = addresses;
//          return res.render('account', { accountDetails, orderData, UserAddress ,userName});

//       }
//     }


//     // If user or address is not found
//     res.render('account', { userName: 'Please Login!',UserAddress:[] });
//   } catch (error) {
//     console.error(error.message);
//     res.render('account', { userName: 'An error occurred',UserAddress:[] });
//   }
// }
const loadAcc = async (req, res) => {
  try {
    let accountDetails;
    let userName;
    let UserAddress;
    let addressId = req.query.id;
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      const addresses = await Address.find({ User: req.session.user_id });
      const orderData = await Order.find({ userid: req.session.user_id })
        .populate("products.productId")
        .sort({ purchaseDate: -1 });

        let productId
      orderData.forEach(order => {

        order.products.forEach(product => {

           price = product.productId;
         console.log(price);
        });
      });




      if (user) {
        userName = user.name;
        accountDetails = user;
        UserAddress = addresses;

        return res.render('account', { accountDetails, orderData, UserAddress, userName,price });
      }
    }

    // If user or address is not found
    res.render('account', { userName: 'Please Login!', UserAddress: [] });
  } catch (error) {
    console.error(error.message);
    res.render('account', { userName: 'An error occurred', UserAddress: [] });
  }
};

// ++++++++++++++++++++++++++++++++++++++ LOAD EDIT ADDRESS +++++++++++++++++++++++++++++++++++++++++++++++++++

// const loadEditAddress = async(req,res) => {
//   try {
//     let userName
//     let userAdd
//     if (req.session.user_id) {
//       const user = await User.findOne({ _id: req.session.user_id });
//       const UserAddress = await Address.findOne({ User: user._id });
//       if (user) {
//          userName = user.name;
//          userAdd = UserAddress.address
//         return res.render('editAddress', { userName , userAdd  });
//       }
//     }
//     else{
//     res.render('editAddress', { userName });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };
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
      console.log(UserAddress);

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
    res.status(500).send('An error occurred');
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
      return res.status(400).json({ error: 'Email not found' });
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
    const resetPasswordLink = `http://localhost:3001/loadpassReset?token=${token}`;

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
          /* Add your custom email styles here */
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
    return res.status(500).json({ error: 'Internal server error' });
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
  }
}
// ++++++++++++++++++++++++++++++++++++++  RESET PASSWORD POST +++++++++++++++++++++++++++++++++++++++++++++++++++   
const resetPasswordPost = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(token);
    // Verify the token and check if it has expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashedPassword = await hashPassword(newPassword);
    // Reset the user's password
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ++++++++++++++++++++++++++++++++++++++ UPDATE USER PROFILE +++++++++++++++++++++++++++++++++++++++++++++++++++   

const updateUserDetails = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.password);
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
  resetPasswordPost
};

