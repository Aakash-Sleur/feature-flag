// src/utils/logger.ts

// Simple console-based logger (Vercel compatible, no file I/O)
const getTimestamp = () => {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
};

const logger = {
  error: (message: string, meta?: any) => {
    console.error(`[${getTimestamp()}] [ERROR]`, message, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[${getTimestamp()}] [WARN]`, message, meta || '');
  },
  info: (message: string, meta?: any) => {
    console.log(`[${getTimestamp()}] [INFO]`, message, meta || '');
  },
  http: (message: string, meta?: any) => {
    console.log(`[${getTimestamp()}] [HTTP]`, message, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${getTimestamp()}] [DEBUG]`, message, meta || '');
    }
  },
};

export default logger;