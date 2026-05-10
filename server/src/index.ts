import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors"
import * as http from "http"
import mongoose from "mongoose";
import "dotenv/config"
import { fileURLToPath } from "url";
import path from "path";

// Import logging utilities
import logger from "./utils/logger.js";
import morganMiddleware from "./middleware/morgan.js";
import { requestLogger, errorLogger } from "./middleware/request-logger.js";

// Import models to register them
import "./models/user.model.js";
import "./models/organization.model.js";
import "./models/feature.model.js";
import "./models/invite.model.js";
import "./models/refresh_token.model.js";

// Import routes
import routes from "./routes/index.js";
import { corsOptions, MONGO_URI, mongodbOptions, PORT } from "./config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express()

// Logging middleware (should be first)
// app.use(morganMiddleware);
app.use(requestLogger);

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api", routes);

// Root route
app.get("/", (req, res) => {
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
      client: corsOptions
    },
  });
});

// Error logging middleware (should be after routes)
app.use(errorLogger);

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler:', {
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
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

const server = http.createServer(app);

// MongoDB connection with retry logic
const connectToMongoDB = async (retries = 5) => {
  try {
    await mongoose.connect(MONGO_URI!, mongodbOptions);
    logger.info("Connected to MongoDB successfully 🤝");
  } catch (err) {
    logger.error("Error while connecting to MongoDB:", err);
    
    if (retries > 0) {
      logger.warn(`Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(() => connectToMongoDB(retries - 1), 5000);
    } else {
      logger.error("Failed to connect to MongoDB after multiple attempts");
      logger.warn("Starting server without database connection...");
    }
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise + 'reason:' +  reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
  });
});

// Start MongoDB connection
connectToMongoDB();

// Start server
server.listen(PORT, () => {
    logger.info(`🚀 Server is running at http://localhost:${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📊 Log level: ${process.env.NODE_ENV === 'production' ? 'warn' : 'debug'}`);
});