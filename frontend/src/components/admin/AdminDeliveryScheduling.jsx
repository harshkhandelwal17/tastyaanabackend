import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  FaUsers,
  FaRoute,
  FaCalendarAlt,
  FaTruck,
  FaClock,
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaFilter,
  FaDownload,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChartBar,
  FaSun,
  FaMoon,
  FaUserCheck,
  FaCog,
  FaSearch,
  FaClipboardList,
  FaChartLine,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

const AdminDeliveryScheduling = () => {
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'routes', 'drivers'
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  // Data states
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [unassignedDeliveries, setUnassignedDeliveries] = useState([]);
  const [scheduleStats, setScheduleStats] = useState({});

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("both");

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    shift: "morning",
    driverId: "",
    deliveries: [],
    estimatedDuration: "",
    maxCapacity: 20,
    notes: "",
  });

  // Mock data - will be replaced with API calls
  const mockDrivers = [
    {
      id: "driver-001",
      name: "John Doe",
      phone: "+91 9876543210",
      email: "john@example.com",
      status: "available",
      currentCapacity: 15,
      maxCapacity: 25,
      rating: 4.8,
      totalDeliveries: 145,
      onlineStatus: "online",
      location: "Zone A",
    },
    {
      id: "driver-002",
      name: "Jane Smith",
      phone: "+91 8765432109",
      email: "jane@example.com",
      status: "busy",
      currentCapacity: 22,
      maxCapacity: 25,
      rating: 4.9,
      totalDeliveries: 198,
      onlineStatus: "online",
      location: "Zone B",
    },
    {
      id: "driver-003",
      name: "Mike Wilson",
      phone: "+91 7654321098",
      email: "mike@example.com",
      status: "available",
      currentCapacity: 8,
      maxCapacity: 20,
      rating: 4.6,
      totalDeliveries: 89,
      onlineStatus: "offline",
      location: "Zone C",
    },
  ];

  const mockRoutes = [
    {
      id: "route-001",
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "morning",
      driverId: "driver-001",
      driverName: "John Doe",
      status: "assigned",
      deliveries: [
        {
          id: "del-001",
          customerName: "Alice Johnson",
          address: "123 Main St",
          timeSlot: "8:00-9:00 AM",
        },
        {
          id: "del-002",
          customerName: "Bob Smith",
          address: "456 Oak Ave",
          timeSlot: "8:30-9:30 AM",
        },
        {
          id: "del-003",
          customerName: "Carol Brown",
          address: "789 Pine St",
          timeSlot: "9:00-10:00 AM",
        },
      ],
      estimatedDuration: "2.5 hours",
      actualDuration: null,
      totalDistance: "18 km",
      notes: "Priority route - start early",
    },
    {
      id: "route-002",
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "evening",
      driverId: "driver-002",
      driverName: "Jane Smith",
      status: "in_progress",
      deliveries: [
        {
          id: "del-004",
          customerName: "David Lee",
          address: "321 Elm St",
          timeSlot: "6:00-7:00 PM",
        },
        {
          id: "del-005",
          customerName: "Eva Davis",
          address: "654 Maple Ave",
          timeSlot: "6:30-7:30 PM",
        },
      ],
      estimatedDuration: "1.8 hours",
      actualDuration: null,
      totalDistance: "12 km",
      notes: "",
    },
  ];

  const mockUnassignedDeliveries = [
    {
      id: "del-006",
      customerName: "Frank Wilson",
      address: "987 Cedar St",
      timeSlot: "12:00-1:00 PM",
      shift: "morning",
    },
    {
      id: "del-007",
      customerName: "Grace Taylor",
      address: "147 Birch Ave",
      timeSlot: "7:00-8:00 PM",
      shift: "evening",
    },
    {
      id: "del-008",
      customerName: "Henry Clark",
      address: "258 Spruce St",
      timeSlot: "8:00-9:00 AM",
      shift: "morning",
    },
  ];

  useEffect(() => {
    loadSchedulingData();
  }, [selectedDate, statusFilter, driverFilter, shiftFilter]);

  const loadSchedulingData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      setTimeout(() => {
        setDrivers(mockDrivers);
        setRoutes(mockRoutes);
        setUnassignedDeliveries(mockUnassignedDeliveries);
        setScheduleStats({
          totalRoutes: mockRoutes.length,
          assignedDeliveries: mockRoutes.reduce(
            (sum, route) => sum + route.deliveries.length,
            0
          ),
          unassignedDeliveries: mockUnassignedDeliveries.length,
          activeDrivers: mockDrivers.filter((d) => d.onlineStatus === "online")
            .length,
          averageCapacity: Math.round(
            mockDrivers.reduce(
              (sum, d) => sum + (d.currentCapacity / d.maxCapacity) * 100,
              0
            ) / mockDrivers.length
          ),
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to load scheduling data:", error);
      toast.error("Failed to load scheduling data");
      setLoading(false);
    }
  };

  const handleCreateRoute = () => {
    setScheduleForm({
      id: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      shift: "morning",
      driverId: "",
      deliveries: [],
      estimatedDuration: "",
      maxCapacity: 20,
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleEditRoute = (route) => {
    setScheduleForm({
      id: route.id,
      date: route.date,
      shift: route.shift,
      driverId: route.driverId,
      deliveries: route.deliveries,
      estimatedDuration: route.estimatedDuration,
      maxCapacity: 20,
      notes: route.notes,
    });
    setShowCreateModal(true);
  };

  const handleSaveRoute = async () => {
    try {
      // TODO: API call to save route
      toast.success(
        scheduleForm.id
          ? "Route updated successfully"
          : "Route created successfully"
      );
      setShowCreateModal(false);
      loadSchedulingData();
    } catch (error) {
      toast.error("Failed to save route");
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        // TODO: API call to delete route
        toast.success("Route deleted successfully");
        loadSchedulingData();
      } catch (error) {
        toast.error("Failed to delete route");
      }
    }
  };

  const handleAutoAssign = async () => {
    try {
      // TODO: API call for auto-assignment
      toast.success("Deliveries auto-assigned successfully");
      loadSchedulingData();
      setShowAssignModal(false);
    } catch (error) {
      toast.error("Failed to auto-assign deliveries");
    }
  };

  const handleOptimizeRoutes = async () => {
    try {
      // TODO: API call for route optimization
      toast.success("Routes optimized successfully");
      loadSchedulingData();
      setShowOptimizeModal(false);
    } catch (error) {
      toast.error("Failed to optimize routes");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const matchStatus = statusFilter === "all" || route.status === statusFilter;
    const matchDriver =
      driverFilter === "all" || route.driverId === driverFilter;
    const matchShift = shiftFilter === "both" || route.shift === shiftFilter;
    return matchStatus && matchDriver && matchShift;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Delivery Scheduling Management
            </h1>
            <p className="text-gray-600">
              Create and manage delivery schedules, assign routes to drivers
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("overview")}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === "overview"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode("routes")}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === "routes"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                Routes
              </button>
              <button
                onClick={() => setViewMode("drivers")}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === "drivers"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                Drivers
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaUserCheck className="h-4 w-4 mr-2" />
              Auto Assign
            </button>

            <button
              onClick={() => setShowOptimizeModal(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FaChartLine className="h-4 w-4 mr-2" />
              Optimize
            </button>

            <button
              onClick={handleCreateRoute}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Create Route
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaRoute className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.totalRoutes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.assignedDeliveries || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.unassignedDeliveries || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FaUsers className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Drivers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.activeDrivers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FaChartBar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.averageCapacity || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift
            </label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="both">Both Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSchedulingData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaSync className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Deliveries */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Unassigned Deliveries
              </h3>
            </div>
            <div className="p-4">
              {unassignedDeliveries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No unassigned deliveries
                </p>
              ) : (
                <div className="space-y-3">
                  {unassignedDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {delivery.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {delivery.address}
                        </p>
                        <p className="text-sm text-blue-600">
                          {delivery.timeSlot}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {delivery.shift === "morning" ? (
                          <FaSun className="text-yellow-500" />
                        ) : (
                          <FaMoon className="text-blue-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {delivery.shift}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Routes */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Routes
              </h3>
            </div>
            <div className="p-4">
              {filteredRoutes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No active routes
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredRoutes.slice(0, 5).map((route) => (
                    <div
                      key={route.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {route.shift === "morning" ? (
                            <FaSun className="text-yellow-500" />
                          ) : (
                            <FaMoon className="text-blue-500" />
                          )}
                          <span className="font-medium">
                            {route.driverName}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                            route.status
                          )}`}
                        >
                          {route.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {route.deliveries.length} deliveries •{" "}
                        {route.estimatedDuration}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "routes" && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Routes for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6">
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaRoute className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No routes scheduled</p>
                  <p className="text-sm">Create a new route to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {route.shift === "morning" ? (
                            <FaSun className="text-yellow-500" />
                          ) : (
                            <FaMoon className="text-blue-500" />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {route.driverName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {route.shift} shift • {route.deliveries.length}{" "}
                              deliveries
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              route.status
                            )}`}
                          >
                            {route.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRoute(route)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {route.deliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className="bg-gray-50 rounded-md p-3"
                          >
                            <p className="font-medium text-gray-900">
                              {delivery.customerName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.address}
                            </p>
                            <p className="text-sm text-blue-600">
                              {delivery.timeSlot}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <span>
                          Duration: {route.estimatedDuration} • Distance:{" "}
                          {route.totalDistance}
                        </span>
                        {route.notes && (
                          <span className="text-yellow-600">
                            Note: {route.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === "drivers" && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Driver Management
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {driver.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {driver.location}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getDriverStatusColor(
                        driver.status
                      )}`}
                    >
                      {driver.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">
                        {driver.currentCapacity}/{driver.maxCapacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (driver.currentCapacity / driver.maxCapacity) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium">{driver.rating} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deliveries:</span>
                      <span className="font-medium">
                        {driver.totalDeliveries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-medium ${
                          driver.onlineStatus === "online"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {driver.onlineStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {scheduleForm.id ? "Edit Route" : "Create New Route"}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={scheduleForm.shift}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        shift: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Driver
                </label>
                <select
                  value={scheduleForm.driverId}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      driverId: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Driver</option>
                  {drivers
                    .filter((d) => d.status === "available")
                    .map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.location} (
                        {driver.currentCapacity}/{driver.maxCapacity})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.estimatedDuration}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        estimatedDuration: e.target.value,
                      })
                    }
                    placeholder="e.g., 2 hours"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.maxCapacity}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        maxCapacity: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  placeholder="Any special instructions..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoute}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FaSave className="h-4 w-4 mr-2" />
                  Save Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Auto Assign Deliveries
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This will automatically assign unassigned deliveries to
                available drivers based on:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Driver capacity and availability</li>
                <li>• Geographic proximity</li>
                <li>• Time slot compatibility</li>
                <li>• Workload balancing</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoAssign}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FaUserCheck className="h-4 w-4 mr-2" />
                Auto Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optimize Routes Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Optimize Routes
              </h3>
              <button
                onClick={() => setShowOptimizeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This will optimize existing routes for:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Shortest delivery paths</li>
                <li>• Reduced travel time</li>
                <li>• Fuel efficiency</li>
                <li>• Customer time preferences</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowOptimizeModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleOptimizeRoutes}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <FaChartLine className="h-4 w-4 mr-2" />
                Optimize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryScheduling;
