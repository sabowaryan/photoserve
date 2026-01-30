--[[----------------------------------------------------------------------------

test_retry.lua
Unit tests for PikSendRetry module

Tests:
- Retry delay calculation
- Retry execution with success
- Retry execution with failures
- Integration with error handler
- Utility functions

------------------------------------------------------------------------------]]

-- Set up module path
package.path = package.path .. ';./PikSend.lrplugin/?.lua'

-- Mock _PLUGIN global
_G._PLUGIN = {
  path = './PikSend.lrplugin'
}

-- Mock Lightroom SDK
_G.import = function(module)
  if module == 'LrTasks' then
    return {
      sleep = function(seconds)
        -- Mock sleep - do nothing in tests
      end
    }
  elseif module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        return {
          debugMode = false
        }
      end
    }
  elseif module == 'LrFileUtils' then
    return {
      exists = function() return false end,
      delete = function() end,
      readFile = function() return nil end
    }
  elseif module == 'LrPathUtils' then
    return {
      child = function(parent, child) return parent .. '/' .. child end,
      standardizePath = function(path) return path end
    }
  elseif module == 'LrDate' then
    return {
      currentTime = function() return os.time() end,
      timeToUserFormat = function(time, format) return os.date(format, time) end
    }
  end
  return {}
end

-- Load modules
local PikSendRetry = require 'PikSendRetry'

-- Simple test framework
local function assert_equal(actual, expected, message)
  if actual ~= expected then
    error(string.format('%s: expected %s, got %s', message or 'Assertion failed', tostring(expected), tostring(actual)))
  end
end

local function assert_true(value, message)
  if not value then
    error(message or 'Expected true, got false')
  end
end

local function assert_false(value, message)
  if value then
    error(message or 'Expected false, got true')
  end
end

local function assert_nil(value, message)
  if value ~= nil then
    error(message or 'Expected nil, got ' .. tostring(value))
  end
end

local function assert_not_nil(value, message)
  if value == nil then
    error(message or 'Expected non-nil value')
  end
end

local function assert_table_equal(actual, expected, message)
  if #actual ~= #expected then
    error(string.format('%s: table length mismatch, expected %d, got %d', 
      message or 'Table assertion failed', #expected, #actual))
  end
  
  for i = 1, #expected do
    if actual[i] ~= expected[i] then
      error(string.format('%s: element %d mismatch, expected %s, got %s',
        message or 'Table assertion failed', i, tostring(expected[i]), tostring(actual[i])))
    end
  end
end

--------------------------------------------------------------------------------
-- Test Suite
--------------------------------------------------------------------------------

print('=== PikSendRetry Unit Tests ===\n')

-- Test 1: Calculate retry delay with exponential backoff
print('Test 1: Calculate retry delay')
assert_equal(PikSendRetry.calculateDelay(0), 1, 'Delay for attempt 0 should be 1s')
assert_equal(PikSendRetry.calculateDelay(1), 2, 'Delay for attempt 1 should be 2s')
assert_equal(PikSendRetry.calculateDelay(2), 4, 'Delay for attempt 2 should be 4s')
assert_equal(PikSendRetry.calculateDelay(3), 8, 'Delay for attempt 3 should be 8s')
print('✓ Exponential backoff delays are correct (1s, 2s, 4s, 8s)')

-- Test 2: Calculate delay with custom initial delay
print('\nTest 2: Calculate delay with custom initial delay')
assert_equal(PikSendRetry.calculateDelay(0, 2), 2, 'Delay for attempt 0 with initial 2s should be 2s')
assert_equal(PikSendRetry.calculateDelay(1, 2), 4, 'Delay for attempt 1 with initial 2s should be 4s')
assert_equal(PikSendRetry.calculateDelay(2, 2), 8, 'Delay for attempt 2 with initial 2s should be 8s')
print('✓ Custom initial delay works correctly')

-- Test 3: Handle negative attempt numbers
print('\nTest 3: Handle negative attempt numbers')
assert_equal(PikSendRetry.calculateDelay(-1), 1, 'Negative attempt should be treated as 0')
assert_equal(PikSendRetry.calculateDelay(-5), 1, 'Negative attempt should be treated as 0')
print('✓ Negative attempt numbers handled correctly')

-- Test 4: Get retry delays array
print('\nTest 4: Get retry delays array')
local delays = PikSendRetry.getRetryDelays(3, 1)
assert_table_equal(delays, {1, 2, 4}, 'Delays array should be [1, 2, 4]')
print('✓ Retry delays array is correct')

-- Test 5: Get retry delays with custom parameters
print('\nTest 5: Get retry delays with custom parameters')
local customDelays = PikSendRetry.getRetryDelays(4, 2)
assert_table_equal(customDelays, {2, 4, 8, 16}, 'Custom delays array should be [2, 4, 8, 16]')
print('✓ Custom retry delays array is correct')

-- Test 6: Format retry info
print('\nTest 6: Format retry info')
local info = PikSendRetry.formatRetryInfo(3, 1)
print('  Info: ' .. info)
assert_true(string.find(info, '1') ~= nil, 'Info should contain delays')
assert_true(string.find(info, 'Max 3 retries') ~= nil or string.find(info, '3') ~= nil, 'Info should contain max retries')
print('✓ Retry info formatted correctly: ' .. info)

-- Test 7: Execute with retry - immediate success
print('\nTest 7: Execute with retry - immediate success')
local callCount = 0
local success, result = PikSendRetry.executeWithRetry(function()
  callCount = callCount + 1
  return 'success'
end, { maxAttempts = 3 })

assert_true(success, 'Should succeed')
assert_equal(result, 'success', 'Should return success result')
assert_equal(callCount, 1, 'Should only call function once')
print('✓ Immediate success works correctly')

-- Test 8: Execute with retry - success after retries
print('\nTest 8: Execute with retry - success after retries')
local attemptCount = 0
local success2, result2 = PikSendRetry.executeWithRetry(function()
  attemptCount = attemptCount + 1
  if attemptCount < 3 then
    error('Temporary failure')
  end
  return 'success after retries'
end, { maxAttempts = 3 })

assert_true(success2, 'Should succeed after retries')
assert_equal(result2, 'success after retries', 'Should return success result')
assert_equal(attemptCount, 3, 'Should call function 3 times')
print('✓ Success after retries works correctly')

-- Test 9: Execute with retry - all attempts fail
print('\nTest 9: Execute with retry - all attempts fail')
local failCount = 0
local success3, result3 = PikSendRetry.executeWithRetry(function()
  failCount = failCount + 1
  error('Permanent failure')
end, { maxAttempts = 3 })

assert_false(success3, 'Should fail')
assert_not_nil(result3, 'Should return error')
assert_equal(failCount, 4, 'Should call function 4 times (1 initial + 3 retries)')
print('✓ All attempts fail works correctly')

-- Test 10: Execute with retry - custom shouldRetry
print('\nTest 10: Execute with retry - custom shouldRetry')
local customRetryCount = 0
local success4, result4 = PikSendRetry.executeWithRetry(function()
  customRetryCount = customRetryCount + 1
  error('Error')
end, {
  maxAttempts = 3,
  shouldRetry = function(error, attempt)
    -- Only retry once
    return attempt < 1
  end
})

assert_false(success4, 'Should fail')
assert_equal(customRetryCount, 2, 'Should call function 2 times (1 initial + 1 retry)')
print('✓ Custom shouldRetry works correctly')

-- Test 11: Execute with retry - onRetry callback
print('\nTest 11: Execute with retry - onRetry callback')
local retryCallbacks = {}
local success5, result5 = PikSendRetry.executeWithRetry(function()
  if #retryCallbacks < 2 then
    error('Error')
  end
  return 'success'
end, {
  maxAttempts = 3,
  onRetry = function(attempt, delay, error)
    table.insert(retryCallbacks, {attempt = attempt, delay = delay})
  end
})

assert_true(success5, 'Should succeed')
assert_equal(#retryCallbacks, 2, 'Should have 2 retry callbacks')
assert_equal(retryCallbacks[1].delay, 1, 'First retry delay should be 1s')
assert_equal(retryCallbacks[2].delay, 2, 'Second retry delay should be 2s')
print('✓ onRetry callback works correctly')

-- Test 12: Constants are correct
print('\nTest 12: Verify constants')
assert_equal(PikSendRetry.MAX_RETRY_ATTEMPTS, 3, 'MAX_RETRY_ATTEMPTS should be 3')
assert_equal(PikSendRetry.INITIAL_RETRY_DELAY, 1, 'INITIAL_RETRY_DELAY should be 1')
print('✓ Constants are correct')

-- Test 13: Context logging
print('\nTest 13: Execute with context')
local success6, result6 = PikSendRetry.executeWithRetry(function()
  return 'success'
end, {
  maxAttempts = 3,
  context = 'test-operation'
})

assert_true(success6, 'Should succeed with context')
print('✓ Context parameter works correctly')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== All PikSendRetry Unit Tests Passed ===')
print('Total tests: 13')
print('All tests passed successfully!')
