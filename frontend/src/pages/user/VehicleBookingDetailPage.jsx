import {
  useGetVehicleBookingByIdQuery,
  useRequestExtensionMutation,
  useVerifyExtensionPaymentMutation,
  useUploadBookingDocumentsMutation,
} from "../../redux/api/vehicleApi";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPackage,
  FiShield,
  FiDownload,
  FiHelpCircle,
  FiPhone,
  FiCheckCircle,
  FiPlusCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import ExtendBookingModal from "../../components/vehicle/ExtendBookingModal";
import toast from "react-hot-toast";
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const VehicleBookingDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const {
    data: response,
    isLoading,
    isError,
  } = useGetVehicleBookingByIdQuery(bookingId);

  const [requestExtension, { isLoading: isExtending }] =
    useRequestExtensionMutation();
  const [verifyExtensionPayment] = useVerifyExtensionPaymentMutation();
  const [uploadDocuments, { isLoading: isUploadingDocs }] = useUploadBookingDocumentsMutation();
  const [showExtendModal, setShowExtendModal] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('bookingId', bookingId);
    // Append each file. Note: backend expects 'documents' field or any field
    Array.from(files).forEach((file) => {
      formData.append('documents', file);
    });

    try {
      await uploadDocuments(formData).unwrap();
      toast.success('Documents uploaded successfully');
      // Clear input
      e.target.value = null;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.data?.message || 'Failed to upload documents');
    }
  };

  const booking = response?.data;

  const handleRequestExtension = async (newEndDateTime) => {
    try {
      await requestExtension({ bookingId, newEndDateTime }).unwrap();
      toast.success(
        "Extension request submitted! Waiting for seller approval."
      );
      setShowExtendModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to request extension");
    }
  };

  const handleExtensionPayment = (extension) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(
        (extension.additionalAmount + extension.additionalGst) * 100
      ),
      currency: "INR",
      name: "Vehicle Rental Extension",
      description: `Extension for Booking #${booking.bookingId}`,
      order_id: extension.paymentReference.razorpayOrderId,
      handler: async (response) => {
        try {
          await verifyExtensionPayment({
            bookingId,
            requestId: extension.requestId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }).unwrap();
          toast.success("Extension payment successful! Booking updated.");
        } catch (error) {
          console.error("Payment verification failed:", error);
          toast.error("Payment verification failed");
        }
      },
      prefill: {
        name: booking?.userId?.name || "",
        email: booking?.userId?.email || "",
        contact: booking?.userId?.phone || "",
      },
      theme: { color: "#4F46E5" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-gray-400">Booking not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-400";
      case "ongoing":
        return "text-blue-400";
      case "completed":
        return "text-gray-400";
      case "cancelled":
        return "text-red-400";
      case "awaiting_approval":
        return "text-orange-400";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Booking Details</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Vehicle Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
              <img
                src={
                  booking.vehicleId?.vehicleImages?.[0] ||
                  "/placeholder-vehicle.jpg"
                }
                alt={booking.vehicleId?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {booking.vehicleId?.companyName} {booking.vehicleId?.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {booking.vehicleId?.vehicleNo}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(
                    booking.bookingStatus
                  )}`}
                >
                  {booking.bookingStatus.replace("_", " ")}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                  {booking.vehicleId?.type}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                  {booking.vehicleId?.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Extensions Alert */}
        {booking.extensionRequests?.map(
          (ext, idx) =>
            (ext.status === "pending" || ext.status === "approved") && (
              <div
                key={idx}
                className={`border rounded-xl p-4 flex items-start gap-3 ${ext.status === "approved"
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
                  }`}
              >
                {ext.status === "approved" ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 mt-1" />
                ) : (
                  <FiClock className="w-5 h-5 text-blue-600 mt-1" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-bold ${ext.status === "approved"
                      ? "text-green-900"
                      : "text-blue-900"
                      }`}
                  >
                    {ext.status === "approved"
                      ? "Extension Approved"
                      : "Extension Requested"}
                  </p>
                  <div
                    className={`text-sm mt-1 ${ext.status === "approved"
                      ? "text-green-700"
                      : "text-blue-700"
                      }`}
                  >
                    <p>
                      New Drop-off: {formatDate(ext.requestedEndDateTime)} at{" "}
                      {formatTime(ext.requestedEndDateTime)}
                    </p>
                    <p>Amount: ₹{ext.additionalAmount + ext.additionalGst}</p>
                  </div>

                  {ext.status === "approved" && (
                    <button
                      onClick={() => handleExtensionPayment(ext)}
                      className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                      Pay ₹{ext.additionalAmount + ext.additionalGst} to Confirm
                    </button>
                  )}
                </div>
              </div>
            )
        )}

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <FiCalendar className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Pickup</span>
            </div>
            <p className="font-bold text-lg text-gray-900">
              {formatTime(booking.startDateTime)}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(booking.startDateTime)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
            <div className="flex items-center justify-between gap-2 mb-2 text-gray-400">
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">
                  Drop-off
                </span>
              </div>
              {["confirmed", "ongoing"].includes(booking.bookingStatus) &&
                !booking.extensionRequests?.some(
                  (e) => e.status === "pending"
                ) && (
                  <button
                    onClick={() => setShowExtendModal(true)}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
                  >
                    <FiPlusCircle className="w-3 h-3" /> Extend
                  </button>
                )}
            </div>
            <p className="font-bold text-lg text-gray-900">
              {formatTime(booking.endDateTime)}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(booking.endDateTime)}
            </p>
          </div>
        </div>

        <ExtendBookingModal
          isOpen={showExtendModal}
          onClose={() => setShowExtendModal(false)}
          booking={booking}
          currentEndTime={booking.endDateTime}
          onRequestExtension={handleRequestExtension}
          isLoading={isExtending}
        />

        {/* Location */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <FiMapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">
                Pickup & Drop Location
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {booking.centerName || "Main Center"}
                <br />
                <span className="text-xs text-gray-400">
                  {booking.zoneCenterAddress || booking.centerAddress}
                </span>
              </p>
              <button className="mt-2 text-green-600 text-sm font-medium hover:text-green-700">
                Get Directions
              </button>
            </div>
          </div>
        </div>

        {/* Accessories Checklist */}
        {booking.accessoriesChecklist && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FiPackage className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-800">Accessories Checklist</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(booking.accessoriesChecklist)
                .filter(([key]) => key !== "verifiedAt") // Exclude verifiedAt
                .map(([key, value]) => {
                  // Handle helmet count (number) differently from boolean values
                  const isHelmet = key === "helmet";
                  const isActive = isHelmet ? value > 0 : Boolean(value);
                  const displayValue =
                    isHelmet && value > 0
                      ? `Helmet (${value})`
                      : key.replace(/([A-Z])/g, " $1").trim();

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        {isActive ? (
                          <FiCheckCircle className="w-3 h-3" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Addons */}
        {booking.addons && booking.addons.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FiPackage className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-800">Add-ons</h3>
            </div>
            <div className="space-y-2">
              {booking.addons.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-800">
                      {addon.name}
                    </span>
                    <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700">
                      x{addon.count || 1}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    ₹{addon.price * (addon.count || 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Codes */}
        {booking.verificationCodes && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FiShield className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-800">Verification Codes</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    Pickup Code
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mb-1">
                  {booking.verificationCodes.pickup?.code || "----"}
                </p>
                <p className="text-xs text-green-700">
                  {booking.verificationCodes.pickup?.verified
                    ? "Verified"
                    : "Show this to seller at pickup"}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Drop Code</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mb-1">
                  {booking.verificationCodes.drop?.code || "----"}
                </p>
                <p className="text-xs text-blue-700">
                  {booking.verificationCodes.drop?.verified
                    ? "Verified"
                    : "Show this to seller at return"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents Status */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-800">Documents</h3>
            </div>
            <div>
              <input
                type="file"
                id="doc-upload"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
              />
              <label
                htmlFor="doc-upload"
                className={`cursor-pointer px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 ${isUploadingDocs ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploadingDocs ? <Loader2 className="w-3 h-3 animate-spin" /> : <FiPlusCircle className="w-3 h-3" />}
                Upload
              </label>
            </div>
          </div>
          <div className="space-y-3">
            {/* Driving License Status */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Driving License</span>
              {booking.customerDetails?.drivingLicense?.number ? (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {booking.customerDetails.drivingLicense.verified
                    ? "Verified"
                    : "Submitted"}
                </span>
              ) : (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                  Missing
                </span>
              )}
            </div>

            {/* Document Thumbnails */}
            {booking.documents && booking.documents.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Uploaded Documents ({booking.documents.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {booking.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors"
                    >
                      <img
                        src={doc.url}
                        alt={doc.type || `Document ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gray-100 flex items-center justify-center"><span class="text-xs text-gray-400">${doc.type || "File"
                            }</span></div>`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          View
                        </span>
                      </div>
                      {/* Document type badge */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-[10px] text-white truncate capitalize">
                          {doc.type?.replace("-", " ") || "Document"}
                        </p>
                      </div>
                      {/* Verified badge */}
                      {doc.verified && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <FiCheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* No documents message */}
            {(!booking.documents || booking.documents.length === 0) && (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <FiShield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Payment Summary</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Base Rental</span>
              <span>₹{booking.billing?.baseAmount}</span>
            </div>

            {/* Addons in billing */}
            {booking.addons &&
              booking.addons.length > 0 &&
              booking.addons.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm text-gray-500"
                >
                  <span>
                    {addon.name} x{addon.count || 1}
                  </span>
                  <span>₹{addon.price * (addon.count || 1)}</span>
                </div>
              ))}

            {booking.billing?.damageCharges > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FiShield className="w-3 h-3" /> Damages
                </span>
                <span>₹{booking.billing?.damageCharges}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Taxes & Fees</span>
              <span>
                ₹
                {(booking.billing?.taxes?.gst || 0) +
                  (booking.billing?.taxes?.serviceTax || 0)}
              </span>
            </div>
            {booking.depositAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Security Deposit (Refundable)</span>
                <span>₹{booking.depositAmount}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-gray-900 font-bold">
              <span>Total Amount</span>
              <span className="text-xl">₹{booking.billing?.totalBill}</span>
            </div>

            {/* Detailed Payment Breakdown */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid Amount</span>
                <span className="text-green-600 font-bold">
                  ₹{booking.paidAmount || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining Amount</span>
                <span className="text-red-500 font-bold">
                  ₹
                  {Math.max(
                    0,
                    (booking.billing?.totalBill || 0) -
                    (booking.paidAmount || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">Payment Status</span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.paymentStatus === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors">
            <FiPhone className="w-6 h-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Call Support
            </span>
          </button>
          <button className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors">
            <FiHelpCircle className="w-6 h-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">FAQs</span>
          </button>
        </div>

        {/* Footer Buttons */}
        {booking.bookingStatus === "completed" && (
          <button className="w-full py-4 bg-green-600 rounded-xl font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
            <FiDownload className="w-5 h-5" />
            Download Invoice
          </button>
        )}
      </div>
    </div>
  );
};

export default VehicleBookingDetailPage;
