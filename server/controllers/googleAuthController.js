// // // controllers/googleAuthController.js
// // const { OAuth2Client } = require('google-auth-library');
// // const jwt = require('jsonwebtoken');
// // const User = require('../models/User');

// // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // const cookieOptions = {
// //   httpOnly: true,
// //   secure: process.env.NODE_ENV === 'production',
// //   sameSite: 'lax',
// //   maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
// // };

// // const googleAuthController = {
// //   // Google Sign In/Sign Up using ID token
// //   googleAuth: async (req, res) => {
// //     try {
// //       const { token, role = 'buyer' } = req.body;

// //       if (!token) {
// //         return res.status(400).json({ 
// //           success: false,
// //           message: 'Google token is required' 
// //         });
// //       }

// //       // Verify the Google token
// //       const ticket = await client.verifyIdToken({
// //         idToken: token,
// //         audience: process.env.GOOGLE_CLIENT_ID,
// //       });

// //       const payload = ticket.getPayload();
// //       const googleId = payload['sub'];
// //       const email = payload['email'];
// //       const name = payload['name'];
// //       const avatar = payload['picture'];
// //       const isEmailVerified = payload['email_verified'];

// //       // Process authentication with this Google identity
// //       return await processGoogleAuthentication(
// //         res, 
// //         { googleId, email, name, avatar, isEmailVerified, role }
// //       );
// //     } catch (error) {
// //       console.error('Google Auth Error:', error);
      
// //       if (error.message && error.message.includes('Token used too early')) {
// //         return res.status(400).json({ 
// //           success: false,
// //           message: 'Invalid Google token. Please try again.' 
// //         });
// //       }

// //       res.status(500).json({ 
// //         success: false,
// //         message: 'Google authentication failed. Please try again.' 
// //       });
// //     }
// //   },

// //   // Google OAuth flow callback
// //   googleAuthCallback: async (req, res) => {
// //   try {
// //     const { code } = req.query; // Note: GET request, so use req.query not req.body
    
// //     if (!code) {
// //       // Redirect to frontend with error
// //       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// //       return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
// //     }

// //     // Exchange the code for tokens
// //     const oauth2Client = new OAuth2Client(
// //       process.env.GOOGLE_CLIENT_ID,
// //       process.env.GOOGLE_CLIENT_SECRET,
// //       `${process.env.BACKEND_URL}api/auth/google/callback`
// //     );

// //     const { tokens } = await oauth2Client.getToken(code);
    
// //     if (!tokens.id_token) {
// //       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// //       return res.redirect(`${frontendUrl}/auth/callback?error=no_token`);
// //     }

// //     // Verify the ID token
// //     const ticket = await client.verifyIdToken({
// //       idToken: tokens.id_token,
// //       audience: process.env.GOOGLE_CLIENT_ID,
// //     });

// //     const payload = ticket.getPayload();
// //     const googleId = payload['sub'];
// //     const email = payload['email'];
// //     const name = payload['name'];
// //     const avatar = payload['picture'];
// //     const isEmailVerified = payload['email_verified'];

// //     // Process authentication
// //     const result = await processGoogleAuthentication(
// //       res, 
// //       { googleId, email, name, avatar, isEmailVerified, role: 'buyer' }
// //     );

// //     // FIXED: Return HTML page that communicates with parent window
// //     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
// //     // If this is a popup callback, send message to parent window
// //     const htmlResponse = `
// //     <!DOCTYPE html>
// //     <html>
// //     <head>
// //         <title>Google Sign-In</title>
// //     </head>
// //     <body>
// //         <script>
// //             if (window.opener) {
// //                 window.opener.postMessage({
// //                     type: 'GOOGLE_AUTH_SUCCESS',
// //                     token: '${result.token}',
// //                     user: ${JSON.stringify(result.user)}
// //                 }, '${frontendUrl}');
// //                 window.close();
// //             } else {
// //                 // Fallback: redirect to frontend with token
// //                 window.location.href = '${frontendUrl}/?token=${result.token}';
// //             }
// //         </script>
// //         <p>Authenticating... Please wait.</p>
// //     </body>
// //     </html>`;
    
// //     res.send(htmlResponse);

// //   } catch (error) {
// //     console.error('Google OAuth Callback Error:', error);
    
// //     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// //     const htmlResponse = `
// //     <!DOCTYPE html>
// //     <html>
// //     <head>
// //         <title>Google Sign-In Error</title>
// //     </head>
// //     <body>
// //         <script>
// //             if (window.opener) {
// //                 window.opener.postMessage({
// //                     type: 'GOOGLE_AUTH_ERROR',
// //                     error: 'Authentication failed'
// //                 }, '${frontendUrl}');
// //                 window.close();
// //             } else {
// //                 window.location.href = '${frontendUrl}/login?error=auth_failed';
// //             }
// //         </script>
// //         <p>Authentication failed. Redirecting...</p>
// //     </body>
// //     </html>`;
    
// //     res.send(htmlResponse);
// //   }
// // },
// //   // Unlink Google Account
// //   unlinkGoogle: async (req, res) => {
// //     try {
// //       const user = await User.findById(req.user.id);
      
// //       if (!user) {
// //         return res.status(404).json({
// //           success: false,
// //           message: 'User not found'
// //         });
// //       }

// //       if (!user.googleId) {
// //         return res.status(400).json({
// //           success: false,
// //           message: 'No Google account linked'
// //         });
// //       }

// //       // Check if user has password, if not, require them to set one
// //       if (!user.password) {
// //         return res.status(400).json({
// //           success: false,
// //           message: 'Please set a password before unlinking Google account',
// //           requirePassword: true
// //         });
// //       }

// //       // Remove Google ID
// //       user.googleId = undefined;
// //       await user.save();

// //       res.json({
// //         success: true,
// //         message: 'Google account unlinked successfully'
// //       });

// //     } catch (error) {
// //       console.error('Unlink Google Error:', error);
// //       res.status(500).json({
// //         success: false,
// //         message: 'Failed to unlink Google account'
// //       });
// //     }
// //   },

// //   // Set password for Google users
// //   setPassword: async (req, res) => {
// //     try {
// //       const { password } = req.body;
      
// //       if (!password || password.length < 8) {
// //         return res.status(400).json({
// //           success: false,
// //           message: 'Password must be at least 8 characters long'
// //         });
// //       }

// //       const user = await User.findById(req.user.id);
      
// //       if (!user) {
// //         return res.status(404).json({
// //           success: false,
// //           message: 'User not found'
// //         });
// //       }

// //       if (user.password) {
// //         return res.status(400).json({
// //           success: false,
// //           message: 'Password already set. Use change password instead.'
// //         });
// //       }

// //       // Hash and set password (will be handled by pre-save hook)
// //       user.password = password;
// //       await user.save();

// //       res.json({
// //         success: true,
// //         message: 'Password set successfully'
// //       });

// //     } catch (error) {
// //       console.error('Set Password Error:', error);
// //       res.status(500).json({
// //         success: false,
// //         message: 'Failed to set password'
// //       });
// //     }
// //   }
// // };

// // // Helper function to process Google authentication
// // async function processGoogleAuthentication(res, { googleId, email, name, avatar, isEmailVerified, role }) {
// //   try {
// //     // Check if user already exists with this Google ID
// //     let user = await User.findOne({ googleId });

// //     if (user) {
// //       // User exists, update last login and sign them in
// //       user.lastLogin = new Date();
// //       if (avatar && !user.avatar) {
// //         user.avatar = avatar;
// //       }
// //       await user.save();
// //     } else {
// //       // Check if user exists with same email (but no Google ID)
// //       user = await User.findOne({ email });

// //       if (user) {
// //         // Link Google account to existing user
// //         user.googleId = googleId;
// //         user.lastLogin = new Date();
// //         if (avatar && !user.avatar) {
// //           user.avatar = avatar;
// //         }
// //         if (isEmailVerified) {
// //           user.isEmailVerified = true;
// //         }
// //         await user.save();
// //       } else {
// //         // Create new user
// //         user = new User({
// //           name,
// //           email,
// //           // Generate a random phone number if the phone is required
// //           phone: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
// //           googleId,
// //           role,
// //           avatar,
// //           isEmailVerified: isEmailVerified || false,
// //           lastLogin: new Date()
// //         });

// //         await user.save();
// //       }
// //     }

// //     // Generate JWT
// //     const jwtToken = jwt.sign(
// //       { id: user._id, role: user.role },
// //       process.env.JWT_SECRET,
// //       { expiresIn: '30d' }
// //     );

// //     // Set JWT as httpOnly cookie
// //     const cookieOptions = {
// //       httpOnly: true,
// //       secure: process.env.NODE_ENV === 'production',
// //       sameSite: 'lax',
// //       maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
// //     };
    
// //     res.cookie('token', jwtToken, cookieOptions);

// //     // Return the result instead of sending response
// //     return {
// //       success: true,
// //       message: 'Authentication successful',
// //       token: jwtToken,
// //       user: {
// //         id: user._id,
// //         name: user.name,
// //         email: user.email,
// //         role: user.role,
// //         avatar: user.avatar,
// //         isEmailVerified: user.isEmailVerified,
// //         googleLinked: !!user.googleId
// //       }
// //     };
// //   } catch (error) {
// //     console.error('Google Auth Processing Error:', error);
// //     throw error;
// //   }
// // }

// // module.exports = googleAuthController;

// // controllers/googleAuthController.js
// const { OAuth2Client } = require('google-auth-library');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === 'production',
//   sameSite: 'lax',
//   maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
// };

// const googleAuthController = {
//   // Google Sign In/Sign Up using ID token (for frontend Google button)
//   googleAuth: async (req, res) => {
//     try {
//       const { token, role = 'buyer' } = req.body;

//       if (!token) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'Google token is required' 
//         });
//       }

//       // Verify the Google token
//       const ticket = await client.verifyIdToken({
//         idToken: token,
//         audience: process.env.GOOGLE_CLIENT_ID,
//       });

//       const payload = ticket.getPayload();
//       const googleId = payload['sub'];
//       const email = payload['email'];
//       const name = payload['name'];
//       const avatar = payload['picture'];
//       const isEmailVerified = payload['email_verified'];

//       // Process authentication
//       const result = await processGoogleAuthentication(
//         res, 
//         { googleId, email, name, avatar, isEmailVerified, role }
//       );

//       res.json(result);
//     } catch (error) {
//       console.error('Google Auth Error:', error);
      
//       if (error.message && error.message.includes('Token used too early')) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'Invalid Google token. Please try again.' 
//         });
//       }

//       res.status(500).json({ 
//         success: false,
//         message: 'Google authentication failed. Please try again.' 
//       });
//     }
//   },

//   // Google OAuth flow callback (for redirect-based auth)
//   googleAuthCallback: async (req, res) => {
//     try {
//       const { code } = req.query;
      
//       if (!code) {
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
//         return res.redirect(`${frontendUrl}/login?error=no_code`);
//       }

//       // Exchange the code for tokens
//       const oauth2Client = new OAuth2Client(
//         process.env.GOOGLE_CLIENT_ID,
//         process.env.GOOGLE_CLIENT_SECRET,
//         `${process.env.BACKEND_URL}/api/auth/google/callback`
//       );

//       const { tokens } = await oauth2Client.getToken(code);
      
//       if (!tokens.id_token) {
//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
//         return res.redirect(`${frontendUrl}/login?error=no_token`);
//       }

//       // Verify the ID token
//       const ticket = await client.verifyIdToken({
//         idToken: tokens.id_token,
//         audience: process.env.GOOGLE_CLIENT_ID,
//       });

//       const payload = ticket.getPayload();
//       const googleId = payload['sub'];
//       const email = payload['email'];
//       const name = payload['name'];
//       const avatar = payload['picture'];
//       const isEmailVerified = payload['email_verified'];

//       // Process authentication
//       const result = await processGoogleAuthentication(
//         res, 
//         { googleId, email, name, avatar, isEmailVerified, role: 'buyer' }
//       );

//       // Return HTML page that communicates with parent window
//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
//       const htmlResponse = `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>Google Sign-In</title>
//     <meta charset="utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//     <style>
//       body {
//         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         min-height: 100vh;
//         margin: 0;
//         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//       }
//       .container {
//         text-align: center;
//         background: white;
//         padding: 2rem;
//         border-radius: 12px;
//         box-shadow: 0 10px 25px rgba(0,0,0,0.1);
//         max-width: 400px;
//         margin: 1rem;
//       }
//       .spinner {
//         border: 3px solid #f3f3f3;
//         border-top: 3px solid #4285f4;
//         border-radius: 50%;
//         width: 40px;
//         height: 40px;
//         animation: spin 1s linear infinite;
//         margin: 0 auto 1rem;
//       }
//       @keyframes spin {
//         0% { transform: rotate(0deg); }
//         100% { transform: rotate(360deg); }
//       }
//       .success-icon {
//         color: #4CAF50;
//         font-size: 48px;
//         margin-bottom: 1rem;
//       }
//       .error-icon {
//         color: #f44336;
//         font-size: 48px;
//         margin-bottom: 1rem;
//       }
//       .message {
//         color: #333;
//         font-size: 16px;
//         margin-bottom: 1rem;
//       }
//       .submessage {
//         color: #666;
//         font-size: 14px;
//       }
//     </style>
// </head>
// <body>
//     <div class="container">
//       <div class="spinner"></div>
//       <div class="message">Authenticating with Google...</div>
//       <div class="submessage">Please wait while we sign you in</div>
//     </div>
//     <script>
//         console.log('Starting auth callback processing...');
        
//         // Get the data from the server
//         const authData = {
//           success: ${result.success},
//           token: ${JSON.stringify(result.token)},
//           user: ${JSON.stringify(result.user)},
//           message: ${JSON.stringify(result.message)}
//         };
        
//         const frontendUrl = '${frontendUrl}';
        
//         console.log('Auth data:', authData);
        
//         function updateUI(type, message, submessage = '') {
//           const container = document.querySelector('.container');
//           const iconClass = type === 'success' ? 'success-icon' : 'error-icon';
//           const icon = type === 'success' ? '✓' : '✗';
          
//           container.innerHTML = \`
//             <div class="\${iconClass}">\${icon}</div>
//             <div class="message">\${message}</div>
//             <div class="submessage">\${submessage}</div>
//           \`;
//         }
        
//         function handleAuthSuccess() {
//           console.log('Processing auth success...');
          
//           updateUI('success', 'Authentication Successful!', 'Redirecting...');
          
//           // Try to communicate with parent window first
//           if (window.opener && !window.opener.closed) {
//             console.log('Sending success message to parent window');
            
//             try {
//               // Send message to parent window
//               window.opener.postMessage({
//                 type: 'GOOGLE_AUTH_SUCCESS',
//                 token: authData.token,
//                 user: authData.user
//               }, frontendUrl);
              
//               console.log('Message sent to parent, closing popup in 1.5s');
//               setTimeout(() => {
//                 window.close();
//               }, 1500);
              
//             } catch (error) {
//               console.error('Error sending message to parent:', error);
//               redirectToFrontend();
//             }
//           } else {
//             console.log('No parent window, redirecting to frontend');
//             redirectToFrontend();
//           }
//         }
        
//         function redirectToFrontend() {
//           // Store token in localStorage as fallback
//           try {
//             if (authData.token) {
//               localStorage.setItem('token', authData.token);
//             }
//             if (authData.user) {
//               localStorage.setItem('user', JSON.stringify(authData.user));
//             }
//           } catch (e) {
//             console.warn('Could not store in localStorage:', e);
//           }
          
//           // Redirect to frontend dashboard or home
//           setTimeout(() => {
//             window.location.href = \`\${frontendUrl}/\`;
//           }, 1000);
//         }
        
//         function handleAuthError(error) {
//           console.error('Auth error:', error);
          
//           updateUI('error', 'Authentication Failed', 'Please try again');
          
//           if (window.opener && !window.opener.closed) {
//             try {
//               window.opener.postMessage({
//                 type: 'GOOGLE_AUTH_ERROR',
//                 error: error || 'Authentication failed'
//               }, frontendUrl);
              
//               setTimeout(() => {
//                 window.close();
//               }, 2000);
//             } catch (e) {
//               console.error('Error sending error message to parent:', e);
//               setTimeout(() => {
//                 window.location.href = \`\${frontendUrl}/login?error=auth_failed\`;
//               }, 2000);
//             }
//           } else {
//             setTimeout(() => {
//               window.location.href = \`\${frontendUrl}/login?error=auth_failed\`;
//             }, 2000);
//           }
//         }
        
//         // Main execution
//         try {
//           if (authData.success && authData.token) {
//             handleAuthSuccess();
//           } else {
//             handleAuthError('Authentication failed - no token received');
//           }
//         } catch (error) {
//           console.error('Unexpected error:', error);
//           handleAuthError('Unexpected error occurred');
//         }
//     </script>
// </body>
// </html>`;

//       res.send(htmlResponse);

//     } catch (error) {
//       console.error('Google OAuth Callback Error:', error);
      
//       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
//       const htmlResponse = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//           <title>Google Sign-In Error</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               min-height: 100vh;
//               margin: 0;
//               background-color: #f5f5f5;
//             }
//             .container {
//               text-align: center;
//               background: white;
//               padding: 2rem;
//               border-radius: 8px;
//               box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//             }
//             .error {
//               color: #e74c3c;
//               margin-bottom: 1rem;
//             }
//           </style>
//       </head>
//       <body>
//           <div class="container">
//             <div class="error">Authentication failed. Redirecting...</div>
//           </div>
//           <script>
//               try {
//                 if (window.opener && !window.opener.closed) {
//                     window.opener.postMessage({
//                         type: 'GOOGLE_AUTH_ERROR',
//                         error: 'Authentication failed'
//                     }, '${frontendUrl}');
//                     window.close();
//                 } else {
//                     window.location.href = '${frontendUrl}/login?error=auth_failed';
//                 }
//               } catch (error) {
//                 window.location.href = '${frontendUrl}/login?error=callback_failed';
//               }
//           </script>
//       </body>
//       </html>`;
      
//       res.send(htmlResponse);
//     }
//   },

//   // Unlink Google Account
//   unlinkGoogle: async (req, res) => {
//     try {
//       const user = await User.findById(req.user.id);
      
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       if (!user.googleId) {
//         return res.status(400).json({
//           success: false,
//           message: 'No Google account linked'
//         });
//       }

//       // Check if user has password, if not, require them to set one
//       if (!user.password) {
//         return res.status(400).json({
//           success: false,
//           message: 'Please set a password before unlinking Google account',
//           requirePassword: true
//         });
//       }

//       // Remove Google ID
//       user.googleId = undefined;
//       await user.save();

//       res.json({
//         success: true,
//         message: 'Google account unlinked successfully'
//       });

//     } catch (error) {
//       console.error('Unlink Google Error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to unlink Google account'
//       });
//     }
//   },

//   // Set password for Google users
//   setPassword: async (req, res) => {
//     try {
//       const { password } = req.body;
      
//       if (!password || password.length < 8) {
//         return res.status(400).json({
//           success: false,
//           message: 'Password must be at least 8 characters long'
//         });
//       }

//       const user = await User.findById(req.user.id);
      
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       if (user.password) {
//         return res.status(400).json({
//           success: false,
//           message: 'Password already set. Use change password instead.'
//         });
//       }

//       // Hash and set password (will be handled by pre-save hook)
//       user.password = password;
//       await user.save();

//       res.json({
//         success: true,
//         message: 'Password set successfully'
//       });

//     } catch (error) {
//       console.error('Set Password Error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to set password'
//       });
//     }
//   }
// };

// // Helper function to process Google authentication
// async function processGoogleAuthentication(res, { googleId, email, name, avatar, isEmailVerified, role }) {
//   try {
//     // Check if user already exists with this Google ID
//     let user = await User.findOne({ googleId });

//     if (user) {
//       // User exists, update last login and sign them in
//       user.lastLogin = new Date();
//       if (avatar && !user.avatar) {
//         user.avatar = avatar;
//       }
//       await user.save();
//     } else {
//       // Check if user exists with same email (but no Google ID)
//       user = await User.findOne({ email });

//       if (user) {
//         // Link Google account to existing user
//         user.googleId = googleId;
//         user.lastLogin = new Date();
//         if (avatar && !user.avatar) {
//           user.avatar = avatar;
//         }
//         if (isEmailVerified) {
//           user.isEmailVerified = true;
//         }
//         await user.save();
//       } else {
//         // Create new user - this handles auto signup
//         user = new User({
//           name,
//           email,
//           // Generate a random phone number for now (you might want to collect this later)
//           phone: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
//           googleId,
//           role,
//           avatar,
//           isEmailVerified: isEmailVerified || false,
//           lastLogin: new Date(),
//           // Don't set password - Google users can login without password
//         });

//         await user.save();
//         console.log('New Google user created:', user.email);
//       }
//     }

//     // Generate JWT
//     const jwtToken = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     // Set JWT as httpOnly cookie
//     res.cookie('token', jwtToken, cookieOptions);

//     // Return the result
//     return {
//       success: true,
//       message: user.googleId ? 'Login successful' : 'Account created and logged in successfully',
//       token: jwtToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar,
//         isEmailVerified: user.isEmailVerified,
//         googleLinked: !!user.googleId,
//         phone: user.phone
//       }
//     };
//   } catch (error) {
//     console.error('Google Auth Processing Error:', error);
//     throw error;
//   }
// }

// module.exports = googleAuthController;


const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const googleAuthController = {
  // Google Sign In/Sign Up using ID token (for frontend Google button)
  googleAuth: async (req, res) => {
    try {
      const { token, role = 'buyer' } = req.body;

      if (!token) {
        return res.status(400).json({ 
          success: false,
          message: 'Google token is required' 
        });
      }

      // Verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload['sub'];
      const email = payload['email'];
      const name = payload['name'];
      const avatar = payload['picture'];
      const isEmailVerified = payload['email_verified'];

      // Process authentication
      const result = await processGoogleAuthentication(
        res, 
        { googleId, email, name, avatar, isEmailVerified, role }
      );

      res.json(result);
    } catch (error) {
      console.error('Google Auth Error:', error);
      
      if (error.message && error.message.includes('Token used too early')) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid Google token. Please try again.' 
        });
      }

      res.status(500).json({ 
        success: false,
        message: 'Google authentication failed. Please try again.' 
      });
    }
  },

  // UPDATED Google OAuth flow callback
// Updated googleAuthCallback method - Simple redirect to React callback

googleAuthCallback: async (req, res) => {
  try {
    const { code } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (!code) {
      console.log('No authorization code received');
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    console.log('Processing Google OAuth callback with code:', code);

    // Exchange the code for tokens
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.id_token) {
      console.log('No ID token received');
      return res.redirect(`${frontendUrl}/login?error=no_token`);
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const avatar = payload['picture'];
    const isEmailVerified = payload['email_verified'];

    console.log('Google user data:', { email, name });

    // Process authentication
    const result = await processGoogleAuthentication(
      res, 
      { googleId, email, name, avatar, isEmailVerified, role: 'buyer' }
    );

    console.log('Authentication result:', { success: result.success, email: result.user?.email });

    // Redirect directly to home page with authentication data
    if (result.success) {
      const userDataForUrl = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar,
        googleLinked: true,
        walletBalance: result.user.walletBalance || 0
      };
      
      // Redirect to home page with encoded data
      if(result.user.role=='seller'){
      const redirectUrl = `${frontendUrl}/seller/dashboard?` + new URLSearchParams({
        auth: 'success',
        token: result.token,
        user: JSON.stringify(userDataForUrl)
      }).toString();
      
      return res.redirect(redirectUrl);}
      else if(result.user.role=='delivery'||result.user.role=='driver'){
         const redirectUrl = `${frontendUrl}/driver/orders/accept?` + new URLSearchParams({
        auth: 'success',
        token: result.token,
        user: JSON.stringify(userDataForUrl)
      }).toString();
      
      return res.redirect(redirectUrl);
      }
      else{
        const redirectUrl = `${frontendUrl}/?` + new URLSearchParams({
        auth: 'success',
        token: result.token,
        user: JSON.stringify(userDataForUrl)
      }).toString();
      
      return res.redirect(redirectUrl)
      }
    } else {
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=callback_failed`);
  }
},
  

  // Unlink Google Account
  unlinkGoogle: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.googleId) {
        return res.status(400).json({
          success: false,
          message: 'No Google account linked'
        });
      }

      // Check if user has password, if not, require them to set one
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Please set a password before unlinking Google account',
          requirePassword: true
        });
      }

      // Remove Google ID
      user.googleId = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Google account unlinked successfully'
      });

    } catch (error) {
      console.error('Unlink Google Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlink Google account'
      });
    }
  },

  // Set password for Google users
  setPassword: async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password already set. Use change password instead.'
        });
      }

      // Hash and set password (will be handled by pre-save hook)
      user.password = password;
      await user.save();

      res.json({
        success: true,
        message: 'Password set successfully'
      });

    } catch (error) {
      console.error('Set Password Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set password'
      });
    }
  }
};

// Helper function to process Google authentication
async function processGoogleAuthentication(res, { googleId, email, name, avatar, isEmailVerified, role }) {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, update last login and sign them in
      user.lastLogin = new Date();
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
      console.log('Existing Google user logged in:', user.email);
    } else {
      // Check if user exists with same email (but no Google ID)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.lastLogin = new Date();
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        if (isEmailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();
        console.log('Google account linked to existing user:', user.email);
      } else {
        // Create new user - this handles auto signup
        // Note: Google OAuth doesn't provide phone numbers, so we'll use a placeholder
        // Users can update their phone number later in their profile
        user = new User({
          name,
          email,
          // Use a placeholder phone number since Google OAuth doesn't provide phone numbers
          // Users can update this in their profile settings
          // phone: '0000000000', // Placeholder - user should update this
          googleId,
          role,
          avatar,
          isEmailVerified: isEmailVerified || false,
          lastLogin: new Date(),
          // Don't set password - Google users can login without password
        });

        await user.save();
        console.log('New Google user created:', user.email);
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set JWT as httpOnly cookie
    res.cookie('token', jwtToken, cookieOptions);

    console.log('JWT token generated and cookie set for user:', user.email);

    // Return the result
    return {
      success: true,
      message: user.googleId ? 'Login successful' : 'Account created and logged in successfully',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        googleLinked: !!user.googleId,
        // phone: user.phone,
        walletBalance: user.walletBalance || 0
      }
    };
  } catch (error) {
    console.error('Google Auth Processing Error:', error);
    throw error;
  }
}

module.exports = googleAuthController;