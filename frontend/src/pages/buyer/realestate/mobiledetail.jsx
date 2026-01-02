import React, { useState, useEffect } from 'react';
import { Heart, Share2, Shield, Truck, MessageCircle, Phone, Star, ChevronLeft, ChevronRight, MapPin, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

const PhoneDetailsPage = ({ productId = 1 }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedTab, setSelectedTab] = useState('details');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        const response = await fetch('/src/mobile.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Find product by ID
        const foundProduct = data.find(item => item.id === productId);
        if (foundProduct) {
          // Transform data to match expected structure
          const transformedProduct = {
            ...foundProduct,
            images: foundProduct.images?.map(img => img.url) || [
              "https://images.unsplash.com/photo-1678911988644-6bb169acaa40?w=800&h=600&fit=crop&auto=format"
            ]
          };
          setProduct(transformedProduct);
        } else {
          throw new Error('Product not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading product data:', err);
        setError('Failed to load product data');
        setLoading(false);
        
        // Fallback to sample data
        setProduct({
          id: 1,
          name: "iPhone 14 Pro",
          price: 899,
          originalPrice: 1199,
          condition: "Excellent",
          specs: {
            storage: "128GB",
            color: "Deep Purple",
            brand: "Apple",
            model: "iPhone 14 Pro",
            condition: "Excellent",
            batteryHealth: "89%",
            unlocked: true,
            warranty: "3 months seller warranty"
          },
          images: [
            "https://images.unsplash.com/photo-1678911988644-6bb169acaa40?w=800&h=600&fit=crop&auto=format",
            "https://images.unsplash.com/photo-1678911988633-4d0b4c0b6c8c?w=800&h=600&fit=crop&auto=format",
            "https://images.unsplash.com/photo-1678911988622-2c5d5e5a5c8c?w=800&h=600&fit=crop&auto=format",
            "https://images.unsplash.com/photo-1678911988611-1c5d5e5a5c8c?w=800&h=600&fit=crop&auto=format"
          ],
          seller: {
            name: "Sarah Johnson",
            rating: 4.8,
            totalSales: 127,
            joinedDate: "2022-03-15",
            verified: true,
            location: "New York, NY",
            responseTime: "Within 2 hours"
          },
          description: "This iPhone 14 Pro is in excellent condition with minimal signs of use. The screen is pristine with no scratches or cracks. Battery health is at 89% and the phone has been kept in a case with screen protector since day one.",
          features: [
            "48MP Main Camera with 2x Telephoto",
            "Dynamic Island",
            "A16 Bionic Chip",
            "ProRAW and ProRes Video",
            "All-day battery life",
            "Face ID",
            "5G Compatible"
          ]
        });
      }
    };

    loadProductData();
  }, [productId]);

  const handleImageSelect = (index) => {
    setSelectedImage(index);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="#" className="hover:text-emerald-600">Home</a>
            <span>/</span>
            <a href="#" className="hover:text-emerald-600">Electronics</a>
            <span>/</span>
            <a href="#" className="hover:text-emerald-600">Smartphones</a>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm">
              {error} - Using sample data for preview
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Image Gallery */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-sm">
              <div className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-gray-100">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                >
                  <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                >
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                      isWishlisted ? 'bg-emerald-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
                    }`}
                  >
                    <Heart size={16} className="sm:w-5 sm:h-5" fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-1.5 sm:p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full transition-colors">
                    <Share2 size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md sm:rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-emerald-500' : 'border-gray-200'
                  }`}
                >
                  <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{product.name}</h1>
                  <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                    <span>{product.specs?.storage} • {product.specs?.color}</span>
                    <span className="flex items-center space-x-1">
                      <CheckCircle size={14} className="sm:w-4 sm:h-4 text-green-500" />
                      <span>{product.condition}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <span className="text-2xl sm:text-4xl font-bold text-gray-900">${product.price}</span>
                <span className="text-lg sm:text-xl text-gray-500 line-through">${product.originalPrice}</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Save ${product.originalPrice - product.price}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 ">
                <button className=" bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base">
                  Buy Now
                </button>
                <button className="border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base">
                  Add to Cart
                </button>
                <button className="border border-gray-300 hover:border-gray-400 text-gray-700 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-colors">
                  <MessageCircle size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center space-x-2">
                  <Shield className="text-green-600" size={16} />
                  <span className="text-xs sm:text-sm font-medium">Buyer Protection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="text-emerald-600" size={16} />
                  <span className="text-xs sm:text-sm font-medium">Fast Shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-emerald-600" size={16} />
                  <span className="text-xs sm:text-sm font-medium">Verified Seller</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Seller Information</h3>
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {product.seller.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{product.seller.name}</h4>
                    {product.seller.verified && (
                      <CheckCircle size={14} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="sm:w-3.5 sm:h-3.5 text-yellow-400 fill-current" />
                      <span>{product.seller.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{product.seller.totalSales} sales</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-1">
                      <MapPin size={12} />
                      <span>{product.seller.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{product.seller.responseTime}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  <MessageCircle size={14} />
                  <span className="hidden sm:inline">Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'details', label: 'Details' },
                { id: 'description', label: 'Description' },
                { id: 'features', label: 'Features' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {selectedTab === 'details' && (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-600 capitalize text-xs sm:text-sm">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-gray-900 text-xs sm:text-sm">{value.toString()}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {showFullDescription ? product.description : `${product.description.substring(0, 200)}...`}
                </p>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-xs sm:text-sm"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              </div>
            )}

            {selectedTab === 'features' && (
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-xs sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneDetailsPage;