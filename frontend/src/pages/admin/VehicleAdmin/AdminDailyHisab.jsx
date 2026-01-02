import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiEye,
} from "react-icons/fi";

const AdminDailyHisab = () => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    vehicleNo: "",
    vehicleType: "",
    amount: "",
    paymentMode: "cash",
    description: "",
    bookingId: "",
  });

  const [editingEntry, setEditingEntry] = useState(null);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    loadTodayEntries();
  }, []);

  const loadTodayEntries = () => {
    // Mock data - replace with actual API call
    const mockEntries = [
      {
        id: 1,
        date: new Date().toISOString().split("T")[0],
        customerName: "Raj Patel",
        vehicleNo: "GJ 01 AB 1234",
        vehicleType: "Activa",
        amount: 500,
        paymentMode: "cash",
        description: "12 hour rental",
        bookingId: "BK001",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        date: new Date().toISOString().split("T")[0],
        customerName: "Priya Sharma",
        vehicleNo: "GJ 01 CD 5678",
        vehicleType: "Pulsar",
        amount: 800,
        paymentMode: "upi",
        description: "24 hour rental + fuel",
        bookingId: "BK002",
        createdAt: new Date().toISOString(),
      },
    ];

    setEntries(mockEntries);
    const total = mockEntries.reduce((sum, entry) => sum + entry.amount, 0);
    setTodayTotal(total);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingEntry) {
      setEditingEntry((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewEntry((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entryData = editingEntry || newEntry;

    if (!entryData.customerName || !entryData.vehicleNo || !entryData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(entryData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (editingEntry) {
      // Update existing entry
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntry.id ? { ...editingEntry, amount } : entry
        )
      );
      setEditingEntry(null);
      toast.success("Entry updated successfully");
    } else {
      // Add new entry
      const entry = {
        id: Date.now(),
        ...entryData,
        amount,
        createdAt: new Date().toISOString(),
      };

      setEntries((prev) => [...prev, entry]);
      setNewEntry({
        date: new Date().toISOString().split("T")[0],
        customerName: "",
        vehicleNo: "",
        vehicleType: "",
        amount: "",
        paymentMode: "cash",
        description: "",
        bookingId: "",
      });
      toast.success("Entry added successfully");
    }

    // Recalculate total
    const newTotal =
      entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) +
      amount;
    setTodayTotal(newTotal);
  };

  const handleEdit = (entry) => {
    setEditingEntry({ ...entry });
  };

  const handleDelete = (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    toast.success("Entry deleted successfully");

    // Recalculate total
    const newTotal = entries
      .filter((entry) => entry.id !== entryId)
      .reduce((sum, entry) => sum + entry.amount, 0);
    setTodayTotal(newTotal);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
  };

  const getPaymentModeColor = (mode) => {
    switch (mode) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "upi":
        return "bg-blue-100 text-blue-800";
      case "card":
        return "bg-purple-100 text-purple-800";
      case "bank":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Hisab</h1>
          <p className="text-gray-600 mt-1">
            Record offline collections and cash transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 bg-blue-50 px-4 py-2 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Today's Total</div>
          <div className="text-2xl font-bold text-blue-900">
            ₹{todayTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiPlus className="w-5 h-5 mr-2" />
          {editingEntry ? "Edit Entry" : "Add New Entry"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={editingEntry ? editingEntry.date : newEntry.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={
                  editingEntry
                    ? editingEntry.customerName
                    : newEntry.customerName
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Number *
              </label>
              <input
                type="text"
                name="vehicleNo"
                value={
                  editingEntry ? editingEntry.vehicleNo : newEntry.vehicleNo
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="GJ 01 AB 1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type
              </label>
              <input
                type="text"
                name="vehicleType"
                value={
                  editingEntry ? editingEntry.vehicleType : newEntry.vehicleType
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Activa, Pulsar, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={editingEntry ? editingEntry.amount : newEntry.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={
                  editingEntry ? editingEntry.paymentMode : newEntry.paymentMode
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking ID
              </label>
              <input
                type="text"
                name="bookingId"
                value={
                  editingEntry ? editingEntry.bookingId : newEntry.bookingId
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="BK001 (optional)"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={
                  editingEntry ? editingEntry.description : newEntry.description
                }
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {editingEntry && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FiSave className="w-4 h-4 mr-2" />
              {editingEntry ? "Update Entry" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Today's Entries
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No entries recorded for today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.customerName}
                      </div>
                      {entry.bookingId && (
                        <div className="text-xs text-gray-500">
                          ID: {entry.bookingId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.vehicleNo}
                      </div>
                      {entry.vehicleType && (
                        <div className="text-xs text-gray-500">
                          {entry.vehicleType}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{entry.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPaymentModeColor(
                          entry.paymentMode
                        )}`}
                      >
                        {entry.paymentMode.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Edit Entry"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Entry"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDailyHisab;
