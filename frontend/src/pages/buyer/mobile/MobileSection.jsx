import React, { useState, useEffect, useMemo } from 'react';
import { Smartphone, ShieldCheck, Lock, Truck, Star, MapPin, Clock } from 'lucide-react';

const MobileSection = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const DISPLAY_COUNT = 6; // Show 6 phones instead of 3
  const MAX_RETRIES = 3;

  const loadMobileData = async (attempt = 0) => {
    try {
      setLoading(true);
      const response = await fetch('/src/mobile.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.phones || !Array.isArray(data.phones)) {
        throw new Error('Invalid data format');
      }
      
      const displayPhones = data.phones.slice(0, DISPLAY_COUNT);
      setPhones(displayPhones);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error loading mobile data:', err);
      
      if (attempt < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadMobileData(attempt + 1), 2000 * (attempt + 1));
        return;
      }
      
      setError(err.message || 'Failed to load mobile data');
      setPhones(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = () => [
    {
      id: 'fallback-1',
      model: 'iPhone 15 Pro',
      brand: 'Apple',
      condition: 'new',
      pricing: { new: { '256GB': 1199 } },
      images: { primary: 'https://images.unsplash.com/photo-1632633173522-b27bceba5282?w=400' },
      seller: { name: 'Apple Store', verified: true, rating: 4.9 },
      availability: { location: ['New York'] }
    },
    {
      id: 'fallback-2',
      model: 'Galaxy S24 Ultra',
      brand: 'Samsung',
      condition: 'new',
      pricing: { new: { '256GB': 1299 } },
      images: { primary: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400' },
      seller: { name: 'Samsung Store', verified: true, rating: 4.8 },
      availability: { location: ['Los Angeles'] }
    }
  ];

  useEffect(() => {
    loadMobileData();
  }, []);

  const getConditionInfo = useMemo(() => {
    const conditions = {
      'new': { color: 'text-emerald-700 bg-emerald-100 border-emerald-200', label: 'Brand New' },
      'excellent': { color: 'text-emerald-700 bg-emerald-100 border-emerald-200', label: 'Excellent' },
      'very good': { color: 'text-blue-700 bg-blue-100 border-blue-200', label: 'Very Good' },
      'good': { color: 'text-blue-700 bg-blue-100 border-blue-200', label: 'Good' },
      'fair': { color: 'text-amber-700 bg-amber-100 border-amber-200', label: 'Fair' },
      'refurbished': { color: 'text-purple-700 bg-purple-100 border-purple-200', label: 'Refurbished' },
      'used': { color: 'text-gray-700 bg-gray-100 border-gray-200', label: 'Pre-owned' }
    };
    return (condition) => conditions[condition.toLowerCase()] || conditions['used'];
  }, []);

  const formatPrice = useMemo(() => {
    return (phone) => {
      if (!phone.pricing) return 'Price unavailable';
      
      let price = 0;
      let originalPrice = null;
      
      try {
        if (phone.pricing.new) {
          const storageOptions = Object.keys(phone.pricing.new).sort();
          price = phone.pricing.new[storageOptions[0]];
        } else if (phone.pricing.used) {
          const conditions = ['excellent', 'good', 'fair'];
          const availableCondition = conditions.find(c => phone.pricing.used[c]);
          if (availableCondition) {
            const storageOptions = Object.keys(phone.pricing.used[availableCondition]).sort();
            price = phone.pricing.used[availableCondition][storageOptions[0]];
            
            // Show original price for comparison if it's a used item
            if (phone.pricing.new) {
              const newStorageOptions = Object.keys(phone.pricing.new).sort();
              originalPrice = phone.pricing.new[newStorageOptions[0]];
            }
          }
        } else if (phone.pricing.refurbished) {
          const storageOptions = Object.keys(phone.pricing.refurbished).sort();
          price = phone.pricing.refurbished[storageOptions[0]];
        }
        
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(price);
        
        return { current: formattedPrice, original: originalPrice ? `$${originalPrice}` : null };
      } catch (error) {
        console.warn('Error formatting price:', error);
        return { current: 'Price unavailable', original: null };
      }
    };
  }, []);

  const getImageUrl = useMemo(() => {
    const fallbackImages = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1632633173522-b27bceba5282?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop'
    ];
    
    return (images, index = 0) => {
      if (images?.primary) return images.primary;
      if (images?.gallery?.[0]) return images.gallery[0];
      if (images?.views?.front) return images.views.front;
      if (Array.isArray(images) && images[0]?.url) return images[0].url;
      return fallbackImages[index % fallbackImages.length];
    };
  }, []);

  const retryDataLoad = () => {
    setError(null);
    setRetryCount(0);
    loadMobileData();
  };

  const LoadingState = () => (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 mx-auto mb-4"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto mb-6"></div>
            <div className="flex justify-center gap-3">
              <div className="h-12 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
              <div className="h-12 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-3"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        {retryCount > 0 && (
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm mb-2">Loading mobile data... (Attempt {retryCount + 1}/{MAX_RETRIES + 1})</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg mr-3">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Mobile Marketplace
              </h2>
              <p className="text-sm text-gray-600 mt-1">Premium devices, verified sellers</p>
            </div>
          </div>
          
          <p className="text-gray-700 max-w-2xl mx-auto mb-6">
            Discover the latest smartphones from trusted sellers. Buy, sell, or trade with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" />
                Sell Your Phone
              </div>
            </button>
            <button className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:border-blue-300 hover:bg-blue-50 transform hover:-translate-y-0.5 transition-all duration-200">
              Browse All
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium mb-1">Unable to load latest data</p>
                <p className="text-red-700 text-sm">{error}</p>
                <p className="text-red-600 text-xs mt-1">Showing sample data for preview</p>
              </div>
              <button 
                onClick={retryDataLoad}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Featured Phones Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Featured Devices</h3>
              <p className="text-gray-600 text-sm mt-1">Handpicked premium smartphones</p>
            </div>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all">
              View All
              <span className="text-lg">→</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {phones.map((phone, index) => {
              const conditionInfo = getConditionInfo(phone.condition);
              const priceInfo = formatPrice(phone);
              
              return (
                <div key={phone.id} className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
                  <div className="relative mb-3">
                    <img
                      src={getImageUrl(phone.images, index)}
                      alt={phone.model}
                      className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = getImageUrl(null, index);
                      }}
                    />
                    {phone.seller?.verified && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1">
                        <ShieldCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{phone.brand}</p>
                      <h4 className="text-sm font-bold text-gray-900 truncate" title={phone.model}>
                        {phone.model}
                      </h4>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-lg font-bold text-gray-900">
                          {priceInfo.current}
                        </p>
                        {priceInfo.original && (
                          <span className="text-xs text-gray-500 line-through">
                            {priceInfo.original}
                          </span>
                        )}
                      </div>
                      
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>
                    
                    {phone.seller && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{phone.seller.rating}</span>
                        {phone.availability?.location?.[0] && (
                          <>
                            <span className="mx-1">•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{phone.availability.location[0]}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust & Benefits Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Why Choose Our Marketplace?</h4>
            <p className="text-gray-600 text-sm">Your trusted platform for mobile device transactions</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Verified Sellers</h5>
              <p className="text-sm text-gray-600">Every seller is thoroughly verified and rated by our community for your peace of mind</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Secure Payments</h5>
              <p className="text-sm text-gray-600">Advanced encryption and buyer protection ensure safe, worry-free transactions</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Quick Delivery</h5>
              <p className="text-sm text-gray-600">Fast, insured shipping with real-time tracking and doorstep pickup service</p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default MobileSection;