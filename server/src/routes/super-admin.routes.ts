import express, { Router } from "express";
import { authenticateToken } from "../middleware/jwt.js";
import { requireSuperAdmin } from "../middleware/role-check.js";
import {
  getAllOrganizations,
  getOrganizationDetails,
  getAllFeatureFlags,
  getAllUsers,
  updateUserAssignment,
  getStatistics,
} from "../controllers/super-admin.controller.js";

const router: express.Router = Router();

router.use(authenticateToken);
router.use(requireSuperAdmin());

router.get("/organizations", getAllOrganizations);
router.get("/organizations/:id", getOrganizationDetails);

router.get("/feature-flags", getAllFeatureFlags);

router.get("/users", getAllUsers);
router.put("/users/:userId/assignment", updateUserAssignment);

router.get("/statistics", getStatistics);

export default router;
