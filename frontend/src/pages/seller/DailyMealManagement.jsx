import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChefHat,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Utensils
} from 'lucide-react';

const DailyMealManagement = () => {
  const [todayMeal, setTodayMeal] = useState(null);
  const [tomorrowMeal, setTomorrowMeal] = useState(null);
  const [showDailyMealModal, setShowDailyMealModal] = useState(false);
  const [editingDailyMeal, setEditingDailyMeal] = useState(null);
  const [mealType, setMealType] = useState('today'); // 'today' or 'tomorrow'
  const [loading, setLoading] = useState(false);
  const [canAddMeal, setCanAddMeal] = useState(true);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
  
  // Get auth token (adjust based on your auth implementation)
  const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

  useEffect(() => {
    loadDailyMeals();
  }, []);

  const loadDailyMeals = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Load today's meal
      const todayResponse = await fetch(`${API_BASE_URL}/dailyMeals/today`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (todayResponse.ok) {
        const todayResult = await todayResponse.json();
        setTodayMeal(todayResult.data);
      }

      // Load tomorrow's meal
      const tomorrowResponse = await fetch(`${API_BASE_URL}/dailyMeals/tomorrow`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (tomorrowResponse.ok) {
        const tomorrowResult = await tomorrowResponse.json();
        setTomorrowMeal(tomorrowResult.data);
      }
    } catch (error) {
      console.error('Error loading daily meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyMealSave = async (mealData) => {
    try {
      const targetDate = mealType === 'today' 
        ? new Date().toISOString().split('T')[0]
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const dataToSend = {
        ...mealData,
        date: targetDate
      };

      const endpoint = editingDailyMeal 
        ? `/dailyMeals/${editingDailyMeal._id}`
        :mealType==='today'
        ? '/dailyMeals/today'
        :'/dailyMeals/tomorrow';
      
      const method = editingDailyMeal ? 'PATCH' : 'POST';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setShowDailyMealModal(false);
        setEditingDailyMeal(null);
        loadDailyMeals();
      }
    } catch (error) {
      console.error('Error saving daily meal:', error);
    }
  };

  const handleAddMeal = (type) => {
    setMealType(type);
    setEditingDailyMeal(null);
    setShowDailyMealModal(true);
  };

  const handleEditMeal = (meal, type) => {
    setMealType(type);
    setEditingDailyMeal(meal);
    setShowDailyMealModal(true);
  };

  const MealCard = ({ meal, type, onEdit, onAdd }) => {
    const isToday = type === 'today';
    const date = isToday 
      ? new Date().toLocaleDateString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isToday ? <Sun className="h-4 h-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {isToday ? "Today's Menu" : "Tomorrow's Menu"}
              </h3>
              <span className="text-xs sm:text-sm text-gray-500">({date})</span>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            {meal ? (
              <button
                onClick={() => onEdit(meal, type)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 w-full sm:w-auto"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={() => onAdd(type)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Menu</span>
              </button>
            )}
          </div>
        </div>

        {meal ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Meal Tiers */}
            {['SpecialDiningThali', 'RoyalDiningThali', 'EveryMensThali'].map((tier) => {
              const tierName = tier === 'SpecialDiningThali' ? 'Special Dining' :
                              tier === 'RoyalDiningThali' ? 'Royal Dining' : 'Every Man\'s';
              
              return (
                <div key={tier} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <ChefHat className="h-4 w-4 flex-shrink-0" />
                    {tierName} Thali
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {/* Lunch */}
                    <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun className="h-3 h-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                        <span className="font-medium text-orange-700 text-sm sm:text-base">Lunch</span>
                      </div>
                      <div className="space-y-1">
                        {meal.meals?.[tier]?.lunch?.items?.map((item, idx) => (
                          <div key={idx} className="text-xs sm:text-sm text-gray-700">
                            <span className="font-medium">{item.name}</span>
                            {item.quantity && <span className="text-gray-500"> - {item.quantity}</span>}
                          </div>
                        )) || <span className="text-xs sm:text-sm text-gray-500">No items added</span>}
                      </div>
                    </div>

                    {/* Dinner */}
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-blue-700 text-sm sm:text-base">Dinner</span>
                      </div>
                      <div className="space-y-1">
                        {meal.meals?.[tier]?.dinner?.items?.map((item, idx) => (
                          <div key={idx} className="text-xs sm:text-sm text-gray-700">
                            <span className="font-medium">{item.name}</span>
                            {item.quantity && <span className="text-gray-500"> - {item.quantity}</span>}
                          </div>
                        )) || <span className="text-xs sm:text-sm text-gray-500">No items added</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Utensils className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm sm:text-base">No menu set for {isToday ? 'today' : 'tomorrow'}</p>
            <p className="text-xs sm:text-sm mt-1">Click "Add Menu" to create the daily meal plan</p>
          </div>
        )}
      </div>
    );
  };

  // DailyMealModal component (extracted from Dashboard)
  const DailyMealModal = () => {
    const [formData, setFormData] = useState({
      restaurantId: editingDailyMeal?.restaurantId || "",
      meals: {
        SpecialDiningThali: {
          lunch: {
            items: editingDailyMeal?.meals?.SpecialDiningThali?.lunch?.items || [],
            totalCalories: editingDailyMeal?.meals?.SpecialDiningThali?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.SpecialDiningThali?.dinner?.items || [],
            totalCalories: editingDailyMeal?.meals?.SpecialDiningThali?.dinner?.totalCalories || 0,
          },
        },
        RoyalDiningThali: {
          lunch: {
            items: editingDailyMeal?.meals?.RoyalDiningThali?.lunch?.items || [],
            totalCalories: editingDailyMeal?.meals?.RoyalDiningThali?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.RoyalDiningThali?.dinner?.items || [],
            totalCalories: editingDailyMeal?.meals?.RoyalDiningThali?.dinner?.totalCalories || 0,
          },
        },
        EveryMensThali: {
          lunch: {
            items: editingDailyMeal?.meals?.EveryMensThali?.lunch?.items || [],
            totalCalories: editingDailyMeal?.meals?.EveryMensThali?.lunch?.totalCalories || 0,
          },
          dinner: {
            items: editingDailyMeal?.meals?.EveryMensThali?.dinner?.items || [],
            totalCalories: editingDailyMeal?.meals?.EveryMensThali?.dinner?.totalCalories || 0,
          },
        },
      },
    });

    // New item state for each tier and slot combination
    const [newItems, setNewItems] = useState({
      SpecialDiningThali: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
      RoyalDiningThali: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
      EveryMensThali: {
        lunch: { name: "", description: "", quantity: "" },
        dinner: { name: "", description: "", quantity: "" },
      },
    });

    const addItem = (tier, slot) => {
      const item = newItems[tier][slot];
      if (item.name && item.quantity) {
        setFormData({
          ...formData,
          meals: {
            ...formData.meals,
            [tier]: {
              ...formData.meals[tier],
              [slot]: {
                ...formData.meals[tier][slot],
                items: [...formData.meals[tier][slot].items, { ...item }],
              },
            },
          },
        });
        setNewItems({
          ...newItems,
          [tier]: {
            ...newItems[tier],
            [slot]: { name: "", description: "", quantity: "" },
          },
        });
      }
    };

    const removeItem = (tier, slot, index) => {
      setFormData({
        ...formData,
        meals: {
          ...formData.meals,
          [tier]: {
            ...formData.meals[tier],
            [slot]: {
              ...formData.meals[tier][slot],
              items: formData.meals[tier][slot].items.filter((_, i) => i !== index),
            },
          },
        },
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      await handleDailyMealSave(formData);
    };

    if (!showDailyMealModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {editingDailyMeal
                    ? `Update ${mealType === "today" ? "Today's" : "Tomorrow's"} Meal`
                    : `Add ${mealType === "today" ? "Today's" : "Tomorrow's"} Meal`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Set the menu for {mealType === "today" ? "today" : "tomorrow"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDailyMealModal(false);
                  setEditingDailyMeal(null);
                }}
                className="text-gray-400 hover:text-gray-600 self-end sm:self-center"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
              {/* Meal Tiers */}
              {Object.keys(formData.meals).map((tier) => {
                const tierName = tier === 'SpecialDiningThali' ? 'Special Dining' :
                                tier === 'RoyalDiningThali' ? 'Royal Dining' : 'Every Man\'s';

                return (
                  <div key={tier} className="border border-gray-200 rounded-lg p-3 sm:p-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">{tierName} Thali</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {/* Lunch Section */}
                      <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                        <h4 className="font-medium text-orange-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <Sun className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          Lunch Items
                        </h4>
                        
                        {/* Existing Items */}
                        <div className="space-y-2 mb-3 sm:mb-4">
                          {formData.meals[tier].lunch.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="font-medium text-xs sm:text-sm truncate block">{item.name}</span>
                                {item.quantity && <span className="text-gray-500 text-xs"> - {item.quantity}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(tier, "lunch", index)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add New Item */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={newItems[tier].lunch.name}
                            onChange={(e) =>
                              setNewItems({
                                ...newItems,
                                [tier]: {
                                  ...newItems[tier],
                                  lunch: { ...newItems[tier].lunch, name: e.target.value },
                                },
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Quantity"
                              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={newItems[tier].lunch.quantity}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    lunch: { ...newItems[tier].lunch, quantity: e.target.value },
                                  },
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => addItem(tier, "lunch")}
                              className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex-shrink-0"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dinner Section */}
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                        <h4 className="font-medium text-blue-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <Moon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          Dinner Items
                        </h4>
                        
                        {/* Existing Items */}
                        <div className="space-y-2 mb-3 sm:mb-4">
                          {formData.meals[tier].dinner.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="font-medium text-xs sm:text-sm truncate block">{item.name}</span>
                                {item.quantity && <span className="text-gray-500 text-xs"> - {item.quantity}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(tier, "dinner", index)}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add New Item */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={newItems[tier].dinner.name}
                            onChange={(e) =>
                              setNewItems({
                                ...newItems,
                                [tier]: {
                                  ...newItems[tier],
                                  dinner: { ...newItems[tier].dinner, name: e.target.value },
                                },
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Quantity"
                              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={newItems[tier].dinner.quantity}
                              onChange={(e) =>
                                setNewItems({
                                  ...newItems,
                                  [tier]: {
                                    ...newItems[tier],
                                    dinner: { ...newItems[tier].dinner, quantity: e.target.value },
                                  },
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => addItem(tier, "dinner")}
                              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDailyMealModal(false);
                    setEditingDailyMeal(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Save className="h-4 w-4" />
                  {editingDailyMeal ? "Update Menu" : "Save Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 pb-20 lg:pb-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="truncate">Daily Meal Management</span>
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage today's and tomorrow's meal menus for all tiffin tiers
        </p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-3 sm:mb-4">
        <button
          onClick={loadDailyMeals}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Meal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Meal */}
        <MealCard
          meal={todayMeal}
          type="today"
          onEdit={handleEditMeal}
          onAdd={handleAddMeal}
        />

        {/* Tomorrow's Meal */}
        <MealCard
          meal={tomorrowMeal}
          type="tomorrow"
          onEdit={handleEditMeal}
          onAdd={handleAddMeal}
        />
      </div>

      {/* Modal */}
      <DailyMealModal />
    </div>
  );
};

export default DailyMealManagement;