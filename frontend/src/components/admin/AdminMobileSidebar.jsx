import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Menu,
  X,
  Home,
  Users,
  ShoppingCart,
  Package,
  Truck,
  Calendar,
  FileText,
  Settings,
  User,
  Store,
  Car,
  CreditCard,
  Gift,
  BarChart3,
  UserCheck,
  Clock,
  MapPin,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { logout } from "../../redux/authslice";

const AdminMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/admin",
      exact: true,
    },
    {
      title: "User Management",
      icon: Users,
      key: "users",
      items: [
        { title: "All Users", path: "/admin/users-management" },
        { title: "User Details", path: "/admin/users-management" },
        { title: "User Analytics", path: "/admin/users/analytics" },
      ],
    },
    {
      title: "Orders Management",
      icon: ShoppingCart,
      key: "orders",
      items: [
        { title: "Order Management", path: "/admin/orders-management" },
        { title: "Daily Orders", path: "/admin/dailymeal" },
        { title: "Order Analytics", path: "/admin/orders/analytics" },
      ],
    },
    {
      title: "Delivery Management",
      icon: Truck,
      key: "delivery",
      items: [
        { title: "Delivery Dashboard", path: "/admin/delivery" },
        { title: "Delivery Scheduling", path: "/admin/delivery-scheduling" },
        { title: "Driver Management", path: "/admin/drivers" },
        { title: "Route Planning", path: "/admin/delivery/routes" },
      ],
    },
    {
      title: "Subscriptions",
      icon: Calendar,
      key: "subscriptions",
      items: [
        // { title: "All Subscriptions", path: "/admin/subscription" },
        {
          title: "Subscription Management",
          path: "/admin/subscriptions-management",
        },

        { title: "Meal Edit", path: "/admin/mealedit" },

        {
          title: "Subscription Analytics",
          path: "/admin/subscriptions/analytics",
        },
      ],
    },
    {
      title: "Products & Meals",
      icon: Package,
      key: "products",
      items: [
        { title: "Product Management", path: "/admin/products" },
        { title: "Categories", path: "/admin/categories" },
        { title: "Inventory", path: "/admin/inventory" },
      ],
    },
    {
      title: "Seller Management",
      icon: Store,
      key: "sellers",
      items: [
        { title: "All Sellers", path: "/admin/seller" },
        { title: "Seller Verification", path: "/admin/sellers/verification" },
        { title: "Seller Analytics", path: "/admin/sellers/analytics" },
        { title: "Seller Support", path: "/admin/sellers/support" },
      ],
    },
    {
      title: "Driver Management",
      icon: Car,
      key: "drivers",
      items: [
        { title: "All Drivers", path: "/admin/drivers" },
        { title: "Driver Verification", path: "/admin/drivers/verification" },
        { title: "Driver Analytics", path: "/admin/drivers/analytics" },
        { title: "Driver Scheduling", path: "/admin/drivers/scheduling" },
      ],
    },
    {
      title: "Financial Management",
      icon: CreditCard,
      key: "finance",
      items: [
        { title: "Payments", path: "/admin/payments" },
        { title: "Charges Management", path: "/admin/charges" },
        { title: "Coupons", path: "/admin/coupons" },
        { title: "Financial Reports", path: "/admin/finance/reports" },
      ],
    },
    {
      title: "Special Services",
      icon: Gift,
      key: "services",
      items: [
        { title: "Bhandara Management", path: "/admin/bhandaras" },
        { title: "Laundry Service", path: "/admin/laundry" },
        { title: "Support Tickets", path: "/admin/support" },
        { title: "Notifications", path: "/admin/notifications" },
      ],
    },
    {
      title: "Analytics & Reports",
      icon: BarChart3,
      key: "analytics",
      items: [
        { title: "Business Analytics", path: "/admin/analytics" },
        { title: "User Behavior", path: "/admin/analytics/users" },
        { title: "Revenue Reports", path: "/admin/analytics/revenue" },
        { title: "Performance Metrics", path: "/admin/analytics/performance" },
      ],
    },
    {
      title: "System Settings",
      icon: Settings,
      key: "settings",
      items: [
        { title: "General Settings", path: "/admin/settings" },
        { title: "App Configuration", path: "/admin/settings/app" },
        {
          title: "Notification Settings",
          path: "/admin/settings/notifications",
        },
        { title: "System Maintenance", path: "/admin/settings/maintenance" },
      ],
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50
        lg:transform-none lg:static lg:w-64 lg:shadow-none lg:border-r
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin Panel</h3>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            if (item.items) {
              // Expandable section
              const isExpanded = expandedSections[item.key];
              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggleSection(item.key)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon size={20} className="text-gray-600" />
                      <span className="font-medium text-gray-700">
                        {item.title}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={closeSidebar}
                          className={`
                            block p-2 pl-6 rounded-lg text-sm transition-colors
                            ${
                              isActive(subItem.path)
                                ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                            }
                          `}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // Single item
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg transition-colors
                    ${
                      isActive(item.path, item.exact)
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            }
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminMobileSidebar;
