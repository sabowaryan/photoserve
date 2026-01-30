--[[----------------------------------------------------------------------------

test_cache.lua
Unit tests for PikSendCache module

Tests:
- calculateHash() function
- Basic cache operations

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

describe("PikSendCache - calculateHash()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should return nil for non-existent file", function()
    local hash = PikSendCache.calculateHash("/path/to/nonexistent.jpg")
    assert.is_nil(hash)
  end)
  
  it("should return nil for empty file path", function()
    local hash = PikSendCache.calculateHash("")
    assert.is_nil(hash)
  end)
  
  it("should return nil for nil file path", function()
    local hash = PikSendCache.calculateHash(nil)
    assert.is_nil(hash)
  end)
  
  it("should calculate hash for existing file", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    local testContent = "test image content"
    
    -- Create a mock file
    LrFileUtils._setFileContent(testPath, testContent)
    
    local hash = PikSendCache.calculateHash(testPath)
    assert.is_not_nil(hash)
    assert.is_string(hash)
    assert.is_true(#hash > 0)
  end)
  
  it("should return same hash for same file content", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath1 = "/test/photo1.jpg"
    local testPath2 = "/test/photo2.jpg"
    local testContent = "identical content"
    
    -- Create two files with identical content
    LrFileUtils._setFileContent(testPath1, testContent)
    LrFileUtils._setFileContent(testPath2, testContent)
    
    local hash1 = PikSendCache.calculateHash(testPath1)
    local hash2 = PikSendCache.calculateHash(testPath2)
    
    assert.are.equal(hash1, hash2)
  end)
  
  it("should return different hash for different file content", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath1 = "/test/photo1.jpg"
    local testPath2 = "/test/photo2.jpg"
    
    -- Create two files with different content
    LrFileUtils._setFileContent(testPath1, "content A")
    LrFileUtils._setFileContent(testPath2, "content B")
    
    local hash1 = PikSendCache.calculateHash(testPath1)
    local hash2 = PikSendCache.calculateHash(testPath2)
    
    assert.are_not.equal(hash1, hash2)
  end)
  
  it("should handle large file content", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/large_photo.jpg"
    
    -- Create a large content string (simulate 1MB file)
    local largeContent = string.rep("x", 1024 * 1024)
    LrFileUtils._setFileContent(testPath, largeContent)
    
    local hash = PikSendCache.calculateHash(testPath)
    assert.is_not_nil(hash)
    assert.is_string(hash)
  end)
  
  it("should handle binary content", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/binary.jpg"
    
    -- Create binary-like content with null bytes
    local binaryContent = "\x00\x01\x02\xFF\xFE\xFD"
    LrFileUtils._setFileContent(testPath, binaryContent)
    
    local hash = PikSendCache.calculateHash(testPath)
    assert.is_not_nil(hash)
    assert.is_string(hash)
  end)
  
end)

describe("PikSendCache - checkDuplicate()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should return false for new file", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test content")
    
    local isDuplicate, imageId = PikSendCache.checkDuplicate(testPath, "gallery123")
    assert.is_false(isDuplicate)
    assert.is_nil(imageId)
  end)
  
  it("should return true for previously uploaded file", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test content")
    
    -- Record the upload
    PikSendCache.recordUpload(testPath, "gallery123", "image456")
    
    -- Check for duplicate
    local isDuplicate, imageId = PikSendCache.checkDuplicate(testPath, "gallery123")
    assert.is_true(isDuplicate)
    assert.are.equal("image456", imageId)
  end)
  
  it("should be gallery-specific", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test content")
    
    -- Record upload to gallery1
    PikSendCache.recordUpload(testPath, "gallery1", "image1")
    
    -- Check in gallery1 - should be duplicate
    local isDuplicate1, imageId1 = PikSendCache.checkDuplicate(testPath, "gallery1")
    assert.is_true(isDuplicate1)
    assert.are.equal("image1", imageId1)
    
    -- Check in gallery2 - should not be duplicate
    local isDuplicate2, imageId2 = PikSendCache.checkDuplicate(testPath, "gallery2")
    assert.is_false(isDuplicate2)
    assert.is_nil(imageId2)
  end)
  
  it("should handle non-existent file", function()
    local isDuplicate, imageId = PikSendCache.checkDuplicate("/nonexistent.jpg", "gallery123")
    assert.is_false(isDuplicate)
    assert.is_nil(imageId)
  end)
  
end)

describe("PikSendCache - recordUpload()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should record upload successfully", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test content")
    
    -- Record upload
    PikSendCache.recordUpload(testPath, "gallery123", "image456")
    
    -- Verify it was recorded
    local isDuplicate, imageId = PikSendCache.checkDuplicate(testPath, "gallery123")
    assert.is_true(isDuplicate)
    assert.are.equal("image456", imageId)
  end)
  
  it("should handle non-existent file gracefully", function()
    -- Should not error when recording non-existent file
    assert.has_no.errors(function()
      PikSendCache.recordUpload("/nonexistent.jpg", "gallery123", "image456")
    end)
  end)
  
  it("should update existing entry", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath = "/test/photo.jpg"
    LrFileUtils._setFileContent(testPath, "test content")
    
    -- Record first upload
    PikSendCache.recordUpload(testPath, "gallery123", "image1")
    
    -- Record second upload (update)
    PikSendCache.recordUpload(testPath, "gallery123", "image2")
    
    -- Verify latest imageId is stored
    local isDuplicate, imageId = PikSendCache.checkDuplicate(testPath, "gallery123")
    assert.is_true(isDuplicate)
    assert.are.equal("image2", imageId)
  end)
  
end)

describe("PikSendCache - clearUploadCache()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should clear all cache entries", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath1 = "/test/photo1.jpg"
    local testPath2 = "/test/photo2.jpg"
    LrFileUtils._setFileContent(testPath1, "content 1")
    LrFileUtils._setFileContent(testPath2, "content 2")
    
    -- Record uploads
    PikSendCache.recordUpload(testPath1, "gallery1", "image1")
    PikSendCache.recordUpload(testPath2, "gallery2", "image2")
    
    -- Clear cache
    PikSendCache.clearUploadCache()
    
    -- Verify cache is empty
    local isDuplicate1 = PikSendCache.checkDuplicate(testPath1, "gallery1")
    local isDuplicate2 = PikSendCache.checkDuplicate(testPath2, "gallery2")
    assert.is_false(isDuplicate1)
    assert.is_false(isDuplicate2)
  end)
  
end)

describe("PikSendCache - shouldCompress()", function()
  
  it("should return false for nil settings", function()
    local result = PikSendCache.shouldCompress(nil)
    assert.is_false(result)
  end)
  
  it("should return false for empty settings", function()
    local result = PikSendCache.shouldCompress({})
    assert.is_false(result)
  end)
  
  it("should return true for JPEG with quality < 100", function()
    local settings = {
      exportFormat = 'jpeg',
      jpegQuality = 85
    }
    local result = PikSendCache.shouldCompress(settings)
    assert.is_true(result)
  end)
  
  it("should return false for JPEG with quality = 100", function()
    local settings = {
      exportFormat = 'jpeg',
      jpegQuality = 100
    }
    local result = PikSendCache.shouldCompress(settings)
    assert.is_false(result)
  end)
  
  it("should return false for PNG format", function()
    local settings = {
      exportFormat = 'png',
      jpegQuality = 85
    }
    local result = PikSendCache.shouldCompress(settings)
    assert.is_false(result)
  end)
  
  it("should handle Lightroom format names", function()
    local settings = {
      LR_format = 'JPEG',
      LR_jpeg_quality = 80
    }
    local result = PikSendCache.shouldCompress(settings)
    assert.is_true(result)
  end)
  
end)

describe("PikSendCache - getCacheStats()", function()
  
  before_each(function()
    -- Reset test preferences
    _G._testPrefs = {}
    
    -- Reset mock file system
    local LrFileUtils = require('mock_LrFileUtils')
    LrFileUtils._reset()
  end)
  
  it("should return zero count for empty cache", function()
    local stats = PikSendCache.getCacheStats()
    assert.are.equal(0, stats.entryCount)
    assert.is_nil(stats.oldestEntry)
    assert.is_nil(stats.newestEntry)
  end)
  
  it("should count cache entries", function()
    local LrFileUtils = require('mock_LrFileUtils')
    local testPath1 = "/test/photo1.jpg"
    local testPath2 = "/test/photo2.jpg"
    LrFileUtils._setFileContent(testPath1, "content 1")
    LrFileUtils._setFileContent(testPath2, "content 2")
    
    -- Record uploads
    PikSendCache.recordUpload(testPath1, "gallery1", "image1")
    PikSendCache.recordUpload(testPath2, "gallery2", "image2")
    
    local stats = PikSendCache.getCacheStats()
    assert.are.equal(2, stats.entryCount)
    assert.is_not_nil(stats.oldestEntry)
    assert.is_not_nil(stats.newestEntry)
  end)
  
end)
