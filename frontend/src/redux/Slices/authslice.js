// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// const API_URL = import.meta.env.VITE_BACKEND_URL;

// // Helper function to make API calls
// const makeAPICall = async (url, options = {}) => {
//   const response = await fetch(`${API_URL}${url}`, {
//     credentials: 'include',
//     headers: {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     },
//     ...options,
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || `HTTP error! status: ${response.status}`);
//   }

//   return data;
// };

// // Regular login
// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async (credentials, { rejectWithValue }) => {
//     try {
//       const data = await makeAPICall('/api/auth/login', {
//         method: 'POST',
//         body: JSON.stringify(credentials),
//       });

//       // Store in localStorage
//       if (data.token) {
//         localStorage.setItem('token', data.token);
//       }
//       if (data.user) {
//         localStorage.setItem('user', JSON.stringify(data.user));
//       }

//       return data;
//     } catch (error) {
//       console.error('Login error:', error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Regular registration
// export const registerUser = createAsyncThunk(
//   'auth/register',
//   async (userData, { rejectWithValue }) => {
//     try {
//       const data = await makeAPICall('/api/auth/register', {
//         method: 'POST',
//         body: JSON.stringify(userData),
//       });

//       // Store in localStorage
//       if (data.token) {
//         localStorage.setItem('token', data.token);
//       }
//       if (data.user) {
//         localStorage.setItem('user', JSON.stringify(data.user));
//       }

//       return data;
//     } catch (error) {
//       console.error('Registration error:', error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Google authentication
// export const googleAuth = createAsyncThunk(
//   'auth/googleAuth',
//   async ({ token, role = 'buyer' }, { rejectWithValue }) => {
//     try {
//       const data = await makeAPICall('/api/auth/google', {
//         method: 'POST',
//         body: JSON.stringify({ token, role }),
//       });

//       // Store in localStorage
//       if (data.token) {
//         localStorage.setItem('token', data.token);
//       }
//       if (data.user) {
//         localStorage.setItem('user', JSON.stringify(data.user));
//       }

//       return data;
//     } catch (error) {
//       console.error('Google auth error:', error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Check auth status
// export const checkAuthStatus = createAsyncThunk(
//   'auth/checkStatus',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('No token found');
//       }

//       const data = await makeAPICall('/api/auth/me', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       return {
//         token,
//         user: data.user,
//         message: 'Authentication verified'
//       };
//     } catch (error) {
//       console.error('Auth verification error:', error);
//       // Clear invalid auth data
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Logout
// export const logoutUser = createAsyncThunk(
//   'auth/logout',
//   async (_, { rejectWithValue }) => {
//     try {
//       // Try to call backend logout endpoint
//       try {
//         await makeAPICall('/api/auth/logout', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//       } catch (error) {
//         console.warn('Backend logout failed (non-critical):', error);
//       }
      
//       // Clear localStorage regardless
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       sessionStorage.clear();
      
//       return { message: 'Logged out successfully' };
//     } catch (error) {
//       console.error('Logout error:', error);
//       // Still clear localStorage even if backend call fails
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       return rejectWithValue('Logout completed with errors');
//     }
//   }
// );


// // Unlink Google account
// export const unlinkGoogle = createAsyncThunk(
//   'auth/unlinkGoogle',
//   async (_, { rejectWithValue, getState }) => {
//     try {
//       const token = getState().auth.token || localStorage.getItem('token');
      
//       const data = await makeAPICall('/api/auth/google/unlink', {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       return data;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Set password for Google users
// export const setPassword = createAsyncThunk(
//   'auth/setPassword',
//   async (password, { rejectWithValue, getState }) => {
//     try {
//       const token = getState().auth.token || localStorage.getItem('token');
      
//       const data = await makeAPICall('/api/auth/set-password', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ password }),
//       });

//       return data;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Get initial state from localStorage
// const getInitialState = () => {
//   const token = localStorage.getItem('token');
//   const userStr = localStorage.getItem('user');
//   let user = null;
  
//   if (userStr) {
//     try {
//       user = JSON.parse(userStr);
//     } catch (error) {
//       console.error('Error parsing user from localStorage:', error);
//       localStorage.removeItem('user');
//     }
//   }
  
//   return {
//     user,
//     token,
//     isAuthenticated: !!token && !!user,
//     loading: false,
//     error: null,
//     googleLinked: user?.googleLinked || false,
//     requirePassword: false,
//   };
// };

// const initialState = getInitialState();

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//     clearAuth: (state) => {
//       state.user = null;
//       state.token = null;
//       state.isAuthenticated = false;
//       state.googleLinked = false;
//       state.requirePassword = false;
//       state.loading = false;
//       state.error = null;
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//     },
//     updateUser: (state, action) => {
//       if (state.user) {
//         state.user = { ...state.user, ...action.payload };
//         localStorage.setItem('user', JSON.stringify(state.user));
//         state.googleLinked = !!state.user.googleLinked;
//       }
//     },
//     setLoading: (state, action) => {
//       state.loading = action.payload;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // Login cases
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         state.googleLinked = !!action.payload.user.googleLinked;
//         state.error = null;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.error = action.payload;
//       })

//       // Register cases
//       .addCase(registerUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(registerUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         state.googleLinked = !!action.payload.user.googleLinked;
//         state.error = null;
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.error = action.payload;
//       })

//       // Google Auth cases
//       .addCase(googleAuth.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(googleAuth.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         state.googleLinked = true;
//         state.error = null;
//       })
//       .addCase(googleAuth.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.error = action.payload;
//       })

//       // Check Auth Status cases
//       .addCase(checkAuthStatus.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(checkAuthStatus.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         state.googleLinked = !!action.payload.user?.googleLinked;
//         state.error = null;
//       })
//       .addCase(checkAuthStatus.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.user = null;
//         state.token = null;
//         state.googleLinked = false;
//         state.error = action.payload;
//       })

//       // Logout cases
//       .addCase(logoutUser.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(logoutUser.fulfilled, (state) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.user = null;
//         state.token = null;
//         state.googleLinked = false;
//         state.requirePassword = false;
//         state.error = null;
//       })
//       .addCase(logoutUser.rejected, (state) => {
//         // Even if logout API fails, clear auth state
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.user = null;
//         state.token = null;
//         state.googleLinked = false;
//         state.requirePassword = false;
//         state.error = null;
//       })

//       // Unlink Google cases
//       .addCase(unlinkGoogle.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(unlinkGoogle.fulfilled, (state, action) => {
//         state.loading = false;
//         state.googleLinked = false;
//         state.requirePassword = action.payload.requirePassword || false;
//         if (state.user) {
//           state.user.googleLinked = false;
//           localStorage.setItem('user', JSON.stringify(state.user));
//         }
//         state.error = null;
//       })
//       .addCase(unlinkGoogle.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // Set Password cases
//       .addCase(setPassword.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(setPassword.fulfilled, (state) => {
//         state.loading = false;
//         state.requirePassword = false;
//         state.error = null;
//       })
//       .addCase(setPassword.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearError, clearAuth, updateUser, setLoading } = authSlice.actions;
// export default authSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Helper function to make API calls
const makeAPICall = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Regular login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await makeAPICall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Store in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Regular registration
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await makeAPICall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Store in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Google authentication
export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async ({ token, role = 'buyer' }, { rejectWithValue }) => {
    try {
      const data = await makeAPICall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token, role }),
      });

      // Store in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Google auth error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Check auth status
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }

      const data = await makeAPICall('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return {
        token,
        user: data.user,
        message: 'Authentication verified'
      };
    } catch (error) {
      console.error('Auth verification error:', error);
      // Clear invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error.message);
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Try to call backend logout endpoint
      try {
        await makeAPICall('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      } catch (error) {
        console.warn('Backend logout failed (non-critical):', error);
      }
      
      // Clear localStorage regardless
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear localStorage even if backend call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue('Logout completed with errors');
    }
  }
);

// Unlink Google account
export const unlinkGoogle = createAsyncThunk(
  'auth/unlinkGoogle',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      
      const data = await makeAPICall('/auth/google/unlink', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Set password for Google users
export const setPassword = createAsyncThunk(
  'auth/setPassword',
  async (password, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('token');
      
      const data = await makeAPICall('/auth/set-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get initial state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
    }
  }
  
  return {
    user,
    token,
    isAuthenticated: !!token && !!user, 
    loading: false,
    error: null,
    googleLinked: user?.googleLinked || false,
    requirePassword: false,
  };
};

const initialState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.googleLinked = false;
      state.requirePassword = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
        state.googleLinked = !!state.user.googleLinked;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // IMPORTANT: Add this reducer for manual login success
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.googleLinked = !!action.payload.user?.googleLinked;
      state.error = null;
      
      // Ensure localStorage is updated
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
      state.user = null;
      state.token = null;
      state.googleLinked = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.googleLinked = !!action.payload.user.googleLinked;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.googleLinked = !!action.payload.user.googleLinked;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Google Auth cases
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.googleLinked = true;
        state.error = null;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Check Auth Status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.googleLinked = !!action.payload.user?.googleLinked;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.googleLinked = false;
        state.error = action.payload;
      })

      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.googleLinked = false;
        state.requirePassword = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, clear auth state
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.googleLinked = false;
        state.requirePassword = false;
        state.error = null;
      })

      // Unlink Google cases
      .addCase(unlinkGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlinkGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.googleLinked = false;
        state.requirePassword = action.payload.requirePassword || false;
        if (state.user) {
          state.user.googleLinked = false;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        state.error = null;
      })
      .addCase(unlinkGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Set Password cases
      .addCase(setPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state) => {
        state.loading = false;
        state.requirePassword = false;
        state.error = null;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearAuth, updateUser, setLoading, loginSuccess, loginStart, loginFailure } = authSlice.actions;
export default authSlice.reducer;