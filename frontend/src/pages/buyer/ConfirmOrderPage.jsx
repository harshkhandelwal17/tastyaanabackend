import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  useCreateOrderMutation,
  useCreateSubscriptionMutation,
  useGetProfileQuery,
  useGetWalletBalanceQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} from "../../redux/storee/api";
import { clearCart } from "../../redux/cartSlice";
import RazorpayPayment from "../../layout/RazorPayComponent";
import CouponInput from "../../components/CouponInput";
import {
  CreditCard,
  Smartphone,
  MapPin,
  Mail,
  Shield,
  CheckCircle,
  Edit3,
  Loader,
  Wallet,
  Calendar,
  RefreshCw,
  Tag,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- State Hooks ---
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);
  const [orderDataForRazorpay, setOrderDataForRazorpay] = useState(null);
  const [customerDetailsForRazorpay, setCustomerDetailsForRazorpay] =
    useState(null);
  const [subscriptionDataForRazorpay, setSubscriptionDataForRazorpay] =
    useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoTriggerPayment, setAutoTriggerPayment] = useState(false);
  const [editMode, setEditMode] = useState({ address: false, contact: false });

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Coupon handling functions
  const handleCouponApplied = (couponData) => {
    setAppliedCoupon(couponData);
    setCouponDiscount(couponData.discount || 0);
    toast.success(
      `Coupon ${couponData.coupon.code} applied! You saved ₹${couponData.discount}`
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast.success("Coupon removed");
  };

  // --- Data Extraction from Previous Page ---
  const { orderData, mealPlanTitle, mealPlanImage } = location.state || {};

  // --- Redux State ---
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  // --- RTK Query Hooks ---
  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Handle profile loading error and create fallback profile
  const effectiveProfile = useMemo(() => {
    if (profile) {
      return profile;
    }

    // Create fallback profile from user data
    if (user) {
      return {
        name: user.name || user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || {
          street: "",
          city: "Indore",
          state: "Madhya Pradesh",
          pincode: "",
        },
      };
    }

    return null;
  }, [profile, user]);

  // Handle profile loading error
  useEffect(() => {
    if (profileError) {
      console.error("Profile loading error:", profileError);
      if (profileError.status === 401) {
        toast.error("Please login again to continue.");
      }
    }
  }, [profileError]);

  // Initialize orderState when effectiveProfile is available
  useEffect(() => {
    if (effectiveProfile || user) {
      // Extract data from orderData or use defaults
      const {
        mealPlan,
        planType,
        quantity = 1,
        startDate,
        startShift = "evening",
        addOns = [],
        customAddOns = [],
        extraItems = [],
        customizations = {},
        totalPrice = 0,
        timing = {},
        planDetails = {},
      } = orderData || {};

      // Calculate pricing
      const total = totalPrice;
      const gst = total * 0.05; // 5% GST
      const packagingCharges = 10; // Fixed packaging charges
      const subtotal = Math.max(0, total - gst - packagingCharges);

      // Calculate final total with coupon discount
      const finalTotal = Math.max(0, total - couponDiscount);

      // Format delivery slot based on timing
      const deliverySlot =
        startShift === "morning"
          ? "08:00 AM - 11:00 AM"
          : "06:00 PM - 09:00 PM";

      // Use effectiveProfile for customer data
      const customerProfile = effectiveProfile || {};

      const newOrderState = {
        customer: {
          name:
            customerProfile.name ||
            user?.name ||
            user?.username ||
            "Guest User",
          email: customerProfile.email || user?.email || "",
          phone: customerProfile.phone || user?.phone || "",
          address: {
            street:
              customerProfile.address?.street || user?.address?.street || "",
            city:
              customerProfile.address?.city || user?.address?.city || "Indore",
            state:
              customerProfile.address?.state ||
              user?.address?.state ||
              "Madhya Pradesh",
            pincode:
              customerProfile.address?.pincode || user?.address?.pincode || "",
          },
        },
        // Meal plan details
        mealPlanId: mealPlan,
        planType: planType,
        planDetails: planDetails,
        quantity: quantity,

        // Add-ons and customizations
        selectedAddOns: addOns.map((addOn) => ({
          ...addOn,
          price: addOn.perTiffinPrice * quantity,
        })),
        customAddOns: customAddOns,
        extraItems: extraItems,
        customizations: customizations.preferences || [],
        dietaryPreference: (
          customizations.dietaryPreference || "vegetarian"
        ).toLowerCase(),

        // Delivery details
        deliveryDate: startDate || new Date().toISOString().split("T")[0],
        deliverySlot: deliverySlot,
        timing: timing,

        // Pricing
        total: finalTotal,
        subtotal: subtotal,
        gst: gst,
        packagingCharges: packagingCharges,
        originalTotal: total,
        couponDiscount: couponDiscount,

        // Additional info
        mealPlanTitle: mealPlanTitle || "Meal Plan",
        startShift: startShift,

        // Original data for reference
        originalData: orderData,
      };

      setOrderState(newOrderState);
    }
  }, [effectiveProfile, user, orderData, mealPlanTitle, couponDiscount]);
  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [createSubscription, { isLoading: isCreatingSubscription }] =
    useCreateSubscriptionMutation();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const planOptions = useMemo(
    () => ({
      oneday: { duration: "1 Day", days: 1 },
      tendays: { duration: "10 Days", days: 10 },
      thirtydays: { duration: "30 Days", days: 30 },
    }),
    []
  );

  // --- Component State Initialization ---
  const [orderState, setOrderState] = useState(null);
  // console.log("order data is on confirmorderpage.jsx : ", orderData);
  const [subscriptionSettings, setSubscriptionSettings] = useState(() => {
    // Get timing from orderData or use defaults
    const timing = orderData?.timing || {};
    const startShift = orderData?.startShift || "evening";

    // Initialize delivery timing with default values
    const deliveryTiming = orderData?.deliveryTiming;

    // If we have specific timing from orderData, use that

    return {
      isSubscription: true,
      mealTiming: deliveryTiming,
      startDate:
        orderData?.startDate ||
        new Date(new Date().setDate(new Date().getDate() + 1))
          .toISOString()
          .split("T")[0],
      autoRenewal:
        orderData?.autoRenewal !== undefined ? orderData.autoRenewal : true,
      minimumWalletBalance: orderData?.minimumWalletBalance || 500,
      deliveryDays: (() => {
        // If orderData has deliveryDays, use them
        if (orderData?.deliveryDays) {
          return orderData.deliveryDays;
        }

        // Otherwise, create delivery days based on includeSundayMeals setting
        const baseDays = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];

        // Only include Sunday if includeSundayMeals is true
        if (orderData?.includeSundayMeals) {
          baseDays.push("sunday");
        }

        return baseDays;
      })(),
      timezone: timing.timezone || "Asia/Kolkata",
    };
  });

  // --- Effects ---
  useEffect(() => {
    if (profile) {
      setOrderState((prev) => ({
        ...prev,
        customer: {
          name: profile.name || prev.customer.name,
          email: profile.email || prev.customer.email,
          phone: profile.phone || prev.customer.phone,
          address: {
            street: profile.address?.street || prev.customer.address.street,
            city: profile.address?.city || prev.customer.address.city,
            state: profile.address?.state || prev.customer.address.state,
            pincode: profile.address?.pincode || prev.customer.address.pincode,
          },
        },
      }));
    }
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animation effect for page load
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-trigger payment when modal is shown
  useEffect(() => {
    if (autoTriggerPayment && showRazorpayPayment) {
      const timer = setTimeout(() => {
        const razorpayButton = document.querySelector(
          '[data-razorpay-button="true"]'
        );
        if (razorpayButton && !razorpayButton.disabled) {
          // console.log("Automatically triggering Razorpay payment...");
          razorpayButton.click();
          setAutoTriggerPayment(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoTriggerPayment, showRazorpayPayment]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // --- Handlers ---
  const handleCustomerUpdate = (field, value) => {
    const keys = field.split(".");
    if (keys.length > 1) {
      setOrderState((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          [keys[0]]: { ...prev.customer[keys[0]], [keys[1]]: value },
        },
      }));
    } else {
      setOrderState((prev) => ({
        ...prev,
        customer: { ...prev.customer, [field]: value },
      }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to proceed.");
      return navigate("/login");
    }

    // Debug backend URL
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    setIsProcessing(true);

    // Helper to determine the 'shift' value for the schema
    const determineShift = () => {
      const morning = subscriptionSettings.mealTiming.morning.enabled;
      const evening = subscriptionSettings.mealTiming.evening.enabled;
      if (morning && evening) return "both";
      if (morning) return "morning";
      if (evening) return "evening";
      return "morning"; // Fallback, though UI should prevent this state
    };

    // Helper to determine meals per day based on actual selection
    const determineMealsPerDay = () => {
      const morning = subscriptionSettings.mealTiming.morning.enabled;
      const evening = subscriptionSettings.mealTiming.evening.enabled;
      if (morning && evening) return 2;
      return 1; // Either morning OR evening, not both
    };

    const mealPlanId =
      orderState.mealPlanId || orderData?._id || orderData?.mealPlan?._id;
    if (!mealPlanId) {
      console.error("No valid mealPlan ID found!");
      toast.error("Error: Could not find meal plan details. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Prepare the subscription payload - MUST MATCH BACKEND SCHEMA EXACTLY
    const payload = {
      // Basic Information - MUST MATCH BACKEND SCHEMA EXACTLY
      mealPlanId: mealPlanId,
      planType: orderState.planType,
      thaliCount: orderState.quantity,
      shift: determineShift(),
      duration: orderData?.planDetails.days || 30,

      // Delivery Settings - MUST MATCH BACKEND SCHEMA EXACTLY
      deliverySettings: {
        startDate: new Date(subscriptionSettings.startDate),
        startShift: orderData?.startShift,
        deliveryDays: (() => {
          const baseDays = [
            { day: "monday" },
            { day: "tuesday" },
            { day: "wednesday" },
            { day: "thursday" },
            { day: "friday" },
            { day: "saturday" },
          ];

          // Only include Sunday if includeSundayMeals is true
          if (orderData?.includeSundayMeals) {
            baseDays.push({ day: "sunday" });
          }

          return baseDays;
        })(),
      },

      // Delivery Timing - MUST MATCH BACKEND SCHEMA EXACTLY
      deliveryTiming: orderData?.deliveryTiming,
      // Customer and Address - MUST MATCH BACKEND SCHEMA EXACTLY
      deliveryAddress: orderState.customer.address,
      customerDetails: {
        name: orderState.customer.name,
        email: orderState.customer.email,
        phone: orderState.customer.phone,
      },

      // Pricing Information - MUST MATCH BACKEND SCHEMA EXACTLY
      pricing: {
        basePricePerMeal: orderData?.planDetails.pricePerThali || 75,
        totalDays: orderData?.planDetails.days || 30,
        mealsPerDay: determineMealsPerDay(),
        totalMeals:
          (orderData?.planDetails.days || 30) * determineMealsPerDay(),
        totalThali:
          (orderData?.planDetails.days || 30) * determineMealsPerDay(),
        totalAmount: orderState.originalTotal, // Original amount before discount
        planPrice: orderState.originalTotal,
        addOnsPrice: orderState.selectedAddOns.reduce(
          (sum, addOn) => sum + (addOn.price || 0),
          0
        ),
        customizationPrice: 0,
        finalAmount: orderState.total, // This is already the discounted amount
        // Coupon information for backend processing
        couponCode: appliedCoupon?.coupon?.code || null,
        couponId:
          appliedCoupon?.coupon?._id || appliedCoupon?.coupon?.id || null,
        discount: couponDiscount || 0,
        // Flag to indicate frontend has already applied discount
        discountAppliedInFrontend: couponDiscount > 0,
      },

      // Customizations and Add-ons - MUST MATCH BACKEND SCHEMA EXACTLY
      selectedAddOns: orderState.selectedAddOns.map((addOn) => ({
        addOn: addOn.addOnId || addOn._id || addOn.id,
        name: addOn.name,
        quantity: addOn.quantity || 1,
        price: addOn.price || 0,
        perTiffinPrice: addOn.perTiffinPrice || addOn.price || 0,
      })),

      dietaryPreference: orderState.dietaryPreference,
      // customizations should be array of ObjectIds (references to MealCustomization documents)
      customizations: [],

      // User preferences go in customizationPreferences
      customizationPreferences: [
        {
          dietaryPreference: orderState.dietaryPreference,
          customOptions: orderState.customizations || [],
          spiceLevel: "medium",
          noOnion: false,
          noGarlic: false,
        },
      ],

      customAddOns: orderState.customAddOns || [],
      extraItems: orderState.extraItems || [],

      // Auto-renewal settings - MUST MATCH BACKEND SCHEMA EXACTLY
      autoRenewal: subscriptionSettings.autoRenewal !== false,
      minimumWalletBalance: subscriptionSettings.minimumWalletBalance || 500,

      // CRITICAL: Add missing fields that backend expects
      startDate: new Date(subscriptionSettings.startDate),
      endDate: new Date(
        new Date(subscriptionSettings.startDate).getTime() +
          (orderData?.planDetails.days || 30) * 24 * 60 * 60 * 1000
      ),
      nextDeliveryDate: new Date(subscriptionSettings.startDate),
      status: "pending_payment",
      paymentStatus: "pending",
      isActive: true,
      thalisDelivered: 0,
      remainingMeals:
        (orderData?.planDetails.days || 30) * determineMealsPerDay(),

      // Meal counts structure - MUST MATCH BACKEND SCHEMA
      mealCounts: {
        totalMeals:
          (orderData?.planDetails.days || 30) * determineMealsPerDay(),
        mealsDelivered: 0,
        mealsSkipped: 0,
        mealsRemaining:
          (orderData?.planDetails.days || 30) * determineMealsPerDay(),
        regularMealsDelivered: 0,
        sundayMealsDelivered: 0,
      },

      // Skip settings - MUST MATCH BACKEND SCHEMA
      skipSettings: {
        maxSkipsPerMonth: 8,
        skipsUsedThisMonth: 0,
        lastSkipReset: new Date(),
      },

      // Thali replacement settings - MUST MATCH BACKEND SCHEMA
      thaliReplacement: {
        priceDifference: 0,
        isDefault: false,
      },

      // Default meal preferences - MUST MATCH BACKEND SCHEMA
      defaultMealPreferences: {
        morning: {
          preferences: {
            noOnion: false,
            noGarlic: false,
          },
          spiceLevel: "medium",
          dietaryPreference: orderState.dietaryPreference,
          customizations: [],
          quantity: orderState.quantity,
          timing: "morning",
          isCustomized: false,
          lastUpdated: new Date(),
        },
        evening: {
          preferences: {
            noOnion: false,
            noGarlic: false,
          },
          spiceLevel: "medium",
          dietaryPreference: orderState.dietaryPreference,
          customizations: [],
          quantity: orderState.quantity,
          timing: "evening",
          isCustomized: false,
          lastUpdated: new Date(),
        },
      },

      // Customization preferences - MUST MATCH BACKEND SCHEMA
      // customizationPreferences: [
      //   {
      //     dietaryPreference: orderState.dietaryPreference,
      //     customOptions: orderState.customizations || [],
      //     spiceLevel: "medium",
      //     noOnion: false,
      //     noGarlic: false
      //   }
      // ],

      // Default meal - MUST MATCH BACKEND SCHEMA
      defaultMeal: mealPlanId,

      // Metadata - MUST MATCH BACKEND SCHEMA
      metadata: {
        createdVia: "web",
        deviceInfo: navigator.userAgent,
        promoCode: appliedCoupon?.coupon?.code || "",
        discountApplied: couponDiscount || 0,
      },

      // Arrays for tracking - MUST MATCH BACKEND SCHEMA
      customizedDays: [],
      deliveryTracking: [],
      thaliReplacements: [],
      dailyDeductions: [],
      pausedDates: [],
      skippedMeals: [],
      mealCustomizations: [],
    };

    // Validate required data before creating subscription
    if (!user?.id) {
      toast.error("User authentication required. Please login again.");
      navigate("/login");
      return;
    }

    if (!mealPlanId) {
      toast.error(
        "Meal plan not selected. Please go back and select a meal plan."
      );
      return;
    }

    if (!orderState.customer.name || !orderState.customer.email) {
      toast.error("Please fill in your name and email address.");
      return;
    }

    // console.log("Creating subscription with payload:", payload);

    try {
      // CRITICAL: Prevent multiple submissions
      if (isProcessing) {
        toast.error("Please wait, subscription is being processed...");
        return;
      }

      // SINGLE API CALL - Create subscription with pending status
      const subscriptionResult = await createSubscription(payload).unwrap();

      toast.success("Subscription created! Processing payment...");
      // console.log("Subscription created:", subscriptionResult);

      // Set up Razorpay payment data with the created subscription details
      const orderDataForRazorpay = {
        // Core payment info - Use the final amount (after coupon discount)
        totalAmount: orderState.total, // This is already the discounted amount
        originalAmount: orderState.originalTotal, // Amount before discount
        couponDiscount: couponDiscount,
        couponCode: appliedCoupon?.coupon?.code || null,
        type: "subscription",
        razorpayOrderId:
          subscriptionResult.data?.orderId || subscriptionResult.orderId,
        razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
        currency: "INR",

        // Subscription identification - USE THE UNIQUE SUBSCRIPTION ID
        subscriptionId:
          subscriptionResult.data?.subscriptionId ||
          subscriptionResult.subscriptionId,
        subscriptionIdString:
          subscriptionResult.data?.subscriptionIdString ||
          subscriptionResult.subscriptionIdString,
      };

      const customerDetailsForRazorpay = {
        name: orderState.customer.name,
        email: orderState.customer.email,
        contact: orderState.customer.phone,
        userId: user?._id,
      };

      // Prepare subscription data for Razorpay component
      const subscriptionDataForRazorpay = {
        // Core subscription identifiers - USE THE UNIQUE IDS
        subscriptionId:
          subscriptionResult.data?.subscriptionId ||
          subscriptionResult.subscriptionId,
        subscriptionIdString:
          subscriptionResult.data?.subscriptionIdString ||
          subscriptionResult.subscriptionIdString,

        // Full subscription payload
        subscriptionDetails: {
          // Core subscription details
          mealPlanId: orderState.mealPlanId,
          planType: orderState.planType,
          duration: orderState.originalData.planDetails.days,
          quantity: orderState.quantity || 1,
          startDate: subscriptionSettings.startDate,
          startShift: orderState.startShift || "evening",

          // Delivery settings
          deliverySettings: {
            startDate: subscriptionSettings.startDate,
            startShift: orderState.startShift || "evening",
            deliveryDays:
              subscriptionSettings.deliveryDays ||
              (() => {
                const baseDays = [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ];

                // Only include Sunday if includeSundayMeals is true
                if (orderState.originalData?.includeSundayMeals) {
                  baseDays.push("sunday");
                }

                return baseDays;
              })(),
            deliveryTiming: {
              morning: {
                enabled: subscriptionSettings.mealTiming.morning.enabled,
                time: subscriptionSettings.mealTiming.morning.time || "08:00",
                orderCutoff:
                  subscriptionSettings.mealTiming.morning.orderCutoff ||
                  "10:00",
              },
              evening: {
                enabled: subscriptionSettings.mealTiming.evening.enabled,
                time: subscriptionSettings.mealTiming.evening.time || "19:00",
                orderCutoff:
                  subscriptionSettings.mealTiming.evening.orderCutoff ||
                  "21:00",
              },
            },
            timezone: subscriptionSettings.timezone || "Asia/Kolkata",
          },

          // Meal counts and tracking
          mealCounts: {
            totalMeals:
              (orderData?.planDetails.days || 30) * determineMealsPerDay(),
            delivered: 0,
            skipped: 0,
            paused: 0,
          },

          // Customizations
          customizations: {
            dietaryPreference: orderState.dietaryPreference || "vegetarian",
            preferences: orderState.customizations || [],
            notes: orderState.specialInstructions || "",
          },

          // Add-ons
          selectedAddOns: orderState.selectedAddOns,

          // Pricing details
          pricing: {
            basePricePerMeal: orderState.planDetails?.pricePerThali || 0,
            totalDays: orderState.originalData.planDetails.days,
            mealsPerDay: determineMealsPerDay(),
            totalMeals:
              (orderData?.planDetails.days || 30) * determineMealsPerDay(),
            totalAmount: orderState.subtotal || 0,
            addOnsPrice: orderState.selectedAddOns.reduce(
              (sum, addOn) => sum + (addOn.price || 0),
              0
            ),
            customizationPrice: 0,
            finalAmount: orderState.total,
            gst: orderState.gst || 0,
            packagingCharges: orderState.packagingCharges || 0,
          },

          // Customer details
          customerDetails: {
            name: orderState.customer.name,
            email: orderState.customer.email,
            phone: orderState.customer.phone,
            address: {
              street: orderState.customer.address.street || "",
              city: orderState.customer.address.city || "Indore",
              state: orderState.customer.address.state || "Madhya Pradesh",
              pincode: orderState.customer.address.pincode || "",
              country: "India",
            },
          },

          // Subscription settings
          autoRenewal: subscriptionSettings.autoRenewal !== false,
          minimumWalletBalance:
            subscriptionSettings.minimumWalletBalance || 500,
          status: "pending_payment",
          paymentStatus: "pending",

          // Original order data for reference
          originalOrderData: orderState.originalData,
        },

        // Payment and pricing details
        payment: {
          amount: orderState.total,
          currency: "INR",
          status: "pending",
        },

        // Customer and plan information
        customer: {
          id: user?._id,
          name: orderState.customer.name,
          email: orderState.customer.email,
          phone: orderState.customer.phone,
        },

        // Plan details
        plan: {
          id: mealPlanId,
          type: orderState.planType,
          duration: orderState.originalData.planDetails.days,
          totalThalis:
            (orderData?.planDetails.days || 30) * determineMealsPerDay(),
          pricePerThali: orderState.planDetails?.pricePerThali || 0,
          totalAmount: orderState.total,
        },

        // Delivery information
        delivery: {
          address: orderState.customer.address,
          timing: {
            morning: {
              enabled: subscriptionSettings.mealTiming.morning.enabled,
              time: subscriptionSettings.mealTiming.morning.time || "08:00",
            },
            evening: {
              enabled: subscriptionSettings.mealTiming.evening.enabled,
              time: subscriptionSettings.mealTiming.evening.time || "19:00",
            },
          },
        },

        // Customizations
        preferences: {
          dietaryPreference: orderState.dietaryPreference,
          customizations: orderState.customizations,
          selectedAddOns: orderState.selectedAddOns,
          customAddOns: orderState.customAddOns,
          extraItems: orderState.extraItems,
        },

        // Status and timestamps
        status: "pending_payment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // console.log(
      //   "orderDataForRazorpay in confirmorderpage.jsx : ",
      //   orderDataForRazorpay
      // );
      setOrderDataForRazorpay(orderDataForRazorpay);
      setCustomerDetailsForRazorpay(customerDetailsForRazorpay);
      setSubscriptionDataForRazorpay(subscriptionDataForRazorpay);
      setShowRazorpayPayment(true);
      setAutoTriggerPayment(true);
    } catch (error) {
      console.error("❌ Error creating subscription:", error);
      console.error("❌ Error details:", {
        status: error?.status,
        statusCode: error?.statusCode,
        data: error?.data,
        message: error?.message,
        originalStatus: error?.originalStatus,
      });

      // Handle specific error cases
      if (error?.data?.error === "OLD_FAILED_SUBSCRIPTIONS") {
        // Handle old failed subscriptions - offer to clean them up
        const shouldCleanup = window.confirm(
          `You have ${error.data.oldFailedCount} old failed subscriptions that are blocking new ones. Would you like to clean them up automatically?`
        );

        if (shouldCleanup) {
          try {
            // Call the cleanup endpoint
            const response = await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
              }/api/subscriptions/cleanup-failed`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (response.ok) {
              toast.success(
                "Old failed subscriptions cleaned up! Please try creating your subscription again."
              );
              // Retry subscription creation after cleanup
              setTimeout(() => {
                handlePlaceOrder();
              }, 1000);
              return;
            } else {
              toast.error(
                "Failed to cleanup old subscriptions. Please try again or contact support."
              );
            }
          } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
            toast.error(
              "Failed to cleanup old subscriptions. Please try again or contact support."
            );
          }
        } else {
          toast.error(
            "Please contact support to clean up your old failed subscriptions."
          );
        }
      } else if (
        error?.data?.message?.includes(
          "already have an active or pending subscription"
        ) ||
        error?.data?.message?.includes("You can have maximum")
      ) {
        // Show option to proceed with new subscription
        const shouldProceed = window.confirm(
          "You have existing subscriptions. Would you like to create a new one? (Old ones will remain in your account)"
        );

        if (shouldProceed) {
          // Just retry the subscription creation
          setTimeout(() => {
            handlePlaceOrder();
          }, 1000);
          return;
        }

        toast.error(
          "Please complete your existing subscriptions first or try again later."
        );
      } else {
        // Handle other errors
        let errorMessage = "Failed to create subscription.";

        if (error?.status === "FETCH_ERROR") {
          errorMessage =
            "Unable to connect to server. Please check your internet connection and try again.";
          console.error(
            "🌐 Network error detected - check backend URL and connectivity"
          );
        } else if (error?.status === 401 || error?.originalStatus === 401) {
          errorMessage = "Please login again to continue.";
          console.error("🔐 Authentication error - token may be expired");
          // Redirect to login
          setTimeout(() => navigate("/login"), 2000);
        } else if (error?.status === 400 || error?.originalStatus === 400) {
          errorMessage =
            error?.data?.message || "Invalid order data. Please try again.";
          console.error("📝 Bad request error - check payload data");
        } else if (error?.status === 500 || error?.originalStatus === 500) {
          errorMessage = "Server error. Please try again later.";
          console.error("🖥️ Server error - backend issue");
        } else if (error?.data?.message) {
          errorMessage = error.data.message;
          console.error("📋 Custom error message from server");
        }

        toast.error(errorMessage);
      }

      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    setShowRazorpayPayment(false);
    setIsProcessing(false);

    // console.log("Payment success response:", paymentResponse);

    toast.success("Payment successful! Finalizing subscription...");

    // The subscription should already be updated by the backend payment webhook
    // We just need to handle the success flow
    if (paymentResponse?.data?.subscription) {
      // console.log("Subscription updated:", paymentResponse.data.subscription);
    }

    // setShowSuccess(true);
    // dispatch(clearCart());

    // Navigate to subscription success page - it will automatically fetch the user's active subscription
    // navigate("/subscription/success", {
    //   state: {
    //     paymentStatus: "completed",
    //     recordNumber:
    //       paymentResponse?.data?.subscriptionNumber ||
    //       paymentResponse?.data?.subscriptionIdString,
    //   },
    // });
    navigate("/profile");
  };

  const handlePaymentFailure = (error) => {
    setShowRazorpayPayment(false);
    setIsProcessing(false);
    toast.error(
      `Payment failed: ${error.error?.description || "Unknown error"}`
    );
  };

  // Loading check to prevent null orderState access
  if (!orderState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">
              Subscription Started Successfully!
            </span>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky top-0 bg-white shadow-sm z-50 md:hidden">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">Confirm Order</h1>
            <div className="text-emerald-600 text-sm font-medium">
              ₹{orderState.total.toFixed(2)} • Review & Pay
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - User Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop Header */}
            <div className="hidden md:block">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                Start Your Subscription
              </h1>
              <p className="text-gray-600">
                Confirm your details to begin your delicious journey.
              </p>
            </div>
            {/* Customer Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  Customer Information
                </h2>
                <button
                  onClick={() =>
                    setEditMode((prev) => ({ ...prev, contact: !prev.contact }))
                  }
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center text-sm px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {editMode.contact ? "Save" : "Edit"}
                </button>
              </div>
              {editMode.contact ? (
                // Input fields for contact info
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={orderState.customer.name}
                    onChange={(e) =>
                      handleCustomerUpdate("name", e.target.value)
                    }
                    placeholder="Full Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    value={orderState.customer.email}
                    onChange={(e) =>
                      handleCustomerUpdate("email", e.target.value)
                    }
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="tel"
                    value={orderState.customer.phone}
                    onChange={(e) =>
                      handleCustomerUpdate("phone", e.target.value)
                    }
                    placeholder="Phone"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:col-span-2"
                  />
                </div>
              ) : (
                // Display fields for contact info
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Name
                    </p>
                    <p className="text-gray-800 font-medium">
                      {orderState.customer.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Email
                    </p>
                    <p className="text-gray-800 font-medium">
                      {orderState.customer.email}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Phone
                    </p>
                    <p className="text-gray-800 font-medium">
                      {orderState.customer.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  Delivery Address
                </h2>
                <button
                  onClick={() =>
                    setEditMode((prev) => ({ ...prev, address: !prev.address }))
                  }
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center text-sm px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {editMode.address ? "Save" : "Edit"}
                </button>
              </div>
              {editMode.address ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={orderState.customer.address.street}
                    onChange={(e) =>
                      handleCustomerUpdate("address.street", e.target.value)
                    }
                    placeholder="Street Address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={orderState.customer.address.city}
                      onChange={(e) =>
                        handleCustomerUpdate("address.city", e.target.value)
                      }
                      placeholder="City"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={orderState.customer.address.state}
                      onChange={(e) =>
                        handleCustomerUpdate("address.state", e.target.value)
                      }
                      placeholder="State"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={orderState.customer.address.pincode}
                    onChange={(e) =>
                      handleCustomerUpdate("address.pincode", e.target.value)
                    }
                    placeholder="Pincode"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-800">
                    <p className="font-medium">
                      {orderState.customer.address.street}
                    </p>
                    <p className="text-gray-600">
                      {orderState.customer.address.city},{" "}
                      {orderState.customer.address.state}
                    </p>
                    <p className="text-gray-600">
                      {orderState.customer.address.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                Subscription Payment
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">
                    Secure payment gateway
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">
                    Auto-renewal for convenience
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">
                    Multiple payment options
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-4">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Order Summary
                </h2>
              </div>
              {/* Meal Plan Image */}
              {mealPlanImage && (
                <div className="mb-4">
                  <img
                    src={mealPlanImage}
                    alt={orderState.mealPlanTitle}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Plan Details */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="font-bold text-gray-800 mb-2">
                  {orderState.mealPlanTitle}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-medium text-gray-800">
                      {orderState?.originalData?.planDetails?.days || "Custom"}{" "}
                      days
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Diet</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {orderState?.dietaryPreference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {orderState?.selectedAddOns?.length > 0 && (
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    Add-ons
                  </h4>
                  <div className="space-y-2">
                    {orderState?.selectedAddOns.map((addon, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2"
                      >
                        <span className="text-gray-700">{addon.name}</span>
                        <span className="text-emerald-600 font-medium">
                          +₹{addon.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom & Extra Items */}
              {(orderState?.customAddOns?.length > 0 ||
                orderState?.extraItems?.length > 0) && (
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Extra Items
                  </h4>
                  <div className="space-y-2">
                    {orderState?.customAddOns?.map((item, index) => (
                      <div
                        key={`custom-${index}`}
                        className="flex justify-between items-center text-sm bg-orange-50 rounded-lg p-2"
                      >
                        <span className="text-gray-700">
                          {item.name} (x{item.quantity})
                        </span>
                        <span className="text-orange-600 font-medium">
                          +₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {orderState?.extraItems?.map((item, index) => (
                      <div
                        key={`extra-${index}`}
                        className="flex justify-between items-center text-sm bg-orange-50 rounded-lg p-2"
                      >
                        <span className="text-gray-700">
                          {item.name} (x{item.quantity})
                        </span>
                        <span className="text-orange-600 font-medium">
                          +₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                {/* Coupon Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-800">
                        Apply Coupon
                      </span>
                    </div>
                    {appliedCoupon && (
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-medium">
                            {appliedCoupon.coupon.code}
                          </span>
                        </div>
                        <span className="text-green-600 font-bold">
                          -₹{couponDiscount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        {appliedCoupon.coupon.description}
                      </p>
                    </div>
                  ) : (
                    <CouponInput
                      orderAmount={orderState.originalTotal || orderState.total}
                      onCouponApplied={handleCouponApplied}
                      orderType="subscription"
                      orderItems={[
                        {
                          name: orderState.mealPlanTitle,
                          price: orderState.originalTotal || orderState.total,
                          quantity: 1,
                          category: "meal-plan",
                        },
                      ]}
                    />
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{orderState.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5%)</span>
                    <span>₹{orderState.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Packaging</span>
                    <span>₹{orderState.packagingCharges.toFixed(2)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 border-t pt-2">
                      <span>Coupon Discount</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-800 font-bold">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      ₹{orderState.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Action Button - Desktop Only */}
              <div className="mt-6 space-y-3 hidden md:block">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="animate-spin h-5 w-5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay ₹{orderState.total.toFixed(2)}</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    <span>Auto-renewal</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="w-3 h-3 mr-1" />
                    <span>Multiple options</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-xl font-bold text-emerald-600">
              ₹{orderState.total.toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            🛡️ Secure • 🔄 Auto-renewal
          </div>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg active:bg-emerald-800 touch-manipulation flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Pay ₹{orderState.total.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom padding for mobile sticky button */}
      <div className="h-32 md:hidden"></div>

      {/* Razorpay Modal */}
      {showRazorpayPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowRazorpayPayment(false);
                setIsProcessing(false);
              }}
              className="absolute top-2 right-2 text-gray-600"
            >
              &times;
            </button>

            <RazorpayPayment
              orderData={orderDataForRazorpay}
              customerDetails={customerDetailsForRazorpay}
              subscriptionData={subscriptionDataForRazorpay}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              disabled={false}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        /* Mobile responsive improvements */
        @media (max-width: 768px) {
          .lg\\:grid-cols-3 {
            grid-template-columns: 1fr;
          }

          .lg\\:sticky {
            position: static;
          }

          .text-xl {
            font-size: 1.125rem;
          }

          .text-2xl {
            font-size: 1.25rem;
          }

          .p-6 {
            padding: 1rem;
          }

          .gap-6 {
            gap: 1rem;
          }

          .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 1rem;
          }
        }

        @media (max-width: 640px) {
          .px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .py-4 {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .text-base {
            font-size: 0.875rem;
          }

          .text-lg {
            font-size: 1rem;
          }

          /* Better touch targets */
          button {
            min-height: 44px;
            min-width: 44px;
          }

          input[type="text"],
          input[type="email"],
          input[type="tel"] {
            min-height: 44px;
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }

        /* Animations and interactions */
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .hover\\:scale-\\[1\\.02\\]:hover {
          transform: scale(1.02);
        }

        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Touch-friendly improvements */
        .touch-manipulation {
          touch-action: manipulation;
        }

        /* Focus states for accessibility */
        button:focus,
        input:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }

        /* Loading animation */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OrderConfirmationPage;
