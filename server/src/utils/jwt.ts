// src/utils/jwt.ts

import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION } from "../config/config.js";
import { RefreshToken } from "../models/refresh_token.model.js";
import { User } from "../models/user.model.js";
import type { UserDocument } from "../models/user.model.js";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | undefined;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
    throw new Error("JWT_SECRET is not defined or invalid");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const accessTokenOptions: any = {
    expiresIn: JWT_ACCESS_EXPIRATION,
    issuer: "assignment-app",
    audience: "assignment-users",
  };

  return jwt.sign(payload, JWT_SECRET as string, accessTokenOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (user: UserDocument): Promise<TokenPair> => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organization_id?.toString(),
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  // Calculate expiration date for refresh token
  const expiresAt = new Date();
  const refreshExpirationMs = JWT_REFRESH_EXPIRATION === "7d" ? 7 * 24 * 60 * 60 * 1000 : 
                              parseInt(JWT_REFRESH_EXPIRATION) * 1000;
  expiresAt.setTime(expiresAt.getTime() + refreshExpirationMs);

  // Store refresh token in database
  await RefreshToken.create({
    user_id: user._id,
    token: refreshToken,
    expires_at: expiresAt,
  });

  // Update user's access token
  await User.findByIdAndUpdate(user._id, { access_token: accessToken });

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
    throw new Error("JWT_SECRET is not defined or invalid");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      issuer: "assignment-app",
      audience: "assignment-users",
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    }
    throw error;
  }
};

/**
 * Verify refresh token and generate new token pair
 */
export const refreshAccessToken = async (refreshToken: string): Promise<TokenPair> => {
  // Find refresh token in database
  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  
  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  // Check if token is expired
  if (storedToken.expires_at < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new Error("Refresh token expired");
  }

  // Get user
  const user = await User.findById(storedToken.user_id);
  if (!user) {
    throw new Error("User not found");
  }

  // Delete old refresh token
  await RefreshToken.deleteOne({ _id: storedToken._id });

  // Generate new token pair
  return generateTokenPair(user);
};

/**
 * Revoke refresh token (logout)
 */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  await RefreshToken.deleteOne({ token: refreshToken });
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ user_id: userId });
  await User.findByIdAndUpdate(userId, { access_token: null });
};

/**
 * Clean up expired refresh tokens
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  await RefreshToken.deleteMany({ expires_at: { $lt: new Date() } });
};