import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaUpload,
  FaSpinner,
  FaTrash,
  FaCheck,
  FaPlay,
  FaVideo,
  FaChevronDown,
} from "react-icons/fa";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useUploadProductVideosMutation,
  useGetCategoriesQuery,
} from "../../../redux/api/sellerProductApi";
import { toast } from "react-toastify";

const AddGadgetModal = ({ product, onClose, onSave }) => {
  const isEditing = !!product;

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    price: "",
    originalPrice: "",
    discountPrice: "",
    stock: "",
    category: "", // Category ID to be selected by user
    categoryName: "gadgets", // Send category name to backend
    subCategory: "",
    tags: ["mobile", "gadget"],
    specifications: [{ name: "", value: "" }],
    weight: "",
    brand: "",
    model: "",
    condition: "new",
    warranty: "",
    weightoption: {
      weight: "1 Unit",
      price: "",
      originalPrice: "",
      discount: "",
      stock: "",
    },
    isActive: true,
    featured: false,
  });

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch categories from API
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery();

  // Debug logging
  useEffect(() => {
    console.log("Categories Data:", categoriesData);
    console.log("Categories Loading:", categoriesLoading);
    console.log("Categories Error:", categoriesError);

    // Log the actual API endpoint being called
    console.log(
      "Expected API endpoint:",
      `${import.meta.env.VITE_BACKEND_URL}/seller/gadgets/categories`
    );
  }, [categoriesData, categoriesLoading, categoriesError]);

  // API hooks
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadImages] = useUploadProductImagesMutation();
  const [uploadVideos] = useUploadProductVideosMutation();

  // Initialize form with product data if editing
  useEffect(() => {
    if (isEditing && product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        discountPrice: product.discountPrice || "",
        stock: product.stock || "",
        category: product.category?._id || "", // Use category ID
        categoryName: product.category?.name || "gadgets", // Use category name
        subCategory: product.subCategory || "",
        tags: product.tags || ["mobile", "gadget"],
        specifications:
          product.specifications?.length > 0
            ? product.specifications
            : [{ name: "", value: "" }],
        weight: product.weight || "",
        weightoption: product.weightOptions,
        brand:
          product.specifications?.find((s) => s.name.toLowerCase() === "brand")
            ?.value || "",
        model:
          product.specifications?.find((s) => s.name.toLowerCase() === "model")
            ?.value || "",
        condition: product.tags?.includes("second-hand") ? "used" : "new",
        warranty:
          product.specifications?.find((s) =>
            s.name.toLowerCase().includes("warranty")
          )?.value || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
        featured: product.featured || false,
      });
      setImages(product.images || []);
      setVideos(product.videos || []);
    } else {
      console.log("No product data available for editing");
    }
  }, [product, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTagChange = (e) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData((prev) => ({ ...prev, specifications: newSpecs }));
  };

  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: "", value: "" }],
    }));
  };

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Update the handleImageUpload function to handle Cloudinary response better
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes and types
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported image format.`);
        return;
      }
    }

    setUploadingImages(true);
    try {
      const formDataImages = new FormData();
      files.forEach((file) => formDataImages.append("images", file));

      console.log("Uploading files:", files.length);
      const response = await uploadImages(formDataImages).unwrap();

      console.log("Upload response:", response);

      if (response.success && response.data) {
        const newImages = response.data.map((url, index) => ({
          url,
          alt: `${formData.title || "Product"} - Image ${
            images.length + index + 1
          }`,
          isPrimary: images.length === 0 && index === 0,
        }));

        setImages((prev) => [...prev, ...newImages]);
        toast.success(
          `${files.length} image(s) uploaded successfully to Cloudinary`
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error?.data?.message || "Failed to upload images to Cloudinary"
      );
    } finally {
      setUploadingImages(false);
    }
  };

  // Video upload handler
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate video files
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    const validFormats = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
    ];

    const invalidFiles = files.filter(
      (file) => !validFormats.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      toast.error(
        `Invalid video files. Please use MP4, WebM, OGG, AVI, or MOV format under 50MB.`
      );
      return;
    }

    setUploadingVideos(true);
    try {
      const formDataVideos = new FormData();
      files.forEach((file) => formDataVideos.append("videos", file));

      console.log("Uploading video files:", files.length);
      // Use the video upload endpoint
      const response = await uploadVideos(formDataVideos).unwrap();

      console.log("Video upload response:", response);

      if (response.success && response.data) {
        const newVideos = response.data.map((url, index) => ({
          url,
          alt: `${formData.title || "Product"} - Video ${
            videos.length + index + 1
          }`,
        }));

        setVideos((prev) => [...prev, ...newVideos]);
        toast.success(
          `${files.length} video(s) uploaded successfully to Cloudinary`
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error(
        error?.data?.message || "Failed to upload videos to Cloudinary"
      );
    } finally {
      setUploadingVideos(false);
    }
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first one primary
      if (prev[index]?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.price || formData.price <= 0)
      errors.price = "Valid price is required";
    if (!formData.stock || formData.stock < 0)
      errors.stock = "Valid stock quantity is required";
    if (images.length === 0) errors.images = "At least one image is required";

    // Validate that original price is greater than current price if both are provided
    if (
      formData.originalPrice &&
      formData.price &&
      parseFloat(formData.originalPrice) <= parseFloat(formData.price)
    ) {
      errors.originalPrice =
        "Original price should be greater than current price";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      // Calculate discount properly
      const calculateDiscount = (original, current) => {
        if (
          !original ||
          !current ||
          parseFloat(original) <= parseFloat(current)
        ) {
          return 0;
        }
        return (
          ((parseFloat(original) - parseFloat(current)) /
            parseFloat(original)) *
          100
        );
      };

      const Weightoption = {
        weight: "1 Unit",
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        stock: parseInt(formData.stock),
        discount: calculateDiscount(formData.originalPrice, formData.price), // Fixed calculation
      };

      console.log("Weightoption:", Weightoption);
      // Prepare product data
      const productData = {
        ...formData,
        images,
        videos,
        weightoption: Weightoption,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : undefined,
        stock: parseInt(formData.stock),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        specifications: formData.specifications.filter(
          (spec) => spec.name && spec.value
        ),
        tags: [
          ...formData.tags,
          formData.condition === "used" ? "second-hand" : "new",
        ],
        category: formData.category, // Send category ID to backend
      };

      // Add brand, model, warranty to specifications if provided
      if (formData.brand) {
        productData.specifications.push({
          name: "Brand",
          value: formData.brand,
        });
      }
      if (formData.model) {
        productData.specifications.push({
          name: "Model",
          value: formData.model,
        });
      }
      if (formData.warranty) {
        productData.specifications.push({
          name: "Warranty",
          value: formData.warranty,
        });
      }

      console.log("Submitting product data:", productData);

      if (isEditing) {
        await updateProduct({ id: product._id, ...productData }).unwrap();
        toast.success("Product updated successfully");
      } else {
        await createProduct(productData).unwrap();
        toast.success("Product created successfully");
      }

      onSave();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} product`
      );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Gadget" : "Add New Gadget"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category *
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => {
                      const selectedCategoryId = e.target.value;
                      const categories =
                        categoriesData?.data || categoriesData || [];
                      const selectedCategory = categories.find(
                        (cat) => cat._id === selectedCategoryId
                      );
                      setFormData({
                        ...formData,
                        category: selectedCategoryId,
                        categoryName: selectedCategory?.name || "",
                      });
                    }}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none ${
                      formErrors.category ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Select a category..."}
                    </option>
                    {!categoriesLoading &&
                      (categoriesData?.data || categoriesData || []).map(
                        (category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        )
                      )}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {categoriesLoading && (
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                      <FaSpinner className="animate-spin text-amber-500" />
                    </div>
                  )}
                </div>
                {formErrors.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.category}
                  </p>
                )}
                {categoriesData?.data?.length === 0 && !categoriesLoading && (
                  <p className="mt-1 text-sm text-yellow-600">
                    {categoriesError
                      ? `Error: ${
                          categoriesError?.data?.message ||
                          categoriesError?.message ||
                          "Failed to load categories"
                        }`
                      : "No categories available. Make sure the backend server is running."}
                  </p>
                )}
                {categoriesError && (
                  <p className="mt-1 text-sm text-red-600">
                    API Error: {categoriesError?.status} -{" "}
                    {categoriesError?.data?.message ||
                      categoriesError?.message ||
                      "Connection failed"}
                  </p>
                )}
              </div>

              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    formErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., iPhone 13 Pro Max 128GB"
                  required
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Brief product description"
                  maxLength={250}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Detailed product description..."
                  required
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      formErrors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      formErrors.originalPrice
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.originalPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.originalPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      formErrors.stock ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0"
                    required
                  />
                  {formErrors.stock && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Apple, Samsung"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., iPhone 13 Pro Max"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="new">Brand New</option>
                    <option value="used">Second Hand / Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty
                  </label>
                  <input
                    type="text"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., 1 year manufacturer warranty"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(", ")}
                  onChange={handleTagChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="mobile, smartphone, electronics"
                />
              </div>
            </div>

            {/* Right Column - Images and Specifications */}
            <div className="space-y-4">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images *
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center justify-center ${
                      uploadingImages ? "opacity-50" : ""
                    }`}
                  >
                    {uploadingImages ? (
                      <FaSpinner className="animate-spin text-2xl text-amber-600 mb-2" />
                    ) : (
                      <FaUpload className="text-2xl text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-500">
                      {uploadingImages
                        ? "Uploading..."
                        : "Click to upload images"}
                    </span>
                  </label>
                </div>

                {formErrors.images && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.images}
                  </p>
                )}

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className={`p-1 rounded mr-1 ${
                              image.isPrimary
                                ? "bg-green-500 text-white"
                                : "bg-white text-gray-700"
                            }`}
                            title="Set as primary"
                          >
                            <FaCheck />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-500 text-white rounded"
                            title="Remove image"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        {image.isPrimary && (
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Videos (Optional)
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                    disabled={uploadingVideos}
                  />
                  <label
                    htmlFor="video-upload"
                    className={`cursor-pointer flex flex-col items-center justify-center ${
                      uploadingVideos ? "opacity-50" : ""
                    }`}
                  >
                    {uploadingVideos ? (
                      <FaSpinner className="animate-spin text-2xl text-amber-600 mb-2" />
                    ) : (
                      <FaVideo className="text-2xl text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-500">
                      {uploadingVideos
                        ? "Uploading videos..."
                        : "Click to upload videos"}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      MP4, WebM, OGG, AVI, MOV (Max 50MB per video)
                    </span>
                  </label>
                </div>

                {/* Video Preview */}
                {videos.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        className="relative group border rounded-lg overflow-hidden"
                      >
                        <video
                          src={video.url}
                          className="w-full h-32 object-cover"
                          controls
                          preload="metadata"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove video"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            Video {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specifications
                </label>
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Name (e.g., Storage)"
                      value={spec.name}
                      onChange={(e) =>
                        handleSpecificationChange(index, "name", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 128GB)"
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecificationChange(
                          index,
                          "value",
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecification}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  + Add Specification
                </button>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Product is active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Featured product
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && <FaSpinner className="animate-spin mr-2" />}
              {isEditing ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGadgetModal;
