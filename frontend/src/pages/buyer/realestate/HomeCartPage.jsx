import { useState, useEffect } from 'react';
import { Home, User, Trash2, Calendar, Phone, Mail, MapPin, Bed, Bath, Square } from 'lucide-react';
import rentalData from './rental.json';

export default function PropertyCart() {
  const [cartProperties, setCartProperties] = useState([]);

  // Initialize cart with data from rental.json
  useEffect(() => {
    if (rentalData.properties) {
      const mappedProperties = rentalData.properties.map(property => {
        const priceValue = parseInt(property.price.replace('₹', '').replace(',', ''));
        return {
          id: property.id,
          title: property.title,
          location: property.location,
          city: property.location, // Using location as city for now
          price: priceValue,
          priceFrequency: property.priceFrequency,
          bedrooms: property.beds,
          bathrooms: property.baths,
          sqft: property.sqft,
          image: property.image,
          bookingAmount: Math.floor(priceValue * 0.1) // 10% of price as booking amount
        };
      });
      setCartProperties(mappedProperties);
    }
  }, []);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const removeProperty = (propertyId) => {
    setCartProperties(prev => prev.filter(property => property.id !== propertyId));
  };

  const clearCart = () => {
    setCartProperties([]);
  };

  const totalBookingAmount = cartProperties.reduce((sum, property) => sum + property.bookingAmount, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const scheduleVisit = (property) => {
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const scheduleAllVisits = () => {
    alert('Scheduling visits for all properties...');
  };

  const proceedToBook = () => {
    if (cartProperties.length === 0) {
      alert('No properties in cart to book');
      return;
    }
    alert(`Proceeding to book ${cartProperties.length} properties with total booking amount: ${formatPrice(totalBookingAmount)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Home className="h-5 w-5 text-white" />
            <h1 className="ml-2 text-lg font-bold">Estate</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5" />
            <span className="hidden md:inline text-sm">Account</span>
          </div>
        </div>
      </header> */}

      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <nav className="mb-6">
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Home</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Properties</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Agents</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
          </div>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cart</h1>
          {cartProperties.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Properties List */}
          <div className="lg:col-span-2 space-y-6">
            {cartProperties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-sm text-gray-500">Add some properties to your favorites to see them here</p>
                <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  Browse Properties
                </button>
              </div>
            ) : (
              cartProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-64 h-48 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={property.image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{property.title}</h3>
                        <button 
                          onClick={() => removeProperty(property.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{property.location} • {property.city}</span>
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-800 mb-3">
                        {formatPrice(property.price)}
                        <span className="text-sm text-gray-600 font-normal">/{property.priceFrequency}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm mb-4 space-x-4">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          <span>{property.bedrooms} Beds</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          <span>{property.bathrooms} Baths</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-1" />
                          <span>{property.sqft.toLocaleString()} sqft</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => scheduleVisit(property)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          Schedule Visit
                        </button>
                        <button className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg font-medium transition-colors">
                          Contact Agent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Card */}
          {cartProperties.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  You have {cartProperties.length} saved properties
                </h3>
                
                <div className="mb-4">
                  <div className="text-gray-600 mb-1 text-sm">Estimated Booking Amount:</div>
                  <div className="text-xl font-bold text-gray-800">
                    {formatPrice(totalBookingAmount)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={scheduleAllVisits}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule All Visits
                  </button>
                  
                  <button 
                    onClick={proceedToBook}
                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Proceed to Book
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Need Help?</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-3 w-3 mr-2" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-3 w-3 mr-2" />
                      <span>help@estate.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Schedule Visit</h3>
              <p className="text-gray-600 mb-4">{selectedProperty.title}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('Visit scheduled successfully!');
                    setShowBookingModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Schedule Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}