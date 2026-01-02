import apiClient from '../redux/api/apiClient';

class ApiService {
  // Homepage APIs
  static async getHomepageData() {
    try {
      const response = await apiClient.get('/homepage');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch homepage data',
        data: null
      };
    }
  }

  static async getHeroSlides() {
    try {
      const response = await apiClient.get('/homepage/hero-slides');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch hero slides',
        data: []
      };
    }
  }

  static async getHomepageCategories() {
    try {
      const response = await apiClient.get('/homepage/categories');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  static async getFeaturedProducts(limit = 8) {
    try {
      const response = await apiClient.get(`/homepage/featured-products?limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch featured products',
        data: []
      };
    }
  }

  // Category APIs
  static async getCategories() {
    try {
      const response = await apiClient.get('/categories');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  static async getCategoryProducts(categoryId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add filters
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.inStock !== undefined) queryParams.append('inStock', params.inStock);

      const queryString = queryParams.toString();
      const url = `/categories/${categoryId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching category products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch category products',
        data: { products: [], category: null },
        pagination: {}
      };
    }
  }

  // Product APIs
  static async getAllProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all possible parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {},
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch products',
        data: [],
        pagination: {},
        total: 0
      };
    }
  }

  static async getProductById(id) {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch product',
        data: null
      };
    }
  }

  static async searchProducts(query, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await apiClient.get(`/products/search?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {},
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search products',
        data: [],
        pagination: {},
        total: 0
      };
    }
  }

  // Grocery specific APIs
  static async getGroceryProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `/products/grocery/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching grocery products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch grocery products',
        data: [],
        pagination: {}
      };
    }
  }

  static async getGroceryCategories() {
    try {
      const response = await apiClient.get('/products/grocery/categories');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching grocery categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch grocery categories',
        data: []
      };
    }
  }

  // Stats and testimonials
  static async getHomepageStats() {
    try {
      const response = await apiClient.get('/homepage/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching homepage stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stats',
        data: {
          customers: 5000,
          meals: 25000,
          satisfaction: 98,
          delivery: 99
        }
      };
    }
  }

  static async getTestimonials() {
    try {
      const response = await apiClient.get('/homepage/testimonials');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch testimonials',
        data: []
      };
    }
  }

  // Cart APIs
  static async addToCart(productId, payload = {}) {
    try {
      const response = await apiClient.post('/cart/add', {
        productId,
        payload,
        quantity: payload.quantity || 1
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add to cart',
        data: null
      };
    }
  }

  static async getCart() {
    try {
      const response = await apiClient.get('/cart');
      return {
        success: true,
        data: response.data.cart
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch cart',
        data: { items: [] }
      };
    }
  }

  static async updateCartItem(userId, itemId, quantity) {
    try {
      const response = await apiClient.put(`/cart/${userId}/item/${itemId}`, {
        quantity
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating cart item:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update cart item',
        data: null
      };
    }
  }

  static async removeFromCart(userId, itemId) {
    try {
      const response = await apiClient.delete(`/cart/${userId}/item/${itemId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove from cart',
        data: null
      };
    }
  }

  static async clearCart() {
    try {
      const response = await apiClient.delete('/cart/clear');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to clear cart',
        data: null
      };
    }
  }

  // Wishlist APIs
  static async getWishlist() {
    try {
      const response = await apiClient.get('/wishlist');
      return {
        success: true,
        data: response.data.items || []
      };
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch wishlist',
        data: []
      };
    }
  }

  static async addToWishlist(productId) {
    try {
      const response = await apiClient.post('/wishlist', {
        _id: productId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add to wishlist',
        data: null
      };
    }
  }

  static async removeFromWishlist(productId) {
    try {
      const response = await apiClient.delete(`/wishlist/${productId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove from wishlist',
        data: null
      };
    }
  }

  static async checkWishlist(productId) {
    try {
      const response = await apiClient.get(`/wishlist/check/${productId}`);
      return {
        success: true,
        data: response.data.isInWishlist
      };
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check wishlist',
        data: false
      };
    }
  }

  // Utility methods
  static handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data?.message || 'Server error occurred',
        statusCode: error.response.status
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Network error - please check your connection',
        statusCode: null
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        statusCode: null
      };
    }
  }

  // Cache management (simple in-memory cache)
  static cache = new Map();
  static cacheExpiry = new Map();

  static getCached(key) {
    if (this.cache.has(key)) {
      const expiry = this.cacheExpiry.get(key);
      if (expiry && Date.now() < expiry) {
        return this.cache.get(key);
      } else {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
    return null;
  }

  static setCached(key, data, ttlMinutes = 5) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000));
  }

  static clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export default ApiService;