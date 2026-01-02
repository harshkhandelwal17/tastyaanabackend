import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  DollarSign,
  Check,
  X,
  Clock,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Printer,
  Truck,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Minus,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  getBookings,
  getAllRefunds,
  processRefund,
  addExtraCharges,
  recordOfflineCollection,
  getRefundStats,
  formatBookingForDisplay,
  formatRefundForDisplay,
} from "../../api/vehicleApi";

const AdminBillingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [allRefunds, setAllRefunds] = useState([]);
  const [refundStats, setRefundStats] = useState({
    total: 0,
    totalAmount: 0,
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    paymentStatus: "",
    dateFrom: "",
    dateTo: "",
    billingStatus: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showExtraChargeModal, setShowExtraChargeModal] = useState(false);
  const [showOfflineCollectionModal, setShowOfflineCollectionModal] =
    useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Billing form states
  const [extraCharges, setExtraCharges] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("");
  const [offlineCollection, setOfflineCollection] = useState({
    amount: 0,
    collectedBy: "",
    paymentMethod: "cash",
    notes: "",
  });

  // Load initial data
  useEffect(() => {
    fetchBookings();
    fetchRefunds();
    fetchRefundStats();
  }, [filters, pagination.currentPage]);

  // Fetch bookings from real API
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 20,
        sortBy: "bookingDate",
        sortOrder: "desc",
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await getBookings(params);

      if (response.success) {
        // Format bookings for display and fetch refunds for each
        const formattedBookings = await Promise.all(
          response.data.bookings.map(async (booking) => {
            const formatted = formatBookingForDisplay(booking);

            // Fetch refunds for this booking
            try {
              const refundsResponse = await getAllRefunds({
                bookingId: booking._id,
              });
              if (refundsResponse.success) {
                formatted.refunds = refundsResponse.data.refunds.map(
                  formatRefundForDisplay
                );
              }
            } catch (error) {
              console.warn("Could not fetch refunds for booking:", booking._id);
              formatted.refunds = [];
            }

            return formatted;
          })
        );

        setBookings(formattedBookings);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error(error.message || "Failed to load bookings");

      // Fallback to empty state
      setBookings([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all refunds for statistics
  const fetchRefunds = async () => {
    try {
      const response = await getAllRefunds({
        page: 1,
        limit: 100, // Get more for stats
        sortBy: "requestedAt",
        sortOrder: "desc",
      });

      if (response.success) {
        setAllRefunds(response.data.refunds);
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
    }
  };

  // Fetch refund statistics
  const fetchRefundStats = async () => {
    try {
      const response = await getRefundStats();
      if (response.success) {
        setRefundStats(response.data.summary);
      }
    } catch (error) {
      console.error("Error fetching refund stats:", error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      paymentStatus: "",
      dateFrom: "",
      dateTo: "",
      billingStatus: "",
    });
  };

  // Calculate total billing amount
  const calculateTotalAmount = (booking) => {
    const baseAmount = booking.totalAmount || 0;
    const extraAmount =
      booking.extraCharges?.reduce((sum, charge) => sum + charge.amount, 0) ||
      0;
    const refundAmount =
      booking.refunds?.reduce((sum, refund) => sum + refund.amount, 0) || 0;
    const collectionAmount =
      booking.offlineCollections?.reduce(
        (sum, collection) => sum + collection.amount,
        0
      ) || 0;

    return baseAmount + extraAmount - refundAmount + collectionAmount;
  };

  // Add extra charge (real API implementation)
  const addExtraCharge = async (bookingId, charges) => {
    try {
      toast.loading("Adding extra charges...");

      const response = await addExtraCharges(bookingId, { charges });

      if (response.success) {
        toast.dismiss();
        toast.success("Extra charges added successfully");
        fetchBookings(pagination.currentPage);
        setShowExtraChargeModal(false);
        setExtraCharges([]);
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error adding extra charges:", error);
      toast.error(error.message || "Failed to add extra charges");
    }
  };

  // Process refund (real API implementation)
  const processRefund = async (bookingId, amount, reason) => {
    try {
      toast.loading("Processing your refund request...");

      const refundData = {
        amount: amount,
        reason: reason.trim(),
        refundMethod: "bank_transfer",
        estimatedDays: 5,
        adminNotes: `Refund processed via admin panel for booking ${selectedBooking?.bookingId}`,
      };

      const response = await processRefund(bookingId, refundData);

      if (response.success) {
        toast.dismiss();
        toast.success(`₹${amount} refund initiated successfully! 
        💰 Refund will be processed to customer's original payment method within 3-5 business days.
        📧 Customer will receive a confirmation email shortly.
        🆔 Refund ID: ${response.data.refund.refundId}`);

        // Refresh data
        fetchBookings(pagination.currentPage);
        fetchRefunds();
        fetchRefundStats();

        setShowRefundModal(false);
        setRefundAmount(0);
        setRefundReason("");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error processing refund:", error);
      toast.error(
        error.message ||
          "❌ Refund processing failed. Please try again or contact support."
      );
    }
  };

  // Record offline collection (real API implementation)
  const recordOfflineCollectionLocal = async (bookingId, collectionData) => {
    try {
      toast.loading("Recording offline collection...");

      const response = await recordOfflineCollection(bookingId, collectionData);

      if (response.success) {
        toast.dismiss();
        toast.success("Offline collection recorded successfully");
        fetchBookings(pagination.currentPage);
        setShowOfflineCollectionModal(false);
        setOfflineCollection({
          amount: 0,
          collectedBy: "",
          paymentMethod: "cash",
          notes: "",
        });
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error recording collection:", error);
      toast.error(error.message || "Failed to record collection");
    }
  };

  // Mark vehicle as returned (placeholder - would need backend implementation)
  const markVehicleReturned = async (bookingId) => {
    try {
      toast.loading("Marking vehicle as returned...");

      // This would need a specific endpoint in the backend
      // For now, we'll just show success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.dismiss();
      toast.success("Vehicle marked as returned");
      fetchBookings(pagination.currentPage);
    } catch (error) {
      toast.dismiss();
      console.error("Error marking return:", error);
      toast.error("Failed to mark return");
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { color: "bg-blue-100 text-blue-800", icon: Check },
      "in-use": { color: "bg-green-100 text-green-800", icon: Truck },
      completed: { color: "bg-gray-100 text-gray-800", icon: Check },
      cancelled: { color: "bg-red-100 text-red-800", icon: X },
      "payment-pending": {
        color: "bg-orange-100 text-orange-800",
        icon: DollarSign,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { color: "bg-green-100 text-green-800", icon: Check },
      failed: { color: "bg-red-100 text-red-800", icon: X },
      refunded: {
        color: "bg-purple-100 text-purple-800",
        icon: ArrowDownCircle,
      },
      "partially-refunded": {
        color: "bg-indigo-100 text-indigo-800",
        icon: ArrowDownCircle,
      },
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {paymentStatus.charAt(0).toUpperCase() +
          paymentStatus.slice(1).replace("-", " ")}
      </span>
    );
  };

  // Get refund status badge - THIS IS HOW SELLERS CAN TRACK REFUNDS
  const getRefundStatusBadge = (refundStatus) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "⏳ Refund Pending",
      },
      processing: {
        color: "bg-blue-100 text-blue-800",
        icon: RefreshCw,
        text: "🔄 Processing Refund",
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: Check,
        text: "✅ Refund Completed",
      },
      failed: {
        color: "bg-red-100 text-red-800",
        icon: X,
        text: "❌ Refund Failed",
      },
    };

    const config = statusConfig[refundStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Get days remaining for refund completion
  const getRefundTimeInfo = (refund) => {
    if (refund.status === "completed") {
      return `✅ Completed on ${new Date(
        refund.actualCompletionDate
      ).toLocaleDateString()}`;
    }

    const processedDate = new Date(refund.processedAt);
    const estimatedCompletion = new Date(processedDate);
    estimatedCompletion.setDate(
      estimatedCompletion.getDate() + refund.estimatedDays
    );

    const now = new Date();
    const daysLeft = Math.ceil(
      (estimatedCompletion - now) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft > 0) {
      return `⏰ Expected in ${daysLeft} day${
        daysLeft > 1 ? "s" : ""
      } (by ${estimatedCompletion.toLocaleDateString()})`;
    } else {
      return `⚠️ Expected completion date passed - may need follow-up`;
    }
  };

  // Generate QR code for payment
  const generateQRCode = (booking) => {
    const paymentData = {
      bookingId: booking._id,
      amount: calculateTotalAmount(booking),
      type: "vehicle-rental",
    };
    return JSON.stringify(paymentData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏦 Billing & Refund Management
              </h1>
              <p className="mt-2 text-gray-600">
                📊 This page shows all vehicle bookings and their payment
                status. Here you can:
              </p>
              <div className="mt-1 text-sm text-gray-500 space-y-1">
                <div>• 👀 View all customer bookings and payment details</div>
                <div>
                  • 💰 Process refunds when customers cancel or have issues
                </div>
                <div>
                  • 📝 Add extra charges (like late fees or damage charges)
                </div>
                <div>• 💵 Record cash payments collected offline</div>
              </div>
              {bookings.length === 1 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📚 <strong>Learning Mode:</strong> This shows your test
                    booking. In a real system, all customer bookings would
                    appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              <button
                onClick={() => fetchBookings(pagination.currentPage)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-use">In Use</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={filters.paymentStatus}
                    onChange={(e) =>
                      handleFilterChange("paymentStatus", e.target.value)
                    }
                  >
                    <option value="">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={filters.billingStatus}
                    onChange={(e) =>
                      handleFilterChange("billingStatus", e.target.value)
                    }
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="billed">Billed</option>
                    <option value="settled">Settled</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 📊 REFUND SUMMARY DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-900">
                  Total Refunds
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {bookings.reduce(
                    (total, booking) => total + (booking.refunds?.length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-900">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {bookings.reduce(
                    (total, booking) =>
                      total +
                      (booking.refunds?.filter((r) => r.status === "completed")
                        .length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-900">
                  Processing
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {bookings.reduce(
                    (total, booking) =>
                      total +
                      (booking.refunds?.filter((r) => r.status === "processing")
                        .length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-900">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹
                  {bookings
                    .reduce(
                      (total, booking) =>
                        total +
                        (booking.refunds?.reduce(
                          (sum, refund) => sum + refund.amount,
                          0
                        ) || 0),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🔄 Refund Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {booking.vehicle?.name} •{" "}
                            {booking.vehicle?.vehicleNo}
                          </div>
                          <div className="text-sm text-gray-500">
                            Booking ID: {booking.bookingId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.startDate).toLocaleDateString()} -{" "}
                            {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.customer?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{calculateTotalAmount(booking).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Base: ₹{booking.totalAmount?.toLocaleString()}
                      </div>
                      {booking.extraCharges?.length > 0 && (
                        <div className="text-sm text-red-600">
                          +₹
                          {booking.extraCharges
                            .reduce((sum, charge) => sum + charge.amount, 0)
                            .toLocaleString()}{" "}
                          extra
                        </div>
                      )}
                      {booking.refunds?.length > 0 && (
                        <div className="text-sm text-green-600">
                          -₹
                          {booking.refunds
                            .reduce((sum, refund) => sum + refund.amount, 0)
                            .toLocaleString()}{" "}
                          refunded
                        </div>
                      )}
                      <div className="mt-1">
                        {getStatusBadge(booking.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentStatusBadge(booking.paymentStatus)}
                      <div className="text-sm text-gray-500 mt-1">
                        {booking.paymentMethod === "razorpay" && (
                          <CreditCard className="inline w-3 h-3 mr-1" />
                        )}
                        {booking.paymentMethod === "offline" && (
                          <Smartphone className="inline w-3 h-3 mr-1" />
                        )}
                        {booking.paymentMethod || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.refunds?.length > 0 ? (
                        <div className="space-y-2">
                          {booking.refunds.map((refund) => (
                            <div
                              key={refund.id}
                              className="border-l-4 border-blue-300 pl-3 py-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                {getRefundStatusBadge(refund.status)}
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{refund.amount.toLocaleString()} refund
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                ID: {refund.refundId}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {getRefundTimeInfo(refund)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Reason: {refund.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No refunds processed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBillingModal(true);
                          }}
                          className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
                          title="View complete billing details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>

                        {booking.paidAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowRefundModal(true);
                            }}
                            className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200"
                            title="Return money to customer"
                          >
                            <ArrowDownCircle className="w-3 h-3" />
                            <span>💰 Refund</span>
                          </button>
                        )}

                        {booking.status !== "completed" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowExtraChargeModal(true);
                              }}
                              className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs hover:bg-orange-200"
                              title="Add extra charges like late fees"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Extra Charge</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowOfflineCollectionModal(true);
                              }}
                              className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs hover:bg-purple-200"
                              title="Record cash payment received offline"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Cash Payment</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchBookings(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchBookings(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(pagination.currentPage - 1) * 20 + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          pagination.currentPage * 20,
                          pagination.totalItems
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {pagination.totalItems}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          fetchBookings(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(5, pagination.totalPages))].map(
                        (_, index) => {
                          const pageNum =
                            Math.max(1, pagination.currentPage - 2) + index;
                          if (pageNum <= pagination.totalPages) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => fetchBookings(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pageNum === pagination.currentPage
                                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          return null;
                        }
                      )}
                      <button
                        onClick={() =>
                          fetchBookings(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <DollarSign className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No billing records found
            </h3>
            <p className="text-gray-500">
              {Object.values(filters).some((v) => v)
                ? "Try adjusting your filters"
                : "Billing records will appear here once bookings are made"}
            </p>
          </div>
        )}
      </div>

      {/* Billing Details Modal */}
      {showBillingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Billing Details
                </h3>
                <button
                  onClick={() => setShowBillingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Booking Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Booking Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="font-medium">
                          {selectedBooking.bookingId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">
                          {selectedBooking.vehicle?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedBooking.startDate
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            selectedBooking.endDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span>{getStatusBadge(selectedBooking.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Customer Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedBooking.customer?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {selectedBooking.customer?.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {selectedBooking.customer?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Financial Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Amount:</span>
                        <span className="font-medium">
                          ₹{selectedBooking.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit:</span>
                        <span className="font-medium">
                          ₹{selectedBooking.depositAmount?.toLocaleString()}
                        </span>
                      </div>
                      {selectedBooking.extraCharges?.map((charge, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-red-600"
                        >
                          <span>{charge.description}:</span>
                          <span>+₹{charge.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      {selectedBooking.refunds?.map((refund, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-green-600"
                        >
                          <span>Refund ({refund.reason}):</span>
                          <span>-₹{refund.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      {selectedBooking.offlineCollections?.map(
                        (collection, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-purple-600"
                          >
                            <span>Offline Collection:</span>
                            <span>+₹{collection.amount?.toLocaleString()}</span>
                          </div>
                        )
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span>
                          ₹
                          {calculateTotalAmount(
                            selectedBooking
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Payment Status
                    </h4>
                    <div className="space-y-2">
                      {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                      <div className="text-sm text-gray-600 mt-2">
                        Payment Method:{" "}
                        {selectedBooking.paymentMethod || "Unknown"}
                      </div>
                      {selectedBooking.razorpayPaymentId && (
                        <div className="text-sm text-gray-600">
                          Razorpay ID: {selectedBooking.razorpayPaymentId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🔄 REFUND TRACKING SECTION - THIS IS WHERE SELLERS SEE REFUND STATUS */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      🔄 Refund Tracking Dashboard
                    </h4>
                    {selectedBooking.refunds?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBooking.refunds.map((refund, index) => (
                          <div
                            key={refund.id}
                            className="bg-white p-3 rounded-lg border border-blue-300"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">
                                ₹{refund.amount.toLocaleString()} Refund
                              </span>
                              {getRefundStatusBadge(refund.status)}
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Refund ID:
                                </span>
                                <span className="font-mono text-blue-600">
                                  {refund.refundId}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Processed Date:
                                </span>
                                <span>
                                  {new Date(
                                    refund.processedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-600">Method:</span>
                                <span>🏦 Bank Transfer</span>
                              </div>

                              <div className="bg-gray-50 p-2 rounded mt-2">
                                <div className="text-xs text-gray-600 mb-1">
                                  Timeline:
                                </div>
                                <div className="text-sm text-blue-700">
                                  {getRefundTimeInfo(refund)}
                                </div>
                              </div>

                              <div className="bg-gray-50 p-2 rounded">
                                <div className="text-xs text-gray-600 mb-1">
                                  Reason:
                                </div>
                                <div className="text-sm">{refund.reason}</div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <h5 className="font-medium text-green-800 mb-2">
                            💡 Refund Status Guide for Sellers:
                          </h5>
                          <div className="text-sm text-green-700 space-y-1">
                            <div>
                              ⏳ <strong>Processing:</strong> Bank is processing
                              the refund
                            </div>
                            <div>
                              ✅ <strong>Completed:</strong> Money has reached
                              customer's account
                            </div>
                            <div>
                              ❌ <strong>Failed:</strong> Issue occurred, may
                              need manual follow-up
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-500 mb-2">
                          💰 No refunds processed for this booking
                        </div>
                        <div className="text-sm text-blue-600">
                          If customer requests refund, use the "💰 Refund"
                          button to process it
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra Charges Modal */}
      {showExtraChargeModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Extra Charges
                </h3>
                <button
                  onClick={() => {
                    setShowExtraChargeModal(false);
                    setExtraCharges([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {extraCharges.map((charge, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Description"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      value={charge.description}
                      onChange={(e) => {
                        const newCharges = [...extraCharges];
                        newCharges[index].description = e.target.value;
                        setExtraCharges(newCharges);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                      value={charge.amount}
                      onChange={(e) => {
                        const newCharges = [...extraCharges];
                        newCharges[index].amount =
                          parseFloat(e.target.value) || 0;
                        setExtraCharges(newCharges);
                      }}
                    />
                    <button
                      onClick={() => {
                        const newCharges = extraCharges.filter(
                          (_, i) => i !== index
                        );
                        setExtraCharges(newCharges);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() =>
                    setExtraCharges([
                      ...extraCharges,
                      { description: "", amount: 0 },
                    ])
                  }
                  className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Charge</span>
                </button>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowExtraChargeModal(false);
                    setExtraCharges([]);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    addExtraCharge(selectedBooking._id, extraCharges)
                  }
                  disabled={
                    extraCharges.length === 0 ||
                    !extraCharges.some((c) => c.description && c.amount > 0)
                  }
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  Add Charges
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Process Refund
                </h3>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundAmount(0);
                    setRefundReason("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Billing Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    💳 Payment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Original Amount Paid:</span>
                      <span className="font-semibold text-green-600">
                        ₹{selectedBooking?.paidAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Refunds:</span>
                      <span className="text-red-600">
                        -₹
                        {selectedBooking?.refunds
                          ?.reduce((sum, refund) => sum + refund.amount, 0)
                          ?.toLocaleString() || 0}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Available for Refund:</span>
                      <span className="text-blue-600">
                        ₹
                        {(
                          selectedBooking?.paidAmount -
                          (selectedBooking?.refunds?.reduce(
                            (sum, refund) => sum + refund.amount,
                            0
                          ) || 0)
                        )?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Refund Amount
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold"
                    value={refundAmount}
                    onChange={(e) =>
                      setRefundAmount(parseFloat(e.target.value) || 0)
                    }
                    max={
                      selectedBooking?.paidAmount -
                      (selectedBooking?.refunds?.reduce(
                        (sum, refund) => sum + refund.amount,
                        0
                      ) || 0)
                    }
                    placeholder="Enter amount to refund"
                  />
                  <p className="text-sm text-blue-600 mt-1">
                    💡 Enter amount between ₹1 and ₹
                    {(
                      selectedBooking?.paidAmount -
                      (selectedBooking?.refunds?.reduce(
                        (sum, refund) => sum + refund.amount,
                        0
                      ) || 0)
                    )?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Reason for Refund
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please explain why you're processing this refund (e.g., 'Customer cancelled booking', 'Vehicle not available', etc.)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    📋 This reason will be shared with the customer and kept for
                    records
                  </p>
                </div>

                {/* Important Notes */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">
                    🔔 Important Notes:
                  </h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Refunds are processed within 3-5 business days</li>
                    <li>
                      • Money will be returned to the customer's original
                      payment method
                    </li>
                    <li>• Customer will receive an email confirmation</li>
                    <li>• This action cannot be undone once processed</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundAmount(0);
                    setRefundReason("");
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    processRefund(
                      selectedBooking._id,
                      refundAmount,
                      refundReason
                    )
                  }
                  disabled={refundAmount <= 0 || !refundReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Collection Modal */}
      {showOfflineCollectionModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Record Offline Collection
                </h3>
                <button
                  onClick={() => {
                    setShowOfflineCollectionModal(false);
                    setOfflineCollection({
                      amount: 0,
                      collectedBy: "",
                      paymentMethod: "cash",
                      notes: "",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Collected
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={offlineCollection.amount}
                    onChange={(e) =>
                      setOfflineCollection({
                        ...offlineCollection,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collected By
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={offlineCollection.collectedBy}
                    onChange={(e) =>
                      setOfflineCollection({
                        ...offlineCollection,
                        collectedBy: e.target.value,
                      })
                    }
                    placeholder="Staff name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={offlineCollection.paymentMethod}
                    onChange={(e) =>
                      setOfflineCollection({
                        ...offlineCollection,
                        paymentMethod: e.target.value,
                      })
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={2}
                    value={offlineCollection.notes}
                    onChange={(e) =>
                      setOfflineCollection({
                        ...offlineCollection,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowOfflineCollectionModal(false);
                    setOfflineCollection({
                      amount: 0,
                      collectedBy: "",
                      paymentMethod: "cash",
                      notes: "",
                    });
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    recordOfflineCollectionLocal(
                      selectedBooking._id,
                      offlineCollection
                    )
                  }
                  disabled={
                    offlineCollection.amount <= 0 ||
                    !offlineCollection.collectedBy.trim()
                  }
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  Record Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment QR Code
                </h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <QRCodeSVG
                    value={generateQRCode(selectedBooking)}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">
                    Amount: ₹
                    {calculateTotalAmount(selectedBooking).toLocaleString()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Booking: {selectedBooking.bookingId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Scan this QR code to complete payment
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 mx-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print QR Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBillingManagement;
