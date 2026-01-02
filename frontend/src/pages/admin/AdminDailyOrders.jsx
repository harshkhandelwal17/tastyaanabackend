import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useGetDailySubscriptionMealsQuery,
  useGetMealPlansQuery,
  useUpdateDailyMealStatusMutation,
  useExportDailyMealsQuery,
  useGetUserDailyMealsQuery,
} from "../../redux/storee/api";
import {
  FaUsers,
  FaUtensils,
  FaExchangeAlt,
  FaTimes,
  FaDownload,
  FaFilter,
  FaCalendarAlt,
  FaClock,
  FaUserCheck,
  FaSpinner,
  FaEye,
  FaMapMarkerAlt,
  FaPhone,
  FaTag,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSearch,
  FaFileExport,
  FaSun,
  FaMoon,
  FaClipboardList,
  FaCog,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Tab } from "@headlessui/react";

const AdminDailyMealsPage = () => {
  // State management
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedShift, setSelectedShift] = useState("all"); // all, morning, evening
  const [selectedStatus, setSelectedStatus] = useState("all"); // all, active, skipped, replaced
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Morning, 2: Evening

  // RTK Query hooks
  const {
    data: dailyMealsData,
    isLoading,
    error,
    refetch,
  } = useGetDailySubscriptionMealsQuery({
    date: selectedDate,
    shift: selectedShift,
    status: selectedStatus,
    planId: selectedPlan,
    search: searchTerm,
  });

  const { data: mealPlansData } = useGetMealPlansQuery();
  const [updateMealStatus] = useUpdateDailyMealStatusMutation();

  const dailyMeals = dailyMealsData?.data || [];
  const mealPlans = mealPlansData?.data || [];
  const summary = dailyMealsData?.summary || {};

  // Filter data based on active tab
  const filteredMeals = useMemo(() => {
    let filtered = dailyMeals;

    switch (activeTab) {
      case 1: // Morning
        filtered = dailyMeals.filter((meal) => meal.shift === "morning");
        break;
      case 2: // Evening
        filtered = dailyMeals.filter((meal) => meal.shift === "evening");
        break;
      default: // All
        filtered = dailyMeals;
    }

    return filtered;
  }, [dailyMeals, activeTab]);

  // Group meals by status for better organization
  const groupedMeals = useMemo(() => {
    const groups = {
      active: [],
      skipped: [],
      replaced: [],
      customized: [],
    };

    filteredMeals.forEach((meal) => {
      if (meal.isSkipped) {
        groups.skipped.push(meal);
      } else if (meal.isReplaced) {
        groups.replaced.push(meal);
      } else if (meal.isCustomized) {
        groups.customized.push(meal);
      } else {
        groups.active.push(meal);
      }
    });

    return groups;
  }, [filteredMeals]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredMeals.length;
    const active = groupedMeals.active.length;
    const skipped = groupedMeals.skipped.length;
    const replaced = groupedMeals.replaced.length;
    const customized = groupedMeals.customized.length;

    return {
      total,
      active,
      skipped,
      replaced,
      customized,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
      skippedPercentage: total > 0 ? Math.round((skipped / total) * 100) : 0,
    };
  }, [groupedMeals]);

  // Handle status update
  const handleStatusUpdate = async (mealId, newStatus) => {
    try {
      await updateMealStatus({
        mealId,
        status: newStatus,
        date: selectedDate,
      }).unwrap();

      toast.success(`Meal status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update meal status");
      console.error("Update error:", error);
    }
  };

  // Export functionality
  const handleExport = () => {
    const exportData = {
      date: selectedDate,
      shift: selectedShift,
      status: selectedStatus,
      planId: selectedPlan,
    };

    // Trigger export download
    window.open(
      `/api/admin/daily-meals/export?${new URLSearchParams(exportData)}`,
      "_blank"
    );
  };

  const tabs = [
    { name: "Both Shifts", icon: FaClipboardList, count: stats.total },
    {
      name: "Morning",
      icon: FaSun,
      count: dailyMeals.filter((m) => m.shift === "morning").length,
    },
    {
      name: "Evening",
      icon: FaMoon,
      count: dailyMeals.filter((m) => m.shift === "evening").length,
    },
  ];

  const statusColors = {
    active: "bg-green-100 text-green-800",
    skipped: "bg-red-100 text-red-800",
    replaced: "bg-blue-100 text-blue-800",
    customized: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Daily Subscription Meals
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and track daily meal deliveries for{" "}
                  {format(parseISO(selectedDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaFilter className="mr-2" />
                  Filters
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaFileExport className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="skipped">Skipped</option>
                  <option value="replaced">Replaced</option>
                  <option value="customized">Customized</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Plans</option>
                  {mealPlans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search User
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                    setSelectedShift("all");
                    setSelectedStatus("all");
                    setSelectedPlan("all");
                    setSearchTerm("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">Total Meals</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTimesCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.skipped}
                </div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExchangeAlt className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.replaced}
                </div>
                <div className="text-sm text-gray-600">Replaced</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCog className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.customized} {console.log(stats)}
                </div>
                <div className="text-sm text-gray-600">Customized</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex space-x-1 rounded-t-lg bg-blue-900/20 p-1">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ${
                      selected
                        ? "bg-white shadow"
                        : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  </div>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {tabs.map((tab, index) => (
                <Tab.Panel key={index} className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                      <span className="ml-2 text-gray-600">
                        Loading meals...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Error Loading Data
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {error?.message || "Failed to load daily meals"}
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredMeals.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUtensils className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No Meals Found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No meals match your current filters for this date and
                        shift.
                      </p>
                    </div>
                  ) : (
                    <MealsList
                      meals={filteredMeals}
                      onStatusUpdate={handleStatusUpdate}
                      onUserClick={(user) => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                    />
                  )}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Meals List Component
const MealsList = ({ meals, onStatusUpdate, onUserClick }) => {
  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <MealCard
          key={`${meal.user._id}-${meal.shift}-${meal.date}`}
          meal={meal}
          onStatusUpdate={onStatusUpdate}
          onUserClick={onUserClick}
        />
      ))}
    </div>
  );
};

// Individual Meal Card Component
const MealCard = ({ meal, onStatusUpdate, onUserClick }) => {
  const getStatusIcon = (meal) => {
    if (meal.isSkipped)
      return <FaTimesCircle className="h-5 w-5 text-red-500" />;
    if (meal.isReplaced)
      return <FaExchangeAlt className="h-5 w-5 text-blue-500" />;
    if (meal.isCustomized) return <FaCog className="h-5 w-5 text-purple-500" />;
    return <FaCheckCircle className="h-5 w-5 text-green-500" />;
  };
  console.log(meal);
  const getStatusText = (meal) => {
    if (meal.isSkipped) return "Skipped";
    if (meal.isReplaced) return "Replaced";
    if (meal.isCustomized) return "Customized";
    return "Active";
  };

  const getStatusColor = (meal) => {
    if (meal.isSkipped) return "bg-red-100 text-red-800";
    if (meal.isReplaced) return "bg-blue-100 text-blue-800";
    if (meal.isCustomized) return "bg-purple-100 text-purple-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* User Info */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
              <FaUserCheck className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUserClick(meal.user)}
                className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
              >
                {meal.user.name}
              </button>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  meal
                )}`}
              >
                {getStatusIcon(meal)}
                <span className="ml-1">{getStatusText(meal)}</span>
              </span>
            </div>

            <div className="mt-1 flex items-center text-sm text-gray-500">
              <FaPhone className="mr-1" />
              {meal.user.phone}
              <span className="mx-2">•</span>
              <span>{meal.user.email}</span>
            </div>

            {meal.user.address && (
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="mr-1" />
                {meal.user.address.line1}, {meal.user.address.city}
              </div>
            )}
          </div>
        </div>

        {/* Meal Info */}
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                meal.shift === "morning"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {meal.shift === "morning" ? (
                <FaSun className="mr-1" />
              ) : (
                <FaMoon className="mr-1" />
              )}
              {meal.shift.charAt(0).toUpperCase() + meal.shift.slice(1)}
            </span>
            <span className="text-sm text-gray-500">{meal.mealPlan.name}</span>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {meal.isReplaced
                ? meal.replacementThali.name
                : meal.mealPlan.name}
            </div>
            {meal.isReplaced && (
              <div className="text-xs text-blue-600 flex items-center">
                <FaTag className="mr-1" />
                Replacement
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meal Details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Meal */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {meal.isCustomized ? "Original Meal:" : "Meal Details:"}
          </h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">
              {meal.mealPlan.title}
            </div>
            {meal.mealPlan.items && meal.mealPlan.items.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                {meal.mealPlan.items
                  .slice(0, 3)
                  .map((item) => item.name)
                  .join(", ")}
                {meal.mealPlan.items.length > 3 &&
                  ` +${meal.mealPlan.items.length - 3} more`}
              </div>
            )}
          </div>
        </div>

        {/* Replacement/Customization Details */}
        {(meal.isReplaced || meal.isCustomized) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {meal.isReplaced ? "Replacement:" : "Customization:"}
            </h4>
            <div className="bg-blue-50 rounded-lg p-3">
              {meal.isReplaced && (
                <>
                  <div className="text-sm font-medium text-blue-900">
                    {meal.replacementThali.name}
                  </div>
                  {meal.replacementThali.items && (
                    <div className="text-xs text-blue-700 mt-1">
                      {meal.replacementThali.items
                        .slice(0, 3)
                        .map((item) => item.name)
                        .join(", ")}
                      {meal.replacementThali.items.length > 3 &&
                        ` +${meal.replacementThali.items.length - 3} more`}
                    </div>
                  )}
                </>
              )}

              {meal.isCustomized && meal.customizationReplacementMeal && (
                <div className="space-y-1">
                  {/* {meal.customizationReplacementMeal
                     .slice(0, 3)
                    .map((custom, index) => (
                      <div key={index} className="text-xs text-purple-700">
                        {custom.type}: {custom.value}
                      </div>
                    ))}
                  {meal.customizations.length > 3 && (
                    <div className="text-xs text-purple-600">
                      +{meal.customizations.length - 3} more customizations
                    </div>
                  )} */}
                  {meal.customizationReplacementMeal.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Skip Reason */}
      {meal.isSkipped && meal.skipReason && (
        <div className="mt-4">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm font-medium text-red-900">Skip Reason:</div>
            <div className="text-xs text-red-700 mt-1">{meal.skipReason}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => onUserClick(meal.user)}
          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <FaEye className="mr-1" />
          View User
        </button>
      </div>
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: User Info, 1: Today's Meals, 2: Meal History
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Get user's meals for selected date
  const { data: userMealsData, isLoading: isLoadingMeals } =
    useGetUserDailyMealsQuery({
      userId: user._id,
      date: selectedDate,
    });

  const userMeals = userMealsData?.data || [];
  // console.log(userMealsData);
  const modalTabs = [
    { name: "User Info", icon: FaUserCheck },
    { name: "Today's Meals", icon: FaUtensils },
    { name: "Meal History", icon: FaCalendarAlt },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaUserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">
                    {user.name}
                  </h3>
                  <p className="text-blue-100 text-sm">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {modalTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === index
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* User Info Tab */}
            {activeTab === 0 && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center">
                      <FaUserCheck className="mr-2 text-blue-600" />
                      Basic Information
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {user.name}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {user.email}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded flex items-center">
                          <FaPhone className="mr-2 text-gray-400" />
                          {user.phone}
                        </div>
                      </div>

                      {user.dateOfBirth && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                            {format(new Date(user.dateOfBirth), "MMMM d, yyyy")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address & Subscription Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-green-600" />
                      Address & Subscription
                    </h4>

                    {user.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Delivery Address
                        </label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                          <div className="flex items-start">
                            <FaMapMarkerAlt className="mr-2 text-gray-400 mt-1" />
                            <div>
                              <div>{user.address.line1}</div>
                              {user.address.line2 && (
                                <div>{user.address.line2}</div>
                              )}
                              <div>
                                {user.address.city}, {user.address.state}
                              </div>
                              <div>PIN: {user.address.pincode}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.subscriptions && user.subscriptions.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Active Subscriptions
                        </label>
                        <div className="mt-1 space-y-2">
                          {user.subscriptions.map((sub, index) => (
                            <div
                              key={index}
                              className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-blue-900">
                                    {sub.mealPlan.name}
                                  </div>
                                  <div className="text-sm text-blue-700">
                                    Status: {sub.status}
                                  </div>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    sub.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {sub.status}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Today's Meals Tab */}
            {activeTab === 1 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center">
                    <FaUtensils className="mr-2 text-orange-600" />
                    Daily Meal Details
                  </h4>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {isLoadingMeals ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin h-6 w-6 text-blue-600 mr-2" />
                    <span>Loading meals...</span>
                  </div>
                ) : userMeals.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUtensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Meals Scheduled
                    </h3>
                    <p className="text-gray-600">
                      No meals found for{" "}
                      {format(parseISO(selectedDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userMeals.map((meal, index) => (
                      <MealDetailCard key={index} meal={meal} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meal History Tab */}
            {activeTab === 2 && (
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 text-lg flex items-center mb-4">
                  <FaCalendarAlt className="mr-2 text-purple-600" />
                  Recent Meal History
                </h4>
                <div className="text-center py-8">
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Meal history functionality coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Meal Detail Card Component
const MealDetailCard = ({ meal }) => {
  const getStatusIcon = (meal) => {
    if (meal.isSkipped)
      return <FaTimesCircle className="h-5 w-5 text-red-500" />;
    if (meal.isReplaced)
      return <FaExchangeAlt className="h-5 w-5 text-blue-500" />;
    if (meal.isCustomized) return <FaCog className="h-5 w-5 text-purple-500" />;
    return <FaCheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusColor = (meal) => {
    if (meal.isSkipped) return "bg-red-50 border-red-200";
    if (meal.isReplaced) return "bg-blue-50 border-blue-200";
    if (meal.isCustomized) return "bg-purple-50 border-purple-200";
    return "bg-green-50 border-green-200";
  };

  const getShiftIcon = (shift) => {
    return shift === "morning" ? (
      <FaSun className="h-4 w-4 text-yellow-500" />
    ) : (
      <FaMoon className="h-4 w-4 text-blue-500" />
    );
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(meal)}`}>
      {/* Meal Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getShiftIcon(meal.shift)}
          <div>
            <h5 className="font-medium text-gray-900">
              {meal.shift.charAt(0).toUpperCase() + meal.shift.slice(1)} Meal
            </h5>
            <p className="text-sm text-gray-600">
              {format(new Date(meal.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(meal)}
          <span className="text-sm font-medium">
            {meal.isSkipped
              ? "Skipped"
              : meal.isReplaced
              ? "Replaced"
              : meal.isCustomized
              ? "Customized"
              : "Active"}
          </span>
        </div>
      </div>

      {/* Meal Content */}
      <div className="space-y-4">
        {/* Original Meal Plan */}
        <div>
          <h6 className="font-medium text-gray-800 mb-2 flex items-center">
            <FaUtensils className="mr-2 h-4 w-4" />
            {meal.isReplaced || meal.isCustomized
              ? "Original Meal Plan"
              : "Meal Plan"}
          </h6>
          <div className="bg-white rounded-lg p-3 border">
            <div className="font-medium text-gray-900">
              {meal.mealPlan.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {meal.mealPlan.description}
            </div>

            {meal.mealPlan.items && meal.mealPlan.items.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Menu Items:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {meal.mealPlan.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.isVeg ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meal.mealPlan.addons && meal.mealPlan.addons.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Available Add-ons:
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.mealPlan.addons.map((addon, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                    >
                      {addon.name} (+₹{addon.price})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replacement Details */}
        {meal.isReplaced && meal.replacementThali && (
          <div>
            <h6 className="font-medium text-blue-800 mb-2 flex items-center">
              <FaExchangeAlt className="mr-2 h-4 w-4" />
              Replacement Meal
            </h6>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="font-medium text-blue-900">
                {meal.replacementThali.name}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {meal.replacementThali.description}
              </div>

              {meal.replacementThali.items &&
                meal.replacementThali.items.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      Replacement Items:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {meal.replacementThali.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-sm text-blue-700"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.isVeg ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {meal.replacementReason && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-blue-800">
                    Replacement Reason:
                  </div>
                  <div className="text-sm text-blue-700">
                    {meal.replacementReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customization Details */}
        {meal.isCustomized && meal.customizations && (
          <div>
            <h6 className="font-medium text-purple-800 mb-2 flex items-center">
              <FaCog className="mr-2 h-4 w-4" />
              Meal Customizations
            </h6>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="space-y-3">
                {meal.customizations.map((custom, index) => (
                  <div
                    key={index}
                    className="border-b border-purple-200 last:border-b-0 pb-2 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-purple-900 capitalize">
                          {custom.type.replace("-", " ")}
                        </div>
                        <div className="text-sm text-purple-700">
                          {custom.value}
                        </div>
                        {custom.description && (
                          <div className="text-xs text-purple-600 mt-1">
                            {custom.description}
                          </div>
                        )}
                      </div>
                      {custom.additionalCost && (
                        <div className="text-sm font-medium text-purple-800">
                          +₹{custom.additionalCost}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Add-ons */}
              {meal.selectedAddons && meal.selectedAddons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="text-sm font-medium text-purple-800 mb-2">
                    Selected Add-ons:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meal.selectedAddons.map((addon, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-xs rounded-full text-purple-800"
                      >
                        {addon.name} (+₹{addon.price})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Items */}
              {meal.selectedExtraItems &&
                meal.selectedExtraItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="text-sm font-medium text-purple-800 mb-2">
                      Extra Items:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meal.selectedExtraItems.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-xs rounded-full text-purple-800"
                        >
                          {item.name} (+₹{item.price})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Total Additional Cost */}
              {(meal.selectedAddons?.length > 0 ||
                meal.selectedExtraItems?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-800">
                      Total Additional Cost:
                    </span>
                    <span className="font-semibold text-purple-900">
                      +₹
                      {(
                        (meal.selectedAddons || []).reduce(
                          (sum, addon) => sum + addon.price,
                          0
                        ) +
                        (meal.selectedExtraItems || []).reduce(
                          (sum, item) => sum + item.price,
                          0
                        ) +
                        (meal.customizations || []).reduce(
                          (sum, custom) => sum + (custom.additionalCost || 0),
                          0
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skip Details */}
        {meal.isSkipped && (
          <div>
            <h6 className="font-medium text-red-800 mb-2 flex items-center">
              <FaTimesCircle className="mr-2 h-4 w-4" />
              Meal Skipped
            </h6>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              {meal.skipReason && (
                <>
                  <div className="text-sm font-medium text-red-800">
                    Reason:
                  </div>
                  <div className="text-sm text-red-700">{meal.skipReason}</div>
                </>
              )}
              {meal.skipDate && (
                <div className="text-xs text-red-600 mt-2">
                  Skipped on:{" "}
                  {format(new Date(meal.skipDate), "MMM d, yyyy 'at' h:mm a")}
                </div>
              )}
              {meal.refundAmount && (
                <div className="text-sm font-medium text-red-800 mt-2">
                  Refund Amount: ₹{meal.refundAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Information */}
        <div>
          <h6 className="font-medium text-gray-800 mb-2 flex items-center">
            <FaMapMarkerAlt className="mr-2 h-4 w-4" />
            Delivery Information
          </h6>
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="text-sm text-gray-700">
              <div>
                Expected Delivery:{" "}
                {meal.shift === "morning"
                  ? "7:00 AM - 9:00 AM"
                  : "6:00 PM - 8:00 PM"}
              </div>
              {meal.deliveryAddress && (
                <div className="mt-1">
                  Address: {meal.deliveryAddress.line1},{" "}
                  {meal.deliveryAddress.city}
                </div>
              )}
              {meal.deliveryInstructions && (
                <div className="mt-1">
                  Instructions: {meal.deliveryInstructions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDailyMealsPage;
