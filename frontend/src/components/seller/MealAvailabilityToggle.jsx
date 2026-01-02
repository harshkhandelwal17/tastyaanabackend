import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  useGetMealAvailabilityQuery,
  useUpdateMealAvailabilityMutation,
} from "../../redux/storee/api";
import {
  Clock,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle,
  Power,
  Loader2,
} from "lucide-react";

const MealAvailabilityToggle = () => {
  const [selectedShift, setSelectedShift] = useState("both");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("available");

  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
    refetch,
  } = useGetMealAvailabilityQuery();

  const [updateMealAvailability, { isLoading: isUpdating }] =
    useUpdateMealAvailabilityMutation();

  const mealAvailability = availabilityData?.data?.mealAvailability || {
    isAvailable: true,
    status: "available",
    shifts: {
      morning: { isAvailable: true, status: "available" },
      evening: { isAvailable: true, status: "available" },
    },
  };

  const handleToggle = async (shift, isAvailable) => {
    try {
      const updateData = {
        shift,
        isAvailable,
        status: isAvailable ? "available" : status,
        reason: !isAvailable ? reason : null,
      };

      await updateMealAvailability(updateData).unwrap();
      toast.success(`Meal availability updated for ${shift} shift`);
      refetch();
      setReason("");
    } catch (error) {
      console.error("Error updating meal availability:", error);
      toast.error("Failed to update meal availability");
    }
  };

  if (isLoadingAvailability) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">
            Loading meal availability...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <Power className="w-5 h-5 text-orange-500" />
          Meal Service Control
        </h4>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            mealAvailability.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {mealAvailability.isAvailable ? "Service On" : "Service Off"}
        </div>
      </div>

      <div className="space-y-6">
        {/* Overall Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Overall Service Status
            </span>
            <button
              onClick={() =>
                handleToggle("both", !mealAvailability.isAvailable)
              }
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mealAvailability.isAvailable ? "bg-green-600" : "bg-gray-300"
              } ${
                isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mealAvailability.isAvailable
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {!mealAvailability.isAvailable && mealAvailability.reason && (
            <p className="text-sm text-red-600">
              Reason: {mealAvailability.reason}
            </p>
          )}
        </div>

        {/* Shift-wise Controls */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-800">Shift-wise Controls</h5>

          {/* Morning Shift */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-yellow-600" />
              <div>
                <span className="font-medium text-gray-800">Morning Shift</span>
                {!mealAvailability.shifts.morning.isAvailable &&
                  mealAvailability.shifts.morning.reason && (
                    <p className="text-xs text-gray-600">
                      Reason: {mealAvailability.shifts.morning.reason}
                    </p>
                  )}
              </div>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "morning",
                  !mealAvailability.shifts.morning.isAvailable
                )
              }
              disabled={isUpdating}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                mealAvailability.shifts.morning.isAvailable
                  ? "bg-green-600"
                  : "bg-gray-300"
              } ${
                isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  mealAvailability.shifts.morning.isAvailable
                    ? "translate-x-5"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Evening Shift */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-600" />
              <div>
                <span className="font-medium text-gray-800">Evening Shift</span>
                {!mealAvailability.shifts.evening.isAvailable &&
                  mealAvailability.shifts.evening.reason && (
                    <p className="text-xs text-gray-600">
                      Reason: {mealAvailability.shifts.evening.reason}
                    </p>
                  )}
              </div>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "evening",
                  !mealAvailability.shifts.evening.isAvailable
                )
              }
              disabled={isUpdating}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                mealAvailability.shifts.evening.isAvailable
                  ? "bg-green-600"
                  : "bg-gray-300"
              } ${
                isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  mealAvailability.shifts.evening.isAvailable
                    ? "translate-x-5"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reason Input for turning off */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-800">Turn Off Service</h5>

          <div className="space-y-3">
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="both">Both Shifts</option>
              <option value="morning">Morning Only</option>
              <option value="evening">Evening Only</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="temporarily_off">Temporarily Off</option>
              <option value="maintenance">Maintenance</option>
              <option value="holiday">Holiday</option>
            </select>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for turning off meal service (optional)"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 resize-none"
            />

            <button
              onClick={() => handleToggle(selectedShift, false)}
              disabled={isUpdating}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              Turn Off Service
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h6 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quick Actions
          </h6>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToggle("both", true)}
              disabled={isUpdating || mealAvailability.isAvailable}
              className="bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Turn On All
            </button>
            <button
              onClick={() => handleToggle("both", false)}
              disabled={isUpdating || !mealAvailability.isAvailable}
              className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Turn Off All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealAvailabilityToggle;
