import React from "react";
import { useVehicleRentalAccess } from "../hooks/useUserAccess";
import { useSelector } from "react-redux";

const DebugVehicleAccess = () => {
  const { isVehicleRentalSeller, loading, error } = useVehicleRentalAccess();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Vehicle Rental Access Debug</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Hook Results</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Is Vehicle Rental Seller
              </label>
              <div
                className={`px-3 py-2 rounded ${
                  isVehicleRentalSeller
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isVehicleRentalSeller ? "YES" : "NO"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loading
              </label>
              <div
                className={`px-3 py-2 rounded ${
                  loading
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {loading ? "YES" : "NO"}
              </div>
            </div>
          </div>

          {error && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Error
              </label>
              <div className="px-3 py-2 rounded bg-red-100 text-red-800">
                {error}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Redux State</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Is Authenticated
            </label>
            <div
              className={`px-3 py-2 rounded ${
                isAuthenticated
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isAuthenticated ? "YES" : "NO"}
            </div>
          </div>

          {user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Name
                </label>
                <div className="px-3 py-2 rounded bg-gray-100 text-gray-800">
                  {user.name || "No name"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Role
                </label>
                <div className="px-3 py-2 rounded bg-gray-100 text-gray-800">
                  {user.role || "No role"}
                </div>
              </div>

              {user.sellerProfile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Seller Type
                    </label>
                    <div className="px-3 py-2 rounded bg-gray-100 text-gray-800">
                      {user.sellerProfile.sellerType || "No seller type"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Rental Service Enabled
                    </label>
                    <div
                      className={`px-3 py-2 rounded ${
                        user.sellerProfile.vehicleRentalService?.isEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.sellerProfile.vehicleRentalService?.isEnabled
                        ? "YES"
                        : "NO"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Seller Profile
                    </label>
                    <pre className="px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm overflow-auto max-h-96">
                      {JSON.stringify(user.sellerProfile, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full User Object
                </label>
                <pre className="px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm overflow-auto max-h-96">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </>
          )}

          {!user && (
            <div className="px-3 py-2 rounded bg-yellow-100 text-yellow-800">
              No user data in Redux state
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
          <div className="space-y-2">
            <a
              href="/seller"
              className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Seller Dashboard
            </a>
            <a
              href="/seller/vehicles"
              className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Vehicle Routes (Protected)
            </a>
            <a
              href="/seller/vehicles/dashboard"
              className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Vehicle Dashboard (Protected)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugVehicleAccess;
