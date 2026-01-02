// Test component to verify Redux integration for Laundry services
import React from "react";
import { useLaundry } from "../../hooks/useLaundry";

const LaundryTest = () => {
  const { services, plans, orders, subscriptions, booking } = useLaundry();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Laundry Redux Integration Test
      </h1>

      {/* Services Test */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Services</h2>
        <div className="mb-4">
          <strong>Loading: </strong>
          {services.loading ? "Yes" : "No"}
        </div>
        <div className="mb-4">
          <strong>Error: </strong>
          {services.error ? JSON.stringify(services.error) : "None"}
        </div>
        <div>
          <strong>Services Count: </strong>
          {services.services.length}
        </div>
        {services.services.length > 0 && (
          <div className="mt-4">
            <strong>Sample Service:</strong>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
              {JSON.stringify(services.services[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Plans Test */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Plans</h2>
        <div className="mb-4">
          <strong>Loading: </strong>
          {plans.loading ? "Yes" : "No"}
        </div>
        <div className="mb-4">
          <strong>Error: </strong>
          {plans.error ? JSON.stringify(plans.error) : "None"}
        </div>
        <div>
          <strong>Plans Count: </strong>
          {plans.plans.length}
        </div>
      </div>

      {/* Orders Test */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        <div className="mb-4">
          <strong>Loading: </strong>
          {orders.loading ? "Yes" : "No"}
        </div>
        <div className="mb-4">
          <strong>Creating: </strong>
          {orders.creating ? "Yes" : "No"}
        </div>
        <div className="mb-4">
          <strong>Orders Count: </strong>
          {orders.orders.length}
        </div>
        <div>
          <strong>Total Orders: </strong>
          {orders.totalOrders}
        </div>
        <button
          onClick={async () => {
            const orderData = {
              service: "wash-fold",
              items: { Shirts: 2, Trousers: 1 },
              schedule: {
                pickupDate: "2025-09-30",
                pickupTime: "10:00 AM - 12:00 PM",
                deliveryDate: "2025-10-01",
                deliveryTime: "03:00 PM - 05:00 PM",
              },
              address: {
                street: "123 Test Street",
                city: "Indore",
                pincode: "452001",
                landmark: "Near Test Mall",
              },
              payment: {
                method: "online",
              },
              specialInstructions: "Handle with care",
              total: 90,
            };
            console.log("Sending order data:", orderData);
            const result = await orders.createOrder(orderData);
            console.log("Order creation result:", result);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={orders.creating}
        >
          {orders.creating
            ? "Creating..."
            : "Test Create Order (Complete Data)"}
        </button>
        <button
          onClick={async () => {
            const orderData = {
              service: "wash-fold",
              items: { Shirts: 2, Trousers: 1 },
              schedule: {
                pickupDate: "2025-09-30",
                pickupTime: "10:00 AM - 12:00 PM",
                deliveryDate: "2025-10-01",
                deliveryTime: "03:00 PM - 05:00 PM",
              },
              address: {
                street: "123 Test Street",
                city: "Indore",
                pincode: "452001",
                landmark: "Near Test Mall",
              },
              payment: {
                method: "online",
              },
              specialInstructions: "Handle with care",
              total: 90,
            };
            console.log("Sending order data:", orderData);
            const result = await orders.createOrder(orderData);
            console.log("Order creation result:", result);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={orders.creating}
        >
          {orders.creating
            ? "Creating..."
            : "Test Create Order (Complete Data)"}
        </button>
      </div>

      {/* Booking State Test */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Booking State</h2>
        <div className="mb-4">
          <strong>Current Step: </strong>
          {booking.currentStep}
        </div>
        <div className="mb-4">
          <strong>Selected Service: </strong>
          {booking.selectedService || "None"}
        </div>
        <div className="mb-4">
          <strong>Items Count: </strong>
          {Object.keys(booking.bookingItems).length}
        </div>
        <div className="mb-4">
          <strong>Total: </strong>₹{booking.bookingTotal}
        </div>
        <div className="mb-4">
          <strong>Loading: </strong>
          {booking.ui.loading ? "Yes" : "No"}
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => booking.setService("wash-fold")}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set Service: Wash & Fold
          </button>
          <button
            onClick={() => booking.updateItem("Shirts", 3)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Add 3 Shirts
          </button>
          <button
            onClick={() => booking.setStep(2)}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Go to Step 2
          </button>
          <button
            onClick={() => booking.resetBooking()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset Booking
          </button>
        </div>
      </div>

      {/* Subscriptions Test */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
        <div className="mb-4">
          <strong>Loading: </strong>
          {subscriptions.loading ? "Yes" : "No"}
        </div>
        <div className="mb-4">
          <strong>Creating: </strong>
          {subscriptions.creating ? "Yes" : "No"}
        </div>
        <div>
          <strong>Subscriptions Count: </strong>
          {subscriptions.subscriptions.length}
        </div>
        <button
          onClick={async () => {
            const result = await subscriptions.createSubscription({
              planId: "premium",
              billingCycle: "monthly",
            });
            console.log("Subscription creation result:", result);
          }}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          disabled={subscriptions.creating}
        >
          {subscriptions.creating ? "Creating..." : "Test Create Subscription"}
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">
          Testing Instructions:
        </h3>
        <ul className="text-yellow-700 space-y-1">
          <li>• Check browser console for API call logs</li>
          <li>• Test buttons should trigger Redux state changes</li>
          <li>• Loading states should be visible during API calls</li>
          <li>• Errors should be displayed if backend is not connected</li>
        </ul>
      </div>
    </div>
  );
};

export default LaundryTest;
