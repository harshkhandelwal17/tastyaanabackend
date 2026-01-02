import React from "react";
import { Routes, Route } from "react-router-dom";

// User Vehicle Pages
import VehicleListingPage from "../pages/user/VehicleListingPage";
import VehicleDetailPage from "../pages/user/VehicleDetailPage";
import VehicleBookingPage from "../pages/user/VehicleBookingPage";
import VehicleBookingHistoryPage from "../pages/user/VehicleBookingHistoryPage";

// Admin Vehicle Pages
import VehicleRentalAdminDashboard from "../pages/admin/VehicleRentalAdminDashboard";
import AdminVehicleManagement from "../pages/admin/AdminVehicleManagement";
import AdminBillingManagement from "../pages/admin/AdminBillingManagement";

// Route configuration for vehicle rental system
const VehicleRentalRoutes = () => {
  return (
    <Routes>
      {/* User Routes - accessible by authenticated users */}
      <Route path="/vehicles" element={<VehicleListingPage />} />
      <Route
        path="/vehicles/my-vehicle-bookings"
        element={<VehicleBookingHistoryPage />}
      />
      <Route
        path="/vehicles/bookings"
        element={<VehicleBookingHistoryPage />}
      />
      <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
      <Route
        path="/vehicles/:vehicleId/book"
        element={<VehicleBookingPage />}
      />
      <Route
        path="/my-vehicle-bookings"
        element={<VehicleBookingHistoryPage />}
      />

      {/* Admin Routes - accessible by admin/super-admin */}
      <Route
        path="/admin/vehicle-rental"
        element={<VehicleRentalAdminDashboard />}
      />
      <Route path="/admin/vehicles" element={<AdminVehicleManagement />} />
      <Route
        path="/admin/vehicle-billing"
        element={<AdminBillingManagement />}
      />
    </Routes>
  );
};

export default VehicleRentalRoutes;
