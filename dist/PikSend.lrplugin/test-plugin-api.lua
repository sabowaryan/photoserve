--[[----------------------------------------------------------------------------

test-plugin-api.lua
Test suite for PikSend Plugin API v1.1.0

Tests the new plugin-specific API endpoints:
- Token validation
- Gallery creation
- Image upload to Cloudinary
- Batch image registration

Usage:
  Run this file from Lightroom's Plugin Manager or Script Editor

------------------------------------------------------------------------------]]

local LrTasks = import 'LrTasks'
local LrDialogs = import 'LrDialogs'
local LrPathUtils = import 'LrPathUtils'
local LrFileUtils = import 'LrFileUtils'

local PikSendAPI = require 'PikSendAPI'
local PikSendAuth = require 'PikSendAuth'
local PikSendLogger = require 'PikSendLogger'

--------------------------------------------------------------------------------
-- Test Configuration
--------------------------------------------------------------------------------

local TEST_CONFIG = {
  -- Set this to your test API token
  apiToken = nil,  -- Will be retrieved from auth
  
  -- Test gallery data
  testGallery = {
    title = 'Test Gallery - Plugin API v1.1.0',
    description = 'Test gallery created by plugin API test suite',
    allow_downloads = true,
    allow_comments = true,
    watermark_enabled = false,
  },
  
  -- Test image metadata
  testMetadata = {
    title = 'Test Image',
    description = 'Test image uploaded via plugin API',
  },
}

--------------------------------------------------------------------------------
-- Test Results
--------------------------------------------------------------------------------

local testResults = {
  passed = 0,
  failed = 0,
  tests = {},
}

local function recordTest(name, passed, message)
  table.insert(testResults.tests, {
    name = name,
    passed = passed,
    message = message or '',
  })
  
  if passed then
    testResults.passed = testResults.passed + 1
    PikSendLogger.info('[PASS] ' .. name, 'PluginAPITest')
  else
    testResults.failed = testResults.failed + 1
    PikSendLogger.error('[FAIL] ' .. name .. ': ' .. (message or ''), 'PluginAPITest')
  end
end

--------------------------------------------------------------------------------
-- Test Functions
--------------------------------------------------------------------------------

-- Test 1: Token Validation
local function testTokenValidation()
  PikSendLogger.info('Running Test 1: Token Validation', 'PluginAPITest')
  
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    recordTest('Token Validation', false, 'No API token found. Please authenticate first.')
    return false
  end
  
  TEST_CONFIG.apiToken = apiToken
  
  local valid, user, errorInfo = PikSendAPI.validateToken(apiToken)
  
  if valid and user then
    recordTest('Token Validation', true, 'Token valid for user: ' .. (user.email or 'unknown'))
    return true
  else
    recordTest('Token Validation', false, errorInfo and errorInfo.message or 'Unknown error')
    return false
  end
end

-- Test 2: Gallery Creation
local function testGalleryCreation()
  PikSendLogger.info('Running Test 2: Gallery Creation', 'PluginAPITest')
  
  if not TEST_CONFIG.apiToken then
    recordTest('Gallery Creation', false, 'No API token available')
    return false, nil
  end
  
  local gallery, errorInfo = PikSendAPI.createGallery(TEST_CONFIG.apiToken, TEST_CONFIG.testGallery)
  
  if gallery and gallery.id then
    recordTest('Gallery Creation', true, 'Gallery created with ID: ' .. gallery.id)
    return true, gallery.id
  else
    recordTest('Gallery Creation', false, errorInfo and errorInfo.message or 'Unknown error')
    return false, nil
  end
end

-- Test 3: Cloudinary Upload (requires a test image)
local function testCloudinaryUpload(testImagePath)
  PikSendLogger.info('Running Test 3: Cloudinary Upload', 'PluginAPITest')
  
  if not testImagePath or not LrFileUtils.exists(testImagePath) then
    recordTest('Cloudinary Upload', false, 'Test image not found: ' .. tostring(testImagePath))
    return false, nil
  end
  
  local cloudinaryData, errorInfo = PikSendAPI.uploadToCloudinary(testImagePath, TEST_CONFIG.testMetadata)
  
  if cloudinaryData and cloudinaryData.cloudinary_public_id then
    recordTest('Cloudinary Upload', true, 'Image uploaded: ' .. cloudinaryData.cloudinary_public_id)
    return true, cloudinaryData
  else
    recordTest('Cloudinary Upload', false, errorInfo and errorInfo.message or 'Unknown error')
    return false, nil
  end
end

-- Test 4: Batch Image Registration
local function testBatchImageRegistration(galleryId, cloudinaryData)
  PikSendLogger.info('Running Test 4: Batch Image Registration', 'PluginAPITest')
  
  if not TEST_CONFIG.apiToken or not galleryId or not cloudinaryData then
    recordTest('Batch Image Registration', false, 'Missing required data')
    return false
  end
  
  local images = {cloudinaryData}
  local result, errorInfo = PikSendAPI.uploadImagesToGallery(TEST_CONFIG.apiToken, galleryId, images)
  
  if result and result.success then
    recordTest('Batch Image Registration', true, 'Registered ' .. (result.count or 0) .. ' image(s)')
    return true
  else
    recordTest('Batch Image Registration', false, errorInfo and errorInfo.message or 'Unknown error')
    return false
  end
end

-- Test 5: Gallery Retrieval
local function testGalleryRetrieval()
  PikSendLogger.info('Running Test 5: Gallery Retrieval', 'PluginAPITest')
  
  if not TEST_CONFIG.apiToken then
    recordTest('Gallery Retrieval', false, 'No API token available')
    return false
  end
  
  local galleries, errorInfo = PikSendAPI.getGalleries(TEST_CONFIG.apiToken)
  
  if galleries and type(galleries) == 'table' then
    recordTest('Gallery Retrieval', true, 'Retrieved ' .. #galleries .. ' gallery(ies)')
    return true
  else
    recordTest('Gallery Retrieval', false, errorInfo and errorInfo.message or 'Unknown error')
    return false
  end
end

--------------------------------------------------------------------------------
-- Main Test Runner
--------------------------------------------------------------------------------

local function runTests()
  PikSendLogger.info('=== Starting Plugin API Test Suite v1.1.0 ===', 'PluginAPITest')
  
  -- Reset results
  testResults = {
    passed = 0,
    failed = 0,
    tests = {},
  }
  
  -- Test 1: Token Validation
  local tokenValid = testTokenValidation()
  if not tokenValid then
    LrDialogs.message('Test Suite Failed', 'Token validation failed. Please authenticate first.', 'critical')
    return
  end
  
  -- Test 2: Gallery Creation
  local galleryCreated, galleryId = testGalleryCreation()
  
  -- Test 3 & 4: Image Upload (only if gallery was created)
  if galleryCreated and galleryId then
    -- Ask user for test image
    local testImagePath = LrDialogs.runOpenPanel {
      title = 'Select Test Image',
      prompt = 'Choose an image file to test upload',
      canChooseFiles = true,
      canChooseDirectories = false,
      canCreateDirectories = false,
      allowsMultipleSelection = false,
      fileTypes = {'jpg', 'jpeg', 'png', 'tif', 'tiff'},
    }
    
    if testImagePath and testImagePath[1] then
      local cloudinarySuccess, cloudinaryData = testCloudinaryUpload(testImagePath[1])
      
      if cloudinarySuccess and cloudinaryData then
        testBatchImageRegistration(galleryId, cloudinaryData)
      end
    else
      recordTest('Cloudinary Upload', false, 'No test image selected')
      recordTest('Batch Image Registration', false, 'Skipped - no image uploaded')
    end
  else
    recordTest('Cloudinary Upload', false, 'Skipped - no gallery created')
    recordTest('Batch Image Registration', false, 'Skipped - no gallery created')
  end
  
  -- Test 5: Gallery Retrieval
  testGalleryRetrieval()
  
  -- Display results
  local resultMessage = string.format(
    'Tests Passed: %d\nTests Failed: %d\n\nDetails:\n',
    testResults.passed,
    testResults.failed
  )
  
  for _, test in ipairs(testResults.tests) do
    local status = test.passed and '[PASS]' or '[FAIL]'
    resultMessage = resultMessage .. string.format('\n%s %s', status, test.name)
    if test.message ~= '' then
      resultMessage = resultMessage .. '\n  ' .. test.message
    end
  end
  
  PikSendLogger.info('=== Test Suite Complete ===', 'PluginAPITest')
  PikSendLogger.info(resultMessage, 'PluginAPITest')
  
  local messageType = testResults.failed == 0 and 'info' or 'warning'
  LrDialogs.message('Test Suite Complete', resultMessage, messageType)
end

--------------------------------------------------------------------------------
-- Execute Tests
--------------------------------------------------------------------------------

LrTasks.startAsyncTask(function()
  runTests()
end)
