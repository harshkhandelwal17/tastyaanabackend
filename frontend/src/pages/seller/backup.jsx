import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Clock,
  User,
  Car,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  MessageCircle,
} from "lucide-react";
import {
  getSellerBookings,
  getBookingDetails,
  updateBookingStatus,
  formatBookingForDisplay,
  getStatusBadgeColor,
} from "../../api/sellerVehicleApi";
import { 
  useGetPendingExtensionsQuery,
  useRespondToExtensionMutation,
  useApproveBookingMutation
} from "../../redux/api/vehicleApi";

const SellerBookingManagement = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending_approval', 'extensions'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "bookingDate",
    sortOrder: "desc",
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    notes: "",
  });
  const [approvalData, setApprovalData] = useState({
    action: '',
    reason: ''
  });
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // RTK Query hooks
  const { data: pendingExtensions, isLoading: extensionsLoading, refetch: refetchExtensions } = useGetPendingExtensionsQuery();
  const [approveBooking, { isLoading: isApproving }] = useApproveBookingMutation();
  const [respondToExtension, { isLoading: isRespondingToExtension }] = useRespondToExtensionMutation();

  // Load bookings
  useEffect(() => {
    fetchBookings();
  }, [filters, pagination.currentPage]);

  const fetchBookings = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: 20,
      };

      const response = await getSellerBookings(params);
      setBookings(response.data.bookings);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error(error.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // View booking details
  const viewDetails = async (bookingId) => {
    try {
      const response = await getBookingDetails(bookingId);
      setSelectedBooking(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error(error.message || "Failed to fetch booking details");
    }
  };

  // Update booking status
  const handleStatusUpdate = async () => {
    try {
      if (!selectedBooking || !statusUpdate.status) return;

      await updateBookingStatus(selectedBooking._id, statusUpdate);
      toast.success("Booking status updated successfully");

      setShowStatusModal(false);
      setStatusUpdate({ status: "", notes: "" });
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error.message || "Failed to update booking status");
    }
  };

  // Handle booking approval/denial
  const handleBookingApproval = async () => {
    try {
      if (!selectedBooking || !approvalData.action) return;

      await approveBooking({ 
        bookingId: selectedBooking._id, 
        action: approvalData.action,
        reason: approvalData.reason 
      }).unwrap();
      
      toast.success(`Booking ${approvalData.action}d successfully`);
      setShowApprovalModal(false);
      setApprovalData({ action: '', reason: '' });
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error("Error with booking approval:", error);
      toast.error(error.data?.message || `Failed to ${approvalData.action} booking`);
    }
  };

  // Handle extension response
  const handleExtensionResponse = async (action, rejectionReason = '') => {
    try {
      if (!selectedExtension) return;

      await respondToExtension({
        bookingId: selectedExtension.bookingId,
        requestId: selectedExtension.extensionRequest.requestId,
        action,
        rejectionReason
      }).unwrap();

      toast.success(`Extension request ${action}d successfully`);
      setShowExtensionModal(false);
      setSelectedExtension(null);
      refetchExtensions();
    } catch (error) {
      console.error("Error responding to extension:", error);
      toast.error(error.data?.message || "Failed to respond to extension request");
    }
  };

  // Filter bookings by status
  const getBookingsByStatus = (status) => {
    return bookings.filter((booking) => booking.status === status);
  };

  // Get pending approval bookings
  const getPendingApprovalBookings = () => {
    return bookings.filter((booking) => booking.bookingStatus === 'awaiting_approval' || booking.status === 'awaiting_approval');
  };

  const statusCounts = {
    pending: getBookingsByStatus("pending").length,
    awaiting_approval: getPendingApprovalBookings().length,
    confirmed: getBookingsByStatus("confirmed").length,
    "in-progress": getBookingsByStatus("in-progress").length,
    completed: getBookingsByStatus("completed").length,
    cancelled: getBookingsByStatus("cancelled").length,
    pending_extensions: pendingExtensions?.data?.length || 0,
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Booking Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your vehicle bookings
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchBookings()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                All Bookings
                <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {bookings.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('pending_approval')}
                className={`${
                  activeTab === 'pending_approval'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm relative`}
              >
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Pending Approval
                <span className="bg-yellow-100 text-yellow-800 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {statusCounts.awaiting_approval}
                </span>
                {statusCounts.awaiting_approval > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('extensions')}
                className={`${
                  activeTab === 'extensions'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm relative`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Extension Requests
                <span className="bg-purple-100 text-purple-800 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {statusCounts.pending_extensions}
                </span>
                {statusCounts.pending_extensions > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Need Approval</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts.awaiting_approval}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts.confirmed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts["in-progress"]}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statusCounts.cancelled}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Filters & Search
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Date To */}
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bookingDate-desc">Newest First</option>
                <option value="bookingDate-asc">Oldest First</option>
                <option value="startDate-desc">Start Date (Latest)</option>
                <option value="startDate-asc">Start Date (Earliest)</option>
                <option value="totalAmount-desc">Amount (High to Low)</option>
                <option value="totalAmount-asc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table - All Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">All Bookings</h3>
                <span className="text-sm text-gray-500">
                  {pagination.totalItems} total bookings
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking, index) => {
                    const formattedBooking = formatBookingForDisplay(booking);
                    return (
                      <tr key={booking._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{formattedBooking.bookingNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(formattedBooking.bookingDate)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {formattedBooking.vehicle.image && (
                              <img
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                                src={formattedBooking.vehicle.image}
                                alt={formattedBooking.vehicle.name}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formattedBooking.vehicle.brand}{" "}
                                {formattedBooking.vehicle.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formattedBooking.vehicle.registrationNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formattedBooking.customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formattedBooking.customer.phone}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(formattedBooking.startDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              to {formatDate(formattedBooking.endDate)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{formattedBooking.totalAmount?.toLocaleString()}
                          </div>
                          <div
                            className={`text-xs ${getStatusBadgeColor(
                              formattedBooking.paymentStatus
                            )}`}
                          >
                            {formattedBooking.paymentStatus}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              formattedBooking.status
                            )}`}
                          >
                            {formattedBooking.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewDetails(booking._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {["pending", "confirmed", "ongoing", "in-progress"].includes(formattedBooking.status?.toLowerCase()) && (
                              <button
                                onClick={() => navigate(`${booking._id}/handover`)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Process Handover"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}

                            {["pending", "confirmed", "in-progress", "ongoing"].includes(
                              formattedBooking.status
                            ) && (
                                <button
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setStatusUpdate({
                                      status: formattedBooking.status,
                                      notes: "",
                                    });
                                    setShowStatusModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {!loading && bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filters.search ||
                    filters.status ||
                    filters.dateFrom ||
                    filters.dateTo
                    ? "Try adjusting your filters."
                    : "Your bookings will appear here when customers book your vehicles."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.currentPage - 1) * 20 + 1} to{" "}
                    {Math.min(pagination.currentPage * 20, pagination.totalItems)}{" "}
                    of {pagination.totalItems} bookings
                  </div>

                  <nav className="flex space-x-2">
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: pagination.currentPage - 1,
                        })
                      }
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {[...Array(Math.min(pagination.totalPages, 5))].map(
                      (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                currentPage: pageNum,
                              })
                            }
                            className={`px-3 py-2 text-sm font-medium rounded-md ${pagination.currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: pagination.currentPage + 1,
                        })
                      }
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Approval Tab */}
        {activeTab === 'pending_approval' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bookings Requiring Approval</h3>
              <p className="text-sm text-gray-500">These bookings have been paid but need your approval to proceed.</p>
            </div>

            <div className="divide-y divide-gray-200">
              {getPendingApprovalBookings().map((booking) => {
                const formattedBooking = formatBookingForDisplay(booking);
                return (
                  <div key={booking._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {formattedBooking.vehicle?.image && (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={formattedBooking.vehicle.image}
                            alt={formattedBooking.vehicle.name}
                          />
                        )}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {formattedBooking.vehicle?.brand} {formattedBooking.vehicle?.model}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formattedBooking.vehicle?.registrationNumber} • #{formattedBooking.bookingNumber}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">
                              <User className="w-4 h-4 inline mr-1" />
                              {formattedBooking.customer?.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {formattedBooking.customer?.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{formattedBooking.totalAmount?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(formattedBooking.startDate)} - {formatDate(formattedBooking.endDate)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setApprovalData({ action: 'deny', reason: '' });
                              setShowApprovalModal(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                            disabled={isApproving}
                          >
                            <XCircle className="w-4 h-4 mr-1 inline" />
                            Deny
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setApprovalData({ action: 'approve', reason: '' });
                              setShowApprovalModal(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                            disabled={isApproving}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 inline" />
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {getPendingApprovalBookings().length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending approvals
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  All bookings have been reviewed. New booking requests requiring approval will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Extension Requests Tab */}
        {activeTab === 'extensions' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Extension Requests</h3>
              <p className="text-sm text-gray-500">Customers requesting to extend their booking duration.</p>
            </div>

            <div className="divide-y divide-gray-200">
              {extensionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading extension requests...</span>
                </div>
              ) : (
                pendingExtensions?.data?.map((extension) => (
                  <div key={`${extension.bookingId}-${extension.extensionRequest.requestId}`} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {extension.vehicle?.name} ({extension.vehicle?.vehicleNo})
                          </h4>
                          <p className="text-sm text-gray-500">
                            Booking #{extension.bookingNumber}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">
                              <User className="w-4 h-4 inline mr-1" />
                              {extension.customer?.name || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {extension.customer?.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-900 font-medium">
                            Current End: {formatDate(extension.currentEndTime)}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            Requested End: {formatDate(extension.extensionRequest.requestedEndDateTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Additional: {extension.extensionRequest.additionalHours} hours
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{(extension.extensionRequest.additionalAmount + extension.extensionRequest.additionalGst)?.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedExtension(extension);
                              setShowExtensionModal(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                            disabled={isRespondingToExtension}
                          >
                            <XCircle className="w-4 h-4 mr-1 inline" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleExtensionResponse('approve')}
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                            disabled={isRespondingToExtension}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 inline" />
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!extensionsLoading && pendingExtensions?.data?.length === 0 && (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No extension requests
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Customer extension requests will appear here for your review and approval.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const formattedBooking = formatBookingForDisplay(booking);
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formattedBooking.bookingId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Booked: {formatDate(formattedBooking.bookingDate)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {formattedBooking.vehicle.images?.[0] && (
                              <img
                                src={formattedBooking.vehicle.images[0]}
                                alt="Vehicle"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formattedBooking.vehicle.brand}{" "}
                                {formattedBooking.vehicle.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formattedBooking.vehicle.registrationNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formattedBooking.customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formattedBooking.customer.phone}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(formattedBooking.startDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              to {formatDate(formattedBooking.endDate)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{formattedBooking.totalAmount?.toLocaleString()}
                          </div>
                          <div
                            className={`text-xs ${getStatusBadgeColor(
                              formattedBooking.paymentStatus
                            )}`}
                          >
                            {formattedBooking.paymentStatus}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              formattedBooking.status
                            )}`}
                          >
                            {formattedBooking.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewDetails(booking._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {["pending", "confirmed", "ongoing", "in-progress"].includes(formattedBooking.status?.toLowerCase()) && (
                              <button
                                onClick={() => navigate(`${booking._id}/handover`)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Process Handover"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}

                            {["pending", "confirmed", "in-progress", "ongoing"].includes(
                              formattedBooking.status
                            ) && (
                                <button
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setStatusUpdate({
                                      status: formattedBooking.status,
                                      notes: "",
                                    });
                                    setShowStatusModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No bookings found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ||
                  filters.status ||
                  filters.dateFrom ||
                  filters.dateTo
                  ? "Try adjusting your filters."
                  : "Your bookings will appear here when customers book your vehicles."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.currentPage - 1) * 20 + 1} to{" "}
                  {Math.min(pagination.currentPage * 20, pagination.totalItems)}{" "}
                  of {pagination.totalItems} bookings
                </div>

                <nav className="flex space-x-2">
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage - 1,
                      })
                    }
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {[...Array(Math.min(pagination.totalPages, 5))].map(
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: pageNum,
                            })
                          }
                          className={`px-3 py-2 text-sm font-medium rounded-md ${pagination.currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage + 1,
                      })
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Booking Details - {selectedBooking.bookingId}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {selectedBooking.customer?.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {selectedBooking.customer?.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {selectedBooking.customer?.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Vehicle Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4 mb-3">
                      {selectedBooking.vehicle?.images?.[0] && (
                        <img
                          src={selectedBooking.vehicle.images[0]}
                          alt="Vehicle"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedBooking.vehicle?.brand}{" "}
                          {selectedBooking.vehicle?.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedBooking.vehicle?.registrationNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Booking Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">
                        Start Date & Time:
                      </span>
                      <div className="text-sm text-gray-900">
                        {formatDate(selectedBooking.startDate)} at{" "}
                        {formatTime(selectedBooking.startDate)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        End Date & Time:
                      </span>
                      <div className="text-sm text-gray-900">
                        {formatDate(selectedBooking.endDate)} at{" "}
                        {formatTime(selectedBooking.endDate)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Pickup Location:
                      </span>
                      <div className="text-sm text-gray-900">
                        {typeof selectedBooking.pickupLocation === 'object'
                          ? selectedBooking.pickupLocation?.address || 'N/A'
                          : selectedBooking.pickupLocation}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Drop-off Location:
                      </span>
                      <div className="text-sm text-gray-900">
                        {typeof selectedBooking.dropoffLocation === 'object'
                          ? selectedBooking.dropoffLocation?.address || 'N/A'
                          : selectedBooking.dropoffLocation}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Payment Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Total Amount:
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{selectedBooking.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Payment Status:
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          selectedBooking.paymentStatus
                        )}`}
                      >
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Booking Status:
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          selectedBooking.status
                        )}`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedBooking.statusHistory &&
                selectedBooking.statusHistory.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Status History
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {selectedBooking.statusHistory.map((history, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3"
                          >
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {history.status}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(history.updatedAt)} at{" "}
                                {formatTime(history.updatedAt)}
                                {history.notes && ` - ${history.notes}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="mt-8 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>

                {["pending", "confirmed", "in-progress"].includes(
                  selectedBooking.status
                ) && (
                    <button
                      onClick={() => {
                        setStatusUpdate({
                          status: selectedBooking.status,
                          notes: "",
                        });
                        setShowDetailsModal(false);
                        setShowStatusModal(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Update Status
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Approval Modal */}
      {showApprovalModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {approvalData.action === 'approve' ? 'Approve Booking' : 'Deny Booking'}
                </h2>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalData({ action: '', reason: '' });
                    setSelectedBooking(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Booking Details</h3>
                  <p className="text-sm text-gray-600">
                    Booking #{formatBookingForDisplay(selectedBooking)?.bookingNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Customer: {formatBookingForDisplay(selectedBooking)?.customer?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ₹{formatBookingForDisplay(selectedBooking)?.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {approvalData.action === 'deny' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for denial <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={approvalData.reason}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, reason: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a reason for denying this booking..."
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalData({ action: '', reason: '' });
                    setSelectedBooking(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isApproving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingApproval}
                  disabled={isApproving || (approvalData.action === 'deny' && !approvalData.reason.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    approvalData.action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isApproving ? (
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <>
                      {approvalData.action === 'approve' ? (
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 inline mr-2" />
                      )}
                    </>
                  )}
                  {approvalData.action === 'approve' ? 'Approve' : 'Deny'} Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extension Response Modal */}
      {showExtensionModal && selectedExtension && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Extension Request
                </h2>
                <button
                  onClick={() => {
                    setShowExtensionModal(false);
                    setSelectedExtension(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Booking:</span>
                      <span className="ml-2 font-medium">#{selectedExtension.bookingNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-2 font-medium">{selectedExtension.vehicle?.vehicleNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="ml-2 font-medium">{selectedExtension.customer?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium">{selectedExtension.customer?.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Extension Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current End Time:</span>
                      <span className="font-medium">{formatDate(selectedExtension.currentEndTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested End Time:</span>
                      <span className="font-medium text-blue-600">
                        {formatDate(selectedExtension.extensionRequest.requestedEndDateTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Hours:</span>
                      <span className="font-medium">{selectedExtension.extensionRequest.additionalHours} hours</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-600">Additional Amount:</span>
                      <span className="font-semibold text-lg">
                        ₹{(selectedExtension.extensionRequest.additionalAmount + selectedExtension.extensionRequest.additionalGst)?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowExtensionModal(false);
                    setSelectedExtension(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isRespondingToExtension}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExtensionResponse('reject', 'Extension not feasible at this time')}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  disabled={isRespondingToExtension}
                >
                  {isRespondingToExtension ? (
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 inline mr-2" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleExtensionResponse('approve')}
                  className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                  disabled={isRespondingToExtension}
                >
                  {isRespondingToExtension ? (
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Booking Status
                </h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusUpdate.notes}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this status change..."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerBookingManagement;
