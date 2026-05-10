import express, { Router } from "express";
import { authenticateToken } from "../middleware/jwt.js";
import { requireSuperAdmin, requireRole, requireSameOrganization } from "../middleware/role-check.js";
import { UserRole } from "../models/user.model.js";
import {
  getAllOrganizations,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationUsers,
  removeUserFromOrganization,
} from "../controllers/organization.controller.js";

const router: express.Router = Router();

router.use(authenticateToken);

router.get("/", requireSuperAdmin(), getAllOrganizations);
router.post("/", requireSuperAdmin(), createOrganization);

router.get("/:id", requireSameOrganization(), getOrganizationById);
router.put("/:id", requireRole([UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]), updateOrganization);
router.delete("/:id", requireSuperAdmin(), deleteOrganization);

router.get("/:id/users", requireSameOrganization(), getOrganizationUsers);
router.delete("/:id/users/:userId", requireRole([UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]), removeUserFromOrganization);

export default router;