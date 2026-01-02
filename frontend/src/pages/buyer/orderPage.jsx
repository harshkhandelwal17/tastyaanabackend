import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package } from "lucide-react";
import { fetchOrders } from "../../redux/orderSlice";
import { mockProducts } from "../../mockData/mockProducts";


const OrdersPage = () => {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.items || []);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing":
        return "text-yellow-600 bg-yellow-100";
      case "Confirmed":
        return "text-blue-600 bg-blue-100";
      case "Shipped":
        return "text-purple-600 bg-purple-100";
      case "Delivered":
        return "text-green-600 bg-green-100";
      case "Cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Start shopping to see your orders here!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id}>
                <h2>Order #{order.orderNumber}</h2>
                <p>Status: {order.status}</p>
                <p>
                  Payment: {order.paymentMethod} - {order.paymentStatus}
                </p>
                <p>Total: ₹{order.total}</p>
                <div>
                  {order.items.map((item, index) => (
                    <div key={index}>
                      {item.name} ({item.weight}) × {item.quantity}
                    </div>
                  ))}
                </div>
                <div>
                  Address: {order.shippingAddress.street},{" "}
                  {order.shippingAddress.city}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default OrdersPage;
