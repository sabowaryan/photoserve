--[[----------------------------------------------------------------------------

test_property_gallery_title_validation.lua
Property-based tests for gallery title validation

Tests the following properties:
- Property 8: Validation du titre de galerie

**Validates: Requirements 3.4**

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
_G.import = function(module)
  if module == 'LrDialogs' then return {} end
  if module == 'LrFunctionContext' then return {} end
  if module == 'LrView' then return {} end
  if module == 'LrBinding' then return {} end
  if module == 'LrDate' then
    return require('tests/mocks/mock_LrDate')
  end
  if module == 'LrTasks' then return {} end
  return {}
end

-- Mock PikSendAPI and PikSendAuth to avoid dependencies
package.loaded['PikSendAPI'] = {}
package.loaded['PikSendAuth'] = {}

-- Load the module under test
local PikSendGallery = require 'PikSendGallery'

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Generate random string of specified length
local function generateRandomString(length)
  if length <= 0 then
    return ''
  end
  
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_'
  local result = {}
  
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  
  return table.concat(result)
end

-- Generate random title within valid range
local function generateValidTitle()
  local length = math.random(1, 200)
  return generateRandomString(length)
end

-- Generate random title outside valid range
local function generateInvalidTitle()
  local choice = math.random(1, 2)
  if choice == 1 then
    -- Too long
    return generateRandomString(math.random(201, 300))
  else
    -- Empty
    return ''
  end
end

--------------------------------------------------------------------------------
-- Property 8: Validation du titre de galerie
-- **Validates: Requirements 3.4**
--------------------------------------------------------------------------------

print('\n=== Property 8: Validation du titre de galerie ===')
print('Testing that validateTitle accepts titles of 1-200 characters')
print('and rejects those outside this range\n')

local MIN_ITERATIONS = 100
local passCount = 0
local failCount = 0

-- Test with random strings of various lengths
for i = 1, MIN_ITERATIONS do
  local length = math.random(0, 250)
  local title = generateRandomString(length)
  
  local isValid, errorMsg = PikSendGallery.validateTitle(title)
  
  -- Expected result based on length
  local expectedValid = (length >= 1 and length <= 200)
  
  if isValid == expectedValid then
    passCount = passCount + 1
  else
    failCount = failCount + 1
    print(string.format('❌ FAILED: length=%d, expected=%s, got=%s, title="%s"',
      length, tostring(expectedValid), tostring(isValid), title:sub(1, 50)))
  end
  
  -- Additional checks
  if not expectedValid and isValid then
    print(string.format('❌ ERROR: Title with length %d should be invalid but was accepted', length))
    failCount = failCount + 1
  end
  
  if expectedValid and not isValid then
    print(string.format('❌ ERROR: Title with length %d should be valid but was rejected: %s', length, errorMsg or 'no error message'))
    failCount = failCount + 1
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: All property tests passed')
end

--------------------------------------------------------------------------------
-- Additional Edge Cases
--------------------------------------------------------------------------------

print('\n=== Testing Edge Cases ===\n')

-- Test nil title
print('Test: validateTitle with nil should return false')
local valid, err = PikSendGallery.validateTitle(nil)
if not valid then
  print('✅ PASSED: nil title rejected')
else
  print('❌ FAILED: nil title should be rejected')
  os.exit(1)
end

-- Test empty string
print('Test: validateTitle with empty string should return false')
valid, err = PikSendGallery.validateTitle('')
if not valid then
  print('✅ PASSED: empty string rejected')
else
  print('❌ FAILED: empty string should be rejected')
  os.exit(1)
end

-- Test exactly 1 character (boundary)
print('Test: validateTitle with exactly 1 character should return true')
valid, err = PikSendGallery.validateTitle('A')
if valid then
  print('✅ PASSED: 1 character title accepted')
else
  print('❌ FAILED: 1 character title should be accepted, error: ' .. (err or 'none'))
  os.exit(1)
end

-- Test exactly 200 characters (boundary)
print('Test: validateTitle with exactly 200 characters should return true')
local title200 = generateRandomString(200)
valid, err = PikSendGallery.validateTitle(title200)
if valid then
  print('✅ PASSED: 200 character title accepted')
else
  print('❌ FAILED: 200 character title should be accepted, error: ' .. (err or 'none'))
  os.exit(1)
end

-- Test exactly 201 characters (boundary)
print('Test: validateTitle with exactly 201 characters should return false')
local title201 = generateRandomString(201)
valid, err = PikSendGallery.validateTitle(title201)
if not valid then
  print('✅ PASSED: 201 character title rejected')
else
  print('❌ FAILED: 201 character title should be rejected')
  os.exit(1)
end

-- Test with special characters
print('Test: validateTitle with special characters should work')
local specialTitle = 'Gallery #1 - Photos été 2024 (Paris) & Nice!'
if #specialTitle >= 1 and #specialTitle <= 200 then
  valid, err = PikSendGallery.validateTitle(specialTitle)
  if valid then
    print('✅ PASSED: special characters accepted')
  else
    print('❌ FAILED: special characters should be accepted, error: ' .. (err or 'none'))
    os.exit(1)
  end
end

-- Test with unicode characters
print('Test: validateTitle with unicode characters should work')
local unicodeTitle = 'Galerie été 2024 ☀️ 🌊'
if #unicodeTitle >= 1 and #unicodeTitle <= 200 then
  valid, err = PikSendGallery.validateTitle(unicodeTitle)
  if valid then
    print('✅ PASSED: unicode characters accepted')
  else
    print('❌ FAILED: unicode characters should be accepted, error: ' .. (err or 'none'))
    os.exit(1)
  end
end

print('\n=== All Tests Passed ===')
print('Property 8: Validation du titre de galerie - VERIFIED ✅')
