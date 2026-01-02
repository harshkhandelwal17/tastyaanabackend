import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetVehicleByIdQuery,
  formatVehicleForDisplay,
  useCheckAvailabilityMutation,
} from "../api/vehiclePublicApi";
import BikeToggle from "../components/ui/helmateToggle";
// Helper to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

// Helper to get current time in HH:MM format (10 minutes from now)
const getCurrentTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // Add 10 minutes to current time
  return now.toTimeString().slice(0, 5);
};

// Helper to get date 12 hours from now
const getDefaultDropoffDate = () => {
  const now = new Date();
  now.setHours(now.getHours() + 12);
  return now.toISOString().split("T")[0];
};

// Helper to get time 12 hours from pickup time (which is 10 minutes from now)
const getDefaultDropoffTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // Start from pickup time (10 min from now)
  now.setHours(now.getHours() + 12); // Add 12 hours
  return now.toTimeString().slice(0, 5);
};

const VehicleDetailPage = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [rentalPlan, setRentalPlan] = useState("12hr");
  const [extraHelmet, setExtraHelmet] = useState(false);
  const [helmetCount, setHelmetCount] = useState(1);
  const [fullInsurance, setFullInsurance] = useState(false);
  const [pickupDate, setPickupDate] = useState(getCurrentDate());
  const [pickupTime, setPickupTime] = useState(getCurrentTime());
  const [dropoffDate, setDropoffDate] = useState(getDefaultDropoffDate());
  const [dropoffTime, setDropoffTime] = useState(getDefaultDropoffTime());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [showTimeConfirmation, setShowTimeConfirmation] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const { data, isLoading, error } = useGetVehicleByIdQuery(vehicleId);
  const [checkAvailability] = useCheckAvailabilityMutation();

  const vehicle = data?.data?.vehicle
    ? formatVehicleForDisplay(data?.data?.vehicle)
    : null;
  const rawVehicle = data?.data?.vehicle;

  // Check availability whenever time changes
  useEffect(() => {
    if (vehicleId && pickupDate && pickupTime && dropoffDate && dropoffTime) {
      const timeoutId = setTimeout(() => {
        checkVehicleAvailability();
      }, 500); // Debounce API calls

      return () => clearTimeout(timeoutId);
    }
  }, [vehicleId, pickupDate, pickupTime, dropoffDate, dropoffTime]);

  // Function to check vehicle availability
  const checkVehicleAvailability = async () => {
    if (
      !vehicleId ||
      !pickupDate ||
      !pickupTime ||
      !dropoffDate ||
      !dropoffTime
    ) {
      return;
    }

    setIsCheckingAvailability(true);

    try {
      // Create and validate dates
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const dropoffDateTime = new Date(`${dropoffDate}T${dropoffTime}`);

      // Validate dates
      if (isNaN(pickupDateTime.getTime()) || isNaN(dropoffDateTime.getTime())) {
        console.error("Invalid date format");
        setAvailabilityStatus({
          available: false,
          message: "Invalid date format",
          nextAvailable: null,
        });
        return;
      }

      // Ensure dropoff is after pickup
      if (dropoffDateTime <= pickupDateTime) {
        setAvailabilityStatus({
          available: false,
          message: "Dropoff time must be after pickup time",
          nextAvailable: null,
        });
        return;
      }

      const startDateTime = pickupDateTime.toISOString();
      const endDateTime = dropoffDateTime.toISOString();

      console.log("Checking availability with:", {
        vehicleId,
        startDateTime,
        endDateTime,
      });

      const result = await checkAvailability({
        vehicleId,
        startDateTime,
        endDateTime,
      });

      console.log("Availability result:", result);

      if (result.data?.success) {
        // Vehicle is available
        setAvailabilityStatus({
          available: true,
          message: result.data.message || "Vehicle is available",
          nextAvailable: null,
        });
      } else if (result.error) {
        // Handle API errors
        const errorData = result.error.data;
        if (errorData?.success === false) {
          // Vehicle is not available
          setAvailabilityStatus({
            available: false,
            message: errorData.message || "Vehicle is not available",
            nextAvailable: null, // We can enhance this later
          });
        } else {
          // Network or other errors
          setAvailabilityStatus({
            available: false,
            message: "Error checking availability",
            nextAvailable: null,
          });
        }
      } else {
        // Unexpected response format
        setAvailabilityStatus({
          available: false,
          message: "Unexpected response format",
          nextAvailable: null,
        });
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailabilityStatus({
        available: false,
        message: "Error checking availability",
        nextAvailable: null,
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Calculate duration between pickup and dropoff
  const duration = useMemo(() => {
    if (!pickupDate || !pickupTime || !dropoffDate || !dropoffTime) {
      return { hours: 0, days: 0, label: "Select dates" };
    }

    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const dropoff = new Date(`${dropoffDate}T${dropoffTime}`);
    const diffMs = dropoff - pickup;

    if (diffMs <= 0) {
      return { hours: 0, days: 0, label: "Invalid dates" };
    }

    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);

    if (hours < 24) {
      return { hours, days: 0, label: `${hours} hour${hours > 1 ? "s" : ""}` };
    }
    return { hours, days, label: `${days} day${days > 1 ? "s" : ""}` };
  }, [pickupDate, pickupTime, dropoffDate, dropoffTime]);

  // Bill calculation with all vehicle details - MATCH BACKEND LOGIC
  const billSummary = useMemo(() => {
    if (!rawVehicle) return null;

    let baseRate = 0;
    let extraCharges = 0;
    let planLabel = "";
    let kmLimit = 0;
    let extraChargePerKm = 0;
    let gracePeriodMinutes = 0;
    let ratePerHour = 0;

    const hours = duration.hours || 12;

    if (rentalPlan === "hourly") {
      // Hourly plan: ratePerHour * duration
      ratePerHour = rawVehicle?.rateHourly?.ratePerHour || 130;
      planLabel = "Hourly Rate";
      baseRate = hours * ratePerHour;
      kmLimit = hours * (rawVehicle?.rateHourly?.kmFreePerHour || 10);
      extraChargePerKm = rawVehicle?.rateHourly?.extraChargePerKm || 10;
      gracePeriodMinutes = 0;
    } else if (rentalPlan === "12hr") {
      // 12hr plan: baseRate + extra charges if > 12 hours
      const rate12hr = rawVehicle?.rate12hr || {};
      baseRate = rate12hr.baseRate || 600; // Use baseRate, not ratePerHour
      ratePerHour = rate12hr.ratePerHour || 50; // For display purposes
      planLabel = "12 Hours Package";
      kmLimit = rate12hr.kmLimit || 120;
      extraChargePerKm = rate12hr.extraChargePerKm || 3;
      gracePeriodMinutes = rate12hr.gracePeriodMinutes || 15;

      // Calculate extra charges if duration > 12
      if (hours > 12) {
        const extraTime = hours - 12;
        extraCharges = extraTime * (rate12hr.extraChargePerHour || 50);
      }
    } else if (rentalPlan === "24hr") {
      // 24hr plan: baseRate + block charges + hourly charges
      const rate24hr = rawVehicle?.rate24hr || {};
      baseRate = rate24hr.baseRate || 750;
      ratePerHour = rate24hr.ratePerHour || 3; // For display purposes
      planLabel = "24 Hours Package";
      kmLimit = rate24hr.kmLimit || 150;
      extraChargePerKm = rate24hr.extraChargePerKm || 3;
      gracePeriodMinutes = rate24hr.gracePeriodMinutes || 30;

      // Calculate extra charges if duration > 24
      if (hours > 24) {
        const extraTime = hours - 24;
        const extraBlocks = Math.floor(extraTime / 12);
        const remainingHours = extraTime % 12;
        const blockCharges = extraBlocks * (rate24hr.extraBlockRate || 500);
        const hourlyCharges =
          remainingHours * (rate24hr.extraChargePerHour || 3);
        extraCharges = blockCharges + hourlyCharges;
      }
    }

    const rentalCost = baseRate + extraCharges;
    // Helmet cost calculation: if extraHelmet is true OR helmetCount > 0, charge for helmets
    const helmetCost = extraHelmet || helmetCount > 0 ? helmetCount * 50 : 0;
    const insuranceCost = fullInsurance ? 100 : 0;
    const deposit = rawVehicle?.depositAmount || 2000;
    const subtotal = rentalCost + helmetCost + insuranceCost;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const grandTotal = total + deposit;

    const paymentPercentage = rawVehicle?.requiredPaymentPercentage || 50;
    const rentalAdvance = Math.round(total * (paymentPercentage / 100));
    const payNow = rentalAdvance + deposit;
    const payLater = total - rentalAdvance;

    return {
      planLabel,
      ratePerHour,
      hours,
      rentalCost,
      baseRate,
      extraCharges,
      helmetCount: extraHelmet || helmetCount > 0 ? helmetCount : 0,
      helmetCost,
      insuranceCost,
      deposit,
      subtotal,
      gst,
      total,
      grandTotal,
      paymentPercentage,
      rentalAdvance,
      payNow,
      payLater,
      kmLimit,
      extraChargePerKm,
      gracePeriodMinutes,
      mileage: rawVehicle?.mileage || 0,
      fuelCapacity: rawVehicle?.fuelCapacity || 0,
    };
  }, [
    rawVehicle,
    rentalPlan,
    duration.hours,
    extraHelmet,
    helmetCount,
    fullInsurance,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Vehicle not found
          </h2>
          <button
            onClick={() => navigate("/vehicles")}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const mainImage =
    vehicle.images?.[currentImageIndex] ||
    vehicle.images?.[0] ||
    "/placeholder-vehicle.jpg";

  const rentalPlans = [
    {
      id: "hourly",
      label: "Hourly",
      price: `₹${rawVehicle?.rateHourly?.ratePerHour || 130}/hr`,
    },
    {
      id: "12hr",
      label: "12 Hours",
      price: `₹${rawVehicle?.rate12hr?.baseRate || 600}`,
    },
    {
      id: "24hr",
      label: "24 Hours",
      price: `₹${rawVehicle?.rate24hr?.baseRate || 750}`,
    },
  ];

  const handleBookNow = () => {
    // Check if vehicle is available first
    if (availabilityStatus && !availabilityStatus.available) {
      alert(
        "Vehicle is not available for selected time. Please choose different time."
      );
      return;
    }

    // Show time confirmation modal
    setShowTimeConfirmation(true);
  };

  const confirmBooking = () => {
    const bookingData = {
      vehicleId,
      vehicle, // Pass full vehicle details
      rentalPlan,
      extraHelmet,
      helmetCount,
      fullInsurance,
      pickupDate,
      pickupTime,
      dropoffDate,
      dropoffTime,
      location:
        vehicle.location?.zone ||
        vehicle.location?.center ||
        "Vehicle Location", // Use vehicle's location
      zoneId:
        vehicle.location?.zone || vehicle.location?.center || "default-zone", // Add zoneId
      billSummary,
    };

    setShowTimeConfirmation(false);
    console.log("booking data : ", bookingData);
    navigate("/checkout/info", { state: { bookingData } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image Section */}
      <div className="relative h-[35vh] sm:h-[40vh] md:h-[45vh] lg:h-[50vh]">
        <img
          src={mainImage}
          alt={vehicle.name}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent"></div>

        {/* Top Actions */}
        <div className="absolute top-0 left-0 right-0 p-2 sm:p-3 flex items-center justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
          </button>
          <div className="flex gap-1.5">
            <button className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            <button className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Image Indicators */}
        {vehicle.images && vehicle.images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {vehicle.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "w-15 bg-green-500 scale-20  "
                    : "w-1.5 bg-white/60 scale-18 "
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative bg-white px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 max-w-4xl mx-auto">
        {/* Vehicle Title */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
              {vehicle.name}
            </h1>
            <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-600 text-xs font-semibold rounded-full border border-green-200 whitespace-nowrap">
              {vehicle.fuelType?.toUpperCase() || "PETROL"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-gray-800 font-medium">
                {vehicle.rating}
              </span>
              <span className="hidden sm:inline">
                ({vehicle.shop?.rating || 128} reviews)
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate max-w-[150px] sm:max-w-none">
                {vehicle.location?.center ||
                  vehicle.location?.address ||
                  "Location"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center border border-gray-100">
            <div className="text-lg sm:text-2xl mb-1">🏍️</div>
            <div className="text-[10px] sm:text-xs text-gray-500">MILEAGE</div>
            <div className="text-xs sm:text-sm font-semibold text-gray-800">
              {vehicle.specifications?.mileage || "22 km/l"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center border border-gray-100">
            <div className="text-lg sm:text-2xl mb-1">⚡</div>
            <div className="text-[10px] sm:text-xs text-gray-500">FUEL</div>
            <div className="text-xs sm:text-sm font-semibold text-gray-800">
              {vehicle.fuelType || "Petrol"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center border border-gray-100">
            <div className="text-lg sm:text-2xl mb-1">🔋</div>
            <div className="text-[10px] sm:text-xs text-gray-500">DEPOSIT</div>
            <div className="text-xs sm:text-sm font-semibold text-gray-800">
              ₹{rawVehicle?.depositAmount || 5000}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center border border-gray-100">
            <div className="text-lg sm:text-2xl mb-1">💺</div>
            <div className="text-[10px] sm:text-xs text-gray-500">SEATS</div>
            <div className="text-xs sm:text-sm font-semibold text-gray-800">
              {vehicle?.seatingCapacity || 2}
            </div>
          </div>
        </div>

        {/* Rental Plan */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3">
            Rental Plan
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {rentalPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setRentalPlan(plan.id)}
                className={`relative p-2 sm:p-3 rounded-xl border-2 transition-all ${
                  rentalPlan === plan.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {rentalPlan === plan.id && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                )}
                <div className="text-[10px] sm:text-xs text-gray-500">
                  {plan.label}
                </div>
                <div className="text-sm sm:text-lg font-bold text-green-600">
                  {plan.price}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Accessories */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3">
            Accessories
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {/* Extra Helmet */}
            {/* <BikeToggle /> */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center text-base sm:text-xl shadow-sm">
                  🪖
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm text-gray-800 truncate">
                    Extra Helmet
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    ₹50 per helmet
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {extraHelmet && (
                  <div className="flex items-center gap-1 bg-white rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-gray-200">
                    <button
                      onClick={() =>
                        setHelmetCount(Math.max(1, helmetCount - 1))
                      }
                      className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="w-4 sm:w-5 text-center text-xs sm:text-sm text-gray-800 font-medium">
                      {helmetCount}
                    </span>
                    <button
                      onClick={() =>
                        setHelmetCount(Math.min(2, helmetCount + 1))
                      }
                      className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
                <div className="text-green-600 font-semibold text-xs sm:text-sm whitespace-nowrap">
                  +₹{extraHelmet ? helmetCount * 50 : 50}
                </div>
                <button
                  onClick={() => setExtraHelmet(!extraHelmet)}
                  className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-all duration-300 ease-in-out ${
                    extraHelmet ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{
                      x: extraHelmet ? 24 : 2, // Horizontal movement for wider toggle
                      scale: extraHelmet ? 1.05 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md border border-gray-200"
                  />
                </button>
              </div>
            </div>

            {/* Full Insurance */}
            {/* <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center text-base sm:text-xl shadow-sm">
                  🛡️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm text-gray-800 truncate">
                    Full Insurance
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    Coverage on all damages
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="text-green-600 font-semibold text-xs sm:text-sm whitespace-nowrap">
                  +₹100
                </div>
                <button
                  onClick={() => setFullInsurance(!fullInsurance)}
                  className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-all duration-300 ease-in-out ${
                    fullInsurance ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{ 
                      x: fullInsurance ? 24 : 2, // Horizontal movement for wider toggle
                      scale: fullInsurance ? 1.05 : 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md border border-gray-200"
                  />
                </button>
              </div>
            </div> */}
          </div>
        </div>

        {/* Pickup & Drop-off */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3">
            Pickup & Drop-off
          </h3>
          <div className="space-y-3">
            {/* Pickup */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-green-500 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Pickup Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-green-500 text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Drop-off */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Drop-off Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <input
                    type="date"
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-green-500 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Drop-off Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <input
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-green-500 text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Duration Display */}
            {duration.hours > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Rental Duration
                </span>
                <span className="text-sm sm:text-base font-bold text-green-600">
                  {duration.label}
                </span>
              </div>
            )}

            {/* Vehicle Location & Availability */}
            <div className="space-y-3">
              {/* Vehicle Location (Read-only) */}
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Vehicle Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800">
                    {vehicle?.location?.center ||
                      vehicle?.location?.zone ||
                      vehicle?.location?.address ||
                      "Vehicle Location"}
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 mb-1 block uppercase">
                  Availability Status
                </label>
                <div className="relative">
                  <div
                    className={`w-full border rounded-lg p-2.5 sm:p-3 ${
                      isCheckingAvailability
                        ? "bg-gray-50 border-gray-200"
                        : availabilityStatus?.available
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCheckingAvailability ? (
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      ) : availabilityStatus?.available ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div
                          className={`text-xs sm:text-sm font-medium ${
                            isCheckingAvailability
                              ? "text-gray-600"
                              : availabilityStatus?.available
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {isCheckingAvailability
                            ? "Checking availability..."
                            : availabilityStatus?.available
                            ? "Available for selected time"
                            : "Not available for selected time"}
                        </div>
                        {availabilityStatus &&
                          !availabilityStatus.available &&
                          availabilityStatus.nextAvailable && (
                            <div className="text-[10px] sm:text-xs text-red-600 mt-1">
                              Next available:{" "}
                              {new Date(
                                availabilityStatus.nextAvailable
                              ).toLocaleString()}
                            </div>
                          )}
                        {availabilityStatus?.message && (
                          <div className="text-[10px] sm:text-xs text-gray-600 mt-1">
                            {availabilityStatus.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Summary Toggle */}
        <div>
          <button
            onClick={() => setShowBillSummary(!showBillSummary)}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <span className="text-sm sm:text-base font-semibold text-gray-800">
              Bill Summary
            </span>
            <div className="flex items-center gap-2">
              {billSummary && (
                <span className="text-green-600 font-bold">
                  ₹{billSummary.grandTotal}
                </span>
              )}
              {showBillSummary ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showBillSummary && billSummary && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 sm:space-y-3">
                  {/* Plan Details Box */}
                  <div className="bg-white rounded-lg p-2.5 sm:p-3 mb-3 border border-gray-100">
                    <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">KM Limit:</span>
                        <span className="font-medium">
                          {billSummary.kmLimit} km
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Extra/km:</span>
                        <span className="font-medium">
                          ₹{billSummary.extraChargePerKm}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Grace Period:</span>
                        <span className="font-medium">
                          {billSummary.gracePeriodMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">
                        {billSummary.planLabel} Base Rate (
                        {billSummary.hours <= 12 ? billSummary.hours : 12}hrs)
                      </span>
                      <span className="text-gray-800">
                        ₹{billSummary.baseRate}
                      </span>
                    </div>
                    {billSummary.extraCharges > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">
                          Extra Time Charges ({billSummary.hours - 12}hrs × ₹
                          {billSummary.ratePerHour})
                        </span>
                        <span className="text-gray-800">
                          ₹{billSummary.extraCharges}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Helmet Count */}
                  {billSummary.helmetCount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Extra Helmet ({billSummary.helmetCount} × ₹50)
                      </span>
                      <span className="text-gray-800">
                        ₹{billSummary.helmetCost}
                      </span>
                    </div>
                  )}

                  {/* Insurance */}
                  {billSummary.insuranceCost > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Full Insurance</span>
                      <span className="text-gray-800">
                        ₹{billSummary.insuranceCost}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2 sm:pt-3"></div>

                  {/* Subtotal */}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-800">
                      ₹{billSummary.subtotal}
                    </span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">GST (18%)</span>
                    <span className="text-gray-800">₹{billSummary.gst}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 sm:pt-3"></div>

                  {/* Total */}
                  <div className="flex justify-between text-sm sm:text-base font-semibold">
                    <span className="text-gray-800">Total Rental Amount</span>
                    <span className="text-gray-800">₹{billSummary.total}</span>
                  </div>

                  {/* Security Deposit */}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-amber-600">
                      Security Deposit (Refundable)
                    </span>
                    <span className="text-amber-600">
                      ₹{billSummary.deposit}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 sm:pt-3"></div>

                  {/* Grand Total */}
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span className="text-gray-800">Grand Total</span>
                    <span className="text-gray-800">
                      ₹{billSummary.grandTotal}
                    </span>
                  </div>

                  {/* Payment Breakdown Box */}
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 space-y-2">
                    <div className="text-xs sm:text-sm text-green-700 font-medium mb-2">
                      Payment Breakdown ({billSummary.paymentPercentage}%
                      advance required)
                    </div>

                    {/* Pay Now */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm sm:text-base font-bold text-green-600">
                          Pay Now
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          {billSummary.paymentPercentage}% of ₹
                          {billSummary.total} + ₹{billSummary.deposit} deposit
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        ₹{billSummary.payNow}
                      </div>
                    </div>

                    {/* Pay Later */}
                    <div className="flex justify-between items-center border-t border-green-200 pt-2">
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-600">
                          Pay Later
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                          Remaining balance on pickup
                        </div>
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-gray-600">
                        ₹{billSummary.payLater}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Total Price & Book Button */}
        <div className="flex items-center justify-between pt-2 sm:pt-4 pb-4 sm:pb-6">
          <div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              Pay Now to Book
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              ₹{billSummary?.payNow || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              + ₹{billSummary?.payLater || 0} on pickup
            </div>
          </div>
          <button
            onClick={handleBookNow}
            disabled={
              !pickupDate ||
              !pickupTime ||
              !dropoffDate ||
              !dropoffTime ||
              isCheckingAvailability ||
              (availabilityStatus && !availabilityStatus.available)
            }
            className={`px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 ${
              pickupDate &&
              pickupTime &&
              dropoffDate &&
              dropoffTime &&
              !isCheckingAvailability &&
              availabilityStatus?.available
                ? "bg-green-500 text-white hover:bg-green-600 hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isCheckingAvailability ? "Checking..." : "Book Now"}
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Time Confirmation Modal */}
      <AnimatePresence>
        {showTimeConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTimeConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Confirm Booking Time
                </h3>

                <p className="text-gray-600 mb-6">
                  Please confirm your rental period before proceeding
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pickup</span>
                    <span className="font-medium">
                      {new Date(`${pickupDate}T${pickupTime}`).toLocaleString(
                        "en-IN",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dropoff</span>
                    <span className="font-medium">
                      {new Date(`${dropoffDate}T${dropoffTime}`).toLocaleString(
                        "en-IN",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-bold text-green-600">
                      {duration.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">
                      {vehicle?.location?.center ||
                        vehicle?.location?.zone ||
                        "Vehicle Location"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTimeConfirmation(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Change Time
                  </button>

                  <button
                    onClick={confirmBooking}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    Confirm & Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleDetailPage;
