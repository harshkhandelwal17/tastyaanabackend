import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SellerLayout from "../layout/SellerLayout";
import SellerVehicleDashboard from "../pages/seller/SellerVehicleDashboard";
import SellerAvailableVehicles from "../pages/seller/SellerAvailableVehicles";
import SellerBookedVehicles from "../pages/seller/SellerBookedVehicles";
import SellerVehicleManagement from "../pages/seller/SellerVehicleManagement";
import SellerBookingManagement from "../pages/seller/SellerBookingManagement";
import SellerBookingDetailPage from "../pages/seller/SellerBookingDetailPage";
import SellerVehicleHandoverPage from "../pages/seller/SellerVehicleHandoverPage";
import SellerBillingHistory from "../pages/seller/SellerBillingHistory";
import SellerCenters from "../pages/seller/SellerCenters";
import SellerDiscountCoupons from "../pages/seller/SellerDiscountCoupons";
import SellerRevenue from "../pages/seller/SellerRevenue";
import SellerDailyHisaab from "../pages/seller/SellerDailyHisaab";
import SellerDailyHisaabView from "../pages/seller/SellerDailyHisaabView";
import SellerMaintenance from "../pages/seller/SellerMaintenance";
import SellerOfflineBooking from "../pages/seller/SellerOfflineBooking";

const SellerVehicleRoutes = () => {
  console.log("Rendering SellerVehicleRoutes");
  return (
    <Routes>
      <Route path="/" element={<SellerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SellerVehicleDashboard />} />
        <Route
          path="available-vehicles"
          element={<SellerAvailableVehicles />}
        />
        <Route path="booked-vehicles" element={<SellerBookedVehicles />} />
        <Route path="manage" element={<SellerVehicleManagement />} />
        <Route path="bookings" element={<SellerBookingManagement />} />
        <Route
          path="bookings/:bookingId"
          element={<SellerBookingDetailPage />}
        />
        <Route
          path="bookings/:bookingId/handover"
          element={<SellerVehicleHandoverPage />}
        />
        <Route path="billing" element={<SellerBillingHistory />} />
        <Route path="centers" element={<SellerCenters />} />
        <Route path="coupons" element={<SellerDiscountCoupons />} />
        <Route path="revenue" element={<SellerRevenue />} />
        <Route path="daily-hisaab" element={<SellerDailyHisaab />} />
        <Route path="daily-hisaab-view" element={<SellerDailyHisaabView />} />
        <Route path="maintenance" element={<SellerMaintenance />} />
        <Route path="offline-booking" element={<SellerOfflineBooking />} />
        <Route
          path="analytics"
          element={
            <div className="p-8">
              <h1 className="text-2xl font-bold">Analytics Coming Soon</h1>
            </div>
          }
        />
        <Route
          path="settings"
          element={
            <div className="p-8">
              <h1 className="text-2xl font-bold">Settings Coming Soon</h1>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default SellerVehicleRoutes;
