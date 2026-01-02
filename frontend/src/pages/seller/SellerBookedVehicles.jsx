import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  XCircle,
  Car,
  Search,
  Calendar,
  User,
  Clock,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  NotebookPen,
  Truck,
} from "lucide-react";
import {
  getSellerBookings,
  formatBookingForDisplay,
  getStatusBadgeColor,
} from "../../api/sellerVehicleApi";
import VehicleDropModal from "../../components/seller/VehicleDropModal";

const SellerBookedVehicles = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "bookingDate",
    sortOrder: "desc",
  });
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const isCurrentlyBooked = (booking) => {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    return (
      now >= startDate &&
      now <= endDate &&
      ["confirmed", "in-progress"].includes(booking.status)
    );
  };

  // Handle viewing booking details
  const handleViewBooking = (bookingId) => {
    navigate(`/seller/vehicles/bookings/${bookingId}`);
  };

  const handleDropVehicle = (booking) => {
    setSelectedBooking(booking);
    setDropModalOpen(true);
  };

  const handleDropSuccess = () => {
    setDropModalOpen(false);
    setSelectedBooking(null);
    fetchBookings(); // Refresh the list
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <NotebookPen className="w-8 h-8 text-blue-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Booked Vehicles
                </h1>
                <p className="text-sm text-gray-500">
                  View currently booked and upcoming bookings
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {bookings.length} bookings
              </span>
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by booking ID, customer, vehicle..."
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
                <option value="confirmed,in-progress">Active Bookings</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="in-progress">In Progress Only</option>
                <option value="">All Bookings</option>
              </select>

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="startDate-asc">Start Date (Earliest)</option>
                <option value="startDate-desc">Start Date (Latest)</option>
                <option value="endDate-asc">End Date (Earliest)</option>
                <option value="endDate-desc">End Date (Latest)</option>
                <option value="bookingDate-desc">Booking Date (Latest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="w-24 h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => {
                const formattedBooking = formatBookingForDisplay(booking);
                const currentlyBooked = isCurrentlyBooked(booking);

                return (
                  <div
                    key={booking._id}
                    className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 ${
                      currentlyBooked ? "border-orange-500" : "border-blue-500"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Left side - Vehicle and Customer Info */}
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Vehicle Image */}
                          <div className="flex-shrink-0">
                            {formattedBooking.vehicle.images?.[0] ? (
                              <img
                                src={formattedBooking.vehicle.images[0]}
                                alt="Vehicle"
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Car className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {formattedBooking.vehicle.brand}{" "}
                                {formattedBooking.vehicle.model}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                  formattedBooking.status
                                )}`}
                              >
                                {formattedBooking.status}
                              </span>
                              {currentlyBooked && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Currently Booked
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Customer Info */}
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">
                                    {formattedBooking.customer.name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {formattedBooking.customer.phone}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    Booking ID: {formattedBooking.bookingId}
                                  </span>
                                </div>
                              </div>

                              {/* Booking Details */}
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-900">
                                    {formatDate(formattedBooking.startDate)} -{" "}
                                    {formatDate(formattedBooking.endDate)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {formatTime(formattedBooking.startDate)} -{" "}
                                    {formatTime(formattedBooking.endDate)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600 text-xs truncate">
                                    {typeof formattedBooking.pickupLocation ===
                                    "string"
                                      ? formattedBooking.pickupLocation
                                      : "Location not specified"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Amount and Actions */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xl font-bold text-gray-900 mb-2">
                            ₹{formattedBooking.totalAmount?.toLocaleString()}
                          </div>
                          <div
                            className={`text-xs mb-3 ${getStatusBadgeColor(
                              formattedBooking.paymentStatus
                            )}`}
                          >
                            {formattedBooking.paymentStatus}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleViewBooking(formattedBooking.id)
                              }
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            {/* Show Drop Vehicle button only for ongoing bookings */}
                            {formattedBooking.status === "ongoing" && (
                              <button
                                onClick={() => handleDropVehicle(booking)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                              >
                                <Truck className="w-3 h-3 mr-1" />
                                Drop
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
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
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            pagination.currentPage === pageNum
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
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <XCircle className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No booked vehicles
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filters.search
                ? "Try adjusting your search filters."
                : "No vehicles are currently booked. Bookings will appear here when customers book your vehicles."}
            </p>
          </div>
        )}
      </div>

      {/* Vehicle Drop Modal */}
      {dropModalOpen && selectedBooking && (
        <VehicleDropModal
          booking={selectedBooking}
          onClose={() => setDropModalOpen(false)}
          onSuccess={handleDropSuccess}
        />
      )}
    </div>
  );
};

export default SellerBookedVehicles;
