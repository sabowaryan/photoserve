--[[----------------------------------------------------------------------------

PikSendErrorHandler.lua
Error handling and message formatting for PikSend plugin

Handles:
- Parsing API error responses
- Formatting user-friendly error messages
- Providing actionable error messages
- Categorizing errors by type
- Integration with retry system

------------------------------------------------------------------------------]]

local PikSendLogger = require 'PikSendLogger'

local PikSendErrorHandler = {}

--------------------------------------------------------------------------------
-- Error Categories
--------------------------------------------------------------------------------

local ERROR_CATEGORIES = {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UPLOAD = 'upload',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

--------------------------------------------------------------------------------
-- Error Message Templates
--------------------------------------------------------------------------------

local ERROR_MESSAGES = {
  -- Authentication errors
  TOKEN_INVALID = {
    title = 'Token API invalide',
    message = 'Le token API fourni n\'est pas valide. Veuillez vérifier votre token et réessayer.',
    action = 'Générez un nouveau token depuis votre dashboard PikSend.',
  },
  TOKEN_EXPIRED = {
    title = 'Token expiré',
    message = 'Votre token API a expiré.',
    action = 'Veuillez vous reconnecter avec un nouveau token.',
  },
  PLAN_NOT_PRO = {
    title = 'Plan Pro requis',
    message = 'Le plugin Lightroom est réservé aux utilisateurs avec un plan Pro.',
    action = 'Veuillez upgrader votre plan pour utiliser cette fonctionnalité.',
  },
  UNAUTHORIZED = {
    title = 'Non autorisé',
    message = 'Vous n\'êtes pas autorisé à effectuer cette action.',
    action = 'Vérifiez vos permissions ou reconnectez-vous.',
  },
  
  -- Network errors
  NETWORK_TIMEOUT = {
    title = 'Délai d\'attente dépassé',
    message = 'La connexion au serveur a pris trop de temps.',
    action = 'Vérifiez votre connexion internet et réessayez.',
  },
  CONNECTION_LOST = {
    title = 'Connexion perdue',
    message = 'La connexion au serveur a été interrompue.',
    action = 'Vérifiez votre connexion internet et réessayez.',
  },
  SERVER_ERROR = {
    title = 'Erreur serveur',
    message = 'Le serveur PikSend a rencontré une erreur.',
    action = 'Veuillez réessayer dans quelques instants.',
  },
  SERVICE_UNAVAILABLE = {
    title = 'Service indisponible',
    message = 'Le service PikSend est temporairement indisponible.',
    action = 'Veuillez réessayer plus tard.',
  },
  
  -- Validation errors
  TITLE_TOO_SHORT = {
    title = 'Titre trop court',
    message = 'Le titre de la galerie doit contenir au moins 1 caractère.',
    action = 'Veuillez saisir un titre valide.',
  },
  TITLE_TOO_LONG = {
    title = 'Titre trop long',
    message = 'Le titre de la galerie ne peut pas dépasser 200 caractères.',
    action = 'Veuillez raccourcir le titre.',
  },
  FILE_TOO_LARGE = {
    title = 'Fichier trop volumineux',
    message = 'Le fichier dépasse la taille maximale autorisée de 500 MB.',
    action = 'Veuillez réduire la qualité ou la résolution de l\'image.',
  },
  INVALID_FORMAT = {
    title = 'Format non supporté',
    message = 'Le format de fichier n\'est pas supporté.',
    action = 'Formats acceptés: JPEG, PNG, TIFF.',
  },
  
  -- Upload errors
  UPLOAD_FAILED = {
    title = 'Échec de l\'upload',
    message = 'L\'upload de l\'image a échoué.',
    action = 'Veuillez réessayer.',
  },
  QUOTA_EXCEEDED = {
    title = 'Quota de stockage atteint',
    message = 'Vous avez atteint votre limite de stockage.',
    action = 'Libérez de l\'espace ou upgradez votre plan.',
  },
  GALLERY_EXPIRED = {
    title = 'Galerie expirée',
    message = 'La galerie sélectionnée a expiré.',
    action = 'Veuillez créer une nouvelle galerie.',
  },
  GALLERY_NOT_FOUND = {
    title = 'Galerie introuvable',
    message = 'La galerie sélectionnée n\'existe plus.',
    action = 'Veuillez sélectionner ou créer une autre galerie.',
  },
  
  -- System errors
  FILE_NOT_FOUND = {
    title = 'Fichier introuvable',
    message = 'Le fichier à uploader n\'a pas été trouvé.',
    action = 'Vérifiez que le fichier existe toujours.',
  },
  PERMISSION_DENIED = {
    title = 'Permission refusée',
    message = 'Impossible d\'accéder au fichier.',
    action = 'Vérifiez les permissions du fichier.',
  },
  INSUFFICIENT_MEMORY = {
    title = 'Mémoire insuffisante',
    message = 'Pas assez de mémoire disponible pour cette opération.',
    action = 'Fermez d\'autres applications et réessayez.',
  },
  
  -- Generic error
  UNKNOWN_ERROR = {
    title = 'Erreur inconnue',
    message = 'Une erreur inattendue s\'est produite.',
    action = 'Veuillez consulter les logs pour plus de détails.',
  },
}

--------------------------------------------------------------------------------
-- HTTP Status Code Mapping
--------------------------------------------------------------------------------

local HTTP_STATUS_ERRORS = {
  [400] = 'VALIDATION',
  [401] = 'TOKEN_INVALID',
  [403] = 'UNAUTHORIZED',
  [404] = 'GALLERY_NOT_FOUND',
  [408] = 'NETWORK_TIMEOUT',
  [413] = 'FILE_TOO_LARGE',
  [429] = 'QUOTA_EXCEEDED',
  [500] = 'SERVER_ERROR',
  [502] = 'SERVER_ERROR',
  [503] = 'SERVICE_UNAVAILABLE',
  [504] = 'NETWORK_TIMEOUT',
}

--------------------------------------------------------------------------------
-- Error Parsing Functions
--------------------------------------------------------------------------------

-- Parse API error response
-- @param response string - HTTP response body
-- @param statusCode number - HTTP status code (optional)
-- @return table - Parsed error {code, message, details}
function PikSendErrorHandler.parseAPIError(response, statusCode)
  local error = {
    code = 'UNKNOWN_ERROR',
    message = nil,
    details = nil,
    statusCode = statusCode,
  }
  
  -- Try to parse JSON error response
  if response then
    local success, data = pcall(function()
      return require('json').decode(response)
    end)
    
    if success and data then
      -- Extract error information from API response
      if data.error then
        error.code = data.error.code or error.code
        error.message = data.error.message
        error.details = data.error.details
      elseif data.message then
        error.message = data.message
      end
    end
  end
  
  -- Map HTTP status code to error code if no specific code provided
  if not error.message and statusCode and HTTP_STATUS_ERRORS[statusCode] then
    error.code = HTTP_STATUS_ERRORS[statusCode]
  end
  
  return error
end

-- Categorize error by type
-- @param errorCode string - Error code
-- @return string - Error category
function PikSendErrorHandler.categorizeError(errorCode)
  if not errorCode then
    return ERROR_CATEGORIES.UNKNOWN
  end
  
  -- Authentication errors
  if string.find(errorCode, 'TOKEN') or string.find(errorCode, 'AUTH') or 
     string.find(errorCode, 'UNAUTHORIZED') or string.find(errorCode, 'PLAN') then
    return ERROR_CATEGORIES.AUTHENTICATION
  end
  
  -- Network errors
  if string.find(errorCode, 'NETWORK') or string.find(errorCode, 'CONNECTION') or
     string.find(errorCode, 'TIMEOUT') or string.find(errorCode, 'SERVER') or
     string.find(errorCode, 'SERVICE') then
    return ERROR_CATEGORIES.NETWORK
  end
  
  -- Validation errors
  if string.find(errorCode, 'TITLE') or string.find(errorCode, 'FORMAT') or
     string.find(errorCode, 'VALIDATION') then
    return ERROR_CATEGORIES.VALIDATION
  end
  
  -- Upload errors
  if string.find(errorCode, 'UPLOAD') or string.find(errorCode, 'QUOTA') or
     string.find(errorCode, 'GALLERY') or string.find(errorCode, 'FILE_TOO_LARGE') then
    return ERROR_CATEGORIES.UPLOAD
  end
  
  -- System errors
  if string.find(errorCode, 'FILE') or string.find(errorCode, 'PERMISSION') or
     string.find(errorCode, 'MEMORY') then
    return ERROR_CATEGORIES.SYSTEM
  end
  
  return ERROR_CATEGORIES.UNKNOWN
end

--------------------------------------------------------------------------------
-- User Message Formatting
--------------------------------------------------------------------------------

-- Format error message for display to user
-- @param errorCode string - Error code
-- @param apiMessage string - Message from API (optional)
-- @param details string - Additional details (optional)
-- @return table - Formatted error {title, message, action}
function PikSendErrorHandler.formatUserMessage(errorCode, apiMessage, details)
  local template = ERROR_MESSAGES[errorCode] or ERROR_MESSAGES.UNKNOWN_ERROR
  
  local formattedError = {
    title = template.title,
    message = template.message,
    action = template.action,
  }
  
  -- If API provided a specific message, use it
  if apiMessage and apiMessage ~= '' then
    formattedError.message = apiMessage
  end
  
  -- Add details if available
  if details and details ~= '' then
    formattedError.message = formattedError.message .. '\n\nDétails: ' .. details
  end
  
  return formattedError
end

-- Get full error message as string
-- @param errorCode string - Error code
-- @param apiMessage string - Message from API (optional)
-- @param details string - Additional details (optional)
-- @return string - Complete error message
function PikSendErrorHandler.getErrorMessage(errorCode, apiMessage, details)
  local formatted = PikSendErrorHandler.formatUserMessage(errorCode, apiMessage, details)
  
  local message = formatted.message
  if formatted.action then
    message = message .. '\n\n' .. formatted.action
  end
  
  return message
end

--------------------------------------------------------------------------------
-- Error Handling Workflow
--------------------------------------------------------------------------------

-- Handle API error and return user-friendly message
-- @param response string - HTTP response body
-- @param statusCode number - HTTP status code (optional)
-- @return table - Error info {category, title, message, action, shouldRetry}
function PikSendErrorHandler.handleAPIError(response, statusCode)
  -- Parse the error
  local parsedError = PikSendErrorHandler.parseAPIError(response, statusCode)
  
  -- Log the error
  PikSendLogger.error(string.format(
    'API Error: code=%s, status=%s, message=%s',
    parsedError.code,
    tostring(statusCode or 'unknown'),
    parsedError.message or 'no message'
  ), 'PikSendErrorHandler')
  
  -- Categorize the error
  local category = PikSendErrorHandler.categorizeError(parsedError.code)
  
  -- Format user message
  local userMessage = PikSendErrorHandler.formatUserMessage(
    parsedError.code,
    parsedError.message,
    parsedError.details
  )
  
  -- Determine if retry is appropriate
  local shouldRetry = category == ERROR_CATEGORIES.NETWORK or
                      category == ERROR_CATEGORIES.UPLOAD
  
  return {
    category = category,
    code = parsedError.code,
    title = userMessage.title,
    message = userMessage.message,
    action = userMessage.action,
    shouldRetry = shouldRetry,
    statusCode = statusCode,
  }
end

-- Handle network error (no response received)
-- @param errorMessage string - Error message from network layer
-- @return table - Error info
function PikSendErrorHandler.handleNetworkError(errorMessage)
  PikSendLogger.error('Network Error: ' .. (errorMessage or 'unknown'), 'PikSendErrorHandler')
  
  local errorCode = 'CONNECTION_LOST'
  
  -- Check if it's a timeout
  if errorMessage and string.find(string.lower(errorMessage), 'timeout') then
    errorCode = 'NETWORK_TIMEOUT'
  end
  
  local userMessage = PikSendErrorHandler.formatUserMessage(errorCode)
  
  return {
    category = ERROR_CATEGORIES.NETWORK,
    code = errorCode,
    title = userMessage.title,
    message = userMessage.message,
    action = userMessage.action,
    shouldRetry = true,
  }
end

-- Handle validation error
-- @param errorCode string - Validation error code
-- @param details string - Additional details (optional)
-- @return table - Error info
function PikSendErrorHandler.handleValidationError(errorCode, details)
  PikSendLogger.warn('Validation Error: ' .. errorCode, 'PikSendErrorHandler')
  
  local userMessage = PikSendErrorHandler.formatUserMessage(errorCode, nil, details)
  
  return {
    category = ERROR_CATEGORIES.VALIDATION,
    code = errorCode,
    title = userMessage.title,
    message = userMessage.message,
    action = userMessage.action,
    shouldRetry = false,
  }
end

--------------------------------------------------------------------------------
-- Utility Functions
--------------------------------------------------------------------------------

-- Check if error is retryable
-- @param errorInfo table - Error info from handleAPIError
-- @return boolean - true if error is retryable
function PikSendErrorHandler.isRetryable(errorInfo)
  return errorInfo.shouldRetry == true
end

-- Get error severity level
-- @param category string - Error category
-- @return string - Severity level (critical, error, warning)
function PikSendErrorHandler.getSeverity(category)
  if category == ERROR_CATEGORIES.AUTHENTICATION or
     category == ERROR_CATEGORIES.SYSTEM then
    return 'critical'
  elseif category == ERROR_CATEGORIES.NETWORK or
         category == ERROR_CATEGORIES.UPLOAD then
    return 'error'
  else
    return 'warning'
  end
end

--------------------------------------------------------------------------------
-- Retry Integration
--------------------------------------------------------------------------------

-- Execute a function with automatic retry for retryable errors
-- Integrates with PikSendRetry module
-- 
-- @param func function - Function to execute
-- @param options table - Options (optional)
--   - maxAttempts: number - Max retry attempts (default: 3)
--   - context: string - Context for logging
--   - onError: function - Callback for each error
-- @return boolean, any - (success, result or errorInfo)
function PikSendErrorHandler.executeWithRetry(func, options)
  local PikSendRetry = require 'PikSendRetry'
  
  options = options or {}
  
  -- Wrap the function to handle errors properly
  local wrappedFunc = function()
    local success, result = pcall(func)
    
    if not success then
      -- Function threw an error, treat as network error
      local errorInfo = PikSendErrorHandler.handleNetworkError(tostring(result))
      
      -- Call onError callback if provided
      if options.onError then
        pcall(options.onError, errorInfo)
      end
      
      -- Return error info for retry decision
      error(errorInfo)
    end
    
    return result
  end
  
  -- Execute with retry
  return PikSendRetry.executeWithRetry(wrappedFunc, {
    maxAttempts = options.maxAttempts or PikSendRetry.MAX_RETRY_ATTEMPTS,
    context = options.context or 'unknown',
    shouldRetry = function(error, attempt)
      -- If error is an errorInfo table, check shouldRetry
      if type(error) == 'table' and error.shouldRetry ~= nil then
        return error.shouldRetry
      end
      -- Default: retry
      return true
    end,
    onRetry = options.onRetry
  })
end

return PikSendErrorHandler
