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
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
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
    errors: formErrors,
    isSubmitting,
    uploadingImages,
    handleChange: handleFormChange,
    handleBlur: handleFormBlur,
    handleSubmit: handleFormSubmit,
    handleImageUpload,
    removeImage,
    setFieldValue,
  } = useProductForm(product);

  return (
    <Formik
      initialValues={formData}
      validationSchema={validationSchema}
      onSubmit={handleFormSubmit}
      enableReinitialize
    >
      {({ handleSubmit, handleChange, handleBlur, values, errors, touched, setFieldValue: setFormikFieldValue }) => (
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
                    handleChange={(e) => {
                      handleChange(e);
                      handleFormChange(e);
                    }}
                    handleBlur={(e) => {
                      handleBlur(e);
                      handleFormBlur(e);
                    }}
                    setFieldValue={(field, value) => {
                      setFormikFieldValue(field, value);
                      setFieldValue(field, value);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Product Images */}
              <Box mt={3}>
                <ImageUploader
                  images={values.images}
                  onUpload={handleImageUpload}
                  onRemove={removeImage}
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
                      value={values.description || ''}
                      onChange={(e) => {
                        handleChange(e);
                        handleFormChange(e);
                      }}
                      onBlur={(e) => {
                        handleBlur(e);
                        handleFormBlur(e);
                      }}
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
                        checked={Boolean(values.isActive)}
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
                        value={values.category || ''}
                        onChange={(e) => {
                          handleChange(e);
                          handleFormChange(e);
                        }}
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
