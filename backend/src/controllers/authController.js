// ========== src/controllers/authController.js (FIXED) ==========
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  // Generate JWT tokens
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    return { accessToken, refreshToken };
  }

  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username: username.toLowerCase() }]
      });

      if (existingUser) {
        return ApiResponse.error(
          res,
          existingUser.email === email ? 'Email already exists' : 'Username already taken',
          409
        );
      }

      // Create user
      const user = new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        profile: {
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        }
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user._id);

      // Store refresh token
      user.refreshTokens.push({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await user.save();

      logger.info(`New user registered: ${username}`);

      return ApiResponse.success(
        res,
        {
          user,
          accessToken,
          refreshToken
        },
        'Registration successful',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

      if (!user || !(await user.comparePassword(password))) {
        return ApiResponse.error(res, 'Invalid credentials', 401);
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user._id);

      // Store refresh token and update last login
      user.refreshTokens.push({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.username}`);

      return ApiResponse.success(res, {
        user,
        accessToken,
        refreshToken
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.error(res, 'Refresh token required', 400);
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findOne({
        _id: decoded.userId,
        'refreshTokens.token': refreshToken
      });

      if (!user) {
        return ApiResponse.error(res, 'Invalid refresh token', 401);
      }

      // Generate new tokens
      const tokens = this.generateTokens(user._id);

      // Remove old refresh token and add new one
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      user.refreshTokens.push({
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await user.save();

      return ApiResponse.success(res, tokens, 'Token refreshed');
    } catch (error) {
      logger.error('Refresh token error:', error);
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        req.user.refreshTokens = req.user.refreshTokens.filter(
          t => t.token !== refreshToken
        );
        await req.user.save();
      }

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.userId)
        .select('-password -refreshTokens')
        .populate('clanId', 'name banner');

      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { bio, avatar, settings } = req.body;

      const updateData = {};
      if (bio !== undefined) updateData['profile.bio'] = bio;
      if (avatar !== undefined) updateData['profile.avatar'] = avatar;
      if (settings) updateData.settings = { ...req.user.settings, ...settings };

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      return ApiResponse.success(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();