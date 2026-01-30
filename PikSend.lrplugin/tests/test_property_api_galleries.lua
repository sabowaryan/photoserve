--[[----------------------------------------------------------------------------

test_property_api_galleries.lua
Property-based tests for API gallery management

Tests the following properties:
- Property 9: Création de galerie via API
- Property 46: Utilisation exclusive de HTTPS

**Validates: Requirements 3.5, 11.1**

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
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_'
  local result = {}
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  return table.concat(result)
end

local function generateRandomToken()
  return generateRandomString(math.random(32, 64))
end

local function generateRandomGalleryId()
  return generateRandomString(16)
end

local function generateRandomGalleryData()
  local title = generateRandomString(math.random(1, 200))
  local data = {
    title = title,
    isPublic = math.random() > 0.5
  }
  
  -- Optionally add description
  if math.random() > 0.5 then
    data.description = generateRandomString(math.random(10, 500))
  end
  
  -- Optionally add expiration
  if math.random() > 0.7 then
    data.expiresAt = os.date("%Y-%m-%dT%H:%M:%S", os.time() + math.random(86400, 2592000))
  end
  
  -- Optionally add password
  if math.random() > 0.8 then
    data.password = generateRandomString(math.random(8, 32))
  end
  
  return data
end

local function generateRandomGallery()
  return {
    id = generateRandomGalleryId(),
    title = generateRandomString(math.random(1, 200)),
    description = math.random() > 0.5 and generateRandomString(math.random(10, 500)) or nil,
    imageCount = math.random(0, 1000),
    createdAt = os.date("%Y-%m-%dT%H:%M:%S", os.time() - math.random(0, 31536000)),
    status = math.random() > 0.8 and 'expired' or 'active'
  }
end

--------------------------------------------------------------------------------
-- Property 9: Création de galerie via API
-- **Validates: Requirements 3.5**
--------------------------------------------------------------------------------

print('\n=== Property 9: Création de galerie via API ===')
print('Feature: lightroom-plugin, Property 9: Pour toutes données de galerie valides,')
print('l\'appel de création doit retourner un ID de galerie non vide')

local property9_passed = 0
local property9_failed = 0

for i = 1, 100 do
  local token = generateRandomToken()
  local galleryData = generateRandomGalleryData()
  local expectedGalleryId = generateRandomGalleryId()
  
  -- Mock the HTTP response
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  mockLrHttp.setNextResponse(201, {
    id = expectedGalleryId,
    title = galleryData.title,
    shareUrl = 'https://piksend.com/g/' .. expectedGalleryId
  })
  
  -- Call createGallery
  local result = PikSendAPI.createGallery(token, galleryData)
  
  -- Verify the result has a non-empty ID
  if result and result.id and result.id ~= '' then
    property9_passed = property9_passed + 1
  else
    property9_failed = property9_failed + 1
    print(string.format('  FAIL iteration %d: Expected non-empty gallery ID but got %s', i, tostring(result and result.id)))
  end
end

print(string.format('Property 9 Results: %d passed, %d failed out of 100 iterations', property9_passed, property9_failed))
if property9_failed > 0 then
  print('❌ Property 9 FAILED')
  os.exit(1)
else
  print('✅ Property 9 PASSED')
end

--------------------------------------------------------------------------------
-- Property 46: Utilisation exclusive de HTTPS
-- **Validates: Requirements 11.1**
--------------------------------------------------------------------------------

print('\n=== Property 46: Utilisation exclusive de HTTPS ===')
print('Feature: lightroom-plugin, Property 46: Pour toute URL d\'API construite,')
print('elle doit commencer par "https://" et non "http://"')

local property46_passed = 0
local property46_failed = 0

-- Test that baseURL uses HTTPS
if PikSendAPI.baseURL:sub(1, 8) == 'https://' then
  print('✅ Base URL uses HTTPS: ' .. PikSendAPI.baseURL)
  property46_passed = property46_passed + 1
else
  print('❌ Base URL does not use HTTPS: ' .. PikSendAPI.baseURL)
  property46_failed = property46_failed + 1
end

-- Test various API endpoints to ensure they all use HTTPS
local endpoints = {
  '/api/auth/validate-token',
  '/api/galleries',
  '/api/galleries/test123',
  '/api/galleries/test123/images',
  '/api/galleries/test123/images/img456',
  '/api/galleries/test123/stats',
  '/api/plugin/lightroom/version'
}

for i, endpoint in ipairs(endpoints) do
  local fullUrl = PikSendAPI.baseURL .. endpoint
  
  if fullUrl:sub(1, 8) == 'https://' then
    property46_passed = property46_passed + 1
  else
    property46_failed = property46_failed + 1
    print(string.format('  FAIL: URL does not use HTTPS: %s', fullUrl))
  end
end

print(string.format('Property 46 Results: %d passed, %d failed out of %d checks', property46_passed, property46_failed, property46_passed + property46_failed))
if property46_failed > 0 then
  print('❌ Property 46 FAILED')
  os.exit(1)
else
  print('✅ Property 46 PASSED')
end

--------------------------------------------------------------------------------
-- Additional Gallery Tests
--------------------------------------------------------------------------------

print('\n=== Additional Gallery Tests ===')

-- Test getGalleries returns array
print('Test: getGalleries should return array of galleries')
local token = generateRandomToken()
local mockGalleries = {}
for i = 1, math.random(5, 20) do
  table.insert(mockGalleries, generateRandomGallery())
end

local mockLrHttp = require('tests/mocks/mock_LrHttp')
mockLrHttp.setNextResponse(200, {
  galleries = mockGalleries
})

local galleries = PikSendAPI.getGalleries(token)
if galleries and #galleries == #mockGalleries then
  print('✅ getGalleries returns correct number of galleries')
else
  print('❌ getGalleries did not return expected galleries')
  os.exit(1)
end

-- Test createGallery with minimal data
print('Test: createGallery with minimal data (title only)')
mockLrHttp.setNextResponse(201, {
  id = 'test-gallery-id',
  title = 'Test Gallery',
  shareUrl = 'https://piksend.com/g/test-gallery-id'
})

local minimalGallery = PikSendAPI.createGallery(token, { title = 'Test Gallery' })
if minimalGallery and minimalGallery.id then
  print('✅ createGallery works with minimal data')
else
  print('❌ createGallery failed with minimal data')
  os.exit(1)
end

-- Test createGallery with empty token
print('Test: createGallery with empty token should return nil')
local result = PikSendAPI.createGallery('', { title = 'Test' })
if not result then
  print('✅ createGallery correctly rejects empty token')
else
  print('❌ createGallery should reject empty token')
  os.exit(1)
end

-- Test createGallery with missing title
print('Test: createGallery with missing title should return nil')
result = PikSendAPI.createGallery(token, {})
if not result then
  print('✅ createGallery correctly rejects missing title')
else
  print('❌ createGallery should reject missing title')
  os.exit(1)
end

-- Test getGalleries with empty token
print('Test: getGalleries with empty token should return nil')
result = PikSendAPI.getGalleries('')
if not result then
  print('✅ getGalleries correctly rejects empty token')
else
  print('❌ getGalleries should reject empty token')
  os.exit(1)
end

print('\n=== All Property Tests PASSED ===')
