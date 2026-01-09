const Cart = require('../models/Cart');
const Product = require('../models/Product');

const cartController = {
  // Get user's cart
  getCart: async (req, res) => {
    try {
      let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name images weightOptions rating description category tags stockQty isAvailable featured reviewCount soldCount seller',
        populate: [
          {
            path: 'category',
            select: 'name'  // Just get the name from Category model
          },
          {
            path: 'seller',
            select: 'name email avatar sellerProfile.storeName sellerProfile.storeMedia'
          }
        ]
      })
      .populate({
        path: 'items.seller',
        select: 'name email avatar sellerProfile.storeName sellerProfile.storeMedia'
      });

      if (!cart) {
        cart = new Cart({ user: req.user.id, items: [] });
        await cart.save();
      }
      res.json({ cart });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const { productId, payload, quantity = 1 } = req.body;
      
      if (!productId) {
        return res.status(400).json({ 
          success: false,
          message: 'Product ID is required' 
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const weight = payload?.weight || "250g";
      const collegeName = payload?.collegeName; // Extract college name if provided
      
      // Verify product and weight option
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      if (!product.isActive) {
        return res.status(400).json({ 
          success: false,
          message: 'Product is not available' 
        });
      }

      // Check product availability based on time and day
      if (!product.isAvailableNow()) {
        const nextAvailable = product.getNextAvailableTime();
        return res.status(400).json({ 
          success: false,
          message: `This item is currently not available. Available ${nextAvailable ? `on ${nextAvailable.day} between ${nextAvailable.startTime} - ${nextAvailable.endTime}` : 'time not set'}`,
          availabilityInfo: nextAvailable
        });
      }

      // Auto-detect if product is college-branded and update if needed
      const isCollegeBrandedByContent = product.title?.toLowerCase().includes('college') || 
                                       product.name?.toLowerCase().includes('college') ||
                                       product.tags?.some(tag => tag.toLowerCase().includes('college'));
      
      if (isCollegeBrandedByContent && !product.isCollegeBranded) {
        await Product.findByIdAndUpdate(productId, { isCollegeBranded: true });
        product.isCollegeBranded = true; // Update local instance
      }    
      
     
      
      // Find weight option - try exact match first, then use first available if not found
      let weightOption = product.weightOptions?.find(w => w.weight === weight);
      
      // If weight option not found, use first available weight option
      if (!weightOption && product.weightOptions && product.weightOptions.length > 0) {
        weightOption = product.weightOptions[0];
       
      }
      
      // If still no weight option and product has no weightOptions, create a default one
      if (!weightOption) {
        // For products without weightOptions, use product price directly
        weightOption = {
          weight: weight || "1 Plate",
          price: product.discountPrice || product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          stock: product.stockQty || 999
        };
      }

      if (weightOption.stock < quantity) {
        return res.status(400).json({ 
          success: false,
          message: 'Insufficient stock' 
        });
      }
    
      let cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
        cart = new Cart({ user: req.user.id, items: [] });
      }

      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && item.weight === weight
      );

      if (existingItemIndex > -1) {
        // Update quantity and ensure seller is set
        cart.items[existingItemIndex].quantity += quantity;
        if (!cart.items[existingItemIndex].seller && product.seller) {
          cart.items[existingItemIndex].seller = product.seller;
        }
        
       
      } else {
        

        // Add new item with vendor/seller information
        cart.items.push({
          product: productId,
          weight: weightOption.weight, // Use the actual weight from weightOption
          quantity,
          price: weightOption.price,
          originalPrice: weightOption.originalPrice || weightOption.price,
          isCollegeBranded: product.isCollegeBranded || false,
          seller: product.seller, // Store seller/vendor ID for proper association
          ...(collegeName && { collegeName }) // Add college name if provided
        });

        // Debug: Log the actual item being added
      }

      // Calculate totals
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0);
      cart.totalDiscount = cart.items.reduce((total, item) => 
        total + ((item.originalPrice - item.price) * item.quantity), 0);

      cart.updatedAt = new Date();
      await cart.save();

     

      const populatedCart = await Cart.findById(cart._id)
        .populate({
          path: 'items.product',
          select: 'name images weightOptions rating description category tags stockQty isAvailable featured reviewCount soldCount seller',
          populate: [
            {
              path: 'seller',
              select: 'name email avatar sellerProfile.storeName sellerProfile.storeMedia'
            }
          ]
        })
        .populate({
          path: 'items.seller',
          select: 'name email avatar sellerProfile.storeName sellerProfile.storeMedia'
        });

      res.json({
        success: true,
        message: 'Item added to cart',
        cart: populatedCart
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error while adding to cart' 
      });
    }
  },

  // Update cart item
  updateCartItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Valid quantity is required' 
        });
      }

      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({ 
          success: false,
          message: 'Cart not found' 
        });
      }

      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ 
          success: false,
          message: 'Item not found in cart' 
        });
      }

      if (quantity <= 0) {
        // Remove item
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
      }

      // Recalculate totals
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0);
      cart.totalDiscount = cart.items.reduce((total, item) => 
        total + ((item.originalPrice - item.price) * item.quantity), 0);

      cart.updatedAt = new Date();
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate('items.product', 'name images weightOptions rating description category tags stockQty isAvailable featured reviewCount soldCount');

      res.json({
        success: true,
        message: 'Cart updated successfully',
        cart: populatedCart
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error while updating cart' 
      });
    }
  },

  // Update item quantity in cart
  updateQuantity: async (req, res) => {
    try {
      const { userId, itemId } = req.params;
      const { quantity } = req.body;
      
      // Verify the user matches the authenticated user (security check)
      if (req.user.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      if (!quantity || quantity < 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      // If quantity is 0, remove the item
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
      }

      // Recalculate totals
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0);
      cart.totalDiscount = cart.items.reduce((total, item) => 
        total + ((item.originalPrice - item.price) * item.quantity), 0);

      cart.updatedAt = new Date();
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({
          path: 'items.product',
          select: 'name images weightOptions rating description category tags stockQty isAvailable featured reviewCount soldCount seller',
          populate: {
            path: 'category',
            select: 'name'
          }
        });

      res.json({
        message: 'Cart updated successfully',
        cart: populatedCart
      });
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      res.status(500).json({ message: error.message });
    }
  },

   // Delete specific item from cart
deleteOneCart: async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    // Verify the user matches the authenticated user (security check)
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Remove the item from cart
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.totalAmount = cart.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0);
    cart.totalDiscount = cart.items.reduce((total, item) => 
    {
      if(item?.originalPrice)return total + ((item.originalPrice - item.price) * item.quantity)
        else return 0;
      }
      , 0);

    
    cart.updatedAt = new Date();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images weightOptions rating');

    res.json({
      message: 'Item deleted from cart successfully',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ message: error.message });
  }
},
  // Clear cart
  clearCart: async (req, res) => {
    try {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { 
          items: [], 
          totalAmount: 0, 
          totalDiscount: 0,
          updatedAt: new Date()
        }
      );

      res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = cartController;
