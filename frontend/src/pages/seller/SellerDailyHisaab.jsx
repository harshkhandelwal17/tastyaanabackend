import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Calculator,
  Plus,
  Save,
  Calendar,
  IndianRupee,
  Upload,
  Download,
} from "lucide-react";

const SellerDailyHisaab = () => {
  const [hisaabEntry, setHisaabEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    cashCollected: "",
    onlinePayments: "",
    expenses: "",
    fuelCost: "",
    maintenance: "",
    otherExpenses: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setHisaabEntry((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Submit hisaab entry
      toast.success("Daily hisaab entry saved successfully!");
      // Reset form
      setHisaabEntry({
        date: new Date().toISOString().split("T")[0],
        cashCollected: "",
        onlinePayments: "",
        expenses: "",
        fuelCost: "",
        maintenance: "",
        otherExpenses: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Failed to save hisaab entry");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const income =
      (parseFloat(hisaabEntry.cashCollected) || 0) +
      (parseFloat(hisaabEntry.onlinePayments) || 0);
    const expenses =
      (parseFloat(hisaabEntry.fuelCost) || 0) +
      (parseFloat(hisaabEntry.maintenance) || 0) +
      (parseFloat(hisaabEntry.otherExpenses) || 0);
    return income - expenses;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Calculator className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Daily Hisaab Entry
                </h1>
                <p className="text-sm text-gray-500">
                  Record your daily offline collections and expenses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={hisaabEntry.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Income Section */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-medium text-green-800 mb-4">
                Income
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cash Collected
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={hisaabEntry.cashCollected}
                      onChange={(e) =>
                        handleInputChange("cashCollected", e.target.value)
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Online Payments
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={hisaabEntry.onlinePayments}
                      onChange={(e) =>
                        handleInputChange("onlinePayments", e.target.value)
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-medium text-red-800 mb-4">
                Expenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Cost
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={hisaabEntry.fuelCost}
                      onChange={(e) =>
                        handleInputChange("fuelCost", e.target.value)
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={hisaabEntry.maintenance}
                      onChange={(e) =>
                        handleInputChange("maintenance", e.target.value)
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Expenses
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={hisaabEntry.otherExpenses}
                      onChange={(e) =>
                        handleInputChange("otherExpenses", e.target.value)
                      }
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={hisaabEntry.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Any additional notes for today..."
              />
            </div>

            {/* Summary */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Daily Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Income:</span>
                  <span className="font-medium text-green-600">
                    ₹
                    {(
                      (parseFloat(hisaabEntry.cashCollected) || 0) +
                      (parseFloat(hisaabEntry.onlinePayments) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-medium text-red-600">
                    ₹
                    {(
                      (parseFloat(hisaabEntry.fuelCost) || 0) +
                      (parseFloat(hisaabEntry.maintenance) || 0) +
                      (parseFloat(hisaabEntry.otherExpenses) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Profit:</span>
                  <span
                    className={`font-medium ${
                      calculateTotal() >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() =>
                  setHisaabEntry({
                    date: new Date().toISOString().split("T")[0],
                    cashCollected: "",
                    onlinePayments: "",
                    expenses: "",
                    fuelCost: "",
                    maintenance: "",
                    otherExpenses: "",
                    notes: "",
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerDailyHisaab;
