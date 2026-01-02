// src/pages/subscription/ActiveSubscriptionsPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Utensils,
  Clock,
  ChevronRight,
  AlertCircle,
  MapPin,
  Truck,
} from "lucide-react";
import DriverRouteTracking from "../../../components/delivery/DriverRouteTracking";
import {
  useGetUserSubscriptionsQuery,
  useSkipMealMutation,
  useGetSkipHistoryQuery,
} from "../../../redux/storee/api";
import toast from "react-hot-toast";

// same as your existing util
const getApiBase = () => {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const str = typeof raw === "string" ? raw : String(raw);
  const unquoted = str.replace(/^['"]|['"]$/g, "");
  const trimmed = unquoted.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const ActiveSubscriptionsPage = () => {
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

  const activeSubscriptions = useMemo(
    () => allSubscriptions.filter((s) => s?.status === "active"),
    [allSubscriptions]
  );

  // Today meal (user level)
  const [todayMeal, setTodayMeal] = useState(null);
  const [todayMealLoading, setTodayMealLoading] = useState(false);
  const [todayMealError, setTodayMealError] = useState(null);

  useEffect(() => {
    const fetchTodayMeal = async () => {
      if (!user) return;
      setTodayMealLoading(true);
      setTodayMealError(null);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/subscriptions/user/today-meal`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to load today's meal (${res.status})`);
        }
        const data = await res.json();
        setTodayMeal(data?.data || data);
      } catch (err) {
        setTodayMealError(err?.message || "Failed to fetch today's meal");
      } finally {
        setTodayMealLoading(false);
      }
    };

    fetchTodayMeal();
  }, [user, token]);

  // Delivery tracking per plan
  const [showDeliveryTracking, setShowDeliveryTracking] = useState({});
  const [deliveryProgress, setDeliveryProgress] = useState({});

  const fetchDeliveryProgress = async (subscriptionId) => {
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
        setDeliveryProgress((prev) => ({
          ...prev,
          [subscriptionId]: data.route,
        }));
      } else {
        if (res.status === 404) {
          setDeliveryProgress((prev) => ({ ...prev, [subscriptionId]: null }));
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData?.message || "Failed to load delivery progress");
        }
      }
    } catch (e) {
      toast.error("Failed to load delivery progress");
    }
  };

  const toggleDeliveryTracking = (subscriptionId) => {
    const isShown = !!showDeliveryTracking[subscriptionId];
    setShowDeliveryTracking((prev) => ({
      ...prev,
      [subscriptionId]: !isShown,
    }));
    if (!isShown && !deliveryProgress[subscriptionId]) {
      fetchDeliveryProgress(subscriptionId);
    }
  };

  // Skip meal per plan (modal)
  const [skipMeal] = useSkipMealMutation();
  const [skipModalFor, setSkipModalFor] = useState(null);
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [skipShifts, setSkipShifts] = useState(["morning", "evening"]);
  const [isSkippingMeal, setIsSkippingMeal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const openSkipModal = (subscriptionId) => {
    const todayIso = new Date().toISOString().split("T")[0];
    setSkipModalFor(subscriptionId);
    setSkipFromDate(todayIso);
    setSkipToDate(todayIso);
    setSkipShifts(["morning", "evening"]);
    setValidationErrors({});
  };

  const closeSkipModal = () => {
    setSkipModalFor(null);
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
    if (!skipModalFor) return;

    try {
      setIsSkippingMeal(true);
      const dates = generateSkipDatesArray();
      const payload = {
        subscriptionId: skipModalFor,
        skipData: { dates },
        reason: "user_skipped",
      };
      await skipMeal(payload).unwrap();
      toast.success(
        `Successfully skipped ${dates.length} meal${
          dates.length > 1 ? "s" : ""
        }!`
      );
      closeSkipModal();
    } catch (err) {
      toast.error(
        err?.data?.message || "Failed to skip meal. Please try again."
      );
    } finally {
      setIsSkippingMeal(false);
    }
  };

  // Simple skip history modal – per plan
  const [historyFor, setHistoryFor] = useState(null);
  const {
    data: skipHistoryData,
    isLoading: isLoadingSkipHistory,
  } = useGetSkipHistoryQuery(historyFor, { skip: !historyFor });

  const skipHistoryList = useMemo(() => {
    const list =
      skipHistoryData?.data?.skippedMeals || skipHistoryData?.data || [];
    return Array.isArray(list) ? list : [];
  }, [skipHistoryData]);

  const closeHistoryModal = () => setHistoryFor(null);

  // Helpers
  const handleLogin = () => navigate("/login");

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

  const getShiftLabel = (sub) =>
    sub?.shift ||
    sub?.mealShift ||
    sub?.plan?.type ||
    sub?.mealPlan?.type ||
    "Lunch / Dinner";

  const canCustomizeMeal = (subscription) => {
    if (!subscription) return false;
    const price = getPerDayPrice(subscription);
    if (typeof price === "number") return price >= 60;
    return true;
  };

  const getTodayMealForSubscription = (sub) => {
    if (sub?.todayMeal) return { source: "plan", data: sub.todayMeal };
    if (todayMeal?.subscription?._id === sub._id) {
      return { source: "user", data: todayMeal.meal };
    }
    return null;
  };

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex items-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold">Login required</h1>
            <p className="text-sm text-slate-600 mt-1">
              Please login to view your active plans and today&apos;s menu.
            </p>
            <button
              onClick={handleLogin}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-4xl mx-auto px-3 pt-4">
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900">
                Active meal plans
              </h1>
              <p className="text-[11px] text-slate-500">
                Roz ka tiffin & delivery control, ek hi screen se.
              </p>
            </div>
          </div>
          {activeSubscriptions.length > 0 && (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {activeSubscriptions.length} plan
              {activeSubscriptions.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* states */}
        {subscriptionsLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <p className="text-sm text-slate-600">Loading your plans...</p>
          </div>
        )}

        {subscriptionsError && (
          <div className="bg-white rounded-2xl border border-rose-100 p-3 shadow-sm">
            <p className="text-sm text-rose-600">
              Failed to load subscriptions. Please try again.
            </p>
          </div>
        )}

        {!subscriptionsLoading &&
          !subscriptionsError &&
          activeSubscriptions.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mt-2">
              <div className="flex items-start gap-3">
                <Utensils className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    No active plans yet
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Jaise hi tum koi tiffin / meal plan start karoge, woh yahi
                    list me aayega.
                  </p>
                  <Link
                    to="/meal-plans"
                    className="inline-flex mt-3 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                  >
                    Browse meal plans
                  </Link>
                </div>
              </div>
            </div>
          )}

        {/* list */}
        {activeSubscriptions.length > 0 && (
          <section className="space-y-3 mt-2">
            {activeSubscriptions.map((sub) => {
              const perDayPrice = getPerDayPrice(sub);
              const kitchen = getKitchenLabel(sub);
              const todayData = getTodayMealForSubscription(sub);
              const todayMealData = todayData?.data;
              const todayItems =
                todayMealData?.items && Array.isArray(todayMealData.items)
                  ? todayMealData.items
                      .map((item) =>
                        typeof item === "string" ? item : item?.name
                      )
                      .filter(Boolean)
                  : [];

              return (
                <div
                  key={sub._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4"
                >
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {getPlanTitle(sub)}
                        </h2>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                          {kitchen && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                {kitchen}
                              </span>
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                            {getShiftLabel(sub)}
                          </span>
                          {perDayPrice && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
                              ₹{perDayPrice}
                              <span className="text-[9px] text-emerald-500">
                                {" "}
                                / day
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 capitalize">
                        {sub.status || "active"}
                      </span>
                      {sub.planType && (
                        <span className="text-[10px] text-slate-500">
                          {sub.planType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates + delivery */}
                  <div className="mt-2 text-[10px] text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
                    <span>
                      {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                    </span>
                    <span>• Next: {formatDate(sub.nextRenewalDate)}</span>
                    <span className="inline-flex items-center gap-1">
                      • <Truck className="w-3 h-3" />
                      {sub.deliveryType || "Regular delivery"}
                    </span>
                  </div>

                  {/* TODAY'S MEAL – highlighted, but compact */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[11px] font-semibold text-slate-900">
                        Today&apos;s meal
                      </span>
                      {todayData && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                          Active
                        </span>
                      )}
                    </div>

                    {todayMealLoading && (
                      <div className="text-[10px] text-slate-500">
                        Loading today&apos;s menu...
                      </div>
                    )}
                    {todayMealError && (
                      <div className="text-[10px] text-rose-600">
                        {todayMealError}
                      </div>
                    )}

                    {!todayMealLoading && !todayMealError && (
                      <>
                        {todayData && todayItems.length > 0 ? (
                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                            <p className="text-[10px] font-semibold text-slate-900 mb-1">
                              {todayMealData?.title || "Today&apos;s Thali"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {todayItems.slice(0, 5).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-[9px] text-slate-700 border border-slate-100"
                                >
                                  {item}
                                </span>
                              ))}
                              {todayItems.length > 5 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-[9px] text-amber-700 border border-amber-100">
                                  +{todayItems.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[10px] text-slate-500">
                            No specific menu found for today for this plan.
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions – FULL buttons on mobile (grid) */}
                  <div className="mt-3">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                      {/* View details - primary */}
                      <button
                        onClick={() => navigate(`/subscription/${sub._id}`)}
                        className="col-span-2 sm:col-auto w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-medium"
                      >
                        View details
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => openSkipModal(sub._id)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-600 text-white text-[11px] font-medium"
                      >
                        Skip meals
                      </button>

                      <button
                        onClick={() => toggleDeliveryTracking(sub._id)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-medium"
                      >
                        {showDeliveryTracking[sub._id]
                          ? "Hide delivery"
                          : "Track delivery"}
                      </button>

                      <button
                        onClick={() => setHistoryFor(sub._id)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-medium"
                      >
                        Skip history
                      </button>

                      <button
                        onClick={() => {
                          if (!canCustomizeMeal(sub)) {
                            toast.error(
                              "Customize is available for premium plans only."
                            );
                            return;
                          }
                          navigate(`/customize/${sub._id}`);
                        }}
                        className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-[11px] font-medium ${
                          canCustomizeMeal(sub)
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Customize today
                      </button>
                    </div>
                  </div>

                  {/* Expand delivery tracking */}
                  {showDeliveryTracking[sub._id] && (
                    <div className="mt-3 border-t border-slate-100 pt-2">
                      {deliveryProgress[sub._id] ? (
                        <DriverRouteTracking
                          routeData={deliveryProgress[sub._id]}
                          subscriptionId={sub._id}
                        />
                      ) : (
                        <div className="text-[11px] text-slate-600">
                          No delivery scheduled or route not available.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {/* Skip Meal Modal */}
      {skipModalFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Skip meals</h3>
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
                  Start date *
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
                  End date *
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
                  Select shifts *
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
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipMealConfirm}
                disabled={isSkippingMeal}
                className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-60"
              >
                {isSkippingMeal ? "Skipping..." : "Confirm skip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip History Modal */}
      {historyFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-5 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Skip history</h3>
              <button
                onClick={closeHistoryModal}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoadingSkipHistory ? (
                <div className="text-sm text-slate-600">
                  Loading skip history...
                </div>
              ) : skipHistoryList.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No skipped meals found for this plan.
                </div>
              ) : (
                <div className="divide-y border rounded-lg">
                  {skipHistoryList.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {new Date(s.date).toLocaleDateString()} • {s.shift}{" "}
                          meal
                        </div>
                        {s.description &&
                          s.description !== "User requested meal skip" && (
                            <div className="text-xs text-slate-600 mt-0.5">
                              {s.description}
                            </div>
                          )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">
                          Refund: ₹{(s.refundAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 text-right">
              <button
                onClick={closeHistoryModal}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSubscriptionsPage;