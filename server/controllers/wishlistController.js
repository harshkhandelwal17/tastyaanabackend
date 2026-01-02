const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    // console.log("Fetching wishlist for user:", req.user);
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images weightOptions isActive',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!wishlist) {
      return res.status(200).json({ items: [] });
    }

    // Filter out inactive products
    const activeItems = wishlist.items.filter(item => 
      item.product && item.product.isActive
    );

    res.status(200).json({ items: activeItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { _id } = req.body;
    // console.log("request body:", req.body);

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Check if product exists and is active
    const product = await Product.findOne({ 
      _id, 
      isActive: true 
    });
// console.log("Product found:", product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: []
      });
    }

    // Check if product already exists in wishlist
    const existingItem = wishlist.items.find(item => 
      item.product.toString() === _id
    );

    if (existingItem) {
      // console.log("Product already in wishlist:", existingItem);
      return res.status(200).json({ 
        message: 'Product already in wishlist', 
        wishlist 
      });
    }

    // Add new item
    wishlist.items.push({ product: _id });
    wishlist.updatedAt = Date.now();
    // console.log("Wishlist before saving:", wishlist);
    await wishlist.save();

    res.status(200).json({ 
      message: 'Product added to wishlist', 
      wishlist: await wishlist.populate({
        path: 'items.product',
        select: 'name price images weightOptions',
        populate: {
          path: 'category',
          select: 'name'
        }
      }) 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID

    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    console.log(wishlist);
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    // Find item index
    const itemIndex = wishlist.items.findIndex(item => 
      item.product.toString() == productId
    );
    // console.log(itemIndex);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    // Remove item
    wishlist.items.splice(itemIndex, 1);
    wishlist.updatedAt = Date.now();
    
    await wishlist.save();

    res.status(200).json({ 
      message: 'Product removed from wishlist', 
      wishlist: await wishlist.populate({
        path: 'items.product',
        select: 'name price images weightOptions',
        populate: {
          path: 'category',
          select: 'name'
        }
      }) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
  }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const wishlist = await Wishlist.findOne({ 
      user: req.user._id,
      'items.product': productId
    });

    res.status(200).json({ 
      isInWishlist: !!wishlist 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error checking wishlist', error: error.message });
  }
};