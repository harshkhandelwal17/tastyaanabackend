exports.generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  };
  
  /**
   * Send OTP via SMS
   */
  exports.sendOTP = async (phone, otp) => {
    try {
      // In production, integrate with SMS service like Twilio, MSG91, etc.
      console.log(`Sending OTP ${otp} to ${phone}`);
      
      // Mock SMS sending
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  };