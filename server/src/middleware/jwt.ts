// src/middleware/jwt.ts

import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { User, UserRole } from "../models/user.model.js";
import type { JWTPayload } from "../utils/jwt.js";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { _id: string; organizationId: string; role: string };
    }
  }
}

/**
 * Extract token from Authorization header or cookies
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
        error: "MISSING_TOKEN",
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and token matches
    const user = await User.findById(decoded.userId).select("-password_hash");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    // Check if the token matches the one stored in user record
    if (user.access_token !== token) {
      res.status(401).json({
        success: false,
        message: "Token revoked or invalid",
        error: "TOKEN_REVOKED",
      });
      return;
    }

    // Add user info to request
    req.user = {
      ...decoded,
      _id: user._id.toString(),
      organizationId: user.organization_id?.toString() || "",
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        res.status(401).json({
          success: false,
          message: "Access token expired",
          error: "TOKEN_EXPIRED",
        });
        return;
      }

      if (error.message === "Invalid access token") {
        res.status(401).json({
          success: false,
          message: "Invalid access token",
          error: "INVALID_TOKEN",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: "AUTH_ERROR",
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        error: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "NOT_AUTHENTICATED",
    });
    return;
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user?.is_super_admin) {
      res.status(403).json({
        success: false,
        message: "Super admin access required",
        error: "SUPER_ADMIN_REQUIRED",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authorization check failed",
      error: "AUTH_CHECK_ERROR",
    });
  }
};

/**
 * Middleware to check if user belongs to organization
 */
export const requireOrganization = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "NOT_AUTHENTICATED",
    });
    return;
  }

  if (!req.user.organizationId) {
    res.status(403).json({
      success: false,
      message: "Organization membership required",
      error: "NO_ORGANIZATION",
    });
    return;
  }

  next();
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password_hash");

      if (user && user.access_token === token) {
        req.user = {
          ...decoded,
          _id: user._id.toString(),
          organizationId: user.organization_id?.toString() || "",
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};
