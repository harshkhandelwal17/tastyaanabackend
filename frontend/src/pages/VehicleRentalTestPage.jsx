import React from "react";
import { Link } from "react-router-dom";
import { FiUser, FiSettings, FiCheckCircle } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

const VehicleRentalTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FaCar className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vehicle Rental System
          </h1>
          <p className="text-xl text-gray-600">
            Test all your vehicle rental routes and functionality
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <FiCheckCircle className="w-4 h-4 mr-2" />
            Integration Complete - Ready to Test!
          </div>
        </div>

        {/* Route Testing Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* User Routes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FiUser className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                User Routes
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Public routes for browsing and booking vehicles
            </p>
            <div className="space-y-2">
              <Link
                to="/vehicles"
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Browse All Vehicles
              </Link>
              <Link
                to="/vehicles/bikes"
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Browse Bikes
              </Link>
              <Link
                to="/vehicles/cars"
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Browse Cars
              </Link>
              <Link
                to="/vehicles/scooters"
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Browse Scooters
              </Link>
              <Link
                to="/my-vehicle-bookings"
                className="block w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                My Bookings (Auth Required)
              </Link>
            </div>
          </div>

          {/* Admin Routes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FiSettings className="w-6 h-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Admin Routes
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Admin panel for managing vehicles and bookings
            </p>
            <div className="space-y-2">
              <Link
                to="/admin/vehicle-rental"
                className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/vehicles"
                className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Vehicle Management
              </Link>
              <Link
                to="/admin/vehicle-billing"
                className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Billing & Refunds
              </Link>
            </div>
            <div className="mt-4 text-sm text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ Admin routes require admin role access
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FiCheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Features</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Vehicle Listing & Filtering
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Vehicle Detail Pages
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Booking with Razorpay
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Booking History
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Admin Dashboard
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Vehicle Management
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Billing & Refund System
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                QR Code Payments
              </div>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Integration Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Imports</span>
              <span className="text-xs text-green-600">Complete</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Public Routes
              </span>
              <span className="text-xs text-green-600">Complete</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Protected Routes
              </span>
              <span className="text-xs text-green-600">Complete</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Admin Routes
              </span>
              <span className="text-xs text-green-600">Complete</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Next Steps
            </h4>
            <ol className="text-left text-sm text-gray-700 space-y-1">
              <li>
                1. Start your development server:{" "}
                <code className="bg-gray-200 px-1 rounded">npm run dev</code>
              </li>
              <li>
                2. Test the vehicle listing page:{" "}
                <code className="bg-gray-200 px-1 rounded">/vehicles</code>
              </li>
              <li>
                3. Verify admin access:{" "}
                <code className="bg-gray-200 px-1 rounded">
                  /admin/vehicle-rental
                </code>
              </li>
              <li>
                4. Check your backend server is running on the correct port
              </li>
              <li>5. Test the complete booking flow</li>
            </ol>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FaCar className="w-5 h-5 mr-2" />
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleRentalTestPage;
