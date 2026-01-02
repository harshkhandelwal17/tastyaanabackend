import { useState, useEffect } from "react";
import { useAuth } from "../../hook/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useRef } from "react";
import { useSelector } from "react-redux";
import StoreStatusToggle from "./StoreToggleButton";
import MealAvailabilityToggle from "./MealAvailabilityToggle";
import {
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
  useUploadSellerAvatarMutation,
  useUpdateSellerPasswordMutation,
} from "../../redux/storee/api";
import { logoutUser, addNotification } from "../../redux/authslice";
import { persistor } from "../../redux/store";
import {
  User,
  ShieldCheck,
  Store,
  BellRing,
  DollarSign,
  LogOut,
  Loader2,
  Edit2,
  Camera,
  Check,
  X,
  Lock,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  CreditCard,
  BarChart2,
  Package,
  Users,
  AlertCircle,
  Star,
  HelpCircle,
  Settings,
  FileText,
  Shield,
  ChevronRight,
  Crown,
  TrendingUp,
  Award,
  Clock,
  Eye,
  Heart,
  Zap,
  Target,
  Activity,
  Grid,
  Menu,
  ArrowLeft,
  Plus,
  Minus,
  MoreVertical,
  Download,
  Share2,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Home,
  ShoppingBag,
  Receipt,
  PieChart,
  LineChart,
  BarChart3,
  Calendar,
  MessageCircle,
  PhoneCall,
  Mail as MailIcon,
  Globe,
  MapPin as LocationIcon,
  Clock as TimeIcon,
  Shield as SecurityIcon,
  Settings as SettingsIcon,
  UserCheck,
  BadgeCheck,
  Star as StarIcon,
  ThumbsUp,
  Award as AwardIcon,
  Trophy,
  Medal,
  Gem,
  Sparkles,
  Rocket,
  Target as TargetIcon,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Hash,
  Tag,
  Gift,
  Coins,
  Wallet,
  Banknote,
  PiggyBank,
  Handshake,
  Smile,
  Frown,
  Meh,
  Heart as HeartIcon,
  ThumbsDown,
  MessageSquare,
  Send,
  Archive,
  Trash2,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Move,
  RotateCw,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  Video,
  Music,
  File,
  Folder,
  Paperclip,
  Link,
  Unlink,
  Code,
  Database,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Power,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Camera as CameraIcon,
  Video as VideoIcon,
  Mic as MicIcon,
  Headphones as HeadphonesIcon,
  Speaker as SpeakerIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Watch as WatchIcon,
  Bell,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  CalendarDays,
  UserCheck as UserCheckIcon,
  Zap as ZapIcon,
  Coffee,
  Timer,
  ShoppingCart,
  Package2,
  TrendingUp as Growth,
  DollarSign as Revenue,
  MessageCircle as Messages,
  StarIcon as Rating,
  Calculator,
  FileSpreadsheet,
  Briefcase,
  Building2,
  Map,
  Store as StoreIcon,
  Users2,
  BarChart,
  PlusCircle,
  Bookmark,
  Bell as Notifications,
  Headset,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Layers,
  Lightbulb,
  Gauge,
  Filter,
  Search,
  Calendar as CalendarDays2,
  ShieldAlert,
  Globe2,
  Activity as Analytics,
  Utensils,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import SellerEditProfileModel from "./SellerEditProfileModel";
import {
  Button,
  message,
  Badge,
  Popover,
  Tooltip,
  Progress,
  Card,
  Statistic,
  Row,
  Col,
} from "antd";

// Interactive Stats Card with Animations
const InteractiveStatCard = ({
  icon,
  label,
  value,
  change,
  changeType = "increase",
  onClick,
  color = "blue",
  subtitle,
  progressValue,
  target,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
    },
  };

  const changeColors = {
    increase: "text-green-600 bg-green-50",
    decrease: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50",
  };

  const changeIcons = {
    increase: <TrendingUp size={12} />,
    decrease: <TrendingDown size={12} />,
    neutral: <Minus size={12} />,
  };

  return (
    <div
      className={`relative overflow-hidden bg-white border rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer transform ${
        isHovered
          ? "scale-105 shadow-xl border-blue-300"
          : "shadow-lg hover:shadow-xl border-gray-200"
      } ${colorClasses[color].border}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 opacity-5">
        <div
          className={`w-full h-full rounded-full ${colorClasses[color].bg}`}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-lg ${colorClasses[color].bg} ${
              colorClasses[color].text
            } transition-transform duration-300 ${
              isHovered ? "scale-110" : ""
            }`}
          >
            {icon}
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeColors[changeType]}`}
            >
              {changeIcons[changeType]}
              <span>{change}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </div>
          <div className="text-sm font-medium text-gray-600">{label}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
          {progressValue !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>
                  {progressValue}%{target && ` / ${target}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progressValue > 70
                      ? "bg-green-500"
                      : progressValue > 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(progressValue, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Indicator */}
      <div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r transition-all duration-300 ${
          isHovered ? "w-full from-blue-500 to-purple-500" : "w-0"
        }`}
      />
    </div>
  );
};

// Enhanced Action Card
const ActionCard = ({
  icon,
  title,
  description,
  onClick,
  badge,
  color = "blue",
  featured = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div
      className={`relative group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer ${
        featured
          ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50"
          : ""
      } ${
        isHovered
          ? "shadow-xl transform scale-105"
          : "shadow-md hover:shadow-lg"
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {featured && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            NEW
          </div>
        </div>
      )}

      <div className="flex items-start space-x-4">
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${
            colorClasses[color]
          } text-white transition-transform duration-300 ${
            isHovered ? "scale-110 rotate-6" : ""
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            {badge && (
              <Badge
                count={badge}
                style={{ backgroundColor: "#52c41a" }}
                size="small"
              />
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>

        <ChevronRight
          className={`text-gray-400 group-hover:text-blue-500 transition-all duration-300 ${
            isHovered ? "transform translate-x-1" : ""
          }`}
          size={16}
        />
      </div>
    </div>
  );
};

// Quick Action Button
const QuickActionButton = ({
  icon,
  label,
  onClick,
  variant = "primary",
  disabled = false,
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
    purple:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} shadow-lg hover:shadow-xl`}
    >
      {icon}
      <span className="text-sm sm:text-base">{label}</span>
    </button>
  );
};

// Enhanced Profile Header
const EnhancedProfileHeader = ({
  profile,
  onAvatarClick,
  isUploading,
  isAvatarHovered,
  setIsAvatarHovered,
  fileInputRef,
  handleAvatarUpload,
  stats = {}, // Add default value for stats
}) => {
  const joinDate = profile?.data?.createdAt
    ? format(new Date(profile?.data?.createdAt), "MMMM yyyy")
    : "";

  const completionPercentage = 85; // Calculate based on profile completeness
  const storeStatus = profile?.data?.sellerProfile?.isActive
    ? "Active"
    : "Inactive";

  // Provide default values for stats
  const defaultStats = {
    totalProducts: 0,
    avgRating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    ...stats,
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
        {/* Enhanced Avatar Section */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
          <div
            className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-28 lg:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl"
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
          >
            <img
              src={
                profile?.data?.avatar ||
                "https://res.cloudinary.com/dcha7gy9o/image/upload/v1755226310/Brown_Orange_Gradient_Geometric_Profile_Picture_Instagram_Post_fr6fkf.png"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            {isAvatarHovered && !isUploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex items-center justify-center text-white transition-all duration-200"
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          {/* Enhanced Status Indicators */}
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <Tooltip title="Verified Seller">
              <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                <Check size={14} className="text-white" />
              </div>
            </Tooltip>
            <Tooltip title={`Store is ${storeStatus}`}>
              <div
                className={`w-6 h-6 ${
                  storeStatus === "Active" ? "bg-blue-500" : "bg-gray-400"
                } rounded-full border-2 border-white shadow-lg`}
              />
            </Tooltip>
          </div>
        </div>

        {/* Enhanced Profile Info */}
        <div className="text-center lg:text-left flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {profile?.data?.name || "Seller Name"}
              </h1>
              <BadgeCheck size={24} className="text-blue-500" />
              <Badge count="Pro" style={{ backgroundColor: "#722ed1" }} />
            </div>
            <p className="text-gray-600 flex items-center justify-center lg:justify-start gap-2 text-lg">
              <Mail size={16} />
              {profile?.data?.email}
            </p>
          </div>

          {/* Enhanced Badges */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <div className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
              <Store size={14} className="mr-2" />
              {profile?.data?.sellerProfile?.storeName || "My Store"}
            </div>
            {joinDate && (
              <div className="flex items-center bg-white border border-gray-300 px-3 py-2 rounded-full text-sm">
                <CalendarIcon size={14} className="mr-2 text-gray-500" />
                Joined {joinDate}
              </div>
            )}
            <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
              <Star size={14} className="mr-2" />
              Verified Seller
            </div>
            <div className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
              <Crown size={14} className="mr-2" />
              Premium
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Profile Completion
              </span>
              <span className="text-sm font-bold text-blue-600">
                {completionPercentage}%
              </span>
            </div>
            <Progress
              percent={completionPercentage}
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              size="small"
            />
            <p className="text-xs text-gray-600 mt-2">
              Complete your profile to unlock more features
            </p>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="grid grid-cols-2 gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {defaultStats.totalProducts}
            </div>
            <div className="text-xs text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {defaultStats.avgRating}
            </div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {defaultStats.totalOrders}
            </div>
            <div className="text-xs text-gray-600">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ₹{defaultStats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SellerProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user: authUser,
    token,
    isAuthenticated,
  } = useSelector((state) => state.auth);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [showAllStats, setShowAllStats] = useState(false);
  const fileInputRef = useRef(null);

  // Mock data for demonstration - moved to component state
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgRating: 0,
    totalCustomers: 0,
    conversionRate: 0,
    todaySales: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    newMessages: 0,
  });

  const [recentActivities] = useState([
    {
      type: "order",
      message: "New order #1234 received",
      time: "2 mins ago",
      icon: ShoppingCart,
    },
    {
      type: "review",
      message: "5-star review on iPhone 13",
      time: "1 hour ago",
      icon: Star,
    },
    {
      type: "stock",
      message: "Low stock alert: Samsung Galaxy",
      time: "3 hours ago",
      icon: AlertTriangle,
    },
    {
      type: "message",
      message: "New customer inquiry",
      time: "5 hours ago",
      icon: MessageCircle,
    },
  ]);

  // Fetch seller profile data
  console.log('Auth User:', authUser);
  console.log('Token:', token);
  console.log('Is Authenticated:', isAuthenticated);
  
  // Check if we have a token before making the query
  const hasToken = token || localStorage.getItem('token');
  
  const {
    data: sellerProfile,
    isLoading,
    isError,
    error,
    refetch: refetchProfile,
  } = useGetSellerProfileQuery(undefined, {
    skip: !hasToken || (!authUser?.id && !authUser?._id),
    refetchOnMountOrArgChange: true,
  });

  // Mutations
  const [updateProfile] = useUpdateSellerProfileMutation();
  const [uploadAvatar] = useUploadSellerAvatarMutation();
  const [updatePassword] = useUpdateSellerPasswordMutation();

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsUploading(true);
      await uploadAvatar(formData).unwrap();
      await refetchProfile();
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error?.data?.message || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (data) => {
    try {
      await updateProfile(data).unwrap();
      await refetchProfile();
      setEditModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      persistor.purge();
    });
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Dashboard
            </h3>
            <p className="text-gray-600">Preparing your seller insights...</p>
            <div className="mt-4">
              <Progress percent={75} strokeColor="#3B82F6" showInfo={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if token is missing
  if (!hasToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Please log in to view your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Go to Login
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error?.data?.message || error?.error || "Failed to load your profile. Please try again.";
    const isAuthError = errorMessage.includes('token') || errorMessage.includes('Access denied') || errorMessage.includes('Unauthorized');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm sm:max-w-md w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            {isAuthError ? 'Authentication Error' : 'Something went wrong'}
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            {isAuthError ? (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate("/login");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Login Again
              </button>
            ) : (
              <button
                onClick={refetchProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Seller Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your store and track performance
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Tooltip title="Notifications">
                <Button
                  icon={<Bell size={16} />}
                  className="relative"
                  onClick={() => navigate("/seller/notifications")}
                >
                  {stats.newMessages > 0 && (
                    <Badge
                      count={stats.newMessages}
                      size="small"
                      className="absolute -top-1 -right-1"
                    />
                  )}
                </Button>
              </Tooltip>

              <QuickActionButton
                icon={<Edit2 size={16} />}
                label={
                  <>
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </>
                }
                onClick={() => setEditModalOpen(true)}
                variant="primary"
              />
              <QuickActionButton
                icon={<LogOut size={16} />}
                label={<span className="hidden sm:inline">Logout</span>}
                onClick={handleLogout}
                variant="danger"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Profile Header */}
        <div className="mb-8">
          <EnhancedProfileHeader
            profile={sellerProfile}
            onAvatarClick={() => fileInputRef.current?.click()}
            isUploading={isUploading}
            isAvatarHovered={isAvatarHovered}
            setIsAvatarHovered={setIsAvatarHovered}
            fileInputRef={fileInputRef}
            handleAvatarUpload={handleAvatarUpload}
            stats={stats} // Pass stats as prop
          />
        </div>

        {/* Interactive Stats Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Performance Overview
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => refetchProfile()}
                className="flex items-center"
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <InteractiveStatCard
              icon={<Package size={24} />}
              label="Total Products"
              value={stats.totalProducts}
              change="+12%"
              changeType="increase"
              color="blue"
              onClick={() => navigate("/seller/gadgets")}
              subtitle="Active listings"
              progressValue={75}
              target="60 products"
            />

            <InteractiveStatCard
              icon={<DollarSign size={24} />}
              label="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              change="+8.3%"
              changeType="increase"
              color="green"
              onClick={() => navigate("/seller/analytics")}
              subtitle="This month"
              progressValue={68}
            />

            <InteractiveStatCard
              icon={<ShoppingCart size={24} />}
              label="Total Orders"
              value={stats.totalOrders}
              change="+15.2%"
              changeType="increase"
              color="purple"
              onClick={() => navigate("/seller/orders")}
              subtitle="Completed orders"
              progressValue={85}
            />

            <InteractiveStatCard
              icon={<Star size={24} />}
              label="Store Rating"
              value={`${stats.avgRating}/5`}
              change="+0.2"
              changeType="increase"
              color="orange"
              onClick={() => navigate("/seller/reviews")}
              subtitle="Based on 124 reviews"
              progressValue={96}
            />
          </div>

          {showAllStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <InteractiveStatCard
                icon={<Users size={20} />}
                label="Total Customers"
                value={stats.totalCustomers}
                color="indigo"
                subtitle="Unique buyers"
              />

              <InteractiveStatCard
                icon={<Target size={20} />}
                label="Conversion Rate"
                value={`${stats.conversionRate}%`}
                color="teal"
                subtitle="Visitors to buyers"
              />

              <InteractiveStatCard
                icon={<Clock size={20} />}
                label="Today's Sales"
                value={`₹${stats.todaySales.toLocaleString()}`}
                color="pink"
                subtitle="Real-time earnings"
              />
            </div>
          )}

          <div className="text-center mt-6">
            <Button
              type="link"
              onClick={() => setShowAllStats(!showAllStats)}
              icon={
                showAllStats ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )
              }
            >
              {showAllStats ? "Show Less" : "Show More Stats"}
            </Button>
          </div>
        </div>

        {/* Quick Actions & Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard
                icon={<Utensils size={20} />}
                title="Meal Management"
                description="Manage meal plans, tiers, and subscription meals"
                onClick={() => navigate("/seller/meal-edit")}
                color="orange"
                featured={true}
              />

              <ActionCard
                icon={<Truck size={20} />}
                title="Daily Orders"
                description="Track delivery status, skipped & customized meals"
                onClick={() => navigate("/seller/meal-edit/daily-orders")}
                color="purple"
              />

              <ActionCard
                icon={<Package2 size={20} />}
                title="Manage Products"
                description="Add, edit, or remove your product listings"
                onClick={() => navigate("/seller/gadgets")}
                badge={stats.totalProducts}
                color="blue"
              />

              <ActionCard
                icon={<ShoppingBag size={20} />}
                title="View Orders"
                description="Process and track your customer orders"
                onClick={() => navigate("/seller/orders")}
                badge={stats.pendingOrders}
                color="green"
              />

              <ActionCard
                icon={<BarChart3 size={20} />}
                title="Analytics Dashboard"
                description="Deep insights into your store performance"
                onClick={() => navigate("/seller/analytics")}
                color="purple"
                featured={true}
              />

              <ActionCard
                icon={<MessageCircle size={20} />}
                title="Customer Messages"
                description="Respond to customer inquiries and reviews"
                onClick={() => navigate("/seller/messages")}
                badge={stats.newMessages}
                color="orange"
              />

              <ActionCard
                icon={<AlertTriangle size={20} />}
                title="Stock Alerts"
                description="Manage inventory and low stock warnings"
                onClick={() => navigate("/seller/inventory")}
                badge={stats.lowStockItems}
                color="red"
              />

              <ActionCard
                icon={<Settings size={20} />}
                title="Store Settings"
                description="Configure your store policies and preferences"
                onClick={() => navigate("/seller/settings")}
                color="indigo"
              />
            </div>
          </div>

          {/* Recent Activity & Store Status */}
          <div className="space-y-6">
            {/* Store Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Store size={16} />
                Store Status
              </h4>
              <div className="space-y-4">
                <StoreStatusToggle />
                <div className="text-sm text-gray-600">
                  Your store is currently{" "}
                  <span className="font-semibold text-green-600">Active</span>{" "}
                  and visible to customers.
                </div>
                <Button
                  type="primary"
                  block
                  onClick={() => navigate("/seller/store-settings")}
                  icon={<Settings size={14} />}
                >
                  Configure Store
                </Button>
              </div>
            </div>

            {/* Meal Availability Toggle */}
            <MealAvailabilityToggle />

            {/* Recent Activity */}
            {/* <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={16} />
                  Recent Activity
                </h4>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate("/seller/activity")}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity, index) => {
                  const IconComponent = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full">
                        <IconComponent size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div> */}

            {/* Quick Stats */}
            {/* <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Zap size={16} />
                Today's Highlights
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">New Orders</span>
                  <span className="font-bold">+5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Revenue</span>
                  <span className="font-bold">
                    ₹{stats.todaySales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Views</span>
                  <span className="font-bold">+342</span>
                </div>
              </div>
            </div>*/}
          </div>
        </div>

        {/* Additional Tools Section */}
        {/* <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase size={20} />
            Business Tools
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Calculator size={16} />}
              label="Pricing Calculator"
              onClick={() => navigate("/seller/pricing-calculator")}
              variant="secondary"
            />

            <QuickActionButton
              icon={<FileSpreadsheet size={16} />}
              label="Bulk Upload"
              onClick={() => navigate("/seller/bulk-upload")}
              variant="secondary"
            />

            <QuickActionButton
              icon={<Download size={16} />}
              label="Export Data"
              onClick={() => navigate("/seller/export")}
              variant="secondary"
            />

            <QuickActionButton
              icon={<Headset size={16} />}
              label="Support Center"
              onClick={() => navigate("/seller/support")}
              variant="secondary"
            />
          </div>
        </div> */}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && sellerProfile && (
        <SellerEditProfileModel
          user={{
            ...sellerProfile.data,
            phone: sellerProfile?.data?.phone || "",
            address: sellerProfile?.data?.sellerProfile?.storeAddress || "",
          }}
          onClose={() => setEditModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default SellerProfile;
