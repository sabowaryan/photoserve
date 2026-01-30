--[[----------------------------------------------------------------------------

test_property_logger.lua
Property-based tests for PikSendLogger module

Tests properties:
- Property 39: Logging complet des erreurs et debug
- Property 40: Rotation automatique des logs
- Property 47: Sanitisation des logs

**Validates: Requirements 9.2, 9.3, 9.6, 11.3**

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
_PLUGIN = { path = '/tmp/test_plugin' }

-- Mock file system state
local mockFiles = {}
local mockPrefs = {}

-- Mock import function
_G.import = function(module)
  if module == 'LrFileUtils' then
    return {
      exists = function(path)
        return mockFiles[path] ~= nil
      end,
      readFile = function(path)
        return mockFiles[path]
      end,
      delete = function(path)
        mockFiles[path] = nil
        return true
      end,
      fileAttributes = function(path)
        if not mockFiles[path] then return nil end
        return { fileSize = #mockFiles[path] }
      end,
      move = function(src, dest)
        if not mockFiles[src] then return false end
        mockFiles[dest] = mockFiles[src]
        mockFiles[src] = nil
        return true
      end,
      copy = function(src, dest)
        if not mockFiles[src] then return false end
        mockFiles[dest] = mockFiles[src]
        return true
      end,
    }
  elseif module == 'LrPathUtils' then
    return {
      child = function(parent, child)
        return parent .. '/' .. child
      end,
    }
  elseif module == 'LrDate' then
    return {
      currentTime = function()
        return 1704067200 -- 2024-01-01 00:00:00
      end,
      timeToUserFormat = function(time, format)
        return os.date(format or "%Y-%m-%d %H:%M:%S", time)
      end,
    }
  elseif module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        return mockPrefs
      end
    }
  end
  error('Unknown module: ' .. module)
end

-- Override io.open to use mock file system
local originalIoOpen = io.open
io.open = function(path, mode)
  if mode == 'a' then
    -- Append mode
    return {
      write = function(self, content)
        mockFiles[path] = (mockFiles[path] or '') .. content
      end,
      close = function(self) end,
    }
  end
  return originalIoOpen(path, mode)
end

-- Reset test state
local function resetTestState()
  mockPrefs = { debugMode = false }
  mockFiles = {}
end

-- Load module
local PikSendLogger = dofile('../PikSendLogger.lua')

--------------------------------------------------------------------------------
-- Test Helpers
--------------------------------------------------------------------------------

-- Generate random string (alphanumeric only for module names)
local function generateRandomModuleName(length)
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  local result = {}
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  return table.concat(result)
end

-- Generate random string
local function generateRandomString(length)
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
  local result = {}
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  return table.concat(result)
end

-- Generate random token
local function generateRandomToken()
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'
  local length = math.random(20, 100)
  local result = {}
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  return table.concat(result)
end

-- Check if log entry has correct format
local function hasCorrectLogFormat(logEntry)
  -- Format: [YYYY-MM-DD HH:MM:SS] [LEVEL] Module: Message
  local pattern = '%[%d%d%d%d%-%d%d%-%d%d %d%d:%d%d:%d%d%] %[%w+%] %w+:'
  return string.match(logEntry, pattern) ~= nil
end

-- Check if message contains sensitive data
local function containsSensitiveData(message, sensitiveData)
  return string.find(message, sensitiveData, 1, true) ~= nil
end

--------------------------------------------------------------------------------
-- Test Utilities
--------------------------------------------------------------------------------

local testsPassed = 0
local testsFailed = 0

local function assert_true(value, message)
  if value then
    testsPassed = testsPassed + 1
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_false(value, message)
  if not value then
    testsPassed = testsPassed + 1
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_not_nil(value, message)
  if value ~= nil then
    testsPassed = testsPassed + 1
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_contains(str, pattern, message)
  if string.match(str, pattern) then
    testsPassed = testsPassed + 1
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

--------------------------------------------------------------------------------
-- Property Tests
--------------------------------------------------------------------------------

print('\n=== Testing PikSendLogger Properties ===\n')

-- Property 39: Logging complet des erreurs et debug
print('Property 39: Logging complet des erreurs et debug')
print('**Feature: lightroom-plugin, Property 39: Logging complet des erreurs et debug**')
print('**Validates: Requirements 9.2, 9.3**')

local prop39Passed = 0
local prop39Failed = {}
for i = 1, 100 do
  resetTestState()
  
  local message = generateRandomString(math.random(10, 200))
  local module = generateRandomModuleName(math.random(5, 20))
  
  -- Log error
  PikSendLogger.error(message, module)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  -- Verify log entry exists and has correct format
  if logContent and hasCorrectLogFormat(logContent) and 
     string.match(logContent, '%[ERROR%]') and
     string.match(logContent, module) then
    prop39Passed = prop39Passed + 1
  else
    table.insert(prop39Failed, {
      iteration = i,
      hasContent = logContent ~= nil,
      hasFormat = logContent and hasCorrectLogFormat(logContent) or false,
      hasError = logContent and string.match(logContent, '%[ERROR%]') ~= nil or false,
      hasModule = logContent and string.match(logContent, module) ~= nil or false,
    })
  end
end

if #prop39Failed > 0 and #prop39Failed <= 3 then
  print('First few failures:')
  for i, failure in ipairs(prop39Failed) do
    if i <= 3 then
      print(string.format('  Iteration %d: content=%s, format=%s, error=%s, module=%s',
        failure.iteration, tostring(failure.hasContent), tostring(failure.hasFormat),
        tostring(failure.hasError), tostring(failure.hasModule)))
    end
  end
end

assert_true(prop39Passed == 100, string.format('All error messages should be logged with correct format (%d/100)', prop39Passed))

-- Test debug mode filtering
local prop39DebugPassed = 0
for i = 1, 100 do
  resetTestState()
  
  local debugMode = math.random() > 0.5
  mockPrefs.debugMode = debugMode
  
  local message = generateRandomString(math.random(10, 200))
  
  -- Log debug message
  PikSendLogger.debug(message)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  if debugMode then
    -- Debug message should be logged
    if logContent and string.match(logContent, '%[DEBUG%]') then
      prop39DebugPassed = prop39DebugPassed + 1
    end
  else
    -- Debug message should not be logged
    if not logContent or not string.match(logContent, '%[DEBUG%]') then
      prop39DebugPassed = prop39DebugPassed + 1
    end
  end
end
assert_true(prop39DebugPassed == 100, 'Debug messages should only be logged when debug mode is enabled (100/100)')

-- Property 40: Rotation automatique des logs
print('\nProperty 40: Rotation automatique des logs')
print('**Feature: lightroom-plugin, Property 40: Rotation automatique des logs**')
print('**Validates: Requirements 9.6**')

local prop40RotatePassed = 0
for i = 1, 50 do
  resetTestState()
  
  local logPath = PikSendLogger.getLogPath()
  local backupPath = logPath .. '.old'
  
  -- Generate random size above 10 MB
  local sizeMB = 10 + math.random(1, 50)
  local fileSize = sizeMB * 1024 * 1024
  
  -- Create large log file
  local largeContent = string.rep('x', fileSize)
  mockFiles[logPath] = largeContent
  
  -- Write new log entry (should trigger rotation)
  local newMessage = generateRandomString(math.random(10, 100))
  PikSendLogger.info(newMessage)
  
  -- Verify rotation occurred
  if mockFiles[backupPath] and mockFiles[logPath] and 
     string.match(mockFiles[logPath], newMessage) then
    prop40RotatePassed = prop40RotatePassed + 1
  end
end
assert_true(prop40RotatePassed == 50, 'Log should rotate when size exceeds 10 MB (50/50)')

local prop40NoRotatePassed = 0
for i = 1, 50 do
  resetTestState()
  
  local logPath = PikSendLogger.getLogPath()
  local backupPath = logPath .. '.old'
  
  -- Generate random size under 10 MB
  local sizeMB = math.random(1, 9)
  local fileSize = sizeMB * 1024 * 1024
  
  -- Create small log file
  local smallContent = string.rep('x', fileSize)
  mockFiles[logPath] = smallContent
  
  -- Write new log entry (should NOT trigger rotation)
  local newMessage = generateRandomString(math.random(10, 100))
  PikSendLogger.info(newMessage)
  
  -- Verify rotation did NOT occur
  if not mockFiles[backupPath] then
    prop40NoRotatePassed = prop40NoRotatePassed + 1
  end
end
assert_true(prop40NoRotatePassed == 50, 'Log should not rotate when size is under 10 MB (50/50)')

-- Property 47: Sanitisation des logs
print('\nProperty 47: Sanitisation des logs')
print('**Feature: lightroom-plugin, Property 47: Sanitisation des logs**')
print('**Validates: Requirements 11.3**')

local prop47BearerPassed = 0
for i = 1, 100 do
  resetTestState()
  
  local token = generateRandomToken()
  local formats = {
    'Bearer ' .. token,
    'Bearer  ' .. token,
    'Authorization: Bearer ' .. token,
    'Auth: Bearer ' .. token,
  }
  
  local message = formats[math.random(1, #formats)]
  
  -- Log message
  PikSendLogger.info(message)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  -- Verify token is redacted
  if logContent and not containsSensitiveData(logContent, token) and
     string.match(logContent, '%[REDACTED%]') then
    prop47BearerPassed = prop47BearerPassed + 1
  end
end
assert_true(prop47BearerPassed == 100, 'Bearer tokens should be sanitized (100/100)')

local prop47TokenPassed = 0
for i = 1, 100 do
  resetTestState()
  
  local token = generateRandomToken()
  local formats = {
    'token=' .. token,
    'token: ' .. token,
    'token = ' .. token,
    'apiToken=' .. token,
    'apiToken: ' .. token,
    'apiToken = ' .. token,
  }
  
  local message = formats[math.random(1, #formats)]
  
  -- Log message
  PikSendLogger.info(message)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  -- Verify token is redacted
  if logContent and not containsSensitiveData(logContent, token) and
     string.match(logContent, '%[REDACTED%]') then
    prop47TokenPassed = prop47TokenPassed + 1
  end
end
assert_true(prop47TokenPassed == 100, 'Token parameters should be sanitized (100/100)')

local prop47PasswordPassed = 0
for i = 1, 100 do
  resetTestState()
  
  local password = generateRandomToken()
  local formats = {
    'password=' .. password,
    'password: ' .. password,
    'password = ' .. password,
  }
  
  local message = formats[math.random(1, #formats)]
  
  -- Log message
  PikSendLogger.info(message)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  -- Verify password is redacted
  if logContent and not containsSensitiveData(logContent, password) and
     string.match(logContent, '%[REDACTED%]') then
    prop47PasswordPassed = prop47PasswordPassed + 1
  end
end
assert_true(prop47PasswordPassed == 100, 'Passwords should be sanitized (100/100)')

local prop47PreservePassed = 0
for i = 1, 100 do
  resetTestState()
  
  local token = generateRandomToken()
  local prefix = generateRandomString(math.random(10, 50))
  local suffix = generateRandomString(math.random(10, 50))
  
  local message = prefix .. ' Bearer ' .. token .. ' ' .. suffix
  
  -- Log message
  PikSendLogger.info(message)
  
  -- Read log
  local logContent = mockFiles[PikSendLogger.getLogPath()]
  
  -- Verify non-sensitive parts are preserved and sensitive part is redacted
  if logContent and string.match(logContent, prefix) and 
     string.match(logContent, suffix) and
     not containsSensitiveData(logContent, token) then
    prop47PreservePassed = prop47PreservePassed + 1
  end
end
assert_true(prop47PreservePassed == 100, 'Non-sensitive parts should be preserved while sanitizing (100/100)')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== Test Summary ===')
print('Passed: ' .. testsPassed)
print('Failed: ' .. testsFailed)
print('Total: ' .. (testsPassed + testsFailed))

if testsFailed == 0 then
  print('\n✓ All property tests passed!')
  os.exit(0)
else
  print('\n✗ Some property tests failed')
  os.exit(1)
end
