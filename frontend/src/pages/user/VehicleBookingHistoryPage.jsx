import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetUserVehicleBookingsQuery, useUpdateVehicleBookingStatusMutation } from "../../redux/api/vehicleApi";
import {
  FiClock,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiChevronRight,
  FiNavigation,
  FiSearch
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const VehicleBookingHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active"); // "active" or "history"

  // Standard filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
  });

  const {
    data: bookingsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserVehicleBookingsQuery(filters);

  const [updateBookingStatus, { isLoading: isCancelling }] = useUpdateVehicleBookingStatusMutation();

  const bookings = bookingsResponse?.data || [];

  // Filter bookings based on tab
  const activeBookings = bookings.filter(b =>
    ["pending", "confirmed", "ongoing", "awaiting_approval"].includes(b.bookingStatus)
  );

  const historyBookings = bookings.filter(b =>
    ["completed", "cancelled", "no-show"].includes(b.bookingStatus)
  );

  const displayBookings = activeTab === "active" ? activeBookings : historyBookings;

  useEffect(() => {
    if (location.state?.bookingSuccess) {
      toast.success("Riding soon! Booking confirmed.");
      window.history.replaceState({}, document.title); // Clear state
    }
  }, [location.state]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    try {
      await updateBookingStatus({ bookingId, status: "cancelled", notes: "User cancelled" }).unwrap();
      toast.success("Ride cancelled.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Cancellation failed");
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "ongoing": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "completed": return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      case "cancelled": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "awaiting_approval": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      default: return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">
            My Rides
          </h1>
          <div className="bg-gray-100 p-2 rounded-full border border-gray-200">
            <FiSearch className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200 relative">
          {/* Animated Background for Tab */}
          <motion.div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm z-0"
            initial={false}
            animate={{
              left: activeTab === "active" ? "4px" : "50%",
              width: "calc(50% - 4px)",
              x: activeTab === "history" ? 0 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg text-center z-10 transition-colors ${activeTab === "active" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg text-center z-10 transition-colors ${activeTab === "history" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm">Loading your journey...</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-20 opacity-0 animate-fadeIn" style={{ animationFillMode: "forwards", animationName: "fadeIn" }}>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
              <FiCalendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No {activeTab} rides</h3>
            <p className="text-gray-500 text-sm mb-8 px-8">
              {activeTab === "active"
                ? "You don't have any upcoming trips. Time to explore!"
                : "Your travel history will appear here once you complete a ride."}
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => navigate("/vehicles")}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
              >
                Book a Ride
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.bookingStatus)}`}>
                    {booking.bookingStatus.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">#{booking.bookingId.slice(-6)}</span>
                </div>

                {/* Vehicle Info */}
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={booking.vehicleId?.vehicleImages?.[0] || "/placeholder-vehicle.jpg"}
                      alt={booking.vehicleId?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{booking.vehicleId?.companyName} {booking.vehicleId?.name}</h3>
                    <p className="text-sm text-gray-500">{booking.vehicleId?.category} • {booking.vehicleId?.type}</p>
                  </div>
                </div>

                {/* Journey Details */}
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-4 border border-gray-100 mb-4">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 tracking-wider mb-1">Pickup</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <FiCalendar className="w-3.5 h-3.5 text-green-600" />
                      {formatDate(booking.startDateTime)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 tracking-wider mb-1">Dropoff</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <FiClock className="w-3.5 h-3.5 text-green-600" />
                      {formatDate(booking.endDateTime)}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Total Bill</span>
                    <span className="text-lg font-bold text-gray-900">₹{booking.billing?.totalBill}</span>
                  </div>

                  <div className="flex gap-2">
                    {booking.bookingStatus === "confirmed" && (
                      <button
                        onClick={() => cancelBooking(booking._id)}
                        disabled={isCancelling}
                        className="px-4 py-2 bg-white text-red-500 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/vehicles/bookings/${booking._id}`)}
                      className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                    >
                      Details
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VehicleBookingHistoryPage;
