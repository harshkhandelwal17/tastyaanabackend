// src/pages/WeeklyMenuPage.js
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Star,
  ChefHat,
  Utensils,
  Heart,
  Sun,
  Moon,
  Info,
  ArrowLeft,
  ArrowRight,
  Filter,
  Search,
  Zap,
  Award,
  Leaf,
} from "lucide-react";

// Redux API hooks
import {
  useGetWeeklyMenuQuery,
  useGetTodaysMealQuery,
  useGetDailyMealQuery,
} from "../../redux/storee/api";
import addToCartAPI from "../../redux/cartSlice";

// Redux actions
// import {
//   addToCart,
//   openCart,
//   addToast,
//   openLoginModal,
// } from "../store/Slices/uiSlice";

export default function WeeklyMenuPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  // Local state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTier, setSelectedTier] = useState("basic");
  const [viewMode, setViewMode] = useState("week"); // 'week' or 'day'
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // API calls
  const {
    data: weeklyMenuData,
    isLoading: weeklyMenuLoading,
    error: weeklyMenuError,
    refetch: refetchWeeklyMenu,
  } = useGetWeeklyMenuQuery({
    startDate: getWeekStartDate(currentWeekOffset).toISOString().split("T")[0],
  });

  const { data: todaysMealData, isLoading: todaysMealLoading } =
    useGetTodaysMealQuery();

  // Helper functions
  function getWeekStartDate(offset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + offset * 7;
    const startDate = new Date(today.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  }

  function isSunday(date) {
    return new Date(date).getDay() === 0;
  }

  // Tier configuration
  const tiers = [
    {
      id: "low",
      name: "Low Cost",
      color: "green",
      price: "₹80",
      description: "Budget-friendly homestyle meals",
    },
    {
      id: "basic",
      name: "Basic",
      color: "blue",
      price: "₹120",
      description: "Perfect balance of taste and value",
    },
    {
      id: "premium",
      name: "Premium",
      color: "purple",
      price: "₹180",
      description: "Gourmet ingredients and presentation",
    },
  ];

  const getTierStyles = (tier) => {
    const styles = {
      green: "bg-green-50 border-green-200 text-green-800",
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
    };
    return styles[tier] || styles.blue;
  };

  // Handle quick order
  const handleQuickOrder = (meal, date, slot) => {
    if (!isAuthenticated) {
      // dispatch(openLoginModal());
      navigate("/login");
      return;
    }
    const tierData = tiers.find((t) => t.id === selectedTier);
    dispatch(
      addToCartAPI({
        date: date,
        slot: slot,
        tier: selectedTier,
        items: meal.items,
        price: meal.price,
        quantity: 1,
        category: "daily-meal",
      })
    );

    // dispatch(openCart());

    //   addToast({
    //     type: "success",
    //     title: "Added to Cart",
    //     message: `${tierData.name} ${slot} meal added to cart`,
    //   }).
    toast.success(`${tierData.name} ${slot} meal added to cart`);
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Plus_Jakarta_Sans']">
      {/* Header */}
      {/* <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                Weekly Menu
              </h1>
              <p className="mt-2 text-gray-600">
                Discover fresh, homestyle meals planned for each day of the week
              </p>
            </div>

            {/* Quick actions */}
      {/* <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Link
                to="/meal-plans"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Subscribe to Plans
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Week navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousWeek}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Week of{" "}
                  {getWeekStartDate(currentWeekOffset).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h2>
                {currentWeekOffset === 0 && (
                  <span className="text-sm text-orange-600 font-medium">
                    Current Week
                  </span>
                )}
              </div>

              <button
                onClick={goToNextWeek}
                disabled={currentWeekOffset >= 2}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-5 w-5" />
              </button>

              {currentWeekOffset !== 0 && (
                <button
                  onClick={goToCurrentWeek}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Back to Current Week
                </button>
              )}
            </div>

            {/* Tier selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Plan:</span>
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTier === tier.id
                      ? getTierStyles(tier.color) + " border"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Highlight */}
        {todaysMealData && currentWeekOffset === 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center">
                  <Zap className="h-6 w-6 mr-2" />
                  Today's Special Menu
                </h3>
                <p className="text-orange-100">{formatDate(new Date())}</p>
              </div>
              <Award className="h-12 w-12 text-orange-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Lunch */}
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Sun className="h-5 w-5 mr-2" />
                  Lunch - ₹{todaysMealData.data.meals[selectedTier].lunch.price}
                </h4>
                <div className="text-sm text-orange-100">
                  {todaysMealData.data.meals[selectedTier].lunch.items.map(
                    (item, idx) => (
                      <span key={idx}>
                        {item.name}
                        {idx <
                        todaysMealData.data.meals[selectedTier].lunch.items
                          .length -
                          1
                          ? " • "
                          : ""}
                      </span>
                    )
                  )}
                </div>
                <div className="mt-2 text-xs text-orange-200">
                  {todaysMealData.data.meals[selectedTier].lunch.totalCalories}{" "}
                  calories
                </div>
              </div>

              {/* Today's Dinner */}
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Moon className="h-5 w-5 mr-2" />
                  Dinner - ₹
                  {todaysMealData.data.meals[selectedTier].dinner.price}
                </h4>
                <div className="text-sm text-orange-100">
                  {todaysMealData.data.meals[selectedTier].dinner.items.map(
                    (item, idx) => (
                      <span key={idx}>
                        {item.name}
                        {idx <
                        todaysMealData.data.meals[selectedTier].dinner.items
                          .length -
                          1
                          ? " • "
                          : ""}
                      </span>
                    )
                  )}
                </div>
                <div className="mt-2 text-xs text-orange-200">
                  {todaysMealData.data.meals[selectedTier].dinner.totalCalories}{" "}
                  calories
                </div>
              </div>
            </div>

            {/* Sunday Special Alert */}
            {todaysMealData.data.sundaySpecial?.isSpecialDay && (
              <div className="mt-4 bg-yellow-400/20 rounded-lg p-3 border border-yellow-300/30">
                <p className="text-sm font-medium">
                  🎉 Sunday Special Available! Extra items and treats for today.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Weekly Menu Grid */}
        {weeklyMenuLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : weeklyMenuError ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Weekly Menu
            </h3>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the menu. Please try again.
            </p>
            <button
              onClick={() => refetchWeeklyMenu()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {weeklyMenuData?.data?.weeklyMeals?.map((dayMeal, index) => {
              const date = dayMeal.date;
              const isCurrentDay = isToday(date);
              const isSundaySpecial = isSunday(date);
              const tierMeal = dayMeal.meals?.[selectedTier];

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    isCurrentDay ? "ring-2 ring-orange-500" : ""
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-4 text-center ${
                      isCurrentDay
                        ? "bg-orange-500 text-white"
                        : isSundaySpecial
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="font-semibold">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-sm">
                      {new Date(date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    {isCurrentDay && <div className="text-xs mt-1">Today</div>}
                    {isSundaySpecial && (
                      <div className="text-xs mt-1">Special Day</div>
                    )}
                  </div>

                  {/* Meals */}
                  <div className="p-4">
                    {dayMeal.isPlaceholder ? (
                      <div className="text-center py-8 text-gray-500">
                        <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Menu coming soon</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Lunch */}
                        {tierMeal?.lunch && (
                          <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm flex items-center text-yellow-800">
                                <Sun className="h-4 w-4 mr-1" />
                                Lunch
                              </h4>
                              <span className="text-xs font-semibold text-yellow-700">
                                ₹{tierMeal.lunch.price}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 mb-2">
                              {tierMeal.lunch.items
                                ?.slice(0, 3)
                                .map((item, idx) => (
                                  <span key={idx}>
                                    {item.name}
                                    {idx <
                                    Math.min(tierMeal.lunch.items.length, 3) - 1
                                      ? " • "
                                      : ""}
                                  </span>
                                ))}
                              {tierMeal.lunch.items?.length > 3 && "..."}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {tierMeal.lunch.totalCalories} cal
                              </span>
                              <button
                                onClick={() =>
                                  handleQuickOrder(
                                    tierMeal.lunch,
                                    date,
                                    "lunch"
                                  )
                                }
                                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dinner */}
                        {tierMeal?.dinner && (
                          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm flex items-center text-blue-800">
                                <Moon className="h-4 w-4 mr-1" />
                                Dinner
                              </h4>
                              <span className="text-xs font-semibold text-blue-700">
                                ₹{tierMeal.dinner.price}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 mb-2">
                              {tierMeal.dinner.items
                                ?.slice(0, 3)
                                .map((item, idx) => (
                                  <span key={idx}>
                                    {item.name}
                                    {idx <
                                    Math.min(tierMeal.dinner.items.length, 3) -
                                      1
                                      ? " • "
                                      : ""}
                                  </span>
                                ))}
                              {tierMeal.dinner.items?.length > 3 && "..."}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {tierMeal.dinner.totalCalories} cal
                              </span>
                              <button
                                onClick={() =>
                                  handleQuickOrder(
                                    tierMeal.dinner,
                                    date,
                                    "dinner"
                                  )
                                }
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Sunday Special Items */}
                        {dayMeal.sundaySpecial?.isSpecialDay &&
                          dayMeal.sundaySpecial?.specialItems?.length > 0 && (
                            <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                              <h4 className="font-medium text-sm text-purple-800 mb-2">
                                🎉 Sunday Special
                              </h4>
                              <div className="space-y-1">
                                {dayMeal.sundaySpecial.specialItems
                                  .slice(0, 2)
                                  .map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-xs"
                                    >
                                      <span className="text-gray-700">
                                        {item.name}
                                      </span>
                                      <span className="text-purple-600 font-semibold">
                                        ₹{item.price}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delivery Times
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Lunch:</span>
                <span>12:00 PM - 2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Dinner:</span>
                <span>7:00 PM - 9:00 PM</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Leaf className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Fresh Ingredients
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              All meals are prepared with fresh, locally sourced ingredients and
              cooked daily in our hygienic kitchens.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Made with Love
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Every dish is prepared with traditional recipes and the same care
              you'd find in a loving home kitchen.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Start Your Food Journey?
          </h3>
          <p className="text-lg mb-6 text-orange-100">
            Subscribe to our meal plans and enjoy fresh, homestyle food
            delivered daily to your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/meal-plans"
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Choose Your Plan
            </Link>
            <Link
              to="/custom-request"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Custom Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
