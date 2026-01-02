import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useOptimizedState, useApiCache } from '../../hook/useOptimizedState';

// Optimized components
import OptimizedHeroSection from '../../components/buyer/OptimizedHeroSection';

// Redux API hooks with caching
import {
  useGetHomepageDataQuery,
  useGetHomepageFeaturedProductsQuery,
  useGetHomepageMealPlansQuery,
  useGetHomepageCategoriesQuery,
  useGetHomepageTodaysSpecialQuery,
  useGetHomepageStatsQuery,
  useGetHomepageTestimonialsQuery,
  useGetHomepageHeroSlidesQuery,
  useGetUserSubscriptionsQuery,
} from '../../redux/storee/api';

// Redux actions
import { fetchCart, fetchWishlist } from '../../redux/cartSlice';

// Icons
import {
  ShoppingCart,
  Star,
  Package,
  Truck,
  CheckCircle,
  Users,
  Heart,
  Award,
  Gift,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Cookie,
  ChefHat,
  Home,
  ArrowRight,
  Play,
  Shield,
  Zap,
  Eye,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  Utensils,
  Leaf,
  Clock3,
  UserCheck,
  Smile,
} from 'lucide-react';

// Memoized Stats Section
const StatsSection = React.memo(({ stats }) => {
  const [animatedStats, setAnimatedStats] = useState({
    customers: 0,
    orders: 0,
    satisfaction: 0,
    deliveryTime: 0
  });

  useEffect(() => {
    const animateStats = () => {
      setAnimatedStats({
        customers: stats.customers || 0,
        orders: stats.orders || 0,
        satisfaction: stats.satisfaction || 0,
        deliveryTime: stats.deliveryTime || 0
      });
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, [stats]);

  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Why Choose Ghar Ka Khana?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of families for authentic, home-cooked meals delivered with love
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {animatedStats.customers.toLocaleString()}+
              </div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Package className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {animatedStats.orders.toLocaleString()}+
              </div>
              <div className="text-gray-600">Meals Delivered</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Star className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {animatedStats.satisfaction}%
              </div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {animatedStats.deliveryTime}min
              </div>
              <div className="text-gray-600">Avg Delivery Time</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

// Memoized Testimonials Section
const TestimonialsSection = React.memo(({ testimonials = [] }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length > 1) {
      const timer = setInterval(nextTestimonial, 5000);
      return () => clearInterval(timer);
    }
  }, [nextTestimonial, testimonials.length]);

  if (!testimonials.length) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real stories from real families who love our food
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 md:p-12 text-center"
            >
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < (testimonials[currentTestimonial]?.rating || 5)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial]?.content || 'Amazing food and service!'}"
              </blockquote>
              
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                  {testimonials[currentTestimonial]?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {testimonials[currentTestimonial]?.name || 'Customer'}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[currentTestimonial]?.location || 'Indore'}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {testimonials.length > 1 && (
            <>
              <button
                onClick={prevTestimonial}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button
                onClick={nextTestimonial}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <ChevronRight size={20} />
              </button>
              
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial
                        ? 'bg-orange-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = 'TestimonialsSection';

// Memoized Features Section
const FeaturesSection = React.memo(() => {
  const features = [
    {
      icon: Shield,
      title: "100% Safe & Hygienic",
      description: "All meals prepared in certified kitchens with strict hygiene standards"
    },
    {
      icon: Clock,
      title: "On-Time Delivery",
      description: "Guaranteed delivery within 30 minutes or your money back"
    },
    {
      icon: Utensils,
      title: "Home-Cooked Taste",
      description: "Authentic recipes passed down through generations"
    },
    {
      icon: Leaf,
      title: "Fresh Ingredients",
      description: "Only the freshest vegetables and spices used daily"
    },
    {
      icon: Zap,
      title: "Quick & Easy",
      description: "Order in 2 minutes, delivered to your doorstep"
    },
    {
      icon: Heart,
      title: "Made with Love",
      description: "Every meal prepared with care and attention to detail"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Why Choose Ghar Ka Khana?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the taste of home with our premium meal delivery service
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

// Main Optimized HomePage Component
const OptimizedHomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // API cache for performance
  const apiCache = useApiCache('homepage', 5 * 60 * 1000); // 5 minutes cache
  
  // Optimized state management
  const [favorites, setFavorites] = useOptimizedState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Homepage API hooks with caching
  const {
    data: homepageData,
    isLoading: homepageLoading,
    error: homepageError,
  } = useGetHomepageDataQuery(undefined, {
    // Skip if we have cached data
    skip: !!apiCache.getCachedData('homepageData')
  });

  const { data: heroSlides } = useGetHomepageHeroSlidesQuery(undefined, {
    skip: !!apiCache.getCachedData('heroSlides')
  });

  const { data: subscriptionData } = useGetUserSubscriptionsQuery(
    { status: "active" },
    { skip: !isAuthenticated }
  );

  // Cache API responses
  useEffect(() => {
    if (homepageData && !apiCache.getCachedData('homepageData')) {
      apiCache.setCachedData('homepageData', homepageData);
    }
    if (heroSlides && !apiCache.getCachedData('heroSlides')) {
      apiCache.setCachedData('heroSlides', heroSlides);
    }
  }, [homepageData, heroSlides, apiCache]);

  // Initialize data only once
  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  // Optimized handlers
  const handleSlideChange = useCallback((slide, index) => {
    console.log('Slide changed to:', slide.title, 'at index:', index);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, [setFavorites]);

  // Memoized data extraction
  const {
    featuredProducts = [],
    mealPlans = [],
    categories = [],
    todaysMeal = null,
    stats = {},
    testimonials = [],
  } = useMemo(() => {
    return homepageData?.data || apiCache.getCachedData('homepageData')?.data || {};
  }, [homepageData, apiCache]);

  // Memoized hero slides
  const memoizedHeroSlides = useMemo(() => {
    return heroSlides?.data || apiCache.getCachedData('heroSlides')?.data || [];
  }, [heroSlides, apiCache]);

  // Loading state
  if (homepageLoading && !apiCache.getCachedData('homepageData')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading homepage...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (homepageError && !apiCache.getCachedData('homepageData')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading homepage data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-white via-white to-pink-50 font-['Plus_Jakarta_Sans']">
      {/* Optimized Hero Section */}
      <OptimizedHeroSection
        slides={memoizedHeroSlides}
        autoPlay={true}
        interval={5000}
        onSlideChange={handleSlideChange}
      />

      {/* Stats Section */}
      <StatsSection stats={stats} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* Additional sections can be added here */}
    </div>
  );
};

export default React.memo(OptimizedHomePage); 