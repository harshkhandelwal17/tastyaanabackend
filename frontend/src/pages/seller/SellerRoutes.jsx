import React from "react";
import { Routes, Route } from "react-router-dom";
import SellerDashboardHome from "../../components/seller/SellerDashboardHome";
import TodayTiffinList from "../../components/seller/TodayTiffinList";
import PenaltySection from "../../components/seller/PenaltySection";
import NormalOrdersAnalytics from "../../components/seller/NormalOrdersAnalytics";
import SubscriptionAnalytics from "../../components/seller/SubscriptionAnalytics";
import SellerOrders from "../../components/seller/SellerOrders";
import OnlyThaliOrders from "../../components/seller/OnlyThaliOrders";
import SellerProductsPage from "./SellerProductsPage";
import SellerAnalyticsPage from "./SellerAnalyticsPage";
import DailyMealManagement from "./DailyMealManagement";
import SubscriptionManagement from "./SubscriptionManagement";
import SellerMealEdit from "./SellerMealEdit";
import SellerDailyOrders from "./SellerDailyOrders";

const SellerRoutes = () => {
  return (
    <Routes>
      {/* Main Dashboard */}
      <Route path="/dashboard" element={<SellerDashboardHome />} />

      {/* Tiffin Management */}
      <Route path="/tiffin/today/:shift" element={<TodayTiffinList />} />

      {/* Daily Meal Management */}
      <Route path="/daily-meals" element={<DailyMealManagement />} />

      {/* Meal Edit - New Seller Panel */}
      <Route path="/meal-edit" element={<SellerMealEdit />} />
      <Route path="/meal-edit/daily-orders" element={<SellerDailyOrders />} />

      {/* Penalties */}
      <Route path="/penalties" element={<PenaltySection />} />

      {/* Orders */}
      <Route path="/orders" element={<SellerOrders />} />
      {/* <Route path="/orders" element={<OnlyThaliOrders />} /> */}

      {/* Products */}
      <Route path="/products" element={<SellerProductsPage />} />

      {/* Analytics */}
      <Route path="/analytics" element={<SellerAnalyticsPage />} />
      <Route
        path="/analytics/normal-orders"
        element={<NormalOrdersAnalytics />}
      />
      <Route
        path="/analytics/subscriptions"
        element={<SubscriptionAnalytics />}
      />

      {/* Subscription Management */}
      <Route path="/subscriptions/:id" element={<SubscriptionManagement />} />

      {/* Default redirect to dashboard */}
      <Route path="/" element={<SellerDashboardHome />} />
    </Routes>
  );
};

export default SellerRoutes;
