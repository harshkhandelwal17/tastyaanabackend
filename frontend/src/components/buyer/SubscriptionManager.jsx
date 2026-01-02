import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetUserSubscriptionsQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
} from "../../redux/storee/api";
import {
  Package,
  Clock,
  Star,
  Utensils,
  Edit,
  Pause,
  Play,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

const SubscriptionManager = ({ isOpen, onClose, subscriptionId }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("customize");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customizations, setCustomizations] = useState({
    spiceLevel: "medium",
    noOnion: false,
    noGarlic: false,
    specialInstructions: "",
  });

  const { data: subscriptionData, isLoading } = useGetUserSubscriptionsQuery(
    { status: "active" },
    { skip: !isAuthenticated }
  );

  const [pauseSubscription] = usePauseSubscriptionMutation();
  const [resumeSubscription] = useResumeSubscriptionMutation();

  const subscription = subscriptionData?.data?.subscriptions?.find(
    (sub) => sub._id === subscriptionId
  );

  const handlePauseSubscription = async () => {
    try {
      await pauseSubscription({
        id: subscriptionId,
        reason: "User request",
      }).unwrap();
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await resumeSubscription(subscriptionId).unwrap();
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  const handleCustomizeMeal = () => {
    // Save customizations
    console.log("Saving customizations:", customizations);
    // Close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Manage Subscription
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">
              Loading subscription details...
            </p>
          </div>
        ) : subscription ? (
          <div className="p-6">
            {/* Subscription Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  {subscription.planId?.title || "Meal Plan"}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>

              {/* Meal Availability Status */}
              {subscription.sellerMealAvailability && (
                <div className="mb-3 p-3 rounded-lg border bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Meal Service Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subscription.sellerMealAvailability.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {subscription.sellerMealAvailability.isAvailable
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                  {!subscription.sellerMealAvailability.isAvailable &&
                    subscription.sellerMealAvailability.reason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {subscription.sellerMealAvailability.reason}
                      </p>
                    )}
                  <div className="flex space-x-4 mt-2 text-xs">
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-1 ${
                          subscription.sellerMealAvailability.shifts?.morning
                            ?.isAvailable
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      ></span>
                      <span className="text-gray-600">Morning</span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-1 ${
                          subscription.sellerMealAvailability.shifts?.evening
                            ?.isAvailable
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      ></span>
                      <span className="text-gray-600">Evening</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Remaining Days:</span>
                  <p>{subscription.remainingDays}</p>
                </div>
                <div>
                  <span className="font-medium">Delivery:</span>
                  <p>
                    {subscription.deliverySlots?.lunch ? "Lunch" : "Dinner"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab("customize")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "customize"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Customize Meal
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "manage"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Manage Subscription
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "customize" && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">
                  Customize Today's Meal
                </h4>

                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Customization Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spice Level
                    </label>
                    <select
                      value={customizations.spiceLevel}
                      onChange={(e) =>
                        setCustomizations({
                          ...customizations,
                          spiceLevel: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customizations.noOnion}
                        onChange={(e) =>
                          setCustomizations({
                            ...customizations,
                            noOnion: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">No Onion</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customizations.noGarlic}
                        onChange={(e) =>
                          setCustomizations({
                            ...customizations,
                            noGarlic: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">No Garlic</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={customizations.specialInstructions}
                      onChange={(e) =>
                        setCustomizations({
                          ...customizations,
                          specialInstructions: e.target.value,
                        })
                      }
                      placeholder="Any special requests or dietary requirements..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCustomizeMeal}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Save Customizations
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeTab === "manage" && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">
                  Subscription Management
                </h4>

                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-yellow-800">
                          Important Notice
                        </h5>
                        <p className="text-sm text-yellow-700 mt-1">
                          Changes to your subscription will take effect from the
                          next delivery cycle.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {subscription.status === "active" ? (
                      <button
                        onClick={handlePauseSubscription}
                        className="flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        Pause Subscription
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeSubscription}
                        className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Resume Subscription
                      </button>
                    )}

                    <button
                      onClick={() => navigate("/meal-plans")}
                      className="flex items-center justify-center gap-2 border border-orange-500 text-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Change Plan
                    </button>

                    <button
                      onClick={() => navigate("/profile")}
                      className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      View All Subscriptions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Subscription Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The subscription you're looking for doesn't exist or has been
              cancelled.
            </p>
            <button
              onClick={() => navigate("/meal-plans")}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Browse Meal Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
