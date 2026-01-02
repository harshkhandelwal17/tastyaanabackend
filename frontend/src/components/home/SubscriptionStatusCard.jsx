// src/components/home/SubscriptionStatusCard.jsx

import React from "react";
import { CreditCard, Zap, Package, Timer, RefreshCw } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Mock Data (आप इसे अपनी API से रिप्लेस कर सकते हैं)
const mockSubscription = {
  active: true,
  planName: "Premium Tiffin (Monthly)",
  nextDelivery: "Today, Lunch (1:00 PM)",
  renewalDate: "25 Nov 2025",
  remainingDays: 25,
};

const SubscriptionStatusCard = () => {
  const navigate = useNavigate();
  // Redux से user और authentication state प्राप्त करें (जैसा आपके मूल कोड में है)
  const { userInfo, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !mockSubscription.active) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 border-2 border-dashed border-emerald-200 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              Subscription
            </h3>
          </div>
          <button
            onClick={() => navigate("/subscriptions/explore")}
            className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Explore Plans
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Unlock daily meals and exclusive discounts with a subscription.
        </p>
      </div>
    );
  }

  // Active Subscription View
  return (
    <div
      onClick={() => navigate("/my-subscriptions")}
      className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 lg:p-6 shadow-2xl cursor-pointer hover:shadow-emerald-400/50 transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-300 fill-current" />
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Active Plan
          </h2>
        </div>
        <span className="bg-white text-emerald-600 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {mockSubscription.remainingDays} Days Left
        </span>
      </div>

      <p className="text-2xl font-bold text-white mb-1">
        {mockSubscription.planName}
      </p>
      <p className="text-sm text-emerald-100 mb-4">
        Your next meal is scheduled!
      </p>

      <div className="flex items-center justify-between bg-white/20 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-white" />
          <p className="text-sm font-medium text-white">Next Meal:</p>
        </div>
        <p className="text-sm font-semibold text-white">
          {mockSubscription.nextDelivery}
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate("/my-subscriptions");
          }}
          className="flex items-center gap-1 text-sm font-semibold text-white hover:text-emerald-100 transition-colors"
        >
          Manage Plan <RefreshCw className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionStatusCard;