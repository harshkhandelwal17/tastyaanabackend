import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  Clock,
  User,
  Phone,
  Package,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchActiveDeliveries();
    fetchUnassignedOrders();
    fetchAvailableDrivers();
  }, []);

  const fetchActiveDeliveries = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/delivery/active-deliveries`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to fetch deliveries", { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedOrders = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(
        `${backendUrl}/orders?status=pending&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter orders that don't have a delivery partner assigned
        const unassigned =
          data.orders?.filter((order) => !order.deliveryPartner) || [];
        setUnassignedOrders(unassigned);
      }
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/drivers/available`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(
        `${backendUrl}/delivery-tracking/${orderId}/assign-driver`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ driverId }),
        }
      );

      if (response.ok) {
        toast.success("Driver assigned successfully", { duration: 2000 });
        setShowAssignModal(false);
        setSelectedOrder(null);
        fetchActiveDeliveries();
        fetchUnassignedOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to assign driver", {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast.error("Failed to assign driver", { duration: 2000 });
    }
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const updateOrderStatus = async (orderId, status, description) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(
        `${backendUrl}/delivery-tracking/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status, description }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Status updated to ${status}`, { duration: 2000 });
        console.log("✅ Status update successful:", result);
        fetchActiveDeliveries();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update status", {
          duration: 2000,
        });
        console.error("❌ Status update failed:", errorData);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", { duration: 2000 });
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus, description) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(
        `${backendUrl}/orders/${orderId}/payment-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ paymentStatus, description }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Payment status updated to ${paymentStatus}`, {
          duration: 2000,
        });
        console.log("✅ Payment status update successful:", result);
        fetchActiveDeliveries();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update payment status", {
          duration: 2000,
        });
        console.error("❌ Payment status update failed:", errorData);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status", { duration: 2000 });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      order_placed: "bg-blue-100 text-blue-800",
      preparing: "bg-yellow-100 text-yellow-800",
      ready_for_pickup: "bg-purple-100 text-purple-800",
      assigned: "bg-indigo-100 text-indigo-800",
      picked_up: "bg-orange-100 text-orange-800",
      out_for_delivery: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderId?.totalAmount?.toString().includes(searchTerm) ||
      delivery.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Delivery Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Manage active deliveries and drivers
              </p>
            </div>
            <button
              onClick={fetchActiveDeliveries}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Active
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deliveries.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Out for Delivery
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    deliveries.filter((d) => d.status === "out_for_delivery")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Available Drivers
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {drivers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Unassigned Orders
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {unassignedOrders.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order amount or driver name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="order_placed">Order Placed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="out_for_delivery">Out for Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Unassigned Orders Section */}
        {unassignedOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <h2 className="text-lg font-semibold text-orange-900 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Unassigned Orders - Requires Admin Assignment
              </h2>
              <p className="text-sm text-orange-700 mt-1">
                These orders need a delivery partner assigned by admin
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unassignedOrders.map((order) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            #{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{order.totalAmount}
                          </p>
                          <p className="text-xs text-orange-600 font-medium">
                            {order.items?.length} items
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Customer #{order.userId?.toString().slice(-6)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.userContactNo}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.deliveryAddress?.street}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.deliveryAddress?.city},{" "}
                          {order.deliveryAddress?.state}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.deliveryAddress?.pincode}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openAssignModal(order)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <User className="h-4 w-4 mr-1" />
                          Assign Driver
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Deliveries
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => (
                  <motion.tr
                    key={delivery._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{delivery.orderId?._id?.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{delivery.orderId?.totalAmount}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          delivery.status
                        )}`}
                      >
                        {delivery.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.driverId ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                            {delivery.driverId.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {delivery.driverId.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {delivery.driverId.phone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {delivery.deliveryAddress?.street}
                      </div>
                      <div className="text-sm text-gray-500">
                        {delivery.deliveryAddress?.city},{" "}
                        {delivery.deliveryAddress?.state}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!delivery.driverId && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignDriver(
                                  delivery.orderId._id,
                                  e.target.value
                                );
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign Driver</option>
                            {drivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDeliveries.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No deliveries found</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-lg w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Assign Driver to Order #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    Order Details:
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ₹{selectedOrder.totalAmount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Items: {selectedOrder.items?.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Address: {selectedOrder.deliveryAddress?.street},{" "}
                    {selectedOrder.deliveryAddress?.city}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Available Drivers:
                </h4>

                {drivers.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No available drivers</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {drivers.map((driver) => (
                      <div
                        key={driver._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {driver.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {driver.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {driver.phone}
                            </p>
                            {driver.rating && (
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1">{driver.rating}/5</span>
                              </div>
                            )}
                            {driver.vehicle && (
                              <p className="text-xs text-gray-500">
                                {driver.vehicle.type} • {driver.vehicle.number}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            assignDriver(selectedOrder._id, driver._id)
                          }
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delivery Detail Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Order #{selectedDelivery.orderId?._id?.slice(-8)}
                </h3>
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="space-y-2">
                    {selectedDelivery.timeline?.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>{item.description}</span>
                        <span className="ml-auto text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedDelivery.orderId._id,
                        "preparing",
                        "Order is being prepared"
                      )
                    }
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
                  >
                    Mark Preparing
                  </button>
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedDelivery.orderId._id,
                        "ready_for_pickup",
                        "Order is ready for pickup"
                      )
                    }
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                  >
                    Ready for Pickup
                  </button>
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedDelivery.orderId._id,
                        "out_for_delivery",
                        "Order is out for delivery"
                      )
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Out for Delivery
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
