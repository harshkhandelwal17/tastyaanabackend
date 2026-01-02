import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Async thunks for driver operations

// Driver login
export const loginDriver = createAsyncThunk(
  'driver/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...credentials, 
          expectedRole: 'delivery' 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }

      // Store token in localStorage for persistence
      localStorage.setItem('driverToken', data.token);
      localStorage.setItem('driverRefresh', data.refreshToken || '');

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Get driver profile
export const getDriverProfile = createAsyncThunk(
  'driver/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to get profile');
      }

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to get profile');
    }
  }
);

// Update driver location
export const updateDriverLocation = createAsyncThunk(
  'driver/updateLocation',
  async (locationData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch(`${API_BASE_URL}/drivers/location`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update location');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

// Toggle online status
export const toggleOnlineStatus = createAsyncThunk(
  'driver/toggleOnline',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await fetch(`${API_BASE_URL}/api/drivers/toggle-online`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to toggle status');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to toggle status');
    }
  }
);

// Get assigned orders (from Order schema)
export const getAssignedOrders = createAsyncThunk(
  'driver/getOrders',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/drivers/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials:'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to get orders');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to get orders');
    }
  }
);

// Get assigned daily orders (from DailyOrder schema)
export const getAssignedDailyOrders = createAsyncThunk(
  'driver/getDailyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/drivers/subscription/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials:'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to get daily orders');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to get daily orders');
    }
  }
);

const initialState = {
  driver: null,
  token: localStorage.getItem('driverToken'),
  isAuthenticated: !!localStorage.getItem('driverToken'),
  isOnline: false,
  currentLocation: {
    lat: 22.763813,
    lng: 75.885822,
    lastUpdated: null
  },
  assignedOrders: [],
  dailyOrders: [],
  earnings: {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  },
  loading: false,
  error: null,
  lastLocationUpdate: null
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    logout: (state) => {
      state.driver = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isOnline = false;
      state.assignedOrders = [];
      state.dailyOrders = [];
      state.earnings = initialState.earnings;
      state.currentLocation = initialState.currentLocation;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverRefresh');
      localStorage.removeItem('driverData');
      localStorage.removeItem('driverId');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateLocation: (state, action) => {
      state.currentLocation = {
        ...action.payload,
        lastUpdated: new Date().toISOString()
      };
      state.lastLocationUpdate = new Date().toISOString();
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
      if (state.driver) {
        state.driver.driverProfile.isOnline = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginDriver.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginDriver.fulfilled, (state, action) => {
        state.loading = false;
        state.driver = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isOnline = action.payload.user?.driverProfile?.isOnline || false;
        state.currentLocation = action.payload.user?.driverProfile?.currentLocation || state.currentLocation;
        state.error = null;
      })
      .addCase(loginDriver.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.driver = null;
        state.token = null;
      })
      
      // Get profile cases
      .addCase(getDriverProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDriverProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.driver = action.payload;
        state.isOnline = action.payload?.driverProfile?.isOnline || false;
        state.currentLocation = action.payload?.driverProfile?.currentLocation || state.currentLocation;
        state.earnings = action.payload?.driverProfile?.earnings || state.earnings;
      })
      .addCase(getDriverProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload === 'No token found') {
          state.isAuthenticated = false;
          state.driver = null;
          state.token = null;
        }
      })
      
      // Update location cases
      .addCase(updateDriverLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload.location;
        state.lastLocationUpdate = new Date().toISOString();
      })
      
      // Toggle online status cases
      .addCase(toggleOnlineStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload.isOnline;
        if (state.driver) {
          state.driver.driverProfile.isOnline = action.payload.isOnline;
        }
      })
      
      // Get assigned orders cases
      .addCase(getAssignedOrders.fulfilled, (state, action) => {
        state.assignedOrders = action.payload;
      })
      
      // Get assigned daily orders cases
      .addCase(getAssignedDailyOrders.fulfilled, (state, action) => {
        state.dailyOrders = action.payload;
      });
  },
});

export const { logout, clearError, updateLocation, setOnlineStatus } = driverSlice.actions;

// Selectors
export const selectDriver = (state) => state.driver.driver;
export const selectDriverAuth = (state) => ({
  isAuthenticated: state.driver.isAuthenticated,
  loading: state.driver.loading,
  error: state.driver.error
});
export const selectDriverLocation = (state) => state.driver.currentLocation;
export const selectDriverOnlineStatus = (state) => state.driver.isOnline;
export const selectAssignedOrders = (state) => state.driver.assignedOrders;
export const selectAssignedDailyOrders = (state) => state.driver.dailyOrders;
export const selectDriverEarnings = (state) => state.driver.earnings;

export default driverSlice.reducer;