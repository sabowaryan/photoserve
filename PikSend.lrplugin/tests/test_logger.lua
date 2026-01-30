--[[----------------------------------------------------------------------------

test_logger.lua
Unit tests for PikSendLogger module

Tests:
- Log level filtering
- File writing
- Message sanitization
- Log file management

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
-- Test Utilities
--------------------------------------------------------------------------------

local testsPassed = 0
local testsFailed = 0

local function assert_true(value, message)
  if value then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: true')
    print('  Actual: false')
    return false
  end
end

local function assert_false(value, message)
  if not value then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: false')
    print('  Actual: true')
    return false
  end
end

local function assert_equal(actual, expected, message)
  if actual == expected then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: ' .. tostring(expected))
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_not_equal(actual, expected, message)
  if actual ~= expected then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected NOT: ' .. tostring(expected))
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_nil(actual, message)
  if actual == nil then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: nil')
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_not_nil(actual, message)
  if actual ~= nil then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: not nil')
    print('  Actual: nil')
    return false
  end
end

local function assert_contains(str, pattern, message)
  if string.match(str, pattern) then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  String does not contain pattern: ' .. pattern)
    return false
  end
end

local function assert_not_contains(str, pattern, message)
  if not string.match(str, pattern) then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  String should not contain pattern: ' .. pattern)
    return false
  end
end

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

print('\n=== Testing PikSendLogger ===\n')

-- Test 1: Get log path
print('Test 1: Configuration - Get log path')
resetTestState()
local logPath = PikSendLogger.getLogPath()
assert_not_nil(logPath, 'Log path should not be nil')
assert_contains(logPath, 'PikSend%.log', 'Log path should contain PikSend.log')

-- Test 2: Debug mode
print('\nTest 2: Configuration - Debug mode')
resetTestState()
assert_false(PikSendLogger.isDebugMode(), 'Debug mode should be off by default')
PikSendLogger.setDebugMode(true)
assert_true(PikSendLogger.isDebugMode(), 'Debug mode should be on after setting')
PikSendLogger.setDebugMode(false)
assert_false(PikSendLogger.isDebugMode(), 'Debug mode should be off after unsetting')

-- Test 3: Write error messages
print('\nTest 3: Logging - Error messages')
resetTestState()
PikSendLogger.error('Test error message', 'TestModule')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_nil(logContent, 'Log file should exist after error')
assert_contains(logContent, '%[ERROR%]', 'Log should contain ERROR level')
assert_contains(logContent, 'TestModule', 'Log should contain module name')
assert_contains(logContent, 'Test error message', 'Log should contain message')

-- Test 4: Write warning messages
print('\nTest 4: Logging - Warning messages')
resetTestState()
PikSendLogger.warn('Test warning', 'TestModule')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_nil(logContent, 'Log file should exist after warning')
assert_contains(logContent, '%[WARN%]', 'Log should contain WARN level')

-- Test 5: Write info messages
print('\nTest 5: Logging - Info messages')
resetTestState()
PikSendLogger.info('Test info', 'TestModule')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_nil(logContent, 'Log file should exist after info')
assert_contains(logContent, '%[INFO%]', 'Log should contain INFO level')

-- Test 6: Debug messages with debug mode enabled
print('\nTest 6: Logging - Debug messages when enabled')
resetTestState()
mockPrefs.debugMode = true
PikSendLogger.debug('Test debug', 'TestModule')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_nil(logContent, 'Log file should exist after debug')
assert_contains(logContent, '%[DEBUG%]', 'Log should contain DEBUG level when debug mode is on')

-- Test 7: Debug messages with debug mode disabled
print('\nTest 7: Logging - Debug messages when disabled')
resetTestState()
mockPrefs.debugMode = false
PikSendLogger.debug('Test debug', 'TestModule')
local logContent = mockFiles[PikSendLogger.getLogPath()]
if logContent then
  assert_not_contains(logContent, '%[DEBUG%]', 'Log should not contain DEBUG level when debug mode is off')
end

-- Test 8: Timestamp in log entries
print('\nTest 8: Logging - Timestamp format')
resetTestState()
PikSendLogger.info('Test message')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_contains(logContent, '%[%d%d%d%d%-%d%d%-%d%d %d%d:%d%d:%d%d%]', 'Log should contain timestamp')

-- Test 9: Default module name
print('\nTest 9: Logging - Default module name')
resetTestState()
PikSendLogger.info('Test message')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_contains(logContent, 'PikSend:', 'Log should use default module name')

-- Test 10: Sanitize Bearer tokens
print('\nTest 10: Sanitization - Bearer tokens')
resetTestState()
PikSendLogger.info('Authorization: Bearer abc123def456')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_contains(logContent, 'abc123def456', 'Token should not appear in log')
assert_contains(logContent, '%[REDACTED%]', 'Log should contain REDACTED marker')

-- Test 11: Sanitize token parameters
print('\nTest 11: Sanitization - Token parameters')
resetTestState()
PikSendLogger.info('token=secret123token')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_contains(logContent, 'secret123token', 'Token should not appear in log')
assert_contains(logContent, '%[REDACTED%]', 'Log should contain REDACTED marker')

-- Test 12: Sanitize apiToken parameters
print('\nTest 12: Sanitization - apiToken parameters')
resetTestState()
PikSendLogger.info('apiToken: mySecretToken123')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_contains(logContent, 'mySecretToken123', 'Token should not appear in log')
assert_contains(logContent, '%[REDACTED%]', 'Log should contain REDACTED marker')

-- Test 13: Sanitize passwords
print('\nTest 13: Sanitization - Passwords')
resetTestState()
PikSendLogger.info('password=myPassword123')
local logContent = mockFiles[PikSendLogger.getLogPath()]
assert_not_contains(logContent, 'myPassword123', 'Password should not appear in log')
assert_contains(logContent, '%[REDACTED%]', 'Log should contain REDACTED marker')

-- Test 14: Handle nil messages
print('\nTest 14: Sanitization - Nil messages')
resetTestState()
-- Should not crash
local success = pcall(function()
  PikSendLogger.info(nil)
end)
assert_true(success, 'Should handle nil messages without crashing')

-- Test 15: Log rotation when size exceeds 10 MB
print('\nTest 15: File Management - Log rotation')
resetTestState()
local logPath = PikSendLogger.getLogPath()
local largeContent = string.rep('x', 11 * 1024 * 1024) -- 11 MB
mockFiles[logPath] = largeContent
PikSendLogger.info('New message after rotation')
local backupPath = logPath .. '.old'
assert_not_nil(mockFiles[backupPath], 'Backup file should exist after rotation')
local newLogContent = mockFiles[logPath]
assert_contains(newLogContent, 'New message after rotation', 'New log should contain new message')

-- Test 16: No rotation when size is under 10 MB
print('\nTest 16: File Management - No rotation for small files')
resetTestState()
local logPath = PikSendLogger.getLogPath()
mockFiles[logPath] = 'small content'
PikSendLogger.info('New message')
local backupPath = logPath .. '.old'
assert_nil(mockFiles[backupPath], 'Backup file should not exist for small files')

-- Test 17: Read log file
print('\nTest 17: Log Viewing - Read log')
resetTestState()
PikSendLogger.info('Test message 1')
PikSendLogger.info('Test message 2')
local content = PikSendLogger.readLog()
assert_not_nil(content, 'Should read log content')
assert_contains(content, 'Test message 1', 'Should contain first message')
assert_contains(content, 'Test message 2', 'Should contain second message')

-- Test 18: Read log when file doesn't exist
print('\nTest 18: Log Viewing - Read non-existent log')
resetTestState()
local content = PikSendLogger.readLog()
assert_equal(content, 'No log file found', 'Should return message when log does not exist')

-- Test 19: Clear log file
print('\nTest 19: Log Management - Clear log')
resetTestState()
PikSendLogger.info('Test message')
local logPath = PikSendLogger.getLogPath()
assert_not_nil(mockFiles[logPath], 'Log file should exist before clear')
PikSendLogger.clearLog()
-- After clear, file should be deleted or contain only the clear message
local content = mockFiles[logPath]
if content then
  assert_contains(content, 'Log file cleared', 'Should contain clear message')
  assert_not_contains(content, 'Test message', 'Should not contain old messages')
end

-- Test 20: Export log file
print('\nTest 20: Log Management - Export log')
resetTestState()
PikSendLogger.info('Test message')
local destinationPath = '/tmp/exported_log.txt'
local success = PikSendLogger.exportLog(destinationPath)
assert_true(success, 'Export should succeed')
assert_not_nil(mockFiles[destinationPath], 'Exported file should exist')
local content = mockFiles[destinationPath]
assert_contains(content, 'Test message', 'Exported file should contain log content')

-- Test 21: Export non-existent log
print('\nTest 21: Log Management - Export non-existent log')
resetTestState()
local destinationPath = '/tmp/exported_log.txt'
local success = PikSendLogger.exportLog(destinationPath)
assert_false(success, 'Export should fail for non-existent log')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== Test Summary ===')
print('Passed: ' .. testsPassed)
print('Failed: ' .. testsFailed)
print('Total: ' .. (testsPassed + testsFailed))

if testsFailed == 0 then
  print('\n✓ All tests passed!')
  os.exit(0)
else
  print('\n✗ Some tests failed')
  os.exit(1)
end
