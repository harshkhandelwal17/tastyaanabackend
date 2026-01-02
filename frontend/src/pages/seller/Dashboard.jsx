import {
  Bell,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  ArrowUp,
  ArrowDown,
  Activity,
  Calendar,
  MapPin,
  RefreshCw,
  Loader2,
  Save,
  ImagePlus,
  FileText,
  ChefHat,
  Utensils,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  Sun,
  Moon,
  AlertCircle,
  Car,
} from "lucide-react";
import { useState, useEffect } from "react";
import StoreStatusToggle from "../../components/seller/StoreToggleButton";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useOrderSocket from "../../hooks/useOrderSocket";
import RealTimeOrderNotification from "../../components/common/RealTimeOrderNotification";
import VehicleRentalDashboard from "../../components/vehicleRental/VehicleRentalDashboard";

const SellerAdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    type: "all",
    customized: "all",
    search: "",
  });

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [showDailyMealModal, setShowDailyMealModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingMealPlan, setEditingMealPlan] = useState(null);
  const [editingDailyMeal, setEditingDailyMeal] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Daily Meal State
  const [todayMeal, setTodayMeal] = useState(null);
  const [tomorrowMeal, setTomorrowMeal] = useState(null);
  const [canAddMeal, setCanAddMeal] = useState(true);
  const [timeRestrictionMessage, setTimeRestrictionMessage] = useState("");
  const [mealType, setMealType] = useState("today"); // 'today' or 'tomorrow'
  const navigate = useNavigate();
  // API Configuration
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`; // Update with your actual API base URL

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem("token") || "";
  });

  // Get user from Redux
  const user = useSelector((state) => state.auth.user);

  // Use real-time order socket for seller
  const {
    isConnected: orderSocketConnected,
    orderUpdates,
    newOrders,
    driverAssignments,
    clearOrderUpdates,
    clearNewOrders,
    clearDriverAssignments,
  } = useOrderSocket(user?._id, "seller");

  // API Service
  // Update the API service URLs to match the backend routes
  const apiService = {
    request: async (endpoint, options = {}) => {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...options.headers,
        },
        credentials: "include",
        ...options,
      };

      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },

    // Dashboard APIs
    getDashboard: () => apiService.request("/seller/dashboard"),

    // Product APIs - Updated paths
    getProducts: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.request(`/seller/products?${queryString}`);
    },
    // Update the createProduct method in apiService
    createProduct: async (formData) => {
      return fetch(`${API_BASE_URL}/seller/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Don't set Content-Type for FormData
        },
        body: formData, // FormData object, not JSON
      }).then((response) => response.json());
    },

    updateProduct: async (id, formData) => {
      return fetch(`${API_BASE_URL}/seller/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Don't set Content-Type for FormData
        },
        body: formData, // FormData object, not JSON
      }).then((response) => response.json());
    },
    deleteProduct: (id) =>
      apiService.request(`/seller/products/${id}`, {
        method: "DELETE",
      }),

    // Order APIs - Updated paths
    getOrders: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.request(`/seller/orders?${queryString}`);
    },
    updateOrderStatus: (orderId, statusData) =>
      apiService.request(`/seller/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify(statusData),
      }),

    // Meal Plan APIs - Updated paths
    getMealPlans: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.request(`/seller/meal-plans?${queryString}`);
    },
    createMealPlan: (mealPlanData) =>
      apiService.request("/seller/meal-plans", {
        method: "POST",
        body: JSON.stringify(mealPlanData),
      }),
    updateMealPlan: (id, mealPlanData) =>
      apiService.request(`/seller/meal-plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(mealPlanData),
      }),
    deleteMealPlan: (id) =>
      apiService.request(`/seller/meal-plans/${id}`, {
        method: "DELETE",
      }),

    // Daily Meal APIs
    getTodayMeal: () => apiService.request("/dailymeals/today"),
    getTomorrowMeal: () => apiService.request("/dailymeals/tomorrow"),
    addTodayMeal: (mealData) =>
      apiService.request("/dailymeals/today", {
        method: "POST",
        body: JSON.stringify(mealData),
      }),
    addTomorrowMeal: (mealData) =>
      apiService.request("/dailymeals/tomorrow", {
        method: "POST",
        body: JSON.stringify(mealData),
      }),
    updateDailyMeal: (id, mealData) =>
      apiService.request(`/dailymeals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(mealData),
      }),

    // Notifications - Updated paths
    getNotifications: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.request(`/seller/notifications?${queryString}`);
    },
    markNotificationRead: (id) =>
      apiService.request(`/seller/notifications/${id}/read`, {
        method: "PUT",
      }),

    // Analytics API
    getAnalytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiService.request(`/seller/analytics?${queryString}`);
    },
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    checkTodayMeal();
    checkTomorrowMeal();
  }, []);

  // Check time restrictions for adding meals
  useEffect(() => {
    checkTimeRestrictions();
  }, []);

  const checkTimeRestrictions = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toDateString();
    const today = new Date().toDateString();

    if (currentDate === today && currentHour >= 7) {
      setCanAddMeal(false);
      setTimeRestrictionMessage(
        "Meal addition is only allowed before 7:00 AM for today"
      );
    } else {
      setCanAddMeal(true);
      setTimeRestrictionMessage("");
    }
  };

  const checkTodayMeal = async () => {
    try {
      const response = await apiService.getTodayMeal();
      if (response.success) {
        setTodayMeal(response.data);
      } else {
        setTodayMeal(null);
      }
    } catch (error) {
      console.error("Error checking today's meal:", error);
      setTodayMeal(null);
    }
  };

  const checkTomorrowMeal = async () => {
    try {
      const response = await apiService.getTomorrowMeal();
      if (response.success) {
        setTomorrowMeal(response.data);
      } else {
        setTomorrowMeal(null);
      }
    } catch (error) {
      console.error("Error checking tomorrow's meal:", error);
      setTomorrowMeal(null);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "orders":
        loadOrders();
        break;
      case "products":
        loadProducts();
        break;
      case "meal-plans":
        loadMealPlans();
        break;
      default:
        break;
    }
  }, [activeTab, currentPage, orderFilters, selectedDateRange]);

  // Handle real-time order updates
  useEffect(() => {
    if (orderUpdates.length > 0) {
      const latestUpdate = orderUpdates[orderUpdates.length - 1];
      console.log("🔄 Real-time order update received:", latestUpdate);

      // Update orders list if we're on orders tab
      if (activeTab === "orders") {
        loadOrders();
      }

      // Update dashboard data
      loadDashboardData();

      // Show notification
      const notification = {
        id: `order-update-${Date.now()}`,
        title: "Order Status Updated",
        message: `Order ${latestUpdate.orderNumber} status: ${latestUpdate.status}`,
        type: "order-update",
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
    }
  }, [orderUpdates, activeTab]);

  // Handle new order notifications
  useEffect(() => {
    if (newOrders.length > 0) {
      const latestOrder = newOrders[newOrders.length - 1];
      console.log("🆕 New order received:", latestOrder);

      // Update orders list if we're on orders tab
      if (activeTab === "orders") {
        loadOrders();
      }

      // Update dashboard data
      loadDashboardData();

      // Show notification
      const notification = {
        id: `new-order-${Date.now()}`,
        title: "New Order Received!",
        message: `New order ${latestOrder.orderNumber} received`,
        type: "new-order",
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);

      // Auto-refresh orders if on orders tab
      if (activeTab === "orders") {
        setTimeout(() => {
          loadOrders();
        }, 1000);
      }
    }
  }, [newOrders, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications({
        limit: 5,
        isRead: false,
      });
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: 20,
        date: selectedDateRange,
      };

      if (orderFilters.status !== "all") params.status = orderFilters.status;
      if (orderFilters.type !== "all") params.type = orderFilters.type;
      if (orderFilters.customized !== "all") {
        params.customized = orderFilters.customized === "true";
      }
      if (orderFilters.search) params.search = orderFilters.search;

      const response = await apiService.getOrders(params);
      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) alert("An error occured ");
    try {
      const response = await apiService.request(`/seller/product/${id}`, {
        method: "DELETE",
      });
      if (response.success) {
        console.log("item deleted succesfully");
      }
    } catch (error) {
      console.log("An error occured", error.message);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({ page: 1, limit: 100 }); // Increased limit to show more products
      if (response.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMealPlans = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMealPlans({ page: 1, limit: 20 });
      if (response.success) {
        setMealPlans(response.data.mealPlans);
      }
    } catch (error) {
      console.error("Error loading meal plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await apiService.updateOrderStatus(orderId, {
        status: newStatus,
      });
      if (response.success) {
        loadOrders();
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleProductSave = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        await apiService.updateProduct(editingProduct._id, productData);
      } else {
        // Create new product
        await apiService.createProduct(productData);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error.message);
    }
  };

  const handleMealPlanSave = async (mealPlanData) => {
    try {
      if (editingMealPlan) {
        // Update existing meal plan
        await apiService.updateMealPlan(editingMealPlan._id, mealPlanData);
      } else {
        // Create new meal plan
        await apiService.createMealPlan(mealPlanData);
      }
      setShowMealPlanModal(false);
      setEditingMealPlan(null);
      loadMealPlans();
    } catch (error) {
      console.error("Error saving meal plan:", error);
    }
  };

  const handleDailyMealSave = async (mealData) => {
    try {
      if (editingDailyMeal) {
        // Update existing meal
        const response = await apiService.updateDailyMeal(
          editingDailyMeal._id,
          mealData
        );
        if (response.success) {
          alert("Daily meal updated successfully!");
          setShowDailyMealModal(false);
          setEditingDailyMeal(null);
          if (mealType === "today") {
            checkTodayMeal();
          } else {
            checkTomorrowMeal();
          }
        } else {
          alert("Failed to update daily meal: " + response.message);
        }
      } else {
        // Add new meal
        const addFunction =
          mealType === "today"
            ? apiService.addTodayMeal
            : apiService.addTomorrowMeal;
        const response = await addFunction(mealData);
        if (response.success) {
          alert(
            `${
              mealType === "today" ? "Today's" : "Tomorrow's"
            } meal added successfully!`
          );
          setShowDailyMealModal(false);
          if (mealType === "today") {
            checkTodayMeal();
          } else {
            checkTomorrowMeal();
          }
        } else {
          alert("Failed to add daily meal: " + response.message);
        }
      }
    } catch (error) {
      console.error("Error saving daily meal:", error);
      alert("Error saving daily meal. Please try again.");
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await apiService.markNotificationRead(notificationId);
      if (response.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const [analyticsData, setAnalyticsData] = useState({});

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAnalytics({
        period: selectedDateRange,
      });
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update the useEffect to include analytics
  useEffect(() => {
    switch (activeTab) {
      case "orders":
        loadOrders();
        break;
      case "products":
        loadProducts();
        break;
      case "meal-plans":
        loadMealPlans();
        break;
      case "analytics":
        loadAnalytics();
        break;
      default:
        break;
    }
  }, [activeTab, currentPage, orderFilters, selectedDateRange]);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    change,
    color = "blue",
    loading = false,
  }) => {
    const colorClasses = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        border: "border-blue-500",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        border: "border-green-500",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        border: "border-purple-500",
      },
      orange: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        border: "border-orange-500",
      },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div
        className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${colors.border} hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
                {change && (
                  <div className="flex items-center mt-1">
                    {change > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {Math.abs(change)}%
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={`p-2 rounded-full ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const NotificationBell = () => (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markNotificationAsRead(notification._id)}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        notification.type === "order"
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {notification.type === "order" ? (
                        <ShoppingCart className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          title="Today's Orders"
          value={dashboardData.today?.orders || 0}
          subtitle={`${dashboardData.today?.customizedOrders || 0} customized`}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={DollarSign}
          title="Today's Revenue"
          value={`₹${
            dashboardData.today?.netRevenue || dashboardData.today?.revenue || 0
          }`}
          subtitle={
            dashboardData.today?.commission
              ? `Gross: ₹${dashboardData.today?.revenue || 0} | Commission: -₹${
                  dashboardData.today?.commission || 0
                }`
              : ""
          }
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Package}
          title="Total Products"
          value={dashboardData.products?.total || 0}
          subtitle={`${dashboardData.products?.active || 0} active`}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={ChefHat}
          title="Meal Plans"
          value={dashboardData.mealPlans?.total || 0}
          subtitle={`${dashboardData.mealPlans?.active || 0} active`}
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={Users}
          title="College Orders"
          value={
            orders.filter((order) =>
              order.items.some((item) => item.isCollegeBranded)
            ).length
          }
          subtitle="College-branded items today"
          color="blue"
          loading={loading}
        />
      </div> */}

      {/* Today's Orders Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Orders Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Customized Orders
              </span>
              <span className="text-lg font-bold text-green-600">
                {dashboardData.today?.customizedOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Regular Orders
              </span>
              <span className="text-lg font-bold text-blue-600">
                {dashboardData.today?.nonCustomizedOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                College Orders
              </span>
              <span className="text-lg font-bold text-purple-600">
                {
                  orders.filter((order) =>
                    order.items.some((item) => item.isCollegeBranded)
                  ).length
                }
              </span>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {/* View Today's Orders */}
            <button
              onClick={() => setActiveTab("orders")}
              className="w-full flex items-center justify-center md:justify-start space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              <Eye className="h-4 w-4 md:h-5 md:w-5" />
              <span>View Today's Orders</span>
            </button>

            {/* Add New Product */}
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="w-full flex items-center justify-center md:justify-start space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span>Add New Product</span>
            </button>

            {/* Add Meal Plan */}
            <button
              onClick={() => {
                setEditingMealPlan(null);
                setShowMealPlanModal(true);
              }}
              className="w-full flex items-center justify-center md:justify-start space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              <ChefHat className="h-4 w-4 md:h-5 md:w-5" />
              <span>Add Meal Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Meals Quick Access */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Daily Meals</h3>
          <div className="flex items-center space-x-2">
            {todayMeal && (
              <div className="flex items-center space-x-1 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Today's meal added</span>
              </div>
            )}
            {tomorrowMeal && (
              <div className="flex items-center space-x-1 text-blue-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Tomorrow's meal added</span>
              </div>
            )}
            <button
              onClick={() => setActiveTab("daily-meals")}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Utensils className="h-4 w-4" />
              <span>Manage Daily Meals</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Today's Meal</h4>
              {todayMeal ? (
                <span className="text-green-600 text-sm">✓ Added</span>
              ) : (
                <span className="text-red-600 text-sm">Not added</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {todayMeal
                ? "Meal is available for customers"
                : "No meal added for today"}
            </p>
          </div>

          <div className="border rounded-lg p-3 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Tomorrow's Meal</h4>
              {tomorrowMeal ? (
                <span className="text-green-600 text-sm">✓ Added</span>
              ) : (
                <span className="text-red-600 text-sm">Not added</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {tomorrowMeal
                ? "Meal is available for customers"
                : "No meal added for tomorrow"}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData.recentOrders?.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentOrders?.map((order) => (
                  <div
                    key={order._id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.customer?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">
                          ₹{order.totalAmount}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.status}
                          </span>
                          {order.isCustomized && (
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {order.isCustomized && (
                      <div className="text-xs text-gray-500">
                        Add-ons:{" "}
                        {order.items
                          .filter((item) => item.category === "addon")
                          .map((item) => item.name)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Low Stock Alerts
            </h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData.lowStockProducts?.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
                <p className="mt-2 text-sm text-gray-500">
                  All products are well stocked
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.lowStockProducts?.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-red-600">
                        Only {product.stock} left in stock
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <button className="text-blue-600 hover:underline text-xs">
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const Orders = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management </h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={loadOrders}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={orderFilters.search}
              onChange={(e) =>
                setOrderFilters({ ...orderFilters, search: e.target.value })
              }
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={orderFilters.status}
            onChange={(e) =>
              setOrderFilters({ ...orderFilters, status: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={orderFilters.type}
            onChange={(e) =>
              setOrderFilters({ ...orderFilters, type: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="gkk">GKK Orders</option>
            <option value="addon">Add-on Orders</option>
            <option value="custom">Custom Orders</option>
            <option value="product">Product Orders</option>
          </select>
          <select
            value={orderFilters.customized}
            onChange={(e) =>
              setOrderFilters({ ...orderFilters, customized: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="true">Customized Only</option>
            <option value="false">Non-Customized Only</option>
          </select>
          <select
            value={orderFilters.college || "all"}
            onChange={(e) =>
              setOrderFilters({ ...orderFilters, college: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="college">College Orders Only</option>
            <option value="non-college">Non-College Orders Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items & Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders
                  .filter((order) => {
                    // Apply college filter
                    if (orderFilters.college === "college") {
                      return order.items.some((item) => item.isCollegeBranded);
                    } else if (orderFilters.college === "non-college") {
                      return !order.items.some((item) => item.isCollegeBranded);
                    }
                    return true; // Show all orders if filter is 'all'
                  })
                  .map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.deliverySlot &&
                            `${order.deliverySlot} delivery`}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              order.type === "gkk"
                                ? "bg-green-100 text-green-800"
                                : order.type === "addon"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.type.toUpperCase()}
                          </span>
                          {order.isCustomized && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              🔧 Custom
                            </span>
                          )}
                          {/* College Branded Items Badge */}
                          {order.items.some(
                            (item) => item.isCollegeBranded
                          ) && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              🎓 College Order
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customer?.phone}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order?.deliveryAddress?.city},
                        </div>
                        <div className="text-xs text-gray-500">
                          {order?.deliveryAddress?.street}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {/* College Order Summary */}
                        {order.items.some(
                          (item) => item.isCollegeBranded && item.collegeName
                        ) && (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">
                              🎓 College Order Summary
                            </div>
                            {order.items
                              .filter(
                                (item) =>
                                  item.isCollegeBranded && item.collegeName
                              )
                              .map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-blue-700"
                                >
                                  • {item.name} - College: {item.collegeName}
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Main Items */}
                        <div className="space-y-1 mb-3">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Main Items:
                          </div>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex justify-between items-center py-1 px-2 rounded ${
                                item.category === "addon"
                                  ? "bg-purple-50 border-l-2 border-purple-300"
                                  : "bg-gray-50 border-l-2 border-gray-300"
                              }`}
                            >
                              <div className="flex-1">
                                <span
                                  className={`text-sm font-medium ${
                                    item.category === "addon"
                                      ? "text-purple-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ×{item.quantity}
                                </span>
                                {/* College Information */}
                                {item.isCollegeBranded && item.collegeName && (
                                  <div className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                                    <span className="mr-1">🎓</span>
                                    <span className="font-bold">
                                      College: {item.collegeName}
                                    </span>
                                  </div>
                                )}
                                {/* Debug: Always show college info if present */}
                                {(item.isCollegeBranded ||
                                  item.collegeName) && (
                                  <div className="text-xs text-red-600 font-medium mt-1">
                                    DEBUG: isCollegeBranded=
                                    {item.isCollegeBranded}, collegeName=
                                    {item.collegeName}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Customizations */}
                        {order.customizations &&
                          order.customizations.length > 0 && (
                            <div className="border-t border-orange-200 pt-2">
                              <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-2 flex items-center">
                                <span className="mr-1">🔧</span>
                                Customizations:
                              </div>
                              <div className="space-y-1">
                                {order.customizations.map(
                                  (customization, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center py-1 px-2 bg-orange-50 border-l-2 border-orange-400 rounded"
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium text-orange-800">
                                          {customization.name}
                                        </span>
                                        <span className="text-xs text-orange-600 ml-2">
                                          ×{customization.quantity}
                                        </span>
                                      </div>
                                      <span className="text-sm font-semibold text-orange-900">
                                        {customization.price > 0
                                          ? `+₹${
                                              customization.price *
                                              customization.quantity
                                            }`
                                          : "Free"}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusUpdate(order._id, e.target.value)
                          }
                          className={`text-xs font-medium rounded-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : order.status === "confirmed"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : order.status === "preparing"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : order.status === "ready"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : order.status === "out-for-delivery"
                              ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          <option value="pending">🔄 Pending</option>
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="preparing">👨‍🍳 Preparing</option>
                          <option value="ready">🎯 Ready</option>
                          <option value="out-for-delivery">
                            🚚 Out for Delivery
                          </option>
                          <option value="delivered">📦 Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{order.totalAmount}
                        </div>
                        {order.customizations &&
                          order.customizations.length > 0 && (
                            <div className="text-xs text-orange-600">
                              +₹
                              {order.customizations.reduce(
                                (sum, c) => sum + c.price * c.quantity,
                                0
                              )}{" "}
                              custom
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                            title="Generate Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {order.isCustomized && (
                            <button
                              className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 p-1 rounded transition-colors"
                              title="View Customizations"
                            >
                              🔧
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders match your current filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
  const Products = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Products Management
        </h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    product.images?.[0] ? "hidden" : ""
                  }`}
                >
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 truncate text-sm">
                  {product.title}
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Category: {product.category?.name || "Uncategorized"}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{product.price}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">
                      {product.ratings?.average || 0} (
                      {product.ratings?.count || 0})
                    </span>
                  </div>
                </div>
                <div
                  className={`text-xs mb-3 ${
                    product.stock > 10
                      ? "text-green-600"
                      : product.stock > 0
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  Stock: {product.stock}{" "}
                  {product.stock === 0
                    ? "(Out of Stock)"
                    : product.stock <= 10
                    ? "(Low Stock)"
                    : ""}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowProductModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-3 w-3 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this product?")
                      ) {
                        handleDelete(product._id);
                      }
                    }}
                    className="px-3 py-2 border border-red-300 text-red-600 text-xs rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MealPlans = () => <SellerMealPlansList />;

  const Analytics = () => (
    <div className="space-y-6">
      {/* ... existing code ... */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${analyticsData.summary?.totalRevenue || 0}`}
          change={12}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={analyticsData.summary?.totalOrders || 0}
          change={8}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={Users}
          title="Repeat Customers"
          value="89" // This would need additional API endpoint
          change={15}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Order Value"
          value={`₹${analyticsData.summary?.averageOrderValue || 0}`}
          change={analyticsData.summary?.customizationRate > 50 ? 5 : -3}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Update the top products section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Products
        </h3>
        <div className="space-y-3">
          {analyticsData.topProducts?.map((product, index) => (
            <div
              key={product._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {product._id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.sales} orders
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ₹{product.revenue}
              </span>
            </div>
          )) || (
            <div className="text-center py-4 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const Settings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Restaurant Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                defaultValue="Ghar Ka Khana"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                defaultValue="45"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Cutoff Time
              </label>
              <input
                type="time"
                defaultValue="10:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Available Days
              </label>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    id={day}
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={day}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Save Business Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">New Orders</p>
                <p className="text-sm text-gray-500">
                  Get notified when you receive new orders
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Order Customizations
                </p>
                <p className="text-sm text-gray-500">
                  Get notified about order customizations
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">
                  Get notified when items are low in stock
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Daily Reports</p>
                <p className="text-sm text-gray-500">
                  Receive daily sales and order reports
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div
      className={`fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:inset-0`}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Seller Panel</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "orders", label: "Orders", icon: ShoppingCart },
            { id: "products", label: "Products", icon: Package },
            { id: "meal-plans", label: "Meal Plans", icon: ChefHat },
            { id: "daily-meals", label: "Daily Meals", icon: Utensils },
            { id: "vehicle-rental", label: "Vehicle Rental", icon: Car },
            {
              id: "unofficialhisaab",
              label: "Unofficial Hisaab",
              icon: DollarSign,
            },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "settings", label: "Settings", icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === "unofficialhisaab") {
                  navigate("/seller/unofficialhisaab");
                  setSidebarOpen(false);
                } else {
                  setActiveTab(id);
                  setSidebarOpen(false);
                  setCurrentPage(1);
                }
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === id
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  const ProductModal = () => {
    const [formData, setFormData] = useState({
      title: editingProduct?.title || "",
      description: editingProduct?.description || "",
      shortDescription: editingProduct?.shortDescription || "",
      price: editingProduct?.price || "",
      stock: editingProduct?.stock || "",
      category: editingProduct?.category?._id || "",
      tags: Array.isArray(editingProduct?.tags)
        ? editingProduct.tags.join(", ")
        : editingProduct?.tags || "",
      isActive: editingProduct?.isActive ?? true,
      unitType: editingProduct?.unitType || "piece",
      weight: editingProduct?.weight || "",
      isPerishable: editingProduct?.isPerishable || false,
      lowStockThreshold: editingProduct?.lowStockThreshold || 10,
      origin: editingProduct?.origin || "",
      ingredients: Array.isArray(editingProduct?.ingredients)
        ? editingProduct.ingredients.join(", ")
        : editingProduct?.ingredients || "",
      allergens: Array.isArray(editingProduct?.allergens)
        ? editingProduct.allergens.join(", ")
        : editingProduct?.allergens || "",
      storageInstructions: editingProduct?.storageInstructions || "",
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
      fetchCategories();
    }, []);

    const fetchCategories = async () => {
      try {
        const response = await apiService.request("/seller/categories");
        if (response.status) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          { _id: "1", name: "Main Course" },
          { _id: "2", name: "Appetizers" },
          { _id: "3", name: "Desserts" },
          { _id: "4", name: "Beverages" },
        ]);
      }
    };

    // const handleFileChange = (e) => {
    //   setSelectedFiles(Array.from(e.target.files));
    // };
    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);

      // Validate files
      const validFiles = files.filter((file) => {
        const isValidType = file.type.startsWith("image/");
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

        if (!isValidType) {
          alert(`${file.name} is not a valid image file`);
          return false;
        }
        if (!isValidSize) {
          alert(`${file.name} is too large (max 5MB)`);
          return false;
        }
        return true;
      });

      console.log("Valid files selected:", validFiles);
      setSelectedFiles(validFiles);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        // Create FormData for file upload
        const formDataToSend = new FormData();

        // Debug logs
        console.log("Form data:", formData);
        console.log("Selected files:", selectedFiles);

        // Add all form fields
        Object.keys(formData).forEach((key) => {
          if (key === "tags" || key === "ingredients" || key === "allergens") {
            // Convert comma-separated strings to arrays and clean them
            const arrayValue = formData[key]
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item.length > 0); // Remove empty strings

            // Send as JSON string for arrays
            formDataToSend.append(key, JSON.stringify(arrayValue));
          } else if (key === "specifications") {
            formDataToSend.append(key, JSON.stringify(formData[key]));
          } else {
            formDataToSend.append(key, formData[key]);
          }
        });

        // Add files - IMPORTANT: Check if files exist and are valid
        if (selectedFiles && selectedFiles.length > 0) {
          console.log("Adding files to FormData:", selectedFiles.length);
          selectedFiles.forEach((file, index) => {
            console.log(
              `Adding file ${index}:`,
              file.name,
              file.type,
              file.size
            );
            formDataToSend.append("images", file); // Use 'images' not 'image'
          });
        } else {
          console.log("No files selected");
        }

        // Debug: Log FormData contents
        console.log("FormData contents:");
        for (let pair of formDataToSend.entries()) {
          console.log(pair[0] + ":", pair[1]);
        }

        // Update API call to handle FormData
        const endpoint = editingProduct
          ? `/seller/products/${editingProduct._id}`
          : "/seller/products";

        console.log("Submitting to endpoint:", endpoint);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: editingProduct ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            // Don't set Content-Type for FormData, let browser set it
          },
          body: formDataToSend,
        });

        console.log("Response status:", response.status);
        const result = await response.json();
        console.log("Response data:", result);

        if (response.ok && result.success) {
          console.log("Product saved successfully:", result.data);
          setShowProductModal(false);
          setEditingProduct(null);
          setSelectedFiles([]);
          loadProducts();
        } else {
          console.error("Save failed:", result);
          alert(
            "Failed to save product: " + (result.message || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Error saving product:", error);
        alert("Error saving product: " + error.message);
      }
    };

    if (!showProductModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setSelectedFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength={1000}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortDescription: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={250}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Pricing & Stock
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowStockThreshold: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Type
                    </label>
                    <select
                      value={formData.unitType}
                      onChange={(e) =>
                        setFormData({ ...formData, unitType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kilogram</option>
                      <option value="g">Gram</option>
                      <option value="litre">Litre</option>
                      <option value="ml">Millilitre</option>
                      <option value="dozen">Dozen</option>
                      <option value="packet">Packet</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category & Classification */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Category & Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="e.g., spicy, vegetarian, popular"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origin
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) =>
                        setFormData({ ...formData, origin: e.target.value })
                      }
                      placeholder="e.g., Local Farm, Maharashtra"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingredients (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.ingredients}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ingredients: e.target.value,
                        })
                      }
                      placeholder="e.g., wheat flour, oil, salt, spices"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergens (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.allergens}
                      onChange={(e) =>
                        setFormData({ ...formData, allergens: e.target.value })
                      }
                      placeholder="e.g., gluten, nuts, dairy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={formData.storageInstructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storageInstructions: e.target.value,
                        })
                      }
                      placeholder="e.g., Store in a cool, dry place"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Product Images
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingProduct
                      ? "Update Images (will replace existing)"
                      : "Upload Images"}{" "}
                    (Max 5 images, 5MB each)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFiles.map((f) => f.name).join(", ")}
                    </div>
                  )}
                  {editingProduct && editingProduct.images?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      Current images: {editingProduct.images.length} image(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Status
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active Product
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPerishable"
                      checked={formData.isPerishable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPerishable: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPerishable"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Perishable Item
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setSelectedFiles([]);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
  const MealPlanModal = () => {
    const [formData, setFormData] = useState({
      title: editingMealPlan?.title || "",
      description: editingMealPlan?.description || "",
      tier: editingMealPlan?.tier || "basic",
      pricing: {
        oneDay: editingMealPlan?.pricing?.oneDay || "",
        tenDays: editingMealPlan?.pricing?.tenDays || "",
        thirtyDays: editingMealPlan?.pricing?.thirtyDays || "",
      },
      includes: editingMealPlan?.includes || [],
      features: editingMealPlan?.features?.join(", ") || "",
      status: editingMealPlan?.status || "active",
    });

    const [newInclude, setNewInclude] = useState({
      name: "",
      quantity: "",
      unit: "",
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        // Create FormData for file upload
        const formDataToSend = new FormData();

        // Add all form fields
        Object.keys(formData).forEach((key) => {
          if (key === "tags" || key === "ingredients" || key === "allergens") {
            // Convert comma-separated strings to arrays
            const arrayValue = formData[key]
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
            formDataToSend.append(key, JSON.stringify(arrayValue));
          } else if (key === "specifications") {
            // Handle specifications properly - skip if empty or invalid
            if (
              formData[key] &&
              Array.isArray(formData[key]) &&
              formData[key].length > 0
            ) {
              formDataToSend.append(key, JSON.stringify(formData[key]));
            }
            // If it's not an array or is empty, don't include it
          } else {
            formDataToSend.append(key, formData[key]);
          }
        });

        // Add files
        selectedFiles.forEach((file, index) => {
          formDataToSend.append("images", file);
        });

        // Update API call to handle FormData
        const endpoint = editingProduct
          ? `/seller/products/${editingProduct._id}`
          : "/seller/products";

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: editingProduct ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            // Don't set Content-Type for FormData, let browser set it
          },
          body: formDataToSend,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setShowProductModal(false);
            setEditingProduct(null);
            setSelectedFiles([]);
            loadProducts();
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error saving product:", error);
      }
    };

    const addInclude = () => {
      if (newInclude.name && newInclude.quantity) {
        setFormData({
          ...formData,
          includes: [
            ...formData.includes,
            { ...newInclude, quantity: parseInt(newInclude.quantity) },
          ],
        });
        setNewInclude({ name: "", quantity: "", unit: "" });
      }
    };

    const removeInclude = (index) => {
      setFormData({
        ...formData,
        includes: formData.includes.filter((_, i) => i !== index),
      });
    };

    if (!showMealPlanModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMealPlan ? "Edit Meal Plan" : "Add New Meal Plan"}
              </h2>
              <button
                onClick={() => {
                  setShowMealPlanModal(false);
                  setEditingMealPlan(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) =>
                      setFormData({ ...formData, tier: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Pricing
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      One Day (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.oneDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            oneDay: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      10 Days (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.tenDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            tenDays: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      30 Days (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.thirtyDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            thirtyDays: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  What's Included
                </h3>
                <div className="space-y-3">
                  {formData.includes.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="flex-1">
                        {item.name} - {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInclude(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={newInclude.name}
                      onChange={(e) =>
                        setNewInclude({ ...newInclude, name: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newInclude.quantity}
                      onChange={(e) =>
                        setNewInclude({
                          ...newInclude,
                          quantity: e.target.value,
                        })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={newInclude.unit}
                      onChange={(e) =>
                        setNewInclude({ ...newInclude, unit: e.target.value })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addInclude}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  placeholder="e.g., Homestyle, Fresh Ingredients, No Preservatives"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="coming-soon">Coming Soon</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMealPlanModal(false);
                    setEditingMealPlan(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="h-4 w-4 inline mr-1" />
                  {editingMealPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DailyMealModal = () => {
    const [formData, setFormData] = useState({
      restaurantId: editingDailyMeal?.restaurantId || "",
      meals: {
        low: {
          lunch: {
            items: editingDailyMeal?.meals?.low?.lunch?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.low?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.low?.dinner?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.low?.dinner?.totalCalories || 0,
          },
        },
        basic: {
          lunch: {
            items: editingDailyMeal?.meals?.basic?.lunch?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.basic?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.basic?.dinner?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.basic?.dinner?.totalCalories || 0,
          },
        },
        premium: {
          lunch: {
            items: editingDailyMeal?.meals?.premium?.lunch?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.premium?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.premium?.dinner?.items || [],
            totalCalories:
              editingDailyMeal?.meals?.premium?.dinner?.totalCalories || 0,
          },
        },
      },
      sundaySpecial: {
        isSpecialDay: editingDailyMeal?.sundaySpecial?.isSpecialDay || false,
        specialItems: editingDailyMeal?.sundaySpecial?.specialItems || [],
        extraCharges: editingDailyMeal?.sundaySpecial?.extraCharges || 0,
        includedInPlan:
          editingDailyMeal?.sundaySpecial?.includedInPlan || false,
      },
      nutritionalInfo: {
        low: {
          calories: editingDailyMeal?.nutritionalInfo?.low?.calories || 0,
          protein: editingDailyMeal?.nutritionalInfo?.low?.protein || "0g",
          carbs: editingDailyMeal?.nutritionalInfo?.low?.carbs || "0g",
          fat: editingDailyMeal?.nutritionalInfo?.low?.fat || "0g",
        },
        basic: {
          calories: editingDailyMeal?.nutritionalInfo?.basic?.calories || 0,
          protein: editingDailyMeal?.nutritionalInfo?.basic?.protein || "0g",
          carbs: editingDailyMeal?.nutritionalInfo?.basic?.carbs || "0g",
          fat: editingDailyMeal?.nutritionalInfo?.basic?.fat || "0g",
        },
        premium: {
          calories: editingDailyMeal?.nutritionalInfo?.premium?.calories || 0,
          protein: editingDailyMeal?.nutritionalInfo?.premium?.protein || "0g",
          carbs: editingDailyMeal?.nutritionalInfo?.premium?.carbs || "0g",
          fat: editingDailyMeal?.nutritionalInfo?.premium?.fat || "0g",
        },
      },
      chefSpecial: {
        isChefSpecial: editingDailyMeal?.chefSpecial?.isChefSpecial || false,
        specialNote: editingDailyMeal?.chefSpecial?.specialNote || "",
        chefName: editingDailyMeal?.chefSpecial?.chefName || "",
      },
      availability: {
        low: editingDailyMeal?.availability?.low ?? true,
        basic: editingDailyMeal?.availability?.basic ?? true,
        premium: editingDailyMeal?.availability?.premium ?? true,
      },
    });

    // New item state for each tier and slot combination
    const [newItems, setNewItems] = useState({
      low: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
      basic: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
      premium: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
    });
    const [newSpecialItem, setNewSpecialItem] = useState({
      name: "",
      description: "",
      price: 0,
      category: "",
    });

    const addItem = (tier, slot) => {
      const item = newItems[tier][slot];
      if (item.name && item.quantity) {
        setFormData({
          ...formData,
          meals: {
            ...formData.meals,
            [tier]: {
              ...formData.meals[tier],
              [slot]: {
                ...formData.meals[tier][slot],
                items: [...formData.meals[tier][slot].items, { ...item }],
              },
            },
          },
        });
        setNewItems({
          ...newItems,
          [tier]: {
            ...newItems[tier],
            [slot]: { name: "", description: "", quantity: "" },
          },
        });
      }
    };

    const removeItem = (tier, slot, index) => {
      setFormData({
        ...formData,
        meals: {
          ...formData.meals,
          [tier]: {
            ...formData.meals[tier],
            [slot]: {
              ...formData.meals[tier][slot],
              items: formData.meals[tier][slot].items.filter(
                (_, i) => i !== index
              ),
            },
          },
        },
      });
    };

    const addSpecialItem = () => {
      if (newSpecialItem.name && newSpecialItem.price) {
        setFormData({
          ...formData,
          sundaySpecial: {
            ...formData.sundaySpecial,
            specialItems: [
              ...formData.sundaySpecial.specialItems,
              { ...newSpecialItem },
            ],
          },
        });
        setNewSpecialItem({
          name: "",
          description: "",
          price: 0,
          category: "",
        });
      }
    };

    const removeSpecialItem = (index) => {
      setFormData({
        ...formData,
        sundaySpecial: {
          ...formData.sundaySpecial,
          specialItems: formData.sundaySpecial.specialItems.filter(
            (_, i) => i !== index
          ),
        },
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      await handleDailyMealSave(formData);
    };

    if (!showDailyMealModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingDailyMeal
                    ? `Update ${
                        mealType === "today" ? "Today's" : "Tomorrow's"
                      } Meal`
                    : `Add ${
                        mealType === "today" ? "Today's" : "Tomorrow's"
                      } Meal`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {mealType === "today"
                    ? "Today's meal can only be added before 7:00 AM"
                    : "Tomorrow's meal can be added anytime"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDailyMealModal(false);
                  setEditingDailyMeal(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quick Overview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-3">
                  Quick Overview
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {["low", "basic", "premium"].map((tier) => (
                    <div key={tier} className="bg-white p-3 rounded-lg border">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">
                        {tier} Tier
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Lunch:</span>
                          <span
                            className={
                              formData.meals[tier].lunch.items.length > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formData.meals[tier].lunch.items.length} items
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dinner:</span>
                          <span
                            className={
                              formData.meals[tier].dinner.items.length > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formData.meals[tier].dinner.items.length} items
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Meal Plans Configuration */}
              <div className="space-y-6">
                {["low", "basic", "premium"].map((tier) => (
                  <div key={tier} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                      {tier} Tier Configuration
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Lunch Section */}
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Lunch</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {formData.meals[tier].lunch.items.length} items
                            </span>
                            {formData.meals[tier].lunch.items.length === 0 && (
                              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                No items
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current Lunch Items */}
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          {formData.meals[tier].lunch.items.length === 0 ? (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <div className="text-gray-500">
                                <ChefHat className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                                <p className="text-sm">No lunch items</p>
                              </div>
                            </div>
                          ) : (
                            formData.meals[tier].lunch.items.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 flex items-center">
                                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                                        {index + 1}
                                      </span>
                                      {item.name}
                                    </div>
                                    {item.description && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        {item.description}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="bg-gray-100 px-2 py-1 rounded">
                                        Quantity: {item.quantity}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(tier, "lunch", index)
                                    }
                                    className="text-red-600 hover:text-red-800 ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            )
                          )}
                        </div>

                        {/* Add Lunch Item */}
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Add Lunch Item
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Item name"
                              value={newItems[tier].lunch.name}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    lunch: {
                                      ...newItems[tier].lunch,
                                      name: e.target.value,
                                    },
                                  },
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newItems[tier].lunch.description}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    lunch: {
                                      ...newItems[tier].lunch,
                                      description: e.target.value,
                                    },
                                  },
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Quantity"
                                value={newItems[tier].lunch.quantity}
                                onChange={(e) =>
                                  setNewItems({
                                    ...newItems,
                                    [tier]: {
                                      ...newItems[tier],
                                      lunch: {
                                        ...newItems[tier].lunch,
                                        quantity: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => addItem(tier, "lunch")}
                                disabled={
                                  !newItems[tier].lunch.name ||
                                  !newItems[tier].lunch.quantity
                                }
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Lunch Calories */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Calories
                          </label>
                          <input
                            type="number"
                            value={formData.meals[tier].lunch.totalCalories}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                meals: {
                                  ...formData.meals,
                                  [tier]: {
                                    ...formData.meals[tier],
                                    lunch: {
                                      ...formData.meals[tier].lunch,
                                      totalCalories:
                                        parseInt(e.target.value) || 0,
                                    },
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Dinner Section */}
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Dinner</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {formData.meals[tier].dinner.items.length} items
                            </span>
                            {formData.meals[tier].dinner.items.length === 0 && (
                              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                No items
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current Dinner Items */}
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          {formData.meals[tier].dinner.items.length === 0 ? (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <div className="text-gray-500">
                                <ChefHat className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                                <p className="text-sm">No dinner items</p>
                              </div>
                            </div>
                          ) : (
                            formData.meals[tier].dinner.items.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 flex items-center">
                                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                                        {index + 1}
                                      </span>
                                      {item.name}
                                    </div>
                                    {item.description && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        {item.description}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="bg-gray-100 px-2 py-1 rounded">
                                        Quantity: {item.quantity}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(tier, "dinner", index)
                                    }
                                    className="text-red-600 hover:text-red-800 ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            )
                          )}
                        </div>

                        {/* Add Dinner Item */}
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Add Dinner Item
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Item name"
                              value={newItems[tier].dinner.name}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    dinner: {
                                      ...newItems[tier].dinner,
                                      name: e.target.value,
                                    },
                                  },
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newItems[tier].dinner.description}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    dinner: {
                                      ...newItems[tier].dinner,
                                      description: e.target.value,
                                    },
                                  },
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Quantity"
                                value={newItems[tier].dinner.quantity}
                                onChange={(e) =>
                                  setNewItems({
                                    ...newItems,
                                    [tier]: {
                                      ...newItems[tier],
                                      dinner: {
                                        ...newItems[tier].dinner,
                                        quantity: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => addItem(tier, "dinner")}
                                disabled={
                                  !newItems[tier].dinner.name ||
                                  !newItems[tier].dinner.quantity
                                }
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Dinner Calories */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Calories
                          </label>
                          <input
                            type="number"
                            value={formData.meals[tier].dinner.totalCalories}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                meals: {
                                  ...formData.meals,
                                  [tier]: {
                                    ...formData.meals[tier],
                                    dinner: {
                                      ...formData.meals[tier].dinner,
                                      totalCalories:
                                        parseInt(e.target.value) || 0,
                                    },
                                  },
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sunday Special */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Sunday Special
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add special items for Sunday meals
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isSpecialDay"
                      checked={formData.sundaySpecial.isSpecialDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sundaySpecial: {
                            ...formData.sundaySpecial,
                            isSpecialDay: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isSpecialDay"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Enable Sunday Special
                    </label>
                  </div>
                </div>

                {formData.sundaySpecial.isSpecialDay && (
                  <div className="space-y-4">
                    {/* Special Items */}
                    <div className="space-y-2">
                      {formData.sundaySpecial.specialItems.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {item.description}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₹{item.price} - {item.category}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSpecialItem(index)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {/* Add Special Item */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newSpecialItem.name}
                        onChange={(e) =>
                          setNewSpecialItem({
                            ...newSpecialItem,
                            name: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={newSpecialItem.description}
                        onChange={(e) =>
                          setNewSpecialItem({
                            ...newSpecialItem,
                            description: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newSpecialItem.price}
                        onChange={(e) =>
                          setNewSpecialItem({
                            ...newSpecialItem,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Category"
                          value={newSpecialItem.category}
                          onChange={(e) =>
                            setNewSpecialItem({
                              ...newSpecialItem,
                              category: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={addSpecialItem}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Extra Charges */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Extra Charges (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.sundaySpecial.extraCharges}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sundaySpecial: {
                                ...formData.sundaySpecial,
                                extraCharges: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <input
                          type="checkbox"
                          id="includedInPlan"
                          checked={formData.sundaySpecial.includedInPlan}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sundaySpecial: {
                                ...formData.sundaySpecial,
                                includedInPlan: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="includedInPlan"
                          className="text-sm text-gray-700"
                        >
                          Included in Plan
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chef Special */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Chef Special
                    </h3>
                    <p className="text-sm text-gray-600">
                      Highlight special dishes prepared by your chef
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isChefSpecial"
                      checked={formData.chefSpecial.isChefSpecial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          chefSpecial: {
                            ...formData.chefSpecial,
                            isChefSpecial: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isChefSpecial"
                      className="text-sm text-gray-700 font-medium"
                    >
                      Enable Chef Special
                    </label>
                  </div>
                </div>

                {formData.chefSpecial.isChefSpecial && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chef Name
                      </label>
                      <input
                        type="text"
                        value={formData.chefSpecial.chefName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chefSpecial: {
                              ...formData.chefSpecial,
                              chefName: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Note
                      </label>
                      <textarea
                        rows={2}
                        value={formData.chefSpecial.specialNote}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chefSpecial: {
                              ...formData.chefSpecial,
                              specialNote: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Meal Plan Availability
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select which meal plans will be available for this daily
                    meal
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {["low", "basic", "premium"].map((tier) => (
                    <div
                      key={tier}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg border"
                    >
                      <input
                        type="checkbox"
                        id={`availability-${tier}`}
                        checked={formData.availability[tier]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            availability: {
                              ...formData.availability,
                              [tier]: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`availability-${tier}`}
                        className="text-sm font-medium text-gray-700 capitalize cursor-pointer"
                      >
                        {tier} Tier
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowDailyMealModal(false);
                    setEditingDailyMeal(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingDailyMeal
                    ? `Update ${
                        mealType === "today" ? "Today's" : "Tomorrow's"
                      } Meal`
                    : `Add ${
                        mealType === "today" ? "Today's" : "Tomorrow's"
                      } Meal`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DailyMeals = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Daily Meals Management
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              checkTodayMeal();
              checkTomorrowMeal();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Today's Meal Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Today's Daily Meal
          </h3>
          <div className="flex items-center space-x-2">
            {!canAddMeal && (
              <div className="flex items-center space-x-1 text-orange-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Time Restricted</span>
              </div>
            )}
            <button
              onClick={() => {
                setMealType("today");
                setEditingDailyMeal(todayMeal);
                setShowDailyMealModal(true);
              }}
              disabled={!canAddMeal && !todayMeal}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                canAddMeal || todayMeal
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {todayMeal ? (
                <Edit className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {todayMeal ? "Update Today's Meal" : "Add Today's Meal"}
              </span>
            </button>
          </div>
        </div>

        {timeRestrictionMessage && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2 text-orange-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {timeRestrictionMessage}
              </span>
            </div>
          </div>
        )}

        {todayMeal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Tier */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Low Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {todayMeal.meals?.low?.lunch?.items?.length || 0} items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {todayMeal.meals?.low?.dinner?.items?.length || 0} items
                  </div>
                </div>
              </div>

              {/* Basic Tier */}
              <div className="border rounded-lg p-3 bg-blue-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Basic Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {todayMeal.meals?.basic?.lunch?.items?.length || 0} items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {todayMeal.meals?.basic?.dinner?.items?.length || 0} items
                  </div>
                </div>
              </div>

              {/* Premium Tier */}
              <div className="border rounded-lg p-3 bg-purple-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Premium Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {todayMeal.meals?.premium?.lunch?.items?.length || 0} items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {todayMeal.meals?.premium?.dinner?.items?.length || 0} items
                  </div>
                </div>
              </div>
            </div>

            {todayMeal.sundaySpecial?.isSpecialDay && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">Sunday Special Available</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {canAddMeal
                ? "No meal added for today yet"
                : "Cannot add meal after 7:00 AM"}
            </p>
            {canAddMeal && (
              <button
                onClick={() => {
                  setMealType("today");
                  setEditingDailyMeal(null);
                  setShowDailyMealModal(true);
                }}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Today's Meal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tomorrow's Meal Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tomorrow's Daily Meal
          </h3>
          <button
            onClick={() => {
              setMealType("tomorrow");
              setEditingDailyMeal(tomorrowMeal);
              setShowDailyMealModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {tomorrowMeal ? (
              <Edit className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>
              {tomorrowMeal ? "Update Tomorrow's Meal" : "Add Tomorrow's Meal"}
            </span>
          </button>
        </div>

        {tomorrowMeal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Tier */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Low Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {tomorrowMeal.meals?.low?.lunch?.items?.length || 0} items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {tomorrowMeal.meals?.low?.dinner?.items?.length || 0} items
                  </div>
                </div>
              </div>

              {/* Basic Tier */}
              <div className="border rounded-lg p-3 bg-blue-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Basic Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {tomorrowMeal.meals?.basic?.lunch?.items?.length || 0} items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {tomorrowMeal.meals?.basic?.dinner?.items?.length || 0}{" "}
                    items
                  </div>
                </div>
              </div>

              {/* Premium Tier */}
              <div className="border rounded-lg p-3 bg-purple-50">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Premium Tier
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Lunch:</span>{" "}
                    {tomorrowMeal.meals?.premium?.lunch?.items?.length || 0}{" "}
                    items
                  </div>
                  <div>
                    <span className="font-medium">Dinner:</span>{" "}
                    {tomorrowMeal.meals?.premium?.dinner?.items?.length || 0}{" "}
                    items
                  </div>
                </div>
              </div>
            </div>

            {tomorrowMeal.sundaySpecial?.isSpecialDay && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">Sunday Special Available</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Utensils className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No meal added for tomorrow yet
            </p>
            <button
              onClick={() => {
                setMealType("tomorrow");
                setEditingDailyMeal(null);
                setShowDailyMealModal(true);
              }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Tomorrow's Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "orders":
        return <Orders />;
      case "products":
        return <Products />;
      case "meal-plans":
        return <MealPlans />;
      case "daily-meals":
        return <DailyMeals />;
      case "vehicle-rental":
        return <VehicleRentalDashboard />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Real-time Order Notifications */}
      <RealTimeOrderNotification
        orderUpdates={orderUpdates}
        newOrders={newOrders}
        driverAssignments={driverAssignments}
        userRole="seller"
        onClearNotifications={() => {
          clearOrderUpdates();
          clearNewOrders();
          clearDriverAssignments();
        }}
      />

      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Seller Seller Panel
          </h1>

          <div className="w-9"></div>
        </div>
        {/* <StoreStatusToggle></StoreStatusToggle> */}
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">{renderContent()}</div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <ProductModal />
      <MealPlanModal />
      <DailyMealModal />
    </div>
  );
};

export default SellerAdminPanel;
