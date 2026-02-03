--[[----------------------------------------------------------------------------

test_compress_simple.lua
Simple unit tests for PikSendCache compression functions (no busted required)

Tests:
- compressIfNeeded() function
- Compression decision logic

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

-- Simple test framework
local tests_passed = 0
local tests_failed = 0

local function test(name, func)
  local success, err = pcall(func)
  if success then
    tests_passed = tests_passed + 1
    print("  ✓ " .. name)
  else
    tests_failed = tests_failed + 1
    print("  ✗ " .. name)
    print("    Error: " .. tostring(err))
  end
end

local function assert_nil(value, message)
  if value ~= nil then
    error(message or "Expected nil, got " .. tostring(value))
  end
end

local function assert_not_nil(value, message)
  if value == nil then
    error(message or "Expected non-nil value")
  end
end

local function assert_equal(expected, actual, message)
  if expected ~= actual then
    error(message or string.format("Expected %s, got %s", tostring(expected), tostring(actual)))
  end
end

local function assert_not_equal(expected, actual, message)
  if expected == actual then
    error(message or string.format("Expected values to be different, but both are %s", tostring(expected)))
  end
end

local function assert_true(value, message)
  if value ~= true then
    error(message or "Expected true, got " .. tostring(value))
  end
end

local function assert_false(value, message)
  if value ~= false then
    error(message or "Expected false, got " .. tostring(value))
  end
end

local function assert_contains(str, substring, message)
  if not string.find(str, substring, 1, true) then
    error(message or string.format("Expected '%s' to contain '%s'", str, substring))
  end
end

-- Load module
local PikSendCache = require('PikSendCache')
local LrFileUtils = require('mock_LrFileUtils')

print("\n=== Testing PikSendCache.compressIfNeeded() ===\n")

-- Reset before tests
_G._testPrefs = {}
LrFileUtils._reset()

test("should return nil for nil photo path", function()
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(nil, 85)
  assert_nil(outputPath)
  assert_false(wasCompressed)
end)

test("should return nil for empty photo path", function()
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded("", 85)
  assert_nil(outputPath)
  assert_false(wasCompressed)
end)

test("should return nil for non-existent file", function()
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded("/path/to/nonexistent.jpg", 85)
  assert_nil(outputPath)
  assert_false(wasCompressed)
end)

test("should return original path when quality is 100", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 100)
  assert_equal(testPath, outputPath)
  assert_false(wasCompressed)
end)

test("should return compressed path when quality is less than 100", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 85)
  assert_not_nil(outputPath)
  assert_not_equal(testPath, outputPath)
  assert_true(wasCompressed)
  assert_contains(outputPath, "_q85")
end)

test("should handle quality = 1", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 1)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  assert_contains(outputPath, "_q1")
end)

test("should handle quality = 99", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 99)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  assert_contains(outputPath, "_q99")
end)

test("should clamp quality below 1 to 1", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 0)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  assert_contains(outputPath, "_q1")
end)

test("should clamp quality above 100 to 100", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 150)
  assert_equal(testPath, outputPath)
  assert_false(wasCompressed)
end)

test("should default to quality 100 when quality is nil", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, nil)
  assert_equal(testPath, outputPath)
  assert_false(wasCompressed)
end)

test("should preserve file extension in compressed path", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 80)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  -- Check that it ends with .jpg
  assert_true(string.match(outputPath, "%.jpg$") ~= nil, "Path should end with .jpg")
end)

test("should preserve directory in compressed path", function()
  local testPath = "/test/subfolder/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 75)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  -- Check that it starts with the directory
  assert_true(string.match(outputPath, "^/test/subfolder/") ~= nil, "Path should start with /test/subfolder/")
end)

test("should generate unique path for each quality level", function()
  local testPath = "/test/photo.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local path85, _ = PikSendCache.compressIfNeeded(testPath, 85)
  local path75, _ = PikSendCache.compressIfNeeded(testPath, 75)
  local path50, _ = PikSendCache.compressIfNeeded(testPath, 50)
  
  assert_not_equal(path85, path75)
  assert_not_equal(path85, path50)
  assert_not_equal(path75, path50)
end)

test("should handle files with multiple dots in name", function()
  local testPath = "/test/my.photo.file.jpg"
  LrFileUtils._setFileContent(testPath, "test image content")
  
  local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 80)
  assert_not_nil(outputPath)
  assert_true(wasCompressed)
  assert_contains(outputPath, "_q80")
end)

-- Print summary
print("\n=== Test Summary ===")
print(string.format("Passed: %d", tests_passed))
print(string.format("Failed: %d", tests_failed))
print(string.format("Total:  %d", tests_passed + tests_failed))

if tests_failed == 0 then
  print("\n✓ All tests passed!")
  os.exit(0)
else
  print("\n✗ Some tests failed")
  os.exit(1)
end
