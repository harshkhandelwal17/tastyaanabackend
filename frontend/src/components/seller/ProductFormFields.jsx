import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Grid,
} from '@mui/material';

const ProductFormFields = ({
  values,
  errors,
  handleChange,
  handleBlur,
  touched,
}) => {
  // Define form fields configuration
  const fields = [
    {
      name: 'title',
      label: 'Product Title',
      type: 'text',
      required: true,
      xs: 12,
      md: 8,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'leafy', label: 'Leafy Vegetables' },
        { value: 'root', label: 'Root Vegetables' },
        { value: 'fruit', label: 'Fruits' },
        { value: 'herbs', label: 'Herbs & Spices' },
        { value: 'exotic', label: 'Exotic Vegetables' },
        { value: 'organic', label: 'Organic Produce' },
      ],
      xs: 12,
      md: 4,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      rows: 4,
      xs: 12,
    },
    {
      name: 'price',
      label: 'Price (₹)',
      type: 'number',
      required: true,
      startAdornment: '₹',
      xs: 12,
      sm: 6,
      md: 4,
    },
    {
      name: 'stock',
      label: 'Stock Quantity',
      type: 'number',
      required: true,
      xs: 12,
      sm: 6,
      md: 4,
    },
    {
      name: 'unitType',
      label: 'Unit Type',
      type: 'select',
      required: true,
      options: [
        { value: 'kg', label: 'Kilogram (kg)' },
        { value: 'g', label: 'Gram (g)' },
        { value: 'piece', label: 'Piece' },
        { value: 'bunch', label: 'Bunch' },
        { value: 'packet', label: 'Packet' },
        { value: 'dozen', label: 'Dozen' },
      ],
      xs: 12,
      sm: 6,
      md: 4,
    },
    {
      name: 'lowStockAlert',
      label: 'Low Stock Alert',
      type: 'number',
      required: true,
      xs: 12,
      sm: 6,
      md: 4,
    },
  ];

  const renderField = (field) => {
    const error = errors[field.name] && touched[field.name];
    const commonProps = {
      fullWidth: true,
      name: field.name,
      label: `${field.label}${field.required ? ' *' : ''}`,
      value: values[field.name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: !!error,
      helperText: error || '',
      variant: 'outlined',
      size: 'small',
    };

    switch (field.type) {
      case 'select':
        return (
          <FormControl
            fullWidth
            error={!!error}
            variant="outlined"
            size="small"
            required={field.required}
          >
            <InputLabel>{field.label}{field.required ? ' *' : ''}</InputLabel>
            <Select
              {...commonProps}
              labelId={`${field.name}-label`}
              label={`${field.label}${field.required ? ' *' : ''}`}
            >
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={field.rows || 4}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            inputProps={{
              min: 0,
              step: field.step || 1,
            }}
            InputProps={{
              startAdornment: field.startAdornment && (
                <InputAdornment position="start">
                  {field.startAdornment}
                </InputAdornment>
              ),
            }}
          />
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Grid container spacing={2}>
      {fields.map((field) => (
        <Grid item xs={field.xs || 12} sm={field.sm} md={field.md} key={field.name}>
          {renderField(field)}
        </Grid>
      ))}
    </Grid>
  );
};

ProductFormFields.propTypes = {
  values: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  touched: PropTypes.object.isRequired,
};

export default ProductFormFields;
