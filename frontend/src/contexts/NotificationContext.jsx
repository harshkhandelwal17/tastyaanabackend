import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";

// Notification Context for PWA notifications
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    if (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Notifications are not supported in this browser");
      return false;
    }

    try {
      setIsLoading(true);
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        toast.success("Notification permission granted!");
        return true;
      } else {
        toast.error("Notification permission denied");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to request notification permission");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== "granted") {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;
    }

    try {
      setIsLoading(true);

      // Register service worker
      const registration = await navigator.serviceWorker.register(
        "/notification-sw-simple.js"
      );
      console.log("Service Worker registered:", registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("Service Worker is ready");

      // Get push subscription
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BGfPs49Ptc05vwt_iMu1Ah8rIdoHO4U5pROUeufIrOOKY5EX5SPJUepVoyab92P0kncGIwXOGxtIzqEINZoiGc0",
      });

      setSubscription(pushSubscription);

      // Send subscription to server
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
        }/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription: pushSubscription,
          }),
        }
      );

      if (response.ok) {
        toast.success("Successfully subscribed to notifications!");
        return pushSubscription;
      } else {
        throw new Error("Failed to save subscription");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to subscribe to notifications");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return;

    try {
      setIsLoading(true);

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from server
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
        }/notifications/unsubscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription: subscription,
          }),
        }
      );

      setSubscription(null);
      toast.success("Unsubscribed from notifications");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to unsubscribe from notifications");
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (permission !== "granted") {
      toast.error("Notification permission not granted");
      return;
    }

    try {
      const notification = new Notification("Test Notification", {
        body: "This is a test notification from Tastyaana!",
        icon: "/assets/notification-icon.png",
        badge: "/assets/badge-icon.png",
        tag: "test-notification",
        requireInteraction: true,
        actions: [
          { action: "view", title: "View" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  }, [permission]);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  }, [isSupported]);

  // Initialize notifications on mount
  useEffect(() => {
    if (isSupported && permission === "granted") {
      checkSubscriptionStatus();
    }
  }, [isSupported, permission, checkSubscriptionStatus]);

  const value = {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    checkSubscriptionStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
