import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetDriverDailyDeliveriesQuery,
  useUpdateDeliveryStatusMutation,
  useBulkUpdateDeliveryStatusMutation,
} from "../../redux/storee/api";
import {
  FaTruck,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaUtensils,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaCog,
  FaFilter,
  FaSun,
  FaMoon,
  FaSpinner,
  FaCheck,
  FaCalendarDay,
  FaStore,
  FaBell,
  FaRedo,
  FaClock,
  FaRoute,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaArrowLeft,
  FaEye,
  FaSearch,
  FaUserCheck,
  FaTag,
  FaTimes,
  FaUsers,
  FaClipboardList,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Tab } from "@headlessui/react";
import DeliveryConfirmationDialog from "../../components/driver/DeliveryConfirmationDialog";

const DriverDeliveryDashboard = () => {
  const navigate = useNavigate();

  // State management
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDeliveries, setSelectedDeliveries] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationDelivery, setConfirmationDelivery] = useState(null);

  // Get current user (driver)
  const { user } = useSelector((state) => state.auth);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // RTK Query hooks
  const {
    data: deliveryData,
    isLoading,
    error,
    refetch,
  } = useGetDriverDailyDeliveriesQuery({
    date: selectedDate,
    shift: "both", // Always get both shifts, filter on frontend for tabs
    status: selectedStatus !== "all" ? selectedStatus : "all",
    search: debouncedSearchTerm,
    page: 1,
    limit: 50,
  });

  const [updateDeliveryStatus] = useUpdateDeliveryStatusMutation();
  const [bulkUpdateDeliveryStatus] = useBulkUpdateDeliveryStatusMutation();
  console.log(deliveryData);
  const deliveries = deliveryData?.data || [];
  const stats = deliveryData?.stats || {
    total: 0,
    pending: 0,
    delivered: 0,
    skipped: 0,
    replaced: 0,
    morning: 0,
    evening: 0,
    successRate: 0,
  };

  // Filter deliveries based on active tab for proper frontend display
  const filteredDeliveries = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return [];

    switch (activeTab) {
      case 1: // Morning tab
        return deliveries.filter((delivery) => delivery.shift === "morning");
      case 2: // Evening tab
        return deliveries.filter((delivery) => delivery.shift === "evening");
      default: // Both Shifts tab
        return deliveries;
    }
  }, [deliveries, activeTab]);

  // Delivery statistics are now provided by the API
  const deliveryStats = stats;

  // Handle single delivery status update with confirmation
  const handleSingleDeliveryUpdate = async (deliveryId, status, notes = "") => {
    // If status is 'delivered', show confirmation dialog first
    if (status === "delivered") {
      // Find the delivery details for confirmation
      const delivery = deliveries.find((d) => d._id === deliveryId);
      setConfirmationDelivery({
        id: deliveryId,
        status,
        notes,
        customerName: delivery?.user?.name || "N/A",
        address: delivery?.deliveryAddress?.street || "N/A",
        shift: delivery?.shift || "N/A",
      });
      setConfirmationAction("single");
      setShowConfirmation(true);
      return;
    }

    // For other statuses, update directly
    await performSingleDeliveryUpdate(deliveryId, status, notes);
  };

  // Perform the actual single delivery update
  const performSingleDeliveryUpdate = async (
    deliveryId,
    status,
    notes = ""
  ) => {
    try {
      setIsDelivering(true);
      await updateDeliveryStatus({
        deliveryId,
        status,
        notes,
        deliveredAt: new Date().toISOString(),
        driverId: user._id,
      }).unwrap();

      toast.success(
        `Delivery ${
          status === "delivered" ? "completed" : "updated"
        } successfully!`
      );
      setSelectedDeliveries((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deliveryId);
        return newSet;
      });
      refetch();
    } catch (error) {
      toast.error("Failed to update delivery status");
      console.error("Update error:", error);
    } finally {
      setIsDelivering(false);
    }
  };

  // Handle bulk delivery updates with confirmation
  const handleBulkDeliveryUpdate = async () => {
    if (selectedDeliveries.size === 0) {
      toast.error("Please select deliveries to update");
      return;
    }

    // Show confirmation dialog for bulk completion
    setConfirmationAction("bulk");
    setConfirmationDelivery(null);
    setShowConfirmation(true);
  };

  // Perform the actual bulk delivery update
  const performBulkDeliveryUpdate = async () => {
    try {
      setIsDelivering(true);
      const deliveryIds = Array.from(selectedDeliveries);

      await bulkUpdateDeliveryStatus({
        deliveryIds,
        status: "delivered",
        deliveredAt: new Date().toISOString(),
        driverId: user._id,
      }).unwrap();

      toast.success(`${deliveryIds.length} deliveries marked as completed!`);
      setSelectedDeliveries(new Set());
      refetch();
    } catch (error) {
      toast.error("Failed to update deliveries");
      console.error("Bulk update error:", error);
    } finally {
      setIsDelivering(false);
    }
  };

  // Handle confirmation dialog actions
  const handleConfirmCompletion = async () => {
    if (confirmationAction === "single" && confirmationDelivery) {
      await performSingleDeliveryUpdate(
        confirmationDelivery.id,
        confirmationDelivery.status,
        confirmationDelivery.notes
      );
    } else if (confirmationAction === "bulk") {
      await performBulkDeliveryUpdate();
    }

    // Close confirmation dialog
    setShowConfirmation(false);
    setConfirmationAction(null);
    setConfirmationDelivery(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
    setConfirmationDelivery(null);
  };

  // Handle delivery selection
  const toggleDeliverySelection = (deliveryId) => {
    setSelectedDeliveries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deliveryId)) {
        newSet.delete(deliveryId);
      } else {
        newSet.add(deliveryId);
      }
      return newSet;
    });
  };

  // Select all deliveries
  const selectAllDeliveries = () => {
    const pendingDeliveries = filteredDeliveries.filter(
      (d) =>
        d.deliveryStatus === "pending" &&
        !d.isSkipped &&
        d.canComplete !== false
    );
    setSelectedDeliveries(new Set(pendingDeliveries.map((d) => d._id)));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedDeliveries(new Set());
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 120000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getDateDisplay = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const tabs = [
    { name: "Both Shifts", icon: FaClipboardList, count: deliveryStats.total },
    { name: "Morning", icon: FaSun, count: deliveryStats.morning },
    { name: "Evening", icon: FaMoon, count: deliveryStats.evening },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center w-full sm:w-auto">
                <button
                  onClick={() => navigate("/driver/dashboard")}
                  className="mr-3 sm:mr-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Back to Main Dashboard"
                >
                  <FaArrowLeft className="text-gray-600" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                    <FaTruck className="mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Daily Delivery Dashboard</span>
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Manage deliveries for{" "}
                    <span className="hidden sm:inline">
                      {format(parseISO(selectedDate), "MMMM d, yyyy")}
                    </span>
                    <span className="sm:hidden">
                      {format(parseISO(selectedDate), "MMM d")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaRedo className="mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaFilter className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filter</span>
                </button>
                {selectedDeliveries.size > 0 && (
                  <button
                    onClick={handleBulkDeliveryUpdate}
                    disabled={isDelivering}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isDelivering ? (
                      <FaSpinner className="animate-spin mr-1 sm:mr-2" />
                    ) : (
                      <FaCheck className="mr-1 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">
                      Complete {selectedDeliveries.size} Selected
                    </span>
                    <span className="sm:hidden">
                      Complete ({selectedDeliveries.size})
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="skipped">Skipped</option>
                  <option value="replaced">Replaced</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Customer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
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
                    setSelectedStatus("all");
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveryStats.total}
                </div>
                <div className="text-sm text-gray-600">Total Deliveries</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveryStats.pending}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
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
                  {deliveryStats.delivered}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaSun className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveryStats.morning}
                </div>
                <div className="text-sm text-gray-600">Morning</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaMoon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {deliveryStats.evening}
                </div>
                <div className="text-sm text-gray-600">Evening</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDeliveries.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheck className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">
                  {selectedDeliveries.size} deliveries selected
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={clearAllSelections}
                  className="px-3 py-2 text-sm border border-blue-300 rounded text-blue-700 hover:bg-blue-100 touch-manipulation"
                >
                  Clear Selection
                </button>
                <button
                  onClick={selectAllDeliveries}
                  className="px-3 py-2 text-sm border border-blue-300 rounded text-blue-700 hover:bg-blue-100 touch-manipulation"
                >
                  Select All Pending
                </button>
                <button
                  onClick={handleBulkDeliveryUpdate}
                  disabled={isDelivering}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
                >
                  {isDelivering ? "Processing..." : "Mark All Delivered"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                        Loading deliveries...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Error Loading Deliveries
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {error?.message || "Failed to load deliveries"}
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No Deliveries Found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No deliveries match your current filters for this date.
                      </p>
                    </div>
                  ) : (
                    <DeliveryList
                      deliveries={filteredDeliveries}
                      selectedDeliveries={selectedDeliveries}
                      onToggleSelect={toggleDeliverySelection}
                      onUpdateStatus={handleSingleDeliveryUpdate}
                      isUpdating={isDelivering}
                      onViewDetails={(delivery) => {
                        setSelectedDelivery(delivery);
                        setShowDeliveryModal(true);
                      }}
                    />
                  )}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Delivery Detail Modal */}
      {showDeliveryModal && selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedDelivery(null);
          }}
          onUpdateStatus={handleSingleDeliveryUpdate}
          isUpdating={isDelivering}
        />
      )}

      {/* Confirmation Dialog */}
      <DeliveryConfirmationDialog
        isOpen={showConfirmation}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmCompletion}
        deliveryCount={
          confirmationAction === "bulk" ? selectedDeliveries.size : 1
        }
        deliveryDetails={
          confirmationDelivery
            ? {
                customerName: confirmationDelivery.customerName,
                address: confirmationDelivery.address,
                shift: confirmationDelivery.shift,
              }
            : null
        }
        isLoading={isDelivering}
      />
    </div>
  );
};

// Delivery List Component
const DeliveryList = ({
  deliveries,
  selectedDeliveries,
  onToggleSelect,
  onUpdateStatus,
  isUpdating,
  onViewDetails,
}) => {
  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <DeliveryCard
          key={`${delivery.user._id}-${delivery.shift}-${delivery.date}`}
          delivery={delivery}
          isSelected={selectedDeliveries.has(delivery._id)}
          onToggleSelect={() => onToggleSelect(delivery._id)}
          onUpdateStatus={onUpdateStatus}
          isUpdating={isUpdating}
          onViewDetails={() => onViewDetails(delivery)}
        />
      ))}
    </div>
  );
};

// Individual Delivery Card Component
const DeliveryCard = ({
  delivery,
  isSelected,
  onToggleSelect,
  onUpdateStatus,
  isUpdating,
  onViewDetails,
}) => {
  const getStatusIcon = (delivery) => {
    if (delivery.deliveryStatus === "delivered")
      return <FaCheckCircle className="h-5 w-5 text-green-500" />;
    if (delivery.isSkipped)
      return <FaTimesCircle className="h-5 w-5 text-red-500" />;
    if (delivery.isReplaced)
      return <FaExchangeAlt className="h-5 w-5 text-blue-500" />;
    if (delivery.isCustomized)
      return <FaCog className="h-5 w-5 text-purple-500" />;
    return <FaClock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusColor = (delivery) => {
    if (delivery.deliveryStatus === "delivered")
      return "bg-green-100 text-green-800";
    if (delivery.isSkipped) return "bg-red-100 text-red-800";
    if (delivery.isReplaced) return "bg-blue-100 text-blue-800";
    if (delivery.isCustomized) return "bg-purple-100 text-purple-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (delivery) => {
    if (delivery.deliveryStatus === "delivered") return "✅ Delivered";
    if (delivery.isSkipped)
      return `Skipped${
        delivery.skipReason ? ` (${delivery.skipReason.replace("_", " ")})` : ""
      }`;
    if (
      delivery.isCustomized &&
      delivery.customizationDetails?.replacementMeal
    ) {
      return `Customized (${
        delivery.customizationDetails.replacementMeal.name || "Custom Meal"
      })`;
    }
    if (delivery.isCustomized) return "Customized";
    if (delivery.isReplaced) return "Replaced Meal";
    return "Pending";
  };

  const isPending =
    (delivery.deliveryStatus === "pending" ||
      delivery.deliveryStatus === "customized" ||
      delivery.deliveryStatus === "replaced") &&
    !delivery.isSkipped;
  const canComplete = delivery.canComplete !== false && !delivery.isSkipped;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
          {/* Customer Info */}
          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Selection Checkbox - only show for deliverable meals */}
            {isPending && canComplete && (
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelect}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            )}

            <div className="flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-300 rounded-full flex items-center justify-center">
                <FaUserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {delivery.user.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    delivery
                  )}`}
                >
                  {getStatusIcon(delivery)}
                  <span className="ml-1">{getStatusText(delivery)}</span>
                </span>
              </div>

              <div className="mt-1 flex items-center text-sm text-gray-500">
                {/* <FaPhone className="mr-1" /> */}
                <a
                  href={`tel:${delivery.user.phone}`}
                  className="hover:text-blue-600"
                >
                  {delivery.user.phone}
                </a>
                {/* <span className="mx-2">•</span>
                <span>{delivery.user.email}</span> */}
              </div>

              {/* Address */}
              <div className="mt-2 flex items-start text-sm text-gray-500">
                <FaMapMarkerAlt className="mr-1 mt-0.5" />
                <div>
                  {delivery.deliveryAddress?.street}
                  {delivery.deliveryAddress?.area &&
                    `, ${delivery.deliveryAddress.area}`}
                  {delivery.deliveryAddress?.city &&
                    `, ${delivery.deliveryAddress.city}`}
                </div>
              </div>

              {/* Delivery Time & Shift */}
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    delivery.shift === "morning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {delivery.shift === "morning" ? (
                    <FaSun className="mr-1" />
                  ) : (
                    <FaMoon className="mr-1" />
                  )}
                  {delivery.shift.charAt(0).toUpperCase() +
                    delivery.shift.slice(1)}
                </span>
                <span className="text-gray-600">
                  {delivery.shift === "morning" ? "1:00-1:30 " : "8:00-9:00 PM"}
                </span>
              </div>
            </div>
          </div>

          {/* Meal Info & Actions */}
          <div className="flex flex-col sm:items-end space-y-3 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <div className="text-sm font-medium text-gray-900 break-words">
                {delivery.displayMealName ||
                  (delivery.isCustomized &&
                  delivery.customizationDetails?.replacementMeal
                    ? delivery.customizationDetails.replacementMeal.name
                    : delivery.isReplaced
                    ? delivery.replacementThali?.name
                    : delivery.mealPlan?.name)}
              </div>
              {delivery.isCustomized && (
                <div className="text-xs text-purple-600 flex items-center justify-start sm:justify-end mt-1">
                  <FaCog className="mr-1" />
                  {delivery.customizationDetails?.replacementMeal
                    ? "Custom Meal"
                    : "Customized"}
                </div>
              )}
              {delivery.isReplaced && !delivery.isCustomized && (
                <div className="text-xs text-blue-600 flex items-center justify-start sm:justify-end mt-1">
                  <FaTag className="mr-1" />
                  Replacement
                </div>
              )}
              {delivery?.seller && (
                <div className="text-xs text-gray-500 flex items-center justify-start sm:justify-end mt-1">
                  <FaStore className="mr-1" />
                  {delivery?.seller?.businessName || delivery?.seller?.name}
                </div>
              )}
              {console.log(delivery)}
              {delivery?.mealPlan && (
                <div className="text-xs text-gray-500 flex items-center justify-start sm:justify-end mt-1">
                  <FaTag className="mr-1" />
                  {delivery?.mealPlan?.title}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={onViewDetails}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 touch-manipulation"
              >
                <FaEye className="mr-1" />
                Details
              </button>

              {/* Show Complete button only if meal can be completed (not skipped) */}
              {isPending && canComplete && (
                <button
                  onClick={() => onUpdateStatus(delivery._id, "delivered")}
                  disabled={isUpdating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 touch-manipulation"
                >
                  {isUpdating ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <FaCheck className="mr-1" />
                  )}
                  Complete
                </button>
              )}

              {/* Show Delivered/Completed status */}
              {delivery.deliveryStatus === "delivered" && (
                <div className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded">
                  <FaCheckCircle className="mr-1" />
                  Completed
                </div>
              )}

              {/* Show message for skipped meals */}
              {delivery.isSkipped && (
                <div className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  <FaTimesCircle className="mr-1" />
                  <span className="hidden sm:inline">
                    Meal Skipped - No Delivery Required
                  </span>
                  <span className="sm:hidden">Skipped</span>
                </div>
              )}

              {/* Show customization info */}
              {delivery.isCustomized && (
                <div className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  <FaCog className="mr-1" />
                  Customized
                </div>
              )}

              {/* Show replacement info */}
              {delivery.isReplaced && (
                <div className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  <FaExchangeAlt className="mr-1" />
                  <span className="hidden sm:inline">Replacement Meal</span>
                  <span className="sm:hidden">Replacement</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Special Notes */}
        {(delivery.isReplaced ||
          delivery.isSkipped ||
          delivery.isCustomized ||
          delivery.deliveryAddress?.instructions) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {delivery.isCustomized && delivery.customizationDetails && (
              <div className="text-sm text-purple-700 bg-purple-50 rounded p-2 mb-2">
                <strong>Customization Details:</strong>
                {/* Show customization summary if available */}
                {delivery.customizationDetails.customizationSummary && (
                  <div className="mb-2 text-xs font-medium text-purple-800 border-l-2 border-purple-300 pl-2">
                    {delivery.customizationDetails.customizationSummary}
                  </div>
                )}
                {delivery.customizationDetails.replacementMeal && (
                  <div>
                    Replaced with:{" "}
                    {delivery.customizationDetails.replacementMeal.name}
                    {delivery.customizationDetails && (
                      <span className="text-xs ml-1">
                        (₹
                        {delivery.customizationDetails.totalpayablePrice}/
                        {delivery.customizationDetails.replacementMeal.price})
                      </span>
                    )}
                  </div>
                )}
                {delivery.customizationDetails.dietaryPreference &&
                  delivery.customizationDetails.dietaryPreference !==
                    "regular" && (
                    <div>
                      Diet: {delivery.customizationDetails.dietaryPreference}
                    </div>
                  )}
                {delivery.customizationDetails.spiceLevel &&
                  delivery.customizationDetails.spiceLevel !== "medium" && (
                    <div>Spice: {delivery.customizationDetails.spiceLevel}</div>
                  )}
                {/* Show dietary preferences */}
                {delivery.customizationDetails.preferences && (
                  <div>
                    {[
                      delivery.customizationDetails.preferences.noOnion &&
                        "No Onion",
                      delivery.customizationDetails.preferences.noGarlic &&
                        "No Garlic",
                      delivery.customizationDetails.preferences.noDairy &&
                        "No Dairy",
                      delivery.customizationDetails.preferences.noNuts &&
                        "No Nuts",
                    ].filter(Boolean).length > 0 && (
                      <div>
                        Avoid:{" "}
                        {[
                          delivery.customizationDetails.preferences.noOnion &&
                            "No Onion",
                          delivery.customizationDetails.preferences.noGarlic &&
                            "No Garlic",
                          delivery.customizationDetails.preferences.noDairy &&
                            "No Dairy",
                          delivery.customizationDetails.preferences.noNuts &&
                            "No Nuts",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                    {delivery.customizationDetails.preferences
                      .specialInstructions && (
                      <div>
                        Special:{" "}
                        {
                          delivery.customizationDetails.preferences
                            .specialInstructions
                        }
                      </div>
                    )}
                  </div>
                )}
                {delivery.customizationDetails.addons?.length > 0 && (
                  <div>
                    Add-ons:{" "}
                    {delivery.customizationDetails.addons
                      .map(
                        (addon) =>
                          `${addon.name || addon.item?.name || "Add-on"} (x${
                            addon.quantity || 1
                          })`
                      )
                      .join(", ")}
                  </div>
                )}
                {delivery.customizationDetails.extraItems?.length > 0 && (
                  <div>
                    Extras:{" "}
                    {delivery.customizationDetails.extraItems
                      .map(
                        (extra) =>
                          `${extra.name || extra.item?.name || "Extra"} (x${
                            extra.quantity || 1
                          })`
                      )
                      .join(", ")}
                  </div>
                )}
                {/* Show price adjustment */}
                {delivery.customizationDetails.totalpayablePrice !==
                  undefined &&
                  delivery.customizationDetails.totalpayablePrice !== 0 && (
                    <div className="mt-1 text-xs">
                      {delivery.customizationDetails.totalpayablePrice > 0 ? (
                        <span className="text-green-600">
                          Extra: ₹
                          {delivery.customizationDetails.totalpayablePrice}
                        </span>
                      ) : (
                        <span className="text-blue-600">
                          Discount: ₹
                          {Math.abs(
                            delivery.customizationDetails.totalpayablePrice
                          )}
                        </span>
                      )}
                      {delivery.customizationDetails.paymentStatus && (
                        <span className="ml-2 text-gray-500">
                          ({delivery.customizationDetails.paymentStatus})
                        </span>
                      )}
                    </div>
                  )}
              </div>
            )}
            {delivery.isReplaced && delivery.replacementReason && (
              <div className="text-sm text-blue-700 bg-blue-50 rounded p-2 mb-2">
                <strong>Replacement Reason:</strong>{" "}
                {delivery.replacementReason}
              </div>
            )}
            {delivery.isSkipped && delivery.skipReason && (
              <div className="text-sm text-red-700 bg-red-50 rounded p-2 mb-2">
                <strong>Skipped:</strong> {delivery.skipReason}
              </div>
            )}
            {delivery.deliveryAddress?.instructions && (
              <div className="text-sm text-yellow-700 bg-yellow-50 rounded p-2 flex items-start">
                <FaBell className="mr-2 mt-0.5" />
                <div>
                  <strong>Delivery Instructions:</strong>
                  <div>{delivery.deliveryAddress.instructions}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Delivery Detail Modal Component
const DeliveryDetailModal = ({
  delivery,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  const isPending =
    (delivery.deliveryStatus === "pending" ||
      delivery.deliveryStatus === "customized") &&
    !delivery.isSkipped;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full w-full max-w-[95vw] mx-auto relative">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaTruck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white">
                    Delivery Details
                  </h3>
                  <p className="text-blue-100 text-sm">{delivery.user.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-2 sm:p-1"
              >
                <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-4 sm:px-6 py-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 text-base sm:text-lg flex items-center mb-4">
                  <FaUserCheck className="mr-2 text-blue-600" />
                  Customer Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      Name:
                    </span>
                    <span className="text-gray-900 text-sm sm:text-base break-all">
                      {delivery.user.name}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      Phone:
                    </span>
                    <a
                      href={`tel:${delivery.user.phone}`}
                      className="text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all"
                    >
                      {delivery.user.phone}
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      Email:
                    </span>
                    <span className="text-gray-900 text-sm sm:text-base break-all">
                      {delivery.user.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="font-semibold text-gray-900 text-base sm:text-lg flex items-center mb-4">
                  <FaMapMarkerAlt className="mr-2 text-green-600" />
                  Delivery Address
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="text-gray-900">
                    {delivery.deliveryAddress?.name && (
                      <div className="font-medium mb-1">
                        {delivery.deliveryAddress.name}
                      </div>
                    )}
                    <div>{delivery.deliveryAddress?.street}</div>
                    {delivery.deliveryAddress?.area && (
                      <div>{delivery.deliveryAddress.area}</div>
                    )}
                    <div>
                      {delivery.deliveryAddress?.city},{" "}
                      {delivery.deliveryAddress?.state}
                    </div>
                    {delivery.deliveryAddress?.pincode && (
                      <div>PIN: {delivery.deliveryAddress.pincode}</div>
                    )}
                  </div>
                  {delivery.deliveryAddress?.instructions && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
                      <div className="flex items-start">
                        <FaBell className="mr-2 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-800">
                            Delivery Instructions:
                          </div>
                          <div className="text-yellow-700">
                            {delivery.deliveryAddress.instructions}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Meal Details */}
              <div>
                <h4 className="font-semibold text-gray-900 text-lg flex items-center mb-4">
                  <FaUtensils className="mr-2 text-orange-600" />
                  Meal Details
                </h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">
                        {delivery.isCustomized &&
                        delivery.customizationDetails?.replacementMeal
                          ? "Customized Meal"
                          : delivery.isCustomized
                          ? "Customized Plan"
                          : delivery.isReplaced
                          ? "Replacement Meal"
                          : "Meal Plan"}
                        :
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          delivery.shift === "morning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {delivery.shift === "morning" ? (
                          <FaSun className="mr-1" />
                        ) : (
                          <FaMoon className="mr-1" />
                        )}
                        {delivery.shift.charAt(0).toUpperCase() +
                          delivery.shift.slice(1)}
                      </span>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {delivery.displayMealName ||
                        (delivery.isCustomized &&
                        delivery.customizationDetails?.replacementMeal
                          ? delivery.customizationDetails.replacementMeal.name
                          : delivery.isReplaced
                          ? delivery.replacementThali?.name
                          : delivery.mealPlan?.name)}
                    </div>
                    {delivery.seller && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center">
                        <FaStore className="mr-1" />
                        {delivery.seller.businessName || delivery.seller.name}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Delivery Time:</strong>{" "}
                      {delivery.shift === "morning"
                        ? "7:00 AM - 9:00 AM"
                        : "6:00 PM - 8:00 PM"}
                    </div>
                  </div>

                  {/* Special Cases */}
                  {delivery.isCustomized && delivery.customizationDetails && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                        <FaCog className="mr-2" />
                        Customization Details:
                      </h5>
                      <div className="space-y-2 text-purple-800">
                        {delivery?.customizationDetails && (
                          <div>
                            <strong>Custom Meal:</strong>{" "}
                            {
                              delivery?.customizationDetails?.replacementMeal
                                ?.name
                            }
                          </div>
                        )}
                        {delivery.customizationDetails?.dietaryPreference && (
                          <div>
                            <strong>Diet:</strong>{" "}
                            {delivery.customizationDetails.dietaryPreference}
                          </div>
                        )}
                        {delivery.customizationDetails.spiceLevel && (
                          <div>
                            <strong>Spice Level:</strong>{" "}
                            {delivery.customizationDetails.spiceLevel}
                          </div>
                        )}
                        {delivery.customizationDetails.preferences && (
                          <div>
                            <strong>Preferences:</strong>
                            {delivery.customizationDetails.preferences
                              .noOnion && " No Onion"}
                            {delivery.customizationDetails.preferences
                              .noGarlic && " No Garlic"}
                            {delivery.customizationDetails.preferences
                              .specialInstructions &&
                              ` - ${delivery.customizationDetails.preferences.specialInstructions}`}
                          </div>
                        )}
                        {delivery.customizationDetails.addons?.length > 0 && (
                          <div>
                            <strong>Add-ons:</strong>{" "}
                            {delivery.customizationDetails.addons
                              .map((addon) => addon.name || "Add-on")
                              .join(", ")}
                          </div>
                        )}
                        {delivery.customizationDetails.extraItems?.length >
                          0 && (
                          <div>
                            <strong>Extra Items:</strong>{" "}
                            {delivery.customizationDetails.extraItems
                              .map((item) => item.name || "Extra Item")
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {delivery.isReplaced && delivery.replacementReason && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">
                        Replacement Reason:
                      </h5>
                      <p className="text-blue-800">
                        {delivery.replacementReason}
                      </p>
                    </div>
                  )}

                  {delivery.isSkipped && delivery.skipReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-medium text-red-900 mb-2">
                        Skip Reason:
                      </h5>
                      <p className="text-red-800">{delivery.skipReason}</p>
                    </div>
                  )}

                  {delivery.deliveryNotes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Delivery Notes:
                      </h5>
                      <p className="text-gray-700">{delivery.deliveryNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Close
            </button>

            {isPending && (
              <button
                onClick={() => {
                  onUpdateStatus(delivery._id, "delivered");
                  onClose();
                }}
                disabled={isUpdating}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isUpdating ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaCheck className="mr-2" />
                )}
                Mark as Delivered
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDeliveryDashboard;
