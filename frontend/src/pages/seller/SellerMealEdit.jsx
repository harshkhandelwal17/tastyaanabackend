import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetMealAvailabilityQuery,
  useUpdateMealAvailabilityMutation,
} from "../../redux/storee/api";
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
  Sun,
  Moon,
  Ban,
  CheckCircle2,
  Utensils,
  Truck,
  Layers,
  User,
} from "lucide-react";

const SellerMealEdit = () => {
  const navigate = useNavigate();

  // ID generator for meal items to prevent focus loss
  const generateItemId = () =>
    `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Separate component for the entire meal items form to prevent re-renders
  const MealItemsForm = React.memo(
    ({
      mealItems,
      mealType,
      isAvailable,
      onMealItemsChange,
      onMealTypeChange,
      onAvailabilityChange,
      onAddItem,
      onUpdateItem,
      onRemoveItem,
    }) => {
      return (
        <div className="space-y-6">
          {/* Meal Type and Availability */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => onMealTypeChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => onAvailabilityChange(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Meal Available
                </span>
              </label>
            </div>
          </div>

          {/* Meal Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-700">Meal Items</h4>
              <button
                type="button"
                onClick={onAddItem}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {mealItems.map((item, index) => (
                <MealItemRow
                  key={item.id || `item-${index}`} // Use stable key
                  item={item}
                  index={index}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                />
              ))}

              {mealItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No meal items added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  );

  // Memoized meal item component to prevent unnecessary re-renders
  // Isolated meal item row that updates parent only on blur
  const MealItemRow = ({ item, index, onUpdate, onRemove }) => {
    const [localName, setLocalName] = useState(item.name || "");
    const [localQuantity, setLocalQuantity] = useState(item.quantity || "");

    // Update local state when item prop changes (for external updates)
    useEffect(() => {
      setLocalName(item.name || "");
      setLocalQuantity(item.quantity || "");
    }, [item.name, item.quantity]);

    const handleNameBlur = () => {
      if (localName !== item.name) {
        onUpdate(index, "name", localName);
      }
    };

    const handleQuantityBlur = () => {
      if (localQuantity !== item.quantity) {
        onUpdate(index, "quantity", localQuantity);
      }
    };

    return (
      <div className="flex gap-3 items-center p-3 border rounded-lg">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Item name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            className="w-full border rounded px-2 py-1 text-sm"
            autoComplete="off"
          />
        </div>
        <div className="w-20">
          <input
            type="text"
            placeholder="Qty"
            value={localQuantity}
            onChange={(e) => setLocalQuantity(e.target.value)}
            onBlur={handleQuantityBlur}
            className="w-full border rounded px-2 py-1 text-sm"
            autoComplete="off"
          />
        </div>
        <div className="w-20">
          <select
            value={item.unit || "piece"}
            onChange={(e) => onUpdate(index, "unit", e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="piece">piece</option>
            <option value="cup">cup</option>
            <option value="bowl">bowl</option>
            <option value="plate">plate</option>
            <option value="serving">serving</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [mealTemplates, setMealTemplates] = useState(null);

  // New state for tier-based meal management
  const [sellerMealPlans, setSellerMealPlans] = useState([]);
  const [showTierEdit, setShowTierEdit] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [currentView, setCurrentView] = useState("subscriptions"); // 'subscriptions' or 'tiers'
  const [expandedMealPlan, setExpandedMealPlan] = useState(null); // For showing subscriptions in meal plan view

  // Shift-based meal management state
  const [showShiftEdit, setShowShiftEdit] = useState(false);
  const [editingShift, setEditingShift] = useState(null); // 'morning' or 'evening'
  const [selectedShift, setSelectedShift] = useState("morning"); // Default shift filter

  // Meal editing states
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealItems, setMealItems] = useState([]);
  const [mealType, setMealType] = useState("lunch");
  const [isAvailable, setIsAvailable] = useState(true);

  // Individual user meal editing states
  const [showUserMealEdit, setShowUserMealEdit] = useState(false);
  const [editingUserMeal, setEditingUserMeal] = useState(null);

  // No meal today states
  const [noMealToday, setNoMealToday] = useState({
    morning: false,
    evening: false,
    reasons: {
      morning: "",
      evening: "",
    },
  });
  const [showNoMealModal, setShowNoMealModal] = useState(false);
  const [selectedNoMealShift, setSelectedNoMealShift] = useState("morning");

  // Meal availability API hooks
  const { data: mealAvailabilityData, refetch: refetchMealAvailability } =
    useGetMealAvailabilityQuery();

  const [updateMealAvailability] = useUpdateMealAvailabilityMutation();

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
  const authToken =
    localStorage.getItem("authToken") || localStorage.getItem("token");

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    console.log("=== API CALL DEBUG ===");
    console.log("Endpoint:", endpoint);
    console.log("Full URL:", `${API_BASE_URL}/seller/meal-edit${endpoint}`);
    console.log("Auth token:", authToken ? "Present" : "Missing");
    console.log("Options:", options);

    const response = await fetch(
      `${API_BASE_URL}/seller/meal-edit${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...options.headers,
        },
        ...options,
      }
    );

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      console.error("API call failed:", data);
      throw new Error(data.message || "API request failed");
    }

    return data;
  };

  useEffect(() => {
    console.log("=== COMPONENT INITIALIZATION DEBUG ===");
    console.log("Auth token from localStorage:", {
      authToken: localStorage.getItem("authToken"),
      token: localStorage.getItem("token"),
      actualAuthToken: authToken,
    });
    console.log("API_BASE_URL:", API_BASE_URL);

    // Add test function to global scope for debugging
    window.testMealUpdate = async (subscriptionId) => {
      try {
        const testData = {
          items: [{ name: "Test Meal", quantity: "1", unit: "piece" }],
          mealType: "lunch",
          isAvailable: true,
        };

        console.log("Testing meal update for subscription:", subscriptionId);
        console.log("Test data:", testData);

        const response = await fetch(
          `${API_BASE_URL}/seller/meal-edit/subscription/${subscriptionId}/today-meal`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(testData),
          }
        );

        console.log("Response status:", response.status);
        const result = await response.json();
        console.log("Response result:", result);

        return result;
      } catch (error) {
        console.error("Test error:", error);
        throw error;
      }
    };

    loadSellerData();
    checkNoMealStatus();
  }, []);

  // Sync local state with meal availability data
  useEffect(() => {
    if (mealAvailabilityData?.data?.mealAvailability) {
      const availability = mealAvailabilityData.data.mealAvailability;
      setNoMealToday({
        morning: !availability.shifts?.morning?.isAvailable || false,
        evening: !availability.shifts?.evening?.isAvailable || false,
        reasons: {
          morning: availability.shifts?.morning?.reason || "",
          evening: availability.shifts?.evening?.reason || "",
        },
      });
    }
  }, [mealAvailabilityData]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("=== LOAD SELLER DATA DEBUG ===");
      console.log("Starting to load seller data...");
      console.log("Auth token being used:", authToken);

      // Load seller meal dashboard data
      const dashboardResponse = await fetch(
        `${API_BASE_URL}/seller/meal-edit/dashboard`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      console.log("Dashboard response status:", dashboardResponse.status);
      console.log("Dashboard response ok:", dashboardResponse.ok);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log("Dashboard data received:", dashboardData);
        setSubscriptions(dashboardData.data.subscriptions || []);
        setMealTemplates(dashboardData.data.mealTemplates || null);
        setSellerMealPlans(dashboardData.data.mealPlans || []);
      }
    } catch (error) {
      console.error("Error loading seller data:", error);
      setError("Failed to load seller data");
    } finally {
      setLoading(false);
    }
  };

  const checkNoMealStatus = async () => {
    try {
      // Use the new meal availability API
      const result = await refetchMealAvailability();

      if (result.data?.data?.mealAvailability) {
        const availability = result.data.data.mealAvailability;
        setNoMealToday({
          morning: !availability.shifts?.morning?.isAvailable || false,
          evening: !availability.shifts?.evening?.isAvailable || false,
          reasons: {
            morning: availability.shifts?.morning?.reason || "",
            evening: availability.shifts?.evening?.reason || "",
          },
        });
      }
    } catch (error) {
      console.error("Error checking meal availability status:", error);
    }
  };

  const handleNoMealToggle = async (shift, enabled, reason = "") => {
    try {
      setLoading(true);

      // Use the new meal availability API
      const updateData = {
        shift,
        isAvailable: !enabled, // enabled means "no meal", so isAvailable is opposite
        status: enabled ? "temporarily_off" : "available",
        reason: enabled ? reason : null,
      };

      await updateMealAvailability(updateData).unwrap();

      // Update local state
      setNoMealToday((prev) => ({
        ...prev,
        [shift]: enabled,
        reasons: { ...prev.reasons, [shift]: enabled ? reason : "" },
      }));

      setSuccess(
        enabled
          ? `No meal marked for ${shift} shift`
          : `No meal removed for ${shift} shift`
      );
    } catch (error) {
      console.error("Error updating meal availability:", error);
      setError("Failed to update meal status");
    } finally {
      setLoading(false);
      setShowNoMealModal(false);
    }
  };

  // Helper function to get current shift based on time
  const getCurrentShift = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Morning shift: 6 AM to 2 PM
    // Evening shift: 2 PM to 10 PM
    if (currentHour >= 6 && currentHour < 14) {
      return "morning";
    } else {
      return "evening";
    }
  };

  // Tier-based meal editing functions
  const handleEditTierMeal = async (tier, shift = null) => {
    try {
      console.log(`=== TIER MEAL EDIT DEBUG ===`);
      console.log(`Editing tier: ${tier}, shift: ${shift}`);

      setLoading(true);
      setEditingTier(tier);

      // Determine current shift if not provided
      const currentShift = shift || getCurrentShift();
      setEditingShift(currentShift);

      // Build the correct endpoint for tier-based meal editing
      const endpoint = `/tier/${tier}/shift/${currentShift}`;
      console.log(`Using endpoint: ${endpoint}`);

      const response = await apiCall(endpoint);
      console.log("Tier meal data response:", response);

      if (response.success && response.data) {
        // If there's todayMeal data, use it; otherwise initialize empty
        if (response.data.todayMeal) {
          const itemsWithIds = (response.data.todayMeal.items || []).map(
            (item, index) => ({
              ...item,
              id:
                item.id ||
                `tier_${Date.now()}_${index}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`, // Ensure each item has a truly unique ID
            })
          );
          setMealItems(itemsWithIds);
          setMealType(response.data.todayMeal.mealType || "lunch");
          setIsAvailable(response.data.todayMeal.isAvailable !== false);
        } else {
          // Initialize with empty data
          setMealItems([]);
          setMealType("lunch");
          setIsAvailable(true);
        }

        console.log("Meal items set:", response.data.todayMeal?.items || []);
      } else {
        console.log("No data in response, initializing empty");
        setMealItems([]);
        setMealType("lunch");
        setIsAvailable(true);
      }

      setShowTierEdit(true);
      console.log("Tier edit modal should now be visible");
    } catch (error) {
      console.error("Failed to load tier meal:", error);
      console.error("Error details:", error.stack);
      setError("Failed to load tier meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTierMeal = async () => {
    try {
      console.log("=== TIER MEAL SAVE CLICKED ===");
      console.log("editingTier:", editingTier);
      console.log("editingShift:", editingShift);
      console.log("This is TIER editing, not individual subscription editing");

      setLoading(true);

      // Use the correct endpoint structure with /meal suffix
      const endpoint = `/tier/${editingTier}/shift/${editingShift}/meal`;
      console.log("Tier save endpoint:", endpoint);

      await apiCall(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          items: mealItems,
          mealType,
          isAvailable,
        }),
      });

      const shiftText = editingShift ? ` (${editingShift} shift)` : "";
      setSuccess(
        `Meal updated for all ${editingTier} tier subscriptions${shiftText}!`
      );
      setShowTierEdit(false);
      setEditingTier(null);
      setEditingShift(null);

      // Refresh data
      await loadSellerData();
    } catch (error) {
      setError("Failed to save tier meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Individual user meal editing functions
  const handleEditUserMeal = async (subscription) => {
    try {
      console.log("=== INDIVIDUAL USER MEAL EDIT CLICKED ===");
      console.log("Subscription for individual edit:", subscription);
      console.log("Subscription ID:", subscription._id);

      setLoading(true);
      setEditingUserMeal(subscription);

      console.log("Loading individual meal data...");
      // Load current meal data for this subscription
      const response = await apiCall(
        `/subscription/${subscription._id}/today-meal`
      );
      console.log("Individual meal response:", response);

      const todayMeal = response.data.subscription.todayMeal;

      if (todayMeal && todayMeal.items) {
        const itemsWithIds = todayMeal.items.map((item, index) => ({
          ...item,
          id:
            item.id ||
            `user_${Date.now()}_${index}_${Math.random()
              .toString(36)
              .substr(2, 9)}`, // Ensure each item has a truly unique ID
        }));
        setMealItems(itemsWithIds);
        setMealType(todayMeal.mealType || "lunch");
        setIsAvailable(todayMeal.isAvailable !== false);
      } else {
        // Set default meal from templates if available
        const tier = subscription.mealPlan?.tier || "basic";
        const defaultMeal = (
          mealTemplates?.defaultTemplates?.[tier]?.lunch || []
        ).map((item, index) => ({
          ...item,
          id: generateItemId(), // Add ID to default items
        }));
        setMealItems(defaultMeal);
        setMealType("lunch");
        setIsAvailable(true);
      }

      setShowUserMealEdit(true);
      console.log("Individual meal edit modal should now be shown");
    } catch (error) {
      console.error("Error in handleEditUserMeal:", error);
      setError("Failed to load user meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserMeal = async () => {
    try {
      console.log("=== INDIVIDUAL USER MEAL SAVE CLICKED ===");
      console.log("editingUserMeal:", editingUserMeal);
      console.log(
        "Is this really individual save? editingUserMeal exists:",
        !!editingUserMeal
      );

      setLoading(true);
      setError("");

      console.log("=== FRONTEND MEAL UPDATE DEBUG ===");
      console.log("Editing user meal:", editingUserMeal);
      console.log("Current meal items:", mealItems);
      console.log("Current meal type:", mealType);
      console.log("Current isAvailable:", isAvailable);

      const updateData = {
        items: mealItems,
        mealType,
        isAvailable,
      };

      console.log("Update data being sent:", updateData);
      console.log("Subscription ID:", editingUserMeal._id);
      console.log(
        "API URL will be:",
        `${API_BASE_URL}/seller/meal-edit/subscription/${editingUserMeal._id}/today-meal`
      );

      const response = await apiCall(
        `/subscription/${editingUserMeal._id}/today-meal`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Update response received:", response);

      if (!response.success) {
        throw new Error(response.message || "Update failed");
      }

      setSuccess(`Meal updated for ${editingUserMeal.user?.name}!`);
      setShowUserMealEdit(false);
      setEditingUserMeal(null);

      // Refresh subscriptions
      await loadSellerData();
    } catch (error) {
      console.error("ERROR in handleSaveUserMeal:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      setError("Failed to save user meal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Meal item management functions
  const addMealItem = () => {
    setMealItems((prev) => [
      ...prev,
      {
        id: generateItemId(), // Add unique ID to prevent focus loss
        name: "",
        quantity: "1",
        unit: "piece",
      },
    ]);
  };

  const updateMealItem = (index, field, value) => {
    setMealItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeMealItem = (index) => {
    setMealItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to get subscriptions for a specific meal plan
  const getSubscriptionsForMealPlan = (mealPlanId) => {
    return subscriptions.filter((sub) => sub.mealPlan?._id === mealPlanId);
  };

  // Function to toggle tier expansion and show its subscriptions
  const handleToggleTierSubscriptions = (tier) => {
    console.log(`Toggling subscriptions for tier: ${tier}`);
    setExpandedTier(expandedTier === tier ? null : tier);
  };

  // Function to toggle meal plan expansion and show its subscriptions
  const handleToggleMealPlanSubscriptions = (mealPlanId) => {
    setExpandedMealPlan(expandedMealPlan === mealPlanId ? null : mealPlanId);
  };

  const loadTemplate = (tier, mealType, templateType = "default") => {
    let template = [];

    if (
      templateType === "default" &&
      mealTemplates?.defaultTemplates?.[tier]?.[mealType]
    ) {
      template = mealTemplates.defaultTemplates[tier][mealType];
    }

    const templateWithIds = [...template].map((item, index) => ({
      ...item,
      id: generateItemId(), // Add ID to template items
    }));
    setMealItems(templateWithIds);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const NoMealModal = () => {
    const [reason, setReason] = useState(
      noMealToday.reasons[selectedNoMealShift] || ""
    );
    const [isEnabled, setIsEnabled] = useState(
      noMealToday[selectedNoMealShift]
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {selectedNoMealShift === "morning" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              {selectedNoMealShift === "morning" ? "Morning" : "Evening"} Shift
              - No Meal Today
            </h3>
            <button
              onClick={() => setShowNoMealModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>
                  Mark "No Meal Today" for {selectedNoMealShift} shift
                </span>
              </label>
            </div>

            {isEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for no meal today..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows="3"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  handleNoMealToggle(selectedNoMealShift, isEnabled, reason)
                }
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
              <button
                onClick={() => setShowNoMealModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Meal Edit Modal Component
  const MealEditModal = ({ title, onSave, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Meal Type and Availability */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Meal Available
                </span>
              </label>
            </div>
          </div>

          {/* Load Template Section */}
          {mealTemplates && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Quick Load Templates
              </h4>
              <div className="flex flex-wrap gap-2">
                {["low", "basic", "premium"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => loadTemplate(tier, mealType)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Load {tier.charAt(0).toUpperCase() + tier.slice(1)} Template
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-700">Meal Items</h4>
              <button
                onClick={addMealItem}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {mealItems.map((item, index) => (
                <MealItemRow
                  key={index} // Use index as key for simplicity
                  item={item}
                  index={index}
                  onUpdate={updateMealItem}
                  onRemove={removeMealItem}
                />
              ))}

              {mealItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No meal items added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Meal
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ChefHat className="h-7 w-7 text-orange-500" />
                Meal Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your daily meals and subscriptions
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/seller/meal-edit/daily-orders")}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Daily Orders
              </button>

              <button
                onClick={() => {
                  setCurrentView(
                    currentView === "subscriptions" ? "tiers" : "subscriptions"
                  );
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {currentView === "subscriptions"
                  ? "View Meal Plans"
                  : "View Subscriptions"}
              </button>

              <button
                onClick={loadSellerData}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* No Meal Today Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            No Meal Today Controls
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Morning Shift */}
            <div
              className={`border rounded-lg p-4 ${
                noMealToday.morning
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Morning Shift</span>
                  {noMealToday.morning && (
                    <Ban className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedNoMealShift("morning");
                    setShowNoMealModal(true);
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    noMealToday.morning
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {noMealToday.morning ? "Active" : "Set No Meal"}
                </button>
              </div>
              {noMealToday.morning && noMealToday.reasons.morning && (
                <p className="text-sm text-red-600 mt-2">
                  Reason: {noMealToday.reasons.morning}
                </p>
              )}
            </div>

            {/* Evening Shift */}
            <div
              className={`border rounded-lg p-4 ${
                noMealToday.evening
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Evening Shift</span>
                  {noMealToday.evening && (
                    <Ban className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedNoMealShift("evening");
                    setShowNoMealModal(true);
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    noMealToday.evening
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {noMealToday.evening ? "Active" : "Set No Meal"}
                </button>
              </div>
              {noMealToday.evening && noMealToday.reasons.evening && (
                <p className="text-sm text-red-600 mt-2">
                  Reason: {noMealToday.reasons.evening}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        {currentView === "subscriptions" ? (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Subscriptions ({filteredSubscriptions.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Shift
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {subscription.user?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.user?.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {subscription.mealPlan?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.mealPlan?.tier || "N/A"} Tier
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {subscription.startShift === "morning" ? (
                            <Sun className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Moon className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {subscription.startShift || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscription.status === "active"
                              ? "bg-green-100 text-green-800"
                              : subscription.status === "paused"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {subscription.remainingMeals || 0} meals
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUserMeal(subscription)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit Meal
                          </button>
                          <button
                            onClick={() =>
                              setSelectedSubscription(subscription)
                            }
                            className="text-gray-600 hover:text-gray-800 font-medium text-sm flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No subscriptions found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tier Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Tier-Based Meal Management
                </h2>
                <div className="text-sm text-gray-500">
                  Edit meals for all subscriptions in a tier
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {["low", "basic", "premium"].map((tier) => {
                  const tierPlan = sellerMealPlans.find(
                    (plan) => plan.tier === tier
                  );
                  return (
                    <div key={tier} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">
                            {tier} Tier
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tierPlan
                              ? tierPlan.name
                              : `${
                                  tier.charAt(0).toUpperCase() + tier.slice(1)
                                } meal plan`}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            tier === "low"
                              ? "bg-gray-100 text-gray-800"
                              : tier === "basic"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {tier.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Main tier edit button matching the user's request */}
                        <button
                          onClick={() => {
                            console.log("Button clicked for tier:", tier);
                            handleEditTierMeal(tier);
                          }}
                          className="w-full text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1 py-2 px-3 border border-blue-200 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                          style={{ pointerEvents: "auto", zIndex: 10 }}
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit All {tier} Meals
                        </button>

                        {/* Shift-specific edit buttons */}
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => handleEditTierMeal(tier, "morning")}
                            className="text-left px-2 py-1 bg-yellow-50 hover:bg-yellow-100 rounded text-xs flex items-center gap-1"
                          >
                            <Sun className="h-3 w-3" />
                            Morning
                          </button>
                          <button
                            onClick={() => handleEditTierMeal(tier, "evening")}
                            className="text-left px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-xs flex items-center gap-1"
                          >
                            <Moon className="h-3 w-3" />
                            Evening
                          </button>
                        </div>

                        {/* Divider for individual subscriptions */}
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            Individual Customers (
                            {
                              subscriptions.filter(
                                (sub) => sub.mealPlan?.tier === tier
                              ).length
                            }
                            )
                          </div>

                          {/* Show individual subscriptions for this tier */}
                          {subscriptions
                            .filter((sub) => sub.mealPlan?.tier === tier)
                            .slice(0, 3)
                            .map((subscription) => (
                              <button
                                key={subscription._id}
                                onClick={() => handleEditUserMeal(subscription)}
                                className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded text-sm flex items-center gap-2 mb-1"
                              >
                                <User className="h-4 w-4" />
                                {subscription.user?.name || "Customer"} - Edit
                                Individual
                              </button>
                            ))}

                          {subscriptions.filter(
                            (sub) => sub.mealPlan?.tier === tier
                          ).length > 3 && (
                            <div className="text-xs text-gray-500 px-3 py-1">
                              +
                              {subscriptions.filter(
                                (sub) => sub.mealPlan?.tier === tier
                              ).length - 3}{" "}
                              more customers
                            </div>
                          )}

                          {subscriptions.filter(
                            (sub) => sub.mealPlan?.tier === tier
                          ).length === 0 && (
                            <div className="text-xs text-gray-400 px-3 py-1 italic">
                              No active subscriptions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meal Plans List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Meal Plans ({sellerMealPlans.length})
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellerMealPlans.map((plan) => (
                  <div key={plan._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {plan.name || plan.title}
                      </h3>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {plan.tier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {plan.description}
                    </p>

                    {/* Show subscription count */}
                    <div className="text-xs text-gray-500 mb-3">
                      {
                        subscriptions.filter(
                          (sub) => sub.mealPlan?._id === plan._id
                        ).length
                      }{" "}
                      active subscriptions
                    </div>

                    <div className="space-y-2">
                      {/* Tier-wide edit button */}
                      <button
                        onClick={() => {
                          console.log(
                            "Meal plan button clicked for tier:",
                            plan.tier
                          );
                          handleEditTierMeal(plan.tier);
                        }}
                        className="w-full text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1 py-1 border border-blue-200 rounded"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit All {plan.tier} Meals
                      </button>

                      {/* Individual subscriptions toggle */}
                      {subscriptions.filter(
                        (sub) => sub.mealPlan?._id === plan._id
                      ).length > 0 && (
                        <button
                          onClick={() =>
                            handleToggleMealPlanSubscriptions(plan._id)
                          }
                          className="w-full text-green-600 hover:text-green-800 text-sm flex items-center justify-center gap-1 py-1 border border-green-200 rounded"
                        >
                          <Users className="h-4 w-4" />
                          {expandedMealPlan === plan._id ? "Hide" : "Show"}{" "}
                          Individual Customers
                        </button>
                      )}

                      {/* Individual subscription list */}
                      {expandedMealPlan === plan._id && (
                        <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                          {subscriptions
                            .filter((sub) => sub.mealPlan?._id === plan._id)
                            .map((subscription) => (
                              <button
                                key={subscription._id}
                                onClick={() => handleEditUserMeal(subscription)}
                                className="w-full text-left px-2 py-1 bg-white hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                              >
                                <User className="h-3 w-3" />
                                {subscription.user?.name || "Customer"}
                                <span className="text-xs text-gray-500">
                                  - Edit Individual Meal
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {sellerMealPlans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No meal plans found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* No Meal Modal */}
      {showNoMealModal && <NoMealModal />}

      {/* Tier Edit Modal */}
      {showTierEdit && (
        <MealEditModal
          title={`Edit ${editingTier} Tier Meal${
            editingShift ? ` - ${editingShift} Shift` : ""
          }`}
          onSave={handleSaveTierMeal}
          onCancel={() => {
            setShowTierEdit(false);
            setEditingTier(null);
            setEditingShift(null);
          }}
        />
      )}

      {/* User Meal Edit Modal */}
      {showUserMealEdit && editingUserMeal && (
        <MealEditModal
          title={`Edit Meal for ${editingUserMeal.user?.name}`}
          onSave={handleSaveUserMeal}
          onCancel={() => {
            setShowUserMealEdit(false);
            setEditingUserMeal(null);
          }}
        />
      )}
    </div>
  );
};

export default SellerMealEdit;
