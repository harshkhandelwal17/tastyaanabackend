import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, Share2, Shield, Truck, MessageCircle, Phone, Star, ChevronLeft, ChevronRight, 
  MapPin, Clock, User, CheckCircle, AlertCircle, ArrowLeft, Zap, Camera, Cpu, Battery, 
  Wifi, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Download
} from 'lucide-react';

const MobileDetailPage = ({ productId = 'iphone-15-pro-max' }) => {
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      
      const foundPhone = data.phones.find(item => item.id === productId);
      if (!foundPhone) {
        throw new Error('Phone not found');
      }
      
      setPhone(foundPhone);
      
      // Set default selections
      if (foundPhone.specifications?.storage && !selectedStorage) {
        setSelectedStorage(foundPhone.specifications.storage[0]);
      }
      if (foundPhone.specifications?.colors && !selectedColor) {
        setSelectedColor(foundPhone.specifications.colors[0]);
      }
      if (foundPhone.pricing && !selectedCondition) {
        // Set default condition based on available pricing
        if (foundPhone.pricing.new) setSelectedCondition('new');
        else if (foundPhone.pricing.used?.excellent) setSelectedCondition('excellent');
        else if (foundPhone.pricing.refurbished) setSelectedCondition('refurbished');
      }
      
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error loading mobile data:', err);
      
      if (attempt < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadMobileData(attempt + 1), 2000 * (attempt + 1));
        return;
      }
      
      setError(err.message || 'Failed to load phone data');
      setPhone(getFallbackPhone());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPhone = () => ({
    id: 'fallback-phone',
    model: 'iPhone 15 Pro Max',
    brand: 'Apple',
    condition: 'new',
    specifications: {
      display: { size: '6.7 inches', type: 'Super Retina XDR OLED' },
      processor: 'A17 Pro',
      storage: ['256GB', '512GB', '1TB'],
      ram: '8GB',
      camera: { rear: '48MP Main + 12MP Ultra Wide + 12MP Telephoto', front: '12MP TrueDepth' },
      colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium']
    },
    pricing: { new: { '256GB': 1199, '512GB': 1399, '1TB': 1599 } },
    images: {
      primary: 'https://images.unsplash.com/photo-1678911988644-6bb169acaa40?w=800',
      gallery: [
        'https://images.unsplash.com/photo-1678911988644-6bb169acaa40?w=800',
        'https://images.unsplash.com/photo-1632633173522-b27bceba5282?w=800',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      ],
      thumbnails: [
        'https://images.unsplash.com/photo-1678911988644-6bb169acaa40?w=200',
        'https://images.unsplash.com/photo-1632633173522-b27bceba5282?w=200',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'
      ]
    },
    videos: {
      primary: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      gallery: [
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
      ],
      primaryThumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
    },
    seller: { name: 'Apple Store', verified: true, rating: 4.9, type: 'retailer' },
    availability: { location: ['New York'], inStock: true, quantity: 25 }
  });

  useEffect(() => {
    loadMobileData();
  }, [productId]);

  const getMediaType = (url) => {
    if (!url) return 'image';
    const extension = url.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    return videoExtensions.includes(extension) ? 'video' : 'image';
  };

  const availableMedia = useMemo(() => {
    if (!phone?.images && !phone?.videos) return [];
    
    const media = [];
    
    // Add primary image/video
    if (phone.images?.primary) {
      const mediaType = getMediaType(phone.images.primary);
      media.push({ 
        url: phone.images.primary, 
        type: 'primary', 
        mediaType, 
        label: 'Main View',
        thumbnail: phone.images.thumbnail || phone.images.primary
      });
    }
    
    // Add gallery images/videos
    if (phone.images?.gallery) {
      phone.images.gallery.forEach((url, index) => {
        if (url !== phone.images.primary) {
          const mediaType = getMediaType(url);
          media.push({ 
            url, 
            type: 'gallery', 
            mediaType, 
            label: `${mediaType === 'video' ? 'Video' : 'View'} ${index + 1}`,
            thumbnail: phone.images.thumbnails?.[index] || url
          });
        }
      });
    }
    
    // Add specific view images/videos
    if (phone.images?.views) {
      Object.entries(phone.images.views).forEach(([view, url]) => {
        if (!media.find(item => item.url === url)) {
          const mediaType = getMediaType(url);
          media.push({ 
            url, 
            type: 'view', 
            mediaType, 
            label: view.charAt(0).toUpperCase() + view.slice(1),
            thumbnail: phone.images.viewThumbnails?.[view] || url
          });
        }
      });
    }
    
    // Add dedicated videos if available
    if (phone.videos) {
      if (phone.videos.primary) {
        media.push({ 
          url: phone.videos.primary, 
          type: 'primary', 
          mediaType: 'video', 
          label: 'Product Video',
          thumbnail: phone.videos.primaryThumbnail || phone.images?.primary
        });
      }
      
      if (phone.videos.gallery) {
        phone.videos.gallery.forEach((url, index) => {
          media.push({ 
            url, 
            type: 'gallery', 
            mediaType: 'video', 
            label: `Video ${index + 1}`,
            thumbnail: phone.videos.thumbnails?.[index] || phone.images?.primary
          });
        });
      }
    }
    
    return media;
  }, [phone]);

  const currentPrice = useMemo(() => {
    if (!phone?.pricing || !selectedStorage || !selectedCondition) return null;
    
    const pricing = phone.pricing[selectedCondition];
    if (!pricing) return null;
    
    if (typeof pricing === 'object') {
      return pricing[selectedStorage] || Object.values(pricing)[0];
    }
    
    return pricing;
  }, [phone, selectedStorage, selectedCondition]);

  const originalPrice = useMemo(() => {
    if (!phone?.pricing?.new || !selectedStorage) return null;
    return phone.pricing.new[selectedStorage];
  }, [phone, selectedStorage]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const nextMedia = () => {
    setSelectedMedia((prev) => (prev + 1) % availableMedia.length);
    setIsVideoPlaying(false);
  };

  const prevMedia = () => {
    setSelectedMedia((prev) => (prev - 1 + availableMedia.length) % availableMedia.length);
    setIsVideoPlaying(false);
  };

  const toggleVideoPlay = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleVideoMute = () => {
    setIsVideoMuted(!isVideoMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const retryLoad = () => {
    setError(null);
    setRetryCount(0);
    loadMobileData();
  };

  const getConditionLabel = (condition) => {
    const labels = {
      'new': 'Brand New',
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'refurbished': 'Refurbished',
      'used': 'Pre-owned'
    };
    return labels[condition] || condition;
  };

  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <p className="text-gray-700 font-medium mb-2">Loading phone details...</p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500">Attempt {retryCount + 1}/{MAX_RETRIES + 1}</p>
        )}
      </div>
    </div>
  );

  if (loading) return <LoadingState />;

  if (!phone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-800 font-semibold mb-1">Phone Not Found</p>
            <p className="text-red-600 text-sm">The requested phone could not be loaded.</p>
          </div>
          <button 
            onClick={retryLoad}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header/Navigation */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors p-1 sm:p-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">Back</span>
              </button>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 min-w-0">
                <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
                <span>/</span>
                <a href="#" className="hover:text-blue-600 transition-colors">Mobiles</a>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{phone.brand}</span>
              </div>
              {/* Mobile breadcrumb */}
              <div className="md:hidden flex items-center text-xs text-gray-500 min-w-0 ml-2">
                <span className="text-gray-900 font-medium truncate">{phone.brand} {phone.model}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isWishlisted 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <p className="font-medium text-red-800 text-sm sm:text-base">Data Loading Error</p>
                  <p className="text-sm text-red-600 break-words">{error}</p>
                  <p className="text-xs text-red-500 mt-1">Showing fallback data for preview</p>
                </div>
              </div>
              <button 
                onClick={retryLoad}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex-shrink-0"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Media Gallery */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Main Media Display */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              <div className={`relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 ${isFullscreen ? 'fixed inset-0 z-50 aspect-auto' : ''}`}>
                {availableMedia.length > 0 && (
                  <div className="w-full h-full">
                    {availableMedia[selectedMedia]?.mediaType === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={availableMedia[selectedMedia]?.url}
                          className="w-full h-full object-cover"
                          muted={isVideoMuted}
                          autoPlay={isVideoPlaying}
                          loop
                          playsInline
                          onError={(e) => {
                            console.error('Video failed to load:', e);
                          }}
                        />
                        
                        {/* Video Controls */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={toggleVideoPlay}
                              className="bg-white/90 hover:bg-white text-gray-800 p-3 sm:p-4 rounded-full transition-all duration-200 backdrop-blur-sm"
                            >
                              {isVideoPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-1" />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Video Control Bar */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={toggleVideoMute}
                                className="text-white hover:text-gray-300 transition-colors"
                              >
                                {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </button>
                            </div>
                            <button
                              onClick={toggleFullscreen}
                              className="text-white hover:text-gray-300 transition-colors"
                            >
                              <Maximize className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={availableMedia[selectedMedia]?.url}
                        alt={phone.model}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800';
                        }}
                      />
                    )}
                  </div>
                )}
                
                {/* Navigation Arrows */}
                {availableMedia.length > 1 && !isFullscreen && (
                  <>
                    <button
                      onClick={prevMedia}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={nextMedia}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
                
                {/* Media Indicators */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2">
                  {availableMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedMedia(index);
                        setIsVideoPlaying(false);
                      }}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                        selectedMedia === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Media Type Indicator */}
                {availableMedia[selectedMedia]?.mediaType === 'video' && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Video
                  </div>
                )}
                
                {/* Verified Badge */}
                {phone.seller?.verified && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-emerald-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Verified</span>
                  </div>
                )}
                
                {/* Close Fullscreen */}
                {isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 bg-black/60 text-white p-3 rounded-full backdrop-blur-sm z-10"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Media Thumbnails Grid */}
            {availableMedia.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {availableMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedMedia(index);
                      setIsVideoPlaying(false);
                    }}
                    className={`relative aspect-square rounded-md sm:rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      selectedMedia === index 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={media.thumbnail || media.url} 
                      alt={media.label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200';
                      }}
                    />
                    
                    {/* Video Play Icon Overlay */}
                    {media.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-1.5 sm:p-2">
                          <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-800" />
                        </div>
                      </div>
                    )}
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-1 right-1 text-xs">
                      {media.mediaType === 'video' ? (
                        <div className="bg-red-500 text-white px-1 py-0.5 rounded text-[10px] font-medium">
                          VIDEO
                        </div>
                      ) : (
                        <div className="bg-blue-500 text-white px-1 py-0.5 rounded text-[10px] font-medium">
                          IMG
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Main Product Info */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600 font-medium">{phone.brand}</span>
                  {phone.seller?.verified && (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {phone.model}
                </h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                    {getConditionLabel(phone.condition)}
                  </span>
                  {phone.availability?.inStock && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">In Stock</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                {currentPrice && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {formatPrice(currentPrice)}
                      </span>
                      {originalPrice && originalPrice !== currentPrice && (
                        <span className="text-base sm:text-lg text-gray-500 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                    {originalPrice && originalPrice !== currentPrice && (
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Save {formatPrice(originalPrice - currentPrice)}
                        </span>
                        <span className="text-xs text-gray-600">
                          ({Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% off)
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Options Section */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Storage Options */}
                  {phone.specifications?.storage && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Storage:</p>
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                        {phone.specifications.storage.map((storage) => (
                          <button
                            key={storage}
                            onClick={() => setSelectedStorage(storage)}
                            className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-center ${
                              selectedStorage === storage
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            {storage}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Options */}
                  {phone.specifications?.colors && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Color:</p>
                      <div className="flex flex-wrap gap-2">
                        {phone.specifications.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                              selectedColor === color
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base">
                  <span className="flex items-center justify-center gap-2">
                    Buy Now
                    <span className="text-xs opacity-75">• Fast Checkout</span>
                  </span>
                </button>
                <button className="flex-1 border-2 border-blue-600 text-blue-600 font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-colors text-sm sm:text-base">
                  Add to Cart
                </button>
                <button className="sm:w-auto p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sm:hidden text-sm">Contact</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                <div className="text-center">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Protected</span>
                </div>
                <div className="text-center">
                  <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Fast Ship</span>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mx-auto mb-1" />
                  <span className="text-xs font-medium text-gray-700">Verified</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Seller Information</h3>
              <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {phone.seller.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{phone.seller.name}</h4>
                      {phone.seller.verified && (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{phone.seller.rating}</span>
                      </div>
                      {phone.seller.type && (
                        <span className="capitalize bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {phone.seller.type}
                        </span>
                      )}
                    </div>
                    {phone.availability?.location && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{phone.availability.location[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Seller
                </button>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Key Specifications</h3>
              <div className="space-y-2 sm:space-y-3">
                {phone.specifications?.display && (
                  <div className="flex justify-between items-start sm:items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>Display</span>
                    </span>
                    <span className="font-medium text-gray-900 text-sm text-right">
                      {phone.specifications.display.size}
                      {phone.specifications.display.type && (
                        <div className="text-xs text-gray-500 mt-1">
                          {phone.specifications.display.type}
                        </div>
                      )}
                    </span>
                  </div>
                )}
                {phone.specifications?.processor && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 flex-shrink-0" />
                      Processor
                    </span>
                    <span className="font-medium text-gray-900 text-sm text-right">
                      {phone.specifications.processor}
                    </span>
                  </div>
                )}
                {phone.specifications?.ram && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 flex-shrink-0" />
                      RAM
                    </span>
                    <span className="font-medium text-gray-900 text-sm">
                      {phone.specifications.ram}
                    </span>
                  </div>
                )}
                {phone.specifications?.camera && (
                  <div className="flex justify-between items-start py-2">
                    <span className="text-gray-600 flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 flex-shrink-0" />
                      Camera
                    </span>
                    <span className="font-medium text-gray-900 text-right text-xs sm:text-sm max-w-[60%]">
                      {phone.specifications.camera.rear}
                      {phone.specifications.camera.front && (
                        <div className="text-xs text-gray-500 mt-1">
                          Front: {phone.specifications.camera.front}
                        </div>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDetailPage;