import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Trash2,
} from "lucide-react";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - replace with actual API call
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDrivers([
        {
          id: 1,
          name: "Harsh Kumar",
          email: "harsh@example.com",
          phone: "+91 9876543210",
          status: "active",
          verified: true,
          zone: "Zone A",
          joinDate: "2024-01-15",
          totalDeliveries: 245,
          rating: 4.8,
          license: "UP81AB1234",
          vehicle: "Motorcycle",
        },
        {
          id: 2,
          name: "Amit Singh",
          email: "amit@example.com",
          phone: "+91 9876543211",
          status: "inactive",
          verified: false,
          zone: "Zone B",
          joinDate: "2024-02-20",
          totalDeliveries: 156,
          rating: 4.5,
          license: "UP81CD5678",
          vehicle: "Car",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Driver Management
        </h1>
        <p className="text-gray-600">
          Manage delivery drivers, their verification status, and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter((d) => d.status === "inactive").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.filter((d) => d.verified).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search drivers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drivers List */}
        <div className="divide-y">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {driver.name.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {driver.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            driver.status
                          )}`}
                        >
                          {driver.status}
                        </span>
                        {driver.verified && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail size={16} />
                          <span>{driver.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone size={16} />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{driver.zone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Deliveries:</span>
                      <span className="ml-1 font-medium">
                        {driver.totalDeliveries}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rating:</span>
                      <span className="ml-1 font-medium">
                        {driver.rating}/5
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">License:</span>
                      <span className="ml-1 font-medium">{driver.license}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-1 font-medium">{driver.vehicle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 lg:mt-0">
                  <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Edit size={16} />
                    <span className="hidden lg:inline">Edit</span>
                  </button>
                  <button className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Trash2 size={16} />
                    <span className="hidden lg:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No drivers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;
