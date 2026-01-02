import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useSelector } from "react-redux";
import { useVehicleRentalAccess } from "./hooks/useUserAccess";
import { ShoppingCart, Smartphone } from "lucide-react";
import { Toaster } from "react-hot-toast";
import UnofficialHisaab from "./pages/seller/UnofficialHisaab";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import RealTimeDriverNotification from "./components/common/RealTimeDriverNotification.jsx";
import AdminMobileSidebar from "./components/admin/AdminMobileSidebar.jsx";

// Performance monitoring
import PerformanceMonitor from "./components/common/PerformanceMonitor";

// Layout Components
import Header from "./layout/buyer/Header";
import Footer from "./layout/buyer/Footer";
import BottomNav from "./layout/BottomNav";
import StickyCartBar from "./components/buyer/StickyCartBar.jsx";
// Public Components
import HomePage from "./pages/buyer/homepages/homepage.jsx";
import AboutPage from "./pages/buyer/homepages/AboutPage.jsx";
import ContactPage from "./pages/buyer/ContactPage";
import ProductPage from "./pages/buyer/Productpage";
import ProductDetailpage from "./pages/buyer/ProductDetailpage";
import SearchResultsPage from "./pages/buyer/SearchResultpage";
import GroceryProductsPage from "./pages/GroceryProductsPage";
// import GroceryProductDetailPage from "./pages/GroceryProductDetailPage";
import TermsConditionsPage from "./pages/buyer/Termspage";
import PrivacyPolicyPage from "./pages/buyer/PrivacyPolicy";
import NotFoundPage from "./pages/NotFound";

// Auth Components
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/LoginPage";
// import SubscriptionDetailPage from "./pages/subscription/SubscriptionDetailPage";

// Buyer Protected Components
import CartPage from "./pages/buyer/shopingCart";
import CheckoutPage from "./pages/buyer/Checkoutpage";
import MyOrdersPage from "./pages/buyer/homepages/Myorderpage.jsx";
import OrderSuccessPage from "./pages/buyer/OrderSucesspage";
import WishlistPage from "./pages/buyer/WishlistPage";
import ProfilePage from "./pages/buyer/homepages/ProfilePage";

// Admin Protected Components
import AdminDashboard from "./pages/admin/adminDashboard";
import AdminRoutes from "./pages/admin/AdminRoutes";
import AboutUsPage from "./components/AboutUs.jsx";
// Seller Protected Components
import SellerDashboard from "./pages/admin/adminDashboard";
import CustomerSupport from "./components/CustomerSupport";
// Protected Route Components
import ProtectedRoute from "./components/auth/protectedRoute";
import RoleBasedRoute from "./components/auth/rolebasedroute";
import DetailThaliPage from "./pages/buyer/tiffin/DetailThaliPage";
import OrderConfirmationPage from "./pages/buyer/ConfirmOrderPage";
import GharKaKhana from "./pages/buyer/tiffin/GharKaBhojanMainPage.jsx";
import MealPlansPage from "./pages/buyer/MealsPlanPage.jsx";
import WeeklyMenuPage from "./pages/buyer/WeeklyMenuPage.jsx";
import SellerPanel from "./pages/seller/Dashboard.jsx";
import LandingPage from "./pages/Dummylanding.jsx";
import GroceryCategoryPage from "./pages/buyer/GroceriesCategoryPage.jsx";
import GroceryHomePage from "./pages/buyer/GroceriesSection.jsx";
import CategoryPage from "./pages/buyer/food/pageji2.jsx";
import SubscriptionSuccessPage from "./pages/buyer/SubscriptionSuccesPage.jsx";
import SubscriptionDetailPage from "./pages/buyer/homepages/SubscriptionDetailPage.jsx";
import MySubscriptionsPage from "./pages/buyer/MySubscriptionsPage.jsx";
import ActiveSubscriptionsPage from "./pages/buyer/homepages/ActiveSubscriptionsPage.jsx";
import CustomizePage from "./pages/buyer/tiffin/CustomizePage.jsx";
import SweetsDetailPage from "./pages/buyer/SweetsDetailPage.jsx";
import DailyMeal from "./pages/buyer/tiffin/DailyMeal.jsx";
import GoogleAuthCallback from "./components/auth/GoogleAuthCallback.jsx";
import AuthChecker from "./components/auth/AuthChecker.jsx";
import EnhancedGroceriesPage from "./pages/buyer/EnhancedGroceriesPage";
import TrackOrder from "./pages/buyer/TrackOrder";
import SellerProductsPagee from "./pages/seller/SellersProductsPage.jsx";
import SellerProductsList from "./pages/seller/SellerProductsList.jsx";
import SellerSubscriptions from "./pages/seller/SellerSubscriptions.jsx";
import SubscriptionAnalytics from "./pages/seller/SubscriptionAnalytics.jsx";
import SubscriptionDetails from "./pages/seller/SubscriptionDetails.jsx";
import SiteClosedPage from "./pages/common/HRB.jsx";
import RestaurantPage from "./pages/buyer/food/RestaurantPage.jsx";
// Driver Components
import DriverRegistration from "./pages/driver/DriverRegistration";
import DriverLogin from "./pages/driver/DriverLogin";
import DriverEmailVerification from "./pages/driver/DriverEmailVerification";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverDeliveryDashboard from "./pages/driver/DriverDeliveryDashboard.jsx";
import DriverOrderAccept from "./pages/driver/DriverOrderAccept";
import DriverRouteManagement from "./components/driver/DriverRouteManagement";
import DriverScheduling from "./pages/driver/DriverScheduling";
import DeliveryTracking from "./pages/DeliveryTracking";
import DeliveryProgressTracking from "./components/delivery/DeliveryProgressTracking";
import DeliveryDashboard from "./pages/admin/DeliveryDashboard";
import SellerProfile from "./components/seller/SellerProfile.jsx";
import DashboardPage from "./components/seller/SellerDashboard.jsx";
import ProductsPage from "./components/seller/SellerProduts.jsx";
import OrdersPage from "./components/seller/SellerOrders.jsx";
import OrderDetailsPage from "./pages/seller/OrderDetailsPage.jsx";
import BottomNavBar from "./components/seller/BottomNavBar.jsx";
import SellerAnalyticsPage from "./pages/seller/SellerAnalyticsPage.jsx";
import ThaliOverview from "./pages/seller/ThaliOverview.jsx";
import ThaliOvervieww from "./components/hisaab/ThaliOverview.jsx";
import DailyMealDelivery from "./pages/seller/DailyMealDelivery";
import DailyThaliManagement from "./pages/seller/DailyThaliManagement.jsx";
import DailyThali from "./pages/seller/DailyThali.jsx";

// New Seller Tiffin System Components
import SellerDashboardHome from "./components/seller/SellerDashboardHome.jsx";
import TodayTiffinList from "./components/seller/TodayTiffinList.jsx";
import PenaltySection from "./components/seller/PenaltySection.jsx";
import NormalOrdersAnalytics from "./components/seller/NormalOrdersAnalytics.jsx";
import SubscriptionAnalyticsNew from "./components/seller/SubscriptionAnalytics.jsx";
import SellerMobileLayout from "./components/seller/SellerMobileLayout.jsx";
import DailyMealManagement from "./pages/seller/DailyMealManagement.jsx";
import Appp from "./pages/buyer/realestate/App.jsx";
// import SiteClosedPage from "./pages/HRB.jsx";
import OnlyThaliOrders from "./components/seller/OnlyThaliOrders.jsx";
import InstallPWA from "./components/InstallPWA.jsx";
import AdminMain from "./components/admin/Mainpage.jsx";
import AdminDashboard1 from "./components/admin/Dashboard.jsx";
import AdminProductManagement from "./components/admin/ProductManagement.jsx";
import AdminVendorManagement from "./components/admin/VendorManagement.jsx";
import AdminPayments from "./components/admin/Payments.jsx";
import AdminOrdersManagement from "./components/admin/OrderManagement.jsx";
import AdminDeliveryManagement from "./pages/AdminDeliveryManagement";
import AdminDeliveryScheduling from "./components/admin/AdminDeliveryScheduling.jsx";
import AdminSupport from "./components/admin/Support.jsx";
import AdminSubscription from "./components/admin/Subscription.jsx";
// import AdminUsersManagement from "./pages/admin/UsersManagement";
import CouponManagementPage from "./pages/admin/CouponManagementPage";
import AdminUsersManagement from "./components/admin/UserManagement.jsx";
import ComingSoon from "./components/buyer/ComingSoon.jsx";

// Laundry Service Components
import LaundryApp from "./pages/buyer/laundry/LaundryApp.jsx";
import AdminDailyMealsPage from "./pages/admin/AdminDailyOrders.jsx";

// Laundry Vendor Components
import LaundryVendorDashboard from "./pages/seller/laundry/LaundryVendorDashboard.jsx";
import PricingManager from "./pages/seller/laundry/PricingManager.jsx";
import QuickServiceSettings from "./pages/seller/laundry/QuickServiceSettings.jsx";
import ScheduledServiceSettings from "./pages/seller/laundry/ScheduledServiceSettings.jsx";
import LaundryOrders from "./pages/seller/laundry/LaundryOrders.jsx";
import LaundryOrderDetail from "./pages/seller/laundry/LaundryOrderDetail.jsx";
import ServicesManager from "./pages/seller/laundry/ServicesManager.jsx";
import SubscriptionPlansManager from "./pages/seller/laundry/SubscriptionPlansManager.jsx";
import CreateVendorProfile from "./pages/seller/laundry/CreateVendorProfile.jsx";
import VendorSubscriptions from "./pages/seller/laundry/VendorSubscriptions.jsx";
import VendorSubscriptionDetail from "./pages/seller/laundry/VendorSubscriptionDetail.jsx";

// Bhandara Components
import BhandaraListPage from "./pages/buyer/BhandaraListPage.jsx";
import BhandaraSubmitPage from "./pages/buyer/BhandaraSubmitPage.jsx";
import MyBhandarasPage from "./pages/buyer/MyBhandarasPage.jsx";
import BhandaraManagement from "./components/admin/BhandaraManagement.jsx";
import MedicineDashboard from "./pages/MedicineDashboard.jsx";
import Medicine from "./pages/Medicine.jsx";
import DiwaliPage from "./components/buyer/Festival/Diwali.jsx";
import { GadgetList, GadgetDetail } from "./pages/products";
import GadgetManagement from "./pages/seller/GadgetManagement";
import SellerRoutes from "./pages/seller/SellerRoutes.jsx";

// Vehicle Rental Components
import VehicleListingPage from "./pages/user/VehicleListingPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import VehicleDetailPage from "./pages/VehicleDetailPage.jsx";
import ShopDetailPage from "./pages/ShopDetailPage.jsx";
import VehicleBookingPage from "./pages/user/VehicleBookingPage.jsx";
import VehicleBookingHistoryPage from "./pages/user/VehicleBookingHistoryPage.jsx";
import VehicleBookingDetailPage from "./pages/user/VehicleBookingDetailPage.jsx";

// Debug Components
import DebugVehicleAccess from "./components/DebugVehicleAccess.jsx";
import BookingInfoPage from "./pages/BookingInfoPage.jsx";

// Vehicle Admin Components
import VehicleRentalAdminDashboard from "./pages/admin/VehicleRentalAdminDashboard.jsx";
import AdminVehicleManagement from "./pages/admin/AdminVehicleManagement.jsx";
import AdminBillingManagement from "./pages/admin/AdminBillingManagement.jsx";
import VehicleAdminDashboard from "./pages/admin/VehicleAdmin/VehicleAdminDashboard.jsx";
import AdminAvailableVehicles from "./pages/admin/VehicleAdmin/AdminAvailableVehicles.jsx";
import AdminBookedVehicles from "./pages/admin/VehicleAdmin/AdminBookedVehicles.jsx";
import AdminVehicleForm from "./pages/admin/VehicleAdmin/AdminVehicleForm.jsx";
import AdminDailyHisab from "./pages/admin/VehicleAdmin/AdminDailyHisab.jsx";
import AdminVehicleMaintenance from "./pages/admin/VehicleAdmin/AdminVehicleMaintenance.jsx";
import AdminCenters from "./pages/admin/VehicleAdmin/AdminCenters.jsx";
import AdminDiscountCoupons from "./pages/admin/VehicleAdmin/AdminDiscountCoupons.jsx";
import AdminRevenue from "./pages/admin/VehicleAdmin/AdminRevenue.jsx";
import AdminDailyHisabView from "./pages/admin/VehicleAdmin/AdminDailyHisabView.jsx";
import VehicleRentalTestPage from "./pages/VehicleRentalTestPage.jsx";

// Vehicle Seller Components
import SellerVehicleRoutes from "./routes/SellerVehicleRoutes.jsx";
import SellerVehicleDashboard from "./pages/seller/SellerVehicleDashboard.jsx";
import SellerVehicleManagement from "./pages/seller/SellerVehicleManagement.jsx";
import SellerBookingManagement from "./pages/seller/SellerBookingManagement.jsx";
import SellerBookingDetailPage from "./pages/seller/SellerBookingDetailPage.jsx";
import SellerAvailableVehicles from "./pages/seller/SellerAvailableVehicles.jsx";
import SellerBookedVehicles from "./pages/seller/SellerBookedVehicles.jsx";
import SellerBillingHistory from "./pages/seller/SellerBillingHistory.jsx";
import SellerCenters from "./pages/seller/SellerCenters.jsx";
import SellerDiscountCoupons from "./pages/seller/SellerDiscountCoupons.jsx";
import SellerRevenue from "./pages/seller/SellerRevenue.jsx";
import SellerDailyHisaab from "./pages/seller/SellerDailyHisaab.jsx";
import SellerDailyHisaabView from "./pages/seller/SellerDailyHisaabView.jsx";
import SellerMaintenance from "./pages/seller/SellerMaintenance.jsx";
import SellerVehicleHandoverPage from "./pages/seller/SellerVehicleHandoverPage.jsx";
import VendorDetailPage from "./pages/buyer/tiffin/VendorDetailPage.jsx";

// Debug Components (remove in production)
import SellerTypeDebugger from "./components/debug/SellerTypeDebugger.jsx";
// Layouts
function PublicLayout() {
  return (
    <>
      {/* <Header /> */}
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      {/* <Footer /> */}
      {/* Sticky Cart Bar above bottom nav on mobile */}
      <StickyCartBar />
      <BottomNav />
    </>
  );
}

function BuyerLayout() {
  return (
    <>
      {/* <Header /> */}
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      {/* <Footer /> */}
      {/* Sticky Cart Bar above bottom nav on mobile */}
      <StickyCartBar />
      <BottomNav />
    </>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <AdminMobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <div className="w-8"></div>
        </div>

        {/* Desktop Header */}
        {/* <div className="hidden lg:block">
          <Header />
        </div> */}

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SellerLayout() {
  return (
    <div className="flex">
      <div className="flex-1">
        {/* <Header /> */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useSelector((state) => state.auth);
  const { isVehicleRentalSeller, loading } = useVehicleRentalAccess();

  console.log("📍 DashboardRedirect:", {
    user: user?.role,
    isVehicleRentalSeller,
    loading,
  });

  if (!user) return <Navigate to="/unauthorized" replace />;

  // Show loading while checking access
  if (loading) {
    console.log("⏳ DashboardRedirect: Waiting for access check...");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  switch (user.role) {
    case "admin":
    case "super-admin":
      console.log("➡️ DashboardRedirect: Redirecting to /admin");
      return <Navigate to="/admin" replace />;
    case "seller":
      // Use secure hook result
      if (isVehicleRentalSeller) {
        console.log(
          "➡️ DashboardRedirect: Redirecting vehicle rental seller to /seller/vehicles"
        );
        return <Navigate to="/seller/vehicles" replace />;
      }
      console.log(
        "➡️ DashboardRedirect: Redirecting regular seller to /seller"
      );
      return <Navigate to="/seller" replace />;
    case "buyer":
    default:
      console.log("➡️ DashboardRedirect: Redirecting to /");
      return <Navigate to="/" replace />;
  }
}

// Component to handle seller routing based on seller type
function SellerRouteHandler() {
  const { isVehicleRentalSeller, loading } = useVehicleRentalAccess();

  // Show loading while checking access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (isVehicleRentalSeller) {
    return <Navigate to="/seller/vehicles" replace />;
  }

  return <SellerProfile />;
}

// Component to protect vehicle rental routes
function VehicleRentalProtectedRoute({ children }) {
  const { isVehicleRentalSeller, loading } = useVehicleRentalAccess();

  // Show loading while checking access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // If not a vehicle rental seller, redirect to regular seller dashboard
  if (!isVehicleRentalSeller) {
    return <Navigate to="/seller" replace />;
  }

  // Allow access to vehicle rental routes
  return children;
}

// Component to protect regular seller routes (non-vehicle rental)
function RegularSellerProtectedRoute({ children }) {
  const { isVehicleRentalSeller, loading } = useVehicleRentalAccess();

  // Show loading while checking access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (isVehicleRentalSeller) {
    return <Navigate to="/seller/vehicles" replace />;
  }

  return children;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Optionally log error to an error reporting service
    // console.error("Runtime error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={this.handleReload}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left text-xs text-gray-500 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [monitorVisible, setMonitorVisible] = useState(false);
  const user = useSelector((state) => state.auth);
  // Performance monitoring setup
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      // Enable performance monitoring in development
      window.performanceMonitor = {
        enable: () => setMonitorVisible(true),
        disable: () => setMonitorVisible(false),
        toggle: () => setMonitorVisible((prev) => !prev),
      };

      // Enable with keyboard shortcut (Ctrl+Shift+P)
      const handleKeyPress = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === "P") {
          e.preventDefault();
          setMonitorVisible((prev) => !prev);
        }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, []);

  return (
    <AuthChecker>
      <ErrorBoundary>
        <ScrollToTop></ScrollToTop>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            {/* <Route path="sellerprofile" element={<SellerProfile />} />
            <Route path="harshproducts" element={<ProductsPage />} */}
            <Route path="property" element={<Appp></Appp>} />

            <Route path="install" element={<InstallPWA></InstallPWA>} />
            <Route
              path="navratri"
              element={<SiteClosedPage></SiteClosedPage>}
            />
            <Route path="medical" element={<MedicineDashboard />} />
            <Route path="medicine" element={<Medicine />} />
            {/* <Route index element={<DiwaliPage />} /> */}

            <Route index element={<HomePage />} />
            <Route path="category1/comingsoon" element={<ComingSoon />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="products/:productId" element={<ProductDetailpage />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="terms" element={<TermsConditionsPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="detail/thali" element={<DetailThaliPage />} />
            <Route path="ghar/ka/khana" element={<GharKaKhana />} />
            <Route path="thali-detail/:id" element={<DetailThaliPage />} />
            <Route path="meal-plans" element={<MealPlansPage />} />
            <Route path="weekly-menu" element={<WeeklyMenuPage />} />
            <Route path="groceries" element={<GroceryHomePage />} />
            <Route path="grocery" element={<GroceryProductsPage />} />
            <Route path="dum" element={<SiteClosedPage></SiteClosedPage>} />
            <Route path="sweets/:id" element={<SweetsDetailPage />} />
            <Route path=".dumm" element={<LandingPage />} />
            <Route path="/category1/:categoryId" element={<CategoryPage />} />
            <Route path="support" element={<CustomerSupport />} />
            <Route path="debug-vehicle" element={<DebugVehicleAccess />} />
            <Route path="about-us" element={<AboutUsPage />} />
            <Route
              path="grocery/category/:categoryId"
              element={<EnhancedGroceriesPage />}
            />
            <Route path="/Gadget" element={<GadgetList />} />
            <Route path="/Gadget/:id" element={<GadgetDetail />} />
            <Route
              path="/foodzone/restaurant/:restaurantId"
              element={<RestaurantPage />}
            />

            {/* 
            <Route path="laundry" element={<LaundryHome />} />
            <Route path="laundry/track" element={<LaundryTracking />} />
            <Route path="laundry/test" element={<LaundryTest />} />
            <Route path="laundry/plans" element={<LaundryPlans />} />  */}

            {/* Public Vehicle Rental Routes */}
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route
              path="vehicles/bookings"
              element={<Navigate to="/my-vehicle-bookings" replace />}
            />
            <Route
              path="vehicles/my-vehicle-bookings"
              element={<Navigate to="/my-vehicle-bookings" replace />}
            />
            <Route path="vehicles/:vehicleId" element={<VehicleDetailPage />} />
            <Route path="vehicle/:vehicleId" element={<VehicleDetailPage />} />
            <Route path="shop/:shopId" element={<ShopDetailPage />} />
            <Route path="checkout/info" element={<BookingInfoPage />} />
            <Route path="vehicles/bikes" element={<VehiclesPage />} />
            <Route path="vehicles/cars" element={<VehiclesPage />} />
            <Route path="vehicles/scooters" element={<VehiclesPage />} />

            {/* Vehicle Rental Test Page */}
            <Route
              path="vehicle-rental-test"
              element={<VehicleRentalTestPage />}
            />

            {/* Debug Route - Remove in production */}
            <Route path="debug/seller-type" element={<SellerTypeDebugger />} />

            <Route
              path="login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            {/* Google Auth Callback routes - kept for backward compatibility */}
            <Route
              path="/auth/google/callback"
              element={<GoogleAuthCallback />}
            />
            <Route path="/auth/callback" element={<GoogleAuthCallback />} />
            <Route path="/api/auth/success" element={<GoogleAuthCallback />} />
            <Route
              path="register"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegisterPage />
                )
              }
            />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Buyer */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="buyer">
                <BuyerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<MyOrdersPage />} />
            <Route path="my-subscriptions" element={<MySubscriptionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="bhandara" element={<BhandaraListPage />} />
            <Route path="bhandara/submit" element={<BhandaraSubmitPage />} />
            <Route
              path="bhandara/my-bhandaras"
              element={
                <ProtectedRoute>
                  <MyBhandarasPage />
                </ProtectedRoute>
              }
            />
            <Route path="/vendor/:vendorId" element={<VendorDetailPage />} />

            <Route
              path="customize/:subscriptionId"
              element={<CustomizePage />}
            />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />
            <Route path="order-confirm" element={<OrderConfirmationPage />} />

            <Route
              path="order/confirm/:id"
              element={<OrderConfirmationPage />}
            />
            <Route path="track-order/:orderId" element={<TrackOrder />} />
            <Route path="menu" element={<DailyMeal />} />
            <Route
              path="active-subscriptions"
              element={<ActiveSubscriptionsPage />}
            />

            <Route
              path="subscription/success"
              element={<SubscriptionSuccessPage />}
            />
            {/* <Route
              path="subscription/:subscriptionId"
              element={<SubscriptionSuccessPage />}
            /> */}
            <Route
              path="/subscription/:id"
              element={<SubscriptionDetailPage />}
            />

            {/* <Route path="laundry/book" element={<LaundryBooking />} />
            <Route
              path="laundry/order-success"
              element={<LaundryOrderSuccess />}
            />
            <Route path="laundry/subscribe" element={<ComingSoon />} /> */}

            {/* Protected Vehicle Rental Routes */}
            <Route
              path="vehicles/:vehicleId/book"
              element={<VehicleBookingPage />}
            />
            <Route
              path="my-vehicle-bookings"
              element={<VehicleBookingHistoryPage />}
            />
            <Route
              path="vehicles/bookings/:bookingId"
              element={<VehicleBookingDetailPage />}
            />
          </Route>
          {/* Protected Admin */}
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={["admin", "super-admin"]}>
                <AdminLayout />
              </RoleBasedRoute>
            }
          >
            <Route path="bhandaras" element={<BhandaraManagement />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route index element={<AdminMain />} />
            <Route path="dailymeal" element={<AdminDailyMealsPage />} />
            <Route path="products" element={<AdminProductManagement />} />
            <Route path="seller" element={<AdminVendorManagement />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrdersManagement />} />
            <Route path="delivery" element={<AdminDeliveryManagement />} />
            <Route
              path="delivery-scheduling"
              element={<AdminDeliveryScheduling />}
            />
            <Route path="support" element={<AdminSupport />} />
            <Route path="subscription" element={<AdminSubscription />} />
            <Route path="coupons" element={<CouponManagementPage />} />
            <Route path="users" element={<AdminUsersManagement />} />

            {/* Vehicle Rental Admin Routes */}
            <Route
              path="vehicle-dashboard"
              element={<VehicleAdminDashboard />}
            />
            <Route path="vehicles" element={<AdminAvailableVehicles />} />
            <Route path="vehicles/add" element={<AdminVehicleForm />} />
            <Route
              path="vehicles/edit/:vehicleId"
              element={<AdminVehicleForm />}
            />
            <Route path="vehicles/:vehicleId" element={<AdminVehicleForm />} />
            <Route path="vehicle-bookings" element={<AdminBookedVehicles />} />
            <Route
              path="vehicle-billing"
              element={<AdminBillingManagement />}
            />
            <Route
              path="vehicle-maintenance"
              element={<AdminVehicleMaintenance />}
            />
            <Route path="centers" element={<AdminCenters />} />
            <Route path="discount-coupons" element={<AdminDiscountCoupons />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="daily-hisab" element={<AdminDailyHisab />} />
            <Route path="daily-hisab-view" element={<AdminDailyHisabView />} />
            <Route
              path="vehicle-rental"
              element={<VehicleRentalAdminDashboard />}
            />

            {/* Include all admin routes from AdminRoutes */}
            <Route path="*" element={<AdminRoutes />} />
          </Route>

          {/* Protected Seller */}
          <Route
            path="/seller"
            element={
              <RoleBasedRoute allowedRoles={["seller", "admin"]}>
                {/* <SellerMobileLayout> */}
                <SellerLayout />
                {/* </SellerMobileLayout> */}
              </RoleBasedRoute>
            }
          >
            {/* Main Dashboard - New Robust System */}
            <Route
              path="dashboard"
              element={
                <RegularSellerProtectedRoute>
                  <SellerDashboardHome />
                </RegularSellerProtectedRoute>
              }
            />

            {/* Tiffin Management System */}
            <Route
              path="tiffin/today/:shift"
              element={
                <RegularSellerProtectedRoute>
                  <TodayTiffinList />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="daily-meals"
              element={
                <RegularSellerProtectedRoute>
                  <DailyMealManagement />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="penalties"
              element={
                <RegularSellerProtectedRoute>
                  <PenaltySection />
                </RegularSellerProtectedRoute>
              }
            />

            {/* Analytics - New System */}
            <Route
              path="analytics/normal-orders"
              element={
                <RegularSellerProtectedRoute>
                  <NormalOrdersAnalytics />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="analytics/subscriptions"
              element={
                <RegularSellerProtectedRoute>
                  <SubscriptionAnalyticsNew />
                </RegularSellerProtectedRoute>
              }
            />

            {/* Existing Routes */}
            <Route index element={<SellerRouteHandler />} />
            <Route
              path="thali-overview"
              element={
                <RegularSellerProtectedRoute>
                  <ThaliOverview />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="dailythali"
              element={
                <RegularSellerProtectedRoute>
                  <DailyThaliManagement />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="dailyhtali"
              element={
                <RegularSellerProtectedRoute>
                  <DailyThali />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <RegularSellerProtectedRoute>
                  <OrdersPage />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <RegularSellerProtectedRoute>
                  <OrderDetailsPage />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="panel"
              element={
                <RegularSellerProtectedRoute>
                  <SellerPanel />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <RegularSellerProtectedRoute>
                  <ProductsPage />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="old-panel"
              element={
                <RegularSellerProtectedRoute>
                  <DashboardPage />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <RegularSellerProtectedRoute>
                  <SellerAnalyticsPage />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="editprice"
              element={
                <RegularSellerProtectedRoute>
                  <SellerProductsPagee />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="editbulkprice"
              element={
                <RegularSellerProtectedRoute>
                  <SellerProductsList />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="subscriptions"
              element={
                <RegularSellerProtectedRoute>
                  <SellerSubscriptions />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="subscriptions/:subscriptionId"
              element={
                <RegularSellerProtectedRoute>
                  <SubscriptionDetails />
                </RegularSellerProtectedRoute>
              }
            />
            <Route path="navbar" element={<BottomNavBar></BottomNavBar>} />
            <Route
              path="unofficialhisaab"
              element={
                <RegularSellerProtectedRoute>
                  <UnofficialHisaab />
                </RegularSellerProtectedRoute>
              }
            />
            <Route
              path="daily-meal-delivery"
              element={
                <RegularSellerProtectedRoute>
                  <DailyMealDelivery />
                </RegularSellerProtectedRoute>
              }
            />

            {/* Vehicle Rental Seller Routes - Clean and Simple */}
            <Route
              path="vehicles/*"
              element={
                <VehicleRentalProtectedRoute>
                  <SellerVehicleRoutes />
                </VehicleRentalProtectedRoute>
              }
            />

            {/* Fallback route removed - it was catching /seller/vehicles before it could match */}
          </Route>

          {/* Driver Routes */}
          <Route path="/driver/register" element={<DriverRegistration />} />
          {/* <Route path="/driver/login" element={<DriverLogin />} /> */}
          <Route
            path="/driver/verify-email"
            element={<DriverEmailVerification />}
          />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route
            path="/driver/deliveries"
            element={<DriverDeliveryDashboard />}
          />
          <Route path="/driver/scheduling" element={<DriverScheduling />} />
          <Route path="/driver/orders/accept" element={<DriverOrderAccept />} />
          <Route
            path="/driver/route/:date/:shift"
            element={<DriverRouteManagement />}
          />

          {/* Delivery Tracking Routes */}
          <Route path="/track/:orderId" element={<DeliveryTracking />} />
          <Route
            path="/delivery-progress/:subscriptionId/:date/:shift"
            element={<DeliveryProgressTracking />}
          />

          {/* Admin Delivery Dashboard */}
          <Route
            path="/admin/delivery"
            element={
              <RoleBasedRoute allowedRoles={["admin", "super-admin"]}>
                <AdminLayout />
              </RoleBasedRoute>
            }
          >
            <Route index element={<DeliveryDashboard />} />
          </Route>

          {/* Universal Dashboard Redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Real-time Driver Assignment Notification */}
        {user?.user && <RealTimeDriverNotification />}

        <Toaster
          position="top-center"
          reverseOrder={true}
          toastOptions={{
            duration: 2000,
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
              padding: "12px 20px",
              fontSize: "14px",
              maxWidth: "90%",
              margin: "10px auto",
            },
          }}
        />
        {/* Performance Monitor (Development Only) */}
        <PerformanceMonitor
          isVisible={monitorVisible && import.meta.env.MODE === "development"}
          onToggle={() => setMonitorVisible(false)}
        />
      </ErrorBoundary>
    </AuthChecker>
  );
}

export default App;
