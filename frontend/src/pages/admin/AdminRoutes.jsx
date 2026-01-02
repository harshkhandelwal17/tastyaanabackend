import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import ChargesManagement from "./ChargesManagementHTML";
import AddCharge from "./AddCharge";
import EditCharge from "./EditCharge";
import AdminMealEdit from "./AdminMealEdit";
import DriverManagement from "./DriverManagement";
import UpdateMealCountPage from "./UpdateMealCountPage";
import UserAnalytics from "./UserAnalytics";
import OrderAnalytics from "./OrderAnalytics";
// import DailyOrders from "./DailyOrders";
import DeliveryDashboard from "./DeliveryDashboard";
import DailyDeliveryManagement from "./DailyDeliveryManagement";
import AdminSettings from "./AdminSettings";
// import ProductManagement from "./ProductManagement";
// import CategoriesManagement from "./CategoriesManagement";
// import InventoryManagement from "./InventoryManagement";
// New Admin Panel Components
import SuperAdminDashboard from "./SuperAdminDashboard";
import UsersManagement from "./UsersManagement";
import SubscriptionsManagement from "./SubscriptionsManagement";
import OrdersManagement from "./OrdersManagement";
// Detail Pages
import UserDetail from "./UserDetail";
import OrderDetail from "./OrderDetail";
import SubscriptionDetail from "./SubscriptionDetail";
// Centers Management
import AdminCenters from "./Centers/AdminCenters";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

      {/* Super Admin Panel Routes */}
      <Route path="/super-dashboard" element={<SuperAdminDashboard />} />
      <Route path="/users-management" element={<UsersManagement />} />
      <Route path="/users/:userId" element={<UserDetail />} />
      <Route
        path="/subscriptions-management"
        element={<SubscriptionsManagement />}
      />
      <Route
        path="/subscriptions/:subscriptionId"
        element={<SubscriptionDetail />}
      />
      <Route path="/orders-management" element={<OrdersManagement />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />

      {/* Centers Management Routes */}
      <Route path="/centers" element={<AdminCenters />} />

      {/* Driver Management Routes */}
      <Route path="/drivers" element={<DriverManagement />} />
      <Route path="/drivers/verification" element={<DriverManagement />} />
      <Route path="/drivers/analytics" element={<DriverManagement />} />
      <Route path="/drivers/scheduling" element={<DriverManagement />} />

      {/* Delivery Management Routes */}
      <Route path="/delivery" element={<DeliveryDashboard />} />
      <Route path="/daily-deliveries" element={<DailyDeliveryManagement />} />
      <Route path="/delivery-scheduling" element={<DeliveryDashboard />} />
      <Route path="/delivery/routes" element={<Dashboard />} />

      {/* Subscription Management Routes */}
      <Route
        path="/subscriptions/update-meals"
        element={<UpdateMealCountPage />}
      />
      <Route
        path="/subscriptions/analytics"
        element={<SubscriptionsManagement />}
      />

      {/* Charges Management Routes */}
      <Route path="/charges" element={<ChargesManagement />} />
      <Route path="/charges/new" element={<AddCharge />} />
      <Route path="/charges/edit/:id" element={<EditCharge />} />

      {/* Meal Management Routes */}
      <Route path="/mealedit" element={<AdminMealEdit />} />
      {/* <Route path="/dailymeal" element={<DailyOrders />} /> */}

      {/* Product and Categories Routes */}
      {/* <Route path="/products" element={<ProductManagement />} /> */}
      {/* <Route path="/categories" element={<CategoriesManagement />} /> */}
      {/* <Route path="/inventory" element={<InventoryManagement />} /> */}

      {/* Seller Management Routes */}
      <Route path="/sellers/verification" element={<Dashboard />} />
      <Route path="/sellers/analytics" element={<Dashboard />} />
      <Route path="/sellers/support" element={<Dashboard />} />

      {/* Financial Management Routes */}
      <Route path="/finance/reports" element={<Dashboard />} />

      {/* Special Services Routes */}
      <Route path="/laundry" element={<Dashboard />} />
      <Route path="/notifications" element={<Dashboard />} />

      {/* Analytics Routes */}
      <Route path="/analytics" element={<Dashboard />} />
      <Route path="/analytics/users" element={<UserAnalytics />} />
      <Route path="/analytics/orders" element={<OrderAnalytics />} />
      <Route path="/analytics/revenue" element={<Dashboard />} />
      <Route path="/analytics/performance" element={<Dashboard />} />

      {/* Settings Routes */}
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="/settings/app" element={<AdminSettings />} />
      <Route path="/settings/notifications" element={<AdminSettings />} />
      <Route path="/settings/maintenance" element={<AdminSettings />} />

      {/* Delivery Routes */}
      <Route path="/delivery/routes" element={<Dashboard />} />

      {/* Order Analytics */}
      <Route path="/orders/analytics" element={<OrderAnalytics />} />

      {/* User Analytics */}
      <Route path="/users/analytics" element={<UserAnalytics />} />

      {/* Add more admin routes here */}
    </Routes>
  );
};

export default AdminRoutes;
