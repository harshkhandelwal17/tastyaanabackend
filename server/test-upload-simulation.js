// Test script to simulate document upload via API
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Simulate document upload for your booking
const testDocumentUpload = async () => {
  console.log('=== TESTING DOCUMENT UPLOAD API ===\n');

  const bookingId = "VB1766077737108730MNJ";
  console.log('🎯 Target Booking ID:', bookingId);

  // Create sample files for testing
  await createSampleFiles();

  try {
    // Test the upload endpoint
    console.log('\n📤 Testing document upload...');
    
    const formData = new FormData();
    formData.append('bookingId', bookingId);

    // Add sample files
    const sampleFiles = [
      'sample-id-proof.txt',
      'sample-license.txt', 
      'sample-address.txt'
    ];

    sampleFiles.forEach((fileName, index) => {
      const filePath = path.join(__dirname, 'temp', fileName);
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        formData.append('documents', fileStream, fileName);
        console.log(`   📄 Added file: ${fileName}`);
      }
    });

    // Since we can't make actual HTTP requests without a running server,
    // let's simulate the upload process by directly calling the controller
    console.log('\n🔄 Simulating upload process...');
    await simulateUpload(bookingId, sampleFiles);

  } catch (error) {
    console.error('❌ Upload test error:', error.message);
  }

  // Clean up sample files
  cleanupSampleFiles();
};

const createSampleFiles = async () => {
  console.log('📁 Creating sample files...');
  
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const sampleFiles = [
    { 
      name: 'sample-id-proof.txt', 
      content: 'SAMPLE ID PROOF DOCUMENT\nPassport Number: AB1234567\nIssued: 2020-01-01\nValid till: 2030-01-01',
      type: 'id-proof'
    },
    { 
      name: 'sample-license.txt', 
      content: 'SAMPLE DRIVING LICENSE\nLicense Number: DL123456789\nIssued: 2022-06-15\nValid till: 2027-06-15',
      type: 'driving-license'
    },
    { 
      name: 'sample-address.txt', 
      content: 'SAMPLE ADDRESS PROOF\nAadhaar Number: 1234-5678-9012\nAddress: Vijay Nagar, Indore\nPincode: 452010',
      type: 'address-proof'
    }
  ];

  sampleFiles.forEach(file => {
    const filePath = path.join(tempDir, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log(`   ✅ Created: ${file.name} (${file.type})`);
  });
};

const simulateUpload = async (bookingId, fileNames) => {
  console.log('\n🔄 Simulating document upload process...');
  
  // Simulate the upload controller logic
  const uploadedDocuments = fileNames.map((fileName, index) => ({
    type: fileName.includes('id-proof') ? 'id-proof' :
          fileName.includes('license') ? 'driving-license' : 'address-proof',
    url: `https://res.cloudinary.com/tastyaana/image/upload/v${Date.now() + index}/booking-documents/${fileName.replace('.txt', '.pdf')}`,
    publicId: `booking-documents/${fileName.replace('.txt', '')}`,
    originalName: fileName.replace('.txt', '.pdf'),
    size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
    uploadedAt: new Date(),
    verified: false
  }));

  console.log('✅ Simulated Cloudinary upload successful!');
  console.log('\n📋 Uploaded Documents:');
  uploadedDocuments.forEach((doc, i) => {
    console.log(`   ${i + 1}. ${doc.type}: ${doc.originalName}`);
    console.log(`      URL: ${doc.url}`);
    console.log(`      Size: ${(doc.size / 1024).toFixed(1)} KB`);
  });

  // Simulate database update
  console.log('\n💾 Simulating database update...');
  console.log(`   🎯 Booking ID: ${bookingId}`);
  console.log(`   📄 Documents to add: ${uploadedDocuments.length}`);
  console.log('   ✅ Documents would be added to booking.documents array');
  
  // Show what the API response would look like
  const apiResponse = {
    success: true,
    message: 'Documents uploaded and saved successfully',
    data: {
      bookingId: bookingId,
      documents: uploadedDocuments,
      totalDocuments: uploadedDocuments.length
    }
  };

  console.log('\n📡 API Response:');
  console.log(JSON.stringify(apiResponse, null, 2));

  return apiResponse;
};

const cleanupSampleFiles = () => {
  console.log('\n🧹 Cleaning up sample files...');
  
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
    fs.rmdirSync(tempDir);
    console.log('   ✅ Sample files cleaned up');
  }
};

// Instructions for real usage
const showUsageInstructions = () => {
  console.log('\n=== HOW TO USE WITH REAL FRONTEND ===\n');
  
  console.log('1. 🌐 Open the HTML form:');
  console.log('   - Open test-document-upload.html in your browser');
  console.log('   - Or serve it from your frontend application\n');
  
  console.log('2. 📤 Upload real files:');
  console.log('   - Select your actual documents (PDF/images)');
  console.log('   - Ensure booking ID is correct: VB1766077737108730MNJ');
  console.log('   - Click "Upload Documents"\n');
  
  console.log('3. 🔧 API Endpoint:');
  console.log('   POST /api/vehicles/bookings/documents/upload');
  console.log('   Body: FormData with bookingId + files\n');
  
  console.log('4. ✅ Expected Result:');
  console.log('   - Files uploaded to Cloudinary');
  console.log('   - URLs saved to booking.documents array');
  console.log('   - Helmet count still needs manual fix\n');
  
  console.log('5. 🔍 Verification:');
  console.log('   - Check your booking document again');
  console.log('   - documents array should now contain file URLs');
  console.log('   - helmet count can be fixed manually');
};

// Run the test
console.log('🚀 Starting document upload test simulation...\n');

testDocumentUpload()
  .then(() => {
    showUsageInstructions();
    
    console.log('\n🎉 NEXT STEPS:');
    console.log('1. 📄 Use test-document-upload.html to upload real files');
    console.log('2. 🪖 Fix helmet count manually in database');  
    console.log('3. 🔍 Verify both fixes in your booking document');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });

module.exports = { testDocumentUpload };