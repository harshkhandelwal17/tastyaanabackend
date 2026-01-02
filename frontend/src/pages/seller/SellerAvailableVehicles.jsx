import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  Car,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  ToggleRight,
  ToggleLeft,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  Clock,
  Users,
  X,
  Upload,
  File,
  FileText,
  Camera,
} from "lucide-react";
import {
  getSellerVehicles,
  toggleVehicleAvailability,
  formatVehicleForDisplay,
  getStatusBadgeColor,
  getSellerProfile, // Import added
} from "../../api/sellerVehicleApi";
import { vehicleRentalAPI } from "../../services/vehicleRentalApi";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmation } from "../../hooks/useConfirmation";

const SellerAvailableVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [zones, setZones] = useState([]); // State for zones
  const [loading, setLoading] = useState(true);

  // Confirmation hook for styled confirmations
  const {
    isOpen: confirmationOpen,
    confirmationConfig,
    showConfirmation,
    handleConfirm,
    handleCancel,
  } = useConfirmation();

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "active", // Only show active/available vehicles by default, can be toggled
    category: "",
    availability: "",
    zone: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    vehicle: null,
    loading: false,
    availability: null,
  });

  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    startDateTime: "",
    endDateTime: "",
    rateType: "hourly", // Will be updated based on available rates
    includesFuel: false,
    extraHelmets: 0,
    phoneMount: false,
    // Meter reading fields for offline booking
    startMeterReading: "",
    fuelLevel: "full", // full, half, quarter, empty
    vehicleCondition: "excellent", // excellent, good, fair, poor
    // Payment and billing
    depositAmount: 0,
    cashAmount: 0,
    onlineAmount: 0,
    paymentMethod: "cash",
    // Document upload
    documents: [], // For storing uploaded documents (optional)
    notes: "",
    // Offline booking specific
    isOfflineBooking: true, // This will always be true for this page
    shopLocation: "", // Will be auto-filled from seller profile
  });

  // Load vehicles
  useEffect(() => {
    fetchVehicles();
  }, [filters, pagination.currentPage]);

  // Load zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await getSellerProfile();
        if (
          response.data &&
          response.data.sellerProfile &&
          response.data.sellerProfile.vehicleRentalService
        ) {
          setZones(
            response.data.sellerProfile.vehicleRentalService.serviceZones || []
          );
        }
      } catch (error) {
        console.error("Error fetching zones:", error);
      }
    };
    fetchZones();
  }, []);

  const fetchVehicles = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: 12,
      };

      const response = await getSellerVehicles(params);
      console.log(response);
      setVehicles(response.data.vehicles);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error(error.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
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

  // Open booking modal
  const handleBookNow = async (vehicle) => {
    // Determine the best default rate type based on available rates
    let defaultRateType = "hourly12"; // fallback
    if (vehicle.rateHourly) {
      defaultRateType = "hourly";
    } else if (vehicle.rate12hr) {
      defaultRateType = "hourly12";
    } else if (vehicle.rate24hr) {
      defaultRateType = "hourly24";
    }

    setBookingModal({
      isOpen: true,
      vehicle: vehicle,
      loading: false,
      availability: null,
    });

    // Reset booking form
    setBookingForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
      startDateTime: new Date().toISOString().slice(0, 16),
      endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // 2 hours later
      rateType: defaultRateType, // Set based on available rates
      includesFuel: false,
      extraHelmets: 0,
      phoneMount: false,
      // Meter reading fields for offline booking
      startMeterReading: "",
      fuelLevel: "full", // Default to full tank
      vehicleCondition: "excellent", // Default to excellent condition
      // Payment and billing - auto-fill security deposit from vehicle
      depositAmount: vehicle.securityDeposit || vehicle.depositAmount || 0, // Auto-filled from vehicle schema
      cashAmount: 0,
      onlineAmount: 0,
      paymentMethod: "cash",
      documents: [],
      notes: "",
      // Offline booking specific
      isOfflineBooking: true,
      shopLocation: "", // Will be auto-filled from seller profile
    });
  };

  // Close booking modal
  const closeBookingModal = () => {
    setBookingModal({
      isOpen: false,
      vehicle: null,
      loading: false,
      availability: null,
    });
  };

  // Check vehicle availability for selected time
  const checkVehicleAvailability = async () => {
    if (
      !bookingForm.startDateTime ||
      !bookingForm.endDateTime ||
      !bookingModal.vehicle
    )
      return;

    try {
      setBookingModal((prev) => ({ ...prev, loading: true }));

      // Use zoneCode for backend compatibility
      const response = await vehicleRentalAPI.getAvailableVehiclesForBooking(
        bookingForm.startDateTime,
        bookingForm.endDateTime,
        bookingModal.vehicle.zoneCode // Use zoneCode for backend compatibility
      );

      console.log("🔍 Availability check response:", response);
      console.log("🚗 Looking for vehicle ID:", bookingModal.vehicle._id);
      console.log(
        "🎯 Available vehicles:",
        response.data?.vehicles || response.vehicles
      );

      // Check if the response has vehicles in data.vehicles or just vehicles
      const availableVehicles =
        response.data?.vehicles || response.vehicles || [];
      const isAvailable = availableVehicles.some(
        (v) => v._id === bookingModal.vehicle._id
      );

      setBookingModal((prev) => ({
        ...prev,
        loading: false,
        availability: {
          isAvailable,
          message: isAvailable
            ? "✅ Vehicle is available for selected time"
            : "❌ Vehicle is not available for selected time",
        },
      }));
    } catch (error) {
      console.error("Error checking availability:", error);
      setBookingModal((prev) => ({
        ...prev,
        loading: false,
        availability: {
          isAvailable: false,
          message: "❌ Error checking availability",
        },
      }));
    }
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    if (
      !bookingForm.startDateTime ||
      !bookingForm.endDateTime ||
      !bookingModal.vehicle
    )
      return 0;

    const start = new Date(bookingForm.startDateTime);
    const end = new Date(bookingForm.endDateTime);
    const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));

    const vehicle = bookingModal.vehicle;

    // Determine rate based on rateType
    let hourlyRate = 150; // default fallback

    if (bookingForm.rateType === "hourly" && vehicle.rateHourly) {
      hourlyRate = bookingForm.includesFuel
        ? vehicle.rateHourly.withFuelPerHour
        : vehicle.rateHourly.withoutFuelPerHour ||
          vehicle.rateHourly.ratePerHour;
    } else if (bookingForm.rateType === "hourly12" && vehicle.rate12hr) {
      hourlyRate = bookingForm.includesFuel
        ? vehicle.rate12hr.withFuelPerHour
        : vehicle.rate12hr.withoutFuelPerHour || vehicle.rate12hr.ratePerHour;
    } else if (bookingForm.rateType === "hourly24" && vehicle.rate24hr) {
      hourlyRate = bookingForm.includesFuel
        ? vehicle.rate24hr.withFuelPerHour
        : vehicle.rate24hr.withoutFuelPerHour || vehicle.rate24hr.ratePerHour;
    } else if (vehicle.rateHourly) {
      // Fallback to hourly if available
      hourlyRate = vehicle.rateHourly.ratePerHour;
    }

    // Calculate base cost
    let baseCost = durationHours * hourlyRate;

    // Handle 12hr/24hr packages
    if (bookingForm.rateType === "hourly12" && durationHours <= 12) {
      baseCost = Math.max(
        baseCost,
        vehicle.rate12hr?.baseRate || hourlyRate * 12
      );
    } else if (bookingForm.rateType === "hourly24" && durationHours <= 24) {
      baseCost = Math.max(
        baseCost,
        vehicle.rate24hr?.baseRate || hourlyRate * 24
      );
    }

    // Add accessories cost
    const helmetPrice = 50; // ₹50 per extra helmet
    const accessoriesCost = (bookingForm.extraHelmets || 0) * helmetPrice;

    return baseCost + accessoriesCost;
  };

  // Handle document upload to Cloudinary
  const uploadDocumentToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "vehicle_documents"); // You need to create this preset in Cloudinary
    formData.append("folder", "vehicle_bookings");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  // Handle document file selection and upload
  const handleDocumentUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload only JPG, PNG, or PDF files");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    try {
      toast.info("Uploading document...");

      const uploadResult = await uploadDocumentToCloudinary(file);

      const newDocument = {
        type: documentType,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      setBookingForm((prev) => ({
        ...prev,
        documents: [
          ...prev.documents.filter((doc) => doc.type !== documentType),
          newDocument,
        ],
      }));

      toast.success(`${documentType} uploaded successfully`);
    } catch (error) {
      console.error("Document upload failed:", error);
      toast.error("Failed to upload document. Please try again.");
    }
  };

  // Remove uploaded document
  const removeDocument = (documentType) => {
    setBookingForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.type !== documentType),
    }));
  };

  // Handle booking creation
  const handleCreateBooking = async () => {
    try {
      // Form validation for offline booking
      if (!bookingForm.customerName.trim()) {
        toast.error("Customer name is required");
        return;
      }

      if (!bookingForm.customerPhone.trim()) {
        toast.error("Customer phone number is required");
        return;
      }

      if (!bookingForm.startMeterReading) {
        toast.error("Start meter reading is required for offline booking");
        return;
      }

      // Validate meter reading is a positive number
      const meterReading = parseInt(bookingForm.startMeterReading);
      if (isNaN(meterReading) || meterReading < 0) {
        toast.error("Please enter a valid meter reading");
        return;
      }

      // Validate payment amounts
      const totalReceived =
        parseFloat(bookingForm.cashAmount || 0) +
        parseFloat(bookingForm.onlineAmount || 0);
      const estimatedCost = calculateEstimatedCost();
      const securityDeposit = parseFloat(bookingForm.depositAmount || 0);
      const totalRequired = estimatedCost + securityDeposit;

      if (totalReceived > totalRequired) {
        toast.error(
          `Total payment received (₹${totalReceived}) cannot exceed total required amount (₹${totalRequired})`
        );
        return;
      }

      setBookingModal((prev) => ({ ...prev, loading: true }));

      const bookingData = {
        vehicleId: bookingModal.vehicle._id,
        customerDetails: {
          name: bookingForm.customerName,
          phone: bookingForm.customerPhone,
          email: bookingForm.customerEmail,
          address: bookingForm.address,
        },
        startDateTime: bookingForm.startDateTime,
        endDateTime: bookingForm.endDateTime,
        rateType: bookingForm.rateType,
        includesFuel: bookingForm.includesFuel,
        addons: [
          ...(bookingForm.extraHelmets > 0
            ? [
                {
                  name: "Extra Helmet",
                  count: bookingForm.extraHelmets,
                  price: 50,
                },
              ]
            : []),
          ...(bookingForm.phoneMount
            ? [
                {
                  name: "Phone Mount",
                  count: 1,
                  price: 0,
                },
              ]
            : []),
        ],
        accessoriesChecklist: {
          helmet: 1 + (bookingForm.extraHelmets || 0), // Total helmet count (1 standard + extras)
          phoneMount: bookingForm.phoneMount,
          toolkit: true,
          spareTyre: false,
          firstAidKit: true,
        },
        // Vehicle handover details for offline booking
        handoverDetails: {
          startMeterReading: parseInt(bookingForm.startMeterReading) || 0,
          fuelLevel: bookingForm.fuelLevel,
          vehicleCondition: bookingForm.vehicleCondition,
          handoverTime: new Date().toISOString(),
          handoverNotes: bookingForm.notes,
        },
        paymentMethod: bookingForm.paymentMethod,
        depositAmount: parseFloat(bookingForm.depositAmount) || 0,
        cashAmount: parseFloat(bookingForm.cashAmount),
        onlineAmount: parseFloat(bookingForm.onlineAmount),
        documents: bookingForm.documents,
        notes: bookingForm.notes,
        zoneId: bookingModal.vehicle.zoneCode, // Use zoneCode for backend compatibility

        // Debug logging
        _debug: {
          vehicleZoneId: bookingModal.vehicle.zoneId,
          vehicleZoneCode: bookingModal.vehicle.zoneCode,
          vehicleZoneName: bookingModal.vehicle.zoneCenterName,
        },

        // Offline booking flags
        isOfflineBooking: true,
        bookingSource: "offline", // Specify this is an offline booking
        requiresVerification: false, // No OTP verification needed for offline bookings
      };

      console.log("📤 Creating booking with data:", bookingData);

      const response = await vehicleRentalAPI.createOfflineBooking(bookingData);

      if (response.success) {
        const booking = response.booking;
        toast.success(
          `🎉 Offline Booking Created Successfully!\n\n` +
            `📋 Booking ID: ${booking.bookingId}\n` +
            `🚗 Vehicle: ${bookingModal.vehicle.brand} ${bookingModal.vehicle.model}\n` +
            `📊 Start Reading: ${bookingForm.startMeterReading} KM\n` +
            `💰 Estimated Cost: ₹${calculateEstimatedCost()}\n` +
            `💵 Paid Amount: ₹${
              parseFloat(bookingForm.cashAmount || 0) +
              parseFloat(bookingForm.onlineAmount || 0)
            }\n\n` +
            `✅ Vehicle handed over to customer\n` +
            `⚠️ Final billing will be done at drop-off`,
          {
            duration: 8000,
            style: {
              maxWidth: "500px",
            },
          }
        );
        closeBookingModal();
        fetchVehicles(); // Refresh vehicle list
      } else {
        toast.error(`❌ Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("❌ Failed to create booking. Please try again.");
    } finally {
      setBookingModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setBookingForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setBookingForm((prev) => ({ ...prev, [field]: value }));
    }

    // Auto-check availability when time changes
    if (field === "startDateTime" || field === "endDateTime") {
      setBookingModal((prev) => ({ ...prev, availability: null }));
    }
  };

  // Check availability when time changes
  useEffect(() => {
    if (
      bookingModal.isOpen &&
      bookingForm.startDateTime &&
      bookingForm.endDateTime
    ) {
      const timeoutId = setTimeout(checkVehicleAvailability, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [bookingForm.startDateTime, bookingForm.endDateTime, bookingModal.isOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Available Vehicles
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your available vehicle inventory
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchVehicles()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

              {/* Zone Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  value={filters.zone}
                  onChange={(e) =>
                    setFilters({ ...filters, zone: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">All Zones</option>
                  {zones.map((zone) => (
                    <option key={zone.zonecode} value={zone.zonename}>
                      {zone.zonename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <select
                value={filters.availability}
                onChange={(e) =>
                  setFilters({ ...filters, availability: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Availability</option>
                <option value="available">Available</option>
                <option value="not-available">Not Available</option>
                <option value="reserved">Reserved</option>
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
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="scooty">Scooty</option>
                <option value="bus">Bus</option>
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
                <option value="companyName-asc">Company A-Z</option>
                <option value="companyName-desc">Company Z-A</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>

              {/* Stats */}
              <div className="flex items-center justify-center bg-green-50 rounded-md px-3 py-2">
                <span className="text-sm font-medium text-green-800">
                  {vehicles.length} Available
                </span>
              </div>
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
            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-6 sm:hidden">
              {vehicles.map((vehicle) => {
                const formattedVehicle = formatVehicleForDisplay(vehicle);
                return (
                  <div
                    key={vehicle._id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-green-500"
                  >
                    {/* Vehicle Image */}
                    <div className="relative h-48 rounded-t-lg overflow-hidden">
                      {vehicle.vehicleImages?.[0] ? (
                        <img
                          src={vehicle.vehicleImages[0]}
                          alt={`${vehicle.companyName} ${vehicle.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Car className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vehicle.type}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <button
                          onClick={() => handleToggleAvailability(vehicle._id)}
                          className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm"
                          title="Make Unavailable"
                        >
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {vehicle.companyName} {vehicle.name}
                        </h3>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-500">
                            {vehicle.modelYear || "N/A"}
                          </span>
                          <span className="text-xs font-medium text-gray-400">
                            {vehicle.color}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 font-mono">
                        {vehicle.vehicleNo}
                      </p>

                      {/* Zone Info */}
                      <div className="mb-3 flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle.zoneCenterName || "Zone N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.zoneCode} • {vehicle.zoneCenterAddress}
                          </p>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-500">
                        <div className="bg-gray-50 p-1.5 rounded text-center">
                          <span className="block font-medium text-gray-700">
                            {vehicle.mileage || "-"} kmpl
                          </span>
                          Mileage
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded text-center">
                          <span className="block font-medium text-gray-700">
                            {vehicle.fuelCapacity || "-"} L
                          </span>
                          Fuel Cap
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded text-center">
                          <span className="block font-medium text-gray-700">
                            {vehicle.seatingCapacity || 2}
                          </span>
                          Seats
                        </div>
                      </div>

                      {/* Features */}
                      {vehicle.vehicleFeatures?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {vehicle.vehicleFeatures
                            .slice(0, 3)
                            .map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {feature}
                              </span>
                            ))}
                          {vehicle.vehicleFeatures.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{vehicle.vehicleFeatures.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center space-x-4 text-gray-600">
                          {vehicle.rate24hr?.ratePerHour && (
                            <span className="font-medium text-green-600">
                              ₹{vehicle.rate24hr.ratePerHour}/day
                            </span>
                          )}
                          {vehicle.rate12hr?.ratePerHour && (
                            <span>₹{vehicle.rate12hr.ratePerHour}/12hr</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleBookNow(vehicle)}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm font-medium flex items-center justify-center space-x-1"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Book Now</span>
                        </button>
                        <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {vehicle.vehicleImages?.[0] ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={vehicle.vehicleImages[0]}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Car className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.companyName} {vehicle.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicle.vehicleNo}
                              </div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize mt-1">
                                {vehicle.type}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {vehicle.zoneCenterName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vehicle.zoneCode}
                          </div>
                          <div
                            className="text-xs text-gray-400 truncate max-w-xs"
                            title={vehicle.zoneCenterAddress}
                          >
                            {vehicle.zoneCenterAddress}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500 flex flex-col space-y-1">
                            <span>
                              Seats:{" "}
                              <span className="text-gray-900">
                                {vehicle.seatingCapacity || 2}
                              </span>
                            </span>
                            <span>
                              Color:{" "}
                              <span className="text-gray-900">
                                {vehicle.color || "-"}
                              </span>
                            </span>
                            <span>
                              Fuel:{" "}
                              <span className="text-gray-900">
                                {vehicle.fuelCapacity
                                  ? `${vehicle.fuelCapacity}L`
                                  : "-"}
                              </span>
                            </span>
                            <span>
                              Mileage:{" "}
                              <span className="text-gray-900">
                                {vehicle.mileage
                                  ? `${vehicle.mileage}kpl`
                                  : "-"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            {vehicle.rate24hr?.baseRate && (
                              <span className="text-green-600 font-medium">
                                ₹{vehicle.rate24hr.baseRate}/24hr
                              </span>
                            )}
                            {vehicle.rate12hr?.baseRate && (
                              <span className="text-xs">
                                ₹{vehicle.rate12hr.baseRate}/12hr
                              </span>
                            )}
                            {vehicle.rateHourly?.ratePerHour && (
                              <span className="text-xs">
                                ₹{vehicle.rateHourly.ratePerHour}/hr
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleToggleAvailability(vehicle._id)
                            }
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Available
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleBookNow(vehicle)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Book Vehicle"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Book
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Vehicle"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <CheckCircle className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No available vehicles
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filters.search || filters.category
                ? "Try adjusting your filters."
                : "Add vehicles to your inventory or check if they are marked as available."}
            </p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop - More opaque for better contrast */}
            <div
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={closeBookingModal}
            ></div>

            {/* Modal positioning element */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Modal content wrapper with better contrast */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-12 w-12">
                      {bookingModal.vehicle?.vehicleImages?.[0] ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          src={bookingModal.vehicle.vehicleImages[0]}
                          alt=""
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        📋 Offline Booking - {bookingModal.vehicle?.companyName}{" "}
                        {bookingModal.vehicle?.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        🏪 Shop Counter Booking • No OTP Required
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {bookingModal.vehicle?.vehicleNo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeBookingModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Booking Form */}
                <div className="space-y-6">
                  {/* Customer Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Name */}
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={bookingForm.customerName}
                        onChange={(e) =>
                          handleFormChange("customerName", e.target.value)
                        }
                        className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        required
                      />

                      {/* Phone and Email */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="tel"
                          placeholder="Phone Number *"
                          value={bookingForm.customerPhone}
                          onChange={(e) =>
                            handleFormChange("customerPhone", e.target.value)
                          }
                          className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email (Optional)"
                          value={bookingForm.customerEmail}
                          onChange={(e) =>
                            handleFormChange("customerEmail", e.target.value)
                          }
                          className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        />
                      </div>

                      {/* Address (Optional) */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Street Address (Optional)"
                          value={bookingForm.address.street}
                          onChange={(e) =>
                            handleFormChange("address.street", e.target.value)
                          }
                          className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="City (Optional)"
                            value={bookingForm.address.city}
                            onChange={(e) =>
                              handleFormChange("address.city", e.target.value)
                            }
                            className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="State (Optional)"
                            value={bookingForm.address.state}
                            onChange={(e) =>
                              handleFormChange("address.state", e.target.value)
                            }
                            className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Pincode (Optional)"
                            value={bookingForm.address.pincode}
                            onChange={(e) =>
                              handleFormChange(
                                "address.pincode",
                                e.target.value
                              )
                            }
                            maxLength="6"
                            className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Time */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-green-600" />
                      Rental Period
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={bookingForm.startDateTime}
                          onChange={(e) =>
                            handleFormChange("startDateTime", e.target.value)
                          }
                          min={new Date().toISOString().slice(0, 16)}
                          className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={bookingForm.endDateTime}
                          onChange={(e) =>
                            handleFormChange("endDateTime", e.target.value)
                          }
                          min={bookingForm.startDateTime}
                          className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Availability Check */}
                    {bookingModal.loading && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm font-medium text-blue-700">
                          Checking vehicle availability...
                        </span>
                      </div>
                    )}

                    {bookingModal.availability && !bookingModal.loading && (
                      <div
                        className={`mt-4 p-4 border rounded-lg font-medium ${
                          bookingModal.availability.isAvailable
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {bookingModal.availability.isAvailable ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-sm">
                            {bookingModal.availability.message}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rate Plan Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                      Select Plan
                    </h4>
                    <div className="space-y-3">
                      {/* Regular Hourly Plan */}
                      {bookingModal.vehicle?.rateHourly && (
                        <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-white hover:border-indigo-300 transition-all">
                          <input
                            type="radio"
                            name="rateType"
                            value="hourly"
                            checked={bookingForm.rateType === "hourly"}
                            onChange={(e) =>
                              handleFormChange("rateType", e.target.value)
                            }
                            className="text-indigo-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              Hourly Plan
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹
                              {bookingModal.vehicle?.rateHourly
                                ?.withoutFuelPerHour ||
                                bookingModal.vehicle?.rateHourly?.ratePerHour ||
                                "N/A"}
                              /hr •{" "}
                              {bookingModal.vehicle?.rateHourly
                                ?.kmFreePerHour || "10"}{" "}
                              km/hr free
                            </div>
                          </div>
                        </label>
                      )}

                      {/* 12 Hour Plan */}
                      {bookingModal.vehicle?.rate12hr && (
                        <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-white hover:border-indigo-300 transition-all">
                          <input
                            type="radio"
                            name="rateType"
                            value="hourly12"
                            checked={bookingForm.rateType === "hourly12"}
                            onChange={(e) =>
                              handleFormChange("rateType", e.target.value)
                            }
                            className="text-indigo-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              12 Hour Plan
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹
                              {bookingModal.vehicle?.rate12hr
                                ?.withoutFuelPerHour ||
                                bookingModal.vehicle?.rate12hr?.ratePerHour ||
                                "N/A"}
                              /hr •{" "}
                              {bookingModal.vehicle?.rate12hr?.kmLimit ||
                                "Unlimited"}{" "}
                              km limit
                            </div>
                          </div>
                        </label>
                      )}

                      {/* 24 Hour Plan */}
                      {bookingModal.vehicle?.rate24hr && (
                        <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-white hover:border-indigo-300 transition-all">
                          <input
                            type="radio"
                            name="rateType"
                            value="hourly24"
                            checked={bookingForm.rateType === "hourly24"}
                            onChange={(e) =>
                              handleFormChange("rateType", e.target.value)
                            }
                            className="text-indigo-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              24 Hour Plan
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹
                              {bookingModal.vehicle?.rate24hr
                                ?.withoutFuelPerHour ||
                                bookingModal.vehicle?.rate24hr?.ratePerHour ||
                                "N/A"}
                              /hr •{" "}
                              {bookingModal.vehicle?.rate24hr?.kmLimit ||
                                "Unlimited"}{" "}
                              km limit
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Fuel & Accessories */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-orange-600" />
                      Fuel & Accessories
                    </h4>
                    <div className="space-y-4">
                      {/* Include Fuel */}
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:bg-white hover:border-orange-300 transition-all">
                        <input
                          type="checkbox"
                          checked={bookingForm.includesFuel}
                          onChange={(e) =>
                            handleFormChange("includesFuel", e.target.checked)
                          }
                          className="text-orange-600 w-5 h-5"
                        />
                        <div>
                          <span className="block text-sm font-medium text-gray-800">
                            Include Fuel
                          </span>
                          <span className="block text-xs text-gray-500">
                            Additional charges apply based on duration
                          </span>
                        </div>
                      </label>

                      {/* Extra Helmets */}
                      <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:bg-white hover:border-orange-300 transition-all">
                        <div>
                          <span className="block text-sm font-medium text-gray-800">
                            Extra Helmet
                          </span>
                          <span className="block text-xs text-gray-500">
                            ₹50 per helmet
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleFormChange(
                                "extraHelmets",
                                Math.max(0, bookingForm.extraHelmets - 1)
                              )
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold w-4 text-center">
                            {bookingForm.extraHelmets}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleFormChange(
                                "extraHelmets",
                                Math.min(3, bookingForm.extraHelmets + 1)
                              )
                            }
                            className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Phone Mount */}
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:bg-white hover:border-orange-300 transition-all">
                        <input
                          type="checkbox"
                          checked={bookingForm.phoneMount}
                          onChange={(e) =>
                            handleFormChange("phoneMount", e.target.checked)
                          }
                          className="text-orange-600 w-5 h-5"
                        />
                        <div>
                          <span className="block text-sm font-medium text-gray-800">
                            Phone Mount
                          </span>
                          <span className="block text-xs text-gray-500">
                            Mobile holder for navigation
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Cost Calculation */}
                  {calculateEstimatedCost() > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">
                            Cost Breakdown:
                          </span>
                        </div>
                        <span className="text-xl font-bold text-amber-900">
                          ₹{calculateEstimatedCost().toLocaleString()}
                        </span>
                      </div>

                      {/* Cost breakdown details */}
                      <div className="text-xs space-y-1 text-amber-700">
                        <div className="flex justify-between">
                          <span>
                            Plan:{" "}
                            {bookingForm.rateType === "hourly"
                              ? "Hourly"
                              : bookingForm.rateType === "hourly12"
                              ? "12-Hour"
                              : "24-Hour"}
                          </span>
                          <span>
                            {bookingForm.includesFuel
                              ? "(With Fuel)"
                              : "(Without Fuel)"}
                          </span>
                        </div>
                        {bookingForm.extraHelmets > 0 && (
                          <div className="flex justify-between">
                            <span>
                              Extra Helmets ({bookingForm.extraHelmets}x)
                            </span>
                            <span>
                              ₹
                              {(bookingForm.extraHelmets * 50).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-amber-600 mt-2">
                          Duration:{" "}
                          {bookingForm.startDateTime && bookingForm.endDateTime
                            ? Math.ceil(
                                (new Date(bookingForm.endDateTime) -
                                  new Date(bookingForm.startDateTime)) /
                                  (1000 * 60 * 60)
                              ) + " hours"
                            : "Select dates to calculate"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Collection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                      Payment Collection
                    </h4>

                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleFormChange("paymentMethod", "cash")
                        }
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                          bookingForm.paymentMethod === "cash"
                            ? "bg-green-100 border-green-500 text-green-700"
                            : "bg-white border-gray-300 text-gray-600 hover:border-green-300"
                        }`}
                      >
                        <span className="text-2xl mb-1">💰</span>
                        <span className="text-xs font-medium">Cash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormChange("paymentMethod", "upi")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                          bookingForm.paymentMethod === "upi"
                            ? "bg-blue-100 border-blue-500 text-blue-700"
                            : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
                        }`}
                      >
                        <span className="text-2xl mb-1">📱</span>
                        <span className="text-xs font-medium">UPI/QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleFormChange("paymentMethod", "mixed")
                        }
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                          bookingForm.paymentMethod === "mixed"
                            ? "bg-purple-100 border-purple-500 text-purple-700"
                            : "bg-white border-gray-300 text-gray-600 hover:border-purple-300"
                        }`}
                      >
                        <span className="text-2xl mb-1">💳</span>
                        <span className="text-xs font-medium">Mixed</span>
                      </button>
                    </div>

                    {/* Amount Inputs */}
                    <div className="space-y-3">
                      {bookingForm.paymentMethod === "mixed" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              💵 Cash Amount
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={bookingForm.cashAmount}
                              onChange={(e) =>
                                handleFormChange("cashAmount", e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className="block w-full px-4 py-3 border-2 border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              📱 Online Amount
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={bookingForm.onlineAmount}
                              onChange={(e) =>
                                handleFormChange("onlineAmount", e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className="block w-full px-4 py-3 border-2 border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {bookingForm.paymentMethod === "cash"
                              ? "💵 Cash Amount Received"
                              : "📱 UPI Amount Received"}
                          </label>
                          <input
                            type="number"
                            placeholder="₹ 0.00"
                            value={
                              bookingForm.paymentMethod === "cash"
                                ? bookingForm.cashAmount
                                : bookingForm.onlineAmount
                            }
                            onChange={(e) => {
                              if (bookingForm.paymentMethod === "cash") {
                                handleFormChange("cashAmount", e.target.value);
                                handleFormChange("onlineAmount", 0);
                              } else {
                                handleFormChange(
                                  "onlineAmount",
                                  e.target.value
                                );
                                handleFormChange("cashAmount", 0);
                              }
                            }}
                            min="0"
                            step="0.01"
                            className={`block w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:ring-2 sm:text-sm bg-white ${
                              bookingForm.paymentMethod === "cash"
                                ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                                : "border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                          />
                        </div>
                      )}

                      {/* Deposit Section */}
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <label className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-semibold text-yellow-800">
                            🔒 Required Security Deposit
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Auto-filled from vehicle
                          </span>
                        </label>
                        <input
                          type="number"
                          value={bookingForm.depositAmount}
                          readOnly
                          className="block w-full px-4 py-3 border-2 border-yellow-300 rounded-lg shadow-sm bg-yellow-100 text-yellow-900 font-semibold text-lg cursor-not-allowed"
                        />
                        <p className="text-xs text-yellow-700 mt-1">
                          <strong>Note:</strong> This is the security amount
                          that must be collected from customer (refundable on
                          return)
                        </p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    {(parseFloat(bookingForm.cashAmount) +
                      parseFloat(bookingForm.onlineAmount) >
                      0 ||
                      parseFloat(bookingForm.depositAmount) > 0) &&
                      calculateEstimatedCost() > 0 && (
                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">
                            💰 Billing Summary
                          </h5>
                          <div className="space-y-2">
                            {/* Rental Cost */}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Rental Cost (Estimated):
                              </span>
                              <span className="font-medium text-gray-800">
                                ₹{calculateEstimatedCost().toLocaleString()}
                              </span>
                            </div>

                            {/* Required Security Deposit */}
                            {parseFloat(bookingForm.depositAmount) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-yellow-600">
                                  Required Security Deposit:
                                </span>
                                <span className="font-medium text-yellow-600">
                                  ₹
                                  {parseFloat(
                                    bookingForm.depositAmount
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}

                            {/* Total Amount Customer Should Pay */}
                            <div className="flex justify-between text-sm font-semibold border-t pt-2">
                              <span className="text-purple-700">
                                Total Amount from Customer:
                              </span>
                              <span className="text-purple-700">
                                ₹
                                {(
                                  calculateEstimatedCost() +
                                  parseFloat(bookingForm.depositAmount || 0)
                                ).toLocaleString()}
                              </span>
                            </div>

                            <div className="border-t pt-2 space-y-1">
                              <h6 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Money Received from Customer:
                              </h6>

                              {/* Cash Payment */}
                              {parseFloat(bookingForm.cashAmount) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    💵 Cash Received:
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    ₹
                                    {parseFloat(
                                      bookingForm.cashAmount
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* Online Payment */}
                              {parseFloat(bookingForm.onlineAmount) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    � Online Received:
                                  </span>
                                  <span className="font-semibold text-blue-600">
                                    ₹
                                    {parseFloat(
                                      bookingForm.onlineAmount
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* Total Money Actually Received */}
                              <div className="flex justify-between text-sm font-semibold border-t pt-1">
                                <span className="text-green-700">
                                  Total Money Received:
                                </span>
                                <span className="text-green-700">
                                  ₹
                                  {(
                                    parseFloat(bookingForm.cashAmount || 0) +
                                    parseFloat(bookingForm.onlineAmount || 0)
                                  ).toLocaleString()}
                                </span>
                              </div>

                              {/* Outstanding Payment */}
                              {calculateEstimatedCost() +
                                parseFloat(bookingForm.depositAmount || 0) >
                                parseFloat(bookingForm.cashAmount || 0) +
                                  parseFloat(bookingForm.onlineAmount || 0) && (
                                <div className="flex justify-between text-sm font-semibold">
                                  <span className="text-red-600">
                                    Outstanding from Customer:
                                  </span>
                                  <span className="text-red-600">
                                    ₹
                                    {Math.max(
                                      0,
                                      calculateEstimatedCost() +
                                        parseFloat(
                                          bookingForm.depositAmount || 0
                                        ) -
                                        (parseFloat(
                                          bookingForm.cashAmount || 0
                                        ) +
                                          parseFloat(
                                            bookingForm.onlineAmount || 0
                                          ))
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Vehicle Handover Details - Offline Booking */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <Car className="w-6 h-6 mr-2 text-blue-600" />
                      Vehicle Handover Details
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Record vehicle condition and meter reading at the time of
                      handover
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Start Meter Reading */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          <span className="text-red-500">*</span> Start Meter
                          Reading (KM)
                        </label>
                        <input
                          type="number"
                          value={bookingForm.startMeterReading}
                          onChange={(e) =>
                            handleFormChange(
                              "startMeterReading",
                              e.target.value
                            )
                          }
                          placeholder="Enter current meter reading"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Please record the exact odometer reading
                        </p>
                      </div>

                      {/* Fuel Level */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Fuel Level
                        </label>
                        <select
                          value={bookingForm.fuelLevel}
                          onChange={(e) =>
                            handleFormChange("fuelLevel", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="full">🔴 Full Tank</option>
                          <option value="half">🟡 Half Tank</option>
                          <option value="quarter">🟠 Quarter Tank</option>
                          <option value="empty">⚫ Empty/Reserve</option>
                        </select>
                      </div>

                      {/* Vehicle Condition */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Overall Vehicle Condition
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {
                              value: "excellent",
                              label: "Excellent",
                              color: "green",
                            },
                            { value: "good", label: "Good", color: "blue" },
                            { value: "fair", label: "Fair", color: "yellow" },
                            { value: "poor", label: "Poor", color: "red" },
                          ].map(({ value, label, color }) => (
                            <label
                              key={value}
                              className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                bookingForm.vehicleCondition === value
                                  ? color === "green"
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : color === "blue"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : color === "yellow"
                                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                    : "border-red-500 bg-red-50 text-red-700"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                              }`}
                            >
                              <input
                                type="radio"
                                value={value}
                                checked={bookingForm.vehicleCondition === value}
                                onChange={(e) =>
                                  handleFormChange(
                                    "vehicleCondition",
                                    e.target.value
                                  )
                                }
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Document any damages or issues in the notes section
                          below
                        </p>
                      </div>

                      {/* Handover Notes */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Handover Notes & Vehicle Inspection
                        </label>
                        <textarea
                          value={bookingForm.notes}
                          onChange={(e) =>
                            handleFormChange("notes", e.target.value)
                          }
                          placeholder="Document any existing damages, scratches, or special conditions. Record anything customer should be aware of..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500">
                          These notes will be used for comparison during
                          drop-off
                        </p>
                      </div>
                    </div>

                    {/* Important Notice */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                        <div className="text-sm text-yellow-800">
                          <strong>Important:</strong> Final billing will be
                          calculated at drop-off based on:
                          <ul className="list-disc ml-5 mt-1 space-y-1">
                            <li>
                              Actual distance covered (final meter reading -
                              start meter reading)
                            </li>
                            <li>
                              Actual time duration (drop-off time - handover
                              time)
                            </li>
                            <li>Fuel usage and vehicle condition changes</li>
                            <li>
                              Any additional charges for damages or extra
                              services
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Upload - Optional */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                      Upload Documents (Optional)
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Document uploads are optional. You can add customer
                      documents if available.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID Proof Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          {bookingForm.documents.find(
                            (doc) => doc.type === "aadhar"
                          ) ? (
                            <div className="space-y-2">
                              <FileText className="w-8 h-8 text-green-600 mx-auto" />
                              <p className="text-sm font-medium text-green-600">
                                ID Proof Uploaded
                              </p>
                              <button
                                type="button"
                                onClick={() => removeDocument("aadhar")}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600">
                                Upload ID Proof (Optional)
                              </p>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "aadhar")
                                }
                                className="hidden"
                                id="aadhar-upload"
                              />
                              <label
                                htmlFor="aadhar-upload"
                                className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md cursor-pointer hover:bg-indigo-200"
                              >
                                Choose File
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address Proof Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          {bookingForm.documents.find(
                            (doc) => doc.type === "license"
                          ) ? (
                            <div className="space-y-2">
                              <FileText className="w-8 h-8 text-green-600 mx-auto" />
                              <p className="text-sm font-medium text-green-600">
                                Document Uploaded
                              </p>
                              <button
                                type="button"
                                onClick={() => removeDocument("license")}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600">
                                Upload Address/Other Document (Optional)
                              </p>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "license")
                                }
                                className="hidden"
                                id="license-upload"
                              />
                              <label
                                htmlFor="license-upload"
                                className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md cursor-pointer hover:bg-indigo-200"
                              >
                                Choose File
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Edit className="w-4 h-4 mr-2 text-gray-500" />
                      Additional Notes
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Any special instructions, damages, or notes..."
                      value={bookingForm.notes}
                      onChange={(e) =>
                        handleFormChange("notes", e.target.value)
                      }
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-100 px-4 py-4 sm:px-6 border-t border-gray-200">
                {/* Offline Booking Process Info */}
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <strong>This offline booking will:</strong>
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>✅ Immediately mark vehicle as booked</li>
                        <li>📋 Generate initial billing receipt</li>
                        <li>🚗 Record vehicle handover details</li>
                        <li>💰 Process advance payment collection</li>
                        <li>
                          ⚠️ Require final settlement at drop-off based on
                          actual usage
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={
                      !bookingForm.customerName ||
                      !bookingForm.customerPhone ||
                      !bookingForm.startMeterReading ||
                      !bookingForm.startDateTime ||
                      !bookingForm.endDateTime ||
                      !bookingModal.availability?.isAvailable ||
                      bookingModal.loading
                    }
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingModal.loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Create Offline Booking & Handover Vehicle
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeBookingModal}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        cancelText={confirmationConfig.cancelText}
        type={confirmationConfig.type}
      />
    </div>
  );
};

export default SellerAvailableVehicles;
