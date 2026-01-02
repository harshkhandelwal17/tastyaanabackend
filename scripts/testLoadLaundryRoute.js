try {
  require('../server/routes/laundryRoutes.js');
  console.log('laundryRoutes module loaded');
} catch (err) {
  console.error('Failed to load laundryRoutes:', err && err.message);
  process.exit(1);
}