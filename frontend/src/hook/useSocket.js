// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { addNotification } from '../storee/Slices/uiSlice';
import { addToast } from '../storee/Slices/uiSlice';

export const useSocket = () => {
  const socket = useRef();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket
      socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          userId: user._id
        }
      });

      // Join user room
      socket.current.emit('join-user-room', user._id);

      // Listen for notifications
      socket.current.on('notification', (notification) => {
        dispatch(addNotification(notification));
        dispatch(addToast({
          type: 'info',
          title: notification.title,
          message: notification.message
        }));
      });

      // Listen for order updates
      socket.current.on('order-update', (orderData) => {
        dispatch(addToast({
          type: 'success',
          title: 'Order Update',
          message: `Your order #${orderData.orderNumber} status: ${orderData.status}`
        }));
      });

      // Listen for driver assignment
      socket.current.on('driver-assigned', (data) => {
        dispatch(addToast({
          type: 'success',
          title: 'Driver Assigned',
          message: `${data.driver.name} has been assigned to your order`
        }));
      });

      // Listen for location updates
      socket.current.on('location-update', (data) => {
        // Optionally show location update notifications
        console.log('Driver location updated:', data);
      });

      // Listen for status updates
      socket.current.on('status-update', (data) => {
        dispatch(addToast({
          type: 'info',
          title: 'Delivery Update',
          message: `Your order status: ${data.status}`
        }));
      });

      // Listen for subscription updates
      socket.current.on('subscription-update', (subscriptionData) => {
        dispatch(addToast({
          type: 'info',
          title: 'Subscription Update',
          message: subscriptionData.message
        }));
      });

      // Listen for bid updates
      socket.current.on('bid-received', (bidData) => {
        dispatch(addToast({
          type: 'success',
          title: 'New Bid Received',
          message: `You received a bid of ₹${bidData.price} for your custom request`
        }));
      });

      return () => {
        socket.current.disconnect();
      };
    }
  }, [isAuthenticated, user, dispatch]);

  return socket.current;
};