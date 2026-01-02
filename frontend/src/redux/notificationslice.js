
// store/slices/notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [
    {
      id: 1,
      message: "Your order has been dispatched!",
      type: "order",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      message: "New festive collection is now available!",
      type: "promo",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "Rate your recent purchase",
      type: "review",
      time: "2 hours ago",
      read: true,
    },
  ],
  unreadCount: 2,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotification = {
        ...action.payload,
        id: Date.now(),
        read: false,
        time: new Date().toLocaleString(),
      };
      state.notifications.unshift(newNotification);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        state.unreadCount = state.notifications.filter(n => !n.read).length;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications 
} = notificationsSlice.actions;
export default notificationsSlice.reducer;