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
      const [
        featuredProducts,
        mealPlans,
        categories,
        todaysMeal,
        stats,
        testimonials
      ] = await Promise.all([
        // Featured Products
        Product.find({
          featured: true,
          isActive: true
        })
          .populate('category', 'name slug')
          .sort({ createdAt: -1 })
          .lean(),

        // Meal Plans
        MealPlan.find({
          status: 'active'
        })
          .sort({ tier: 1, createdAt: -1 })
          .lean(),

        // Categories - Return all active categories
        Category.find({
          isActive: true
        })
          .sort({ sortOrder: 1, name: 1 })
          .lean(),

        // Today's Meal
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
          testimonials
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
      const { limit = 8 } = req.query;

      const products = await Product.find({
        featured: true,
        isActive: true
      })
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
  getStores: async (req, res) => {
    try {
      const { limit = 20, page = 1, type } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {
        role: 'seller',
        isActive: true,
        isBlocked: false
      };

      if (type) {
        // Case-insensitive check for sellerType (e.g. 'tiffin', 'food', 'grocery')
        query['sellerProfile.sellerType'] = { $regex: new RegExp(type, 'i') };
      }

      // Get all active sellers with their profiles
      const sellers = await User.find(query)
        .select('name email avatar sellerProfile rating addresses priceRange')
        .sort({ 'sellerProfile.ratings.average': -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      // Get product counts and categories for each seller
      const storesWithDetails = await Promise.all(
        sellers.map(async (seller) => {
          // Get products for this seller
          const products = await Product.find({
            seller: seller._id,
            isActive: true
          }).sort({ salesCount: -1, views: -1 }); // Sort by Popularity to show Best Selling item as cover

          // Debug log
          

          // Get unique categories
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

          // Get primary product image for cover - fallback to storeMedia if no products
          let coverImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

          if (products.length > 0) {
            // Try to get image from products - loop through sorted products to find one with a valid image
            // We sorted by salesCount and views, so this will be the "best" product with an image
            const productWithImage = products.find(p => p.images && p.images.length > 0 && p.images[0].url);

            if (productWithImage) {
              coverImage = productWithImage.images[0].url;
            }
          }

          // EXPLICIT REQUIREMENT: Do NOT use storeMedia/banner photos. 
          // Only use Product Image or Default Placeholder.

          /* REMOVED FALLBACK TO STORE MEDIA
          if (coverImage === 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' &&
            seller.sellerProfile?.storeMedia?.photos &&
            seller.sellerProfile.storeMedia.photos.length > 0) {
            coverImage = seller.sellerProfile.storeMedia.photos[0];
          }
          */

          // Calculate average delivery time (mock for now, can be calculated from orders)
          const deliveryTime = '25 min';

          // Determine store type based on categories or sellerType
          let storeType = 'Store';
          if (categories.length > 0) {
            storeType = categories[0].name;
          } else if (seller.sellerProfile?.sellerType && seller.sellerProfile.sellerType.length > 0) {
            // Use sellerType from profile if no categories
            const sellerType = seller.sellerProfile.sellerType[0];
            storeType = sellerType.charAt(0).toUpperCase() + sellerType.slice(1);
          }

          // Get offer/badge if any
          const hasOffer = products.some(p => p.discount > 0 || p.discountPrice);
          const offer = hasOffer ? 'Best Seller' : '';

          return {
            id: seller._id,
            name: seller.sellerProfile?.storeName || seller.name,
            logo: seller.sellerProfile?.storeMedia?.logo || seller.avatar,
            rating: (seller.sellerProfile?.ratings?.average || seller.rating || 4.5).toFixed(1),
            cover: coverImage,
            type: storeType,
            time: deliveryTime,
            offer: offer,
            categories: categories,
            productCount: products.length,
            isVerified: seller.sellerProfile?.isVerified || false,
            storeStatus: seller.sellerProfile?.storeStatus || 'open',
            storeDescription: seller.sellerProfile?.storeDescription || '',
            area: seller.addresses?.[0]?.city || 'Indore',
            priceRange: seller.sellerProfile?.priceRange || {}
          };
        })
      );

      // Filter out stores with no products OR show all stores
      // Option 1: Show only stores with products (default - comment out if you want to show all)
      // const activeStores = storesWithDetails.filter(store => store.productCount > 0);

      // Option 2: Show all stores even without products (uncomment to show stores without products)
      const activeStores = storesWithDetails;

      

      const total = await User.countDocuments({
        role: 'seller',
        isActive: true,
        isBlocked: false
      });

      res.json({
        success: true,
        data: activeStores,
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
        data: categoriesWithDetails
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
      // Get popular products by sales/view count
      const popularProducts = await Product.find({
        isActive: true
      })
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

      // Get featured products grouped by categories for curated collections
      const featuredProducts = await Product.find({
        featured: true,
        isActive: true
      })
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
      const { limit = 20, page = 1, type, vegOnly, sortBy } = req.query;


      // 1. Simplified Query (Bina kisi complex filter ke pehle check karo)
      const query = {
        role: 'seller',
        isActive: true, // Data me true hai
        isBlocked: false, // Data me false hai
        // 'sellerProfile.storeStatus': { $ne: 'closed' }, // Ise abhi comment kar raha hu testing ke liye
        'sellerProfile.sellerType': { $in: ['food', 'Food'] } // Case insensitive check
      };


      // 2. Sirf Sellers Fetch karo
      const sellers = await User.find(query)
        .select('name email avatar sellerProfile rating foodPreferences')
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
        }});

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
