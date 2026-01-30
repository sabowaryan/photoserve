--[[----------------------------------------------------------------------------

test_upload_state.lua
Unit tests for PikSendUpload state management

Tests:
- UploadState creation
- State initialization
- Photo state tracking

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
_G.import = function(module)
  if module == 'LrTasks' then
    return dofile('mocks/mock_LrTasks.lua')
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
    return {} -- Return empty table for API module
  end
  error("Unknown module: " .. module)
end

local PikSendUpload = dofile('../PikSendUpload.lua')

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

local function assert_true(actual, message)
  if actual == true then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: true')
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_false(actual, message)
  if actual == false then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: false')
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_type(actual, expectedType, message)
  if type(actual) == expectedType then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected type: ' .. expectedType)
    print('  Actual type: ' .. type(actual))
    return false
  end
end

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

print('\n=== Testing PikSendUpload - UploadState ===\n')

-- Test 1: PhotoState constants
print('Test 1: PhotoState constants')
assert_not_nil(PikSendUpload.PhotoState.PENDING, 'PENDING state should be defined')
assert_not_nil(PikSendUpload.PhotoState.UPLOADING, 'UPLOADING state should be defined')
assert_not_nil(PikSendUpload.PhotoState.COMPLETED, 'COMPLETED state should be defined')
assert_not_nil(PikSendUpload.PhotoState.FAILED, 'FAILED state should be defined')
assert_equal(PikSendUpload.PhotoState.PENDING, 'pending', 'PENDING should equal "pending"')
assert_equal(PikSendUpload.PhotoState.UPLOADING, 'uploading', 'UPLOADING should equal "uploading"')
assert_equal(PikSendUpload.PhotoState.COMPLETED, 'completed', 'COMPLETED should equal "completed"')
assert_equal(PikSendUpload.PhotoState.FAILED, 'failed', 'FAILED should equal "failed"')

-- Test 2: Create state for empty photo list
print('\nTest 2: Create state for empty photo list')
local photos = {}
local state = PikSendUpload.createUploadState(photos)
assert_not_nil(state, 'State should be created')
assert_equal(state.totalCount, 0, 'Total count should be 0')
assert_equal(state.completedCount, 0, 'Completed count should be 0')
assert_equal(state.failedCount, 0, 'Failed count should be 0')
assert_equal(state.totalSize, 0, 'Total size should be 0')
assert_equal(state.uploadedSize, 0, 'Uploaded size should be 0')
assert_false(state.isPaused, 'isPaused should be false')
assert_false(state.isCancelled, 'isCancelled should be false')
assert_equal(state.activeUploads, 0, 'Active uploads should be 0')
assert_type(state.photos, 'table', 'photos should be a table')
assert_equal(#state.photos, 0, 'photos array should be empty')

-- Test 3: Create state for single photo
print('\nTest 3: Create state for single photo')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_equal(state.totalCount, 1, 'Total count should be 1')
assert_equal(state.totalSize, 1024000, 'Total size should be 1024000')
assert_equal(#state.photos, 1, 'Should have 1 photo')

local photoState = state.photos[1]
assert_equal(photoState.photoId, 'photo1', 'Photo ID should match')
assert_equal(photoState.path, '/path/to/photo1.jpg', 'Photo path should match')
assert_equal(photoState.size, 1024000, 'Photo size should match')
assert_equal(photoState.status, 'pending', 'Photo status should be pending')
assert_equal(photoState.progress, 0, 'Photo progress should be 0')
assert_nil(photoState.error, 'Photo error should be nil')
assert_equal(photoState.retryCount, 0, 'Retry count should be 0')

-- Test 4: Create state for multiple photos
print('\nTest 4: Create state for multiple photos')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 },
  { id = 'photo2', path = '/path/to/photo2.jpg', size = 2048000 },
  { id = 'photo3', path = '/path/to/photo3.jpg', size = 512000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_equal(state.totalCount, 3, 'Total count should be 3')
assert_equal(state.totalSize, 3584000, 'Total size should be 3584000')
assert_equal(#state.photos, 3, 'Should have 3 photos')

-- Verify all photos are initialized with pending status
for i, photoState in ipairs(state.photos) do
  assert_equal(photoState.status, 'pending', 'Photo ' .. i .. ' status should be pending')
  assert_equal(photoState.progress, 0, 'Photo ' .. i .. ' progress should be 0')
  assert_nil(photoState.error, 'Photo ' .. i .. ' error should be nil')
end

-- Test 5: Handle photos without size
print('\nTest 5: Handle photos without size')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg' },  -- No size
  { id = 'photo2', path = '/path/to/photo2.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_equal(state.totalCount, 2, 'Total count should be 2')
assert_equal(state.totalSize, 1024000, 'Total size should be 1024000')
assert_equal(state.photos[1].size, 0, 'Photo 1 size should default to 0')
assert_equal(state.photos[2].size, 1024000, 'Photo 2 size should be 1024000')

-- Test 6: Initialize startTime
print('\nTest 6: Initialize startTime')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_not_nil(state.startTime, 'startTime should be set')
assert_type(state.startTime, 'number', 'startTime should be a number')
assert_true(state.startTime > 0, 'startTime should be greater than 0')

-- Test 7: Initialize control flags
print('\nTest 7: Initialize control flags')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_false(state.isPaused, 'isPaused should be false')
assert_false(state.isCancelled, 'isCancelled should be false')

-- Test 8: Initialize counters
print('\nTest 8: Initialize counters')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)
assert_equal(state.completedCount, 0, 'completedCount should be 0')
assert_equal(state.failedCount, 0, 'failedCount should be 0')
assert_equal(state.uploadedSize, 0, 'uploadedSize should be 0')
assert_equal(state.activeUploads, 0, 'activeUploads should be 0')

-- Test 9: State transitions
print('\nTest 9: State transitions')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)

-- Transition from pending to uploading
state.photos[1].status = PikSendUpload.PhotoState.UPLOADING
assert_equal(state.photos[1].status, 'uploading', 'Status should transition to uploading')

-- Transition to completed
state.photos[1].status = PikSendUpload.PhotoState.COMPLETED
state.photos[1].progress = 100
assert_equal(state.photos[1].status, 'completed', 'Status should transition to completed')
assert_equal(state.photos[1].progress, 100, 'Progress should be 100')

-- Test 10: Failed status with error
print('\nTest 10: Failed status with error')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 }
}
local state = PikSendUpload.createUploadState(photos)

state.photos[1].status = PikSendUpload.PhotoState.FAILED
state.photos[1].error = 'Network timeout'

assert_equal(state.photos[1].status, 'failed', 'Status should be failed')
assert_equal(state.photos[1].error, 'Network timeout', 'Error message should be set')

-- Test 11: Track completed count
print('\nTest 11: Track completed count')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 },
  { id = 'photo2', path = '/path/to/photo2.jpg', size = 2048000 }
}
local state = PikSendUpload.createUploadState(photos)

-- Complete first photo
state.photos[1].status = PikSendUpload.PhotoState.COMPLETED
state.completedCount = state.completedCount + 1
state.uploadedSize = state.uploadedSize + state.photos[1].size

assert_equal(state.completedCount, 1, 'Completed count should be 1')
assert_equal(state.uploadedSize, 1024000, 'Uploaded size should be 1024000')

-- Complete second photo
state.photos[2].status = PikSendUpload.PhotoState.COMPLETED
state.completedCount = state.completedCount + 1
state.uploadedSize = state.uploadedSize + state.photos[2].size

assert_equal(state.completedCount, 2, 'Completed count should be 2')
assert_equal(state.uploadedSize, 3072000, 'Uploaded size should be 3072000')

-- Test 12: Track failed count
print('\nTest 12: Track failed count')
local photos = {
  { id = 'photo1', path = '/path/to/photo1.jpg', size = 1024000 },
  { id = 'photo2', path = '/path/to/photo2.jpg', size = 2048000 }
}
local state = PikSendUpload.createUploadState(photos)

-- Fail first photo
state.photos[1].status = PikSendUpload.PhotoState.FAILED
state.failedCount = state.failedCount + 1

assert_equal(state.failedCount, 1, 'Failed count should be 1')
assert_equal(state.completedCount, 0, 'Completed count should still be 0')

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
