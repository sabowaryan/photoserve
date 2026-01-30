--[[----------------------------------------------------------------------------

test_property_api_token_validation.lua
Property-based tests for API token validation

Tests the following properties:
- Property 2: Validation de token API
- Property 3: Récupération des informations utilisateur
- Property 5: Vérification du plan Pro

**Validates: Requirements 2.3, 2.4, 2.7**

------------------------------------------------------------------------------]]

-- Mock the Lightroom SDK
_G.import = function(module)
  if module == 'LrHttp' then
    return require('tests/mocks/mock_LrHttp')
  elseif module == 'LrPathUtils' then
    return require('tests/mocks/mock_LrPathUtils')
  elseif module == 'LrFileUtils' then
    return require('tests/mocks/mock_LrFileUtils')
  elseif module == 'LrDate' then
    return require('tests/mocks/mock_LrDate')
  end
  return {}
end

-- Load the module to test
local PikSendAPI = require('PikSendAPI')

-- Test helpers
local function generateRandomString(length)
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'
  local result = {}
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  return table.concat(result)
end

local function generateRandomToken()
  -- Generate a token-like string (32-64 characters)
  return generateRandomString(math.random(32, 64))
end

local function generateRandomUser(planType)
  return {
    id = generateRandomString(16),
    name = 'User ' .. generateRandomString(8),
    email = generateRandomString(10) .. '@example.com',
    planType = planType or (math.random() > 0.5 and 'pro' or 'free')
  }
end

--------------------------------------------------------------------------------
-- Property 2: Validation de token API
-- **Validates: Requirements 2.3**
--------------------------------------------------------------------------------

print('\n=== Property 2: Validation de token API ===')
print('Feature: lightroom-plugin, Property 2: Pour tout token API, lorsqu\'il est soumis pour validation,')
print('le plugin doit faire un appel à l\'API PikSend et retourner le résultat de validation')

local property2_passed = 0
local property2_failed = 0

for i = 1, 100 do
  local token = generateRandomToken()
  local shouldBeValid = (math.random() > 0.5)
  
  -- Mock the HTTP response
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  if shouldBeValid then
    local user = generateRandomUser()
    mockLrHttp.setNextResponse(200, {
      valid = true,
      user = user
    })
  else
    mockLrHttp.setNextResponse(401, {
      valid = false
    })
  end
  
  -- Call validateToken
  local valid, user = PikSendAPI.validateToken(token)
  
  -- Verify the result matches expectations
  if shouldBeValid then
    if valid and user then
      property2_passed = property2_passed + 1
    else
      property2_failed = property2_failed + 1
      print(string.format('  FAIL iteration %d: Expected valid=true but got valid=%s', i, tostring(valid)))
    end
  else
    if not valid and not user then
      property2_passed = property2_passed + 1
    else
      property2_failed = property2_failed + 1
      print(string.format('  FAIL iteration %d: Expected valid=false but got valid=%s', i, tostring(valid)))
    end
  end
end

print(string.format('Property 2 Results: %d passed, %d failed out of 100 iterations', property2_passed, property2_failed))
if property2_failed > 0 then
  print('❌ Property 2 FAILED')
  os.exit(1)
else
  print('✅ Property 2 PASSED')
end

--------------------------------------------------------------------------------
-- Property 3: Récupération des informations utilisateur
-- **Validates: Requirements 2.4**
--------------------------------------------------------------------------------

print('\n=== Property 3: Récupération des informations utilisateur ===')
print('Feature: lightroom-plugin, Property 3: Pour tout token API valide, après validation réussie,')
print('le plugin doit récupérer et stocker le nom et l\'email de l\'utilisateur')

local property3_passed = 0
local property3_failed = 0

for i = 1, 100 do
  local token = generateRandomToken()
  local expectedUser = generateRandomUser('pro')
  
  -- Mock a successful validation response
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  mockLrHttp.setNextResponse(200, {
    valid = true,
    user = expectedUser
  })
  
  -- Call validateToken
  local valid, user = PikSendAPI.validateToken(token)
  
  -- Verify user information is returned
  if valid and user then
    if user.name == expectedUser.name and user.email == expectedUser.email then
      property3_passed = property3_passed + 1
    else
      property3_failed = property3_failed + 1
      print(string.format('  FAIL iteration %d: User info mismatch. Expected name=%s, email=%s but got name=%s, email=%s',
        i, expectedUser.name, expectedUser.email, user.name or 'nil', user.email or 'nil'))
    end
  else
    property3_failed = property3_failed + 1
    print(string.format('  FAIL iteration %d: Expected valid user but got valid=%s, user=%s', i, tostring(valid), tostring(user)))
  end
end

print(string.format('Property 3 Results: %d passed, %d failed out of 100 iterations', property3_passed, property3_failed))
if property3_failed > 0 then
  print('❌ Property 3 FAILED')
  os.exit(1)
else
  print('✅ Property 3 PASSED')
end

--------------------------------------------------------------------------------
-- Property 5: Vérification du plan Pro
-- **Validates: Requirements 2.7**
--------------------------------------------------------------------------------

print('\n=== Property 5: Vérification du plan Pro ===')
print('Feature: lightroom-plugin, Property 5: Pour tout utilisateur authentifié,')
print('le plugin doit vérifier que le champ planType est égal à "pro" avant d\'autoriser l\'utilisation')

local property5_passed = 0
local property5_failed = 0

for i = 1, 100 do
  local token = generateRandomToken()
  local planType = (math.random() > 0.5) and 'pro' or 'free'
  local expectedUser = generateRandomUser(planType)
  
  -- Mock a successful validation response
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  mockLrHttp.setNextResponse(200, {
    valid = true,
    user = expectedUser
  })
  
  -- Call validateToken
  local valid, user = PikSendAPI.validateToken(token)
  
  -- Verify planType is returned correctly
  if valid and user then
    if user.planType == planType then
      property5_passed = property5_passed + 1
    else
      property5_failed = property5_failed + 1
      print(string.format('  FAIL iteration %d: Expected planType=%s but got planType=%s', i, planType, user.planType or 'nil'))
    end
  else
    property5_failed = property5_failed + 1
    print(string.format('  FAIL iteration %d: Expected valid user but got valid=%s', i, tostring(valid)))
  end
end

print(string.format('Property 5 Results: %d passed, %d failed out of 100 iterations', property5_passed, property5_failed))
if property5_failed > 0 then
  print('❌ Property 5 FAILED')
  os.exit(1)
else
  print('✅ Property 5 PASSED')
end

--------------------------------------------------------------------------------
-- Edge Cases
--------------------------------------------------------------------------------

print('\n=== Edge Cases ===')

-- Test empty token
print('Test: Empty token should return false')
local valid, user = PikSendAPI.validateToken('')
if not valid and not user then
  print('✅ Empty token correctly rejected')
else
  print('❌ Empty token should be rejected')
  os.exit(1)
end

-- Test nil token
print('Test: Nil token should return false')
valid, user = PikSendAPI.validateToken(nil)
if not valid and not user then
  print('✅ Nil token correctly rejected')
else
  print('❌ Nil token should be rejected')
  os.exit(1)
end

-- Test very long token
print('Test: Very long token (1000 chars) should be handled')
local longToken = generateRandomString(1000)
local mockLrHttp = require('tests/mocks/mock_LrHttp')
mockLrHttp.setNextResponse(401, { valid = false })
valid, user = PikSendAPI.validateToken(longToken)
if not valid and not user then
  print('✅ Long token handled correctly')
else
  print('❌ Long token should be rejected by API')
  os.exit(1)
end

print('\n=== All Property Tests PASSED ===')
