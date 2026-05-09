// src/middleware/request-logger.ts

import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface LogData {
  method: string;
  url: string;
  ip: string;
  userAgent: string | undefined;
  userId: string | undefined;
  userRole: string | undefined;
  requestId: string;
  timestamp: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// Generate unique request ID
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Middleware to log request details
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Add request ID to request object for tracking
  (req as any).requestId = requestId;
  
  // Prepare log data
  const logData: LogData = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    userRole: req.user?.role,
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  // Log request body for POST/PUT/PATCH (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    
    logData.body = sanitizedBody;
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    logData.query = req.query as Record<string, unknown>;
  }
  
  // Log route parameters
  if (Object.keys(req.params).length > 0) {
    logData.params = req.params as Record<string, unknown>;
  }
  
  // Log incoming request
  logger.info(`Incoming Request: ${req.method} ${req.url}`, logData);
  
  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function(body: unknown) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Prepare response log data
    const responseLogData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId || 'anonymous',
      userRole: req.user?.role || 'none',
    };
    
    // Log response based on status code
    if (res.statusCode >= 500) {
      logger.error(`Response Error: ${req.method} ${req.url} - ${res.statusCode}`, {
        ...responseLogData,
        responseBody: body,
      });
    } else if (res.statusCode >= 400) {
      logger.warn(`Response Warning: ${req.method} ${req.url} - ${res.statusCode}`, {
        ...responseLogData,
        responseBody: body,
      });
    } else {
      logger.info(`Response Success: ${req.method} ${req.url} - ${res.statusCode}`, responseLogData);
    }
    
    return originalJson(body);
  };
  
  next();
};

// Middleware to log unhandled errors
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId || 'unknown';
  
  logger.error(`Unhandled Error in ${req.method} ${req.url}`, {
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    method: req.method,
    url: req.url,
    userId: req.user?.userId || 'anonymous',
    userRole: req.user?.role || 'none',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
  });
  
  next(error);
};