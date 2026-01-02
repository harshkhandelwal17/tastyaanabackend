import React from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  Package, 
  Users, 
  ChevronRight,
  Award,
  CheckCircle2
} from 'lucide-react';

const VendorCard = ({ vendor, onClick }) => {
  // Check if vendor uses weight-based pricing
  const pricingModel = vendor?.pricingConfig?.model || 'per_piece';
  const isWeightBased = pricingModel === 'weight_based' || pricingModel === 'hybrid';

  const getStartingPrice = () => {
    if (isWeightBased && vendor.pricingConfig?.weightBasedPricing) {
      // For weight-based, show price per kg
      const prices = Object.values(vendor.pricingConfig.weightBasedPricing).filter(p => p > 0);
      return prices.length > 0 ? Math.min(...prices) : 50;
    }
    
    // For per-piece pricing
    if (vendor.pricing && typeof vendor.pricing === 'object') {
      let minPrice = Infinity;
      Object.keys(vendor.pricing).forEach(itemType => {
        const itemPricing = vendor.pricing[itemType];
        if (itemPricing && typeof itemPricing === 'object') {
          Object.keys(itemPricing).forEach(serviceType => {
            const price = itemPricing[serviceType];
            if (typeof price === 'number' && price > 0) {
              minPrice = Math.min(minPrice, price);
            }
          });
        }
      });
      return minPrice !== Infinity ? minPrice : 20;
    }
    return 20;
  };

  return (
    <div 
      onClick={() => onClick && onClick(vendor)}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 active:scale-[0.98] overflow-hidden hover:-translate-y-1"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-5 text-white overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">{vendor.logo || '🧺'}</div>
            {vendor.isVerified && (
              <div className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg border border-white/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </div>
            )}
          </div>
          
          <h3 className="font-extrabold text-xl mb-2 tracking-tight">{vendor.name}</h3>
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{vendor.address?.area || vendor.address?.city || 'Indore'}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-bold text-sm text-gray-900">{vendor.rating?.toFixed(1) || '4.5'}</span>
          </div>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-600 font-medium">{vendor.totalOrders || 0} orders</span>
        </div>

        <p className="text-gray-600 mb-5 line-clamp-2 text-sm leading-relaxed">
          {vendor.description || 'Premium laundry services with best quality and quick delivery.'}
        </p>

        {/* Pricing Info */}
        <div className="mb-5 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600 mb-1 font-medium">Starting from</div>
              <div className="font-extrabold text-blue-600 text-2xl">
                ₹{getStartingPrice()}
                {isWeightBased && <span className="text-base">/kg</span>}
              </div>
            </div>
            {isWeightBased && (
              <div className="text-xs text-blue-800 font-bold bg-blue-200 px-3 py-2 rounded-xl border border-blue-300">
                ⚖️ Weight-based
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {vendor.services && vendor.services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {vendor.services.slice(0, 3).map((service, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                {service.replace('_', ' ')}
              </span>
            ))}
            {vendor.services.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                +{vendor.services.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick(vendor);
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group/btn"
        >
          <span>Book Now</span>
          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default VendorCard;