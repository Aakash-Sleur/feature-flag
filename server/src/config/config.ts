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

// Allow multiple origins for CORS (development and production)
const allowedOrigins = [
  CLIENT_URL,
  "https://feature-flag-olrs.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean); // Remove any undefined values

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};
