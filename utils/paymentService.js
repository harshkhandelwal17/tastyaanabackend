exports.processPayment = async ({
  amount,
  currency = 'INR',
  method,
  userId,
  orderId,
  description
}) => {
  try {
    if (method === 'razorpay') {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: `order_${Date.now()}`,
        notes: {
          userId,
          orderId: orderId?.toString(),
          description
        }
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      };
    }

    // Handle other payment methods here
    return {
      success: false,
      error: 'Payment method not supported'
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Razorpay payment signature
 */
exports.verifyPaymentSignature = (paymentId, orderId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};