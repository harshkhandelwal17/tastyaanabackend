const express = require('express');
const router = express.Router();
const Grocery = require('../models/Grocery');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Get all groceries with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, sortOrder = 'asc' } = req.query;
    
    const query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Only show available products
    query.isAvailable = true;
    
    // Sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    
    const groceries = await Grocery.find(query)
      .sort(sortOptions)
      .populate('seller', 'name email');
      
    res.json(groceries);
  } catch (error) {
    console.error('Error fetching groceries:', error);
    res.status(500).json({ message: 'Error fetching groceries' });
  }
});

// Get grocery by ID
router.get('/:id', async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id).populate('seller', 'name email');
    if (!grocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    res.json(grocery);
  } catch (error) {
    console.error('Error fetching grocery item:', error);
    res.status(500).json({ message: 'Error fetching grocery item' });
  }
});

// Get groceries by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const groceries = await Grocery.find({ 
      category: category.toLowerCase(),
      isAvailable: true 
    }).populate('seller', 'name email');
    
    res.json(groceries);
  } catch (error) {
    console.error('Error fetching groceries by category:', error);
    res.status(500).json({ message: 'Error fetching groceries by category' });
  }
});

// Search groceries
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const groceries = await Grocery.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ],
      isAvailable: true
    }).populate('seller', 'name email');
    
    res.json(groceries);
  } catch (error) {
    console.error('Error searching groceries:', error);
    res.status(500).json({ message: 'Error searching groceries' });
  }
});

// Admin routes - require authentication and admin role
router.use(authenticate);

// Add new grocery item
router.post('/', async (req, res) => {
  try {
    const newGrocery = new Grocery({
      ...req.body,
      seller: req.user._id
    });
    
    const savedGrocery = await newGrocery.save();
    res.status(201).json(savedGrocery);
  } catch (error) {
    console.error('Error adding grocery item:', error);
    res.status(400).json({ message: 'Error adding grocery item' });
  }
});

// Update grocery item
router.put('/:id', async (req, res) => {
  try {
    const updatedGrocery = await Grocery.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!updatedGrocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    res.json(updatedGrocery);
  } catch (error) {
    console.error('Error updating grocery item:', error);
    res.status(400).json({ message: 'Error updating grocery item' });
  }
});

// Delete grocery item
router.delete('/:id', async (req, res) => {
  try {
    const deletedGrocery = await Grocery.findByIdAndDelete(req.params.id);
    
    if (!deletedGrocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }
    
    res.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    res.status(500).json({ message: 'Error deleting grocery item' });
  }
});

module.exports = router;
