import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChefHat,
  Calendar,
  FileText,
  HelpCircle,
  Store,
} from 'lucide-react';

const SellerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/seller/dashboard',
      icon: Home,
      current: location.pathname === '/seller/dashboard',
    },
    {
      name: 'Products',
      href: '/seller/products',
      icon: Package,
      current: location.pathname.startsWith('/seller/products'),
    },
    {
      name: 'Orders',
      href: '/seller/orders',
      icon: ShoppingCart,
      current: location.pathname.startsWith('/seller/orders'),
    },
    {
      name: 'Meal Plans',
      href: '/seller/meal-plans',
      icon: ChefHat,
      current: location.pathname.startsWith('/seller/meal-plans'),
    },
    {
      name: 'Analytics',
      href: '/seller/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/seller/analytics'),
    },
    {
      name: 'Customers',
      href: '/seller/customers',
      icon: Users,
      current: location.pathname.startsWith('/seller/customers'),
    },
    {
      name: 'Reports',
      href: '/seller/reports',
      icon: FileText,
      current: location.pathname.startsWith('/seller/reports'),
    },
  ];

  const handleNavigation = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    // Add logout logic here
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            navigationItems={navigationItems} 
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent 
          navigationItems={navigationItems} 
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" />
              <input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search..."
                type="search"
                name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* Profile dropdown placeholder */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt=""
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      Store Owner
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="pt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigationItems, onNavigate, onLogout }) => {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">Tastyaana </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => onNavigate(item.href)}
                    className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                      item.current
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                      }`}
                    />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('/seller/settings')}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Settings className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700" />
                Settings
              </button>
              <button
                onClick={() => onNavigate('/help')}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <HelpCircle className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700" />
                Help & Support
              </button>
              <button
                onClick={onLogout}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-6  w-6 shrink-0 text-red-500 group-hover:text-red-700" />
                Sign out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SellerLayout;