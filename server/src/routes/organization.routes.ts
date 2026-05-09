// src/routes/organization.routes.ts

import express, { Router } from "express";
import { authenticateToken } from "../middleware/jwt.js";
import { requireSuperAdmin, requireRole, requireSameOrganization } from "../middleware/role-check.js";
import { UserRole } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { User } from "../models/user.model.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";

const router: express.Router = Router();

// All organization routes require authentication
router.use(authenticateToken);

/**
 * Get all organizations (Super Admin only)
 */
router.get("/", requireSuperAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find()
      .populate('admin_id', 'name email role')
      .sort({ createdAt: -1 });

    // Get user counts for each organization
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organization_id: org._id });
        return {
          ...org.toObject(),
          userCount,
        };
      })
    );

    res.json({
      success: true,
      message: "Organizations retrieved successfully",
      data: {
        organizations: organizationsWithCounts,
        total: organizations.length,
      },
    });
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get organizations",
      error: "GET_ORGANIZATIONS_ERROR",
    });
  }
});

/**
 * Create new organization (Super Admin only)
 */
router.post("/", requireSuperAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, admin_id } = req.body;

    // Validate required fields
    if (!name || !admin_id) {
      res.status(400).json({
        success: false,
        message: "Name and admin_id are required",
        error: "MISSING_REQUIRED_FIELDS",
      });
      return;
    }

    // Validate admin_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      res.status(400).json({
        success: false,
        message: "Invalid admin_id format",
        error: "INVALID_ADMIN_ID",
      });
      return;
    }

    // Check if admin user exists
    const adminUser = await User.findById(admin_id);
    if (!adminUser) {
      res.status(404).json({
        success: false,
        message: "Admin user not found",
        error: "ADMIN_NOT_FOUND",
      });
      return;
    }

    // Check if user is already assigned to an organization
    if (adminUser.organization_id) {
      res.status(400).json({
        success: false,
        message: "User is already assigned to an organization",
        error: "USER_ALREADY_ASSIGNED",
      });
      return;
    }

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({ name: name.trim() });
    if (existingOrg) {
      res.status(400).json({
        success: false,
        message: "Organization name already exists",
        error: "ORGANIZATION_EXISTS",
      });
      return;
    }

    // Create organization
    const organization = new Organization({
      name: name.trim(),
      admin_id,
      is_accepted: true,
    });

    await organization.save();

    // Update user to be organization admin
    await User.findByIdAndUpdate(admin_id, {
      organization_id: organization._id,
      role: UserRole.ORG_ADMIN,
    });

    // Populate admin details for response
    await organization.populate('admin_id', 'name email role');

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: {
        organization,
      },
    });
  } catch (error) {
    console.error("Create organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create organization",
      error: "CREATE_ORGANIZATION_ERROR",
    });
  }
});

/**
 * Get organization by ID (Same organization or Super Admin)
 */
router.get("/:id", requireSameOrganization(), async (req: Request, res: Response): Promise<void> => {
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

    const organization = await Organization.findById(orgId)
      .populate('admin_id', 'name email role createdAt');

    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Get organization users
    const users = await User.find({ organization_id: new mongoose.Types.ObjectId(orgId) })
      .select('name email role createdAt is_super_admin')
      .sort({ createdAt: -1 });

    // Add computed fields for users
    const usersWithRoleInfo = users.map(user => ({
      ...user.toJSON(),
      isSuperAdmin: user.is_super_admin,
      isOrganizationAdmin: user.role === UserRole.ORG_ADMIN,
    }));

    res.json({
      success: true,
      message: "Organization retrieved successfully",
      data: {
        organization: {
          ...organization.toObject(),
          userCount: users.length,
        },
        users: usersWithRoleInfo,
      },
    });
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get organization",
      error: "GET_ORGANIZATION_ERROR",
    });
  }
});

/**
 * Update organization (Org Admin or Super Admin)
 */
router.put("/:id", requireRole([UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

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

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        message: "Name is required",
        error: "MISSING_REQUIRED_FIELDS",
      });
      return;
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Check if user has permission to update this organization
    const user = (req as any).user;
    if (!user.is_super_admin && user.organization_id?.toString() !== orgId) {
      res.status(403).json({
        success: false,
        message: "You can only update your own organization",
        error: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    // Check if new name conflicts with existing organization (excluding current one)
    if (name.trim() !== organization.name) {
      const existingOrg = await Organization.findOne({ 
        name: name.trim(),
        _id: { $ne: orgId }
      });
      if (existingOrg) {
        res.status(400).json({
          success: false,
          message: "Organization name already exists",
          error: "ORGANIZATION_EXISTS",
        });
        return;
      }
    }

    // Update organization
    organization.name = name.trim();
    await organization.save();

    // Populate admin details for response
    await organization.populate('admin_id', 'name email role');

    res.json({
      success: true,
      message: "Organization updated successfully",
      data: {
        organization,
      },
    });
  } catch (error) {
    console.error("Update organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update organization",
      error: "UPDATE_ORGANIZATION_ERROR",
    });
  }
});

/**
 * Delete organization (Super Admin only)
 */
router.delete("/:id", requireSuperAdmin(), async (req: Request, res: Response): Promise<void> => {
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

    const organization = await Organization.findById(orgId);
    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Check if organization has users
    const userCount = await User.countDocuments({ organization_id: new mongoose.Types.ObjectId(orgId) });
    if (userCount > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete organization with existing users. Please remove all users first.",
        error: "ORGANIZATION_HAS_USERS",
        data: {
          userCount,
        },
      });
      return;
    }

    // Delete organization
    await Organization.findByIdAndDelete(orgId);

    res.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete organization",
      error: "DELETE_ORGANIZATION_ERROR",
    });
  }
});

/**
 * Get organization users (Org Admin or Super Admin)
 */
router.get("/:id/users", requireSameOrganization(), async (req: Request, res: Response): Promise<void> => {
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

    // Check if organization exists
    const organization = await Organization.findById(orgId);
    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Get organization users
    const users = await User.find({ organization_id: new mongoose.Types.ObjectId(orgId) })
      .select('name email role createdAt is_super_admin')
      .sort({ createdAt: -1 });

    // Add computed fields for users
    const usersWithRoleInfo = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isSuperAdmin: user.is_super_admin,
      isOrganizationAdmin: user.role === UserRole.ORG_ADMIN,
    }));

    res.json({
      success: true,
      message: "Organization users retrieved successfully",
      data: {
        users: usersWithRoleInfo,
        total: users.length,
        organization: {
          id: organization._id,
          name: organization.name,
        },
      },
    });
  } catch (error) {
    console.error("Get organization users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get organization users",
      error: "GET_ORGANIZATION_USERS_ERROR",
    });
  }
});

/**
 * Remove user from organization (Org Admin or Super Admin)
 */
router.delete("/:id/users/:userId", requireRole([UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;

    // Validate ObjectIds - ensure they are strings
    const orgId = Array.isArray(id) ? id[0] : id;
    const targetUserId = Array.isArray(userId) ? userId[0] : userId;
    
    if (!orgId || !targetUserId || !mongoose.Types.ObjectId.isValid(orgId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
      return;
    }

    // Check if organization exists
    const organization = await Organization.findById(orgId);
    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
        error: "ORGANIZATION_NOT_FOUND",
      });
      return;
    }

    // Check if user exists and belongs to this organization
    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    if (user.organization_id?.toString() !== orgId) {
      res.status(400).json({
        success: false,
        message: "User does not belong to this organization",
        error: "USER_NOT_IN_ORGANIZATION",
      });
      return;
    }

    // Check permissions
    const currentUser = (req as any).user;
    if (!currentUser.is_super_admin && currentUser.organization_id?.toString() !== orgId) {
      res.status(403).json({
        success: false,
        message: "You can only remove users from your own organization",
        error: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    // Prevent removing organization admin (unless super admin)
    if (user.role === UserRole.ORG_ADMIN && !currentUser.is_super_admin) {
      res.status(403).json({
        success: false,
        message: "Cannot remove organization admin",
        error: "CANNOT_REMOVE_ADMIN",
      });
      return;
    }

    // Prevent self-removal
    if (user._id.toString() === currentUser.id) {
      res.status(400).json({
        success: false,
        message: "Cannot remove yourself from organization",
        error: "CANNOT_REMOVE_SELF",
      });
      return;
    }

    // Remove user from organization
    await User.findByIdAndUpdate(targetUserId, {
      organization_id: null,
      role: UserRole.END_USER,
    });

    res.json({
      success: true,
      message: "User removed from organization successfully",
      data: {
        removedUser: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error("Remove user from organization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove user from organization",
      error: "REMOVE_USER_ERROR",
    });
  }
});

export default router;