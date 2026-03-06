const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const User = require('../models/User'); // For Vendors
const MealPlan = require('../models/MealPlan'); // For Meal Plans
const mongoose = require('mongoose');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images weightOptions isActive',
        populate: { path: 'category', select: 'name' }
      })
      .populate({
        path: 'items.vendor',
        select: 'name avatar rating role isActive sellerProfile.sellerPic', // Basic vendor info
      })
      .populate({
        path: 'items.mealPlan',
        select: 'title price description type isActive images', // Basic plan info
        populate: { path: 'seller', select: 'name area' }
      }).lean();

    if (!wishlist) {
      return res.status(200).json({ items: [] });
    }

    // Filter out items where the reference is null (deleted product/vendor) or inactive
    const activeItems = wishlist.items.filter(item => {
      if (item.product) return item.product.isActive;
      if (item.vendor) return item.vendor.isActive;
      if (item.mealPlan) return item.mealPlan.isActive !== false;
      return false;
    });
    activeItems.forEach((element) => {
      if (element.vendor) {
        element.vendor.sellerPic=element.vendor.sellerProfile?.sellerPic;
        delete element.vendor.sellerProfile;
      }
    });
    res.status(200).json({ items: activeItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

// Add item to wishlist (Product or Vendor)
exports.addToWishlist = async (req, res) => {
  try {
    const { _id, type = 'product' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    let targetItem = null;
    let queryField = '';

    // Check validity based on type
    if (type === 'vendor' || type === 'store') {
      targetItem = await User.findOne({ _id, role: 'seller', isActive: true });
      queryField = 'vendor';
      if (!targetItem) return res.status(404).json({ message: 'Vendor not found' });
    } else if (type === 'plan' || type === 'mealPlan') {
      targetItem = await MealPlan.findOne({ _id });
      queryField = 'mealPlan';
      if (!targetItem) return res.status(404).json({ message: 'Meal Plan not found' });
    } else {
      // Default to product
      targetItem = await Product.findOne({ _id, isActive: true });
      queryField = 'product';
      if (!targetItem) return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }

    // Check duplicate
    // Note: item[queryField] returns ObjectId, so we convert to string
    const existingItem = wishlist.items.find(item =>
      item[queryField] && item[queryField].toString() === _id
    );

    if (existingItem) {
      return res.status(200).json({ message: 'Item already in wishlist', wishlist });
    }

    // Add new item
    const newItem = {};
    newItem[queryField] = _id;
    wishlist.items.push(newItem);

    wishlist.updatedAt = Date.now();
    await wishlist.save();

    // Re-fetch to populate
    const populatedWishlist = await Wishlist.findById(wishlist._id)
      .populate({
        path: 'items.product',
        select: 'name price images weightOptions',
        populate: { path: 'category', select: 'name' }
      })
      .populate({
        path: 'items.vendor',
        select: 'name avatar rating role'
      })
      .populate({
        path: 'items.mealPlan',
        select: 'title price description type isActive images',
        populate: { path: 'seller', select: 'name area' }
      });

    res.status(200).json({
      message: 'Added to wishlist',
      wishlist: populatedWishlist
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params; // This parameter name is likely used by frontend router, keeps it generic

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    const itemIndex = wishlist.items.findIndex(item => {
      const pId = item.product ? item.product.toString() : null;
      const vId = item.vendor ? item.vendor.toString() : null;
      const mId = item.mealPlan ? item.mealPlan.toString() : null;
      return pId === productId || vId === productId || mId === productId;
    });

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    wishlist.items.splice(itemIndex, 1);
    wishlist.updatedAt = Date.now();
    await wishlist.save();

    // Re-fetch to return clean state
    const populatedWishlist = await Wishlist.findById(wishlist._id)
      .populate({
        path: 'items.product',
        select: 'name price images weightOptions',
        populate: { path: 'category', select: 'name' }
      })
      .populate({
        path: 'items.vendor',
        select: 'name avatar rating role'
      })
      .populate({
        path: 'items.mealPlan',
        select: 'title price description type isActive images',
        populate: { path: 'seller', select: 'name area' }
      });

    res.status(200).json({
      message: 'Removed from wishlist',
      wishlist: populatedWishlist
    });

  } catch (error) {
    res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
  }
};

// Check if item is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
      $or: [
        { 'items.product': productId },
        { 'items.vendor': productId },
        { 'items.mealPlan': productId }
      ]
    });

    res.status(200).json({ isInWishlist: !!wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error checking wishlist', error: error.message });
  }
};