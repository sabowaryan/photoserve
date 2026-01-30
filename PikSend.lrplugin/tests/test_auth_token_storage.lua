--[[----------------------------------------------------------------------------

test_auth_token_storage.lua
Unit tests for PikSendAuth token storage functions

Tests:
- saveToken() and getToken() round-trip
- clearToken() functionality
- Empty/nil token handling
- Token encryption (tokens are not stored in plain text)

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK modules for testing
local mockPrefs = {}

_G.import = function(module)
  if module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        return mockPrefs
      end
    }
  elseif module == 'LrMD5' then
    return {
      digest = function(str)
        -- Simple mock MD5 - just return a hash-like string
        local hash = 0
        for i = 1, #str do
          hash = (hash * 31 + string.byte(str, i)) % 1000000
        end
        return string.format('%032d', hash)
      end
    }
  elseif module == 'LrDialogs' or module == 'LrFunctionContext' or 
         module == 'LrView' or module == 'LrBinding' or module == 'LrHttp' then
    return {} -- Return empty table for unused modules
  end
end

-- Mock require for PikSendAPI
_G.require = function(module)
  if module == 'PikSendAPI' then
    return {} -- Return empty table for API module
  end
end

-- Load the module under test
local PikSendAuth = dofile('PikSendAuth.lua')

--------------------------------------------------------------------------------
-- Test Utilities
--------------------------------------------------------------------------------

local testsPassed = 0
local testsFailed = 0

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

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

print('\n=== Testing PikSendAuth Token Storage ===\n')

-- Test 1: Save and retrieve token (round-trip)
print('Test 1: Token round-trip')
mockPrefs = {} -- Reset prefs
local testToken = 'test-api-token-12345'
PikSendAuth.saveToken(testToken)
local retrievedToken = PikSendAuth.getToken()
assert_equal(retrievedToken, testToken, 'Token should be retrieved correctly after saving')

-- Test 2: Token is encrypted (not stored in plain text)
print('\nTest 2: Token encryption')
mockPrefs = {} -- Reset prefs
local plainToken = 'my-secret-token'
PikSendAuth.saveToken(plainToken)
local storedValue = mockPrefs.apiToken
assert_not_nil(storedValue, 'Token should be stored')
assert_not_equal(storedValue, plainToken, 'Token should not be stored in plain text')

-- Test 3: Clear token
print('\nTest 3: Clear token')
mockPrefs = {} -- Reset prefs
PikSendAuth.saveToken('some-token')
assert_not_nil(mockPrefs.apiToken, 'Token should be stored')
PikSendAuth.clearToken()
assert_nil(mockPrefs.apiToken, 'Token should be cleared')

-- Test 4: Get token when none is stored
print('\nTest 4: Get token when none stored')
mockPrefs = {} -- Reset prefs
local noToken = PikSendAuth.getToken()
assert_nil(noToken, 'Should return nil when no token is stored')

-- Test 5: Save empty token
print('\nTest 5: Save empty token')
mockPrefs = {} -- Reset prefs
PikSendAuth.saveToken('')
local emptyToken = PikSendAuth.getToken()
assert_nil(emptyToken, 'Empty token should not be stored')

-- Test 6: Save nil token
print('\nTest 6: Save nil token')
mockPrefs = {} -- Reset prefs
PikSendAuth.saveToken(nil)
local nilToken = PikSendAuth.getToken()
assert_nil(nilToken, 'Nil token should not be stored')

-- Test 7: Multiple round-trips with different tokens
print('\nTest 7: Multiple round-trips')
mockPrefs = {} -- Reset prefs
local tokens = {
  'token-1',
  'another-token-with-special-chars-!@#$%',
  'very-long-token-' .. string.rep('x', 100),
  'short',
}

for i, token in ipairs(tokens) do
  PikSendAuth.saveToken(token)
  local retrieved = PikSendAuth.getToken()
  assert_equal(retrieved, token, 'Token ' .. i .. ' should round-trip correctly')
end

-- Test 8: isAuthenticated function
print('\nTest 8: isAuthenticated')
mockPrefs = {} -- Reset prefs
assert_equal(PikSendAuth.isAuthenticated(), false, 'Should not be authenticated when no token')
PikSendAuth.saveToken('test-token')
assert_equal(PikSendAuth.isAuthenticated(), true, 'Should be authenticated when token exists')
PikSendAuth.clearToken()
assert_equal(PikSendAuth.isAuthenticated(), false, 'Should not be authenticated after clearing token')

-- Test 9: Clear also removes user data
print('\nTest 9: Clear removes user data')
mockPrefs = {} -- Reset prefs
mockPrefs.userName = 'Test User'
mockPrefs.userEmail = 'test@example.com'
mockPrefs.userPlan = 'pro'
PikSendAuth.saveToken('test-token')
PikSendAuth.clearToken()
assert_nil(mockPrefs.apiToken, 'Token should be cleared')
assert_nil(mockPrefs.userName, 'User name should be cleared')
assert_nil(mockPrefs.userEmail, 'User email should be cleared')
assert_nil(mockPrefs.userPlan, 'User plan should be cleared')

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
