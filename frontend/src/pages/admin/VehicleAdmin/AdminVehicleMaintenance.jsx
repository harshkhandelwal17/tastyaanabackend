import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Wrench,
  Calendar,
  User,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

const AdminVehicleMaintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    vehicleId: "",
    vehicleNo: "",
    maintenanceType: "routine",
    description: "",
    cost: "",
    scheduledDate: "",
    completedDate: "",
    status: "scheduled",
    mechanicName: "",
    notes: "",
  });

  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadMaintenanceRecords();
  }, []);

  const loadMaintenanceRecords = () => {
    // Mock data - replace with actual API call
    const mockRecords = [
      {
        id: 1,
        vehicleId: "VH001",
        vehicleNo: "GJ 01 AB 1234",
        vehicleName: "Honda Activa",
        maintenanceType: "routine",
        description: "Oil change and general servicing",
        cost: 1500,
        scheduledDate: "2024-12-15",
        completedDate: "2024-12-15",
        status: "completed",
        mechanicName: "Ramesh Kumar",
        notes: "All systems working fine",
        createdAt: "2024-12-10",
      },
      {
        id: 2,
        vehicleId: "VH002",
        vehicleNo: "GJ 01 CD 5678",
        vehicleName: "Bajaj Pulsar",
        maintenanceType: "repair",
        description: "Brake pad replacement",
        cost: 800,
        scheduledDate: "2024-12-20",
        completedDate: null,
        status: "in-progress",
        mechanicName: "Suresh Patel",
        notes: "Waiting for parts",
        createdAt: "2024-12-08",
      },
      {
        id: 3,
        vehicleId: "VH003",
        vehicleNo: "GJ 01 EF 9012",
        vehicleName: "TVS Jupiter",
        maintenanceType: "inspection",
        description: "Monthly safety inspection",
        cost: 500,
        scheduledDate: "2024-12-25",
        completedDate: null,
        status: "scheduled",
        mechanicName: "Kiran Shah",
        notes: "",
        createdAt: "2024-12-12",
      },
    ];

    setMaintenanceRecords(mockRecords);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingRecord) {
      setEditingRecord((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewRecord((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const recordData = editingRecord || newRecord;

    if (
      !recordData.vehicleNo ||
      !recordData.description ||
      !recordData.scheduledDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingRecord) {
      // Update existing record
      setMaintenanceRecords((prev) =>
        prev.map((record) =>
          record.id === editingRecord.id ? editingRecord : record
        )
      );
      setEditingRecord(null);
      toast.success("Maintenance record updated successfully");
    } else {
      // Add new record
      const record = {
        id: Date.now(),
        ...recordData,
        cost: parseFloat(recordData.cost) || 0,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setMaintenanceRecords((prev) => [...prev, record]);
      setNewRecord({
        vehicleId: "",
        vehicleNo: "",
        maintenanceType: "routine",
        description: "",
        cost: "",
        scheduledDate: "",
        completedDate: "",
        status: "scheduled",
        mechanicName: "",
        notes: "",
      });
      toast.success("Maintenance record added successfully");
    }

    setShowAddForm(false);
  };

  const handleEdit = (record) => {
    setEditingRecord({ ...record });
    setShowAddForm(true);
  };

  const handleDelete = (recordId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this maintenance record?"
      )
    ) {
      return;
    }

    setMaintenanceRecords((prev) =>
      prev.filter((record) => record.id !== recordId)
    );
    toast.success("Maintenance record deleted successfully");
  };

  const handleStatusUpdate = (recordId, newStatus) => {
    setMaintenanceRecords((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const updatedRecord = { ...record, status: newStatus };
          if (newStatus === "completed" && !record.completedDate) {
            updatedRecord.completedDate = new Date()
              .toISOString()
              .split("T")[0];
          }
          return updatedRecord;
        }
        return record;
      })
    );
    toast.success(`Maintenance status updated to ${newStatus}`);
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setShowAddForm(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
      "in-progress": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Wrench,
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "routine":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-red-100 text-red-800";
      case "inspection":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vehicle Maintenance
          </h1>
          <p className="text-gray-600 mt-1">
            Manage vehicle maintenance schedules and records
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Schedule Maintenance</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench size={20} className="mr-2" />
            {editingRecord
              ? "Edit Maintenance Record"
              : "Schedule New Maintenance"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicleNo"
                  value={
                    editingRecord
                      ? editingRecord.vehicleNo
                      : newRecord.vehicleNo
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="GJ 01 AB 1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Type *
                </label>
                <select
                  name="maintenanceType"
                  value={
                    editingRecord
                      ? editingRecord.maintenanceType
                      : newRecord.maintenanceType
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="routine">Routine Service</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={
                    editingRecord
                      ? editingRecord.scheduledDate
                      : newRecord.scheduledDate
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mechanic Name
                </label>
                <input
                  type="text"
                  name="mechanicName"
                  value={
                    editingRecord
                      ? editingRecord.mechanicName
                      : newRecord.mechanicName
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter mechanic name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  name="cost"
                  value={editingRecord ? editingRecord.cost : newRecord.cost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={
                    editingRecord ? editingRecord.status : newRecord.status
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={
                    editingRecord
                      ? editingRecord.description
                      : newRecord.description
                  }
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the maintenance work"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={editingRecord ? editingRecord.notes : newRecord.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes or observations"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Wrench size={16} className="mr-2" />
                {editingRecord ? "Update Record" : "Schedule Maintenance"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Records */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Maintenance Records
          </h2>
        </div>

        {maintenanceRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No maintenance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
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
                {maintenanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.vehicleNo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.vehicleName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                          record.maintenanceType
                        )}`}
                      >
                        {record.maintenanceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {record.description}
                      </div>
                      {record.mechanicName && (
                        <div className="text-xs text-gray-500">
                          Mechanic: {record.mechanicName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {new Date(record.scheduledDate).toLocaleDateString()}
                      </div>
                      {record.completedDate && (
                        <div className="text-xs text-green-600">
                          Completed:{" "}
                          {new Date(record.completedDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{record.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Edit Record"
                        >
                          <Edit2 size={16} />
                        </button>

                        {record.status === "scheduled" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(record.id, "in-progress")
                            }
                            className="text-yellow-600 hover:text-yellow-700 p-1"
                            title="Start Maintenance"
                          >
                            <Clock size={16} />
                          </button>
                        )}

                        {record.status === "in-progress" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(record.id, "completed")
                            }
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Mark as Completed"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
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

export default AdminVehicleMaintenance;
