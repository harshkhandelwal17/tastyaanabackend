import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, ArrowRight, Calendar, Utensils, Clock, Info, AlertTriangle, Award, Star } from 'lucide-react';

export default function DailyMeal() {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  
  // Get user and subscription from Redux store
  const { user, subscription } = useSelector((state) => state.auth);
  
  // Default tier based on user's subscription
  // You'll need to map your subscription planType to the appropriate meal tier
  const [userTier, setUserTier] = useState('basic');
  
  // For development - replace with actual subscription
  const subscriptionMock = {
    planType: 'monthly', // oneDay, tenDays, monthly, thirtyDays
    id: '688bd4d701443fd5d69b1fff'
  };

  useEffect(() => {
    // Get the user's subscription tier
    const determineTier = () => {
      // Use Redux subscription data if available
      if (subscription && subscription.planType) {
        // Map subscription planType to meal tier
        let tier = 'basic'; // Default tier
        
        // Example mapping logic (adjust based on your business rules)
        if (subscription.planType === 'oneDay') {
          tier = 'low';
        } else if (subscription.planType === 'tenDays') {
          tier = 'basic';
        } else if (['monthly', 'thirtyDays'].includes(subscription.planType)) {
          tier = 'premium';
        }
        
        return tier;
      }
      
      // For development/fallback - use mock data if Redux store is empty
      if (subscriptionMock && subscriptionMock.planType) {
        let tier = 'basic';
        
        if (subscriptionMock.planType === 'oneDay') {
          tier = 'low';
        } else if (subscriptionMock.planType === 'tenDays') {
          tier = 'basic';
        } else if (['monthly', 'thirtyDays'].includes(subscriptionMock.planType)) {
          tier = 'premium';
        }
        
        return tier;
      }
      
      return 'basic'; // Default if no subscription found
    };
    
    // Set the user's tier
    setUserTier(determineTier());
    
    // Fetch meal data
    fetchMeal(activeTab);
  }, [activeTab, subscription]);

  const fetchMeal = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = type === 'today' ? '/dailymeals/today' : '/dailymeals/tomorrow';
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`${type}'s meal data loaded:`, data.data);
        setMeal(data.data);
      } else {
        setError(data.message || `Failed to fetch ${type}'s meal data`);
      }
    } catch (err) {
      console.error(`Error fetching ${type}'s meal:`, err);
      setError(`Failed to load meal information: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderMealItems = (items) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-500 italic">No items available for this meal</p>;
    }

    return (
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <div className="h-2 w-2 mt-2 rounded-full bg-green-500 mr-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              {item.quantity && (
                <p className="text-xs text-gray-500">{item.quantity}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderNutritionalInfo = () => {
    if (!meal || !meal.nutritionalInfo || !meal.nutritionalInfo[userTier]) {
      return <p className="text-gray-500 italic">Nutritional information not available</p>;
    }

    const info = meal.nutritionalInfo[userTier];
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Nutritional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500">Calories</p>
            <p className="font-bold text-gray-900">{info.calories || 0} kcal</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500">Protein</p>
            <p className="font-bold text-gray-900">{info.protein || '0g'}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500">Carbs</p>
            <p className="font-bold text-gray-900">{info.carbs || '0g'}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-xs text-gray-500">Fat</p>
            <p className="font-bold text-gray-900">{info.fat || '0g'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderImages = () => {
    if (!meal || !meal.images || meal.images.length === 0) {
      return (
        <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No images available for this meal</p>
        </div>
      );
    }

    // Filter images by tier and slot if available
    const relevantImages = meal.images.filter(img => 
      (!img.tier || img.tier === userTier) && 
      (!img.slot || img.slot === selectedMealType)
    );

    if (relevantImages.length === 0) {
      // If no specific images for this tier/slot, show any available image
      return (
        <div className="relative h-48 overflow-hidden rounded-lg">
          <img 
            src={meal.images[0].url} 
            alt={meal.images[0].alt || "Meal image"} 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className="relative h-48 overflow-hidden rounded-lg">
        <img 
          src={relevantImages[0].url} 
          alt={relevantImages[0].alt || "Meal image"} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  const renderChefSpecial = () => {
    if (!meal || !meal.chefSpecial || !meal.chefSpecial.isChefSpecial) {
      return null;
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
        <div className="flex items-center">
          <Award className="text-yellow-500 mr-2 h-5 w-5" />
          <h3 className="font-medium text-gray-900">Chef's Special</h3>
        </div>
        <p className="mt-2 text-sm text-gray-700">{meal.chefSpecial.specialNote}</p>
        {meal.chefSpecial.chefName && (
          <p className="mt-1 text-xs text-gray-500">- Chef {meal.chefSpecial.chefName}</p>
        )}
      </div>
    );
  };

  const renderSundaySpecial = () => {
    if (!meal || !meal.sundaySpecial || !meal.sundaySpecial.isSpecialDay) {
      return null;
    }

    return (
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mt-4">
        <div className="flex items-center">
          <Star className="text-purple-500 mr-2 h-5 w-5" />
          <h3 className="font-medium text-gray-900">Sunday Special</h3>
        </div>
        
        {meal.sundaySpecial.specialItems && meal.sundaySpecial.specialItems.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700">Special Items:</h4>
            <ul className="mt-1 space-y-1">
              {meal.sundaySpecial.specialItems.map((item, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {item.name} {item.description ? `- ${item.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {meal.sundaySpecial.extraCharges > 0 && !meal.sundaySpecial.includedInPlan && (
          <p className="mt-2 text-sm text-red-600">
            Extra charge: ₹{meal.sundaySpecial.extraCharges}
          </p>
        )}
        
        {meal.sundaySpecial.includedInPlan && (
          <p className="mt-2 text-sm text-green-600">
            Included in your subscription plan!
          </p>
        )}
      </div>
    );
  };

  const renderAvailabilityMessage = () => {
    if (!meal || !meal.availability) return null;
    
    if (!meal.availability[userTier]) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2 h-5 w-5" />
            <p className="text-red-600 font-medium">
              This meal is not available for your subscription tier.
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-red-800 mb-2">
        Unable to load meal information
      </h3>
      <p className="text-red-600">{error}</p>
      <button 
        onClick={() => fetchMeal(activeTab)}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const renderNoMealAvailableMessage = () => (
    <div className="p-6 rounded-lg border border-yellow-200 bg-yellow-50 text-center">
      <Info className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-yellow-800 mb-2">
        No Meal Scheduled
      </h3>
      <p className="text-yellow-700">
        {activeTab === 'today' 
          ? "There is no meal scheduled for today." 
          : "There is no meal scheduled for tomorrow."}
      </p>
      <p className="mt-2 text-sm text-yellow-600">
        Please check back later or contact customer support if you believe this is an error.
      </p>
    </div>
  );

  const renderMealContent = () => {
    if (!meal) {
      return renderNoMealAvailableMessage();
    }

    // Check if meals exist for user's tier
    if (!meal.meals || !meal.meals[userTier]) {
      return (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Info className="text-yellow-500 mr-2 h-5 w-5" />
            <p className="text-yellow-700">
              Meal details for your subscription tier are not available.
            </p>
          </div>
          <p className="mt-2 text-sm text-yellow-600">
            Your subscription tier: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
          </p>
          
          {/* Check if any other tier has meals */}
          {meal.meals && Object.keys(meal.meals).length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> There are meals available for other subscription tiers. 
                You might consider upgrading your subscription to access more meal options.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Check if selected meal type exists
    const mealContent = meal.meals[userTier]?.[selectedMealType];
    
    if (!mealContent || !mealContent.items || mealContent.items.length === 0) {
      // Get available meal types for this tier
      const availableMealTypes = [];
      if (meal.meals[userTier].lunch && meal.meals[userTier].lunch.items?.length > 0) {
        availableMealTypes.push('lunch');
      }
      if (meal.meals[userTier].dinner && meal.meals[userTier].dinner.items?.length > 0) {
        availableMealTypes.push('dinner');
      }
      
      return (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Info className="text-yellow-500 mr-2 h-5 w-5" />
            <p className="text-yellow-700">
              {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} meal is not available for your subscription.
            </p>
          </div>
          
          {availableMealTypes.length > 0 && selectedMealType !== availableMealTypes[0] && (
            <div className="mt-3">
              <p className="text-sm text-yellow-700 mb-2">Available meal options:</p>
              <div className="flex gap-2">
                {availableMealTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                  >
                    View {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="mb-4">
          {renderImages()}
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-lg text-gray-900 mb-2">
            {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Menu
          </h3>
          {renderMealItems(mealContent.items)}
          
          {mealContent.totalCalories > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Total calories: <span className="font-medium">{mealContent.totalCalories} kcal</span>
            </p>
          )}
        </div>
        
        {renderNutritionalInfo()}
        {renderChefSpecial()}
        {renderSundaySpecial()}
        {renderAvailabilityMessage()}
      </div>
    );
  };
const renderSubscriptionBadge = () => {
    // If we have a subscription from Redux or our mock
    const activeSub = subscription || subscriptionMock;
    
    if (!activeSub) {
      return (
        <div className="bg-yellow-100 text-yellow-800 text-sm py-1 px-3 rounded-full">
          No active subscription
        </div>
      );
    }
    
    // Determine the display name for the plan type
    let planDisplayName;
    switch (activeSub.planType) {
      case 'oneDay':
        planDisplayName = 'Daily';
        break;
      case 'tenDays':
        planDisplayName = '10-Day';
        break;
      case 'thirtyDays':
      case 'monthly':
        planDisplayName = 'Monthly';
        break;
      default:
        planDisplayName = activeSub.planType;
    }
    
    return (
      <div className="bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full flex items-center">
        <Utensils className="h-4 w-4 mr-1" />
        {planDisplayName} Plan
      </div>
    );
  }; 
  // Determine if today is Sunday for special messaging
  const isSunday = new Date().getDay() === 0;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeTab === 'today' ? "Today's Meal" : "Tomorrow's Meal"}
        </h1>
        
        <div className="bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full flex items-center">
          <Utensils className="h-4 w-4 mr-1" />
          {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
        </div>
      </div>
      
      {/* Date and Meal Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'today' 
                ? 'text-green-600 border-b-2 border-green-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('today')}
          >
            <div className="flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-2" />
              Today's Meal
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'tomorrow' 
                ? 'text-green-600 border-b-2 border-green-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('tomorrow')}
          >
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 mr-2" />
              Tomorrow's Meal
            </div>
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{getFormattedDate(meal?.date)}</span>
              {new Date().getDay() === 0 && activeTab === 'today' && (
                <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  Sunday
                </span>
              )}
            </div>
            
            <div className="flex border border-gray-200 rounded-md">
              <button
                className={`py-1 px-3 text-sm ${
                  selectedMealType === 'lunch' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMealType('lunch')}
              >
                Lunch
              </button>
              <button
                className={`py-1 px-3 text-sm ${
                  selectedMealType === 'dinner' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMealType('dinner')}
              >
                Dinner
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Meal Details */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        {loading ? renderLoading() : error ? renderError() : renderMealContent()}
      </div>
      
      {/* Delivery Time */}
      {meal && !loading && !error && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Clock className="text-blue-500 h-5 w-5 mr-2" />
            <h3 className="font-medium text-gray-900">Delivery Information</h3>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Your {selectedMealType} will be delivered between{' '}
            <span className="font-medium">
              {selectedMealType === 'lunch' ? '12:00 PM - 1:30 PM' : '7:00 PM - 8:30 PM'}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            You can customize or skip this meal up to 12 hours before delivery time.
          </p>
        </div>
      )}
      
      {/* Restaurant Info */}
      {meal && meal.restaurantId && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">
            Prepared by Restaurant ID: {meal.restaurantId}
          </p>
          {meal.tags && meal.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {meal.tags.map((tag, index) => (
                <span key={index} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
   )}
   </div>)}