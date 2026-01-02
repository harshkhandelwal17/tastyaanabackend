// // // // // 1. Update your GoogleLoginButton.jsx
// // // // import React, { useState, useEffect } from 'react';
// // // // import { useDispatch } from 'react-redux';
// // // // import { useNavigate, useLocation } from 'react-router-dom';
// // // // import { Chrome, Loader2 } from 'lucide-react';
// // // // import { googleAuth } from '../../redux/Slices/authslice';

// // // // const GoogleLoginButton = ({ isLogin = true, className = "" }) => {
// // // //   const [loading, setLoading] = useState(false);
// // // //   const [error, setError] = useState('');
// // // //   const dispatch = useDispatch();
// // // //   const navigate = useNavigate();
// // // //   const location = useLocation();
// // // //   const from = location.state?.from || "/";

// // // //   // Handle credential response from Google
// // // //   const handleCredentialResponse = async (response) => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError('');

// // // //       if (!response.credential) {
// // // //         throw new Error('No credential received from Google');
// // // //       }

// // // //       await dispatch(googleAuth({
// // // //         token: response.credential,
// // // //         role: 'buyer'
// // // //       })).unwrap();

// // // //       navigate(from, { replace: true });
// // // //     } catch (error) {
// // // //       console.error('Google Auth Error:', error);
// // // //       setError(error.message || 'Authentication failed');
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // FIXED: Direct OAuth approach with correct redirect URI
// // // //   const handleDirectOAuth = () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError('');

// // // //       const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// // // //       // FIXED: Use backend URL for redirect, not frontend
// // // //       const redirectUri = encodeURIComponent(`${import.meta.env.VITE_BACKEND_URL}/auth/google/callback`);
// // // //       const scope = encodeURIComponent('openid email profile');

// // // //       const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
// // // //         `client_id=${clientId}&` +
// // // //         `redirect_uri=${redirectUri}&` +
// // // //         `scope=${scope}&` +
// // // //         `response_type=code&` +
// // // //         `access_type=offline&` +
// // // //         `prompt=select_account`;

// // // //       // Open popup window
// // // //       const popup = window.open(
// // // //         authUrl,
// // // //         'googleSignIn',
// // // //         'width=500,height=600,scrollbars=yes,resizable=yes'
// // // //       );

// // // //       if (!popup || popup.closed || typeof popup.closed === 'undefined') {
// // // //         throw new Error('Popup blocked by browser');
// // // //       }

// // // //       // Listen for messages from popup
// // // //       const messageHandler = (event) => {
// // // //         if (event.origin !== window.location.origin) return;

// // // //         if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
// // // //           popup.close();
// // // //           // Store token and user data
// // // //           if (event.data.token) {
// // // //             localStorage.setItem('token', event.data.token);
// // // //           }
// // // //           if (event.data.user) {
// // // //             localStorage.setItem('user', JSON.stringify(event.data.user));
// // // //           }
// // // //           setLoading(false);
// // // //           navigate(from, { replace: true });
// // // //           window.removeEventListener('message', messageHandler);
// // // //         } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
// // // //           popup.close();
// // // //           setError(event.data.error || 'Authentication failed');
// // // //           setLoading(false);
// // // //           window.removeEventListener('message', messageHandler);
// // // //         }
// // // //       };

// // // //       window.addEventListener('message', messageHandler);

// // // //       // Fallback if popup doesn't communicate
// // // //       const checkInterval = setInterval(() => {
// // // //         if (popup.closed) {
// // // //           clearInterval(checkInterval);
// // // //           window.removeEventListener('message', messageHandler);
// // // //           setLoading(false);
// // // //         }
// // // //       }, 1000);
// // // //     } catch (error) {
// // // //       console.error('OAuth error:', error);
// // // //       setError(error.message || 'Failed to open Google Sign-In popup');
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className={`w-full ${className}`}>
// // // //       <button
// // // //         onClick={handleDirectOAuth}
// // // //         disabled={loading}
// // // //         className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
// // // //       >
// // // //         {loading ? (
// // // //           <Loader2 className="w-5 h-5 mr-2 animate-spin" />
// // // //         ) : (
// // // //           <Chrome className="w-5 h-5 mr-2 text-red-500" />
// // // //         )}
// // // //         {loading
// // // //           ? 'Signing in...'
// // // //           : `${isLogin ? 'Sign in' : 'Sign up'} with Google`
// // // //         }
// // // //       </button>

// // // //       {error && (
// // // //         <div className="mt-3 text-center">
// // // //           <p className="text-sm text-red-600">{error}</p>
// // // //           <button
// // // //             onClick={() => setError('')}
// // // //             className="text-xs text-blue-600 hover:text-blue-800 mt-1"
// // // //           >
// // // //             Dismiss
// // // //           </button>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // };

// // // // export default GoogleLoginButton;

// // // // GoogleLoginButton.jsx (Updated)
// // // import React, { useState, useEffect } from 'react';
// // // import { useDispatch } from 'react-redux';
// // // import { useNavigate, useLocation } from 'react-router-dom';
// // // import { Chrome, Loader2 } from 'lucide-react';
// // // import { googleAuth } from '../../redux/Slices/authslice';

// // // const GoogleLoginButton = ({ isLogin = true, className = "" }) => {
// // //   const [loading, setLoading] = useState(false);
// // //   const [error, setError] = useState('');
// // //   const dispatch = useDispatch();
// // //   const navigate = useNavigate();
// // //   const location = useLocation();
// // //   const from = location.state?.from || "/";

// // //   // Handle credential response from Google
// // //   const handleCredentialResponse = async (response) => {
// // //     try {
// // //       setLoading(true);
// // //       setError('');

// // //       if (!response.credential) {
// // //         throw new Error('No credential received from Google');
// // //       }

// // //       await dispatch(googleAuth({
// // //         token: response.credential,
// // //         role: 'buyer'
// // //       })).unwrap();

// // //       navigate(from, { replace: true });
// // //     } catch (error) {
// // //       console.error('Google Auth Error:', error);
// // //       setError(error.message || 'Authentication failed');
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // FIXED: OAuth approach with correct redirect URI and GET endpoint
// // //   const handleDirectOAuth = () => {
// // //     try {
// // //       setLoading(true);
// // //       setError('');

// // //       const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// // //       // FIXED: Use the correct backend URL with /api prefix
// // //       const redirectUri = encodeURIComponent(`${import.meta.env.VITE_BACKEND_URL}/auth/google/callback`);
// // //       const scope = encodeURIComponent('openid email profile');

// // //       const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
// // //         `client_id=${clientId}&` +
// // //         `redirect_uri=${redirectUri}&` +
// // //         `scope=${scope}&` +
// // //         `response_type=code&` +
// // //         `access_type=offline&` +
// // //         `prompt=select_account`;

// // //       console.log('Auth URL:', authUrl); // For debugging

// // //       // Open popup window
// // //       const popup = window.open(
// // //         authUrl,
// // //         'googleSignIn',
// // //         'width=500,height=600,scrollbars=yes,resizable=yes'
// // //       );

// // //       if (!popup || popup.closed || typeof popup.closed === 'undefined') {
// // //         throw new Error('Popup blocked by browser');
// // //       }

// // //       // Listen for messages from popup
// // //       const messageHandler = (event) => {
// // //         // FIXED: Check origin more carefully
// // //         const allowedOrigins = [
// // //           window.location.origin,
// // //           import.meta.env.VITE_FRONTEND_URL,
// // //           'http://localhost:5173',
// // //           'https://tastyaana.vercel.app'
// // //         ].filter(Boolean);

// // //         if (!allowedOrigins.includes(event.origin)) {
// // //           console.warn('Message from unauthorized origin:', event.origin);
// // //           return;
// // //         }

// // //         if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
// // //           popup.close();
// // //           // Store token and user data
// // //           if (event.data.token) {
// // //             localStorage.setItem('token', event.data.token);
// // //           }
// // //           if (event.data.user) {
// // //             localStorage.setItem('user', JSON.stringify(event.data.user));
// // //           }
// // //           setLoading(false);
// // //           navigate(from, { replace: true });
// // //           window.removeEventListener('message', messageHandler);
// // //         } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
// // //           popup.close();
// // //           setError(event.data.error || 'Authentication failed');
// // //           setLoading(false);
// // //           window.removeEventListener('message', messageHandler);
// // //         }
// // //       };

// // //       window.addEventListener('message', messageHandler);

// // //       // Fallback if popup doesn't communicate
// // //       const checkInterval = setInterval(() => {
// // //         if (popup.closed) {
// // //           clearInterval(checkInterval);
// // //           window.removeEventListener('message', messageHandler);
// // //           setLoading(false);
// // //         }
// // //       }, 1000);

// // //       // Clean up after 5 minutes
// // //       setTimeout(() => {
// // //         if (!popup.closed) {
// // //           popup.close();
// // //         }
// // //         clearInterval(checkInterval);
// // //         window.removeEventListener('message', messageHandler);
// // //         setLoading(false);
// // //       }, 300000); // 5 minutes

// // //     } catch (error) {
// // //       console.error('OAuth error:', error);
// // //       setError(error.message || 'Failed to open Google Sign-In popup');
// // //       setLoading(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className={`w-full ${className}`}>
// // //       <button
// // //         onClick={handleDirectOAuth}
// // //         disabled={loading}
// // //         className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
// // //       >
// // //         {loading ? (
// // //           <Loader2 className="w-5 h-5 mr-2 animate-spin" />
// // //         ) : (
// // //           <Chrome className="w-5 h-5 mr-2 text-red-500" />
// // //         )}
// // //         {loading
// // //           ? 'Signing in...'
// // //           : `${isLogin ? 'Sign in' : 'Sign up'} with Google`
// // //         }
// // //       </button>

// // //       {error && (
// // //         <div className="mt-3 text-center">
// // //           <p className="text-sm text-red-600">{error}</p>
// // //           <button
// // //             onClick={() => setError('')}
// // //             className="text-xs text-blue-600 hover:text-blue-800 mt-1"
// // //           >
// // //             Dismiss
// // //           </button>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default GoogleLoginButton;

// // // GoogleLoginButton.jsx (Fixed - No FedCM warnings)
// // import React, { useState, useEffect } from 'react';
// // import { useDispatch } from 'react-redux';
// // import { useNavigate, useLocation } from 'react-router-dom';
// // import { Chrome, Loader2 } from 'lucide-react';
// // import { googleAuth } from '../../redux/Slices/authslice';

// // const GoogleLoginButton = ({ isLogin = true, className = "" }) => {
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState('');
// //   const dispatch = useDispatch();
// //   const navigate = useNavigate();
// //   const location = useLocation();
// //   const from = location.state?.from || "/";

// //   // Initialize Google Sign-In (Legacy mode - no FedCM)
// //   useEffect(() => {
// //     const initializeGoogleSignIn = () => {
// //       if (window.google && window.google.accounts) {
// //         try {
// //           window.google.accounts.id.initialize({
// //             client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
// //             callback: handleCredentialResponse,
// //             auto_select: false,
// //             cancel_on_tap_outside: true,
// //             use_fedcm_for_prompt: false, // Disable FedCM to avoid warnings
// //           });
// //         } catch (error) {
// //           console.warn('Google One Tap initialization failed:', error);
// //         }
// //       }
// //     };

// //     // Load Google Script if not already loaded
// //     if (!window.google) {
// //       const script = document.createElement('script');
// //       script.src = 'https://accounts.google.com/gsi/client';
// //       script.async = true;
// //       script.defer = true;
// //       script.onload = initializeGoogleSignIn;
// //       script.onerror = () => {
// //         console.warn('Failed to load Google GSI script');
// //       };
// //       document.head.appendChild(script);
// //     } else {
// //       initializeGoogleSignIn();
// //     }
// //   }, []);

// //   // Handle credential response from Google One Tap
// //   const handleCredentialResponse = async (response) => {
// //     try {
// //       setLoading(true);
// //       setError('');

// //       if (!response.credential) {
// //         throw new Error('No credential received from Google');
// //       }

// //       const result = await dispatch(googleAuth({
// //         token: response.credential,
// //         role: 'buyer'
// //       })).unwrap();

// //       console.log('Google auth success:', result);
// //       navigate(from, { replace: true });
// //     } catch (error) {
// //       console.error('Google Auth Error:', error);
// //       setError(error.message || 'Authentication failed');
// //       setLoading(false);
// //     }
// //   };

// //   // Handle popup-based OAuth flow
// //   const handlePopupAuth = () => {
// //     try {
// //       setLoading(true);
// //       setError('');

// //       const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// //       const backendUrl = import.meta.env.VITE_BACKEND_URL;

// //       // FIXED: Remove duplicate /api in URL
// //       const redirectUri = encodeURIComponent(`${backendUrl}/auth/google/callback`);
// //       const scope = encodeURIComponent('openid email profile');

// //       const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
// //         `client_id=${clientId}&` +
// //         `redirect_uri=${redirectUri}&` +
// //         `scope=${scope}&` +
// //         `response_type=code&` +
// //         `access_type=offline&` +
// //         `prompt=select_account`;

// //       console.log('Opening Google Auth URL:', authUrl);

// //       // Calculate popup position (center of screen)
// //       const width = 500;
// //       const height = 600;
// //       const left = (window.screen.width / 2) - (width / 2);
// //       const top = (window.screen.height / 2) - (height / 2);

// //       // Open popup window with proper features
// //       const popup = window.open(
// //         authUrl,
// //         'googleSignIn',
// //         `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no`
// //       );

// //       if (!popup || popup.closed || typeof popup.closed === 'undefined') {
// //         throw new Error('Popup blocked. Please allow popups for this site and try again.');
// //       }

// //       // Set focus to popup
// //       popup.focus();

// //       // Listen for messages from popup
// //       const messageHandler = (event) => {
// //         // Enhanced security check for origins
// //         const allowedOrigins = [
// //           window.location.origin,
// //           import.meta.env.VITE_FRONTEND_URL,
// //           import.meta.env.VITE_BACKEND_URL,
// //           'http://localhost:5173',
// //           'http://localhost:3000',
// //           'http://localhost:5000',
// //           'https://tastyaana.vercel.app'
// //         ].filter(Boolean);

// //         if (!allowedOrigins.includes(event.origin)) {
// //           console.warn('Message from unauthorized origin:', event.origin);
// //           return;
// //         }

// //         if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
// //           popup.close();

// //           // Store token and user data
// //           if (event.data.token) {
// //             localStorage.setItem('token', event.data.token);
// //           }
// //           if (event.data.user) {
// //             localStorage.setItem('user', JSON.stringify(event.data.user));
// //           }

// //           setLoading(false);
// //           console.log('Google auth successful, navigating to:', from);

// //           // Force page reload to update auth state
// //           window.location.href = from;

// //           cleanup();

// //         } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
// //           popup.close();
// //           setError(event.data.error || 'Authentication failed');
// //           setLoading(false);
// //           cleanup();
// //         }
// //       };

// //       const cleanup = () => {
// //         window.removeEventListener('message', messageHandler);
// //         clearInterval(checkInterval);
// //         clearTimeout(timeoutId);
// //       };

// //       window.addEventListener('message', messageHandler);

// //       // Check if popup is closed manually
// //       const checkInterval = setInterval(() => {
// //         if (popup.closed) {
// //           setLoading(false);
// //           console.log('Popup was closed by user');
// //           cleanup();
// //         }
// //       }, 1000);

// //       // Clean up after 5 minutes
// //       const timeoutId = setTimeout(() => {
// //         if (!popup.closed) {
// //           popup.close();
// //         }
// //         setLoading(false);
// //         setError('Authentication timed out. Please try again.');
// //         cleanup();
// //       }, 300000); // 5 minutes

// //     } catch (error) {
// //       console.error('Popup Auth error:', error);
// //       setError(error.message || 'Failed to open Google Sign-In popup');
// //       setLoading(false);
// //     }
// //   };

// //   // Main handler - directly use popup (more reliable)
// //   const handleGoogleSignIn = () => {
// //     // Clear any previous errors
// //     setError('');

// //     // Directly use popup method (more reliable than One Tap)
// //     handlePopupAuth();
// //   };

// //   return (
// //     <div className={`w-full ${className}`}>
// //       <button
// //         onClick={handleGoogleSignIn}
// //         disabled={loading}
// //         className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
// //       >
// //         {loading ? (
// //           <Loader2 className="w-5 h-5 mr-2 animate-spin" />
// //         ) : (
// //           <Chrome className="w-5 h-5 mr-2 text-red-500" />
// //         )}
// //         {loading
// //           ? 'Signing in...'
// //           : `${isLogin ? 'Sign in' : 'Sign up'} with Google`
// //         }
// //       </button>

// //       {error && (
// //         <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
// //           <p className="text-sm text-red-600 mb-2">{error}</p>
// //           <div className="flex space-x-3">
// //             <button
// //               onClick={() => setError('')}
// //               className="text-xs text-blue-600 hover:text-blue-800"
// //             >
// //               Dismiss
// //             </button>
// //             <button
// //               onClick={handlePopupAuth}
// //               disabled={loading}
// //               className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
// //             >
// //               Try Again
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* Instructions for popup blockers */}
// //       <div className="mt-2 text-center">
// //         <p className="text-xs text-gray-500">
// //           If popup doesn't open, please allow popups for this site
// //         </p>
// //       </div>
// //     </div>
// //   );
// // };

// // export default GoogleLoginButton;

// // GoogleLoginButton.jsx (Fixed for better popup handling)
// import React, { useState, useEffect } from 'react';
// import { useDispatch } from 'react-redux';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Chrome, Loader2 } from 'lucide-react';
// import { checkAuthStatus } from '../../redux/Slices/authslice';

// const GoogleLoginButton = ({ isLogin = true, className = "" }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from || "/";

//   // Handle popup-based OAuth flow
//   const handlePopupAuth = () => {
//     try {
//       setLoading(true);
//       setError('');

//       const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
//       const backendUrl = import.meta.env.VITE_BACKEND_URL;

//       // Create the correct OAuth URL
//       const redirectUri = encodeURIComponent(`${backendUrl}/auth/google/callback`);
//       const scope = encodeURIComponent('openid email profile');

//       const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
//         `client_id=${clientId}&` +
//         `redirect_uri=${redirectUri}&` +
//         `scope=${scope}&` +
//         `response_type=code&` +
//         `access_type=offline&` +
//         `prompt=select_account`;

//       console.log('Opening Google Auth URL:', authUrl);

//       // Calculate popup position (center of screen)
//       const width = 500;
//       const height = 600;
//       const left = (window.screen.width / 2) - (width / 2);
//       const top = (window.screen.height / 2) - (height / 2);

//       // Open popup window
//       const popup = window.open(
//         authUrl,
//         'googleSignIn',
//         `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no`
//       );

//       if (!popup || popup.closed || typeof popup.closed === 'undefined') {
//         throw new Error('Popup blocked. Please allow popups for this site and try again.');
//       }

//       // Set focus to popup
//       popup.focus();

//       // Listen for messages from popup
//       const messageHandler = async (event) => {
//         // Enhanced security check for origins
//         const allowedOrigins = [
//           window.location.origin,
//           import.meta.env.VITE_FRONTEND_URL,
//           import.meta.env.VITE_BACKEND_URL,
//           'http://localhost:5173',
//           'http://localhost:3000',
//           'http://localhost:5000',
//         ].filter(Boolean);

//         console.log('Received message from:', event.origin);
//         console.log('Message data:', event.data);

//         if (!allowedOrigins.some(origin => event.origin.startsWith(origin.split('://')[0] + '://' + origin.split('://')[1].split('/')[0]))) {
//           console.warn('Message from unauthorized origin:', event.origin);
//           return;
//         }

//         if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
//           console.log('Google auth successful!');

//           try {
//             // Store token and user data
//             if (event.data.token) {
//               localStorage.setItem('token', event.data.token);
//               console.log('Token stored:', event.data.token);
//             }
//             if (event.data.user) {
//               localStorage.setItem('user', JSON.stringify(event.data.user));
//               console.log('User stored:', event.data.user);
//             }

//             // Close popup
//             if (popup && !popup.closed) {
//               popup.close();
//             }

//             setLoading(false);

//             // Refresh auth state
//             await dispatch(checkAuthStatus());

//             console.log('Navigating to:', from);
//             navigate(from, { replace: true });

//           } catch (authError) {
//             console.error('Error processing auth success:', authError);
//             setError('Authentication succeeded but failed to update app state');
//             setLoading(false);
//           }

//           cleanup();

//         } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
//           console.error('Google auth error:', event.data.error);

//           if (popup && !popup.closed) {
//             popup.close();
//           }

//           setError(event.data.error || 'Authentication failed');
//           setLoading(false);
//           cleanup();
//         }
//       };

//       const cleanup = () => {
//         window.removeEventListener('message', messageHandler);
//         clearInterval(checkInterval);
//         clearTimeout(timeoutId);
//       };

//       window.addEventListener('message', messageHandler);

//       // Check if popup is closed manually
//       const checkInterval = setInterval(() => {
//         if (popup.closed) {
//           console.log('Popup was closed by user');
//           setLoading(false);
//           cleanup();
//         }
//       }, 1000);

//       // Clean up after 5 minutes
//       const timeoutId = setTimeout(() => {
//         if (!popup.closed) {
//           popup.close();
//         }
//         setError('Authentication timed out. Please try again.');
//         setLoading(false);
//         cleanup();
//       }, 300000); // 5 minutes

//     } catch (error) {
//       console.error('Popup Auth error:', error);
//       setError(error.message || 'Failed to open Google Sign-In popup');
//       setLoading(false);
//     }
//   };

//   // Main handler
//   const handleGoogleSignIn = () => {
//     setError('');
//     handlePopupAuth();
//   };

//   return (
//     <div className={`w-full ${className}`}>
//       <button
//         onClick={handleGoogleSignIn}
//         disabled={loading}
//         className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
//       >
//         {loading ? (
//           <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//         ) : (
//           <Chrome className="w-5 h-5 mr-2 text-red-500" />
//         )}
//         {loading
//           ? 'Signing in...'
//           : `${isLogin ? 'Sign in' : 'Sign up'} with Google`
//         }
//       </button>
//       {error && (
//         <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
//           <p className="text-sm text-red-600 mb-2">{error}</p>
//           <div className="flex space-x-3">
//             <button
//               onClick={() => setError('')}
//               className="text-xs text-blue-600 hover:text-blue-800"
//             >
//               Dismiss
//             </button>
//             <button
//               onClick={handleGoogleSignIn}
//               disabled={loading}
//               className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Instructions */}
//       <div className="mt-2 text-center">
//         <p className="text-xs text-gray-500">
//           {loading ? 'Complete sign-in in the popup window' : 'Click to sign in with Google'}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default GoogleLoginButton;

import React, { useState } from "react";
import { Chrome, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
const GoogleLoginButton = ({ isLogin = true, className = "" }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    try {
      setLoading(true);

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Validate environment variables
      if (!clientId) {
        alert("Google Client ID not configured");
        setLoading(false);
        return;
      }
      if (!backendUrl) {
        alert("Backend URL not configured");
        setLoading(false);
        return;
      }

      // Create the OAuth URL for direct redirect
      const redirectUri = encodeURIComponent(
        `${backendUrl}/auth/google/callback`
      );
      const scope = encodeURIComponent("openid email profile");

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=select_account`;

      console.log("Redirecting to Google Auth:", authUrl);

      // Direct redirect - no popup, no custom UI
      window.location.href = authUrl;
    } catch (error) {
      console.error("Google Auth error:", error);
      alert("Failed to initiate Google Sign-In");
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <FcGoogle className="w-5 h-5 mr-2 text-red-500" />
        )}
        {loading
          ? "Signing in..."
          : `${isLogin ? "Sign in" : "Sign up"} with Google`}
      </button>

      {/* Simple instruction */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          {loading
            ? "Redirecting to Google..."
            : "Click to continue with Google"}
        </p>
      </div>
    </div>
  );
};

export default GoogleLoginButton;
