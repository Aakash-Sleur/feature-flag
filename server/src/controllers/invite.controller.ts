import type { Request, Response } from "express";
import { 
  getInviteByToken,
  createOrganizationInvite as createOrgInvite,
  createUserInvite as createUsrInvite,
  consumeInvite as processInvite
} from "../services/index.js";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";

// get the invite
export const getInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    console.log(token)

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: "Invite token is required",
        error: "MISSING_TOKEN",
      });
      return;
    }

    const inviteDetails = await getInviteByToken(token);

    res.status(200).json({
      success: true,
      message: "Invite found successfully",
      data: inviteDetails,
    });
  } catch (error) {
    logger.error("Failed to get invite: ", error);
    
    if (error instanceof Error) {
      if (error.message === "Invite token is required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_TOKEN",
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
    }

    res.status(500).json({
      success: false,
      message: "Failed to get invite",
      error: "GET_INVITATION_ERROR",
    });
  }
};

// create a invite by super admin (creates new organization)
export const createOrganizationInvite = async (req: Request, res: Response) => {
  try {
    // Get the inviter's name for the email
    const inviterName = req.user ? 
      (await User.findById(req.user._id))?.name || 'System Administrator' : 
      'System Administrator';
    
    const inviteData = await createOrgInvite(req.body, inviterName);

    res.status(201).json({
      success: true,
      message: "Organization invite created successfully",
      data: inviteData,
    });
  } catch (error) {
    logger.error("Failed to create organization invite: ", error);
    
    if (error instanceof Error) {
      if (error.message === "Email, username, and organization name are required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_FIELDS",
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
      
      if (error.message === "There's already a pending invite for this email") {
        res.status(409).json({
          success: false,
          message: error.message,
          error: "INVITE_EXISTS",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create organization invite",
      error: "CREATE_ORGANIZATION_INVITE_ERROR",
    });
  }
};

// create a invite by organization admin (adds user to existing organization)
export const createUserInvite = async (req: Request, res: Response) => {
  try {
    const adminUserId = req.user?._id;
    if (!adminUserId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      });
      return;
    }

    const inviteData = await createUsrInvite(req.body, adminUserId.toString());

    res.status(201).json({
      success: true,
      message: "User invite created successfully",
      data: inviteData,
    });
  } catch (error) {
    logger.error("Failed to create user invite: ", error);
    
    if (error instanceof Error) {
      if (error.message === "Email and username are required") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "MISSING_FIELDS",
        });
        return;
      }
      
      if (error.message === "Admin user must belong to an organization") {
        res.status(400).json({
          success: false,
          message: error.message,
          error: "NO_ORGANIZATION",
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
      
      if (error.message === "There's already a pending invite for this email in your organization") {
        res.status(409).json({
          success: false,
          message: error.message,
          error: "INVITE_EXISTS",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user invite",
      error: "CREATE_USER_INVITE_ERROR",
    });
  }
};

// consume invite (create user and organization if needed)
export const consumeInvite = async (req: Request, res: Response) => {
  try {
    const result = await processInvite(req.body);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully${result.organization.isNew ? ' and organization established' : ''}`,
      data: {
        user: result.user,
        organization: result.organization,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    logger.error("Failed to consume invite: ", error);
    
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
      message: "Failed to consume invite",
      error: "CONSUME_INVITE_ERROR",
    });
  }
};
