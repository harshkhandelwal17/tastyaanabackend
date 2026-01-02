import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Camera,
  Upload,
  AlertCircle,
  Shield,
  FileText,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Edit2,
  X,
} from "lucide-react";
import {
  useGetBookingDetailsQuery,
  useVerifyBookingOtpMutation,
  useUpdateBookingStatusMutation,
  useUpdateBookingDetailsMutation,
  useRecalculateBillOnDropMutation,
} from "../../redux/api/sellerVehicleSliceApi";
import { formatBookingForDisplay } from "../../api/sellerVehicleApi";

const SellerVehicleHandoverPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pickup"); // 'pickup' | 'dropoff'

  // --- RTK Query Hooks ---
  const {
    data: bookingData,
    isLoading: loading,
    isError,
  } = useGetBookingDetailsQuery(bookingId, {
    pollingInterval: 0, // Disable polling unless needed
    refetchOnMountOrArgChange: true,
  });

  const [verifyOtp, { isLoading: verifyingOtp }] =
    useVerifyBookingOtpMutation();
  const [updateStatus, { isLoading: updatingStatus }] =
    useUpdateBookingStatusMutation();
  const [updateDetails, { isLoading: updatingDetails }] =
    useUpdateBookingDetailsMutation();
  const [recalculateBill, { isLoading: isRecalculating }] =
    useRecalculateBillOnDropMutation();

  const [booking, setBooking] = useState(null);

  // --- Form States ---
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [wasAlreadyVerified, setWasAlreadyVerified] = useState(false);

  const [documents, setDocuments] = useState({
    license: { status: "pending", type: "digital" },
    govId: { status: "pending", type: "digital" },
  });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [meterReading, setMeterReading] = useState("");
  const [accessories, setAccessories] = useState({
    helmet: true,
    toolkit: true,
    spareTyre: true,
  });

  const [paymentMode, setPaymentMode] = useState("cash");
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // --- Edit Modal State ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    startDateTime: "",
    endDateTime: "",
    notes: "",
  });

  // Update local state when data loads
  useEffect(() => {
    if (bookingData?.data) {
      const formatted = formatBookingForDisplay(bookingData.data);
      setBooking(formatted);

      console.log(
        "🔍 Debug - Raw booking data:",
        bookingData.data.verificationCodes
      );
      console.log(
        "🔍 Debug - Formatted booking data:",
        formatted.verificationCodes
      );

      // Check if pickup verification is already completed
      if (formatted.verificationCodes?.pickup?.verified) {
        console.log("✅ Pickup already verified! Setting state...");
        setIsOtpVerified(true);
        setWasAlreadyVerified(true);
        // Set OTP display to show the verified code
        const verifiedCode = formatted.verificationCodes.pickup.code;
        if (verifiedCode) {
          setOtp(verifiedCode.split(""));
          console.log("🔍 Setting OTP to:", verifiedCode.split(""));
        }
      } else {
        console.log("❌ Pickup not verified or data missing");
        console.log("Verification data:", formatted.verificationCodes?.pickup);
      }

      // Auto-set tab based on status
      if (
        formatted.status === "in-progress" ||
        formatted.status === "ongoing"
      ) {
        setActiveTab("dropoff");
      }

      // Pre-fill amount if needed
      if (formatted.paymentStatus !== "paid" && !collectedAmount) {
        setCollectedAmount(formatted.totalAmount);
      }
    }
  }, [bookingData]);

  if (isError) {
    toast.error("Failed to load booking details");
    navigate(-1);
    return null;
  }

  // --- Handlers ---

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 4) return toast.error("Enter 4-digit OTP");

    try {
      const response = await verifyOtp({ bookingId, otp: code }).unwrap();
      setIsOtpVerified(true);

      // Handle both new verification and already verified cases
      if (response.data?.booking?.alreadyVerified) {
        toast.success("Pickup code was already verified!", {
          icon: "✅",
        });
      } else {
        toast.success("Identity Verified!");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Invalid OTP");
    }
  };

  const handleRecalculate = async () => {
    if (!meterReading) return toast.error("Enter Meter Reading first");
    try {
      await recalculateBill({
        bookingId,
        actualEndTime: new Date().toISOString(),
        actualKmReading: Number(meterReading),
      }).unwrap();
      toast.success("Bill recalculated successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Recalculation failed");
    }
  };

  const handleViewDocument = (docType) => {
    console.log(booking);
    if (booking?.documents?.length > 0) {
      const document = booking.documents.find(
        (doc) =>
          doc.type?.toLowerCase().includes(docType.toLowerCase()) ||
          doc.originalName?.toLowerCase().includes(docType.toLowerCase())
      );
      if (document) {
        setSelectedDocument(document);
        setShowDocumentModal(true);
      } else {
        toast.error(`No ${docType} document found`);
      }
    } else {
      toast.error("No documents uploaded for this booking");
    }
  };

  const handleSubmit = async () => {
    if (activeTab === "pickup" && !isOtpVerified) {
      return toast.error("Please verify Customer Identity first");
    }
    if (!meterReading) {
      return toast.error("Please enter Meter Reading");
    }

    try {
      const data = {
        bookingId,
        status: activeTab === "pickup" ? "ongoing" : "completed",
        meterReading,
        accessories,
        documentsStatus: documents,
        payment: {
          mode: paymentMode,
          collected: collectedAmount,
          notes,
        },
        notes,
      };

      await updateStatus(data).unwrap();
      toast.success(
        `${activeTab === "pickup" ? "Vehicle Handover" : "Return"} Successful!`
      );
      navigate("/seller/vehicles/bookings");
    } catch (error) {
      toast.error(error?.data?.message || "Process Failed");
    }
  };

  // --- Edit Handlers ---
  const openEditModal = () => {
    if (booking) {
      setEditData({
        startDateTime: booking.startDate
          ? new Date(booking.startDate).toISOString().slice(0, 16)
          : "",
        endDateTime: booking.endDate
          ? new Date(booking.endDate).toISOString().slice(0, 16)
          : "",
        notes: booking.notes || "",
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await updateDetails({ bookingId, ...editData }).unwrap();
      toast.success("Booking details updated");
      setShowEditModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Update Failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">
                  Order #{booking.bookingId?.slice(-6)}
                </h1>
                <button
                  onClick={openEditModal}
                  className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {booking.vehicle?.brand} {booking.vehicle?.model} •{" "}
                {booking.vehicle?.registrationNumber}
              </p>
            </div>
          </div>
          <button className="text-xs font-bold text-green-400 border border-green-500/50 px-3 py-1 rounded-full">
            Help
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Toggle Tabs */}
        <div className="bg-gray-800 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab("pickup")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "pickup"
                ? "bg-gray-700 text-white shadow"
                : "text-gray-400"
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setActiveTab("dropoff")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "dropoff"
                ? "bg-gray-700 text-white shadow"
                : "text-gray-400"
            }`}
          >
            Drop-off
          </button>
        </div>

        {/* --- STEP 1: VERIFICATION --- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h3 className="font-bold text-gray-800">Customer Verification</h3>
            </div>
            {isOtpVerified ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                Verified
              </span>
            ) : (
              <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Pending
              </span>
            )}
          </div>

          {!isOtpVerified ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-3">
                Ask customer for the 4-digit OTP sent to their app.
              </p>
              <div className="flex justify-between gap-2 mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                ))}
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20 disabled:opacity-70"
              >
                {verifyingOtp ? "Verifying..." : "Verify Identity"}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3 border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">
                  Identity Verified ✅{" "}
                  {wasAlreadyVerified ? "(Previously Verified)" : ""}
                </p>
                <p className="text-xs text-green-700">
                  Customer pickup code {otp.join("") || "verified"} matched
                  successfully.
                </p>
                {booking?.verificationCodes?.pickup?.verifiedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Verified on{" "}
                    {new Date(
                      booking.verificationCodes.pickup.verifiedAt
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- STEP 2: DOCUMENTS --- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h3 className="font-bold text-gray-800">Documents</h3>
          </div>

          <div className="space-y-3">
            {/* License */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">
                    Driving License
                  </p>
                  <p className="text-xs text-green-600">
                    {booking?.customerDetails?.drivingLicense?.verified
                      ? "Verified"
                      : "Pending Verification"}
                  </p>
                  {booking?.customerDetails?.drivingLicense?.number && (
                    <p className="text-xs text-gray-500">
                      #{booking.customerDetails.drivingLicense.number}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleViewDocument("license")}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                title="View Document"
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            {/* Govt ID */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">
                    Govt ID Proof
                  </p>
                  {documents.govId.type === "hardcopy" ? (
                    <p className="text-xs text-orange-600 font-bold">
                      Hard Copy Collected
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Needs Check</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Collected</span>
                <button
                  onClick={() =>
                    setDocuments({
                      ...documents,
                      govId: {
                        ...documents.govId,
                        type:
                          documents.govId.type === "hardcopy"
                            ? "digital"
                            : "hardcopy",
                      },
                    })
                  }
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${
                    documents.govId.type === "hardcopy"
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      documents.govId.type === "hardcopy" ? "translate-x-4" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleViewDocument("id")}
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-blue-600 transition-colors ml-1"
                  title="View Document"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Additional Documents if any */}
            {booking?.documents && booking.documents.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 font-bold mb-2">
                  UPLOADED DOCUMENTS
                </p>
                <div className="space-y-2">
                  {booking.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {doc.type || "Document"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.originalName}
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              doc.verified
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {doc.verified ? "Verified" : "Pending Verification"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDocumentModal(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-full text-blue-600 hover:text-blue-700 transition-colors"
                        title="View Document"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- STEP 3: VEHICLE STATUS --- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <h3 className="font-bold text-gray-800">Vehicle Status</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                Meter Reading (KM)
              </label>
              <input
                type="number"
                value={meterReading}
                onChange={(e) => setMeterReading(e.target.value)}
                placeholder="00000"
                className="bg-transparent text-2xl font-bold text-white w-full outline-none placeholder-gray-700"
              />
            </div>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                Pickup Time
              </label>
              <p className="text-2xl font-bold text-white">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {activeTab === "dropoff" && (
            <div className="mb-4">
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isRecalculating ? (
                  "Calculating..."
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Recalculate Final Bill based on Meter Reading
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-gray-700">
                Visual Inspection
              </span>
              <button className="text-xs text-green-600 font-bold">
                View Checklist
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {["Front", "Rear", "Side"].map((view) => (
                <button
                  key={view}
                  className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 font-medium">
                    {view}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-gray-700 mb-3">
              Accessories Checklist
            </h4>
            <div className="space-y-3">
              {Object.keys(accessories).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        accessories[key]
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setAccessories({
                        ...accessories,
                        [key]: !accessories[key],
                      })
                    }
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      accessories[key] ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        accessories[key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- STEP 4: PAYMENT --- */}
        <div
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          id="payment-section"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <h3 className="font-bold text-gray-800">Payment & Notes</h3>
          </div>

          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-bold">
            Payment Mode
          </p>
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            {["Cash", "On App", "Online Link"].map((mode) => (
              <button
                key={mode}
                onClick={() =>
                  setPaymentMode(mode.toLowerCase().replace(" ", ""))
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  paymentMode === mode.toLowerCase().replace(" ", "")
                    ? "bg-green-500 text-white shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 font-bold block mb-1">
                TOTAL AMOUNT
              </label>
              <p className="text-2xl font-bold text-gray-900">
                ₹
                {booking?.billing?.totalBill?.toLocaleString() ||
                  booking?.totalAmount?.toLocaleString() ||
                  0}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold block mb-1">
                PENDING AMOUNT
              </label>
              <p className="text-xl font-bold text-red-600">
                ₹
                {(
                  (booking?.billing?.totalBill || booking?.totalAmount || 0) -
                  (booking?.paidAmount || 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment History */}
          {booking?.payments && booking.payments.length > 0 && (
            <div className="mb-6">
              <label className="text-xs text-gray-400 font-bold block mb-2">
                PAYMENT HISTORY
              </label>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {booking.payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          payment.paymentType === "Cash"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      ></span>
                      <span className="text-gray-600">
                        {payment.paymentType}
                      </span>
                      {payment.paymentDate && (
                        <span className="text-gray-400">
                          • {new Date(payment.paymentDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-green-600">
                      +₹{payment.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-700">Total Paid:</span>
                    <span className="text-green-600">
                      ₹{booking.paidAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 font-bold block mb-1">
                COLLECTING NOW
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) =>
                    setCollectedAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-white rounded-lg py-2 pl-7 pr-3 font-bold text-lg text-gray-900 border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold block mb-1">
                AFTER COLLECTION
              </label>
              <p className="text-xl font-bold text-gray-900 mt-2">
                ₹
                {(
                  (booking?.billing?.totalBill || booking?.totalAmount || 0) -
                  (booking?.paidAmount || 0) -
                  (collectedAmount || 0)
                ).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">will remain pending</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="text-xs text-gray-400 font-bold block mb-2">
              SELLER NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about vehicle condition, damages, or refund details..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none h-20 placeholder-gray-400"
            ></textarea>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-center z-50">
        <button
          onClick={handleSubmit}
          disabled={updatingStatus}
          className="w-full max-w-lg bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-3 rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {updatingStatus ? (
            <>Processing...</>
          ) : (
            <>
              Confirm {activeTab === "pickup" ? "Pickup" : "Drop-off"}{" "}
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </>
          )}
        </button>
      </div>

      {/* Edit Booking Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Booking Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editData.startDateTime}
                  onChange={(e) =>
                    setEditData({ ...editData, startDateTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editData.endDateTime}
                  onChange={(e) =>
                    setEditData({ ...editData, endDateTime: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData({ ...editData, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 h-24"
                />
              </div>

              <button
                onClick={handleEditSubmit}
                disabled={updatingDetails}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70"
              >
                {updatingDetails ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {selectedDocument.type || "Document"}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedDocument.originalName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedDocument.url ? (
                <div className="space-y-4">
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.type || "Document"}
                    className="w-full rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div
                    style={{ display: "none" }}
                    className="text-center p-8 text-gray-500"
                  >
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Unable to load document image</p>
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      Open in new tab
                    </a>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Document Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">
                          {selectedDocument.type || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span
                          className={`ml-2 font-medium ${
                            selectedDocument.verified
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {selectedDocument.verified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 font-medium">
                          {selectedDocument.size
                            ? `${(selectedDocument.size / 1024 / 1024).toFixed(
                                2
                              )} MB`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="ml-2 font-medium">
                          {selectedDocument.uploadedAt
                            ? new Date(
                                selectedDocument.uploadedAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No document URL available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SellerVehicleHandoverPage;
