import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  Clock,
  DollarSign,
  Package,
  ChefHat,
  Phone,
  User,
  Calendar,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

const PenaltySection = () => {
  const navigate = useNavigate();
  const [penaltyData, setPenaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPenaltyData();
  }, [currentPage]);

  const fetchPenaltyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/seller/tiffin/penalties", {
        params: {
          page: currentPage,
          limit: 20,
        },
      });
      setPenaltyData(response.data.data);
    } catch (error) {
      console.error("Error fetching penalty data:", error);
      toast.error("Failed to load penalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPenaltyData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredPenalties =
    penaltyData?.penalties?.filter((penalty) => {
      const matchesFilter = filter === "all" || penalty.type === filter;
      const matchesSearch =
        !searchTerm ||
        penalty.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        penalty.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    }) || [];

  const getPenaltyTypeColor = (type) => {
    return type === "tiffin_order"
      ? "bg-orange-100 text-orange-800 border-orange-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getPenaltyTypeIcon = (type) => {
    return type === "tiffin_order" ? (
      <ChefHat className="w-4 h-4" />
    ) : (
      <Package className="w-4 h-4" />
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      preparing: "bg-orange-100 text-orange-800",
      ready_for_pickup: "bg-green-100 text-green-800",
      assigned: "bg-purple-100 text-purple-800",
      picked_up: "bg-indigo-100 text-indigo-800",
      delivered: "bg-emerald-100 text-emerald-800",
      not_prepared: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const PenaltyCard = ({ penalty }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPenaltyTypeColor(
              penalty.type
            )}`}
          >
            {getPenaltyTypeIcon(penalty.type)}
            <span className="ml-1">
              {penalty.type === "tiffin_order"
                ? "Tiffin Order"
                : "Normal Order"}
            </span>
          </span>
          {penalty.shift && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {penalty.shift} shift
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-red-600">
            ₹{penalty.penaltyAmount}
          </div>
          <div className="text-xs text-gray-500">penalty</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            Order ID: {penalty.orderId}
          </div>
          {penalty.planType && (
            <div className="text-sm text-gray-600 mb-1">
              Plan: {penalty.planType}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-1" />
            {penalty.customerName}
          </div>
          {penalty.customerPhone && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-4 h-4 mr-1" />
              {penalty.customerPhone}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Clock className="w-4 h-4 mr-1" />
            Delayed{" "}
            {formatDistanceToNow(new Date(penalty.delayedAt), {
              addSuffix: true,
            })}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              penalty.status
            )}`}
          >
            {penalty.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="text-sm text-gray-600">
          <strong>Reason:</strong> {penalty.delayReason}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {format(new Date(penalty.delayedAt), "PPpp")}
        </div>
      </div>
    </div>
  );

  if (loading && !penaltyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
          <p className="text-gray-600">Loading penalty data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => navigate('/seller/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button> */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Penalty & Flag Section
                </h1>
                <p className="text-sm text-gray-600">
                  Delayed orders and penalty tracking
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-red-600">
                {filteredPenalties.length}
              </h3>
              <p className="text-sm text-gray-600">Delayed Orders</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">100% Penalty</div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-red-600">
                ₹{penaltyData?.totalPenaltyAmount?.toLocaleString("en-IN") || 0}
              </h3>
              <p className="text-sm text-gray-600">Total Penalty Amount</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <Link
                to="/seller/dashboard"
                className="text-orange-600 hover:text-orange-800"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-orange-900">
                Prevention
              </h3>
              <p className="text-sm text-gray-600">Monitor preparation times</p>
              <p className="text-xs text-orange-600 mt-1">25 min limit</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Orders</option>
                <option value="tiffin_order">Tiffin Orders</option>
                <option value="normal_order">Normal Orders</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Penalty List */}
        <div className="space-y-4">
          {filteredPenalties.map((penalty) => (
            <PenaltyCard key={penalty.id} penalty={penalty} />
          ))}
        </div>

        {filteredPenalties.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No penalties found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {penaltyData?.penalties?.length === 0
                ? "Great job! You have no delayed orders."
                : "Try adjusting your filters to see more penalties."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {penaltyData?.pagination?.hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Load More
            </button>
          </div>
        )}

        {/* Prevention Tips */}
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">
              Prevention Tips
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-800">
            <div>
              <h4 className="font-medium mb-2">For Tiffin Orders:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Start preparation 2 hours before delivery time</li>
                <li>Mark status as "preparing" when you start</li>
                <li>Mark "ready for pickup" within preparation time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Normal Orders:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Confirm orders immediately when received</li>
                <li>Complete preparation within 25 minutes</li>
                <li>Update status regularly to avoid delays</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenaltySection;
