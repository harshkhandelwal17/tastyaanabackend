// Quick test to upload documents to your specific booking using the running server
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testRealUpload = async () => {
  console.log('=== TESTING REAL DOCUMENT UPLOAD ===\n');
  
  const serverUrl = 'http://localhost:5000';
  const bookingId = 'VB1766077737108730MNJ';
  
  console.log('🎯 Target Booking:', bookingId);
  console.log('🌐 Server URL:', serverUrl);
  
  try {
    // Create a small test file
    const testContent = `TEST DOCUMENT - ${new Date().toISOString()}
This is a sample document for booking ${bookingId}
Document type: ID Proof
Created for testing document upload functionality`;
    
    const fileName = 'test-id-proof.txt';
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, testContent);
    
    console.log('📄 Created test file:', fileName);
    
    // Create FormData
    const form = new FormData();
    form.append('bookingId', bookingId);
    form.append('documents', fs.createReadStream(filePath), {
      filename: 'id-proof.txt',
      contentType: 'text/plain'
    });
    
    console.log('\n📤 Uploading document...');
    
    // Make the API call
    const response = await axios.post(`${serverUrl}/api/vehicles/bookings/documents/upload`, form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Upload successful!');
    console.log('\n📊 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    fs.unlinkSync(filePath);
    console.log('\n🧹 Test file cleaned up');
    
    if (response.data.success) {
      console.log('\n🎉 SUCCESS! Document uploaded and saved to booking!');
      console.log('✅ Documents are no longer empty');
      console.log('✅ File URL:', response.data.data.documents[0]?.url);
      
      // Now test fixing helmet count
      await testHelmetCountFix(bookingId);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server connection failed. Make sure:');
      console.log('1. Server is running on port 5000');
      console.log('2. No firewall blocking the connection');
      console.log('3. MongoDB is connected');
    }
    
    // Clean up test file if it exists
    const filePath = path.join(__dirname, 'test-id-proof.txt');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const testHelmetCountFix = async (bookingId) => {
  console.log('\n=== FIXING HELMET COUNT ===');
  
  console.log('🪖 Since there\'s no direct API for helmet count, here\'s the MongoDB command:');
  console.log(`
MongoDB Command:
db.vehiclebookings.updateOne(
  { bookingId: "${bookingId}" },
  { $set: { "accessoriesChecklist.helmet": 3 } }
);
`);
  
  console.log('🔧 Or run this in your MongoDB client:');
  console.log(`use your_database_name;`);
  console.log(`db.vehiclebookings.updateOne({ bookingId: "${bookingId}" }, { $set: { "accessoriesChecklist.helmet": 3 } });`);
};

// Show usage instructions
const showInstructions = () => {
  console.log('\n=== BROWSER-BASED UPLOAD INSTRUCTIONS ===\n');
  
  console.log('1. 🌐 Open the HTML form in your browser:');
  console.log('   - Double-click: test-document-upload.html');
  console.log('   - Or navigate to: file:///[path]/test-document-upload.html\n');
  
  console.log('2. 📋 Form will pre-fill with:');
  console.log('   - Booking ID: VB1766077737108730MNJ');
  console.log('   - Three file upload fields\n');
  
  console.log('3. 📤 Upload process:');
  console.log('   - Select your actual documents (PDF/JPG/PNG)');
  console.log('   - Click "Upload Documents"');
  console.log('   - Wait for success message\n');
  
  console.log('4. ✅ Expected result:');
  console.log('   - Files uploaded to Cloudinary');
  console.log('   - URLs saved to booking.documents array');
  console.log('   - Success message with document count\n');
  
  console.log('5. 🪖 Fix helmet count:');
  console.log('   - Use the MongoDB command shown above');
  console.log('   - Or modify the booking directly in your database');
};

console.log('🚀 Starting real upload test...\n');
showInstructions();

// Ask user if they want to run the automated test
console.log('\n🤖 Running automated upload test in 3 seconds...');
console.log('Press Ctrl+C to cancel and use the browser form instead\n');

setTimeout(() => {
  testRealUpload().catch(console.error);
}, 3000);

module.exports = { testRealUpload };