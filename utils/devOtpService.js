// Development fallback for OTP without email
// utils/devOtpService.js

// In-memory storage for development
const devOtpStorage = new Map();

/**
 * Development OTP service that stores OTPs in memory
 * Use this when email service is not configured
 */
const devOtpService = {
  /**
   * Generate and store OTP for development
   */
  generateAndStore: (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes 
    
    devOtpStorage.set(email, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });
    
    console.log('📧 [DEV MODE] OTP Generated:');
    console.log(`   Email: ${email}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires in: 5 minutes`);
    console.log('   💡 Use this OTP to verify in your frontend');
    console.log('   ⚠️  This is for development only!');
    
    return { success: true, otp }; // Return OTP for development 
  },

  /**
   * Verify OTP in development
   */
  verify: (email, otp) => {
    const storedData = devOtpStorage.get(email);
    
    if (!storedData) {
      return { success: false, message: 'OTP expired or not found' }; 
    }
    
    if (Date.now() > storedData.expiry) {
      devOtpStorage.delete(email);
      return { success: false, message: 'OTP has expired' };
    }
    
    if (storedData.attempts >= 3) {
      devOtpStorage.delete(email);
      return { success: false, message: 'Too many attempts. Please request a new OTP' };
    }
    
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      devOtpStorage.set(email, storedData);
      return { success: false, message: 'Invalid OTP' };
    }
    
    // Success
    devOtpStorage.delete(email);
    return { success: true, message: 'OTP verified successfully' };
  },

  /**
   * Clear expired OTPs
   */
  cleanup: () => {
    const now = Date.now();
    for (const [email, data] of devOtpStorage.entries()) {
      if (now > data.expiry) {
        devOtpStorage.delete(email);
      }
    }
  },

  /**
   * Get all stored OTPs (development only)
   */
  getAll: () => {
    const otps = [];
    for (const [email, data] of devOtpStorage.entries()) {
      otps.push({
        email,
        otp: data.otp,
        expiresAt: new Date(data.expiry),
        attempts: data.attempts
      });
    }
    return otps;
  }
};

// Auto cleanup every 5 minutes
setInterval(() => {
  devOtpService.cleanup();
}, 5 * 60 * 1000);

module.exports = devOtpService;
