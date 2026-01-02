// redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL - adjust according to your backend
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Async Thunks for API calls

// Fetch all products with filters
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts', // Fixed: Added proper action type
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      console.log('Fetch products params:', params);
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add filters
      if (params.category && params.category !== 'all') {
        queryParams.append('category', params.category);
      }
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.featured) queryParams.append('featured', params.featured);
      if (params.discount) queryParams.append('discount', params.discount);
      if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);
      
      // Always include store status in the response
      queryParams.append('populate', 'seller');
      
      const url = `${API_BASE_URL}/products${queryParams.toString() ? `?${queryParams}` : ''}`;
      console.log('Fetching products from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const data = await response.json();
      console.log("Fetched products data:", data);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch product categories
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch single product by ID
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await fetch(`${API_BASE_URL}/products/${productId}?populate=seller`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (limit = 6, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log("Fetching featured products with token:", token);
      const response = await fetch(`${API_BASE_URL}/products/featured?limit=${limit}&populate=seller`, {
        method: 'GET',
        withCredential:true,
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Search products
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', query.trim());
      
      // Add additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      // Always include seller's store status in search results
      queryParams.append('populate', 'seller');
      
      const response = await fetch(`${API_BASE_URL}/products/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Product data
  items: [], // Changed from 'products' to 'items' for consistency
  featuredProducts: [],
  currentProduct: null,
  categories: [],
  
  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12,
    hasNext: false,
    hasPrev: false
  },
  
  // Filters
  filters: {
    category: 'all',
    priceRange: {
      min: 0,
      max: 10000
    },
    rating: 0,
    sortBy: 'createdAt', // createdAt, price, rating, name
    sortOrder: 'desc', // asc, desc
    search: '',
    featured: false,
    onSale: false,
    inStock: true
  },
  
  // Applied filters (what's currently active)
  appliedFilters: {
    category: 'all',
    priceRange: {
      min: 0,
      max: 10000
    },
    rating: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    featured: false,
    onSale: false,
    inStock: true
  },
  
  // UI state
  loading: false,
  searchLoading: false,
  categoriesLoading: false,
  error: null,
  searchError: null,
  
  // View preferences
  viewMode: 'grid', // grid, list
  
  // Quick filters
  quickFilters: {
    newArrivals: false,
    bestsellers: false,
    festival: false,
    premium: false
  }
};

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Filter actions
    setCategory: (state, action) => {
      state.filters.category = action.payload;
    },
    
    setPriceRange: (state, action) => {
      state.filters.priceRange = action.payload;
    },
    
    setRatingFilter: (state, action) => {
      state.filters.rating = action.payload;
    },
    
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
    },
    
    setSortOrder: (state, action) => {
      state.filters.sortOrder = action.payload;
    },
    
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
    },
    
    setFeaturedFilter: (state, action) => {
      state.filters.featured = action.payload;
    },
    
    setOnSaleFilter: (state, action) => {
      state.filters.onSale = action.payload;
    },
    
    setInStockFilter: (state, action) => {
      state.filters.inStock = action.payload;
    },
    
    // Apply all current filters
    applyFilters: (state) => {
      state.appliedFilters = { ...state.filters };
      state.pagination.currentPage = 1; // Reset to first page when filters change
    },
    
    // Clear all filters
    clearFilters: (state) => {
      const searchQuery = state.filters.search; // Preserve search query
      state.filters = {
        ...initialState.filters,
        search: searchQuery // Keep search query
      };
      state.appliedFilters = { ...state.filters };
      state.pagination.currentPage = 1;
    },
    
    // Clear search
    clearSearch: (state) => {
      state.filters.search = '';
      state.appliedFilters.search = '';
    },
    
    // Pagination actions
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.currentPage = 1; // Reset to first page
    },
    
    // View mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Quick filters
    setQuickFilter: (state, action) => {
      const { filter, value } = action.payload;
      
      // Reset all quick filters first
      Object.keys(state.quickFilters).forEach(key => {
        state.quickFilters[key] = false;
      });
      
      // Set the selected filter
      state.quickFilters[filter] = value;
      
      // Apply quick filter logic
      if (value) { // Only apply if filter is being turned on
        switch (filter) {
          case 'newArrivals':
            state.filters.sortBy = 'createdAt';
            state.filters.sortOrder = 'desc';
            break;
          case 'bestsellers':
            state.filters.sortBy = 'soldCount';
            state.filters.sortOrder = 'desc';
            break;
          case 'festival':
            state.filters.category = 'festival';
            break;
          case 'premium':
            state.filters.priceRange.min = 500;
            break;
          default:
            break;
        }
      }
    },
    
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    
    // Update product in list (for wishlist, cart updates)
    updateProductInList: (state, action) => {
      const { productId, updates } = action.payload;
      const productIndex = state.items.findIndex(p => p._id === productId);
      if (productIndex !== -1) {
        state.items[productIndex] = { ...state.items[productIndex], ...updates };
      }
      
      // Also update in featured products if it exists there
      const featuredIndex = state.featuredProducts.findIndex(p => p._id === productId);
      if (featuredIndex !== -1) {
        state.featuredProducts[featuredIndex] = { ...state.featuredProducts[featuredIndex], ...updates };
      }
      
      // Update current product if it's the same
      if (state.currentProduct && state.currentProduct._id === productId) {
        state.currentProduct = { ...state.currentProduct, ...updates };
      }
    },
    
    // Reset state
    resetProductState: (state) => {
      return { ...initialState };
    },
    
    // Set products directly (for testing or manual updates)
    setProducts: (state, action) => {
      state.items = action.payload;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Handle different response structures
        if (action.payload.products) {
          state.items = action.payload.products;
        } else if (action.payload.data) {
          state.items = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } else {
          state.items = [];
        }
        
        // Update pagination if provided
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination
          };
        } else if (action.payload.meta) {
          // Handle meta pagination structure
          state.pagination = {
            ...state.pagination,
            currentPage: action.payload.meta.currentPage || 1,
            totalPages: action.payload.meta.totalPages || 1,
            totalProducts: action.payload.meta.total || state.items.length,
            hasNext: action.payload.meta.hasNext || false,
            hasPrev: action.payload.meta.hasPrev || false
          };
        } else {
          // Fallback pagination calculation
          state.pagination.totalProducts = action.payload.total || state.items.length;
          state.pagination.totalPages = Math.ceil(state.pagination.totalProducts / state.pagination.limit);
          state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
          state.pagination.hasPrev = state.pagination.currentPage > 1;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
        state.items = [];
      })
      
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        
        // Handle different response structures
        if (action.payload.categories) {
          state.categories = action.payload.categories;
        } else if (action.payload.data) {
          state.categories = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.categories = action.payload;
        } else {
          state.categories = [];
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload || 'Failed to fetch categories';
      })
      
      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Handle different response structures
        if (action.payload.product) {
          state.currentProduct = action.payload.product;
        } else if (action.payload.data) {
          state.currentProduct = action.payload.data;
        } else {
          state.currentProduct = action.payload;
        }
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch product';
        state.currentProduct = null;
      })
      
      // Fetch featured products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle different response structures
        if (action.payload.products) {
          state.featuredProducts = action.payload.products;
        } else if (action.payload.data) {
          state.featuredProducts = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.featuredProducts = action.payload;
        } else {
          state.featuredProducts = [];
        }
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch featured products';
      })
      
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        
        // Handle different response structures
        if (action.payload.products) {
          state.items = action.payload.products;
        } else if (action.payload.data) {
          state.items = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } else {
          state.items = [];
        }
        
        // Update pagination for search results
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination
          };
        } else if (action.payload.meta) {
          state.pagination = {
            ...state.pagination,
            currentPage: action.payload.meta.currentPage || 1,
            totalPages: action.payload.meta.totalPages || 1,
            totalProducts: action.payload.meta.total || state.items.length,
            hasNext: action.payload.meta.hasNext || false,
            hasPrev: action.payload.meta.hasPrev || false
          };
        }
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || 'Search failed';
      });
  }
});

// Export actions
export const {
  setCategory,
  setPriceRange,
  setRatingFilter,
  setSortBy,
  setSortOrder,
  setSearchQuery,
  setFeaturedFilter,
  setOnSaleFilter,
  setInStockFilter,
  applyFilters,
  clearFilters,
  clearSearch,
  setPage,
  setLimit,
  setViewMode,
  setQuickFilter,
  clearError,
  updateProductInList,
  resetProductState,
  setProducts
} = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.items;
export const selectFeaturedProducts = (state) => state.products.featuredProducts;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectCategories = (state) => state.products.categories;
export const selectPagination = (state) => state.products.pagination;
export const selectFilters = (state) => state.products.filters;
export const selectAppliedFilters = (state) => state.products.appliedFilters;
export const selectLoading = (state) => state.products.loading;
export const selectSearchLoading = (state) => state.products.searchLoading;
export const selectCategoriesLoading = (state) => state.products.categoriesLoading;
export const selectError = (state) => state.products.error;
export const selectSearchError = (state) => state.products.searchError;
export const selectViewMode = (state) => state.products.viewMode;
export const selectQuickFilters = (state) => state.products.quickFilters;

// Complex selectors
export const selectFilteredProductsCount = (state) => state.products.pagination.totalProducts;

export const selectActiveFiltersCount = (state) => {
  const filters = state.products.appliedFilters;
  let count = 0;
  
  if (filters.category !== 'all') count++;
  if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
  if (filters.rating > 0) count++;
  if (filters.featured) count++;
  if (filters.onSale) count++;
  if (!filters.inStock) count++;
  
  return count;
};

export const selectHasActiveSearch = (state) => {
  return state.products.appliedFilters.search && state.products.appliedFilters.search.length > 0;
};

export const selectIsLoading = (state) => {
  return state.products.loading || state.products.searchLoading || state.products.categoriesLoading;
};

export const selectHasError = (state) => {
  return state.products.error || state.products.searchError;
};

// Memoized selectors for better performance
export const selectProductById = (productId) => (state) => {
  return state.products.items.find(product => product._id === productId) || null;
};

export const selectProductsByCategory = (category) => (state) => {
  if (category === 'all') return state.products.items;
  return state.products.items.filter(product => product.category === category);
};

// Export reducer
export default productSlice.reducer;

// ===================================================================
// Usage Examples and Integration Guide
// ===================================================================

/*
INTEGRATION GUIDE:

1. Add to Redux Store:
// store.js
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';

export const store = configureStore({
  reducer: {
    products: productReducer,
    // ... other reducers
  },
});

2. Component Usage:
// ProductListPage.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProducts,
  fetchCategories,
  setCategory,
  setPriceRange,
  applyFilters,
  selectProducts,
  selectLoading,
  selectCategories,
  selectFilters
} from '../redux/slices/productSlice';

const ProductListPage = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const loading = useSelector(selectLoading);
  const categories = useSelector(selectCategories);
  const filters = useSelector(selectFilters);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts(filters));
  }, [dispatch]);

  const handleCategoryChange = (category) => {
    dispatch(setCategory(category));
    dispatch(applyFilters());
    dispatch(fetchProducts(filters));
  };

  const handlePriceChange = (priceRange) => {
    dispatch(setPriceRange(priceRange));
    dispatch(applyFilters());
    dispatch(fetchProducts(filters));
  };

  return (
    <div>
      // Your product listing UI
    </div>
  );
};

3. Backend API Endpoints Expected:
GET /api/products                 - Get products with filters
GET /api/products/categories      - Get all categories
GET /api/products/featured        - Get featured products
GET /api/products/search          - Search products
GET /api/products/:id             - Get single product

4. Query Parameters for /api/products:
- page: Page number
- limit: Items per page
- category: Product category
- minPrice: Minimum price
- maxPrice: Maximum price
- rating: Minimum rating
- search: Search query
- sortBy: Sort field (price, rating, createdAt, name)
- sortOrder: Sort direction (asc, desc)
- featured: Filter featured products
- discount: Filter discounted products

5. Expected API Response Format:
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "limit": 12,
      "hasNext": true,
      "hasPrev": false
    }
  }
}

6. Advanced Features:
- Real-time inventory updates
- Product variant handling
- Bulk operations
- Advanced search with filters
- Infinite scroll pagination
- SEO-friendly URLs with filters
*/