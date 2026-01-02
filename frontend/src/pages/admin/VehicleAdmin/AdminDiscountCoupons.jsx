import React, { useState } from "react";
import {
  Plus,
  Search,
  Percent,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

const AdminDiscountCoupons = () => {
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: "WELCOME20",
      title: "Welcome Discount",
      description: "20% off on first booking",
      discountType: "percentage",
      discountValue: 20,
      minBookingAmount: 500,
      maxDiscountAmount: 200,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      usageLimit: 100,
      usedCount: 23,
      isActive: true,
      applicableVehicleTypes: ["car", "bike"],
      userType: "new",
      createdAt: "2024-01-01",
    },
    {
      id: 2,
      code: "FLAT100",
      title: "Flat Discount",
      description: "₹100 flat discount",
      discountType: "fixed",
      discountValue: 100,
      minBookingAmount: 1000,
      maxDiscountAmount: 100,
      validFrom: "2024-01-15",
      validUntil: "2024-06-15",
      usageLimit: 500,
      usedCount: 145,
      isActive: true,
      applicableVehicleTypes: ["car", "bike", "auto"],
      userType: "all",
      createdAt: "2024-01-15",
    },
    {
      id: 3,
      code: "LOYALTY15",
      title: "Loyalty Reward",
      description: "15% off for regular customers",
      discountType: "percentage",
      discountValue: 15,
      minBookingAmount: 300,
      maxDiscountAmount: 150,
      validFrom: "2024-02-01",
      validUntil: "2024-04-30",
      usageLimit: 200,
      usedCount: 200,
      isActive: false,
      applicableVehicleTypes: ["car"],
      userType: "existing",
      createdAt: "2024-02-01",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minBookingAmount: "",
    maxDiscountAmount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    applicableVehicleTypes: [],
    userType: "all",
  });

  const vehicleTypes = [
    { value: "car", label: "Car" },
    { value: "bike", label: "Bike" },
    { value: "auto", label: "Auto" },
    { value: "truck", label: "Truck" },
  ];

  const userTypes = [
    { value: "all", label: "All Users" },
    { value: "new", label: "New Users Only" },
    { value: "existing", label: "Existing Users Only" },
  ];

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Active" ? coupon.isActive : !coupon.isActive);
    const matchesType =
      filterType === "All" || coupon.discountType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingCoupon) {
      setCoupons(
        coupons.map((coupon) =>
          coupon.id === editingCoupon.id
            ? {
                ...coupon,
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minBookingAmount: parseFloat(formData.minBookingAmount),
                maxDiscountAmount: parseFloat(formData.maxDiscountAmount),
                usageLimit: parseInt(formData.usageLimit),
              }
            : coupon
        )
      );
      setEditingCoupon(null);
    } else {
      const newCoupon = {
        ...formData,
        id: Date.now(),
        discountValue: parseFloat(formData.discountValue),
        minBookingAmount: parseFloat(formData.minBookingAmount),
        maxDiscountAmount: parseFloat(formData.maxDiscountAmount),
        usageLimit: parseInt(formData.usageLimit),
        usedCount: 0,
        isActive: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCoupons([newCoupon, ...coupons]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minBookingAmount: "",
      maxDiscountAmount: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
      applicableVehicleTypes: [],
      userType: "all",
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minBookingAmount: coupon.minBookingAmount.toString(),
      maxDiscountAmount: coupon.maxDiscountAmount.toString(),
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit.toString(),
      applicableVehicleTypes: coupon.applicableVehicleTypes,
      userType: coupon.userType,
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      setCoupons(coupons.filter((coupon) => coupon.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setCoupons(
      coupons.map((coupon) =>
        coupon.id === id ? { ...coupon, isActive: !coupon.isActive } : coupon
      )
    );
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVehicleTypeChange = (vehicleType, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        applicableVehicleTypes: [
          ...formData.applicableVehicleTypes,
          vehicleType,
        ],
      });
    } else {
      setFormData({
        ...formData,
        applicableVehicleTypes: formData.applicableVehicleTypes.filter(
          (type) => type !== vehicleType
        ),
      });
    }
  };

  const getStatusColor = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const usagePercentage = (coupon.usedCount / coupon.usageLimit) * 100;

    if (!coupon.isActive) return "bg-gray-100 text-gray-800";
    if (now > validUntil) return "bg-red-100 text-red-800";
    if (usagePercentage >= 100) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const usagePercentage = (coupon.usedCount / coupon.usageLimit) * 100;

    if (!coupon.isActive) return "Inactive";
    if (now > validUntil) return "Expired";
    if (usagePercentage >= 100) return "Limit Reached";
    return "Active";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-gray-600">
            Manage promotional codes and discounts
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingCoupon(null);
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} />
          Add Coupon
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Percent className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Coupons</p>
              <p className="text-2xl font-semibold text-gray-900">
                {coupons.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Active Coupons
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  coupons.filter(
                    (c) => c.isActive && new Date(c.validUntil) > new Date()
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Uses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  coupons.filter((c) => new Date(c.validUntil) < new Date())
                    .length
                }
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
            placeholder="Search coupons..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          className="px-4 py-2 border rounded-md"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed Amount</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md uppercase"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., WELCOME20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Welcome Discount"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={2}
                className="w-full px-3 py-2 border rounded-md"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the offer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                placeholder={
                  formData.discountType === "percentage"
                    ? "e.g., 20"
                    : "e.g., 100"
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Booking Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.minBookingAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minBookingAmount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.maxDiscountAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountAmount: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type *
              </label>
              <select
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.userType}
                onChange={(e) =>
                  setFormData({ ...formData, userType: e.target.value })
                }
              >
                {userTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Vehicle Types *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {vehicleTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.applicableVehicleTypes.includes(
                        type.value
                      )}
                      onChange={(e) =>
                        handleVehicleTypeChange(type.value, e.target.checked)
                      }
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCoupon(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingCoupon ? "Update Coupon" : "Add Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
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
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-mono font-bold text-blue-600">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === coupon.code ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {coupon.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        {coupon.userType === "new"
                          ? "New Users"
                          : coupon.userType === "existing"
                          ? "Existing Users"
                          : "All Users"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: ₹{coupon.minBookingAmount}
                    </div>
                    <div className="text-xs text-gray-500">
                      Max: ₹{coupon.maxDiscountAmount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                    <div>
                      to {new Date(coupon.validUntil).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (coupon.usedCount / coupon.usageLimit) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((coupon.usedCount / coupon.usageLimit) * 100)}
                      % used
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        coupon
                      )}`}
                    >
                      {getStatusText(coupon)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {coupon.applicableVehicleTypes.join(", ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleStatus(coupon.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {coupon.isActive ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
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

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12">
          <Percent className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No coupons found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== "All" || filterType !== "All"
              ? "Try adjusting your search filters."
              : "Get started by creating a new coupon."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountCoupons;
