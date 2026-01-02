import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { 
  Clock, Shield, Heart, User, X
} from 'lucide-react';


import { useGetHomepageHeroSlidesQuery } from "../../redux/storee/api";
import InitialLoader from "../../components/common/InitialLoader";
import Header from "../../layout/buyer/Header";

const HomePage = () => {
  const navigate = useNavigate();

  // UI State
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [featuredProducts] = useState([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState('');

  // Fetch hero slides using RTK Query from first code
  const {
    data: heroSlidesData,
  } = useGetHomepageHeroSlidesQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgument: true,
  });

  // Extract hero slides or use banners from second code
  const heroSlides = heroSlidesData?.data || [];

  // Professional banners with consistent colors from second code
  const banners = [
    {
      id: 1,
      title: "Groceries in 10 minutes",
      subtitle: "Fresh vegetables & daily essentials delivered to your doorstep",
      bgGradient: "bg-gradient-to-br from-emerald-600 to-emerald-700",
      offer: "FREE Delivery",
      offerDesc: "on orders above ₹199",
      cta: "Shop Now",
      icon: "🛒"
    },
    {
      id: 2,
      title: "Medicines at doorstep",
      subtitle: "Genuine medicines with valid prescriptions",
      bgGradient: "bg-gradient-to-br from-emerald-600 to-emerald-700",
      offer: "Up to 25% OFF",
      offerDesc: "on health & wellness products",
      cta: "Order Now",
      icon: "💊"
    },
    {
      id: 3,
      title: "Food delivery",
      subtitle: "Hot & delicious meals from top restaurants",
      bgGradient: "bg-gradient-to-br from-emerald-600 to-emerald-700",
      offer: "₹100 OFF",
      offerDesc: "on your first food order",
      cta: "Explore",
      icon: "🍕"
    }
  ];

  // Use banners if no hero slides available, otherwise process them
  const displayBanners = heroSlides.length > 0 ? 
    heroSlides.map(slide => ({
      id: slide._id || slide.id,
      title: slide.title || "Special Offer",
      subtitle: slide.description || slide.subtitle || "Great deals await you",
      bgGradient: "bg-gradient-to-br from-emerald-600 to-emerald-700",
      offer: slide.offerText || "Limited Time",
      offerDesc: slide.offerDescription || "Don't miss out",
      cta: slide.ctaText || "Shop Now",
      icon: slide.icon || "🎉",
      image: slide.image || slide.imageUrl
    })) : banners;



  if (loading && !featuredProducts.length) {
    return <InitialLoader />;
  }

  if (error && !featuredProducts.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Use Header Component */}
      <Header>
        <div className="min-h-screen bg-gray-50">
          {/* Professional Hero Banner */}
          <section className="px-3 sm:px-4 lg:px-6 mb-6 lg:mb-10">
            <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">
              <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
                {displayBanners.map((banner) => (
                  <div key={banner.id} className="w-full flex-shrink-0 relative">
                    <div className={`${banner.bgGradient} relative overflow-hidden`}>
                      {/* Background Image if available */}
                      {banner.image && (
                        <>
                          <img 
                            src={banner.image} 
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40" />
                        </>
                      )}

                      {/* Decorative Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 text-6xl sm:text-8xl lg:text-9xl">
                          {banner.icon}
                        </div>
                        <div className="absolute bottom-4 left-4 text-4xl sm:text-6xl lg:text-7xl opacity-50">
                          {banner.icon}
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden relative z-10">
                        <div className="h-44 sm:h-52 p-4 sm:p-6 flex items-center">
                          <div className="flex-1 pr-4">
                            <div className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-3 inline-block text-white">
                              {banner.offer}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                              {banner.title}
                            </h2>
                            <p className="text-sm sm:text-base text-white/95 mb-1 leading-relaxed">
                              {banner.subtitle}
                            </p>
                            <p className="text-xs sm:text-sm text-white/80 mb-4">
                              {banner.offerDesc}
                            </p>
                          </div>
                          <div className="text-4xl sm:text-5xl opacity-80">
                            {banner.icon}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:flex relative z-10">
                        <div className="h-56 xl:h-64 p-8 xl:p-12 flex items-center w-full">
                          <div className="flex-1 pr-12">
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block text-white border border-white/30">
                              {banner.offer}
                            </div>
                            <h2 className="text-3xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                              {banner.title}
                            </h2>
                            <p className="text-lg xl:text-xl text-white/95 mb-2 leading-relaxed max-w-md">
                              {banner.subtitle}
                            </p>
                            <p className="text-sm xl:text-base text-white/80 mb-8 max-w-sm">
                              {banner.offerDesc}
                            </p>
                            <button className="bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                              {banner.cta} →
                            </button>
                          </div>
                          <div className="text-8xl xl:text-9xl opacity-60">
                            {banner.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                      currentBanner === index 
                        ? 'bg-white shadow-lg' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Quick Categories */}
          <section className="px-3 sm:px-4 lg:px-6 mb-6 lg:mb-10">
            <div className="mb-4 lg:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-sm sm:text-base text-gray-600">Everything you need, delivered fast</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
              {[
                { name: 'Groceries', icon: '🛒', color: 'emerald', path: '/category1/grocery' },
                { name: 'Medicines', icon: '💊', color: 'blue', path: '/category1/pharmacy' },
                { name: 'Food', icon: '🍔', color: 'orange', path: '/category1/food' },
                { name: 'Electronics', icon: '📱', color: 'purple', path: '/category1/electronics' },
                { name: 'Fashion', icon: '👗', color: 'pink', path: '/category1/fashion' },
                { name: 'Home', icon: '🏠', color: 'indigo', path: '/category1/home' },
                { name: 'Books', icon: '📚', color: 'teal', path: '/category1/books' },
                { name: 'Sports', icon: '⚽', color: 'green', path: '/category1/sports' }
              ].map((category, index) => (
                <div 
                  key={index}
                  onClick={() => navigate(category.path)}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <div className={`bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-${category.color}-200 transition-all duration-300 group-hover:bg-${category.color}-50`}>
                    <div className="text-center">
                      <div className="text-3xl lg:text-4xl mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm lg:text-base text-gray-800 leading-tight group-hover:text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Products Section */}
          <section className="px-3 sm:px-4 lg:px-6 mb-6 lg:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">Featured Products</h2>
                <p className="text-sm sm:text-base text-gray-600">Trending items you'll love</p>
              </div>
              <button 
                onClick={() => navigate('/products')}
                className="self-start sm:self-auto bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm sm:text-base"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {/* Featured products will be loaded here */}
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>Featured products coming soon...</p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-3 sm:px-4 lg:px-6 mb-6 lg:mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
                <p className="text-gray-600 text-sm">Get your orders delivered in just 10 minutes</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Quality Assured</h3>
                <p className="text-gray-600 text-sm">100% authentic products with quality guarantee</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Customer First</h3>
                <p className="text-gray-600 text-sm">Dedicated customer support and satisfaction guarantee</p>
              </div>
            </div>
          </section>

          {/* College Modal */}
          {showCollegeModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">College Information</h3>
                  <p className="text-gray-600">
                    This product requires college information. Please enter your college name to proceed.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Delhi University"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCollegeModal(false);
                      setCollegeName('');
                    }}
                    className="flex-1 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCollegeModal(false);
                      setCollegeName('');
                    }}
                    disabled={!collegeName.trim()}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          <style jsx>{`
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .animate-in {
              animation: slideInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes slideInScale {
              0% {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }

            /* Smooth transitions for all interactive elements */
            * {
              transition-property: color, background-color, border-color, transform, box-shadow;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              transition-duration: 150ms;
            }
          `}</style>
        </div>
      </Header>
    </>
  );
};

export default HomePage;