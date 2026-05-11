import { Router } from "express";
import { register, login, getProfile, refreshToken, logout, registerWithInvite } from "../controllers/auth.controller.js";
import { authenticateToken, optionalAuth } from "../middleware/jwt.js";

const router: Router = Router();

// Public routes (no authentication required)
router.post("/register", register);
router.post("/register/invite", registerWithInvite);
router.post("/login", login);
router.post("/refresh_token", refreshToken);

// Logout with optional authentication (clears access token if authenticated)
router.post("/logout", optionalAuth, logout);

// Protected routes (authentication required)
router.get("/me", authenticateToken, getProfile);

export default router;