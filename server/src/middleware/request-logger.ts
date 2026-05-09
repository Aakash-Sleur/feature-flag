// src/middleware/request-logger.ts

import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface LogData {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  userRole?: string;
  requestId: string;
  timestamp: string;
  body?: any;
  query?: any;
  params?: any;
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
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  // Add user info if available (after auth middleware)
  if (req.user) {
    logData.userId = req.user.userId;
    logData.userRole = req.user.role;
  }
  
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
    logData.query = req.query;
  }
  
  // Log route parameters
  if (Object.keys(req.params).length > 0) {
    logData.params = req.params;
  }
  
  // Log incoming request
  logger.info(`Incoming Request: ${req.method} ${req.url}`, { 
    requestId,
    ...logData 
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
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
    
    return originalJson.call(this, body);
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
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
  });
  
  next(error);
};