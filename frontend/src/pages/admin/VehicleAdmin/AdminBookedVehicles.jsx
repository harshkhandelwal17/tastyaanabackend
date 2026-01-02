import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetAllVehicleBookingsQuery,
  useUpdateVehicleBookingStatusMutation,
} from "../../../redux/api/vehicleApi";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiEye,
  FiEdit,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
const AdminBookedVehicles = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const {
    data: bookingsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllVehicleBookingsQuery({
    ...filters,
    page: 1,
    limit: 50,
  });

  const [updateBookingStatus] = useUpdateVehicleBookingStatusMutation();

  const bookings = bookingsResponse?.data || [];

  const handleStatusUpdate = async (bookingId, newStatus, notes = "") => {
    try {
      await updateBookingStatus({
        bookingId,
        status: newStatus,
        notes,
      }).unwrap();

      toast.success(`Booking ${newStatus} successfully`);
      refetch();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: FiClock,
      },
      confirmed: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: FiCheckCircle,
      },
      ongoing: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: FiClock,
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: FiCheckCircle,
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: FiXCircle,
      },
      "no-show": {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: FiAlertCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const statusConfig = {
      unpaid: { bg: "bg-red-100", text: "text-red-800" },
      "partially-paid": { bg: "bg-yellow-100", text: "text-yellow-800" },
      paid: { bg: "bg-green-100", text: "text-green-800" },
      refunded: { bg: "bg-gray-100", text: "text-gray-800" },
      "refund-pending": { bg: "bg-orange-100", text: "text-orange-800" },
    };

    const config = statusConfig[paymentStatus] || statusConfig.unpaid;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {paymentStatus.charAt(0).toUpperCase() +
          paymentStatus.slice(1).replace("-", " ")}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInHours = Math.ceil((end - start) / (1000 * 60 * 60));
    return diffInHours;
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading bookings: {error?.data?.message || "Unknown error"}
          </p>
          <button
            onClick={refetch}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booked Vehicles</h1>
          <p className="text-gray-600 mt-1">
            Manage all vehicle bookings and their status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
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
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          #{booking.bookingId}
                        </div>
                        <div className="text-gray-500">
                          {formatDate(booking.startDateTime)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          to {formatDate(booking.endDateTime)}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {booking.customerDetails?.name}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <FiPhone className="w-3 h-3 mr-1" />
                          {booking.customerDetails?.phone}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <FiMail className="w-3 h-3 mr-1" />
                          {booking.customerDetails?.email}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 flex items-center">
                          <FaCar className="w-4 h-4 mr-1" />
                          {booking.vehicleId?.name}
                        </div>
                        <div className="text-gray-500">
                          {booking.vehicleId?.vehicleNo}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <FiMapPin className="w-3 h-3 mr-1" />
                          {booking.vehicleId?.zoneCenterName}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {calculateDuration(
                          booking.startDateTime,
                          booking.endDateTime
                        )}{" "}
                        hours
                      </div>
                      <div className="text-gray-500 text-xs">
                        {booking.rateType} plan
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">
                        ₹{booking.totalAmount?.toLocaleString()}
                      </div>
                      <div className="mt-1">
                        {getPaymentBadge(booking.paymentStatus)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.bookingStatus)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/bookings/${booking._id}`)
                          }
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {booking.bookingStatus === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(booking._id, "confirmed")
                              }
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Confirm Booking"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(booking._id, "cancelled")
                              }
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Cancel Booking"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {booking.bookingStatus === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking._id, "ongoing")
                            }
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Mark as Ongoing"
                          >
                            <FiClock className="w-4 h-4" />
                          </button>
                        )}

                        {booking.bookingStatus === "ongoing" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking._id, "completed")
                            }
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Mark as Completed"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookedVehicles;
