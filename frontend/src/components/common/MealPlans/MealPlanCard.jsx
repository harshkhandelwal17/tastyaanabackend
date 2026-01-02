// // src/App.js
// import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Provider } from 'react-redux';
// import { store } from './store';
// import { Toaster } from 'react-hot-toast';

// // Layout Components
// import Layout from './components/Layout/Layout';
// import ProtectedRoute from './components/Auth/ProtectedRoute';

// // Pages
// import HomePage from './pages/HomePage';
// import MealPlansPage from './pages/MealPlansPage';
// import MealPlanDetailsPage from './pages/MealPlanDetailsPage';
// import SubscriptionsPage from './pages/SubscriptionsPage';
// import OrdersPage from './pages/OrdersPage';
// import OrderTrackingPage from './pages/OrderTrackingPage';
// import CustomRequestPage from './pages/CustomRequestPage';
// import ProfilePage from './pages/ProfilePage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import DashboardPage from './pages/DashboardPage';
// import WeeklyMenuPage from './pages/WeeklyMenuPage';
// import ReviewsPage from './pages/ReviewsPage';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';

// // Hooks
// import { useAuth } from './hooks/useAuth';
// import { useSocket } from './hooks/useSocket';

// // Styles
// import './index.css';

// function AppContent() {
//   const { isAuthenticated } = useAuth();
//   useSocket(); // Initialize socket connection

//   return (
//     <Router>
//       <div className="App min-h-screen bg-gray-50">
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<Layout><HomePage /></Layout>} />
//           <Route path="/meal-plans" element={<Layout><MealPlansPage /></Layout>} />
//           <Route path="/meal-plans/:id" element={<Layout><MealPlanDetailsPage /></Layout>} />
//           <Route path="/weekly-menu" element={<Layout><WeeklyMenuPage /></Layout>} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />

//           {/* Protected Routes */}
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Layout><DashboardPage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/subscriptions"
//             element={
//               <ProtectedRoute>
//                 <Layout><SubscriptionsPage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/orders"
//             element={
//               <ProtectedRoute>
//                 <Layout><OrdersPage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/orders/:id/track"
//             element={
//               <ProtectedRoute>
//                 <Layout><OrderTrackingPage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/custom-request"
//             element={
//               <ProtectedRoute>
//                 <Layout><CustomRequestPage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/profile"
//             element={
//               <ProtectedRoute>
//                 <Layout><ProfilePage /></Layout>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/reviews"
//             element={
//               <ProtectedRoute>
//                 <Layout><ReviewsPage /></Layout>
//               </ProtectedRoute>
//             }
//           />

//           {/* Admin Routes */}
//           <Route
//             path="/admin/*"
//             element={
//               <ProtectedRoute requiredRole="admin">
//                 <AdminDashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* Restaurant Routes */}
//           <Route
//             path="/restaurant/*"
//             element={
//               <ProtectedRoute requiredRole="seller">
//                 <RestaurantDashboard />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>

//         {/* Global Toast Notifications */}
//         <Toaster
//           position="top-right"
//           toastOptions={{
//             duration: 4000,
//             style: {
//               background: '#363636',
//               color: '#fff',
//             },
//             success: {
//               style: {
//                 background: '#10B981',
//               },
//             },
//             error: {
//               style: {
//                 background: '#EF4444',
//               },
//             },
//           }}
//         />
//       </div>
//     </Router>
//   );
// }

// function App() {
//   return (
//     <Provider store={store}>
//       <AppContent />
//     </Provider>
//   );
// }

// export default App;

// // src/components/Layout/Layout.js
// import React from 'react';
// import Header from './Header';
// import Footer from './Footer';
// import MobileNavigation from './MobileNavigation';
// import CartSidebar from '../Cart/CartSidebar';
// import NotificationPanel from '../Notifications/NotificationPanel';

// const Layout = ({ children }) => {
//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />

//       <main className="flex-1">
//         {children}
//       </main>

//       <Footer />

//       {/* Mobile Navigation */}
//       <MobileNavigation />

//       {/* Cart Sidebar */}
//       <CartSidebar />

//       {/* Notification Panel */}
//       <NotificationPanel />
//     </div>
//   );
// };

// export default Layout;

// // src/components/Layout/Header.js
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import {
//   Bars3Icon,
//   MagnifyingGlassIcon,
//   ShoppingCartIcon,
//   BellIcon,
//   UserIcon,
//   ChevronDownIcon
// } from '@heroicons/react/24/outline';
// import {
//   openCart,
//   toggleMobileMenu,
//   openLoginModal
// } from '../../store/slices/uiSlice';
// import { logout } from '../../store/slices/authSlice';
// import { useAuth } from '../../hooks/useAuth';

// const Header = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
//   const { totalItems } = useSelector((state) => state.cart);
//   const { unreadCount } = useSelector((state) => state.ui);
//   const [showUserMenu, setShowUserMenu] = useState(false);

//   const handleCartClick = () => {
//     if (isAuthenticated) {
//       dispatch(openCart());
//     } else {
//       dispatch(openLoginModal());
//     }
//   };

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/');
//     setShowUserMenu(false);
//   };

//   return (
//     <header className="bg-white shadow-lg sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo and Mobile Menu */}
//           <div className="flex items-center">
//             <button
//               className="md:hidden p-2 rounded-md text-gray-600 hover:text-orange-600"
//               onClick={() => dispatch(toggleMobileMenu())}
//             >
//               <Bars3Icon className="h-6 w-6" />
//             </button>

//             <Link to="/" className="flex items-center ml-2 md:ml-0">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
//                   <span className="text-white font-bold text-xl">🏠</span>
//                 </div>
//                 <div className="ml-3">
//                   <h1 className="text-xl font-bold text-gray-800">Ghar Ka Khana</h1>
//                   <p className="text-xs text-gray-600 -mt-1">Homestyle Food</p>
//                 </div>
//               </div>
//             </Link>
//           </div>

//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex space-x-8">
//             <Link
//               to="/"
//               className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
//             >
//               Home
//             </Link>
//             <Link
//               to="/meal-plans"
//               className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
//             >
//               Meal Plans
//             </Link>
//             <Link
//               to="/weekly-menu"
//               className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
//             >
//               Weekly Menu
//             </Link>
//             <Link
//               to="/custom-request"
//               className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
//             >
//               Custom Order
//             </Link>
//           </nav>

//           {/* Right Side Actions */}
//           <div className="flex items-center space-x-4">
//             {/* Search */}
//             <button className="hidden sm:block p-2 text-gray-600 hover:text-orange-600 transition-colors">
//               <MagnifyingGlassIcon className="h-5 w-5" />
//             </button>

//             {/* Cart */}
//             <button
//               onClick={handleCartClick}
//               className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
//             >
//               <ShoppingCartIcon className="h-6 w-6" />
//               {totalItems > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                   {totalItems}
//                 </span>
//               )}
//             </button>

//             {isAuthenticated ? (
//               <>
//                 {/* Notifications */}
//                 <button className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors">
//                   <BellIcon className="h-6 w-6" />
//                   {unreadCount > 0 && (
//                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </button>

//                 {/* User Menu */}
//                 <div className="relative">
//                   <button
//                     onClick={() => setShowUserMenu(!showUserMenu)}
//                     className="flex items-center space-x-2 p-2 text-gray-700 hover:text-orange-600 transition-colors"
//                   >
//                     {user?.avatar ? (
//                       <img
//                         src={user.avatar}
//                         alt="Profile"
//                         className="h-8 w-8 rounded-full object-cover"
//                       />
//                     ) : (
//                       <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
//                         <UserIcon className="h-5 w-5 text-orange-600" />
//                       </div>
//                     )}
//                     <span className="hidden sm:block text-sm font-medium">
//                       {user?.name?.split(' ')[0]}
//                     </span>
//                     <ChevronDownIcon className="h-4 w-4" />
//                   </button>

//                   {/* User Dropdown Menu */}
//                   {showUserMenu && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
//                       <div className="py-1">
//                         <Link
//                           to="/dashboard"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           Dashboard
//                         </Link>
//                         <Link
//                           to="/profile"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           Profile
//                         </Link>
//                         <Link
//                           to="/orders"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           Orders
//                         </Link>
//                         <Link
//                           to="/subscriptions"
//                           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           Subscriptions
//                         </Link>
//                         <hr className="my-1" />
//                         <button
//                           onClick={handleLogout}
//                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                         >
//                           Sign Out
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <div className="flex items-center space-x-2">
//                 <Link
//                   to="/login"
//                   className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
//                 >
//                   Sign Up
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

// // src/components/Layout/Footer.js
// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer = () => {
//   return (
//     <footer className="bg-gray-900 text-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//           {/* Company Info */}
//           <div className="col-span-1 md:col-span-2">
//             <div className="flex items-center mb-4">
//               <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
//                 <span className="text-white font-bold text-xl">🏠</span>
//               </div>
//               <div className="ml-3">
//                 <h2 className="text-xl font-bold">Ghar Ka Khana</h2>
//                 <p className="text-sm text-gray-300">Homestyle Food Delivered</p>
//               </div>
//             </div>
//             <p className="text-gray-300 mb-4 max-w-md">
//               Bringing the taste of home to your doorstep. Fresh, authentic, and made with love -
//               just like your mother's cooking.
//             </p>
//             <div className="flex space-x-4">
//               <a href="#" className="text-gray-300 hover:text-orange-400">
//                 <span className="sr-only">Instagram</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348S9.746 16.988 8.449 16.988zM12.017 7.729c-2.31 0-4.174 1.864-4.174 4.174s1.864 4.174 4.174 4.174 4.174-1.864 4.174-4.174S14.327 7.729 12.017 7.729z"/>
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-300 hover:text-orange-400">
//                 <span className="sr-only">Twitter</span>
//                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
//                 </svg>
//               </a>
//             </div>
//           </div>

//           {/* Quick Links */}
//           <div>
//             <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
//             <ul className="space-y-2">
//               <li>
//                 <Link to="/meal-plans" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Meal Plans
//                 </Link>
//               </li>
//               <li>
//                 <Link to="/weekly-menu" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Weekly Menu
//                 </Link>
//               </li>
//               <li>
//                 <Link to="/custom-request" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Custom Orders
//                 </Link>
//               </li>
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   About Us
//                 </a>
//               </li>
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Contact
//                 </a>
//               </li>
//             </ul>
//           </div>

//           {/* Support */}
//           <div>
//             <h3 className="text-lg font-semibold mb-4">Support</h3>
//             <ul className="space-y-2">
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   FAQ
//                 </a>
//               </li>
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Help Center
//                 </a>
//               </li>
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Privacy Policy
//                 </a>
//               </li>
//               <li>
//                 <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   Terms of Service
//                 </a>
//               </li>
//               <li>
//                 <a href="tel:+919876543210" className="text-gray-300 hover:text-orange-400 transition-colors">
//                   📞 +91 98765-43210
//                 </a>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
//           <p className="text-gray-300 text-sm">
//             © 2024 Ghar Ka Khana. All rights reserved.
//           </p>
//           <div className="flex space-x-6 mt-4 md:mt-0">
//             <span className="text-gray-300 text-sm">Made with ❤️ in India</span>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

// // src/components/Layout/MobileNavigation.js
// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   HomeIcon,
//   ClipboardDocumentListIcon,
//   ShoppingCartIcon,
//   UserIcon,
//   Squares2X2Icon
// } from '@heroicons/react/24/outline';
// import {
//   HomeIcon as HomeIconSolid,
//   ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
//   ShoppingCartIcon as ShoppingCartIconSolid,
//   UserIcon as UserIconSolid,
//   Squares2X2Icon as Squares2X2IconSolid
// } from '@heroicons/react/24/solid';

// const MobileNavigation = () => {
//   const location = useLocation();
//   const { isAuthenticated } = useSelector((state) => state.auth);
//   const { totalItems } = useSelector((state) => state.cart);

//   const navItems = [
//     {
//       name: 'Home',
//       href: '/',
//       icon: HomeIcon,
//       activeIcon: HomeIconSolid,
//       requiresAuth: false
//     },
//     {
//       name: 'Menu',
//       href: '/meal-plans',
//       icon: Squares2X2Icon,
//       activeIcon: Squares2X2IconSolid,
//       requiresAuth: false
//     },
//     {
//       name: 'Cart',
//       href: '/cart',
//       icon: ShoppingCartIcon,
//       activeIcon: ShoppingCartIconSolid,
//       requiresAuth: false,
//       badge: totalItems
//     },
//     {
//       name: 'Orders',
//       href: '/orders',
//       icon: ClipboardDocumentListIcon,
//       activeIcon: ClipboardDocumentListIconSolid,
//       requiresAuth: true
//     },
//     {
//       name: 'Profile',
//       href: isAuthenticated ? '/dashboard' : '/login',
//       icon: UserIcon,
//       activeIcon: UserIconSolid,
//       requiresAuth: false
//     }
//   ];

//   return (
//     <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
//       <div className="grid grid-cols-5 h-16">
//         {navItems.map((item) => {
//           const isActive = location.pathname === item.href;
//           const Icon = isActive ? item.activeIcon : item.icon;

//           return (
//             <Link
//               key={item.name}
//               to={item.href}
//               className={`flex flex-col items-center justify-center space-y-1 ${
//                 isActive
//                   ? 'text-orange-600'
//                   : 'text-gray-500 hover:text-orange-600'
//               }`}
//             >
//               <div className="relative">
//                 <Icon className="h-6 w-6" />
//                 {item.badge && item.badge > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {item.badge}
//                   </span>
//                 )}
//               </div>
//               <span className="text-xs font-medium">{item.name}</span>
//             </Link>
//           );
//         })}
//       </div>
//     </nav>
//   );
// };

// export default MobileNavigation;

// // src/components/Auth/ProtectedRoute.js
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';
// import LoadingSpinner from '../Common/LoadingSpinner';

// const ProtectedRoute = ({ children, requiredRole = null }) => {
//   const { isAuthenticated, user, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return <LoadingSpinner />;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (requiredRole && user?.role !== requiredRole) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;

// // src/components/Common/LoadingSpinner.js
// import React from 'react';

// const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
//   const sizeClasses = {
//     small: 'h-5 w-5',
//     medium: 'h-8 w-8',
//     large: 'h-12 w-12'
//   };

//   return (
//     <div className="flex flex-col items-center justify-center p-8">
//       <div className={`animate-spin rounded-full border-4 border-orange-200 border-t-orange-600 ${sizeClasses[size]}`}></div>
//       {text && <p className="mt-4 text-gray-600 text-sm">{text}</p>}
//     </div>
//   );
// };

// export default LoadingSpinner;

// // src/components/MealPlans/MealPlanCard.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import {
//   StarIcon,
//   ClockIcon,
//   CurrencyRupeeIcon,
//   FireIcon
// } from '@heroicons/react/24/solid';
// import Button from '../Common/Button';

// const MealPlanCard = ({ mealPlan, onQuickOrder }) => {
//   const {
//     _id,
//     title,
//     description,
//     tier,
//     pricing,
//     imageUrls,
//     ratings,
//     nutritionalInfo,
//     isPopular,
//     features
//   } = mealPlan;

//   const getTierColor = (tier) => {
//     switch (tier) {
//       case 'low': return 'bg-green-100 text-green-800';
//       case 'basic': return 'bg-blue-100 text-blue-800';
//       case 'premium': return 'bg-purple-100 text-purple-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getTierLabel = (tier) => {
//     switch (tier) {
//       case 'low': return 'Budget Friendly';
//       case 'basic': return 'Most Popular';
//       case 'premium': return 'Premium Quality';
//       default: return tier;
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       whileHover={{ y: -5 }}
//       className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
//     >
//       {/* Image */}
//       <div className="relative h-48 overflow-hidden">
//         <img
//           src={imageUrls?.[0] || '/api/placeholder/400/300'}
//           alt={title}
//           className="w-full h-full object-cover"
//         />

//         {/* Badges */}
//         <div className="absolute top-3 left-3 flex flex-wrap gap-2">
//           <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(tier)}`}>
//             {getTierLabel(tier)}
//           </span>
//           {isPopular && (
//             <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
//               <FireIcon className="h-3 w-3 mr-1" />
//               Popular
//             </span>
//           )}
//         </div>

//         {/* Rating */}
//         {ratings.average > 0 && (
//           <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
//             <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
//             <span className="text-sm font-medium">{ratings.average.toFixed(1)}</span>
//           </div>
//         )}
//       </div>

//       {/* Content */}
//       <div className="p-6">
//         <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
//         <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

//         {/* Features */}
//         {features && features.length > 0 && (
//           <div className="flex flex-wrap gap-1 mb-4">
//             {features.slice(0, 3).map((feature, index) => (
//               <span
//                 key={index}
//                 className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
//               >
//                 {feature}
//               </span>
//             ))}
//           </div>
//         )}

//         {/* Nutritional Info */}
//         {nutritionalInfo && (
//           <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
//             <div className="text-center">
//               <p className="text-xs text-gray-500">Calories</p>
//               <p className="font-semibold text-gray-900">{nutritionalInfo.calories || 'N/A'}</p>
//             </div>
//             <div className="text-center">
//               <p className="text-xs text-gray-500">Protein</p>
//               <p className="font-semibold text-gray-900">{nutritionalInfo.protein || 'N/A'}</p>
//             </div>
//             <div className="text-center">
//               <p className="text-xs text-gray-500">Prep Time</p>
//               <p className="font-semibold text-gray-900 flex items-center">
//                 <ClockIcon className="h-3 w-3 mr-1" />
//                 30m
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Pricing */}
//         <div className="mb-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs text-gray-500 mb-1">Starting from</p>
//               <div className="flex items-center">
//                 <CurrencyRupeeIcon className="h-5 w-5 text-gray-900" />
//                 <span className="text-2xl font-bold text-gray-900">{pricing.oneDay}</span>
//                 <span className="text-gray-500 ml-1">/day</span>
//               </div>
//             </div>

//             <div className="text-right">
//               {pricing.discountPercentage?.thirtyDays > 0 && (
//                 <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
//                   Save {pricing.discountPercentage.thirtyDays}%
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Pricing Options */}
//           <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
//             <div className="text-center p-2 bg-gray-50 rounded">
//               <p className="text-gray-500">1 Day</p>
//               <p className="font-semibold">₹{pricing.oneDay}</p>
//             </div>
//             <div className="text-center p-2 bg-gray-50 rounded">
//               <p className="text-gray-500">10 Days</p>
//               <p className="font-semibold">₹{pricing.tenDays}</p>
//             </div>
//             <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
//               <p className="text-orange-600">30 Days</p>
//               <p className="font-semibold text-orange-700">₹{pricing.thirtyDays}</p>
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex gap-2">
//           <Link to={`/meal-plans/${_id}`} className="flex-1">
//             <Button variant="outline" className="w-full">
//               View Details
//             </Button>
//           </Link>
//           <Button
//             onClick={() => onQuickOrder?.(mealPlan)}
//             className="flex-1"
//           >
//             Quick Order
//           </Button>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// export default MealPlanCard;

// src/components/MealPlan/MealPlanCard.jsx
import React from "react";
import { useSelector } from "react-redux";
import {
  selectIsInCompareList,
  selectIsFavorite,
} from "../../storee/Slices/mealPlanSlice";
import { Heart, Plus, Star, Clock, Users } from "lucide-react";

const MealPlanCard = ({
  mealPlan,
  viewMode = "grid",
  onSelect,
  onAddToCompare,
  onToggleFavorite,
  onAddToCart,
  isPopular = false,
}) => {
  const isInCompareList = useSelector((state) =>
    selectIsInCompareList(state, mealPlan._id)
  );
  const isFavorite = useSelector((state) =>
    selectIsFavorite(state, mealPlan._id)
  );

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    // Add with default plan (tenDays)
    const defaultPlan = {
      duration: "10 Days",
      price: mealPlan.pricing.tenDays,
      id: "tenDays",
    };
    onAddToCart(mealPlan, defaultPlan);
  };

  if (viewMode === "list") {
    return (
      <div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={onSelect}
      >
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-32 flex-shrink-0">
            <img
              src={mealPlan.imageUrls?.[0] || "/api/placeholder/200/150"}
              alt={mealPlan.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-xl font-bold text-amber-800">
                    {mealPlan.title}
                  </h3>
                  {isPopular && (
                    <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                      Popular
                    </span>
                  )}
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs capitalize ${
                      mealPlan.tier === "premium"
                        ? "bg-purple-100 text-purple-600"
                        : mealPlan.tier === "basic"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {mealPlan.tier}
                  </span>
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">
                  {mealPlan.description}
                </p>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>
                      {mealPlan.ratings?.average?.toFixed(1) || "0.0"}
                    </span>
                    <span className="ml-1">
                      ({mealPlan.ratings?.count || 0})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{mealPlan.preparationTime || "30 mins"}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{mealPlan.servingSize || "1 person"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-amber-700">
                      ${mealPlan.pricing?.oneDay}
                    </span>
                    <span className="text-gray-500 ml-1">/day</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                      className={`p-2 rounded-full ${
                        isFavorite
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={isFavorite ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      onClick={handleQuickAdd}
                      className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105"
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={mealPlan.imageUrls?.[0] || "/api/placeholder/300/200"}
          alt={mealPlan.title}
          className="w-full h-full object-cover"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {isPopular && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              🔥 Popular
            </span>
          )}
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
              mealPlan.tier === "premium"
                ? "bg-purple-500 text-white"
                : mealPlan.tier === "basic"
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {mealPlan.tier}
          </span>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-2 rounded-full backdrop-blur-sm ${
              isFavorite
                ? "bg-red-100 text-red-600"
                : "bg-white/80 text-gray-600"
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCompare();
            }}
            className={`p-2 rounded-full backdrop-blur-sm ${
              isInCompareList
                ? "bg-blue-100 text-blue-600"
                : "bg-white/80 text-gray-600"
            }`}
            disabled={isInCompareList}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-amber-800 mb-2">
          {mealPlan.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {mealPlan.description}
        </p>

        {/* Rating and Info */}
        <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span>{mealPlan.ratings?.average?.toFixed(1) || "0.0"}</span>
            <span className="ml-1">({mealPlan.ratings?.count || 0})</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{mealPlan.preparationTime || "30 mins"}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xl font-bold text-amber-700">
              ${mealPlan.pricing?.oneDay}
            </span>
            <span className="text-gray-500 text-sm ml-1">/day</span>
            {mealPlan.pricing?.discountPercentage?.tenDays > 0 && (
              <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs ml-2">
                Save {mealPlan.pricing.discountPercentage.tenDays}%
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        {mealPlan.features?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {mealPlan.features.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs"
              >
                {feature}
              </span>
            ))}
            {mealPlan.features.length > 2 && (
              <span className="text-gray-500 text-xs">
                +{mealPlan.features.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium"
        >
          Quick Add to Cart
        </button>
      </div>
    </div>
  );
};

export default MealPlanCard;
