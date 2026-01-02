const Product = require('../models/Product');
const MealPlan = require('../models/MealPlan');
const Category = require('../models/Category');
const DailyMeal = require('../models/DailyMeal');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

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
        //  {
        //   id:1,
        //   title: "Happy Ganesh Chaturthi",
        //   subtitle: "",
        //   description: "",
        //   image: "",
        //   cta: "",
        //   ctaLink: "/products",
        //   imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1756222241/Pink_Gradient_Ganesh_Chaturthi_Greeting_Card_ajy19u.png"

        // },
        {
          id: 2,
          title: "Fresh Homestyle Meals",
          subtitle: "Delivered to your doorstep daily",
          description: "Experience the warmth of home-cooked meals prepared with love and delivered with care.",
          image: `https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560646/thali_dtajpw.png`,
          cta: "Order Now",
          ctaLink: "/ghar/ka/bhojan",
          imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1754267172/Food_Delivery_Banner_Template_1_pathp0.png"

        },
        // {
        //   id: 2,
        //   title: "Premium Sweets Collection",
        //   subtitle: "Traditional recipes, modern convenience",
        //   description: "Indulge in our handcrafted sweets made with authentic recipes and premium ingredients.",
        //   image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560647/sweets1_xrztin.png",
        //   cta: "Explore Sweets",
        //   ctaLink: "/products",
        //   imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560645/herosweetbg_wtxktc.jpg"
        // },
        // {
        //   id: 3,
        //   title: "Fresh Groceries",
        //   subtitle: "Quality ingredients for your kitchen",
        //   description: "Get fresh vegetables, fruits, and groceries delivered to your home with guaranteed quality.",
        //   image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560646/groceries_klnxdn.png",
        //   cta: "Shop Groceries",
        //   ctaLink: "/groceries",
        //   imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560645/herosweetbg_wtxktc.jpg"

        // },
        //  {
        //   id: 3,
        //   title: "Rakhi Special",
        //   subtitle: "Celebrate the Bond of Love This Raksha Bandhan",
        //   description: "Discover thoughtfully crafted rakhis, delightful sweets, and heartwarming gift boxes—because every sibling deserves something special.",
        //   image: "",
        //   cta: "",
        //   ctaLink: "/sweets",
        //   imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1754262452/Celebrate_the_Bond_of_Love_This_Raksha_Bandhan_1_nuh9d1.png"

        // },
          {
          id: 4,
          title: "Fresh Vegetables",
          subtitle: "Quality ingredients for your kitchen",
          description: "Get fresh vegetables, fruits, and groceries delivered to your home with guaranteed quality.",
          image: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1753560646/groceries_klnxdn.png",
          cta: "",
          ctaLink: "/vegetables",
          imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1754266144/Green_Clean_Healthy_Food_Presentation_uxxpgn.jpg"

        }
          ,
          {
          id:5,
          title: "Stationery Essentials",
          subtitle: "Your One-Stop Shop for Quality Stationery",
          description: "Explore our wide range of stationery products, from notebooks to pens, all designed to inspire creativity and productivity.",
          image: "",
          cta: "",
          ctaLink: "/stationery",
          imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1754266712/stationery-img_vzjajk.png"

        },
        //   {
        //   id:7,
        //   title: "Happy Ganesh Chaturthi",
        //   subtitle: "",
        //   description: "",
        //   image: "",
        //   cta: "",
        //   ctaLink: "/products",
        //   imagebg: "https://res.cloudinary.com/dcha7gy9o/image/upload/v1756290228/WhatsApp_Image_2025-08-26_at_21.53.53_034523be_ohpvel.jpg"

        // }
         
      ];

      res.json({
        success: true,
        data: slides
      });
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching hero slides',
        error: error.message
      });
    }
  }
};

module.exports = homepageController; 
