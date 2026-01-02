
const Order = require('../models/Order');
const crypto = require('crypto');

const orderUtils = {
  /**
   * Generate unique order number
   * Format: ORD-YYYY-XXXXXX (e.g., ORD-2025-000001)
   */
  generateOrderNumber: async () => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `ORD-${currentYear}-`;
      
      // Get the count of orders for current year
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      
      const orderCount = await Order.countDocuments({
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      });
      
      // Generate sequential number with padding
      const sequentialNumber = (orderCount+2000 + 1).toString().padStart(6, '0');
      const orderNumber = `${prefix}${sequentialNumber}`;
      
      // Check if order number already exists (safety check)
      const existingOrder = await Order.findOne({ orderNumber });
      if (existingOrder) {
        // If exists, generate with random suffix
        const randomSuffix = crypto.randomInt(100, 999);
        return `${prefix}${sequentialNumber}${randomSuffix}`;
      }
      
      return orderNumber;
    } catch (error) {
      // Fallback: Generate with timestamp
      const timestamp = Date.now().toString().slice(-6);
      return `ORD-${new Date().getFullYear()}-${timestamp}`;
    }
  },

  /**
   * Calculate order total including taxes and shipping
   */
  calculateOrderTotal: (subtotal, discount = 0, shippingCharges = 0, taxRate = 0) => {
    const discountedAmount = subtotal - discount;
    const tax = (discountedAmount * taxRate) / 100;
    const total = discountedAmount + shippingCharges + tax;
    
    return {
      subtotal,
      discount,
      tax: Math.round(tax * 100) / 100,
      shippingCharges,
      total: Math.round(total * 100) / 100
    };
  },

  /**
   * Calculate shipping charges based on location and weight
   */
  calculateShippingCharges: (totalAmount, location, totalWeight = 0) => {
    // Free shipping for orders above 500
    if (totalAmount >= 500) return 0;
    
    // Base shipping rates
    const baseRates = {
      local: 30,      // Same city
      regional: 50,   // Same state
      national: 80,   // Other states
      metro: 40       // Metro cities
    };
    
    const metroCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
    const cityName = location.city.toLowerCase();
    
    let shippingRate = baseRates.national; // Default
    
    if (metroCities.includes(cityName)) {
      shippingRate = baseRates.metro;
    }
    
    // Additional charges for heavy orders (above 2kg)
    if (totalWeight > 2000) { // weight in grams
      shippingRate += Math.ceil((totalWeight - 2000) / 500) * 10;
    }
    
    return shippingRate;
  },

  /**
   * Generate estimated delivery date
   */
  generateEstimatedDelivery: (location, orderDate = new Date()) => {
    const metroCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
    const cityName = location.city.toLowerCase();
    
    // Delivery timeframes in days
    let deliveryDays = 5; // Default for other cities
    
    if (metroCities.includes(cityName)) {
      deliveryDays = 2; // Metro cities - 2 days
    } else if (location.state.toLowerCase() === 'maharashtra') {
      deliveryDays = 3; // Same state - 3 days
    }
    
    // Add weekend buffer
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    // If delivery falls on Sunday, move to Monday
    if (deliveryDate.getDay() === 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }
    
    return deliveryDate;
  },

  /**
   * Format order status for display
   */
  formatOrderStatus: (status) => {
    const statusMap = {
      pending: { label: 'Order Placed', color: 'orange', icon: '🛒' },
      confirmed: { label: 'Confirmed', color: 'blue', icon: '✅' },
      processing: { label: 'Preparing', color: 'purple', icon: '👨‍🍳' },
      shipped: { label: 'Shipped', color: 'yellow', icon: '🚚' },
      delivered: { label: 'Delivered', color: 'green', icon: '📦' },
      cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
      refunded: { label: 'Refunded', color: 'gray', icon: '💰' }
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
  },

  /**
   * Validate order data before creation
   */
  validateOrderData: (orderData) => {
    const errors = [];
    
    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      const requiredFields = ['name', 'phone', 'street', 'city', 'state', 'pincode'];
      requiredFields.forEach(field => {
        if (!orderData.shippingAddress[field]) {
          errors.push(`${field} is required in shipping address`);
        }
      });
    }
    
    if (!orderData.paymentMethod) {
      errors.push('Payment method is required');
    }
    
    if (!['COD', 'online', 'wallet', 'card'].includes(orderData.paymentMethod)) {
      errors.push('Invalid payment method');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = orderUtils;
