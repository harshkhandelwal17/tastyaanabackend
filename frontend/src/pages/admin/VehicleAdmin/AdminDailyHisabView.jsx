import React, { useState } from "react";
import {
  Search,
  Calendar,
  User,
  DollarSign,
  MapPin,
  Filter,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const AdminDailyHisabView = () => {
  const [collections, setCollections] = useState([
    {
      id: 1,
      date: "2024-01-08",
      centerName: "Downtown Center",
      centerManager: "John Doe",
      zone: "Zone A",
      totalBookings: 15,
      totalAmount: 12500,
      cashAmount: 7500,
      onlineAmount: 5000,
      submittedAt: "2024-01-08T18:30:00",
      status: "submitted",
      notes: "All collections verified and deposited",
      vehicleBreakdown: {
        car: { count: 8, amount: 6800 },
        bike: { count: 5, amount: 2700 },
        auto: { count: 2, amount: 3000 },
      },
    },
    {
      id: 2,
      date: "2024-01-08",
      centerName: "Airport Hub",
      centerManager: "Jane Smith",
      zone: "Zone B",
      totalBookings: 22,
      totalAmount: 18500,
      cashAmount: 11000,
      onlineAmount: 7500,
      submittedAt: "2024-01-08T19:15:00",
      status: "submitted",
      notes: "Peak hour collections, higher than usual",
      vehicleBreakdown: {
        car: { count: 12, amount: 10200 },
        bike: { count: 7, amount: 3800 },
        auto: { count: 3, amount: 4500 },
      },
    },
    {
      id: 3,
      date: "2024-01-07",
      centerName: "Mall Center",
      centerManager: "Mike Johnson",
      zone: "Zone A",
      totalBookings: 8,
      totalAmount: 6200,
      cashAmount: 4000,
      onlineAmount: 2200,
      submittedAt: "2024-01-07T20:00:00",
      status: "verified",
      notes: "Weekend collections, moderate traffic",
      vehicleBreakdown: {
        car: { count: 4, amount: 3400 },
        bike: { count: 3, amount: 1800 },
        auto: { count: 1, amount: 1000 },
      },
    },
    {
      id: 4,
      date: "2024-01-07",
      centerName: "Business District",
      centerManager: "Sarah Wilson",
      zone: "Zone C",
      totalBookings: 18,
      totalAmount: 15200,
      cashAmount: 9200,
      onlineAmount: 6000,
      submittedAt: "2024-01-07T18:45:00",
      status: "pending",
      notes: "Awaiting verification of cash deposits",
      vehicleBreakdown: {
        car: { count: 10, amount: 8500 },
        bike: { count: 6, amount: 3200 },
        auto: { count: 2, amount: 3500 },
      },
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterZone, setFilterZone] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCollection, setSelectedCollection] = useState(null);

  const zones = ["All", "Zone A", "Zone B", "Zone C", "Zone D"];
  const statuses = ["All", "pending", "submitted", "verified"];

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch =
      collection.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.centerManager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || collection.date === filterDate;
    const matchesZone = filterZone === "All" || collection.zone === filterZone;
    const matchesStatus =
      filterStatus === "All" || collection.status === filterStatus;

    return matchesSearch && matchesDate && matchesZone && matchesStatus;
  });

  const totalStats = filteredCollections.reduce(
    (acc, collection) => ({
      totalAmount: acc.totalAmount + collection.totalAmount,
      totalBookings: acc.totalBookings + collection.totalBookings,
      cashAmount: acc.cashAmount + collection.cashAmount,
      onlineAmount: acc.onlineAmount + collection.onlineAmount,
    }),
    { totalAmount: 0, totalBookings: 0, cashAmount: 0, onlineAmount: 0 }
  );

  const updateStatus = (id, newStatus) => {
    setCollections(
      collections.map((collection) =>
        collection.id === id ? { ...collection, status: newStatus } : collection
      )
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "verified":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertCircle size={16} />;
      case "submitted":
      case "verified":
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  const exportData = () => {
    const csvData = filteredCollections
      .map(
        (collection) =>
          `${collection.date},${collection.centerName},${collection.centerManager},${collection.zone},${collection.totalBookings},${collection.totalAmount},${collection.cashAmount},${collection.onlineAmount},${collection.status}`
      )
      .join("\n");

    const blob = new Blob(
      [
        `Date,Center,Manager,Zone,Bookings,Total Amount,Cash,Online,Status\n${csvData}`,
      ],
      { type: "text/csv" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `daily-hisab-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daily Hisab - Admin View
          </h1>
          <p className="text-gray-600">
            Monitor all center collections and offline transactions
          </p>
        </div>
        <button
          onClick={exportData}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalStats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Bookings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalStats.totalBookings}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
              C
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Cash Collections
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalStats.cashAmount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              O
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Online Collections
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalStats.onlineAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search centers or managers..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-gray-400" />
          <input
            type="date"
            className="px-3 py-2 border rounded-md"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-md"
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "All"
                ? "All Status"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager & Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(collection.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin size={16} className="mr-1" />
                        {collection.centerName}
                      </div>
                      <div className="text-xs text-gray-400">
                        Submitted:{" "}
                        {new Date(collection.submittedAt).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <User size={16} className="mr-1" />
                        {collection.centerManager}
                      </div>
                      <div className="text-sm text-gray-500">
                        {collection.zone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">
                        {collection.totalBookings} total
                      </div>
                      <div className="text-xs text-gray-500">
                        Car: {collection.vehicleBreakdown.car.count} • Bike:{" "}
                        {collection.vehicleBreakdown.bike.count} • Auto:{" "}
                        {collection.vehicleBreakdown.auto.count}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-semibold">
                        {formatCurrency(collection.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Cash: {formatCurrency(collection.cashAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Online: {formatCurrency(collection.onlineAmount)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          collection.status
                        )}`}
                      >
                        {getStatusIcon(collection.status)}
                        <span className="ml-1">
                          {collection.status.charAt(0).toUpperCase() +
                            collection.status.slice(1)}
                        </span>
                      </span>
                      {collection.status === "pending" && (
                        <div className="space-x-1">
                          <button
                            onClick={() =>
                              updateStatus(collection.id, "submitted")
                            }
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Mark Submitted
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(collection.id, "verified")
                            }
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                      {collection.status === "submitted" && (
                        <button
                          onClick={() =>
                            updateStatus(collection.id, "verified")
                          }
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedCollection(collection)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <Eye size={16} className="mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No collections found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search filters to find collections.
          </p>
        </div>
      )}

      {/* Collection Details Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Collection Details
                </h3>
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Center Information
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Center:</strong> {selectedCollection.centerName}
                    </div>
                    <div>
                      <strong>Manager:</strong>{" "}
                      {selectedCollection.centerManager}
                    </div>
                    <div>
                      <strong>Zone:</strong> {selectedCollection.zone}
                    </div>
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedCollection.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Collection Summary
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Total Amount:</strong>{" "}
                      {formatCurrency(selectedCollection.totalAmount)}
                    </div>
                    <div>
                      <strong>Cash:</strong>{" "}
                      {formatCurrency(selectedCollection.cashAmount)}
                    </div>
                    <div>
                      <strong>Online:</strong>{" "}
                      {formatCurrency(selectedCollection.onlineAmount)}
                    </div>
                    <div>
                      <strong>Total Bookings:</strong>{" "}
                      {selectedCollection.totalBookings}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Vehicle Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(selectedCollection.vehicleBreakdown).map(
                    ([type, data]) => (
                      <div key={type} className="bg-gray-50 p-3 rounded">
                        <div className="text-sm font-medium capitalize">
                          {type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.count} bookings
                        </div>
                        <div className="text-sm font-semibold">
                          {formatCurrency(data.amount)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {selectedCollection.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedCollection.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedCollection.status !== "verified" && (
                  <button
                    onClick={() => {
                      updateStatus(selectedCollection.id, "verified");
                      setSelectedCollection(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark as Verified
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDailyHisabView;
