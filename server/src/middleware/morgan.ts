// src/middleware/morgan.ts

import morgan from 'morgan';
import logger from '../utils/logger.js';
import type { Request, Response } from 'express';

// Custom token to get user ID from request
morgan.token('user-id', (req: Request) => {
  return req.user?.userId || 'anonymous';
});

// Custom token to get user role from request
morgan.token('user-role', (req: Request) => {
  return req.user?.role || 'none';
});

// Custom token for response time in a more readable format
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = morgan['response-time'](req, res);
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for request body size
morgan.token('req-size', (req: Request) => {
  return req.get('content-length') || '0';
});

// Define custom format for development
const developmentFormat = ':method :url :status :response-time-ms - :res[content-length] bytes - User: :user-id (:user-role)';

// Define custom format for production
const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms - User: :user-id (:user-role)';

// Create stream object with write function that will be used by morgan
const stream = {
  write: (message: string) => {
    // Remove the newline character that morgan adds
    const cleanMessage = message.trim();
    
    // Log HTTP requests as 'http' level
    logger.http(cleanMessage);
  },
};

// Skip logging for certain conditions
const skip = (req: Request, res: Response) => {
  // Skip health check endpoints in production
  if (process.env.NODE_ENV === 'production' && req.url === '/api/health') {
    return true;
  }
  
  // Skip successful requests in production (only log errors and warnings)
  if (process.env.NODE_ENV === 'production' && res.statusCode < 400) {
    return true;
  }
  
  return false;
};

// Create morgan middleware
const morganMiddleware: morgan.Morgan<Request, Response> = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream,
    skip,
  }
);

export default morganMiddleware;