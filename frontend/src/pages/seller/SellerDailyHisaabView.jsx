import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Eye,
  Calendar,
  Search,
  Download,
  Filter,
  IndianRupee,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const SellerDailyHisaabView = () => {
  const [hisaabEntries, setHisaabEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // TODO: Fetch hisaab entries
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Eye className="w-8 h-8 text-amber-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Daily Hisaab View
                </h1>
                <p className="text-sm text-gray-500">
                  View your daily collection and expense records
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Eye className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Daily Hisaab View Coming Soon
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            This feature will show all your daily hisaab entries with filtering
            and analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerDailyHisaabView;
