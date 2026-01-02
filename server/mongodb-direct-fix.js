// Direct MongoDB commands to fix both helmet count and add document links
console.log('=== MONGODB DIRECT FIX COMMANDS ===\n');

const bookingId = 'VB1766077737108730MNJ';
console.log('🎯 Target Booking ID:', bookingId);

console.log('\n📋 STEP 1: Fix Helmet Count');
console.log('Copy and paste this command into your MongoDB shell:');
console.log('----------------------------------------');
console.log(`db.vehiclebookings.updateOne(`);
console.log(`  { bookingId: "${bookingId}" },`);
console.log(`  { $set: { "accessoriesChecklist.helmet": 3 } }`);
console.log(`);`);

console.log('\n📄 STEP 2: Add Sample Document Links');
console.log('Copy and paste this command into your MongoDB shell:');
console.log('----------------------------------------');
console.log(`db.vehiclebookings.updateOne(`);
console.log(`  { bookingId: "${bookingId}" },`);
console.log(`  { $set: { documents: [`);
console.log(`    {`);
console.log(`      type: "id-proof",`);
console.log(`      url: "https://res.cloudinary.com/tastyaana/image/upload/v1734623456/booking-documents/id_proof.pdf",`);
console.log(`      publicId: "booking-documents/id_proof",`);
console.log(`      originalName: "id_proof.pdf",`);
console.log(`      size: 1024000,`);
console.log(`      uploadedAt: new Date(),`);
console.log(`      verified: false`);
console.log(`    },`);
console.log(`    {`);
console.log(`      type: "driving-license",`);
console.log(`      url: "https://res.cloudinary.com/tastyaana/image/upload/v1734623457/booking-documents/driving_license.jpg",`);
console.log(`      publicId: "booking-documents/driving_license",`);
console.log(`      originalName: "driving_license.jpg",`);
console.log(`      size: 512000,`);
console.log(`      uploadedAt: new Date(),`);
console.log(`      verified: false`);
console.log(`    },`);
console.log(`    {`);
console.log(`      type: "address-proof",`);
console.log(`      url: "https://res.cloudinary.com/tastyaana/image/upload/v1734623458/booking-documents/address_proof.pdf",`);
console.log(`      publicId: "booking-documents/address_proof",`);
console.log(`      originalName: "address_proof.pdf",`);
console.log(`      size: 768000,`);
console.log(`      uploadedAt: new Date(),`);
console.log(`      verified: false`);
console.log(`    }`);
console.log(`  ] } }`);
console.log(`);`);

console.log('\n🔍 STEP 3: Verify Changes');
console.log('Check if the update worked:');
console.log('----------------------------------------');
console.log(`db.vehiclebookings.findOne(`);
console.log(`  { bookingId: "${bookingId}" },`);
console.log(`  { accessoriesChecklist: 1, documents: 1 }`);
console.log(`);`);

console.log('\n✅ EXPECTED RESULTS AFTER FIX:');
console.log('----------------------------------------');
console.log('Before:');
console.log('  ❌ "helmet": false (or 0)');
console.log('  ❌ "documents": []');
console.log('');
console.log('After:');
console.log('  ✅ "helmet": 3');
console.log('  ✅ "documents": [');
console.log('       { type: "id-proof", url: "https://res.cloudinary.com/..." },');
console.log('       { type: "driving-license", url: "https://res.cloudinary.com/..." },');
console.log('       { type: "address-proof", url: "https://res.cloudinary.com/..." }');
console.log('     ]');

console.log('\n🚀 ALTERNATIVE: Use Browser Upload Form');
console.log('----------------------------------------');
console.log('1. Open test-document-upload.html in your browser');
console.log('2. Select real documents (PDF/JPG files)');
console.log('3. Click "Upload Documents"');
console.log('4. Documents will be uploaded to Cloudinary automatically');

console.log('\n📱 HOW TO ACCESS MONGODB:');
console.log('----------------------------------------');
console.log('Option 1: MongoDB Compass');
console.log('  - Open MongoDB Compass application');
console.log('  - Connect to your database');
console.log('  - Navigate to vehiclebookings collection');
console.log('  - Find your booking and edit manually');
console.log('');
console.log('Option 2: MongoDB Shell (mongosh)');
console.log('  - Open terminal/command prompt');
console.log('  - Run: mongosh');
console.log('  - Run: use your_database_name');
console.log('  - Copy and paste the commands above');
console.log('');
console.log('Option 3: MongoDB Atlas (if using cloud)');
console.log('  - Login to MongoDB Atlas');
console.log('  - Go to Collections');
console.log('  - Find vehiclebookings collection');
console.log('  - Use the shell tab to run commands');

console.log('\n🎉 FINAL VERIFICATION:');
console.log('After running the commands, your booking JSON should show:');
console.log(`"accessoriesChecklist": { "helmet": 3, ... }`);
console.log(`"documents": [ {object}, {object}, {object} ]`);

console.log('\n💡 TIP: If you prefer real file uploads, use the HTML form provided!');
console.log('The form will call the API endpoint and save real Cloudinary URLs.');