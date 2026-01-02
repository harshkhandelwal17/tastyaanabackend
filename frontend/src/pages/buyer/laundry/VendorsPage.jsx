import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VendorList } from '../../../components/laundry/VendorList';
import laundryService from '../../../services/laundryService';

export const VendorsPage = ({ onVendorSelect }) => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'rating',
    minRating: 0
  });

  const getStartingPrice = (vendor) => {
    if (vendor.pricing && typeof vendor.pricing === 'object') {
      // Try to find the lowest price
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

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.minRating) params.minRating = filters.minRating;
      
      const data = await laundryService.getVendors(params);
      let vendorsList = data?.data || data?.vendors || [];
      
      // Client-side filtering if backend doesn't support it
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        vendorsList = vendorsList.filter(v => 
          v.name?.toLowerCase().includes(searchLower) ||
          v.description?.toLowerCase().includes(searchLower) ||
          v.address?.area?.toLowerCase().includes(searchLower) ||
          v.address?.city?.toLowerCase().includes(searchLower)
        );
      }
      
      // Client-side sorting
      if (filters.sortBy === 'rating') {
        vendorsList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'price') {
        // Sort by starting price
        vendorsList.sort((a, b) => {
          const priceA = getStartingPrice(a);
          const priceB = getStartingPrice(b);
          return priceA - priceB;
        });
      }
      
      // Filter by minimum rating
      if (filters.minRating > 0) {
        vendorsList = vendorsList.filter(v => (v.rating || 0) >= filters.minRating);
      }
      
      setVendors(vendorsList);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 lg:p-6">
      <div className="max-w-md lg:max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/laundry')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold text-sm transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        
        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Choose Your Vendor</h1>
          <p className="text-gray-600 text-base lg:text-lg">Select from our trusted laundry partners</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl shadow-xl p-5 lg:p-6 mb-8 border-2 border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base bg-gray-50 font-medium"
              />
            </div>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base font-bold bg-gray-50"
            >
              <option value="rating">Sort by Rating</option>
              <option value="price">Sort by Price</option>
              <option value="turnaround">Sort by Speed</option>
            </select>

            <select
              value={filters.minRating}
              onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})}
              className="px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base font-bold bg-gray-50"
            >
              <option value="0">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
        </div>

        {/* Vendors List */}
        <VendorList vendors={vendors} loading={loading} onVendorClick={onVendorSelect} />
      </div>
    </div>
  );
};

