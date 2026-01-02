// Frontend Component - MenuChangeModal.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Button from "../Common/Button";
import { useToast } from "../../hooks/useToast";

const MenuChangeModal = ({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  subscriptionId,
}) => {
  const [availableOptions, setAvailableOptions] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedCustomItems, setSelectedCustomItems] = useState([]);
  const [reason, setReason] = useState("other");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Options, 2: Payment, 3: Confirmation
  const [priceAdjustment, setPriceAdjustment] = useState(0);

  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen && selectedDate && selectedSlot) {
      fetchAvailableOptions();
    }
  }, [isOpen, selectedDate, selectedSlot]);

  const fetchAvailableOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/menu-change/options?date=${selectedDate}&slot=${selectedSlot}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setAvailableOptions(data.data);
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError("Failed to fetch meal options");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAdjustment = () => {
    let adjustment = 0;

    if (selectedTier) {
      const tierOption = [
        ...availableOptions.availableChanges.upgrades,
        ...availableOptions.availableChanges.downgrades,
      ].find((option) => option.tier === selectedTier);

      if (tierOption) {
        adjustment += tierOption.priceAdjustment;
      }
    }

    selectedCustomItems.forEach((item) => {
      adjustment += item.price * item.quantity;
    });

    return adjustment;
  };

  const handleSubmitRequest = async () => {
    try {
      setLoading(true);

      const requestData = {
        changeDate: selectedDate,
        deliverySlot: selectedSlot,
        newTier: selectedTier,
        customItems: selectedCustomItems,
        reason,
        notes,
      };

      const response = await fetch("/api/menu-change/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        const adjustment = calculateTotalAdjustment();
        setPriceAdjustment(adjustment);

        if (adjustment > 0) {
          setStep(2); // Go to payment step
        } else {
          setStep(3); // Go to confirmation
          success("Menu change request submitted successfully!");
        }
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError("Failed to submit menu change request");
    } finally {
      setLoading(false);
    }
  };

  const addCustomItem = (item) => {
    const existingItem = selectedCustomItems.find((i) => i.name === item.name);

    if (existingItem) {
      setSelectedCustomItems((items) =>
        items.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedCustomItems((items) => [...items, { ...item, quantity: 1 }]);
    }
  };

  const removeCustomItem = (itemName) => {
    setSelectedCustomItems((items) => items.filter((i) => i.name !== itemName));
  };

  const updateCustomItemQuantity = (itemName, quantity) => {
    if (quantity === 0) {
      removeCustomItem(itemName);
    } else {
      setSelectedCustomItems((items) =>
        items.map((i) => (i.name === itemName ? { ...i, quantity } : i))
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Change Today's Menu
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedDate &&
                  new Date(selectedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                - {selectedSlot}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {loading && !availableOptions ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading menu options...</p>
            </div>
          ) : availableOptions && !availableOptions.canChange ? (
            <div className="p-8 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Menu Change Not Available
              </h3>
              <p className="text-gray-600">
                The cutoff time for menu changes has passed. Changes must be
                made before 6:00 AM on the delivery day.
              </p>
              <div className="mt-6">
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : step === 1 && availableOptions ? (
            <div className="p-6">
              {/* Current Meal */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Current Meal
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {availableOptions.currentPlan.charAt(0).toUpperCase() +
                        availableOptions.currentPlan.slice(1)}{" "}
                      Plan
                    </span>
                    <span className="text-orange-600 font-semibold">
                      ₹{availableOptions.currentMeal.price}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {availableOptions.currentMeal.items
                      .map((item) => item.name)
                      .join(" • ")}
                  </div>
                </div>
              </div>

              {/* Plan Changes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Change Plan
                </h3>

                {/* Upgrades */}
                {availableOptions.availableChanges.upgrades.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-700 mb-2">
                      Upgrades
                    </h4>
                    <div className="space-y-2">
                      {availableOptions.availableChanges.upgrades.map(
                        (upgrade) => (
                          <div
                            key={upgrade.tier}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTier === upgrade.tier
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setSelectedTier(
                                selectedTier === upgrade.tier
                                  ? null
                                  : upgrade.tier
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">
                                    {upgrade.tier.charAt(0).toUpperCase() +
                                      upgrade.tier.slice(1)}{" "}
                                    Plan
                                  </span>
                                  <span className="ml-2 text-sm text-green-600 font-medium">
                                    +₹{upgrade.priceAdjustment}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {upgrade.meal.items
                                    .map((item) => item.name)
                                    .join(" • ")}
                                </div>
                              </div>
                              {selectedTier === upgrade.tier && (
                                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Downgrades */}
                {availableOptions.availableChanges.downgrades.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-700 mb-2">
                      Downgrades
                    </h4>
                    <div className="space-y-2">
                      {availableOptions.availableChanges.downgrades.map(
                        (downgrade) => (
                          <div
                            key={downgrade.tier}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTier === downgrade.tier
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setSelectedTier(
                                selectedTier === downgrade.tier
                                  ? null
                                  : downgrade.tier
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">
                                    {downgrade.tier.charAt(0).toUpperCase() +
                                      downgrade.tier.slice(1)}{" "}
                                    Plan
                                  </span>
                                  <span className="ml-2 text-sm text-blue-600 font-medium">
                                    ₹{Math.abs(downgrade.priceAdjustment)} off
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {downgrade.meal.items
                                    .map((item) => item.name)
                                    .join(" • ")}
                                </div>
                              </div>
                              {selectedTier === downgrade.tier && (
                                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Add Custom Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableOptions.availableChanges.customItems.map((item) => {
                    const selectedItem = selectedCustomItems.find(
                      (i) => i.name === item.name
                    );

                    return (
                      <div
                        key={item.name}
                        className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {item.name}
                          </span>
                          <span className="text-orange-600 font-semibold">
                            ₹{item.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {item.description}
                        </p>

                        {selectedItem ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateCustomItemQuantity(
                                    item.name,
                                    selectedItem.quantity - 1
                                  )
                                }
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">
                                {selectedItem.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCustomItemQuantity(
                                    item.name,
                                    selectedItem.quantity + 1
                                  )
                                }
                                className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm text-gray-600">
                              ₹{item.price * selectedItem.quantity}
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="small"
                            onClick={() => addCustomItem(item)}
                            className="w-full"
                          >
                            Add Item
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reason and Notes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Reason for Change
                </h3>
                <div className="space-y-3">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="other">Other</option>
                    <option value="upgrade">Want to upgrade</option>
                    <option value="downgrade">Want to downgrade</option>
                    <option value="dietary_preference">
                      Dietary preference
                    </option>
                    <option value="custom_request">Custom request</option>
                  </select>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or special instructions..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Price Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current meal price:</span>
                    <span>₹{availableOptions.currentMeal.price}</span>
                  </div>

                  {selectedTier && (
                    <div className="flex justify-between">
                      <span>Plan change:</span>
                      <span
                        className={
                          [
                            ...availableOptions.availableChanges.upgrades,
                            ...availableOptions.availableChanges.downgrades,
                          ].find((option) => option.tier === selectedTier)
                            ?.priceAdjustment > 0
                            ? "text-green-600"
                            : "text-blue-600"
                        }
                      >
                        {[
                          ...availableOptions.availableChanges.upgrades,
                          ...availableOptions.availableChanges.downgrades,
                        ].find((option) => option.tier === selectedTier)
                          ?.priceAdjustment > 0
                          ? "+"
                          : ""}
                        ₹
                        {
                          [
                            ...availableOptions.availableChanges.upgrades,
                            ...availableOptions.availableChanges.downgrades,
                          ].find((option) => option.tier === selectedTier)
                            ?.priceAdjustment
                        }
                      </span>
                    </div>
                  )}

                  {selectedCustomItems.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span>
                        {item.name} × {item.quantity}:
                      </span>
                      <span className="text-green-600">
                        +₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total adjustment:</span>
                    <span
                      className={
                        calculateTotalAdjustment() > 0
                          ? "text-green-600"
                          : calculateTotalAdjustment() < 0
                          ? "text-blue-600"
                          : "text-gray-900"
                      }
                    >
                      {calculateTotalAdjustment() > 0 ? "+" : ""}₹
                      {calculateTotalAdjustment()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cutoff Time Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Changes must be made before 6:00 AM on{" "}
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  loading={loading}
                  disabled={!selectedTier && selectedCustomItems.length === 0}
                >
                  {calculateTotalAdjustment() > 0
                    ? "Continue to Payment"
                    : "Submit Request"}
                </Button>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <CurrencyRupeeIcon className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Required
                </h3>
                <p className="text-gray-600">
                  Additional charge for menu upgrade: ₹{priceAdjustment}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    // Process wallet payment
                    setStep(3);
                    success("Payment successful! Menu changed.");
                  }}
                >
                  Pay with Wallet
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Process Razorpay payment
                    setStep(3);
                    success("Payment successful! Menu changed.");
                  }}
                >
                  Pay with Card/UPI
                </Button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="p-6 text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Menu Changed Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your meal for {new Date(selectedDate).toLocaleDateString()} (
                {selectedSlot}) has been updated.
              </p>
              <Button onClick={onClose}>Done</Button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MenuChangeModal;
