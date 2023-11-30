const multer = require('multer');
const path = require('path');

const productImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/products/images'));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname // Use the original name of the file
    );
  },
});

const productImagesUpload = multer({
  storage: productImageStorage,
}).array('images', 4);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/products/images'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original name of the file
  },
});

const upload = multer({ storage: storage });

module.exports = {
  productImagesUpload,
  upload,
};
