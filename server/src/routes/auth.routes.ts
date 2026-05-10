import { Router } from "express";
import { register, login, getProfile, refreshToken, logout, registerWithInvite } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/jwt.js";

const router: Router = Router();

// Public routes (no authentication required)
router.post("/register", register);
router.post("/register/invite", registerWithInvite);
router.post("/login", login);
router.post("/refresh_token", refreshToken);
router.post("/logout", logout);

// Protected routes (authentication required)
router.get("/me", authenticateToken, getProfile);

export default router;