// Simple loader to validate route module requires without starting server
try {
  require('../server/routes/subscriptionV2.js');
  console.log('subscriptionV2 route module loaded');
} catch (err) {
  console.error('Failed to load subscriptionV2 route:', err && err.message);
  process.exit(1);
}