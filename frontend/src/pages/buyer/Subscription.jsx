import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  Pause, 
  Play, 
  X, 
  Eye,
  Plus,
  Minus,
  Wallet,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  Gift,
  Bell,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Award,
  Target,
  PieChart,
  BarChart3,
  Activity,
  Thermometer,
  Droplets,
  Sun,
  Moon,
  Coffee,
  UtensilsCrossed
} from 'lucide-react';

const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [mealCalendar, setMealCalendar] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const { user } = useSelector(state => state.auth);

  // Mock data - replace with API calls
  useEffect(() => {
    fetchSubscriptions();
    fetchWalletBalance();
  }, []);

  const fetchSubscriptions = async () => {
    // Mock API call
    setTimeout(() => {
      setSubscriptions([
        {
          id: 'sub_001',
          subscriptionId: 'SUB_A1B2C3D4',
          mealPlan: {
            title: 'Premium Veg Thali',
            description: 'Delicious vegetarian meals with fresh ingredients',
            imageUrls: ['/api/placeholder/400/300'],
            pricing: { tenDays: 75, thirtyDays: 70 },
            category: 'vegetarian',
            rating: 4.8,
            totalReviews: 1250
          },
          status: 'active',
          pricing: {
            basePricePerMeal: 75,
            totalDays: 30,
            mealsPerDay: 2,
            totalMeals: 60,
            totalAmount: 4500,
            addOnsPrice: 300,
            customizationPrice: 150,
            finalAmount: 4950
          },
          deliveryTiming: {
            morning: { enabled: true, time: '08:00' },
            evening: { enabled: true, time: '19:00' }
          },
          deliveryAddress: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-30'),
          selectedAddOns: [
            { addOnId: 'addon_1', name: 'Extra Roti', price: 10, frequency: 'daily' },
            { addOnId: 'addon_2', name: 'Sweet', price: 20, frequency: 'daily' },
            { addOnId: 'addon_3', name: 'Extra Sabzi', price: 15, frequency: 'daily' }
          ],
          customizations: {
            dietaryPreference: 'vegetarian',
            customOptions: ['Less Spicy', 'Extra Onions']
          },
          remainingDays: 15,
          progressPercentage: 50,
          dailyDeductions: [
            {
              date: new Date('2024-01-15'),
              mealType: 'morning',
              amount: 75,
              addOnsAmount: 30,
              totalAmount: 105,
              status: 'deducted'
            },
            {
              date: new Date('2024-01-15'),
              mealType: 'evening',
              amount: 75,
              addOnsAmount: 30,
              totalAmount: 105,
              status: 'pending'
            }
          ],
          totalSavings: 1250,
          mealsDelivered: 30,
          mealsRemaining: 30,
          nextDelivery: new Date('2024-01-16T08:00:00Z'),
          lastDelivery: new Date('2024-01-15T08:00:00Z')
        },
        {
          id: 'sub_002',
          subscriptionId: 'SUB_B2C3D4E5',
          mealPlan: {
            title: 'Non-Veg Special',
            description: 'Protein-rich non-vegetarian meals',
            imageUrls: ['/api/placeholder/400/300'],
            pricing: { tenDays: 85, thirtyDays: 80 },
            category: 'non-vegetarian',
            rating: 4.6,
            totalReviews: 890
          },
          status: 'paused',
          pricing: {
            basePricePerMeal: 85,
            totalDays: 10,
            mealsPerDay: 1,
            totalMeals: 10,
            totalAmount: 850,
            addOnsPrice: 100,
            customizationPrice: 50,
            finalAmount: 1000
          },
          deliveryTiming: {
            morning: { enabled: false, time: '08:00' },
            evening: { enabled: true, time: '19:00' }
          },
          deliveryAddress: {
            street: '456 Oak Avenue',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400002'
          },
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-01-20'),
          selectedAddOns: [
            { addOnId: 'addon_4', name: 'Extra Chicken', price: 25, frequency: 'daily' }
          ],
          customizations: {
            dietaryPreference: 'non-vegetarian',
            customOptions: ['Spicy', 'Extra Gravy']
          },
          remainingDays: 5,
          progressPercentage: 50,
          dailyDeductions: [
            {
              date: new Date('2024-01-15'),
              mealType: 'evening',
              amount: 85,
              addOnsAmount: 25,
              totalAmount: 110,
              status: 'skipped'
            }
          ],
          totalSavings: 200,
          mealsDelivered: 5,
          mealsRemaining: 5,
          nextDelivery: null,
          lastDelivery: new Date('2024-01-14T19:00:00Z'),
          pausedUntil: new Date('2024-01-25')
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const fetchWalletBalance = async () => {
    // Mock API call
    setTimeout(() => {
      setWalletBalance(2500);
    }, 500);
  };

  const handlePauseSubscription = async (subscriptionId, startDate, endDate, reason) => {
    try {
      // API call to pause subscription
      console.log('Pausing subscription:', { subscriptionId, startDate, endDate, reason });
      // Update local state
      setShowPauseModal(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
    }
  };

  const handleSkipMeal = async (subscriptionId, date, mealType, reason) => {
    try {
      // API call to skip meal
      console.log('Skipping meal:', { subscriptionId, date, mealType, reason });
      setShowSkipModal(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error skipping meal:', error);
    }
  };

  const SubscriptionCard = ({ subscription }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header with Image and Status */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 relative overflow-hidden">
          <img 
            src={subscription.mealPlan.imageUrls[0]} 
            alt={subscription.mealPlan.title}
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
              subscription.status === 'active' ? 'bg-green-500/90 text-white' :
              subscription.status === 'paused' ? 'bg-yellow-500/90 text-white' :
              subscription.status === 'cancelled' ? 'bg-red-500/90 text-white' :
              'bg-gray-500/90 text-white'
            }`}>
              {subscription.status === 'active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
              {subscription.status === 'paused' && <Pause className="w-3 h-3 inline mr-1" />}
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          </div>

          {/* Days Left Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {subscription.remainingDays} days
            </span>
          </div>

          {/* Rating */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-bold text-gray-800">{subscription.mealPlan.rating}</span>
              <span className="text-xs text-gray-600">({subscription.mealPlan.totalReviews})</span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <span className="text-xs font-semibold text-gray-700 capitalize">
              {subscription.mealPlan.category}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {subscription.mealPlan.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {subscription.mealPlan.description}
          </p>
        </div>

        {/* Subscription ID and Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500 font-mono">
            #{subscription.subscriptionId}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              ₹{subscription.pricing.basePricePerMeal}
            </div>
            <div className="text-xs text-gray-500">per meal</div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Subscription Progress</span>
            <span className="font-bold">{Math.round(subscription.progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${subscription.progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{subscription.mealsDelivered} delivered</span>
            <span>{subscription.mealsRemaining} remaining</span>
          </div>
        </div>

        {/* Delivery Timing */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Delivery Schedule</div>
          <div className="flex flex-wrap gap-2">
            {subscription.deliveryTiming.morning.enabled && (
              <div className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">
                <Sun className="w-3 h-3" />
                <span className="font-medium">Morning {subscription.deliveryTiming.morning.time}</span>
              </div>
            )}
            {subscription.deliveryTiming.evening.enabled && (
              <div className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
                <Moon className="w-3 h-3" />
                <span className="font-medium">Evening {subscription.deliveryTiming.evening.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Add-ons */}
        {subscription.selectedAddOns.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Selected Add-ons</div>
            <div className="flex flex-wrap gap-1.5">
              {subscription.selectedAddOns.slice(0, 3).map((addon, index) => (
                <span 
                  key={index}
                  className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  {addon.name} (+₹{addon.price})
                </span>
              ))}
              {subscription.selectedAddOns.length > 3 && (
                <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                  +{subscription.selectedAddOns.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Next Delivery Info */}
        {subscription.nextDelivery && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-800">Next Delivery</div>
                <div className="text-xs text-blue-600">
                  {new Date(subscription.nextDelivery).toLocaleDateString()} at{' '}
                  {new Date(subscription.nextDelivery).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSubscription(subscription)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          
          <div className="relative group">
            <button className="bg-gray-100 text-gray-700 py-2.5 px-3 rounded-xl hover:bg-gray-200 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                {subscription.status === 'active' ? (
                  <button
                    onClick={() => {
                      setSelectedSubscription(subscription);
                      setShowPauseModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause Subscription
                  </button>
                ) : subscription.status === 'paused' ? (
                  <button
                    onClick={() => {/* Resume subscription */}}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume Subscription
                  </button>
                ) : null}
                
                <button
                  onClick={() => {
                    setSelectedSubscription(subscription);
                    setShowCustomizeModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Customize Meal
                </button>
                
                <button
                  onClick={() => {
                    setSelectedSubscription(subscription);
                    setShowSkipModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Skip Next Meal
                </button>
                
                <hr className="my-1" />
                
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const WalletCard = () => (
    <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Wallet Balance</h3>
            <p className="text-purple-100 text-sm">Available for meal payments</p>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        
        <div className="text-4xl font-bold mb-6">
          ₹{walletBalance.toLocaleString()}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
            <Plus className="w-4 h-4" />
            Add Money
          </button>
          <button className="flex-1 bg-white text-purple-600 py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
            <Activity className="w-4 h-4" />
            View History
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-purple-100 text-sm">This Month</p>
              <p className="text-lg font-semibold">₹2,450</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total Saved</p>
              <p className="text-lg font-semibold">₹1,250</p>
            </div>
          </div>
        </div>

        {/* Low Balance Warning */}
        {walletBalance < 500 && (
          <div className="mt-4 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-200">Low Balance Alert</p>
              <p className="text-xs text-red-100">Add money to avoid service interruption</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const MealCalendar = ({ subscription }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate calendar days for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayData = {
        date,
        day,
        isToday: date.toDateString() === today.toDateString(),
        isInRange: date >= subscription.startDate && date <= subscription.endDate,
        meals: {
          morning: {
            enabled: subscription.deliveryTiming.morning.enabled,
            status: date < today ? 'completed' : 'scheduled'
          },
          evening: {
            enabled: subscription.deliveryTiming.evening.enabled,
            status: date < today ? 'completed' : 'scheduled'
          }
        }
      };
      
      calendarDays.push(dayData);
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Meal Calendar - {monthNames[currentMonth]} {currentYear}
        </h3>
        
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayData, index) => (
            <div key={index} className="aspect-square">
              {dayData ? (
                <div className={`
                  h-full border rounded-lg p-1 text-xs transition-all duration-200 hover:shadow-md cursor-pointer
                  ${dayData.isToday ? 'border-blue-500 bg-blue-50' : 
                    dayData.isInRange ? 'border-green-300 bg-green-50' : 
                    'border-gray-200 bg-gray-50'}
                `}>
                  <div className="font-medium text-center mb-1">
                    {dayData.day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayData.meals.morning.enabled && (
                      <div className={`w-full h-2 rounded ${
                        dayData.meals.morning.status === 'completed' ? 'bg-green-400' :
                        dayData.meals.morning.status === 'scheduled' ? 'bg-blue-400' :
                        'bg-gray-300'
                      }`}></div>
                    )}
                    
                    {dayData.meals.evening.enabled && (
                      <div className={`w-full h-2 rounded ${
                        dayData.meals.evening.status === 'completed' ? 'bg-purple-400' :
                        dayData.meals.evening.status === 'scheduled' ? 'bg-indigo-400' :
                        'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Completed Morning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>Completed Evening</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Scheduled Morning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-400 rounded"></div>
            <span>Scheduled Evening</span>
          </div>
        </div>
      </div>
    );
  };

  const PauseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pause Subscription</h3>
          <button
            onClick={() => setShowPauseModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Why are you pausing your subscription?"
            ></textarea>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowPauseModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle pause subscription
              setShowPauseModal(false);
            }}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Pause Subscription
          </button>
        </div>
      </div>
    </div>
  );

  const SkipMealModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Skip Meal</h3>
          <button
            onClick={() => setShowSkipModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="morning">Morning Meal</option>
              <option value="evening">Evening Meal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a reason</option>
              <option value="traveling">Traveling</option>
              <option value="not_hungry">Not hungry</option>
              <option value="eating_out">Eating out</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowSkipModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle skip meal
              setShowSkipModal(false);
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Skip Meal
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-gray-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Loading Subscriptions</h3>
            <p className="text-gray-600">Fetching your meal plans and preferences...</p>
          </div>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                Active Subscriptions
              </h1>
              <p className="text-gray-600 text-lg">
                Apni meal subscriptions manage karein aur daily progress track karein
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button className="bg-white text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                <Plus className="w-4 h-4" />
                New Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.reduce((sum, s) => sum + s.pricing.totalMeals, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900">₹{walletBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{subscriptions.reduce((sum, s) => sum + (s.totalSavings || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
            <nav className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Settings },
                { id: 'calendar', label: 'Meal Calendar', icon: Calendar },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'notifications', label: 'Notifications', icon: Bell }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {activeTab === 'overview' && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price">Price Low-High</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    <div className="space-y-0.5 w-4 h-4">
                      <div className="bg-current rounded-sm h-0.5"></div>
                      <div className="bg-current rounded-sm h-0.5"></div>
                      <div className="bg-current rounded-sm h-0.5"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Wallet Balance Card */}
            <WalletCard />

            {/* Subscriptions Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Your Subscriptions
                  </h2>
                  <p className="text-gray-600">
                    {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              {/* Filtered and Sorted Subscriptions */}
              {(() => {
                let filteredSubscriptions = subscriptions;

                // Apply search filter
                if (searchTerm) {
                  filteredSubscriptions = filteredSubscriptions.filter(sub =>
                    sub.mealPlan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.subscriptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sub.mealPlan.category.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                }

                // Apply status filter
                if (filterStatus !== 'all') {
                  filteredSubscriptions = filteredSubscriptions.filter(sub =>
                    sub.status === filterStatus
                  );
                }

                // Apply sorting
                filteredSubscriptions.sort((a, b) => {
                  switch (sortBy) {
                    case 'recent':
                      return new Date(b.startDate) - new Date(a.startDate);
                    case 'oldest':
                      return new Date(a.startDate) - new Date(b.startDate);
                    case 'name':
                      return a.mealPlan.title.localeCompare(b.mealPlan.title);
                    case 'price':
                      return a.pricing.basePricePerMeal - b.pricing.basePricePerMeal;
                    default:
                      return 0;
                  }
                });

                return filteredSubscriptions.length > 0 ? (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredSubscriptions.map(subscription => (
                      <SubscriptionCard 
                        key={subscription.id} 
                        subscription={subscription} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm || filterStatus !== 'all' ? 'No matching subscriptions found' : 'No active subscriptions yet'}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting search or filters'
                        : 'Start your first meal subscription — home-style taste, on time every day!'
                      }
                    </p>
                    {!searchTerm && filterStatus === 'all' && (
                      <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl">
                        <Plus className="w-5 h-5" />
                        Browse Meal Plans
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && selectedSubscription && (
          <MealCalendar subscription={selectedSubscription} />
        )}

        {activeTab === 'calendar' && !selectedSubscription && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a subscription to view calendar
            </h3>
            <p className="text-gray-500">
              Choose a subscription from the overview tab to see your meal calendar
            </p>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <WalletCard />
            
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Recent Transactions
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    type: 'debit',
                    description: 'Morning meal deduction - Premium Thali',
                    amount: 105,
                    date: '2024-01-15T08:00:00Z',
                    status: 'completed'
                  },
                  {
                    id: 2,
                    type: 'debit',
                    description: 'Evening meal deduction - Premium Thali',
                    amount: 105,
                    date: '2024-01-14T19:00:00Z',
                    status: 'completed'
                  },
                  {
                    id: 3,
                    type: 'credit',
                    description: 'Wallet top-up',
                    amount: 2000,
                    date: '2024-01-14T10:30:00Z',
                    status: 'completed'
                  }
                ].map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <Plus className={`w-5 h-5 text-green-600`} />
                        ) : (
                          <Minus className={`w-5 h-5 text-red-600`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()} at{' '}
                          {new Date(transaction.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View All Transactions
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Notification Settings
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  title: 'Meal Delivery Reminders',
                  description: 'Get notified 30 minutes before your meal delivery',
                  enabled: true
                },
                {
                  title: 'Low Wallet Balance',
                  description: 'Alert when wallet balance is below ₹500',
                  enabled: true
                },
                {
                  title: 'Subscription Expiry',
                  description: 'Reminder 3 days before subscription expires',
                  enabled: true
                },
                {
                  title: 'Weekly Summary',
                  description: 'Weekly report of your meal consumption',
                  enabled: false
                }
              ].map((setting, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={setting.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPauseModal && <PauseModal />}
      {showSkipModal && <SkipMealModal />}
    </div>
  );
};

export default SubscriptionManagement;