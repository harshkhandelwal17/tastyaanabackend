const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        googleId: ticket.getUserId(),
        avatar: picture,
        isEmailVerified: true,
        // Generate a random phone number for Google users (can be updated later)
        // phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      });
      await user.save();
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = ticket.getUserId();
      user.avatar = picture;
      user.isEmailVerified = true;
      await user.save();
    } else if (user.googleId !== ticket.getUserId()) {
      return res.status(400).json({ message: 'This email is already registered with another Google account' });
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    res.cookie('token', authToken, cookieOptions);

    res.json({
      token: authToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};
