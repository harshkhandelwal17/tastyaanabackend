import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  Bell,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
  BarChart3,
  TrendingUp,
  TrendingDown,
  UserX,
  Lock,
  Globe,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  FileText,
  Archive,
  TestTube,
  Broadcast,
  Power,
  Monitor,
  Terminal,
  Wifi,
  WifiOff,
} from "lucide-react";

// Super Admin API hooks (using RTK Query)
import {
  useGetBusinessDashboardQuery,
  useGetAllUsersQuery,
  useCreateStaffUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetFeatureFlagsQuery,
  useToggleFeatureMutation,
  useSetMaintenanceModeMutation,
  useGetAuditLogsQuery,
  useGetActiveSessionsQuery,
  useTerminateSessionMutation,
  useCreateBackupMutation,
  useGetBackupsQuery,
  useGetExperimentsQuery,
  useCreateExperimentMutation,
  useDeleteExperimentMutation,
  useCreateBroadcastMutation,
} from "../storee/api/superAdminApi";

// Currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Business Dashboard Component
const BusinessDashboard = () => {
  const [period, setPeriod] = useState("30d");
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useGetBusinessDashboardQuery({ period });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">
              All Systems Operational
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Server</p>
              <p className="font-medium text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="font-medium text-green-600">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Wifi className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">API</p>
              <p className="font-medium text-green-600">Responding</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Monitor className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Load</p>
              <p className="font-medium text-yellow-600">Moderate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.platform?.users?.reduce(
                  (sum, u) => sum + u.count,
                  0
                ) || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">12.5%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Platform Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData?.revenue?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">8.2%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Sellers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.platform?.users?.find((u) => u._id === "seller")
                  ?.active || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-gray-500">
              {dashboardData?.platform?.users?.find((u) => u._id === "seller")
                ?.count || 0}{" "}
              total
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">99.9%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trends
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Revenue chart visualization</p>
              <p className="text-sm">
                Interactive charts would be implemented here
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Growth
          </h3>
          <div className="space-y-4">
            {[
              {
                label: "Customers",
                count: 15420,
                growth: "+12.5%",
                color: "blue",
              },
              { label: "Sellers", count: 342, growth: "+8.1%", color: "green" },
              { label: "Admins", count: 12, growth: "+0%", color: "purple" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-${item.color}-500`}
                  ></div>
                  <span className="font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {item.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">{item.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    role: "",
    status: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: usersData, isLoading, refetch } = useGetAllUsersQuery(filters);
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole({ userId, role: newRole }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser({ userId, reason: "Admin deletion" }).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Staff User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
            <option value="superadmin">Super Admins</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "superadmin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "seller"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                        {user.activeSessions > 0 && (
                          <span className="ml-2 text-xs text-blue-600">
                            {user.activeSessions} session(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActivity
                        ? new Date(user.lastActivity).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          /* Open edit modal */
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== "superadmin" && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <CreateStaffModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

// Create Staff Modal Component
const CreateStaffModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "admin",
    password: "",
    permissions: [],
  });
  const [createStaffUser, { isLoading }] = useCreateStaffUserMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStaffUser(formData).unwrap();
      onSuccess();
    } catch (error) {
      console.error("Failed to create staff user:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Staff User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Feature Flags Component
const FeatureFlags = () => {
  const { data: flagsData, isLoading, refetch } = useGetFeatureFlagsQuery();
  const [toggleFeature] = useToggleFeatureMutation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleToggle = async (flagName, currentStatus) => {
    try {
      await toggleFeature({
        name: flagName,
        isEnabled: !currentStatus,
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to toggle feature:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Feature Flag
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {flagsData?.flags?.map((flag) => (
              <div key={flag._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {flag.name}
                      </h3>
                      <button
                        onClick={() => handleToggle(flag.name, flag.isEnabled)}
                        className={`inline-flex items-center ${
                          flag.isEnabled ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {flag.isEnabled ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {flag.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Rollout: {flag.rolloutPercentage}%</span>
                      {flag.targetRoles?.length > 0 && (
                        <span>Roles: {flag.targetRoles.join(", ")}</span>
                      )}
                      {flag.startDate && (
                        <span>
                          Start: {new Date(flag.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        flag.isEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {flag.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// System Settings Component
const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { data: settingsData, isLoading } = useGetSystemSettingsQuery();
  const [updateSettings] = useUpdateSystemSettingsMutation();

  const settingCategories = [
    { id: "general", name: "General", icon: Settings },
    { id: "payment", name: "Payment", icon: BarChart3 },
    { id: "security", name: "Security", icon: Shield },
    { id: "features", name: "Features", icon: ToggleRight },
  ];

  const filteredSettings =
    settingsData?.settings?.filter(
      (setting) => setting.category === activeTab
    ) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === category.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {filteredSettings.map((setting) => (
              <div
                key={setting._id}
                className="flex items-center justify-between py-4 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {setting.key}
                  </h3>
                  {setting.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {setting.dataType === "boolean" ? (
                    <button
                      onClick={() => {
                        updateSettings({
                          settings: [
                            {
                              ...setting,
                              value: !setting.value,
                            },
                          ],
                        });
                      }}
                      className={`inline-flex items-center ${
                        setting.value ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {setting.value ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  ) : (
                    <input
                      type={setting.dataType === "number" ? "number" : "text"}
                      value={setting.value || ""}
                      onChange={(e) => {
                        updateSettings({
                          settings: [
                            {
                              ...setting,
                              value:
                                setting.dataType === "number"
                                  ? parseFloat(e.target.value)
                                  : e.target.value,
                            },
                          ],
                        });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Super Admin App Component
const SuperAdminApp = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "users", name: "User Management", icon: Users },
    { id: "settings", name: "System Settings", icon: Settings },
    { id: "features", name: "Feature Flags", icon: ToggleRight },
    { id: "security", name: "Security & Access", icon: Shield },
    { id: "audit", name: "Audit Logs", icon: FileText },
    { id: "backups", name: "Backups", icon: Archive },
    { id: "experiments", name: "A/B Testing", icon: TestTube },
    { id: "broadcast", name: "Broadcast", icon: Broadcast },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <BusinessDashboard />;
      case "users":
        return <UserManagement />;
      case "settings":
        return <SystemSettings />;
      case "features":
        return <FeatureFlags />;
      case "security":
        return <div>Security & Access Component</div>;
      case "audit":
        return <div>Audit Logs Component</div>;
      case "backups":
        return <div>Backup Management Component</div>;
      case "experiments":
        return <div>A/B Testing Component</div>;
      case "broadcast":
        return <div>Broadcast Management Component</div>;
      default:
        return <BusinessDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-lg">
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <Shield className="w-8 h-8 text-red-500 mr-2" />
          <h1 className="text-xl font-bold text-white">Super Admin</h1>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
            <Power className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{renderPage()}</main>
      </div>
    </div>
  );
};

export default SuperAdminApp;
