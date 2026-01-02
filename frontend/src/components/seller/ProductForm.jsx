import React from 'react';
import PropTypes from 'prop-types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ImageUploader from './ImageUploader';
import ProductFormFields from './ProductFormFields';
import { useProductForm } from '../../hooks/useProductForm';

// Validation schema for the product form
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required').max(100, 'Title is too long'),
  description: Yup.string().required('Description is required'),
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  stock: Yup.number()
    .required('Stock is required')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  category: Yup.string().required('Category is required'),
  unitType: Yup.string().required('Unit type is required'),
  lowStockAlert: Yup.number()
    .required('Low stock alert is required')
    .integer('Must be a whole number')
    .min(0, 'Cannot be negative'),
  images: Yup.array()
    .min(1, 'At least one image is required')
    .max(5, 'Maximum 5 images allowed'),
});

const ProductForm = ({ product = null, isEdit = false }) => {
  const {
    formData,
    errors,
    isSubmitting,
    uploadingImages,
    handleChange,
    handleBlur,
    handleSubmit,
    handleImageUpload,
    removeImage,
    setFieldValue,
  } = useProductForm(product);

  return (
    <Formik
      initialValues={formData}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ handleSubmit, handleChange, handleBlur, values, errors, touched, setFieldValue }) => (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Main Form Fields */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Product Information" />
                <Divider />
                <CardContent>
                  <ProductFormFields
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                  />
                </CardContent>
              </Card>

              {/* Product Images */}
              <Box mt={3}>
                <ImageUploader
                  images={values.images}
                  onUpload={(files) => {
                    handleImageUpload(files);
                  }}
                  onRemove={(index) => removeImage(index)}
                  uploading={uploadingImages}
                  maxFiles={5}
                />
                {errors.images && touched.images && (
                  <Typography color="error" variant="caption" display="block" gutterBottom>
                    {errors.images}
                  </Typography>
                )}
              </Box>

              {/* Product Description */}
              <Box mt={3}>
                <Card>
                  <CardHeader title="Detailed Description" />
                  <Divider />
                  <CardContent>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      name="description"
                      label="Description *"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Status Card */}
              <Card>
                <CardHeader title="Status" />
                <Divider />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isActive"
                        checked={values.isActive}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label={values.isActive ? 'Active' : 'Inactive'}
                  />
                  <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                    {values.isActive
                      ? 'This product will be visible to customers.'
                      : 'This product will be hidden from customers.'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Categories */}
              <Box mt={3}>
                <Card>
                  <CardHeader title="Categories" />
                  <Divider />
                  <CardContent>
                    <FormControl fullWidth error={touched.category && Boolean(errors.category)}>
                      <InputLabel>Category *</InputLabel>
                      <Select
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Category *"
                      >
                        <MenuItem value="leafy">Leafy Vegetables</MenuItem>
                        <MenuItem value="root">Root Vegetables</MenuItem>
                        <MenuItem value="fruit">Fruits</MenuItem>
                        <MenuItem value="herbs">Herbs & Spices</MenuItem>
                        <MenuItem value="exotic">Exotic Vegetables</MenuItem>
                        <MenuItem value="organic">Organic Produce</MenuItem>
                        <MenuItem value="processed">Processed Foods</MenuItem>
                        <MenuItem value="dairy">Dairy & Eggs</MenuItem>
                        <MenuItem value="grains">Grains & Pulses</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                      {touched.category && errors.category && (
                        <FormHelperText>{errors.category}</FormHelperText>
                      )}
                    </FormControl>
                  </CardContent>
                </Card>
              </Box>

              {/* Save Button */}
              <Box mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isEdit ? 'Update Product' : 'Create Product'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

ProductForm.propTypes = {
  product: PropTypes.object,
  isEdit: PropTypes.bool,
};

export default ProductForm;

      dispatch(toggleModal({ modal: "productForm", isOpen: false }));
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        images: [],
        variants: [],
      });
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={() =>
              dispatch(toggleModal({ modal: "productForm", isOpen: false }))
            }
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadingImages ? "Uploading..." : "Click to upload images"}
                </span>
              </label>
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Variants
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg"
              >
                <input
                  type="text"
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    updateVariant(index, "color", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", parseInt(e.target.value))
                  }
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(index, "price", parseFloat(e.target.value))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() =>
                dispatch(toggleModal({ modal: "productForm", isOpen: false }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating || isUpdating
                ? "Saving..."
                : product
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
