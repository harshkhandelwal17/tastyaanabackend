import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiShoppingCart,
  FiBarChart2,
  FiPackage,
  FiSettings,
  FiDollarSign,
} from "react-icons/fi";

const SuperAdminNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: "Super Dashboard",
      href: "/admin/super-dashboard",
      icon: FiHome,
      description: "Comprehensive analytics and overview",
    },
    {
      name: "Users Management",
      href: "/admin/users-management",
      icon: FiUsers,
      description: "Manage platform users",
    },
    {
      name: "Subscriptions",
      href: "/admin/subscriptions-management",
      icon: FiCalendar,
      description: "Track subscription analytics",
    },
    {
      name: "Orders Management",
      href: "/admin/orders-management",
      icon: FiShoppingCart,
      description: "Monitor and manage orders",
    },
    {
      name: "Regular Dashboard",
      href: "/admin/",
      icon: FiBarChart2,
      description: "Original admin dashboard",
    },
    {
      name: "Charges Management",
      href: "/admin/charges",
      icon: FiDollarSign,
      description: "Manage platform charges",
    },
    {
      name: "Meal Management",
      href: "/admin/mealedit",
      icon: FiPackage,
      description: "Edit meal plans and items",
    },
  ];

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Super Admin Panel
      </h2>
      <p className="text-gray-600 mb-6">
        Access comprehensive management tools and analytics
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
              isActive(item.href)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    isActive(item.href)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}
                >
                  <item.icon size={20} />
                </div>
                <div>
                  <h3
                    className={`font-semibold ${
                      isActive(item.href) ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </h3>
                </div>
              </div>
              <p
                className={`text-sm ${
                  isActive(item.href) ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {item.description}
              </p>
            </div>

            {/* Active indicator */}
            {isActive(item.href) && (
              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-blue-500"></div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminNavigation;
