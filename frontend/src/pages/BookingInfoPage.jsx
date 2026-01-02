import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Upload,
  Check,
  ChevronRight,
  X,
  AlertCircle,
  FileText,
  CreditCard,
  IdCard,
  ChevronUp,
  Info,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  useCreateVehicleBookingMutation,
  useCreateVehiclePaymentOrderMutation,
  useVerifyVehiclePaymentMutation,
} from "../redux/api/vehicleApi";

const BookingInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData || {};
  const { vehicle, billSummary } = bookingData;

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData.vehicleId) {
      navigate("/vehicles");
    }
  }, [bookingData, navigate]);

  // API Hooks
  const [createBooking, { isLoading: isBookingLoading }] =
    useCreateVehicleBookingMutation();
  const [createPaymentOrder, { isLoading: isOrderLoading }] =
    useCreateVehiclePaymentOrderMutation();
  const [verifyPayment, { isLoading: isVerifyingLoading }] =
    useVerifyVehiclePaymentMutation();

  const isProcessing = isBookingLoading || isOrderLoading || isVerifyingLoading;

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    licenseNumber: "",
  });

  // Document uploads
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [drivingLicense, setDrivingLicense] = useState(null);
  const [panCard, setPanCard] = useState(null);

  // UI state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // File input refs
  const aadharFrontRef = useRef(null);
  const aadharBackRef = useRef(null);
  const licenseRef = useRef(null);
  const panRef = useRef(null);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setFormData((prev) => ({
              ...prev,
              address: data.display_name || "Location detected",
            }));
          } catch (error) {
            console.error("Error getting address:", error);
            toast.error("Failed to detect location");
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Location permission denied or unavailable");
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload document using backend endpoint with booking ID
  const uploadDocumentToBackend = async (
    base64File,
    documentType,
    bookingId
  ) => {
    try {
      // Convert base64 to blob for FormData
      const base64Response = await fetch(base64File);
      const blob = await base64Response.blob();

      const formData = new FormData();
      formData.append("documents", blob, `${documentType}.jpg`); // Use 'documents' field name as per backend
      formData.append("documentType", documentType);
      formData.append("bookingId", bookingId); // Add booking ID

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/vehicles/bookings/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Add auth token
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload document");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to upload document");
      }

      // Return the first uploaded document URL
      const uploadedDoc = result.data.documents?.[0];
      if (!uploadedDoc) {
        throw new Error("No document returned from upload");
      }

      return {
        type: documentType,
        url: uploadedDoc.url,
        publicId: uploadedDoc.publicId,
        verified: false,
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error(`Failed to upload ${documentType}: ${error.message}`);
    }
  };

  // Upload all documents using backend with booking ID
  const uploadAllDocuments = async (bookingId) => {
    const documentPromises = [];

    if (aadharFront) {
      documentPromises.push(
        uploadDocumentToBackend(aadharFront, "aadhar_front", bookingId)
      );
    }

    if (aadharBack) {
      documentPromises.push(
        uploadDocumentToBackend(aadharBack, "aadhar_back", bookingId)
      );
    }

    if (drivingLicense) {
      documentPromises.push(
        uploadDocumentToBackend(drivingLicense, "driving_license", bookingId)
      );
    }

    if (panCard) {
      documentPromises.push(
        uploadDocumentToBackend(panCard, "pan_card", bookingId)
      );
    }

    if (documentPromises.length === 0) {
      return [];
    }

    try {
      const uploadedDocuments = await Promise.all(documentPromises);
      return uploadedDocuments;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to upload one or more documents");
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.fullName.trim() !== "" &&
      formData.phoneNumber.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.address.trim() !== "" &&
      formData.licenseNumber.trim() !== "" &&
      aadharFront !== null &&
      aadharBack !== null &&
      termsAccepted
    );
  };

  // Handle Payment Process
  const processPayment = (bookingId, orderId, amount, customerInfo) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount,
      currency: "INR",
      name: "Rent-a-Ride",
      description: `Booking for ${vehicle?.brand || "Vehicle"} ${
        vehicle?.model || ""
      }`,
      order_id: orderId,
      handler: async (response) => {
        try {
          const verifyResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingId,
          }).unwrap();

          if (verifyResult.success) {
            toast.success("Booking confirmed successfully!");
            navigate("/my-vehicle-bookings", {
              state: { bookingSuccess: true, bookingId },
            });
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: customerInfo.name,
        email: customerInfo.email,
        contact: customerInfo.phone,
      },
      theme: {
        color: "#22c55e",
      },
      modal: {
        ondismiss: () => {
          toast("Payment cancelled");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Handle Booking Submission
  const handleProceedToPayment = async () => {
    if (!isFormValid()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // 1. Prepare Customer Details (without documents for now)
      const customerDetails = {
        name: formData.fullName,
        phone: formData.phoneNumber,
        email: formData.email,
        drivingLicense: {
          number: formData.licenseNumber,
          // We can add logic to extract expiry or ask user later
          expiryDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ).toISOString(),
        },
        address: {
          street: formData.address,
          city: "", // Can be extracted or left empty if not strictly required
          state: "",
          pincode: "",
        },
      };

      // 2. Create Booking first
      const bookingPayload = {
        vehicleId: bookingData.vehicleId,
        startDateTime: `${bookingData.pickupDate}T${bookingData.pickupTime}`,
        endDateTime: `${bookingData.dropoffDate}T${bookingData.dropoffTime}`,
        rateType:
          bookingData.rentalPlan?.id === "hourly"
            ? "hourly2"
            : bookingData.rentalPlan?.id === "12hr"
            ? "hourly12"
            : "hourly24",
        includesFuel: false, // Default or add to UI if needed
        zoneId:
          vehicle?.location?.zone || bookingData.location || "default-zone",
        // Add helmet and accessories data
        accessoriesChecklist: {
          helmet: bookingData.helmetCount || 0,
          toolkit: true,
          spareTyre: false,
          firstAidKit: true,
        },
        // Add addons for helmet pricing
        addons:
          bookingData.helmetCount > 0
            ? [
                {
                  name: "Extra Helmet",
                  price: 50,
                  count: bookingData.helmetCount,
                  total: 50 * bookingData.helmetCount,
                },
              ]
            : [],
        pickupLocation: {
          type: "center",
          address:
            typeof vehicle?.location === "object"
              ? vehicle.location.address
              : vehicle?.location || "Main Center",
        },
        dropLocation: {
          type: "center",
          address:
            typeof vehicle?.location === "object"
              ? vehicle.location.address
              : vehicle?.location || "Main Center",
        },
        customerDetails,
        // Don't include documents in initial booking creation
      };

      console.log("Creating booking with helmet count:", {
        helmetCount: bookingData.helmetCount,
        accessories: bookingPayload.accessoriesChecklist,
        addons: bookingPayload.addons,
      });

      const bookingResult = await createBooking(bookingPayload).unwrap();

      if (!bookingResult.success) {
        throw new Error("Failed to create booking");
      }

      const bookingId = bookingResult.data._id;

      // 3. Upload documents to Cloudinary with booking ID
      toast.success("Uploading documents...");
      const uploadedDocuments = await uploadAllDocuments(bookingId);

      console.log("Documents uploaded:", uploadedDocuments.length);

      // 4. Create Payment Order
      const orderResult = await createPaymentOrder({
        bookingId,
        amount: billSummary.payNow, // Charge the 'Pay Now' amount
      }).unwrap();

      if (!orderResult.success) {
        throw new Error("Failed to create payment order");
      }

      // 5. Launch Razorpay
      processPayment(
        bookingId,
        orderResult.data.orderId,
        orderResult.data.amount,
        customerDetails
      );
    } catch (error) {
      console.error("Booking process error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Something went wrong";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Rental Details
          </h1>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex justify-center gap-2">
          <div className="w-8 h-1.5 rounded-full bg-green-500"></div>
          <div className="w-8 h-1.5 rounded-full bg-green-500"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Personal Details Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Personal Details
          </h2>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Residential Address */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Residential Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Flat No, Building, Street, City"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <button
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5 text-green-500 hover:text-green-600" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Tap the pin icon to use current location
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-200"></div>

        {/* Identity Verification Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Identity Verification
            </h2>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">
              Required
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Note: PAN card upload is optional here, but you must present it
              physically at vehicle pickup.
            </p>
          </div>

          <div className="space-y-4">
            {/* Driving License Number */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Driving License Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  placeholder="DL1234567890123"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400 shadow-sm"
                />
                <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Aadhar Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">
                    Aadhar Card
                  </span>
                </div>
                {aadharFront && aadharBack && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => aadharFrontRef.current?.click()}
                  className="relative aspect-[4/3] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500/50 hover:bg-green-50 transition-colors overflow-hidden"
                >
                  {aadharFront ? (
                    <>
                      <img
                        src={aadharFront}
                        alt="Aadhar Front"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-500">Front</span>
                    </>
                  )}
                </div>
                <div
                  onClick={() => aadharBackRef.current?.click()}
                  className="relative aspect-[4/3] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500/50 hover:bg-green-50 transition-colors overflow-hidden"
                >
                  {aadharBack ? (
                    <>
                      <img
                        src={aadharBack}
                        alt="Aadhar Back"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-500">
                        Back Side
                      </span>
                    </>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={aadharFrontRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setAadharFront)}
                className="hidden"
              />
              <input
                type="file"
                ref={aadharBackRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setAadharBack)}
                className="hidden"
              />
            </div>

            {/* Driving License Upload */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">
                    Driving License
                  </span>
                </div>
              </div>
              <div
                onClick={() => licenseRef.current?.click()}
                className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 flex items-center gap-3 cursor-pointer hover:border-green-500/50 hover:bg-green-50 transition-colors"
              >
                {drivingLicense ? (
                  <>
                    <img
                      src={drivingLicense}
                      alt="License"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        License Uploaded
                      </p>
                      <p className="text-xs text-gray-500">Tap to change</p>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Tap to upload
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={licenseRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setDrivingLicense)}
                className="hidden"
              />
            </div>

            {/* PAN Card Upload */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="font-medium text-sm text-gray-700">
                      PAN Card
                    </span>
                    <p className="text-[10px] text-gray-500">Optional upload</p>
                  </div>
                </div>
                {panCard ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={panCard}
                      alt="PAN"
                      className="w-10 h-10 object-cover rounded"
                    />
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                ) : (
                  <button
                    onClick={() => panRef.current?.click()}
                    className="text-sm text-green-600 font-medium hover:text-green-700"
                  >
                    Add
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={panRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setPanCard)}
                className="hidden"
              />
            </div>
          </div>
        </section>

        {/* Terms and Conditions */}
        <section className="pt-2">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setTermsAccepted(!termsAccepted)}
              className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                termsAccepted
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {termsAccepted && <Check className="w-3 h-3 text-white" />}
            </button>
            <p className="text-xs text-gray-500">
              I agree to Tastyaana's{" "}
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-green-600 underline hover:text-green-700"
              >
                Rental Terms & Conditions
              </button>{" "}
              and confirm the details above are correct.
            </p>
          </div>
        </section>
      </main>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-lg mx-auto flex gap-4 items-center">
          {/* View Bill Summary Button */}
          <button
            onClick={() => setShowBillModal(true)}
            className="flex-1 flex flex-col items-start justify-center"
          >
            <span className="text-xs text-gray-500 flex items-center gap-1">
              Total Bill <ChevronUp className="w-3 h-3" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                ₹{billSummary?.grandTotal || 0}
              </span>
              <span className="text-xs text-green-600 font-medium">
                (Pay Later available)
              </span>
            </div>
          </button>

          {/* Proceed to Payment Button */}
          <button
            onClick={handleProceedToPayment}
            disabled={!isFormValid() || isProcessing}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isFormValid() && !isProcessing
                ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                Pay Now <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bill Summary and Rental Summary Modal */}
      <AnimatePresence>
        {showBillModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center backdrop-blur-sm"
            onClick={() => setShowBillModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h3 className="text-lg font-bold text-gray-900">
                  Booking Summary
                </h3>
                <button
                  onClick={() => setShowBillModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                {/* Vehicle Summary */}
                <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <img
                    src={vehicle?.images?.[0] || "/placeholder-vehicle.jpg"}
                    alt={vehicle?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {vehicle?.brand} {vehicle?.model}
                    </h4>
                    <p className="text-sm text-gray-500">{vehicle?.type}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                        {vehicle?.fuelType}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                        {vehicle?.seatingCapacity} Seater
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Rental Period
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="font-medium text-sm text-gray-900">
                        {bookingData.pickupDate}
                      </p>
                      <p className="font-bold text-green-600">
                        {bookingData.pickupTime}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500">Dropoff</p>
                      <p className="font-medium text-sm text-gray-900">
                        {bookingData.dropoffDate}
                      </p>
                      <p className="font-bold text-green-600">
                        {bookingData.dropoffTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Bill Details</h4>
                  <div className="space-y-2 text-sm bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Rental Charges</span>
                      <span>₹{billSummary?.rentalCost}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>
                        Extra Helmet ({billSummary?.helmetCount || 0})
                      </span>
                      <span>₹{billSummary?.helmetCost}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Insurance</span>
                      <span>₹{billSummary?.insuranceCost}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span>
                      <span>₹{billSummary?.gst}</span>
                    </div>
                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-bold text-gray-900 text-base">
                      <span>Total Amount</span>
                      <span>₹{billSummary?.total}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs mt-1">
                      <span>Refundable Deposit</span>
                      <span>₹{billSummary?.deposit}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown Highlight */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-700 font-bold">Pay Now</p>
                      <p className="text-xs text-green-600">
                        Advance + Deposit
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-700">
                      ₹{billSummary?.payNow}
                    </p>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between items-center">
                    <div>
                      <p className="text-gray-700 font-medium">Pay Later</p>
                      <p className="text-xs text-gray-500">At pickup center</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-700">
                      ₹{billSummary?.payLater}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl max-h-[80vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-gray-900">
                  Terms & Conditions
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)] bg-gray-50">
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-gray-900 text-center">
                      By proceeding with this booking, I HEREBY AGREE TO THE
                      FOLLOWING TERMS AND CONDITIONS:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p>
                      1. To use the vehicle strictly for personal transportation
                      and not for commercial purposes, racing, or any illegal
                      activities.
                    </p>

                    <p>
                      2. To possess a valid driving license appropriate for the
                      rented vehicle category throughout the entire rental
                      period.
                    </p>

                    <p>
                      3. To provide accurate information during booking and
                      ensure that I am the authorized person for this rental
                      agreement.
                    </p>

                    <p>
                      4. To inspect the vehicle thoroughly upon pickup and
                      report any existing damages or defects immediately to
                      avoid liability.
                    </p>

                    <p>
                      5. To return the vehicle at the agreed-upon location and
                      time in the same condition as received, subject to normal
                      wear and tear.
                    </p>

                    <p>
                      6. To be fully responsible for any damage, theft, or loss
                      of the vehicle during the rental period, including
                      repairs, replacement costs, and associated expenses.
                    </p>

                    <p>
                      7. To pay the security deposit as specified, which may be
                      used to cover damages, additional charges, or violations
                      during the rental period.
                    </p>

                    <p>
                      8. To maintain the vehicle's fuel level and return it with
                      the same fuel level as provided, or pay additional
                      refueling charges.
                    </p>

                    <p>
                      9. To not allow anyone else to drive the vehicle unless
                      explicitly authorized and added to the rental agreement as
                      additional drivers.
                    </p>

                    <p>
                      10. To comply with all local traffic laws and regulations,
                      and to be personally liable for any traffic violations or
                      fines incurred.
                    </p>

                    <p>
                      11. To notify the rental company immediately in case of
                      accident, breakdown, theft, or any incident involving the
                      vehicle.
                    </p>

                    <p>
                      12. To not smoke, carry illegal substances, or transport
                      hazardous materials in the vehicle at any time.
                    </p>

                    <p>
                      13. To pay all applicable charges including rental fees,
                      late return fees, cleaning fees, and any additional
                      services utilized.
                    </p>

                    <p>
                      14. To understand that late returns will incur hourly
                      charges and may affect the availability for subsequent
                      bookings.
                    </p>

                    <p>
                      15. To acknowledge that the rental company reserves the
                      right to terminate this agreement and recover the vehicle
                      if these terms are violated.
                    </p>

                    <p>
                      16. To waive any claims against the rental company for
                      personal injury, property damage, or losses arising from
                      the use of the vehicle.
                    </p>

                    <p>
                      17. To accept that cancellation policies apply as per the
                      company's standard terms, and cancellation fees may be
                      applicable.
                    </p>

                    <p>
                      18. To understand that this agreement is governed by
                      Indian law and any disputes will be subject to the
                      jurisdiction of local courts.
                    </p>

                    <p>
                      19. To have read, understood, and voluntarily accepted all
                      terms and conditions mentioned above without any coercion
                      or misrepresentation.
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-gray-500 text-center">
                      This digital acceptance constitutes a legally binding
                      agreement between the renter and the vehicle rental
                      company.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
                <button
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                >
                  I Accept Terms & Conditions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingInfoPage;
