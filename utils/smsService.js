// utils/smsService.js
/**
 * Send SMS
 */
exports.sendSMS = async ({ to, message }) => {
    try {
      // In production, integrate with SMS service
      console.log(`Sending SMS to ${to}: ${message}`);
      
      return {
        success: true,
        messageId: `sms_${Date.now()}`
      };
    } catch (error) {
      console.error('SMS service error:', error);
      throw error;
    }
  };