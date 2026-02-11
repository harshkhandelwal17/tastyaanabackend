try {
  const auth = require('../server/middlewares/auth');
  console.log('auth keys:', Object.keys(auth));
  console.log('authenticate type:', typeof auth.authenticate);
} catch (err) {
  console.error('Failed to load middlewares/auth:', err && err.message);
  process.exit(1);
}