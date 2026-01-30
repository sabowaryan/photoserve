--[[----------------------------------------------------------------------------

test_error_handler_properties.lua
Property-based tests for PikSendErrorHandler module

Tests property-based invariants across many generated inputs:
- Property 41: API error message display

Framework: Busted with property-based testing
Iterations: 100+ per property

------------------------------------------------------------------------------]]

-- Mock dependencies
package.loaded['PikSendLogger'] = {
  error = function() end,
  warn = function() end,
  info = function() end,
  debug = function() end,
}

-- Mock json module with proper JSON parsing
package.loaded['json'] = {
  decode = function(str)
    if not str or str == '' then return nil end
    
    -- Try to parse as JSON-like structure
    -- Handle error object format: {"error":{"code":"...","message":"...","details":"..."}}
    local errorCode = str:match('"code"%s*:%s*"([^"]+)"')
    local errorMessage = str:match('"message"%s*:%s*"([^"]+)"')
    local errorDetails = str:match('"details"%s*:%s*"([^"]+)"')
    
    if errorCode or errorMessage then
      local result = {}
      if errorCode then
        result.error = {
          code = errorCode,
          message = errorMessage,
          details = errorDetails
        }
      elseif errorMessage then
        result.message = errorMessage
      end
      return result
    end
    
    return nil
  end,
  encode = function(tbl) return '' end,
}

local PikSendErrorHandler = require 'PikSendErrorHandler'

--------------------------------------------------------------------------------
-- Property Test Generators
--------------------------------------------------------------------------------

-- Generate random string of given length
local function generateRandomString(length)
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
  local result = ''
  for i = 1, length do
    local idx = math.random(1, #chars)
    result = result .. chars:sub(idx, idx)
  end
  return result
end

-- Generate random error code
local function generateRandomErrorCode()
  local codes = {
    'TOKEN_INVALID', 'TOKEN_EXPIRED', 'PLAN_NOT_PRO', 'UNAUTHORIZED',
    'NETWORK_TIMEOUT', 'CONNECTION_LOST', 'SERVER_ERROR', 'SERVICE_UNAVAILABLE',
    'TITLE_TOO_SHORT', 'TITLE_TOO_LONG', 'FILE_TOO_LARGE', 'INVALID_FORMAT',
    'UPLOAD_FAILED', 'QUOTA_EXCEEDED', 'GALLERY_EXPIRED', 'GALLERY_NOT_FOUND',
    'FILE_NOT_FOUND', 'PERMISSION_DENIED', 'INSUFFICIENT_MEMORY',
    'UNKNOWN_ERROR', 'CUSTOM_ERROR_' .. math.random(1, 100)
  }
  return codes[math.random(1, #codes)]
end

-- Generate random HTTP status code
local function generateRandomStatusCode()
  local codes = {200, 400, 401, 403, 404, 408, 413, 429, 500, 502, 503, 504}
  return codes[math.random(1, #codes)]
end

-- Generate API error response JSON
local function generateAPIErrorResponse(includeMessage, includeDetails)
  local code = generateRandomErrorCode()
  local message = includeMessage and generateRandomString(math.random(10, 100)) or nil
  local details = includeDetails and generateRandomString(math.random(10, 50)) or nil
  
  local json = '{"error":{"code":"' .. code .. '"'
  if message then
    json = json .. ',"message":"' .. message .. '"'
  end
  if details then
    json = json .. ',"details":"' .. details .. '"'
  end
  json = json .. '}}'
  
  return json, code, message, details
end

-- Generate simple message format API response
local function generateSimpleMessageResponse()
  local message = generateRandomString(math.random(10, 100))
  return '{"message":"' .. message .. '"}', message
end

--------------------------------------------------------------------------------
-- Property 41: Affichage des messages d'erreur API
-- **Validates: Requirements 9.7**
--
-- Property: For any API error response, the error message from the API
-- must be extracted and displayed to the user
--------------------------------------------------------------------------------

describe('Property 41: API Error Message Display', function()
  
  it('should extract and display API error messages from error object format', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate API error response with message
      local response, expectedCode, expectedMessage, expectedDetails = 
        generateAPIErrorResponse(true, math.random() > 0.5)
      local statusCode = generateRandomStatusCode()
      
      -- Handle the API error
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      
      -- Verify that the error info contains the API message
      assert.is_not_nil(errorInfo, 'Error info should not be nil')
      assert.is_not_nil(errorInfo.message, 'Error message should not be nil')
      
      -- The message should either be the API message or a template message
      -- If API message was provided, it should be included
      if expectedMessage then
        -- The formatted message should contain the API message
        local messageFound = string.find(errorInfo.message, expectedMessage, 1, true) ~= nil
        assert.is_true(messageFound, 
          string.format('API message "%s" should be in error message "%s"', 
            expectedMessage, errorInfo.message))
      end
      
      -- If details were provided, they should be included
      if expectedDetails then
        local detailsFound = string.find(errorInfo.message, expectedDetails, 1, true) ~= nil
        assert.is_true(detailsFound,
          string.format('API details "%s" should be in error message "%s"',
            expectedDetails, errorInfo.message))
      end
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations, 
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should extract and display API messages from simple message format', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate simple message format response
      local response, expectedMessage = generateSimpleMessageResponse()
      local statusCode = generateRandomStatusCode()
      
      -- Parse the API error
      local parsedError = PikSendErrorHandler.parseAPIError(response, statusCode)
      
      -- Verify that the message was extracted
      assert.is_not_nil(parsedError, 'Parsed error should not be nil')
      assert.equals(parsedError.message, expectedMessage,
        string.format('Parsed message should be "%s"', expectedMessage))
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should display API message in formatUserMessage when provided', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate random error code and API message
      local errorCode = generateRandomErrorCode()
      local apiMessage = generateRandomString(math.random(10, 100))
      local details = math.random() > 0.5 and generateRandomString(math.random(10, 50)) or nil
      
      -- Format the user message
      local formatted = PikSendErrorHandler.formatUserMessage(errorCode, apiMessage, details)
      
      -- Verify that the formatted message contains the API message
      assert.is_not_nil(formatted, 'Formatted message should not be nil')
      assert.is_not_nil(formatted.message, 'Message field should not be nil')
      
      -- The API message should be used instead of the template message
      assert.equals(formatted.message:match('^[^\n]+'), apiMessage,
        'API message should be the primary message')
      
      -- If details were provided, they should be appended
      if details then
        local detailsFound = string.find(formatted.message, details, 1, true) ~= nil
        assert.is_true(detailsFound,
          string.format('Details "%s" should be in formatted message', details))
      end
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should use template message when API message is not provided', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate error code without API message
      local errorCode = generateRandomErrorCode()
      
      -- Format the user message without API message
      local formatted = PikSendErrorHandler.formatUserMessage(errorCode, nil, nil)
      
      -- Verify that a message is still provided (from template)
      assert.is_not_nil(formatted, 'Formatted message should not be nil')
      assert.is_not_nil(formatted.message, 'Message field should not be nil')
      assert.is_true(#formatted.message > 0, 'Message should not be empty')
      
      -- Should have title and action as well
      assert.is_not_nil(formatted.title, 'Title should not be nil')
      assert.is_not_nil(formatted.action, 'Action should not be nil')
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should handle empty or nil API messages gracefully', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      local errorCode = generateRandomErrorCode()
      
      -- Test with empty string
      local formatted1 = PikSendErrorHandler.formatUserMessage(errorCode, '', nil)
      assert.is_not_nil(formatted1.message, 'Should handle empty string')
      assert.is_true(#formatted1.message > 0, 'Should provide template message for empty string')
      
      -- Test with nil
      local formatted2 = PikSendErrorHandler.formatUserMessage(errorCode, nil, nil)
      assert.is_not_nil(formatted2.message, 'Should handle nil')
      assert.is_true(#formatted2.message > 0, 'Should provide template message for nil')
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should preserve API message through complete error handling workflow', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate complete API error response
      local response, expectedCode, expectedMessage, expectedDetails = 
        generateAPIErrorResponse(true, false)
      local statusCode = generateRandomStatusCode()
      
      -- Go through complete workflow
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      
      -- Verify the API message is preserved in the final error info
      assert.is_not_nil(errorInfo, 'Error info should not be nil')
      assert.is_not_nil(errorInfo.message, 'Error message should not be nil')
      
      if expectedMessage then
        local messageFound = string.find(errorInfo.message, expectedMessage, 1, true) ~= nil
        assert.is_true(messageFound,
          string.format('API message should be preserved through workflow'))
      end
      
      -- Verify other required fields are present
      assert.is_not_nil(errorInfo.category, 'Category should be set')
      assert.is_not_nil(errorInfo.code, 'Code should be set')
      assert.is_not_nil(errorInfo.title, 'Title should be set')
      assert.is_not_nil(errorInfo.action, 'Action should be set')
      assert.is_not_nil(errorInfo.shouldRetry, 'shouldRetry should be set')
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should handle malformed JSON responses without crashing', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      -- Generate various malformed responses
      local malformedResponses = {
        'Not JSON at all',
        '{invalid json}',
        '{"error":}',
        '{"error":{"code":}}',
        '',
        '   ',
        '{"incomplete":',
        generateRandomString(math.random(1, 200)),
      }
      
      local response = malformedResponses[math.random(1, #malformedResponses)]
      local statusCode = generateRandomStatusCode()
      
      -- Should not crash
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      
      -- Should still return valid error info
      assert.is_not_nil(errorInfo, 'Should handle malformed JSON')
      assert.is_not_nil(errorInfo.message, 'Should provide fallback message')
      assert.is_not_nil(errorInfo.category, 'Should provide category')
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
  it('should extract message from various API response formats', function()
    local successCount = 0
    local iterations = 100
    
    for i = 1, iterations do
      local testCases = {
        -- Standard error object format
        {
          response = '{"error":{"code":"TEST_ERROR","message":"Test message"}}',
          expectedMessage = 'Test message'
        },
        -- Simple message format
        {
          response = '{"message":"Simple error message"}',
          expectedMessage = 'Simple error message'
        },
        -- Error with details
        {
          response = '{"error":{"code":"TEST","message":"Main message","details":"Extra info"}}',
          expectedMessage = 'Main message',
          expectedDetails = 'Extra info'
        },
        -- Only error code (should use template)
        {
          response = '{"error":{"code":"TOKEN_INVALID"}}',
          expectedMessage = nil -- Will use template
        },
      }
      
      local testCase = testCases[math.random(1, #testCases)]
      local errorInfo = PikSendErrorHandler.handleAPIError(testCase.response, 400)
      
      assert.is_not_nil(errorInfo, 'Error info should not be nil')
      assert.is_not_nil(errorInfo.message, 'Message should not be nil')
      
      if testCase.expectedMessage then
        local found = string.find(errorInfo.message, testCase.expectedMessage, 1, true) ~= nil
        assert.is_true(found, 'Expected message should be in error info')
      end
      
      if testCase.expectedDetails then
        local found = string.find(errorInfo.message, testCase.expectedDetails, 1, true) ~= nil
        assert.is_true(found, 'Expected details should be in error info')
      end
      
      successCount = successCount + 1
    end
    
    assert.equals(successCount, iterations,
      string.format('All %d iterations should succeed', iterations))
  end)
  
end)

