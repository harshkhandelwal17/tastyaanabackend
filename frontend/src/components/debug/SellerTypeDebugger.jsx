import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useVehicleRentalAccess, useUserInfo } from "../../hooks/useUserAccess";

const SellerTypeDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const {
    user: reduxUser,
    token,
    isAuthenticated,
  } = useSelector((state) => state.auth);
  const { isVehicleRentalSeller, loading, error } = useVehicleRentalAccess();
  const { userInfo } = useUserInfo();

  useEffect(() => {
    // Get localStorage data
    const localStorageUser = JSON.parse(localStorage.getItem("user") || "{}");

    setDebugInfo({
      isAuthenticated,
      token: token ? "Present" : "Missing",
      localStorageUser,
      reduxUser,
      userInfo,
      vehicleRentalCheck: {
        isVehicleRentalSeller,
        loading,
        error,
      },
    });
  }, [
    isAuthenticated,
    token,
    reduxUser,
    userInfo,
    isVehicleRentalSeller,
    loading,
    error,
  ]);

  const testAPICall = async () => {
    if (!token) {
      alert("No token available");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/user/profile/minimal`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("API Response:", data);
      alert(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error("API Error:", err);
      alert(`API Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Seller Type Debugger</h1>

      {/* Vehicle Rental Status */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Vehicle Rental Seller Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-3 rounded ${
              isVehicleRentalSeller ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <p className="font-medium">Is Vehicle Rental Seller:</p>
            <p className="text-xl">
              {isVehicleRentalSeller ? "YES ✅" : "NO ❌"}
            </p>
          </div>
          <div
            className={`p-3 rounded ${
              loading ? "bg-yellow-100" : "bg-gray-100"
            }`}
          >
            <p className="font-medium">Loading:</p>
            <p className="text-xl">{loading ? "YES" : "NO"}</p>
          </div>
          <div
            className={`p-3 rounded ${error ? "bg-red-100" : "bg-green-100"}`}
          >
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error || "None"}</p>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={testAPICall}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test API Call
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh Page
        </button>
      </div>

      {/* Navigation Test */}
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-semibold mb-3">Navigation Test</h2>
        <div className="flex gap-4">
          <a
            href="/seller/vehicles"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Vehicle Seller Panel
          </a>
          <a
            href="/seller"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Regular Seller Panel
          </a>
        </div>
      </div>
    </div>
  );
};

export default SellerTypeDebugger;
