const multer = require('multer');
const path = require('path');

const productImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/products/images'));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + '-' + Date.now() + path.extname(file.originalname)
      );
    },
  });

  
  const productImagesUpload = multer({
    storage: productImageStorage,
  }).array('images', 4); // 'images' is the field name, and 4 is the maximum number of files
  



  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/products/images'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Rename the file to avoid overwriting
    },
  });
  
  const upload = multer({ storage: storage });
  module.exports = { 
    productImagesUpload,
    upload,
  };
  