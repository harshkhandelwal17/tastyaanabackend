import { useState, useEffect, useRef } from 'react';
import rentalData from './rental.json';
import { 
  Home, 
  MapPin, 
  Heart, 
  X, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Calendar, 
  Share2, 
  Printer, 
  FileText, 
  Clock, 
  Maximize2, 
  Minimize2,
  Sun, 
  Users,
  Wifi,
  DollarSign,
  Coffee,
  Car,
  Briefcase,
  Zap,
  Star,
  MessageCircle,
  ArrowRight,
  Check,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function PropertyDetailsPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isSticky, setIsSticky] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const galleryRef = useRef(null);
  const stickyHeaderRef = useRef(null);
  
  const [property, setProperty] = useState(null);

  // Initialize property from rental data
  useEffect(() => {
    // Use hero listing as the main property detail
    if (rentalData.heroListing) {
      const heroProperty = rentalData.heroListing;
      setProperty({
        id: heroProperty.id,
        title: heroProperty.title,
        price: parseInt(heroProperty.price.replace('₹', '').replace(',', '')),
        status: "For Rent",
        address: heroProperty.location,
        bedrooms: heroProperty.beds,
        bathrooms: heroProperty.baths,
        sqft: heroProperty.sqft,
        lotSize: "N/A",
        yearBuilt: 2019,
        propertyType: heroProperty.type,
        description: heroProperty.description,
        priceFrequency: heroProperty.priceFrequency,
        rating: heroProperty.rating,
        features: [
          "Central Air Conditioning",
          "Gourmet Kitchen",
          "Hardwood Floors",
          "Walk-in Closets",
          "Swimming Pool",
          "Outdoor Kitchen",
          "Smart Home Technology",
          "Two-car Garage",
          "Energy Efficient Appliances",
          "Solar Panels",
          "Security System",
          "Home Office",
          "Home Gym",
          "Wine Cellar",
          "Media Room"
        ],
        images: [
          heroProperty.image,
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1560448075-d83b3571d725?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c349513?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
          "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
        ],
    amenities: {
      interior: [
        "Central Heating",
        "Central Air Conditioning",
        "Fireplace",
        "Hardwood Floors",
        "High Ceilings",
        "Walk-in Closets",
        "Home Office"
      ],
      exterior: [
        "Swimming Pool",
        "Outdoor Kitchen",
        "Patio",
        "Landscaped Garden",
        "Garage (2 spaces)"
      ],
      community: [
        "Parks Nearby",
        "Excellent Schools",
        "Shopping Center",
        "Public Transportation"
      ]
    },
    virtualTour: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    mapLocation: "https://maps.google.com/?q=34.0522,-118.2437",
    agent: {
      name: "Sarah Johnson",
      title: "Luxury Home Specialist",
      phone: "(123) 456-7890",
      email: "sarah.johnson@dreamhome.com",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    walkScore: 85,
    schoolsNearby: [
      { name: "Lincoln Elementary School", rating: 9, distance: "0.5 miles" },
      { name: "Washington Middle School", rating: 8, distance: "1.2 miles" },
      { name: "Jefferson High School", rating: 8, distance: "1.8 miles" }
    ],
    neighborhood: {
      name: "Westside Heights",
      description: "Westside Heights is a highly desirable neighborhood known for its tree-lined streets, beautiful parks, and excellent schools. Residents enjoy a variety of dining and shopping options within walking distance, as well as easy access to public transportation and major highways."
    },
    reviews: [
      { id: 1, user: "John D.", rating: 5, comment: "Beautiful property, exactly as described. The agent was very helpful and knowledgeable." },
      { id: 2, user: "Lisa M.", rating: 4, comment: "Great location and amenities. The neighborhood is amazing and very safe." }
    ],
    mortgage: {
      estimatedPayment: 3200,
      downPayment: 170000,
      interestRate: 3.5,
      term: 30
    },
    openHouse: {
      date: "Sept 5, 2025",
      time: "1:00 PM - 4:00 PM"
    },
        // Extended description for the "Read More" functionality
        extendedDescription: heroProperty.description + " This stunning property includes premium finishes throughout. The property features a chef's kitchen with high-end appliances, spacious primary suite with luxurious bathroom. Located in a highly desirable neighborhood with excellent amenities and close to shopping, dining, and entertainment.\n\nThe main level features a grand entrance foyer that leads to an expansive living room with direct access to the outdoor entertaining area."
      });
    }
  }, []);
  
  // Generate related properties from rental data
  useEffect(() => {
    if (rentalData.properties && rentalData.properties.length > 0) {
      const mappedProperties = rentalData.properties.slice(0, 3).map(prop => ({
        id: prop.id,
        title: prop.title,
        price: parseInt(prop.price.replace('₹', '').replace(',', '')),
        address: prop.location,
        bedrooms: prop.beds,
        bathrooms: prop.baths,
        sqft: prop.sqft,
        image: prop.image
      }));
      
      setRelatedProperties(mappedProperties);
    }
  }, []);
  
  // Handle sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (stickyHeaderRef.current) {
        const headerPosition = stickyHeaderRef.current.getBoundingClientRect().top;
        if (headerPosition <= 0) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Gallery navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % property.images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + property.images.length) % property.images.length);
  };
  
  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  // Toggle fullscreen gallery
  const toggleFullscreenGallery = () => {
    setIsFullscreenGallery(!isFullscreenGallery);
    // Reset body scroll when fullscreen gallery is closed
    if (isFullscreenGallery) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  };

  // Toggle contact form
  const toggleContactForm = () => {
    setShowContactForm(!showContactForm);
  };

  // Toggle description
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate mortgage payment
  const calculateMortgage = (price, downPayment, interestRate, term) => {
    const loanAmount = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const payments = term * 12;
    const x = Math.pow(1 + monthlyRate, payments);
    const monthly = (loanAmount * x * monthlyRate) / (x - 1);
    
    return Math.round(monthly);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  // Fullscreen Gallery Modal
  const renderFullscreenGallery = () => {
    if (!isFullscreenGallery) return null;
    
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <button 
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={toggleFullscreenGallery}
        >
          <X className="h-8 w-8" />
        </button>
        
        <div className="relative w-full max-w-5xl">
          <img 
            src={property.images[currentImageIndex]} 
            alt={`Property image ${currentImageIndex + 1}`} 
            className="w-full h-auto"
          />
          
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      </div>
    );
  };
  
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fullscreen Gallery */}
      {renderFullscreenGallery()}
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-800">DreamHome</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
            <a href="#" className="text-blue-600 font-medium">Buy</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Sell</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Agents</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2">
            <div className="container mx-auto px-4 flex flex-col space-y-3">
              <a href="#" className="text-gray-600 hover:text-blue-600 py-2 transition-colors">Home</a>
              <a href="#" className="text-blue-600 font-medium py-2">Buy</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 py-2 transition-colors">Sell</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 py-2 transition-colors">Agents</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 py-2 transition-colors">Contact</a>
            </div>
          </div>
        )}
      </header>
      
      {/* Breadcrumbs */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-blue-600 transition-colors">Properties</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-blue-600 transition-colors">Los Angeles</a>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">{property.address}</span>
          </div>
        </div>
      </div>
      
      {/* Property Title Section */}
      <div className="bg-white border-b border-gray-200" ref={stickyHeaderRef}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="h-5 w-5 mr-1 text-gray-500" />
                <span>{property.address}</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(property.price)}</div>
              <div className="flex items-center mt-2">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">{property.status}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">Listed 2 weeks ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Header (appears on scroll) */}
      {isSticky && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-30 transform transition-transform duration-300">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-lg font-bold text-gray-900 truncate mr-4">{property.title}</h2>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(property.price)}</span>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  className={`p-2 rounded-full ${isFavorite ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'} transition-all`}
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Gallery and Details */}
        <div className="lg:col-span-2">
          {/* Property Gallery */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-8 shadow-md" ref={galleryRef}>
            <div className="relative aspect-[16/9]">
              <img 
                src={property.images[currentImageIndex]} 
                alt={`Property image ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              <button 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>
              
              {/* Fullscreen Button */}
              <button 
                className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
                onClick={toggleFullscreenGallery}
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Thumbnail Navigation */}
            <div className="flex overflow-x-auto py-4 px-2 space-x-2 scrollbar-hide">
              {property.images.map((image, index) => (
                <button 
                  key={index}
                  className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden transition-all ${currentImageIndex === index ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between mb-8">
            <div className="flex space-x-2">
              <button 
                className={`flex items-center px-4 py-2 rounded-md transition-all ${isFavorite ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={toggleFavorite}
              >
                <Heart className={`h-5 w-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </button>
              
              <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-all">
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
            
            <div>
              <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-all">
                <Printer className="h-5 w-5 mr-2" />
                Print
              </button>
            </div>
          </div>
          
          {/* Property Tabs */}
          <div className="mb-8">
            <div className="flex overflow-x-auto border-b border-gray-200">
              <button 
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'description' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              
              <button 
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'features' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                onClick={() => setActiveTab('features')}
              >
                Features & Amenities
              </button>
              
              <button 
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'location' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                onClick={() => setActiveTab('location')}
              >
                Location
              </button>

              <button 
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'schools' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                onClick={() => setActiveTab('schools')}
              >
                Schools
              </button>

              <button 
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'reviews' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>
            
            <div className="py-6">
              {activeTab === 'description' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Bedrooms</div>
                      <div className="text-gray-900 font-bold text-lg">{property.bedrooms}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Bathrooms</div>
                      <div className="text-gray-900 font-bold text-lg">{property.bathrooms}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Square Feet</div>
                      <div className="text-gray-900 font-bold text-lg">{property.sqft.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Lot Size</div>
                      <div className="text-gray-900 font-bold text-lg">{property.lotSize}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Property Type</div>
                      <div className="text-gray-900 font-bold">{property.propertyType}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                      <div className="text-gray-500 text-sm">Year Built</div>
                      <div className="text-gray-900 font-bold">{property.yearBuilt}</div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About This Property</h2>
                  <div className="relative">
                    <p className="text-gray-700 mb-2 leading-relaxed">
                      {showFullDescription 
                        ? property.extendedDescription 
                        : property.description}
                    </p>
                    <button 
                      onClick={toggleDescription}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-2 transition-colors"
                    >
                      {showFullDescription ? (
                        <>
                          <span>Show Less</span>
                          <ChevronUp className="ml-1 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          <span>Read More</span>
                          <ChevronDown className="ml-1 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  
                  
                  {/* Virtual Tour */}
                  {/* <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <Maximize2 className="h-5 w-5" />
                      </span>
                      Virtual Tour
                    </h3>
                    <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                      <iframe 
                        src={property.virtualTour.replace('watch?v=', 'embed/')} 
                        title="Virtual Tour"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div> */}
                </div>
              )}
              
              {activeTab === 'features' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Features & Amenities</h2>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <Home className="h-5 w-5" />
                      </span>
                      Interior Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.amenities.interior.map((feature, index) => (
                        <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md shadow-sm hover:shadow transition-all">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mr-2"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <Sun className="h-5 w-5" />
                      </span>
                      Exterior Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.amenities.exterior.map((feature, index) => (
                        <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md shadow-sm hover:shadow transition-all">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mr-2"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <Users className="h-5 w-5" />
                      </span>
                      Community Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.amenities.community.map((feature, index) => (
                        <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md shadow-sm hover:shadow transition-all">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mr-2"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <Zap className="h-5 w-5" />
                      </span>
                      Additional Features
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Wifi className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">High-Speed Internet</div>
                          <div className="text-xs text-gray-500">Fiber optic ready</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Low HOA Fees</div>
                          <div className="text-xs text-gray-500">$250/month</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Coffee className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Close to Cafes</div>
                          <div className="text-xs text-gray-500">5+ within walking distance</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">EV Charging</div>
                          <div className="text-xs text-gray-500">Garage pre-wired</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Work From Home</div>
                          <div className="text-xs text-gray-500">Dedicated office space</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Energy Efficient</div>
                          <div className="text-xs text-gray-500">Smart home features</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'location' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Neighborhood</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About {property.neighborhood.name}</h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">{property.neighborhood.description}</p>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Info className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-blue-800 font-medium mb-1">Walk Score: {property.walkScore}/100</h4>
                        <p className="text-blue-700 text-sm">This location is Very Walkable - most errands can be accomplished on foot.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Map */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                        <MapPin className="h-5 w-5" />
                      </span>
                      Map Location
                    </h3>
                    <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-md">
                      <iframe 
                        src={`https://maps.google.com/maps?q=${property.address.replace(' ', '+')}&z=15&output=embed`}
                        title="Property Location"
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                  
                  {/* Nearby Amenities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="flex-shrink-0 mt-1">
                          <Coffee className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-2">
                          <h4 className="font-medium text-gray-900 text-sm">Dining & Cafes</h4>
                          <p className="text-gray-600 text-xs">5+ restaurants within 0.5 miles</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="flex-shrink-0 mt-1">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-2">
                          <h4 className="font-medium text-gray-900 text-sm">Transportation</h4>
                          <p className="text-gray-600 text-xs">Bus stops within 2 blocks, metro station 0.8 miles</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="flex-shrink-0 mt-1">
                          <Sun className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-2">
                          <h4 className="font-medium text-gray-900 text-sm">Parks & Recreation</h4>
                          <p className="text-gray-600 text-xs">Community park with playground 0.3 miles away</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                        <div className="flex-shrink-0 mt-1">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-2">
                          <h4 className="font-medium text-gray-900 text-sm">Shopping</h4>
                          <p className="text-gray-600 text-xs">Westside Mall and grocery stores within 1 mile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'schools' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Schools Near This Property</h2>
                  <p className="text-gray-700 mb-6">This property is zoned to the following schools in the district:</p>
                  
                  <div className="space-y-4 mb-6">
                    {property.schoolsNearby.map((school, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{school.name}</h3>
                            <p className="text-gray-600 text-xs">{school.distance} from property</p>
                          </div>
                          <div className="flex items-center bg-blue-50 text-blue-800 px-2 py-1 rounded-full text-xs">
                            <span className="font-medium">Rating: {school.rating}/10</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Grades: K-5</span>
                            <span className="text-gray-600">Public School</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                    <h3 className="font-medium text-gray-900 mb-1">School Information Disclaimer</h3>
                    <p className="text-gray-600 text-xs">School service boundaries are intended to be used as a reference only. To verify enrollment eligibility for a property, contact the school directly.</p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Property Reviews</h2>
                  
                  <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {property.reviews[0].user.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="font-medium text-gray-900 text-sm">{property.reviews[0].user}</div>
                          <div className="text-xs text-gray-500">Posted 2 weeks ago</div>
                        </div>
                      </div>
                      <div className="flex">
                        {renderStars(property.reviews[0].rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{property.reviews[0].comment}</p>
                  </div>
                  
                  <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {property.reviews[1].user.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="font-medium text-gray-900 text-sm">{property.reviews[1].user}</div>
                          <div className="text-xs text-gray-500">Posted 1 month ago</div>
                        </div>
                      </div>
                      <div className="flex">
                        {renderStars(property.reviews[1].rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{property.reviews[1].comment}</p>
                  </div>
                  
                  <div className="text-center">
                    <button className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm">
                      <span>See all reviews</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Properties */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Properties You May Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200">
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={property.image} 
                      alt={property.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors">
                        <Heart className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-base font-bold text-blue-600 mb-1">{formatCurrency(property.price)}</div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{property.title}</h3>
                    <div className="text-gray-600 text-xs mb-2 truncate">{property.address}</div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{property.bedrooms} Beds</span>
                      <span>{property.bathrooms} Baths</span>
                      <span>{property.sqft.toLocaleString()} Sq Ft</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Agent Info, Mortgage Calculator, Contact Form */}
        <div className="lg:col-span-1">
          {/* Agent Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Listed By</h2>
              <div className="flex items-center mb-3">
                <img 
                  src={property.agent.image} 
                  alt={property.agent.name} 
                  className="h-14 w-14 rounded-full object-cover mr-3"
                />
                <div>
                  <h3 className="font-bold text-gray-900">{property.agent.name}</h3>
                  <p className="text-gray-600 text-xs">{property.agent.title}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <a href={`tel:${property.agent.phone}`} className="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm">
                  <Phone className="h-4 w-4 mr-2 text-blue-600" />
                  <span>{property.agent.phone}</span>
                </a>
                
                <a href={`mailto:${property.agent.email}`} className="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm">
                  <Mail className="h-4 w-4 mr-2 text-blue-600" />
                  <span>{property.agent.email}</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Open House Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4">
              <div className="flex items-center mb-3">
                <div className="h-9 w-9 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Open House</h2>
                  <p className="text-gray-600 text-xs">{property.openHouse.date}, {property.openHouse.time}</p>
                </div>
              </div>
              
              <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-md font-medium transition-colors text-sm">
                Schedule a Tour
              </button>
            </div>
          </div>
          
          {/* Contact Form (conditionally rendered) */}
          {showContactForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-bold text-gray-900">Contact Agent</h2>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={toggleContactForm}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <form className="space-y-3">
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      id="phone" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea 
                      id="message" 
                      rows="3" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="I'm interested in this property..."
                    ></textarea>
                  </div>
                  
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="ml-2 block text-xs text-gray-600">
                      I agree to receive emails, calls, and texts about real estate
                    </label>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Home className="h-6 w-6 text-blue-400" />
                <h2 className="ml-2 text-xl font-bold text-white">DreamHome</h2>
              </div>
              <p className="text-gray-400 mb-4">Find your perfect property with DreamHome, your trusted real estate partner.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Buy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sell</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Rent</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mortgage</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Agents</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Locations</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Los Angeles</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">New York</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Miami</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Chicago</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">San Francisco</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Seattle</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-400">123 Real Estate Ave, Los Angeles, CA 90001</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-400">(123) 456-7890</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-400">info@dreamhome.com</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-400">Mon-Fri: 9AM-6PM</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 DreamHome. All rights reserved.
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}