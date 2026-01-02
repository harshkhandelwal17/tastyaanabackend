import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Lock, Truck } from 'lucide-react';

export default function MobileMarketplaceMini() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMobileData = async () => {
      try {
        const response = await fetch('/src/mobile.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Take only the first 3 phones for the mini preview
        const latestPhones = data.slice(0, 3);
        setPhones(latestPhones);
        setLoading(false);
      } catch (err) {
        console.error('Error loading mobile data:', err);
        setError('Failed to load mobile data');
        setLoading(false);
        
        // Fallback to sample data if file doesn't exist
        setPhones([
          {
            id: 1,
            name: 'iPhone 13 Pro Max',
            price: 899,
            currency: 'USD',
            condition: 'Excellent',
            images: [{ url: 'https://images.unsplash.com/photo-1632633173522-b27bceba5282?w=200', isPrimary: true }]
          },
          {
            id: 2,
            name: 'Galaxy S22 Ultra',
            price: 799,
            currency: 'USD',
            condition: 'Very Good',
            images: [{ url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200', isPrimary: true }]
          },
          {
            id: 3,
            name: 'OnePlus 11 5G',
            price: 599,
            currency: 'USD',
            condition: 'Good',
            images: [{ url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200', isPrimary: true }]
          }
        ]);
      }
    };

    loadMobileData();
  }, []);

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent': return 'text-emerald-600 bg-emerald-50';
      case 'Very Good': return 'text-blue-600 bg-blue-50';
      case 'Good': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    if (currency === 'USD') {
      return `$${price}`;
    } else if (currency === 'INR') {
      return `₹${Math.round(price/1000)}K`;
    }
    return `${currency} ${price}`;
  };

  const getPrimaryImage = (images) => {
    const primaryImage = images?.find(img => img.isPrimary);
    return primaryImage?.url || images?.[0]?.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200';
  };

  if (loading) {
    return (
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Banner & CTAs */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-3">
            <div className="p-2 bg-blue-600 rounded-lg mr-0 sm:mr-3 mb-2 sm:mb-0">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center sm:text-left">
              Upgrade your phone or sell your old one in minutes.
            </h2>
          </div>
          
          <div className="flex flex-row gap-3 justify-center mt-4 sm:mt-6">
            <button className="flex-1 max-w-40 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
              Sell Your Phone
            </button>
            <button className="flex-1 max-w-40 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm">
              Browse Phones
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              {error} - Using sample data for preview
            </p>
          </div>
        )}

        {/* Mini Listing Preview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Phones</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {phones.map(phone => (
              <div key={phone.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer border">
                <div className="text-center">
                  <img
                    src={getPrimaryImage(phone.images)}
                    alt={phone.name}
                    className="w-full h-20 sm:h-24 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200';
                    }}
                  />
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate mb-1">
                    {phone.name}
                  </h4>
                  <p className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
                    {formatPrice(phone.price, phone.currency)}
                  </p>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(phone.condition)}`}>
                    {phone.condition}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Benefits Row */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Verified Sellers</h4>
                <p className="text-xs text-gray-600 hidden sm:block">All sellers are verified for your safety</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Safe Transactions</h4>
                <p className="text-xs text-gray-600 hidden sm:block">Secure payment & buyer protection</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Doorstep Service</h4>
                <p className="text-xs text-gray-600 hidden sm:block">Free pickup & delivery available</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}