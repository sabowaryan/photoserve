--[[----------------------------------------------------------------------------

test_property_auth_token_storage.lua
Property-based tests for PikSendAuth token storage

Tests property-based invariants with minimum 100 iterations per property.

Property Tests:
- Property 4: Round-trip du stockage de token
  For ANY token, after saving and retrieving, the token is identical
  **Validates: Requirements 2.6**

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
-- Property Test Utilities
--------------------------------------------------------------------------------

local propertiesPassed = 0
local propertiesFailed = 0
local totalIterations = 0
local failedIterations = {}

-- Random string generator for property testing
-- @param minLen number - Minimum length
-- @param maxLen number - Maximum length
-- @param charset string - Character set to use (optional)
-- @return string - Random string
local function generateRandomString(minLen, maxLen, charset)
  charset = charset or 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.'
  local length = math.random(minLen, maxLen)
  local result = {}
  
  for i = 1, length do
    local randIndex = math.random(1, #charset)
    table.insert(result, string.sub(charset, randIndex, randIndex))
  end
  
  return table.concat(result)
end

-- Generate random token with various characteristics
-- @return string - Random token
local function generateRandomToken()
  local tokenTypes = {
    -- Short tokens
    function() return generateRandomString(8, 16) end,
    -- Medium tokens
    function() return generateRandomString(32, 64) end,
    -- Long tokens
    function() return generateRandomString(100, 200) end,
    -- Tokens with special characters
    function() return generateRandomString(20, 50, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!@#$%^&*()') end,
    -- Tokens with spaces
    function() return generateRandomString(20, 50, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ') end,
    -- Tokens with unicode-like characters (high ASCII)
    function() 
      local len = math.random(20, 50)
      local result = {}
      for i = 1, len do
        table.insert(result, string.char(math.random(33, 126)))
      end
      return table.concat(result)
    end,
    -- Realistic API tokens (alphanumeric with dashes)
    function() return generateRandomString(40, 80, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_') end,
  }
  
  local generator = tokenTypes[math.random(1, #tokenTypes)]
  return generator()
end

-- Run a property test with multiple iterations
-- @param propertyName string - Name of the property being tested
-- @param propertyNumber number - Property number from design doc
-- @param iterations number - Number of iterations to run
-- @param testFunc function - Test function that returns (success, message)
local function runPropertyTest(propertyName, propertyNumber, iterations, testFunc)
  print('\n=== Property ' .. propertyNumber .. ': ' .. propertyName .. ' ===')
  print('Running ' .. iterations .. ' iterations...\n')
  
  local passed = 0
  local failed = 0
  local failures = {}
  
  for i = 1, iterations do
    local success, message, testData = testFunc(i)
    totalIterations = totalIterations + 1
    
    if success then
      passed = passed + 1
    else
      failed = failed + 1
      table.insert(failures, {
        iteration = i,
        message = message,
        data = testData
      })
      
      -- Print first few failures for debugging
      if failed <= 3 then
        print('✗ Iteration ' .. i .. ' FAILED: ' .. message)
        if testData then
          print('  Test data: ' .. tostring(testData))
        end
      end
    end
  end
  
  -- Print summary for this property
  print('\nProperty ' .. propertyNumber .. ' Results:')
  print('  Passed: ' .. passed .. '/' .. iterations)
  print('  Failed: ' .. failed .. '/' .. iterations)
  
  if failed == 0 then
    print('  ✓ PROPERTY HOLDS')
    propertiesPassed = propertiesPassed + 1
    return true
  else
    print('  ✗ PROPERTY VIOLATED')
    propertiesFailed = propertiesFailed + 1
    
    -- Store failures for final report
    table.insert(failedIterations, {
      property = propertyNumber,
      name = propertyName,
      failures = failures
    })
    
    return false
  end
end

--------------------------------------------------------------------------------
-- Property Tests
--------------------------------------------------------------------------------

print('\n╔════════════════════════════════════════════════════════════════╗')
print('║  Property-Based Tests: PikSendAuth Token Storage              ║')
print('║  Feature: lightroom-plugin                                     ║')
print('╚════════════════════════════════════════════════════════════════╝')

-- Seed random number generator for reproducibility
math.randomseed(os.time())

--------------------------------------------------------------------------------
-- Property 4: Round-trip du stockage de token
-- **Validates: Requirements 2.6**
--
-- For ANY token, after saving and retrieving, the token is identical
--------------------------------------------------------------------------------

runPropertyTest(
  'Round-trip du stockage de token',
  4,
  100,
  function(iteration)
    -- Reset preferences for each iteration
    mockPrefs = {}
    
    -- Generate a random token
    local originalToken = generateRandomToken()
    
    -- Save the token
    PikSendAuth.saveToken(originalToken)
    
    -- Retrieve the token
    local retrievedToken = PikSendAuth.getToken()
    
    -- Verify round-trip property
    if retrievedToken == originalToken then
      return true, 'Token round-trip successful'
    else
      return false, 
             'Token mismatch after round-trip', 
             'Original: "' .. originalToken .. '", Retrieved: "' .. tostring(retrievedToken) .. '"'
    end
  end
)

--------------------------------------------------------------------------------
-- Additional Property: Token persistence across multiple operations
-- Verifies that token remains stable across multiple save/retrieve cycles
--------------------------------------------------------------------------------

runPropertyTest(
  'Token persistence across multiple operations',
  4.1,
  100,
  function(iteration)
    -- Reset preferences
    mockPrefs = {}
    
    -- Generate a random token
    local originalToken = generateRandomToken()
    
    -- Perform multiple save/retrieve cycles
    local numCycles = math.random(2, 5)
    
    for cycle = 1, numCycles do
      PikSendAuth.saveToken(originalToken)
      local retrieved = PikSendAuth.getToken()
      
      if retrieved ~= originalToken then
        return false,
               'Token changed after cycle ' .. cycle,
               'Original: "' .. originalToken .. '", Retrieved: "' .. tostring(retrieved) .. '"'
      end
    end
    
    return true, 'Token persisted correctly across ' .. numCycles .. ' cycles'
  end
)

--------------------------------------------------------------------------------
-- Additional Property: Different tokens are stored distinctly
-- Verifies that saving different tokens doesn't cause collisions
--------------------------------------------------------------------------------

runPropertyTest(
  'Different tokens are stored distinctly',
  4.2,
  100,
  function(iteration)
    -- Reset preferences
    mockPrefs = {}
    
    -- Generate two different tokens
    local token1 = generateRandomToken()
    local token2 = generateRandomToken()
    
    -- Ensure they're actually different
    while token1 == token2 do
      token2 = generateRandomToken()
    end
    
    -- Save first token and verify
    PikSendAuth.saveToken(token1)
    local retrieved1 = PikSendAuth.getToken()
    
    if retrieved1 ~= token1 then
      return false,
             'First token not stored correctly',
             'Token1: "' .. token1 .. '", Retrieved: "' .. tostring(retrieved1) .. '"'
    end
    
    -- Save second token and verify
    PikSendAuth.saveToken(token2)
    local retrieved2 = PikSendAuth.getToken()
    
    if retrieved2 ~= token2 then
      return false,
             'Second token not stored correctly',
             'Token2: "' .. token2 .. '", Retrieved: "' .. tostring(retrieved2) .. '"'
    end
    
    -- Verify second token replaced first
    if retrieved2 == token1 then
      return false,
             'Second token did not replace first token',
             'Token1: "' .. token1 .. '", Token2: "' .. token2 .. '"'
    end
    
    return true, 'Different tokens stored distinctly'
  end
)

--------------------------------------------------------------------------------
-- Additional Property: Clear operation removes token completely
-- Verifies that clearToken() properly removes stored token
--------------------------------------------------------------------------------

runPropertyTest(
  'Clear operation removes token completely',
  4.3,
  100,
  function(iteration)
    -- Reset preferences
    mockPrefs = {}
    
    -- Generate and save a random token
    local token = generateRandomToken()
    PikSendAuth.saveToken(token)
    
    -- Verify token is stored
    local retrieved = PikSendAuth.getToken()
    if retrieved ~= token then
      return false,
             'Token not stored before clear',
             'Original: "' .. token .. '", Retrieved: "' .. tostring(retrieved) .. '"'
    end
    
    -- Clear the token
    PikSendAuth.clearToken()
    
    -- Verify token is removed
    local afterClear = PikSendAuth.getToken()
    if afterClear ~= nil then
      return false,
             'Token not cleared properly',
             'After clear: "' .. tostring(afterClear) .. '"'
    end
    
    return true, 'Token cleared successfully'
  end
)

--------------------------------------------------------------------------------
-- Additional Property: Empty/nil tokens are not stored
-- Verifies that invalid tokens are rejected
--------------------------------------------------------------------------------

runPropertyTest(
  'Empty/nil tokens are not stored',
  4.4,
  50,
  function(iteration)
    -- Reset preferences
    mockPrefs = {}
    
    -- Test with nil or empty string
    local testToken = (iteration % 2 == 0) and nil or ''
    
    -- Try to save invalid token
    PikSendAuth.saveToken(testToken)
    
    -- Verify nothing is stored
    local retrieved = PikSendAuth.getToken()
    if retrieved ~= nil then
      return false,
             'Invalid token was stored',
             'Stored: "' .. tostring(retrieved) .. '"'
    end
    
    return true, 'Invalid token rejected'
  end
)

--------------------------------------------------------------------------------
-- Additional Property: Token encryption (tokens not stored in plain text)
-- Verifies that tokens are encrypted before storage
--------------------------------------------------------------------------------

runPropertyTest(
  'Tokens are encrypted in storage',
  4.5,
  100,
  function(iteration)
    -- Reset preferences
    mockPrefs = {}
    
    -- Generate a random token
    local plainToken = generateRandomToken()
    
    -- Save the token
    PikSendAuth.saveToken(plainToken)
    
    -- Check the stored value in preferences
    local storedValue = mockPrefs.apiToken
    
    -- Verify token is stored
    if not storedValue then
      return false,
             'Token not stored',
             'Plain token: "' .. plainToken .. '"'
    end
    
    -- Verify token is not stored in plain text
    if storedValue == plainToken then
      return false,
             'Token stored in plain text (not encrypted)',
             'Plain token: "' .. plainToken .. '"'
    end
    
    -- Verify we can still retrieve the original token
    local retrieved = PikSendAuth.getToken()
    if retrieved ~= plainToken then
      return false,
             'Encrypted token cannot be decrypted correctly',
             'Original: "' .. plainToken .. '", Retrieved: "' .. tostring(retrieved) .. '"'
    end
    
    return true, 'Token encrypted in storage'
  end
)

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n╔════════════════════════════════════════════════════════════════╗')
print('║  Property-Based Test Summary                                   ║')
print('╚════════════════════════════════════════════════════════════════╝')
print('\nProperties Tested: ' .. (propertiesPassed + propertiesFailed))
print('Properties Passed: ' .. propertiesPassed)
print('Properties Failed: ' .. propertiesFailed)
print('Total Iterations:  ' .. totalIterations)

if propertiesFailed > 0 then
  print('\n╔════════════════════════════════════════════════════════════════╗')
  print('║  Failed Properties Details                                     ║')
  print('╚════════════════════════════════════════════════════════════════╝')
  
  for _, failure in ipairs(failedIterations) do
    print('\nProperty ' .. failure.property .. ': ' .. failure.name)
    print('Failed iterations: ' .. #failure.failures)
    print('Sample failures:')
    
    for i = 1, math.min(3, #failure.failures) do
      local f = failure.failures[i]
      print('  Iteration ' .. f.iteration .. ': ' .. f.message)
      if f.data then
        print('    ' .. f.data)
      end
    end
  end
end

print('\n╔════════════════════════════════════════════════════════════════╗')

if propertiesFailed == 0 then
  print('║  ✓ ALL PROPERTIES HOLD - Tests Passed!                        ║')
  print('╚════════════════════════════════════════════════════════════════╝\n')
  os.exit(0)
else
  print('║  ✗ SOME PROPERTIES VIOLATED - Tests Failed!                   ║')
  print('╚════════════════════════════════════════════════════════════════╝\n')
  os.exit(1)
end
