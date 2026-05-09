// src/middleware/role-check.ts

import type { Request, Response, NextFunction } from "express";
import { UserRole, User } from "../models/user.model.js";
import logger from "../utils/logger.js";

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param requireSuperAdmin - If true, only super admins can access (overrides allowedRoles)
 * @param requireOrgAdmin - If true, requires user to be an organization admin
 */
export const requireRole = (
  allowedRoles: UserRole[] = [],
  options: {
    requireSuperAdmin?: boolean;
    requireOrgAdmin?: boolean;
    allowSameOrganization?: boolean;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated (should be handled by authenticateToken middleware first)
      if (!req.user) {
        logger.warn('Role check failed: No authenticated user', {
          path: req.path,
          method: req.method,
        });
        res.status(401).json({
          success: false,
          message: "Authentication required",
          error: "NOT_AUTHENTICATED",
        });
        return;
      }

      // Fetch full user data from database to get is_super_admin and other properties
      const user = await User.findById(req.user._id).select("-password_hash");
      if (!user) {
        logger.warn('Role check failed: User not found in database', {
          userId: req.user._id,
          path: req.path,
        });
        res.status(401).json({
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        });
        return;
      }

      const { requireSuperAdmin, requireOrgAdmin, allowSameOrganization } = options;

      // Super admin check (highest priority)
      if (requireSuperAdmin) {
        if (!user.is_super_admin) {
          logger.warn('Role check failed: Super admin required', {
            userId: user._id,
            userRole: user.role,
            isSuperAdmin: user.is_super_admin,
            path: req.path,
          });
          res.status(403).json({
            success: false,
            message: "Super admin access required",
            error: "INSUFFICIENT_PERMISSIONS",
          });
          return;
        }
        // Super admin can access everything
        next();
        return;
      }

      // Organization admin check
      if (requireOrgAdmin) {
        if (user.role !== UserRole.ORG_ADMIN && !user.is_super_admin) {
          logger.warn('Role check failed: Organization admin required', {
            userId: user._id,
            userRole: user.role,
            path: req.path,
          });
          res.status(403).json({
            success: false,
            message: "Organization admin access required",
            error: "INSUFFICIENT_PERMISSIONS",
          });
          return;
        }
      }

      // Role-based check
      if (allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.includes(user.role as UserRole);
        const isSuperAdmin = user.is_super_admin;

        if (!hasRequiredRole && !isSuperAdmin) {
          logger.warn('Role check failed: Required role not found', {
            userId: user._id,
            userRole: user.role,
            allowedRoles,
            path: req.path,
          });
          res.status(403).json({
            success: false,
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            error: "INSUFFICIENT_PERMISSIONS",
          });
          return;
        }
      }

      // Organization boundary check (for routes that need same organization access)
      if (allowSameOrganization) {
        const targetOrgId = req.params.organizationId || req.body.organizationId;
        
        if (targetOrgId && user.organization_id?.toString() !== targetOrgId && !user.is_super_admin) {
          logger.warn('Role check failed: Organization boundary violation', {
            userId: user._id,
            userOrgId: user.organization_id,
            targetOrgId,
            path: req.path,
          });
          res.status(403).json({
            success: false,
            message: "Access denied. You can only access resources within your organization",
            error: "ORGANIZATION_ACCESS_DENIED",
          });
          return;
        }
      }

      // All checks passed
      logger.debug('Role check passed', {
        userId: user._id,
        userRole: user.role,
        isSuperAdmin: user.is_super_admin,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.error('Role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: "Authorization check failed",
        error: "AUTHORIZATION_ERROR",
      });
    }
  };
};

/**
 * Convenience middleware for super admin only routes
 */
export const requireSuperAdmin = () => {
  return requireRole([], { requireSuperAdmin: true });
};

/**
 * Convenience middleware for organization admin routes
 */
export const requireOrgAdmin = () => {
  return requireRole([UserRole.ORG_ADMIN], { requireOrgAdmin: true });
};

/**
 * Convenience middleware for end user routes (any authenticated user)
 */
export const requireEndUser = () => {
  return requireRole([UserRole.END_USER, UserRole.ORG_ADMIN]);
};

/**
 * Convenience middleware for organization boundary enforcement
 */
export const requireSameOrganization = () => {
  return requireRole([], { allowSameOrganization: true });
};

/**
 * Combined middleware for organization admin with same organization check
 */
export const requireOrgAdminSameOrg = () => {
  return requireRole([UserRole.ORG_ADMIN], { 
    requireOrgAdmin: true, 
    allowSameOrganization: true 
  });
};