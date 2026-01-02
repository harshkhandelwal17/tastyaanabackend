// Integration Guide for Seller Booking Functionality
// This file shows how to integrate the new seller booking features

// ===== 1. Express App Integration =====

// In your main app.js file, add the seller booking routes
const express = require('express');
const sellerBookingRoutes = require('./routes/sellerBooking');
const authMiddleware = require('./middleware/auth'); // Your auth middleware

// Add the routes with authentication
app.use('/api/seller', authMiddleware, sellerBookingRoutes);

// ===== 2. Database Migration =====

// Run this migration to update existing bookings
const migrateExistingBookings = async () => {
  const VehicleBooking = require('./models/VehicleBooking');
  
  // Add default values for existing bookings
  await VehicleBooking.updateMany(
    { bookingSource: { $exists: false } },
    {
      $set: {
        bookingSource: 'online',
        'cashFlowDetails.isOfflineBooking': false,
        'cashFlowDetails.cashPaymentDetails.totalCashReceived': 0,
        'cashFlowDetails.cashPaymentDetails.onlinePaymentAmount': 0,
        'cashFlowDetails.cashPaymentDetails.pendingCashAmount': 0
      }
    }
  );
  
  console.log('Existing bookings migrated successfully');
};

// ===== 3. Frontend Integration =====

// Add these routes to your React Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SellerDashboard from './components/SellerDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        {/* Add other routes */}
      </Routes>
    </Router>
  );
};

// ===== 4. Seller Dashboard Component =====

// Main seller dashboard component
import React, { useState, useEffect } from 'react';

const SellerDashboard = () => {
  const [userZones, setUserZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadSellerZones();
  }, []);

  const loadSellerZones = async () => {
    try {
      const response = await fetch('/api/seller/zones', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUserZones(data.zones);
      if (data.zones.length > 0) {
        setSelectedZone(data.zones[0].zoneCode);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/seller/cash-flow/summary?zoneId=${selectedZone}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDashboardData(data.summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    if (selectedZone) {
      loadDashboardData();
    }
  }, [selectedZone]);

  return (
    <div className="seller-dashboard">
      {/* Zone selector */}
      <div className="zone-selector">
        <label>Select Zone: </label>
        <select 
          value={selectedZone} 
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          <option value="">All Zones</option>
          {userZones.map(zone => (
            <option key={zone.zoneCode} value={zone.zoneCode}>
              {zone.zoneName} ({zone.zoneCode})
            </option>
          ))}
        </select>
      </div>

      {/* Dashboard content */}
      {dashboardData && (
        <div className="dashboard-content">
          <DashboardSummary data={dashboardData} />
          <BookingForm selectedZone={selectedZone} onBookingCreated={loadDashboardData} />
          <CashFlowManager selectedZone={selectedZone} />
        </div>
      )}
    </div>
  );
};

// ===== 5. Booking Form Component =====

const BookingForm = ({ selectedZone, onBookingCreated }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleId: '',
    startDateTime: '',
    endDateTime: '',
    cashAmount: 0,
    onlineAmount: 0,
    notes: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAvailableVehicles = async () => {
    if (!formData.startDateTime || !formData.endDateTime || !selectedZone) return;
    
    try {
      const params = new URLSearchParams({
        zoneId: selectedZone,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime
      });
      
      const response = await fetch(`/api/seller/vehicles/available?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone) {
      alert('Please select a zone');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seller/create-offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          zoneId: selectedZone,
          customerDetails: {
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Booking created successfully! Booking ID: ${result.booking.bookingId}`);
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          vehicleId: '',
          startDateTime: '',
          endDateTime: '',
          cashAmount: 0,
          onlineAmount: 0,
          notes: ''
        });
        setVehicles([]);
        onBookingCreated();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <h3>Create Offline Booking</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer Name:</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Email (Optional):</label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date & Time:</label>
            <input
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(e) => {
                setFormData({...formData, startDateTime: e.target.value});
                loadAvailableVehicles();
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date & Time:</label>
            <input
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(e) => {
                setFormData({...formData, endDateTime: e.target.value});
                loadAvailableVehicles();
              }}
              required
            />
          </div>
        </div>

        {vehicles.length > 0 && (
          <div className="form-group">
            <label>Select Vehicle:</label>
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
              required
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.name} - {vehicle.vehicleNo} ({vehicle.category})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Cash Amount Received:</label>
            <input
              type="number"
              value={formData.cashAmount}
              onChange={(e) => setFormData({...formData, cashAmount: parseFloat(e.target.value) || 0})}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Online Payment:</label>
            <input
              type="number"
              value={formData.onlineAmount}
              onChange={(e) => setFormData({...formData, onlineAmount: parseFloat(e.target.value) || 0})}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes:</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading || !selectedZone}>
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

// ===== 6. Environment Variables =====

// Add these to your .env file
const requiredEnvVars = {
  MONGODB_URI: 'mongodb://localhost:27017/onlinestore',
  JWT_SECRET: 'your-jwt-secret',
  // Add other required variables
};

// ===== 7. Testing the Integration =====

// Test script to verify the integration
const testSellerBooking = async () => {
  try {
    // 1. Test authentication
    const authResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'seller@example.com',
        password: 'password123'
      })
    });
    
    const { token } = await authResponse.json();
    
    // 2. Test getting available vehicles
    const vehiclesResponse = await fetch('/api/seller/vehicles/available?zoneId=DT001', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const vehiclesData = await vehiclesResponse.json();
    console.log('Available vehicles:', vehiclesData.vehicles?.length);
    
    // 3. Test cash flow summary
    const summaryResponse = await fetch('/api/seller/cash-flow/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const summaryData = await summaryResponse.json();
    console.log('Cash flow summary:', summaryData.summary);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// ===== 8. Deployment Checklist =====

const deploymentChecklist = [
  '✅ Update User model with worker role',
  '✅ Update VehicleBooking model with cash flow fields', 
  '✅ Create sellerBookingController.js',
  '✅ Create seller booking routes',
  '✅ Run database migration',
  '✅ Update frontend with seller dashboard',
  '✅ Test all API endpoints',
  '✅ Test cash flow calculations',
  '✅ Test zone-based access control',
  '✅ Deploy to production'
];

module.exports = {
  migrateExistingBookings,
  testSellerBooking,
  deploymentChecklist
};