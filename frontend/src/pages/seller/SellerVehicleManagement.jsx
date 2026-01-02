import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Users,
  Fuel,
  Settings,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  getSellerVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleAvailability,
  formatVehicleForDisplay,
  getStatusBadgeColor,
} from "../../api/sellerVehicleApi";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmation } from "../../hooks/useConfirmation";

const SellerVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirmation hook for styled confirmations
  const {
    isOpen: confirmationOpen,
    confirmationConfig,
    showConfirmation,
    handleConfirm: confirmationHandleConfirm,
    handleCancel: confirmationHandleCancel,
  } = useConfirmation();

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    brand: "",
    model: "",
    year: "",
    category: "car",
    registrationNumber: "",
    description: "",
    features: [],
    pricing: {
      hourly: "",
      daily: "",
      weekly: "",
      monthly: "",
    },
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
      coordinates: { lat: "", lng: "" },
    },
    specifications: {
      fuelType: "petrol",
      transmission: "manual",
      seatingCapacity: "",
      mileage: "",
      engineCapacity: "",
    },
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  // Load vehicles
  useEffect(() => {
    fetchVehicles();
  }, [filters, pagination.currentPage]);

  const fetchVehicles = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: 12,
      };

      const response = await getSellerVehicles(params);
      setVehicles(response.data.vehicles);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error(error.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setVehicleForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setVehicleForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle features change
  const handleFeaturesChange = (feature, checked) => {
    setVehicleForm((prev) => ({
      ...prev,
      features: checked
        ? [...prev.features, feature]
        : prev.features.filter((f) => f !== feature),
    }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);

    // Create preview URLs
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previewUrls);
  };

  // Remove image from preview
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);

    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  // Submit vehicle form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Add vehicle data
      Object.keys(vehicleForm).forEach((key) => {
        if (typeof vehicleForm[key] === "object" && vehicleForm[key] !== null) {
          formData.append(key, JSON.stringify(vehicleForm[key]));
        } else {
          formData.append(key, vehicleForm[key]);
        }
      });

      // Add images
      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, formData);
        toast.success("Vehicle updated successfully");
      } else {
        await createVehicle(formData);
        toast.success("Vehicle created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(error.message || "Failed to save vehicle");
    }
  };

  // Reset form
  const resetForm = () => {
    setVehicleForm({
      brand: "",
      model: "",
      year: "",
      category: "car",
      registrationNumber: "",
      description: "",
      features: [],
      pricing: {
        hourly: "",
        daily: "",
        weekly: "",
        monthly: "",
      },
      location: {
        address: "",
        city: "",
        state: "",
        pincode: "",
        coordinates: { lat: "", lng: "" },
      },
      specifications: {
        fuelType: "petrol",
        transmission: "manual",
        seatingCapacity: "",
        mileage: "",
        engineCapacity: "",
      },
    });
    setSelectedImages([]);
    setImagePreview([]);
    setEditingVehicle(null);
  };

  // Edit vehicle
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      category: vehicle.category || "car",
      registrationNumber: vehicle.registrationNumber || "",
      description: vehicle.description || "",
      features: vehicle.features || [],
      pricing: vehicle.pricing || {
        hourly: "",
        daily: "",
        weekly: "",
        monthly: "",
      },
      location: vehicle.location || {
        address: "",
        city: "",
        state: "",
        pincode: "",
        coordinates: { lat: "", lng: "" },
      },
      specifications: vehicle.specifications || {
        fuelType: "petrol",
        transmission: "manual",
        seatingCapacity: "",
        mileage: "",
        engineCapacity: "",
      },
    });
    setImagePreview(vehicle.images || []);
    setShowModal(true);
  };

  // Delete vehicle
  const handleDelete = async (vehicleId) => {
    try {
      const vehicle = vehicles.find((v) => v._id === vehicleId);
      if (!vehicle) {
        toast.error("Vehicle not found");
        return;
      }

      const confirmed = await showConfirmation({
        title: "Delete Vehicle",
        message: `Are you sure you want to permanently delete "${vehicle.name}"? This action cannot be undone and will remove all associated data.`,
        type: "danger",
        confirmText: "Delete Vehicle",
        cancelText: "Cancel",
      });

      if (!confirmed) return;

      await deleteVehicle(vehicleId);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(error.message || "Failed to delete vehicle");
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (vehicleId) => {
    try {
      // Find the vehicle to get its current status
      const vehicle = vehicles.find((v) => v._id === vehicleId);
      if (!vehicle) {
        toast.error("Vehicle not found");
        return;
      }

      const isCurrentlyAvailable =
        vehicle.availability === "available" || vehicle.status === "active";
      const confirmTitle = isCurrentlyAvailable
        ? "Make Vehicle Unavailable"
        : "Make Vehicle Available";
      const confirmMessage = isCurrentlyAvailable
        ? `Are you sure you want to make "${vehicle.name}" unavailable? This will prevent new bookings until you make it available again.`
        : `Are you sure you want to make "${vehicle.name}" available for bookings?`;
      const confirmType = isCurrentlyAvailable ? "warning" : "success";
      const confirmButtonText = isCurrentlyAvailable
        ? "Make Unavailable"
        : "Make Available";

      // Show custom confirmation dialog
      const confirmed = await showConfirmation({
        title: confirmTitle,
        message: confirmMessage,
        type: confirmType,
        confirmText: confirmButtonText,
        cancelText: "Cancel",
      });

      if (!confirmed) {
        return; // User cancelled
      }

      await toggleVehicleAvailability(vehicleId);
      const successMessage = isCurrentlyAvailable
        ? "Vehicle marked as unavailable"
        : "Vehicle marked as available";
      toast.success(successMessage);
      fetchVehicles();
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error(error.message || "Failed to update availability");
    }
  };

  const availableFeatures = [
    "Air Conditioning",
    "GPS Navigation",
    "Bluetooth",
    "USB Charging",
    "Wi-Fi",
    "Leather Seats",
    "Sunroof",
    "Backup Camera",
    "Parking Sensors",
    "Cruise Control",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Vehicle Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your vehicle inventory
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Filters & Search
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
              </select>

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="brand-asc">Brand A-Z</option>
                <option value="brand-desc">Brand Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => {
                const formattedVehicle = formatVehicleForDisplay(vehicle);
                return (
                  <div
                    key={vehicle._id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {/* Vehicle Image */}
                    <div className="relative h-48 rounded-t-lg overflow-hidden">
                      {formattedVehicle.images?.[0] ? (
                        <img
                          src={formattedVehicle.images[0]}
                          alt={`${formattedVehicle.brand} ${formattedVehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Car className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            formattedVehicle.status
                          )}`}
                        >
                          {formattedVehicle.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(vehicle._id)}
                          className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm"
                        >
                          {formattedVehicle.status === "active" ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formattedVehicle.brand} {formattedVehicle.model}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formattedVehicle.year}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {formattedVehicle.registrationNumber}
                      </p>

                      {/* Features */}
                      {formattedVehicle.features?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {formattedVehicle.features
                            .slice(0, 3)
                            .map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {feature}
                              </span>
                            ))}
                          {formattedVehicle.features.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{formattedVehicle.features.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-600">
                          {formattedVehicle.pricing?.daily && (
                            <span>₹{formattedVehicle.pricing.daily}/day</span>
                          )}
                          {formattedVehicle.pricing?.hourly && (
                            <span>₹{formattedVehicle.pricing.hourly}/hr</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formattedVehicle.location?.city || "Location"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage - 1,
                      })
                    }
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() =>
                        setPagination({ ...pagination, currentPage: i + 1 })
                      }
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pagination.currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage + 1,
                      })
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Car className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No vehicles found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filters.search || filters.status || filters.category
                ? "Try adjusting your filters."
                : "Start by adding your first vehicle."}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={vehicleForm.brand}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Toyota, Honda"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model *
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={vehicleForm.model}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Camry, City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={vehicleForm.year}
                        onChange={handleInputChange}
                        required
                        min="2000"
                        max="2025"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={vehicleForm.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="car">Car</option>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                        <option value="suv">SUV</option>
                        <option value="truck">Truck</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={vehicleForm.registrationNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., MH01AB1234"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={vehicleForm.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your vehicle..."
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="pricing.hourly"
                        value={vehicleForm.pricing.hourly}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="pricing.daily"
                        value={vehicleForm.pricing.daily}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="pricing.weekly"
                        value={vehicleForm.pricing.weekly}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="pricing.monthly"
                        value={vehicleForm.pricing.monthly}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Features
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableFeatures.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={vehicleForm.features.includes(feature)}
                          onChange={(e) =>
                            handleFeaturesChange(feature, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Images
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Images (Max 10)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {imagePreview.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreview.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="location.address"
                        value={vehicleForm.location.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Street address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="location.city"
                        value={vehicleForm.location.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="location.state"
                        value={vehicleForm.location.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        name="location.pincode"
                        value={vehicleForm.location.pincode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        name="specifications.fuelType"
                        value={vehicleForm.specifications.fuelType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="cng">CNG</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transmission
                      </label>
                      <select
                        name="specifications.transmission"
                        value={vehicleForm.specifications.transmission}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="manual">Manual</option>
                        <option value="automatic">Automatic</option>
                        <option value="cvt">CVT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        name="specifications.seatingCapacity"
                        value={vehicleForm.specifications.seatingCapacity}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mileage (km/l)
                      </label>
                      <input
                        type="number"
                        name="specifications.mileage"
                        value={vehicleForm.specifications.mileage}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engine Capacity (cc)
                      </label>
                      <input
                        type="number"
                        name="specifications.engineCapacity"
                        value={vehicleForm.specifications.engineCapacity}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingVehicle ? "Update Vehicle" : "Create Vehicle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationOpen}
        onClose={confirmationHandleCancel}
        onConfirm={confirmationHandleConfirm}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        cancelText={confirmationConfig.cancelText}
        type={confirmationConfig.type}
      />
    </div>
  );
};

export default SellerVehicleManagement;
