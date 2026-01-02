import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetVehicleByIdQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useGetPublicZonesQuery,
} from "../../../redux/api/vehicleApi";
import {
  FiSave,
  FiArrowLeft,
  FiUpload,
  FiX,
  FiMapPin,
  FiDollarSign,
  FiInfo,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
const AdminVehicleForm = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!vehicleId;

  // RTK Query hooks
  const {
    data: vehicleData,
    isLoading: vehicleLoading,
    error: vehicleError,
    isFetching: vehicleIsFetching,
  } = useGetVehicleByIdQuery(vehicleId, {
    skip: !isEdit,
  });

  // Debug RTK Query state
  useEffect(() => {
    if (isEdit) {
      console.log("RTK Query State:", {
        vehicleId,
        vehicleLoading,
        vehicleIsFetching,
        vehicleError,
        hasVehicleData: !!vehicleData,
        vehicleDataStructure: vehicleData ? Object.keys(vehicleData) : null,
      });
    }
  }, [
    isEdit,
    vehicleId,
    vehicleLoading,
    vehicleIsFetching,
    vehicleError,
    vehicleData,
  ]);

  const { data: zonesData, isLoading: zonesLoading } = useGetPublicZonesQuery();

  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation();
  const [updateVehicle, { isLoading: updating }] = useUpdateVehicleMutation();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    vehicleNo: "",
    category: "scooter",
    modelYear: new Date().getFullYear(),
    color: "",
    fuelType: "petrol",
    description: "",
    features: [],
    vehicleImages: [],
    documents: {
      rcBook: "",
      insurance: "",
      permit: "",
      puc: "",
    },
    zoneCode: "",
    zoneCenterName: "",
    zoneCenterAddress: "",
    location: {
      type: "Point",
      coordinates: [0, 0],
    },
    rate12hr: {
      withoutFuelPerHour: 0,
      withFuelPerHour: 0,
      kmLimit: 0,
      extraChargePerHour: 0,
      extraChargePerKm: 0,
    },
    rate24hr: {
      withoutFuelPerHour: 0,
      withFuelPerHour: 0,
      kmLimit: 0,
      extraChargePerHour: 0,
      extraChargePerKm: 0,
    },
    depositAmount: 0,
    status: "active",
    availability: "available",
  });

  const [newFeature, setNewFeature] = useState("");
  const [imageFiles, setImageFiles] = useState([]);

  const zones = zonesData?.data || [];

  // Debug zones data
  useEffect(() => {
    console.log("Zones data:", {
      zonesData,
      zonesLoading,
      zonesCount: zones.length,
      zones: zones.map((zone) => ({
        apiCode: zone.code,
        apiName: zone.name,
        // Legacy fields check
        zoneCode: zone.zoneCode,
        zoneName: zone.zoneName,
      })),
    });
  }, [zonesData, zonesLoading, zones]);

  // Load vehicle data for editing
  useEffect(() => {
    console.log("useEffect triggered:", { isEdit, vehicleData, vehicleId });

    if (isEdit) {
      if (vehicleLoading) {
        console.log("Vehicle data is still loading...");
        return;
      }

      if (vehicleError) {
        console.error("Error loading vehicle data:", vehicleError);
        return;
      }

      if (vehicleData) {
        console.log("Raw vehicle data from API:", vehicleData);

        if (vehicleData.data) {
          // The API response shows data directly contains the vehicle info
          const vehicle = vehicleData?.data?.vehicle;
          console.log("Loading vehicle data for edit:", vehicle);
          console.log("Vehicle structure:", {
            name: vehicle.name,
            vehicleNo: vehicle.vehicleNo,
            companyName: vehicle.companyName,
            category: vehicle.category,
            type: vehicle.type,
            rate12hr: vehicle.rate12hr,
            rate24hr: vehicle.rate24hr,
            vehicleFeatures: vehicle.vehicleFeatures,
            documents: vehicle.documents,
          });

          const newFormData = {
            name: vehicle.name || "",
            companyName: vehicle.companyName || "",
            vehicleNo: vehicle.vehicleNo || "",
            category: vehicle.category || "scooter",
            modelYear: new Date().getFullYear(),
            color: vehicle.color || "",
            fuelType: vehicle.type || "petrol", // API uses 'type' field
            description: vehicle.description || "",
            features: vehicle.vehicleFeatures || [], // API uses 'vehicleFeatures'
            vehicleImages: vehicle.vehicleImages || [],
            documents: vehicle.documents || {
              rcBook: "",
              insurance: "",
              permit: "",
              puc: "",
            },
            // Map API rate structure to form structure
            rate12hr: vehicle.rate12hr
              ? {
                  withoutFuelPerHour:
                    vehicle.rate12hr.withoutFuelPerHour ||
                    vehicle.rate12hr.ratePerHour ||
                    0,
                  withFuelPerHour: vehicle.rate12hr.withFuelPerHour || 0,
                  kmLimit: vehicle.rate12hr.kmLimit || 0,
                  extraChargePerHour: vehicle.rate12hr.extraChargePerHour || 0,
                  extraChargePerKm: vehicle.rate12hr.extraChargePerKm || 0,
                }
              : {
                  withoutFuelPerHour: 0,
                  withFuelPerHour: 0,
                  kmLimit: 0,
                  extraChargePerHour: 0,
                  extraChargePerKm: 0,
                },
            rate24hr: vehicle.rate24hr
              ? {
                  withoutFuelPerHour:
                    vehicle.rate24hr.withoutFuelPerHour ||
                    vehicle.rate24hr.ratePerHour ||
                    0,
                  withFuelPerHour: vehicle.rate24hr.withFuelPerHour || 0,
                  kmLimit: vehicle.rate24hr.kmLimit || 0,
                  extraChargePerHour: vehicle.rate24hr.extraChargePerHour || 0,
                  extraChargePerKm: vehicle.rate24hr.extraChargePerKm || 0,
                }
              : {
                  withoutFuelPerHour: 0,
                  withFuelPerHour: 0,
                  kmLimit: 0,
                  extraChargePerHour: 0,
                  extraChargePerKm: 0,
                },
            depositAmount: vehicle.depositAmount || 0,
            status: vehicle.status || "active",
            availability: vehicle.availability || "available",
            zoneCode: vehicle.zoneCode || "",
            zoneCenterName: vehicle.zoneCenterName || "",
            zoneCenterAddress: vehicle.zoneCenterAddress || "",
            location: vehicle.locationGeo || {
              type: "Point",
              coordinates: [0, 0],
            },
          };

          console.log("Setting form data:", newFormData);
          setFormData(newFormData);
        } else {
          console.error("No vehicle data in response:", vehicleData);
        }
      } else {
        console.log("No vehicle data available yet");
      }
    }
  }, [isEdit, vehicleData, vehicleLoading, vehicleError, vehicleId]);

  // Debug: Log form data changes
  useEffect(() => {
    console.log("Form data updated:", {
      name: formData.name,
      vehicleNo: formData.vehicleNo,
      companyName: formData.companyName,
      category: formData.category,
      zoneCode: formData.zoneCode,
      zoneCenterName: formData.zoneCenterName,
    });

    // Check if current zoneCode exists in available zones
    if (formData.zoneCode && zones.length > 0) {
      const matchingZone = zones.find(
        (zone) => zone.code === formData.zoneCode
      );
      console.log("Zone matching check:", {
        currentZoneCode: formData.zoneCode,
        matchingZone: matchingZone ? matchingZone.name : "NOT FOUND",
        availableZones: zones.map((z) => z.code),
      });
    }
  }, [formData, zones]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRateChange = (rateType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [rateType]: {
        ...(prev[rateType] || {}),
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleZoneChange = (zoneCode) => {
    // API uses 'code' and 'name' fields, not 'zoneCode' and 'zoneName'
    const selectedZone = zones.find((zone) => zone.code === zoneCode);
    console.log("Zone selection:", {
      zoneCode,
      selectedZone,
      availableZones: zones.map((z) => z.code),
    });

    if (selectedZone) {
      setFormData((prev) => ({
        ...prev,
        zoneCode,
        zoneCenterName: selectedZone.name,
        zoneCenterAddress:
          selectedZone.description || `${selectedZone.name} Center Address`,
        location: {
          type: "Point",
          coordinates: selectedZone.center
            ? [selectedZone.center.lng, selectedZone.center.lat]
            : [0, 0],
        },
      }));
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);

    // Create preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      vehicleImages: [...prev.vehicleImages, ...urls],
    }));
  };

  const removeImage = (index) => {
    const newImages = formData.vehicleImages.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      vehicleImages: newImages,
    }));
    setImageFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.vehicleNo || !formData.zoneCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      !formData.rate12hr?.withoutFuelPerHour ||
      formData.rate12hr.withoutFuelPerHour <= 0 ||
      !formData.rate24hr?.withoutFuelPerHour ||
      formData.rate24hr.withoutFuelPerHour <= 0
    ) {
      toast.error("Please enter valid rate information");
      return;
    }

    try {
      // Transform data to match backend schema
      const submissionData = {
        name: formData.name,
        companyName: formData.companyName,
        vehicleNo: formData.vehicleNo,
        category: formData.category,
        modelYear: parseInt(formData.modelYear),
        color: formData.color,
        type: formData.fuelType, // Backend expects 'type' not 'fuelType'
        description: formData.description,
        vehicleFeatures: formData.features, // Backend expects 'vehicleFeatures' not 'features'
        vehicleImages: formData.vehicleImages,
        documents: formData.documents,
        // Transform rate structure to match backend schema
        rate12hr: {
          ratePerHour: parseFloat(formData.rate12hr?.withoutFuelPerHour) || 0, // Backend expects 'ratePerHour'
          withoutFuelPerHour:
            parseFloat(formData.rate12hr?.withoutFuelPerHour) || 0,
          withFuelPerHour: parseFloat(formData.rate12hr?.withFuelPerHour) || 0,
          kmLimit: parseInt(formData.rate12hr?.kmLimit) || 0,
          extraChargePerHour:
            parseFloat(formData.rate12hr?.extraChargePerHour) || 0,
          extraChargePerKm:
            parseFloat(formData.rate12hr?.extraChargePerKm) || 0,
        },
        rate24hr: {
          ratePerHour: parseFloat(formData.rate24hr?.withoutFuelPerHour) || 0, // Backend expects 'ratePerHour'
          withoutFuelPerHour:
            parseFloat(formData.rate24hr?.withoutFuelPerHour) || 0,
          withFuelPerHour: parseFloat(formData.rate24hr?.withFuelPerHour) || 0,
          kmLimit: parseInt(formData.rate24hr?.kmLimit) || 0,
          extraChargePerHour:
            parseFloat(formData.rate24hr?.extraChargePerHour) || 0,
          extraChargePerKm:
            parseFloat(formData.rate24hr?.extraChargePerKm) || 0,
        },
        depositAmount: parseFloat(formData.depositAmount),
        status: formData.status,
        availability: formData.availability,
        zoneCode: formData.zoneCode,
        zoneCenterName: formData.zoneCenterName,
        zoneCenterAddress:
          formData.zoneCenterAddress ||
          formData.zoneCenterName ||
          "Address Not Available",
        locationGeo: formData.location, // Backend expects 'locationGeo' not 'location'
      };

      // Filter out undefined/null values to avoid backend issues
      Object.keys(submissionData).forEach((key) => {
        if (submissionData[key] === undefined || submissionData[key] === null) {
          delete submissionData[key];
        }
      });

      console.log("Submitting data to backend:", submissionData);
      console.log("Original form data:", formData);

      if (isEdit) {
        console.log("Calling updateVehicle with:", {
          vehicleId,
          vehicleData: submissionData,
        });
        const result = await updateVehicle({
          vehicleId,
          vehicleData: submissionData,
        }).unwrap();
        console.log("Update result:", result);
        toast.success("Vehicle updated successfully!");
      } else {
        const result = await createVehicle(submissionData).unwrap();
        console.log("Create result:", result);
        toast.success("Vehicle created successfully!");
      }

      navigate("/admin/vehicles");
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(error?.data?.message || "Failed to save vehicle");
    }
  };

  if (vehicleError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Vehicle not found</p>
          <button
            onClick={() => navigate("/admin/vehicles")}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  if ((isEdit && vehicleLoading) || zonesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && vehicleError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Vehicle</h3>
          <p className="text-red-600">
            Failed to load vehicle data. Please try again.
          </p>
          <button
            onClick={() => navigate("/admin/vehicles")}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Debug Info - Remove in production */}
      {isEdit && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>Debug Info:</strong> vehicleId: {vehicleId}, isEdit:{" "}
          {isEdit.toString()}, hasVehicleData:{" "}
          {!!vehicleData?.data ? "Yes" : "No"}, vehicleLoading:{" "}
          {vehicleLoading.toString()}, vehicleError:{" "}
          {vehicleError ? "Yes" : "No"}, formName: "{formData.name}",
          formVehicleNo: "{formData.vehicleNo}", currentZone: "
          {formData.zoneCode}", zonesCount: {zones.length}
          <button
            onClick={async () => {
              try {
                const baseUrl =
                  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const url = `${baseUrl}/api/vehicles/${vehicleId}`;
                console.log("Testing API URL:", url);
                const response = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                });
                const data = await response.json();
                console.log("Direct API call result:", data);
                alert("Check console for API response");
              } catch (error) {
                console.error("Direct API call error:", error);
                alert("API call failed - check console");
              }
            }}
            className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
          >
            Test Vehicle API
          </button>
          <button
            onClick={async () => {
              try {
                const baseUrl =
                  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
                const url = `${baseUrl}/zones`;
                console.log("Testing Zones API URL:", url);
                const response = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                });
                const data = await response.json();
                console.log("Direct Zones API call result:", data);
                alert("Check console for Zones API response");
              } catch (error) {
                console.error("Direct Zones API call error:", error);
                alert("Zones API call failed - check console");
              }
            }}
            className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded"
          >
            Test Zones API
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/vehicles")}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Update vehicle information"
                : "Add a new vehicle to your fleet"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaCar className="w-5 h-5 mr-2" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Honda Activa 6G"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Honda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Number *
              </label>
              <input
                type="text"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., GJ 01 AB 1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="scooter">Scooter</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Year
              </label>
              <input
                type="number"
                name="modelYear"
                value={formData.modelYear}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="2000"
                max="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Red"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiMapPin className="w-5 h-5 mr-2" />
            Location & Zone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone *
              </label>
              <select
                value={formData.zoneCode}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.code} value={zone.code}>
                    {zone.name} ({zone.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Center Name
              </label>
              <input
                type="text"
                value={formData.zoneCenterName}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
                placeholder="Select zone first"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="w-5 h-5 mr-2" />
            Pricing Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 12 Hour Rate */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">
                12 Hour Plan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (without fuel) *
                  </label>
                  <input
                    type="number"
                    value={formData.rate12hr?.withoutFuelPerHour || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate12hr",
                        "withoutFuelPerHour",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/hour"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (with fuel)
                  </label>
                  <input
                    type="number"
                    value={formData.rate12hr?.withFuelPerHour || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate12hr",
                        "withFuelPerHour",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/hour"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KM Limit
                  </label>
                  <input
                    type="number"
                    value={formData.rate12hr?.kmLimit || 0}
                    onChange={(e) =>
                      handleRateChange("rate12hr", "kmLimit", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="KM"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Charge/KM
                  </label>
                  <input
                    type="number"
                    value={formData.rate12hr?.extraChargePerKm || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate12hr",
                        "extraChargePerKm",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/KM"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* 24 Hour Rate */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">
                24 Hour Plan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (without fuel) *
                  </label>
                  <input
                    type="number"
                    value={formData.rate24hr?.withoutFuelPerHour || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate24hr",
                        "withoutFuelPerHour",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/hour"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (with fuel)
                  </label>
                  <input
                    type="number"
                    value={formData.rate24hr?.withFuelPerHour || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate24hr",
                        "withFuelPerHour",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/hour"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KM Limit
                  </label>
                  <input
                    type="number"
                    value={formData.rate24hr?.kmLimit || 0}
                    onChange={(e) =>
                      handleRateChange("rate24hr", "kmLimit", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="KM"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra Charge/KM
                  </label>
                  <input
                    type="number"
                    value={formData.rate24hr?.extraChargePerKm || 0}
                    onChange={(e) =>
                      handleRateChange(
                        "rate24hr",
                        "extraChargePerKm",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹/KM"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit Amount *
            </label>
            <input
              type="number"
              name="depositAmount"
              value={formData.depositAmount}
              onChange={handleInputChange}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="₹"
              min="0"
              required
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiInfo className="w-5 h-5 mr-2" />
            Features & Description
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the vehicle features and condition..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Features
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bluetooth connectivity"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Images */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUpload className="w-5 h-5 mr-2" />
            Vehicle Images
          </h2>

          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="vehicle-images"
              />
              <label
                htmlFor="vehicle-images"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Upload Images
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Upload multiple images of the vehicle. First image will be used
                as thumbnail.
              </p>
            </div>

            {formData.vehicleImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.vehicleImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Thumbnail
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Status Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate("/admin/vehicles")}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || updating}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {creating || updating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <FiSave className="w-5 h-5 mr-2" />
            )}
            {isEdit ? "Update Vehicle" : "Create Vehicle"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminVehicleForm;
