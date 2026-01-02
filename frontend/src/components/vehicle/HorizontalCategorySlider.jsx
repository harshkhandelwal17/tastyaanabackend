import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HorizontalCategorySlider = ({
    categories,
    selectedCategory,
    onCategorySelect,
    className = ''
}) => {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Left Scroll Button */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Categories Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-12 py-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {categories.map((category) => (
                    <motion.button
                        key={category.id}
                        onClick={() => onCategorySelect(category.id)}
                        className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-300 ${selectedCategory === category.id ? 'scale-110' : 'hover:scale-105'
                            }`}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Icon Circle */}
                        <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${selectedCategory === category.id
                                ? 'bg-green-500 shadow-lg shadow-green-200'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {category.icon ? (
                                <img
                                    src={category.icon}
                                    alt={category.name}
                                    className="w-8 h-8 object-contain"
                                />
                            ) : (
                                <span className={`text-xl sm:text-2xl ${selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {category.emoji || '🚗'}
                                </span>
                            )}
                        </div>

                        {/* Category Name */}
                        <span
                            className={`text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category.id
                                ? 'text-green-600'
                                : 'text-gray-600'
                                }`}
                        >
                            {category.name}
                        </span>

                        {/* Count Badge (optional) */}
                        {category.count !== undefined && (
                            <span className="text-xs text-gray-500">
                                ({category.count})
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Right Scroll Button */}
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
        </div>
    );
};

export default HorizontalCategorySlider;
