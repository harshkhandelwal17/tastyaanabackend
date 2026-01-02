import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import axios from "axios";

import ProductReviewsSystem from "../../../components/buyer/productReviewSystem";
import {
  selectMealPlanAddOns,
  setSelectedMealPlan,
  toggleAddOn,
  setCustomizations,
  selectCustomizations,
} from "../../../redux/Slices/MealPlanSlice";

import { addToCartAPI } from "../../../redux/cartSlice";

import {
  Star,
  Clock,
  Check,
  ShoppingCart,
  Zap,
  MapPin,
  Shield,
} from "lucide-react";

import TiffinPolicySection from "../../../components/buyer/Policy";

const InteractiveThaliPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux hooks
  const customizations = useSelector(selectCustomizations) || {};
  const reduxSelectedAddOns = useSelector((state) =>
    selectMealPlanAddOns ? selectMealPlanAddOns(state, id) : []
  );
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);

  // Backend URL
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Direct API calls
  const [mealPlanResponse, setMealPlanResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [extraItems, setExtraItems] = useState([]);

  // Extract meal plan data from the response structure
  const mealPlan = mealPlanResponse?.data?.mealPlan;
  const ratings = mealPlanResponse?.data?.ratingStats;
  const reviews = mealPlanResponse?.data?.reviews || [];

  // Fetch meal plan data
  const fetchMealPlan = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setIsError(false);
    try {
      const response = await axios.get(`${BACKEND_URL}/meal-plan/${id}`);
      setMealPlanResponse(response.data);
    } catch (error) {
      console.error("Error fetching meal plan detail:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id, BACKEND_URL]);

  // Fetch extra items
  const fetchExtraItems = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.get(
        `${BACKEND_URL}/meal-plan/${id}/extra-items`
      );
      setExtraItems(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching extra items:", error);
    }
  }, [id, BACKEND_URL]);

  // Initialize data
  useEffect(() => {
    fetchMealPlan();
    fetchExtraItems();
  }, [fetchMealPlan, fetchExtraItems]);

  // Local state
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [selectedDietaryPreference, setSelectedDietaryPreference] =
    useState("vegetarian");
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [addOnSearchTerm, setAddOnSearchTerm] = useState("");
  const [customAddOns, setCustomAddOns] = useState([]);
  const [customAddOnType, setCustomAddOnType] = useState("");
  const [customAddOnQty, setCustomAddOnQty] = useState(1);
  const [selectedThaliTiming, setSelectedThaliTiming] = useState("morning");
  const [setAsDefaultTiming, setSetAsDefaultTiming] = useState(false);
  const [selectedExtraItems, setSelectedExtraItems] = useState([]);

  // Start date and time selection
  const [startDate, setStartDate] = useState("");
  const [startShift, setStartShift] = useState("morning");

  // Delivery timing
  const [deliveryTiming, setDeliveryTiming] = useState({
    morning: {
      enabled: false,
      time: "08:00",
      orderCutoff: mealPlan?.timingConfig?.morning?.orderCutoff || "10:00",
    },
    evening: {
      enabled: false,
      time: "19:00",
      orderCutoff: mealPlan?.timingConfig?.evening?.orderCutoff || "21:00",
    },
  });

  // Shift options from API
  const shiftOptions = useMemo(() => {
    if (!mealPlan?.timingConfig) return [];

    return [
      mealPlan.timingConfig.morning?.available && {
        id: "morning",
        label: `Morning (${mealPlan.timingConfig.morning.deliveryWindow.start} - ${mealPlan.timingConfig.morning.deliveryWindow.end})`,
        time: mealPlan.timingConfig.morning.deliveryWindow.start,
        orderCutoff: mealPlan.timingConfig.morning.orderCutoff,
      },
      mealPlan.timingConfig.evening?.available && {
        id: "evening",
        label: `Evening (${mealPlan.timingConfig.evening.deliveryWindow.start} - ${mealPlan.timingConfig.evening.deliveryWindow.end})`,
        time: mealPlan.timingConfig.evening.deliveryWindow.start,
        orderCutoff: mealPlan.timingConfig.evening.orderCutoff,
      },
    ].filter(Boolean);
  }, [mealPlan?.timingConfig]);

  // Plan options from API
  const planOptions = useMemo(() => {
    if (!mealPlan || !mealPlan.pricing || !Array.isArray(mealPlan.pricing))
      return [];

    return mealPlan.pricing.map((plan, index) => {
      const planId = `${plan.days}days_${index}`;
      const isPopular = plan.days === 10 || plan.days === 15;
      const duration = `${plan.days} ${plan.days === 1 ? "Day" : "Days"}`;

      const totalThalis = plan.totalthali;
      const totalPrice = plan.price;
      const pricePerThali = Math.round((totalPrice / totalThalis) * 100) / 100;

      return {
        id: planId,
        days: plan.days,
        name: plan.name || duration,
        price: totalPrice,
        mealperday: plan?.mealperday,
        totalThalis: totalThalis,
        pricePerThali: pricePerThali,
        period: plan.days === 1 ? "/day" : `for ${plan.days} days`,
        popular: isPopular,
        description: plan.description || "",
        discount: plan.savings ? `${Math.round(plan.savings)}%` : null,
      };
    });
  }, [mealPlan]);

  // Default selected plan
  useEffect(() => {
    if (planOptions.length > 0 && !selectedPlan) {
      const defaultPlan =
        planOptions.find((p) => p.days === 30) ||
        planOptions.find((p) => p.popular) ||
        planOptions[0];

      if (defaultPlan) {
        setSelectedPlan(defaultPlan.id);
      }
    }
  }, [planOptions, selectedPlan]);

  // Initial start date = today
  useEffect(() => {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    setStartDate(formatted);
  }, []);

  // Update timing config when mealPlan loads
  useEffect(() => {
    if (!mealPlan?.timingConfig) return;

    setDeliveryTiming((prev) => ({
      morning: {
        ...prev.morning,
        orderCutoff: mealPlan.timingConfig.morning?.orderCutoff || "10:00",
      },
      evening: {
        ...prev.evening,
        orderCutoff: mealPlan.timingConfig.evening?.orderCutoff || "21:00",
      },
    }));
  }, [mealPlan?.timingConfig]);

  // Enable timing based on selected plan and shift
  useEffect(() => {
    if (!planOptions.length) return;

    const selectedPlanData = planOptions.find((p) => p.id === selectedPlan);
    const mealPerDay = selectedPlanData?.mealperday;

    setDeliveryTiming((prev) => {
      if (mealPerDay === 1) {
        return {
          ...prev,
          morning: {
            ...prev.morning,
            enabled: startShift === "morning",
          },
          evening: {
            ...prev.evening,
            enabled: startShift === "evening",
          },
        };
      } else if (mealPerDay === 2) {
        return {
          ...prev,
          morning: {
            ...prev.morning,
            enabled: true,
          },
          evening: {
            ...prev.evening,
            enabled: true,
          },
        };
      }
      return prev;
    });
  }, [selectedPlan, planOptions, startShift]);

  // Thali timing options based on plan
  const thaliTimingOptions = useMemo(() => {
    if (!planOptions.length) return [];

    const selectedPlanData = planOptions.find((p) => p.id === selectedPlan);
    const mealPerDay = selectedPlanData?.mealperday;

    if (mealPerDay === 1) {
      if (startShift === "morning") {
        return [{ id: "morning", label: "Morning thali only" }];
      } else if (startShift === "evening") {
        return [{ id: "evening", label: "Evening thali only" }];
      }
      return [{ id: "morning", label: "Morning thali only" }];
    }

    return [
      { id: "morning", label: "Morning & evening thali" },
      { id: "office", label: "Office lunch & evening thali" },
    ];
  }, [selectedPlan, planOptions, startShift]);

  // Selected plan total tiffins
  const currentTotalTiffins = useMemo(() => {
    if (!selectedPlan || !planOptions.length) return 1;
    const p = planOptions.find((plan) => plan.id === selectedPlan);
    return p?.totalThalis || 1;
  }, [selectedPlan, planOptions]);

  // Add-ons (appliesToAll)
  const availableCustomAddOns =
    mealPlan?.addons?.filter((addon) => !addon.appliesToAll) || [];

  const filteredAddOns =
    mealPlan?.addons?.filter(
      (addOn) =>
        addOn.appliesToAll &&
        (addOn.name.toLowerCase().includes(addOnSearchTerm.toLowerCase()) ||
          (addOn.description &&
            addOn.description
              .toLowerCase()
              .includes(addOnSearchTerm.toLowerCase())))
    ) || [];

  // Add custom add-on handler (not used in UI now but kept for future)
  const handleAddCustomAddOn = () => {
    if (!customAddOnType) {
      toast.error("Please select an item");
      return;
    }
    if (customAddOnQty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const selectedItem = mealPlan?.extraitems?.find(
      (item) => item.id === customAddOnType
    );
    if (!selectedItem) {
      toast.error("Selected item not found");
      return;
    }

    setCustomAddOns((prev) => [
      ...prev,
      {
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: customAddOnQty,
        uniqueKey: `${selectedItem.id}-${Date.now()}`,
      },
    ]);

    toast.success(
      `${selectedItem.name} (x${customAddOnQty}) added to your order!`
    );

    setCustomAddOnType("");
    setCustomAddOnQty(1);
  };

  const handleRemoveCustomAddOn = (uniqueKey) => {
    setCustomAddOns((prev) => prev.filter((a) => a.uniqueKey !== uniqueKey));
  };

  // Handlers
  const handlePlanSelect = (planId) => {
    if (!planId) return;
    setSelectedPlan(planId);
    if (mealPlan) {
      dispatch(setSelectedMealPlan(mealPlan._id));
    }
  };

  const handleAddOnToggle = (addOnId) => {
    setSelectedAddOns((prevSelected) =>
      prevSelected.includes(addOnId)
        ? prevSelected.filter((id) => id !== addOnId)
        : [...prevSelected, addOnId]
    );

    if (mealPlan) {
      dispatch(toggleAddOn({ mealPlanId: mealPlan._id, addOnId }));
    }
  };

  const handleCustomizationToggle = (customizationId) => {
    setSelectedCustomizations((prev) =>
      prev.includes(customizationId)
        ? prev.filter((id) => id !== customizationId)
        : [...prev, customizationId]
    );

    dispatch(
      setCustomizations({
        customOptions: selectedCustomizations.includes(customizationId)
          ? selectedCustomizations.filter((id) => id !== customizationId)
          : [...selectedCustomizations, customizationId],
      })
    );
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleStartShiftChange = (shift) => {
    setStartShift(shift);
  };

  const handleDeliveryTimingChange = (mealType, field, value) => {
    setDeliveryTiming((prev) => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        enabled: true,
        [field]: value,
      },
    }));
  };

  // Extra items handlers
  const handleExtraItemToggle = (itemId) => {
    setSelectedExtraItems((prev) => {
      if (prev.some((item) => item.id === itemId)) {
        const item = extraItems.find(
          (i) => (i._id || i.id || i.name) === itemId
        );
        if (item) {
          toast.info(`${item.name} removed from your order`);
        }
        return prev.filter((item) => item.id !== itemId);
      } else {
        const item = extraItems.find(
          (i) => (i._id || i.id || i.name) === itemId
        );
        if (item) {
          toast.success(`${item.name} added to your order!`);
          return [
            ...prev,
            {
              id: itemId,
              name: item.name,
              price: item.price,
              quantity: 1,
            },
          ];
        }
      }
      return prev;
    });
  };

  const handleExtraItemQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedExtraItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: parseInt(newQuantity, 10) }
          : item
      )
    );
  };

  // Total calculation (plan + add-ons + extra items)
  const calculateTotal = () => {
    const selectedPlanData = planOptions.find((p) => p.id === selectedPlan);
    const planPrice = selectedPlanData?.price || 0;
    const totalTiffins = currentTotalTiffins;

    const addOnsPrice = (mealPlan?.addons || []).reduce((total, addOn) => {
      const addOnIdentifier = addOn._id || addOn.id || addOn.name;
      return selectedAddOns.includes(addOnIdentifier)
        ? total + (addOn.price || 0) * totalTiffins
        : total;
    }, 0);

    const customAddOnsPrice = customAddOns.reduce(
      (total, addOn) => total + addOn.price * addOn.quantity * totalTiffins,
      0
    );

    const extraItemsPrice = selectedExtraItems.reduce((total, selectedItem) => {
      const item = extraItems.find(
        (i) => (i._id || i.id || i.name) === (selectedItem.id || selectedItem)
      );
      if (!item) return total;
      const quantity = selectedItem.quantity || 1;
      return total + (item.price || 0) * quantity;
    }, 0);

    return planPrice + addOnsPrice + customAddOnsPrice + extraItemsPrice;
  };

  const handleBuyNow = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    const selectedPlanData = planOptions.find((p) => p.id === selectedPlan);
    if (!selectedPlanData) {
      toast.error("Selected plan data not found");
      return;
    }

    const totalPriceValue = calculateTotal();
    const totalTiffins = currentTotalTiffins;

    const orderData = {
      mealPlan: id,
      planType: selectedPlan,
      selectedThaliTiming,
      startDate,
      startShift,
      shift:
        planOptions.find((p) => p.id === selectedPlan)?.mealperday === 2
          ? "both"
          : startShift,

      planDetails: {
        ...selectedPlanData,
        pricePerThali: selectedPlanData.pricePerThali,
      },

      deliveryTiming,

      customizations: {
        preferences: selectedCustomizations,
        dietaryPreference: selectedDietaryPreference,
        ...(mealPlan?.customizationSettings && {
          allowMealReplacement:
            mealPlan.customizationSettings.allowMealReplacement,
          allowDietaryChanges:
            mealPlan.customizationSettings.allowDietaryChanges,
          maxExtraItems: mealPlan.customizationSettings.maxExtraItems,
          customizationDeadline:
            mealPlan.customizationSettings.customizationDeadline,
          allowedCustomizations:
            mealPlan.customizationSettings.allowedCustomizations,
        }),
      },

      addOns: (mealPlan?.addons || [])
        .filter((addon) =>
          selectedAddOns.includes(addon._id || addon.id || addon.name)
        )
        .map((addon) => ({
          addOn: addon._id || addon.id,
          name: addon.name,
          quantity: 1,
          price: addon.price,
          perTiffinPrice: addon.price,
        })),

      customAddOns: customAddOns.map((addOn) => ({
        name: addOn.name,
        price: addOn.price,
        quantity: addOn.quantity,
        perTiffinPrice: addOn.price,
        uniqueKey: addOn.uniqueKey,
      })),

      extraItems: selectedExtraItems
        .map((item) => {
          const extraItem = extraItems.find(
            (i) => (i._id || i.id || i.name) === (item.id || item)
          );
          return extraItem
            ? {
                item: extraItem._id || extraItem.id,
                name: extraItem.name,
                quantity: item.quantity || 1,
                price: extraItem.price,
              }
            : null;
        })
        .filter(Boolean),

      totalPrice: totalPriceValue,

      nutritionalInfo: mealPlan?.nutritionalInfo
        ? {
            calories: mealPlan.nutritionalInfo.calories,
            protein: mealPlan.nutritionalInfo.protein,
            carbs: mealPlan.nutritionalInfo.carbs,
            fat: mealPlan.nutritionalInfo.fat,
            fiber: mealPlan.nutritionalInfo.fiber,
            sodium: mealPlan.nutritionalInfo.sodium,
          }
        : null,

      metadata: {
        orderType: "subscription",
        source: "web",
        deviceInfo: window.navigator.userAgent,
        timestamp: new Date().toISOString(),
      },

      paymentIntent: "capture",
      redirectUrl: `${window.location.origin}/order-confirmation`,
    };

    navigate("/order-confirm", {
      state: {
        orderData,
        mealPlanTitle: mealPlan?.title,
        mealPlanImage: mealPlan?.imageUrls?.[0],
      },
    });
  };

  // ───────────────────────────────────
  // UI: Clean & minimal
  // ───────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md px-6 py-4 flex items-center gap-3 border border-slate-100">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 text-sm font-medium">
            Loading meal plan...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !mealPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md px-6 py-5 text-center border border-rose-100 max-w-sm">
          <p className="text-base font-semibold text-slate-900 mb-1">
            Meal plan not found
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Please try again or go back to plans list.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Small cart badge (desktop top-left) */}
      {totalItems > 0 && (
        <div className="fixed top-4 left-4 z-40 hidden sm:block">
          <button
            onClick={() => navigate("/cart")}
            className="bg-emerald-600 text-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 text-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{totalItems} items</span>
          </button>
        </div>
      )}

      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-slate-900 truncate">
              {mealPlan.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>
                  {ratings?.averageOverall?.toFixed(1) || "4.8"} •{" "}
                  {reviews?.length || 0} reviews
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Total</p>
            <p className="text-lg font-semibold text-emerald-600">
              ₹{calculateTotal()}
            </p>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* LEFT: images + description */}
          <div className="space-y-4">
            {/* Hero image + title (desktop) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9] bg-slate-100">
                <img
                  src={
                    mealPlan.imageUrls?.[0] ||
                    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={mealPlan.title}
                  className="w-full h-full object-cover"
                />

                {/* Rating chip - desktop */}
                <div className="hidden md:flex absolute top-3 left-3 items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                  <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                  <span className="font-semibold">
                    {ratings?.averageOverall?.toFixed(1) || "4.8"}
                  </span>
                  <span className="text-[10px] text-slate-200">
                    ({reviews?.length || 0})
                  </span>
                </div>
              </div>

              <div className="hidden md:block px-4 pt-3 pb-4">
                <h1 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-1">
                  {mealPlan.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>
                      {ratings?.averageOverall?.toFixed(1) || "4.8"} •{" "}
                      {reviews?.length || 0} reviews
                    </span>
                  </div>
                  {planOptions.length > 0 && (
                    <>
                      <span className="h-4 w-px bg-slate-200" />
                      <span>
                        {planOptions[0].mealperday} meal
                        {planOptions[0].mealperday > 1 ? "s" : ""} per day
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {mealPlan.imageUrls?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {mealPlan.imageUrls.slice(1, 5).map((url, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100"
                  >
                    <img
                      src={url}
                      alt={`${mealPlan.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {mealPlan.description && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  About this meal
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {mealPlan.description}
                </p>
              </div>
            )}

            {/* Includes */}
            {mealPlan.includes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  What you get in each thali
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mealPlan.includes.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2"
                    >
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: plan selection + controls */}
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* Plan selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Choose your plan
              </h3>
              <div className="space-y-2.5">
                {planOptions.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {plan.name}
                          </p>
                          {plan.popular && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                              Best value
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {plan.days} days • {plan.totalThalis} tiffins •{" "}
                          {plan.mealperday} meal
                          {plan.mealperday > 1 ? "s" : ""} / day
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Approx ₹{plan.pricePerThali}/tiffin
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-semibold text-emerald-600">
                          ₹{plan.price}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start date & shift */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Start date & shift
              </h3>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                  Start from
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Shift */}
              {shiftOptions.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    First delivery
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {shiftOptions.map((shift) => (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => handleStartShiftChange(shift.id)}
                        className={`rounded-lg border px-2.5 py-2 text-xs text-left ${
                          startShift === shift.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <p className="font-medium">{shift.label}</p>
                        <p className="text-[10px] text-slate-500">
                          Around {shift.time}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery time */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                  Delivery time (you can adjust)
                </label>
                <div className="space-y-2 text-xs">
                  {/* Morning row */}
                  {(planOptions.find((p) => p.id === selectedPlan)
                    ?.mealperday === 2 ||
                    startShift === "morning") && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <SunIcon className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-slate-800">
                          Morning delivery
                        </span>
                      </div>
                      <input
                        type="time"
                        value={deliveryTiming.morning.time}
                        onChange={(e) =>
                          handleDeliveryTimingChange(
                            "morning",
                            "time",
                            e.target.value
                          )
                        }
                        className="px-2 py-1 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      />
                    </div>
                  )}

                  {/* Evening row */}
                  {(planOptions.find((p) => p.id === selectedPlan)
                    ?.mealperday === 2 ||
                    startShift === "evening") && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <MoonIcon className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium text-slate-800">
                          Evening delivery
                        </span>
                      </div>
                      <input
                        type="time"
                        value={deliveryTiming.evening.time}
                        onChange={(e) =>
                          handleDeliveryTimingChange(
                            "evening",
                            "time",
                            e.target.value
                          )
                        }
                        className="px-2 py-1 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add-ons (applies-to-all) */}
            {mealPlan.addons?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Add-ons (optional)
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Add items for all {currentTotalTiffins} tiffins in this plan.
                </p>

                <input
                  type="text"
                  placeholder="Search add-ons..."
                  value={addOnSearchTerm}
                  onChange={(e) => setAddOnSearchTerm(e.target.value)}
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />

                <div className="space-y-2">
                  {filteredAddOns.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No add-ons found.
                    </p>
                  )}
                  {filteredAddOns.map((addOn) => {
                    const id = addOn._id || addOn.id || addOn.name;
                    const checked = selectedAddOns.includes(id);
                    const totalPrice =
                      (addOn.price || 0) * currentTotalTiffins;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleAddOnToggle(id)}
                        className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-xs ${
                          checked
                            ? "bg-emerald-50 border-emerald-400"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                              checked
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-300"
                            }`}
                          >
                            {checked && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 truncate">
                              {addOn.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              ₹{addOn.price} / tiffin × {currentTotalTiffins}{" "}
                              tiffins
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-emerald-700">
                          +₹{totalPrice}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra items */}
            {extraItems && extraItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Extra items (optional)
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  These are added once to your order, not per tiffin.
                </p>
                <div className="space-y-2">
                  {extraItems.map((item) => {
                    const itemId = item._id || item.id || item.name;
                    const selected = selectedExtraItems.find(
                      (i) => i.id === itemId
                    );
                    const isSelected = !!selected;
                    return (
                      <div
                        key={itemId}
                        className={`rounded-lg border px-3 py-2 text-xs space-y-2 ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleExtraItemToggle(itemId)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-medium text-slate-900">
                              {item.name}
                            </span>
                          </label>
                          <span className="font-semibold text-emerald-700">
                            ₹{item.price}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleExtraItemQuantityChange(
                                    itemId,
                                    (selected.quantity || 1) - 1
                                  )
                                }
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium">
                                {selected.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleExtraItemQuantityChange(
                                    itemId,
                                    (selected.quantity || 1) + 1
                                  )
                                }
                                className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-semibold text-slate-900">
                              Total: ₹
                              {item.price * (selected.quantity || 1)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timing summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Thali timing
              </h3>
              <p className="text-[11px] text-slate-600 mb-1">
                Your plan will start from{" "}
                <span className="font-medium text-slate-900">
                  {startDate || "—"}
                </span>{" "}
                in the{" "}
                <span className="font-medium text-slate-900">
                  {startShift}
                </span>{" "}
                shift.
              </p>
              {planOptions.find((p) => p.id === selectedPlan)?.mealperday ===
                2 && (
                <p className="text-[11px] text-slate-600">
                  Both morning and evening deliveries will be active for this
                  plan.
                </p>
              )}
            </div>

            {/* Policy section */}
            <TiffinPolicySection />

            {/* Total + CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Total amount</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    ₹{calculateTotal()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Includes plan & selected add-ons
                  </p>
                </div>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isLoadingAction}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-semibold py-3.5 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoadingAction ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Proceed to confirm</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>Free delivery</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>Secure payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Customer reviews
            </h3>
            <p className="text-[11px] text-slate-500">
              See what others feel about this plan.
            </p>
          </div>
          <ProductReviewsSystem
            mealPlanId={id}
            productName={mealPlan?.title || mealPlan?.name}
            onReviewSubmitted={fetchMealPlan}
          />
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-slate-500">
              Total for this subscription
            </p>
            <p className="text-lg font-semibold text-emerald-600">
              ₹{calculateTotal()}
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Free delivery • Secure payment
          </p>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isLoadingAction}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-semibold py-3 flex items-center justify-center gap-2"
        >
          {isLoadingAction ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Buy now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InteractiveThaliPage;
