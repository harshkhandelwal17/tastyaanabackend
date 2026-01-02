import React from "react";
import { useGetDashboardQuery } from "../../redux/api/adminPanelApi";

const ApiTester = () => {
  const { data, isLoading, error } = useGetDashboardQuery();

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-bold mb-2">API Test Results</h3>

      <div className="space-y-2">
        <div>
          <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
        </div>

        <div>
          <strong>Error:</strong>{" "}
          {error ? JSON.stringify(error, null, 2) : "None"}
        </div>

        <div>
          <strong>Data:</strong>
          <pre className="bg-white p-2 rounded border mt-1 text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;
