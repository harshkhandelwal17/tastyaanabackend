import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/orders` : 'http://localhost:5000/api/orders';

// Helper to include auth token
const authHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ==============================
// 🚀 Thunks
// ==============================

// Thunk to fetch paginated user orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 10, status } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/my-orders`, {
        params: { page, limit, status },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        withCredentials: true
      });
      console.log(response.data);
      return response.data; // contains: { orders, pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch single order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, thunkAPI) => {
    try {
      const res = await axios.get(`${API_URL}/${orderId}`, authHeaders());
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Validate required fields
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      if (!orderData.shippingAddress || !orderData.customer) {
        throw new Error('Shipping address and customer information are required');
      }

      const res = await axios.post(`${API_URL}`, orderData, authHeaders());
      console.log('Order created successfully:', res.data);
      return res.data;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

// Cancel (or delete) an order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, thunkAPI) => {
    try {
      await axios.delete(`${API_URL}/${orderId}`, authHeaders());
      return orderId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==============================
// 🧠 Slice
// ==============================

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    error: null,
    latestOrder: null,
    createLoading: false,
    createError: null,
  },
  reducers: {
    setLatestOrder(state, action) {
      state.latestOrder = action.payload;
      state.createError = null;
    },
    // Apply real-time order updates coming from socket events
    applyOrderUpdate(state, action) {
      const update = action.payload || {};
      const id = update.orderId || update._id || update.id;
      if (!id) return;

      const idx = state.items.findIndex(o => o._id === id || o.id === id || o.orderId === id);
      if (idx !== -1) {
        state.items[idx] = {
          ...state.items[idx],
          ...update,
          status: update.status || state.items[idx].status,
          deliveryPartner: update.deliveryPartner || state.items[idx].deliveryPartner,
          updatedAt: update.updatedAt || new Date().toISOString(),
        };
      } else {
        // If order is not in list, optionally add it to ensure strip can react
        state.items.unshift({
          _id: id,
          ...update,
          updatedAt: update.updatedAt || new Date().toISOString(),
        });
      }
    },
    clearOrders(state) {
      state.items = [];
      state.pagination = null;
      state.latestOrder = null;
      state.error = null;
      state.createError = null;
    },
    clearErrors(state) {
      state.error = null;
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== FETCH ORDERS =====
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        console.log(action.payload.orders);
        state.items = action.payload.orders || action.payload;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ===== FETCH ORDER BY ID =====
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // You can add currentOrder to state if needed
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ===== CREATE ORDER =====
      .addCase(createOrder.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        state.error = null;
        state.latestOrder = action.payload;
        
        // Add to orders list if it doesn't exist
        const existingOrder = state?.items?.find(order => order._id === action.payload._id);
        if (!existingOrder) {
          state.items.unshift(action.payload); // Add to beginning
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
        state.error = action.payload;
        console.error('Create order failed:', action.payload);
      })
      
      // ===== CANCEL ORDER =====
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const cancelledOrderId = action.payload;
        // Remove from orders list or update status
        const index = state.items.findIndex(order => order._id === cancelledOrderId);
        if (index !== -1) {
          state.items[index] = { 
            ...state.items[index], 
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          };
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setLatestOrder, applyOrderUpdate, clearOrders, clearErrors } = orderSlice.actions;
export default orderSlice.reducer;