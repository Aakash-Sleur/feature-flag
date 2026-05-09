import { Router } from "express";
import { 
  getInvite, 
  createOrganizationInvite, 
  createUserInvite, 
  consumeInvite 
} from "../controllers/invite.controller.js";
import { authenticateToken } from "../middleware/jwt.js";
import { requireOrgAdmin, requireSuperAdmin } from "../middleware/role-check.js";

const router: Router = Router();

// Public routes - no auth required
router.get("/:token", getInvite);
router.post("/consume", consumeInvite);

// Protected routes - require authentication
router.use(authenticateToken);

// Super admin only - create organization invite
router.post("/organization", requireSuperAdmin(), createOrganizationInvite);

// Organization admin only - create user invite for their organization
router.post("/user", requireOrgAdmin(), createUserInvite);

export default router;