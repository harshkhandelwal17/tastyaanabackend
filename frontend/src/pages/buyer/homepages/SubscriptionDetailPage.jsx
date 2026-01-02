// src/pages/subscription/SubscriptionDetailPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Utensils,
  Calendar,
  Clock,
  MapPin,
  Truck,
  AlertCircle,
} from "lucide-react";
import SubscriptionCalendar from "../../../components/subscription/SubscriptionCalendar";
import DriverRouteTracking from "../../../components/delivery/DriverRouteTracking";
import {
  useGetUserSubscriptionsQuery,
  useSkipMealMutation,
  useGetSkipHistoryQuery,
} from "../../../redux/storee/api";
import toast from "react-hot-toast";

const getApiBase = () => {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const str = typeof raw === "string" ? raw : String(raw);
  const unquoted = str.replace(/^['"]|['"]$/g, "");
  const trimmed = unquoted.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

// same util you had for merging skippedMeals into deliveryTracking
const mergeSkippedMealsIntoDeliveryTracking = (subscription) => {
  if (!subscription) return subscription;
  const mergedSubscription = JSON.parse(JSON.stringify(subscription));
  if (!mergedSubscription.deliveryTracking) {
    mergedSubscription.deliveryTracking = [];
  }
  if (subscription.skippedMeals && subscription.skippedMeals.length > 0) {
    subscription.skippedMeals.forEach((skippedMeal) => {
      const skipDate = new Date(skippedMeal.date);
      const shift = skippedMeal.shift;

      const existingDeliveryIndex =
        mergedSubscription.deliveryTracking.findIndex((delivery) => {
          const deliveryDate = new Date(delivery.date);
          return (
            deliveryDate.toDateString() === skipDate.toDateString() &&
            delivery.shift === shift
          );
        });

      if (existingDeliveryIndex === -1) {
        mergedSubscription.deliveryTracking.push({
          date: skippedMeal.date,
          shift: skippedMeal.shift,
          status: "skipped",
          isSkipped: true,
          skipReason: skippedMeal.reason || skippedMeal.description,
          skippedAt: skippedMeal.createdAt,
          _id: skippedMeal._id,
        });
      } else {
        const existingDelivery =
          mergedSubscription.deliveryTracking[existingDeliveryIndex];
        if (existingDelivery.status !== "skipped") {
          mergedSubscription.deliveryTracking[existingDeliveryIndex] = {
            ...existingDelivery,
            status: "skipped",
            isSkipped: true,
            skipReason: skippedMeal.reason || skippedMeal.description,
            skippedAt: skippedMeal.createdAt,
          };
        }
      }
    });

    mergedSubscription.deliveryTracking.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }
  return mergedSubscription;
};

const SubscriptionDetailPage = () => {
  const { id } = useParams();
  console.log("hello ji kese ho")
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  const {
    data: subscriptionData,
    isLoading: subscriptionsLoading,
    isError: subscriptionsError,
  } = useGetUserSubscriptionsQuery(undefined, { skip: !user });

  const allSubscriptions =
    subscriptionData?.data?.subscriptions ||
    subscriptionData?.subscriptions ||
    [];

  // try to find in existing list
  const fromList = useMemo(
    () => allSubscriptions.find((s) => s._id === id),
    [allSubscriptions, id]
  );
console.log(fromList)
  // detail from API if not in list
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      if (fromList) {
        setSubscriptionDetail(fromList);
        return;
      }
      setDetailLoading(true);
      setDetailError(null);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/subscriptions/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load subscription (${res.status})`);
        }
        const data = await res.json();
        setSubscriptionDetail(data?.data || data?.subscription || data);
      } catch (err) {
        setDetailError(err?.message || "Failed to load subscription detail");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [id, token, fromList]);

  const subscription = subscriptionDetail || fromList || null;
  const processedSubscription = useMemo(
    () => mergeSkippedMealsIntoDeliveryTracking(subscription),
    [subscription]
  );

  // Today meal for this subscription
  const [todayMeal, setTodayMeal] = useState(null);
  const [todayMealLoading, setTodayMealLoading] = useState(false);
  const [todayMealError, setTodayMealError] = useState(null);

  useEffect(() => {
    const fetchTodayMeal = async () => {
      if (!user || !id) return;
      setTodayMealLoading(true);
      setTodayMealError(null);
      try {
        const base = getApiBase();
        const res = await fetch(
          `${base}/subscriptions/${id}/today-meal`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            credentials: "include",
          }
        );
        if (res.status === 404) {
          // Gracefully handle no meal for today without showing an error
          setTodayMeal({ meal: { items: [], isAvailable: false } });
        } else if (!res.ok) {
          throw new Error(`Failed to load today's meal (${res.status})`);
        } else {
          const data = await res.json();
          setTodayMeal(data?.data || data);
        }
      } catch (err) {
        setTodayMealError(err?.message || "Failed to fetch today's meal");
      } finally {
        setTodayMealLoading(false);
      }
    };

    fetchTodayMeal();
  }, [user, token, id]);

  // Skip meal logic (same pattern as active page)
  const [skipMeal] = useSkipMealMutation();
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [skipShifts, setSkipShifts] = useState(["morning", "evening"]);
  const [isSkippingMeal, setIsSkippingMeal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const openSkipModal = () => {
    const todayIso = new Date().toISOString().split("T")[0];
    setSkipFromDate(todayIso);
    setSkipToDate(todayIso);
    setSkipShifts(["morning", "evening"]);
    setValidationErrors({});
    setShowSkipModal(true);
  };

  const closeSkipModal = () => {
    setShowSkipModal(false);
    setValidationErrors({});
  };

  const validateSkipDates = () => {
    const errors = {};
    if (!skipFromDate) errors.skipFromDate = "Start date required";
    if (!skipToDate) errors.skipToDate = "End date required";
    const today = new Date();
    const from = skipFromDate ? new Date(skipFromDate) : null;
    const to = skipToDate ? new Date(skipToDate) : null;
    if (
      from &&
      from < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    ) {
      errors.skipFromDate = "Start date cannot be in the past";
    }
    if (from && to && to < from) {
      errors.skipToDate = "End date cannot be before start date";
    }
    if (skipShifts.length === 0) errors.skipShifts = "Select at least one shift";
    setValidationErrors(errors);
    return errors;
  };

  const generateSkipDatesArray = () => {
    if (!skipFromDate || !skipToDate || skipShifts.length === 0) return [];
    const dates = [];
    const from = new Date(skipFromDate);
    const to = new Date(skipToDate);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const iso = new Date(d).toISOString().split("T")[0];
      skipShifts.forEach((shift) => {
        dates.push({ date: iso, shift });
      });
    }
    return dates;
  };

  const handleSkipMealConfirm = async () => {
    const errs = validateSkipDates();
    if (Object.keys(errs).length > 0) return;
    if (!id) return;

    try {
      setIsSkippingMeal(true);
      const dates = generateSkipDatesArray();
      const payload = {
        subscriptionId: id,
        skipData: { dates },
        reason: "user_skipped",
      };
      await skipMeal(payload).unwrap();
      toast.success(
        `Successfully skipped ${dates.length} meal${
          dates.length > 1 ? "s" : ""
        }!`
      );
      setShowSkipModal(false);
    } catch (err) {
      toast.error(
        err?.data?.message || "Failed to skip meal. Please try again."
      );
    } finally {
      setIsSkippingMeal(false);
    }
  };

  // Skip history + stats
  const {
    data: skipHistoryData,
    isLoading: isLoadingSkipHistory,
  } = useGetSkipHistoryQuery(id, { skip: !id });

  const skipHistory = useMemo(() => {
    const list =
      skipHistoryData?.data?.skippedMeals || skipHistoryData?.data || [];
    return Array.isArray(list) ? list : [];
  }, [skipHistoryData]);

  const skipStats = skipHistoryData?.data?.statistics || {};

  // Delivery tracking detail
  const [deliveryProgress, setDeliveryProgress] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  useEffect(() => {
    const fetchDeliveryProgress = async () => {
      if (!id) return;
      setDeliveryLoading(true);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/driver-routes/user/delivery-progress`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setDeliveryProgress(data.route || null);
        } else if (res.status === 404) {
          setDeliveryProgress(null);
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(
            errData?.message || "Failed to load delivery progress"
          );
        }
      } catch (e) {
        toast.error("Failed to load delivery progress");
      } finally {
        setDeliveryLoading(false);
      }
    };

    fetchDeliveryProgress();
  }, [id, token]);

  // Helpers
  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const getPlanTitle = (sub) =>
    sub?.planName ||
    sub?.plan?.name ||
    sub?.mealPlan?.title ||
    sub?.plan?.title ||
    "Meal Subscription";

  const getKitchenLabel = (sub) =>
    sub?.kitchenName ||
    sub?.vendorName ||
    sub?.mealPlan?.kitchenName ||
    sub?.mealPlan?.vendorName ||
    "";

  const getPerDayPrice = (sub) =>
    sub?.perDayPrice ||
    sub?.plan?.perDayPrice ||
    sub?.plan?.pricePerDay ||
    sub?.mealPlan?.perDayPrice ||
    null;

  const getMealsPerDay = (sub) =>
    sub?.mealsPerDay ||
    sub?.plan?.mealsPerDay ||
    sub?.mealPlan?.mealsPerDay ||
    2;

  const canCustomizeMeal = (sub) => {
    if (!sub) return false;
    const price = getPerDayPrice(sub);
    if (typeof price === "number") return price >= 60;
    return true;
  };

  const todayMealData = todayMeal?.meal || todayMeal;
  const todayItems =
    todayMealData?.items && Array.isArray(todayMealData.items)
      ? todayMealData.items
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter(Boolean)
      : [];

  // Highlight stats: delivered, remaining, skipped
  const deliveryTracking = processedSubscription?.deliveryTracking || [];
  const deliveredCount = useMemo(
    () =>
      deliveryTracking.filter(
        (d) => d?.status === "delivered" || d?.status === "replaced"
      ).length,
    [deliveryTracking]
  );
  const skippedCount = useMemo(
    () => deliveryTracking.filter((d) => d?.status === "skipped").length,
    [deliveryTracking]
  );
  const remainingCount = useMemo(
    () =>
      deliveryTracking.filter(
        (d) => !d?.status || d?.status === "pending" || d?.status === "scheduled"
      ).length,
    [deliveryTracking]
  );
  const totalMeals = deliveryTracking.length;
  const deliveredPct = totalMeals
    ? Math.round((deliveredCount / totalMeals) * 100)
    : 0;

  // login guard
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-md mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold">Login Required</h1>
            <p className="text-sm text-slate-600 mt-1">
              Please login to view subscription details.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // loading / error
  if (subscriptionsLoading || detailLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <p className="text-sm text-slate-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const hasBlockingError = !subscription && (subscriptionsError || detailError);
  if (hasBlockingError) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-slate-600 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <div className="bg-white rounded-2xl border border-rose-100 p-5">
            <p className="text-sm text-rose-600">
              Failed to load this subscription. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DETAIL UI
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        {/* Back + hero */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-slate-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        </div>

        {/* Hero card */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-slate-900">
                  {getPlanTitle(subscription)}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getKitchenLabel(subscription) || "Home-style kitchen"} •{" "}
                  {getMealsPerDay(subscription)} meals / day
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(subscription.startDate)} →{" "}
                    {formatDate(subscription.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Next renewal {formatDate(subscription.nextRenewalDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {subscription.deliveryType || "Regular delivery"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 capitalize">
                {subscription.status || "active"}
              </span>
              {getPerDayPrice(subscription) && (
                <span className="text-xs text-slate-700">
                  ₹{getPerDayPrice(subscription)}
                  <span className="text-[10px] text-slate-400"> / day</span>
                </span>
              )}
            </div>
          </div>

          {/* Hero actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={openSkipModal}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs sm:text-sm font-medium hover:bg-amber-700"
            >
              Skip upcoming meals
            </button>
            <button
              onClick={() => navigate("/customize")}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium ${
                canCustomizeMeal(subscription)
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
              disabled={!canCustomizeMeal(subscription)}
            >
              Customize today&apos;s thali
            </button>
          </div>
        </section>

        {/* Highlighted Meal Stats */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">Meal Delivery Summary</h2>
              <p className="text-xs text-slate-500">Delivered, remaining, aur skipped meals ka snapshot.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="text-[11px] font-medium text-emerald-700">Delivered</div>
              <div className="mt-1 text-2xl font-bold text-emerald-900">{deliveredCount}</div>
              <div className="mt-2">
                <div className="h-2 w-full bg-emerald-100 rounded-full">
                  <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${deliveredPct}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-emerald-700">{deliveredPct}% of total</div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
              <div className="text-[11px] font-medium text-blue-700">Remaining</div>
              <div className="mt-1 text-2xl font-bold text-blue-900">{remainingCount}</div>
              <div className="mt-1 text-[11px] text-blue-700">Scheduled/Pending deliveries</div>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <div className="text-[11px] font-medium text-amber-700">Skipped</div>
              <div className="mt-1 text-2xl font-bold text-amber-900">{skippedCount}</div>
              <div className="mt-1 text-[11px] text-amber-700">Total skipped meals</div>
            </div>
          </div>
        </section>

        {/* Today's meal (detailed, improved layout) */}
        <section className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Today&apos;s Meal
              </h2>
              <p className="text-xs text-slate-500">
                Aaj ka complete menu, isi subscription ke hisaab se — clearly highlighted.
              </p>
            </div>
          </div>

          {todayMealLoading && (
            <div className="text-sm text-slate-500">Loading today&apos;s menu...</div>
          )}
          {todayMealError && (
            <div className="text-sm text-rose-600">{todayMealError}</div>
          )}

          {!todayMealLoading && !todayMealError && (
            <>
              {todayItems.length > 0 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium mb-1 text-rose-800">
                        {todayMealData?.title || "Today&apos;s thali"}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {todayMealData?.shift && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-[11px] text-rose-700">Shift: {todayMealData.shift}</span>
                        )}
                        {todayMealData?.tier && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-[11px] text-rose-700">Tier: {todayMealData.tier}</span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-[11px] text-rose-700">Items: {todayItems.length}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                        {todayItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-slate-500 mt-2">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  No meals scheduled for today for this subscription.
                </div>
              )}
            </>
          )}
        </section>

        {/* Calendar section */}
        {processedSubscription && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Subscription Calendar
                </h2>
                <p className="text-xs text-slate-500">
                  Kis din delivery hui, skip hua ya aos aane wala he – sab ek calendar me.
                </p>
              </div>
            </div>
            <SubscriptionCalendar
              subscription={processedSubscription}
              userId={user?.data?._id || user?._id}
              onDateClick={() => {}}
            />
          </section>
        )}

        {/* Skip Summary */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Skip Summary
              </h2>
              <p className="text-xs text-slate-500">
                Kitne meal skip hue, refund kitna bana – ek quick snapshot.
              </p>
            </div>
          </div>

          {isLoadingSkipHistory ? (
            <div className="text-sm text-slate-600">Loading skip stats...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[11px] text-slate-500">Total skips</div>
                <div className="text-lg font-semibold text-slate-900">
                  {skipStats.totalSkips ?? skipHistory.length}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[11px] text-slate-500">This month</div>
                <div className="text-lg font-semibold text-slate-900">
                  {skipStats.monthlySkips ?? "-"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[11px] text-slate-500">Remaining</div>
                <div className="text-lg font-semibold text-slate-900">
                  {skipStats.remainingSkips ?? "-"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[11px] text-slate-500">Total refund</div>
                <div className="text-lg font-semibold text-slate-900">
                  ₹
                  {Number(
                    skipStats.totalRefund ??
                      skipHistory.reduce(
                        (sum, s) => sum + (s.refundAmount || 0),
                        0
                      )
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Skip history list */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Detailed Skip History
              </h2>
              <p className="text-xs text-slate-500">
                Har skip hua meal ki date, shift aur refund yaha dekho.
              </p>
            </div>
          </div>

          {isLoadingSkipHistory ? (
            <div className="text-sm text-slate-600">Loading skip history...</div>
          ) : skipHistory.length === 0 ? (
            <div className="text-sm text-slate-600">
              No skipped meals found for this subscription.
            </div>
          ) : (
            <div className="divide-y border rounded-xl">
              {skipHistory.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {new Date(s.date).toLocaleDateString()} • {s.shift} meal
                    </div>
                    {s.description &&
                      s.description !== "User requested meal skip" && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          {s.description}
                        </div>
                      )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-700">
                      Refund: ₹{(s.refundAmount || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Delivery tracking */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Today&apos;s Delivery Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Driver ka route aur delivery status is plan ke liye.
              </p>
            </div>
          </div>
          {deliveryLoading ? (
            <div className="text-sm text-slate-600">
              Loading delivery route...
            </div>
          ) : deliveryProgress ? (
            <DriverRouteTracking
              routeData={deliveryProgress}
              subscriptionId={subscription._id}
            />
          ) : (
            <div className="text-sm text-slate-600">
              No delivery scheduled or route not available for today.
            </div>
          )}
        </section>
      </div>

      {/* Skip Meal Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Skip Meals</h3>
              <button
                onClick={closeSkipModal}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={skipFromDate}
                  onChange={(e) => setSkipFromDate(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  min={new Date().toISOString().split("T")[0]}
                />
                {validationErrors.skipFromDate && (
                  <p className="text-xs text-rose-600 mt-1">
                    {validationErrors.skipFromDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  End Date *
                </label>
                <input
                  type="date"
                  value={skipToDate}
                  onChange={(e) => setSkipToDate(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                  min={skipFromDate || new Date().toISOString().split("T")[0]}
                />
                {validationErrors.skipToDate && (
                  <p className="text-xs text-rose-600 mt-1">
                    {validationErrors.skipToDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Select Shifts *
                </label>
                <div className="flex gap-3 mt-1">
                  {["morning", "evening"].map((shift) => (
                    <label
                      key={shift}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={skipShifts.includes(shift)}
                        onChange={() => {
                          setSkipShifts((prev) =>
                            prev.includes(shift)
                              ? prev.filter((s) => s !== shift)
                              : [...prev, shift]
                          );
                        }}
                      />
                      <span className="capitalize">{shift}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.skipShifts && (
                  <p className="text-xs text-rose-600 mt-1">
                    {validationErrors.skipShifts}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeSkipModal}
                className="px-3 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipMealConfirm}
                disabled={isSkippingMeal}
                className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-60"
              >
                {isSkippingMeal ? "Skipping..." : "Confirm Skip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetailPage;
