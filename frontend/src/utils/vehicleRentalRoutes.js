// Vehicle Rental Route Utilities
// Helper functions for navigation and URL generation

/**
 * Generate URL for vehicle detail page
 * @param {string} vehicleId - Vehicle ID
 * @returns {string} Vehicle detail URL
 */
export const getVehicleDetailUrl = (vehicleId) => `${import.meta.env.VITE_BACKEND_URL}/vehicles/${vehicleId}`;

/**
 * Generate URL for vehicle booking page
 * @param {string} vehicleId - Vehicle ID
 * @returns {string} Vehicle booking URL
 */
export const getVehicleBookingUrl = (vehicleId) => `${import.meta.env.VITE_BACKEND_URL}/vehicles/${vehicleId}/book`;

/**
 * Generate URL for admin vehicle edit page
 * @param {string} vehicleId - Vehicle ID
 * @returns {string} Admin vehicle edit URL
 */
export const getAdminVehicleEditUrl = (vehicleId) => `${import.meta.env.VITE_BACKEND_URL}/admin/vehicles/${vehicleId}/edit`;

/**
 * Generate URL for admin vehicle detail page
 * @param {string} vehicleId - Vehicle ID
 * @returns {string} Admin vehicle detail URL
 */
export const getAdminVehicleDetailUrl = (vehicleId) => `${import.meta.env.VITE_BACKEND_URL}/admin/vehicles/${vehicleId}`;

/**
 * Generate URL for admin booking detail page
 * @param {string} bookingId - Booking ID
 * @returns {string} Admin booking detail URL
 */
export const getAdminBookingDetailUrl = (bookingId) => `${import.meta.env.VITE_BACKEND_URL}/admin/vehicle-bookings/${bookingId}`;

/**
 * Generate URL for category-specific vehicle listing
 * @param {string} category - Vehicle category (bike, car, scooty, etc.)
 * @returns {string} Category vehicle listing URL
 */
export const getCategoryVehicleUrl = (category) => `${import.meta.env.VITE_BACKEND_URL}/vehicles/${category}s`;

/**
 * Check if current route is vehicle rental related
 * @param {string} pathname - Current pathname
 * @returns {boolean} Is vehicle rental route
 */
export const isVehicleRentalRoute = (pathname) => {
  const vehicleRoutes = [
    '/vehicles',
    '/my-vehicle-bookings',
    '/admin/vehicle-rental',
    '/admin/vehicles',
    '/admin/vehicle-billing',
    '/admin/vehicle-bookings',
    '/admin/vehicle-analytics',
    '/admin/vehicle-maintenance',
    '/seller/vehicle-rental',
    '/seller/my-vehicles',
    '/seller/vehicle-bookings'
  ];
  
  return vehicleRoutes.some(route => pathname.startsWith(route));
};

/**
 * Get user type based on current route
 * @param {string} pathname - Current pathname
 * @returns {string} User type (user, admin, seller)
 */
export const getUserTypeFromRoute = (pathname) => {
  if (pathname.startsWith('/admin/vehicle')) return 'admin';
  if (pathname.startsWith('/seller/vehicle')) return 'seller';
  return 'user';
};

/**
 * Navigation helper for programmatic navigation
 */
export const vehicleRentalNavigation = {
  // User navigation
  toVehicleListing: () => '/vehicles',
  toVehicleDetail: (vehicleId) => getVehicleDetailUrl(vehicleId),
  toVehicleBooking: (vehicleId) => getVehicleBookingUrl(vehicleId),
  toMyBookings: () => '/my-vehicle-bookings',
  toCategoryListing: (category) => getCategoryVehicleUrl(category),
  
  // Admin navigation
  toAdminDashboard: () => '/admin/vehicle-rental',
  toAdminVehicles: () => '/admin/vehicles',
  toAdminAddVehicle: () => '/admin/vehicles/add',
  toAdminVehicleDetail: (vehicleId) => getAdminVehicleDetailUrl(vehicleId),
  toAdminVehicleEdit: (vehicleId) => getAdminVehicleEditUrl(vehicleId),
  toAdminBookings: () => '/admin/vehicle-bookings',
  toAdminBookingDetail: (bookingId) => getAdminBookingDetailUrl(bookingId),
  toAdminBilling: () => '/admin/vehicle-billing',
  toAdminAnalytics: () => '/admin/vehicle-analytics',
  toAdminMaintenance: () => '/admin/vehicle-maintenance',
  
  // Seller navigation
  toSellerDashboard: () => '/seller/vehicle-rental',
  toSellerVehicles: () => '/seller/my-vehicles',
  toSellerBookings: () => '/seller/vehicle-bookings'
};

/**
 * Route guards for checking permissions
 */
export const vehicleRentalGuards = {
  // Check if user can access route
  canAccessRoute: (pathname, user) => {
    // Public routes
    const publicRoutes = ['/vehicles'];
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return true;
    }
    
    // Auth required routes
    const authRoutes = ['/my-vehicle-bookings', '/vehicles'];
    if (authRoutes.some(route => pathname.includes('/book') || pathname === route)) {
      return !!user;
    }
    
    // Admin routes
    const adminRoutes = ['/admin/vehicle'];
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      return user && ['admin', 'super-admin'].includes(user.role);
    }
    
    // Seller routes
    const sellerRoutes = ['/seller/vehicle'];
    if (sellerRoutes.some(route => pathname.startsWith(route))) {
      return user && ['seller', 'admin'].includes(user.role);
    }
    
    return true;
  },
  
  // Get redirect URL if access denied
  getRedirectUrl: (pathname, user) => {
    if (!user) return '/login';
    
    // If admin tries to access seller routes or vice versa
    if (pathname.startsWith('/admin/vehicle') && !['admin', 'super-admin'].includes(user.role)) {
      return '/unauthorized';
    }
    
    if (pathname.startsWith('/seller/vehicle') && !['seller', 'admin'].includes(user.role)) {
      return '/unauthorized';
    }
    
    return '/';
  }
};

/**
 * URL parameter extractors
 */
export const extractRouteParams = {
  // Extract vehicle ID from URL
  getVehicleId: (pathname) => {
    const matches = pathname.match(/\/vehicles\/([^\/]+)/);
    return matches ? matches[1] : null;
  },
  
  // Extract booking ID from URL  
  getBookingId: (pathname) => {
    const matches = pathname.match(/\/vehicle-bookings\/([^\/]+)/);
    return matches ? matches[1] : null;
  },
  
  // Extract category from URL
  getCategory: (pathname) => {
    const categoryMatches = pathname.match(/\/vehicles\/(bikes|cars|scooters)/);
    if (categoryMatches) {
      // Remove 's' from plural form
      return categoryMatches[1].slice(0, -1);
    }
    return null;
  }
};

/**
 * Query parameter helpers for vehicle listing
 */
export const vehicleListingQueries = {
  // Build query string for vehicle listing filters
  buildFilterQuery: (filters) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    
    return params.toString();
  },
  
  // Parse query parameters from URL
  parseFilterQuery: (search) => {
    const params = new URLSearchParams(search);
    const filters = {};
    
    for (const [key, value] of params) {
      filters[key] = value;
    }
    
    return filters;
  },
  
  // Common filter parameter builders
  categoryFilter: (category) => ({ category }),
  priceRangeFilter: (min, max) => ({ priceMin: min, priceMax: max }),
  locationFilter: (location) => ({ location }),
  availabilityFilter: (startDate, endDate) => ({ 
    startDate: startDate?.toISOString?.() || startDate,
    endDate: endDate?.toISOString?.() || endDate
  })
};

export default {
  getVehicleDetailUrl,
  getVehicleBookingUrl,
  getAdminVehicleEditUrl,
  getAdminVehicleDetailUrl,
  getAdminBookingDetailUrl,
  getCategoryVehicleUrl,
  isVehicleRentalRoute,
  getUserTypeFromRoute,
  vehicleRentalNavigation,
  vehicleRentalGuards,
  extractRouteParams,
  vehicleListingQueries
};