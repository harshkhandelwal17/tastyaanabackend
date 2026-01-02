import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopCard = ({ shop, className = '' }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/shop/${shop.id}`);
    };

    // Determine if shop is open
    const isOpen = shop.isOpen !== undefined ? shop.isOpen : true;

    return (
        <motion.div
            onClick={handleClick}
            className={`bg-white rounded-lg sm:rounded-xl shadow-md p-2.5 sm:p-3 md:p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${className}`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                {/* Shop Logo */}
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100">
                        {shop.shopLogo || shop.profileImage ? (
                            <img
                                src={shop.shopLogo || shop.profileImage}
                                alt={shop.shopName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl text-gray-400">
                                🏪
                            </div>
                        )}
                    </div>
                </div>

                {/* Shop Details */}
                <div className="flex-1 min-w-0">
                    {/* Shop Name */}
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-0.5 sm:mb-1 line-clamp-1">
                        {shop.shopName}
                    </h3>

                    {/* Description - Hidden on mobile */}
                    {shop.description && (
                        <p className="hidden sm:block text-xs md:text-sm text-gray-600 mb-1.5 md:mb-2 line-clamp-2">
                            {shop.description}
                        </p>
                    )}

                    {/* Location */}
                    {shop.address && (
                        <div className="flex items-center gap-1 mb-1.5 sm:mb-2 text-[11px] sm:text-xs md:text-sm text-gray-600">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{shop.address}</span>
                        </div>
                    )}

                    {/* Bottom Row: Rating and Status */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                        {/* Rating */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                                {shop.rating || 4.5}
                            </span>
                            {shop.totalReviews && (
                                <span className="hidden sm:inline text-[10px] md:text-xs text-gray-500">
                                    ({shop.totalReviews})
                                </span>
                            )}
                        </div>

                        {/* Vehicle Count */}
                        {shop.vehicleCount !== undefined && (
                            <span className="text-[10px] sm:text-xs text-gray-500">
                                {shop.vehicleCount} vehicles
                            </span>
                        )}

                        {/* Status Badge */}
                        <div className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${isOpen
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {isOpen ? 'Open' : 'Closed'}
                        </div>
                    </div>

                    {/* Available Vehicles Count - Hidden on mobile */}
                    {shop.availableCount !== undefined && shop.availableCount > 0 && (
                        <div className="hidden sm:block mt-1.5 md:mt-2 text-xs md:text-sm text-green-600 font-medium">
                            {shop.availableCount} available now
                        </div>
                    )}

                    {/* Price Range - Hidden on mobile */}
                    {shop.priceRange && (
                        <div className="hidden sm:block mt-1.5 md:mt-2 text-xs md:text-sm text-gray-600">
                            ₹{shop.priceRange.min} - ₹{shop.priceRange.max}/hour
                        </div>
                    )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 self-center">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
            </div>
        </motion.div>
    );
};

export default ShopCard;
