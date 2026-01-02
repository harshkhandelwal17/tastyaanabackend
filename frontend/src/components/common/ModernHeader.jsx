import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  Search, MapPin, ShoppingCart, Clock, Star, ChevronRight, 
  TrendingUp, Truck, Shield, ChevronLeft, User, Bell,
  Menu, X, Plus, Minus, Heart, ArrowRight, Percent,
  Phone, Mail, Gift, Sparkles, Timer, Package, Zap,
  Award, Users, Globe, Download, PlayCircle, Volume2
} from 'lucide-react';

const ModernHeader = ({ 
  searchQuery = '', 
  setSearchQuery = () => {}, 
  cartCount = 0,
  showLocationModal = false,
  setShowLocationModal = () => {},
  selectedLocation = 'Vijay Nagar, Indore',
  setSelectedLocation = () => {},
  showMobileMenu = false,
  setShowMobileMenu = () => {},
  isScrolled = false
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Enhanced Header - Fixed with glass effect */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg' 
          : 'bg-white shadow-sm'
      }`}>
        {/* Enhanced Top Bar - Mobile Optimized */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white px-4 py-2">
          <div className="flex justify-between items-center text-xs overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <span className="flex items-center gap-1 animate-pulse whitespace-nowrap">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Free delivery on first 3 orders</span>
              </span>
              <span className="hidden lg:flex items-center gap-1 whitespace-nowrap">
                <Award className="w-3 h-3 flex-shrink-0" />
                <span>10,000+ Happy Customers</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline">24/7 Support</span>
                <span className="sm:hidden">Support</span>
              </span>
              <span className="hidden md:flex items-center gap-1 whitespace-nowrap">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span>Download App</span>
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Main Header - Mobile First */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button 
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Tastyaana
                  </h1>
                  <p className="text-xs text-gray-500">Indore's #1 Delivery App</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 sm:gap-2 hover:bg-gray-50 px-2 sm:px-3 py-2 rounded-xl transition-all group flex-1 min-w-0 max-w-[200px] sm:max-w-none"
              >
                <MapPin className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs text-gray-500 hidden sm:block">Deliver to</p>
                  <p className="text-sm font-semibold truncate">
                    {selectedLocation}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            </div>

            {/* Enhanced Search Bar - Desktop Only */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search for groceries, food, stationery, medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-gray-50 focus:bg-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Right Actions - Mobile Optimized */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Mobile Search Button */}
              <button className="lg:hidden p-2.5 hover:bg-gray-50 rounded-xl transition-all group min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
              </button>
              
              {/* Notifications - Hidden on small screens */}
              <button className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-all hidden md:block group min-h-[44px] min-w-[44px]">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Profile - Hidden on small screens */}
              <button 
                onClick={() => navigate('/profile')}
                className="p-2.5 hover:bg-gray-50 rounded-xl transition-all hidden md:block group min-h-[44px] min-w-[44px]"
              >
                <User className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
              </button>
              
              {/* Cart - Always visible */}
              <button 
                onClick={() => navigate('/cart')}
                className="relative p-2.5 hover:bg-gray-50 rounded-xl transition-all group min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse min-w-[20px] min-h-[20px]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Search */}
          <div className="lg:hidden mt-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-purple-500 border-2 border-transparent transition-all min-h-[44px]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
          <div className="bg-white w-80 h-full overflow-y-auto">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">Tastyaana</h2>
                  <p className="text-purple-100 text-sm">Your everyday partner</p>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {[
                { icon: User, text: 'My Account', badge: null, route: '/profile' },
                { icon: Package, text: 'My Orders', badge: '2', route: '/orders' },
                { icon: Heart, text: 'Wishlist', badge: '5', route: '/wishlist' },
                { icon: Bell, text: 'Notifications', badge: '3', route: '/notifications' },
                { icon: Gift, text: 'Offers & Deals', badge: 'NEW', route: '/offers' },
                { icon: Phone, text: 'Support', badge: null, route: '/contact' }
              ].map(({ icon, text, badge, route }) => (
                <button 
                  key={text} 
                  onClick={() => {
                    navigate(route);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {React.createElement(icon, { className: 'w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors' })}
                    <span className="font-medium">{text}</span>
                  </div>
                  {badge && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      badge === 'NEW' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {/* <LocationModal 
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      /> */}
    </>
  );
};

export default ModernHeader;