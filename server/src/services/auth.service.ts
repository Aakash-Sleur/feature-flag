// src/services/auth.service.ts

import bcrypt from "bcryptjs";
import { User, UserRole } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { 
  generateTokenPair, 
  refreshAccessToken as refreshAccessTokenUtil,
  revokeRefreshToken as revokeRefreshTokenUtil
} from "../utils/jwt.js";
import { sendWelcomeEmail } from "../utils/email.helper.js";
import logger from "../utils/logger.js";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId?: string;
    profile: any;
    isSuperAdmin: boolean;
    isOrganizationAdmin: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
  organization?: {
    id: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register new organization admin with organization
 */
export const register = async (data: RegisterData): Promise<AuthResult> => {
  const { name, email, password, organizationName } = data;

  // Validation
  if (!name || !email || !password || !organizationName) {
    throw new Error("Name, email, password, and organization name are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  if (organizationName.trim().length < 2) {
    throw new Error("Organization name must be at least 2 characters long");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please provide a valid email address");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Check if organization name already exists
  const existingOrg = await Organization.findOne({ 
    name: new RegExp(`^${organizationName.trim()}$`, 'i') 
  });
  if (existingOrg) {
    throw new Error("Organization with this name already exists");
  }

  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user first (as ORG_ADMIN)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash,
    role: UserRole.ORG_ADMIN,
    is_super_admin: false,
  });

  // Create organization with the user as admin
  const organization = await Organization.create({
    name: organizationName.trim(),
    admin_id: user._id,
  });

  // Update user with organization_id
  user.organization_id = organization._id;
  await user.save();

  const { accessToken, refreshToken } = await generateTokenPair(user);

  // Send welcome email (async, don't wait for it)
  sendWelcomeEmail(user.email, {
    name: user.name,
    email: user.email,
    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
  }).catch(error => {
    logger.error('Failed to send welcome email:', error);
  });

  logger.info('New organization admin registered', {
    userId: user._id,
    organizationId: organization._id,
    organizationName: organization.name,
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as string,
      ...(user.organization_id && { organizationId: user.organization_id.toString() }),
      profile: user.profile,
      isSuperAdmin: user.is_super_admin,
      isOrganizationAdmin: true,
    },
    organization: {
      id: organization._id.toString(),
      name: organization.name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResult> => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  logger.debug('Login attempt', { email: email.toLowerCase() });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    logger.warn('Login failed: User not found', { email: email.toLowerCase() });
    throw new Error("Invalid email or password");
  }

  logger.debug('User found, comparing password', { 
    userId: user._id,
    hasPasswordHash: !!user.password_hash,
    passwordHashLength: user.password_hash?.length 
  });

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  logger.debug('Password comparison result', { 
    userId: user._id,
    isValid: isValidPassword 
  });

  if (!isValidPassword) {
    logger.warn('Login failed: Invalid password', { 
      userId: user._id,
      email: email.toLowerCase() 
    });
    throw new Error("Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokenPair(user);
  
  logger.info('Login successful', { 
    userId: user._id,
    email: user.email,
    role: user.role 
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as string,
      ...(user.organization_id && { organizationId: user.organization_id.toString() }),
      profile: user.profile,
      isSuperAdmin: user.is_super_admin,
      isOrganizationAdmin: user.role === UserRole.ORG_ADMIN,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Get user profile
 */
export const getProfile = async (userId: string): Promise<AuthResult['user']> => {
  const user = await User.findById(userId)
    .select("-password_hash -access_token");

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as string,
    ...(user.organization_id && { organizationId: user.organization_id.toString() }),
    profile: user.profile,
    isSuperAdmin: user.is_super_admin,
    isOrganizationAdmin: user.role === UserRole.ORG_ADMIN,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // Generate new token pair
  const { accessToken, refreshToken: newRefreshToken } = await refreshAccessTokenUtil(refreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    await revokeRefreshTokenUtil(refreshToken);
  }
};