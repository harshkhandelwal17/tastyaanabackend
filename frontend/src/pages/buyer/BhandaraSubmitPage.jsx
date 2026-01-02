import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser, 
  FaPhone, 
  FaUtensils,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner
} from "react-icons/fa";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import BhandaraService from "../../services/bhandaraService";
import Header from "../../layout/buyer/Header";
import Footer from "../../layout/buyer/Footer";

const BhandaraSubmitPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: {
      address: "",
      lat: null,
      lng: null
    },
    foodItems: [""],
    dateTimeStart: "",
    dateTimeEnd: "",
    organizerName: "",
    contact: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          address: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle food items changes
  const handleFoodItemChange = (index, value) => {
    const newFoodItems = [...formData.foodItems];
    newFoodItems[index] = value;
    setFormData(prev => ({
      ...prev,
      foodItems: newFoodItems
    }));
  };

  // Add new food item
  const addFoodItem = () => {
    setFormData(prev => ({
      ...prev,
      foodItems: [...prev.foodItems, ""]
    }));
  };

  // Remove food item
  const removeFoodItem = (index) => {
    if (formData.foodItems.length > 1) {
      const newFoodItems = formData.foodItems.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        foodItems: newFoodItems
      }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate field on blur
    const validation = BhandaraService.validateBhandaraForm(formData);
    if (validation.errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: validation.errors[fieldName]
      }));
    }
  };

  // Get minimum date-time (2 hours from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Minimum 2 hours from now
    return now.toISOString().slice(0, 16);
  };

  // Get minimum end date-time based on start time
  const getMinEndDateTime = () => {
    if (formData.dateTimeStart) {
      const startDate = new Date(formData.dateTimeStart);
      startDate.setMinutes(startDate.getMinutes() + 30); // Minimum 30 minutes after start
      return startDate.toISOString().slice(0, 16);
    }
    return getMinDateTime();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = BhandaraService.validateBhandaraForm(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Please fix the errors below");
      
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    try {
      setLoading(true);
      
      // Filter out empty food items
      const submitData = {
        ...formData,
        foodItems: formData.foodItems.filter(item => item.trim().length > 0)
      };

      const result = await BhandaraService.createBhandara(submitData);
      
      if (result.success) {
        setSubmitted(true);
        toast.success("Bhandara submitted successfully!");
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(result.error);
        if (result.errors) {
          setErrors(result.errors.reduce((acc, error) => {
            acc[error.field] = error.message;
            return acc;
          }, {}));
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to submit another
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: {
        address: "",
        lat: null,
        lng: null
      },
      foodItems: [""],
      dateTimeStart: "",
      dateTimeEnd: "",
      organizerName: "",
      contact: ""
    });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto px-4"
          >
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <FaCheckCircle className="text-3xl text-green-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Successfully Submitted!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Your Bhandara event has been submitted for review. It will be published once approved by our team, usually within 24 hours.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Submit Another Event
                </button>
                
                <Link
                  to="/bhandara"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  View All Events
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-4">
              <Link
                to="/bhandara"
                className="mr-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold">
                Submit Your Bhandara
              </h1>
            </div>
            <p className="text-orange-100 max-w-2xl">
              Help build a stronger community by sharing your free food event with others. Fill out the details below to list your Bhandara.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaInfoCircle className="mr-3 text-blue-500" />
                Event Details
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('title')}
                    placeholder="e.g., Free Prasad Distribution at Ganesh Temple"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={200}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('description')}
                    placeholder="Additional details about the event, special instructions, etc."
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={1000}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length}/1000 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaMapMarkerAlt className="mr-3 text-red-500" />
                Location
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('location')}
                  placeholder="e.g., Shri Ganesh Mandir, 123 MG Road, Near City Mall, Indore, Madhya Pradesh 452001"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Please provide a detailed address including landmarks for easy navigation
                </p>
              </div>
            </div>

            {/* Date & Time Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaClock className="mr-3 text-blue-500" />
                Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="dateTimeStart"
                    value={formData.dateTimeStart}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('dateTimeStart')}
                    min={getMinDateTime()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.dateTimeStart ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateTimeStart && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateTimeStart}</p>
                  )}
                </div>

                {/* End Date Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="dateTimeEnd"
                    value={formData.dateTimeEnd}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('dateTimeEnd')}
                    min={getMinEndDateTime()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.dateTimeEnd ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateTimeEnd && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateTimeEnd}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Food Items Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaUtensils className="mr-3 text-green-500" />
                Food Items
              </h2>

              <div className="space-y-3">
                {formData.foodItems.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleFoodItemChange(index, e.target.value)}
                      placeholder={`Food item ${index + 1} (e.g., Khichdi, Chapati, Sabzi)`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {formData.foodItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFoodItem(index)}
                        className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addFoodItem}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  + Add Another Food Item
                </button>
                
                {errors.foodItems && (
                  <p className="text-sm text-red-600">{errors.foodItems}</p>
                )}
              </div>
            </div>

            {/* Organizer Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaUser className="mr-3 text-purple-500" />
                Organizer Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organizer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('organizerName')}
                    placeholder="Your name or organization name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.organizerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.organizerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.organizerName}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('contact')}
                    placeholder="10-digit mobile number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.contact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={10}
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    This will be used for WhatsApp contact by attendees
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Your event will be reviewed and approved within 1 hours</li>
                    <li>• For fast approval Whatsapp message on 9203338229</li>
                    <li>• Only genuine events are allowed</li>
                    <li>• Please ensure all details are accurate and complete</li>
                    <li>• Events appear on tastyaana.com/bhandara only after admin approval</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Bhandara'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BhandaraSubmitPage;