import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
} from "lucide-react";

const SellerRevenue = () => {
  const [revenueData, setRevenueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    // TODO: Fetch revenue data
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Revenue Analytics
                </h1>
                <p className="text-sm text-gray-500">
                  Track your earnings and financial performance
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border-gray-300 rounded-md text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <DollarSign className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Revenue Analytics Coming Soon
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            This feature will show detailed revenue analytics, earnings reports,
            and financial insights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerRevenue;
