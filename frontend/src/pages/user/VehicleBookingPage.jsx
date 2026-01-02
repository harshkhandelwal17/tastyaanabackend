import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetPublicVehicleByIdQuery,
  useCreateVehicleBookingMutation,
  useCreateVehiclePaymentOrderMutation,
  useVerifyVehiclePaymentMutation,
  useUploadBookingDocumentsMutation,
} from "../../redux/api/vehicleApi";
import { useSelector } from "react-redux";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiUpload,
} from "react-icons/fi";

const VehicleBookingPage = () => {
  const { vehicleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get user from Redux state
  const { user } = useSelector((state) => state.auth);

  // RTK Query hooks
  const {
    data: vehicleData,
    isLoading: vehicleLoading,
    error: vehicleError,
  } = useGetPublicVehicleByIdQuery(vehicleId, {
    skip: !!location.state?.vehicle, // Skip query if vehicle data is in location state
  });

  const [createBooking, { isLoading: isCreatingBooking }] =
    useCreateVehicleBookingMutation();
  const [createPaymentOrder, { isLoading: paymentLoading }] =
    useCreateVehiclePaymentOrderMutation();
  const [verifyPayment] = useVerifyVehiclePaymentMutation();

  // Get vehicle data from location state or API response
  const vehicle = location.state?.vehicle || vehicleData?.data?.vehicle || null;
  const loading = !location.state?.vehicle && vehicleLoading;

  // Booking form data
  const [bookingData, setBookingData] = useState({
    startDateTime: "",
    endDateTime: "",
    rateType: location.state?.selectedRateType || "hourly12",
    includesFuel: false,
    extraHelmets: 0, // State for Extra Helmet count
    documents: [], // Array of { type, url }
    specialRequests: "",
    pickupLocation: {
      type: "center",
      address: "",
    },
    dropLocation: {
      type: "center",
      address: "",
    },
  });

  const [uploadBookingDocuments, { isLoading: isUploading }] =
    useUploadBookingDocumentsMutation();

  // Customer details (will be fetched from user profile)
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    drivingLicense: {
      number: "",
      expiryDate: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // UI states
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingSummary, setBookingSummary] = useState(null);

  // Handle vehicle error
  useEffect(() => {
    if (vehicleError) {
      toast.error("Vehicle not found");
      navigate("/vehicles");
    }
  }, [vehicleError, navigate]);

  // Initialize customer details from user profile
  useEffect(() => {
    if (user) {
      setCustomerDetails({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        drivingLicense: {
          number: "",
          expiryDate: "",
        },
        address: user.addresses?.[0] || {
          street: "",
          city: "",
          state: "",
          pincode: "",
        },
      });
    }
  }, [user]);

  // Set default pickup location when vehicle is loaded
  useEffect(() => {
    if (vehicle) {
      setBookingData((prev) => ({
        ...prev,
        pickupLocation: {
          type: "center",
          address: vehicle.zoneCenterAddress,
        },
        dropLocation: {
          type: "center",
          address: vehicle.zoneCenterAddress,
        },
      }));
    }
  }, [vehicle]);

  // Calculate billing whenever booking data changes
  useEffect(() => {
    if (vehicle && bookingData.startDateTime && bookingData.endDateTime) {
      calculateBilling();
    }
  }, [
    vehicle,
    bookingData.startDateTime,
    bookingData.endDateTime,
    bookingData.rateType,
    bookingData.includesFuel,
    bookingData.extraHelmets, // Add dependency
  ]);

  const calculateBilling = () => {
    if (!vehicle || !bookingData.startDateTime || !bookingData.endDateTime)
      return;

    const start = new Date(bookingData.startDateTime);
    const end = new Date(bookingData.endDateTime);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60)); // hours

    let rate;
    let baseAmount;
    let kmLimit;
    let extraCharges = 0;

    // Special logic for 2-hour bookings OR if duration is <= 2 hours: charge for 24 hours upfront
    if (bookingData.rateType === "hourly2" || duration <= 2) {
      rate = vehicle.rate24hr;
      const hourlyRate = bookingData.includesFuel
        ? rate.withFuelPerHour
        : rate.withoutFuelPerHour;
      // Charge for 24 hours upfront for 2-hour bookings
      baseAmount = hourlyRate * 24;
      kmLimit = rate.kmLimit;

      // Add a note about final settlement on return
      extraCharges = 0; // Will be calculated on return
    } else {
      // Regular pricing logic
      if (bookingData.rateType === "hourly12") {
        rate = vehicle.rate12hr;
      } else {
        rate = vehicle.rate24hr;
      }

      const hourlyRate = bookingData.includesFuel
        ? rate.withFuelPerHour
        : rate.withoutFuelPerHour;
      baseAmount = hourlyRate * duration;

      // Calculate extra charges for exceeding limits
      const maxHours = bookingData.rateType === "hourly12" ? 12 : 24;
      if (duration > maxHours) {
        extraCharges = (duration - maxHours) * rate.extraChargePerHour;
      }

      kmLimit =
        rate.kmLimit *
        Math.ceil(duration / (bookingData.rateType === "hourly12" ? 12 : 24));
    }

    // Addons cost
    const helmetPrice = 50;
    const addonsCost = (bookingData.extraHelmets || 0) * helmetPrice;

    // Calculate taxes (18% GST)
    const subtotal = baseAmount + extraCharges + addonsCost;
    const gst = subtotal * 0.18;
    const totalBill = subtotal + gst + vehicle.depositAmount;

    setBookingSummary({
      duration,
      baseAmount,
      extraCharges,
      addonsCost,
      extraHelmets: bookingData.extraHelmets,
      fuelCharges: bookingData.includesFuel
        ? (rate.withFuelPerHour - rate.withoutFuelPerHour) *
          (duration <= 2 ? 24 : duration)
        : 0,
      gst,
      depositAmount: vehicle.depositAmount,
      totalBill,
      kmLimit,
      extraChargePerKm: rate.extraChargePerKm,
      isShortBooking: bookingData.rateType === "hourly2" || duration <= 2, // Flag for UI display
      actualDuration: duration, // Store actual selected duration
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size too large (max 5MB)");
      return;
    }

    // Store file temporarily - we'll upload it after booking is created
    toast.success(`${type} selected successfully`);
    setBookingData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents.filter((d) => d.type !== type),
        { type, file, verified: false }, // Store file object temporarily
      ],
    }));
  };

  const uploadDocumentsToBooking = async (bookingId, documents) => {
    try {
      // Filter out documents that don't have file objects (already uploaded)
      const documentsToUpload = documents.filter((doc) => doc.file);

      if (documentsToUpload.length === 0) {
        return { success: true, message: "No documents to upload" };
      }

      const formData = new FormData();
      formData.append("bookingId", bookingId);

      // Append each file with its type as the field name
      documentsToUpload.forEach((doc) => {
        formData.append(doc.type, doc.file);
      });

      const result = await uploadBookingDocuments(formData).unwrap();
      return result;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  };

  const handleBookingSubmit = async () => {
    try {
      // Validate required fields
      if (!bookingData.startDateTime || !bookingData.endDateTime) {
        toast.error("Please select pickup and drop times");
        return;
      }

      if (!customerDetails.drivingLicense.number) {
        toast.error("Driving license number is required");
        return;
      }

      // Optional: require document upload
      // if (bookingData.documents.length === 0) {
      //    toast.error("Please upload Driving License");
      //    return;
      // }

      // Create booking using RTK Query
      const bookingPayload = {
        vehicleId: vehicleId,
        startDateTime: bookingData.startDateTime,
        endDateTime: bookingData.endDateTime,
        rateType: bookingData.rateType,
        includesFuel: bookingData.includesFuel,
        specialRequests: bookingData.specialRequests,
        pickupLocation: bookingData.pickupLocation,
        dropLocation: bookingData.dropLocation,
        customerDetails,
        // Addons Payload
        addons:
          bookingData.extraHelmets > 0
            ? [
                {
                  name: "Extra Helmet",
                  count: bookingData.extraHelmets,
                  price: 50,
                },
              ]
            : [],
        // Accessories checklist with correct helmet COUNT (1 standard + extra helmets)
        accessoriesChecklist: {
          helmet: 1 + (bookingData.extraHelmets || 0), // Total helmet count (1 standard + extras)
          toolkit: true,
          spareTyre: false,
          firstAidKit: true,
        },
        // Note: documents will be uploaded separately after booking creation
      };

      const result = await createBooking(bookingPayload).unwrap();

      if (result.success) {
        const booking = result.data;
        toast.success("Booking created successfully!");

        // Upload documents if any are selected
        if (bookingData.documents.length > 0) {
          try {
            toast.info("Uploading documents...");
            const uploadResult = await uploadDocumentsToBooking(
              booking.bookingId,
              bookingData.documents
            );
            if (uploadResult.success) {
              toast.success("Documents uploaded successfully!");
            }
          } catch (uploadError) {
            console.error("Document upload failed:", uploadError);
            toast.error("Failed to upload documents - you can add them later");
          }
        }

        // Move to payment step
        setCurrentStep(3);

        // Store booking ID for payment
        setBookingData((prev) => ({ ...prev, bookingId: booking.bookingId }));
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.response?.data?.message || "Failed to create booking");
    }
  };

  const initiatePayment = async () => {
    try {
      // Create Razorpay order using RTK Query
      const orderResult = await createPaymentOrder({
        bookingId: bookingData.bookingId,
        amount: bookingSummary.totalBill,
      }).unwrap();

      if (!orderResult.success) {
        throw new Error("Failed to create payment order");
      }

      const { orderId, amount } = orderResult.data;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => processPayment(orderId, amount);
        document.body.appendChild(script);
      } else {
        processPayment(orderId, amount);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
    }
  };

  const processPayment = (orderId, amount) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount,
      currency: "INR",
      name: "Tastyaana Vehicle Rental",
      description: `Booking for ${vehicle.name}`,
      order_id: orderId,
      handler: async (response) => {
        try {
          // Verify payment using RTK Query
          const verifyResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingData.bookingId,
          }).unwrap();

          if (verifyResult.success) {
            toast.success("Payment successful! Booking confirmed.");
            navigate("/vehicles/my-bookings", {
              state: {
                bookingSuccess: true,
                bookingId: bookingData.bookingId,
              },
            });
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error("Payment verification failed");
        }
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone,
      },
      theme: {
        color: "#4F46E5",
      },
      modal: {
        ondismiss: () => {
          console.log("Payment cancelled by user");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Booking Details", icon: FiCalendar },
    { id: 2, name: "Customer Info", icon: FiUser },
    { id: 3, name: "Payment", icon: FiCreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Vehicle</h1>
              <p className="mt-1 text-gray-600">
                {vehicle?.name} • {vehicle?.vehicleNo}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center space-x-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    currentStep >= step.id
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Booking Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                {/* Availability Alert */}
                {vehicle?.nextAvailableTime &&
                  new Date(vehicle.nextAvailableTime) > new Date() && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                      <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">
                          Vehicle Currently Unavailable
                        </h3>
                        <p className="mt-1 text-sm text-red-700">
                          This vehicle is booked until{" "}
                          {new Date(
                            vehicle.nextAvailableTime
                          ).toLocaleDateString("en-GB")}{" "}
                          (
                          {new Date(
                            vehicle.nextAvailableTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          ). You can only book for dates after this time.
                        </p>
                      </div>
                    </div>
                  )}

                <h2 className="text-xl font-semibold mb-6">Booking Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pickup Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={bookingData.startDateTime}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        const now = new Date();

                        if (newDate < now) {
                          toast.error("Pickup time cannot be in the past");
                          return;
                        }

                        // Check if start time falls inside any booked slot
                        if (vehicle?.bookedSlots) {
                          const isConflict = vehicle.bookedSlots.some(
                            (slot) =>
                              newDate >= new Date(slot.start) &&
                              newDate < new Date(slot.end)
                          );

                          if (isConflict) {
                            toast.error(
                              "Selected time falls during an existing booking."
                            );
                            return;
                          }
                        }

                        setBookingData((prev) => ({
                          ...prev,
                          startDateTime: e.target.value,
                        }));
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {/* Booked Slots Display */}
                  {vehicle?.bookedSlots && vehicle.bookedSlots.length > 0 && (
                    <div className="md:col-span-2 mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="text-red-500" /> Unavailable /
                        Booked Slots
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.bookedSlots.map((slot, idx) => {
                          // Only show if end time is in future
                          if (new Date(slot.end) <= new Date()) return null;
                          return (
                            <div
                              key={idx}
                              className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg flex flex-col"
                            >
                              <span className="font-bold">
                                {new Date(slot.start).toLocaleDateString(
                                  "en-GB",
                                  { day: "numeric", month: "short" }
                                )}
                                {" - "}
                                {new Date(slot.end).toLocaleDateString(
                                  "en-GB",
                                  { day: "numeric", month: "short" }
                                )}
                              </span>
                              <span
                                className="text-gray-500 font-mono"
                                style={{ fontSize: "10px" }}
                              >
                                {new Date(slot.start).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" -> "}
                                {new Date(slot.end).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Drop Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={bookingData.endDateTime}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          endDateTime: e.target.value,
                        }))
                      }
                      min={
                        bookingData.startDateTime ||
                        new Date().toISOString().slice(0, 16)
                      }
                    />
                  </div>
                </div>

                {/* Rate Type */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="rateType"
                        value="hourly2"
                        checked={bookingData.rateType === "hourly2"}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            rateType: e.target.value,
                          }))
                        }
                        className="text-indigo-600"
                      />
                      <div>
                        <div className="font-medium">2 Hour Plan</div>
                        <div className="text-sm text-gray-500">
                          ₹{vehicle?.rate24hr?.withoutFuelPerHour * 24}/24hrs
                          (upfront) • {vehicle?.rate24hr?.kmLimit} km limit
                        </div>
                        <div className="text-xs text-blue-600">
                          Final billing on return
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="rateType"
                        value="hourly12"
                        checked={bookingData.rateType === "hourly12"}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            rateType: e.target.value,
                          }))
                        }
                        className="text-indigo-600"
                      />
                      <div>
                        <div className="font-medium">12 Hour Plan</div>
                        <div className="text-sm text-gray-500">
                          ₹{vehicle?.rate12hr?.withoutFuelPerHour}/hr •{" "}
                          {vehicle?.rate12hr?.kmLimit} km limit
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="rateType"
                        value="hourly24"
                        checked={bookingData.rateType === "hourly24"}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            rateType: e.target.value,
                          }))
                        }
                        className="text-indigo-600"
                      />
                      <div>
                        <div className="font-medium">24 Hour Plan</div>
                        <div className="text-sm text-gray-500">
                          ₹{vehicle?.rate24hr?.withoutFuelPerHour}/hr •{" "}
                          {vehicle?.rate24hr?.kmLimit} km limit
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Include Fuel */}
                <div className="mt-6 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={bookingData.includesFuel}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          includesFuel: e.target.checked,
                        }))
                      }
                      className="text-indigo-600 w-5 h-5"
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-800">
                        Include Fuel
                      </span>
                      <span className="block text-xs text-gray-500">
                        Additional charges apply based on duration
                      </span>
                    </div>
                  </label>

                  {/* Add-ons: Extra Helmet */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <span className="block text-sm font-medium text-gray-800">
                        Extra Helmet
                      </span>
                      <span className="block text-xs text-gray-500">
                        ₹50 per helmet
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setBookingData((prev) => ({
                            ...prev,
                            extraHelmets: Math.max(0, prev.extraHelmets - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center">
                        {bookingData.extraHelmets}
                      </span>
                      <button
                        onClick={() =>
                          setBookingData((prev) => ({
                            ...prev,
                            extraHelmets: Math.min(2, prev.extraHelmets + 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any special requirements or requests..."
                    value={bookingData.specialRequests}
                    onChange={(e) =>
                      setBookingData((prev) => ({
                        ...prev,
                        specialRequests: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={
                    !bookingData.startDateTime || !bookingData.endDateTime
                  }
                  className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Continue to Customer Details
                </button>
              </div>
            )}

            {/* Step 2: Customer Information */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">
                  Customer Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.phone}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.email}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.drivingLicense.number}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          drivingLicense: {
                            ...prev.drivingLicense,
                            number: e.target.value,
                          },
                        }))
                      }
                      required
                      placeholder="DL12345678901234"
                    />
                  </div>

                  {/* Document Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Driving License / ID Proof
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(e, "driving-license")
                          }
                          disabled={isUploading}
                        />
                        {bookingData.documents.find(
                          (d) => d.type === "driving-license"
                        ) ? (
                          <div className="flex flex-col items-center text-green-600">
                            <FiCheckCircle className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">
                              License Uploaded
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Click to replace
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            {isUploading ? (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            ) : (
                              <FiUpload className="w-8 h-8 mb-2" />
                            )}
                            <span className="text-sm font-medium">
                              {isUploading
                                ? "Uploading..."
                                : "Upload License Front"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                              Max 5MB (JPG/PNG)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.address.street}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            street: e.target.value,
                          },
                        }))
                      }
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.address.city}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            city: e.target.value,
                          },
                        }))
                      }
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={customerDetails.address.pincode}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            pincode: e.target.value,
                          },
                        }))
                      }
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBookingSubmit}
                    disabled={
                      isCreatingBooking ||
                      !customerDetails.name ||
                      !customerDetails.phone ||
                      !customerDetails.drivingLicense.number
                    }
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {isCreatingBooking
                      ? "Creating Booking..."
                      : "Continue to Payment"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Payment</h2>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">
                      Booking created successfully!
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Please complete the payment to confirm your booking.</p>
                    <p className="mt-2">
                      Booking ID:{" "}
                      <span className="font-mono">{bookingData.bookingId}</span>
                    </p>
                  </div>

                  <button
                    onClick={initiatePayment}
                    disabled={paymentLoading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
                  >
                    {paymentLoading
                      ? "Processing Payment..."
                      : `Pay ₹${bookingSummary?.totalBill || 0}`}
                  </button>

                  <div className="text-xs text-gray-500 text-center">
                    Secure payment powered by Razorpay
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
              <div className="flex items-center space-x-4">
                {vehicle?.vehicleImages?.[0] && (
                  <img
                    src={vehicle.vehicleImages[0]}
                    alt={vehicle.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{vehicle?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {vehicle?.companyName} • {vehicle?.vehicleNo}
                  </p>
                  <p className="text-sm text-gray-600">
                    {vehicle?.zoneCenterName}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            {bookingSummary && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">
                      {bookingSummary.actualDuration || bookingSummary.duration}{" "}
                      hours
                    </span>
                  </div>

                  {/* Special message for short bookings */}
                  {bookingSummary.isShortBooking && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <FiInfo className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium">2-Hour Booking Policy:</p>
                          <p className="mt-1">
                            You're charged for 24 hours upfront. Final amount
                            will be calculated based on actual usage when you
                            return the vehicle.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {bookingSummary.isShortBooking
                        ? "Base Amount (24 hrs)"
                        : "Base Amount"}
                    </span>
                    <span className="font-medium">
                      ₹{bookingSummary.baseAmount}
                    </span>
                  </div>
                  {bookingSummary.extraCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Extra Hour Charges</span>
                      <span className="font-medium">
                        ₹{bookingSummary.extraCharges}
                      </span>
                    </div>
                  )}
                  {bookingSummary.fuelCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Charges</span>
                      <span className="font-medium">
                        ₹{bookingSummary.fuelCharges}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-medium">₹{bookingSummary.gst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">
                      ₹{bookingSummary.depositAmount}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>₹{bookingSummary.totalBill}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <FiInfo className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Important Notes:</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>
                          Security deposit will be refunded after vehicle return
                        </li>
                        <li>KM limit: {bookingSummary.kmLimit} km</li>
                        <li>
                          Extra KM charge: ₹{bookingSummary.extraChargePerKm}/km
                        </li>
                        {bookingSummary.isShortBooking && (
                          <li>
                            For 2-hour bookings: Final settlement based on
                            actual usage will be done at return. Excess amount
                            will be refunded from deposit or additional payment
                            may be required.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleBookingPage;
