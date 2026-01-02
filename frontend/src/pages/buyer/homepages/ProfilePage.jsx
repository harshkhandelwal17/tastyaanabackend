// Modern User Profile Page - Redesigned
import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RiRefund2Line } from "react-icons/ri";

import {
  User,
  MapPin,
  Plus,
  Package,
  RotateCcw,
  AlertCircle,
  Star,
  Utensils,
  LogOut,
  Edit,
  Save,
  X,
  Check,
  Settings,
  Heart,
  ShoppingCart,
  Clock,
  Award,
  Phone,
  Mail,
  Calendar,
  Shield,
  Bell,
  CreditCard,
  Truck,
  ChevronRight,
  Home,
  ArrowLeft,
  Camera,
  MapPinIcon,
  Zap,
  CalendarX,
  ChevronDown,
  Sun,
  Moon,
  CheckCircle,
  Power,
} from "lucide-react";
import {
  updateProfile,
  logout,
  removeNotification,
} from "../../../redux/authslice";
import NotificationSettings from "../../../components/NotificationSettings";
import SubscriptionCalendar from "../../../components/subscription/SubscriptionCalendar";
import DriverRouteTracking from "../../../components/delivery/DriverRouteTracking";
import {
  useGetUserSubscriptionsQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useSkipMealMutation,
  useGetSkipHistoryQuery,
} from "../../../redux/storee/api";
import { fetchOrders } from "../../../redux/orderSlice";
import { toast } from "react-hot-toast";
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
import { FaHistory, FaEye, FaCalendarTimes, FaChartLine } from "react-icons/fa";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("personal");
  const [isScrolled, setIsScrolled] = useState(false);

  // Personal Info Edit State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Addresses State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [isEditingAddress, setIsEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    line1: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [addressSaveStatus, setAddressSaveStatus] = useState("");

  // Skip Meal Modal State
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipFromDate, setSkipFromDate] = useState("");
  const [skipToDate, setSkipToDate] = useState("");
  const [skipShifts, setSkipShifts] = useState(["morning", "evening"]); // Both shifts by default
  const [isSkippingMeal, setIsSkippingMeal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Skip history state
  const [showSkipHistoryModal, setShowSkipHistoryModal] = useState(false);
  const [skipHistoryFilter, setSkipHistoryFilter] = useState("all");

  // Delivery tracking state
  const [showDeliveryTracking, setShowDeliveryTracking] = useState({});
  const [deliveryProgress, setDeliveryProgress] = useState({});

  // Helper function to merge skipped meals into delivery tracking for calendar display
  const mergeSkippedMealsIntoDeliveryTracking = (subscription) => {
    if (!subscription) return subscription;

    // Create a deep copy of the subscription to avoid mutation
    const mergedSubscription = JSON.parse(JSON.stringify(subscription));

    // Initialize deliveryTracking if it doesn't exist
    if (!mergedSubscription.deliveryTracking) {
      mergedSubscription.deliveryTracking = [];
    }

    // Add skipped meals to delivery tracking if they exist and aren't already included
    if (subscription.skippedMeals && subscription.skippedMeals.length > 0) {
      subscription.skippedMeals.forEach((skippedMeal) => {
        const skipDate = new Date(skippedMeal.date);
        const shift = skippedMeal.shift;

        // Check if this skip is already in delivery tracking
        const existingDeliveryIndex =
          mergedSubscription.deliveryTracking.findIndex((delivery) => {
            const deliveryDate = new Date(delivery.date);
            return (
              deliveryDate.toDateString() === skipDate.toDateString() &&
              delivery.shift === shift
            );
          });

        // If not found, add it as a skipped delivery
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
          // Update existing entry to skipped if it's not already marked as skipped
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

      // Sort delivery tracking by date for better organization
      mergedSubscription.deliveryTracking.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    }

    return mergedSubscription;
  };

  // Process subscription data to merge skipped meals for calendar display

  // Subscriptions
  const { data: subscriptionData, isLoading: subscriptionLoading } =
    useGetUserSubscriptionsQuery(undefined, { skip: !user });
  console.log("Inside profile : ", subscriptionData);
  const allSubscriptions =
    subscriptionData?.data?.subscriptions ||
    subscriptionData?.subscriptions ||
    [];
  const activeSubscriptions = allSubscriptions.filter(
    (sub) => sub.status === "active"
  );

  const processedActiveSubscription = useMemo(() => {
    if (!activeSubscriptions[0]) return null;
    return mergeSkippedMealsIntoDeliveryTracking(activeSubscriptions[0]);
  }, [activeSubscriptions]);
  const pastSubscriptions = allSubscriptions.filter(
    (sub) => sub.status !== "active"
  );

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [pauseSubscription] = usePauseSubscriptionMutation();
  const [resumeSubscription] = useResumeSubscriptionMutation();
  const [cancelSubscription] = useCancelSubscriptionMutation();
  const [skipMeal] = useSkipMealMutation();

  // Fetch skip history data
  const { data: skipHistoryData, isLoading: isLoadingSkipHistory } =
    useGetSkipHistoryQuery(activeSubscriptions[0]?._id, {
      skip: !activeSubscriptions[0]?._id,
    });

  const skipHistory = skipHistoryData?.data?.skippedMeals || [];
  const skipStats = skipHistoryData?.data?.statistics || {};

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;

      try {
        setOrdersLoading(true);
        setOrdersError(null);

        const result = await dispatch(fetchOrders()).unwrap();
        console.log("Orders fetched:", result);

        if (result.orders) {
          setOrders(result.orders);
        } else if (Array.isArray(result)) {
          setOrders(result);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersError(error.message || "Failed to fetch orders");
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchUserOrders();
  }, [dispatch, user]);

  // Tab configuration
  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "subscriptions", label: "Subscriptions", icon: Utensils },
    { id: "orders", label: "Order History", icon: Package },
    // { id: "security", label: "Security", icon: Shield },
  ];

  // Statistics cards data
  const statsCards = [
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.length,
      icon: Utensils,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Saved Addresses",
      value: addresses.length,
      icon: MapPin,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Member Since",
      value: new Date().getFullYear(),
      icon: Award,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ];

  // Cancel Subscription Handler
  const handleCancelSubscription = async (subscriptionId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this subscription? This action cannot be undone."
      )
    )
      return;
    try {
      await cancelSubscription(subscriptionId).unwrap();
      alert("Subscription cancelled successfully");
      window.location.reload();
    } catch (error) {
      alert(error?.data?.message || "Failed to cancel subscription");
    }
  };

  // Logout handler
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Personal Info Handlers
  const handlePersonalEdit = () => setIsEditingPersonal(true);
  const handlePersonalCancel = () => {
    setPersonalForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditingPersonal(false);
  };

  const handlePersonalSave = async (e) => {
    e.preventDefault();
    const wasPlaceholderPhone = user?.phone === "0000000000";
    const isNewPhoneValid =
      personalForm.phone &&
      personalForm.phone !== "0000000000" &&
      personalForm.phone.length === 10;

    dispatch(updateProfile(personalForm));

    if (wasPlaceholderPhone && isNewPhoneValid) {
      const phoneNotification = user?.notifications?.find(
        (notification) => notification.type === "phone_reminder"
      );
      if (phoneNotification) {
        dispatch(removeNotification(phoneNotification.id));
      }
    }

    setIsEditingPersonal(false);
  };

  // Address Handlers
  const handleAddressEdit = (idx) => {
    setIsEditingAddress(idx);
    setAddressForm({ ...addresses[idx] });
    setAddressSaveStatus("");
  };

  const handleAddressCancel = () => {
    setIsEditingAddress(null);
    setAddressForm({
      line1: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setAddressSaveStatus("");
  };

  const handleAddressSave = async () => {
    try {
      setAddressSaveStatus("Saving...");

      if (
        !addressForm.line1 ||
        !addressForm.city ||
        !addressForm.state ||
        !addressForm.pincode
      ) {
        setAddressSaveStatus("Please fill all required fields");
        return;
      }

      if (!/^\d{6}$/.test(addressForm.pincode)) {
        setAddressSaveStatus("Please enter a valid 6-digit pincode");
        return;
      }

      const updated = [...addresses];
      const newAddress = {
        ...addressForm,
        line1: addressForm.line1.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        isDefault: addressForm.isDefault || false,
      };

      if (isEditingAddress === "new") {
        updated.push(newAddress);
      } else {
        updated[isEditingAddress] = newAddress;
      }

      if (newAddress.isDefault) {
        updated.forEach((addr, i) => {
          if (
            i !==
            (isEditingAddress === "new" ? updated.length - 1 : isEditingAddress)
          ) {
            addr.isDefault = false;
          }
        });
      }

      setAddresses(updated);

      const result = await dispatch(
        updateProfile({
          addresses: updated,
        })
      ).unwrap();

      if (result?.user?.addresses) {
        setAddresses(result.user.addresses);
      }

      setIsEditingAddress(null);
      setAddressForm({
        line1: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
      setAddressSaveStatus("Address saved successfully!");

      setTimeout(() => setAddressSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressSaveStatus("Failed to save address. Please try again.");
    }
  };

  const handleAddressRemove = async (idx) => {
    if (!window.confirm("Are you sure you want to remove this address?"))
      return;

    try {
      const updated = addresses.filter((_, i) => i !== idx);
      setAddresses(updated);
      setIsEditingAddress(null);

      dispatch(
        updateProfile({
          addresses: updated,
        })
      );

      setAddressSaveStatus("Address removed successfully!");
      setTimeout(() => setAddressSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error removing address:", error);
      setAddressSaveStatus("Failed to remove address. Please try again.");
    }
  };

  const handleAddressAdd = () => {
    setIsEditingAddress("new");
    setAddressForm({
      line1: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleSetDefaultAddress = (idx) => {
    let updated = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === idx,
    }));
    setAddresses(updated);
    dispatch(updateProfile({ addresses: updated }));
  };

  // Helper function to get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to calculate per-day meal price
  const calculatePerDayMealPrice = (subscription) => {
    if (!subscription || !subscription.pricing) return 0;
    return subscription?.pricing?.basePricePerMeal; // Round to 2 decimal places
  };

  // Helper function to check if customization is allowed
  const canCustomizeMeal = (subscription) => {
    const perDayPrice = subscription?.pricing?.basePricePerMeal;
    // return perDayPrice >= 60;
    return true;
  };

  // Handler for customization button click
  const handleCustomizationClick = (subscription) => {
    if (!canCustomizeMeal(subscription)) {
      const perDayPrice = subscription?.pricing?.basePricePerMeal;
      toast.error(
        `Customization is only available for meal plans with per-day price ≥ ₹60. Your current plan is ₹${perDayPrice.toFixed(
          2
        )}/day.`
      );
      return;
    }
    // If validation passes, navigate to customization page
    navigate(`/customize/${subscription._id}`);
  };

  // Skip meal handlers
  const validateSkipDates = () => {
    const errors = {};

    if (!skipFromDate) {
      errors.skipFromDate = "Please select start date";
      return errors;
    }

    if (!skipToDate) {
      errors.skipToDate = "Please select end date";
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
    const activeSubscription = activeSubscriptions[0];
    const currentSkips = activeSubscription?.skippedMeals?.length || 0;
    const maxSkips = activeSubscription?.limits?.maxSkipMeals || 8;

    if (currentSkips + totalSkips > maxSkips) {
      errors.skipLimit = `Cannot skip ${totalSkips} meals. You have ${
        maxSkips - currentSkips
      } skips remaining this month.`;
    }

    return errors;
  };

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

  const handleSkipShiftToggle = (shift) => {
    setSkipShifts((prev) => {
      if (prev.includes(shift)) {
        return prev.filter((s) => s !== shift);
      } else {
        return [...prev, shift];
      }
    });
  };

  // Enhanced handleSkipMealConfirm function with optimistic updates
  const handleSkipMealConfirm = async () => {
    const errors = validateSkipDates();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors");
      return;
    }

    if (!activeSubscriptions[0]) {
      toast.error("No active subscription found");
      return;
    }

    setIsSkippingMeal(true);

    // console.log("🍽️ Profile skip meal process started:", {
    //   subscriptionId: activeSubscriptions[0]._id,
    //   fromDate: skipFromDate,
    //   toDate: skipToDate,
    //   shifts: skipShifts,
    // });

    try {
      const subscription = activeSubscriptions[0];
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

      console.log("📦 Profile skip meal request payload:", {
        subscriptionId: subscription._id,
        skipData: skipData,
      });

      const result = await skipMeal({
        subscriptionId: subscription._id,
        skipData: skipData,
      }).unwrap();

      const totalSkipped = skipData.dates.length;
      // console.log("✅ Profile skip meal success:", { result, totalSkipped });
      toast.success(`Successfully skipped ${totalSkipped} meals!`);

      setShowSkipModal(false);
      setSkipFromDate("");
      setSkipToDate("");
      setSkipShifts(["morning", "evening"]);
      setValidationErrors({});

      // ✅ REMOVED window.location.reload() - now uses optimistic updates!
      // The calendar will update automatically through Redux cache updates
    } catch (err) {
      console.error("❌ Profile skip meal error details:", {
        error: err,
        status: err?.status,
        data: err?.data,
        message: err?.message,
      });

      // More specific error messages
      if (err?.status === 404) {
        toast.error("Subscription not found. Please refresh the page.");
      } else if (err?.status === 400) {
        toast.error(err?.data?.message || "Invalid skip meal request.");
      } else if (err?.status === 401) {
        toast.error("Please log in again to continue.");
      } else {
        toast.error(
          err?.data?.message || "Failed to skip meal. Please try again."
        );
      }
    } finally {
      setIsSkippingMeal(false);
    }
  };

  // Update your existing handleSkipMealClick function
  const handleSkipMealClick = () => {
    // Set default date range to today
    const today = format(new Date(), "yyyy-MM-dd");
    setSkipFromDate(today);
    setSkipToDate(today);
    setSkipShifts(["morning", "evening"]); // Reset to default
    setValidationErrors({});
    setShowSkipModal(true);
  };

  const handleSkipMealCancel = () => {
    setShowSkipModal(false);
    setSkipFromDate("");
    setSkipToDate("");
    setSkipShifts(["morning", "evening"]);
    setValidationErrors({});
  };

  // Filtered skip history based on selected criteria
  const filteredSkipHistory = useMemo(() => {
    if (!skipHistory.length) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

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
  }, [skipHistory, skipHistoryFilter]);

  // Delivery tracking functions
  const fetchDeliveryProgress = async (subscriptionId) => {
    try {
      const rawBase =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const trimmed =
        typeof rawBase === "string" ? rawBase.replace(/\/$/, "") : "";
      const baseUrl = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${baseUrl}/driver-routes/user/delivery-progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setDeliveryProgress((prev) => ({
          ...prev,
          [subscriptionId]: data.route,
        }));
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        if (response.status === 404) {
          // No delivery found for today - this is expected sometimes
          setDeliveryProgress((prev) => ({
            ...prev,
            [subscriptionId]: null,
          }));
        } else {
          toast.error(errorData.message || "Failed to load delivery progress");
        }
      }
    } catch (error) {
      console.error("Error fetching delivery progress:", error);
      toast.error("Failed to load delivery progress");
    }
  };

  const handleToggleDeliveryTracking = (subscriptionId) => {
    const isCurrentlyShown = showDeliveryTracking[subscriptionId];

    setShowDeliveryTracking((prev) => ({
      ...prev,
      [subscriptionId]: !isCurrentlyShown,
    }));

    // Fetch delivery progress when showing for the first time
    if (!isCurrentlyShown && !deliveryProgress[subscriptionId]) {
      fetchDeliveryProgress(subscriptionId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Please log in to view your profile
          </h1>
          <p className="text-gray-600 mb-6">
            Access your profile, orders, and subscriptions
          </p>
          <Link
            to="/login"
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold inline-block"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-xl"
            : "bg-white shadow-lg"
        }`}
      >
        {/* Top Promotional Bar */}
        <div className="bg-emerald-600 text-white py-1.5 xs:py-2 px-2 xs:px-4">
          <div className="flex justify-center items-center text-xs xs:text-sm font-medium">
            <Zap className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-1.5" />
            <span className="text-center">
              <span className="hidden xs:inline">
                Profile Settings • Manage your account • Fast & Fresh
              </span>
              <span className="xs:hidden">Profile • Manage account</span>
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-2 xs:px-3 sm:px-4 lg:px-6 py-2 xs:py-3 lg:py-4">
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 lg:gap-6">
            {/* Back Button + Logo */}
            <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm xs:text-lg sm:text-xl">
                    T
                  </span>
                </div>
                <div>
                  <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                    Profile Settings
                  </h1>
                  <p className="hidden sm:block text-xs text-emerald-600 font-medium">
                    Manage your account
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 flex justify-end items-center gap-2 xs:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 xs:pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6">
          {/* Hero Profile Section */}
          <section className="mb-6 xs:mb-8">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl xs:rounded-3xl p-4 xs:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-4xl xs:text-6xl lg:text-8xl">
                  👤
                </div>
                <div className="absolute bottom-4 left-4 text-2xl xs:text-4xl lg:text-6xl opacity-50">
                  ⭐
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 xs:gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-20 h-20 xs:w-24 xs:h-24 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-sm rounded-2xl xs:rounded-3xl flex items-center justify-center shadow-2xl">
                      <User className="w-10 h-10 xs:w-12 xs:h-12 lg:w-16 lg:h-16 text-white" />
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 xs:w-8 xs:h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                      <Camera className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-600" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl xs:text-3xl lg:text-4xl font-bold mb-2">
                      {user.name}
                    </h1>
                    <p className="text-base xs:text-lg text-white/90 mb-1 break-all">
                      {user.email}
                    </p>
                    <p className="text-sm xs:text-base text-emerald-100">
                      Member since {new Date().getFullYear()} • Premium User
                    </p>

                    {/* Mobile Actions */}
                    <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 mt-4 sm:hidden">
                      <button
                        onClick={() => navigate("/orders")}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden sm:flex flex-col gap-2 xs:gap-3">
                    <button
                      onClick={() => navigate("/orders")}
                      className="flex items-center gap-2 xs:gap-3 bg-white/20 hover:bg-white/30 text-white px-4 xs:px-6 py-2 xs:py-3 rounded-lg xs:rounded-xl font-semibold transition-colors"
                    >
                      <Package className="w-4 h-4 xs:w-5 xs:h-5" />
                      My Orders
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 xs:gap-3 bg-white/20 hover:bg-white/30 text-white px-4 xs:px-6 py-2 xs:py-3 rounded-lg xs:rounded-xl font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4 xs:w-5 xs:h-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="mb-6 xs:mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 lg:gap-6">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl xs:rounded-2xl p-3 xs:p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-2 xs:mb-3">
                    <div
                      className={`w-10 h-10 xs:w-12 xs:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon
                        className={`w-5 h-5 xs:w-6 xs:h-6 ${stat.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                    </div>
                    <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl xs:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-xs xs:text-sm text-gray-600 font-medium">
                    {stat.title}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Navigation Tabs */}
          <section className="mb-6 xs:mb-8">
            <div className="bg-white rounded-xl xs:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 xs:gap-3 px-4 xs:px-6 py-3 xs:py-4 font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="w-4 h-4 xs:w-5 xs:h-5" />
                      <span className="text-sm xs:text-base">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tab Content */}
          <section>
            <div className="bg-white rounded-xl xs:rounded-2xl shadow-lg border border-gray-100 p-4 xs:p-6 lg:p-8">
              {/* Personal Info Tab */}
              {activeTab === "personal" && (
                <div>
                  <div className="flex items-center gap-3 mb-6 xs:mb-8">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl font-bold text-gray-800">
                        Personal Information
                      </h2>
                      <p className="text-sm xs:text-base text-gray-600">
                        Manage your personal details and preferences
                      </p>
                    </div>
                  </div>

                  <form className="space-y-6" onSubmit={handlePersonalSave}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
                          <input
                            type="text"
                            value={personalForm.name}
                            onChange={(e) =>
                              setPersonalForm({
                                ...personalForm,
                                name: e.target.value,
                              })
                            }
                            className={`w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-4 border-2 rounded-xl transition-all ${
                              isEditingPersonal
                                ? "border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            disabled={!isEditingPersonal}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
                          <input
                            type="email"
                            value={personalForm.email}
                            onChange={(e) =>
                              setPersonalForm({
                                ...personalForm,
                                email: e.target.value,
                              })
                            }
                            className={`w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-4 border-2 rounded-xl transition-all ${
                              isEditingPersonal
                                ? "border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            disabled={!isEditingPersonal}
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
                          <input
                            type="text"
                            value={personalForm.phone}
                            onChange={(e) =>
                              setPersonalForm({
                                ...personalForm,
                                phone: e.target.value,
                              })
                            }
                            className={`w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-4 border-2 rounded-xl transition-all ${
                              isEditingPersonal
                                ? "border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            disabled={!isEditingPersonal}
                          />
                        </div>
                      </div>

                      {/* Member Since */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Member Since
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
                          <input
                            type="text"
                            value={new Date().getFullYear()}
                            className="w-full pl-10 xs:pl-12 pr-4 py-3 xs:py-4 border-2 border-gray-200 bg-gray-50 rounded-xl"
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      {!isEditingPersonal ? (
                        <button
                          type="button"
                          onClick={handlePersonalEdit}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Information
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handlePersonalCancel}
                            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div>
                  <div className="flex items-center justify-between mb-6 xs:mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl xs:text-2xl font-bold text-gray-800">
                          Saved Addresses
                        </h2>
                        <p className="text-sm xs:text-base text-gray-600">
                          Manage your delivery addresses
                        </p>
                      </div>
                    </div>

                    {isEditingAddress !== "new" && (
                      <button
                        onClick={handleAddressAdd}
                        className="flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Add Address
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 xs:space-y-6">
                    {addresses.length === 0 && isEditingAddress !== "new" && (
                      <div className="text-center py-12 xs:py-16">
                        <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg xs:text-xl font-semibold text-gray-800 mb-2">
                          No Addresses Found
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Add your first delivery address to get started
                        </p>
                        <button
                          onClick={handleAddressAdd}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Add Your First Address
                        </button>
                      </div>
                    )}

                    {/* Address List */}
                    {addresses.map((address, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-xl xs:rounded-2xl p-4 xs:p-6 border-2 border-gray-200 hover:border-emerald-200 transition-all"
                      >
                        {isEditingAddress === idx ? (
                          // Edit Address Form
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Address Line"
                                value={addressForm.line1}
                                onChange={(e) =>
                                  setAddressForm({
                                    ...addressForm,
                                    line1: e.target.value,
                                  })
                                }
                                className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                              />
                              <input
                                type="text"
                                placeholder="City"
                                value={addressForm.city}
                                onChange={(e) =>
                                  setAddressForm({
                                    ...addressForm,
                                    city: e.target.value,
                                  })
                                }
                                className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                              />
                              <input
                                type="text"
                                placeholder="State"
                                value={addressForm.state}
                                onChange={(e) =>
                                  setAddressForm({
                                    ...addressForm,
                                    state: e.target.value,
                                  })
                                }
                                className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                              />
                              <input
                                type="text"
                                placeholder="Pincode"
                                value={addressForm.pincode}
                                onChange={(e) =>
                                  setAddressForm({
                                    ...addressForm,
                                    pincode: e.target.value,
                                  })
                                }
                                className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={handleAddressCancel}
                                className="flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                onClick={handleAddressSave}
                                className="flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold"
                              >
                                <Check className="w-4 h-4" />
                                Save Address
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Address Display
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPinIcon className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-gray-800 text-base xs:text-lg">
                                    {address.line1}
                                  </h3>
                                  {address.isDefault && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm xs:text-base">
                                  {address.city}, {address.state} -{" "}
                                  {address.pincode}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(idx)}
                                  className="px-3 xs:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-semibold text-xs xs:text-sm"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleAddressEdit(idx)}
                                className="flex items-center gap-1 xs:gap-2 px-3 xs:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-xs xs:text-sm"
                              >
                                <Edit className="w-3 h-3 xs:w-4 xs:h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleAddressRemove(idx)}
                                className="flex items-center gap-1 xs:gap-2 px-3 xs:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-semibold text-xs xs:text-sm"
                              >
                                <X className="w-3 h-3 xs:w-4 xs:h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add New Address Form */}
                    {isEditingAddress === "new" && (
                      <div className="bg-emerald-50 rounded-xl xs:rounded-2xl p-4 xs:p-6 border-2 border-emerald-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                          </div>
                          <h3 className="text-lg xs:text-xl font-bold text-gray-800">
                            Add New Address
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Address Line"
                              value={addressForm.line1}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  line1: e.target.value,
                                })
                              }
                              className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  city: e.target.value,
                                })
                              }
                              className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={addressForm.state}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  state: e.target.value,
                                })
                              }
                              className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Pincode"
                              value={addressForm.pincode}
                              onChange={(e) =>
                                setAddressForm({
                                  ...addressForm,
                                  pincode: e.target.value,
                                })
                              }
                              className="w-full p-3 xs:p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={handleAddressCancel}
                              className="flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                            <button
                              onClick={handleAddressSave}
                              className="flex items-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold"
                            >
                              <Check className="w-4 h-4" />
                              Save Address
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Message */}
                    {addressSaveStatus && (
                      <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <p className="text-emerald-700 font-semibold">
                          {addressSaveStatus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === "subscriptions" && (
                <div>
                  <div className="flex items-center gap-3 mb-6 xs:mb-8">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Utensils className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl font-bold text-gray-800">
                        My Subscriptions
                      </h2>
                      <p className="text-sm xs:text-base text-gray-600">
                        Manage your meal plans and subscriptions
                      </p>
                    </div>
                  </div>

                  {/* Today's Meal Summary */}
                  {activeSubscriptions.length > 0 &&
                    (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

                      const subscriptionStartDate = new Date(
                        activeSubscriptions[0].startDate ||
                          activeSubscriptions[0].deliverySettings?.startDate
                      );
                      subscriptionStartDate.setHours(0, 0, 0, 0); // Reset time to start of day

                      // Only show today's meal if today >= subscription start date
                      return today >= subscriptionStartDate;
                    })() && (
                      <div>
                        <div className="bg-[#fde2e4] text-[#8b0000] p-3 text-center rounded-md text-sm font-medium flex items-center justify-center gap-2 mb-2">
                          ⚠
                          <span>
                            Technical update in progress: Meal count is not
                            updating since
                            <strong className="font-semibold">
                              {" "}
                              20 Nov 2025
                            </strong>
                            . Sorry for the inconvenience.
                          </span>
                        </div>
                        <div className="mb-6 xs:mb-8 p-4 xs:p-6 rounded-xl xs:rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                              <Utensils className="w-5 h-5 xs:w-6 xs:h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg xs:text-xl font-bold text-amber-800">
                              Today's Meal
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 mb-6">
                            <div>
                              <p className="text-sm text-amber-700 mb-1">
                                <span className="font-semibold">Plan:</span>{" "}
                                {activeSubscriptions[0].mealPlan?.title ||
                                  "N/A"}
                              </p>
                              <p className="text-sm text-amber-700 mb-1">
                                <span className="font-semibold">Meal:</span>{" "}
                                {activeSubscriptions[0].todayMeal?.items
                                  ?.length > 0
                                  ? activeSubscriptions[0].todayMeal.items
                                      .map((item) =>
                                        typeof item === "string"
                                          ? item
                                          : item.name
                                      )
                                      .join(", ")
                                  : "Today's menu not available"}
                              </p>
                              <p className="text-sm text-amber-700">
                                <span className="font-semibold">Date:</span>{" "}
                                {new Date().toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex flex-col xs:flex-row gap-3">
                              <button
                                onClick={() =>
                                  handleCustomizationClick(
                                    activeSubscriptions[0]
                                  )
                                }
                                disabled={
                                  !canCustomizeMeal(activeSubscriptions[0])
                                }
                                className={`flex items-center justify-center gap-2 px-4 xs:px-6 py-2 xs:py-3 rounded-xl transition-all font-semibold text-sm xs:text-base ${
                                  canCustomizeMeal(activeSubscriptions[0])
                                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                                }`}
                                title={
                                  !canCustomizeMeal(activeSubscriptions[0])
                                    ? `Customization requires ₹60+ per-meal meals(Current: ₹${calculatePerDayMealPrice(
                                        activeSubscriptions[0]
                                      ).toFixed(2)}/meal)`
                                    : "Customize your meal for today"
                                }
                              >
                                <Edit className="w-4 h-4" />
                                Customize Today
                              </button>
                              {/* <button
                              onClick={handleSkipMealClick}
                              className="flex items-center justify-center gap-2 px-4 xs:px-6 py-2 xs:py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold text-sm xs:text-base"
                            >
                              <Clock className="w-4 h-4" />
                              Skip Today
                            </button> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {subscriptionLoading ? (
                    <div className="text-center py-12 xs:py-16">
                      <div className="animate-spin rounded-full h-12 w-12 xs:h-16 xs:w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">
                        Loading subscriptions...
                      </p>
                    </div>
                  ) : allSubscriptions.length > 0 ? (
                    <div className="grid gap-4 xs:gap-6">
                      {allSubscriptions.map((subscription) => (
                        <div
                          key={subscription._id}
                          className="bg-white border-2 border-gray-200 rounded-xl xs:rounded-2xl p-4 xs:p-6 hover:border-emerald-200 transition-all shadow-sm hover:shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 xs:mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 xs:w-14 xs:h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Utensils className="w-6 h-6 xs:w-7 xs:h-7 text-emerald-600" />
                              </div>
                              <div>
                                <h4 className="text-lg xs:text-xl font-bold text-gray-800">
                                  {subscription.mealPlan?.title || "Meal Plan"}
                                </h4>
                                <p className="text-sm xs:text-base text-gray-600">
                                  {subscription.mealPlan?.tier || "Basic"} Plan
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-4 py-2 rounded-full text-sm xs:text-base font-bold ${
                                subscription.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {subscription.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6 mb-4 xs:mb-6">
                            <div className="text-center xs:text-left">
                              <p className="text-sm text-gray-500 mb-1">
                                Start Date
                              </p>
                              <p className="font-semibold text-gray-800">
                                {new Date(
                                  subscription.startDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-center xs:text-left">
                              <p className="text-sm text-gray-500 mb-1">
                                End Date
                              </p>
                              <p className="font-semibold text-gray-800">
                                {new Date(
                                  subscription.endDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-center xs:text-left">
                              <p className="text-sm text-gray-500 mb-1">
                                Remaining
                              </p>
                              <p className="font-semibold text-gray-800">
                                {subscription?.mealCounts?.mealsRemaining} Meals
                              </p>
                            </div>
                            <div className="text-center xs:text-left">
                              <p className="text-sm text-gray-500 mb-1">
                                Total Amount
                              </p>
                              <p className="font-semibold text-gray-800">
                                ₹{subscription?.pricing?.planPrice}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xs:gap-3">
                            <Link
                              to={`/subscription/${subscription._id}`}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold hover:bg-blue-700 transition-all"
                            >
                              <Package className="w-4 h-4" />
                              View Details
                            </Link>
                            <button
                              onClick={() =>
                                handleCustomizationClick(subscription)
                              }
                              disabled={!canCustomizeMeal(subscription)}
                              className={`flex items-center gap-2 px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold transition-all ${
                                canCustomizeMeal(subscription)
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                              }`}
                              title={
                                !canCustomizeMeal(subscription)
                                  ? `Customization requires ₹60+ per-day meals (Current: ₹${calculatePerDayMealPrice(
                                      subscription
                                    ).toFixed(2)}/day)`
                                  : "Customize your meal plan"
                              }
                            >
                              <Edit className="w-4 h-4" />
                              Customize
                            </button>
                            {/* {subscription.status === "active" ? (
                              <button className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold hover:bg-gray-50 transition-all">
                                <Clock className="w-4 h-4" />
                                Pause
                              </button>
                            ) : (
                              <button className="flex items-center gap-2 border-2 border-emerald-300 text-emerald-700 px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold hover:bg-emerald-50 transition-all">
                                <RotateCcw className="w-4 h-4" />
                                Resume
                              </button>
                            )} */}
                            {/* <button
                              onClick={() =>
                                handleCancelSubscription(subscription._id)
                              }
                              className="flex items-center gap-2 border-2 border-red-300 text-red-700 px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold hover:bg-red-50 transition-all"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button> */}
                          </div>

                          {/* Enhanced Action Buttons with Skip History */}
                          <div className="mt-6 flex flex-wrap gap-3">
                            {/* <button
                              onClick={() =>
                                navigate(`/customize/${subscription._id}`)
                              }
                              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Customize
                            </button> */}

                            <button
                              onClick={handleSkipMealClick}
                              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <CalendarX className="h-4 w-4 mr-2" />
                              Skip Meal
                            </button>

                            <button
                              onClick={() => setShowSkipHistoryModal(true)}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FaHistory className="h-4 w-4 mr-2" />
                              Skip History
                            </button>
                          </div>

                          {/* Skip Statistics Summary */}
                          {skipStats && Object.keys(skipStats).length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <FaChartLine className="mr-2 text-blue-600" />
                                Skip Summary
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="font-semibold text-blue-600">
                                    {skipStats.totalSkips || 0}
                                  </div>
                                  <div className="text-gray-600">
                                    Total Skipped
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-green-600">
                                    {skipStats.thisMonthSkips || 0}
                                  </div>
                                  <div className="text-gray-600">
                                    This Month
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-orange-600">
                                    {skipStats.remainingSkips || 0}
                                  </div>
                                  <div className="text-gray-600">Remaining</div>
                                </div>
                                {/* <div className="text-center">
                                  <div className="font-semibold text-purple-600">
                                    ₹{(skipStats.totalRefund || 0).toFixed(2)}
                                  </div>
                                  <div className="text-gray-600">
                                    Total Refund
                                  </div>
                                </div> */}
                              </div>
                            </div>
                          )}

                          {/* Delivery Tracking Section */}
                          <div className="mt-6">
                            <button
                              onClick={() =>
                                handleToggleDeliveryTracking(subscription._id)
                              }
                              className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Truck className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-semibold text-gray-900">
                                    Track Today's Delivery
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    View real-time delivery status and location
                                  </p>
                                </div>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                  showDeliveryTracking[subscription._id]
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </button>
                            {/* Delivery Progress Display */}
                            {showDeliveryTracking[subscription._id] && (
                              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                {deliveryProgress[subscription._id] ? (
                                  <DriverRouteTracking
                                    routeData={
                                      deliveryProgress[subscription._id]
                                    }
                                    subscriptionId={subscription._id}
                                    compact={true}
                                  />
                                ) : deliveryProgress[subscription._id] ===
                                  null ? (
                                  <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <svg
                                        className="w-6 h-6 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2m-3-3h-3M8 6h3"
                                        />
                                      </svg>
                                    </div>
                                    <h4 className="text-gray-800 font-medium mb-1">
                                      No Delivery Scheduled
                                    </h4>
                                    <p className="text-gray-500 text-sm">
                                      No delivery found for today. Check back
                                      during delivery hours.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-6 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                                    <p className="text-gray-600">
                                      Loading delivery information...
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 xs:py-16">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Utensils className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4">
                        No Subscriptions Found
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        You don't have any meal subscriptions yet. Subscribe to
                        get daily meals delivered to your doorstep.
                      </p>
                      <Link
                        to="/ghar/ka/khana"
                        className="inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Utensils className="w-5 h-5" />
                        Browse Meal Plans
                      </Link>
                    </div>
                  )}
                  {/* {console.log(activeSubscriptions)} */}
                  {/* Subscription Calendar */}
                  {activeSubscriptions.length > 0 && (
                    <div className="mt-8 xs:mt-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 xs:w-6 xs:h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl xs:text-2xl font-bold text-gray-800">
                            Subscription Calendar
                          </h3>
                          <p className="text-sm xs:text-base text-gray-600">
                            View your meal schedule, skips, and replacements
                          </p>
                        </div>
                      </div>
                      {processedActiveSubscription ? (
                        <>
                          {/* Debug subscription data */}
                          {/* {process.env.NODE_ENV === "development" && (
                            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                              <details>
                                <summary className="cursor-pointer text-sm font-semibold">
                                  🔍 Debug: Processed Subscription Data (Click
                                  to expand)
                                </summary>
                                <pre className="text-xs mt-2 overflow-auto max-h-40">
                                  {JSON.stringify(
                                    {
                                      id: processedActiveSubscription._id,
                                      status:
                                        processedActiveSubscription.status,
                                      originalDeliveryTracking: {
                                        exists:
                                          !!activeSubscriptions[0]
                                            ?.deliveryTracking,
                                        count:
                                          activeSubscriptions[0]
                                            ?.deliveryTracking?.length || 0,
                                      },
                                      processedDeliveryTracking: {
                                        exists:
                                          !!processedActiveSubscription.deliveryTracking,
                                        count:
                                          processedActiveSubscription
                                            .deliveryTracking?.length || 0,
                                        skippedEntries:
                                          processedActiveSubscription.deliveryTracking?.filter(
                                            (d) => d.status === "skipped"
                                          )?.length || 0,
                                        sample:
                                          processedActiveSubscription.deliveryTracking?.slice(
                                            0,
                                            5
                                          ) || [],
                                      },
                                      skippedMeals: {
                                        exists:
                                          !!processedActiveSubscription.skippedMeals,
                                        count:
                                          processedActiveSubscription
                                            .skippedMeals?.length || 0,
                                        sample:
                                          processedActiveSubscription.skippedMeals?.slice(
                                            0,
                                            3
                                          ) || [],
                                      },
                                      startDate:
                                        processedActiveSubscription.startDate,
                                      endDate:
                                        processedActiveSubscription.endDate,
                                    },
                                    null,
                                    2
                                  )}
                                </pre>
                              </details>

                              <button
                                onClick={() => window.location.reload()}
                                className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                              >
                                🔄 Refresh to see server data
                              </button>
                            </div>
                          )} */}

                          {/* Meal Availability Status */}
                          {processedActiveSubscription?.sellerMealAvailability && (
                            <div className="mb-6">
                              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Power className="w-5 h-5 text-orange-500" />
                                    Meal Service Status
                                  </h4>
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      processedActiveSubscription
                                        .sellerMealAvailability.isAvailable
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {processedActiveSubscription
                                      .sellerMealAvailability.isAvailable
                                      ? "Available"
                                      : "Not Available"}
                                  </span>
                                </div>

                                {!processedActiveSubscription
                                  .sellerMealAvailability.isAvailable && (
                                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 mb-2">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="font-medium">
                                        Service Currently Unavailable
                                      </span>
                                    </div>
                                    {processedActiveSubscription
                                      .sellerMealAvailability.reason && (
                                      <p className="text-red-600 text-sm">
                                        Reason:{" "}
                                        {
                                          processedActiveSubscription
                                            .sellerMealAvailability.reason
                                        }
                                      </p>
                                    )}
                                    <p className="text-red-600 text-sm">
                                      Status:{" "}
                                      {processedActiveSubscription.sellerMealAvailability.status?.replace(
                                        "_",
                                        " "
                                      )}
                                    </p>
                                  </div>
                                )}

                                {/* Shift-wise availability */}
                                <div className="space-y-3">
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Today's Availability
                                  </h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Morning Shift */}
                                    <div
                                      className={`p-3 rounded-lg border ${
                                        processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.morning?.isAvailable
                                          ? "bg-green-50 border-green-200"
                                          : "bg-red-50 border-red-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Sun className="w-4 h-4 text-yellow-600" />
                                        <span className="text-sm font-medium text-gray-800">
                                          Morning
                                        </span>
                                        {processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.morning?.isAvailable ? (
                                          <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                        ) : (
                                          <X className="w-4 h-4 text-red-600 ml-auto" />
                                        )}
                                      </div>
                                      {!processedActiveSubscription
                                        .sellerMealAvailability.shifts?.morning
                                        ?.isAvailable &&
                                        processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.morning?.reason && (
                                          <p className="text-xs text-red-600">
                                            {
                                              processedActiveSubscription
                                                .sellerMealAvailability.shifts
                                                .morning.reason
                                            }
                                          </p>
                                        )}
                                    </div>

                                    {/* Evening Shift */}
                                    <div
                                      className={`p-3 rounded-lg border ${
                                        processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.evening?.isAvailable
                                          ? "bg-green-50 border-green-200"
                                          : "bg-red-50 border-red-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Moon className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-800">
                                          Evening
                                        </span>
                                        {processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.evening?.isAvailable ? (
                                          <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                        ) : (
                                          <X className="w-4 h-4 text-red-600 ml-auto" />
                                        )}
                                      </div>
                                      {!processedActiveSubscription
                                        .sellerMealAvailability.shifts?.evening
                                        ?.isAvailable &&
                                        processedActiveSubscription
                                          .sellerMealAvailability.shifts
                                          ?.evening?.reason && (
                                          <p className="text-xs text-red-600">
                                            {
                                              processedActiveSubscription
                                                .sellerMealAvailability.shifts
                                                .evening.reason
                                            }
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {/* Last Updated */}
                                {processedActiveSubscription
                                  .sellerMealAvailability.lastUpdated && (
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Last updated:{" "}
                                      {new Date(
                                        processedActiveSubscription.sellerMealAvailability.lastUpdated
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <SubscriptionCalendar
                            subscription={processedActiveSubscription} // Use processed subscription with merged data
                            userId={user?.data?._id}
                            onDateClick={(date, dayInfo) => {
                              console.log("📅 Calendar date clicked:", {
                                date,
                                dayInfo,
                              });
                            }}
                          />
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarX className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            No active subscription found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Subscribe to a meal plan to view your calendar
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div>
                  <div className="flex items-center gap-3 mb-6 xs:mb-8">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl font-bold text-gray-800">
                        Order History
                      </h2>
                      <p className="text-sm xs:text-base text-gray-600">
                        View your past orders and subscriptions
                      </p>
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-12 xs:py-16">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400 animate-spin" />
                      </div>
                      <h3 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4">
                        Loading Orders...
                      </h3>
                      <p className="text-gray-600 mb-8">
                        Please wait while we fetch your order history. This
                        won't take long.
                      </p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-12 xs:py-16">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 xs:w-10 xs:h-10 text-red-400" />
                      </div>
                      <h3 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4">
                        Error Loading Orders
                      </h3>
                      <p className="text-gray-600 mb-8">{ordersError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 xs:py-16">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4">
                        No Order History
                      </h3>
                      <p className="text-gray-600 mb-8">
                        You haven't placed any orders yet. Start shopping to see
                        your order history here.
                      </p>
                      <Link
                        to="/"
                        className="inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Home className="w-5 h-5" />
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 xs:gap-6">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="bg-gray-50 border-2 border-gray-200 rounded-xl xs:rounded-2xl p-4 xs:p-6 hover:border-gray-300 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 xs:w-14 xs:h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 xs:w-7 xs:h-7 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="text-lg xs:text-xl font-bold text-gray-800">
                                  Order #
                                  {order.orderNumber || order._id?.slice(-8)}
                                </h4>
                                <p className="text-sm xs:text-base text-gray-600">
                                  {order.items?.length || 0} items
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-4 py-2 rounded-full text-sm xs:text-base font-bold ${
                                order.status === "delivered"
                                  ? "bg-green-200 text-green-700"
                                  : order.status === "processing"
                                  ? "bg-yellow-200 text-yellow-700"
                                  : order.status === "cancelled"
                                  ? "bg-red-200 text-red-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {order.status?.toUpperCase() || "PENDING"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Order Date
                              </p>
                              <p className="font-semibold text-gray-800">
                                {new Date(
                                  order.createdAt || order.orderDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Payment
                              </p>
                              <p className="font-semibold text-gray-800">
                                {order.paymentStatus || "Pending"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Items
                              </p>
                              <p className="font-semibold text-gray-800">
                                {order.items?.length || 0} items
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Total Amount
                              </p>
                              <p className="font-semibold text-gray-800">
                                ₹{order.total || order.totalAmount || 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 xs:gap-3">
                            <Link
                              to={`/orders/${order._id}`}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 xs:px-5 py-2 xs:py-2.5 rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold hover:bg-blue-700 transition-all"
                            >
                              <Package className="w-4 h-4" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {/* {activeTab === "security" && (
                <div>
                  <div className="flex items-center gap-3 mb-6 xs:mb-8">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl xs:text-2xl font-bold text-gray-800">
                        Security Settings
                      </h2>
                      <p className="text-sm xs:text-base text-gray-600">
                        Manage your account security and privacy
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 xs:space-y-8">
                
                    <div className="bg-gray-50 rounded-xl xs:rounded-2xl p-4 xs:p-6 border-2 border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-5 h-5 xs:w-6 xs:h-6 text-green-600" />
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>{" "}
                          <p className="font-medium">
                            {new Date(
                              subscription.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining Days:</span>{" "}
                          <p className="font-medium">
                            {subscription.remainingDays}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Amount:</span>{" "                          <p className="font-medium">
                            ₹ {subscription?.pricing?.planPrice}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800">
                              Password
                            </h4>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Strong
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Last updated 3 months ago
                          </p>
                          <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm">
                            <Edit className="w-4 h-4" />
                            Change Password
                          </button>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800">
                              Two-Factor Auth
                            </h4>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Disabled
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Add extra security to your account
                          </p>
                          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all font-semibold text-sm">
                            <Shield className="w-4 h-4" />
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>

                   
                    <div className="bg-gray-50 rounded-xl xs:rounded-2xl p-4 xs:p-6 border-2 border-gray-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Bell className="w-5 h-5 xs:w-6 xs:h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg xs:text-xl font-bold text-gray-800">
                            Push Notifications
                          </h3>
                          <p className="text-sm xs:text-base text-gray-600">
                            Manage your notification preferences
                          </p>
                        </div>
                      </div>

                      <NotificationSettings />
                    </div>

                    <div className="bg-red-50 rounded-xl xs:rounded-2xl p-4 xs:p-6 border-2 border-red-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 xs:w-6 xs:h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg xs:text-xl font-bold text-gray-800">
                            Danger Zone
                          </h3>
                          <p className="text-sm xs:text-base text-gray-600">
                            Irreversible actions for your account
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 xs:p-6 border border-red-200">
                        <h4 className="font-bold text-gray-800 mb-2">
                          Delete Account
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Permanently delete your account and all associated
                          data. This action cannot be undone.
                        </p>
                        <button className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          </section>
        </div>
      </main>

      {/* Skip Meal Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleSkipMealCancel}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full z-10 max-h-[90vh] overflow-y-auto">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Skip Meals
              </h3>
              <button
                onClick={handleSkipMealCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Skip meals for single or multiple days. You can skip specific
                shifts or entire days.
              </p>

              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date *
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
                    className={`w-full p-3 border rounded-lg ${
                      validationErrors.skipFromDate
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {validationErrors.skipFromDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.skipFromDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date *
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
                    className={`w-full p-3 border rounded-lg ${
                      validationErrors.skipToDate
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    min={skipFromDate || new Date().toISOString().split("T")[0]}
                  />
                  {validationErrors.skipToDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.skipToDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Shift Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Shifts to Skip *
                </label>
                <div className="flex flex-wrap gap-3">
                  {(
                    activeSubscriptions[0]?.mealPlan?.shifts || [
                      "morning",
                      "evening",
                    ]
                  ).map((shift) => (
                    <label
                      key={shift}
                      className={`flex items-center px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        skipShifts.includes(shift)
                          ? "bg-red-100 border-red-300 text-red-700"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={skipShifts.includes(shift)}
                        onChange={() => handleSkipShiftToggle(shift)}
                        className="mr-3 h-4 w-4 text-red-600 rounded"
                      />
                      <span className="font-medium">
                        {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift
                      </span>
                    </label>
                  ))}
                </div>
                {validationErrors.skipShifts && (
                  <p className="mt-2 text-sm text-red-600">
                    {validationErrors.skipShifts}
                  </p>
                )}
              </div>

              {/* Skip Summary */}
              {skipFromDate && skipToDate && skipShifts.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Skip Summary
                  </h4>
                  {(() => {
                    const fromDate = parseISO(skipFromDate);
                    const toDate = parseISO(skipToDate);
                    const daysDifference =
                      Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) +
                      1;
                    const totalSkips = daysDifference * skipShifts.length;
                    const activeSubscription = activeSubscriptions[0];
                    const currentSkips =
                      activeSubscription?.skippedMeals?.length || 0;
                    const maxSkips =
                      activeSubscription?.limits?.maxSkipMeals || 8;

                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {daysDifference} day{daysDifference > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shifts per day:</span>
                          <span className="font-medium">
                            {skipShifts.join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total meals to skip:</span>
                          <span className="font-medium">
                            {totalSkips} meal{totalSkips > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Current skips this month:</span>
                          <span className="font-medium">
                            {currentSkips}/{maxSkips}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining after skip:</span>
                          <span
                            className={`font-medium ${
                              maxSkips - currentSkips - totalSkips < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {Math.max(0, maxSkips - currentSkips - totalSkips)}/
                            {maxSkips}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {validationErrors.skipLimit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">
                    {validationErrors.skipLimit}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={handleSkipMealCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipMealConfirm}
                disabled={
                  isSkippingMeal || Object.keys(validateSkipDates()).length > 0
                }
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSkippingMeal ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Skipping Meals...
                  </>
                ) : (
                  `Skip ${
                    skipShifts.length > 0
                      ? skipFromDate === skipToDate
                        ? skipShifts.length === 1
                          ? `${skipShifts[0]} meal`
                          : `${skipShifts.length} meals`
                        : `Selected Meals`
                      : "Meals"
                  }`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip History Modal */}
      {showSkipHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSkipHistoryModal(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FaHistory className="mr-3 text-blue-600" />
                  Skip History
                </h3>
                <p className="text-gray-600 mt-1">
                  View all your skipped meals details
                </p>
              </div>
              <button
                onClick={() => setShowSkipHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Statistics */}
            {skipStats && (
              <div className="p-6 bg-blue-50 border-b flex-shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {skipStats.totalSkips || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Skipped</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {skipStats.thisMonthSkips || 0}
                    </div>
                    <div className="text-sm text-gray-600">This Month</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {skipStats.remainingSkips || 0}
                    </div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  {/* <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{(skipStats.totalRefund || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Refund</div>
                  </div> */}
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex gap-2">
                {["all", "this-month", "last-month"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSkipHistoryFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      skipHistoryFilter === filter
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter === "all"
                      ? "All Time"
                      : filter === "this-month"
                      ? "This Month"
                      : "Last Month"}
                  </button>
                ))}
              </div>
            </div>

            {/* History List - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {isLoadingSkipHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading skip history...</span>
                </div>
              ) : filteredSkipHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FaCalendarTimes className="mx-auto text-gray-400 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Skipped Meals
                  </h3>
                  <p className="text-gray-600">
                    {skipHistoryFilter === "all"
                      ? "You haven't skipped any meals yet."
                      : `No meals skipped ${
                          skipHistoryFilter === "this-month"
                            ? "this month"
                            : "last month"
                        }.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSkipHistory.map((skip, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              skip.shift === "morning"
                                ? "bg-yellow-400"
                                : "bg-blue-400"
                            }`}
                          ></div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(skip.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {skip.shift} meal
                            </div>
                            {skip.description &&
                              skip.description !==
                                "User requested meal skip" && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {skip.description}
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="text-right">
                          {/* <div className="flex items-center text-green-600 font-medium">
                            <RiRefund2Line className="mr-1" />₹
                            {(skip.refundAmount || 0).toFixed(2)}
                          </div> */}
                          <div className="text-xs text-gray-500">
                            {new Date(skip.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                {filteredSkipHistory.length} skip
                {filteredSkipHistory.length !== 1 ? "s" : ""} shown
              </div>
              <button
                onClick={() => setShowSkipHistoryModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Styles */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Custom scrollbar for skip history modal */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Custom breakpoint for extra small screens */
        @screen xs {
          /* 375px */
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition-property: color, background-color, border-color, transform,
            box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Ensure proper touch targets on mobile */
        @media (max-width: 640px) {
          button {
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
