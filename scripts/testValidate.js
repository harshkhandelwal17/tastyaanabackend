try {
  const validators = require('../server/middleware/laundryValidation.js');
  console.log('keys:', Object.keys(validators));
  console.log('validateOrder type:', typeof validators.validateOrder);
  console.log('validateSubscription type:', typeof validators.validateSubscription);
} catch (err) {
  console.error('Failed to load laundryValidation:', err && err.message);
  process.exit(1);
}