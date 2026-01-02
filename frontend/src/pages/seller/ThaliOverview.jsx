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
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ThaliOverview = () => {
  const [thaliData, setThaliData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState("both");
  const [viewMode, setViewMode] = useState("overview"); // 'overview' or 'preparation'
  const [preparationSummary, setPreparationSummary] = useState([]);

  useEffect(() => {
    fetchThaliData();
  }, [selectedDate, selectedShift]);

  const fetchThaliData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/seller/thali-overview`,
        {
          params: {
            date: selectedDate,
            shift: selectedShift,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log(response);
      if (response.data.success) {
        setThaliData(response.data.data.thaliDetails);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching thali data:", error);
      toast.error("Failed to fetch thali overview");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreparationSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/seller/thali-preparation`,
        {
          params: {
            date: selectedDate,
            shift: selectedShift,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setPreparationSummary(response.data.data.preparationSummary);
      }
    } catch (error) {
      console.error("Error fetching preparation summary:", error);
      toast.error("Failed to fetch preparation summary");
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === "preparation") {
      fetchPreparationSummary();
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-8 w-8 text-${color}-500`} />
      </div>
    </div>
  );

  const ThaliCard = ({ thali }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            {thali.finalThali.image ? (
              <img
                src={thali.finalThali.image}
                alt={thali.finalThali.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <ChefHat className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {thali.userName}
            </h3>
            <p className="text-sm text-gray-600">{thali.subscriptionId}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 capitalize">
                {thali.shift}
              </span>
              <span className="text-sm text-gray-600">
                • {thali.thaliCount} Thali(s)
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ₹{thali.totalPrice}
          </p>
          {thali.isReplaced && (
            <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Replaced
            </span>
          )}
        </div>
      </div>

      {/* Thali Details */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base/Final Thali */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {thali.isReplaced ? "Replaced Thali" : "Thali"}
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">
                {thali.finalThali.name}
              </p>
              <p className="text-sm text-gray-600">
                {thali.finalThali.description}
              </p>
              {thali.finalThali.items && thali.finalThali.items.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Items:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {thali.finalThali.items.map((item, index) => (
                      <span
                        key={index}
                        className="bg-white text-xs px-2 py-1 rounded border"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {thali.isReplaced && (
                <p className="text-xs text-orange-600 mt-1">
                  Original: {thali.baseThali.name}
                </p>
              )}
            </div>
          </div>

          {/* Customizations */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Customizations</h4>
            <div className="space-y-2">
              {/* Preferences */}
              {thali.preferences &&
                Object.keys(thali.preferences).length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Preferences
                    </p>
                    {thali.preferences.dietaryPreference && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                        {thali.preferences.dietaryPreference}
                      </span>
                    )}
                    {thali.preferences.spiceLevel && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                        {thali.preferences.spiceLevel} spice
                      </span>
                    )}
                    {thali.preferences.preferences && (
                      <div className="mt-1">
                        {thali.preferences.preferences.noOnion && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1">
                            No Onion
                          </span>
                        )}
                        {thali.preferences.preferences.noGarlic && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1">
                            No Garlic
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Addons */}
              {thali.addons && thali.addons.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Add-ons
                  </p>
                  {thali.addons.map((addon, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {addon.name} x{addon.quantity}
                      </span>
                      <span className="font-medium">₹{addon.totalPrice}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Items */}
              {thali.extraItems && thali.extraItems.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-800 mb-1">
                    Extra Items
                  </p>
                  {thali.extraItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
          <p className="text-sm text-gray-600">
            {thali.deliveryAddress?.street}, {thali.deliveryAddress?.city} -{" "}
            {thali.deliveryAddress?.pincode}
          </p>
          {thali.deliveryAddress?.instructions && (
            <p className="text-xs text-gray-500 mt-1">
              Note: {thali.deliveryAddress.instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const PreparationSummaryCard = ({ summary }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {summary.thaliName}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">
              {summary.shift}
            </span>
            <span className="text-sm text-gray-600">
              • {summary.count} Total
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{summary.count}</p>
          <p className="text-sm text-gray-600">Thalis</p>
        </div>
      </div>

      {/* Thali Items */}
      {summary.items && summary.items.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Base Items</h4>
          <div className="flex flex-wrap gap-2">
            {summary.items.map((item, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons Summary */}
      {Object.keys(summary.addons || {}).length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Add-ons Required</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(summary.addons).map(([name, quantity]) => (
              <div
                key={name}
                className="bg-green-50 border border-green-200 rounded-lg p-2"
              >
                <p className="text-sm font-medium text-green-800">{name}</p>
                <p className="text-lg font-bold text-green-600">{quantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extra Items Summary */}
      {Object.keys(summary.extraItems || {}).length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Extra Items Required
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(summary.extraItems).map(([name, quantity]) => (
              <div
                key={name}
                className="bg-purple-50 border border-purple-200 rounded-lg p-2"
              >
                <p className="text-sm font-medium text-purple-800">{name}</p>
                <p className="text-lg font-bold text-purple-600">{quantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer List */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">
          Customers ({summary.customers?.length || 0})
        </h4>
        <div className="max-h-40 overflow-y-auto">
          {summary.customers?.map((customer, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {customer.name}
                </p>
                <p className="text-xs text-gray-600">
                  {customer.address?.street}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {customer.count} thali(s)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading thali overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Thali Overview
                </h1>
                <p className="text-gray-600">
                  Manage daily thali deliveries and customizations
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewModeChange("overview")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === "overview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => handleViewModeChange("preparation")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === "preparation"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ChefHat className="h-4 w-4 inline mr-2" />
                  Preparation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="both">Both Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {statistics && Object.keys(statistics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Morning Thalis"
              value={statistics.morning?.totalThalis || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Evening Thalis"
              value={statistics.evening?.totalThalis || 0}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${(
                (statistics.morning?.totalRevenue || 0) +
                (statistics.evening?.totalRevenue || 0)
              ).toLocaleString()}`}
              icon={Package}
              color="purple"
            />
            <StatCard
              title="Unique Thali Types"
              value={
                [
                  ...(statistics.morning?.uniqueThaliTypes || []),
                  ...(statistics.evening?.uniqueThaliTypes || []),
                ].filter((v, i, a) => a.indexOf(v) === i).length
              }
              icon={ChefHat}
              color="orange"
            />
          </div>
        )}

        {/* Content */}
        {viewMode === "overview" ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Thali Details ({thaliData.length})
              </h2>
            </div>

            {thaliData.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No thalis scheduled
                </h3>
                <p className="text-gray-600">
                  No thali deliveries found for the selected date and shift.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {thaliData.map((thali, index) => (
                  <ThaliCard key={index} thali={thali} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Preparation Summary ({preparationSummary.length} types)
              </h2>
            </div>

            {preparationSummary.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No preparation data
                </h3>
                <p className="text-gray-600">
                  No thali preparation data found for the selected date and
                  shift.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {preparationSummary.map((summary, index) => (
                  <PreparationSummaryCard key={index} summary={summary} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThaliOverview;
