--[[----------------------------------------------------------------------------

test_property_compression.lua
Property-based tests for PikSendCache compression functionality

Tests property-based invariants with minimum 100 iterations per property.

Property Tests:
- Property 43: Compression conditionnelle
  For ANY photo with JPEG quality < 100, compression must be applied before upload
  **Validates: Requirements 10.3**

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
    -- Empty file
    function() return "" end,
    -- Single byte
    function() return string.char(math.random(0, 255)) end,
  }
  
  local generator = contentTypes[math.random(1, #contentTypes)]
  return generator()
end

-- Generate random file path
-- @return string - Random file path
local function generateRandomFilePath()
  local pathTypes = {
    function() return "/test/photo" .. math.random(1, 10000) .. ".jpg" end,
    function() return "/gallery/image" .. math.random(1, 10000) .. ".jpeg" end,
    function() return "/uploads/file" .. math.random(1, 10000) .. ".JPG" end,
    function() return "/tmp/temp" .. math.random(1, 10000) .. ".jpg" end,
  }
  
  local generator = pathTypes[math.random(1, #pathTypes)]
  return generator()
end

-- Generate random quality value
-- @return number - Random quality (1-100)
local function generateRandomQuality()
  return math.random(1, 100)
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
print('║  Property-Based Tests: PikSendCache Compression               ║')
print('║  Feature: lightroom-plugin                                     ║')
print('╚════════════════════════════════════════════════════════════════╝')

-- Seed random number generator for reproducibility
math.randomseed(os.time())

--------------------------------------------------------------------------------
-- Property 43: Compression conditionnelle
-- **Validates: Requirements 10.3**
--
-- For ANY photo with JPEG quality < 100, compression must be applied before upload
-- For ANY photo with JPEG quality >= 100, no compression should be applied
--------------------------------------------------------------------------------

-- Property 43.1: Compression is applied when quality < 100
runPropertyTest(
  'Compression is applied when quality < 100',
  43.1,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality < 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = math.random(1, 99)  -- Quality < 100
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compression was applied
    if wasCompressed then
      return true, 'Compression applied for quality ' .. quality
    else
      return false,
             'Compression not applied for quality < 100',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.2: No compression when quality >= 100
runPropertyTest(
  'No compression when quality >= 100',
  43.2,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality >= 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = 100  -- Quality = 100
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify no compression was applied
    if not wasCompressed then
      return true, 'No compression for quality 100'
    else
      return false,
             'Compression incorrectly applied for quality >= 100',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.3: Compression decision is consistent for same quality
runPropertyTest(
  'Compression decision is consistent for same quality',
  43.3,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file and quality
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = generateRandomQuality()
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded multiple times
    local outputPath1, wasCompressed1 = PikSendCache.compressIfNeeded(filePath, quality)
    local outputPath2, wasCompressed2 = PikSendCache.compressIfNeeded(filePath, quality)
    local outputPath3, wasCompressed3 = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify consistency
    if wasCompressed1 == wasCompressed2 and wasCompressed2 == wasCompressed3 then
      return true, 'Compression decision is consistent'
    else
      return false,
             'Compression decision is inconsistent',
             'Quality: ' .. quality .. ', Results: ' .. tostring(wasCompressed1) .. ', ' .. tostring(wasCompressed2) .. ', ' .. tostring(wasCompressed3)
    end
  end
)

-- Property 43.4: Output path is valid when compression is applied
runPropertyTest(
  'Output path is valid when compression is applied',
  43.4,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality < 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = math.random(1, 99)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify output path is valid
    if outputPath and type(outputPath) == 'string' and #outputPath > 0 then
      return true, 'Output path is valid'
    else
      return false,
             'Output path is invalid',
             'Quality: ' .. quality .. ', outputPath: ' .. tostring(outputPath)
    end
  end
)

-- Property 43.5: Output path equals input path when no compression
runPropertyTest(
  'Output path equals input path when no compression',
  43.5,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality = 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = 100
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify output path equals input path
    if outputPath == filePath then
      return true, 'Output path equals input path'
    else
      return false,
             'Output path does not equal input path',
             'Input: ' .. filePath .. ', Output: ' .. tostring(outputPath)
    end
  end
)

-- Property 43.6: Compression decision matches quality threshold
runPropertyTest(
  'Compression decision matches quality threshold',
  43.6,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file and quality
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = generateRandomQuality()
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compression decision matches quality threshold
    local expectedCompression = quality < 100
    
    if wasCompressed == expectedCompression then
      return true, 'Compression decision matches threshold'
    else
      return false,
             'Compression decision does not match threshold',
             'Quality: ' .. quality .. ', Expected: ' .. tostring(expectedCompression) .. ', Got: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.7: Quality boundary test (quality = 99)
runPropertyTest(
  'Quality boundary test (quality = 99 should compress)',
  43.7,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality = 99
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = 99
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compression was applied
    if wasCompressed then
      return true, 'Compression applied for quality 99'
    else
      return false,
             'Compression not applied for quality 99',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.8: Quality boundary test (quality = 100)
runPropertyTest(
  'Quality boundary test (quality = 100 should not compress)',
  43.8,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality = 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = 100
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify no compression was applied
    if not wasCompressed then
      return true, 'No compression for quality 100'
    else
      return false,
             'Compression incorrectly applied for quality 100',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.9: Quality boundary test (quality = 1)
runPropertyTest(
  'Quality boundary test (quality = 1 should compress)',
  43.9,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality = 1
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = 1
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compression was applied
    if wasCompressed then
      return true, 'Compression applied for quality 1'
    else
      return false,
             'Compression not applied for quality 1',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.10: Edge case - invalid file path
runPropertyTest(
  'Edge case - invalid file path returns nil and false',
  43.10,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Test various invalid paths
    local invalidPaths = {
      nil,
      "",
      "/nonexistent/file.jpg",
    }
    
    local invalidPath = invalidPaths[((iteration - 1) % #invalidPaths) + 1]
    local quality = generateRandomQuality()
    
    -- Call compressIfNeeded with invalid path
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(invalidPath, quality)
    
    -- Verify returns nil and false
    if outputPath == nil and wasCompressed == false then
      return true, 'Invalid path handled correctly'
    else
      return false,
             'Invalid path not handled correctly',
             'Path: ' .. tostring(invalidPath) .. ', outputPath: ' .. tostring(outputPath) .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.11: Edge case - quality out of range (< 1)
runPropertyTest(
  'Edge case - quality < 1 is clamped to 1',
  43.11,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality < 1
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = math.random(-100, 0)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Quality < 1 should be clamped to 1, which is < 100, so compression should be applied
    if wasCompressed then
      return true, 'Quality < 1 clamped correctly and compression applied'
    else
      return false,
             'Quality < 1 not handled correctly',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.12: Edge case - quality out of range (> 100)
runPropertyTest(
  'Edge case - quality > 100 is clamped to 100',
  43.12,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality > 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = math.random(101, 200)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Quality > 100 should be clamped to 100, so no compression
    if not wasCompressed then
      return true, 'Quality > 100 clamped correctly and no compression applied'
    else
      return false,
             'Quality > 100 not handled correctly',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.13: Edge case - nil quality defaults to 100
runPropertyTest(
  'Edge case - nil quality defaults to 100 (no compression)',
  43.13,
  50,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with nil quality
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = nil
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Nil quality should default to 100, so no compression
    if not wasCompressed then
      return true, 'Nil quality defaults to 100 correctly'
    else
      return false,
             'Nil quality not handled correctly',
             'Quality: ' .. tostring(quality) .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.14: Compressed path includes quality indicator
runPropertyTest(
  'Compressed path includes quality indicator',
  43.14,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Generate random file with quality < 100
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    local quality = math.random(1, 99)
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compressed path includes quality indicator
    if wasCompressed and outputPath then
      local qualityIndicator = "_q" .. quality
      if string.find(outputPath, qualityIndicator, 1, true) then
        return true, 'Compressed path includes quality indicator'
      else
        return false,
               'Compressed path does not include quality indicator',
               'Quality: ' .. quality .. ', outputPath: ' .. outputPath
      end
    else
      return false,
             'Compression not applied or output path is nil',
             'Quality: ' .. quality .. ', wasCompressed: ' .. tostring(wasCompressed)
    end
  end
)

-- Property 43.15: Full range quality test
runPropertyTest(
  'Full range quality test (1-100)',
  43.15,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    LrFileUtils._reset()
    
    -- Test all quality values from 1 to 100
    local quality = ((iteration - 1) % 100) + 1
    
    -- Generate random file
    local content = generateRandomFileContent()
    local filePath = generateRandomFilePath()
    
    -- Create file
    LrFileUtils._setFileContent(filePath, content)
    
    -- Call compressIfNeeded
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(filePath, quality)
    
    -- Verify compression decision
    local expectedCompression = quality < 100
    
    if wasCompressed == expectedCompression then
      return true, 'Quality ' .. quality .. ' handled correctly'
    else
      return false,
             'Quality ' .. quality .. ' not handled correctly',
             'Expected: ' .. tostring(expectedCompression) .. ', Got: ' .. tostring(wasCompressed)
    end
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
