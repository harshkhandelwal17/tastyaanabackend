import React, { useState, useEffect } from "react";
import {
  FiX,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiInfo,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const SellerExtendBookingModal = ({
  isOpen,
  onClose,
  booking,
  currentEndTime,
  onCreateExtension,
  isLoading,
}) => {
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [calculation, setCalculation] = useState(null);

  // Set initial values based on current end time
  useEffect(() => {
    if (isOpen && currentEndTime) {
      const date = new Date(currentEndTime);
      // Add 1 hour default extension
      date.setTime(date.getTime() + 60 * 60 * 1000);

      setNewEndDate(date.toISOString().split("T")[0]);
      setNewEndTime(date.toTimeString().slice(0, 5));
    }
  }, [isOpen, currentEndTime]);

  // Calculate costs when date/time changes
  useEffect(() => {
    if (newEndDate && newEndTime && booking) {
      calculateExtension();
    }
  }, [newEndDate, newEndTime]);

  const calculateExtension = () => {
    try {
      const currentEnd = new Date(currentEndTime);
      const proposedEnd = new Date(`${newEndDate}T${newEndTime}`);

      if (proposedEnd <= currentEnd) {
        setCalculation(null);
        return;
      }

      // Calculate duration in hours
      const durationMs = proposedEnd - currentEnd;
      const extraHours = Math.ceil(durationMs / (1000 * 60 * 60));

      if (extraHours < 1) return;

      // Get rate based on plan
      const vehicle = booking.vehicleId;

      // Determine rate per hour based on booking rate type
      let hourlyRate = 50; // default
      let kmLimitPerHour = 10;

      if (booking.ratePlanUsed) {
        if (booking.rateType === "hourly12" && vehicle.rate12hr) {
          hourlyRate = vehicle.rate12hr.ratePerHour || 50;
          kmLimitPerHour = Math.round(vehicle.rate12hr.kmLimit / 12) || 10;
        } else if (booking.rateType === "hourly" && vehicle.rateHourly) {
          hourlyRate = vehicle.rateHourly.ratePerHour || 50;
          kmLimitPerHour = vehicle.rateHourly.kmFreePerHour || 10;
        } else if (booking.rateType === "daily" && vehicle.rate24hr) {
          hourlyRate = vehicle.rate24hr.ratePerHour || 3;
          kmLimitPerHour = Math.round(vehicle.rate24hr.kmLimit / 24) || 6;
        }
      }

      const additionalAmount = extraHours * hourlyRate;
      const gstAmount = additionalAmount * 0.18;
      const totalAmount = additionalAmount + gstAmount;
      const additionalKmLimit = extraHours * kmLimitPerHour;

      setCalculation({
        extraHours,
        hourlyRate,
        additionalAmount,
        gstAmount,
        totalAmount,
        additionalKmLimit,
        newEndDateTime: proposedEnd.toISOString(),
      });
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculation(null);
    }
  };

  const handleSubmit = () => {
    if (!calculation) {
      toast.error("Please select a valid extension time");
      return;
    }

    if (!extensionReason.trim()) {
      toast.error("Please provide a reason for the extension");
      return;
    }

    const extensionData = {
      requestedEndDateTime: calculation.newEndDateTime,
      additionalHours: calculation.extraHours,
      additionalAmount: calculation.additionalAmount,
      additionalGst: calculation.gstAmount,
      additionalKmLimit: calculation.additionalKmLimit,
      reason: extensionReason.trim(),
      createdBy: "seller", // Mark as seller-initiated
      status: "approved", // Auto-approve seller extensions
      autoApproved: true,
    };

    onCreateExtension(extensionData);
  };

  const reset = () => {
    setNewEndDate("");
    setNewEndTime("");
    setExtensionReason("");
    setCalculation(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-25"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Extend Booking Period
            </h3>
            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Current End Time */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Current End Time</p>
              <p className="font-medium">
                {new Date(currentEndTime).toLocaleString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* New End Time Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                New End Time
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Extension Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Extension
              </label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="e.g., Customer requested more time, vehicle breakdown, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Calculation Display */}
            {calculation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiInfo className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Extension Summary
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Additional Hours:</span>
                    <span className="font-medium">
                      {calculation.extraHours} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Rate per Hour:</span>
                    <span className="font-medium">
                      ₹{calculation.hourlyRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Additional KM Limit:</span>
                    <span className="font-medium">
                      +{calculation.additionalKmLimit} km
                    </span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="flex justify-between">
                    <span className="text-blue-700">Extension Amount:</span>
                    <span className="font-medium">
                      ₹{calculation.additionalAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">GST (18%):</span>
                    <span className="font-medium">
                      ₹{Math.round(calculation.gstAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t border-blue-200 pt-2">
                    <span className="text-blue-900">Total to Collect:</span>
                    <span className="text-blue-900">
                      ₹{Math.round(calculation.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!calculation && newEndDate && newEndTime && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    New end time must be after current end time
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!calculation || !extensionReason.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Extension
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerExtendBookingModal;
