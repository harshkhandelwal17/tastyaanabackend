import React, { useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Edit2,
  Trash2,
  Phone,
  Clock,
  Check,
  X,
} from "lucide-react";

const AdminCenters = () => {
  const [centers, setCenters] = useState([
    {
      id: 1,
      name: "Downtown Center",
      address: "123 Main Street, Downtown",
      city: "Mumbai",
      zone: "Zone A",
      phone: "+91 98765 43210",
      email: "downtown@vehiclerent.com",
      operatingHours: "24/7",
      totalVehicles: 45,
      availableVehicles: 32,
      isActive: true,
      manager: "John Doe",
      coordinates: { lat: 19.076, lng: 72.8777 },
    },
    {
      id: 2,
      name: "Airport Hub",
      address: "Terminal 1, Mumbai Airport",
      city: "Mumbai",
      zone: "Zone B",
      phone: "+91 98765 43211",
      email: "airport@vehiclerent.com",
      operatingHours: "5:00 AM - 12:00 AM",
      totalVehicles: 38,
      availableVehicles: 22,
      isActive: true,
      manager: "Jane Smith",
      coordinates: { lat: 19.0896, lng: 72.8656 },
    },
    {
      id: 3,
      name: "Mall Center",
      address: "Phoenix Mall, Lower Parel",
      city: "Mumbai",
      zone: "Zone A",
      phone: "+91 98765 43212",
      email: "mall@vehiclerent.com",
      operatingHours: "10:00 AM - 10:00 PM",
      totalVehicles: 25,
      availableVehicles: 18,
      isActive: false,
      manager: "Mike Johnson",
      coordinates: { lat: 19.0135, lng: 72.8302 },
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);

  const zones = ["All", "Zone A", "Zone B", "Zone C", "Zone D"];

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    zone: "Zone A",
    phone: "",
    email: "",
    operatingHours: "",
    manager: "",
    coordinates: { lat: "", lng: "" },
  });

  const filteredCenters = centers.filter((center) => {
    const matchesSearch =
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = filterZone === "All" || center.zone === filterZone;
    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Active" ? center.isActive : !center.isActive);

    return matchesSearch && matchesZone && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingCenter) {
      setCenters(
        centers.map((center) =>
          center.id === editingCenter.id
            ? {
                ...center,
                ...formData,
                coordinates: {
                  lat: parseFloat(formData.coordinates.lat),
                  lng: parseFloat(formData.coordinates.lng),
                },
              }
            : center
        )
      );
      setEditingCenter(null);
    } else {
      const newCenter = {
        ...formData,
        id: Date.now(),
        totalVehicles: 0,
        availableVehicles: 0,
        isActive: true,
        coordinates: {
          lat: parseFloat(formData.coordinates.lat),
          lng: parseFloat(formData.coordinates.lng),
        },
      };
      setCenters([...centers, newCenter]);
    }

    setFormData({
      name: "",
      address: "",
      city: "",
      zone: "Zone A",
      phone: "",
      email: "",
      operatingHours: "",
      manager: "",
      coordinates: { lat: "", lng: "" },
    });
    setShowAddForm(false);
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      city: center.city,
      zone: center.zone,
      phone: center.phone,
      email: center.email,
      operatingHours: center.operatingHours,
      manager: center.manager,
      coordinates: {
        lat: center.coordinates.lat.toString(),
        lng: center.coordinates.lng.toString(),
      },
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this center? This action cannot be undone."
      )
    ) {
      setCenters(centers.filter((center) => center.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setCenters(
      centers.map((center) =>
        center.id === id ? { ...center, isActive: !center.isActive } : center
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Centers Management
          </h1>
          <p className="text-gray-600">Manage rental centers and locations</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingCenter(null);
            setFormData({
              name: "",
              address: "",
              city: "",
              zone: "Zone A",
              phone: "",
              email: "",
              operatingHours: "",
              manager: "",
              coordinates: { lat: "", lng: "" },
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} />
          Add Center
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Centers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {centers.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Active Centers
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {centers.filter((c) => c.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              V
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Vehicles
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {centers.reduce((sum, center) => sum + center.totalVehicles, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Now</p>
              <p className="text-2xl font-semibold text-gray-900">
                {centers.reduce(
                  (sum, center) => sum + center.availableVehicles,
                  0
                )}
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
            placeholder="Search centers..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingCenter ? "Edit Center" : "Add New Center"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.manager}
                onChange={(e) =>
                  setFormData({ ...formData, manager: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone *
              </label>
              <select
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.zone}
                onChange={(e) =>
                  setFormData({ ...formData, zone: e.target.value })
                }
              >
                {zones.slice(1).map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating Hours *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 6:00 AM - 10:00 PM"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.operatingHours}
                onChange={(e) =>
                  setFormData({ ...formData, operatingHours: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.coordinates.lat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coordinates: {
                      ...formData.coordinates,
                      lat: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.coordinates.lng}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coordinates: {
                      ...formData.coordinates,
                      lng: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCenter(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCenter ? "Update Center" : "Add Center"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Centers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicles
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
              {filteredCenters.map((center) => (
                <tr key={center.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {center.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Manager: {center.manager}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock size={16} className="mr-1" />
                        {center.operatingHours}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {center.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {center.city}, {center.zone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone size={16} className="mr-1" />
                      {center.phone}
                    </div>
                    <div className="text-sm text-gray-500">{center.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Total: {center.totalVehicles}</div>
                    <div className="text-green-600">
                      Available: {center.availableVehicles}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(center.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        center.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {center.isActive ? (
                        <>
                          <Check size={12} className="mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X size={12} className="mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(center)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(center.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCenters.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No centers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterZone !== "All" || filterStatus !== "All"
              ? "Try adjusting your search filters."
              : "Get started by creating a new center."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminCenters;
