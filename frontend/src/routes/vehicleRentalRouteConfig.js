// Vehicle Rental Route Configuration
// This file provides the complete routing structure for the vehicle rental system

export const vehicleRentalRoutes = {
  // USER ROUTES (Customer-facing)
  user: {
    // Vehicle browsing and booking
    vehicleListing: {
      path: '/vehicles',
      name: 'Vehicle Listing',
      component: 'VehicleListingPage',
      description: 'Browse available vehicles with filters',
      access: 'public' // Can be accessed by anyone
    },
    
    vehicleDetail: {
      path: '/vehicles/:vehicleId',
      name: 'Vehicle Detail',
      component: 'VehicleDetailPage',
      description: 'View detailed vehicle information and book',
      access: 'public'
    },
    
    vehicleBooking: {
      path: '/vehicles/:vehicleId/book',
      name: 'Vehicle Booking',
      component: 'VehicleBookingPage',
      description: 'Multi-step booking process with payment',
      access: 'authenticated' // Requires login
    },
    
    bookingHistory: {
      path: '/my-vehicle-bookings',
      name: 'My Vehicle Bookings',
      component: 'VehicleBookingHistoryPage',
      description: 'View booking history and manage bookings',
      access: 'authenticated'
    },
    
    // Category-specific routes
    bikeRentals: {
      path: '/vehicles/bikes',
      name: 'Bike Rentals',
      component: 'VehicleListingPage',
      description: 'Browse bikes for rent',
      params: { category: 'bike' },
      access: 'public'
    },
    
    carRentals: {
      path: '/vehicles/cars',
      name: 'Car Rentals', 
      component: 'VehicleListingPage',
      description: 'Browse cars for rent',
      params: { category: 'car' },
      access: 'public'
    },
    
    scootyRentals: {
      path: '/vehicles/scooters',
      name: 'Scooty Rentals',
      component: 'VehicleListingPage', 
      description: 'Browse scooters for rent',
      params: { category: 'scooty' },
      access: 'public'
    }
  },

  // ADMIN ROUTES (Administrative interface)
  admin: {
    // Main dashboard
    dashboard: {
      path: '/admin/vehicle-rental',
      name: 'Vehicle Rental Dashboard',
      component: 'VehicleRentalAdminDashboard',
      description: 'Main admin dashboard with analytics',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    // Vehicle management
    vehicleManagement: {
      path: '/admin/vehicles',
      name: 'Vehicle Management',
      component: 'AdminVehicleManagement',
      description: 'CRUD operations for vehicles',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    addVehicle: {
      path: '/admin/vehicles/add',
      name: 'Add Vehicle',
      component: 'AdminVehicleForm',
      description: 'Add new vehicle to fleet',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    editVehicle: {
      path: '/admin/vehicles/:vehicleId/edit',
      name: 'Edit Vehicle',
      component: 'AdminVehicleForm',
      description: 'Edit existing vehicle',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    vehicleDetails: {
      path: '/admin/vehicles/:vehicleId',
      name: 'Vehicle Details',
      component: 'AdminVehicleDetails',
      description: 'View detailed vehicle information',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    // Billing and financial management
    billingManagement: {
      path: '/admin/vehicle-billing',
      name: 'Billing Management',
      component: 'AdminBillingManagement',
      description: 'Billing history, refunds, and collections',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    // Booking management
    bookingManagement: {
      path: '/admin/vehicle-bookings',
      name: 'Booking Management', 
      component: 'AdminBookingManagement',
      description: 'Manage all vehicle bookings',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    bookingDetails: {
      path: '/admin/vehicle-bookings/:bookingId',
      name: 'Booking Details',
      component: 'AdminBookingDetails',
      description: 'View detailed booking information',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    // Analytics and reports
    analytics: {
      path: '/admin/vehicle-analytics',
      name: 'Vehicle Analytics',
      component: 'AdminVehicleAnalytics',
      description: 'Revenue, booking, and fleet analytics',
      access: 'admin',
      roles: ['admin', 'super-admin']
    },
    
    // Maintenance management
    maintenance: {
      path: '/admin/vehicle-maintenance',
      name: 'Maintenance Management',
      component: 'AdminMaintenanceManagement',
      description: 'Schedule and track vehicle maintenance',
      access: 'admin',
      roles: ['admin', 'super-admin']
    }
  },

  // SELLER ROUTES (For multi-vendor support)
  seller: {
    dashboard: {
      path: '/seller/vehicle-rental',
      name: 'Seller Vehicle Dashboard',
      component: 'SellerVehicleDashboard',
      description: 'Seller dashboard for vehicle rental',
      access: 'seller',
      roles: ['seller', 'admin']
    },
    
    myVehicles: {
      path: '/seller/my-vehicles',
      name: 'My Vehicles',
      component: 'SellerVehicleManagement',
      description: 'Manage seller vehicles',
      access: 'seller',
      roles: ['seller', 'admin']
    },
    
    myBookings: {
      path: '/seller/vehicle-bookings',
      name: 'My Vehicle Bookings',
      component: 'SellerBookingManagement',
      description: 'Manage vehicle bookings',
      access: 'seller',
      roles: ['seller', 'admin']
    }
  }
};

// Navigation menu structure for vehicle rental
export const vehicleRentalNavigation = {
  user: [
    {
      label: 'Browse Vehicles',
      path: '/vehicles',
      icon: 'Car'
    },
    {
      label: 'My Bookings',
      path: '/my-vehicle-bookings',
      icon: 'Calendar',
      requireAuth: true
    }
  ],
  
  admin: [
    {
      label: 'Dashboard',
      path: '/admin/vehicle-rental',
      icon: 'BarChart3'
    },
    {
      label: 'Vehicles',
      path: '/admin/vehicles',
      icon: 'Car'
    },
    {
      label: 'Bookings',
      path: '/admin/vehicle-bookings',
      icon: 'Calendar'
    },
    {
      label: 'Billing',
      path: '/admin/vehicle-billing',
      icon: 'CreditCard'
    },
    {
      label: 'Analytics',
      path: '/admin/vehicle-analytics',
      icon: 'TrendingUp'
    },
    {
      label: 'Maintenance',
      path: '/admin/vehicle-maintenance',
      icon: 'Settings'
    }
  ]
};

// Route permissions and guards
export const vehicleRentalPermissions = {
  // Public routes - no authentication required
  public: [
    '/vehicles',
    '/vehicles/:vehicleId',
    '/vehicles/bikes',
    '/vehicles/cars', 
    '/vehicles/scooters'
  ],
  
  // Authenticated routes - login required
  authenticated: [
    '/vehicles/:vehicleId/book',
    '/my-vehicle-bookings'
  ],
  
  // Admin routes - admin role required
  admin: [
    '/admin/vehicle-rental',
    '/admin/vehicles',
    '/admin/vehicles/add',
    '/admin/vehicles/:vehicleId/edit',
    '/admin/vehicles/:vehicleId',
    '/admin/vehicle-billing',
    '/admin/vehicle-bookings',
    '/admin/vehicle-bookings/:bookingId',
    '/admin/vehicle-analytics',
    '/admin/vehicle-maintenance'
  ],
  
  // Seller routes - seller role required
  seller: [
    '/seller/vehicle-rental',
    '/seller/my-vehicles',
    '/seller/vehicle-bookings'
  ]
};

// Breadcrumb configuration
export const vehicleRentalBreadcrumbs = {
  '/vehicles': [
    { label: 'Home', path: '/' },
    { label: 'Vehicles', path: '/vehicles' }
  ],
  
  '/vehicles/:vehicleId': [
    { label: 'Home', path: '/' },
    { label: 'Vehicles', path: '/vehicles' },
    { label: 'Vehicle Details', path: '/vehicles/:vehicleId' }
  ],
  
  '/vehicles/:vehicleId/book': [
    { label: 'Home', path: '/' },
    { label: 'Vehicles', path: '/vehicles' },
    { label: 'Vehicle Details', path: '/vehicles/:vehicleId' },
    { label: 'Book Now', path: '/vehicles/:vehicleId/book' }
  ],
  
  '/my-vehicle-bookings': [
    { label: 'Home', path: '/' },
    { label: 'My Bookings', path: '/my-vehicle-bookings' }
  ],
  
  '/admin/vehicle-rental': [
    { label: 'Admin', path: '/admin' },
    { label: 'Vehicle Rental', path: '/admin/vehicle-rental' }
  ],
  
  '/admin/vehicles': [
    { label: 'Admin', path: '/admin' },
    { label: 'Vehicle Rental', path: '/admin/vehicle-rental' },
    { label: 'Vehicles', path: '/admin/vehicles' }
  ]
};

export default vehicleRentalRoutes;