import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';

const FilterDrawer = ({
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    availableFilters = {}
}) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            fuelType: [],
            zone: [],
            priceRange: { min: 0, max: 10000 },
            availability: null,
            brand: [],
            seatingCapacity: null,
        };
        setLocalFilters(resetFilters);
    };

    const toggleArrayFilter = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(v => v !== value)
                : [...prev[key], value]
        }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-green-600" />
                                <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto px-6 py-4 max-h-[calc(80vh-140px)]">
                            {/* Fuel Type */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Fuel Type</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Petrol', 'Diesel', 'Electric', 'CNG'].map((fuel) => (
                                        <button
                                            key={fuel}
                                            onClick={() => toggleArrayFilter('fuelType', fuel)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${localFilters.fuelType.includes(fuel)
                                                ? 'bg-green-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {fuel}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Zone */}
                            {availableFilters.zones && availableFilters.zones.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Zone</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableFilters.zones.map((zone) => (
                                            <button
                                                key={zone}
                                                onClick={() => toggleArrayFilter('zone', zone)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${localFilters.zone.includes(zone)
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {zone}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price Range */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Price Range (per hour)
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={localFilters.priceRange.min}
                                            onChange={(e) => setLocalFilters(prev => ({
                                                ...prev,
                                                priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                                            }))}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Min"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="number"
                                            value={localFilters.priceRange.max}
                                            onChange={(e) => setLocalFilters(prev => ({
                                                ...prev,
                                                priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                                            }))}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Max"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        ₹{localFilters.priceRange.min} - ₹{localFilters.priceRange.max}
                                    </div>
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Availability</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: null, label: 'All' },
                                        { value: 'available', label: 'Available Now' },
                                        { value: 'booked', label: 'Booked' }
                                    ].map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => setLocalFilters(prev => ({ ...prev, availability: option.value }))}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${localFilters.availability === option.value
                                                ? 'bg-green-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand */}
                            {availableFilters.brands && availableFilters.brands.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Brand</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableFilters.brands.map((brand) => (
                                            <button
                                                key={brand}
                                                onClick={() => toggleArrayFilter('brand', brand)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${localFilters.brand.includes(brand)
                                                    ? 'bg-green-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Seating Capacity */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Seating Capacity</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 4, 5, 7].map((capacity) => (
                                        <button
                                            key={capacity}
                                            onClick={() => setLocalFilters(prev => ({
                                                ...prev,
                                                seatingCapacity: prev.seatingCapacity === capacity ? null : capacity
                                            }))}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${localFilters.seatingCapacity === capacity
                                                ? 'bg-green-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {capacity} {capacity === 1 ? 'Seater' : 'Seaters'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                            <button
                                onClick={handleReset}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FilterDrawer;
