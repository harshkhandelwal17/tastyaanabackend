import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

// Hook for order-related notifications
export const useOrderNotifications = () => {
  const { subscription } = useNotifications();

  const sendOrderConfirmation = useCallback(async (orderData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/order-confirmed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          totalAmount: orderData.totalAmount,
          estimatedDelivery: orderData.estimatedDelivery,
          items: orderData.items,
          customerName: orderData.customerName,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Order confirmation notification sent');
      }
    } catch (error) {
      console.error('Error sending order confirmation notification:', error);
    }
  }, [subscription]);

  const sendOrderShipped = useCallback(async (orderData, trackingInfo) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/order-shipped`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          trackingNumber: trackingInfo.trackingNumber,
          carrier: trackingInfo.carrier,
          estimatedDelivery: trackingInfo.estimatedDelivery,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Order shipped notification sent');
      }
    } catch (error) {
      console.error('Error sending order shipped notification:', error);
    }
  }, [subscription]);

  const sendOrderDelivered = useCallback(async (orderData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/order-delivered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          deliveredAt: new Date().toISOString(),
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Order delivered notification sent');
      }
    } catch (error) {
      console.error('Error sending order delivered notification:', error);
    }
  }, [subscription]);

  return {
    sendOrderConfirmation,
    sendOrderShipped,
    sendOrderDelivered
  };
};

// Hook for cart-related notifications
export const useCartNotifications = () => {
  const { subscription } = useNotifications();

  const sendCartReminder = useCallback(async (cartData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/cart-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cartId: cartData.id,
          itemsCount: cartData.items.length,
          totalAmount: cartData.totalAmount,
          lastActivity: cartData.lastActivity,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Cart reminder notification sent');
      }
    } catch (error) {
      console.error('Error sending cart reminder notification:', error);
    }
  }, [subscription]);

  return {
    sendCartReminder
  };
};

// Hook for product-related notifications
export const useProductNotifications = () => {
  const { subscription } = useNotifications();

  const sendNewProductAlert = useCallback(async (productData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/new-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: productData.id,
          productName: productData.name,
          productImage: productData.image,
          price: productData.price,
          category: productData.category,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('New product notification sent');
      }
    } catch (error) {
      console.error('Error sending new product notification:', error);
    }
  }, [subscription]);

  const sendPriceDropAlert = useCallback(async (productData, oldPrice, newPrice) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/price-drop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: productData.id,
          productName: productData.name,
          productImage: productData.image,
          oldPrice: oldPrice,
          newPrice: newPrice,
          discountPercentage: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Price drop notification sent');
      }
    } catch (error) {
      console.error('Error sending price drop notification:', error);
    }
  }, [subscription]);

  const sendRestockAlert = useCallback(async (productData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: productData.id,
          productName: productData.name,
          productImage: productData.image,
          stockCount: productData.stock,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Restock notification sent');
      }
    } catch (error) {
      console.error('Error sending restock notification:', error);
    }
  }, [subscription]);

  return {
    sendNewProductAlert,
    sendPriceDropAlert,
    sendRestockAlert
  };
};

// Hook for promotional notifications
export const usePromotionalNotifications = () => {
  const { subscription } = useNotifications();

  const sendPromotion = useCallback(async (promotionData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/promotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          promotionId: promotionData.id,
          title: promotionData.title,
          description: promotionData.description,
          discountPercentage: promotionData.discountPercentage,
          validUntil: promotionData.validUntil,
          targetUrl: promotionData.targetUrl,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Promotion notification sent');
      }
    } catch (error) {
      console.error('Error sending promotion notification:', error);
    }
  }, [subscription]);

  return {
    sendPromotion
  };
};

// Hook for general notifications
export const useGeneralNotifications = () => {
  const { subscription } = useNotifications();

  const sendCustomNotification = useCallback(async (notificationData) => {
    if (!subscription) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          type: notificationData.type || 'general',
          data: notificationData.data || {},
          actions: notificationData.actions || [],
          requireInteraction: notificationData.requireInteraction || false,
          subscription: subscription
        })
      });

      if (response.ok) {
        console.log('Custom notification sent');
      }
    } catch (error) {
      console.error('Error sending custom notification:', error);
    }
  }, [subscription]);

  return {
    sendCustomNotification
  };
};
