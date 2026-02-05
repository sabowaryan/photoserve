/**
 * API Request and Error Logging Utility
 * 
 * Provides structured logging for API requests, responses, and errors
 * with context information for debugging and monitoring.
 * 
 * Requirements: 13.3 - Log errors with stack trace and context information
 * Requirements: 13.7 - Log all API requests with timestamp, endpoint, user_id, and response status
 * Requirements: 13.8 - Implement structured logging for easy parsing
 * Requirements: 13.9 - Set up alerting for critical errors
 * Requirements: 13.10 - Maintain logs for at least 90 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertService } from '@/lib/services/alert.service';

/**
 * Log levels for API events
 */
export enum ApiLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * API request log entry structure
 * Requirements: 13.7 - Log all API requests with timestamp, endpoint, user_id, and response status
 */
interface ApiRequestLogEntry {
  timestamp: string;
  level: ApiLogLevel;
  type: 'request' | 'response' | 'error';
  method: string;
  endpoint: string;
  userId?: string;
  apiKeyId?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Format a log entry as a structured JSON string
 * Requirements: 13.8 - Implement structured logging for easy parsing
 */
function formatLogEntry(entry: ApiRequestLogEntry): string {
  return JSON.stringify({
    ...entry,
    service: 'piksend-api',
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Extract request metadata for logging
 */
function extractRequestMetadata(request: NextRequest): {
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
} {
  const headers = request.headers;
  
  return {
    method: request.method,
    endpoint: new URL(request.url).pathname,
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
  };
}

/**
 * API Logger Class
 * Provides methods for logging API requests, responses, and errors
 */
export class ApiLogger {
  /**
   * Log an API request
   * Requirements: 13.7 - Log all API requests with timestamp, endpoint, user_id, and response status
   */
  static logRequest(
    request: NextRequest,
    metadata?: {
      userId?: string;
      apiKeyId?: string;
    }
  ): void {
    const requestMetadata = extractRequestMetadata(request);
    
    const entry: ApiRequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: ApiLogLevel.INFO,
      type: 'request',
      ...requestMetadata,
      ...metadata,
    };
    
    const formattedLog = formatLogEntry(entry);
    console.info('[API REQUEST]', formattedLog);
  }
  
  /**
   * Log an API response
   * Requirements: 13.7 - Log all API requests with timestamp, endpoint, user_id, and response status
   */
  static logResponse(
    request: NextRequest,
    response: NextResponse,
    duration: number,
    metadata?: {
      userId?: string;
      apiKeyId?: string;
    }
  ): void {
    const requestMetadata = extractRequestMetadata(request);
    
    const entry: ApiRequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: response.status >= 400 ? ApiLogLevel.WARN : ApiLogLevel.INFO,
      type: 'response',
      ...requestMetadata,
      statusCode: response.status,
      duration,
      ...metadata,
    };
    
    const formattedLog = formatLogEntry(entry);
    
    if (response.status >= 500) {
      console.error('[API RESPONSE]', formattedLog);
    } else if (response.status >= 400) {
      console.warn('[API RESPONSE]', formattedLog);
    } else {
      console.info('[API RESPONSE]', formattedLog);
    }
  }
  
  /**
   * Log an API error
   * Requirements: 13.3 - Log errors with stack trace and context information
   */
  static logError(
    request: NextRequest,
    error: unknown,
    metadata?: {
      userId?: string;
      apiKeyId?: string;
      context?: Record<string, any>;
    }
  ): void {
    const requestMetadata = extractRequestMetadata(request);
    
    const errorInfo: ApiRequestLogEntry['error'] = {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    const entry: ApiRequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: ApiLogLevel.ERROR,
      type: 'error',
      ...requestMetadata,
      error: errorInfo,
      metadata: metadata?.context,
      userId: metadata?.userId,
      apiKeyId: metadata?.apiKeyId,
    };
    
    const formattedLog = formatLogEntry(entry);
    console.error('[API ERROR]', formattedLog);
    
    // TODO: In production, send to logging service (e.g., Datadog, Sentry, CloudWatch)
    // Requirements: 13.10 - Maintain logs for at least 90 days
    // await sendToLoggingService(entry);
  }
  
  /**
   * Log a critical error that requires immediate attention
   * Requirements: 13.9 - Set up alerting for critical errors
   */
  static logCriticalError(
    request: NextRequest,
    error: unknown,
    metadata?: {
      userId?: string;
      apiKeyId?: string;
      context?: Record<string, any>;
    }
  ): void {
    const requestMetadata = extractRequestMetadata(request);
    
    const errorInfo: ApiRequestLogEntry['error'] = {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    const entry: ApiRequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: ApiLogLevel.CRITICAL,
      type: 'error',
      ...requestMetadata,
      error: errorInfo,
      metadata: metadata?.context,
      userId: metadata?.userId,
      apiKeyId: metadata?.apiKeyId,
    };
    
    const formattedLog = formatLogEntry(entry);
    console.error('[API CRITICAL ERROR]', formattedLog);
    
    // Send alert to administrators
    // Requirements: 13.9 - Send alerts to administrators
    if (error instanceof Error) {
      alertService.sendCriticalErrorAlert(error, {
        endpoint: requestMetadata.endpoint,
        userId: metadata?.userId,
        additionalInfo: metadata?.context,
      }).catch(alertError => {
        console.error('[ALERT] Failed to send critical error alert:', alertError);
      });
    }
  }
  
  /**
   * Log a database error
   * Requirements: 13.5 - Log database errors with full details
   */
  static logDatabaseError(
    request: NextRequest,
    error: unknown,
    metadata?: {
      userId?: string;
      query?: string;
      params?: any;
    }
  ): void {
    const requestMetadata = extractRequestMetadata(request);
    
    const errorInfo: ApiRequestLogEntry['error'] = {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    const entry: ApiRequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: ApiLogLevel.ERROR,
      type: 'error',
      ...requestMetadata,
      error: errorInfo,
      metadata: {
        errorType: 'database',
        // Don't log sensitive query details in production
        ...(process.env.NODE_ENV === 'development' && {
          query: metadata?.query,
          params: metadata?.params,
        }),
      },
      userId: metadata?.userId,
    };
    
    const formattedLog = formatLogEntry(entry);
    console.error('[DATABASE ERROR]', formattedLog);
  }
}

/**
 * Middleware to log API requests and responses
 * Requirements: 13.7 - Log all API requests with timestamp, endpoint, user_id, and response status
 * 
 * @example
 * export const GET = withApiLogging(async (request: NextRequest) => {
 *   // Your route logic here
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withApiLogging<T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: {
    extractUserId?: (request: NextRequest) => Promise<string | undefined>;
    extractApiKeyId?: (request: NextRequest) => Promise<string | undefined>;
  }
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    
    // Extract user context if provided
    const userId = options?.extractUserId ? await options.extractUserId(request) : undefined;
    const apiKeyId = options?.extractApiKeyId ? await options.extractApiKeyId(request) : undefined;
    
    // Log request
    ApiLogger.logRequest(request, { userId, apiKeyId });
    
    try {
      // Execute handler
      const response = await handler(request, ...args);
      
      // Log response
      const duration = Date.now() - startTime;
      ApiLogger.logResponse(request, response, duration, { userId, apiKeyId });
      
      return response;
    } catch (error) {
      // Log error
      ApiLogger.logError(request, error, { userId, apiKeyId });
      throw error;
    }
  }) as T;
}

/**
 * Helper to create a logging context for a request
 * Useful for passing context through multiple function calls
 */
export interface LoggingContext {
  request: NextRequest;
  userId?: string;
  apiKeyId?: string;
  startTime: number;
}

export function createLoggingContext(
  request: NextRequest,
  metadata?: {
    userId?: string;
    apiKeyId?: string;
  }
): LoggingContext {
  return {
    request,
    userId: metadata?.userId,
    apiKeyId: metadata?.apiKeyId,
    startTime: Date.now(),
  };
}

/**
 * Log from a logging context
 */
export function logFromContext(
  context: LoggingContext,
  level: ApiLogLevel,
  message: string,
  additionalMetadata?: Record<string, any>
): void {
  const requestMetadata = extractRequestMetadata(context.request);
  
  const entry: ApiRequestLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    type: 'request',
    ...requestMetadata,
    userId: context.userId,
    apiKeyId: context.apiKeyId,
    metadata: {
      message,
      ...additionalMetadata,
    },
  };
  
  const formattedLog = formatLogEntry(entry);
  
  switch (level) {
    case ApiLogLevel.DEBUG:
      console.debug('[API]', formattedLog);
      break;
    case ApiLogLevel.INFO:
      console.info('[API]', formattedLog);
      break;
    case ApiLogLevel.WARN:
      console.warn('[API]', formattedLog);
      break;
    case ApiLogLevel.ERROR:
    case ApiLogLevel.CRITICAL:
      console.error('[API]', formattedLog);
      break;
  }
}
