import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt
} from "react-icons/fa";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BhandaraCard from "../../components/buyer/BhandaraCard";
import BhandaraService from "../../services/bhandaraService";
import Header from "../../layout/buyer/Header";
import Footer from "../../layout/buyer/Footer";

const BhandaraListPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const [bhandaras, setBhandaras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'upcoming', 'this-week'

  useEffect(() => {
    fetchBhandaras();
  }, []);

  const fetchBhandaras = async () => {
    try {
      setLoading(true);
      const result = await BhandaraService.getAllBhandaras();
      
      if (result.success) {
        setBhandaras(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load Bhandaras. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBhandaras = bhandaras.filter(bhandara => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      bhandara.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhandara.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhandara.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhandara.foodItems.some(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!matchesSearch) return false;

    // Date filter
    const now = new Date();
    const startDate = new Date(bhandara.dateTimeStart);
    const endDate = new Date(bhandara.dateTimeEnd);

    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return startDate >= today && startDate < tomorrow;
      
      case 'upcoming':
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return startDate >= now && startDate <= nextWeek;
      
      case 'this-week':
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return startDate >= now && startDate <= weekEnd;
      
      default:
        return startDate >= now; // Only show future events
    }
  });

  const getFilterCount = (filterType) => {
    const now = new Date();
    
    switch (filterType) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return bhandaras.filter(b => {
          const startDate = new Date(b.dateTimeStart);
          return startDate >= today && startDate < tomorrow;
        }).length;
      
      case 'upcoming':
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bhandaras.filter(b => {
          const startDate = new Date(b.dateTimeStart);
          return startDate >= now && startDate <= nextWeek;
        }).length;
      
      case 'this-week':
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bhandaras.filter(b => {
          const startDate = new Date(b.dateTimeStart);
          return startDate >= now && startDate <= weekEnd;
        }).length;
      
      default:
        return bhandaras.filter(b => new Date(b.dateTimeStart) >= now).length;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading Bhandaras...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchBhandaras}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 mt-40">
      <Header />    
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
            <h1 className="text-center text-xl md:text-3xl font-medium mb-4 flex flex-col items-center gap-2">
  A Public Welfare Initiative By
  <img 
  src="https://res.cloudinary.com/dcha7gy9o/image/upload/v1758483675/tastyaana_avwqpb.png" 
  alt="Tastyaana"
  className="h-10 md:h-12 max-h-22 object-contain"
  style={{ maxWidth: '300px' }}
/>

</h1>
              <h1 className="text-2xl md:text-4xl font-bold mb-4">
                🍽️ Find Free Food Events (Bhandaras)
              </h1>
              <p className="text-xl text-orange-100 mb-6 max-w-3xl mx-auto">
                Discover free food events (Bhandaras) happening in Indore. Join the community and experience the joy of sharing meals together.
              </p>
              <Link
                to="/bhandara/submit"
                className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                <FaPlus className="mr-2" />
                Submit Your Bhandara
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, location, organizer, or food items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFilter className="mr-2" />
                Filters
                {filter !== 'all' && (
                  <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All Events' },
                      { key: 'today', label: 'Today' },
                      { key: 'upcoming', label: 'Next 7 Days' },
                      { key: 'this-week', label: 'This Week' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === key
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label} ({getFilterCount(key)})
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {filter === 'all' ? 'All Events' : 
                 filter === 'today' ? "Today's Bhandaras" :
                 filter === 'upcoming' ? 'Upcoming This Week' :
                 'This Week\'s Events'}
              </h2>
              <p className="text-gray-600">
                {filteredBhandaras.length} event{filteredBhandaras.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <FaMapMarkerAlt className="mr-1" />
              Indore, MP
            </div>
          </div>

          {/* Bhandara Grid */}
          {filteredBhandaras.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No events found' : 'No events scheduled'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to submit a Bhandara event for the community!'
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/bhandara/submit"
                  className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Submit Your Bhandara
                </Link>
              )}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredBhandaras.map((bhandara, index) => (
                  <motion.div
                    key={bhandara._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <BhandaraCard bhandara={bhandara} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Load More Button (for future pagination) */}
          {filteredBhandaras.length > 0 && filteredBhandaras.length >= 6 && (
            <div className="text-center mt-12">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
                Load More Events
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BhandaraListPage;