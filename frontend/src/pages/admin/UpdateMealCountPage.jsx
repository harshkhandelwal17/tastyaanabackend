import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const UpdateMealCountPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [bulkUpdateValue, setBulkUpdateValue] = useState("");

  // Mock data - replace with actual API call
  useEffect(() => {
    setTimeout(() => {
      setSubscriptions([
        {
          id: 1,
          subscriptionId: "SUB_001",
          userName: "Harsh Kumar",
          userEmail: "harsh@example.com",
          mealPlan: "Standard Thali",
          remainingMeals: 15,
          totalMeals: 30,
          startDate: "2024-01-01",
          endDate: "2024-01-31",
          status: "active",
          lastUpdated: "2024-01-15",
        },
        {
          id: 2,
          subscriptionId: "SUB_002",
          userName: "Amit Singh",
          userEmail: "amit@example.com",
          mealPlan: "Premium Thali",
          remainingMeals: 5,
          totalMeals: 25,
          startDate: "2024-01-10",
          endDate: "2024-02-10",
          status: "active",
          lastUpdated: "2024-01-14",
        },
        {
          id: 3,
          subscriptionId: "SUB_003",
          userName: "Priya Sharma",
          userEmail: "priya@example.com",
          mealPlan: "Basic Thali",
          remainingMeals: 0,
          totalMeals: 20,
          startDate: "2024-01-05",
          endDate: "2024-01-25",
          status: "expired",
          lastUpdated: "2024-01-13",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMealCountUpdate = (subscriptionId, newCount) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? {
              ...sub,
              remainingMeals: parseInt(newCount),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : sub
      )
    );
  };

  const handleBulkUpdate = () => {
    if (!bulkUpdateValue || selectedSubscriptions.length === 0) return;

    setSubscriptions((prev) =>
      prev.map((sub) =>
        selectedSubscriptions.includes(sub.id)
          ? {
              ...sub,
              remainingMeals: parseInt(bulkUpdateValue),
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : sub
      )
    );

    setSelectedSubscriptions([]);
    setBulkUpdateValue("");
  };

  const toggleSelectSubscription = (subscriptionId) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(subscriptionId)
        ? prev.filter((id) => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  const selectAllSubscriptions = () => {
    if (selectedSubscriptions.length === filteredSubscriptions.length) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(filteredSubscriptions.map((sub) => sub.id));
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.subscriptionId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMealCountColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return "text-green-600";
    if (percentage > 20) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Update Subscription Meal Count
        </h1>
        <p className="text-gray-600">
          Manage and update remaining meal counts for active subscriptions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Subscriptions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter((s) => s.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Meals</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  subscriptions.filter(
                    (s) => s.remainingMeals <= 5 && s.status === "active"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter((s) => s.status === "expired").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, email, or subscription ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSubscriptions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <span className="text-sm font-medium text-blue-800">
                  {selectedSubscriptions.length} subscription(s) selected
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="New meal count"
                    className="px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                    value={bulkUpdateValue}
                    onChange={(e) => setBulkUpdateValue(e.target.value)}
                  />
                  <button
                    onClick={handleBulkUpdate}
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Update All
                  </button>
                  <button
                    onClick={() => setSelectedSubscriptions([])}
                    className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="hidden lg:block">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={
                    selectedSubscriptions.length ===
                      filteredSubscriptions.length &&
                    filteredSubscriptions.length > 0
                  }
                  onChange={selectAllSubscriptions}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-3">User Details</div>
              <div className="col-span-2">Subscription ID</div>
              <div className="col-span-2">Meal Plan</div>
              <div className="col-span-2">Meal Count</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="divide-y">
          {filteredSubscriptions.map((subscription) => (
            <div key={subscription.id} className="p-4 hover:bg-gray-50">
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSubscriptions.includes(subscription.id)}
                    onChange={() => toggleSelectSubscription(subscription.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {subscription.userName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Email: {subscription.userEmail}</p>
                      <p>ID: {subscription.subscriptionId}</p>
                      <p>Plan: {subscription.mealPlan}</p>
                      <div className="flex items-center gap-2">
                        <span>Meals:</span>
                        <span
                          className={`font-medium ${getMealCountColor(
                            subscription.remainingMeals,
                            subscription.totalMeals
                          )}`}
                        >
                          {subscription.remainingMeals}/
                          {subscription.totalMeals}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        value={subscription.remainingMeals}
                        onChange={(e) =>
                          handleMealCountUpdate(subscription.id, e.target.value)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max={subscription.totalMeals}
                      />
                      <button
                        onClick={() =>
                          handleMealCountUpdate(
                            subscription.id,
                            subscription.remainingMeals
                          )
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedSubscriptions.includes(subscription.id)}
                      onChange={() => toggleSelectSubscription(subscription.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {subscription.userName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {subscription.userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="font-mono text-sm">
                      {subscription.subscriptionId}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-sm">{subscription.mealPlan}</span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={subscription.remainingMeals}
                        onChange={(e) =>
                          handleMealCountUpdate(subscription.id, e.target.value)
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        min="0"
                        max={subscription.totalMeals}
                      />
                      <span className="text-sm text-gray-600">
                        /{subscription.totalMeals}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        subscription.status
                      )}`}
                    >
                      {subscription.status}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <button
                      onClick={() =>
                        handleMealCountUpdate(
                          subscription.id,
                          subscription.remainingMeals
                        )
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No subscriptions found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateMealCountPage;
