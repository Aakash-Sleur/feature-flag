import { Router } from "express";
import authRoutes from "./auth.routes.js";
import organizationRoutes from "./organization.routes.js";
import featureRoutes from "./feature.routes.js";
import inviteRoutes from "./invite.route.js"
import superAdminRoutes from "./super-admin.routes.js"

const router: Router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/invites", inviteRoutes)
router.use("/features", featureRoutes);
router.use("/super-admin", superAdminRoutes);

export default router;