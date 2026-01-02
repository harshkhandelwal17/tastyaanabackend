import React from 'react';
import { motion } from 'framer-motion';

const CategoryToggle = ({ viewMode, onToggle, className = '' }) => {
    return (
        <div className={`flex items-center gap-2 bg-gray-100 p-1 rounded-full ${className}`}>
            {/* By Shop Button */}
            <motion.button
                onClick={() => onToggle('byShop')}
                className={`relative px-6 py-2 rounded-full font-medium transition-all duration-300 ${viewMode === 'byShop'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                whileTap={{ scale: 0.98 }}
            >
                {viewMode === 'byShop' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-green-500 rounded-full shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10">By Shop</span>
            </motion.button>

            {/* By Vehicle Type Button */}
            <motion.button
                onClick={() => onToggle('byVehicleType')}
                className={`relative px-6 py-2 rounded-full font-medium transition-all duration-300 ${viewMode === 'byVehicleType'
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                whileTap={{ scale: 0.98 }}
            >
                {viewMode === 'byVehicleType' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-green-500 rounded-full shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10">By Vehicle Type</span>
            </motion.button>
        </div>
    );
};

export default CategoryToggle;
