import React, { useState, useEffect } from "react";
import { AlertTriangle, Ban, X, RefreshCw } from "lucide-react";

const NoMealTodayAlert = ({ userId }) => {
  const [noMealStatus, setNoMealStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
  const authToken =
    localStorage.getItem("authToken") || localStorage.getItem("token");

  useEffect(() => {
    if (userId && !dismissed) {
      checkNoMealStatus();
    }
  }, [userId, dismissed]);

  const checkNoMealStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/subscriptions/check-no-meal-today`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No "no meal" notifications found - this is normal
          setNoMealStatus(null);
          return;
        }
        throw new Error("Failed to check meal status");
      }

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setNoMealStatus(data.data);
      } else {
        setNoMealStatus(null);
      }
    } catch (error) {
      console.error("Error checking no meal status:", error);
      // Don't show error for this non-critical feature
      setNoMealStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setNoMealStatus(null);
  };

  // Don't show anything if dismissed, no data, or still loading
  if (dismissed || !noMealStatus || noMealStatus.length === 0 || loading) {
    return null;
  }

  return (
    <div className="mb-6">
      {noMealStatus.map((notification) => (
        <div
          key={`${notification.seller._id}-${notification.shift}`}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Ban className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h4 className="text-red-800 font-semibold text-lg">
                  No Meal Today -{" "}
                  {notification.shift.charAt(0).toUpperCase() +
                    notification.shift.slice(1)}{" "}
                  Shift
                </h4>
                <p className="text-red-700 mt-1">
                  <strong>{notification.seller.name}</strong> has marked "no
                  meal today" for the {notification.shift} shift.
                </p>
                {notification.reason && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm">
                    <strong>Reason:</strong> {notification.reason}
                  </div>
                )}
                <p className="text-red-600 text-sm mt-2">
                  Your meal for today's {notification.shift} shift will not be
                  delivered. Please make alternative arrangements.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-red-400 hover:text-red-600"
              title="Dismiss notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoMealTodayAlert;
