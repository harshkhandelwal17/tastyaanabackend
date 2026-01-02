// User Profile Page
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWishlist } from "../../redux/wishlistSlice";
import { fetchCart } from "../../redux/cartSlice";
import { Link } from "react-router-dom";
import {
  User,
  MapPin,
  Shield,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Camera,
  Mail,
  Phone,
  Calendar,
  Award,
  Clock,
  Star,
  Utensils,
  Package,
  RotateCcw,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Check,
  X,
  Search,
  PlusIcon,
  Minus,
  ChefHat,
  Flame,
  Heart,
  Zap,
} from "lucide-react";
import { updateProfile } from "../../redux/authslice";
import {
  useGetUserSubscriptionsQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useSkipMealMutation,
  useCreateCustomizationMutation,
  useProcessCustomizationPaymentMutation,
  useGetMealPlanAddOnsQuery,
} from "../../redux/storee/api";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const wishlist = useSelector((state) => state.wishlist.items);
  const cart = useSelector((state) => state.cart.items);
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addresses: user?.addresses || [
      { line1: "", city: "", state: "", pincode: "", isDefault: true },
    ],
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [addressSaveStatus, setAddressSaveStatus] = useState("");

  // Subscription data and mutations
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useGetUserSubscriptionsQuery(undefined, { skip: !user });

  // Rest of your component code...
  // [Previous code remains the same until the return statement]

  return (
    <div className="bg-gray-50 font-['Plus_Jakarta_Sans'] min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 pt-4 pb-24 sm:pb-8">
        {/* Main content */}
        <div className="hidden sm:block px-2 sm:px-0 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-orange-600">My Profile</span>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 px-2 sm:px-0">
          <Link
            to="/orders"
            className="bg-[#e8b4b7] text-[#191011] px-4 py-2 rounded hover:bg-red-200 text-center sm:text-left transition-colors text-sm sm:text-base"
          >
            My Orders
          </Link>
          <Link
            to="/trackorder"
            className="bg-[#f1e9ea] text-[#191011] px-4 py-2 rounded hover:bg-[#f1e9eaa7] text-center sm:text-left transition-colors text-sm sm:text-base"
          >
            Track Order
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-2 sm:px-0">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {user?.name || 'User'}
                  </h1>
                  <p className="text-sm sm:text-base text-white/90 break-all">
                    {user?.email || 'user@example.com'}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-100 mt-1">
                    Member since {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px min-w-max">
                {["personal", "addresses", "subscriptions", "settings"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap ${
                        activeTab === tab
                          ? "border-b-2 border-orange-500 text-orange-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  )
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {activeTab === "personal" && (
                <div className="animate-fade-in-up">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                    Personal Information
                  </h2>
                  <form className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="animate-fade-in-up">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                    Change Password
                  </h2>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        required
                        minLength="6"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        required
                        minLength="6"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm sm:text-base"
                    >
                      Update Password
                    </button>
                  </form>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">
                      Security Tips:
                    </h3>
                    <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                      <li>• Use a strong password with at least 8 characters</li>
                      <li>• Include uppercase, lowercase, numbers, and symbols</li>
                      <li>• Don't reuse passwords from other accounts</li>
                      <li>• Enable two-factor authentication for better security</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
