import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateSubscriptionMutation } from "./subscriptionApi";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Calendar,
  Clock,
  DollarSign,
  Save,
  X,
  AlertCircle,
} from "lucide-react";

const EditableSubscriptionForm = ({ subscription, onCancel, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateSubscription, { isLoading }] = useUpdateSubscriptionMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: subscription?.status || "active",
      startDate: subscription?.startDate
        ? new Date(subscription.startDate).toISOString().split("T")[0]
        : "",
      endDate: subscription?.endDate
        ? new Date(subscription.endDate).toISOString().split("T")[0]
        : "",
      price: subscription?.price || 0,
      deliveryDays: subscription?.deliveryDays || [],
      notes: subscription?.notes || "",
    },
  });

  const statusOptions = [
    { value: "active", label: "Active", icon: CheckCircle },
    { value: "paused", label: "Paused", icon: Pause },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  const deliveryDayOptions = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const onSubmit = async (data) => {
    try {
      const updateData = {
        ...data,
        price: Number(data.price),
        deliveryDays: Array.isArray(data.deliveryDays)
          ? data.deliveryDays
          : [data.deliveryDays].filter(Boolean),
      };

      const result = await updateSubscription({
        id: subscription._id,
        data: updateData,
      }).unwrap();

      toast.success("Subscription updated successfully");
      onSuccess?.(result.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error(error.data?.message || "Failed to update subscription");
    }
  };

  if (!subscription) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Subscription #{subscription.subscriptionNumber}
        </h3>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </button>
        ) : (
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setIsEditing(false);
                onCancel?.();
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            {isEditing ? (
              <select
                {...register("status", { required: "Status is required" })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 flex items-center">
                {React.createElement(
                  statusOptions.find((s) => s.value === subscription.status)
                    ?.icon || CheckCircle,
                  {
                    className: `h-5 w-5 mr-2 ${
                      subscription.status === "active"
                        ? "text-green-500"
                        : subscription.status === "paused"
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`,
                  }
                )}
                <span className="capitalize">{subscription.status}</span>
              </div>
            )}
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price must be positive" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />₹
                {subscription.price?.toFixed(2) || "0.00"}
              </div>
            )}
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            {isEditing ? (
              <input
                type="date"
                {...register("startDate", {
                  required: "Start date is required",
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                {new Date(subscription.startDate).toLocaleDateString()}
              </div>
            )}
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.startDate.message}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            {isEditing ? (
              <input
                type="date"
                {...register("endDate")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                {subscription.endDate
                  ? new Date(subscription.endDate).toLocaleDateString()
                  : "No end date"}
              </div>
            )}
          </div>

          {/* Delivery Days */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Days
            </label>
            {isEditing ? (
              <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {deliveryDayOptions.map((day) => (
                  <div key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`day-${day.value}`}
                      value={day.value}
                      {...register("deliveryDays")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`day-${day.value}`}
                      className="ml-2 block text-sm text-gray-700"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {subscription.deliveryDays?.length > 0 ? (
                  subscription.deliveryDays.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">
                    No delivery days set
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                {...register("notes")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Add any notes about this subscription..."
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {subscription.notes || "No notes available"}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditableSubscriptionForm;
