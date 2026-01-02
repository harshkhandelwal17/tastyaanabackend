import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetSubscriptionByIdQuery,
  useUpdateSubscriptionStatusMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiCalendar,
  FiUser,
  FiPackage,
  FiDollarSign,
  FiArrowLeft,
  FiPlay,
  FiPause,
  FiX,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiSave,
  FiTruck,
  FiRepeat,
  FiMapPin,
  FiPhone,
  FiAlertCircle,
  FiRotateCcw,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const SubscriptionDetail = () => {
  const { subscriptionId } = useParams();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch,
  } = useGetSubscriptionByIdQuery(subscriptionId);

  const [updateSubscriptionStatus, { isLoading: isUpdating }] =
    useUpdateSubscriptionStatusMutation();

  const subscription = subscriptionData?.data?.subscription;

  const handleStatusUpdate = async () => {
    try {
      await updateSubscriptionStatus({
        subscriptionId,
        status: newStatus,
      }).unwrap();
      setIsEditingStatus(false);
      refetch();
    } catch (error) {
      console.error("Failed to update subscription status:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiCalendar size={48} className="mx-auto mb-2" />
          <p>Error loading subscription details</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Subscription not found</p>
        <Link
          to="/admin/subscriptions-management"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiArrowLeft className="mr-2" size={16} />
          Back to Subscriptions
        </Link>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
  };

  const statusIcons = {
    active: <FiPlay size={16} />,
    paused: <FiPause size={16} />,
    cancelled: <FiX size={16} />,
    completed: <FiCheckCircle size={16} />,
  };

  const progressPercentage = Math.round(
    ((subscription.deliveredCount || 0) / (subscription.totalDeliveries || 1)) *
      100
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/subscriptions-management"
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={20} className="mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Subscription #{subscription._id?.slice(-8)}
            </h1>
            <p className="text-gray-600">
              {subscription.mealPlan?.title || "Unknown Plan"} -{" "}
              {subscription.user?.name || "Unknown User"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditingStatus ? (
            <>
              <span
                className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                  statusColors[subscription.status] || statusColors.active
                }`}
              >
                {statusIcons[subscription.status] || statusIcons.active}
                <span className="ml-2 capitalize">
                  {subscription.status || "active"}
                </span>
              </span>
              <button
                onClick={() => {
                  setNewStatus(subscription.status);
                  setIsEditingStatus(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiEdit size={16} className="mr-2" />
                Update Status
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiSave size={16} className="mr-2" />
                Save
              </button>
              <button
                onClick={() => setIsEditingStatus(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <FiX size={16} className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Subscription Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPackage size={20} className="mr-2" />
              Subscription Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Meal Plan</p>
                    <p className="font-medium text-lg">
                      {subscription.mealPlan?.name || "Unknown Plan"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {subscription.mealPlan?.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">
                      {subscription.mealPlan?.duration || "N/A"} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">
                      {subscription.mealPlan?.category || "General"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">
                      {moment(subscription.startDate).format("MMM DD, YYYY")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium">
                      {moment(subscription.endDate).format("MMM DD, YYYY")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Delivery</p>
                    <p className="font-medium">
                      {subscription.nextDeliveryDate
                        ? moment(subscription.nextDeliveryDate).format(
                            "MMM DD, YYYY"
                          )
                        : "Not scheduled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Delivery Progress</span>
                <span>
                  {subscription.deliveredCount || 0} /{" "}
                  {subscription.totalDeliveries || 0} delivered (
                  {progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser size={20} className="mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {subscription.user?.name || "Unknown User"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {subscription.user?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">
                  {subscription.user?.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer ID</p>
                <p className="font-medium">
                  {subscription.user?._id ? (
                    <Link
                      to={`/admin/users/${subscription.user._id}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {subscription.user._id}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Schedule */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTruck size={20} className="mr-2" />
              Delivery Schedule
            </h3>
            <div className="space-y-4">
              {subscription.deliverySchedule?.length > 0 ? (
                subscription.deliverySchedule.map((delivery, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Delivery #{index + 1}</p>
                      <p className="text-sm text-gray-600">
                        {moment(delivery.date).format("MMM DD, YYYY")} at{" "}
                        {delivery.time || "TBD"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : delivery.status === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {delivery.status || "pending"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiCalendar
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>No delivery schedule available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiDollarSign size={20} className="mr-2" />
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Price:</span>
                <span className="font-medium">
                  ₹{subscription.mealPlan?.price || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {subscription.mealPlan?.duration || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">
                  ₹{subscription.deliveryFee || 0}
                </span>
              </div>
              {subscription.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-₹{subscription.discount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{subscription.totalAmount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span
                  className={`font-medium ${
                    subscription.paymentStatus === "paid"
                      ? "text-green-600"
                      : subscription.paymentStatus === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {subscription.paymentStatus || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subscription Stats
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FiTruck size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.deliveredCount || 0}
                </p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <FiClock size={24} className="text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {(subscription.totalDeliveries || 0) -
                    (subscription.deliveredCount || 0)}
                </p>
                <p className="text-sm text-gray-600">Remaining</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FiRepeat size={24} className="text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.startDate && subscription.endDate
                    ? Math.ceil(
                        moment(subscription.endDate).diff(moment(), "days")
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Days Left</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {subscription.status === "active" && (
                <button className="block w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                  Pause Subscription
                </button>
              )}
              {subscription.status === "paused" && (
                <button className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                  Resume Subscription
                </button>
              )}
              <button className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                Schedule Delivery
              </button>
              <button className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                Modify Plan
              </button>
              <button className="block w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100">
                Send Notification
              </button>
              {subscription.status !== "cancelled" && (
                <button className="block w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar size={20} className="mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Subscription Created</p>
                  <p className="text-xs text-gray-600">
                    {moment(subscription.createdAt).format(
                      "MMM DD, YYYY hh:mm A"
                    )}
                  </p>
                </div>
              </div>
              {subscription.updatedAt &&
                subscription.updatedAt !== subscription.createdAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm">Status Updated</p>
                      <p className="text-xs text-gray-600">
                        {moment(subscription.updatedAt).format(
                          "MMM DD, YYYY hh:mm A"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              {subscription.lastDeliveryDate && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">Last Delivery</p>
                    <p className="text-xs text-gray-600">
                      {moment(subscription.lastDeliveryDate).format(
                        "MMM DD, YYYY"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Tracking */}
          {subscription.deliveryTracking &&
            subscription.deliveryTracking.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTruck size={20} className="mr-2" />
                  Delivery Tracking
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {subscription.deliveryTracking.length} deliveries
                  </span>
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {[...subscription.deliveryTracking]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((delivery, index) => (
                      <div
                        key={delivery._id}
                        className={`border rounded-lg p-4 ${
                          delivery.status === "delivered"
                            ? "border-green-200 bg-green-50"
                            : delivery.status === "pending"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-full ${
                                delivery.status === "delivered"
                                  ? "bg-green-100 text-green-600"
                                  : delivery.status === "pending"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {delivery.status === "delivered" ? (
                                <FiCheckCircle size={16} />
                              ) : delivery.status === "pending" ? (
                                <FiClock size={16} />
                              ) : (
                                <FiAlertCircle size={16} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {moment(delivery.date).format("MMM DD, YYYY")} -{" "}
                                {delivery.shift}
                              </p>
                              <p
                                className={`text-sm font-medium capitalize ${
                                  delivery.status === "delivered"
                                    ? "text-green-600"
                                    : delivery.status === "pending"
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {delivery.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {delivery.thaliCount} Thali
                              {delivery.thaliCount > 1 ? "s" : ""}
                            </p>
                            {delivery.deliveryNo && (
                              <p className="text-xs text-gray-500">
                                {delivery.deliveryNo}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {delivery.deliveredAt && (
                            <div className="flex items-center space-x-2">
                              <FiCheckCircle
                                size={14}
                                className="text-green-600"
                              />
                              <span className="text-sm text-gray-600">
                                Delivered:{" "}
                                {moment(delivery.deliveredAt).format(
                                  "MMM DD, hh:mm A"
                                )}
                              </span>
                            </div>
                          )}
                          {delivery.ETA?.estimated && (
                            <div className="flex items-center space-x-2">
                              <FiClock size={14} className="text-blue-600" />
                              <span className="text-sm text-gray-600">
                                ETA:{" "}
                                {moment(delivery.ETA.estimated).format(
                                  "hh:mm A"
                                )}
                              </span>
                            </div>
                          )}
                          {delivery.driver && (
                            <div className="flex items-center space-x-2">
                              <FiUser size={14} className="text-purple-600" />
                              <span className="text-sm text-gray-600">
                                Driver ID: {delivery.driver}
                              </span>
                            </div>
                          )}
                          {delivery.deliveredBy && (
                            <div className="flex items-center space-x-2">
                              <FiTruck size={14} className="text-orange-600" />
                              <span className="text-sm text-gray-600">
                                Delivered by: {delivery.deliveredBy}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Delivery Checkpoints */}
                        {delivery.checkpoints &&
                          delivery.checkpoints.length > 0 && (
                            <div className="border-t pt-3">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">
                                Delivery Timeline:
                              </h5>
                              <div className="space-y-2">
                                {delivery.checkpoints.map((checkpoint, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start space-x-3"
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full mt-2 ${
                                        checkpoint.type === "picked_up"
                                          ? "bg-blue-500"
                                          : checkpoint.type ===
                                            "route_sequenced"
                                          ? "bg-purple-500"
                                          : checkpoint.type ===
                                            "out_for_delivery"
                                          ? "bg-yellow-500"
                                          : checkpoint.type === "delivered"
                                          ? "bg-green-500"
                                          : "bg-gray-500"
                                      }`}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 capitalize">
                                        {checkpoint.type.replace("_", " ")}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {moment(checkpoint.timestamp).format(
                                          "MMM DD, hh:mm A"
                                        )}
                                      </p>
                                      {checkpoint.notes && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {checkpoint.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Customizations */}
                        {delivery.customizations &&
                          delivery.customizations.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">
                                Customizations:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {delivery.customizations.map(
                                  (customization, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                    >
                                      {customization}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Notes */}
                        {delivery.notes && (
                          <div className="border-t pt-3 mt-3">
                            <h5 className="text-sm font-medium text-gray-900 mb-1">
                              Notes:
                            </h5>
                            <p className="text-sm text-gray-600">
                              {delivery.notes}
                            </p>
                          </div>
                        )}

                        {/* Sequence Position */}
                        {delivery.sequencePosition && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              <FiRotateCcw size={12} className="mr-1" />
                              Route Position: {delivery.sequencePosition}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Delivery Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {
                          subscription.deliveryTracking.filter(
                            (d) => d.status === "delivered"
                          ).length
                        }
                      </p>
                      <p className="text-sm text-gray-600">Delivered</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-600">
                        {
                          subscription.deliveryTracking.filter(
                            (d) => d.status === "pending"
                          ).length
                        }
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {subscription.deliveryTracking.length}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;
