const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Category = require("../models/categoryModel");
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Offers = require('../models/productOfferModel');
const product = require('../models/productModel');
const CategoryOffer = require('../models/categoryOfferModel');

// +++++++++++++++++++++++++++++ RENDER PRODUCT OFFER MANAGEMENT +++++++++++++++++++++++++++++++++
const loadOffers = async (req, res) => {
    try {
        const offerDB = await Offers.find({}).lean();
        if (offerDB) {
            res.render('offerManagement', { offerDB });
        }
        res.render('offerManagement', { offerDB: [] });

    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
};

// +++++++++++++++++++++++++++++ RENDER ADD OFFER PAGE ON PRODUCTS +++++++++++++++++++++++++++++++++
const loadAddOffer = async (req, res) => {
    try {
        const product = await Product.find({ blocked: 0 });
        res.render('addOffer', { product });
    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
}

// +++++++++++++++++++++++++++++ ADD OFFERS ON PRODUCTS +++++++++++++++++++++++++++++++++
const addOffers = async (req, res) => {
    try {
        const productData = await Product.findOne({ productname: req.body.product });


        console.log(productData);
        if (!productData) {
            console.log('Product not found');
            return res.redirect('/admin/offers');
        }
        const percent = req.body.percentage
        const newOffer = new Offers({
            product: productData._id,
            productname: req.body.product,
            percentage: percent,
            expiryDate: req.body.EndingDate,
        });

        await newOffer.save();
        const productDB = await product.findOne({ _id: productData._id })

        console.log(productDB);
        const offerPrice = Math.floor((productDB.price * percent) / 100);
        const updateProductPrice = await product.updateOne({ _id: productData._id }, { $set: { discountPricepro: productDB.price - offerPrice } })
        console.log(updateProductPrice);

        console.log('Offer added successfully');


        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/offers');
    }
};
// +++++++++++++++++++++++++++++ BLOCK OFFER ON PRODUCT +++++++++++++++++++++++++++++++++
const blockOff = async (req, res) => {
    try {
        const blockOffer = await Offers.findOne({ _id: req.query.id });
        if (!blockOffer) {
            return res.status(404).send('offer not found');
        }

        // Toggle the is_block status
        blockOffer.is_block = blockOffer.is_block === 0 ? 1 : 0;
        await blockOffer.save();

        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error.message);
        res.render('500')
    }
};

// +++++++++++++++++++++++++++++ DELETE OFFER ON PRODUCT +++++++++++++++++++++++++++++++++
const deleteOffer = async (req, res) => {
    try {
        const currentData = await Offers.findOne({ _id: req.query.id });

        if (!currentData) {
            return res.status(404).send('Offers not found');
        }

        // Check if the offer is expired
        if (currentData.expiryDate < new Date()) {
            console.log('Offer is expired');
        } else {
            // If the offer is not expired, update the product's discountPricepro
            const productDB = await Product.findOne({ _id: currentData.product });

            if (productDB) {
                console.log('Offer is not expired');
                // Set the discountPricepro to null
                productDB.discountPricepro = null;
                await productDB.save();
            }
        }

        // Delete the offer
        await Offers.deleteOne({ _id: req.query.id });

        res.redirect('/admin/offers');
    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
};

// +++++++++++++++++++++++++++++ RENDER CATEGORY MANAGEMENT OFFERS +++++++++++++++++++++++++++++++++
const loadCategoryOffers = async (req, res) => {
    try {
        const categoryOffers = await CategoryOffer.find({}).lean();
        res.render('categoryOffersmanagement', { categoryOffers });
    } catch (error) {
        console.log(error.message);
        res.render('categoryOffersmanagement', { categoryOffers: [] });
    }
};

// +++++++++++++++++++++++++++++ RENDER ADD CATEGORY OFFERS PAGE +++++++++++++++++++++++++++++++++
const loadAddCategoryOffer = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('addCategoryOffer', { categories });
    } catch (error) {
        res.render('500')
    }
};

// +++++++++++++++++++++++++++++ ADD OFFER ON CATEGORY +++++++++++++++++++++++++++++++++
const addCategoryOffer = async (req, res) => {
    try {



        const categoryData = await Category.findOne({ name: req.body.categories });

        if (!categoryData) {
            console.log('Category not found');
            return res.redirect('/admin/offersCat');
        }

        const percent = req.body.percentage;
        const newCategoryOffer = new CategoryOffer({
            categoryname: req.body.categories,
            category: categoryData._id,
            percentage: percent,
            expiryDate: req.body.EndingDate,
        });
        console.log(newCategoryOffer);
        await newCategoryOffer.save();
        const cattDB = await Product.findOne({ category: req.body.categories })

        console.log(cattDB);
        const offerPrice = Math.floor((cattDB.price * percent) / 100);
        const updateProductPrice = await Product.updateOne({ category: req.body.categories }, { $set: { discountPricecat: cattDB.price - offerPrice } })
        console.log(updateProductPrice);
        console.log('Category Offer added successfully');

        res.redirect('/admin/offersCat');
    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
};

// +++++++++++++++++++++++++++++ DELETE OFFER ON CATEGORY +++++++++++++++++++++++++++++++++
const deleteCategoryOffer = async (req, res) => {
    try {
        console.log('123');

        const currentData = await CategoryOffer.findOne({ _id: req.query.id });

        const productDB = await Product.find({ category: currentData.categoryname });

        console.log(productDB);

        if (productDB.length > 0) {
            console.log('Offer is not expired');

            // Iterate through each product and update the discountPricecat field
            for (const product of productDB) {
                if (product.discountPricecat) {
                    // Delete the field
                    product.discountPricecat = null

                    // Save the updated document
                    await product.save();
                    console.log(product);
                }
            }
        }


        await CategoryOffer.deleteOne({ _id: req.query.id });

        res.redirect('/admin/offersCat');
    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
};


module.exports = {
    loadOffers,
    loadAddOffer,
    addOffers,
    blockOff,
    deleteOffer,
    loadCategoryOffers,
    loadAddCategoryOffer,
    addCategoryOffer,
    deleteCategoryOffer

}