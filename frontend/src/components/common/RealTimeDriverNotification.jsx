import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useSelector } from "react-redux";

const RealTimeDriverNotification = ({ orderId }) => {
  const { user } = useSelector((state) => state.auth);
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const SOCKET_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (!user?.id) return;

    console.log("🔌 Connecting to real-time driver notifications...", {
      userId: user.id,
      orderId,
    });

    // Create socket connection with explicit path
    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Driver notification socket connected:", newSocket.id);
      setIsConnected(true);

      // Join user-specific room for notifications
      newSocket.emit("user-connect", { userId: user.id });
      console.log("📡 Joined user room:", `user-${user.id}`);

      // Join tracking room if orderId is provided
      if (orderId) {
        newSocket.emit("join-tracking", orderId);
        console.log("📡 Joined tracking room:", `tracking-${orderId}`);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Driver notification socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Driver notification socket connection error:", error);
      setIsConnected(false);
    });

    // Listen for real-time driver assignment events
    newSocket.on("driver-assigned-realtime", (data) => {
      console.log("🚗 REAL-TIME DRIVER ASSIGNMENT RECEIVED!", data);

      // Show notification for this user's orders
      if (data.orderId || (orderId && data.orderId === orderId)) {
        setNotification(data);
        setIsVisible(true);

        // Auto-hide after 10 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);

        // Also dispatch custom event for other components
        window.dispatchEvent(
          new CustomEvent("driverAssigned", {
            detail: data,
          })
        );

        // Show browser notification if permission granted
        if (window.Notification && Notification.permission === "granted") {
          new Notification("Driver Assigned!", {
            body:
              data.message ||
              `${data.driver.name} has been assigned to your order`,
            icon: "/favicon.ico",
            tag: `driver-assignment-${data.orderId}`,
            requireInteraction: true,
          });
        }
      }
    });

    // Legacy driver assignment event (for backward compatibility)
    newSocket.on("driver-assigned", (data) => {
      console.log("🚗 Driver assigned (legacy):", data);

      if (data.driver) {
        const legacyData = {
          orderId: data.orderId || orderId,
          orderNumber: data.orderNumber,
          driver: data.driver,
          status: "assigned",
          message: `${data.driver.name} has been assigned to your order`,
          timestamp: new Date(),
        };

        setNotification(legacyData);
        setIsVisible(true);

        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    });

    // Room join confirmations
    newSocket.on("user-connected", (data) => {
      console.log("👤 User connected confirmation:", data);
    });

    newSocket.on("tracking-joined", (data) => {
      console.log("📡 Tracking room joined confirmation:", data);
    });

    // Error handling
    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    // Request notification permission
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
    }

    return () => {
      if (newSocket) {
        console.log("🔌 Disconnecting driver notification socket");
        newSocket.disconnect();
      }
    };
  }, [user?.id, orderId, SOCKET_URL]);

  // Update orderId and join tracking room
  useEffect(() => {
    if (socket && isConnected && orderId) {
      socket.emit("join-tracking", orderId);
      console.log(`📡 Joined tracking room for order: ${orderId}`);
    }
  }, [socket, isConnected, orderId]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleViewTracking = () => {
    if (notification?.orderId) {
      window.location.href = `/track-order/${notification.orderId}`;
    }
  };

  if (!notification || !isVisible) return null;

  return (
    <>
      {/* Connection Status Debug (only in development) */}
      {import.meta.env.MODE === "development" && (
        <div className="fixed bottom-4 left-4 z-40 bg-black text-white text-xs p-2 rounded">
          Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          {user && <div>User: {user.id}</div>}
          {orderId && <div>Order: {orderId}</div>}
        </div>
      )}

      {/* Driver Assignment Notification */}
      <div
        className="fixed top-4 right-4 z-50 max-w-sm bg-white shadow-2xl rounded-lg border border-green-200 overflow-hidden transform transition-all duration-500 ease-in-out"
        style={{
          zIndex: 9999,
          animation: "slideInFromTop 0.5s ease-out, pulse 0.5s ease-in-out",
        }}
      >
        <style jsx>{`
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-100px) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
            }
          }
        `}</style>

        {/* Header */}
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-lg animate-bounce">🚗</span>
            <span className="font-bold text-sm">Driver Assigned!</span>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            {/* Driver Avatar */}
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-blue-200">
              {notification.driver?.name?.charAt(0) || "D"}
            </div>

            {/* Driver Info */}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base">
                {notification.driver?.name || "Driver"}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <span className="flex items-center mr-4">
                  ⭐ {notification.driver?.rating || "4.5"}
                </span>
                <span className="flex items-center">
                  🏍️ {notification.driver?.vehicle?.type || "Bike"}
                </span>
              </div>
              {notification.driver?.phone && (
                <div className="text-xs text-gray-500 mt-1">
                  📞 {notification.driver.phone}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-800 text-sm font-medium">
              {notification.message ||
                `${notification.driver?.name} has been assigned to your order`}
            </p>
          </div>

          {/* Order Info */}
          <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            Order #{notification.orderNumber || notification.orderId?.slice(-8)}
            <div className="text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleViewTracking}
              className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              📍 Track Order
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-green-400 transition-all duration-100 ease-linear"
            style={{
              width: "100%",
              animation: "progressBar 10s linear forwards",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes progressBar {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default RealTimeDriverNotification;
