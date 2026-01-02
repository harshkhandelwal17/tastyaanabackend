import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Package,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Edit,
  Save,
  X as CloseIcon,
} from "lucide-react";
import {
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} from "../../redux/storee/api";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const {
    data: orderData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const order = orderData?.data;

  const statusOptions = [
    {
      value: "pending",
      label: "⏳ Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "confirmed",
      label: "✅ Confirmed",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "preparing",
      label: "👨‍🍳 Preparing",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "ready",
      label: "🎯 Ready",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "out-for-delivery",
      label: "🚚 Out for Delivery",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "delivered",
      label: "📦 Delivered",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "❌ Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  const getStatusConfig = (status) => {
    return (
      statusOptions.find((option) => option.value === status) ||
      statusOptions[0]
    );
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !order?._id) return;

    try {
      setIsUpdatingStatus(true);
      await updateOrderStatus({
        orderId: order._id,
        status: selectedStatus,
      }).unwrap();

      toast.success(`Status updated to ${selectedStatus}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: true,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
        },
      });
      setShowStatusModal(false);
      refetch();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error(error.data?.message || "Failed to update status", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
        },
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePrintInvoice = () => {
    const apiUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.REACT_APP_API_URL ||
      "http://localhost:5000";
    const invoiceUrl = `${apiUrl}/seller/orders/${order._id}/invoice`;

    console.log("Opening invoice URL:", invoiceUrl);
    console.log("API URL:", apiUrl);
    console.log("Order ID:", order._id);

    if (!order._id) {
      toast.error("Order ID not found", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }

    window.open(invoiceUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Order Not Found
          </h2>
          <p className="text-slate-600 mb-4">
            {error?.data?.message ||
              "The order you are looking for does not exist."}
          </p>
          <button
            onClick={() => navigate("/seller/orders")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/seller/orders")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-sm text-slate-600">Order Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrintInvoice}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <FileText className="h-4 w-4 mr-1" />
                Invoice
              </button>
              <button
                onClick={() => {
                  setSelectedStatus(order.status);
                  setShowStatusModal(true);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-1" />
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Order Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Status
            </h2>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                getStatusConfig(order.status).color
              }`}
            >
              {getStatusConfig(order.status).label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Order Date:</p>
              <p className="font-medium">
                {format(parseISO(order.createdAt), "dd MMM yyyy, hh:mm aa")}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Payment Status:</p>
              <p
                className={`font-medium ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {order.paymentStatus || "pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-600">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-slate-600">Price: ₹{item.price}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 text-lg font-bold text-slate-900">
              <span>Total Amount:</span>
              <span>₹{order.totalAmount?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Payment Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">Payment Method</p>
                <p className="text-sm text-slate-600">
                  {order.paymentMethod || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Update Order Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <CloseIcon className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Select new status for order #{order.orderNumber}
              </p>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedStatus === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${option.color
                        .replace("bg-", "text-")
                        .replace("-100", "-800")}`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || selectedStatus === order.status}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
