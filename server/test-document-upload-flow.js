// Test document upload flow
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const serverUrl = 'http://localhost:5000';

async function testDocumentUpload() {
  console.log('🧪 Testing Document Upload Flow');
  console.log('================================');
  
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'Test document content for vehicle booking');
    
    console.log('✅ Created test file:', testFilePath);
    
    // Test the document upload endpoint
    const form = new FormData();
    form.append('bookingId', 'test-booking-123');
    form.append('driving-license', fs.createReadStream(testFilePath), {
      filename: 'test-license.txt',
      contentType: 'text/plain'
    });
    
    console.log('📤 Sending document upload request...');
    console.log('   Endpoint: POST /api/vehicles/bookings/documents/upload');
    console.log('   Booking ID: test-booking-123');
    console.log('   Document Type: driving-license');
    
    const response = await axios.post(
      `${serverUrl}/api/vehicles/bookings/documents/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        }
      }
    );
    
    console.log('✅ Upload Response Status:', response.status);
    console.log('✅ Upload Response Data:', JSON.stringify(response.data, null, 2));
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('🧹 Cleaned up test file');
    
  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

async function testEndpointAvailability() {
  console.log('\n🔍 Testing Endpoint Availability');
  console.log('=================================');
  
  try {
    // Test if server is running
    const response = await axios.get(`${serverUrl}/api/health`, { timeout: 3000 });
    console.log('✅ Server is running');
    
    // Test document upload endpoint without files (should get validation error)
    try {
      await axios.post(`${serverUrl}/api/vehicles/bookings/documents/upload`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Document upload endpoint exists and validates input');
      } else {
        console.log('⚠️  Unexpected response from document upload endpoint');
      }
    }
    
  } catch (error) {
    console.error('❌ Server appears to be offline or endpoint not available');
    console.log('   Make sure to run: npm start in the server directory');
  }
}

// Run tests
async function runTests() {
  await testEndpointAvailability();
  await testDocumentUpload();
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('1. ✅ Fixed frontend to use proper document upload endpoint');
  console.log('2. ✅ Updated vehicleApi.js with uploadBookingDocuments mutation');
  console.log('3. ✅ Modified booking flow to upload documents after booking creation');
  console.log('4. ✅ Fixed backend route to accept any field names (upload.any())');
  console.log('5. ✅ Document upload should now work with Cloudinary storage');
}

runTests();