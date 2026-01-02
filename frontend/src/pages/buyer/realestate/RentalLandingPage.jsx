import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Square,
  Star,
  Phone,
  Mail,
  Menu,
  X,
  ArrowRight,
  Search,
  Filter,
  Heart,
  Building,
  Home,
  Users,
  Briefcase,
} from "lucide-react";
import rentalData from "./rental.json";

const RealEstateLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [activeSection, setActiveSection] = useState(
    rentalData.categories[0].id
  );

  const heroImages = [
    rentalData.heroListing.image,
    ...rentalData.properties.slice(0, 2).map((prop) => prop.image),
  ];

  const sections = rentalData.categories.map((category) => ({
    id: category.id,
    name: category.title,
    icon:
      category.title === "Flats"
        ? Building
        : category.title === "PG & Hostels"
        ? Users
        : Home,
    color:
      category.title === "Flats"
        ? "blue"
        : category.title === "PG & Hostels"
        ? "orange"
        : "emerald",
    description: category.description,
  }));

  const allProperties = [
    {
      ...rentalData.heroListing,
      price: `${rentalData.heroListing.price}/${rentalData.heroListing.priceFrequency}`,
      sqft: rentalData.heroListing.sqft.toString(),
      category: rentalData.heroListing.type,
      furnished: "Fully Furnished",
      parking: "Available",
      section: rentalData.categories[0].id,
    },
    ...rentalData.properties.map((property) => ({
      ...property,
      price: `${property.price}/${property.priceFrequency}`,
      sqft: property.sqft.toString(),
      category: property.type,
      furnished: "Fully Furnished",
      parking: "Available",
      section:
        rentalData.categories.find((cat) => cat.title === "Flats")?.id || 1,
    })),
  ];

  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const sectionProperties = allProperties.filter(
      (property) => property.section === activeSection
    );
    setFilteredProperties(sectionProperties);
  }, [activeSection]);

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: {
        bg: "bg-emerald-500",
        bgHover: "hover:bg-emerald-600",
        text: "text-emerald-600",
        border: "border-emerald-500",
        bgLight: "bg-emerald-50",
        gradient: "from-emerald-500 to-emerald-600",
      },
      blue: {
        bg: "bg-blue-500",
        bgHover: "hover:bg-blue-600",
        text: "text-blue-600",
        border: "border-blue-500",
        bgLight: "bg-blue-50",
        gradient: "from-blue-500 to-blue-600",
      },
      purple: {
        bg: "bg-purple-500",
        bgHover: "hover:bg-purple-600",
        text: "text-purple-600",
        border: "border-purple-500",
        bgLight: "bg-purple-50",
        gradient: "from-purple-500 to-purple-600",
      },
      orange: {
        bg: "bg-orange-500",
        bgHover: "hover:bg-orange-600",
        text: "text-orange-600",
        border: "border-orange-500",
        bgLight: "bg-orange-50",
        gradient: "from-orange-500 to-orange-600",
      },
    };
    return colors[color];
  };

  const activeColors = getColorClasses(
    sections.find((s) => s.id === activeSection)?.color || "emerald"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[70vh] sm:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-900/40 to-gray-900/60"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 animate-fade-in">
            {rentalData.pageInfo.title}
            <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              {rentalData.pageInfo.title.split(" ").slice(-2).join(" ")}
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 text-gray-200 animate-fade-in-delay max-w-2xl mx-auto">
            {rentalData.pageInfo.subtitle}
          </p>

          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 max-w-3xl mx-auto animate-fade-in-delay-2">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by location or property type..."
                    className="w-full bg-white/95 border-0 rounded-lg py-2 sm:py-2.5 pl-9 pr-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all duration-200">
                  <Filter size={16} />
                </button>
                <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 sm:px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide ? "bg-emerald-400" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Property Tags Infinity Slider */}
      <section className="py-8 sm:py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Find Properties by Type
            </h2>
            <p className="text-gray-600">
              Explore our wide range of rental options
            </p>
          </div>

          {/* Infinity Slider */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll gap-4 sm:gap-6">
              {/* First set of tags */}
              <div className="flex gap-4 sm:gap-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  1 BHK
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  2 BHK
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  3 BHK
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  1RK
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Fully Furnished
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Semi Furnished
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Unfurnished
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Hostels
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  PG
                </div>
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Co-living
                </div>
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Apartments
                </div>
              </div>

              {/* Duplicate set for infinite scroll */}
              <div className="flex gap-4 sm:gap-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  1 BHK
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  2 BHK
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  3 BHK
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  1RK
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Fully Furnished
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Semi Furnished
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Unfurnished
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Hostels
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  PG
                </div>
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Co-living
                </div>
                <div className="bg-gradient-to-r from-lime-500 to-lime-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Studio
                </div>
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer">
                  Apartments
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 mb-2 group-hover:scale-110 transition-transform duration-200">
                {rentalData.metadata.totalProperties}+
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">
                Properties Listed
              </div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200">
                {rentalData.categories.reduce(
                  (sum, cat) => sum + parseInt(cat.count.split("+")[0]),
                  0
                )}
                +
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">
                Happy Listings
              </div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-200">
                {rentalData.locations.length}+
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">
                Locations Covered
              </div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-200">
                {rentalData.metadata.averageRating}
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Sections Navigation */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Find Your Perfect Property
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're looking to buy, rent, or find commercial space, we
              have something for everyone
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            {sections.map((section) => {
              const Icon = section.icon;
              const colors = getColorClasses(section.color);
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `${colors.border} ${colors.bgLight} ${colors.text} shadow-lg`
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <Icon size={20} className="sm:w-6 sm:h-6" />
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base lg:text-lg">
                      {section.name}
                    </div>
                    <div className="text-xs sm:text-sm opacity-80 hidden sm:block">
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Properties Grid */}
          <div className="mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              {sections.find((s) => s.id === activeSection)?.name} Properties
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-32 sm:h-36 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span
                        className={`${activeColors.bg} text-white px-2 py-0.5 rounded-full text-xs font-medium`}
                      >
                        {property.type}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
                        favorites.has(property.id)
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Heart
                        size={14}
                        fill={
                          favorites.has(property.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {property.price}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Star
                          className="text-yellow-400 fill-current"
                          size={12}
                        />
                        <span className="text-xs text-gray-600 ml-1">
                          {property.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {property.category}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-bold text-gray-900 mb-2 group-hover:${activeColors.text} transition-colors duration-200 line-clamp-2`}
                    >
                      {property.title}
                    </h3>

                    <div className="flex items-center text-gray-500 mb-2 sm:mb-3">
                      <MapPin size={12} />
                      <span className="ml-1 text-xs truncate">
                        {property.location}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs text-gray-600 mb-2 sm:mb-3">
                      {property.beds > 0 && (
                        <div className="flex items-center">
                          <Bed size={12} />
                          <span className="ml-1">{property.beds}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Bath size={12} />
                        <span className="ml-1">{property.baths}</span>
                      </div>
                      <div className="flex items-center">
                        <Square size={12} />
                        <span className="ml-1 text-xs">{property.sqft}</span>
                      </div>
                    </div>

                    <button
                      className={`w-full bg-gradient-to-r ${activeColors.gradient} text-white py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-xs sm:text-sm`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Properties Found
                </h3>
                <p className="text-gray-600">
                  No properties available in the selected category. Try
                  selecting a different section.
                </p>
              </div>
            )}

            <div className="text-center mt-8 sm:mt-12">
              <button
                className={`bg-white border-2 ${activeColors.border} ${activeColors.text} px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl ${activeColors.bgHover} hover:text-white transition-all duration-200 font-medium inline-flex items-center text-sm sm:text-base`}
              >
                View All {sections.find((s) => s.id === activeSection)?.name}{" "}
                Properties
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Tastyaana?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive real estate solutions with unmatched
              service quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Search className="text-white" size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Smart Search
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Advanced filters and AI-powered recommendations to find exactly
                what you're looking for
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Star className="text-white" size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Verified Properties
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                All properties are verified and authenticated to ensure
                transparency and trust
              </p>
            </div>

            <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Phone className="text-white" size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                24/7 Support
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Dedicated customer support team available round the clock to
                assist you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Find Your Dream Property?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Join thousands of satisfied clients who found their perfect property
            with Tastyaana. Start your journey today and discover the best deals
            in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-all duration-200 flex items-center justify-center text-sm sm:text-base">
              <Phone size={18} className="mr-2" />
              Call: +91 91314 94302
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent mb-4">
                Tastyaana
              </div>
              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Your trusted partner in finding the perfect property. Excellence
                in real estate since 2008.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700">
                    <span className="font-bold">f</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600">
                    <span className="font-bold">t</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700">
                    <span className="font-bold">i</span>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Buy Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Rent Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Commercial Spaces
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    PG & Co-living
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Property Types
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    1RK & 1BHK
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    2BHK & 3BHK
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Villas & Penthouses
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Office Spaces
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Hostels & PG
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Contact Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone size={16} className="mr-3 text-emerald-400" />
                  <span className="text-gray-400 text-sm sm:text-base">
                    +91 98765-43210
                  </span>
                </div>
                <div className="flex items-center">
                  <Mail size={16} className="mr-3 text-blue-400" />
                  <span className="text-gray-400 text-sm sm:text-base">
                    info@Tastyaana.com
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin size={16} className="mr-3 text-purple-400 mt-1" />
                  <span className="text-gray-400 text-sm sm:text-base">
                    123 Property Street
                    <br />
                    Mumbai, Maharashtra 400001
                    <br />
                    India
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2025 Tastyaana. All rights reserved. |
              <a
                href="#"
                className="text-emerald-400 hover:text-emerald-300 ml-1"
              >
                Privacy Policy
              </a>{" "}
              |
              <a
                href="#"
                className="text-emerald-400 hover:text-emerald-300 ml-1"
              >
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s both;
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default RealEstateLanding;
