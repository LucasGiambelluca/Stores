/**
 * Structured Logger Service
 * 
 * Provides JSON-formatted logging with levels for production observability.
 * In development, logs are human-readable. In production, they're JSON for parsing.
 */

const isProduction = process.env.NODE_ENV === 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    userId?: string;
  };
}

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (from env or default)
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[minLevel];
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (parseable by log aggregators)
    return JSON.stringify(entry);
  }
  
  // Human-readable format for development
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  const levelStr = `${levelColors[entry.level]}[${entry.level.toUpperCase()}]${reset}`;
  const contextStr = entry.context ? ` [${entry.context}]` : '';
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  
  return `${entry.timestamp} ${levelStr}${contextStr} ${entry.message}${dataStr}`;
}

function log(level: LogLevel, message: string, options?: {
  context?: string;
  data?: Record<string, any>;
  error?: Error;
  request?: {
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    userId?: string;
  };
}): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: options?.context,
    data: options?.data,
  };
  
  if (options?.error) {
    entry.error = {
      name: options.error.name,
      message: options.error.message,
      stack: isProduction ? undefined : options.error.stack,
    };
  }
  
  if (options?.request) {
    entry.request = options.request;
  }
  
  const formatted = formatLog(entry);
  
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

// Export logger with methods for each level
export const logger = {
  debug: (message: string, options?: Parameters<typeof log>[2]) => log('debug', message, options),
  info: (message: string, options?: Parameters<typeof log>[2]) => log('info', message, options),
  warn: (message: string, options?: Parameters<typeof log>[2]) => log('warn', message, options),
  error: (message: string, options?: Parameters<typeof log>[2]) => log('error', message, options),
  
  // Helper for HTTP request logging
  request: (method: string, url: string, statusCode: number, duration: number, options?: {
    ip?: string;
    userId?: string;
  }) => {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    log(level, `${method} ${url} ${statusCode} ${duration}ms`, {
      context: 'HTTP',
      data: { statusCode, duration, ...options },
    });
  },
};
