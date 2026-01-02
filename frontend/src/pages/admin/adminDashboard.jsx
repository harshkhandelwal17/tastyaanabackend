import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useOrderSocket from "../../hooks/useOrderSocket";
import RealTimeOrderNotification from "../../components/common/RealTimeOrderNotification";
import NotificationPanel from "../../components/admin/NotificationPanel";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [assignmentModal, setAssignmentModal] = useState({
    show: false,
    order: null,
  });

  // Get user from Redux
  const user = useSelector((state) => state.auth.user);

  // Use real-time order socket for admin
  const {
    isConnected: orderSocketConnected,
    orderUpdates,
    newOrders,
    driverAssignments,
    clearOrderUpdates,
    clearNewOrders,
    clearDriverAssignments,
  } = useOrderSocket(user?._id, "admin");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle real-time order updates
  useEffect(() => {
    if (orderUpdates.length > 0) {
      const latestUpdate = orderUpdates[orderUpdates.length - 1];
      console.log("🔄 Admin: Real-time order update received:", latestUpdate);

      // Refresh dashboard data
      fetchDashboardData();

      // Show toast notification
      toast.info(
        `Order ${latestUpdate.orderNumber} status updated: ${latestUpdate.status}`
      );
    }
  }, [orderUpdates]);

  // Handle new order notifications
  useEffect(() => {
    if (newOrders.length > 0) {
      const latestOrder = newOrders[newOrders.length - 1];
      console.log("🆕 Admin: New order received:", latestOrder);

      // Refresh dashboard data
      fetchDashboardData();

      // Show toast notification
      toast.success(`New order ${latestOrder.orderNumber} received!`);
    }
  }, [newOrders]);

  // Handle driver assignment notifications
  useEffect(() => {
    if (driverAssignments.length > 0) {
      const latestAssignment = driverAssignments[driverAssignments.length - 1];
      console.log("🚗 Admin: Driver assigned:", latestAssignment);

      // Refresh dashboard data
      fetchDashboardData();

      // Show toast notification
      toast.info(`Driver assigned to order ${latestAssignment.orderNumber}`);
    }
  }, [driverAssignments]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Try different possible token storage keys
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken");

      if (!token) {
        console.log("No auth token found");
        toast.error("Please login as admin to access this page");
        return;
      }

      console.log(
        "Fetching admin dashboard data with token:",
        token.substring(0, 20) + "..."
      );

      const [ordersRes, deliveryBoysRes, statsRes] = await Promise.all([
        fetch(
          `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
          }/admin/orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
          }/admin/delivery-boys`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
          }/admin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      console.log("API Response status:", {
        orders: ordersRes.status,
        deliveryBoys: deliveryBoysRes.status,
        stats: statsRes.status,
      });

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log("Orders data received:", ordersData);
        setOrders(ordersData.orders || ordersData || []);
      } else {
        const errorData = await ordersRes.text();
        console.error("Orders API error:", errorData);
      }

      if (deliveryBoysRes.ok) {
        const deliveryData = await deliveryBoysRes.json();
        console.log("Delivery boys data received:", deliveryData);
        setDeliveryBoys(deliveryData.deliveryBoys || deliveryData || []);
      } else {
        const errorData = await deliveryBoysRes.text();
        console.error("Delivery boys API error:", errorData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log("Stats data received:", statsData);
        setStats(statsData.stats || stats);
      } else {
        const errorData = await statsRes.text();
        console.error("Stats API error:", errorData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const assignDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken");

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
        }/admin/assign-delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            deliveryBoyId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success("Delivery boy assigned successfully!");
        setAssignmentModal({ show: false, order: null });
        fetchDashboardData();
      } else {
        const error = await response.json();
        console.error("Assignment error:", error);
        toast.error(error.message || "Failed to assign delivery boy");
      }
    } catch (error) {
      console.error("Error assigning delivery boy:", error);
      toast.error("Failed to assign delivery boy");
    }
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      change: "+15.3%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      change: "-2.1%",
      trend: "down",
      icon: Package,
    },
  ];

  const salesData = [
    { name: "Jan", sales: 4000, orders: 240 },
    { name: "Feb", sales: 3000, orders: 198 },
    { name: "Mar", sales: 5000, orders: 310 },
    { name: "Apr", sales: 4500, orders: 280 },
    { name: "May", sales: 6000, orders: 390 },
    { name: "Jun", sales: 5500, orders: 350 },
    { name: "Jul", sales: 7000, orders: 450 },
  ];

  const categoryData = [
    { name: "Electronics", value: 40, sales: 50000 },
    { name: "Clothing", value: 25, sales: 31250 },
    { name: "Home & Garden", value: 20, sales: 25000 },
    { name: "Sports", value: 15, sales: 18750 },
  ];

  const topProducts = [
    { name: "iPhone 15 Pro", sales: 120, revenue: 119880, stock: 45 },
    { name: "MacBook Air", sales: 85, revenue: 84915, stock: 23 },
    { name: "AirPods Pro", sales: 200, revenue: 49800, stock: 67 },
    { name: "iPad Air", sales: 95, revenue: 56525, stock: 34 },
    { name: "Apple Watch", sales: 150, revenue: 59850, stock: 78 },
  ];

  const customers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      orders: 12,
      spent: 2450.5,
      status: "active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      orders: 8,
      spent: 1890.25,
      status: "active",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      orders: 15,
      spent: 3200.75,
      status: "active",
    },
    {
      id: 4,
      name: "Alice Brown",
      email: "alice@example.com",
      orders: 5,
      spent: 850.0,
      status: "inactive",
    },
    {
      id: 5,
      name: "Charlie Wilson",
      email: "charlie@example.com",
      orders: 20,
      spent: 4100.9,
      status: "active",
    },
  ];

  const products = [
    {
      id: 1,
      name: "iPhone 15 Pro",
      category: "Electronics",
      price: 999,
      stock: 45,
      status: "active",
    },
    {
      id: 2,
      name: "MacBook Air",
      category: "Electronics",
      price: 999,
      stock: 23,
      status: "active",
    },
    {
      id: 3,
      name: "AirPods Pro",
      category: "Electronics",
      price: 249,
      stock: 67,
      status: "active",
    },
    {
      id: 4,
      name: "iPad Air",
      category: "Electronics",
      price: 599,
      stock: 34,
      status: "active",
    },
    {
      id: 5,
      name: "Apple Watch",
      category: "Electronics",
      price: 399,
      stock: 78,
      status: "active",
    },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "shipped":
        return <Package className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${
                    stat.trend === "up" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      stat.trend === "up" ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendIcon
                  className={`w-4 h-4 ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ml-1 ${
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Sales Overview</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">
                    {order.userId?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.totalAmount}</p>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </span>
                  {!order.deliveryPartner &&
                    order.status !== "delivered" &&
                    order.status !== "cancelled" && (
                      <button
                        onClick={() =>
                          setAssignmentModal({ show: true, order })
                        }
                        className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Assign Delivery
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Top Products</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-8 bg-blue-500 rounded"></div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.sales} sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{product.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.stock} in stock
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Orders Management</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Boy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium">
                        {order.userId?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.userContactNo}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    ₹{order.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span>{order.status.replace("-", " ")}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.deliveryPartner ? (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm">
                          {order.deliveryPartner.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!order.deliveryPartner &&
                        order.status !== "delivered" &&
                        order.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              setAssignmentModal({ show: true, order })
                            }
                            className="text-green-600 hover:text-green-700"
                            title="Assign Delivery Boy"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      <button
                        className="text-orange-600 hover:text-orange-700"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Products Management</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">
                  ₹{product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`${
                      product.stock < 30 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Customers Management</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {customer.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">
                  ₹{customer.spent.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      customer.status
                    )}`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 mt-10">
      {/* Real-time Order Notifications */}
      <RealTimeOrderNotification
        orderUpdates={orderUpdates}
        newOrders={newOrders}
        driverAssignments={driverAssignments}
        userRole="admin"
        onClearNotifications={() => {
          clearOrderUpdates();
          clearNewOrders();
          clearDriverAssignments();
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, Administrator</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40"
                  alt="Admin"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium">John Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: "overview", label: "Overview", icon: TrendingUp },
              { key: "orders", label: "Orders", icon: ShoppingCart },
              { key: "products", label: "Products", icon: Package },
              { key: "customers", label: "Customers", icon: Users },
              { key: "notifications", label: "Notifications", icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "customers" && renderCustomers()}
        {activeTab === "notifications" && <NotificationPanel />}
      </div>

      {/* Assignment Modal */}
      {assignmentModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Delivery Boy</h3>
              <button
                onClick={() => setAssignmentModal({ show: false, order: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {assignmentModal.order && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="font-medium">
                  Order: {assignmentModal.order.orderNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {assignmentModal.order.userId?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Amount: ₹{assignmentModal.order.totalAmount}
                </p>
                <p className="text-sm text-gray-600">
                  Address: {assignmentModal.order.deliveryAddress?.street},{" "}
                  {assignmentModal.order.deliveryAddress?.city}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Delivery Boy
              </label>
              {deliveryBoys.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No delivery boys available
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deliveryBoys.map((deliveryBoy) => (
                    <div
                      key={deliveryBoy._id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        assignDeliveryBoy(
                          assignmentModal.order._id,
                          deliveryBoy._id
                        )
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {deliveryBoy.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {deliveryBoy.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p
                          className={`font-medium ${
                            deliveryBoy.isOnline
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {deliveryBoy.isOnline ? "Online" : "Offline"}
                        </p>
                        <p className="text-gray-400">
                          {deliveryBoy.activeDeliveries || 0} active
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAssignmentModal({ show: false, order: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
