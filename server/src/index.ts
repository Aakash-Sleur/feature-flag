import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";

// Import logging utilities
import logger from "./utils/logger.js";
import { requestLogger, errorLogger } from "./middleware/request-logger.js";

// Import models
import "./models/user.model.js";
import "./models/organization.model.js";
import "./models/feature.model.js";
import "./models/invite.model.js";
import "./models/refresh_token.model.js";

// Import routes
import routes from "./routes/index.js";

import {
  corsOptions,
  MONGO_URI,
  mongodbOptions,
} from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

/**
 * MongoDB Connection Cache
 */
let isConnected = false;

const connectToMongoDB = async () => {
  try {
    if (isConnected) {
      return;
    }

    await mongoose.connect(MONGO_URI!, mongodbOptions);

    isConnected = true;

    logger.info("Connected to MongoDB successfully 🤝");
  } catch (err) {
    logger.error("MongoDB connection error:", err);

    throw err;
  }
};

/**
 * Middleware
 */

// Request logging
app.use(requestLogger);

// CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Parsers
app.use(compression());
app.use(cookieParser());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "public")));

/**
 * Ensure DB connection before routes
 */
app.use(async (_, __, next) => {
  try {
    await connectToMongoDB();

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * API Routes
 */
app.use("/api", routes);

/**
 * Root Route
 */
app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Feature Flag Server API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      organizations: "/api/organizations",
      features: "/api/features",
      invites: "/api/invites",
      client: corsOptions,
    },
  });
});

/**
 * Error Logging Middleware
 */
app.use(errorLogger);

/**
 * Global Error Handler
 */
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Global error handler:", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      url: req.url,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
);

export default app;