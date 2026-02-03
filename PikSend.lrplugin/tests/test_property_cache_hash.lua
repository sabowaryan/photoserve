--[[----------------------------------------------------------------------------

test_property_cache_hash.lua
Property-based tests for PikSendCache hash calculation and duplicate detection

Tests property-based invariants with minimum 100 iterations per property.

Property Tests:
- Property 44: Détection de doublons par hash
  For ANY photo, an MD5 hash must be calculated and used to detect duplicates
  **Validates: Requirements 10.4, 10.5**

------------------------------------------------------------------------------]]

-- Setup test environment
package.path = package.path .. ';../?.lua;mocks/?.lua'

-- Mock Lightroom SDK modules
_G.import = function(module)
  if module == 'LrFileUtils' then
    return require('mock_LrFileUtils')
  elseif module == 'LrPathUtils' then
    return require('mock_LrPathUtils')
  elseif module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        if not _G._testPrefs then
          _G._testPrefs = {}
        end
        return _G._testPrefs
      end
    }
  elseif module == 'LrMD5' then
    return require('mock_LrMD5')
  end
  return {}
end

local PikSendCache = require('PikSendCache')
local LrFileUtils = require('mock_LrFileUtils')

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
-- @return string - Random string
local function generateRandomString(minLen, maxLen)
  local length = math.random(minLen, maxLen)
  local result = {}
  
  for i = 1, length do
    -- Generate random byte (0-255)
    table.insert(result, string.char(math.random(0, 255)))
  end
  
  return table.concat(result)
end

-- Generate random file content
-- @return string - Random file content
local function generateRandomFileContent()
  local contentTypes = {
    -- Small files (1-100 bytes)
    function() return generateRandomString(1, 100) end,
    -- Medium files (100-1000 bytes)
    function() return generateRandomString(100, 1000) end,
    -- Large files (1KB-10KB)
    function() return generateRandomString(1024, 10240) end,
    -- Very large files (10KB-100KB)
    function() return generateRandomString(10240, 102400) end,
    -- Empty file
    function() return "" end,
    -- Single byte
    function() return string.char(math.random(0, 255)) end,
    -- Repeated pattern
    function() 
      local pattern = generateRandomString(10, 50)
      local repeats = math.random(10, 100)
      return string.rep(pattern, repeats)
    end,
  }
  
  local generator = contentTypes[math.random(1, #contentTypes)]
  return generator()
end

-- Generate random file path
-- @return string - Random file path
local function generateRandomFilePath()
  local pathTypes = {
    function() return "/test/photo" .. math.random(1, 10000) .. ".jpg" end,
    function() return "/gallery/image" .. math.random(1, 10000) .. ".png" end,
    function() return "/uploads/file" .. math.random(1, 10000) .. ".tiff" end,
    function() return "/tmp/temp" .. math.random(1, 10000) .. ".jpg" end,
  }
  
  local generator = pathTypes[math.random(1, #pathTypes)]
  return generator()
end

-- Generate random gallery ID
-- @return string - Random gallery ID
local function generateRandomGalleryId()
  local chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  local length = math.random(8, 32)
  local result = {}
  
  for i = 1, length do
    local randIndex = math.random(1, #chars)
    table.insert(result, string.sub(chars, randIndex, randIndex))
  end
  
  return 'gallery_' .. table.concat(result)
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
print('║  Property-Based Tests: PikSendCache Hash Calculation          ║')
print('║  Feature: lightroom-plugin                                     ║')
print('╚════════════════════════════════════════════════════════════════╝')

-- Seed random number generator for reproducibility
math.randomseed(os.time())

--------------------------------------------------------------------------------
-- Property 44: Détection de doublons par hash
-- **Validates: Requirements 10.4, 10.5**
--
-- For ANY photo, an MD5 hash must be calculated and used to detect duplicates
--------------------------------------------------------------------------------

-- Property 44.1: Hash calculation returns consistent results
runPropertyTest(
  'Hash calculation returns consistent results for same content',
  44.1,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file content
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    
    -- Create file with content
    LrFileUtils._setFileContent(filePath, content)
    
    -- Calculate hash multiple times
    local hash1 = PikSendCache.calculateHash(filePath)
    local hash2 = PikSendCache.calculateHash(filePath)
    local hash3 = PikSendCache.calculateHash(filePath)
    
    -- Verify all hashes are identical
    if hash1 == hash2 and hash2 == hash3 then
      return true, 'Hash calculation is consistent'
    else
      return false,
             'Hash calculation is inconsistent',
             'Hash1: ' .. tostring(hash1) .. ', Hash2: ' .. tostring(hash2) .. ', Hash3: ' .. tostring(hash3)
    end
  end
)

-- Property 44.2: Identical content produces identical hash
runPropertyTest(
  'Identical content produces identical hash',
  44.2,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file content
    local content = generateRandomFileContent()
    local filePath1 = generateRandomFilePath()
    local filePath2 = generateRandomFilePath()
    
    -- Ensure different paths
    while filePath1 == filePath2 do
      filePath2 = generateRandomFilePath()
    end
    
    -- Create two files with identical content
    LrFileUtils._setFileContent(filePath1, content)
    LrFileUtils._setFileContent(filePath2, content)
    
    -- Calculate hashes
    local hash1 = PikSendCache.calculateHash(filePath1)
    local hash2 = PikSendCache.calculateHash(filePath2)
    
    -- Verify hashes are identical
    if hash1 == hash2 then
      return true, 'Identical content produces identical hash'
    else
      return false,
             'Identical content produced different hashes',
             'Hash1: ' .. tostring(hash1) .. ', Hash2: ' .. tostring(hash2)
    end
  end
)

-- Property 44.3: Different content produces different hash
runPropertyTest(
  'Different content produces different hash',
  44.3,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate two different file contents
    local content1 = generateRandomFileContent()
    local content2 = generateRandomFileContent()
    
    -- Ensure contents are actually different
    while content1 == content2 do
      content2 = generateRandomFileContent()
    end
    
    local filePath1 = generateRandomFilePath()
    local filePath2 = generateRandomFilePath()
    
    -- Create files with different content
    LrFileUtils._setFileContent(filePath1, content1)
    LrFileUtils._setFileContent(filePath2, content2)
    
    -- Calculate hashes
    local hash1 = PikSendCache.calculateHash(filePath1)
    local hash2 = PikSendCache.calculateHash(filePath2)
    
    -- Verify hashes are different
    if hash1 ~= hash2 then
      return true, 'Different content produces different hash'
    else
      return false,
             'Different content produced identical hashes',
             'Hash1: ' .. tostring(hash1) .. ', Hash2: ' .. tostring(hash2)
    end
  end
)

-- Property 44.4: Hash is always a non-empty string for valid files
runPropertyTest(
  'Hash is always a non-empty string for valid files',
  44.4,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file content (including empty files)
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Calculate hash
    local hash = PikSendCache.calculateHash(filePath)
    
    -- Verify hash is a non-empty string
    if type(hash) == 'string' and #hash > 0 then
      return true, 'Hash is a non-empty string'
    else
      return false,
             'Hash is not a non-empty string',
             'Hash type: ' .. type(hash) .. ', Hash: ' .. tostring(hash)
    end
  end
)

-- Property 44.5: Duplicate detection works correctly
runPropertyTest(
  'Duplicate detection correctly identifies uploaded files',
  44.5,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file and gallery
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local galleryId = generateRandomGalleryId()
    local imageId = 'image_' .. math.random(1, 100000)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Check duplicate before upload (should be false)
    local isDuplicateBefore, imageIdBefore = PikSendCache.checkDuplicate(filePath, galleryId)
    
    if isDuplicateBefore then
      return false,
             'File incorrectly marked as duplicate before upload',
             'Gallery: ' .. galleryId
    end
    
    -- Record upload
    PikSendCache.recordUpload(filePath, galleryId, imageId)
    
    -- Check duplicate after upload (should be true)
    local isDuplicateAfter, imageIdAfter = PikSendCache.checkDuplicate(filePath, galleryId)
    
    if not isDuplicateAfter then
      return false,
             'File not detected as duplicate after upload',
             'Gallery: ' .. galleryId
    end
    
    if imageIdAfter ~= imageId then
      return false,
             'Incorrect image ID returned for duplicate',
             'Expected: ' .. imageId .. ', Got: ' .. tostring(imageIdAfter)
    end
    
    return true, 'Duplicate detection works correctly'
  end
)

-- Property 44.6: Duplicate detection is gallery-specific
runPropertyTest(
  'Duplicate detection is gallery-specific',
  44.6,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file and two different galleries
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local galleryId1 = generateRandomGalleryId()
    local galleryId2 = generateRandomGalleryId()
    
    -- Ensure different gallery IDs
    while galleryId1 == galleryId2 do
      galleryId2 = generateRandomGalleryId()
    end
    
    local imageId1 = 'image_' .. math.random(1, 100000)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Record upload to gallery1
    PikSendCache.recordUpload(filePath, galleryId1, imageId1)
    
    -- Check duplicate in gallery1 (should be true)
    local isDuplicate1, imageId1Retrieved = PikSendCache.checkDuplicate(filePath, galleryId1)
    
    if not isDuplicate1 then
      return false,
             'File not detected as duplicate in gallery1',
             'Gallery1: ' .. galleryId1
    end
    
    -- Check duplicate in gallery2 (should be false)
    local isDuplicate2, imageId2Retrieved = PikSendCache.checkDuplicate(filePath, galleryId2)
    
    if isDuplicate2 then
      return false,
             'File incorrectly marked as duplicate in gallery2',
             'Gallery2: ' .. galleryId2
    end
    
    return true, 'Duplicate detection is gallery-specific'
  end
)

-- Property 44.7: Hash calculation handles edge cases
runPropertyTest(
  'Hash calculation handles edge cases correctly',
  44.7,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Test various edge cases
    local edgeCases = {
      { path = nil, shouldExist = false },
      { path = "", shouldExist = false },
      { path = "/nonexistent/file.jpg", shouldExist = false },
    }
    
    local edgeCase = edgeCases[((iteration - 1) % #edgeCases) + 1]
    
    -- Calculate hash for edge case
    local hash = PikSendCache.calculateHash(edgeCase.path)
    
    -- Verify hash is nil for non-existent files
    if not edgeCase.shouldExist then
      if hash == nil then
        return true, 'Edge case handled correctly'
      else
        return false,
               'Edge case not handled correctly',
               'Path: ' .. tostring(edgeCase.path) .. ', Hash: ' .. tostring(hash)
      end
    end
    
    return true, 'Edge case handled correctly'
  end
)

-- Property 44.8: Multiple uploads to same gallery update cache correctly
runPropertyTest(
  'Multiple uploads to same gallery update cache correctly',
  44.8,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file and gallery
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local galleryId = generateRandomGalleryId()
    local imageId1 = 'image_' .. math.random(1, 100000)
    local imageId2 = 'image_' .. math.random(100001, 200000)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Record first upload
    PikSendCache.recordUpload(filePath, galleryId, imageId1)
    
    -- Check duplicate (should return imageId1)
    local isDuplicate1, retrievedId1 = PikSendCache.checkDuplicate(filePath, galleryId)
    
    if not isDuplicate1 or retrievedId1 ~= imageId1 then
      return false,
             'First upload not recorded correctly',
             'Expected: ' .. imageId1 .. ', Got: ' .. tostring(retrievedId1)
    end
    
    -- Record second upload (update)
    PikSendCache.recordUpload(filePath, galleryId, imageId2)
    
    -- Check duplicate (should return imageId2)
    local isDuplicate2, retrievedId2 = PikSendCache.checkDuplicate(filePath, galleryId)
    
    if not isDuplicate2 or retrievedId2 ~= imageId2 then
      return false,
             'Second upload not recorded correctly',
             'Expected: ' .. imageId2 .. ', Got: ' .. tostring(retrievedId2)
    end
    
    return true, 'Multiple uploads update cache correctly'
  end
)

-- Property 44.9: Cache persists across function calls
runPropertyTest(
  'Cache persists across function calls',
  44.9,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate multiple files and galleries
    local numFiles = math.random(3, 10)
    local files = {}
    
    for i = 1, numFiles do
      local content = generateRandomFileContent()
      local filePath = generateRandomFilePath()
      local galleryId = generateRandomGalleryId()
      local imageId = 'image_' .. i
      
      LrFileUtils._setFileContent(filePath, content)
      PikSendCache.recordUpload(filePath, galleryId, imageId)
      
      table.insert(files, {
        path = filePath,
        gallery = galleryId,
        imageId = imageId
      })
    end
    
    -- Verify all files are still in cache
    for i, file in ipairs(files) do
      local isDuplicate, imageId = PikSendCache.checkDuplicate(file.path, file.gallery)
      
      if not isDuplicate or imageId ~= file.imageId then
        return false,
               'Cache did not persist for file ' .. i,
               'Expected: ' .. file.imageId .. ', Got: ' .. tostring(imageId)
      end
    end
    
    return true, 'Cache persists across function calls'
  end
)

-- Property 44.10: Clear cache removes all entries
runPropertyTest(
  'Clear cache removes all entries',
  44.10,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate multiple files and record uploads
    local numFiles = math.random(3, 10)
    local files = {}
    
    for i = 1, numFiles do
      local content = generateRandomFileContent()
      local filePath = generateRandomFilePath()
      local galleryId = generateRandomGalleryId()
      local imageId = 'image_' .. i
      
      LrFileUtils._setFileContent(filePath, content)
      PikSendCache.recordUpload(filePath, galleryId, imageId)
      
      table.insert(files, {
        path = filePath,
        gallery = galleryId
      })
    end
    
    -- Clear cache
    PikSendCache.clearUploadCache()
    
    -- Verify all files are no longer in cache
    for i, file in ipairs(files) do
      local isDuplicate, imageId = PikSendCache.checkDuplicate(file.path, file.gallery)
      
      if isDuplicate then
        return false,
               'Cache not cleared for file ' .. i,
               'File still marked as duplicate'
      end
    end
    
    return true, 'Clear cache removes all entries'
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
