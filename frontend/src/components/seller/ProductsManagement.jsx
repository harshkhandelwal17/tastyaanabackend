import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Weight,
  Image as ImageIcon,
  Save,
  X,
  Upload,
  MoreHorizontal,
  Power,
  Star,
  AlertCircle,
  CheckCircle,
  Camera,
  Loader2,
} from "lucide-react";
import {
  useGetSellerProductsQuery,
  useCreateSellerProductMutation,
  useUpdateSellerProductMutation,
  useDeleteSellerProductMutation,
  useUpdateProductStatusMutation,
} from "../../redux/storee/api";
import { toast } from "react-hot-toast";

const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
  onView,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="relative">
      <img
        src={product.images?.[0] || "/api/placeholder/300/200"}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-2 right-2 flex space-x-2">
        <button
          onClick={() =>
            onToggleAvailability(product._id, !product.isAvailable)
          }
          className={`p-2 rounded-full ${
            product.isAvailable
              ? "bg-green-500 text-white"
              : "bg-gray-500 text-white"
          } hover:opacity-80 transition-opacity`}
        >
          <Power size={16} />
        </button>
        <div className="relative group">
          <button className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity">
            <MoreHorizontal size={16} />
          </button>
          <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={() => onView(product)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Eye size={16} className="mr-2" />
              View Details
            </button>
            <button
              onClick={() => onEdit(product)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </button>
            <button
              onClick={() => onDelete(product._id)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 left-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.isAvailable ? "Available" : "Out of Stock"}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {product.name}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {product.description}
      </p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-green-600">
          <DollarSign size={16} className="mr-1" />
          <span className="font-semibold">₹{product.price}</span>
        </div>
        {product.weight && (
          <div className="flex items-center text-gray-500">
            <Weight size={16} className="mr-1" />
            <span className="text-sm">{product.weight}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Category: {product.category || "Uncategorized"}</span>
        {product.rating && (
          <div className="flex items-center">
            <Star size={14} className="text-yellow-400 mr-1" />
            <span>{product.rating}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ProductModal = ({ product, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    weight: "",
    weightOptions: [],
    isAvailable: true,
    images: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category || "",
        weight: product.weight || "",
        weightOptions: product.weightOptions || [],
        isAvailable: product.isAvailable !== false,
        images: product.images || [],
      });
      setPreviewImages(product.images || []);
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        weight: "",
        weightOptions: [],
        isAvailable: true,
        images: [],
      });
      setPreviewImages([]);
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const addWeightOption = () => {
    setFormData((prev) => ({
      ...prev,
      weightOptions: [...prev.weightOptions, { weight: "", price: "" }],
    }));
  };

  const updateWeightOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      weightOptions: prev.weightOptions.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const removeWeightOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      weightOptions: prev.weightOptions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "weightOptions") {
        productData.append(key, JSON.stringify(formData[key]));
      } else if (key !== "images") {
        productData.append(key, formData[key]);
      }
    });

    imageFiles.forEach((file) => {
      productData.append("images", file);
    });

    onSave(productData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe your product"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Category</option>
                  <option value="food">Food</option>
                  <option value="beverages">Beverages</option>
                  <option value="snacks">Snacks</option>
                  <option value="desserts">Desserts</option>
                  <option value="meals">Meals</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Weight/Size
              </label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 500g, 1kg, Large, Medium"
              />
            </div>
          </div>

          {/* Weight Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Weight/Size Options
              </h3>
              <button
                type="button"
                onClick={addWeightOption}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Add Option
              </button>
            </div>

            {formData.weightOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <input
                  type="text"
                  value={option.weight}
                  onChange={(e) =>
                    updateWeightOption(index, "weight", e.target.value)
                  }
                  placeholder="Weight/Size"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  value={option.price}
                  onChange={(e) =>
                    updateWeightOption(index, "price", e.target.value)
                  }
                  placeholder="Price"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeWeightOption(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Product Images</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Camera size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Click to upload images</p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </label>
            </div>

            {previewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Product is available for orders
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {product ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    data: productsData,
    isLoading,
    refetch,
  } = useGetSellerProductsQuery({
    search: searchTerm,
    category: categoryFilter,
  });

  const [createProduct, { isLoading: isCreating }] =
    useCreateSellerProductMutation();
  const [updateProduct, { isLoading: isUpdating }] =
    useUpdateSellerProductMutation();
  const [deleteProduct] = useDeleteSellerProductMutation();
  const [updateProductStatus] = useUpdateProductStatusMutation();

  const products = productsData?.data?.products || [];

  const handleCreateProduct = async (productData) => {
    try {
      await createProduct(productData).unwrap();
      toast.success("Product added successfully!");
      setShowModal(false);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to add product");
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      await updateProduct({
        id: editingProduct._id,
        data: productData,
      }).unwrap();
      toast.success("Product updated successfully!");
      setShowModal(false);
      setEditingProduct(null);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId).unwrap();
        toast.success("Product deleted successfully!");
        refetch();
      } catch (error) {
        toast.error(error.data?.message || "Failed to delete product");
      }
    }
  };

  const handleToggleAvailability = async (productId, isAvailable) => {
    try {
      await updateProductStatus({
        id: productId,
        status: isAvailable ? "active" : "inactive",
      }).unwrap();
      toast.success(
        `Product ${isAvailable ? "enabled" : "disabled"} successfully!`
      );
      refetch();
    } catch (error) {
      toast.error("Failed to update product availability");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600">
                Manage your product inventory
              </p>
            </div>
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                <option value="food">Food</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="desserts">Desserts</option>
                <option value="meals">Meals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleAvailability={handleToggleAvailability}
                onView={(product) =>
                  navigate(`/seller/products/${product._id}`)
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter
                ? "Try adjusting your search criteria"
                : "Add your first product to get started"}
            </p>
            {!searchTerm && !categoryFilter && (
              <button
                onClick={handleAddProduct}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
              >
                <Plus size={20} className="mr-2" />
                Add Your First Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={editingProduct}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
};

export default ProductsManagement;
