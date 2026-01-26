import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthService, authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { rateLimiters } from '../middleware/rateLimiter';
import { Vendor, User } from '../db/mongo';
import { logHelpers } from '../utils/logger';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    language: commonSchemas.language,
    location: z.string().min(2, 'Location is required').max(200),
    userType: commonSchemas.userType,
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  }),
};

const loginSchema = {
  body: z.object({
    identifier: z.string().min(1, 'Identifier is required'), // Can be name, phone, or ID
    password: z.string().min(1, 'Password is required'),
    userType: commonSchemas.userType,
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// Register new user (vendor or customer)
router.post('/register', 
  rateLimiters.auth,
  validateRequest(registerSchema),
  async (req, res) => {
    try {
      const { name, language, location, userType, password } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      let user;
      if (userType === 'vendor') {
        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({ name, location });
        if (existingVendor) {
          return res.status(409).json({
            success: false,
            error: 'Vendor with this name and location already exists',
            code: 'VENDOR_EXISTS',
          });
        }

        user = new Vendor({
          name,
          language,
          location,
          password: hashedPassword,
          qrCode: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } else {
        // Check if customer already exists
        const existingUser = await User.findOne({ name });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Customer with this name already exists',
            code: 'CUSTOMER_EXISTS',
          });
        }

        user = new User({
          name,
          language,
          location,
          password: hashedPassword,
        });
      }

      await user.save();

      // Generate tokens
      const accessToken = AuthService.generateToken({
        id: user._id.toString(),
        type: userType,
        language,
      });

      const refreshToken = AuthService.generateRefreshToken(user._id.toString());

      logHelpers.authSuccess(user._id.toString(), userType, req.ip);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            language: user.language,
            location: user.location,
            type: userType,
            ...(userType === 'vendor' && { qrCode: (user as any).qrCode }),
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: '24h',
          },
        },
      });
    } catch (error) {
      logHelpers.authFailure('Registration failed', req.ip, req.get('User-Agent'));
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR',
      });
    }
  }
);

// Login user
router.post('/login',
  rateLimiters.auth,
  validateRequest(loginSchema),
  async (req, res) => {
    try {
      const { identifier, password, userType } = req.body;

      let user;
      if (userType === 'vendor') {
        user = await Vendor.findOne({
          $or: [
            { name: identifier },
            { qrCode: identifier },
          ],
        });
      } else {
        user = await User.findOne({ name: identifier });
      }

      if (!user || !user.password) {
        logHelpers.authFailure('User not found', req.ip, req.get('User-Agent'));
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logHelpers.authFailure('Invalid password', req.ip, req.get('User-Agent'));
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      // Generate tokens
      const accessToken = AuthService.generateToken({
        id: user._id.toString(),
        type: userType,
        language: user.language,
      });

      const refreshToken = AuthService.generateRefreshToken(user._id.toString());

      logHelpers.authSuccess(user._id.toString(), userType, req.ip);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            language: user.language,
            location: user.location,
            type: userType,
            ...(userType === 'vendor' && { qrCode: (user as any).qrCode }),
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: '24h',
          },
        },
      });
    } catch (error) {
      logHelpers.authFailure('Login error', req.ip, req.get('User-Agent'));
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        code: 'LOGIN_ERROR',
      });
    }
  }
);

// Refresh access token
router.post('/refresh',
  rateLimiters.auth,
  validateRequest(refreshTokenSchema),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = AuthService.verifyToken(refreshToken);
      const userId = decoded.userId || decoded.id;

      // Find user
      let user = await Vendor.findById(userId);
      let userType: 'vendor' | 'customer' = 'vendor';

      if (!user) {
        user = await User.findById(userId);
        userType = 'customer';
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        });
      }

      // Generate new access token
      const accessToken = AuthService.generateToken({
        id: user._id.toString(),
        type: userType,
        language: user.language,
      });

      res.json({
        success: true,
        data: {
          accessToken,
          expiresIn: '24h',
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        code: 'TOKEN_REFRESH_ERROR',
      });
    }
  }
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const userType = req.user!.type;

      let user;
      if (userType === 'vendor') {
        user = await Vendor.findById(userId).select('-password');
      } else {
        user = await User.findById(userId).select('-password');
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          language: user.language,
          location: user.location,
          type: userType,
          ...(userType === 'vendor' && { 
            qrCode: (user as any).qrCode,
            voiceProfile: (user as any).voiceProfile,
          }),
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        code: 'PROFILE_FETCH_ERROR',
      });
    }
  }
);

// Update user profile
router.patch('/profile',
  authenticateToken,
  validateRequest({
    body: z.object({
      name: z.string().min(2).max(100).optional(),
      language: commonSchemas.language.optional(),
      location: z.string().min(2).max(200).optional(),
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const userType = req.user!.type;
      const updates = req.body;

      let user;
      if (userType === 'vendor') {
        user = await Vendor.findByIdAndUpdate(
          userId,
          { $set: updates },
          { new: true, runValidators: true }
        ).select('-password');
      } else {
        user = await User.findByIdAndUpdate(
          userId,
          { $set: updates },
          { new: true, runValidators: true }
        ).select('-password');
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          language: user.language,
          location: user.location,
          type: userType,
          ...(userType === 'vendor' && { 
            qrCode: (user as any).qrCode,
            voiceProfile: (user as any).voiceProfile,
          }),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR',
      });
    }
  }
);

// Logout (invalidate refresh token - in a real app, you'd maintain a blacklist)
router.post('/logout',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    // In a production app, you would:
    // 1. Add the refresh token to a blacklist in Redis
    // 2. Optionally add the access token to a blacklist (though it will expire naturally)
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);

export default router;