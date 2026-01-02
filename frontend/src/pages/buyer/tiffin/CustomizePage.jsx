import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useCreateCustomizationMutation,
  useSkipMealMutation,
  useProcessCustomizationPaymentMutation,
  useVerifyCustomizationPaymentMutation,
  useGetUserSubscriptionsQuery,
  useGetMealPlanQuery,
  useGetReplaceableThalisQuery,
  useReplaceThaliMutation,
  useGetCustomizationsQuery,
  useGetSkipHistoryQuery, // Add this new API hook
} from "../../../redux/storee/api";
import {
  FaInfoCircle,
  FaTimes,
  FaSpinner,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaCheck,
  FaUtensils,
  FaCalendarAlt,
  FaClock,
  FaFire,
  FaLeaf,
  FaCarrot,
  FaBreadSlice,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaCog,
  FaSave,
  FaHistory,
  FaExclamationTriangle,
  FaEye,
} from "react-icons/fa";
import { RiRefund2Line } from "react-icons/ri";

import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import {
  format,
  addDays,
  isBefore,
  isAfter,
  parseISO,
  isSameDay,
  isToday,
  startOfDay,
  differenceInHours,
} from "date-fns";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import ".././CustomizePage.css";

const CustomizePage = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // State for form inputs
  const [selectedDate, setSelectedDate] = useState("");
  const [date, setDate] = useState(selectedDate || "");
  const [mealType, setMealType] = useState("lunch");
  const [spiceLevel, setSpiceLevel] = useState("medium");
  const [dietaryPreference, setDietaryPreference] = useState("regular");
  const [quantity, setQuantity] = useState(1);
  const [timing, setTiming] = useState(
    selectedDate?.includes("evening") ? "evening" : "morning"
  );
  const [notes, setNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [noOnion, setNoOnion] = useState(false);
  const [noGarlic, setNoGarlic] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState([]); // Array of { id, name, price, quantity }
  const [selectedExtraItems, setSelectedExtraItems] = useState([]); // Array of { id, name, price, quantity }
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  // const [totalExtraCost, setTotalExtraCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Enhanced skip functionality state
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [skipShifts, setSkipShifts] = useState(["morning", "evening"]); // Both shifts by default
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isSkippingMealState, setIsSkippingMealState] = useState(false);
  const [ExtraItems, setExtraItems] = useState([]);
  const [showSkipHistoryModal, setShowSkipHistoryModal] = useState(false);
  const [skipHistoryFilter, setSkipHistoryFilter] = useState("all");

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [sameDayReplacementWarning, setSameDayReplacementWarning] =
    useState(false);

  // New state for customization system
  const [customizationType, setCustomizationType] = useState("one-time"); // one-time, temporary, permanent
  const [customizationDates, setCustomizationDates] = useState([]);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [currentCustomization, setCurrentCustomization] = useState(null);
  const [customizations, setCustomizations] = useState([]);
  const [customizationNotes, setCustomizationNotes] = useState("");

  // Price difference warning state
  const [showPriceDifferenceWarning, setShowPriceDifferenceWarning] =
    useState(false);
  const [priceDifferenceAmount, setPriceDifferenceAmount] = useState(0);
  const [priceAcknowledged, setPriceAcknowledged] = useState(false);

  // API hooks
  const { data, isLoading, error, refetch } = useGetUserSubscriptionsQuery();
  const subscription =
    data?.data?.subscriptions?.find((sub) => sub.isActive) || {};
  console.log("subscription data is on the customization page ", subscription);

  // Get customizations for this subscription
  const { data: customizationsData, refetch: refetchCustomizations } =
    useGetCustomizationsQuery(subscription?._id, {
      skip: !subscription?._id,
    });

  const customizationsList = customizationsData?.data || [];
  console.log("Customizations data:", customizationsList);

  // Get plan details which includes add-ons and replacements
  const { data: planDetails } = useGetMealPlanQuery(
    subscription?.defaultMeal || subscription?.mealPlan,
    {
      skip: !(subscription?.defaultMeal || subscription?.mealPlan),
    }
  );
  console.log(planDetails);

  // Fetch replaceable thalis for this plan
  const { data: replaceableThalisData } = useGetReplaceableThalisQuery(
    subscription?.defaultMeal || subscription?.mealPlan,
    {
      skip: !(subscription?.defaultMeal || subscription?.mealPlan),
    }
  );

  const replaceableThalis = replaceableThalisData?.data || [];

  // Extract add-ons and replacements from plan details
  const addOns = planDetails?.data?.mealPlan?.addons || [];
  const replacementOptions = replaceableThalisData?.data || [];

  // Calculate base meal price
  const baseMealPrice = useMemo(() => {
    if (!subscription?.pricing) return 0;

    // Try to get base price per meal from subscription pricing
    if (subscription.pricing.basePricePerMeal) {
      return subscription.pricing.basePricePerMeal;
    }

    // Calculate from total pricing
    const totalAmount =
      subscription.pricing.finalAmount || subscription.pricing.totalAmount || 0;
    const duration =
      subscription.duration || subscription.pricing.totalDays || 1;
    const shiftsPerDay = subscription.mealPlan?.shifts?.length || 2; // Default to 2 shifts (morning, evening)
    const totalMeals = duration * shiftsPerDay;

    return totalMeals > 0
      ? Math.round((totalAmount / totalMeals) * 100) / 100
      : 0;
  }, [subscription]);

  // Calculate replacement price difference
  const replacementPriceDifference = useMemo(() => {
    if (!selectedReplacement || !replacementOptions.length) return 0;

    const selectedReplacementOption = replacementOptions.find(
      (r) => r._id === selectedReplacement
    );

    if (!selectedReplacementOption) return 0;

    const priceDiff = selectedReplacementOption.price - baseMealPrice;

    // Update price difference warning state
    if (priceDiff < 0) {
      setShowPriceDifferenceWarning(true);
      setPriceDifferenceAmount(Math.abs(priceDiff));
    } else {
      setShowPriceDifferenceWarning(false);
      setPriceDifferenceAmount(0);
    }

    return Math.max(0, priceDiff); // Only return positive difference for payment
  }, [selectedReplacement, replacementOptions, baseMealPrice]);

  // Skip statistics and data
  const skipStats = useMemo(() => {
    const skippedMeals = subscription?.skippedMeals || [];
    const limits = subscription?.limits || {};

    // Calculate this month's skips
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthSkips = skippedMeals.filter((skip) => {
      const skipDate = new Date(skip.date);
      return (
        skipDate.getMonth() === currentMonth &&
        skipDate.getFullYear() === currentYear
      );
    }).length;

    // Calculate total refund
    const totalRefund = skippedMeals.reduce(
      (sum, skip) => sum + (skip.refundAmount || 0),
      0
    );

    const maxSkipMeals = limits.maxSkipMeals || 8;
    const remainingSkips = Math.max(0, maxSkipMeals - thisMonthSkips);

    return {
      totalSkips: skippedMeals.length,
      thisMonthSkips,
      remainingSkips,
      totalRefund,
      maxSkipMeals,
    };
  }, [subscription]);

  const skipLimits = subscription?.limits || {};

  // Get skip history data
  const { data: skipHistoryData, isLoading: isLoadingSkipHistory } =
    useGetSkipHistoryQuery(subscription?._id, { skip: !subscription?._id });

  // Process skip history for display
  const filteredSkipHistory = useMemo(() => {
    const skipHistory = skipHistoryData?.data || [];

    // Ensure skipHistory is an array
    if (!Array.isArray(skipHistory)) {
      return [];
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (skipHistoryFilter) {
      case "this-month":
        return skipHistory.filter((skip) => {
          const skipDate = new Date(skip.date);
          return (
            skipDate.getMonth() === currentMonth &&
            skipDate.getFullYear() === currentYear
          );
        });
      case "last-month":
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear =
          currentMonth === 0 ? currentYear - 1 : currentYear;
        return skipHistory.filter((skip) => {
          const skipDate = new Date(skip.date);
          return (
            skipDate.getMonth() === lastMonth &&
            skipDate.getFullYear() === lastMonthYear
          );
        });
      default:
        return skipHistory;
    }
  }, [skipHistoryData, skipHistoryFilter]);

  // Group skip history by month
  const groupedSkipHistory = useMemo(() => {
    const grouped = {};

    // Ensure filteredSkipHistory is an array before calling forEach
    if (!Array.isArray(filteredSkipHistory)) {
      return grouped;
    }

    filteredSkipHistory.forEach((skip) => {
      const skipDate = new Date(skip.date);
      const monthKey = `${skipDate.getFullYear()}-${skipDate.getMonth()}`;
      const monthLabel = skipDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          label: monthLabel,
          skips: [],
        };
      }

      grouped[monthKey].skips.push(skip);
    });

    // Sort each group's skips by date (newest first)
    Object.values(grouped).forEach((group) => {
      group.skips.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return grouped;
  }, [filteredSkipHistory]);

  // Helper functions for managing add-ons and extra items
  const getAddOnQuantity = (addOnId) => {
    const addOn = selectedAddOns.find((item) => item.id === addOnId);
    return addOn ? addOn.quantity : 0;
  };

  const updateAddOnQuantity = (addOn, change) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((item) => item.id === addOn._id);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity + change);
        if (newQuantity === 0) {
          return prev.filter((item) => item.id !== addOn._id);
        }
        return prev.map((item) =>
          item.id === addOn._id ? { ...item, quantity: newQuantity } : item
        );
      } else if (change > 0) {
        return [
          ...prev,
          {
            id: addOn._id,
            name: addOn.name,
            price: addOn.price,
            quantity: 1,
          },
        ];
      }
      return prev;
    });
  };

  const getExtraitemsQuantity = (itemId) => {
    const item = selectedExtraItems.find((item) => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateExtraitemsQuantity = (item, change) => {
    setSelectedExtraItems((prev) => {
      const existing = prev.find((extraItem) => extraItem.id === item._id);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity + change);
        if (newQuantity === 0) {
          return prev.filter((extraItem) => extraItem.id !== item._id);
        }
        return prev.map((extraItem) =>
          extraItem.id === item._id
            ? { ...extraItem, quantity: newQuantity }
            : extraItem
        );
      } else if (change > 0) {
        return [
          ...prev,
          {
            id: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
            description: item.description,
          },
        ];
      }
      return prev;
    });
  };

  const updateExtraItem = (index, field, value) => {
    setSelectedExtraItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeExtraItem = (index) => {
    setSelectedExtraItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Mutation hooks
  const [createCustomization, { isLoading: isCustomizingMeal }] =
    useCreateCustomizationMutation();
  const [processPayment, { isLoading: isProcessingPayment }] =
    useProcessCustomizationPaymentMutation();
  const [skipMeal, { isLoading: isSkippingMeal }] = useSkipMealMutation();
  const [replaceThali, { isLoading: isReplacingThali }] =
    useReplaceThaliMutation();
  const [verifyCustomizationPayment, { isLoading: isVerifyingPayment }] =
    useVerifyCustomizationPaymentMutation();

  // Ensure Razorpay script is loaded
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = false; // Load synchronously
        document.body.appendChild(script);

        script.onload = () => {
          if (window.Razorpay) {
            resolve(true);
          } else {
            reject(new Error("Razorpay not available after script load"));
          }
        };

        script.onerror = () =>
          reject(new Error("Failed to load Razorpay script"));

        // If script is already loaded but Razorpay isn't available, wait a bit
        if (
          script.readyState === "complete" ||
          script.readyState === "loaded"
        ) {
          setTimeout(() => {
            if (window.Razorpay) {
              resolve(true);
            } else {
              reject(new Error("Razorpay not available"));
            }
          }, 100);
        }
      });
    };

    loadRazorpayScript();
  }, []);

  // Helper function to calculate per-day meal price
  const calculatePerDayMealPrice = (subscription) => {
    if (!subscription || !subscription.pricing) return 0;

    const { pricing } = subscription;
    // Calculate per day price from final amount and duration
    const totalAmount = pricing.finalAmount || pricing.totalAmount || 0;
    const duration = subscription.duration || pricing.totalDays || 1;

    return Math.round((totalAmount / duration) * 100) / 100; // Round to 2 decimal places
  };

  // Helper function to check if customization is allowed
  const canCustomizeMeal = (subscription) => {
    const perDayPrice = calculatePerDayMealPrice(subscription);
    return perDayPrice >= 60;
  };

  // Check if current subscription allows customization
  useEffect(() => {
    if (subscription && subscription._id && !canCustomizeMeal(subscription)) {
      const perDayPrice = calculatePerDayMealPrice(subscription);
      toast.error(
        `Customization is only available for meal plans with per-day price ≥ ₹60. Your current plan is ₹${perDayPrice.toFixed(
          2
        )}/day.`,
        { duration: 6000 }
      );
      // Navigate back after showing error
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    }
  }, [subscription, navigate]);

  // Handle saving thali replacement
  const handleSaveReplacement = async () => {
    if (!selectedReplacementThali) {
      toast.error("Please select a replacement thali");
      return;
    }

    try {
      const result = await replaceThali({
        subscriptionId: subscriptionId,
        replacementData: {
          replacementThaliId: selectedReplacementThali._id,
          scope: replacementScope,
          setAsDefault: setAsDefault,
        },
      }).unwrap();

      toast.success("Thali replacement saved successfully!");
      setSelectedReplacementThali(null);
      setShowReplaceThaliModal(false);
      await refetch();
    } catch (error) {
      console.error("Error saving replacement:", error);
      toast.error(
        error?.data?.message ||
          "Failed to save thali replacement. Please try again."
      );
    }
  };

  // Unified method for handling customization creation and payment
  const handleCustomizationSubmit = async () => {
    console.log("Form validation - date:", date);
    console.log("Form validation - timing:", timing);

    if (!date) {
      toast.error("Please select date");
      return;
    }

    if (!timing) {
      toast.error("Please select timing");
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate the correct payment amount
      const paymentRequired = setAsDefault
        ? paymentAmount * (subscription?.remainingMeals || 1)
        : paymentAmount;

      // Prepare customization data
      const customizationData = {
        subscriptionId,
        type: setAsDefault ? "permanent" : "one-time",
        date: date,
        shift: timing,
        dates: [
          {
            date: date,
            shift: timing,
          },
        ],
        replacementMeal: selectedReplacement || null,
        dietaryPreference,
        spiceLevel,
        preferences: {
          noOnion,
          noGarlic,
          specialInstructions,
        },
        addons: selectedAddOns,
        extraItems:
          selectedExtraItems?.length > 0
            ? selectedExtraItems.map((item) => ({
                item: item.id,
                quantity: item.quantity,
              }))
            : [],
        notes,
        setAsDefault,
        totalBillAmount: totalBillAmount,
        extraCostToPay: totalExtraCost,
        paymentAmount: paymentRequired,
      };

      console.log("Customization data being sent:", customizationData);

      const result = await createCustomization(customizationData).unwrap();

      if (!result.success) {
        throw new Error(
          result.data?.message || "Failed to create customization"
        );
      }

      // Handle payment if required
      if (paymentRequired > 0) {
        console.log(`Payment required: ₹${paymentRequired}`);

        const customizationResult =
          result.data || result.customization || result;
        setCurrentCustomization(customizationResult);
        setPaymentAmount(paymentRequired);

        // Automatically proceed to payment
        await handleCustomizationPayment(customizationResult);
      } else {
        // No payment required, customization is complete
        toast.success(
          totalExtraCost < 0
            ? `Customization saved successfully! You saved ₹${Math.abs(
                totalExtraCost
              ).toFixed(2)}`
            : "Customization saved successfully!"
        );
        resetForm();
        await refetch();
        await refetchCustomizations();
      }
    } catch (error) {
      console.error("Error creating customization:", error);
      toast.error(error?.data?.message || "Failed to create customization");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update subscription with customization data
  const updateSubscriptionWithCustomization = async (customizationData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/customizations/${
          customizationData._id
        }`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            type: customizationType,
            setAsDefault,
            preferences: {
              dietaryPreference,
              spiceLevel,
              noOnion,
              noGarlic,
              specialInstructions,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // console.log("Customization updated successfully");
        toast.success("Customization updated successfully");
      } else {
        throw new Error(result.message || "Failed to update customization");
      }
    } catch (error) {
      console.error("Failed to update customization:", error);
      toast.error(error.message || "Failed to update customization");
    }
  };

  // Handle payment for customization
  const handleCustomizationPayment = async (customizationData = null) => {
    // Check if customization is allowed based on per-day price
    if (!canCustomizeMeal(subscription)) {
      const perDayPrice = calculatePerDayMealPrice(subscription);
      toast.error(
        `Customization is only available for meal plans with per-day price ≥ ₹60. Your current plan is ₹${perDayPrice.toFixed(
          2
        )}/day.`
      );
      return;
    }

    const customization = customizationData || currentCustomization;
    // Use correct payment amount based on customization type
    const correctPaymentAmount =
      customizationType === "one-time" ? totalExtraAmount : totalExtraCost;
    const amount = paymentAmount || correctPaymentAmount;

    if (!amount || amount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    if (!customization) {
      toast.error("Customization data not available.");
      return;
    }

    try {
      setIsPaying(true);

      // Ensure Razorpay is loaded before proceeding
      await new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        // Check if script already exists
        let script = document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

        if (!script) {
          script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = false; // Load synchronously
          document.head.appendChild(script);
        }

        script.onload = () => {
          if (window.Razorpay) {
            resolve(true);
          } else {
            reject(new Error("Razorpay not available after script load"));
          }
        };

        script.onerror = () =>
          reject(new Error("Failed to load Razorpay script"));

        // If script is already loaded but Razorpay isn't available, wait a bit
        if (
          script.readyState === "complete" ||
          script.readyState === "loaded"
        ) {
          setTimeout(() => {
            if (window.Razorpay) {
              resolve(true);
            } else {
              reject(new Error("Razorpay not available"));
            }
          }, 100);
        }
      });

      // Create payment order
      const paymentResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/customizations/${
          customization._id
        }/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            paymentAmount: amount,
            paymentMethod: "razorpay",
          }),
        }
      );

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(
          paymentResult.message || "Failed to create payment order"
        );
      }

      // Handle auto-approved payments (no payment required)
      if (paymentResult.data.autoApproved || paymentResult.data.amount === 0) {
        toast.success(
          "Customization approved automatically - no payment required!"
        );

        // Update subscription with customization
        await updateSubscriptionWithCustomization(customization);

        setShowPaymentModal(false);
        setCurrentCustomization(null);
        resetForm();
        await refetch();
        setIsPaying(false);
        return;
      }

      console.log("Razorpay available:", !!window.Razorpay);
      console.log("Payment options:", {
        key: paymentResult.data.key,
        amount: paymentResult.data.amount,
        orderId: paymentResult.data.orderId,
      });

      // Validate payment data
      if (!paymentResult.data.key) {
        console.error("Missing Razorpay key in response:", paymentResult.data);
        toast.error("Payment configuration error. Please contact support.");
        setIsPaying(false);
        return;
      }

      if (!paymentResult.data.orderId) {
        console.error("Missing order ID in response:", paymentResult.data);
        toast.error("Payment order creation failed. Please try again.");
        setIsPaying(false);
        return;
      }

      const options = {
        key: paymentResult.data.key,
        amount: paymentResult.data.amount,
        currency: paymentResult.data.currency || "INR",
        name: "Tastyaana",
        description: "Meal Customization Payment",
        image: "/logo.png",
        order_id: paymentResult.data.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/customizations/${
                customization._id
              }/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              toast.success("Payment successful! Customization applied.");

              // Update subscription with customization
              await updateSubscriptionWithCustomization(customization);

              setShowPaymentModal(false);
              setCurrentCustomization(null);
              resetForm();
              await refetch();
            } else {
              throw new Error(
                verifyResult.message || "Payment verification failed"
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#F59E0B",
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsPaying(false);
    }
  };

  // Add date to temporary customization
  const addCustomizationDate = () => {
    if (!date || !timing) {
      toast.error("Please select date and timing first");
      return;
    }

    const newDate = {
      date: date,
      shift: timing,
      id: Date.now(),
    };

    setCustomizationDates((prev) => [...prev, newDate]);
    setDate("");
    setTiming("morning");
  };

  // Remove date from temporary customization
  const removeCustomizationDate = (dateId) => {
    setCustomizationDates((prev) => prev.filter((d) => d.id !== dateId));
  };

  // Reset form to initial state
  const resetForm = () => {
    setDate("");
    setTiming("morning");
    setSpiceLevel("medium");
    setDietaryPreference("vegetarian");
    setQuantity(1);
    setNotes("");
    setSpecialInstructions("");
    setNoOnion(false);
    setNoGarlic(false);
    setCustomizations([]);
    setSelectedAddOns([]);
    setSelectedExtraItems([]);
    setSelectedReplacement(null);
    // setTotalExtraCost(0);
    setCustomizationType("one-time");
    setCustomizationDates([]);
    setSetAsDefault(false);
  };

  // Handle skip meal functionality
  const handleSkipMeal = async () => {
    const errors = validateSkipDates();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setIsSkippingMealState(true);

      const skipDatesArray = generateSkipDatesArray();

      // Create the skip data in the format expected by backend
      const skipData = {
        dates: skipDatesArray.flatMap((skipDateObj) =>
          skipDateObj.shifts.map((shift) => ({
            date: skipDateObj.date,
            shift: shift,
          }))
        ),
        reason: `User requested skip from ${skipFromDate} to ${skipToDate}`,
      };

      await skipMeal({
        subscriptionId: subscriptionId,
        skipData: skipData,
      }).unwrap();

      const totalSkipped = skipData.dates.length;
      toast.success(`Successfully skipped ${totalSkipped} meals!`);

      setShowSkipModal(false);
      setSkipFromDate("");
      setSkipToDate("");
      setSkipShifts(["morning", "evening"]);
      setValidationErrors({});
      await refetch();
    } catch (error) {
      console.error("Error skipping meal:", error);
      toast.error(
        error?.data?.message || "Failed to skip meal. Please try again."
      );
    } finally {
      setIsSkippingMealState(false);
    }
  };

  // Validation helper functions
  const validateDateAndTime = (selectedDate, selectedTiming) => {
    const errors = {};

    if (!selectedDate) {
      errors.date = "Please select a date";
      return errors;
    }

    const selectedDateTime = parseISO(selectedDate);
    const now = new Date();

    // Check if date is in the past
    if (isBefore(startOfDay(selectedDateTime), startOfDay(now))) {
      errors.date = "Cannot select a past date";
      return errors;
    }

    // Same day replacement validation
    if (isSameDay(selectedDateTime, now)) {
      const currentHour = now.getHours();

      // If it's same day and timing is morning but it's already past 9 AM
      if (selectedTiming === "morning" && currentHour >= 9) {
        errors.timing =
          "Cannot replace morning meal on the same day after 9:00 AM";
        setSameDayReplacementWarning(true);
      }

      // If it's same day and timing is evening but it's already past 3 PM
      if (selectedTiming === "evening" && currentHour >= 15) {
        errors.timing =
          "Cannot replace evening meal on the same day after 3:00 PM";
        setSameDayReplacementWarning(true);
      }

      // Show warning for same day replacement
      if (!errors.timing) {
        setSameDayReplacementWarning(true);
      }
    } else {
      setSameDayReplacementWarning(false);
    }

    return errors;
  };

  const validateSkipDates = () => {
    const errors = {};

    if (!skipFromDate) {
      errors.skipFromDate = "Please select start date";
      return errors;
    }

    if (!skipToDate) {
      errors.skipToDate = "Please select end date";
      return errors;
    }

    const fromDate = parseISO(skipFromDate);
    const toDate = parseISO(skipToDate);
    const now = new Date();

    // Check if dates are in the past
    if (isBefore(startOfDay(fromDate), startOfDay(now))) {
      errors.skipFromDate = "Start date cannot be in the past";
    }

    if (isBefore(startOfDay(toDate), startOfDay(fromDate))) {
      errors.skipToDate = "End date cannot be before start date";
    }

    // Check if no shifts are selected
    if (skipShifts.length === 0) {
      errors.skipShifts = "Please select at least one shift to skip";
    }

    // Calculate total skip count
    const daysDifference =
      Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    const totalSkips = daysDifference * skipShifts.length;
    const currentSkips = subscription?.skippedMeals?.length || 0;
    const maxSkips = subscription?.limits?.maxSkipMeals || 8;

    if (currentSkips + totalSkips > maxSkips) {
      errors.skipLimit = `Cannot skip ${totalSkips} meals. You have ${
        maxSkips - currentSkips
      } skips remaining this month.`;
    }

    return errors;
  };

  // Enhanced skip functionality
  const generateSkipDatesArray = () => {
    if (!skipFromDate || !skipToDate || skipShifts.length === 0) {
      return [];
    }

    const fromDate = parseISO(skipFromDate);
    const toDate = parseISO(skipToDate);
    const skipDatesArray = [];

    let currentDate = fromDate;
    while (currentDate <= toDate) {
      skipDatesArray.push({
        date: format(currentDate, "yyyy-MM-dd"),
        shifts: [...skipShifts],
        id: `${format(currentDate, "yyyy-MM-dd")}_${skipShifts.join("_")}`,
      });
      currentDate = addDays(currentDate, 1);
    }

    return skipDatesArray;
  };

  // Handle shift selection for skip
  const handleSkipShiftToggle = (shift) => {
    setSkipShifts((prev) => {
      if (prev.includes(shift)) {
        return prev.filter((s) => s !== shift);
      } else {
        return [...prev, shift];
      }
    });
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = validateDateAndTime(date, timing);

    if (customizationType === "temporary" && customizationDates.length === 0) {
      errors.customizationDates =
        "Please select dates for temporary customization";
    }

    if (showPriceDifferenceWarning && !priceAcknowledged) {
      errors.priceAcknowledgment =
        "Please acknowledge the price difference policy";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is valid before submission
  const isFormValid = () => {
    const errors = {};

    if (!date && !selectedDate) {
      errors.date = "Please select a date";
    }

    if (!timing) {
      errors.timing = "Please select a timing";
    }

    if (customizationType === "temporary" && customizationDates.length === 0) {
      errors.customizationDates =
        "Please select dates for temporary customization";
    }

    // Check price difference acknowledgment for cheaper replacement meals
    if (showPriceDifferenceWarning && !priceAcknowledged) {
      errors.priceAcknowledgment =
        "Please acknowledge the price difference policy to continue";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate total extra amount from selected items
  const totalExtraAmount = useMemo(() => {
    let total = 0;

    // Add selected addons cost
    if (selectedAddOns && selectedAddOns.length > 0) {
      total += selectedAddOns.reduce((sum, addon) => {
        return sum + (addon.price || 0);
      }, 0);
    }

    // Add selected extra items cost
    if (selectedExtraItems && selectedExtraItems.length > 0) {
      total += selectedExtraItems.reduce((sum, item) => {
        return sum + (item.price || 0);
      }, 0);
    }

    // Add customization costs
    if (customizations && customizations.length > 0) {
      total += customizations.reduce((sum, custom) => {
        return sum + (custom.additionalCost || 0);
      }, 0);
    }

    return total;
  }, [selectedAddOns, selectedExtraItems, customizations]);

  // Calculate addon total
  const addonTotal = useMemo(() => {
    if (!selectedAddOns || selectedAddOns.length === 0) return 0;
    return selectedAddOns.reduce(
      (total, addon) => total + (addon.price || 0),
      0
    );
  }, [selectedAddOns]);

  // Calculate extra items total
  const extraItemsTotal = useMemo(() => {
    if (!selectedExtraItems || selectedExtraItems.length === 0) return 0;
    return selectedExtraItems.reduce(
      (total, item) => total + (item.price || 0),
      0
    );
  }, [selectedExtraItems]);

  // Calculate customization total
  const customizationTotal = useMemo(() => {
    if (!customizations || customizations.length === 0) return 0;
    return customizations.reduce(
      (total, custom) => total + (custom.additionalCost || 0),
      0
    );
  }, [customizations]);

  // Calculate total extra cost (amount above base meal price) - FIXED CALCULATION
  const totalExtraCost = useMemo(() => {
    let extraCost = 0;

    // Calculate replacement cost difference (can be positive or negative)
    if (selectedReplacement) {
      const selectedReplacementOption = replacementOptions.find(
        (r) => r._id === selectedReplacement
      );
      if (selectedReplacementOption) {
        const replacementDiff = selectedReplacementOption.price - baseMealPrice;
        extraCost += replacementDiff; // Include negative values (cheaper replacements)
      }
    }

    // Add addon costs (full amount since addons are always extra)
    if (selectedAddOns && selectedAddOns.length > 0) {
      extraCost += selectedAddOns.reduce((sum, addon) => {
        return sum + (addon.price * addon.quantity || 0);
      }, 0);
    }

    // Add extra items costs (full amount since extra items are always extra)
    if (selectedExtraItems && selectedExtraItems.length > 0) {
      extraCost += selectedExtraItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity || 0);
      }, 0);
    }

    // Return the actual extra cost (can be negative for cheaper replacements + extras)
    return extraCost;
  }, [
    selectedReplacement,
    replacementOptions,
    baseMealPrice,
    selectedAddOns,
    selectedExtraItems,
  ]);

  // Calculate total bill amount (base + extras) - FIXED
  const totalBillAmount = useMemo(() => {
    let total = baseMealPrice; // Start with base meal price

    // If replacement is selected, replace the base price
    if (selectedReplacement) {
      const selectedReplacementOption = replacementOptions.find(
        (r) => r._id === selectedReplacement
      );
      if (selectedReplacementOption) {
        total = selectedReplacementOption.price; // Replace base price with replacement price
      }
    }

    // Add addon costs
    if (selectedAddOns && selectedAddOns.length > 0) {
      total += selectedAddOns.reduce((sum, addon) => {
        return sum + (addon.price * addon.quantity || 0);
      }, 0);
    }

    // Add extra items costs
    if (selectedExtraItems && selectedExtraItems.length > 0) {
      total += selectedExtraItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity || 0);
      }, 0);
    }

    return total;
  }, [
    baseMealPrice,
    selectedReplacement,
    replacementOptions,
    selectedAddOns,
    selectedExtraItems,
  ]);

  // Calculate payment amount (only positive extra costs)
  const PaymentAmount = useMemo(() => {
    setPaymentAmount(Math.max(0, totalExtraCost));
    return Math.max(0, totalExtraCost); // Only pay if there's extra cost
  }, [totalExtraCost]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Tiffin Subscription · Meal Customization
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              Customize today’s meal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Apna daily tiffin kisi bhi available item se replace karo – add-ons, extra items, taste
              preferences sab ek hi jagah se control karo.
            </p>
          </div>

          {subscription && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col gap-1 min-w-[220px]">
              <div className="text-xs text-slate-500">Current plan</div>
              <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                {subscription?.mealPlan?.title || "Your Tiffin Plan"}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>
                  Per-meal:{" "}
                  <span className="font-semibold text-amber-600">
                    ₹{baseMealPrice?.toFixed(2) || "0.00"}
                  </span>
                </span>
                <span>
                  Remaining:{" "}
                  <span className="font-semibold">
                    {subscription?.remainingMeals || "--"} meals
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Steps to customize */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: Date & time */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                    1
                  </span>
                  Choose date & shift
                </h2>
              </div>

              {/* Same Day Replacement Warning */}
              {sameDayReplacementWarning && (
                <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-800">
                        Same day change notice
                      </p>
                      <p className="text-xs sm:text-[13px] text-yellow-700 mt-1">
                        Aaj ke meal ke liye customization kar rahe ho:
                      </p>
                      <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside space-y-0.5">
                        <li>Morning meal 9:00 AM ke baad replace nahi hoga</li>
                        <li>Evening meal 3:00 PM ke baad replace nahi hoga</li>
                        <li>Same-day changes hamesha guaranteed nahi hote</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (validationErrors.date) {
                          setValidationErrors((prev) => ({ ...prev, date: undefined }));
                        }
                      }}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500 ${
                        validationErrors.date
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white"
                      }`}
                    />
                  </div>
                  {validationErrors.date && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.date}</p>
                  )}
                </div>

                {/* Timing */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Shift <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={timing}
                    onChange={(e) => {
                      setTiming(e.target.value);
                      if (validationErrors.timing) {
                        setValidationErrors((prev) => ({ ...prev, timing: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm shadow-sm focus:ring-amber-500 focus:border-amber-500 ${
                      validationErrors.timing
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {subscription?.mealPlan?.shifts?.length
                      ? subscription.mealPlan.shifts.map((shift) => (
                          <option key={shift} value={shift}>
                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                          </option>
                        ))
                      : [
                          <option key="morning" value="morning">
                            Morning
                          </option>,
                          <option key="evening" value="evening">
                            Evening
                          </option>,
                        ]}
                  </select>
                  {validationErrors.timing && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.timing}</p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 2: Replace main thali */}
            {replacementOptions?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                      2
                    </span>
                    Choose your thali (optional)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {replacementOptions.map((replacement) => {
                    const isSelected = selectedReplacement === replacement._id;
                    const imageUrl =
                      replacement.image ||
                      replacement.imageUrl ||
                      replacement.photo ||
                      "https://images.unsplash.com/photo-1604908176997-1251884b08a3?w=400&auto=format&fit=crop&q=80";

                    return (
                      <button
                        key={replacement._id}
                        type="button"
                        onClick={() =>
                          setSelectedReplacement(
                            isSelected ? null : replacement._id
                          )
                        }
                        className={`flex items-stretch gap-3 w-full text-left rounded-xl border p-3 transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-amber-300"
                        }`}
                      >
                        {/* Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={replacement.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {replacement.name}
                            </p>
                            {replacement.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {replacement.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="text-xs text-slate-500">
                              Base: ₹{baseMealPrice.toFixed(2)}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-amber-700">
                                ₹{replacement.price}
                              </p>
                              {replacement.price < baseMealPrice && (
                                <p className="text-[11px] text-green-600">
                                  Save ₹
                                  {(baseMealPrice - replacement.price).toFixed(2)}
                                </p>
                              )}
                              {replacement.price > baseMealPrice && (
                                <p className="text-[11px] text-amber-600">
                                  +₹
                                  {(replacement.price - baseMealPrice).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Price Difference Warning */}
                {showPriceDifferenceWarning && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-yellow-800">
                          Cheaper thali selected
                        </p>
                        <p className="text-xs sm:text-[13px] text-yellow-700 mt-1">
                          Aapne jo thali select ki hai woh aapke base meal se ₹
                          {priceDifferenceAmount.toFixed(2)} sasti hai. Yeh
                          difference amount **refund nahi** hoga – per-meal
                          deduction fir bhi ₹{baseMealPrice.toFixed(2)} hoga.
                        </p>
                        <label className="mt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={priceAcknowledged}
                            onChange={(e) => setPriceAcknowledged(e.target.checked)}
                            className="h-4 w-4 text-amber-600 rounded border-slate-300"
                          />
                          <span className="text-xs sm:text-[13px] text-yellow-800">
                            Mujhe samajh aa gaya hai ki yeh difference refund nahi
                            milega
                          </span>
                        </label>
                        {validationErrors.priceAcknowledgment && (
                          <p className="mt-1 text-xs text-red-600">
                            {validationErrors.priceAcknowledgment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Taste & dietary preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                  3
                </span>
                Taste & dietary preferences
              </h2>

              {/* Dietary & spice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diet type */}
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Diet type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["regular", "vegetarian", "jain"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDietaryPreference(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          dietaryPreference === type
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {type === "regular"
                          ? "Regular"
                          : type === "vegetarian"
                          ? "Vegetarian"
                          : "Jain-friendly"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spice level */}
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Spice level
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["low", "medium", "high"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSpiceLevel(level)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          spiceLevel === level
                            ? "bg-amber-50 border-amber-500 text-amber-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {level === "low"
                          ? "Less spicy"
                          : level === "medium"
                          ? "Normal"
                          : "Extra spicy"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* No onion / garlic + instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">
                    Special restrictions
                  </p>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={noOnion}
                      onChange={(e) => setNoOnion(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                    />
                    No onion
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={noGarlic}
                      onChange={(e) => setNoGarlic(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                    />
                    No garlic
                  </label>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1.5">
                    Kitchen instructions
                  </p>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="E.g. 'Thoda kam oil', 'Rice instead of roti'..."
                  />
                </div>
              </div>
            </div>

            {/* STEP 4: Add-ons */}
            {addOns?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                      4
                    </span>
                    Add-ons (optional)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addOns.map((addOn) => {
                    const qty = getAddOnQuantity(addOn._id) || 0;
                    const imageUrl =
                      addOn.image ||
                      addOn.imageUrl ||
                      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80";

                    return (
                      <div
                        key={addOn._id}
                        className={`p-3 sm:p-4 rounded-xl border flex gap-3 transition ${
                          qty > 0
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-amber-300"
                        }`}
                      >
                        {/* Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={addOn.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info + controls */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {addOn.name}
                            </p>
                            {addOn.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {addOn.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between">
                            <div className="text-[11px] text-slate-500">
                              ₹{addOn.price} per item
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAddOnQuantity(addOn, -1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAddOnQuantity(addOn, 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm hover:bg-amber-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Extra items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                    5
                  </span>
                  Extra items (optional)
                </h2>
              </div>

              {ExtraItems?.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500">
                  Abhi is meal plan ke liye extra items available nahi hain. Agar tum in future
                  custom items add karoge to yahi dikh jayenge.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ExtraItems?.map((item) => {
                    const qty = getExtraitemsQuantity(item._id) || 0;
                    const imageUrl =
                      item.image ||
                      item.imageUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";

                    return (
                      <div
                        key={item._id}
                        className={`p-3 sm:p-4 rounded-xl border flex gap-3 transition ${
                          qty > 0
                            ? "border-amber-500 bg-amber-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-amber-300"
                        }`}
                      >
                        {/* Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info + controls */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <div className="text-[11px] text-slate-500">
                              ₹{item.price} per thali
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateExtraitemsQuantity(item, -1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-semibold">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateExtraitemsQuantity(item, 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm hover:bg-amber-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes + Set as default */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notes */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1.5">
                    Extra notes (optional)
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="E.g. 'Deliver to gate', 'Call before reaching', etc."
                  />
                </div>

                {/* Default toggle */}
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 flex gap-3">
                  <div className="mt-1">
                    <input
                      id="set-as-default"
                      type="checkbox"
                      checked={setAsDefault}
                      onChange={(e) => setSetAsDefault(e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded border-slate-300"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="set-as-default"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Save as default for all future meals
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Agar ye on hai, to ye hi taste, replacement aur add-ons poore
                      subscription ke remaining meals par apply honge. Extra amount (agar koi hai)
                      har future meal ke liye charge hoga.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom summary + action bar (left column width) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 sticky bottom-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {paymentAmount > 0 ? "Extra amount to pay" : "No extra payment required"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700">
                    ₹{paymentAmount.toFixed(2)}
                  </p>
                  {setAsDefault && paymentAmount > 0 && (
                    <p className="text-[11px] text-slate-500">
                      × {subscription?.remainingMeals || 0} meals ={" "}
                      <span className="font-semibold">
                        ₹{(paymentAmount * (subscription?.remainingMeals || 0)).toFixed(2)}
                      </span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total bill for this meal: ₹{totalBillAmount.toFixed(2)}{" "}
                    {totalExtraCost !== 0 && (
                      <span>
                        (Base: ₹{baseMealPrice.toFixed(2)}
                        {totalExtraCost > 0 ? " + Extra: " : " · Saved: "}₹
                        {Math.abs(totalExtraCost).toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={handleCustomizationSubmit}
                  disabled={isSubmitting || !date || !timing}
                  className="inline-flex items-center justify-center px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : paymentAmount > 0 ? (
                    setAsDefault ? (
                      `Pay ₹${(
                        paymentAmount * (subscription?.remainingMeals || 1)
                      ).toFixed(2)} & set default`
                    ) : (
                      `Pay ₹${paymentAmount.toFixed(2)} & customize`
                    )
                  ) : totalExtraCost < 0 ? (
                    "Save customization (you save money)"
                  ) : (
                    "Save customization (free)"
                  )}
                </button>
              </div>

              {/* Debug info – useful while testing */}
              <div className="mt-2 text-[10px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                Debug: Base ₹{baseMealPrice} · Replacement ₹
                {selectedReplacement
                  ? replacementOptions.find((r) => r._id === selectedReplacement)?.price
                  : 0}{" "}
                · Extra items ₹
                {selectedExtraItems.reduce(
                  (sum, item) => sum + (item.price * item.quantity || 0),
                  0
                )}{" "}
                · Total extra ₹{totalExtraCost} · Payment ₹{paymentAmount}
              </div>
            </div>
          </div>

          {/* RIGHT: Summary + skip + history */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">
                Order summary
              </h2>

              <div className="space-y-4 text-sm">
                {/* Plan */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Subscription plan
                  </p>
                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 line-clamp-2">
                        {subscription?.mealPlan?.title || "Your Tiffin Plan"}
                      </p>
                      {selectedReplacement && (
                        <p className="text-xs text-amber-700 mt-0.5">
                          Replacing with:{" "}
                          {
                            replacementOptions.find(
                              (r) => r._id === selectedReplacement
                            )?.name
                          }
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ₹{baseMealPrice.toFixed(2)}
                        {replacementPriceDifference > 0 && (
                          <span className="text-[11px] text-amber-700 ml-1">
                            (+₹{replacementPriceDifference.toFixed(2)})
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {subscription?.pricing?.totalThali} thali ×{" "}
                        {subscription?.duration} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & time */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Selected slot
                  </p>
                  <p className="text-sm text-slate-800">
                    {date ? format(parseISO(date), "EEEE, MMM d") : "Not selected"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {timing
                      ? `${timing.charAt(0).toUpperCase() + timing.slice(1)} shift`
                      : "No time selected"}
                  </p>
                </div>

                {/* Add-ons summary */}
                {selectedAddOns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Add-ons</p>
                    <div className="space-y-1.5">
                      {selectedAddOns.map((addOnItem) => {
                        const addOn = addOns.find((a) => a._id === addOnItem.id);
                        if (!addOn) return null;
                        return (
                          <div
                            key={addOn._id}
                            className="flex justify-between text-xs text-slate-700"
                          >
                            <span>
                              {addOnItem.quantity} × {addOn.name}
                            </span>
                            <span className="font-medium">
                              ₹
                              {(
                                (addOn.price || 0) * (addOnItem.quantity || 1)
                              ).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Extra items summary */}
                {selectedExtraItems?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Extra items
                    </p>
                    <div className="space-y-1.5">
                      {selectedExtraItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs text-slate-700"
                        >
                          <div className="flex-1">
                            <p className="line-clamp-1">
                              {item.quantity} × {item.name || "Custom item"}
                            </p>
                          </div>
                          <p className="font-medium">
                            ₹{(item.price || 0) * (item.quantity || 1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total extras</span>
                    <span className="text-amber-700">
                      ₹{Math.max(0, totalExtraCost).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {setAsDefault && totalExtraCost > 0
                      ? `Ye extra amount har remaining meal par apply hoga.`
                      : `Ye charge sirf is meal ke liye apply hoga (agar "Set default" off hai).`}
                  </p>
                </div>
              </div>
            </div>

            {/* Skip meals card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Skip meals
                </h2>
                <button
                  onClick={() => setShowSkipHistoryModal(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <FaHistory className="text-xs" />
                  History
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Single ya multiple days ke liye morning / evening shift ko skip kar sakte ho.
              </p>

              {/* Skip stats */}
              <div className="mb-3 p-3 rounded-xl bg-slate-50 text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span>Skips this month</span>
                  <span className="font-semibold">
                    {skipStats.thisMonthSkips}/{skipLimits.maxSkipMeals || 8}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining skips</span>
                  <span className="font-semibold text-emerald-600">
                    {skipStats.remainingSkips}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total skipped</span>
                  <span className="font-semibold">{skipStats.totalSkips}</span>
                </div>
              </div>

              <button
                onClick={() => setShowSkipModal(true)}
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-800 flex items-center justify-center gap-2"
              >
                <FaTimes className="text-xs" />
                Skip upcoming meals
              </button>
            </div>

            {/* Customization history (sidebar) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FaHistory className="text-amber-600" />
                  Customization history
                </h2>
                <button
                  onClick={() => refetchCustomizations()}
                  className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <FaSpinner className="text-[10px]" />
                  Refresh
                </button>
              </div>

              {customizationsList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">
                  Abhi tak koi customization nahi kiya. Upar se apna pehla customization
                  save karo, yahan history dikhegi.
                </p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {customizationsList.map((customization) => (
                    <div
                      key={customization._id}
                      className="border border-slate-100 rounded-xl p-3 bg-slate-50"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                            {customization.type}
                          </span>
                          <p className="text-xs text-slate-700 mt-1">
                            {customization.shift} •{" "}
                            {customization.dietaryPreference || "regular"}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {customization.createdAt
                            ? new Date(customization.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>

                      {customization.date && (
                        <p className="mt-1 text-[11px] text-slate-700">
                          📅{" "}
                          {new Date(customization.date).toLocaleDateString()}
                        </p>
                      )}

                      {/* Replacement */}
                      {customization.replacementMeal && (
                        <p className="mt-1 text-[11px] text-emerald-700">
                          🔄 Replacement:{" "}
                          {(() => {
                            if (customization.replacementMeal.name) {
                              return customization.replacementMeal.name;
                            }
                            const replacementId =
                              typeof customization.replacementMeal === "string"
                                ? customization.replacementMeal
                                : customization.replacementMeal._id ||
                                  customization.replacementMeal.$oid;
                            if (replacementId && replacementOptions.length > 0) {
                              const found = replacementOptions.find(
                                (r) => r._id === replacementId
                              );
                              if (found) return found.name;
                            }
                            return (
                              customization.replacementMeal.title ||
                              customization.replacementMealName ||
                              "Custom meal"
                            );
                          })()}
                        </p>
                      )}

                      {/* Add-ons */}
                      {customization.addons?.length > 0 && (
                        <p className="mt-1 text-[11px] text-purple-700">
                          ➕ Add-ons:{" "}
                          {customization.addons
                            .map((addon) => {
                              const addonName =
                                addon.name ||
                                addon.item?.name ||
                                addon.title ||
                                "Add-on";
                              const addonQty = addon.quantity || 1;
                              return `${addonName} (${addonQty}x)`;
                            })
                            .join(", ")}{" "}
                          (₹
                          {(
                            customization.addonPrice ||
                            customization.addons.reduce((sum, addon) => {
                              const price = addon.price || addon.item?.price || 0;
                              const qty = addon.quantity || 1;
                              return sum + price * qty;
                            }, 0)
                          ).toFixed(2)}
                          )
                        </p>
                      )}

                      {/* Extra items */}
                      {customization.extraItems?.length > 0 && (
                        <p className="mt-1 text-[11px] text-orange-700">
                          🍽️ Extra:{" "}
                          {customization.extraItems
                            .map((extraItem) => {
                              const name =
                                extraItem.name ||
                                extraItem.item?.name ||
                                extraItem.title ||
                                "Item";
                              const qty = extraItem.quantity || 1;
                              return `${name} (${qty}x)`;
                            })
                            .join(", ")}{" "}
                          (₹
                          {(
                            customization.extraItemPrice ||
                            customization.extraItemsPrice ||
                            customization.extraItems.reduce((sum, item) => {
                              const price = item.price || item.item?.price || 0;
                              const qty = item.quantity || 1;
                              return sum + price * qty;
                            }, 0)
                          ).toFixed(2)}
                          )
                        </p>
                      )}

                      {/* Notes */}
                      {customization.notes && (
                        <p className="mt-1 text-[11px] text-slate-700 italic">
                          💬 "{customization.notes}"
                        </p>
                      )}

                      {/* Payment status */}
                      <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-800">
                          Total: ₹
                          {(
                            customization.totalPayablePrice ||
                            customization.totalpayablePrice ||
                            customization.totalPrice ||
                            customization.paymentAmount ||
                            0
                          ).toFixed(2)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            customization.paymentStatus === "paid" ||
                            customization.paymentStatus === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : customization.paymentStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {customization.paymentStatus === "paid" ||
                          customization.paymentStatus === "completed"
                            ? "✅ Paid"
                            : customization.paymentStatus === "pending"
                            ? "⏳ Pending"
                            : customization.paymentStatus || "Status unknown"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Skip Meal Modal (same logic, better UX already) */}
      <Dialog
        open={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b bg-slate-50">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                <FaTimes className="text-red-600" />
              </div>
              <div>
                <Dialog.Title className="text-sm sm:text-base font-semibold text-slate-900">
                  Skip upcoming meals
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date range select karo, phir morning / evening shift choose karo – baaki hum
                  handle kar lenge.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    From date *
                  </label>
                  <input
                    type="date"
                    value={skipFromDate}
                    onChange={(e) => {
                      setSkipFromDate(e.target.value);
                      if (validationErrors.skipFromDate) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          skipFromDate: undefined,
                        }));
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-red-500 focus:border-red-500 ${
                      validationErrors.skipFromDate
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                  {validationErrors.skipFromDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.skipFromDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    To date *
                  </label>
                  <input
                    type="date"
                    value={skipToDate}
                    onChange={(e) => {
                      setSkipToDate(e.target.value);
                      if (validationErrors.skipToDate) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          skipToDate: undefined,
                        }));
                      }
                    }}
                    min={skipFromDate || new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-red-500 focus:border-red-500 ${
                      validationErrors.skipToDate
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                  {validationErrors.skipToDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.skipToDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Shift selection */}
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Shifts to skip *
                </p>
                <div className="flex flex-wrap gap-2">
                  {(subscription?.mealPlan?.shifts || ["morning", "evening"]).map(
                    (shift) => (
                      <label
                        key={shift}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs cursor-pointer transition ${
                          skipShifts.includes(shift)
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={skipShifts.includes(shift)}
                          onChange={() => handleSkipShiftToggle(shift)}
                          className="mr-2 h-3.5 w-3.5 text-red-600 rounded border-slate-300"
                        />
                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                      </label>
                    )
                  )}
                </div>
                {validationErrors.skipShifts && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.skipShifts}
                  </p>
                )}
              </div>

              {/* Summary */}
              {skipFromDate && skipToDate && skipShifts.length > 0 && (
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl text-[11px] space-y-1.5">
                  {(() => {
                    const fromDate = parseISO(skipFromDate);
                    const toDate = parseISO(skipToDate);
                    const days =
                      Math.ceil(
                        (toDate.getTime() - fromDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1;
                    const totalSkips = days * skipShifts.length;
                    const currentSkips =
                      subscription?.skippedMeals?.length || 0;
                    const maxSkips = subscription?.limits?.maxSkipMeals || 8;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Days selected</span>
                          <span className="font-semibold">{days} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shifts per day</span>
                          <span className="font-semibold">
                            {skipShifts.join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total meals to skip</span>
                          <span className="font-semibold">{totalSkips}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5">
                          <span>Current skips this month</span>
                          <span className="font-semibold">
                            {currentSkips}/{maxSkips}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining after skip</span>
                          <span
                            className={`font-semibold ${
                              maxSkips - currentSkips - totalSkips < 0
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {Math.max(
                              0,
                              maxSkips - currentSkips - totalSkips
                            )}
                            /{maxSkips}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {validationErrors.skipLimit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {validationErrors.skipLimit}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-3 bg-slate-50 flex flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleSkipMeal}
                disabled={
                  isSkippingMealState ||
                  Object.keys(validateSkipDates()).length > 0
                }
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSkippingMealState ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Skipping...
                  </>
                ) : (
                  "Confirm skip"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSkipModal(false);
                  setValidationErrors({});
                  setSkipFromDate("");
                  setSkipToDate("");
                  setSkipShifts(["morning", "evening"]);
                }}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Payment Modal */}
      <Dialog
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b bg-slate-50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                <FaMoneyBillWave className="text-amber-600" />
              </div>
              <div>
                <Dialog.Title className="text-sm sm:text-base font-semibold text-slate-900">
                  Payment required
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add-ons, extra items aur upgraded thali ke liye extra payment lagega.
                </p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  Total payable now
                </span>
                <span className="text-xl font-bold text-amber-600">
                  ₹{paymentAmount}
                </span>
              </div>
              {setAsDefault && (
                <p className="text-[11px] text-slate-500">
                  Ye amount har remaining meal ke liye apply hoga – is payment me woh sab
                  include hai.
                </p>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 flex flex-row-reverse gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!canCustomizeMeal(subscription)) {
                    const perDayPrice = calculatePerDayMealPrice(subscription);
                    toast.error(
                      `Customization sirf un plans ke liye available hai jinka per-day price ≥ ₹60 ho. Aapka plan: ₹${perDayPrice.toFixed(
                        2
                      )}/day.`
                    );
                    return;
                  }
                  handleCustomizationPayment();
                }}
                disabled={isPaying || !canCustomizeMeal(subscription)}
                className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  canCustomizeMeal(subscription) && !isPaying
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-slate-300 text-slate-600"
                }`}
              >
                {isPaying ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Proceed to payment"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Skip History Modal (layout same, just wrapped nicely) */}
      <Dialog
        open={showSkipHistoryModal}
        onClose={() => setShowSkipHistoryModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div>
                <Dialog.Title className="text-sm sm:text-base font-semibold text-slate-900">
                  Skip history
                </Dialog.Title>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pehle kab kab meals skip kiye, sab record yahan milega.
                </p>
              </div>
              <button
                onClick={() => setShowSkipHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 border-b bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-blue-600">
                    {skipStats.totalSkips}
                  </p>
                  <p className="text-xs text-slate-600">Total skipped</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">
                    {skipStats.thisMonthSkips}
                  </p>
                  <p className="text-xs text-slate-600">This month</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-600">
                    {skipStats.remainingSkips}
                  </p>
                  <p className="text-xs text-slate-600">Remaining this month</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b">
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setSkipHistoryFilter("all")}
                  className={`px-3 py-1.5 rounded-full font-medium ${
                    skipHistoryFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All time
                </button>
                <button
                  onClick={() => setSkipHistoryFilter("this-month")}
                  className={`px-3 py-1.5 rounded-full font-medium ${
                    skipHistoryFilter === "this-month"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  This month
                </button>
                <button
                  onClick={() => setSkipHistoryFilter("last-month")}
                  className={`px-3 py-1.5 rounded-full font-medium ${
                    skipHistoryFilter === "last-month"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Last month
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingSkipHistory ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-600">
                  <FaSpinner className="animate-spin mr-2" />
                  Loading skip history...
                </div>
              ) : Object.keys(groupedSkipHistory).length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  <FaCalendarAlt className="mx-auto text-slate-300 text-3xl mb-3" />
                  {skipHistoryFilter === "all"
                    ? "Abhi tak koi meal skip nahi kiya."
                    : skipHistoryFilter === "this-month"
                    ? "Is month koi meal skip nahi hua."
                    : "Last month koi meal skip nahi hua."}
                </div>
              ) : (
                <div className="space-y-6 text-xs sm:text-sm">
                  {Object.entries(groupedSkipHistory).map(([key, group]) => (
                    <div key={key} className="space-y-2">
                      <h3 className="font-semibold text-slate-800">
                        {group.label}
                      </h3>
                      <div className="space-y-1.5">
                        {group.skips.map((skip, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between bg-slate-50"
                          >
                            <div>
                              <p className="text-slate-800">
                                {new Date(skip.date).toLocaleDateString()} •{" "}
                                {skip.shifts?.join(", ") ||
                                  skip.shift ||
                                  "—"}
                              </p>
                              {skip.reason && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {skip.reason}
                                </p>
                              )}
                            </div>
                            {skip.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  skip.status === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : skip.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {skip.status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}


export default CustomizePage;
