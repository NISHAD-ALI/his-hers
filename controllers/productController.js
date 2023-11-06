const admin = require('../models/adminModel')
const User = require('../models/userModel')
const category = require("../models/categoryModel");
const product = require('../models/productModel')
const multer = require("../middleware/multer");



let userName
// ++++++++++++++++++++++++++++++++++++++RENDER PRODUCT MANAGEMENT++++++++++++++++++++++++++++++++++++++++++++++
 
const loadProduct = async (req, res) => {
    try {
      if (req.session.user_id) {
        const user = await User.findOne({ _id: req.session.user_id });
        console.log(user);
        if (user) {
          userName = user.name;
           const productData = await product.find({});
           res.render("productManagement", { products: productData,userName });
        }else{
          const productData = await product.find({});
          res.render("productManagement", { products: productData });
        }
      }
      else{
      const productData = await product.find({});
      res.render("productManagement", { products: productData });
      }
    } catch (error) {
      console.log(error.message);
      res.status(404).render("404");
    }
  };
  // ++++++++++++++++++++++++++++++++++++++ADD NEW PRODUCT LOAD ++++++++++++++++++++++++++++++++++++++++++++++
  
  const loadNewProduct = async (req, res) => {
    try {
      const categories = await category.find({ blocked: 0 });
      res.render("addProduct", { categories }); 
    } catch (error) {
      console.log(error.message);
    }
  };
   // ++++++++++++++++++++++++++++++++++++++ ADD FULL DETAILS OF PRODUCTS AND SAVE TO DB ++++++++++++++++++++++++++++++++++++++++++++++

   const newproduct = async (req, res) => {
    try {
      multer.productImagesUpload(req, res, async (uploadError) => {
        if (uploadError) {
          console.error(uploadError);
          return res.status(500).send('File upload error');
        }
  
        try {
          const productData = {
            productname: req.body.proName,
            quantity: req.body.qty,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            additionalInfo: req.body.additionalInfo,
            size: req.body.options,
          };
  
         
          productData.image = req.files.map((file) => file.filename);
  
          const item = new product(productData);
  
          await item.save();
          res.redirect('/admin/productManagement');
        } catch (error) {
          console.log(error.message);
         
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  };


// ++++++++++++++++++++++++++++++++++++++ BLOCK PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const blockPro = async (req, res) => {
  try {
    const blockedPro = await product.findOne({ _id: req.query.id });
    if (!blockedPro) {
      return res.status(404).send('product not found');
    }

    // Toggle the is_block status
    blockedPro.blocked = blockedPro.blocked === 0 ? 1 : 0;
    await blockedPro.save();

    res.redirect('/admin/productManagement');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error blocking/unblocking product');
  }
};
// ++++++++++++++++++++++++++++++++++++++LOAD EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const loadEditProduct = async (req, res) => {
  try {
    const catData = await category.find({ blocked: 0 });
   const editProducts = await product.findOne({ _id: req.query.id });
    res.render("editProduct", { currentData: editProducts, catData });
  } catch (error) {
    console.log(error.message);
    res.status(404).render("404");
  }
};

// ++++++++++++++++++++++++++++++++++++++ EDIT PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
// const editProduct = async (req, res) => {
//   try {
//     const productId = req.query._id;

//     const images = req.body.image; // Assuming 'image' is an array of strings in the request body

//     if (!Array.isArray(images)) {
//       console.error('The "image" field should be an array of strings');
//       res.status(400).send('Invalid image data provided.');
//       return;
//     }

//     // Create an array of valid image strings
//     const validImages = images.filter((image) => typeof image === 'string');

//     const updatedData = {
//       productname: req.body.productname,
//       quantity: req.body.quantity,
//       price: req.body.price,
//       category: req.body.category,
//       description: req.body.description,
//       additionalInfo: req.body.additionalInfo,
//       size: req.body.size,
//       image: validImages, // Use the validImages array
//     };

//     // You can optionally add validation here to ensure that required fields are not empty

//     // Find and update the product
//     const update = await product.updateOne({ _id: productId }, { $set: updatedData }, { new: true });

//     if (update.nModified > 0) {
//       // Update was successful, redirect to the appropriate page
//       res.redirect('/admin/productManagement');
//     } else {
//       // Handle the case where the update failed
//       console.error('Product update failed:', update);
//       res.status(400).send('Product update failed');
//     }
//   } catch (error) {
//     console.error('Error in editProduct:', error.message);
//     // Handle the error appropriately (e.g., send an error response)
//     res.status(500).send('An error occurred');
//   }
// };
// const editProduct = async (req, res) => {
//   try {

    
//     const productId = req.query.id; 
//     console.log(productId+'productId');
   
//     const existingProduct = await product.findOne({ _id: productId });
//    console.log(existingProduct+'existingProduct');
//     if (!existingProduct) {
//       return res.status(404).send('Product not found');
//     }

    
//     const existingData = {
//       productname: existingProduct.productname,
//       quantity: existingProduct.quantity,
//       price: existingProduct.price,
//       category: existingProduct.category,
//       description: existingProduct.description,
//       additionalInfo: existingProduct.additionalInfo,
//       size: existingProduct.size,
//       image: existingProduct.image,
    
//     };

//     // Prepare the updated product data
//     const updatedData = {
//       productname: req.body.proName || existingData.productname,
//       quantity: req.body.qty || existingData.quantity,
//       price: req.body.price || existingData.price,
//       category: req.body.category || existingData.category,
//       description: req.body.description || existingData.description,
//       additionalInfo: req.body.additionalInfo || existingData.additionalInfo,
//       size: req.body.options || existingData.size,
//       image: existingData.image, 
      
//     };

//     // Update the product with the combined data
//     const update = await product.updateOne({ _id: productId }, { $set: updatedData });
// console.log(update+"update");
//     if (update) {
//       // Update was successful, redirect to the appropriate page
//       res.redirect('/admin/productManagement');
//     } else {
//       // Handle the case where the update failed
//       console.error('Product update failed:', update);
//       res.status(400).send('Product update failed');
//     }
//   } catch (error) {
//     console.error('Error in editProduct:', error.message);
//     // Handle the error appropriately (e.g., send an error response)
//     res.status(500).send('An error occurred');
//   }
// };

const editProduct=async(req,res)=>{
  try{
      const editid=req.query.id;
      console.log(editid);
      const newDetails = {
        productname: req.body.proName,
        quantity: req.body.qty,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description,
        additionalInfo: req.body.additionalInfo,
        size: req.body.options,
        }
        
     const edit = await product.updateOne({_id: editid},newDetails)
     
      res.redirect('/admin/productManagement');

  }catch(error){
      console.log(error.message);
}
}






// ++++++++++++++++++++++++++++++++++++++ DELETE PRODUCTS ++++++++++++++++++++++++++++++++++++++++++++++
const deleteProduct = async (req, res) => {
  try {
   
    const currentData = await product.findOne({ _id: req.query.id });

    if (!currentData) {
      return res.status(404).send('Product not found');
    }
    await product.deleteOne({ _id: req.query.id });
    res.redirect('/admin/productManagement');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('An error occurred');
  }
};
// ++++++++++++++++++++++++++++++++++++++ LOAD LIST OF PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++
// const loadProductList = async (req, res) => {
//   try {
//     let userName = ''; // Initialize userName
//     if (req.session.user_id) {
//       const user = await User.findOne({ _id: req.session.user_id }); // Use 'User' with an uppercase 'U'
//       console.log(user);
//       if (user) {
//         userName = user.name;
//         const productData = await product.find({ blocked: 0 });
//         res.render('productList', { products: productData, userName });
//       }
//     }else
//     {
//       const productData = await product.find({ blocked: 0 }); // Assuming you have 'Product' model

//     res.render('productList', { products: productData});}
//   } catch (error) {
//     console.log(error.message);
//   }
// }
const loadProductList = async (req, res) => {
  try {
    let userName = ''; 
    if (req.session.user_id) {
      const user = await User.findOne({ _id: req.session.user_id });
      console.log(user);
      if (user) {
        userName = user.name;
      }
    }
    
    const productData = await product.find({ blocked: 0 }); 
    const renderData = { products: productData };

    if (userName) {
      renderData.userName = userName;
    }

    res.render('productList', renderData);
  } catch (error) {
    console.log(error.message);
  }
}

// ++++++++++++++++++++++++++++++++++++++ LOAD INDIVIDUAL PRODUCTS++++++++++++++++++++++++++++++++++++++++++++++

// const loadUserProduct = async (req, res) => {
//   try {
//     let userName = ''; // Initialize userName
//     if (req.session.user_id) {
//           const user = await User.findOne({ _id: req.session.user_id }); // Use 'User' with an uppercase 'U'
          
//           if (user) {
//             userName = user.name;
//             const viewProduct = await product.findOne({ _id: req.query.id });
  
//         if (viewProduct) {
//           const products = await product.find({ blocked: 0 });
//           res.render("productView", {  viewProduct,userName });
//           } else {
//           res.status(404).render("404");
//         }
//       }
//     }else{
//     const viewProduct = await product.findOne({ _id: req.query.id });
  
//     if (viewProduct) {
//       const products = await product.find({ blocked: 0 });
//       res.render("productView", {  viewProduct });
//       } else {
//       res.status(404).render("404");
//     }
//   } }catch (error) {
    
//     console.log(error.message);
//   }
// };
const loadUserProduct = async (req, res) => {
  let userName = ''; // Initialize userName

  if (req.session.user_id) {
    const user = await User.findOne({ _id: req.session.user_id });

    if (user) {
      userName = user.name;
    }
  }

  try {
    const viewProduct = await product.findOne({ _id: req.query.id });
  
    if (viewProduct) {
      const products = await product.find({ blocked: 0 });
      const renderData = { viewProduct, productId: req.query.id };

      if (userName) {
        renderData.userName = userName;
      }

      res.render("productView", renderData);
    } else {
      res.status(404).render("404");
    }
  } catch (error) {
    console.log(error.message);
  }
};



 module.exports = {
    loadProduct,
    loadNewProduct,
    newproduct,
    blockPro,
    loadEditProduct,
    editProduct,
    deleteProduct,
    loadProductList,
    loadUserProduct

 }