import React, { useState, useEffect } from "react";
import {
  Users,
  ChefHat,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Settings,
  Eye,
  Clock,
} from "lucide-react";

const AdminMealEdit = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [mealTemplates, setMealTemplates] = useState(null);

  // New state for tier-based meal management
  const [sellerMealPlans, setSellerMealPlans] = useState([]);
  const [showTierEdit, setShowTierEdit] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [currentView, setCurrentView] = useState("subscriptions"); // 'subscriptions' or 'tiers'

  // Shift-based meal management state
  const [showShiftEdit, setShowShiftEdit] = useState(false);
  const [editingShift, setEditingShift] = useState(null); // 'morning' or 'evening'
  const [selectedShift, setSelectedShift] = useState("morning"); // Default shift filter

  // Meal editing states
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealItems, setMealItems] = useState([]);
  const [mealType, setMealType] = useState("lunch");
  const [isAvailable, setIsAvailable] = useState(true);

  // Bulk editing states
  const [bulkMeals, setBulkMeals] = useState({
    low: { items: [], mealType: "lunch", isAvailable: true },
    basic: { items: [], mealType: "lunch", isAvailable: true },
    premium: { items: [], mealType: "lunch", isAvailable: true },
  });

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/admin/meal-edit${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  };

  // Load sellers on component mount
  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const response = await apiCall("/sellers");
      setSellers(response.data || []);
    } catch (error) {
      setError("Failed to load sellers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerSubscriptions = async (sellerId) => {
    try {
      setLoading(true);
      const response = await apiCall(
        `/seller/${sellerId}/subscriptions?status=${statusFilter}`
      );
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      setError("Failed to load subscriptions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMealTemplates = async (sellerId) => {
    try {
      const response = await apiCall(`/seller/${sellerId}/meal-templates`);
      setMealTemplates(response.data);
    } catch (error) {
      console.error("Failed to load meal templates:", error);
    }
  };

  const loadSellerMealPlans = async (sellerId) => {
    try {
      setLoading(true);
      const response = await apiCall(`/seller/${sellerId}/meal-plans`);
      setSellerMealPlans(response.data || []);
    } catch (error) {
      setError("Failed to load seller meal plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerSelect = async (seller) => {
    setSelectedSeller(seller);
    setSelectedSubscription(null);
    setSubscriptions([]);
    setSellerMealPlans([]);
    await loadSellerSubscriptions(seller._id);
    await loadMealTemplates(seller._id);
    await loadSellerMealPlans(seller._id);
  };

  const handleEditMeal = async (subscription) => {
    try {
      setEditingMeal(subscription._id);
      setSelectedSubscription(subscription);

      // Load current meal data
      const response = await apiCall(
        `/subscription/${subscription._id}/today-meal`
      );
      const todayMeal = response.data.subscription.todayMeal;

      if (todayMeal && todayMeal.items) {
        setMealItems(todayMeal.items);
        setMealType(todayMeal.mealType || "lunch");
        setIsAvailable(todayMeal.isAvailable !== false);
      } else {
        // Set default meal from templates if available
        const tier = subscription.mealPlan?.tier || "basic";
        const defaultMeal =
          mealTemplates?.defaultTemplates?.[tier]?.lunch || [];
        setMealItems(defaultMeal);
        setMealType("lunch");
        setIsAvailable(true);
      }
    } catch (error) {
      setError("Failed to load meal data: " + error.message);
    }
  };

  const handleSaveMeal = async () => {
    try {
      setLoading(true);

      await apiCall(`/subscription/${editingMeal}/today-meal`, {
        method: "PUT",
        body: JSON.stringify({
          items: mealItems,
          mealType,
          isAvailable,
        }),
      });

      setSuccess("Meal updated successfully!");
      setEditingMeal(null);

      // Refresh subscriptions
      if (selectedSeller) {
        await loadSellerSubscriptions(selectedSeller._id);
      }
    } catch (error) {
      setError("Failed to save meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSave = async () => {
    try {
      setLoading(true);

      await apiCall(`/seller/${selectedSeller._id}/bulk-update-today-meal`, {
        method: "PUT",
        body: JSON.stringify({
          mealsByTier: bulkMeals,
        }),
      });

      setSuccess("Bulk meal update successful!");
      setShowBulkEdit(false);

      // Refresh subscriptions
      await loadSellerSubscriptions(selectedSeller._id);
    } catch (error) {
      setError("Failed to bulk update meals: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addMealItem = () => {
    setMealItems([
      ...mealItems,
      { name: "", description: "", quantity: "1 serving" },
    ]);
  };

  const updateMealItem = (index, field, value) => {
    const updated = [...mealItems];
    updated[index][field] = value;
    setMealItems(updated);
  };

  const removeMealItem = (index) => {
    setMealItems(mealItems.filter((_, i) => i !== index));
  };

  const addBulkMealItem = (tier) => {
    setBulkMeals({
      ...bulkMeals,
      [tier]: {
        ...bulkMeals[tier],
        items: [
          ...bulkMeals[tier].items,
          { name: "", description: "", quantity: "1 serving" },
        ],
      },
    });
  };

  const updateBulkMealItem = (tier, index, field, value) => {
    const updated = { ...bulkMeals };
    updated[tier].items[index][field] = value;
    setBulkMeals(updated);
  };

  const removeBulkMealItem = (tier, index) => {
    setBulkMeals({
      ...bulkMeals,
      [tier]: {
        ...bulkMeals[tier],
        items: bulkMeals[tier].items.filter((_, i) => i !== index),
      },
    });
  };

  const handleEditTierMeal = (tier) => {
    const tierPlan = sellerMealPlans.find((plan) => plan.tier === tier);

    if (tierPlan) {
      setEditingTier(tier);
      setMealItems(tierPlan.todayMeal.items || []);
      setMealType(tierPlan.todayMeal.mealType || "lunch");
      setIsAvailable(tierPlan.todayMeal.isAvailable !== false);
      setShowTierEdit(true);
    }
  };

  const handleSaveTierMeal = async () => {
    try {
      setLoading(true);

      await apiCall(`/seller/${selectedSeller._id}/tier/${editingTier}/meal`, {
        method: "PUT",
        body: JSON.stringify({
          items: mealItems,
          mealType,
          isAvailable,
        }),
      });

      setSuccess(`Meal updated for all ${editingTier} tier subscriptions!`);
      setShowTierEdit(false);
      setEditingTier(null);

      // Refresh data
      await loadSellerMealPlans(selectedSeller._id);
      if (currentView === "subscriptions") {
        await loadSellerSubscriptions(selectedSeller._id);
      }
    } catch (error) {
      setError("Failed to save tier meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Shift-based meal management functions
  const handleEditShiftMeal = async (tier, shift) => {
    try {
      setEditingTier(tier);
      setEditingShift(shift);

      // Load current shift meal data
      const response = await apiCall(
        `/seller/${selectedSeller._id}/tier/${tier}/shift/${shift}`
      );
      const shiftMeal = response.data.meal;

      setMealItems(shiftMeal.items || []);
      setMealType(
        shiftMeal.mealType || (shift === "morning" ? "lunch" : "dinner")
      );
      setIsAvailable(shiftMeal.isAvailable !== false);
      setShowShiftEdit(true);
    } catch (error) {
      setError("Failed to load shift meal data: " + error.message);
    }
  };

  const handleSaveShiftMeal = async () => {
    try {
      setLoading(true);

      await apiCall(
        `/seller/${selectedSeller._id}/tier/${editingTier}/shift/${editingShift}/meal`,
        {
          method: "PUT",
          body: JSON.stringify({
            items: mealItems,
            mealType,
            isAvailable,
          }),
        }
      );

      setSuccess(
        `${editingShift} shift meal updated for all ${editingTier} tier subscriptions!`
      );
      setShowShiftEdit(false);
      setEditingTier(null);
      setEditingShift(null);

      // Refresh data
      await loadSellerMealPlans(selectedSeller._id);
      if (currentView === "subscriptions") {
        await loadSellerSubscriptions(selectedSeller._id);
      }
    } catch (error) {
      setError("Failed to save shift meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (tier, mealType, templateType = "default") => {
    let template = [];

    if (
      templateType === "default" &&
      mealTemplates?.defaultTemplates?.[tier]?.[mealType]
    ) {
      template = mealTemplates.defaultTemplates[tier][mealType];
    }

    if (editingMeal) {
      setMealItems([...template]);
    } else if (editingTier) {
      setMealItems([...template]);
    } else {
      setBulkMeals({
        ...bulkMeals,
        [tier]: {
          ...bulkMeals[tier],
          items: [...template],
        },
      });
    }
  };

  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !sellers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading meal editing interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Meal Management
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage today's meals for seller subscriptions
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
              <button
                onClick={() => setSuccess("")}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sellers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Sellers ({filteredSellers.length})
                  </h2>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredSellers.map((seller) => (
                  <div
                    key={seller._id}
                    onClick={() => handleSellerSelect(seller)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSeller?._id === seller._id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {seller.name}
                        </h3>
                        <p className="text-sm text-gray-600">{seller.email}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {seller.subscriptionCount} subscriptions
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {seller.mealPlansCount} plans
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          seller.hasActiveSubscriptions
                            ? "bg-green-400"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedSeller ? (
              <div className="space-y-6">
                {/* Seller Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedSeller.name}'s Meal Management
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Manage meals by tier or individual subscriptions
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowBulkEdit(!showBulkEdit)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Bulk Edit
                      </button>
                      <button
                        onClick={() => {
                          if (currentView === "subscriptions") {
                            loadSellerSubscriptions(selectedSeller._id);
                          } else {
                            loadSellerMealPlans(selectedSeller._id);
                          }
                        }}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex space-x-4 border-b">
                    <button
                      onClick={() => setCurrentView("tiers")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        currentView === "tiers"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Package className="w-4 h-4 inline mr-2" />
                      Manage by Tier
                    </button>
                    <button
                      onClick={() => setCurrentView("shifts")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        currentView === "shifts"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Clock className="w-4 h-4 inline mr-2" />
                      Manage by Shift
                    </button>
                    <button
                      onClick={() => setCurrentView("subscriptions")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        currentView === "subscriptions"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Individual Subscriptions
                    </button>
                  </div>
                </div>

                {/* Bulk Edit Panel */}
                {showBulkEdit && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bulk Update Today's Meals
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Set meals for all tiers at once. This will update all
                        active subscriptions.
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {["low", "basic", "premium"].map((tier) => (
                        <div key={tier} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900 capitalize">
                              {tier} Tier
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => loadTemplate(tier, "lunch")}
                                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Load Template
                              </button>
                              <button
                                onClick={() => addBulkMealItem(tier)}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                <Plus className="w-3 h-3 inline mr-1" />
                                Add Item
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {bulkMeals[tier].items.map((item, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-12 gap-3 items-center"
                              >
                                <input
                                  type="text"
                                  placeholder="Item name"
                                  value={item.name}
                                  onChange={(e) =>
                                    updateBulkMealItem(
                                      tier,
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateBulkMealItem(
                                      tier,
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Quantity"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateBulkMealItem(
                                      tier,
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="col-span-3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() =>
                                    removeBulkMealItem(tier, index)
                                  }
                                  className="col-span-1 p-2 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowBulkEdit(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleBulkSave}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          Save All
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier Management View */}
                {currentView === "tiers" && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Manage Meals by Tier
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Each tier affects all subscriptions of that type.
                        Changes apply to all active subscriptions immediately.
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {["low", "basic", "premium"].map((tier) => {
                        const tierPlan = sellerMealPlans.find(
                          (plan) => plan.tier === tier
                        );

                        return (
                          <div key={tier} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-medium text-gray-900 capitalize">
                                  {tier} Tier
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    tier === "low"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : tier === "basic"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {tierPlan?.stats?.activeSubscriptions || 0}{" "}
                                  active subscriptions
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    tierPlan?.todayMeal?.isAvailable
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {tierPlan?.todayMeal?.isAvailable
                                    ? "Available"
                                    : "Not Available"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleEditTierMeal(tier)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit {tier} Meal
                              </button>
                            </div>

                            {tierPlan?.todayMeal?.items?.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                  Current Meal Items:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {tierPlan.todayMeal.items.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="bg-gray-50 p-3 rounded border"
                                      >
                                        <p className="font-medium text-gray-900">
                                          {item.name}
                                        </p>
                                        {item.description && (
                                          <p className="text-sm text-gray-600">
                                            {item.description}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                          {item.quantity}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                  <span>
                                    Meal Type: {tierPlan.todayMeal.mealType}
                                  </span>
                                  <span>
                                    Last Updated:{" "}
                                    {new Date(
                                      tierPlan.todayMeal.lastUpdated
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <Package className="w-8 h-8 mx-auto mb-2" />
                                <p>No meal items set for this tier</p>
                                <button
                                  onClick={() => handleEditTierMeal(tier)}
                                  className="mt-2 text-blue-600 hover:text-blue-800"
                                >
                                  Set meal for {tier} tier
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shift Management View */}
                {currentView === "shifts" && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Shift-based Meal Management
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Manage meals by tier and shift combination
                          </p>
                        </div>
                        <select
                          value={selectedShift}
                          onChange={(e) => setSelectedShift(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="morning">Morning Shift</option>
                          <option value="evening">Evening Shift</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {["low", "basic", "premium"].map((tier) => {
                          console.log(
                            "se;;er meal plan data : ",
                            sellerMealPlans
                          );
                          const tierPlan = sellerMealPlans.find(
                            (plan) => plan.tier === tier
                          );
                          const shiftMeal =
                            tierPlan?.shiftMeals?.[selectedShift];
                          const subscriptionCount =
                            tierPlan?.stats?.activeSubscriptions || 0;

                          return (
                            <div key={tier} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="font-medium text-gray-900 capitalize flex items-center">
                                    <Package className="w-4 h-4 mr-2 text-blue-600" />
                                    {tier} Tier
                                  </h4>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {selectedShift} Shift • {subscriptionCount}{" "}
                                    subscriptions
                                  </p>
                                </div>
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    shiftMeal?.isAvailable
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  }`}
                                />
                              </div>

                              {shiftMeal?.items?.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-medium text-gray-600 mb-2">
                                    Current Meals:
                                  </p>
                                  <div className="space-y-1">
                                    {shiftMeal.items
                                      .slice(0, 3)
                                      .map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="text-xs text-gray-700 flex items-center"
                                        >
                                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                                          {item.name}
                                        </div>
                                      ))}
                                    {shiftMeal.items.length > 3 && (
                                      <div className="text-xs text-gray-500">
                                        +{shiftMeal.items.length - 3} more items
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleEditShiftMeal(tier, selectedShift)
                                  }
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                  <Edit3 className="w-3 h-3 inline mr-1" />
                                  Edit Meal
                                </button>
                              </div>

                              {!shiftMeal?.isAvailable && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                  ⚠️ Meal not available
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscriptions List */}
                {currentView === "subscriptions" && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Subscriptions ({subscriptions.length})
                        </h3>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="all">All</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y">
                      {subscriptions.map((subscription) => (
                        <div key={subscription._id} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-gray-900">
                                  {subscription.user?.name || "Unknown User"}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    subscription.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {subscription.status}
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {subscription.mealPlan?.tier || "basic"}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 mt-1">
                                {subscription.user?.email} •{" "}
                                {subscription.mealPlan?.title}
                              </p>

                              <div className="mt-2 flex items-center space-x-4">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {subscription.shift} shift
                                </span>
                                <span
                                  className={`text-xs flex items-center ${
                                    subscription.todayMealStatus === "available"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  {subscription.todayMealStatus === "available"
                                    ? "Meal Set"
                                    : "No Meal"}
                                </span>
                              </div>

                              {subscription.todayMealItems?.length > 0 && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <strong>Today's items:</strong>{" "}
                                  {subscription.todayMealItems
                                    .slice(0, 3)
                                    .map((item) => item.name)
                                    .join(", ")}
                                  {subscription.todayMealItems.length > 3 &&
                                    ` +${
                                      subscription.todayMealItems.length - 3
                                    } more`}
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditMeal(subscription)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit today's meal"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <ChefHat className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Seller
                </h3>
                <p className="text-gray-600">
                  Choose a seller from the list to manage their subscription
                  meals
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Meal Edit Modal */}
        {editingMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit Today's Meal
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSubscription?.user?.name} •{" "}
                      {selectedSubscription?.mealPlan?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingMeal(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meal Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Type
                    </label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={isAvailable}
                          onChange={() => setIsAvailable(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Available
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!isAvailable}
                          onChange={() => setIsAvailable(false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Not Available
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Template Actions */}
                {mealTemplates && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Quick Templates:
                    </span>
                    {["low", "basic", "premium"].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => loadTemplate(tier, mealType)}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 capitalize"
                      >
                        {tier} {mealType}
                      </button>
                    ))}
                  </div>
                )}

                {/* Meal Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Meal Items
                    </label>
                    <button
                      onClick={addMealItem}
                      className="flex items-center text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mealItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Item name (required)"
                          value={item.name}
                          onChange={(e) =>
                            updateMealItem(index, "name", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={item.description}
                          onChange={(e) =>
                            updateMealItem(index, "description", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) =>
                            updateMealItem(index, "quantity", e.target.value)
                          }
                          className="col-span-3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeMealItem(index)}
                          className="col-span-1 p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {mealItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>No meal items added yet</p>
                        <button
                          onClick={addMealItem}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Add your first meal item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMeal}
                  disabled={loading || mealItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {loading ? "Saving..." : "Save Meal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tier Edit Modal */}
        {showTierEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit {editingTier} Tier Meal
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      This will update all {editingTier} tier subscriptions for{" "}
                      {selectedSeller?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTierEdit(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meal Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Type
                    </label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={isAvailable}
                          onChange={() => setIsAvailable(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Available
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!isAvailable}
                          onChange={() => setIsAvailable(false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Not Available
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Template Actions */}
                {mealTemplates && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Quick Templates:
                    </span>
                    <button
                      onClick={() => loadTemplate(editingTier, mealType)}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 capitalize"
                    >
                      {editingTier} {mealType}
                    </button>
                  </div>
                )}

                {/* Meal Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Meal Items
                    </label>
                    <button
                      onClick={addMealItem}
                      className="flex items-center text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mealItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Item name (required)"
                          value={item.name}
                          onChange={(e) =>
                            updateMealItem(index, "name", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={item.description}
                          onChange={(e) =>
                            updateMealItem(index, "description", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) =>
                            updateMealItem(index, "quantity", e.target.value)
                          }
                          className="col-span-3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeMealItem(index)}
                          className="col-span-1 p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {mealItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>No meal items added yet</p>
                        <button
                          onClick={addMealItem}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Add your first meal item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowTierEdit(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTierMeal}
                  disabled={loading || mealItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {loading ? "Saving..." : `Save ${editingTier} Tier Meal`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shift Edit Modal */}
        {showShiftEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit {editingTier} Tier • {editingShift} Shift Meal
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      This will update all {editingTier} tier {editingShift}{" "}
                      shift subscriptions for {selectedSeller?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShiftEdit(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meal Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Type
                    </label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={isAvailable}
                          onChange={() => setIsAvailable(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Available
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!isAvailable}
                          onChange={() => setIsAvailable(false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Not Available
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Template Actions */}
                {mealTemplates && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Quick Templates:
                    </span>
                    <button
                      onClick={() => loadTemplate(editingTier, mealType)}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 capitalize"
                    >
                      {editingTier} {editingShift} {mealType}
                    </button>
                  </div>
                )}

                {/* Meal Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Meal Items
                    </label>
                    <button
                      onClick={addMealItem}
                      className="flex items-center text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mealItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Item name (required)"
                          value={item.name}
                          onChange={(e) =>
                            updateMealItem(index, "name", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={item.description}
                          onChange={(e) =>
                            updateMealItem(index, "description", e.target.value)
                          }
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) =>
                            updateMealItem(index, "quantity", e.target.value)
                          }
                          className="col-span-3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeMealItem(index)}
                          className="col-span-1 p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {mealItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>No meal items added yet</p>
                        <button
                          onClick={addMealItem}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Add your first meal item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowShiftEdit(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShiftMeal}
                  disabled={loading || mealItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {loading
                    ? "Saving..."
                    : `Save ${editingTier} ${editingShift} Meal`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMealEdit;
