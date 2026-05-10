// src/routes/feature.routes.ts

import express, { Router } from "express";
import { authenticateToken, requireRole, requireOrganization } from "../middleware/jwt.js";
import { User, UserRole } from "../models/user.model.js";
import type { Request, Response } from "express";
import { getFeatureFlags, createFeatureFlag, getFeatureFlagById, updateFeatureFlag, deleteFeatureFlag } from "../controllers/feature.controller.js";

const router: express.Router = Router();

router.use(authenticateToken);

router.get("/", requireOrganization, getFeatureFlags);
router.get("/:id", requireOrganization, getFeatureFlagById);

router.post("/", requireRole(UserRole.ORG_ADMIN), createFeatureFlag);

router.put("/:id", requireRole(UserRole.ORG_ADMIN), updateFeatureFlag);

router.delete("/:id", requireRole(UserRole.ORG_ADMIN), deleteFeatureFlag);

export default router;