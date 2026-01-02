import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit3,
  FiMoreVertical,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const UserCard = ({ user, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate({ userId: user._id, status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setIsUpdating(false);
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    suspended: "bg-yellow-100 text-yellow-800",
  };

  // Get user status - check both isActive boolean and status string
  const getUserStatus = () => {
    if (user.status) return user.status;
    return user.isActive !== false ? "active" : "inactive";
  };

  const userStatus = getUserStatus();
  const userStats = user.stats || {};

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 rounded-full p-2">
            <FiUser size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.name || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <FiMail size={14} className="mr-1" />
              {user.email}
            </p>
            {user.role && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                {user.role}
              </span>
            )}
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[userStatus] || statusColors.active
          }`}
        >
          {userStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Phone:</span>
          <p className="font-medium">{user.phone || "N/A"}</p>
        </div>
        <div>
          <span className="text-gray-600">Joined:</span>
          <p className="font-medium">
            {moment(user.createdAt).format("MMM DD, YYYY")}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Subscriptions:</span>
          <p className="font-medium">{userStats.subscriptions || 0}</p>
        </div>
        <div>
          <span className="text-gray-600">Orders:</span>
          <p className="font-medium">{userStats.orders || 0}</p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-600">Total Spent:</span>
          <p className="font-medium text-green-600">
            ₹{userStats.totalSpent || 0}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {userStatus !== "active" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={isUpdating}
              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 disabled:opacity-50"
            >
              <FiCheck size={12} className="mr-1" />
              {isUpdating ? "..." : "Activate"}
            </button>
          )}
          {userStatus !== "suspended" && (
            <button
              onClick={() => handleStatusChange("suspended")}
              disabled={isUpdating}
              className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs hover:bg-yellow-200 disabled:opacity-50"
            >
              <FiX size={12} className="mr-1" />
              {isUpdating ? "..." : "Suspend"}
            </button>
          )}
        </div>
        <Link
          to={`/admin/users/${user._id}`}
          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"
        >
          <FiEye size={12} className="mr-1" />
          View Details
        </Link>
      </div>
    </div>
  );
};

const UsersManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  const { data, isLoading, error, refetch } = useGetUsersQuery({
    page: currentPage,
    limit: 12,
    search,
    status: statusFilter,
  });

  console.log("Users API Response:", data);

  const [updateUserStatus] = useUpdateUserStatusMutation();

  const handleStatusUpdate = async ({ userId, status }) => {
    try {
      await updateUserStatus({ userId, status }).unwrap();
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Failed to update user status:", error);
      // You could add a toast notification here
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (isLoading) {
    return (
      <div className="p-4 mt-35 md:p-6 max-w-7xl mx-auto md:mt-40">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    console.error("Users API Error:", error);
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiUser size={48} className="mx-auto mb-2" />
          <p>Error loading users data</p>
          <p className="text-sm text-gray-500 mt-1">
            {error.data?.message || error.message || "Failed to fetch users"}
          </p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalUsers = pagination.totalUsers || 0;
  const currentPageNum = pagination.currentPage || currentPage;

  return (
    <div className="p-4 mt-35 md:p-6 max-w-7xl mx-auto md:mt-40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Users Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all platform users ({totalUsers} total)
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {totalUsers > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <FiUser size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <FiCheck size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter(
                      (u) =>
                        (u.status ||
                          (u.isActive !== false ? "active" : "inactive")) ===
                        "active"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <FiX size={24} className="text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter(
                      (u) =>
                        (u.status ||
                          (u.isActive !== false ? "active" : "inactive")) ===
                        "suspended"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <FiCalendar size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter((u) =>
                      moment(u.createdAt).isAfter(moment().startOf("month"))
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* No Users Found */}
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiUser size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Users Found
          </h3>
          <p className="text-gray-500">
            {search || statusFilter !== "all"
              ? "No users match your current filters. Try adjusting your search criteria."
              : "No users have been registered yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Users Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          ) : (
            // Table View
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
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
                    {users.map((user) => {
                      const getUserStatus = () => {
                        if (user.status) return user.status;
                        return user.isActive !== false ? "active" : "inactive";
                      };
                      const userStatus = getUserStatus();
                      const userStats = user.stats || {};

                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-gray-100 rounded-full p-2 mr-3">
                                <FiUser size={16} className="text-gray-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Joined {moment(user.createdAt).fromNow()}
                                </div>
                                {user.role && (
                                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                                    {user.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.phone || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {userStats.subscriptions || 0} subs,{" "}
                              {userStats.orders || 0} orders
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{userStats.totalSpent || 0} spent
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                userStatus === "active"
                                  ? "bg-green-100 text-green-800"
                                  : userStatus === "suspended"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {userStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/admin/users/${user._id}`}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-md">
            <div className="text-sm text-gray-700">
              Showing page {currentPageNum} of {totalPages} ({totalUsers} total
              users)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersManagement;
