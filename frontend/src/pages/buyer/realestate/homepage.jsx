import { useState, useEffect, useRef } from 'react';
import { Search, Home, MapPin, Filter, Heart, X, Menu, ChevronDown, ChevronLeft, ChevronRight, Star, Phone, Mail, Instagram, Facebook, Twitter, User, Bell, Grid, List } from 'lucide-react';

export default function RealEstateMobileApp() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeProperty, setActiveProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState('grid');
  
  // Generate sample properties
  useEffect(() => {
    const sampleProperties = [
      {
        id: 1,
        title: "Modern Luxury Home",
        price: 850000,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2500,
        address: "Los Angeles, CA",
        type: "house",
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "This stunning modern home features an open floor plan with high ceilings, floor-to-ceiling windows, and premium finishes throughout.",
        featured: true
      },
      {
        id: 2,
        title: "Charming Traditional Home",
        price: 650000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        address: "Dallas, TX",
        type: "house",
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Classic elegance meets modern comfort in this beautiful traditional home.",
        featured: true
      },
      {
        id: 3,
        title: "Contemporary Waterfront Villa",
        price: 950000,
        bedrooms: 5,
        bathrooms: 4,
        sqft: 3200,
        address: "Miami, FL",
        type: "house",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Luxurious waterfront property with breathtaking views and high-end finishes.",
        featured: true
      },
      {
        id: 4,
        title: "Urban Loft Apartment",
        price: 420000,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 950,
        address: "Chicago, IL",
        type: "apartment",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Stylish urban loft with exposed brick walls and high ceilings.",
        featured: false
      },
      {
        id: 5,
        title: "Mountain View Retreat",
        price: 780000,
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 2100,
        address: "Denver, CO",
        type: "house",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Beautiful home with stunning mountain views from nearly every room.",
        featured: false
      },
      {
        id: 6,
        title: "Coastal Beach House",
        price: 1100000,
        bedrooms: 4,
        bathrooms: 3.5,
        sqft: 2600,
        address: "San Diego, CA",
        type: "house",
        image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Spectacular beach house with direct ocean access.",
        featured: false
      },
      {
        id: 7,
        title: "Spacious Family Home",
        price: 720000,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2300,
        address: "Portland, OR",
        type: "house",
        image: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Perfect family home in a quiet neighborhood with excellent schools.",
        featured: false
      },
      {
        id: 8,
        title: "Downtown Penthouse",
        price: 1300000,
        bedrooms: 3,
        bathrooms: 3.5,
        sqft: 2800,
        address: "Seattle, WA",
        type: "apartment",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Stunning penthouse with panoramic city and water views.",
        featured: false
      },
    ];
    
    setProperties(sampleProperties);
    setFilteredProperties(sampleProperties);
  }, []);
  
  // Filter properties
  useEffect(() => {
    let filtered = [...properties];
    
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (priceFilter !== 'all') {
      if (priceFilter === 'under500k') {
        filtered = filtered.filter(property => property.price < 500000);
      } else if (priceFilter === '500k-750k') {
        filtered = filtered.filter(property => property.price >= 500000 && property.price <= 750000);
      } else if (priceFilter === '750k-1m') {
        filtered = filtered.filter(property => property.price > 750000 && property.price <= 1000000);
      } else if (priceFilter === 'above1m') {
        filtered = filtered.filter(property => property.price > 1000000);
      }
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }
    
    setFilteredProperties(filtered);
  }, [searchTerm, priceFilter, typeFilter, properties]);
  
  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };
  
  const openPropertyDetails = (property) => {
    setActiveProperty(property);
    setShowPropertyModal(true);
  };

  const PropertyCard = ({ property, compact = false }) => (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${
        compact ? 'w-36 md:w-40' : 'max-w-xs'
      }`}
      onClick={() => openPropertyDetails(property)}
    >
      <div className={`relative ${compact ? 'h-20 md:h-24' : 'h-28 md:h-32'} bg-cover bg-center`} 
           style={{ backgroundImage: `url(${property.image})` }}>
        {property.featured && !compact && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            Featured
          </div>
        )}
        <button 
          className={`absolute ${compact ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'} rounded-full ${
            favorites.includes(property.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'
          }`}
          onClick={(e) => toggleFavorite(property.id, e)}
        >
          <Heart className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} ${
            favorites.includes(property.id) ? 'fill-current' : ''
          }`} />
        </button>
      </div>
      
      <div className={`${compact ? 'p-2' : 'p-3'}`}>
        <div className={`font-bold text-blue-600 ${compact ? 'text-sm' : 'text-base md:text-lg'} mb-1`}>
          ${(property.price / 1000).toFixed(0)}K
        </div>
        <h3 className={`font-medium text-gray-800 ${compact ? 'text-xs' : 'text-sm'} line-clamp-1 mb-1`}>
          {property.title}
        </h3>
        <div className={`flex items-center text-gray-500 ${compact ? 'text-xs' : 'text-xs'} mb-2`}>
          <MapPin className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1 flex-shrink-0`} />
          <span className="truncate">{property.address}</span>
        </div>
        <div className={`flex text-gray-600 ${compact ? 'text-xs' : 'text-xs'} ${compact ? 'space-x-1' : 'space-x-2'}`}>
          <span>{property.bedrooms}bd</span>
          <span>•</span>
          <span>{property.bathrooms}ba</span>
          {!compact && (
            <>
              <span>•</span>
              <span className="hidden md:inline">{property.sqft.toLocaleString()}ft²</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const ListViewCard = ({ property }) => (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-3 flex"
      onClick={() => openPropertyDetails(property)}
    >
      <div className="w-24 h-20 bg-cover bg-center flex-shrink-0" 
           style={{ backgroundImage: `url(${property.image})` }}>
        <button 
          className={`absolute mt-1 ml-1 p-1 rounded-full ${
            favorites.includes(property.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'
          }`}
          onClick={(e) => toggleFavorite(property.id, e)}
        >
          <Heart className={`h-3 w-3 ${
            favorites.includes(property.id) ? 'fill-current' : ''
          }`} />
        </button>
      </div>
      
      <div className="p-3 flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-800 text-sm line-clamp-1 flex-1">
            {property.title}
          </h3>
          <div className="font-bold text-blue-600 text-sm ml-2">
            ${(property.price / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="flex items-center text-gray-500 text-xs mb-1">
          <MapPin className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>
        <div className="flex text-gray-600 text-xs space-x-2">
          <span>{property.bedrooms}bd</span>
          <span>•</span>
          <span>{property.bathrooms}ba</span>
          <span>•</span>
          <span>{property.sqft.toLocaleString()}ft²</span>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-800">DreamHome</h1>
                <p className="text-xs text-gray-500">Find your perfect home</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="relative p-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'home' && (
        <div className="pb-20">
          {/* Hero Section */}
          <div className="relative h-48 mx-4 mt-4 rounded-2xl overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")' }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <h2 className="text-2xl font-bold text-white mb-2">Find Your Dream Home</h2>
              <p className="text-white/90 text-sm mb-4">Discover perfect properties in your area</p>
              <button className="bg-white text-gray-800 px-4 py-2 rounded-xl font-medium text-sm w-fit">
                Explore Now
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="px-4 py-4 bg-gray-50">
            <div className="flex space-x-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search location, property..."
                  className="w-full py-2.5 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="p-2.5 bg-blue-500 rounded-xl"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 text-white" />
              </button>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex space-x-2">
                  <select 
                    className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  >
                    <option value="all">Any Price</option>
                    <option value="under500k">Under $500K</option>
                    <option value="500k-750k">$500K - $750K</option>
                    <option value="750k-1m">$750K - $1M</option>
                    <option value="above1m">Above $1M</option>
                  </select>
                  <select 
                    className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                <div className="text-lg font-bold text-blue-600">1.5K+</div>
                <div className="text-xs text-gray-600">Properties</div>
              </div>
              <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                <div className="text-lg font-bold text-green-600">98%</div>
                <div className="text-xs text-gray-600">Satisfied</div>
              </div>
              <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                <div className="text-lg font-bold text-purple-600">25+</div>
                <div className="text-xs text-gray-600">Years</div>
              </div>
              <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                <div className="text-lg font-bold text-orange-600">50+</div>
                <div className="text-xs text-gray-600">Agents</div>
              </div>
            </div>
          </div>

          {/* Featured Properties */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">Featured</h2>
              <button className="text-blue-600 text-sm font-medium">View All</button>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {filteredProperties.filter(p => p.featured).map(property => (
                <PropertyCard key={property.id} property={property} compact={true} />
              ))}
            </div>
          </div>

          {/* All Properties */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">Recent Properties</h2>
              <div className="flex items-center space-x-2">
                <button 
                  className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredProperties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div>
                {filteredProperties.map(property => (
                  <ListViewCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="px-4 py-4 pb-20">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Favorites ({favorites.length})</h2>
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No favorites yet</h3>
              <p className="text-gray-500 text-sm">Start adding properties to your favorites</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {properties.filter(p => favorites.includes(p.id)).map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="px-4 py-4 pb-20">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 py-2">
          <button 
            className={`flex flex-col items-center py-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={() => setActiveTab('home')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            className={`flex flex-col items-center py-2 ${activeTab === 'search' ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </button>
          <button 
            className={`flex flex-col items-center py-2 relative ${activeTab === 'favorites' ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <div className="absolute top-1 right-6 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
            <span className="text-xs mt-1">Favorites</span>
          </button>
          <button 
            className={`flex flex-col items-center py-2 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && activeProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${activeProperty.image})` }}>
              <button 
                className="absolute top-3 right-3 bg-white/80 p-2 rounded-full"
                onClick={() => setShowPropertyModal(false)}
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>
              <button 
                className={`absolute top-3 left-3 p-2 rounded-full ${
                  favorites.includes(activeProperty.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'
                }`}
                onClick={() => toggleFavorite(activeProperty.id)}
              >
                <Heart className={`h-4 w-4 ${favorites.includes(activeProperty.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{activeProperty.title}</h2>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{activeProperty.address}</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600">${activeProperty.price.toLocaleString()}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4 border-y border-gray-100 py-3">
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Bedrooms</div>
                  <div className="font-bold text-gray-800">{activeProperty.bedrooms}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Bathrooms</div>
                  <div className="font-bold text-gray-800">{activeProperty.bathrooms}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Area</div>
                  <div className="font-bold text-gray-800">{activeProperty.sqft.toLocaleString()} ft²</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 text-sm">{activeProperty.description}</p>
              </div>
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
                  Contact Agent
                </button>
                <button className="px-4 py-3 border border-gray-200 rounded-xl">
                  <Phone className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button className="fixed bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-40">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}