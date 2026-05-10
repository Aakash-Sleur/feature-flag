// src/controllers/super-admin.controller.ts

import type { Request, Response } from "express";
import { Organization } from "../models/organization.model.js";
import { User, UserRole } from "../models/user.model.js";
import { FeatureFlag } from "../models/feature.model.js";
import mongoose from "mongoose";

/**
 * Get all organizations with stats
 */
export const getAllOrganizations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const organizations = await Organization.find()
      .populate("admin_id", "name email role")
      .sort({ createdAt: -1 });

    // Get stats for each organization
    const organizationsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({
          organization_id: org._id,
        });
        const featureFlagCount = await FeatureFlag.countDocuments({
          organization_id: org._id,
        });

        return {
          ...org.toObject(),
          userCount,
          featureFlagCount,
        };
      })
    );

    res.json({
      success: true,
      message: "Organizations retrieved successfully",
      data: {
        organizations: organizationsWithStats,
        total: organizations.length,
      },
    });
  } catch (error) {
    console.error("Get all organizations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get organizations",
      error: "GET_ORGANIZATIONS_ERROR",
    });
  }
};

/**
 * Get organization details by ID with all associated data
 */
export const getOrganizationDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId - ensure id is a string
    const orgId = Array.isArray(id) ? id[0] : id;
    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID format",
        error: "INVALID_ORGANIZATION_ID",
      });
      return;
    }

    const organization = await Organization.findById(orgId).populate(
      "admin_id",
      "name email role createdAt"
    );

    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Get organization users
    const users = await User.find({ organization_id: orgId })
      .select("name email role createdAt is_super_admin")
      .sort({ createdAt: -1 });

    // Get organization feature flags
    const featureFlags = await FeatureFlag.find({ organization_id: orgId })
      .select("title feature_key description enabled createdAt")
      .sort({ createdAt: -1 });

    // Get stats
    const userCount = users.length;
    const adminCount = users.filter((u) => u.role === UserRole.ORG_ADMIN)
      .length;
    const endUserCount = users.filter((u) => u.role === UserRole.END_USER)
      .length;
    const featureFlagCount = featureFlags.length;
    const enabledFlags = featureFlags.filter((f) => f.enabled).length;

    res.json({
      success: true,
      message: "Organization details retrieved successfully",
      data: {
        organization: {
          ...organization.toObject(),
          stats: {
            userCount,
            adminCount,
            endUserCount,
            featureFlagCount,
            enabledFlags,
          },
        },
        users,
        featureFlags,
      },
    });
  } catch (error) {
    console.error("Get organization details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get organization details",
      error: "GET_ORGANIZATION_DETAILS_ERROR",
    });
  }
};

/**
 * Get all feature flags across all organizations
 */
export const getAllFeatureFlags = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const flags = await FeatureFlag.find()
      .populate("organization_id", "name")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    // Group by organization
    const flagsByOrg = flags.reduce(
      (acc, flag) => {
        const orgName =
          (flag.organization_id as any)?.name || "Unknown Organization";
        if (!acc[orgName]) {
          acc[orgName] = [];
        }
        acc[orgName].push(flag);
        return acc;
      },
      {} as Record<string, any[]>
    );

    res.json({
      success: true,
      message: "Feature flags retrieved successfully",
      data: {
        flags,
        flagsByOrganization: flagsByOrg,
        total: flags.length,
      },
    });
  } catch (error) {
    console.error("Get all feature flags error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feature flags",
      error: "GET_FEATURE_FLAGS_ERROR",
    });
  }
};

/**
 * Get all users across all organizations
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find()
      .populate("organization_id", "name")
      .select(
        "name email role organization_id createdAt is_super_admin updatedAt"
      )
      .sort({ createdAt: -1 });

    // Group by organization
    const usersByOrg = users.reduce(
      (acc, user) => {
        const orgName =
          (user.organization_id as any)?.name || "No Organization";
        if (!acc[orgName]) {
          acc[orgName] = [];
        }
        acc[orgName].push(user);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Get stats
    const stats = {
      totalUsers: users.length,
      superAdmins: users.filter((u) => u.is_super_admin).length,
      orgAdmins: users.filter((u) => u.role === UserRole.ORG_ADMIN).length,
      endUsers: users.filter((u) => u.role === UserRole.END_USER).length,
      unassignedUsers: users.filter((u) => !u.organization_id).length,
    };

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        usersByOrganization: usersByOrg,
        stats,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: "GET_USERS_ERROR",
    });
  }
};

/**
 * Update user role and organization assignment
 */
export const updateUserAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role, organizationId } = req.body;

    // Validate userId - ensure it's a string
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        error: "INVALID_USER_ID",
      });
      return;
    }

    // Validate organizationId if provided
    if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid organization ID format",
        error: "INVALID_ORGANIZATION_ID",
      });
      return;
    }

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role",
        error: "INVALID_ROLE",
      });
      return;
    }

    const user = await User.findById(userIdStr);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    // If organization is being changed, validate it exists
    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (!org) {
        res.status(404).json({
          success: false,
          message: "Organization not found",
          error: "ORGANIZATION_NOT_FOUND",
        });
        return;
      }
    }

    // Update user
    if (role) user.role = role;
    if (organizationId) user.organization_id = new mongoose.Types.ObjectId(organizationId);

    await user.save();

    const updatedUser = await User.findById(userIdStr)
      .populate("organization_id", "name")
      .select("name email role organization_id createdAt");

    res.json({
      success: true,
      message: "User assignment updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update user assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user assignment",
      error: "UPDATE_USER_ASSIGNMENT_ERROR",
    });
  }
};

/**
 * Get organization statistics dashboard
 */
export const getStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const totalOrganizations = await Organization.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalFeatureFlags = await FeatureFlag.countDocuments();
    const superAdminCount = await User.countDocuments({ is_super_admin: true });
    const orgAdminCount = await User.countDocuments({
      role: UserRole.ORG_ADMIN,
    });
    const endUserCount = await User.countDocuments({ role: UserRole.END_USER });
    const unassignedUsersCount = await User.countDocuments({
      organization_id: null,
    });

    // Get feature flags status
    const enabledFlags = await FeatureFlag.countDocuments({ enabled: true });
    const disabledFlags = await FeatureFlag.countDocuments({ enabled: false });

    // Get recent organizations
    const recentOrganizations = await Organization.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("admin_id", "name email");

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("organization_id", "name");

    res.json({
      success: true,
      message: "Statistics retrieved successfully",
      data: {
        overview: {
          totalOrganizations,
          totalUsers,
          totalFeatureFlags,
        },
        users: {
          superAdmins: superAdminCount,
          orgAdmins: orgAdminCount,
          endUsers: endUserCount,
          unassigned: unassignedUsersCount,
        },
        featureFlags: {
          enabled: enabledFlags,
          disabled: disabledFlags,
        },
        recentOrganizations,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get statistics",
      error: "GET_STATISTICS_ERROR",
    });
  }
};
