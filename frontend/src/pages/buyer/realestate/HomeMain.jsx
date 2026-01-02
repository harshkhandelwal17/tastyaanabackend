import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star, Bed, Bath, Square } from 'lucide-react';
import rentalData from './rental.json';

const RentalHomeSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroListing, setHeroListing] = useState(null);
  const [otherListings, setOtherListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageInfo, setPageInfo] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    setHeroListing(rentalData.heroListing);
    setOtherListings(rentalData.properties);
    setCategories(rentalData.categories);
    setPageInfo(rentalData.pageInfo);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">{pageInfo.title}</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">{pageInfo.subtitle}</p>
        </div>

        {/* Hero Section - Featured Property */}
        {heroListing && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {/* Hero Image */}
              <div className="relative">
                <img
                  src={heroListing.image}
                  alt={heroListing.title}
                  className="w-full h-40 sm:h-48 object-cover"
                />
                {heroListing.featured && (
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-md">
                    Featured
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 shadow-md">
                  <Star size={12} className="text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">{heroListing.rating}</span>
                </div>
              </div>

              {/* Hero Content */}
              <div className="p-3 sm:p-4 flex flex-col justify-center">
                <div className="mb-3">
                  <span className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-medium mb-2">
                    {heroListing.type}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{heroListing.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={12} className="mr-1" />
                    <span className="text-xs sm:text-sm">{heroListing.location}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{heroListing.description}</p>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Bed size={16} className="mx-auto mb-1 text-teal-600" />
                    <div className="text-sm font-semibold text-gray-900">{heroListing.beds}</div>
                    <div className="text-xs text-gray-600">Beds</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Bath size={16} className="mx-auto mb-1 text-teal-600" />
                    <div className="text-sm font-semibold text-gray-900">{heroListing.baths}</div>
                    <div className="text-xs text-gray-600">Baths</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Square size={16} className="mx-auto mb-1 text-teal-600" />
                    <div className="text-sm font-semibold text-gray-900">{heroListing.sqft}</div>
                    <div className="text-xs text-gray-600">Sq Ft</div>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">{heroListing.price}</span>
                    <span className="text-gray-600 text-sm">/{heroListing.priceFrequency}</span>
                  </div>
                  <button className="bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold text-xs sm:text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">Browse by Category</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {categories.map((category, index) => (
              <div
                key={category.id || index}
                className="relative rounded-lg p-3 sm:p-4 text-white cursor-pointer hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
                style={{
                  backgroundImage: `url(${category.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Dark overlay with blur */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
                
                {/* Colored overlay for theme */}
                <div className={`absolute inset-0 ${category.color} opacity-60`}></div>
                
                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2 drop-shadow-lg">{category.icon}</div>
                    <h3 className="text-sm sm:text-base font-bold mb-1 drop-shadow-md">{category.title}</h3>
                    <p className="text-white/90 text-xs hidden sm:block mb-1 drop-shadow-sm">{category.description}</p>
                    <p className="text-xs text-white/85 drop-shadow-sm">{category.count}</p>
                  </div>
                  <div className="text-white/60 ml-1 sm:ml-2">
                    <ChevronRight size={16} className="sm:w-5 sm:h-5 drop-shadow-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Listings - Responsive grid */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">More Properties</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {otherListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200">
                {/* Property Image */}
                <div className="relative">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-28 sm:h-32 md:h-36 object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-white px-1 py-0.5 rounded text-xs font-medium text-gray-700 shadow-sm">
                    {listing.type}
                  </div>
                  <div className="absolute top-1 right-1 bg-white px-1 py-0.5 rounded flex items-center space-x-1 shadow-sm">
                    <Star size={8} className="text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{listing.rating}</span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-2 sm:p-3">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{listing.title}</h4>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={10} className="mr-1" />
                    <span className="text-xs line-clamp-1">{listing.location}</span>
                  </div>
                  
                  {/* Property Features */}
                  <div className="flex items-center justify-between text-gray-600 mb-2 text-xs">
                    <div className="flex items-center space-x-0.5">
                      <Bed size={10} />
                      <span className="font-medium">{listing.beds}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      <Bath size={10} />
                      <span className="font-medium">{listing.baths}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      <Square size={10} />
                      <span className="font-medium">{listing.sqft}</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base font-bold text-gray-900">{listing.price}</span>
                      <span className="text-gray-600 text-xs">/{listing.priceFrequency}</span>
                    </div>
                    <button className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700 transition-colors font-medium">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalHomeSection;