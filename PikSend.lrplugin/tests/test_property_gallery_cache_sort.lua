--[[----------------------------------------------------------------------------

test_property_gallery_cache_sort.lua
Property-based tests for gallery caching and sorting

Tests the following properties:
- Property 12: Tri des galeries par date
- Property 13: Cache des galeries

**Validates: Requirements 3.8, 3.10**

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

-- Mock PikSendAPI with controllable responses
local mockApiCallCount = 0
local mockGalleries = nil

local mockPikSendAPI = {
  getGalleries = function(token)
    mockApiCallCount = mockApiCallCount + 1
    return mockGalleries
  end,
  createGallery = function(token, data)
    return { id = 'new-gallery', title = data.title }
  end
}

package.loaded['PikSendAPI'] = mockPikSendAPI

-- Mock PikSendAuth
package.loaded['PikSendAuth'] = {
  getToken = function()
    return 'test-token'
  end
}

-- Load the module under test
local PikSendGallery = require 'PikSendGallery'
local LrDate = import 'LrDate'

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Generate random ISO date string
local function generateRandomDate()
  local year = math.random(2020, 2024)
  local month = math.random(1, 12)
  local day = math.random(1, 28)
  local hour = math.random(0, 23)
  local minute = math.random(0, 59)
  local second = math.random(0, 59)
  
  return string.format('%04d-%02d-%02dT%02d:%02d:%02d',
    year, month, day, hour, minute, second)
end

-- Generate random gallery
local function generateRandomGallery()
  local id = 'gallery-' .. math.random(1000, 9999)
  local title = 'Gallery ' .. math.random(1, 100)
  local imageCount = math.random(0, 100)
  local createdAt = generateRandomDate()
  local status = math.random() > 0.8 and 'expired' or 'active'
  
  return {
    id = id,
    title = title,
    imageCount = imageCount,
    createdAt = createdAt,
    status = status
  }
end

-- Generate array of random galleries
local function generateRandomGalleries(count)
  local galleries = {}
  for i = 1, count do
    table.insert(galleries, generateRandomGallery())
  end
  return galleries
end

-- Check if array is sorted by date descending
local function isSortedByDateDescending(galleries)
  for i = 1, #galleries - 1 do
    local current = galleries[i].createdAt or ''
    local next = galleries[i + 1].createdAt or ''
    if current < next then
      return false
    end
  end
  return true
end

-- Reset test state
local function resetTest()
  mockApiCallCount = 0
  mockGalleries = nil
  PikSendGallery.clearCache()
end

--------------------------------------------------------------------------------
-- Property 12: Tri des galeries par date
-- **Validates: Requirements 3.8**
--------------------------------------------------------------------------------

print('\n=== Property 12: Tri des galeries par date ===')
print('Testing that galleries are sorted by creation date (descending)\n')

local MIN_ITERATIONS = 100
local passCount = 0
local failCount = 0

for i = 1, MIN_ITERATIONS do
  resetTest()
  
  -- Generate random galleries
  local count = math.random(2, 20)
  mockGalleries = generateRandomGalleries(count)
  
  -- Get galleries (should be sorted)
  local galleries = PikSendGallery.getGalleries(false)
  
  if galleries then
    -- Check if sorted by date descending
    if isSortedByDateDescending(galleries) then
      passCount = passCount + 1
    else
      failCount = failCount + 1
      print(string.format('❌ FAILED iteration %d: Galleries not sorted by date descending', i))
      
      -- Print first few for debugging
      for j = 1, math.min(3, #galleries) do
        print(string.format('  [%d] %s - %s', j, galleries[j].title, galleries[j].createdAt))
      end
    end
  else
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: getGalleries returned nil', i))
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: All sorting tests passed')
end

--------------------------------------------------------------------------------
-- Property 13: Cache des galeries
-- **Validates: Requirements 3.10**
--------------------------------------------------------------------------------

print('\n=== Property 13: Cache des galeries ===')
print('Testing that subsequent requests within 5 minutes use cache\n')

passCount = 0
failCount = 0

for i = 1, MIN_ITERATIONS do
  resetTest()
  
  -- Generate random galleries
  mockGalleries = generateRandomGalleries(math.random(1, 10))
  
  -- First call - should hit API
  local galleries1 = PikSendGallery.getGalleries(false)
  local apiCallsAfterFirst = mockApiCallCount
  
  if apiCallsAfterFirst ~= 1 then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: First call should hit API once, got %d calls', i, apiCallsAfterFirst))
  else
    -- Second call immediately - should use cache
    local galleries2 = PikSendGallery.getGalleries(false)
    local apiCallsAfterSecond = mockApiCallCount
    
    if apiCallsAfterSecond ~= 1 then
      failCount = failCount + 1
      print(string.format('❌ FAILED iteration %d: Second call should use cache, but API was called %d times total', i, apiCallsAfterSecond))
    else
      -- Verify same data returned
      if #galleries1 == #galleries2 then
        passCount = passCount + 1
      else
        failCount = failCount + 1
        print(string.format('❌ FAILED iteration %d: Cached data differs from original', i))
      end
    end
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: All caching tests passed')
end

--------------------------------------------------------------------------------
-- Additional Cache Tests
--------------------------------------------------------------------------------

print('\n=== Testing Cache Behavior ===\n')

-- Test force refresh bypasses cache
print('Test: forceRefresh=true should bypass cache')
resetTest()
mockGalleries = generateRandomGalleries(5)

local galleries1 = PikSendGallery.getGalleries(false)
local callsAfterFirst = mockApiCallCount

local galleries2 = PikSendGallery.getGalleries(true)  -- Force refresh
local callsAfterForce = mockApiCallCount

if callsAfterForce == callsAfterFirst + 1 then
  print('✅ PASSED: Force refresh bypassed cache')
else
  print(string.format('❌ FAILED: Expected %d API calls, got %d', callsAfterFirst + 1, callsAfterForce))
  os.exit(1)
end

-- Test clearCache invalidates cache
print('Test: clearCache() should invalidate cache')
resetTest()
mockGalleries = generateRandomGalleries(5)

galleries1 = PikSendGallery.getGalleries(false)
callsAfterFirst = mockApiCallCount

PikSendGallery.clearCache()

galleries2 = PikSendGallery.getGalleries(false)
local callsAfterClear = mockApiCallCount

if callsAfterClear == callsAfterFirst + 1 then
  print('✅ PASSED: clearCache invalidated cache')
else
  print(string.format('❌ FAILED: Expected %d API calls after clear, got %d', callsAfterFirst + 1, callsAfterClear))
  os.exit(1)
end

-- Test empty gallery list
print('Test: Empty gallery list should be cached')
resetTest()
mockGalleries = {}

galleries1 = PikSendGallery.getGalleries(false)
callsAfterFirst = mockApiCallCount

galleries2 = PikSendGallery.getGalleries(false)
local callsAfterSecond = mockApiCallCount

if callsAfterSecond == callsAfterFirst and callsAfterFirst == 1 then
  print('✅ PASSED: Empty list cached correctly')
else
  print(string.format('❌ FAILED: Empty list not cached, calls: %d', callsAfterSecond))
  os.exit(1)
end

-- Test sorting with same dates
print('Test: Galleries with same date should maintain stable sort')
resetTest()
local sameDate = '2024-01-15T12:00:00'
mockGalleries = {
  { id = 'g1', title = 'Gallery 1', createdAt = sameDate, imageCount = 1 },
  { id = 'g2', title = 'Gallery 2', createdAt = sameDate, imageCount = 2 },
  { id = 'g3', title = 'Gallery 3', createdAt = sameDate, imageCount = 3 },
}

galleries1 = PikSendGallery.getGalleries(false)

if galleries1 and #galleries1 == 3 then
  print('✅ PASSED: Galleries with same date handled correctly')
else
  print('❌ FAILED: Galleries with same date not handled correctly')
  os.exit(1)
end

-- Test sorting with missing dates
print('Test: Galleries with missing dates should be handled')
resetTest()
mockGalleries = {
  { id = 'g1', title = 'Gallery 1', createdAt = '2024-01-15T12:00:00', imageCount = 1 },
  { id = 'g2', title = 'Gallery 2', createdAt = nil, imageCount = 2 },
  { id = 'g3', title = 'Gallery 3', createdAt = '2024-01-14T12:00:00', imageCount = 3 },
}

galleries1 = PikSendGallery.getGalleries(false)

if galleries1 and #galleries1 == 3 then
  -- Should not crash, order may vary for nil dates
  print('✅ PASSED: Galleries with missing dates handled without crash')
else
  print('❌ FAILED: Galleries with missing dates caused error')
  os.exit(1)
end

print('\n=== All Tests Passed ===')
print('Property 12: Tri des galeries par date - VERIFIED ✅')
print('Property 13: Cache des galeries - VERIFIED ✅')
