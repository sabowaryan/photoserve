--[[----------------------------------------------------------------------------

test_error_handler.lua
Unit tests for PikSendErrorHandler module

Tests:
- API error parsing
- Error categorization
- User message formatting
- Error handling workflow

------------------------------------------------------------------------------]]

-- Mock dependencies
package.loaded['PikSendLogger'] = {
  error = function() end,
  warn = function() end,
  info = function() end,
  debug = function() end,
}

-- Mock json module
package.loaded['json'] = {
  decode = function(str)
    -- Simple JSON parser for tests
    if not str then return nil end
    if str:find('"error"') then
      if str:find('"TOKEN_INVALID"') then
        return {error = {code = 'TOKEN_INVALID', message = 'Invalid token', details = 'Token has expired'}}
      end
      if str:find('"SERVER_ERROR"') then
        return {error = {code = 'SERVER_ERROR'}}
      end
      if str:find('"TITLE_TOO_LONG"') then
        return {error = {code = 'TITLE_TOO_LONG'}}
      end
    end
    if str:find('"message"') and str:find('Gallery not found') then
      return {message = 'Gallery not found'}
    end
    return nil
  end,
  encode = function(tbl) return '' end,
}

local PikSendErrorHandler = require 'PikSendErrorHandler'

describe('PikSendErrorHandler', function()
  
  describe('parseAPIError', function()
    it('should parse JSON error response', function()
      local response = '{"error":{"code":"TOKEN_INVALID","message":"Invalid token","details":"Token has expired"}}'
      local error = PikSendErrorHandler.parseAPIError(response, 401)
      
      assert.equals(error.code, 'TOKEN_INVALID')
      assert.equals(error.message, 'Invalid token')
      assert.equals(error.details, 'Token has expired')
      assert.equals(error.statusCode, 401)
    end)
    
    it('should handle simple message format', function()
      local response = '{"message":"Gallery not found"}'
      local error = PikSendErrorHandler.parseAPIError(response, 404)
      
      assert.equals(error.message, 'Gallery not found')
      assert.equals(error.statusCode, 404)
    end)
    
    it('should map HTTP status code when no specific error', function()
      local response = nil
      local error = PikSendErrorHandler.parseAPIError(response, 401)
      
      assert.equals(error.code, 'TOKEN_INVALID')
      assert.equals(error.statusCode, 401)
    end)
    
    it('should handle invalid JSON gracefully', function()
      local response = 'Not a JSON response'
      local error = PikSendErrorHandler.parseAPIError(response, 500)
      
      assert.equals(error.code, 'SERVER_ERROR')
    end)
  end)
  
  describe('categorizeError', function()
    it('should categorize authentication errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('TOKEN_INVALID'), 'authentication')
      assert.equals(PikSendErrorHandler.categorizeError('TOKEN_EXPIRED'), 'authentication')
      assert.equals(PikSendErrorHandler.categorizeError('UNAUTHORIZED'), 'authentication')
      assert.equals(PikSendErrorHandler.categorizeError('PLAN_NOT_PRO'), 'authentication')
    end)
    
    it('should categorize network errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('NETWORK_TIMEOUT'), 'network')
      assert.equals(PikSendErrorHandler.categorizeError('CONNECTION_LOST'), 'network')
      assert.equals(PikSendErrorHandler.categorizeError('SERVER_ERROR'), 'network')
      assert.equals(PikSendErrorHandler.categorizeError('SERVICE_UNAVAILABLE'), 'network')
    end)
    
    it('should categorize validation errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('TITLE_TOO_SHORT'), 'validation')
      assert.equals(PikSendErrorHandler.categorizeError('TITLE_TOO_LONG'), 'validation')
      assert.equals(PikSendErrorHandler.categorizeError('INVALID_FORMAT'), 'validation')
    end)
    
    it('should categorize upload errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('UPLOAD_FAILED'), 'upload')
      assert.equals(PikSendErrorHandler.categorizeError('QUOTA_EXCEEDED'), 'upload')
      assert.equals(PikSendErrorHandler.categorizeError('GALLERY_EXPIRED'), 'upload')
      assert.equals(PikSendErrorHandler.categorizeError('FILE_TOO_LARGE'), 'upload')
    end)
    
    it('should categorize system errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('FILE_NOT_FOUND'), 'system')
      assert.equals(PikSendErrorHandler.categorizeError('PERMISSION_DENIED'), 'system')
      assert.equals(PikSendErrorHandler.categorizeError('INSUFFICIENT_MEMORY'), 'system')
    end)
    
    it('should return unknown for unrecognized errors', function()
      assert.equals(PikSendErrorHandler.categorizeError('SOME_RANDOM_ERROR'), 'unknown')
      assert.equals(PikSendErrorHandler.categorizeError(nil), 'unknown')
    end)
  end)
  
  describe('formatUserMessage', function()
    it('should format error message with template', function()
      local formatted = PikSendErrorHandler.formatUserMessage('TOKEN_INVALID')
      
      assert.equals(formatted.title, 'Token API invalide')
      assert.is_not_nil(formatted.message)
      assert.is_not_nil(formatted.action)
    end)
    
    it('should use API message when provided', function()
      local formatted = PikSendErrorHandler.formatUserMessage('TOKEN_INVALID', 'Custom API message')
      
      assert.equals(formatted.title, 'Token API invalide')
      assert.equals(formatted.message, 'Custom API message')
    end)
    
    it('should append details when provided', function()
      local formatted = PikSendErrorHandler.formatUserMessage('FILE_TOO_LARGE', nil, 'File size: 600 MB')
      
      assert.is_true(string.find(formatted.message, 'File size: 600 MB') ~= nil)
    end)
    
    it('should handle unknown error codes', function()
      local formatted = PikSendErrorHandler.formatUserMessage('UNKNOWN_CODE')
      
      assert.equals(formatted.title, 'Erreur inconnue')
    end)
  end)
  
  describe('handleAPIError', function()
    it('should return complete error info', function()
      local response = '{"error":{"code":"TOKEN_INVALID","message":"Invalid token"}}'
      local errorInfo = PikSendErrorHandler.handleAPIError(response, 401)
      
      assert.equals(errorInfo.category, 'authentication')
      assert.equals(errorInfo.code, 'TOKEN_INVALID')
      assert.is_not_nil(errorInfo.title)
      assert.is_not_nil(errorInfo.message)
      assert.is_not_nil(errorInfo.action)
      assert.equals(errorInfo.statusCode, 401)
    end)
    
    it('should mark network errors as retryable', function()
      local response = '{"error":{"code":"SERVER_ERROR"}}'
      local errorInfo = PikSendErrorHandler.handleAPIError(response, 500)
      
      assert.equals(errorInfo.category, 'network')
      assert.is_true(errorInfo.shouldRetry)
    end)
    
    it('should mark validation errors as non-retryable', function()
      local response = '{"error":{"code":"TITLE_TOO_LONG"}}'
      local errorInfo = PikSendErrorHandler.handleAPIError(response, 400)
      
      assert.equals(errorInfo.category, 'validation')
      assert.is_false(errorInfo.shouldRetry)
    end)
  end)
  
  describe('handleNetworkError', function()
    it('should handle generic network error', function()
      local errorInfo = PikSendErrorHandler.handleNetworkError('Connection failed')
      
      assert.equals(errorInfo.category, 'network')
      assert.equals(errorInfo.code, 'CONNECTION_LOST')
      assert.is_true(errorInfo.shouldRetry)
    end)
    
    it('should detect timeout errors', function()
      local errorInfo = PikSendErrorHandler.handleNetworkError('Request timeout')
      
      assert.equals(errorInfo.code, 'NETWORK_TIMEOUT')
      assert.is_true(errorInfo.shouldRetry)
    end)
  end)
  
  describe('handleValidationError', function()
    it('should handle validation error', function()
      local errorInfo = PikSendErrorHandler.handleValidationError('TITLE_TOO_SHORT')
      
      assert.equals(errorInfo.category, 'validation')
      assert.equals(errorInfo.code, 'TITLE_TOO_SHORT')
      assert.is_false(errorInfo.shouldRetry)
    end)
    
    it('should include details in message', function()
      local errorInfo = PikSendErrorHandler.handleValidationError('FILE_TOO_LARGE', 'Size: 600 MB')
      
      assert.is_true(string.find(errorInfo.message, 'Size: 600 MB') ~= nil)
    end)
  end)
  
  describe('isRetryable', function()
    it('should return true for retryable errors', function()
      local errorInfo = { shouldRetry = true }
      assert.is_true(PikSendErrorHandler.isRetryable(errorInfo))
    end)
    
    it('should return false for non-retryable errors', function()
      local errorInfo = { shouldRetry = false }
      assert.is_false(PikSendErrorHandler.isRetryable(errorInfo))
    end)
  end)
  
  describe('getSeverity', function()
    it('should return critical for authentication errors', function()
      assert.equals(PikSendErrorHandler.getSeverity('authentication'), 'critical')
    end)
    
    it('should return critical for system errors', function()
      assert.equals(PikSendErrorHandler.getSeverity('system'), 'critical')
    end)
    
    it('should return error for network errors', function()
      assert.equals(PikSendErrorHandler.getSeverity('network'), 'error')
    end)
    
    it('should return error for upload errors', function()
      assert.equals(PikSendErrorHandler.getSeverity('upload'), 'error')
    end)
    
    it('should return warning for other errors', function()
      assert.equals(PikSendErrorHandler.getSeverity('validation'), 'warning')
      assert.equals(PikSendErrorHandler.getSeverity('unknown'), 'warning')
    end)
  end)
  
  describe('getErrorMessage', function()
    it('should return complete error message string', function()
      local message = PikSendErrorHandler.getErrorMessage('TOKEN_INVALID')
      
      assert.is_true(string.find(message, 'Token API') ~= nil)
      assert.is_true(string.find(message, 'dashboard') ~= nil)
    end)
    
    it('should include API message when provided', function()
      local message = PikSendErrorHandler.getErrorMessage('TOKEN_INVALID', 'Custom message')
      
      assert.is_true(string.find(message, 'Custom message') ~= nil)
    end)
  end)
  
end)
