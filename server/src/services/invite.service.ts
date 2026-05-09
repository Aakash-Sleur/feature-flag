// src/services/invite.service.ts

import { Invite } from "../models/invite.model.js";
import { User, UserRole } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { generateTokenPair } from "../utils/jwt.js";
import { sendWelcomeEmail, sendInviteEmail } from "../utils/email.helper.js";
import logger from "../utils/logger.js";

export interface CreateOrganizationInviteData {
  organization: string;
  email: string;
  username: string;
  expired_at?: string;
}

export interface CreateUserInviteData {
  email: string;
  username: string;
  expired_at?: string;
}

export interface ConsumeInviteData {
  token: string;
  password: string;
}

export interface InviteDetails {
  email: string;
  username: string;
  is_admin: boolean;
  organization: any;
  expired_at: Date;
}

export interface ConsumeInviteResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: mongoose.Types.ObjectId;
    profile: any;
    isSuperAdmin: boolean;
    isOrganizationAdmin: boolean;
  };
  organization: {
    id: mongoose.Types.ObjectId;
    name: string;
    isNew: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Helper function to get human-readable expiration text
 */
const getExpirationText = (expirationDate: Date): string => {
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'expired';
  } else if (diffDays === 1) {
    return '1 day';
  } else if (diffDays <= 7) {
    return `${diffDays} days`;
  } else {
    const weeks = Math.ceil(diffDays / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
};

/**
 * Get invite details by token
 */
export const getInviteByToken = async (token: string): Promise<InviteDetails> => {
  if (!token) {
    throw new Error("Invite token is required");
  }

  const invite = await Invite.findOne({ 
    token, 
    is_available: true,
    expired_at: { $gt: new Date() }
  }).populate('organization_id', 'name');

  if (!invite) {
    throw new Error("Invite not found or expired");
  }

  return {
    email: invite.email,
    username: invite.username,
    is_admin: invite.is_admin,
    organization: invite.organization_id,
    expired_at: invite.expired_at,
  };
};

/**
 * Create organization invite (by super admin)
 */
export const createOrganizationInvite = async (data: CreateOrganizationInviteData, inviterName?: string): Promise<any> => {
  const { organization, email, username, expired_at } = data;

  // Validation
  if (!organization || !email || !username) {
    throw new Error("Email, username, and organization name are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Check if organization name already exists
  const existingOrg = await Organization.findOne({
    name: new RegExp(`^${organization.trim()}$`, "i"),
  });
  if (existingOrg) {
    throw new Error("Organization with this name already exists");
  }

  // Check if there's already a pending invite for this email
  const existingInvite = await Invite.findOne({
    email: email.toLowerCase(),
    is_available: true,
    expired_at: { $gt: new Date() }
  });
  if (existingInvite) {
    throw new Error("There's already a pending invite for this email");
  }

  const token = crypto.randomUUID();
  
  // Set default expiration to 7 days if not provided
  const expirationDate = expired_at ? new Date(expired_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create a temporary organization ID for the invite (will be replaced when consumed)
  const tempOrgId = new mongoose.Types.ObjectId();

  const newInvite = await Invite.create({
    organization_id: tempOrgId,
    email: email.toLowerCase(),
    username,
    is_admin: true, // Organization admin
    token,
    expired_at: expirationDate,
    is_available: true,
  });

  // Store organization name in a way we can retrieve it later
  // We'll use a temporary organization document that gets replaced when invite is consumed
  await Organization.create({
    _id: tempOrgId,
    name: organization.trim(),
    admin_id: tempOrgId, // Temporary, will be updated when invite is consumed
  });

  // Send invite email synchronously
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?invite=${token}`;
  const emailSent = await sendInviteEmail(email.toLowerCase(), {
    inviteeName: username,
    inviterName: inviterName || 'System Administrator',
    organizationName: organization.trim(),
    inviteUrl,
    role: 'Organization Administrator',
    expiresIn: getExpirationText(expirationDate),
  });

  logger.info('Organization invite created', {
    inviteId: newInvite._id,
    email: newInvite.email,
    organizationName: organization.trim(),
    token: newInvite.token,
    emailSent,
  });

  return {
    token: newInvite.token,
    email: newInvite.email,
    username: newInvite.username,
    organization: organization.trim(),
    expired_at: newInvite.expired_at,
    emailSent,
  };
};

/**
 * Create user invite (by organization admin)
 */
export const createUserInvite = async (data: CreateUserInviteData, adminUserId: string): Promise<any> => {
  const { email, username, expired_at } = data;

  // Validation
  if (!email || !username) {
    throw new Error("Email and username are required");
  }

  // Get the organization admin's organization
  const adminUser = await User.findById(adminUserId);
  if (!adminUser || !adminUser.organization_id) {
    throw new Error("Admin user must belong to an organization");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Check if there's already a pending invite for this email in this organization
  const existingInvite = await Invite.findOne({
    email: email.toLowerCase(),
    organization_id: adminUser.organization_id,
    is_available: true,
    expired_at: { $gt: new Date() }
  });
  if (existingInvite) {
    throw new Error("There's already a pending invite for this email in your organization");
  }

  const token = crypto.randomUUID();
  
  // Set default expiration to 7 days if not provided
  const expirationDate = expired_at ? new Date(expired_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newInvite = await Invite.create({
    organization_id: adminUser.organization_id,
    email: email.toLowerCase(),
    username,
    is_admin: false, // Regular user
    token,
    expired_at: expirationDate,
    is_available: true,
  });

  const organization = await Organization.findById(adminUser.organization_id);

  // Send invite email synchronously
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${token}`;
  const emailSent = await sendInviteEmail(email.toLowerCase(), {
    inviteeName: username,
    inviterName: adminUser.name,
    organizationName: organization?.name || 'Unknown Organization',
    inviteUrl,
    role: 'Team Member',
    expiresIn: getExpirationText(expirationDate),
  });

  logger.info('User invite created', {
    inviteId: newInvite._id,
    email: newInvite.email,
    organizationId: adminUser.organization_id,
    organizationName: organization?.name,
    token: newInvite.token,
    emailSent,
  });

  return {
    token: newInvite.token,
    email: newInvite.email,
    username: newInvite.username,
    organization: organization?.name,
    expired_at: newInvite.expired_at,
    emailSent,
  };
};

/**
 * Consume invite (create user and organization if needed)
 */
export const consumeInvite = async (data: ConsumeInviteData): Promise<ConsumeInviteResult> => {
  const { token, password } = data;

  // Validation
  if (!token || !password) {
    throw new Error("Token and password are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Find the invite
  const invite = await Invite.findOne({
    token,
    is_available: true,
    expired_at: { $gt: new Date() }
  }).populate('organization_id');

  if (!invite) {
    throw new Error("Invite not found or expired");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  let organizationId = invite.organization_id;
  let isNewOrganization = false;

  // Check if this is an organization creation invite (admin_id equals organization_id means temp org)
  const organization = await Organization.findById(invite.organization_id);
  if (organization && organization.admin_id.toString() === organization._id.toString()) {
    // This is a temporary organization, we need to create the real one
    isNewOrganization = true;
  }

  // Create the user
  const newUser = await User.create({
    name: invite.username,
    email: invite.email,
    password_hash: passwordHash,
    role: invite.is_admin ? UserRole.ORG_ADMIN : UserRole.END_USER,
    organization_id: organizationId,
    is_super_admin: false,
  });

  // If this is a new organization, update the organization with the real admin
  if (isNewOrganization && organization) {
    await Organization.findByIdAndUpdate(organizationId, {
      admin_id: newUser._id,
    });
  }

  // Mark invite as consumed
  await Invite.findByIdAndUpdate(invite._id, {
    is_available: false,
  });

  // Generate tokens (login the user automatically)
  const { accessToken, refreshToken } = await generateTokenPair(newUser);

  // Send welcome email (async, don't wait for it)
  sendWelcomeEmail(newUser.email, {
    name: newUser.name,
    email: newUser.email,
    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
  }).catch(error => {
    logger.error('Failed to send welcome email:', error);
  });

  logger.info('User created via invite consumption', {
    userId: newUser._id,
    organizationId: organization?._id,
    organizationName: organization?.name,
    isNewOrganization,
    inviteToken: token,
  });

  return {
    user: {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organization_id!,
      profile: newUser.profile,
      isSuperAdmin: newUser.is_super_admin,
      isOrganizationAdmin: newUser.role === UserRole.ORG_ADMIN,
    },
    organization: {
      id: organization!._id,
      name: organization!.name,
      isNew: isNewOrganization,
    },
    accessToken,
    refreshToken,
  };
};