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
  MONGO_URI,
  mongodbOptions,
  PORT,
} from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

/**
 * MongoDB Connection
 */
const connectToMongoDB = async () => {
  try {
    // Already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Connecting already in progress
    if (mongoose.connection.readyState === 2) {
      return mongoose.connection;
    }

    const connection = await mongoose.connect(
      MONGO_URI!,
      mongodbOptions
    );

    logger.info("Connected to MongoDB successfully 🤝");

    return connection;
  } catch (err) {
    logger.error("MongoDB connection error:", err);

    throw err;
  }
};

/**
 * CORS Configuration
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Blocked by CORS: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

/**
 * Middleware
 */

// CORS FIRST
app.use(cors(corsOptions));

// Parsers
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Static files
app.use(express.static(path.join(__dirname, "public")));

/**
 * Ensure MongoDB connection
 * IMPORTANT FOR VERCEL SERVERLESS
 */
app.use(async (_req, _res, next) => {
  try {
    await connectToMongoDB();

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Root Route
 */
app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Feature Flag Server API",
    version: "1.0.0",
  });
});

/**
 * API Routes
 */
app.use("/api", routes);

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

    // Handle CORS errors
    if (error.message === "Not allowed by CORS") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
);

/**
 * Local development only
 * Vercel handles server startup automatically
 */
if (process.env.VERCEL !== "1") {
  app.listen(PORT, async () => {
    try {
      await connectToMongoDB();

      logger.info(`🚀 Server running at http://localhost:${PORT}`);

      logger.info(
        `📝 Environment: ${
          process.env.NODE_ENV || "development"
        }`
      );
    } catch (error) {
      logger.error("Failed to connect during startup:", error);

      process.exit(1);
    }
  });
}

export default app;