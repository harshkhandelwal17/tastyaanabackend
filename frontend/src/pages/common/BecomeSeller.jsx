import React, { useState } from 'react';
import { ShoppingBag, Star, Users, TrendingUp, CheckCircle, ArrowRight, Upload, Phone, Mail, MapPin, Home, Smartphone, Package } from 'lucide-react';

export default function BecomeSellerPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    businessType: '',
    category: '',
    experience: '',
    description: '',
    documents: null
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      documents: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Grow Your Business",
      description: "Reach thousands of customers across multiple categories and expand your reach"
    },
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Easy Management",
      description: "Unified dashboard to manage all your listings, orders, and customer interactions"
    },
    {
      icon: <Star className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      title: "Multi-Category Platform",
      description: "Sell everything from food to electronics, real estate to services in one place"
    }
  ];

  const categories = [
    {
      icon: <Package className="w-5 h-5 text-green-600" />,
      title: "Food & Groceries",
      description: "Homemade meals, fresh groceries, specialty foods"
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-green-600" />,
      title: "Electronics & Gadgets",
      description: "Smartphones, laptops, accessories, home appliances"
    },
    {
      icon: <Home className="w-5 h-5 text-green-600" />,
      title: "Real Estate",
      description: "Buy, sell, rent properties and land"
    },
    {
      icon: <Smartphone className="w-5 h-5 text-green-600" />,
      title: "Services & More",
      description: "Professional services, repairs, consultations"
    }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Thank you for your interest in joining Tastyaana! We'll review your application and get back to you within 2-3 business days.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tastyaana</h1>
            </div>
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base">Home</a>
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base">Categories</a>
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base">About</a>
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 pb-7 sm:py-16 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Sell <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">Anything & Everything</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
              Join Tastyaana's comprehensive marketplace. From food delivery to electronics, real estate to services - connect with customers across all categories and grow your business.
            </p>
          </div>

          {/* Categories Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-3 sm:mb-4">{category.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto  px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Start Your Journey</h3>
              <p className="text-gray-600 text-sm sm:text-base">Fill out this form to begin your application as a Tastyaana seller</p>
            </div>

            <div className="space-y-6">
              {/* Business Information */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                  Business Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="Your business/store name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                  Contact Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      placeholder="Your city"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                  Business Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      required
                    >
                      <option value="">Select business type</option>
                      <option value="individual">Individual Seller</option>
                      <option value="small-business">Small Business</option>
                      <option value="retailer">Retailer</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="service-provider">Service Provider</option>
                      <option value="real-estate-agent">Real Estate Agent</option>
                      <option value="restaurant">Restaurant/Food Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                      required
                    >
                      <option value="">Select primary category</option>
                      <option value="food-groceries">Food & Groceries</option>
                      <option value="electronics">Electronics & Gadgets</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="home-garden">Home & Garden</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="automotive">Automotive</option>
                      <option value="services">Services</option>
                      <option value="books-media">Books & Media</option>
                      <option value="health-beauty">Health & Beauty</option>
                      <option value="sports-fitness">Sports & Fitness</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  >
                    <option value="">Select experience</option>
                    <option value="new">New to selling online</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="more-than-10">More than 10 years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tell us about your business</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                    placeholder="Describe what you plan to sell, your target customers, and what makes your products/services unique..."
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                  Documents (Optional)
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License, GST Certificate, or Identity Proof
                  </label>
                  <input
                    type="file"
                    name="documents"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4 sm:pt-6">
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center mx-auto"
                >
                  Submit Application
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </button>
                <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Tastyaana</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm pr-4">Your one-stop marketplace for everything - food, electronics, real estate, and more.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">For Sellers</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500">Become a Seller</a></li>
                <li><a href="#" className="hover:text-green-500">Seller Guidelines</a></li>
                <li><a href="#" className="hover:text-green-500">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Categories</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500">Food & Groceries</a></li>
                <li><a href="#" className="hover:text-green-500">Electronics</a></li>
                <li><a href="#" className="hover:text-green-500">Real Estate</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Support</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500">Help Center</a></li>
                <li><a href="#" className="hover:text-green-500">Terms of Service</a></li>
                <li><a href="#" className="hover:text-green-500">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 sm:pt-8 mt-6 sm:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">&copy; 2024 Tastyaana. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}