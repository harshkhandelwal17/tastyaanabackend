import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaSync,
  FaFileExport,
  FaEye,
  FaEllipsisV,
  FaUser,
  FaCheck,
  FaClock,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

// Custom components
const StatusBadge = ({ status }) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-800",
  };

  const statusText = {
    active: "Active",
    paused: "Paused",
    cancelled: "Cancelled",
    completed: "Completed",
    pending: "Pending",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusText[status?.toLowerCase()] || "Unknown"}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const CardBody = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// Import RTK Query hooks
import {
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useGetSubscriptionStatsQuery,
} from "../../features/subscription/subscriptionApi";

// Import components
import SubscriptionForm from "../../features/subscription/SubscriptionForm";
import SubscriptionDetails from "../../features/subscription/SubscriptionDetails";

const Subscription = () => {
  // State management
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tempSubscription, setTempSubscription] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    seller: "all",
    dateRange: "all",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // RTK Query hooks
  const {
    data: subscriptionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSubscriptionsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: filters.status === "all" ? undefined : filters.status,
  });

  const [createSubscription, { isLoading: isCreating }] =
    useCreateSubscriptionMutation();

  const [updateSubscription, { isLoading: isUpdating }] =
    useUpdateSubscriptionMutation();
  const [deleteSubscription] = useDeleteSubscriptionMutation();
  const [pauseSubscription] = usePauseSubscriptionMutation();
  const [resumeSubscription] = useResumeSubscriptionMutation();
  const { data: stats } = useGetSubscriptionStatsQuery();
  console.log(subscriptionsData);
  // Derived state
  const subscriptions = subscriptionsData?.data || [];
  const totalPages = subscriptionsData?.pagination?.totalPages || 1;
  const totalItems = subscriptionsData?.pagination?.total || 0;

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleCreate = async (subscriptionData) => {
    try {
      const result = await createSubscription(subscriptionData).unwrap();
      toast.success("Subscription created successfully!");
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to create subscription");
    }
  };

  const handleUpdate = async (subscriptionData) => {
    if (!selectedSubscription) return;

    try {
      const result = await updateSubscription({
        id: selectedSubscription._id,
        ...subscriptionData,
      }).unwrap();

      toast.success("Subscription updated successfully!");
      setSelectedSubscription(null);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update subscription");
    }
  };

  const handleDelete = async () => {
    if (!subscriptionToDelete) return;

    try {
      await deleteSubscription(subscriptionToDelete._id).unwrap();
      toast.success("Subscription deleted successfully!");
      setShowDeleteModal(false);
      setSubscriptionToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to delete subscription");
    }
  };

  const handlePause = async (subscriptionId) => {
    try {
      await pauseSubscription({
        id: subscriptionId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        reason: "Paused by admin",
      }).unwrap();

      toast.success("Subscription paused successfully!");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to pause subscription");
    }
  };

  const handleResume = async (subscriptionId) => {
    try {
      await resumeSubscription({ id: subscriptionId }).unwrap();
      toast.success("Subscription resumed successfully!");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to resume subscription");
    }
  };

  const openDeleteModal = (subscription) => {
    setSubscriptionToDelete(subscription);
    setShowDeleteModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Status badge component - already defined at the top
  // Removing duplicate StatusBadge component

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="container mx-auto py-5 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading subscriptions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-5">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading subscriptions
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error?.data?.message ||
                    "An error occurred while fetching subscriptions"}
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refetch}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaSync className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter and search logic
  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const mealPlanName =
      typeof sub?.mealPlan === "object"
        ? sub?.mealPlan?.name
        : String(sub?.mealPlan || "");
    const userName = String(sub?.user?.name || "").toLowerCase();
    const userEmail = String(sub?.user?.email || "").toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch =
      mealPlanName?.toLowerCase()?.includes(searchTermLower) ||
      userName.includes(searchTermLower) ||
      userEmail.includes(searchTermLower);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && sub?.isActive) ||
      (filterStatus === "inactive" && !sub?.isActive) ||
      (filterStatus === "paused" && sub?.pause?.isPaused);

    return matchesSearch && matchesFilter;
  });

  // Render functions
  const renderEditableField = (
    value,
    field,
    subField = null,
    type = "text",
    options = []
  ) => {
    const handleChange = (e) => {
      let newValue;
      if (type === "checkbox") {
        newValue = e.target.checked;
      } else if (type === "number") {
        newValue = parseFloat(e.target.value) || 0;
      } else if (type === "date") {
        newValue = new Date(e.target.value).toISOString();
      } else {
        newValue = e.target.value;
      }

      setTempSubscription((prev) => {
        const updated = { ...prev };

        if (subField) {
          // Handle nested objects (e.g., autoRenewal.enabled)
          updated[field] = {
            ...(updated[field] || {}),
            [subField]: newValue,
          };
        } else {
          updated[field] = newValue;
        }

        return updated;
      });
    };

    const commonProps = {
      value: value || "",
      onChange: handleChange,
      className:
        "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
    };

    // Handle nested objects (e.g., autoRenewal.enabled)
    const displayValue =
      subField && value && typeof value === "object" ? value[subField] : value;

    switch (type) {
      case "boolean":
        return (
          <input
            type="checkbox"
            checked={!!displayValue}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        );
      case "date":
        return (
          <input
            type="datetime-local"
            value={
              displayValue
                ? new Date(displayValue).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleChange}
            className={commonProps.className}
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={displayValue || ""}
            onChange={handleChange}
            className={commonProps.className}
          />
        );
      case "select":
        return (
          <select
            value={displayValue || ""}
            onChange={handleChange}
            className={commonProps.className}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "status":
        return (
          <select
            value={displayValue || ""}
            onChange={handleChange}
            className={commonProps.className}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="pending_payment">Pending Payment</option>
          </select>
        );
      case "dietaryPreference":
        return (
          <select
            value={displayValue || ""}
            onChange={handleChange}
            className={commonProps.className}
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="non-vegetarian">Non-Vegetarian</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={displayValue || ""}
            onChange={handleChange}
            className={commonProps.className}
          />
        );
    }
  };

  const handleEditClick = (subscription) => {
    setEditingId(subscription._id);
    setTempSubscription({ ...subscription });
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setTempSubscription(null);
  };

  const handleSaveClick = async (id) => {
    try {
      await updateSubscription({
        id,
        ...tempSubscription,
      }).unwrap();
      toast.success("Subscription updated successfully");
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update subscription");
    }
  };

  // Render the main component
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Subscription Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit Subscription" : "Create New Subscription"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setSelectedSubscription(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-2">
              <SubscriptionForm
                initialData={editingId ? selectedSubscription : {}}
                onSubmit={editingId ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setSelectedSubscription(null);
                }}
                isSubmitting={isCreating || isUpdating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {selectedSubscription && !editingId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Subscription Details</h3>
              <button
                onClick={() => setSelectedSubscription(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-2">
              <SubscriptionDetails
                subscription={selectedSubscription}
                onEdit={() => setEditingId(selectedSubscription._id)}
                onDelete={() => {
                  setSubscriptionToDelete(selectedSubscription);
                  setShowDeleteModal(true);
                }}
                onPause={() => handlePause(selectedSubscription._id)}
                onResume={() => handleResume(selectedSubscription._id)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">
            Subscription Management
          </h2>
          <p className="text-gray-500">
            Manage all meal subscriptions and delivery schedules
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md -ml-px ${
                viewMode === "card"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Card View
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedSubscription(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Subscriptions */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Total Subscriptions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <FaUser className="h-6 w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.active || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaCheck className="h-6 w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Paused Subscriptions */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Paused
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.paused || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaClock className="h-6 w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* This Month */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  This Month
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  +{stats?.thisMonth || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaCalendarAlt className="h-6 w-6" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10 border"
                  placeholder="Search by ID, user, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md h-10"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filters.seller}
                onChange={(e) =>
                  setFilters({ ...filters, seller: e.target.value })
                }
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md h-10"
              >
                <option value="all">All Sellers</option>
                {/* Add seller options here */}
              </select>

              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredSubscriptions.length} of {subscriptions.length}{" "}
          subscriptions
        </p>

        {/* Content */}
        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaCalendarAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No subscriptions found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Plan
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Period
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.mealPlan?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subscription.user?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.user?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={subscription.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {formatDate(
                            subscription.deliverySettings?.startDate
                          ) || "N/A"}
                        </div>
                        <div>
                          {subscription.deliverySettings?.endDate
                            ? formatDate(subscription.deliverySettings.endDate)
                            : "Ongoing"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(subscription)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FaEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSubscriptionToDelete(subscription);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubscriptions.map((subscription) => (
              <Card key={subscription._id}>
                <CardBody>
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {subscription.mealPlan?.name || "N/A"}
                    </h3>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {subscription.user?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {subscription.user?.email || ""}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Start Date</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(subscription.deliverySettings?.startDate) ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>End Date</span>
                      <span className="font-medium text-gray-900">
                        {subscription.deliverySettings?.endDate
                          ? formatDate(subscription.deliverySettings.endDate)
                          : "Ongoing"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(subscription)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaEdit className="h-4 w-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setSubscriptionToDelete(subscription);
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="h-4 w-4 mr-1" /> Delete
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal/Overlay */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Subscription
                </h2>
                <button
                  onClick={handleCancelClick}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Plan
                  </label>
                  {renderEditableField(tempSubscription.mealPlan, "mealPlan")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  {renderEditableField(
                    tempSubscription.deliverySettings?.startDate,
                    "deliverySettings",
                    "startDate",
                    "date"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Shift
                  </label>
                  {renderEditableField(
                    tempSubscription.deliverySettings?.startShift,
                    "deliverySettings",
                    "startShift"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Days
                  </label>
                  {renderEditableField(
                    tempSubscription.deliverySettings?.deliveryDays,
                    "deliverySettings",
                    "deliveryDays"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Is Active
                  </label>
                  {renderEditableField(
                    tempSubscription.isActive,
                    "isActive",
                    null,
                    "boolean"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Is Paused
                  </label>
                  {renderEditableField(
                    tempSubscription.pause?.isPaused,
                    "pause",
                    "isPaused",
                    "boolean"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meals Left
                  </label>
                  {renderEditableField(
                    tempSubscription.currentCycle?.mealsLeft,
                    "currentCycle",
                    "mealsLeft",
                    "number"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Meals
                  </label>
                  {renderEditableField(
                    tempSubscription.totalMeals,
                    "totalMeals",
                    null,
                    "number"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  {renderEditableField(
                    tempSubscription.paymentInfo?.status,
                    "paymentInfo",
                    "status",
                    "select"
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  {renderEditableField(
                    tempSubscription.paymentInfo?.method,
                    "paymentInfo",
                    "method",
                    "select"
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelClick}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveClick(editingId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
