import { useEffect, useState } from "react";
import { useAuth } from "../../hook/useAuth";
import {
  Store,
  AlertTriangle,
  PackageCheck,
  DollarSign,
  ListOrdered,
  Power,
  PowerOff,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Eye,
  Activity,
  Calendar,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  useGetUserQuery,
  useGetSellerDashboardQuery,
  useToggleStoreStatusMutation,
} from "../../redux/storee/api";

const DashboardPage = () => {
  const { user: authUser } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user data
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserQuery({ userId: authUser?.uid }, { skip: !authUser });

  // Fetch seller dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetSellerDashboardQuery(undefined, {
    skip: !user?.isSeller,
    refetchOnMountOrArgChange: true,
  });

  // Toggle store status mutation
  const [toggleStoreStatus, { isLoading: isToggling }] =
    useToggleStoreStatusMutation();

  // Handle store status toggle
  const handleToggleStoreStatus = async () => {
    try {
      await toggleStoreStatus().unwrap();
      refetchDashboard();
    } catch (error) {
      console.error("Error toggling store status:", error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Loading state
  if (isUserLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (userError || dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading dashboard
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {userError?.data?.message ||
              dashboardError?.data?.message ||
              "Something went wrong while loading your dashboard."}
          </p>
          <button
            onClick={() => {
              if (userError) refetchUser();
              if (dashboardError) refetchDashboard();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const Card = ({ children, className = "" }) => (
    <div
      className={`bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
  const SummaryCard = ({ icon, title, value, linkText }) => (
    <Card>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
        <a
          href="#"
          className="text-sm font-medium text-green-600 hover:text-green-800"
        >
          {linkText}
        </a>
      </div>
      <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-800">
        {value}
      </h3>
      <p className="text-sm text-slate-500">{title}</p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar}
                  alt="Store Logo"
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {user?.storeName}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Store size={14} className="mr-1" /> Seller Dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date/Time */}
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-500">
                  {currentDateTime.toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {currentDateTime.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh dashboard"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Store Status Toggle */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {dashboardData?.isStoreOpen ? "Store Online" : "Store Offline"}
                  </p>
                  <p className="text-xs text-gray-500">Click to toggle</p>
                </div>
                <button
                  onClick={handleToggleStoreStatus}
                  disabled={isToggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    dashboardData?.isStoreOpen ? 'bg-green-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dashboardData?.isStoreOpen ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  {isToggling && (
                    <Loader2 className="absolute inset-0 h-4 w-4 m-1 animate-spin text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Here's what's happening with your store today.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<ListOrdered size={20} className="text-blue-600" />}
            title="Today's Orders"
            value={dashboardData?.todayStats?.orders || 0}
            subtitle="New orders received"
          />
          <MetricCard
            icon={<DollarSign size={20} className="text-green-600" />}
            title="Revenue Today"
            value={`₹${(dashboardData?.todayStats?.revenue || 0).toLocaleString('en-IN')}`}
            subtitle="Gross revenue"
          />
          <MetricCard
            icon={<PackageCheck size={20} className="text-orange-600" />}
            title="Pending Orders"
            value={dashboardData?.todayStats?.pendingDeliveries || 0}
            subtitle="Awaiting fulfillment"
          />
          <MetricCard
            icon={<AlertTriangle size={20} className="text-red-600" />}
            title="Low Stock Items"
            value={dashboardData?.inventoryAlerts?.length || 0}
            subtitle="Need attention"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View detailed analytics
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.totalCustomers || 0}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-lg">
                  <Eye size={20} className="text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.storeViews || 0}</p>
                <p className="text-sm text-gray-600">Store Views</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-green-100 rounded-lg">
                  <BarChart3 size={20} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.conversionRate || '0'}%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Calendar size={16} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {dashboardData?.recentActivity?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4">
                  <Activity size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
