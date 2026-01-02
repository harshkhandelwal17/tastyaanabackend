import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  X,
  Clock,
  Gauge,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Camera,
  FileText,
  Calendar,
  Settings,
  Calculator,
  CreditCard,
  AlertCircle,
  Truck,
  Car,
} from "lucide-react";

const VehicleDropModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentTime] = useState(new Date());

  // Form state
  const [dropData, setDropData] = useState({
    // Meter reading
    endMeterReading: "",

    // Vehicle condition
    fuelLevel: "unknown",
    vehicleCondition: "good",
    damageNotes: "",
    returnImages: [],

    // Simplified additional charges - single input
    additionalCharges: 0,
    additionalChargesDescription: "",

    // Helmet status
    helmetReturned: false,

    // Notes
    generalNotes: "",
  });

  const [calculations, setCalculations] = useState({
    totalKmTraveled: 0,
    extraKmCharge: 0,
    extraHourCharge: 0,
    totalRentalTime: 0, // in hours
    finalAmount: booking?.totalAmount || 0,
    extensionCharges: 0,
    remainingAmount: 0, // Amount remaining after payments
    totalHelmetsTaken: 0, // Count of helmets in booking
  });

  const [showCalculation, setShowCalculation] = useState(false);

  // Debug booking data structure when component mounts
  useEffect(() => {
    if (booking) {
      console.log("🚗 Complete Booking Data in Drop Modal:", booking);
      console.log("📊 Vehicle Data:", booking.vehicleId || booking.vehicle);
      console.log("💰 Rate Plan:", booking.ratePlanUsed);
      console.log("🏁 Vehicle Handover:", booking.vehicleHandover);
      console.log("💵 Amount Fields:", {
        totalAmount: booking.totalAmount,
        amount: booking.amount,
        finalAmount: booking.finalAmount,
        billing: booking.billing,
      });
    }
  }, [booking]);

  // Calculate trip metrics and charges
  useEffect(() => {
    calculateCharges();
  }, [dropData.endMeterReading, dropData.additionalCharges]);

  const calculateCharges = () => {
    const startReading =
      booking?.vehicleHandover?.startMeterReading ||
      booking?.startMeterReading ||
      booking?.vehicle?.meterReading ||
      0;
    const endReading = parseFloat(dropData.endMeterReading) || 0;

    // Calculate pickup time (actual handover time or start time)
    const pickupTime = new Date(
      booking?.vehicleHandover?.handoverTime || booking?.startDateTime
    );
    const dropTime = currentTime;

    // Calculate total rental time in hours (exact calculation - no rounding)
    const totalRentalTimeMs = dropTime - pickupTime;
    const totalRentalTimeHours = Math.max(
      0,
      totalRentalTimeMs / (1000 * 60 * 60)
    );

    let totalKmTraveled = 0;
    let timeCharge = 0;
    let extraKmCharge = 0;
    let totalBill = 0;
    let freeKm = 0;
    let extraKm = 0;

    if (endReading > startReading) {
      totalKmTraveled = endReading - startReading;
    }

    // Get rate plan details
    const planType = booking?.rateType || "hourly";
    const ratePlan = booking?.ratePlanUsed || {};

    // Calculate based on plan type using your exact specifications
    switch (planType.toLowerCase()) {
      case "hourly":
      case "hourly_plan":
      case "with_fuel":
        // HOURLY PLAN: Hourly Rate: ₹50/hr, Free Distance: 10 km per hour, Extra Distance: ₹6/km
        const hourlyRate = ratePlan.ratePerHour || ratePlan.hourly_rate || 50;
        const kmPerHour = ratePlan.kmFreePerHour || 10;
        const extraKmRate = ratePlan.extraChargePerKm || ratePlan.extra_km || 6;

        // Time Charge = Total Hours × Hourly Rate
        timeCharge = totalRentalTimeHours * hourlyRate;

        // Free KM = Total Hours × 10 (can be fractional)
        freeKm = totalRentalTimeHours * kmPerHour;

        // Extra KM = max(0, Total KM − Free KM)
        extraKm = Math.max(0, totalKmTraveled - freeKm);

        // Extra KM Charge = Extra KM × 6
        extraKmCharge = extraKm * extraKmRate;

        // Total Bill = Time Charge + Extra KM Charge
        totalBill = timeCharge + extraKmCharge;
        break;

      case "12hr":
      case "12_hour":
        // 12-HOUR PLAN: Base Rate: ₹500, Base Duration: 12hr, Free Distance: 120km
        const baseRate12 = ratePlan.baseRate || ratePlan.rate || 500;
        const baseDuration12 = 12;
        const freeDistance12 = ratePlan.kmLimit || ratePlan.limit_km || 120;
        const extraHourRate12 =
          ratePlan.extraChargePerHour || ratePlan.extra_hr || 50;
        const extraKmRate12 =
          ratePlan.extraChargePerKm || ratePlan.extra_km || 3;

        // Extra Time = max(0, Total Hours − 12)
        const extraTime12 = Math.max(0, totalRentalTimeHours - baseDuration12);

        // Extra KM = max(0, Total KM − 120)
        extraKm = Math.max(0, totalKmTraveled - freeDistance12);

        // Total Bill = Base Rate + (Extra Time × 50) + (Extra KM × 3)
        totalBill =
          baseRate12 + extraTime12 * extraHourRate12 + extraKm * extraKmRate12;

        timeCharge = baseRate12 + extraTime12 * extraHourRate12;
        extraKmCharge = extraKm * extraKmRate12;
        break;

      case "24hr":
      case "24_hour":
        // 24-HOUR PLAN: Base Rate: ₹750, Base Duration: 24hr, Free Distance: 150km
        const baseRate24 = ratePlan.baseRate || ratePlan.rate || 750;
        const baseDuration24 = 24;
        const freeDistance24 = ratePlan.kmLimit || ratePlan.limit_km || 150;
        const extra12HrBlock = ratePlan.extraBlockRate || 500;
        const extraHourRate24 =
          ratePlan.extraChargePerHour || ratePlan.extra_hr || 3;
        const extraKmRate24 =
          ratePlan.extraChargePerKm || ratePlan.extra_km || 3;

        // Extra Time = max(0, Total Hours − 24)
        const extraTime24 = Math.max(0, totalRentalTimeHours - baseDuration24);

        // Extra 12Hr Blocks = floor(Extra Time / 12)
        const extra12HrBlocks = Math.floor(extraTime24 / 12);

        // Remaining Hours = Extra Time % 12
        const remainingHours = extraTime24 % 12;

        // Extra KM = max(0, Total KM − 150)
        extraKm = Math.max(0, totalKmTraveled - freeDistance24);

        // Total Bill = Base Rate + (Extra 12Hr Blocks × 500) + (Remaining Hours × 3) + (Extra KM × 3)
        timeCharge =
          baseRate24 +
          extra12HrBlocks * extra12HrBlock +
          remainingHours * extraHourRate24;
        extraKmCharge = extraKm * extraKmRate24;
        totalBill = timeCharge + extraKmCharge;
        break;

      case "daily":
      case "day_wise":
        // DAY WISE PLAN: Rate: ₹750/day, Limit: 150km, Extra KM: ₹3, Extra Hr: ₹50
        const dailyRate = ratePlan.rate_day || ratePlan.baseRate || 750;
        const dailyKmLimit = ratePlan.limit_day || ratePlan.kmLimit || 150;
        const dailyExtraKmRate = ratePlan.extra_km || 3;
        const dailyExtraHrRate = ratePlan.extra_hr || 50;
        const availableHours = ratePlan.available_hr || 36;

        // Calculate base days (assume 24 hours per day)
        const baseDays = Math.ceil(totalRentalTimeHours / 24);
        const extraHoursDaily = Math.max(
          0,
          totalRentalTimeHours - (availableHours || 24)
        );

        // Extra KM calculation
        extraKm = Math.max(0, totalKmTraveled - dailyKmLimit * baseDays);

        timeCharge = dailyRate * baseDays + extraHoursDaily * dailyExtraHrRate;
        extraKmCharge = extraKm * dailyExtraKmRate;
        totalBill = timeCharge + extraKmCharge;
        break;

      default:
        // Fallback to simple calculation
        timeCharge = totalRentalTimeHours * (ratePlan.ratePerHour || 50);
        extraKmCharge =
          Math.max(0, totalKmTraveled - (ratePlan.kmLimit || 0)) *
          (ratePlan.extraChargePerKm || 3);
        totalBill = timeCharge + extraKmCharge;
        break;
    }

    // Calculate extension charges (from approved extensions)
    let extensionCharges = 0;
    if (booking?.extensionRequests?.length > 0) {
      extensionCharges = booking.extensionRequests
        .filter((ext) => ext.status === "approved")
        .reduce((total, ext) => total + (ext.additionalAmount || 0), 0);
    }

    // Add single additional charges input
    const additionalCharges = parseFloat(dropData.additionalCharges) || 0;

    // Final amount calculation (add original bill + new charges + extensions + additional charges)
    const finalAmount = totalBill + extensionCharges + additionalCharges;

    // Calculate helmet count
    const totalHelmetsTaken =
      booking?.addons
        ?.filter((addon) => addon.name.toLowerCase().includes("helmet"))
        .reduce((total, addon) => total + addon.count, 0) || 0;

    // Calculate remaining amount after payments
    const totalPaidAmount =
      booking?.payments?.reduce(
        (total, payment) =>
          total + (payment.status === "success" ? payment.amount : 0),
        0
      ) || 0;
    const remainingAmount = Math.max(0, finalAmount - totalPaidAmount);

    setCalculations({
      totalKmTraveled: Math.round(totalKmTraveled * 10) / 10, // Round to 1 decimal
      extraKmCharge: Math.round(extraKmCharge * 100) / 100, // Round to 2 decimals
      extraHourCharge: Math.round(timeCharge * 100) / 100, // This is now the time charge
      totalRentalTime: Math.round(totalRentalTimeHours * 100) / 100, // Round to 2 decimals for precision
      finalAmount: Math.round(finalAmount * 100) / 100, // Round only at the end
      extensionCharges: Math.round(extensionCharges * 100) / 100,
      totalHelmetsTaken,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      // Additional calculation details for display
      freeKm: Math.round(freeKm * 10) / 10,
      extraKm: Math.round(extraKm * 10) / 10,
      timeCharge: Math.round(timeCharge * 100) / 100,
      planType: planType,
    });
  };

  const handleInputChange = (field, value) => {
    setDropData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // In a real app, you'd upload to cloud storage
      const imageUrls = files.map((file) => URL.createObjectURL(file));
      setDropData((prev) => ({
        ...prev,
        returnImages: [...prev.returnImages, ...imageUrls],
      }));
    }
  };

  const validateForm = () => {
    if (!dropData.endMeterReading) {
      toast.error("Please enter the meter reading");
      return false;
    }

    const startReading = booking?.vehicleHandover?.startMeterReading || 0;
    const endReading = parseFloat(dropData.endMeterReading);

    if (endReading < startReading) {
      toast.error("End meter reading cannot be less than start meter reading");
      return false;
    }

    if (dropData.vehicleCondition === "damaged" && !dropData.damageNotes) {
      toast.error(
        "Please provide damage notes when vehicle condition is damaged"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // API call to process vehicle drop
      const response = await fetch(
        `/api/seller/bookings/${booking._id}/drop-vehicle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            ...dropData,
            dropTime: currentTime.toISOString(),
            calculations,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to process vehicle drop");

      const result = await response.json();

      toast.success("Vehicle drop processed successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error processing vehicle drop:", error);
      toast.error("Failed to process vehicle drop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Truck className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Vehicle Drop Processing
                </h3>
                <p className="text-sm text-gray-500">
                  {booking?.vehicle?.brand} {booking?.vehicle?.model} -{" "}
                  {booking?.bookingId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Drop Time Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Drop Time</h4>
                  <p className="text-blue-700">{formatDateTime(currentTime)}</p>
                </div>
              </div>
            </div>

            {/* Trip Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Trip Summary & Plan Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Pickup Time:</span>
                  <p className="font-medium">
                    {formatDateTime(
                      booking?.vehicleHandover?.handoverTime ||
                        booking?.startDateTime
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Drop Time:</span>
                  <p className="font-medium">{formatDateTime(currentTime)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Rental Time:</span>
                  <p className="font-medium text-blue-600">
                    {calculations.totalRentalTime} hours
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Plan Selected:</span>
                  <p className="font-medium">
                    {booking?.rateType?.replace("_", " ").toUpperCase() ||
                      "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">KM Limit:</span>
                  <p className="font-medium">
                    {booking?.ratePlanUsed?.kmLimit || 0} km
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Start Meter Reading:</span>
                  <p className="font-medium">
                    {booking?.vehicleHandover?.startMeterReading ||
                      booking?.startMeterReading ||
                      "Not recorded"}{" "}
                    km
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Original Amount:</span>
                  <p className="font-medium">
                    {formatCurrency(
                      booking?.totalAmount ||
                        booking?.billing?.totalBill ||
                        booking?.amount ||
                        booking?.finalAmount ||
                        0
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Helmets Taken:</span>
                  <p className="font-medium text-green-600">
                    {calculations.totalHelmetsTaken} helmet(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Details & Rate Plan */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Car className="w-4 h-4 mr-2" />
                Vehicle Details & Rate Plan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="col-span-full md:col-span-2 lg:col-span-1">
                  <div className="bg-white rounded-lg p-3 border border-purple-200 h-full">
                    <span className="text-purple-600 font-medium">
                      Vehicle Information:
                    </span>
                    <div className="mt-2 space-y-1">
                      <p className="font-bold text-purple-900">
                        {booking?.vehicleId?.name ||
                          booking?.vehicle?.name ||
                          booking?.vehicleName ||
                          "Vehicle Name N/A"}
                      </p>
                      <p className="text-purple-700">
                        <strong>Company:</strong>{" "}
                        {booking?.vehicleId?.companyName ||
                          booking?.vehicle?.companyName ||
                          booking?.vehicleId?.company ||
                          booking?.vehicle?.company ||
                          "N/A"}
                      </p>
                      <p className="text-purple-700">
                        <strong>Model:</strong>{" "}
                        {booking?.vehicleId?.model ||
                          booking?.vehicle?.model ||
                          booking?.vehicleModel ||
                          "N/A"}
                      </p>
                      <p className="text-purple-700">
                        <strong>Registration:</strong>{" "}
                        {booking?.vehicleId?.registrationNumber ||
                          booking?.vehicle?.registrationNumber ||
                          booking?.vehicleId?.numberPlate ||
                          booking?.vehicle?.numberPlate ||
                          "N/A"}
                      </p>
                      <p className="text-purple-700">
                        <strong>Fuel Type:</strong>{" "}
                        {booking?.vehicleId?.fuelType ||
                          booking?.vehicle?.fuelType ||
                          "N/A"}
                      </p>
                      <p className="text-purple-700">
                        <strong>CC:</strong>{" "}
                        {booking?.vehicleId?.engineCapacity ||
                          booking?.vehicle?.engineCapacity ||
                          booking?.vehicleId?.cc ||
                          booking?.vehicle?.cc ||
                          "N/A"}
                        cc
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-full md:col-span-2 lg:col-span-2">
                  <div className="bg-white rounded-lg p-3 border border-purple-200 h-full">
                    <span className="text-purple-600 font-medium">
                      Rate Plan Details:
                    </span>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-purple-700">
                          <strong>Plan Type:</strong>{" "}
                          {(booking?.rateType || "hourly")
                            .replace("_", " ")
                            .toUpperCase()}
                        </p>
                        <p className="text-purple-700">
                          <strong>Base Rate:</strong>{" "}
                          {booking?.rateType?.toLowerCase() === "hourly" ||
                          booking?.rateType?.toLowerCase() === "hourly_plan"
                            ? `₹${
                                booking?.ratePlanUsed?.ratePerHour ||
                                booking?.ratePlanUsed?.hourly_rate ||
                                50
                              }/hour`
                            : `₹${
                                booking?.ratePlanUsed?.baseRate ||
                                booking?.ratePlanUsed?.rate ||
                                500
                              }`}
                        </p>
                        <p className="text-purple-700">
                          <strong>KM Limit/Free:</strong>{" "}
                          {booking?.rateType?.toLowerCase() === "hourly" ||
                          booking?.rateType?.toLowerCase() === "hourly_plan"
                            ? `${
                                booking?.ratePlanUsed?.kmFreePerHour || 10
                              } km/hour`
                            : `${
                                booking?.ratePlanUsed?.kmLimit ||
                                booking?.ratePlanUsed?.limit_km ||
                                120
                              } km total`}
                        </p>
                        <p className="text-purple-700">
                          <strong>Extra KM Rate:</strong> ₹
                          {booking?.ratePlanUsed?.extraChargePerKm ||
                            booking?.ratePlanUsed?.extra_km ||
                            3}
                          /km
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-purple-700">
                          <strong>Duration:</strong>{" "}
                          {booking?.rateType?.toLowerCase() === "hourly" ||
                          booking?.rateType?.toLowerCase() === "hourly_plan"
                            ? "Pay per hour"
                            : booking?.rateType?.toLowerCase() === "12hr" ||
                              booking?.rateType?.toLowerCase() === "12_hour"
                            ? "12 hours"
                            : booking?.rateType?.toLowerCase() === "24hr" ||
                              booking?.rateType?.toLowerCase() === "24_hour"
                            ? "24 hours"
                            : "Daily"}
                        </p>
                        <p className="text-purple-700">
                          <strong>Extra Hour Rate:</strong> ₹
                          {booking?.ratePlanUsed?.extraChargePerHour ||
                            booking?.ratePlanUsed?.extra_hr ||
                            50}
                          /hour
                        </p>
                        {(booking?.rateType?.toLowerCase() === "24hr" ||
                          booking?.rateType?.toLowerCase() === "24_hour") && (
                          <p className="text-purple-700">
                            <strong>12hr Block Rate:</strong> ₹
                            {booking?.ratePlanUsed?.extraBlockRate || 500}
                          </p>
                        )}
                        <p className="text-purple-700">
                          <strong>Original Amount:</strong>{" "}
                          <span className="font-bold text-green-600">
                            ₹
                            {booking?.totalAmount ||
                              booking?.billing?.totalBill ||
                              booking?.amount ||
                              booking?.finalAmount ||
                              0}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Current Trip Calculation Preview */}
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <span className="text-purple-600 font-medium">
                        Live Calculation Preview:
                      </span>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-600">Free KM</p>
                          <p className="font-bold text-purple-800">
                            {calculations.freeKm || 0} km
                          </p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-600">Extra KM</p>
                          <p className="font-bold text-purple-800">
                            {calculations.extraKm || 0} km
                          </p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-600">Time Charge</p>
                          <p className="font-bold text-purple-800">
                            ₹{calculations.timeCharge || 0}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-600">KM Charge</p>
                          <p className="font-bold text-purple-800">
                            ₹{calculations.extraKmCharge || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Bill & Payment Status */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Previous Bill & Payment Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Original Bill:</span>
                  <p className="font-bold text-blue-800">
                    {formatCurrency(booking?.totalAmount || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Amount Paid:</span>
                  <p className="font-bold text-green-700">
                    {formatCurrency(
                      booking?.payments?.reduce(
                        (total, payment) =>
                          total +
                          (payment.status === "success" ? payment.amount : 0),
                        0
                      ) || 0
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Payment Mode:</span>
                  <p className="font-medium text-blue-800">
                    {booking?.payments
                      ?.filter((p) => p.status === "success")
                      .map((p) => p.paymentMethod)
                      .join(", ") || "Not paid"}
                  </p>
                </div>
                <div className="col-span-full">
                  <span className="text-blue-600">Payment Details:</span>
                  <div className="mt-2 space-y-1">
                    {booking?.payments?.length > 0 ? (
                      booking.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-blue-100 p-2 rounded"
                        >
                          <span className="text-xs">
                            {payment.paymentMethod} -{" "}
                            {formatDateTime(payment.paymentDate)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-medium ${
                                payment.status === "success"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {payment.status.toUpperCase()}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-blue-600">
                        No payments recorded
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meter Reading */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Gauge className="w-4 h-4 mr-2" />
                Final Meter Reading
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Meter Reading (km) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dropData.endMeterReading}
                    onChange={(e) =>
                      handleInputChange("endMeterReading", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current meter reading"
                  />
                </div>
                {calculations.totalKmTraveled > 0 && (
                  <div className="flex items-end">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 w-full">
                      <p className="text-sm text-green-600">
                        Total Distance Traveled
                      </p>
                      <p className="text-lg font-bold text-green-800">
                        {calculations.totalKmTraveled.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Condition */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Vehicle Condition
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Level
                  </label>
                  <select
                    value={dropData.fuelLevel}
                    onChange={(e) =>
                      handleInputChange("fuelLevel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="empty">Empty</option>
                    <option value="quarter">Quarter</option>
                    <option value="half">Half</option>
                    <option value="three-quarter">Three Quarter</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Condition
                  </label>
                  <select
                    value={dropData.vehicleCondition}
                    onChange={(e) =>
                      handleInputChange("vehicleCondition", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {dropData.vehicleCondition === "damaged" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Damage Notes *
                  </label>
                  <textarea
                    value={dropData.damageNotes}
                    onChange={(e) =>
                      handleInputChange("damageNotes", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Describe the damage in detail..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Photos
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="return-images"
                  />
                  <label
                    htmlFor="return-images"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Add Photos
                  </label>
                  {dropData.returnImages.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {dropData.returnImages.length} photo(s) added
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Helmet Return Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Helmet & Additional Charges
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Helmet Returned
                  </label>
                  <select
                    value={dropData.helmetReturned}
                    onChange={(e) =>
                      handleInputChange(
                        "helmetReturned",
                        e.target.value === "true"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Yes, Returned</option>
                    <option value="false">No, Not Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Charges (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dropData.additionalCharges}
                    onChange={(e) =>
                      handleInputChange("additionalCharges", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter total additional charges"
                  />
                </div>
              </div>
              {parseFloat(dropData.additionalCharges) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description of Additional Charges
                  </label>
                  <textarea
                    value={dropData.additionalChargesDescription}
                    onChange={(e) =>
                      handleInputChange(
                        "additionalChargesDescription",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Describe the additional charges (damage, cleaning, fuel, toll, etc.)"
                  />
                </div>
              )}
            </div>

            {/* Billing Calculation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Final Billing Calculation
                </h4>
                <button
                  onClick={() => setShowCalculation(!showCalculation)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  {showCalculation ? "Hide Details" : "Show Details"}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(booking?.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rental Time:</span>
                    <span className="font-medium">
                      {calculations.totalRentalTime} hours
                    </span>
                  </div>

                  {showCalculation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extra KM Charges:</span>
                        <span className="font-medium">
                          {formatCurrency(calculations.extraKmCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Extra Hour Charges:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(calculations.extraHourCharge)}
                        </span>
                      </div>
                      {calculations.extensionCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Extension Charges:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(calculations.extensionCharges)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Additional Charges:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            parseFloat(dropData.additionalCharges) || 0
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="col-span-2 border-t pt-2 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">New Total Amount:</span>
                      <span className="text-blue-600">
                        {formatCurrency(calculations.finalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Amount Already Paid:
                      </span>
                      <span className="font-medium text-green-600">
                        -
                        {formatCurrency(
                          booking?.payments?.reduce(
                            (total, payment) =>
                              total +
                              (payment.status === "success"
                                ? payment.amount
                                : 0),
                            0
                          ) || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span
                        className={
                          calculations.remainingAmount > 0
                            ? "text-red-700"
                            : "text-green-700"
                        }
                      >
                        {calculations.remainingAmount > 0
                          ? "Amount Due:"
                          : "Amount Overpaid:"}
                      </span>
                      <span
                        className={
                          calculations.remainingAmount > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(Math.abs(calculations.remainingAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Notes
              </label>
              <textarea
                value={dropData.generalNotes}
                onChange={(e) =>
                  handleInputChange("generalNotes", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Any additional notes about the vehicle drop..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>
                  New Total: {formatCurrency(calculations.finalAmount)}
                </span>
              </div>
              <div
                className={`flex items-center space-x-2 font-medium ${
                  calculations.remainingAmount > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                <span>
                  {calculations.remainingAmount > 0 ? "Due:" : "Overpaid:"}
                  {formatCurrency(Math.abs(calculations.remainingAmount))}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process Drop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDropModal;
