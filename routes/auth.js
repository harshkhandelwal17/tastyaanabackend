
// // // server/routes/auth.js
// // const express = require('express');
// // const jwt = require('jsonwebtoken');
// // const User = require('../models/User');
// // const { authMiddleware, authenticate } = require('../middlewares/auth');
// // const { googleAuth } = require('../config/googleAuth');

// // const router = express.Router();

// // const cookieOptions = {
// //   httpOnly: true,
// //   secure: process.env.NODE_ENV === 'production',
// //   sameSite: 'lax',
// //   maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
// // };



// // // Google OAuth
// // router.post('/google', googleAuth);

// // // Refresh token
// // router.post('/refresh', authenticate, async (req, res) => {
// //   try {
// //     const token = jwt.sign(
// //       { id: req.user._id, role: req.user.role },
// //       process.env.JWT_SECRET,
// //       { expiresIn: '7d' }
// //     );

// //     res.json({ token });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });



// // //For getting current user 
// // router.get('/me', authenticate, async (req, res) => {
// //   try {
// //     const user = await User.findById(req.user._id).select('-password');
// //     res.json(user);
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });
// // // Register

// // router.post('/register', async (req, res) => {
// //   try {
// //     const { name, email, phone,role, password } = req.body;

// //     // Check if user exists
// //     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
// //     if (existingUser) {
// //       return res.status(400).json({ message: 'User already exists' });
// //     }

// //     // Create user
// //     const user = new User({
// //       name,
// //       email,
// //       phone,
// //       password: password,
// //       role
// //     });

// //     await user.save();

// //     // Generate token
// //     const token = jwt.sign(
// //       { id: user._id }, 
// //       process.env.JWT_SECRET || 'your-secret-key',
// //       { expiresIn: '30d' }
// //     );

// //     res.status(201).json({
// //       message: 'User created successfully',
// //       token,
// //       user: {
// //         id: user._id,
// //         name: user.name,
// //         email: user.email,
// //         phone: user.phone,
// //         role: user.role
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Registration error:', error);
// //     res.status(500).json({ message: 'Server error', error: error.message });
// //   }
// // });
// // // In your auth routes (routes/auth.js)
// // router.post('/google/callback', async (req, res) => {
// //   try {
// //     const { code } = req.body;
    
// //     // Exchange authorization code for tokens
// //     const { OAuth2Client } = require('google-auth-library');
// //     const client = new OAuth2Client(
// //       process.env.GOOGLE_CLIENT_ID,
// //       process.env.GOOGLE_CLIENT_SECRET,
// //       `${process.env.BACKEND_URL}/api/auth/google/callback`
// //     );

// //     const { tokens } = await client.getToken(code);
// //     const ticket = await client.verifyIdToken({
// //       idToken: tokens.id_token,
// //       audience: process.env.GOOGLE_CLIENT_ID,
// //     });

// //     // Use the same logic as your existing googleAuth function
// //     // but with the verified ticket payload
// //     const payload = ticket.getPayload();
// //     // ... rest of your existing logic

// //   } catch (error) {
// //     res.status(400).json({ 
// //       success: false, 
// //       message: 'Invalid authorization code' 
// //     });
// //   }
// // });
// // // Login
// // router.post('/login', async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     // Find user
// //     const user = await User.findOne({ email });
// //     if (!user) {
// //       return res.status(400).json({ message: 'Invalid credentials' });
// //     }

// //     if (user.isBlocked) {
// //       return res.status(403).json({ message: 'Account blocked' });
// //     }

// //     // Check password
// //     const isMatch = await user.comparePassword(password);
// //     if (!isMatch) {
// //       return res.status(400).json({ message: 'Invalid credentials' });
// //     }

// //     // Generate token
// //     const token = jwt.sign(
// //       { id: user._id }, 
// //       process.env.JWT_SECRET || 'your-secret-key',
// //       { expiresIn: '30d' }
// //     );
// //     const cookieOptions = {
// //       httpOnly: false,
// //       secure: false,
// //       sameSite: 'lax',
// //       expiresIn: new Date(Date.now() + (1 / 2) * 24 * 60 * 60 * 1000) // 30 days
// //     }

// //     res.cookie('token', token, cookieOptions);
// //     res.json({
// //       message: 'Login successful',
// //       token,
// //       user: {
// //         id: user._id,
// //         name: user.name,
// //         email: user.email,
// //         phone: user.phone,
// //         role: user.role
// //       }
// //     });
// //   } catch (error) {
// //     res.status(500).json({ message: 'Server error', error: error.message });
// //   }
// // });

// // // Get profile
// // router.get('/profile', authMiddleware, async (req, res) => {
// //   try {
// //     const user = await User.findById(req.user.id).select('-passwordHash');
// //     res.json(user);
// //   } catch (error) {
// //     res.status(500).json({ message: 'Server error', error: error.message });
// //   }
// // });

// // router.get('/google/callback', async (req, res) => {
// //   try {
// //     const { code } = req.query; // Note: GET request, so use req.query not req.body
    
// //     if (!code) {
// //       // Redirect to frontend with error
// //       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// //       return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
// //     }

// //     // Exchange the code for tokens
// //     const { OAuth2Client } = require('google-auth-library');
// //     const oauth2Client = new OAuth2Client(
// //       process.env.GOOGLE_CLIENT_ID,
// //       process.env.GOOGLE_CLIENT_SECRET,
// //       `${process.env.BACKEND_URL}/api/auth/google/callback`
// //     );

// //     const { tokens } = await oauth2Client.getToken(code);
    
// //     if (!tokens.id_token) {
// //       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// //       return res.redirect(`${frontendUrl}/auth/callback?error=no_token`);
// //     }

// //     // Verify the ID token
// //     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

// //     // Process authentication (reuse your existing logic)
// //     let user = await User.findOne({ googleId });

// //     if (user) {
// //       // User exists, update last login
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
// //           phone: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
// //           googleId,
// //           role: 'buyer',
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
// //     res.cookie('token', jwtToken, cookieOptions);

// //     // Return HTML page that communicates with parent window
// //     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
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
// //                     token: '${jwtToken}',
// //                     user: ${JSON.stringify({
// //                       id: user._id,
// //                       name: user.name,
// //                       email: user.email,
// //                       role: user.role,
// //                       avatar: user.avatar,
// //                       isEmailVerified: user.isEmailVerified,
// //                       googleLinked: !!user.googleId
// //                     })}
// //                 }, '${frontendUrl}');
// //                 window.close();
// //             } else {
// //                 // Fallback: redirect to frontend with token
// //                 window.location.href = '${frontendUrl}/?token=${jwtToken}';
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
// // });


// // // Update profile
// // router.put('/profile', authenticate, async (req, res) => {
// //   try {
// //     const { name, phone, addresses } = req.body;
    
// //     const user = await User.findByIdAndUpdate(
// //       req.user.id,
// //       { name, phone, addresses },
// //       { new: true }
// //     ).select('-passwordHash');

// //     res.json(user);
// //   } catch (error) {
// //     res.status(500).json({ message: 'Server error', error: error.message });
// //   }
// // });

// // // Logout
// // router.post('/logout', (req, res) => {
// //   res.clearCookie('token', cookieOptions);
// //   res.json({ message: 'Logged out successfully' });
// // });

// // module.exports = router;



// // routes/auth.js
// const express = require('express');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { authenticate } = require('../middlewares/auth');
// const googleAuthController = require('../controllers/googleAuthController');

// const router = express.Router();

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === 'production',
//   sameSite: 'lax',
//   maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
// };

// // Google OAuth Routes
// router.post('/google', googleAuthController.googleAuth);
// router.get('/google/callback', googleAuthController.googleAuthCallback);
// router.delete('/google/unlink', authenticate, googleAuthController.unlinkGoogle);
// router.post('/set-password', authenticate, googleAuthController.setPassword);

// // Refresh token
// router.post('/refresh', authenticate, async (req, res) => {
//   try {
//     const token = jwt.sign(
//       { id: req.user._id, role: req.user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({ 
//       success: true,
//       token 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // For getting current user 
// router.get('/me', authenticate, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password');
//     res.json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: error.message 
//     });
//   }
// });

// // Register
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, phone, role, password } = req.body;

//     // Validation
//     if (!name || !email || !phone || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'All fields are required' 
//       });
//     }

//     // Check if user exists
//     const existingUser = await User.findOne({ 
//       $or: [{ email }, { phone }] 
//     });
    
//     if (existingUser) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'User with this email or phone already exists' 
//       });
//     }

//     // Create user
//     const user = new User({
//       name,
//       email,
//       phone,
//       password, // This will be hashed by the pre-save hook
//       role: role || 'buyer'
//     });

//     await user.save();

//     // Generate token
//     const token = jwt.sign(
//       { id: user._id, role: user.role }, 
//       process.env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     // Set cookie
//     res.cookie('token', token, cookieOptions);

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Registration failed',
//       error: error.message 
//     });
//   }
// });

// // Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Email and password are required' 
//       });
//     }

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid credentials' 
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Account blocked' 
//       });
//     }

//     // Check password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid credentials' 
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate token
//     const token = jwt.sign(
//       { id: user._id, role: user.role }, 
//       process.env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     // Set cookie
//     res.cookie('token', token, cookieOptions);

//     res.json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         avatar: user.avatar,
//         googleLinked: !!user.googleId
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Login failed',
//       error: error.message 
//     });
//   }
// });

// // Get profile
// router.get('/profile', authenticate, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password');
//     res.json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to get profile',
//       error: error.message 
//     });
//   }
// });

// // Update profile
// router.put('/profile', authenticate, async (req, res) => {
//   try {
//     const { name, phone, addresses } = req.body;
    
//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { name, phone, addresses },
//       { new: true, runValidators: true }
//     ).select('-password');

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       user
//     });
//   } catch (error) {
//     console.error('Profile update error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to update profile',
//       error: error.message 
//     });
//   }
// });

// // Logout
// router.post('/logout', (req, res) => {
//   try {
//     res.clearCookie('token', {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax'
//     });
    
//     res.json({ 
//       success: true,
//       message: 'Logged out successfully' 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Logout failed' 
//     });
//   }
// });

// module.exports = router;


// routes/auth.js (Updated with correct Google OAuth routes)
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middlewares/auth');
const googleAuthController = require('../controllers/googleAuthController');
const { sendEmail, isEmailConfigured } = require('../utils/email');
const { generateOTP } = require('../utils/Otpservice');
const devOtpService = require('../utils/devOtpService');

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// OTP utility functions
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0; font-size: 28px;">🍯 Tastyaana</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Email Verification</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 24px;">Your Verification Code</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Enter this code to complete your registration</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 10px; padding: 20px; display: inline-block;">
            <h1 style="color: #ff6b35; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 0; color: #1976D2; font-size: 14px;">
            <strong>Important:</strong> This code will expire in 5 minutes for security reasons.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">© 2024 Tastyaana. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Traditional Indian Sweets | Made with Love</p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(
    email,
    'Email Verification - Tastyaana',
    html,
    `Your verification code is: ${otp}. This code will expire in 5 minutes.`
  );
};

// Google OAuth Routes
router.post('/google', googleAuthController.googleAuth);
// IMPORTANT: Use GET for OAuth callback (not POST)
router.get('/google/callback', googleAuthController.googleAuthCallback);
router.delete('/google/unlink', authenticate, googleAuthController.unlinkGoogle);
router.post('/set-password', authenticate, googleAuthController.setPassword);

// OTP Routes
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      console.log('📧 Email service not configured, using development mode');
      
      // Use development OTP service
      const result = devOtpService.generateAndStore(email);
      
      return res.json({
        success: true,
        message: 'OTP sent successfully (Development Mode)',
        devMode: true,
        // In development, return the OTP for easy testing
        ...(process.env.NODE_ENV !== 'production' && { otp: result.otp })
      });
    }

    // Generate OTP for email service
    const otp = generateOTP(6);
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStorage.set(email, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp);
      
      res.json({
        success: true,
        message: 'OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending failed, falling back to development mode:', emailError.message);
      
      // Fallback to development mode if email fails
      const result = devOtpService.generateAndStore(email);
      
      res.json({
        success: true,
        message: 'OTP sent successfully (Fallback Mode)',
        devMode: true,
        // In development, return the OTP for easy testing
        ...(process.env.NODE_ENV !== 'production' && { otp: result.otp })
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    let otpValid = false;

    // Try development OTP service first
    const devResult = devOtpService.verify(email, otp);
    if (devResult.success) {
      otpValid = true;
      console.log('📧 OTP verified using development service');
    } else {
      // Try email-based OTP storage
      const storedData = otpStorage.get(email);
      
      if (storedData) {
        // Check if OTP is expired
        if (Date.now() > storedData.expiry) {
          otpStorage.delete(email);
          return res.status(400).json({
            success: false,
            message: 'OTP has expired'
          });
        }

        // Check attempts
        if (storedData.attempts >= 3) {
          otpStorage.delete(email);
          return res.status(400).json({
            success: false,
            message: 'Too many attempts. Please request a new OTP'
          });
        }

        // Verify OTP
        if (storedData.otp === otp) {
          otpValid = true;
          otpStorage.delete(email); // Clear from email storage
          console.log('📧 OTP verified using email service');
        } else {
          storedData.attempts += 1;
          otpStorage.set(email, storedData);
          return res.status(400).json({
            success: false,
            message: 'Invalid OTP'
          });
        }
      }
    }

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired, not found, or invalid'
      });
    }

    // OTP is valid - create user
    const { name, phone, password, role = 'buyer' } = userData;

    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      isEmailVerified: true
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Clear OTP from storage
    otpStorage.delete(email);

    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Email verified and user registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      console.log('📧 Email service not configured, using development mode for resend');
      
      // Use development OTP service
      const result = devOtpService.generateAndStore(email);
      
      return res.json({
        success: true,
        message: 'OTP resent successfully (Development Mode)',
        devMode: true,
        // In development, return the OTP for easy testing
        ...(process.env.NODE_ENV !== 'production' && { otp: result.otp })
      });
    }

    // Generate new OTP for email service
    const otp = generateOTP(6);
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store new OTP
    otpStorage.set(email, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });

    // Send new OTP email
    try {
      await sendOTPEmail(email, otp);
      
      res.json({
        success: true,
        message: 'OTP resent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email resending failed, falling back to development mode:', emailError.message);
      
      // Fallback to development mode if email fails
      const result = devOtpService.generateAndStore(email);
      
      res.json({
        success: true,
        message: 'OTP resent successfully (Fallback Mode)',
        devMode: true,
        // In development, return the OTP for easy testing
        ...(process.env.NODE_ENV !== 'production' && { otp: result.otp })
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// Development route to check stored OTPs (only for development)
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/otp-status', async (req, res) => {
    try {
      const emailOtps = [];
      for (const [email, data] of otpStorage.entries()) {
        emailOtps.push({
          email,
          otp: data.otp,
          expiresAt: new Date(data.expiry),
          attempts: data.attempts,
          source: 'email'
        });
      }
      
      const devOtps = devOtpService.getAll().map(otp => ({
        ...otp,
        source: 'development'
      }));

      res.json({
        success: true,
        message: 'Development OTP Status',
        emailConfigured: isEmailConfigured(),
        otps: [...emailOtps, ...devOtps],
        totalCount: emailOtps.length + devOtps.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get OTP status',
        error: error.message
      });
    }
  });
}

// Refresh token
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// For getting current user 
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password, // This will be hashed by the pre-save hook
      role: role || 'buyer'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Account blocked' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        googleLinked: !!user.googleId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: error.message 
    });
  }
});

// Get profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get profile',
      error: error.message 
    });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, addresses },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
});

module.exports = router;