--[[----------------------------------------------------------------------------

test_retry_properties.lua
Property-based tests for PikSendRetry module

Tests Property 45: Backoff exponentiel pour les retries
Feature: lightroom-plugin
Validates: Requirements 10.7

Property 45: Pour tout retry après échec, le délai d'attente doit suivre 
une progression exponentielle (ex: 1s, 2s, 4s, 8s)

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
local function assert_true(value, message)
  if not value then
    error(message or 'Expected true, got false')
  end
end

local function assert_equal(actual, expected, message)
  if actual ~= expected then
    error(string.format('%s: expected %s, got %s', message or 'Assertion failed', tostring(expected), tostring(actual)))
  end
end

--------------------------------------------------------------------------------
-- Property Test Helpers
--------------------------------------------------------------------------------

-- Generate random attempt number
local function generateAttemptNumber(min, max)
  min = min or 0
  max = max or 10
  return math.random(min, max)
end

-- Generate random initial delay
local function generateInitialDelay()
  local delays = {0.5, 1, 2, 5, 10}
  return delays[math.random(1, #delays)]
end

-- Verify exponential backoff property
local function verifyExponentialBackoff(attemptNumber, initialDelay)
  local delay = PikSendRetry.calculateDelay(attemptNumber, initialDelay)
  local expectedDelay = initialDelay * (2 ^ math.max(0, attemptNumber))
  
  return delay == expectedDelay
end

-- Verify monotonic increase property
local function verifyMonotonicIncrease(initialDelay, maxAttempts)
  local previousDelay = 0
  
  for attempt = 0, maxAttempts do
    local delay = PikSendRetry.calculateDelay(attempt, initialDelay)
    
    if delay <= previousDelay then
      return false, string.format('Delay not increasing: attempt %d has delay %d, previous was %d', 
        attempt, delay, previousDelay)
    end
    
    previousDelay = delay
  end
  
  return true
end

-- Verify retry count property
local function verifyRetryCount(maxAttempts)
  local callCount = 0
  
  local success, result = PikSendRetry.executeWithRetry(function()
    callCount = callCount + 1
    error('Always fail')
  end, { maxAttempts = maxAttempts })
  
  -- Total calls should be 1 initial + maxAttempts retries
  local expectedCalls = maxAttempts + 1
  
  return callCount == expectedCalls, string.format('Expected %d calls, got %d', expectedCalls, callCount)
end

-- Verify delay sequence property
local function verifyDelaySequence(maxAttempts, initialDelay)
  local delays = PikSendRetry.getRetryDelays(maxAttempts, initialDelay)
  
  -- Verify length
  if #delays ~= maxAttempts then
    return false, string.format('Expected %d delays, got %d', maxAttempts, #delays)
  end
  
  -- Verify each delay follows exponential pattern
  for i = 1, #delays do
    local expectedDelay = initialDelay * (2 ^ (i - 1))
    if delays[i] ~= expectedDelay then
      return false, string.format('Delay %d: expected %d, got %d', i, expectedDelay, delays[i])
    end
  end
  
  return true
end

--------------------------------------------------------------------------------
-- Property Tests
--------------------------------------------------------------------------------

print('=== Property 45: Backoff exponentiel pour les retries ===')
print('Feature: lightroom-plugin, Property 45')
print('Validates: Requirements 10.7')
print('Running 100 iterations...\n')

-- Property 45.1: Exponential backoff formula
print('Property 45.1: Delay calculation follows exponential formula')
local property45_1_passed = 0
local property45_1_failed = 0

for i = 1, 100 do
  local attemptNumber = generateAttemptNumber(0, 10)
  local initialDelay = generateInitialDelay()
  
  local success, err = pcall(function()
    assert_true(
      verifyExponentialBackoff(attemptNumber, initialDelay),
      string.format('Exponential backoff failed for attempt %d with initial delay %s', 
        attemptNumber, tostring(initialDelay))
    )
  end)
  
  if success then
    property45_1_passed = property45_1_passed + 1
  else
    property45_1_failed = property45_1_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.1: %d/%d iterations passed', property45_1_passed, 100))
assert_equal(property45_1_failed, 0, 'All iterations should pass')

-- Property 45.2: Delays increase monotonically
print('\nProperty 45.2: Delays increase monotonically')
local property45_2_passed = 0
local property45_2_failed = 0

for i = 1, 100 do
  local initialDelay = generateInitialDelay()
  local maxAttempts = math.random(1, 10)
  
  local success, err = pcall(function()
    local ok, msg = verifyMonotonicIncrease(initialDelay, maxAttempts)
    assert_true(ok, msg or 'Monotonic increase failed')
  end)
  
  if success then
    property45_2_passed = property45_2_passed + 1
  else
    property45_2_failed = property45_2_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.2: %d/%d iterations passed', property45_2_passed, 100))
assert_equal(property45_2_failed, 0, 'All iterations should pass')

-- Property 45.3: Retry count matches maxAttempts
print('\nProperty 45.3: Total attempts = 1 initial + maxAttempts retries')
local property45_3_passed = 0
local property45_3_failed = 0

for i = 1, 100 do
  local maxAttempts = math.random(0, 5)
  
  local success, err = pcall(function()
    local ok, msg = verifyRetryCount(maxAttempts)
    assert_true(ok, msg or 'Retry count verification failed')
  end)
  
  if success then
    property45_3_passed = property45_3_passed + 1
  else
    property45_3_failed = property45_3_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.3: %d/%d iterations passed', property45_3_passed, 100))
assert_equal(property45_3_failed, 0, 'All iterations should pass')

-- Property 45.4: Delay sequence correctness
print('\nProperty 45.4: Delay sequence follows exponential pattern')
local property45_4_passed = 0
local property45_4_failed = 0

for i = 1, 100 do
  local maxAttempts = math.random(1, 10)
  local initialDelay = generateInitialDelay()
  
  local success, err = pcall(function()
    local ok, msg = verifyDelaySequence(maxAttempts, initialDelay)
    assert_true(ok, msg or 'Delay sequence verification failed')
  end)
  
  if success then
    property45_4_passed = property45_4_passed + 1
  else
    property45_4_failed = property45_4_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.4: %d/%d iterations passed', property45_4_passed, 100))
assert_equal(property45_4_failed, 0, 'All iterations should pass')

-- Property 45.5: Specific requirement - delays of 1s, 2s, 4s, 8s
print('\nProperty 45.5: Default configuration produces delays 1s, 2s, 4s')
local property45_5_passed = 0
local property45_5_failed = 0

for i = 1, 100 do
  local success, err = pcall(function()
    -- With default settings (maxAttempts=3, initialDelay=1)
    -- We should get delays: 1s, 2s, 4s for the 3 retries
    local delays = PikSendRetry.getRetryDelays(3, 1)
    
    assert_equal(#delays, 3, 'Should have 3 delays')
    assert_equal(delays[1], 1, 'First delay should be 1s')
    assert_equal(delays[2], 2, 'Second delay should be 2s')
    assert_equal(delays[3], 4, 'Third delay should be 4s')
    
    -- Verify constants
    assert_equal(PikSendRetry.MAX_RETRY_ATTEMPTS, 3, 'MAX_RETRY_ATTEMPTS should be 3')
    assert_equal(PikSendRetry.INITIAL_RETRY_DELAY, 1, 'INITIAL_RETRY_DELAY should be 1')
  end)
  
  if success then
    property45_5_passed = property45_5_passed + 1
  else
    property45_5_failed = property45_5_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.5: %d/%d iterations passed', property45_5_passed, 100))
assert_equal(property45_5_failed, 0, 'All iterations should pass')

-- Property 45.6: Success stops retrying
print('\nProperty 45.6: Success on any attempt stops further retries')
local property45_6_passed = 0
local property45_6_failed = 0

for i = 1, 100 do
  local successOnAttempt = math.random(1, 5)
  
  local success, err = pcall(function()
    local callCount = 0
    
    local ok, result = PikSendRetry.executeWithRetry(function()
      callCount = callCount + 1
      if callCount >= successOnAttempt then
        return true, 'success'
      end
      error('Not yet')
    end, { maxAttempts = 10 })
    
    assert_true(ok, 'Should succeed')
    assert_equal(callCount, successOnAttempt, 
      string.format('Should stop after %d attempts', successOnAttempt))
  end)
  
  if success then
    property45_6_passed = property45_6_passed + 1
  else
    property45_6_failed = property45_6_failed + 1
    print('  ✗ Iteration ' .. i .. ' failed: ' .. tostring(err))
  end
end

print(string.format('✓ Property 45.6: %d/%d iterations passed', property45_6_passed, 100))
assert_equal(property45_6_failed, 0, 'All iterations should pass')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== Property 45 Test Summary ===')
print('Property 45.1 (Exponential formula): ' .. property45_1_passed .. '/100 passed')
print('Property 45.2 (Monotonic increase): ' .. property45_2_passed .. '/100 passed')
print('Property 45.3 (Retry count): ' .. property45_3_passed .. '/100 passed')
print('Property 45.4 (Delay sequence): ' .. property45_4_passed .. '/100 passed')
print('Property 45.5 (Default delays): ' .. property45_5_passed .. '/100 passed')
print('Property 45.6 (Success stops retry): ' .. property45_6_passed .. '/100 passed')

local totalPassed = property45_1_passed + property45_2_passed + property45_3_passed + 
                    property45_4_passed + property45_5_passed + property45_6_passed
local totalTests = 600

print(string.format('\nTotal: %d/%d property tests passed', totalPassed, totalTests))

if totalPassed == totalTests then
  print('\n✓ Property 45: Backoff exponentiel pour les retries - PASSED')
  print('All retry delays follow exponential backoff pattern (1s, 2s, 4s, 8s)')
else
  error('Property 45 tests failed')
end
