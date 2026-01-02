import React, { useState, useEffect } from "react";
import { getEnhancedUsageStatistics } from "../../api/couponApi";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const EnhancedCouponStats = ({ couponId, refreshTrigger = 0 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getEnhancedUsageStatistics(couponId);
      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Error fetching enhanced stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (couponId) {
      fetchStats();
    }
  }, [couponId, refreshTrigger]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading statistics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="flex items-center p-6 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const { coupon, statistics } = stats;
  const { totalUsage, remainingTotalUsage, usagePercentage, userStats } =
    statistics;

  const getStatusBadge = (current, limit, label) => {
    if (limit === null) {
      return <Badge variant="secondary">Unlimited {label}</Badge>;
    }

    const percentage = (current / limit) * 100;
    if (percentage >= 100) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    } else if (percentage >= 80) {
      return <Badge variant="warning">Nearly Full</Badge>;
    } else {
      return <Badge variant="success">Available</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Coupon Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Coupon: {coupon.code}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant={coupon.isActive ? "success" : "secondary"}>
              {coupon.isActive ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-gray-500">
              Valid: {new Date(coupon.startDate).toLocaleDateString()} -{" "}
              {new Date(coupon.endDate).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{totalUsage}</span>
                {getStatusBadge(totalUsage, coupon.totalUsageLimit, "uses")}
              </div>

              {coupon.totalUsageLimit && (
                <>
                  <Progress value={usagePercentage} className="w-full h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{totalUsage} used</span>
                    <span>{remainingTotalUsage} remaining</span>
                  </div>
                </>
              )}

              {!coupon.totalUsageLimit && (
                <p className="text-xs text-gray-500">No total limit set</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Personal Stats */}
        {userStats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Your Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {userStats.totalUsage}
                  </span>
                  {getStatusBadge(
                    userStats.totalUsage,
                    coupon.maxUsagePerUser,
                    "personal uses"
                  )}
                </div>

                <Progress
                  value={(userStats.totalUsage / coupon.maxUsagePerUser) * 100}
                  className="w-full h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{userStats.totalUsage} used</span>
                  <span>{userStats.remainingUsage} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Usage */}
        {userStats && coupon.maxUsagePerUserPerDay && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {userStats.todayUsage}
                  </span>
                  {getStatusBadge(
                    userStats.todayUsage,
                    coupon.maxUsagePerUserPerDay,
                    "daily uses"
                  )}
                </div>

                <Progress
                  value={
                    (userStats.todayUsage / coupon.maxUsagePerUserPerDay) * 100
                  }
                  className="w-full h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{userStats.todayUsage} used today</span>
                  <span>{userStats.remainingTodayUsage} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Limits Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Usage Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Per User:</span>
              <span className="ml-2">
                {coupon.maxUsagePerUser === null
                  ? "Unlimited"
                  : `${coupon.maxUsagePerUser} uses`}
              </span>
            </div>
            <div>
              <span className="font-medium">Per Day:</span>
              <span className="ml-2">
                {coupon.maxUsagePerUserPerDay === null
                  ? "Unlimited"
                  : `${coupon.maxUsagePerUserPerDay} uses`}
              </span>
            </div>
            <div>
              <span className="font-medium">Total Limit:</span>
              <span className="ml-2">
                {coupon.totalUsageLimit === null
                  ? "Unlimited"
                  : `${coupon.totalUsageLimit} uses`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quick Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                {userStats && userStats.remainingUsage > 0
                  ? `You can use this coupon ${userStats.remainingUsage} more times`
                  : "Check usage limits above"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>
                {userStats &&
                userStats.remainingTodayUsage !== null &&
                userStats.remainingTodayUsage > 0
                  ? `${userStats.remainingTodayUsage} more uses today`
                  : userStats && userStats.remainingTodayUsage === 0
                  ? "Daily limit reached"
                  : "No daily limits"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCouponStats;
