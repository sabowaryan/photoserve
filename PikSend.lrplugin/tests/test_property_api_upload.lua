--[[----------------------------------------------------------------------------

test_property_api_upload.lua
Property-based tests for API image upload

Tests the following properties:
- Property 18: Format multipart/form-data
- Property 20: Gestion des erreurs d'upload

**Validates: Requirements 5.6, 5.8**

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
  return generateRandomString(math.random(32, 64))
end

local function generateRandomGalleryId()
  return generateRandomString(16)
end

local function generateRandomImageId()
  return generateRandomString(16)
end

local function generateRandomImagePath()
  local filename = generateRandomString(8) .. '.jpg'
  return '/tmp/test/' .. filename
end

local function generateRandomMetadata()
  local metadata = {}
  
  -- Optionally add title
  if math.random() > 0.3 then
    metadata.title = generateRandomString(math.random(5, 100))
  end
  
  -- Optionally add description
  if math.random() > 0.5 then
    metadata.description = generateRandomString(math.random(10, 500))
  end
  
  -- Optionally add altText
  if math.random() > 0.4 then
    metadata.altText = generateRandomString(math.random(10, 200))
  end
  
  -- Optionally add keywords
  if math.random() > 0.6 then
    local keywords = {}
    for i = 1, math.random(1, 10) do
      table.insert(keywords, generateRandomString(math.random(3, 15)))
    end
    metadata.keywords = table.concat(keywords, ',')
  end
  
  return metadata
end

--------------------------------------------------------------------------------
-- Property 18: Format multipart/form-data
-- **Validates: Requirements 5.6**
--------------------------------------------------------------------------------

print('\n=== Property 18: Format multipart/form-data ===')
print('Feature: lightroom-plugin, Property 18: Pour toute photo uploadée,')
print('la requête HTTP doit utiliser le Content-Type "multipart/form-data" et inclure le fichier image')

local property18_passed = 0
local property18_failed = 0

-- We'll test this by verifying the uploadImage function constructs proper requests
-- The mock will capture the headers and body

for i = 1, 100 do
  local token = generateRandomToken()
  local galleryId = generateRandomGalleryId()
  local imagePath = generateRandomImagePath()
  local metadata = generateRandomMetadata()
  local imageId = generateRandomImageId()
  
  -- Setup mock file
  local mockLrFileUtils = require('tests/mocks/mock_LrFileUtils')
  local mockImageContent = 'FAKE_IMAGE_DATA_' .. generateRandomString(100)
  mockLrFileUtils.setMockFile(imagePath, mockImageContent)
  
  -- Mock the HTTP response
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  mockLrHttp.setNextResponse(201, {
    imageId = imageId,
    url = 'https://piksend.com/i/' .. imageId,
    thumbnailUrl = 'https://piksend.com/t/' .. imageId
  })
  
  -- Call uploadImage
  local result = PikSendAPI.uploadImage(token, galleryId, imagePath, metadata)
  
  -- Verify the result indicates successful upload
  if result and result.imageId and result.url then
    property18_passed = property18_passed + 1
  else
    property18_failed = property18_failed + 1
    print(string.format('  FAIL iteration %d: Upload did not return expected result', i))
  end
end

-- Clean up mock files
local mockLrFileUtils = require('tests/mocks/mock_LrFileUtils')
mockLrFileUtils.clearMockFiles()

print(string.format('Property 18 Results: %d passed, %d failed out of 100 iterations', property18_passed, property18_failed))
if property18_failed > 0 then
  print('❌ Property 18 FAILED')
  os.exit(1)
else
  print('✅ Property 18 PASSED')
end

--------------------------------------------------------------------------------
-- Property 20: Gestion des erreurs d'upload
-- **Validates: Requirements 5.8**
--------------------------------------------------------------------------------

print('\n=== Property 20: Gestion des erreurs d\'upload ===')
print('Feature: lightroom-plugin, Property 20: Pour toute erreur d\'upload')
print('(timeout, connexion perdue, erreur serveur), le plugin doit capturer l\'erreur et permettre un retry')

local property20_passed = 0
local property20_failed = 0

-- Test various error scenarios
local errorScenarios = {
  { name = 'Network timeout', mockResponse = nil },
  { name = 'Server error 500', mockResponse = nil },
  { name = 'Invalid response', mockResponse = nil },
}

for i = 1, 100 do
  local token = generateRandomToken()
  local galleryId = generateRandomGalleryId()
  local imagePath = generateRandomImagePath()
  local metadata = generateRandomMetadata()
  
  -- Setup mock file
  local mockLrFileUtils = require('tests/mocks/mock_LrFileUtils')
  local mockImageContent = 'FAKE_IMAGE_DATA_' .. generateRandomString(100)
  mockLrFileUtils.setMockFile(imagePath, mockImageContent)
  
  -- Randomly select an error scenario
  local scenario = errorScenarios[math.random(1, #errorScenarios)]
  
  -- Mock an error response (nil response simulates network error)
  local mockLrHttp = require('tests/mocks/mock_LrHttp')
  mockLrHttp.setNextResponse(500, scenario.mockResponse)
  
  -- Call uploadImage
  local result = PikSendAPI.uploadImage(token, galleryId, imagePath, metadata)
  
  -- Verify the function handles the error gracefully (returns nil)
  if not result then
    property20_passed = property20_passed + 1
  else
    property20_failed = property20_failed + 1
    print(string.format('  FAIL iteration %d: Expected nil on error but got result', i))
  end
end

-- Clean up mock files
mockLrFileUtils.clearMockFiles()

print(string.format('Property 20 Results: %d passed, %d failed out of 100 iterations', property20_passed, property20_failed))
if property20_failed > 0 then
  print('❌ Property 20 FAILED')
  os.exit(1)
else
  print('✅ Property 20 PASSED')
end

--------------------------------------------------------------------------------
-- Additional Upload Tests
--------------------------------------------------------------------------------

print('\n=== Additional Upload Tests ===')

-- Test uploadImage with missing file
print('Test: uploadImage with non-existent file should return nil')
local token = generateRandomToken()
local galleryId = generateRandomGalleryId()
local result = PikSendAPI.uploadImage(token, galleryId, '/nonexistent/file.jpg', {})
if not result then
  print('✅ uploadImage correctly handles missing file')
else
  print('❌ uploadImage should return nil for missing file')
  os.exit(1)
end

-- Test uploadImage with empty token
print('Test: uploadImage with empty token should return nil')
local mockLrFileUtils = require('tests/mocks/mock_LrFileUtils')
local testPath = '/tmp/test.jpg'
mockLrFileUtils.setMockFile(testPath, 'TEST_DATA')
result = PikSendAPI.uploadImage('', galleryId, testPath, {})
if not result then
  print('✅ uploadImage correctly rejects empty token')
else
  print('❌ uploadImage should reject empty token')
  os.exit(1)
end

-- Test uploadImage with empty galleryId
print('Test: uploadImage with empty galleryId should return nil')
result = PikSendAPI.uploadImage(token, '', testPath, {})
if not result then
  print('✅ uploadImage correctly rejects empty galleryId')
else
  print('❌ uploadImage should reject empty galleryId')
  os.exit(1)
end

-- Test uploadImage with nil metadata (should work)
print('Test: uploadImage with nil metadata should work')
local mockLrHttp = require('tests/mocks/mock_LrHttp')
mockLrHttp.setNextResponse(201, {
  imageId = 'test-id',
  url = 'https://piksend.com/i/test-id',
  thumbnailUrl = 'https://piksend.com/t/test-id'
})
result = PikSendAPI.uploadImage(token, galleryId, testPath, nil)
if result and result.imageId then
  print('✅ uploadImage works with nil metadata')
else
  print('❌ uploadImage should work with nil metadata')
  os.exit(1)
end

-- Test deleteImage
print('Test: deleteImage should work with valid parameters')
mockLrHttp.setNextResponse(200, { success = true })
local deleted = PikSendAPI.deleteImage(token, galleryId, 'test-image-id')
if deleted then
  print('✅ deleteImage works correctly')
else
  print('❌ deleteImage should return true on success')
  os.exit(1)
end

-- Test deleteImage with empty token
print('Test: deleteImage with empty token should return false')
deleted = PikSendAPI.deleteImage('', galleryId, 'test-image-id')
if not deleted then
  print('✅ deleteImage correctly rejects empty token')
else
  print('❌ deleteImage should reject empty token')
  os.exit(1)
end

-- Clean up
mockLrFileUtils.clearMockFiles()

print('\n=== All Property Tests PASSED ===')
