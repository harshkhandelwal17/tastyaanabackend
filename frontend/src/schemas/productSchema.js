// Product schema for the vegetable seller dashboard
export const productSchema = {
  // Basic Information
  title: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 100,
    label: 'Product Title',
    placeholder: 'e.g., Organic Tomatoes - Hybrid',
  },
  description: {
    type: 'textarea',
    required: true,
    minLength: 10,
    maxLength: 1000,
    label: 'Description',
    placeholder: 'Detailed description of the product...',
  },
  shortDescription: {
    type: 'text',
    required: false,
    maxLength: 200,
    label: 'Short Description',
    placeholder: 'Brief description shown in product listings',
  },

  // Pricing & Stock
  price: {
    type: 'number',
    required: true,
    min: 0,
    step: 0.01,
    label: 'Price (₹)',
    placeholder: '0.00',
  },
  costPrice: {
    type: 'number',
    required: false,
    min: 0,
    step: 0.01,
    label: 'Cost Price (₹)',
    placeholder: '0.00',
  },
  stock: {
    type: 'number',
    required: true,
    min: 0,
    step: 1,
    label: 'Stock Quantity',
    placeholder: '0',
  },
  lowStockAlert: {
    type: 'number',
    required: true,
    min: 0,
    step: 1,
    label: 'Low Stock Alert',
    placeholder: 'e.g., 10',
    defaultValue: 10,
  },
  unitType: {
    type: 'select',
    required: true,
    label: 'Unit Type',
    options: [
      { value: 'kg', label: 'Kilogram (kg)' },
      { value: 'g', label: 'Gram (g)' },
      { value: 'piece', label: 'Piece' },
      { value: 'bunch', label: 'Bunch' },
      { value: 'packet', label: 'Packet' },
      { value: 'dozen', label: 'Dozen' },
      { value: 'liter', label: 'Liter (L)' },
      { value: 'ml', label: 'Milliliter (ml)' },
    ],
    defaultValue: 'kg',
  },

  // Category & Tags
  category: {
    type: 'select',
    required: true,
    label: 'Category',
    options: [
      { value: 'leafy', label: 'Leafy Vegetables' },
      { value: 'root', label: 'Root Vegetables' },
      { value: 'fruit', label: 'Fruits' },
      { value: 'herbs', label: 'Herbs & Spices' },
      { value: 'exotic', label: 'Exotic Vegetables' },
      { value: 'organic', label: 'Organic Produce' },
      { value: 'processed', label: 'Processed Foods' },
      { value: 'dairy', label: 'Dairy & Eggs' },
      { value: 'grains', label: 'Grains & Pulses' },
      { value: 'other', label: 'Other' },
    ],
  },
  tags: {
    type: 'tags',
    required: false,
    label: 'Tags',
    placeholder: 'Add tags (comma separated)',
    suggestions: [
      'organic', 'local', 'seasonal', 'imported', 'gluten-free',
      'vegan', 'spicy', 'sweet', 'sour', 'bitter', 'salty'
    ],
  },

  // Product Details
  weight: {
    type: 'number',
    required: false,
    min: 0,
    step: 0.01,
    label: 'Weight (kg)',
    placeholder: 'e.g., 0.5',
  },
  origin: {
    type: 'text',
    required: false,
    label: 'Origin',
    placeholder: 'e.g., Local Farm, Maharashtra',
  },
  ingredients: {
    type: 'tags',
    required: false,
    label: 'Ingredients',
    placeholder: 'List ingredients (comma separated)',
  },
  allergens: {
    type: 'tags',
    required: false,
    label: 'Allergens',
    placeholder: 'e.g., nuts, dairy, gluten',
    suggestions: ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'fish', 'shellfish'],
  },
  storageInstructions: {
    type: 'textarea',
    required: false,
    label: 'Storage Instructions',
    placeholder: 'How should this product be stored?',
  },
  shelfLife: {
    type: 'number',
    required: false,
    min: 1,
    label: 'Shelf Life (days)',
    placeholder: 'e.g., 7',
  },

  // Status & Flags
  isActive: {
    type: 'switch',
    label: 'Active Product',
    description: 'Should this product be visible to customers?',
    defaultValue: true,
  },
  isPerishable: {
    type: 'switch',
    label: 'Perishable Item',
    description: 'Does this product need special handling?',
    defaultValue: true,
  },
  isFeatured: {
    type: 'switch',
    label: 'Featured Product',
    description: 'Show this product in featured sections?',
    defaultValue: false,
  },

  // Images
  images: {
    type: 'file',
    required: true,
    label: 'Product Images',
    multiple: true,
    accept: 'image/*',
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Upload up to 5 images (max 5MB each)',
  },

  // Variants (for products with multiple options)
  hasVariants: {
    type: 'switch',
    label: 'This product has variants',
    description: 'e.g., different sizes, colors, or types',
    defaultValue: false,
  },
  variants: {
    type: 'array',
    required: false,
    label: 'Product Variants',
    fields: {
      name: {
        type: 'text',
        required: true,
        label: 'Variant Name',
        placeholder: 'e.g., Small, Large, Organic',
      },
      sku: {
        type: 'text',
        required: false,
        label: 'SKU',
        placeholder: 'e.g., TOM-SM-ORG',
      },
      price: {
        type: 'number',
        required: true,
        min: 0,
        step: 0.01,
        label: 'Price (₹)',
      },
      stock: {
        type: 'number',
        required: true,
        min: 0,
        step: 1,
        label: 'Stock',
      },
    },
  },

  // SEO
  seoTitle: {
    type: 'text',
    required: false,
    label: 'SEO Title',
    maxLength: 60,
    description: 'Recommended: 50-60 characters',
  },
  seoDescription: {
    type: 'textarea',
    required: false,
    label: 'SEO Description',
    maxLength: 160,
    description: 'Recommended: 150-160 characters',
  },
  seoKeywords: {
    type: 'tags',
    required: false,
    label: 'SEO Keywords',
    placeholder: 'Add keywords (comma separated)',
  },
};

// Default product values for new products
export const defaultProductValues = {
  title: '',
  description: '',
  shortDescription: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  lowStockAlert: 10,
  unitType: 'kg',
  category: '',
  tags: [],
  weight: '',
  origin: '',
  ingredients: [],
  allergens: [],
  storageInstructions: '',
  shelfLife: '',
  isActive: true,
  isPerishable: true,
  isFeatured: false,
  images: [],
  hasVariants: false,
  variants: [],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
};

// Validation schema for form validation
export const productValidationSchema = {
  title: (value) => {
    if (!value) return 'Product title is required';
    if (value.length < 3) return 'Title must be at least 3 characters';
    if (value.length > 100) return 'Title must be less than 100 characters';
    return null;
  },
  description: (value) => {
    if (!value) return 'Description is required';
    if (value.length < 10) return 'Description must be at least 10 characters';
    return null;
  },
  price: (value) => {
    if (value === undefined || value === null) return 'Price is required';
    if (isNaN(value) || value < 0) return 'Price must be a positive number';
    return null;
  },
  stock: (value) => {
    if (value === undefined || value === null) return 'Stock is required';
    if (!Number.isInteger(Number(value)) || value < 0) return 'Stock must be a positive integer';
    return null;
  },
  category: (value) => {
    if (!value) return 'Category is required';
    return null;
  },
  images: (value) => {
    if (!value || value.length === 0) return 'At least one image is required';
    if (value.length > 5) return 'Maximum 5 images allowed';
    return null;
  },
};

// Helper function to get field by path
export const getFieldByPath = (path) => {
  const parts = path.split('.');
  let field = { ...productSchema };
  
  for (const part of parts) {
    if (field.fields && field.fields[part]) {
      field = field.fields[part];
    } else if (field[part]) {
      field = field[part];
    } else {
      return null;
    }
  }
  
  return field;
};

// Helper function to validate product data
export const validateProduct = (productData) => {
  const errors = {};
  
  for (const [key, validator] of Object.entries(productValidationSchema)) {
    const error = validator(productData[key]);
    if (error) {
      errors[key] = error;
    }
  }
  
  // Validate variants if hasVariants is true
  if (productData.hasVariants && Array.isArray(productData.variants)) {
    const variantErrors = [];
    
    productData.variants.forEach((variant, index) => {
      const variantError = {};
      let hasError = false;
      
      if (!variant.name) {
        variantError.name = 'Variant name is required';
        hasError = true;
      }
      
      if (variant.price === undefined || variant.price === null || isNaN(variant.price) || variant.price < 0) {
        variantError.price = 'Valid price is required';
        hasError = true;
      }
      
      if (variant.stock === undefined || variant.stock === null || !Number.isInteger(Number(variant.stock)) || variant.stock < 0) {
        variantError.stock = 'Valid stock quantity is required';
        hasError = true;
      }
      
      if (hasError) {
        variantErrors[index] = variantError;
      }
    });
    
    if (variantErrors.length > 0) {
      errors.variants = variantErrors;
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};
