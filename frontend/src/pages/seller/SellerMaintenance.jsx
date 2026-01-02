import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";

const SellerMaintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // TODO: Fetch maintenance records
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Wrench className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Maintenance History
                </h1>
                <p className="text-sm text-gray-500">
                  Track vehicle maintenance and repairs
                </p>
              </div>
            </div>

            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Maintenance
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Wrench className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Maintenance History Coming Soon
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            This feature will help you track all vehicle maintenance, repairs,
            and service history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerMaintenance;
