import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Edit,
  MessageSquare,
  Star,
  Activity,
  DollarSign,
  Truck,
  Settings,
} from "lucide-react";
import {
  getBookingDetails,
  updateBookingStatus,
  respondToExtension,
  createExtension,
} from "../../api/sellerVehicleApi";
import SellerExtendBookingModal from "../../components/vehicle/SellerExtendBookingModal";

const SellerBookingDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await getBookingDetails(bookingId);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionResponse = async (requestId, action) => {
    try {
      const reason =
        action === "reject"
          ? prompt("Enter rejection reason (optional):")
          : null;
      if (action === "reject" && reason === null) return; // Cancelled prompt

      await respondToExtension(bookingId, {
        requestId,
        action,
        rejectionReason: reason,
      });
      toast.success(`Extension request ${action}ed`);
      fetchBookingDetails(); // Refresh
    } catch (error) {
      console.error("Extension response error:", error);
      toast.error(error.message || "Failed to process extension");
    }
  };

  const handleCreateExtension = async (extensionData) => {
    try {
      await createExtension(bookingId, extensionData);
      toast.success("Extension created successfully");
      setShowExtensionModal(false);
      fetchBookingDetails(); // Refresh
    } catch (error) {
      console.error("Extension creation error:", error);
      toast.error(error.message || "Failed to create extension");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    // ... existing status logic
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      "in-progress": { color: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { color: "bg-gray-100 text-gray-800", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateBookingStatus(bookingId, { status: newStatus });
      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookingDetails(); // Refresh data
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Booking not found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            The booking you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Booking Details
                </h1>
                <p className="text-sm text-gray-500">#{booking.bookingId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Extend Booking Button - Show only for active bookings */}
              {["confirmed", "ongoing"].includes(booking.bookingStatus) && (
                <button
                  onClick={() => setShowExtensionModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Extend Booking
                </button>
              )}
              {getStatusBadge(booking.bookingStatus)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Extension Requests Alert */}
            {booking.extensionRequests?.map(
              (ext, idx) =>
                ext.status === "pending" && (
                  <div
                    key={idx}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">
                            Extension Requested
                          </h3>
                          <p className="text-blue-700 mt-1">
                            <span className="font-medium">New End Time:</span>{" "}
                            {formatDate(ext.requestedEndDateTime)} at{" "}
                            {formatTime(ext.requestedEndDateTime)}
                          </p>
                          <div className="mt-2 text-sm text-blue-600 space-y-1">
                            <p>• {ext.additionalHours} additional hours</p>
                            <p>
                              • ₹{ext.additionalAmount + ext.additionalGst} to
                              collect
                            </p>
                            <p>• +{ext.additionalKmLimit} km limit</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleExtensionResponse(ext.requestId, "reject")
                          }
                          className="px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            handleExtensionResponse(ext.requestId, "approve")
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm shadow-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )
            )}

            {/* Vehicle Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Vehicle Information
              </h3>
              <div className="flex items-start space-x-4">
                {booking.vehicleId?.vehicleImages?.[0] && (
                  <div className="flex-shrink-0">
                    <img
                      src={booking.vehicleId.vehicleImages[0]}
                      alt="Vehicle"
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                    {booking.vehicleId?.vehicleImages?.length > 1 && (
                      <div className="flex mt-2 space-x-1">
                        {booking.vehicleId.vehicleImages
                          .slice(1, 4)
                          .map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Vehicle ${index + 2}`}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ))}
                        {booking.vehicleId.vehicleImages.length > 4 && (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                            +{booking.vehicleId.vehicleImages.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">
                    {booking.vehicleId?.companyName} {booking.vehicleId?.name}
                  </h4>
                  <p className="text-gray-600 text-lg font-medium">
                    {booking.vehicleId?.vehicleNo}
                  </p>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium capitalize">
                        {booking.vehicleId?.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fuel Type:</span>
                      <span className="ml-2 font-medium">
                        {booking.vehicleId?.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <span className="ml-2 font-medium">
                        {booking.vehicleId?.color || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mileage:</span>
                      <span className="ml-2 font-medium">
                        {booking.vehicleId?.mileage || "N/A"} km/l
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fuel Capacity:</span>
                      <span className="ml-2 font-medium">
                        {booking.vehicleId?.fuelCapacity || "N/A"} L
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Meter Reading:</span>
                      <span className="ml-2 font-medium">
                        {booking.vehicleId?.meterReading || "N/A"} km
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Features */}
                  {booking.vehicleId?.vehicleFeatures &&
                    booking.vehicleId.vehicleFeatures.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Features:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {booking.vehicleId.vehicleFeatures.map(
                            (feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {feature}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {booking.customerDetails?.name}
                    </p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {booking.customerDetails?.phone}
                    </p>
                    <p className="text-sm text-gray-500">Phone</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {booking.customerDetails?.email}
                    </p>
                    <p className="text-sm text-gray-500">Email</p>
                  </div>
                </div>
                {booking.customerDetails?.drivingLicense?.number && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {booking.customerDetails.drivingLicense.number}
                      </p>
                      <p className="text-sm text-gray-500">Driving License</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Timeline & Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking Timeline & Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Start Time</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.startDateTime)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(booking.startDateTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">End Time</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.endDateTime)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(booking.endDateTime)}
                      </p>
                    </div>
                  </div>
                  {booking.actualStartTime && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Actual Start</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.actualStartTime)} at{" "}
                          {formatTime(booking.actualStartTime)}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.actualEndTime && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Actual End</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.actualEndTime)} at{" "}
                          {formatTime(booking.actualEndTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium">Pickup Location</p>
                      <p className="text-sm text-gray-600">
                        {booking.pickupLocation?.address ||
                          booking.centerName ||
                          "Center Pickup"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {booking.pickupLocation?.type || "center"} pickup
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <p className="font-medium">Drop Location</p>
                      <p className="text-sm text-gray-600">
                        {booking.dropLocation?.address ||
                          booking.centerName ||
                          "Center Drop"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {booking.dropLocation?.type || "center"} drop
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Zone</p>
                      <p className="text-sm text-gray-600">{booking.zone}</p>
                      <p className="text-xs text-gray-500">
                        {booking.centerName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Codes */}
            {booking.verificationCodes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Verification Codes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        Pickup Code
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {booking.verificationCodes.pickup?.code ||
                        "Not Generated"}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {booking.verificationCodes.pickup?.verified
                        ? "Verified"
                        : "Not Verified"}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Drop Code
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {booking.verificationCodes.drop?.code || "Not Generated"}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {booking.verificationCodes.drop?.verified
                        ? "Verified"
                        : "Not Verified"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {booking.documents && booking.documents.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {booking.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium capitalize">
                            {doc.type.replace("-", " ")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded:{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.verified ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            ⏳ Pending
                          </span>
                        )}
                        <button
                          onClick={() => window.open(doc.url, "_blank")}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.url;
                            link.download = doc.type;
                            link.click();
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rate Plan & Add-ons */}
            {(booking.ratePlanUsed || booking.addons) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Rate Plan & Add-ons
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {booking.ratePlanUsed && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Rate Plan Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate Type:</span>
                          <span className="font-medium capitalize">
                            {booking.rateType || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Rate:</span>
                          <span className="font-medium">
                            ₹
                            {booking.ratePlanUsed.baseRate ||
                              booking.ratePlanUsed.ratePerHour ||
                              "N/A"}
                            /hr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">KM Limit:</span>
                          <span className="font-medium">
                            {booking.ratePlanUsed.kmLimit || "N/A"} km
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Extra KM Charge:
                          </span>
                          <span className="font-medium">
                            ₹{booking.ratePlanUsed.extraChargePerKm || "N/A"}/km
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Extra Hour Charge:
                          </span>
                          <span className="font-medium">
                            ₹{booking.ratePlanUsed.extraChargePerHour || "N/A"}
                            /hr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grace Period:</span>
                          <span className="font-medium">
                            {booking.ratePlanUsed.gracePeriodMinutes || "N/A"}{" "}
                            mins
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Includes Fuel:</span>
                          <span
                            className={`font-medium ${
                              booking.ratePlanUsed.includesFuel
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {booking.ratePlanUsed.includesFuel ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {booking.addons && booking.addons.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Add-ons & Extras
                      </h4>
                      <div className="space-y-3">
                        {booking.addons.map((addon, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{addon.name}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: {addon.count || 1}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ₹{addon.price * (addon.count || 1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                ₹{addon.price} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ride Tracking */}
            {booking.rideTracking && booking.rideTracking.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ride Tracking History
                </h3>
                <div className="space-y-4">
                  {booking.rideTracking.map((track, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {track.status.replace("-", " ")}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(track.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{track.kmReading} km</p>
                          {track.fuelLevel && (
                            <p className="text-sm text-gray-600">
                              Fuel: {track.fuelLevel}%
                            </p>
                          )}
                        </div>
                      </div>
                      {track.notes && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{track.notes}"
                        </p>
                      )}
                      {track.images && track.images.length > 0 && (
                        <div className="flex space-x-2 mt-2">
                          {track.images.map((image, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={image}
                              alt={`Tracking ${imgIndex + 1}`}
                              className="w-12 h-12 rounded object-cover cursor-pointer"
                              onClick={() => window.open(image, "_blank")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment History
                </h3>
                <div className="space-y-3">
                  {booking.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">₹{payment.amount}</p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentType} via {payment.paymentMethod}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === "success"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                        {payment.paymentReference?.transactionId && (
                          <p className="text-xs text-gray-500 mt-1">
                            TXN:{" "}
                            {payment.paymentReference.transactionId.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            {booking.statusHistory && booking.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Status History
                </h3>
                <div className="space-y-3">
                  {booking.statusHistory.map((history, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          history.status === "completed"
                            ? "bg-green-500"
                            : history.status === "cancelled"
                            ? "bg-red-500"
                            : history.status === "confirmed"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {history.status.replace("-", " ")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(history.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            "{history.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Rating & Feedback */}
            {booking.rating && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Customer Rating & Feedback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {booking.rating.vehicleCondition && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {booking.rating.vehicleCondition}/5
                      </p>
                      <p className="text-sm text-gray-600">Vehicle Condition</p>
                    </div>
                  )}
                  {booking.rating.serviceQuality && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {booking.rating.serviceQuality}/5
                      </p>
                      <p className="text-sm text-gray-600">Service Quality</p>
                    </div>
                  )}
                  {booking.rating.valueForMoney && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {booking.rating.valueForMoney}/5
                      </p>
                      <p className="text-sm text-gray-600">Value for Money</p>
                    </div>
                  )}
                  {booking.rating.overall && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {booking.rating.overall}/5
                      </p>
                      <p className="text-sm text-gray-600">Overall Rating</p>
                    </div>
                  )}
                </div>
                {booking.rating.feedback && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 italic">
                      "{booking.rating.feedback}"
                    </p>
                    {booking.rating.ratedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Rated on{" "}
                        {new Date(booking.rating.ratedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Disputes */}
            {booking.disputes && booking.disputes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Disputes
                </h3>
                <div className="space-y-4">
                  {booking.disputes.map((dispute, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-red-900 capitalize">
                          {dispute.type} Dispute
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dispute.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : dispute.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {dispute.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Raised on{" "}
                        {new Date(dispute.raisedAt).toLocaleDateString()}
                      </p>
                      {dispute.resolution && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-green-800">
                            Resolution:
                          </p>
                          <p className="text-sm text-gray-700">
                            {dispute.resolution}
                          </p>
                          {dispute.resolvedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Resolved on{" "}
                              {new Date(
                                dispute.resolvedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div className="flex space-x-2 mt-2">
                          {dispute.evidence.map((evidence, evidenceIndex) => (
                            <button
                              key={evidenceIndex}
                              onClick={() => window.open(evidence, "_blank")}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Evidence {evidenceIndex + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(booking.specialRequests ||
              booking.adminNotes ||
              booking.cancellationReason) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {booking.specialRequests && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Special Requests
                      </h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        {booking.specialRequests}
                      </p>
                    </div>
                  )}
                  {booking.adminNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Admin Notes
                      </h4>
                      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                        {booking.adminNotes}
                      </p>
                    </div>
                  )}
                  {booking.cancellationReason && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Cancellation Reason
                      </h4>
                      <p className="text-sm text-gray-600 bg-red-50 p-3 rounded">
                        {booking.cancellationReason}
                      </p>
                      {booking.cancellationCharges > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Cancellation Charges: ₹{booking.cancellationCharges}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detailed Billing Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detailed Billing Information
              </h3>
              <div className="space-y-4">
                {/* Base Charges */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Rental Charges
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-medium">
                        ₹{booking.billing?.baseAmount || 0}
                      </span>
                    </div>
                    {booking.billing?.extraKmCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extra KM Charges</span>
                        <span className="font-medium">
                          ₹{booking.billing.extraKmCharge}
                        </span>
                      </div>
                    )}
                    {booking.billing?.extraHourCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Extra Hour Charges
                        </span>
                        <span className="font-medium">
                          ₹{booking.billing.extraHourCharge}
                        </span>
                      </div>
                    )}
                    {booking.billing?.fuelCharges > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fuel Charges</span>
                        <span className="font-medium">
                          ₹{booking.billing.fuelCharges}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Charges */}
                {(booking.billing?.damageCharges > 0 ||
                  booking.billing?.cleaningCharges > 0 ||
                  booking.billing?.tollCharges > 0 ||
                  booking.billing?.lateFees > 0) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">
                      Additional Charges
                    </h4>
                    <div className="space-y-2">
                      {booking.billing?.damageCharges > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Damage Charges</span>
                          <span className="font-medium text-red-600">
                            ₹{booking.billing.damageCharges}
                          </span>
                        </div>
                      )}
                      {booking.billing?.cleaningCharges > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Cleaning Charges
                          </span>
                          <span className="font-medium">
                            ₹{booking.billing.cleaningCharges}
                          </span>
                        </div>
                      )}
                      {booking.billing?.tollCharges > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Toll Charges</span>
                          <span className="font-medium">
                            ₹{booking.billing.tollCharges}
                          </span>
                        </div>
                      )}
                      {booking.billing?.lateFees > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Late Return Fees
                          </span>
                          <span className="font-medium text-orange-600">
                            ₹{booking.billing.lateFees}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add-ons Total */}
                {booking.addons && booking.addons.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Add-ons Total</span>
                    <span className="font-medium">
                      ₹
                      {booking.addons.reduce(
                        (sum, addon) => sum + addon.price * (addon.count || 1),
                        0
                      )}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {booking.billing?.discount?.amount > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">
                      Discount
                    </h4>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-600">
                          {booking.billing.discount.couponCode
                            ? `Coupon (${booking.billing.discount.couponCode})`
                            : "Discount"}
                        </span>
                        {booking.billing.discount.discountType && (
                          <p className="text-xs text-gray-500 capitalize">
                            {booking.billing.discount.discountType}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-green-600">
                        -₹{booking.billing.discount.amount}
                      </span>
                    </div>
                  </div>
                )}

                <hr />

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ₹
                    {(booking.billing?.baseAmount || 0) +
                      (booking.billing?.extraKmCharge || 0) +
                      (booking.billing?.extraHourCharge || 0) +
                      (booking.billing?.fuelCharges || 0) +
                      (booking.billing?.damageCharges || 0) +
                      (booking.billing?.cleaningCharges || 0) +
                      (booking.billing?.tollCharges || 0) +
                      (booking.billing?.lateFees || 0) +
                      (booking.addons
                        ? booking.addons.reduce(
                            (sum, addon) =>
                              sum + addon.price * (addon.count || 1),
                            0
                          )
                        : 0) -
                      (booking.billing?.discount?.amount || 0)}
                  </span>
                </div>

                {/* Taxes */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Taxes
                  </h4>
                  <div className="space-y-2">
                    {booking.billing?.taxes?.gst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST</span>
                        <span className="font-medium">
                          ₹{booking.billing.taxes.gst}
                        </span>
                      </div>
                    )}
                    {booking.billing?.taxes?.serviceTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Tax</span>
                        <span className="font-medium">
                          ₹{booking.billing.taxes.serviceTax}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">
                    ₹{booking.depositAmount || 0}
                  </span>
                </div>

                <hr className="border-2" />

                {/* Total */}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>₹{booking.billing?.totalBill || 0}</span>
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : booking.paymentStatus === "partially-paid"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {booking.paymentStatus?.replace("-", " ")}
                  </span>
                </div>

                {/* Amount Paid */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-medium text-green-600">
                    ₹{booking.paidAmount || 0}
                  </span>
                </div>

                {/* Outstanding Amount */}
                {booking.paidAmount < booking.billing?.totalBill && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Outstanding Amount</span>
                    <span className="font-medium text-red-600">
                      ₹
                      {(booking.billing?.totalBill || 0) -
                        (booking.paidAmount || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Accessories & Vehicle Return */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Accessories & Vehicle Return
              </h3>

              {booking.accessoriesChecklist && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Accessories Checklist
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Helmets
                      </span>
                      <span className="font-medium text-blue-600">
                        {booking.accessoriesChecklist.helmet || 0} pcs
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600 flex items-center">
                        <span
                          className={`w-2 h-2 ${
                            booking.accessoriesChecklist.toolkit
                              ? "bg-green-500"
                              : "bg-red-500"
                          } rounded-full mr-2`}
                        ></span>
                        Toolkit
                      </span>
                      <span
                        className={`font-medium ${
                          booking.accessoriesChecklist.toolkit
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {booking.accessoriesChecklist.toolkit
                          ? "✓ Yes"
                          : "✗ No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600 flex items-center">
                        <span
                          className={`w-2 h-2 ${
                            booking.accessoriesChecklist.spareTyre
                              ? "bg-green-500"
                              : "bg-red-500"
                          } rounded-full mr-2`}
                        ></span>
                        Spare Tyre
                      </span>
                      <span
                        className={`font-medium ${
                          booking.accessoriesChecklist.spareTyre
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {booking.accessoriesChecklist.spareTyre
                          ? "✓ Yes"
                          : "✗ No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-gray-600 flex items-center">
                        <span
                          className={`w-2 h-2 ${
                            booking.accessoriesChecklist.firstAidKit
                              ? "bg-green-500"
                              : "bg-red-500"
                          } rounded-full mr-2`}
                        ></span>
                        First Aid Kit
                      </span>
                      <span
                        className={`font-medium ${
                          booking.accessoriesChecklist.firstAidKit
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {booking.accessoriesChecklist.firstAidKit
                          ? "✓ Yes"
                          : "✗ No"}
                      </span>
                    </div>
                  </div>
                  {booking.accessoriesChecklist.verifiedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Verified on{" "}
                      {new Date(
                        booking.accessoriesChecklist.verifiedAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Vehicle Return Information */}
              {booking.vehicleReturn && (
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Vehicle Return Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Return Submitted</p>
                        <p className="text-sm text-gray-600">
                          {booking.vehicleReturn.submitted ? "Yes" : "No"}
                        </p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          booking.vehicleReturn.submitted
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>

                    {booking.vehicleReturn.submitted && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Vehicle Condition</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {booking.vehicleReturn.condition}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.vehicleReturn.condition === "excellent"
                                ? "bg-green-100 text-green-800"
                                : booking.vehicleReturn.condition === "good"
                                ? "bg-blue-100 text-blue-800"
                                : booking.vehicleReturn.condition === "fair"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.vehicleReturn.condition}
                          </span>
                        </div>

                        {booking.vehicleReturn.damageNotes && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="font-medium text-red-900 mb-1">
                              Damage Notes
                            </p>
                            <p className="text-sm text-red-800">
                              {booking.vehicleReturn.damageNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Submitted At:</span>
                          <span className="font-medium">
                            {new Date(
                              booking.vehicleReturn.submittedAt
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              Vehicle Available Again
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.vehicleReturn.vehicleAvailableAgain
                                ? "Yes"
                                : "No"}
                            </p>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              booking.vehicleReturn.vehicleAvailableAgain
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                          ></div>
                        </div>

                        {booking.vehicleReturn.madeAvailableAt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Made Available At:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                booking.vehicleReturn.madeAvailableAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Refund Information */}
            {booking.refundDetails && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Refund Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Reason:</span>
                    <span className="font-medium capitalize">
                      {booking.refundDetails.reason?.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested Amount:</span>
                    <span className="font-medium">
                      ₹{booking.refundDetails.requestedAmount || 0}
                    </span>
                  </div>
                  {booking.refundDetails.approvedAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved Amount:</span>
                      <span className="font-medium text-green-600">
                        ₹{booking.refundDetails.approvedAmount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Method:</span>
                    <span className="font-medium capitalize">
                      {booking.refundDetails.refundMethod?.replace("-", " ")}
                    </span>
                  </div>
                  {booking.refundDetails.bankDetails && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Bank Details
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Account:</span>
                          <span className="ml-2 font-medium">
                            {booking.refundDetails.bankDetails.accountNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">IFSC:</span>
                          <span className="ml-2 font-medium">
                            {booking.refundDetails.bankDetails.ifscCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Holder:</span>
                          <span className="ml-2 font-medium">
                            {booking.refundDetails.bankDetails.holderName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bank:</span>
                          <span className="ml-2 font-medium">
                            {booking.refundDetails.bankDetails.bankName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {booking.refundDetails.processedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed Date:</span>
                      <span className="font-medium">
                        {new Date(
                          booking.refundDetails.processedDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {booking.refundDetails.refundReference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">
                        {booking.refundDetails.refundReference}
                      </span>
                    </div>
                  )}
                  {booking.refundDetails.notes && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {booking.refundDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                {booking.bookingStatus === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Confirm Booking
                  </button>
                )}
                {booking.bookingStatus === "confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate("in-progress")}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Trip
                  </button>
                )}
                {booking.bookingStatus === "in-progress" && (
                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Complete Trip
                  </button>
                )}
                <button
                  onClick={() =>
                    navigate(`/seller/vehicles/bookings/${bookingId}/handover`)
                  }
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Vehicle Handover
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Print Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Extension Modal */}
      <SellerExtendBookingModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        booking={booking}
        currentEndTime={booking.endDateTime}
        onCreateExtension={handleCreateExtension}
        isLoading={false}
      />
    </div>
  );
};

export default SellerBookingDetailPage;
