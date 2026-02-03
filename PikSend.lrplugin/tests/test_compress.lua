--[[----------------------------------------------------------------------------

test_compress.lua
Unit tests for PikSendCache compression functions

Tests:
- compressIfNeeded() function
- Compression decision logic
- Path generation for compressed files

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

describe("PikSendCache - compressIfNeeded()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should return nil for nil photo path", function()
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(nil, 85)
    assert.is_nil(outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should return nil for empty photo path", function()
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded("", 85)
    assert.is_nil(outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should return nil for non-existent file", function()
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded("/path/to/nonexistent.jpg", 85)
    assert.is_nil(outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should return original path when quality is 100", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 100)
    assert.are.equal(testPath, outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should return compressed path when quality is less than 100", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 85)
    assert.is_not_nil(outputPath)
    assert.are_not.equal(testPath, outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q85") ~= nil)
  end)
  
  it("should handle quality = 1", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 1)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q1") ~= nil)
  end)
  
  it("should handle quality = 99", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 99)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q99") ~= nil)
  end)
  
  it("should clamp quality below 1 to 1", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 0)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q1") ~= nil)
  end)
  
  it("should clamp quality above 100 to 100", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 150)
    assert.are.equal(testPath, outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should default to quality 100 when quality is nil", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, nil)
    assert.are.equal(testPath, outputPath)
    assert.is_false(wasCompressed)
  end)
  
  it("should preserve file extension in compressed path", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 80)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "%.jpg$") ~= nil)
  end)
  
  it("should preserve directory in compressed path", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/subfolder/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 75)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "^/test/subfolder/") ~= nil)
  end)
  
  it("should generate unique path for each quality level", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local path85, _ = PikSendCache.compressIfNeeded(testPath, 85)
    local path75, _ = PikSendCache.compressIfNeeded(testPath, 75)
    local path50, _ = PikSendCache.compressIfNeeded(testPath, 50)
    
    assert.are_not.equal(path85, path75)
    assert.are_not.equal(path85, path50)
    assert.are_not.equal(path75, path50)
  end)
  
  it("should handle files with multiple dots in name", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/my.photo.file.jpg"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 80)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q80%.jpg$") ~= nil)
  end)
  
  it("should handle files with no extension", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo"
    LrFileUtils._setFileContent(testPath, "test image content")
    
    local outputPath, wasCompressed = PikSendCache.compressIfNeeded(testPath, 80)
    assert.is_not_nil(outputPath)
    assert.is_true(wasCompressed)
    assert.is_true(string.find(outputPath, "_q80") ~= nil)
  end)
  
end)

-- Run the tests
print("\n=== Running Compression Tests ===\n")
