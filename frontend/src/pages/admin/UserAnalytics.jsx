import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
} from "lucide-react";

const UserAnalytics = () => {
  const [timeframe, setTimeframe] = useState("month");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  useEffect(() => {
    const mockData = {
      overview: {
        totalUsers: 12453,
        newUsers: 234,
        activeUsers: 8765,
        churnRate: 3.2,
        growthRate: 12.5,
      },
      registrations: [
        { date: "2024-12-01", count: 45 },
        { date: "2024-12-02", count: 52 },
        { date: "2024-12-03", count: 38 },
        { date: "2024-12-04", count: 61 },
        { date: "2024-12-05", count: 47 },
        { date: "2024-12-06", count: 55 },
        { date: "2024-12-07", count: 43 },
        { date: "2024-12-08", count: 67 },
        { date: "2024-12-09", count: 52 },
        { date: "2024-12-10", count: 49 },
        { date: "2024-12-11", count: 58 },
      ],
      demographics: {
        ageGroups: [
          { group: "18-25", count: 2456, percentage: 19.7 },
          { group: "26-35", count: 4321, percentage: 34.7 },
          { group: "36-45", count: 3287, percentage: 26.4 },
          { group: "46-55", count: 1652, percentage: 13.3 },
          { group: "55+", count: 737, percentage: 5.9 },
        ],
        locations: [
          { city: "Mumbai", count: 3654, percentage: 29.3 },
          { city: "Delhi", count: 2987, percentage: 24.0 },
          { city: "Bangalore", count: 2234, percentage: 17.9 },
          { city: "Chennai", count: 1456, percentage: 11.7 },
          { city: "Pune", count: 1234, percentage: 9.9 },
          { city: "Others", count: 888, percentage: 7.1 },
        ],
      },
      engagement: {
        dailyActive: 3456,
        weeklyActive: 7890,
        monthlyActive: 8765,
        avgSessionDuration: "12m 34s",
        avgOrdersPerUser: 4.2,
        retentionRates: [
          { period: "Day 1", rate: 85.2 },
          { period: "Day 7", rate: 67.8 },
          { period: "Day 30", rate: 45.3 },
          { period: "Day 90", rate: 32.1 },
        ],
      },
    };

    setTimeout(() => {
      setAnalytics(mockData);
      setLoading(false);
    }, 1000);
  }, [timeframe]);

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span
                className={`ml-2 text-sm ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            User Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive user behavior and demographics insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={analytics.overview.totalUsers.toLocaleString()}
          change={analytics.overview.growthRate}
          color="bg-blue-600"
        />
        <StatCard
          icon={UserPlus}
          title="New Users"
          value={analytics.overview.newUsers.toLocaleString()}
          change={15.3}
          color="bg-green-600"
        />
        <StatCard
          icon={Activity}
          title="Active Users"
          value={analytics.overview.activeUsers.toLocaleString()}
          change={8.7}
          color="bg-purple-600"
        />
        <StatCard
          icon={UserMinus}
          title="Churn Rate"
          value={`${analytics.overview.churnRate}%`}
          change={-2.1}
          color="bg-red-600"
        />
      </div>

      {/* Registration Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">User Registration Trend</h2>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 flex items-end space-x-2">
          {analytics.registrations.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t"
                style={{
                  height: `${
                    (day.count /
                      Math.max(
                        ...analytics.registrations.map((d) => d.count)
                      )) *
                    200
                  }px`,
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2">
                {new Date(day.date).getDate()}
              </div>
              <div className="text-xs text-gray-500">{day.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Demographics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Age Demographics</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.demographics.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{group.group}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {group.percentage}%
                  </span>
                  <span className="text-sm font-medium w-16 text-right">
                    {group.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Locations</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.demographics.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{location.city}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {location.percentage}%
                  </span>
                  <span className="text-sm font-medium w-16 text-right">
                    {location.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily/Weekly/Monthly Active Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Active User Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Active</span>
              <span className="font-semibold">
                {analytics.engagement.dailyActive.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Active</span>
              <span className="font-semibold">
                {analytics.engagement.weeklyActive.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Active</span>
              <span className="font-semibold">
                {analytics.engagement.monthlyActive.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Session Duration</span>
              <span className="font-semibold">
                {analytics.engagement.avgSessionDuration}
              </span>
            </div>
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Retention</h2>
          <div className="space-y-3">
            {analytics.engagement.retentionRates.map((retention, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{retention.period}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${retention.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {retention.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Engagement Summary</h2>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.engagement.avgOrdersPerUser}
              </div>
              <div className="text-sm text-blue-800">Avg Orders per User</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.overview.growthRate}%
              </div>
              <div className="text-sm text-green-800">Monthly Growth Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
