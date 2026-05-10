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

router.get("/:token", getInvite);
router.post("/consume", consumeInvite);

router.use(authenticateToken);

router.post("/organization", requireSuperAdmin(), createOrganizationInvite);

router.post("/user", requireOrgAdmin(), createUserInvite);

export default router;