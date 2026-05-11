import { FeatureFlag } from "../models/feature.model.js";
import type { Request, Response } from "express";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

export const getFeatureFlags = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    const featureFlags = await FeatureFlag.find({
      organization_id: user.organizationId,
    });

    res.status(200).json({
      success: true,
      data: featureFlags,
    });
  } catch (error) {
    logger.error("Failed to get feature flags");
    res.status(500).json({
      success: false,
      message: error,
      error: "GET_FEATURE_FLAG",
    });
  }
};

export const getFeatureFlagById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Feature Id is missing",
        error: "MISSING_FEATURE_ID",
      });
      return;
    }

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    const featureFlag = await FeatureFlag.findOne({
      organization_id: user.organizationId,
      _id: id,
    });

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: "Feature not found",
        error: "MISSING_FEATURE",
      });
    }

    res.status(200).json({
      success: true,
      data: featureFlag,
    });
  } catch (error) {
    logger.error("Failed to get feature flags");
    res.status(500).json({
      success: false,
      message: error,
      error: "GET_FEATURE_FLAG",
    });
  }
};

export const createFeatureFlag = async (req: Request, res: Response) => {
  try {
    const { title, feature_key, description, enabled } = req.body;
    const user = req.user;

    if (!user?._id) {
      res.status(400).json({
        success: false,
        message: "User not found",
        error: "MISSING_USER",
      });
      return;
    }

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    if (!title || !feature_key) {
      res.status(400).json({
        success: false,
        message: "Title and feature_key are required",
        error: "MISSING_REQUIRED_FIELDS",
      });
      return;
    }

    const featureFlag = await FeatureFlag.create({
      organization_id: user.organizationId,
      title,
      feature_key,
      description: description || "",
      enabled: enabled ?? false,
      created_by: user._id,
    });

    res.status(201).json({
      success: true,
      message: "Feature flag created successfully",
      data: featureFlag,
    });
  } catch (error) {
    logger.error("Failed to create feature flag");
    res.status(500).json({
      success: false,
      message: error,
      error: "CREATE_FEATURE_FLAG",
    });
  }
};

export const checkFeatureFlag = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }
    
    const featureFlag = await FeatureFlag.findOne({
      _id: id,
      organization_id: user.organizationId,
    });

    
    if (!featureFlag) {
      res.status(404).json({
        success: false,
        message: "Feature flag not found",
        error: "FEATURE_FLAG_NOT_FOUND",
      });
      return;
    }

    return res.status(200).json({
      success: true,
      message: "Feature flag found"
    })
  } catch (error) {
     logger.error("Failed to check feature flag");
    res.status(500).json({
      success: false,
      message: error,
      error: "CHECK_FEATURE_FLAG",
    });
  }
}

export const checkFeatureFlagByKey = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { key } = req.params;

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    const featureFlag = await FeatureFlag.findOne({
      feature_key: key,
      organization_id: user.organizationId,
    });

    if (!featureFlag) {
      return res.status(200).json({
        success: true,
        enabled: false,
        message: "Feature flag not found or disabled"
      });
    }

    return res.status(200).json({
      success: true,
      enabled: featureFlag.enabled,
      message: featureFlag.enabled ? "Feature is enabled" : "Feature is disabled"
    });
  } catch (error) {
    logger.error("Failed to check feature flag by key");
    res.status(500).json({
      success: false,
      message: error,
      error: "CHECK_FEATURE_FLAG_BY_KEY",
    });
  }
}

export const updateFeatureFlag = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const featureId = Array.isArray(id) ? id[0] : id;
    const { enabled, title, description } = req.body;

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
      res.status(400).json({
        success: false,
        message: "Invalid feature flag ID",
        error: "INVALID_ID",
      });
      return;
    }

    const featureFlag = await FeatureFlag.findOne({
      _id: featureId,
      organization_id: user.organizationId,
    });

    if (!featureFlag) {
      res.status(404).json({
        success: false,
        message: "Feature flag not found",
        error: "FEATURE_FLAG_NOT_FOUND",
      });
      return;
    }

    // Update fields if provided
    if (enabled !== undefined) {
      featureFlag.enabled = enabled;
    }
    if (title !== undefined) {
      featureFlag.title = title;
    }
    if (description !== undefined) {
      featureFlag.description = description;
    }

    await featureFlag.save();

    res.status(200).json({
      success: true,
      message: "Feature flag updated successfully",
      data: featureFlag,
    });
  } catch (error) {
    logger.error("Failed to update feature flag");
    res.status(500).json({
      success: false,
      message: error,
      error: "UPDATE_FEATURE_FLAG",
    });
  }
};
export const deleteFeatureFlag = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const featureId = Array.isArray(id) ? id[0] : id;

    if (!user?.organizationId) {
      res.status(400).json({
        success: false,
        message: "User organization not found",
        error: "MISSING_ORGANIZATION",
      });
      return;
    }

    if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
      res.status(400).json({
        success: false,
        message: "Invalid feature flag ID",
        error: "INVALID_ID",
      });
      return;
    }

    const featureFlag = await FeatureFlag.findOne({
      _id: featureId,
      organization_id: user.organizationId,
    });

    if (!featureFlag) {
      res.status(404).json({
        success: false,
        message: "Feature flag not found",
        error: "FEATURE_FLAG_NOT_FOUND",
      });
      return;
    }

    await FeatureFlag.findByIdAndDelete(featureId);

    res.status(200).json({
      success: true,
      message: "Feature flag deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete feature flag");
    res.status(500).json({
      success: false,
      message: error,
      error: "DELETE_FEATURE_FLAG",
    });
  }
};
