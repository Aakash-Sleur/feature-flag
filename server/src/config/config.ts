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
  "https://feature-flag-olrs.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  CLIENT_URL,
].filter((origin, index, self) => origin && self.indexOf(origin) === index); // Remove duplicates and undefined

console.log('🌐 CORS Allowed Origins:', allowedOrigins);

// Simplified CORS for Vercel - headers are set in vercel.json
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // In production (Vercel), allow all since headers are set in vercel.json
    if (process.env.VERCEL === '1') {
      console.log(`✅ CORS (Vercel): Allowing origin: ${origin || 'no-origin'}`);
      return callback(null, true);
    }
    
    // In development, check against allowed origins
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin header');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS: Blocking origin: ${origin}`);
      console.warn(`   Allowed origins:`, allowedOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
