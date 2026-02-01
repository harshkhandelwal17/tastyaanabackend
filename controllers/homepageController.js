const Product = require('../models/Product');
const MealPlan = require('../models/MealPlan');
const Category = require('../models/Category');
const DailyMeal = require('../models/DailyMeal');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const Banner = require('../models/Banner');

// Helper function to check if a category is food-related
const isFoodCategory = (categoryName) => {
  if (!categoryName) return false;
  const name = categoryName.toLowerCase();

  // Food-related keywords
  const foodKeywords = [
    'foodzone', 'food', 'fast food', 'sweets', 'dessert',
    'nashta', 'breakfast', 'chat', 'chaat', 'thali',
    'combo', 'paratha', 'chinese', 'pasta', 'snacks',
    'biryani', 'pizza', 'burger', 'rolls', 'north indian',
    'south indian', 'continental', 'street food', 'beverage',
    'drinks', 'juice', 'coffee', 'tea', 'bakery', 'biscuits',
    'vrat', 'meal', 'tiffin', 'lunch', 'dinner', 'snack'
  ];

  // Non-food categories to exclude
  const nonFoodKeywords = [
    'stationery', 'stationary', 'phones', 'real estate',
    'grocery', 'vegetables', 'dairy', 'aata', 'rice', 'dal',
    'masala', 'oil', 'medicine', 'courier', 'laundry'
  ];

  // Check if it's explicitly non-food
  if (nonFoodKeywords.some(keyword => name.includes(keyword))) {
    return false;
  }

  // Check if it's food-related
  return foodKeywords.some(keyword => name.includes(keyword));
};

const homepageController = {
  // Get homepage data - all data in one endpoint
  getHomepageData: async (req, res) => {
    try {
      const { lat, lng } = req.query;

      // FORCE NO CACHE (Debugging)
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      let nearbySellerIds = [];
      let isServiceable = true; // Default to true if no location provided (backend safe default)
      let availableServices = ['food', 'tiffin', 'rental', 'grocery']; // Default all

      // 1. LOCATION & SERVICEABILITY CHECK
      // 1. LOCATION & SERVICEABILITY CHECK
      if (lat && lng) {
        const userLoc = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };

        console.log("📍 [Homepage Debug] SANITY CHECK START");
        console.log("📍 [Homepage Debug] UserLoc constructed:", JSON.stringify(userLoc));

        // Sanity Check 1: Count total sellers in DB
        const totalSellers = await User.countDocuments({ role: 'seller' });
        console.log(`📍 [Homepage Debug] Total Sellers in DB: ${totalSellers}`);

        // Sanity Check 2: Try finding ONE known seller (from debug output)
        const demoSeller = await User.findOne({ _id: '6977a48aef8105e537f53c36' });
        console.log(`📍 [Homepage Debug] Demo Seller Found: ${!!demoSeller}`);

        // Query 1: Nearby FOOD/TIFFIN Sellers (Strict 5km Limit)
        const nearbyFoodSellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: userLoc,
              $maxDistance: 5000 // 5km for Food/Tiffin
            }
          }
        }).select('_id');
        const foodSellerIds = nearbyFoodSellers.map(u => u._id);

        // Query 2: Nearby RENTAL/GROCERY Sellers (Expanded 100km Limit - City Wide)
        const nearbyRentalSellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: userLoc,
              $maxDistance: 100000 // 100km (City-Wide Service for Rentals)
            }
          }
        }).select('_id');
        const rentalSellerIds = nearbyRentalSellers.map(u => u._id);

        console.log(`📍 [Homepage Debug] Lat: ${lat}, Lng: ${lng}`);
        console.log(`📍 [Homepage Debug] Food Sellers: ${foodSellerIds.length}`);
        console.log(`📍 [Homepage Debug] Rental Sellers: ${rentalSellerIds.length}`);

        // Determine global serviceability
        if (rentalSellerIds.length === 0) {
          console.log("📍 [Homepage Debug] No rental sellers found. Serviceable: FALSE");
          isServiceable = false;
          availableServices = [];
        } else {
          // Check availability based on respective radii
          const [hasFood, hasTiffin, hasGrocery] = await Promise.all([
            // Food within 5km?
            Product.exists({ seller: { $in: foodSellerIds }, isActive: true, category: { $ne: 'grocery' } }),
            // Tiffin within 5km?
            MealPlan.exists({ seller: { $in: foodSellerIds }, status: 'active' }),
            // Grocery within 5km? (Aligned with Food for now)
            Product.exists({ seller: { $in: foodSellerIds }, isActive: true, category: 'grocery' })
          ]);

          const hasRental = rentalSellerIds.length > 0; // Relaxed check: Unlock if ANY seller is in 100km

          console.log(`📍 [Homepage Debug] Flags - Food: ${!!hasFood}, Rental: ${hasRental}`);

          availableServices = [];

          if (hasFood) availableServices.push('food');
          if (hasGrocery) availableServices.push('grocery');
          if (hasTiffin) availableServices.push('tiffin', 'ghar-ka-khana');
          if (hasRental) availableServices.push('rental');

          console.log(`📍 [Homepage Debug] Available Services: ${availableServices.join(', ')}`);

          // If no services available
          if (availableServices.length === 0) {
            isServiceable = false;
          }
        }
      }

      // 2. FETCH DATA (Conditioned on Loc)
      // If unserviceable, we can return empty data immediately to save resources
      if (!isServiceable && lat && lng) {
        return res.json({
          success: true,
          data: {
            featuredProducts: [],
            mealPlans: [],
            categories: [],
            todaysMeal: null,
            stats: await homepageController.calculateStats(),
            testimonials: await homepageController.getTestimonials(),
            serviceability: {
              isServiceable: false,
              availableServices: [],
              message: "We are coming soon to your area!"
            }
          }
        });
      }

      const productQuery = { featured: true, isActive: true };
      const mealPlanQuery = { status: 'active' };

      if (lat && lng && nearbySellerIds.length > 0) {
        productQuery.seller = { $in: nearbySellerIds };
        mealPlanQuery.seller = { $in: nearbySellerIds };
      }

      const [
        featuredProducts,
        mealPlans,
        categories,
        todaysMeal,
        stats,
        testimonials
      ] = await Promise.all([
        // Featured Products
        Product.find(productQuery)
          .populate('category', 'name slug')
          .sort({ createdAt: -1 })
          .limit(10) // Optimization: limit
          .lean(),

        // Meal Plans
        MealPlan.find(mealPlanQuery)
          .sort({ tier: 1, createdAt: -1 })
          .limit(6)
          .lean(),

        // Categories - Return all active categories
        Category.find({
          isActive: true
        })
          .sort({ sortOrder: 1, name: 1 })
          .lean(),

        // Today's Meal (Simpler check for now)
        DailyMeal.findOne({
          date: new Date().toISOString().split('T')[0],
          isActive: true
        }).lean(),

        // Stats (calculated from database)
        homepageController.calculateStats(),

        // Testimonials
        homepageController.getTestimonials()
      ]);

      res.json({
        success: true,
        data: {
          featuredProducts,
          mealPlans,
          categories,
          todaysMeal,
          stats,
          testimonials,
          serviceability: {
            isServiceable,
            availableServices,
            message: isServiceable ? "Service available" : "Coming soon",
            debugInfo: {
              foodCount: foodSellerIds.length,
              rentalCount: rentalSellerIds.length,
              latReceived: lat,
              lngReceived: lng
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching homepage data',
        error: error.message
      });
    }
  },

  // Get featured products
  getFeaturedProducts: async (req, res) => {
    try {
      const { limit = 8, lat, lng } = req.query;

      const query = {
        featured: true,
        isActive: true
      };

      // Location Filter
      if (lat && lng) {
        const nearbySellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: 5000 // 5km radius
            }
          }
        }).select('_id');

        const sellerIds = nearbySellers.map(s => s._id);

        // If no sellers found nearby, return empty
        if (sellerIds.length === 0) {
          return res.json({
            success: true,
            data: []
          });
        }

        query.seller = { $in: sellerIds };
      }

      const products = await Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching featured products',
        error: error.message
      });
    }
  },

  // Get homepage meal plans
  getHomepageMealPlans: async (req, res) => {
    try {
      const mealPlans = await MealPlan.find({
        status: 'active'
      })
        .sort({ tier: 1, createdAt: -1 })
        .limit(3)
        .lean();

      // Add savings calculation
      const enrichedPlans = mealPlans.map(plan => ({
        ...plan,
        savings: {
          tenDays: plan.pricing.oneDay * 10 - plan.pricing.tenDays,
          thirtyDays: plan.pricing.oneDay * 30 - plan.pricing.thirtyDays
        }
      }));

      res.json({
        success: true,
        data: enrichedPlans
      });
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching meal plans',
        error: error.message
      });
    }
  },

  // Get homepage categories - returns all active categories
  getHomepageCategories: async (req, res) => {
    try {
      const categories = await Category.find({
        isActive: true
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  },

  // Get Food Categories for Food Homepage - ONLY FOOD-RELATED
  getFoodCategories: async (req, res) => {
    try {
      const categories = await Category.find({
        isActive: true
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      // Filter only food-related categories
      const foodCategories = categories.filter(cat => isFoodCategory(cat.name));

      // If no food categories found, return some default food categories
      if (foodCategories.length === 0) {
        return res.json({
          success: true,
          data: [
            { _id: '1', name: "Biryani", image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_288,h_360/v1674029845/PC_Creative%20refresh/3D_bau/banners_new/Biryani.png" },
            { _id: '2', name: "Pizza", image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_288,h_360/v1674029856/PC_Creative%20refresh/3D_bau/banners_new/Pizza.png" },
            { _id: '3', name: "Burger", image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_288,h_360/v1674029845/PC_Creative%20refresh/3D_bau/banners_new/Burger.png" },
            { _id: '4', name: "Thali", image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_288,h_360/v1674029858/PC_Creative%20refresh/3D_bau/banners_new/Thalis.png" }
          ]
        });
      }

      res.json({
        success: true,
        data: foodCategories
      });
    } catch (error) {
      console.error('Error fetching food categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching food categories',
        error: error.message
      });
    }
  },

  // Get today's special meal
  getTodaysSpecial: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const todaysMeal = await DailyMeal.findOne({
        date: today,
        isActive: true
      }).lean();

      if (!todaysMeal) {
        // Return a default special meal if none exists for today
        return res.json({
          success: true,
          data: {
            title: "Special Homestyle Meal",
            description: "A delicious meal prepared with fresh ingredients and traditional recipes.",
            price: 150,
            image: "../../assets/thali.png",
            rating: 4.8,
            reviewCount: 120
          }
        });
      }

      res.json({
        success: true,
        data: todaysMeal
      });
    } catch (error) {
      console.error('Error fetching today\'s special:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching today\'s special',
        error: error.message
      });
    }
  },

  // Get homepage stats
  getHomepageStats: async (req, res) => {
    try {
      const stats = await homepageController.calculateStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stats',
        error: error.message
      });
    }
  },

  // Get testimonials
  getTestimonials: async (req, res) => {
    try {
      const testimonials = await homepageController.getTestimonials();

      res.json({
        success: true,
        data: testimonials
      });
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching testimonials',
        error: error.message
      });
    }
  },

  // Helper method to calculate stats
  calculateStats: async () => {
    try {
      const [
        totalCustomers,
        totalOrders,
        totalProducts,
        averageRating
      ] = await Promise.all([
        User.countDocuments({ role: 'buyer' }),
        Order.countDocuments({ status: { $in: ['delivered', 'completed'] } }),
        Product.countDocuments({ isActive: true }),
        Review.aggregate([
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ])
      ]);

      return {
        customers: totalCustomers,
        meals: totalOrders,
        satisfaction: Math.round((averageRating[0]?.avgRating || 4.5) * 20), // Convert to percentage
        delivery: 99 // This could be calculated from order delivery times
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        customers: 5000,
        meals: 25000,
        satisfaction: 98,
        delivery: 99
      };
    }
  },

  // Helper method to get testimonials
  getTestimonials: async () => {
    try {
      // Get recent reviews with high ratings
      const recentReviews = await Review.find({
        rating: { $gte: 4 }
      })
        .populate('user', 'name')
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      // If we have real reviews, format them
      if (recentReviews.length > 0) {
        return recentReviews.map(review => ({
          id: review._id,
          name: review.userId?.name || 'Anonymous',
          role: 'Customer',
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.name || 'Customer')}&background=random`,
          content: review.comment,
          rating: review.rating
        }));
      }

      // Return default testimonials if no reviews exist
      return [
        {
          id: 1,
          name: "Priya Sharma",
          role: "Working Professional",
          image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          content: "Tastyaana has been a game-changer for me. The meals taste just like home and are delivered right on time. Perfect for my busy schedule!",
          rating: 5
        },
        {
          id: 2,
          name: "Rahul Verma",
          role: "Student",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          content: "As a student living away from home, Tastyaana brings me the comfort of home-cooked meals. The variety and quality are amazing!",
          rating: 5
        },
        {
          id: 3,
          name: "Anjali Patel",
          role: "Homemaker",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          content: "I love how fresh and healthy the meals are. My family enjoys the variety and I appreciate the convenience. Highly recommended!",
          rating: 5
        }
      ];
    } catch (error) {
      console.error('Error getting testimonials:', error);
      return [];
    }
  },

  // Get hero slides data
  getHeroSlides: async (req, res) => {
    try {
      const slides = [
        {
          id: "slide_01",
          title: "The Gold Standard of Tiffins",
          subtitle: "Indore's Elite Home Kitchens",
          description: "Curated homestyle meals prepared with handpicked ingredients. Zero compromise on health.",
          // 3D Transparent PNG for floating effect
          image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560646/thali_dtajpw.png",
          // Background: Minimalist aesthetic table setting
          imagebg: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1600&auto=format",
          tag: "EXECUTIVE SELECTION",
          cta: "Order Now",
          ctaLink: "/ghar/ka/khana",
          overlay: "from-slate-950/90 via-slate-950/40 to-transparent"
        },
        {
          id: "slide_02",
          title: "Commute Without Limits",
          subtitle: "Premium Bike & Scooty Rental",
          description: "Indore's most reliable fleet. Verified vehicles, Transparent pricing, Zero hidden fees.",
          image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1766867491/Rental_vehical_adx2v7.png",
          // Background: Clean urban asphalt texture
          imagebg: "https://images.unsplash.com/photo-1449491026613-f52148080d9e?q=80&w=1600&auto=format",
          tag: "SMART MOBILITY",
          cta: "Book a Ride",
          ctaLink: "/rental",
          overlay: "from-slate-950/95 via-slate-900/50 to-transparent"
        },
        {
          id: "slide_03",
          title: "Farm to Table, Within 60m",
          subtitle: "Organic Produce Standards",
          description: "Experience the freshness of Indore's local farms delivered to your kitchen instantly.",
          image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560646/groceries_klnxdn.png",
          // Background: Moody high-contrast farm soil/greens
          imagebg: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format",
          tag: "QUALITY ASSURED",
          cta: "Shop Store",
          ctaLink: "/grocery",
          overlay: "from-slate-950/95 via-slate-950/50 to-transparent"
        }
      ];
      res.json({ success: true, data: slides });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // Get stores/sellers for homepage
  // Get stores/sellers for homepage
  getStores: async (req, res) => {
    try {
      const { limit = 20, page = 1, type, lat, lng } = req.query;
      console.log("getStores Query Params:", { limit, page, type, lat, lng });
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const pipeline = [];

      // 1. Geo / Match Stage
      // 1. Geo / Match Stage
      if (lat && lng) {
        pipeline.push({
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance",
            maxDistance: 100000, // 100km City-Wide (filtered later)
            query: { role: 'seller', isActive: true, isBlocked: false },
            spherical: true
          }
        });
      } else {
        pipeline.push({ $match: { role: 'seller', isActive: true, isBlocked: false } });
      }

      // 2. Filter Type (Frontend Filter)
      if (type) {
        // DEBUG: Log before filtering
        console.log("Filtering by type:", type);

        // Use partial match instead of strict start/end to be safe
        const typeRegex = new RegExp(type, 'i');

        pipeline.push({
          $match: {
            'sellerProfile.sellerType': {
              // Match if ANY element in the array matches the regex
              $elemMatch: { $regex: typeRegex }
            }
          }
        });
      }

      // 3. Filter Closed Stores
      pipeline.push({ $match: { 'sellerProfile.storeStatus': { $ne: 'closed' } } });

      // 4. Lookups for Inventory (Products & Vehicles & MealPlans)
      pipeline.push({
        $lookup: {
          from: 'products',
          let: { sellerId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$seller', '$$sellerId'] }, isActive: true } },
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: 'hasProducts'
        }
      });

      pipeline.push({
        $lookup: {
          from: 'mealplans',
          let: { sellerId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$seller', '$$sellerId'] }, status: 'active' } },
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: 'hasMealPlans'
        }
      });

      pipeline.push({
        $lookup: {
          from: 'vehicles',
          let: { sellerId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$sellerId', '$$sellerId'] }, status: 'active' } },
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: 'hasVehicles'
        }
      });

      // 5. MASTER FILTER: Effectiveness & Serviceability
      // Logic:
      // A. Store must NOT be empty (Must have Products OR Vehicles OR MealPlans)
      // B. Serviceability Radius:
      //    - If has Vehicles -> Allow up to 100km
      //    - If ONLY Products/MealPlans -> Strict 5km limit
      if (lat && lng) {
        pipeline.push({
          $match: {
            $expr: {
              $and: [
                // A. Not Empty
                {
                  $or: [
                    { $gt: [{ $size: "$hasProducts" }, 0] },
                    { $gt: [{ $size: "$hasVehicles" }, 0] },
                    { $gt: [{ $size: "$hasMealPlans" }, 0] }
                  ]
                },
                // B. Radius Logic
                {
                  $or: [
                    { $lte: ["$distance", 5000] }, // Everyone allowed within 5km
                    { $gt: [{ $size: "$hasVehicles" }, 0] } // Vehicles allowed up to 100km
                  ]
                }
              ]
            }
          }
        });
      } else {
        // No location? Just check not empty
        pipeline.push({
          $match: {
            $expr: {
              $or: [
                { $gt: [{ $size: "$hasProducts" }, 0] },
                { $gt: [{ $size: "$hasVehicles" }, 0] },
                { $gt: [{ $size: "$hasMealPlans" }, 0] }
              ]
            }
          }
        });
      }

      // 6. Facet for Total Count & Data Pagination
      let sortStage = { 'sellerProfile.ratings.average': -1, createdAt: -1 };
      if (lat && lng) {
        sortStage = { distance: 1 };
      }

      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                name: 1, email: 1, avatar: 1, sellerProfile: 1,
                rating: 1, addresses: 1, priceRange: 1, location: 1, createdAt: 1
              }
            }
          ]
        }
      });

      const aggregationResult = await User.aggregate(pipeline);
      const sellers = aggregationResult[0].data || [];
      const total = aggregationResult[0].metadata[0] ? aggregationResult[0].metadata[0].total : 0;

      // DEBUG: Log returned sellers types
      if (type) {
        console.log(`[getStores] Filtered by '${type}'. Found ${sellers.length} sellers.`);
        console.log(sellers.map(s => `${s.name} (${s.sellerProfile?.sellerType})`).join(', '));
      }

      // 6. Optimization: Get DETAILED products for the fetched sellers
      const sellerIds = sellers.map(s => s._id);

      const allProducts = await Product.find({
        seller: { $in: sellerIds },
        isActive: true
      })
        .select('seller category name title images salesCount views discount discountPrice nutritionInfo isOrganic link')
        .populate('category', 'name slug image icon')
        .sort({ salesCount: -1, views: -1 })
        .lean();

      // 7. Group products
      const productsBySeller = {};
      allProducts.forEach(product => {
        const sId = product.seller.toString();
        if (!productsBySeller[sId]) {
          productsBySeller[sId] = [];
        }
        productsBySeller[sId].push(product);
      });

      // 8. Map to Detailed Store Objects
      const storesWithDetails = sellers.map((seller) => {
        const products = productsBySeller[seller._id.toString()] || [];

        // Unique Categories
        const categories = [];
        const categoryMap = new Map();
        products.forEach(product => {
          if (product.category && !categoryMap.has(product.category._id.toString())) {
            categoryMap.set(product.category._id.toString(), product.category);
            categories.push({
              id: product.category._id,
              name: product.category.name,
              slug: product.category.slug,
              image: product.category.image,
              icon: product.category.icon
            });
          }
        });

        // Cover Image Logic
        let coverImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
        if (products.length > 0) {
          const productWithImage = products.find(p => p.images && p.images.length > 0 && p.images[0].url);
          if (productWithImage) coverImage = productWithImage.images[0].url;
        }

        let storeType = 'Store';
        if (categories.length > 0) {
          storeType = categories[0].name;
        } else if (seller.sellerProfile?.sellerType?.length > 0) {
          const st = seller.sellerProfile.sellerType[0];
          storeType = st.charAt(0).toUpperCase() + st.slice(1);
        }

        const hasOffer = products.some(p => p.discount > 0 || p.discountPrice);

        return {
          id: seller._id,
          name: seller.sellerProfile?.storeName || seller.name,
          logo: seller.sellerProfile?.storeMedia?.logo || seller.avatar,
          rating: (seller.sellerProfile?.ratings?.average || seller.rating || 4.5).toFixed(1),
          cover: coverImage,
          type: storeType,
          time: '25 min',
          offer: hasOffer ? 'Best Seller' : '',
          categories,
          productCount: products.length,
          isVerified: seller.sellerProfile?.isVerified || false,
          storeStatus: seller.sellerProfile?.storeStatus || 'open',
          storeDescription: seller.sellerProfile?.storeDescription || '',
          area: seller.addresses?.[0]?.city || 'Indore',
          priceRange: seller.sellerProfile?.priceRange || {}
        };
      });

      res.json({
        success: true,
        data: storesWithDetails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stores',
        error: error.message
      });
    }
  },

  // Get categories with seller count
  getCategoriesWithSellers: async (req, res) => {
    try {
      const { lat, lng } = req.query;

      // --- SERVICEABILITY CHECK (Global) ---
      // FORCE NO CACHE (Debugging)
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      // --- SERVICEABILITY CHECK (Global) ---
      let isServiceable = true;
      let availableServices = ['food', 'tiffin', 'rental', 'grocery'];

      // Debug data placeholders
      let foodSellerIdsCount = 0;
      let rentalSellerIdsCount = 0;

      if (lat && lng) {
        const userLoc = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };

        // Query 1: Nearby FOOD/TIFFIN Sellers (Strict 5km Limit)
        const nearbyFoodSellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: userLoc,
              $maxDistance: 5000 // 5km for Food/Tiffin
            }
          }
        }).select('_id');
        const foodSellerIds = nearbyFoodSellers.map(u => u._id);
        foodSellerIdsCount = foodSellerIds.length;

        // Query 2: Nearby RENTAL/GROCERY Sellers (Expanded 100km Limit - City Wide)
        const nearbyRentalSellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: userLoc,
              $maxDistance: 100000 // 100km (City-Wide Service for Rentals)
            }
          }
        }).select('_id');
        const rentalSellerIds = nearbyRentalSellers.map(u => u._id);
        rentalSellerIdsCount = rentalSellerIds.length;

        if (rentalSellerIds.length === 0) {
          isServiceable = false;
          availableServices = [];
        } else {
          // Check availability based on respective radii
          const [hasProducts, hasTiffin] = await Promise.all([
            // ANY Product within 5km? (Food or Grocery)
            Product.exists({ seller: { $in: foodSellerIds }, isActive: true }),
            // Tiffin within 5km?
            MealPlan.exists({ seller: { $in: foodSellerIds }, status: 'active' })
          ]);

          const hasRental = rentalSellerIds.length > 0; // Relaxed check: Unlock if ANY seller is in 100km

          availableServices = [];

          if (hasProducts) availableServices.push('food', 'grocery');
          if (hasTiffin) availableServices.push('tiffin', 'ghar-ka-khana');
          if (hasRental) availableServices.push('rental');

          // If no services available
          if (availableServices.length === 0) {
            isServiceable = false;
          }
        }
      }

      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      const categoriesWithDetails = await Promise.all(
        categories.map(async (category) => {
          // Get products in this category
          const products = await Product.find({
            category: category._id,
            isActive: true
          })
            .select('seller')
            .lean();

          // Get unique sellers
          const sellerIds = [...new Set(products.map(p => p.seller?.toString()).filter(Boolean))];
          const sellerCount = sellerIds.length;

          // Get product count
          const productCount = products.length;

          return {
            id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image || category.icon,
            icon: category.icon,
            sellerCount,
            productCount,
            sortOrder: category.sortOrder || 0
          };
        })
      );

      res.json({
        success: true,
        data: categoriesWithDetails,
        serviceability: {
          isServiceable,
          availableServices,
          message: isServiceable ? "Service available" : "Coming soon",
          // Debug info for frontend if needed
          debugInfo: {
            foodCount: foodSellerIdsCount,
            rentalCount: rentalSellerIdsCount,
            latReceived: lat,
            lngReceived: lng
          }
        }
      });
    } catch (error) {
      console.error('Error fetching categories with sellers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  },

  // Get Quick Actions - Popular products/categories for quick access
  getQuickActions: async (req, res) => {
    try {
      const { lat, lng } = req.query;
      const query = { isActive: true };

      // Location Filter
      if (lat && lng) {
        const nearbySellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: 5000 // 5km radius
            }
          }
        }).select('_id');
        const sellerIds = nearbySellers.map(s => s._id);
        if (sellerIds.length > 0) {
          query.seller = { $in: sellerIds };
        } else {
          // No sellers nearby, return empty logical data but maybe keep defaults? 
          // Better to return empty specific products but we can keep defaults later
          query.seller = { $in: [] };
        }
      }

      // Get popular products by sales/view count
      const popularProducts = await Product.find(query)
        .select('title name images category')
        .populate('category', 'name slug')
        .sort({ salesCount: -1, views: -1 })
        .limit(8)
        .lean();

      // Map products to quick action format
      const quickActions = popularProducts.map((product, index) => {
        // Map product names to icons (fallback to category icon)
        const iconMap = {
          'thali': 'https://cdn-icons-png.flaticon.com/512/1895/1895685.png',
          'pizza': 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
          'medicine': 'https://cdn-icons-png.flaticon.com/512/883/883356.png',
          'burger': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
          'courier': 'https://cdn-icons-png.flaticon.com/512/4456/4456995.png',
          'cake': 'https://cdn-icons-png.flaticon.com/512/2682/2682455.png',
          'sweet': 'https://cdn-icons-png.flaticon.com/512/3142/3142753.png',
          'biryani': 'https://cdn-icons-png.flaticon.com/512/1895/1895685.png'
        };

        const productName = (product.name || product.title || '').toLowerCase();
        let icon = product.images?.[0]?.url;

        // Try to match icon from map
        for (const [key, iconUrl] of Object.entries(iconMap)) {
          if (productName.includes(key)) {
            icon = iconUrl;
            break;
          }
        }

        // Fallback icons
        if (!icon) {
          const fallbackIcons = [
            'https://cdn-icons-png.flaticon.com/512/1895/1895685.png',
            'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
            'https://cdn-icons-png.flaticon.com/512/883/883356.png',
            'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
            'https://cdn-icons-png.flaticon.com/512/4456/4456995.png',
            'https://cdn-icons-png.flaticon.com/512/2682/2682455.png'
          ];
          icon = fallbackIcons[index % fallbackIcons.length];
        }

        return {
          id: product._id,
          name: product.name || product.title || 'Product',
          img: icon,
          category: product.category?.name || 'Food',
          categorySlug: product.category?.slug || 'food'
        };
      });

      // If we have less than 6 items, add some default ones
      const defaultItems = [
        { name: "Thali", img: "https://cdn-icons-png.flaticon.com/512/1895/1895685.png", category: "Food" },
        { name: "Pizza", img: "https://cdn-icons-png.flaticon.com/512/3595/3595455.png", category: "Food" },
        { name: "Meds", img: "https://cdn-icons-png.flaticon.com/512/883/883356.png", category: "Medicine" },
        { name: "Burger", img: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", category: "Food" },
        { name: "Courier", img: "https://cdn-icons-png.flaticon.com/512/4456/4456995.png", category: "Service" },
        { name: "Cake", img: "https://cdn-icons-png.flaticon.com/512/2682/2682455.png", category: "Food" }
      ];

      // Merge and limit to 8 items
      const allItems = [...quickActions, ...defaultItems.slice(0, Math.max(0, 8 - quickActions.length))];
      const uniqueItems = allItems.slice(0, 8);

      res.json({
        success: true,
        data: uniqueItems
      });
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching quick actions',
        error: error.message
      });
    }
  },

  // Get Curated/Spotlight collections
  getCuratedCollections: async (req, res) => {
    try {
      const { lat, lng } = req.query;

      // Get active promotions that can be used for curated collections
      const activePromotions = await Promotion.find({
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
        .populate('applicableCategories', 'name slug image icon')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const query = {
        featured: true,
        isActive: true
      };

      // Location Filter
      if (lat && lng) {
        const nearbySellers = await User.find({
          role: 'seller',
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: 5000 // 5km radius
            }
          }
        }).select('_id');
        const sellerIds = nearbySellers.map(s => s._id);
        if (sellerIds.length > 0) {
          query.seller = { $in: sellerIds };
        } else {
          query.seller = { $in: [] };
        }
      }

      // Get featured products grouped by categories for curated collections
      const featuredProducts = await Product.find(query)
        .populate('category', 'name slug')
        .sort({ salesCount: -1, ratings: -1 })
        .limit(50)
        .lean();

      // Group products by price ranges and categories for curated collections
      const curatedCollections = [];

      // 1. Healthy Eats - Products with low calories or organic
      const healthyProducts = featuredProducts.filter(p =>
        p.isOrganic || (p.nutritionInfo?.calories && p.nutritionInfo.calories < 300)
      );
      if (healthyProducts.length > 0) {
        curatedCollections.push({
          id: 1,
          title: "Healthy Eats",
          subtitle: "Guilt-free food",
          img: "https://cdn-icons-png.flaticon.com/512/2913/2913456.png",
          bg: "bg-emerald-100",
          productCount: healthyProducts.length,
          route: "/products?filter=healthy"
        });
      }

      // 2. Sweet Tooth - Products in sweets/desserts category
      const sweetProducts = featuredProducts.filter(p => {
        const catName = p.category?.name?.toLowerCase() || '';
        return catName.includes('sweet') || catName.includes('dessert') ||
          (p.name || p.title || '').toLowerCase().includes('sweet');
      });
      if (sweetProducts.length > 0) {
        curatedCollections.push({
          id: 2,
          title: "Sweet Tooth",
          subtitle: "Desserts & more",
          img: "https://cdn-icons-png.flaticon.com/512/3142/3142753.png",
          bg: "bg-rose-100",
          productCount: sweetProducts.length,
          route: "/products?filter=sweets"
        });
      }

      // 3. Pocket Friendly - Products under ₹149
      const affordableProducts = featuredProducts.filter(p => {
        const price = p.discountPrice || p.price || 0;
        return price > 0 && price <= 149;
      });
      if (affordableProducts.length > 0) {
        curatedCollections.push({
          id: 3,
          title: "Pocket Friendly",
          subtitle: "Under ₹149",
          img: "https://cdn-icons-png.flaticon.com/512/2488/2488667.png",
          bg: "bg-blue-100",
          productCount: affordableProducts.length,
          route: "/products?maxPrice=149"
        });
      }

      // 4. Best Sellers - Top selling products
      const bestSellers = featuredProducts.filter(p => p.isBestseller || p.salesCount > 10);
      if (bestSellers.length > 0) {
        curatedCollections.push({
          id: 4,
          title: "Best Sellers",
          subtitle: "Top rated products",
          img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          bg: "bg-amber-100",
          productCount: bestSellers.length,
          route: "/products?sort=bestseller"
        });
      }

      // 5. New Arrivals - Recently added products
      const newArrivals = featuredProducts.filter(p => p.isNew ||
        (new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );
      if (newArrivals.length > 0) {
        curatedCollections.push({
          id: 5,
          title: "New Arrivals",
          subtitle: "Freshly added",
          img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          bg: "bg-purple-100",
          productCount: newArrivals.length,
          route: "/products?sort=newest"
        });
      }

      // If no curated collections found, return default ones
      if (curatedCollections.length === 0) {
        return res.json({
          success: true,
          data: [
            { id: 1, title: "Healthy Eats", subtitle: "Guilt-free food", img: "https://cdn-icons-png.flaticon.com/512/2913/2913456.png", bg: "bg-emerald-100", route: "/products?filter=healthy" },
            { id: 2, title: "Sweet Tooth", subtitle: "Desserts & more", img: "https://cdn-icons-png.flaticon.com/512/3142/3142753.png", bg: "bg-rose-100", route: "/products?filter=sweets" },
            { id: 3, title: "Pocket Friendly", subtitle: "Under ₹149", img: "https://cdn-icons-png.flaticon.com/512/2488/2488667.png", bg: "bg-blue-100", route: "/products?maxPrice=149" }
          ]
        });
      }

      // Limit to 3-5 collections
      res.json({
        success: true,
        data: curatedCollections.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching curated collections:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching curated collections',
        error: error.message
      });
    }
  },

  // Get Vendor Stories for Food Homepage
  getVendorStories: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Get active sellers with their products
      const sellers = await User.find({
        role: 'seller',
        isActive: true,
        isBlocked: false,
        'sellerProfile.storeStatus': { $ne: 'closed' }
      })
        .select('name avatar sellerProfile')
        .sort({ 'sellerProfile.ratings.average': -1, createdAt: -1 })
        .limit(parseInt(limit) * 2) // Get more to filter food-related
        .lean();

      const stories = await Promise.all(
        sellers.map(async (seller) => {
          // FIRST CHECK: If sellerType includes "food", directly include (even without products)
          const sellerType = seller.sellerProfile?.sellerType || [];
          const isFoodSeller = sellerType.some(type =>
            type && type.toString().toLowerCase() === 'food'
          );

          // Get products with categories to check if seller has food products
          const products = await Product.find({
            seller: seller._id,
            isActive: true
          })
            .populate('category', 'name')
            .select('images category')
            .lean();

          // If sellerType is food, include them (even if no products yet)
          if (isFoodSeller) {
            // Continue to get image and other details
          } else {
            // If not food seller by type, check products
            if (products.length === 0) {
              return null; // Skip sellers with no products and not food type
            }

            const hasFoodProducts = products.some(product => {
              const categoryName = product.category?.name || '';
              return isFoodCategory(categoryName);
            });

            if (!hasFoodProducts) {
              return null; // Skip non-food sellers
            }
          }

          let storyImage = seller.avatar || seller.sellerProfile?.storeMedia?.photos?.[0];
          if (!storyImage && products.length > 0 && products[0].images?.[0]?.url) {
            storyImage = products[0].images[0].url;
          }
          if (!storyImage) {
            storyImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80';
          }

          // Determine if seller is live (has active products and store is open)
          const isLive = seller.sellerProfile?.storeStatus === 'open' && products.length > 0;

          // Generate status text based on seller data
          const statusOptions = [
            'Fresh Buns 🍔',
            'Rainy Spl ☕',
            'Dum Live 🔥',
            'Just Baked',
            'Hot & Ready',
            'New Arrivals'
          ];
          const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

          return {
            id: seller._id.toString(),
            name: seller.sellerProfile?.storeName || seller.name,
            img: storyImage,
            status: status,
            isLive: isLive
          };
        })
      );

      // Filter out nulls and limit
      const filteredStories = stories.filter(s => s !== null).slice(0, parseInt(limit));

      // If no stories found, return dummy data
      if (filteredStories.length === 0) {
        return res.json({
          success: true,
          data: [
            { id: 1, name: "Burger King", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80", status: "Fresh Buns 🍔", isLive: true },
            { id: 2, name: "Chai Point", img: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&q=80", status: "Rainy Spl ☕", isLive: true },
            { id: 3, name: "Biryani Blue", img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=150&q=80", status: "Dum Live 🔥", isLive: true }
          ]
        });
      }

      res.json({
        success: true,
        data: filteredStories
      });
    } catch (error) {
      console.error('Error fetching vendor stories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vendor stories',
        error: error.message
      });
    }
  },

  // Get Food Homepage Banner
  getFoodBanner: async (req, res) => {
    try {
      // Get active banner for food homepage
      const banner = await Banner.findOne({
        isActive: true,
        position: 'hero',
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $gte: new Date() } },
          { endDate: null }
        ]
      })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();

      if (banner) {
        return res.json({
          success: true,
          data: {
            id: banner._id,
            title: banner.title,
            subtitle: banner.subtitle || "Limited Offer",
            description: banner.description || "Get amazing deals on your favorite food",
            image: banner.image?.mobile || banner.image?.desktop || "https://img.freepik.com/free-photo/exploding-burger-with-vegetables-melted-cheese-black-background-generative-ai_157027-1734.jpg",
            buttonText: banner.buttonText || "Claim Now",
            linkUrl: banner.linkUrl || "#"
          }
        });
      }

      // Return default banner if none found
      res.json({
        success: true,
        data: {
          id: 'default',
          title: "50% OFF",
          subtitle: "Limited Offer",
          description: "on first order",
          image: "https://img.freepik.com/free-photo/exploding-burger-with-vegetables-melted-cheese-black-background-generative-ai_157027-1734.jpg",
          buttonText: "Claim Now",
          linkUrl: "#"
        }
      });
    } catch (error) {
      console.error('Error fetching food banner:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching food banner',
        error: error.message
      });
    }
  },

  // Get Trending Items for Food Homepage
  getTrendingItems: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // First, get food-related category IDs
      const foodCategories = await Category.find({ isActive: true }).lean();
      const foodCategoryIds = foodCategories
        .filter(cat => isFoodCategory(cat.name))
        .map(cat => cat._id);

      if (foodCategoryIds.length === 0) {
        // If no food categories found, return dummy data
        return res.json({
          success: true,
          data: [
            { id: 101, name: "Paneer Tikka Pizza", price: 249, rating: 4.5, time: "25 min", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80", rest: "Pizza Hut" },
            { id: 102, name: "Chicken Zinger", price: 189, rating: 4.3, time: "30 min", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80", rest: "KFC" },
            { id: 103, name: "Maharaja Thali", price: 150, rating: 4.8, time: "40 min", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80", rest: "Apna Sweets" }
          ]
        });
      }

      // Get trending products (bestseller, featured, or high sales) - ONLY FOOD CATEGORIES
      const trendingProducts = await Product.find({
        isActive: true,
        category: { $in: foodCategoryIds }, // Only food categories
        $or: [
          { isBestseller: true },
          { featured: true },
          { salesCount: { $gte: 5 } }
        ]
      })
        .populate('seller', 'name sellerProfile')
        .populate('category', 'name')
        .sort({ salesCount: -1, 'ratings.average': -1, views: -1 })
        .limit(parseInt(limit) * 2) // Get more to ensure we have enough
        .lean();

      // Double-check: filter by category name as well
      const foodProducts = trendingProducts.filter(product => {
        const categoryName = product.category?.name || '';
        return isFoodCategory(categoryName);
      }).slice(0, parseInt(limit));

      const trendingItems = foodProducts.map((product) => {
        const sellerName = product.seller?.sellerProfile?.storeName || product.seller?.name || 'Restaurant';
        const image = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80';
        const price = product.discountPrice || product.price || 0;
        const rating = product.ratings?.average || 4.5;

        // Calculate estimated delivery time (mock for now)
        const timeOptions = ['25 min', '30 min', '40 min', '20 min', '35 min'];
        const time = timeOptions[Math.floor(Math.random() * timeOptions.length)];

        return {
          id: product._id.toString(),
          name: product.title || product.name,
          price: price,
          rating: rating.toFixed(1),
          time: time,
          img: image,
          rest: sellerName
        };
      });

      // If no trending items, return dummy data
      if (trendingItems.length === 0) {
        return res.json({
          success: true,
          data: [
            { id: 101, name: "Paneer Tikka Pizza", price: 249, rating: 4.5, time: "25 min", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80", rest: "Pizza Hut" },
            { id: 102, name: "Chicken Zinger", price: 189, rating: 4.3, time: "30 min", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80", rest: "KFC" },
            { id: 103, name: "Maharaja Thali", price: 150, rating: 4.8, time: "40 min", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80", rest: "Apna Sweets" }
          ]
        });
      }

      res.json({
        success: true,
        data: trendingItems
      });
    } catch (error) {
      console.error('Error fetching trending items:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching trending items',
        error: error.message
      });
    }
  },

  // Get Food Restaurants (Enhanced for Food Homepage)
  // IMPORTANT: Returns same sellers as getVendorStories for consistency
  getFoodRestaurants: async (req, res) => {
    try {
      const { limit = 20, page = 1, type, vegOnly, sortBy, lat, lng } = req.query;


      // 1. Simplified Query (Bina kisi complex filter ke pehle check karo)
      const query = {
        role: 'seller',
        isActive: true, // Data me true hai
        isBlocked: false, // Data me false hai
        // 'sellerProfile.storeStatus': { $ne: 'closed' }, // Ise abhi comment kar raha hu testing ke liye
        'sellerProfile.sellerType': { $in: ['food', 'Food'] } // Case insensitive check
      };

      // Location Filter
      if (lat && lng) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: 5000 // 15km radius
          }
        };
      }


      // 2. Sirf Sellers Fetch karo
      const sellers = await User.find(query)
        .select('name email avatar sellerProfile rating foodPreferences location') // Added location
        .lean();

      if (sellers.length === 0) {
        // Agar yaha 0 aaya, iska matlab Query User Schema ke sath match nahi ho rahi
        return res.json({ success: true, message: "No sellers found in DB matching query", data: [] });
      }

      // 3. Process Sellers (Products check karo par seller ko reject mat karo)
      const restaurantPromises = sellers.map(async (seller) => {
        try {

          // Products fetch karo
          const products = await Product.find({
            seller: seller._id,
            isActive: true
          })
            .select('name price discountPrice category images')
            .populate('category', 'name')
            .lean();


          // --- MAJOR CHANGE: Agar products nahi hain, tab bhi seller dikhao ---
          const hasProducts = products && products.length > 0;

          // Default values agar products na ho
          let coverImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80';
          let priceForTwo = 250; // Default price
          let cuisines = 'North Indian';

          if (hasProducts) {
            // Logic agar products exist karte hain
            const uniqueCategories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
            cuisines = uniqueCategories.slice(0, 3).join(', ') || cuisines;

            const totalParams = products.reduce((acc, curr) => acc + (curr.discountPrice || curr.price || 0), 0);
            const avgItemPrice = Math.round(totalParams / products.length);
            priceForTwo = Math.round(avgItemPrice * 2.5);

            // Store ki photo ko priority do for FoodHomePage
            if (seller.sellerProfile?.storeMedia.cover) {
              coverImage = seller.sellerProfile.storeMedia.cover;
            } else {
              coverImage = seller.sellerProfile.storeMedia.photos[0];
            }
            // Veg Logic
            const isDietaryVeg = seller.foodPreferences?.dietaryType === 'vegetarian';

            return {
              id: seller._id,
              name: seller.sellerProfile?.storeName || seller.name,
              rating: (seller.sellerProfile?.ratings?.average || 0).toFixed(1),
              time: '30-40 min',
              distance: '2.0 km',
              price: priceForTwo,
              category: 'restaurant',
              isVeg: isDietaryVeg,
              cuisines: cuisines,
              offer: hasProducts ? '20% OFF' : 'New',
              img: coverImage || "",
              logo: seller.avatar || seller.sellerProfile?.storeMedia?.logo,
              isLive: seller.sellerProfile?.storeStatus === 'open',
              isVerified: seller.isEmailVerified || false, // Added for frontend filter
              productCount: products.length
            };
          }
        } catch (innerError) {
          console.error(`Error processing seller ${seller._id}:`, innerError);
          return null;
        }
      });

      const allRestaurants = await Promise.all(restaurantPromises);
      const validRestaurants = allRestaurants.filter(r => r !== null);


      res.json({
        success: true,
        data: validRestaurants,
        // Debug info bhej raha hu response me
        debugInfo: {
          totalSellersFound: sellers.length,
          queryUsed: query
        }
      });

    } catch (error) {
      console.error('SERVER ERROR:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = homepageController; 
