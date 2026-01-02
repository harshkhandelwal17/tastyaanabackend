import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Plus,
  Search,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

const SellerCenters = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // TODO: Fetch centers
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Centers Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your pickup and drop-off centers
                </p>
              </div>
            </div>

            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Center
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MapPin className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Centers Management Coming Soon
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            This feature will allow you to manage pickup and drop-off centers
            for your vehicle rental service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerCenters;
