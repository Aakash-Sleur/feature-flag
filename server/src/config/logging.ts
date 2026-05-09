// src/config/logging.ts

export const loggingConfig = {
  // Log levels by environment
  levels: {
    development: 'debug',
    production: 'warn',
    test: 'error',
  },
  
  // File rotation settings
  fileRotation: {
    maxSize: 5242880, // 5MB
    maxFiles: 5,
  },
  
  // Morgan settings
  morgan: {
    // Skip logging in production for successful requests
    skipSuccessfulRequests: process.env.NODE_ENV === 'production',
    
    // Skip health check endpoints
    skipHealthChecks: true,
  },
  
  // Sensitive fields to redact from logs
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'authorization',
    'cookie',
    'session',
    'jwt',
    'refresh_token',
    'access_token',
  ],
  
  // Request/Response logging settings
  requestLogging: {
    // Log request body for these methods
    logBodyForMethods: ['POST', 'PUT', 'PATCH'],
    
    // Maximum body size to log (in bytes)
    maxBodySize: 1024, // 1KB
    
    // Log response body for error status codes
    logResponseBodyOnError: true,
  },
};