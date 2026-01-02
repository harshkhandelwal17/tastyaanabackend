import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Package,
  ChefHat,
  Filter,
  Eye,
  Download,
  Truck,
  MapPin,
  Phone,
  User,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const DailyThaliManagement = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [mealPlanCategories, setMealPlanCategories] = useState([]);

  // Price categories as specified by user
  const priceCategories = [50, 55, 65, 70, 80];

  useEffect(() => {
    fetchMealPlanCategories();
    if (activeTab === "today") {
      fetchTodayData();
    } else {
      fetchHistoryData();
    }
  }, [activeTab, selectedDate, dateRange]);

  const fetchMealPlanCategories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/v2/meal-plans`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setMealPlanCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching meal plan categories:", error);
    }
  };

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/v2/dailymeals/today`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setTodayData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching today data:", error);
      toast.error("Failed to fetch today's thali data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/v2/dailymeals/history`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setHistoryData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching history data:", error);
      toast.error("Failed to fetch thali history");
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceStats = (data) => {
    if (!data || !Array.isArray(data)) return {};

    const stats = {};
    priceCategories.forEach((price) => {
      stats[price] = data.filter((item) => item.price === price).length;
    });
    return stats;
  };

  const calculateMealPlanStats = (data) => {
    if (!data || !Array.isArray(data)) return {};

    const stats = {};
    data.forEach((item) => {
      const planName = item.mealPlan?.title || item.mealPlan?.name || "Unknown";
      stats[planName] = (stats[planName] || 0) + 1;
    });
    return stats;
  };

  const getDriverInfo = (thali) => {
    // This would typically come from your delivery/driver API
    return thali.driver || { name: "Not Assigned", phone: "N/A" };
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const PriceCategoryCard = ({ price, count, total }) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900">₹{price}</span>
          <span className="text-sm text-gray-500">{percentage}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">{count}</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">thalis</p>
      </div>
    );
  };

  const ThaliCard = ({ thali, showDriver = true }) => {
    const driver = getDriverInfo(thali);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {thali.user?.name || "Customer"}
              </h3>
              <p className="text-sm text-gray-600">
                {thali.mealPlan?.title || "Meal Plan"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">₹{thali.price}</p>
            <p className="text-xs text-gray-500 capitalize">{thali.shift}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">
              {thali.deliveryAddress?.street || "Address"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(thali.deliveryDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {showDriver && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
            <Truck className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {driver.name}
              </p>
              <p className="text-xs text-blue-700">{driver.phone}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const HistoryDateCard = ({ date, thalis }) => {
    const priceStats = calculatePriceStats(thalis);
    const totalThalis = thalis?.length || 0;
    const totalRevenue = thalis?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {new Date(date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{totalThalis}</span>
              </span>
              <span className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-600">
                  ₹{totalRevenue}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {priceCategories.map((price) => (
              <PriceCategoryCard
                key={price}
                price={price}
                count={priceStats[price] || 0}
                total={totalThalis}
              />
            ))}
          </div>

          <div className="space-y-3">
            {thalis?.slice(0, 3).map((thali, index) => (
              <ThaliCard key={index} thali={thali} showDriver={false} />
            ))}
            {thalis?.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{thalis.length - 3} more thalis
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Daily Thali Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor and manage daily meal deliveries
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "today", label: "Today's Thali", icon: Activity },
                { id: "history", label: "Thali History", icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {activeTab === "today" ? (
          /* Today's Thali Section */
          <div className="space-y-8">
            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Thalis Today"
                value={todayData?.length || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Morning Deliveries"
                value={
                  todayData?.filter((t) => t.shift === "morning").length || 0
                }
                icon={Clock}
                color="orange"
              />
              <StatCard
                title="Evening Deliveries"
                value={
                  todayData?.filter((t) => t.shift === "evening").length || 0
                }
                icon={Clock}
                color="purple"
              />
              <StatCard
                title="Total Revenue"
                value={`₹${
                  todayData?.reduce((sum, t) => sum + (t.price || 0), 0) || 0
                }`}
                icon={DollarSign}
                color="green"
              />
            </div>

            {/* Price Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Thalis by Price Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {priceCategories.map((price) => {
                  const count =
                    todayData?.filter((t) => t.price === price).length || 0;
                  return (
                    <PriceCategoryCard
                      key={price}
                      price={price}
                      count={count}
                      total={todayData?.length || 0}
                    />
                  );
                })}
              </div>
            </div>

            {/* Meal Plan Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Thalis by Meal Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calculateMealPlanStats(todayData)).map(
                  ([plan, count]) => (
                    <div
                      key={plan}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{plan}</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {count}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">thalis</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Today's Thali List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Deliveries ({todayData?.length || 0})
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading thalis...</span>
                </div>
              ) : todayData?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayData.map((thali, index) => (
                    <ThaliCard key={index} thali={thali} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No thalis scheduled
                  </h3>
                  <p className="text-gray-600">
                    No meal deliveries found for today.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Thali History Section */
          <div className="space-y-8">
            {/* Date Range Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Thali History
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      From:
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      To:
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* History Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Days"
                value={
                  historyData?.length || 0
                }
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Total Thalis"
                value={
                  historyData?.reduce(
                    (sum, day) => sum + (day.thalis?.length || 0),
                    0
                  ) || 0
                }
                icon={Package}
                color="green"
              />
              <StatCard
                title="Average per Day"
                value={
                  historyData?.length > 0
                    ? Math.round(
                        historyData.reduce(
                          (sum, day) => sum + (day.thalis?.length || 0),
                          0
                        ) / historyData.length
                      )
                    : 0
                }
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* History List */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading history...</span>
                </div>
              ) : historyData?.length > 0 ? (
                historyData.map((dayData, index) => (
                  <HistoryDateCard
                    key={index}
                    date={dayData.date}
                    thalis={dayData.thalis}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No history data
                  </h3>
                  <p className="text-gray-600">
                    No thali data found for the selected date range.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyThaliManagement;
