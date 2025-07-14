/**
 * JWT Token Generation Utility
 * Handles the generation of access and refresh tokens with proper security settings
 */

const jwt = require('jsonwebtoken');

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User object from database
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  // Validate required environment variables
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }

  // Create payload with essential user information
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'zyvo-api',
      audience: 'zyvo-users'
    }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'zyvo-api',
      audience: 'zyvo-users'
    }
  );

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate a new access token from a refresh token
 * @param {string} refreshToken - Valid refresh token
 * @returns {string} New access token
 */
const generateAccessTokenFromRefresh = (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Create new access token with same payload
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        issuer: 'zyvo-api',
        audience: 'zyvo-users'
      }
    );
  } catch (error) {
    throw new Error('Cannot generate access token from invalid refresh token');
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const expirationDate = getTokenExpiration(token);
    return Date.now() >= expirationDate.getTime();
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Get time until token expires
 * @param {string} token - JWT token
 * @returns {number} Time until expiration in milliseconds
 */
const getTimeUntilExpiration = (token) => {
  try {
    const expirationDate = getTokenExpiration(token);
    return Math.max(0, expirationDate.getTime() - Date.now());
  } catch (error) {
    return 0;
  }
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessTokenFromRefresh,
  getTokenExpiration,
  isTokenExpired,
  getTimeUntilExpiration
};
