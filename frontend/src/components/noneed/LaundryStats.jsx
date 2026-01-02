import React from "react";
import {
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
} from "lucide-react";

const LaundryStats = ({ stats = {}, loading = false, className = "" }) => {
  const defaultStats = {
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    serviceBreakdown: {},
    ...stats,
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType = "positive",
    color = "blue",
    loading = false,
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
      red: "bg-red-50 text-red-600 border-red-200",
    };

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div
              className={`text-sm font-medium ${
                changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              {changeType === "positive" ? "+" : ""}
              {change}%
            </div>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {loading ? (
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              value
            )}
          </h3>
          <p className="text-gray-600 text-sm">{title}</p>
        </div>
      </div>
    );
  };

  const StatusBreakdown = ({ statusData }) => {
    const statusConfig = {
      confirmed: { color: "bg-blue-500", label: "Confirmed" },
      "picked-up": { color: "bg-yellow-500", label: "Picked Up" },
      washing: { color: "bg-purple-500", label: "In Process" },
      ready: { color: "bg-green-500", label: "Ready" },
      "out-for-delivery": { color: "bg-orange-500", label: "Out for Delivery" },
      delivered: { color: "bg-emerald-500", label: "Delivered" },
      cancelled: { color: "bg-red-500", label: "Cancelled" },
    };

    const total = Object.values(statusData).reduce(
      (sum, count) => sum + count,
      0
    );

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Order Status Breakdown
        </h3>

        {total === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No orders to display
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusData).map(([status, count]) => {
              const config = statusConfig[status] || {
                color: "bg-gray-500",
                label: status,
              };
              const percentage = ((count / total) * 100).toFixed(1);

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${config.color}`}
                    ></div>
                    <span className="text-gray-700">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{percentage}%</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const ServiceBreakdown = ({ serviceData }) => {
    const serviceConfig = {
      "wash-fold": { color: "bg-blue-500", label: "Wash & Fold" },
      "dry-clean": { color: "bg-purple-500", label: "Dry Cleaning" },
      "iron-only": { color: "bg-orange-500", label: "Iron Only" },
      express: { color: "bg-red-500", label: "Express Service" },
    };

    const total = Object.values(serviceData).reduce(
      (sum, count) => sum + count,
      0
    );

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Service Breakdown
        </h3>

        {total === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No services to display
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(serviceData).map(([service, count]) => {
              const config = serviceConfig[service] || {
                color: "bg-gray-500",
                label: service,
              };
              const percentage = ((count / total) * 100).toFixed(1);

              return (
                <div
                  key={service}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${config.color}`}
                    ></div>
                    <span className="text-gray-700">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{percentage}%</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={defaultStats.totalOrders.toLocaleString()}
          icon={Package}
          color="blue"
          change={12.5}
        />

        <StatCard
          title="Total Revenue"
          value={`₹${defaultStats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          change={8.3}
        />

        <StatCard
          title="Active Subscriptions"
          value={defaultStats.activeSubscriptions.toLocaleString()}
          icon={Users}
          color="purple"
          change={15.7}
        />

        <StatCard
          title="Avg. Order Value"
          value={`₹${defaultStats.averageOrderValue}`}
          icon={TrendingUp}
          color="orange"
          change={-2.1}
          changeType="negative"
        />
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusBreakdown statusData={defaultStats.statusBreakdown} />
        <ServiceBreakdown serviceData={defaultStats.serviceBreakdown} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Completion Rate
            </h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">98.2%</div>
          <p className="text-gray-600 text-sm">Orders delivered successfully</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Avg. Processing Time
            </h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">18h</div>
          <p className="text-gray-600 text-sm">From pickup to delivery</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              On-Time Delivery
            </h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">94.8%</div>
          <p className="text-gray-600 text-sm">
            Delivered within promised time
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaundryStats;
