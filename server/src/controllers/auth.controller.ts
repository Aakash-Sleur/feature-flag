import type { Request, Response } from "express";
import { 
  register as registerUser,
  login as loginUser,
  getProfile as getUserProfile,
  refreshToken as refreshAccessToken,
  logout as logoutUser
} from "../services/index.js";
import { consumeInvite } from "../services/invite.service.js";
import logger from "../utils/logger.js";

/**
 * Register new organization admin with organization
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      success: true,
      message: "Organization and admin account created successfully",
      data: {
        user: result.user,
        organization: result.organization,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Name, email, password, and organization name are required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_FIELDS",
        });
        return;
      }
      
      if (error.message === "Password must be at least 6 characters long") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "WEAK_PASSWORD",
        });
        return;
      }
      
      if (error.message === "Organization name must be at least 2 characters long") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "INVALID_ORGANIZATION_NAME",
        });
        return;
      }
      
      if (error.message === "Please provide a valid email address") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "INVALID_EMAIL",
        });
        return;
      }
      
      if (error.message === "User with this email already exists") {
        res.status(409).json({
          success: false,
          message: error.message,
          error: "USER_EXISTS",
        });
        return;
      }
      
      if (error.message === "Organization with this name already exists") {
        res.status(409).json({
          success: false,
          message: error.message,
          error: "ORGANIZATION_EXISTS",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: "REGISTRATION_ERROR",
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Email and password are required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_CREDENTIALS",
        });
        return;
      }
      
      if (error.message === "Invalid email or password") {
        res.status(401).json({
          success: false,
          message: error.message,
          error: "INVALID_CREDENTIALS",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: "LOGIN_ERROR",
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      });
      return;
    }

    const user = await getUserProfile(req.user._id);

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    
    if (error instanceof Error) {
      if (error.message === "User not found") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "USER_NOT_FOUND",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: "PROFILE_ERROR",
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      logger.warn('Refresh token missing', {
        hasCookies: !!req.cookies,
        hasBody: !!req.body,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      });
      
      res.status(401).json({
        success: false,
        message: "Refresh token required",
        error: "MISSING_REFRESH_TOKEN",
      });
      return;
    }

    const result = await refreshAccessToken(refreshToken);

    // Set new refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    logger.error("Token refresh error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Refresh token required") {
        res.status(401).json({
          success: false,
          message: error.message,
          error: "MISSING_REFRESH_TOKEN",
        });
        return;
      }
      
      if (error.message.includes("Invalid") || error.message.includes("expired")) {
        res.status(401).json({
          success: false,
          message: error.message,
          error: "INVALID_REFRESH_TOKEN",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Token refresh failed",
      error: "REFRESH_ERROR",
    });
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    await logoutUser(refreshToken);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: "LOGOUT_ERROR",
    });
  }
};
/**
 * Register user via invite token
 */
export const registerWithInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: "Token and password are required",
        error: "MISSING_FIELDS",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
        error: "WEAK_PASSWORD",
      });
      return;
    }

    const result = await consumeInvite({ token, password });

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: result.user,
        organization: result.organization,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    logger.error("Invite registration error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Token and password are required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_FIELDS",
        });
        return;
      }
      
      if (error.message === "Password must be at least 6 characters long") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "WEAK_PASSWORD",
        });
        return;
      }
      
      if (error.message === "Invite not found or expired") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "INVITE_NOT_FOUND",
        });
        return;
      }
      
      if (error.message === "User with this email already exists") {
        res.status(409).json({
          success: false,
          message: error.message,
          error: "USER_EXISTS",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: "REGISTRATION_ERROR",
    });
  }
};