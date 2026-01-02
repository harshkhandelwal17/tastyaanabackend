import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaRoute,
  FaTruck,
  FaUser,
  FaPhone,
  FaUtensils,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaArrowLeft,
  FaSun,
  FaMoon,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaEye,
  FaFilter,
  FaDownload,
  FaUpload,
  FaTrash,
  FaGripVertical,
  FaPlay,
  FaStop,
  FaArrowUp,
  FaArrowDown,
  FaMapPin,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isToday,
} from "date-fns";

const DriverScheduling = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState("week"); // 'week', 'day'
  const [selectedShift, setSelectedShift] = useState("both");
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showSequencingModal, setShowSequencingModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeSequence, setRouteSequence] = useState([]);
  const [routeForm, setRouteForm] = useState({
    id: "",
    date: "",
    shift: "morning",
    deliveries: [],
    estimatedDuration: "",
    notes: "",
  });

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("both");

  // Fallback mock data for development/offline mode
  const getMockScheduleData = () => [
    {
      id: "route-001",
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "morning",
      status: "assigned",
      deliveries: [
        {
          id: "del-001",
          customerName: "John Doe",
          address: "123 Main St, City",
          phone: "+91 9876543210",
          mealType: "Breakfast",
          timeSlot: "8:00 AM - 9:00 AM",
          status: "pending",
        },
        {
          id: "del-002",
          customerName: "Jane Smith",
          address: "456 Oak Ave, City",
          phone: "+91 8765432109",
          mealType: "Breakfast",
          timeSlot: "8:30 AM - 9:30 AM",
          status: "pending",
        },
      ],
      estimatedDuration: "2 hours",
      actualDuration: null,
      totalDistance: "15 km",
      notes: "Start early for traffic",
    },
    {
      id: "route-002",
      date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      shift: "evening",
      status: "draft",
      deliveries: [
        {
          id: "del-003",
          customerName: "Bob Wilson",
          address: "789 Pine St, City",
          phone: "+91 7654321098",
          mealType: "Dinner",
          timeSlot: "7:00 PM - 8:00 PM",
          status: "pending",
        },
      ],
      estimatedDuration: "1.5 hours",
      actualDuration: null,
      totalDistance: "8 km",
      notes: "",
    },
  ];

  useEffect(() => {
    loadScheduleData();
  }, [selectedWeek, shiftFilter, statusFilter]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      const weekParam = format(selectedWeek, "yyyy-MM-dd");
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/delivery-schedule/driver/route-schedules?week=${weekParam}&shift=${shiftFilter}&status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded route schedule data:", data);
      if (data.success) {
        // Data is already in route format from the new endpoint
        setScheduleData(data.data || []);
        console.log("Route schedule data:", data.data);
      } else {
        throw new Error(data.message || "Failed to load schedules");
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load schedule data:", error);
      toast.error("Failed to load schedule data");
      // Fallback to mock data if API fails
      setScheduleData(getMockScheduleData());
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(selectedWeek, i));
    }
    return days;
  };

  const getScheduleForDate = (date, shift = "both") => {
    const dateStr = format(date, "yyyy-MM-dd");
    return scheduleData.filter((schedule) => {
      const scheduleDate = format(new Date(schedule.date), "yyyy-MM-dd");
      const matchDate = scheduleDate === dateStr;
      const matchShift = shift === "both" || schedule.shift === shift;
      const matchStatus =
        statusFilter === "all" || schedule.status === statusFilter;
      return matchDate && matchShift && matchStatus;
    });
  };

  // Transform delivery tracking data to route-like structure for rendering
  const transformDeliveryToRoute = (deliveries) => {
    if (!deliveries || !Array.isArray(deliveries)) return [];

    // Group deliveries by date and shift
    const grouped = deliveries.reduce((acc, delivery) => {
      // Parse the backend date properly (it comes as ISO string)
      const deliveryDate = new Date(delivery.date);
      const dateKey = format(deliveryDate, "yyyy-MM-dd");
      const shiftKey = delivery.shift;
      const key = `${dateKey}_${shiftKey}`;

      if (!acc[key]) {
        acc[key] = {
          id: key,
          date: dateKey,
          shift: shiftKey,
          status: delivery.status || "pending",
          deliveries: [],
          estimatedDuration: "2 hours", // Default duration
          totalDistance: "15 km", // Default distance
          notes: delivery.checkpoints?.[0]?.notes || "",
          zone: delivery.zone,
        };
      }

      // Transform delivery data to match expected structure
      acc[key].deliveries.push({
        id: delivery.id,
        customerName: delivery.customer?.name || "Unknown Customer",
        address:
          delivery.customer?.address?.street ||
          `${delivery.customer?.address?.city || ""}, ${
            delivery.customer?.address?.state || ""
          }`.trim(),
        phone: delivery.customer?.phone || "",
        mealType: delivery.mealPlan?.name || "Meal",
        timeSlot:
          delivery.shift === "morning"
            ? "8:00 AM - 10:00 AM"
            : "7:00 PM - 9:00 PM",
        status: delivery.status || "pending",
        deliveryNo: delivery.deliveryNo,
        subscriptionNumber: delivery.subscriptionNumber,
        zone: delivery.zone,
        ETA: delivery.ETA,
        checkpoints: delivery.checkpoints,
        sequencePosition: delivery.sequencePosition || null,
        isCompleted: delivery.status === "delivered",
      });

      return acc;
    }, {});

    // Sort deliveries within each route by sequence position
    const routes = Object.values(grouped);
    routes.forEach((route) => {
      route.deliveries.sort((a, b) => {
        // If both have sequence positions, sort by them
        if (a.sequencePosition && b.sequencePosition) {
          return a.sequencePosition - b.sequencePosition;
        }
        // If only one has sequence position, put sequenced ones first
        if (a.sequencePosition && !b.sequencePosition) return -1;
        if (!a.sequencePosition && b.sequencePosition) return 1;
        // If neither has sequence position, maintain original order
        return 0;
      });
    });

    return routes;
  };

  // Route sequencing functions
  const openRouteSequencing = (route) => {
    setSelectedRoute(route);
    // Sort deliveries by sequence position if available, otherwise keep original order
    const sortedDeliveries = [...route.deliveries].sort((a, b) => {
      if (a.sequencePosition && b.sequencePosition) {
        return a.sequencePosition - b.sequencePosition;
      }
      return 0;
    });
    setRouteSequence(sortedDeliveries);
    setShowSequencingModal(true);
  };

  const moveDeliveryUp = (index) => {
    if (index === 0) return;
    const newSequence = [...routeSequence];
    [newSequence[index], newSequence[index - 1]] = [
      newSequence[index - 1],
      newSequence[index],
    ];
    setRouteSequence(newSequence);
  };

  const moveDeliveryDown = (index) => {
    if (index === routeSequence.length - 1) return;
    const newSequence = [...routeSequence];
    [newSequence[index], newSequence[index + 1]] = [
      newSequence[index + 1],
      newSequence[index],
    ];
    setRouteSequence(newSequence);
  };

  const saveRouteSequence = async () => {
    try {
      // Prepare deliveries data in the format expected by backend
      const sequencedDeliveries = routeSequence.map((delivery, index) => ({
        id: delivery.id, // Backend expects just the delivery ID
        sequencePosition: index + 1,
      }));

      const requestBody = {
        routeId: selectedRoute.id,
        date: selectedRoute.date,
        shift: selectedRoute.shift,
        deliveries: sequencedDeliveries,
      };

      console.log("Sending route sequence data:", requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/delivery-schedule/driver/sequence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Route sequence saved successfully!");
        setShowSequencingModal(false);
        loadScheduleData(); // Reload to get updated data
      } else {
        throw new Error(data.message || "Failed to save route sequence");
      }
    } catch (error) {
      console.error("Save sequence error:", error);
      toast.error("Failed to save route sequence");
    }
  };

  const markDeliveryCompleted = async (deliveryId, sequencePosition) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/delivery-schedule/driver/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            sequencePosition,
            completedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Delivery marked as completed!");
        loadScheduleData(); // Reload to get updated data

        // Update the route sequence state to reflect the change
        setRouteSequence((prev) =>
          prev.map((delivery) =>
            delivery.id === deliveryId
              ? { ...delivery, status: "delivered", isCompleted: true }
              : delivery
          )
        );
      } else {
        throw new Error(data.message || "Failed to mark delivery as completed");
      }
    } catch (error) {
      console.error("Mark delivery completed error:", error);
      toast.error("Failed to mark delivery as completed");
    }
  };

  const handleRouteEdit = (route) => {
    setEditingRoute(route.id);
    setRouteForm({
      id: route.id,
      date: route.date,
      shift: route.shift,
      deliveries: route.deliveries,
      estimatedDuration: route.estimatedDuration,
      notes: route.notes,
    });
    setShowRouteModal(true);
  };

  const handleRouteSave = async () => {
    try {
      const method = editingRoute ? "PUT" : "POST";
      const url = editingRoute
        ? `/api/delivery-schedule/${routeForm.id}`
        : "/api/delivery-schedule/admin/create";

      const requestBody = {
        date: routeForm.date,
        shift: routeForm.shift,
        deliveries: routeForm.deliveries,
        estimatedDuration: routeForm.estimatedDuration,
        notes: routeForm.notes,
        driverId: user?.id, // Add current user as driver
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingRoute
            ? "Route updated successfully"
            : "Route created successfully"
        );
        setShowRouteModal(false);
        setEditingRoute(null);
        loadScheduleData();
      } else {
        throw new Error(data.message || "Failed to save route");
      }
    } catch (error) {
      console.error("Save route error:", error);
      toast.error("Failed to save route");
    }
  };

  const handleCreateRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      id: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      shift: "morning",
      deliveries: [],
      estimatedDuration: "",
      notes: "",
    });
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        const response = await fetch(`/api/delivery-schedule/${routeId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          toast.success("Route deleted successfully");
          loadScheduleData();
        } else {
          throw new Error(data.message || "Failed to delete route");
        }
      } catch (error) {
        console.error("Delete route error:", error);
        toast.error("Failed to delete route");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "skipped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getShiftIcon = (shift) => {
    return shift === "morning" ? (
      <FaSun className="text-yellow-500" />
    ) : (
      <FaMoon className="text-blue-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/driver/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-900 self-start"
            >
              <FaArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Delivery Schedule Overview
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                View your assigned deliveries and zone schedules
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("week")}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-sm ${
                  viewMode === "week"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-sm ${
                  viewMode === "day"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                Day View
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
            >
              <FaFilter className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Filters</span>
            </button>

            {/* Create Route Button - Hidden for delivery tracking view */}
            {false && (
              <button
                onClick={handleCreateRoute}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Create Route
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift
                </label>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                >
                  <option value="both">Both Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delivered">Delivered</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actions
                </label>
                <button
                  onClick={loadScheduleData}
                  className="flex items-center justify-center w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FaSync className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            {format(selectedWeek, "MMMM yyyy")}
          </h2>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedWeek(startOfWeek(new Date()))}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              →
            </button>
          </div>
        </div>

        {/* Week View */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {getWeekDays().map((day, index) => {
              const daySchedules = getScheduleForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              console.log("Rendering day:", day, "Schedules:", daySchedules);
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : isCurrentDay
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                      {format(day, "d")}
                    </div>

                    {/* Schedule indicators */}
                    <div className="mt-1 sm:mt-2 space-y-1">
                      {daySchedules?.map((schedule) => (
                        <div
                          key={schedule?.id}
                          className={`text-xs px-1 sm:px-2 py-1 rounded-full ${getStatusColor(
                            schedule?.status
                          )}`}
                        >
                          <div className="flex items-center justify-center">
                            {getShiftIcon(schedule.shift)}
                            <span className="ml-1">
                              {schedule?.deliveries?.length || 0}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Show zone info if available */}
                      {daySchedules?.length > 0 && daySchedules[0]?.zone && (
                        <div className="text-xs text-gray-500 text-center truncate">
                          {daySchedules[0].zone.code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Details */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Schedules for {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {getScheduleForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-base sm:text-lg">
                  No deliveries scheduled for this date
                </p>
                <p className="text-xs sm:text-sm">
                  Check other dates or contact your supervisor if you expect
                  deliveries
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getScheduleForDate(selectedDate).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Route Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 space-y-2 lg:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex items-center space-x-3">
                          {getShiftIcon(schedule.shift)}
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {schedule.shift === "morning"
                                ? "Morning"
                                : "Evening"}{" "}
                              Route
                              {schedule.zone && (
                                <span className="block sm:inline ml-0 sm:ml-2 text-xs sm:text-sm text-gray-600">
                                  ({schedule.zone.name} - {schedule.zone.code})
                                </span>
                              )}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {schedule.deliveries.length} deliveries •{" "}
                              {schedule.estimatedDuration || "2 hours"} •{" "}
                              {schedule.totalDistance || "Est. 15 km"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${getStatusColor(
                            schedule.status
                          )}`}
                        >
                          {schedule.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => {
                            // Navigate to daily deliveries page with date and shift filters
                            navigate(
                              `/driver/deliveries?date=${schedule.date}&shift=${schedule.shift}`
                            );
                          }}
                          className="flex items-center justify-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <FaEye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </button>

                        <button
                          onClick={() => openRouteSequencing(schedule)}
                          className="flex items-center justify-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md"
                        >
                          <FaRoute className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">
                            Sequence Route
                          </span>
                          <span className="sm:hidden">Sequence</span>
                        </button>

                        {/* Hide edit/delete buttons for delivery tracking view */}
                        {false && (
                          <>
                            <button
                              onClick={() => handleRouteEdit(schedule)}
                              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                            >
                              <FaEdit className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(schedule.id)}
                              className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <FaTrash className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Deliveries Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {schedule.deliveries.slice(0, 3).map((delivery) => (
                        <div
                          key={delivery.id}
                          className="bg-gray-50 rounded-md p-2 sm:p-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                              {delivery.sequencePosition && (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                                  {delivery.sequencePosition}
                                </div>
                              )}
                              <span className="font-medium text-gray-900 text-sm sm:text-base">
                                {delivery.customerName}
                              </span>
                            </div>
                            <div className="flex flex-col items-start sm:items-end">
                              <span className="text-xs text-gray-500">
                                {delivery.timeSlot}
                              </span>
                              {delivery.isCompleted && (
                                <span className="text-xs text-green-600 flex items-center">
                                  <FaCheckCircle className="h-3 w-3 mr-1" />
                                  Delivered
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center mb-1">
                              <FaMapMarkerAlt className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {delivery.address || "Address not available"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                              <div className="flex items-center">
                                <FaUtensils className="h-3 w-3 mr-1" />
                                {delivery.mealType}
                              </div>
                              {delivery.deliveryNo && (
                                <div className="text-xs text-gray-500">
                                  Delivery: {delivery.deliveryNo}
                                </div>
                              )}
                            </div>
                            {delivery.subscriptionNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                Sub: {delivery.subscriptionNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {schedule.deliveries.length > 3 && (
                        <div className="bg-gray-50 rounded-md p-2 sm:p-3 flex items-center justify-center">
                          <span className="text-xs sm:text-sm text-gray-600">
                            +{schedule.deliveries.length - 3} more
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes and Additional Info */}
                    {(schedule.notes || schedule.zone) && (
                      <div className="mt-3 space-y-2">
                        {schedule.notes && (
                          <div className="p-2 bg-yellow-50 rounded-md">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> {schedule.notes}
                            </p>
                          </div>
                        )}

                        {schedule.zone && (
                          <div className="p-2 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Zone:</strong> {schedule.zone.name} (
                              {schedule.zone.code})
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingRoute ? "Edit Route" : "Create New Route"}
              </h3>
              <button
                onClick={() => setShowRouteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={routeForm.date}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, date: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={routeForm.shift}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, shift: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={routeForm.estimatedDuration}
                  onChange={(e) =>
                    setRouteForm({
                      ...routeForm,
                      estimatedDuration: e.target.value,
                    })
                  }
                  placeholder="e.g., 2 hours"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={routeForm.notes}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, notes: e.target.value })
                  }
                  placeholder="Any special instructions or notes for this route..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRouteSave}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FaSave className="h-4 w-4 mr-2" />
                  Save Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Sequencing Modal */}
      {showSequencingModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Sequence Delivery Route
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {selectedRoute.shift === "morning" ? "Morning" : "Evening"}{" "}
                  Route - {format(new Date(selectedRoute.date), "MMMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => setShowSequencingModal(false)}
                className="text-gray-400 hover:text-gray-600 self-end sm:self-auto"
              >
                <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Route Progress Visualization */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Delivery Route Progress
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {routeSequence.map((delivery, index) => {
                  const isCompleted =
                    delivery.isCompleted || delivery.status === "delivered";
                  const isPending = !isCompleted;

                  return (
                    <div
                      key={delivery.id}
                      className="flex items-center space-x-2 sm:space-x-3"
                    >
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                            isCompleted
                              ? "bg-green-500"
                              : index === 0
                              ? "bg-blue-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        />
                        {index < routeSequence.length - 1 && (
                          <div className="w-0.5 h-6 sm:h-8 bg-gray-300 mt-1" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              Stop #{index + 1}: {delivery.customerName}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {delivery.address}
                            </p>
                            <p className="text-xs text-gray-500">
                              {delivery.mealType} • {delivery.deliveryNo}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {isCompleted ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                <FaCheckCircle className="inline h-3 w-3 mr-1" />
                                Delivered
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  markDeliveryCompleted(delivery.id, index + 1)
                                }
                                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                              >
                                <span className="hidden sm:inline">
                                  Mark Delivered
                                </span>
                                <span className="sm:hidden">Delivered</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery List with Reordering */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Reorder Deliveries
              </h4>
              <div className="space-y-2">
                {routeSequence.map((delivery, index) => (
                  <div
                    key={delivery.id}
                    className={`p-3 sm:p-4 border rounded-lg ${
                      delivery.isCompleted
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <div className="flex flex-col space-y-1 flex-shrink-0">
                          <button
                            onClick={() => moveDeliveryUp(index)}
                            disabled={index === 0 || delivery.isCompleted}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaArrowUp className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                          <button
                            onClick={() => moveDeliveryDown(index)}
                            disabled={
                              index === routeSequence.length - 1 ||
                              delivery.isCompleted
                            }
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaArrowDown className="h-2 w-2 sm:h-3 sm:w-3" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                          <FaGripVertical className="text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                            {index + 1}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 text-sm sm:text-base">
                            {delivery.customerName}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            <FaMapMarkerAlt className="inline h-3 w-3 mr-1" />
                            {delivery.address}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500 mt-1">
                            <span>
                              <FaUtensils className="inline h-3 w-3 mr-1" />
                              {delivery.mealType}
                            </span>
                            <span>
                              <FaPhone className="inline h-3 w-3 mr-1" />
                              {delivery.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {delivery.isCompleted ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            <FaCheckCircle className="inline h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Delivered</span>
                            <span className="sm:hidden">Done</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-600">
                <FaMapPin className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {routeSequence.length} deliveries in sequence
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowSequencingModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRouteSequence}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaSave className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Save Route Sequence</span>
                  <span className="sm:hidden">Save Sequence</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverScheduling;
