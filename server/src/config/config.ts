export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/assignment";
export const PORT = process.env.PORT || 8080;
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "15m";
export const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "7d";

// Validate required environment variables
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const mongodbOptions = {
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
  bufferCommands: false,
};

// Allow all origins for CORS
console.log('🌐 CORS: Allowing ALL origins');

export const corsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
