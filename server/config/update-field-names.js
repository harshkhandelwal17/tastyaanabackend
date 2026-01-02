/**
 * Update Rideyourbike.json to replace sittingCapacity with seatingCapacity
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Rideyourbike.json');

try {
  console.log('📖 Reading Rideyourbike.json...');
  const data = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔄 Replacing sittingCapacity with seatingCapacity...');
  const updatedData = data.replace(/"sittingCapacity"/g, '"seatingCapacity"');
  
  console.log('💾 Writing updated data...');
  fs.writeFileSync(filePath, updatedData, 'utf8');
  
  console.log('✅ Successfully updated Rideyourbike.json!');
  console.log('🔍 Verifying changes...');
  
  // Count occurrences to verify
  const oldCount = (data.match(/"sittingCapacity"/g) || []).length;
  const newCount = (updatedData.match(/"seatingCapacity"/g) || []).length;
  
  console.log(`- Replaced ${oldCount} occurrences`);
  console.log(`- New file contains ${newCount} seatingCapacity entries`);
  
} catch (error) {
  console.error('❌ Error updating file:', error.message);
  process.exit(1);
}