import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiCar,
  FiCalendar,
  FiBarChart3,
  FiCreditCard,
  FiTrendingUp,
  FiSettings,
  FiPlus,
  FiList,
  FiUsers,
} from "react-icons/fi";

// User Navigation Component
export const VehicleRentalUserNav = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const userNavItems = [
    {
      label: "Browse Vehicles",
      path: "/vehicles",
      icon: FiCar,
      public: true,
    },
    {
      label: "Bikes",
      path: "/vehicles/bikes",
      icon: FiCar,
      public: true,
    },
    {
      label: "Cars",
      path: "/vehicles/cars",
      icon: FiCar,
      public: true,
    },
    {
      label: "Scooters",
      path: "/vehicles/scooters",
      icon: FiCar,
      public: true,
    },
    {
      label: "My Bookings",
      path: "/my-vehicle-bookings",
      icon: FiCalendar,
      requireAuth: true,
    },
  ];

  return (
    <nav className="vehicle-rental-nav">
      <div className="flex flex-wrap gap-4">
        {userNavItems.map((item) => {
          // Skip auth-required items if user not logged in
          if (item.requireAuth && !user) return null;

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// Admin Navigation Component
export const VehicleRentalAdminNav = () => {
  const location = useLocation();

  const adminNavItems = [
    {
      label: "Dashboard",
      path: "/admin/vehicle-rental",
      icon: FiBarChart3,
    },
    {
      label: "Vehicles",
      path: "/admin/vehicles",
      icon: FiCar,
      children: [
        { label: "All Vehicles", path: "/admin/vehicles" },
        { label: "Add Vehicle", path: "/admin/vehicles/add" },
      ],
    },
    {
      label: "Bookings",
      path: "/admin/vehicle-bookings",
      icon: FiCalendar,
    },
    {
      label: "Billing",
      path: "/admin/vehicle-billing",
      icon: FiCreditCard,
    },
    {
      label: "Analytics",
      path: "/admin/vehicle-analytics",
      icon: FiTrendingUp,
    },
    {
      label: "Maintenance",
      path: "/admin/vehicle-maintenance",
      icon: FiSettings,
    },
  ];

  return (
    <nav className="vehicle-rental-admin-nav">
      <div className="space-y-2">
        {adminNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <div key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>

              {/* Sub-navigation */}
              {item.children && isActive && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                        location.pathname === child.path
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

// Breadcrumb Component
export const VehicleRentalBreadcrumb = () => {
  const location = useLocation();

  const getBreadcrumbs = (pathname) => {
    const routes = {
      "/vehicles": [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
      ],
      "/vehicles/bikes": [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Bikes", path: "/vehicles/bikes" },
      ],
      "/vehicles/cars": [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Cars", path: "/vehicles/cars" },
      ],
      "/vehicles/scooters": [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Scooters", path: "/vehicles/scooters" },
      ],
      "/my-vehicle-bookings": [
        { label: "Home", path: "/" },
        { label: "My Bookings", path: "/my-vehicle-bookings" },
      ],
      "/admin/vehicle-rental": [
        { label: "Admin", path: "/admin" },
        { label: "Vehicle Rental", path: "/admin/vehicle-rental" },
      ],
      "/admin/vehicles": [
        { label: "Admin", path: "/admin" },
        { label: "Vehicle Rental", path: "/admin/vehicle-rental" },
        { label: "Vehicles", path: "/admin/vehicles" },
      ],
      "/admin/vehicle-billing": [
        { label: "Admin", path: "/admin" },
        { label: "Vehicle Rental", path: "/admin/vehicle-rental" },
        { label: "Billing", path: "/admin/vehicle-billing" },
      ],
    };

    // Handle dynamic routes
    if (pathname.includes("/vehicles/") && pathname.split("/").length === 3) {
      return [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Vehicle Details", path: pathname },
      ];
    }

    if (pathname.includes("/book")) {
      const vehicleId = pathname.split("/")[2];
      return [
        { label: "Home", path: "/" },
        { label: "Vehicles", path: "/vehicles" },
        { label: "Vehicle Details", path: `/vehicles/${vehicleId}` },
        { label: "Book Now", path: pathname },
      ];
    }

    return routes[pathname] || [{ label: "Home", path: "/" }];
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && <span className="text-gray-400">/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-indigo-600 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Quick Action Buttons Component
export const VehicleRentalQuickActions = ({ userRole = "user" }) => {
  const quickActions = {
    user: [
      { label: "Browse All Vehicles", path: "/vehicles", icon: FiList },
      { label: "My Bookings", path: "/my-vehicle-bookings", icon: FiCalendar },
    ],
    admin: [
      { label: "Add Vehicle", path: "/admin/vehicles/add", icon: FiPlus },
      {
        label: "View Dashboard",
        path: "/admin/vehicle-rental",
        icon: FiBarChart3,
      },
      {
        label: "Manage Bookings",
        path: "/admin/vehicle-bookings",
        icon: FiUsers,
      },
    ],
  };

  const actions = quickActions[userRole] || quickActions.user;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.path}
            to={action.path}
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

// Mobile Bottom Navigation for Vehicle Rental
export const VehicleRentalMobileNav = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const mobileNavItems = [
    { label: "Browse", path: "/vehicles", icon: FiCar },
    {
      label: "Bookings",
      path: "/my-vehicle-bookings",
      icon: FiCalendar,
      requireAuth: true,
    },
  ];

  // Don't show if no relevant items for current user
  const visibleItems = mobileNavItems.filter(
    (item) => !item.requireAuth || user
  );
  if (visibleItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Export all components
export default {
  VehicleRentalUserNav,
  VehicleRentalAdminNav,
  VehicleRentalBreadcrumb,
  VehicleRentalQuickActions,
  VehicleRentalMobileNav,
};
