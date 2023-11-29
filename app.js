const mongoose = require('mongoose');
const nocache = require('nocache');
const path = require('path')
const express = require('express')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute');
const session = require('express-session');
const config = require('../HISHERS/config/config')
const app = express();
const dotenv = require('dotenv');
dotenv.config();


app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}));






mongoose.connect(process.env.MONGODBURL)
  .then(() => {
    console.log('mongoDb connected');
  })
  .catch(() => {
    console.log('failed to connect');
  })





app.use('/', userRoute);
app.use('/admin', adminRoute);
app.get('*', (req, res) => {
  try {
    res.render('404')
  } catch (error) {
    console.log(error.message);
  }
})



app.listen(3001, () => console.log('server started'))

