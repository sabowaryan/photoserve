--[[----------------------------------------------------------------------------

test_api.lua
Unit tests for PikSendAPI module

Tests specific examples and edge cases for the API client

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
local function assert_true(condition, message)
  if not condition then
    error('Assertion failed: ' .. (message or 'expected true'))
  end
end

local function assert_false(condition, message)
  if condition then
    error('Assertion failed: ' .. (message or 'expected false'))
  end
end

local function assert_equal(actual, expected, message)
  if actual ~= expected then
    error(string.format('Assertion failed: %s (expected %s, got %s)', 
      message or 'values not equal', tostring(expected), tostring(actual)))
  end
end

local function assert_not_nil(value, message)
  if value == nil then
    error('Assertion failed: ' .. (message or 'expected non-nil value'))
  end
end

local function assert_nil(value, message)
  if value ~= nil then
    error('Assertion failed: ' .. (message or 'expected nil value'))
  end
end

print('\n=== PikSendAPI Unit Tests ===\n')

--------------------------------------------------------------------------------
-- Configuration Tests
--------------------------------------------------------------------------------

print('Test: API baseURL is configured')
assert_not_nil(PikSendAPI.baseURL, 'baseURL should be set')
assert_equal(PikSendAPI.baseURL, 'https://api.piksend.com', 'baseURL should be correct')
print('✅ PASSED')

print('Test: API timeout is configured')
assert_not_nil(PikSendAPI.timeout, 'timeout should be set')
assert_equal(PikSendAPI.timeout, 30, 'timeout should be 30 seconds')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- validateToken Tests
--------------------------------------------------------------------------------

print('\nTest: validateToken with valid token and Pro user')
local mockLrHttp = require('tests/mocks/mock_LrHttp')
mockLrHttp.setNextResponse(200, {
  valid = true,
  user = {
    id = 'user123',
    name = 'John Doe',
    email = 'john@example.com',
    planType = 'pro'
  }
})
local valid, user = PikSendAPI.validateToken('valid-token-123')
assert_true(valid, 'token should be valid')
assert_not_nil(user, 'user should be returned')
assert_equal(user.name, 'John Doe', 'user name should match')
assert_equal(user.planType, 'pro', 'user should be Pro')
print('✅ PASSED')

print('Test: validateToken with valid token but free user')
mockLrHttp.setNextResponse(200, {
  valid = true,
  user = {
    id = 'user456',
    name = 'Jane Smith',
    email = 'jane@example.com',
    planType = 'free'
  }
})
valid, user = PikSendAPI.validateToken('valid-token-456')
assert_true(valid, 'token should be valid')
assert_not_nil(user, 'user should be returned')
assert_equal(user.planType, 'free', 'user should be free')
print('✅ PASSED')

print('Test: validateToken with invalid token')
mockLrHttp.setNextResponse(401, {
  valid = false
})
valid, user = PikSendAPI.validateToken('invalid-token')
assert_false(valid, 'token should be invalid')
assert_nil(user, 'user should be nil')
print('✅ PASSED')

print('Test: validateToken with empty token')
valid, user = PikSendAPI.validateToken('')
assert_false(valid, 'empty token should be invalid')
assert_nil(user, 'user should be nil')
print('✅ PASSED')

print('Test: validateToken with nil token')
valid, user = PikSendAPI.validateToken(nil)
assert_false(valid, 'nil token should be invalid')
assert_nil(user, 'user should be nil')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- getGalleries Tests
--------------------------------------------------------------------------------

print('\nTest: getGalleries with valid token')
mockLrHttp.setNextResponse(200, {
  galleries = {
    {
      id = 'gallery1',
      title = 'My First Gallery',
      imageCount = 10,
      createdAt = '2024-01-01T00:00:00',
      status = 'active'
    },
    {
      id = 'gallery2',
      title = 'My Second Gallery',
      imageCount = 5,
      createdAt = '2024-01-02T00:00:00',
      status = 'active'
    }
  }
})
local galleries = PikSendAPI.getGalleries('valid-token')
assert_not_nil(galleries, 'galleries should be returned')
assert_equal(#galleries, 2, 'should have 2 galleries')
assert_equal(galleries[1].title, 'My First Gallery', 'first gallery title should match')
print('✅ PASSED')

print('Test: getGalleries with empty token')
galleries = PikSendAPI.getGalleries('')
assert_nil(galleries, 'should return nil for empty token')
print('✅ PASSED')

print('Test: getGalleries with nil token')
galleries = PikSendAPI.getGalleries(nil)
assert_nil(galleries, 'should return nil for nil token')
print('✅ PASSED')

print('Test: getGalleries with empty gallery list')
mockLrHttp.setNextResponse(200, {
  galleries = {}
})
galleries = PikSendAPI.getGalleries('valid-token')
assert_not_nil(galleries, 'galleries should be returned')
assert_equal(#galleries, 0, 'should have 0 galleries')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- createGallery Tests
--------------------------------------------------------------------------------

print('\nTest: createGallery with complete data')
mockLrHttp.setNextResponse(201, {
  id = 'new-gallery-123',
  title = 'Test Gallery',
  shareUrl = 'https://piksend.com/g/new-gallery-123'
})
local gallery = PikSendAPI.createGallery('valid-token', {
  title = 'Test Gallery',
  description = 'A test gallery',
  isPublic = true,
  expiresAt = '2024-12-31T23:59:59'
})
assert_not_nil(gallery, 'gallery should be created')
assert_equal(gallery.id, 'new-gallery-123', 'gallery ID should match')
assert_equal(gallery.title, 'Test Gallery', 'gallery title should match')
print('✅ PASSED')

print('Test: createGallery with minimal data (title only)')
mockLrHttp.setNextResponse(201, {
  id = 'minimal-gallery',
  title = 'Minimal',
  shareUrl = 'https://piksend.com/g/minimal-gallery'
})
gallery = PikSendAPI.createGallery('valid-token', {
  title = 'Minimal'
})
assert_not_nil(gallery, 'gallery should be created')
assert_equal(gallery.id, 'minimal-gallery', 'gallery ID should match')
print('✅ PASSED')

print('Test: createGallery with empty token')
gallery = PikSendAPI.createGallery('', { title = 'Test' })
assert_nil(gallery, 'should return nil for empty token')
print('✅ PASSED')

print('Test: createGallery with nil token')
gallery = PikSendAPI.createGallery(nil, { title = 'Test' })
assert_nil(gallery, 'should return nil for nil token')
print('✅ PASSED')

print('Test: createGallery with missing title')
gallery = PikSendAPI.createGallery('valid-token', {})
assert_nil(gallery, 'should return nil for missing title')
print('✅ PASSED')

print('Test: createGallery with nil data')
gallery = PikSendAPI.createGallery('valid-token', nil)
assert_nil(gallery, 'should return nil for nil data')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- updateGallery Tests
--------------------------------------------------------------------------------

print('\nTest: updateGallery with valid data')
mockLrHttp.setNextResponse(200, {
  id = 'gallery-123',
  title = 'Updated Gallery',
  description = 'Updated description'
})
gallery = PikSendAPI.updateGallery('valid-token', 'gallery-123', {
  title = 'Updated Gallery',
  description = 'Updated description'
})
assert_not_nil(gallery, 'gallery should be updated')
assert_equal(gallery.title, 'Updated Gallery', 'title should be updated')
print('✅ PASSED')

print('Test: updateGallery with empty token')
gallery = PikSendAPI.updateGallery('', 'gallery-123', { title = 'Test' })
assert_nil(gallery, 'should return nil for empty token')
print('✅ PASSED')

print('Test: updateGallery with nil galleryId')
gallery = PikSendAPI.updateGallery('valid-token', nil, { title = 'Test' })
assert_nil(gallery, 'should return nil for nil galleryId')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- uploadImage Tests
--------------------------------------------------------------------------------

print('\nTest: uploadImage with complete metadata')
local mockLrFileUtils = require('tests/mocks/mock_LrFileUtils')
mockLrFileUtils.setMockFile('/tmp/test.jpg', 'FAKE_IMAGE_DATA')

mockLrHttp.setNextResponse(201, {
  imageId = 'img-123',
  url = 'https://piksend.com/i/img-123',
  thumbnailUrl = 'https://piksend.com/t/img-123'
})
local result = PikSendAPI.uploadImage('valid-token', 'gallery-123', '/tmp/test.jpg', {
  title = 'Test Image',
  description = 'A test image',
  altText = 'Test alt text',
  keywords = 'test,image,photo'
})
assert_not_nil(result, 'upload should succeed')
assert_equal(result.imageId, 'img-123', 'image ID should match')
assert_not_nil(result.url, 'image URL should be returned')
print('✅ PASSED')

print('Test: uploadImage with nil metadata')
mockLrHttp.setNextResponse(201, {
  imageId = 'img-456',
  url = 'https://piksend.com/i/img-456',
  thumbnailUrl = 'https://piksend.com/t/img-456'
})
result = PikSendAPI.uploadImage('valid-token', 'gallery-123', '/tmp/test.jpg', nil)
assert_not_nil(result, 'upload should succeed with nil metadata')
print('✅ PASSED')

print('Test: uploadImage with non-existent file')
result = PikSendAPI.uploadImage('valid-token', 'gallery-123', '/nonexistent.jpg', {})
assert_nil(result, 'should return nil for non-existent file')
print('✅ PASSED')

print('Test: uploadImage with empty token')
result = PikSendAPI.uploadImage('', 'gallery-123', '/tmp/test.jpg', {})
assert_nil(result, 'should return nil for empty token')
print('✅ PASSED')

print('Test: uploadImage with empty galleryId')
result = PikSendAPI.uploadImage('valid-token', '', '/tmp/test.jpg', {})
assert_nil(result, 'should return nil for empty galleryId')
print('✅ PASSED')

mockLrFileUtils.clearMockFiles()

--------------------------------------------------------------------------------
-- deleteImage Tests
--------------------------------------------------------------------------------

print('\nTest: deleteImage with valid parameters')
mockLrHttp.setNextResponse(200, { success = true })
local deleted = PikSendAPI.deleteImage('valid-token', 'gallery-123', 'img-123')
assert_true(deleted, 'delete should succeed')
print('✅ PASSED')

print('Test: deleteImage with empty token')
deleted = PikSendAPI.deleteImage('', 'gallery-123', 'img-123')
assert_false(deleted, 'should return false for empty token')
print('✅ PASSED')

print('Test: deleteImage with empty galleryId')
deleted = PikSendAPI.deleteImage('valid-token', '', 'img-123')
assert_false(deleted, 'should return false for empty galleryId')
print('✅ PASSED')

print('Test: deleteImage with empty imageId')
deleted = PikSendAPI.deleteImage('valid-token', 'gallery-123', '')
assert_false(deleted, 'should return false for empty imageId')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- getGalleryStats Tests
--------------------------------------------------------------------------------

print('\nTest: getGalleryStats with valid parameters')
mockLrHttp.setNextResponse(200, {
  views = 150,
  downloads = 25
})
local stats = PikSendAPI.getGalleryStats('valid-token', 'gallery-123')
assert_not_nil(stats, 'stats should be returned')
assert_equal(stats.views, 150, 'views should match')
assert_equal(stats.downloads, 25, 'downloads should match')
print('✅ PASSED')

print('Test: getGalleryStats with empty token')
stats = PikSendAPI.getGalleryStats('', 'gallery-123')
assert_nil(stats, 'should return nil for empty token')
print('✅ PASSED')

print('Test: getGalleryStats with empty galleryId')
stats = PikSendAPI.getGalleryStats('valid-token', '')
assert_nil(stats, 'should return nil for empty galleryId')
print('✅ PASSED')

--------------------------------------------------------------------------------
-- checkForUpdates Tests
--------------------------------------------------------------------------------

print('\nTest: checkForUpdates returns version info')
mockLrHttp.setNextResponse(200, {
  available = true,
  version = '1.1.0',
  downloadUrl = 'https://piksend.com/downloads/lightroom-plugin-1.1.0.lrplugin',
  changelog = 'Bug fixes and improvements'
})
local updateInfo = PikSendAPI.checkForUpdates()
assert_not_nil(updateInfo, 'update info should be returned')
assert_true(updateInfo.available, 'update should be available')
assert_equal(updateInfo.version, '1.1.0', 'version should match')
print('✅ PASSED')

print('Test: checkForUpdates when no update available')
mockLrHttp.setNextResponse(200, {
  available = false,
  version = '1.0.0'
})
updateInfo = PikSendAPI.checkForUpdates()
assert_not_nil(updateInfo, 'update info should be returned')
assert_false(updateInfo.available, 'no update should be available')
print('✅ PASSED')

print('\n=== All Unit Tests PASSED ===\n')
