/**
 * Security Logging Utility
 * 
 * Provides structured logging for security-related events including
 * authentication failures, admin actions, and sensitive operations.
 * 
 * Requirements: 12.6, 13.6, 13.8
 */

/**
 * Log levels for security events
 */
export enum SecurityLogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  NON_PRO_USER_ATTEMPT = 'NON_PRO_USER_ATTEMPT',
  
  // API key management events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED_BY_USER = 'API_KEY_REVOKED_BY_USER',
  API_KEY_DELETED = 'API_KEY_DELETED',
  
  // Admin actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_PLUGIN_VERSION_CREATED = 'ADMIN_PLUGIN_VERSION_CREATED',
  ADMIN_PLUGIN_VERSION_UPDATED = 'ADMIN_PLUGIN_VERSION_UPDATED',
  ADMIN_PLUGIN_VERSION_DELETED = 'ADMIN_PLUGIN_VERSION_DELETED',
  ADMIN_PLUGIN_FILE_UPLOADED = 'ADMIN_PLUGIN_FILE_UPLOADED',
  ADMIN_STATS_ACCESSED = 'ADMIN_STATS_ACCESSED',
  ADMIN_USAGE_LOGS_ACCESSED = 'ADMIN_USAGE_LOGS_ACCESSED',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // CORS events
  CORS_VIOLATION = 'CORS_VIOLATION',
  
  // General security events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  FORBIDDEN_ACCESS_ATTEMPT = 'FORBIDDEN_ACCESS_ATTEMPT',
}

/**
 * Security log entry structure
 */
interface SecurityLogEntry {
  timestamp: string;
  level: SecurityLogLevel;
  eventType: SecurityEventType;
  message: string;
  userId?: string;
  apiKeyId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, any>;
}

/**
 * Format a security log entry as a structured JSON string
 */
function formatLogEntry(entry: SecurityLogEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    service: 'piksend-plugin-infrastructure',
  });
}

/**
 * Log a security event
 */
function logSecurityEvent(
  level: SecurityLogLevel,
  eventType: SecurityEventType,
  message: string,
  metadata?: Partial<Omit<SecurityLogEntry, 'timestamp' | 'level' | 'eventType' | 'message'>>
): void {
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    eventType,
    message,
    ...metadata,
  };
  
  const formattedLog = formatLogEntry(entry);
  
  // Log to console with appropriate level
  switch (level) {
    case SecurityLogLevel.INFO:
      console.info('[SECURITY]', formattedLog);
      break;
    case SecurityLogLevel.WARN:
      console.warn('[SECURITY]', formattedLog);
      break;
    case SecurityLogLevel.ERROR:
      console.error('[SECURITY]', formattedLog);
      break;
    case SecurityLogLevel.CRITICAL:
      console.error('[SECURITY CRITICAL]', formattedLog);
      // In production, this should also trigger alerts
      break;
  }
  
  // TODO: In production, send to logging service (e.g., Datadog, Sentry, CloudWatch)
  // await sendToLoggingService(entry);
}

/**
 * Security Logger Class
 * Provides methods for logging different types of security events
 */
export class SecurityLogger {
  /**
   * Log an authentication failure
   */
  static logAuthFailure(
    reason: 'invalid_key' | 'expired_key' | 'revoked_key' | 'non_pro_user' | 'missing_key',
    metadata?: {
      userId?: string;
      apiKeyId?: string;
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
    }
  ): void {
    const eventTypeMap = {
      invalid_key: SecurityEventType.API_KEY_INVALID,
      expired_key: SecurityEventType.API_KEY_EXPIRED,
      revoked_key: SecurityEventType.API_KEY_REVOKED,
      non_pro_user: SecurityEventType.NON_PRO_USER_ATTEMPT,
      missing_key: SecurityEventType.AUTH_FAILURE,
    };
    
    logSecurityEvent(
      SecurityLogLevel.WARN,
      eventTypeMap[reason],
      `Authentication failed: ${reason}`,
      metadata
    );
  }
  
  /**
   * Log a successful authentication
   */
  static logAuthSuccess(
    userId: string,
    apiKeyId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.INFO,
      SecurityEventType.AUTH_SUCCESS,
      'Authentication successful',
      {
        userId,
        apiKeyId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log API key creation
   */
  static logApiKeyCreated(
    userId: string,
    apiKeyId: string,
    metadata?: {
      keyName?: string;
      expiresAt?: string;
      ipAddress?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.INFO,
      SecurityEventType.API_KEY_CREATED,
      'API key created',
      {
        userId,
        apiKeyId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log API key revocation
   */
  static logApiKeyRevoked(
    userId: string,
    apiKeyId: string,
    metadata?: {
      keyName?: string;
      ipAddress?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.INFO,
      SecurityEventType.API_KEY_REVOKED_BY_USER,
      'API key revoked',
      {
        userId,
        apiKeyId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log API key deletion
   */
  static logApiKeyDeleted(
    userId: string,
    apiKeyId: string,
    metadata?: {
      keyName?: string;
      ipAddress?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.INFO,
      SecurityEventType.API_KEY_DELETED,
      'API key deleted',
      {
        userId,
        apiKeyId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log admin action
   */
  static logAdminAction(
    action: 'login' | 'version_created' | 'version_updated' | 'version_deleted' | 'file_uploaded' | 'stats_accessed' | 'logs_accessed',
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
      details?: Record<string, any>;
    }
  ): void {
    const eventTypeMap = {
      login: SecurityEventType.ADMIN_LOGIN,
      version_created: SecurityEventType.ADMIN_PLUGIN_VERSION_CREATED,
      version_updated: SecurityEventType.ADMIN_PLUGIN_VERSION_UPDATED,
      version_deleted: SecurityEventType.ADMIN_PLUGIN_VERSION_DELETED,
      file_uploaded: SecurityEventType.ADMIN_PLUGIN_FILE_UPLOADED,
      stats_accessed: SecurityEventType.ADMIN_STATS_ACCESSED,
      logs_accessed: SecurityEventType.ADMIN_USAGE_LOGS_ACCESSED,
    };
    
    logSecurityEvent(
      SecurityLogLevel.INFO,
      eventTypeMap[action],
      `Admin action: ${action}`,
      {
        userId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log rate limit exceeded
   */
  static logRateLimitExceeded(
    apiKeyId: string,
    metadata?: {
      ipAddress?: string;
      endpoint?: string;
      retryAfter?: number;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.WARN,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      {
        apiKeyId,
        ...metadata,
      }
    );
  }
  
  /**
   * Log CORS violation
   */
  static logCorsViolation(
    origin: string,
    metadata?: {
      endpoint?: string;
      method?: string;
      ipAddress?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.WARN,
      SecurityEventType.CORS_VIOLATION,
      `CORS violation from origin: ${origin}`,
      {
        ...metadata,
        metadata: { origin },
      }
    );
  }
  
  /**
   * Log unauthorized access attempt
   */
  static logUnauthorizedAccess(
    endpoint: string,
    metadata?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      method?: string;
      reason?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.WARN,
      SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      `Unauthorized access attempt to ${endpoint}`,
      {
        endpoint,
        ...metadata,
      }
    );
  }
  
  /**
   * Log forbidden access attempt
   */
  static logForbiddenAccess(
    endpoint: string,
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      method?: string;
      reason?: string;
    }
  ): void {
    logSecurityEvent(
      SecurityLogLevel.WARN,
      SecurityEventType.FORBIDDEN_ACCESS_ATTEMPT,
      `Forbidden access attempt to ${endpoint}`,
      {
        endpoint,
        userId,
        ...metadata,
      }
    );
  }
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
} {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    endpoint: new URL(request.url).pathname,
    method: request.method,
  };
}
