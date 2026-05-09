// src/routes/feature.routes.ts

import express, { Router } from "express";
import { authenticateToken, requireRole, requireOrganization } from "../middleware/jwt.js";
import { User, UserRole } from "../models/user.model.js";
import type { Request, Response } from "express";
import { getFeatureFlags, createFeatureFlag, getFeatureFlagById, updateFeatureFlag, deleteFeatureFlag } from "../controllers/feature.controller.js";

const router: express.Router = Router();

// All feature routes require authentication
router.use(authenticateToken);

/**
 * Get all features for user's organization
 */
router.get("/", requireOrganization, getFeatureFlags);
router.get("/:id", requireOrganization, getFeatureFlagById);

/**
 * Create new feature (Org Admin only)
 */
router.post("/", requireRole(UserRole.ORG_ADMIN), createFeatureFlag);


/**
 * Update feature (Org Admin only)
 */
router.put("/:id", requireRole(UserRole.ORG_ADMIN), updateFeatureFlag);

/**
 * Delete feature (Org Admin only)
 */
router.delete("/:id", requireRole(UserRole.ORG_ADMIN), deleteFeatureFlag);

export default router;