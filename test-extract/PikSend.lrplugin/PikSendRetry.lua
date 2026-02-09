--[[----------------------------------------------------------------------------

PikSendRetry.lua
Retry logic with exponential backoff for PikSend plugin

Handles:
- Exponential backoff retry mechanism
- Configurable retry attempts and delays
- Retry delay calculation
- Integration with error handler

Implements:
- Requirement 10.7: Retry system with exponential backoff
- Property 45: Backoff exponentiel pour les retries

------------------------------------------------------------------------------]]

local LrTasks = import 'LrTasks'
local PikSendLogger = require 'PikSendLogger'

local PikSendRetry = {}

--------------------------------------------------------------------------------
-- Constants
--------------------------------------------------------------------------------

-- Maximum number of retry attempts (not including initial attempt)
-- Total attempts = 1 initial + 3 retries = 4 attempts
PikSendRetry.MAX_RETRY_ATTEMPTS = 3

-- Initial retry delay in seconds
-- Delays will be: 1s, 2s, 4s, 8s for attempts 1, 2, 3, 4
PikSendRetry.INITIAL_RETRY_DELAY = 1

--------------------------------------------------------------------------------
-- Retry Delay Calculation
--------------------------------------------------------------------------------

-- Calculate retry delay with exponential backoff
-- Implements exponential backoff: delay = initialDelay * (2 ^ attemptNumber)
-- 
-- @param attemptNumber number - The retry attempt number (0-based)
-- @param initialDelay number - Initial delay in seconds (optional, default: 1)
-- @return number - Delay in seconds
--
-- Examples:
--   attemptNumber 0: 1 * 2^0 = 1s
--   attemptNumber 1: 1 * 2^1 = 2s
--   attemptNumber 2: 1 * 2^2 = 4s
--   attemptNumber 3: 1 * 2^3 = 8s
function PikSendRetry.calculateDelay(attemptNumber, initialDelay)
  initialDelay = initialDelay or PikSendRetry.INITIAL_RETRY_DELAY
  
  if attemptNumber < 0 then
    attemptNumber = 0
  end
  
  return initialDelay * (2 ^ attemptNumber)
end

--------------------------------------------------------------------------------
-- Retry Execution
--------------------------------------------------------------------------------

-- Execute a function with retry and exponential backoff
-- 
-- @param func function - Function to execute (should return success, result)
-- @param options table - Retry options (optional)
--   - maxAttempts: number - Maximum retry attempts (default: 3)
--   - initialDelay: number - Initial delay in seconds (default: 1)
--   - shouldRetry: function - Function to determine if should retry (optional)
--   - onRetry: function - Callback called before each retry (optional)
--   - context: string - Context for logging (optional)
-- @return boolean, any - (success, result or error)
--
-- Example:
--   local success, result = PikSendRetry.executeWithRetry(function()
--     return PikSendAPI.uploadImage(token, galleryId, path, metadata)
--   end, { maxAttempts = 3, context = 'uploadImage' })
function PikSendRetry.executeWithRetry(func, options)
  options = options or {}
  
  local maxAttempts = options.maxAttempts or PikSendRetry.MAX_RETRY_ATTEMPTS
  local initialDelay = options.initialDelay or PikSendRetry.INITIAL_RETRY_DELAY
  local shouldRetry = options.shouldRetry
  local onRetry = options.onRetry
  local context = options.context or 'unknown'
  
  local lastError = nil
  
  -- Total attempts = 1 initial + maxAttempts retries
  for attempt = 0, maxAttempts do
    -- Log attempt
    if attempt == 0 then
      PikSendLogger.debug(string.format(
        'Executing %s (initial attempt)',
        context
      ), 'PikSendRetry')
    else
      PikSendLogger.info(string.format(
        'Retrying %s (attempt %d/%d)',
        context,
        attempt,
        maxAttempts
      ), 'PikSendRetry')
    end
    
    -- Execute function with error handling
    local success, result = pcall(func)
    
    if success and result ~= nil then
      -- Success!
      if attempt > 0 then
        PikSendLogger.info(string.format(
          'Retry successful for %s after %d attempt(s)',
          context,
          attempt
        ), 'PikSendRetry')
      end
      return true, result
    end
    
    -- Store error
    lastError = result or 'Unknown error'
    
    -- Log failure
    PikSendLogger.warn(string.format(
      'Attempt %d/%d failed for %s: %s',
      attempt + 1,
      maxAttempts + 1,
      context,
      tostring(lastError)
    ), 'PikSendRetry')
    
    -- Check if we should retry
    if attempt < maxAttempts then
      -- Check custom shouldRetry function if provided
      if shouldRetry and not shouldRetry(lastError, attempt) then
        PikSendLogger.info(string.format(
          'Stopping retries for %s (shouldRetry returned false)',
          context
        ), 'PikSendRetry')
        break
      end
      
      -- Calculate delay
      local delay = PikSendRetry.calculateDelay(attempt, initialDelay)
      
      PikSendLogger.debug(string.format(
        'Waiting %ds before retry %d/%d for %s',
        delay,
        attempt + 1,
        maxAttempts,
        context
      ), 'PikSendRetry')
      
      -- Call onRetry callback if provided
      if onRetry then
        pcall(onRetry, attempt, delay, lastError)
      end
      
      -- Wait before retry
      LrTasks.sleep(delay)
    end
  end
  
  -- All attempts failed
  PikSendLogger.error(string.format(
    'All retry attempts failed for %s after %d attempt(s): %s',
    context,
    maxAttempts + 1,
    tostring(lastError)
  ), 'PikSendRetry')
  
  return false, lastError
end

--------------------------------------------------------------------------------
-- Retry with Error Handler Integration
--------------------------------------------------------------------------------

-- Execute a function with retry, using error handler to determine if retryable
-- 
-- @param func function - Function to execute
-- @param errorHandler table - Error handler module (PikSendErrorHandler)
-- @param options table - Retry options (optional)
-- @return boolean, any - (success, result or errorInfo)
function PikSendRetry.executeWithErrorHandler(func, errorHandler, options)
  options = options or {}
  
  -- Create shouldRetry function that uses error handler
  local originalShouldRetry = options.shouldRetry
  options.shouldRetry = function(error, attempt)
    -- If custom shouldRetry provided, check it first
    if originalShouldRetry and not originalShouldRetry(error, attempt) then
      return false
    end
    
    -- Check if error handler says it's retryable
    if errorHandler and errorHandler.isRetryable then
      -- If error is a table with shouldRetry field, use it
      if type(error) == 'table' and error.shouldRetry ~= nil then
        return error.shouldRetry
      end
    end
    
    -- Default: retry on network and upload errors
    return true
  end
  
  return PikSendRetry.executeWithRetry(func, options)
end

--------------------------------------------------------------------------------
-- Utility Functions
--------------------------------------------------------------------------------

-- Get all retry delays for a given configuration
-- Useful for testing and documentation
-- 
-- @param maxAttempts number - Maximum retry attempts (optional)
-- @param initialDelay number - Initial delay in seconds (optional)
-- @return table - Array of delays in seconds
function PikSendRetry.getRetryDelays(maxAttempts, initialDelay)
  maxAttempts = maxAttempts or PikSendRetry.MAX_RETRY_ATTEMPTS
  initialDelay = initialDelay or PikSendRetry.INITIAL_RETRY_DELAY
  
  local delays = {}
  for attempt = 0, maxAttempts - 1 do
    table.insert(delays, PikSendRetry.calculateDelay(attempt, initialDelay))
  end
  
  return delays
end

-- Format retry information as string
-- 
-- @param maxAttempts number - Maximum retry attempts (optional)
-- @param initialDelay number - Initial delay in seconds (optional)
-- @return string - Formatted retry information
function PikSendRetry.formatRetryInfo(maxAttempts, initialDelay)
  local delays = PikSendRetry.getRetryDelays(maxAttempts, initialDelay)
  
  local delayStr = table.concat(delays, 's, ') .. 's'
  return string.format(
    'Max %d retries with delays: %s',
    maxAttempts or PikSendRetry.MAX_RETRY_ATTEMPTS,
    delayStr
  )
end

return PikSendRetry
