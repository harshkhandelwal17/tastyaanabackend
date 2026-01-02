import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiPackage,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiArrowLeft,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEdit,
  FiSave,
  FiX,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const OrderDetail = () => {
  const { orderId } = useParams();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const {
    data: orderData,
    isLoading,
    error,
    refetch,
  } = useGetOrderByIdQuery(orderId);

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();

  const order = orderData?.data?.order;

  const handleStatusUpdate = async () => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      setIsEditingStatus(false);
      refetch();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiPackage size={48} className="mx-auto mb-2" />
          <p>Error loading order details</p>
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

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Order not found</p>
        <Link
          to="/admin/orders-management"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiArrowLeft className="mr-2" size={16} />
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    pending: <FiClock size={16} />,
    confirmed: <FiCheckCircle size={16} />,
    preparing: <FiPackage size={16} />,
    delivered: <FiTruck size={16} />,
    cancelled: <FiXCircle size={16} />,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/orders-management"
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={20} className="mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order #{order.orderNumber || order._id?.slice(-8)}
            </h1>
            <p className="text-gray-600">
              Placed on {moment(order.createdAt).format("MMM DD, YYYY hh:mm A")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditingStatus ? (
            <>
              <span
                className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                  statusColors[order.status] || statusColors.pending
                }`}
              >
                {statusIcons[order.status] || statusIcons.pending}
                <span className="ml-2 capitalize">
                  {order.status || "pending"}
                </span>
              </span>
              <button
                onClick={() => {
                  setNewStatus(order.status);
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
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
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
        {/* Main Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUser size={20} className="mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {order.userId?.name || order.customerName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {order.userId?.email || order.customerEmail || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">
                  {order.userId?.phone || order.customerPhone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer ID</p>
                <p className="font-medium">
                  {order.userId?._id ? (
                    <Link
                      to={`/admin/users/${order.userId._id}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {order.userId._id}
                    </Link>
                  ) : (
                    "Guest User"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiMapPin size={20} className="mr-2" />
              Delivery Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-medium">
                  {order.deliveryAddress.street ||
                    order.address ||
                    "Address not provided"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Delivery Date</p>
                  <p className="font-medium">
                    {order.deliveryDate
                      ? moment(order.deliveryDate).format("MMM DD, YYYY")
                      : "Not scheduled"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Time</p>
                  <p className="font-medium">
                    {order.deliveryTime || "Not specified"}
                  </p>
                </div>
              </div>
              {order.deliveryNotes && (
                <div>
                  <p className="text-sm text-gray-600">Delivery Notes</p>
                  <p className="font-medium">{order.deliveryNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPackage size={20} className="mr-2" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items?.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.productName || item.name || "Product"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity || 1} | Price: ₹
                        {item.price || 0}
                      </p>
                      {item.customizations && (
                        <p className="text-xs text-gray-500 mt-1">
                          Customizations: {JSON.stringify(item.customizations)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{(item.quantity || 1) * (item.price || 0)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No items found</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiDollarSign size={20} className="mr-2" />
              Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{order.subtotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">
                  ₹{order.taxes?.deliveryCharges || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Handling Fee:</span>
                <span className="font-medium">
                  ₹{order.taxes?.handlingCharges || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Packaging Fee:</span>
                <span className="font-medium">
                  ₹{order.taxes?.packingCharges || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">₹{order.tax || 0}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-₹{order.discount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>₹{order.totalAmount || 0}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span
                  className={`font-medium ${
                    order.paymentStatus === "paid"
                      ? "text-green-600"
                      : order.paymentStatus === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.paymentStatus || "Pending"}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium text-xs">
                    {order.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar size={20} className="mr-2" />
              Order Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {moment(order.createdAt).format("MMM DD, YYYY hh:mm A")}
                  </p>
                </div>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Status Updated</p>
                    <p className="text-sm text-gray-600">
                      {moment(order.updatedAt).format("MMM DD, YYYY hh:mm A")}
                    </p>
                  </div>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Delivered</p>
                    <p className="text-sm text-gray-600">
                      {moment(order.deliveredAt).format("MMM DD, YYYY hh:mm A")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                Send Update to Customer
              </button>
              <button className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                Mark as Delivered
              </button>
              <button className="block w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                Request Refund
              </button>
              <button className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
