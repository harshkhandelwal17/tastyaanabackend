// Test script for individual meal update
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const subscriptionId = '6927df202a74366e6a99599d';

// You'll need to get a valid auth token for seller 687242b702db822f91b13586
const authToken = 'YOUR_AUTH_TOKEN_HERE';

const testData = {
  items: [
    { name: "Test Rice", quantity: "1", unit: "plate" },
    { name: "Test Dal", quantity: "1", unit: "bowl" }
  ],
  mealType: "lunch",
  isAvailable: true,
};

async function testIndividualMealUpdate() {
  try {
    console.log('Testing individual meal update...');
    console.log('Subscription ID:', subscriptionId);
    console.log('Test data:', testData);
    
    const response = await axios.put(
      `${API_BASE_URL}/seller/meal-edit/subscription/${subscriptionId}/today-meal`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('Success! Response:', response.data);
    
  } catch (error) {
    console.error('Error testing individual meal update:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test without auth token first to see if endpoint exists
async function testEndpointExists() {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/seller/meal-edit/subscription/${subscriptionId}/today-meal`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Endpoint exists - got 401 (authentication required)');
    } else if (error.response && error.response.status === 404) {
      console.log('❌ Endpoint not found - 404 error');
      console.log('Response:', error.response.data);
    } else {
      console.log('Response status:', error.response?.status);
      console.log('Response data:', error.response?.data);
    }
  }
}

console.log('Testing endpoint existence...');
testEndpointExists();