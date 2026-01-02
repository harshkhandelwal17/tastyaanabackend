import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiX,
  FiCreditCard,
  FiPackage,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const UserDetail = () => {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useGetUserByIdQuery(userId);

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const user = userData?.data?.user;

  const handleEditStart = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || "user",
      status: user?.status || "active",
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleEditSave = async () => {
    try {
      await updateUser({ userId, ...editForm }).unwrap();
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiUser size={48} className="mx-auto mb-2" />
          <p>Error loading user details</p>
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

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">User not found</p>
        <Link
          to="/admin/users-management"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiArrowLeft className="mr-2" size={16} />
          Back to Users
        </Link>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    suspended: "bg-yellow-100 text-yellow-800",
  };

  const roleColors = {
    user: "bg-blue-100 text-blue-800",
    admin: "bg-purple-100 text-purple-800",
    "super-admin": "bg-red-100 text-red-800",
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/users-management"
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={20} className="mr-1" />
            Back
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            User Details
          </h1>
        </div>

        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={handleEditStart}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiEdit size={16} className="mr-2" />
              Edit User
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleEditSave}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiSave size={16} className="mr-2" />
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <FiX size={16} className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main User Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser size={32} className="text-blue-600" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.name}
                  </h2>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[user.status] || statusColors.active
                    }`}
                  >
                    {user.status || "active"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      roleColors[user.role] || roleColors.user
                    }`}
                  >
                    {user.role || "user"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiMail size={16} className="mr-2" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiPhone size={16} className="mr-2" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user.phone || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin size={16} className="mr-2" />
                    Address
                  </label>
                  <p className="text-gray-900">
                    {user.address || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiShield size={16} className="mr-2" />
                    Role
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{user.role}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar size={16} className="mr-2" />
                    Joined Date
                  </label>
                  <p className="text-gray-900">
                    {moment(user.createdAt).format("MMM DD, YYYY")}
                  </p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar size={16} className="mr-2" />
                    Last Login
                  </label>
                  <p className="text-gray-900">
                    {user.lastLogin
                      ? moment(user.lastLogin).format("MMM DD, YYYY hh:mm A")
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FiPackage size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {user.totalOrders || 0}
                </p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FiCreditCard
                  size={24}
                  className="text-green-600 mx-auto mb-2"
                />
                <p className="text-2xl font-bold text-gray-900">
                  ₹{user.totalSpent || 0}
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FiCalendar
                  size={24}
                  className="text-purple-600 mx-auto mb-2"
                />
                <p className="text-2xl font-bold text-gray-900">
                  {user.activeSubscriptions || 0}
                </p>
                <p className="text-sm text-gray-600">Active Plans</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <FiShield size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {user.loyaltyPoints || 0}
                </p>
                <p className="text-sm text-gray-600">Loyalty Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to={`/admin/orders-management?userId=${userId}`}
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                View Orders
              </Link>
              <Link
                to={`/admin/subscriptions-management?userId=${userId}`}
                className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                View Subscriptions
              </Link>
              <button className="block w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                Send Notification
              </button>
              <button className="block w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                Suspend Account
              </button>
            </div>
          </div>

          {/* User Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Status
            </h3>
            <div className="space-y-3">
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[user.status] || statusColors.active
                    }`}
                  >
                    {user.status || "active"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email Verified:</span>
                <span
                  className={
                    user.emailVerified ? "text-green-600" : "text-red-600"
                  }
                >
                  {user.emailVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phone Verified:</span>
                <span
                  className={
                    user.phoneVerified ? "text-green-600" : "text-red-600"
                  }
                >
                  {user.phoneVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
