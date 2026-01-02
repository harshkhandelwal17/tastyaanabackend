import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  DollarSign,
  Users,
  Settings,
  Phone,
  Package,
  HeartHandshake,
  Menu,
  X,
  SubscriptIcon,
  Receipt,
  MapPin,
  Calendar,
  Car,
  BookOpen,
  FileText,
  TrendingUp,
  Wrench,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = ({
  activeSection,
  onSectionClick,
  isSidebarOpen,
  onToggle,
}) => {
  const sections = [
    { name: "Dashboard", icon: LayoutDashboard, link: "vehicle-dashboard" },
    { name: "Available Vehicles", icon: Car, link: "vehicles" },
    { name: "Booked Vehicles", icon: BookOpen, link: "vehicle-bookings" },
    { name: "Billing History", icon: Receipt, link: "vehicle-billing" },
    { name: "Add Vehicle", icon: Package, link: "vehicles/add" },
    { name: "Vehicle Maintenance", icon: Wrench, link: "vehicle-maintenance" },
    { name: "Centers", icon: MapPin, link: "centers" },
    { name: "Discount Coupons", icon: DollarSign, link: "discount-coupons" },
    { name: "Revenue", icon: TrendingUp, link: "revenue" },
    { name: "Daily Hisab", icon: FileText, link: "daily-hisab" },
    { name: "Daily Hisab Admin", icon: FileText, link: "daily-hisab-view" },
    { name: "Logout", icon: LogOut, link: "logout" },
  ];

  return (
    <>
      <aside
        className={` h-full fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-4 transition-transform duration-300 transform md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold rounded-lg text-teal-300">
            Tastyaana Admin
          </h1>
          <button
            onClick={onToggle}
            className="md:hidden text-white focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav>
          <ul>
            {sections.map((section) => (
              <li key={section.name} className="mb-2">
                <Link
                  onClick={() => {
                    onSectionClick(section.name);
                    onToggle();
                  }}
                  to={section.link}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                    activeSection === section.name
                      ? "bg-teal-600 text-white"
                      : "hover:bg-teal-800"
                  }`}
                >
                  <section.icon className="h-5 w-5 mr-3" />
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="mt-auto pt-4 border-t border-slate-700">
          <button
            onClick={() => {
              // Handle logout logic
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-red-600 text-slate-300 hover:text-white"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>
      {/* Overlay to close sidebar on mobile */}
      {isSidebarOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black opacity-50 md:hidden"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
