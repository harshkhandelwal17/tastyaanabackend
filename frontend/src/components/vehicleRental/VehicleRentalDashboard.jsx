import React, { useState, useEffect } from "react";
import {
  Car,
  Users,
  MapPin,
  Calendar,
  Shield,
  Wrench,
  Package,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Search,
  Filter,
  Download,
  BarChart3,
} from "lucide-react";
import { vehicleRentalAPI } from "../../services/vehicleRentalApi";
import VehicleModal from "./VehicleModal";
import WorkerModal from "./WorkerModal";
import AccessoryModal from "./AccessoryModal";

const VehicleRentalDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [selectedZone, setSelectedZone] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    totalZones: 0,
    totalWorkers: 0,
    totalAccessories: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedZone]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        vehiclesData,
        workersData,
        bookingsData,
        accessoriesData,
        statsData,
      ] = await Promise.all([
        vehicleRentalAPI.getVehicles({
          zone: selectedZone !== "all" ? selectedZone : undefined,
        }),
        vehicleRentalAPI.getWorkers(),
        vehicleRentalAPI.getBookings(),
        vehicleRentalAPI.getAccessories(),
        vehicleRentalAPI.getDashboardStats(),
      ]);

      setVehicles(vehiclesData.data || []);
      setWorkers(workersData.data || []);
      setBookings(bookingsData.data || []);
      setAccessories(accessoriesData.data || []);
      setDashboardStats(statsData.data || dashboardStats);

      // Extract unique zones from vehicles
      const uniqueZones = [
        ...new Set(
          vehiclesData.data?.map((v) => v.assignedZone?.name).filter(Boolean)
        ),
      ];
      setZones(uniqueZones.map((name) => ({ name, id: name })));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Vehicles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalVehicles}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">
              {dashboardStats.availableVehicles} available
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.activeBookings}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {dashboardStats.totalBookings} total bookings
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{dashboardStats.totalRevenue?.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workers</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalWorkers}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {dashboardStats.totalZones} zones
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Bookings
          </h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    {booking.vehicle?.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.customerName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{booking.totalAmount}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === "active"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveSection("bookings")}
            className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Bookings
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveSection("vehicles")}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Car className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-600">Manage Vehicles</span>
            </button>
            <button
              onClick={() => setActiveSection("workers")}
              className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-600">Manage Workers</span>
            </button>
            <button
              onClick={() => setActiveSection("accessories")}
              className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-600">
                Accessories & Safety
              </span>
            </button>
            <button
              onClick={() => setActiveSection("zones")}
              className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <MapPin className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-600">
                Zone Management
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVehicles = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal("vehicle");
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Zones</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.name}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles
          .filter(
            (vehicle) =>
              searchTerm === "" ||
              vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              vehicle.registrationNumber
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          )
          .map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.brand} • {vehicle.year}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {vehicle.registrationNumber}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === "available"
                        ? "bg-green-100 text-green-800"
                        : vehicle.status === "rented"
                        ? "bg-yellow-100 text-yellow-800"
                        : vehicle.status === "maintenance"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Zone:</span>
                    <span className="font-medium">
                      {vehicle.assignedZone?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Daily Rate:</span>
                    <span className="font-medium">₹{vehicle.rates?.daily}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="font-medium">{vehicle.fuelType}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingItem(vehicle);
                      setShowModal("vehicle");
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-600 px-3 py-2 rounded text-sm hover:bg-green-100">
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderAccessories = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">
          Accessories & Safety Equipment
        </h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal("accessory");
          }}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Accessory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            name: "Helmet",
            icon: Shield,
            category: "safety",
            stock: 45,
            total: 50,
            price: 50,
          },
          {
            name: "Bike Lock",
            icon: Package,
            category: "security",
            stock: 23,
            total: 30,
            price: 100,
          },
          {
            name: "Phone Holder",
            icon: Wrench,
            category: "accessory",
            stock: 12,
            total: 20,
            price: 150,
          },
          {
            name: "Rain Cover",
            icon: Package,
            category: "accessory",
            stock: 8,
            total: 15,
            price: 200,
          },
          {
            name: "Side Mirrors",
            icon: Wrench,
            category: "accessory",
            stock: 6,
            total: 10,
            price: 300,
          },
          {
            name: "Tool Kit",
            icon: Wrench,
            category: "maintenance",
            stock: 15,
            total: 15,
            price: 500,
          },
        ].map((accessory, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    accessory.category === "safety"
                      ? "bg-red-100"
                      : accessory.category === "security"
                      ? "bg-blue-100"
                      : accessory.category === "maintenance"
                      ? "bg-orange-100"
                      : "bg-purple-100"
                  }`}
                >
                  <accessory.icon
                    className={`h-5 w-5 ${
                      accessory.category === "safety"
                        ? "text-red-600"
                        : accessory.category === "security"
                        ? "text-blue-600"
                        : accessory.category === "maintenance"
                        ? "text-orange-600"
                        : "text-purple-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {accessory.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {accessory.category}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">
                ₹{accessory.price}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Stock Level</span>
                <span className="font-medium">
                  {accessory.stock}/{accessory.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    accessory.stock / accessory.total > 0.5
                      ? "bg-green-500"
                      : accessory.stock / accessory.total > 0.2
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(accessory.stock / accessory.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-1 bg-purple-50 text-purple-600 px-3 py-2 rounded text-sm hover:bg-purple-100">
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-600 px-3 py-2 rounded text-sm hover:bg-green-100">
                <Package className="h-3 w-3" />
                <span>Restock</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Worker Management</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal("worker");
          }}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Worker</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div
            key={worker._id}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                <p className="text-sm text-gray-600">{worker.email}</p>
                <p className="text-xs text-gray-500">{worker.phone}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  worker.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {worker.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Assigned Zones:</span>
                <span className="font-medium">
                  {worker.assignedZones?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{worker.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Join Date:</span>
                <span className="font-medium">
                  {new Date(worker.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-1 bg-green-50 text-green-600 px-3 py-2 rounded text-sm hover:bg-green-100">
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100">
                <Eye className="h-3 w-3" />
                <span>Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{booking._id?.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-gray-500">
                        {booking.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {booking.vehicle?.model}
                      </div>
                      <div className="text-gray-500">
                        {booking.vehicle?.registrationNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.duration} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{booking.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === "active"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "vehicles", label: "Vehicles", icon: Car },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "workers", label: "Workers", icon: Users },
    { id: "accessories", label: "Accessories", icon: Shield },
    { id: "zones", label: "Zones", icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Vehicle Rental Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your vehicle rental business across all zones
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeSection === section.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <section.icon className="h-4 w-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeSection === "overview" && renderOverview()}
        {activeSection === "vehicles" && renderVehicles()}
        {activeSection === "accessories" && renderAccessories()}
        {activeSection === "workers" && renderWorkers()}
        {activeSection === "bookings" && renderBookings()}
        {activeSection === "zones" && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Zone Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <VehicleModal
        isOpen={showModal === "vehicle"}
        onClose={() => setShowModal(false)}
        vehicle={editingItem}
        onSuccess={fetchDashboardData}
      />

      <WorkerModal
        isOpen={showModal === "worker"}
        onClose={() => setShowModal(false)}
        worker={editingItem}
        onSuccess={fetchDashboardData}
      />

      <AccessoryModal
        isOpen={showModal === "accessory"}
        onClose={() => setShowModal(false)}
        accessory={editingItem}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default VehicleRentalDashboard;
