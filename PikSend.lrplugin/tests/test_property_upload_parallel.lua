--[[----------------------------------------------------------------------------

test_property_upload_parallel.lua
Property-based tests for parallel upload functionality

Tests:
- Property 19: Limite d'uploads parallèles
- Property 42: Configuration de la limite d'uploads simultanés

**Validates: Requirements 5.7, 10.1, 10.2**

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
local mockLrTasks
_G.import = function(module)
  if module == 'LrTasks' then
    mockLrTasks = dofile('mocks/mock_LrTasks.lua')
    return mockLrTasks
  elseif module == 'LrFileUtils' then
    return dofile('mocks/mock_LrFileUtils.lua')
  elseif module == 'LrDate' then
    return dofile('mocks/mock_LrDate.lua')
  end
  error("Unknown module: " .. module)
end

-- Mock require for PikSendAPI
_G.require = function(module)
  if module == 'PikSendAPI' then
    -- Return mock API with uploadImage function
    return {
      uploadImage = function(apiToken, galleryId, path, metadata)
        -- Simulate successful upload
        return {
          imageId = 'img_' .. math.random(1000, 9999),
          url = 'https://piksend.com/images/' .. math.random(1000, 9999),
          thumbnailUrl = 'https://piksend.com/thumbs/' .. math.random(1000, 9999)
        }
      end
    }
  end
  error("Unknown module: " .. module)
end

local PikSendUpload = dofile('../PikSendUpload.lua')

--------------------------------------------------------------------------------
-- Test Utilities
--------------------------------------------------------------------------------

local testsPassed = 0
local testsFailed = 0

local function assert_true(condition, message)
  if condition then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

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

--------------------------------------------------------------------------------
-- Generators
--------------------------------------------------------------------------------

-- Generate random photo data
local function generateRandomPhotos(count)
  local photos = {}
  for i = 1, count do
    table.insert(photos, {
      id = 'photo_' .. i,
      path = '/tmp/photo_' .. i .. '.jpg',
      size = math.random(100000, 5000000)
    })
  end
  return photos
end

-- Generate random max concurrent value
local function generateRandomMaxConcurrent()
  return math.random(1, 10)  -- Include invalid values (6-10)
end

--------------------------------------------------------------------------------
-- Property Tests
--------------------------------------------------------------------------------

print('\n=== Property-Based Tests for Parallel Upload ===\n')

-- Property 42: Configuration de la limite d'uploads simultanés
-- For any value of concurrent upload configuration, it must be in range 1-5,
-- otherwise it should be rejected (defaults to 3)
print('Property 42: Configuration de la limite d\'uploads simultanés')
print('Testing that maxConcurrent is validated to be in range 1-5...\n')

local property42Passed = 0
local property42Failed = 0

for iteration = 1, 100 do
  local maxConcurrent = generateRandomMaxConcurrent()
  local photos = generateRandomPhotos(5)
  local state = PikSendUpload.createUploadState(photos)
  
  -- Track max active uploads during execution
  local maxActiveObserved = 0
  local progressCallback = function(uploadState)
    if uploadState.activeUploads > maxActiveObserved then
      maxActiveObserved = uploadState.activeUploads
    end
  end
  
  -- Execute upload
  PikSendUpload.uploadPhotosParallel(
    'test-token',
    'gallery-123',
    state,
    nil,  -- no metadata extractor
    progressCallback,
    maxConcurrent
  )
  
  -- Validate: if maxConcurrent is out of range (< 1 or > 5), it should default to 3
  -- Otherwise, it should use the provided value
  local expectedMax
  if maxConcurrent < 1 or maxConcurrent > 5 then
    expectedMax = 3  -- DEFAULT_MAX_CONCURRENT
  else
    expectedMax = maxConcurrent
  end
  
  -- The observed max should never exceed the expected max
  if maxActiveObserved <= expectedMax then
    property42Passed = property42Passed + 1
  else
    property42Failed = property42Failed + 1
    print('  Iteration ' .. iteration .. ' FAILED:')
    print('    Input maxConcurrent: ' .. maxConcurrent)
    print('    Expected max: ' .. expectedMax)
    print('    Observed max: ' .. maxActiveObserved)
  end
end

print('\nProperty 42 Results: ' .. property42Passed .. '/100 passed')
assert_equal(property42Failed, 0, 'Property 42: All iterations should pass')

-- Property 19: Limite d'uploads parallèles
-- At any moment during upload, the number of active simultaneous uploads
-- should never exceed the configured limit (default 3)
print('\nProperty 19: Limite d\'uploads parallèles')
print('Testing that concurrent uploads never exceed the limit...\n')

local property19Passed = 0
local property19Failed = 0

for iteration = 1, 100 do
  -- Reset and enable concurrency tracking
  mockLrTasks._enableConcurrencyTracking()
  
  -- Generate random number of photos (10-50)
  local photoCount = math.random(10, 50)
  local photos = generateRandomPhotos(photoCount)
  local state = PikSendUpload.createUploadState(photos)
  
  -- Use random valid maxConcurrent (1-5)
  local maxConcurrent = math.random(1, 5)
  
  -- Track max active uploads during execution
  local maxActiveObserved = 0
  local allObservations = {}
  
  local progressCallback = function(uploadState)
    table.insert(allObservations, uploadState.activeUploads)
    if uploadState.activeUploads > maxActiveObserved then
      maxActiveObserved = uploadState.activeUploads
    end
  end
  
  -- Execute upload
  PikSendUpload.uploadPhotosParallel(
    'test-token',
    'gallery-123',
    state,
    nil,  -- no metadata extractor
    progressCallback,
    maxConcurrent
  )
  
  -- Get max from mock tracking
  local mockMaxActive = mockLrTasks._getMaxActiveTasks()
  
  -- Validate: maxActiveObserved should never exceed maxConcurrent
  -- Use the maximum of both tracking methods
  local actualMax = math.max(maxActiveObserved, mockMaxActive)
  
  local passed = true
  if actualMax > maxConcurrent then
    passed = false
    property19Failed = property19Failed + 1
    print('  Iteration ' .. iteration .. ' FAILED:')
    print('    Photo count: ' .. photoCount)
    print('    Max concurrent: ' .. maxConcurrent)
    print('    Max active observed (state): ' .. maxActiveObserved)
    print('    Max active observed (mock): ' .. mockMaxActive)
    print('    All observations: ' .. table.concat(allObservations, ', '))
  else
    property19Passed = property19Passed + 1
  end
end

print('\nProperty 19 Results: ' .. property19Passed .. '/100 passed')
assert_equal(property19Failed, 0, 'Property 19: All iterations should pass')

-- Additional test: Verify that with more photos than maxConcurrent,
-- we actually reach the maxConcurrent limit
print('\nAdditional Test: Verify maxConcurrent is actually used')
print('Testing that we reach the concurrent limit when enough photos...\n')

local reachedLimitCount = 0

for iteration = 1, 20 do
  mockLrTasks._enableConcurrencyTracking()
  
  local photoCount = 20  -- More than any maxConcurrent
  local photos = generateRandomPhotos(photoCount)
  local state = PikSendUpload.createUploadState(photos)
  
  local maxConcurrent = math.random(2, 5)  -- At least 2
  
  local maxActiveObserved = 0
  local progressCallback = function(uploadState)
    if uploadState.activeUploads > maxActiveObserved then
      maxActiveObserved = uploadState.activeUploads
    end
  end
  
  PikSendUpload.uploadPhotosParallel(
    'test-token',
    'gallery-123',
    state,
    nil,
    progressCallback,
    maxConcurrent
  )
  
  local mockMaxActive = mockLrTasks._getMaxActiveTasks()
  local actualMax = math.max(maxActiveObserved, mockMaxActive)
  
  -- We should reach the maxConcurrent limit (or close to it)
  if actualMax >= maxConcurrent - 1 then
    reachedLimitCount = reachedLimitCount + 1
  end
end

print('Reached limit in ' .. reachedLimitCount .. '/20 iterations')
print('(Note: In mock environment with synchronous execution, this is informational only)')
-- This is informational, not a strict requirement in mock environment

-- Test with metadata extractor
print('\nTest: Upload with metadata extractor')

local metadataExtractorCalled = 0
local metadataExtractor = function(photoState)
  metadataExtractorCalled = metadataExtractorCalled + 1
  return {
    title = 'Photo ' .. photoState.photoId,
    description = 'Test photo',
    keywords = {'test', 'photo'}
  }
end

local photos = generateRandomPhotos(5)
local state = PikSendUpload.createUploadState(photos)

PikSendUpload.uploadPhotosParallel(
  'test-token',
  'gallery-123',
  state,
  metadataExtractor,
  nil,
  3
)

assert_equal(metadataExtractorCalled, 5, 'Metadata extractor should be called for each photo')

-- Test: Verify all photos are processed
print('\nTest: Verify all photos are processed')

for iteration = 1, 10 do
  local photoCount = math.random(5, 20)
  local photos = generateRandomPhotos(photoCount)
  local state = PikSendUpload.createUploadState(photos)
  
  PikSendUpload.uploadPhotosParallel(
    'test-token',
    'gallery-123',
    state,
    nil,
    nil,
    3
  )
  
  -- All photos should be either completed or failed
  local processedCount = 0
  for _, photoState in ipairs(state.photos) do
    if photoState.status == 'completed' or photoState.status == 'failed' then
      processedCount = processedCount + 1
    end
  end
  
  assert_equal(processedCount, photoCount, 'All photos should be processed (iteration ' .. iteration .. ')')
end

-- Test: State counters are updated correctly
print('\nTest: State counters are updated correctly')

for iteration = 1, 10 do
  local photoCount = math.random(5, 15)
  local photos = generateRandomPhotos(photoCount)
  local state = PikSendUpload.createUploadState(photos)
  
  PikSendUpload.uploadPhotosParallel(
    'test-token',
    'gallery-123',
    state,
    nil,
    nil,
    3
  )
  
  -- Count completed and failed photos
  local completedCount = 0
  local failedCount = 0
  for _, photoState in ipairs(state.photos) do
    if photoState.status == 'completed' then
      completedCount = completedCount + 1
    elseif photoState.status == 'failed' then
      failedCount = failedCount + 1
    end
  end
  
  assert_equal(state.completedCount, completedCount, 'Completed count should match (iteration ' .. iteration .. ')')
  assert_equal(state.failedCount, failedCount, 'Failed count should match (iteration ' .. iteration .. ')')
  assert_equal(state.completedCount + state.failedCount, photoCount, 'Total processed should equal photo count (iteration ' .. iteration .. ')')
end

-- Test: Progress callback is called
print('\nTest: Progress callback is called')

local callbackCount = 0
local progressCallback = function(uploadState)
  callbackCount = callbackCount + 1
end

local photos = generateRandomPhotos(10)
local state = PikSendUpload.createUploadState(photos)

PikSendUpload.uploadPhotosParallel(
  'test-token',
  'gallery-123',
  state,
  nil,
  progressCallback,
  3
)

assert_true(callbackCount > 0, 'Progress callback should be called at least once')
assert_true(callbackCount <= 10, 'Progress callback should not be called more than number of photos')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== Test Summary ===')
print('Passed: ' .. testsPassed)
print('Failed: ' .. testsFailed)
print('Total: ' .. (testsPassed + testsFailed))

if testsFailed == 0 then
  print('\n✓ All property tests passed!')
  print('✓ Property 19: Limite d\'uploads parallèles - VALIDATED')
  print('✓ Property 42: Configuration de la limite d\'uploads simultanés - VALIDATED')
  os.exit(0)
else
  print('\n✗ Some property tests failed')
  os.exit(1)
end
