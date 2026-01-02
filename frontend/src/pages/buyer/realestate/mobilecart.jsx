import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Smartphone, DollarSign, Package, Star } from 'lucide-react';

export default function PhoneMarketplaceCart() {
  const [cartItems, setCartItems] = useState([]);
  const [mobileData, setMobileData] = useState([]);
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
        setMobileData(data);
        
        // Initialize cart with sample items from loaded data
        if (data.length > 0) {
          const sampleCartItems = data.slice(0, 2).map(item => ({
            id: item.id,
            name: item.name,
            condition: item.condition,
            storage: item.specs?.storage || '128GB',
            color: item.specs?.color || 'Black',
            price: item.price,
            originalPrice: item.originalPrice,
            quantity: 1,
            image: item.images?.[0]?.url || '/api/placeholder/80/80',
            seller: item.seller?.username || 'Unknown Seller',
            rating: item.seller?.rating || 4.5,
            type: 'buy'
          }));
          setCartItems(sampleCartItems);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading mobile data:', err);
        setError('Failed to load mobile data');
        setLoading(false);
        
        // Fallback to sample data
        setCartItems([
          {
            id: 1,
            name: 'iPhone 12 Pro',
            condition: 'Excellent',
            storage: '128GB',
            color: 'Pacific Blue',
            price: 599,
            originalPrice: 699,
            quantity: 1,
            image: '/api/placeholder/80/80',
            seller: 'TechDeals_Pro',
            rating: 4.8,
            type: 'buy'
          },
          {
            id: 2,
            name: 'Samsung Galaxy S21',
            condition: 'Good',
            storage: '256GB',
            color: 'Phantom Black',
            price: 449,
            originalPrice: 549,
            quantity: 1,
            image: '/api/placeholder/80/80',
            seller: 'MobileHub',
            rating: 4.6,
            type: 'buy'
          }
        ]);
      }
    };

    loadMobileData();
  }, []);

  const [sellingItems, setSellingItems] = useState([
    {
      id: 3,
      name: 'iPhone 11',
      condition: 'Good',
      storage: '64GB',
      color: 'Black',
      listedPrice: 349,
      estimatedValue: 320,
      status: 'active',
      views: 23,
      inquiries: 5,
      type: 'sell'
    },
    {
      id: 4,
      name: 'Google Pixel 6',
      condition: 'Excellent',
      storage: '128GB',
      color: 'Stormy Black',
      listedPrice: 399,
      estimatedValue: 410,
      status: 'pending',
      views: 15,
      inquiries: 2,
      type: 'sell'
    }
  ]);

  const [activeTab, setActiveTab] = useState('buying');

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const removeSellingItem = (id) => {
    setSellingItems(sellingItems.filter(item => item.id !== id));
  };

  const updateSellingPrice = (id, newPrice) => {
    setSellingItems(sellingItems.map(item =>
      item.id === id ? { ...item, listedPrice: newPrice } : item
    ));
  };

  const addToCart = (productId) => {
    const product = mobileData.find(item => item.id === productId);
    if (product) {
      const cartItem = {
        id: product.id,
        name: product.name,
        condition: product.condition,
        storage: product.specs?.storage || '128GB',
        color: product.specs?.color || 'Black',
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
        image: product.images?.[0]?.url || '/api/placeholder/80/80',
        seller: product.seller?.username || 'Unknown Seller',
        rating: product.seller?.rating || 4.5,
        type: 'buy'
      };
      
      const existingItem = cartItems.find(item => item.id === productId);
      if (existingItem) {
        updateQuantity(productId, existingItem.quantity + 1);
      } else {
        setCartItems([...cartItems, cartItem]);
      }
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalSavings = cartItems.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);

  const getConditionColor = (condition) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'sold': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Marketplace</h1>
              <p className="text-sm text-gray-600">Manage your buying and selling activities</p>
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
          
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('buying')}
              className={`flex-1 px-4 py-2.5 rounded-md font-medium transition-all text-sm ${
                activeTab === 'buying'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shopping Cart ({cartItems.length})
            </button>
            <button
              onClick={() => setActiveTab('selling')}
              className={`flex-1 px-4 py-2.5 rounded-md font-medium transition-all text-sm ${
                activeTab === 'selling'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Listings ({sellingItems.length})
            </button>
          </div>
        </div>

        {/* Buying Cart Tab */}
        {activeTab === 'buying' && (
          <div className="p-5">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 max-w-md mx-auto">Browse our marketplace to discover quality pre-owned devices at competitive prices.</p>
                <button className="mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-emerald-700 transition-colors">
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                    <span className="text-sm text-gray-600">{cartItems.length} items</span>
                  </div>
                  
                  {cartItems.map(item => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border flex-shrink-0">
                          <Smartphone size={24} className="text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                              <p className="text-sm text-gray-600 mt-0.5">{item.storage} • {item.color}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                                  {item.condition}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">{item.rating}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Seller: {item.seller}</p>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-600 p-1 flex-shrink-0 ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">${item.price}</div>
                              {item.originalPrice > item.price && (
                                <div className="text-sm text-gray-500 line-through">${item.originalPrice}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 h-fit">
                  <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span className="font-medium text-gray-900">${totalAmount}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-emerald-600">-${totalSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-emerald-600">Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="font-semibold text-lg text-gray-900">${totalAmount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-emerald-600 text-white py-3 rounded-md font-medium hover:bg-emerald-700 transition-colors mb-3">
                    Proceed to Checkout
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selling Items Tab */}
        {activeTab === 'selling' && (
          <div className="p-5">
            {sellingItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active listings</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">Start monetizing your unused devices by listing them on our marketplace.</p>
                <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-emerald-700 transition-colors">
                  Create New Listing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">My Listings</h2>
                    <p className="text-sm text-gray-600 mt-0.5">Manage your active and pending listings</p>
                  </div>
                  <button className="bg-emerald-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-emerald-700 transition-colors">
                    + New Listing
                  </button>
                </div>

                {sellingItems.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border flex-shrink-0">
                        <Smartphone size={24} className="text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-0.5">{item.storage} • {item.color}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                                {item.condition}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeSellingItem(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1 flex-shrink-0 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-3 bg-gray-50 rounded-md">
                          <div>
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Listed Price</label>
                            <div className="flex items-center gap-1 mt-1">
                              <DollarSign size={14} className="text-gray-400" />
                              <input
                                type="number"
                                value={item.listedPrice}
                                onChange={(e) => updateSellingPrice(item.id, parseInt(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Est. Value</label>
                            <div className="mt-1 font-semibold text-gray-900">${item.estimatedValue}</div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Views</label>
                            <div className="mt-1 font-semibold text-blue-600">{item.views}</div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Inquiries</label>
                            <div className="mt-1 font-semibold text-emerald-600">{item.inquiries}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                            Edit Listing
                          </button>
                          <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                            View Messages
                          </button>
                          {item.status === 'active' && (
                            <button className="px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-100 transition-colors">
                              Boost Listing
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}