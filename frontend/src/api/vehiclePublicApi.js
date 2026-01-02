import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export const vehiclePublicApi = createApi({
  reducerPath: "vehiclePublicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/vehicles`,
  }),
  tagTypes: ["Vehicle", "Shop", "VehicleType", "Filters"],
  endpoints: (builder) => ({
    // Get vehicles with advanced filtering
    getVehicles: builder.query({
      query: (params = {}) => ({
        url: "/public",
        params: {
          page: 1,
          limit: 12,
          ...params,
        },
      }),
      providesTags: ["Vehicle"],
    }),

    // Get vehicle shops
    getVehicleShops: builder.query({
      query: (params = {}) => ({
        url: "/public/shops",
        params,
      }),
      providesTags: ["Shop"],
    }),

    // Get vehicle types with counts
    getVehicleTypes: builder.query({
      query: (params = {}) => ({
        url: "/public/types",
        params,
      }),
      providesTags: ["VehicleType"],
    }),

    // Get filter options
    getFilterOptions: builder.query({
      query: (params = {}) => ({
        url: "/public/filters",
        params,
      }),
      providesTags: ["Filters"],
    }),

    // Get single vehicle by ID
    getVehicleById: builder.query({
      query: (id) => `/public/${id}`,
      providesTags: (result, error, id) => [{ type: "Vehicle", id }],
    }),

    // Check vehicle availability
    checkAvailability: builder.mutation({
      query: (data) => ({
        url: "/check-availability",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetVehicleShopsQuery,
  useGetVehicleTypesQuery,
  useGetFilterOptionsQuery,
  useGetVehicleByIdQuery,
  useCheckAvailabilityMutation,
} = vehiclePublicApi;


export const processVoiceCommand = (transcript) => {
  const lowerTranscript = transcript.toLowerCase();
  const filters = {};

  // Extract vehicle type
  if (lowerTranscript.includes('bike') && !lowerTranscript.includes('ev')) {
    filters.type = 'bike';
  } else if (lowerTranscript.includes('car') && !lowerTranscript.includes('ev')) {
    filters.type = 'car';
  } else if (lowerTranscript.includes('scooty') && !lowerTranscript.includes('ev')) {
    filters.type = 'scooty';
  } else if (lowerTranscript.includes('electric bike') || lowerTranscript.includes('ev bike')) {
    filters.type = 'ev-bike';
  } else if (lowerTranscript.includes('electric car') || lowerTranscript.includes('ev car')) {
    filters.type = 'ev-car';
  } else if (lowerTranscript.includes('electric scooty') || lowerTranscript.includes('ev scooty')) {
    filters.type = 'ev-scooty';
  }

  // Extract fuel type
  if (lowerTranscript.includes('petrol')) {
    filters.fuelType = 'petrol';
  } else if (lowerTranscript.includes('diesel')) {
    filters.fuelType = 'diesel';
  } else if (lowerTranscript.includes('electric') || lowerTranscript.includes('ev')) {
    filters.fuelType = 'electric';
  }

  // Extract price hints
  if (lowerTranscript.includes('cheap') || lowerTranscript.includes('affordable')) {
    filters.sortBy = 'ratePerHour';
    filters.sortOrder = 'asc';
  } else if (lowerTranscript.includes('premium') || lowerTranscript.includes('luxury')) {
    filters.sortBy = 'ratePerHour';
    filters.sortOrder = 'desc';
  }

  // Extract availability
  if (lowerTranscript.includes('available now') || lowerTranscript.includes('immediately')) {
    filters.availability = 'available';
  }

  // Extract brand names
  const brands = ['honda', 'yamaha', 'suzuki', 'bajaj', 'tvs', 'hero', 'royal enfield', 'ktm', 'maruti', 'hyundai', 'tata', 'mahindra'];
  for (const brand of brands) {
    if (lowerTranscript.includes(brand)) {
      filters.brand = brand;
      break;
    }
  }

  return filters;
};

// Format vehicle data for display
export const formatVehicleForDisplay = (vehicle) => {
  if (!vehicle) return null;

  // Get hourly rate from rate12hr or rate24hr
  const hourlyRate = vehicle.rate12hr?.withoutFuelPerHour || vehicle.rate24hr?.withoutFuelPerHour || 0;
  const dailyRate = vehicle.rateDaily?.[0]?.withoutFuelPerDay || vehicle.rateDaily?.[0]?.withFuelPerDay || 0;

  return {
    id: vehicle._id,
    name: vehicle.name,
    brand: vehicle.companyName,
    model: vehicle.name,
    type: vehicle.category, // Backend uses 'category' not 'type'
    fuelType: vehicle.type, // Backend uses 'type' for fuel type
    registrationNumber: vehicle.vehicleNo,
    vehicleNo: vehicle.vehicleNo,
    images: vehicle.vehicleImages || [],
    vehicleImages: vehicle.vehicleImages || [],
    pricing: {
      hourly: hourlyRate,
      daily: dailyRate,
      withoutFuel: hourlyRate,
      currency: 'INR'
    },
    ratePerHour: hourlyRate,
    ratePerDay: dailyRate,
    availability: vehicle.availability,
    status: vehicle.status,
    nextAvailableTime: vehicle.nextAvailableTime,
    location: {
      zone: vehicle.zoneCode,
      center: vehicle.zoneCenterName,
      address: vehicle.zoneCenterAddress
    },
    specifications: {
      seatingCapacity: vehicle.seatingCapacity || vehicle.sittingCapacity,
      mileage: vehicle.mileage ? `${vehicle.mileage} km/l` : null,
      features: vehicle.vehicleFeatures || []
    },
    shop: {
      id: vehicle.sellerId?._id,
      name: vehicle.sellerId?.sellerProfile?.storeName || vehicle.sellerId?.name,
      shopName: vehicle.sellerId?.sellerProfile?.storeName || vehicle.sellerId?.name,
      ownerName: vehicle.sellerId?.name,
      rating: vehicle.sellerId?.sellerProfile?.rating || vehicle.analytics?.averageRating || 4.5,
      profileImage: vehicle.sellerId?.sellerProfile?.profileImage
    },
    rating: vehicle.analytics?.averageRating || 4.5,
    color: vehicle.color,
    companyName: vehicle.companyName,
    seatingCapacity: vehicle.seatingCapacity ||2,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt
  };
};

// Format shop data for display
export const formatShopForDisplay = (shop) => {
  if (!shop) return null;

  return {
    id: shop._id,
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    phone: shop.phone,
    email: shop.email,
    address: shop.address,
    profileImage: shop.profileImage,
    shopLogo: shop.shopLogo,
    vehicleCount: shop.vehicleCount,
    availableCount: shop.availableCount,
    vehicleTypes: shop.vehicleTypes,
    priceRange: {
      min: shop.minPrice,
      max: shop.maxPrice
    },
    rating: shop.rating || 0,
    totalReviews: shop.totalReviews || 0,
    zones: shop.zoneCode
  };
};