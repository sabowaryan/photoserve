--[[----------------------------------------------------------------------------

PikSendCache.lua
Caching and optimization for PikSend plugin

Handles:
- MD5 hash calculation for duplicate detection
- Upload cache management
- Compression utilities

------------------------------------------------------------------------------]]

local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrPrefs = import 'LrPrefs'
local LrMD5 = import 'LrMD5'

local PikSendCache = {}

--------------------------------------------------------------------------------
-- Hash Calculation
--------------------------------------------------------------------------------

-- Calculate MD5 hash of a file
-- @param filePath string - Path to file
-- @return string|nil - MD5 hash or nil on error
function PikSendCache.calculateHash(filePath)
  if not filePath or filePath == "" then
    return nil
  end
  
  if not LrFileUtils.exists(filePath) then
    return nil
  end
  
  local content = LrFileUtils.readFile(filePath)
  if content == nil then
    return nil
  end
  
  -- Empty files should still have a hash (MD5 of empty string)
  return LrMD5.digest(content)
end

--------------------------------------------------------------------------------
-- Duplicate Detection
--------------------------------------------------------------------------------

-- Get upload cache
-- @return table - Upload cache
local function getUploadCache()
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.uploadCache then
    prefs.uploadCache = {}
  end
  
  return prefs.uploadCache
end

-- Save upload cache
-- @param cache table - Upload cache to save
local function saveUploadCache(cache)
  local prefs = LrPrefs.prefsForPlugin()
  prefs.uploadCache = cache
end

-- Check if file has been uploaded before
-- @param filePath string - Path to file
-- @param galleryId string - Gallery ID
-- @return boolean, string|nil - (isDuplicate, imageId)
function PikSendCache.checkDuplicate(filePath, galleryId)
  local hash = PikSendCache.calculateHash(filePath)
  if not hash then
    return false, nil
  end
  
  local cache = getUploadCache()
  local cacheKey = galleryId .. ':' .. hash
  
  if cache[cacheKey] then
    return true, cache[cacheKey].imageId
  end
  
  return false, nil
end

-- Record uploaded file in cache
-- @param filePath string - Path to file
-- @param galleryId string - Gallery ID
-- @param imageId string - Uploaded image ID
function PikSendCache.recordUpload(filePath, galleryId, imageId)
  local hash = PikSendCache.calculateHash(filePath)
  if not hash then
    return
  end
  
  local cache = getUploadCache()
  local cacheKey = galleryId .. ':' .. hash
  
  cache[cacheKey] = {
    imageId = imageId,
    timestamp = os.time(),
  }
  
  saveUploadCache(cache)
end

-- Clear upload cache
function PikSendCache.clearUploadCache()
  local prefs = LrPrefs.prefsForPlugin()
  prefs.uploadCache = {}
end

-- Clean old cache entries (older than 30 days)
function PikSendCache.cleanOldCacheEntries()
  local cache = getUploadCache()
  local now = os.time()
  local maxAge = 30 * 24 * 60 * 60  -- 30 days in seconds
  
  local newCache = {}
  for key, entry in pairs(cache) do
    if entry.timestamp and (now - entry.timestamp) < maxAge then
      newCache[key] = entry
    end
  end
  
  saveUploadCache(newCache)
end

--------------------------------------------------------------------------------
-- Compression Utilities
--------------------------------------------------------------------------------

-- Check if image should be compressed
-- @param settings table - Export settings
-- @return boolean - true if compression needed
function PikSendCache.shouldCompress(settings)
  if not settings then
    return false
  end
  
  -- Compress if JPEG quality is less than 100
  if settings.exportFormat == 'jpeg' or settings.LR_format == 'JPEG' then
    local quality = settings.jpegQuality or settings.LR_jpeg_quality or 100
    return quality < 100
  end
  
  return false
end

-- Get compression settings
-- @param settings table - Export settings
-- @return table - Compression settings
function PikSendCache.getCompressionSettings(settings)
  local compression = {
    enabled = false,
    quality = 100,
    format = 'JPEG',
  }
  
  if not settings then
    return compression
  end
  
  compression.enabled = PikSendCache.shouldCompress(settings)
  compression.quality = settings.jpegQuality or settings.LR_jpeg_quality or 100
  compression.format = settings.exportFormat or settings.LR_format or 'JPEG'
  
  return compression
end

-- Compress photo if needed based on quality settings
-- @param photoPath string - Path to the photo file
-- @param quality number - JPEG quality setting (1-100)
-- @return string, boolean - (outputPath, wasCompressed)
--
-- This function determines if compression is needed and returns the appropriate path.
-- In Lightroom, actual compression happens during the export process via export settings.
-- This function serves as a decision utility and path manager for the compression workflow.
--
-- If quality < 100: Returns a path for the compressed version and true
-- If quality >= 100: Returns the original path and false
--
-- Note: The actual compression is handled by Lightroom's export engine when
-- processRenderedPhotos() is called with the appropriate quality settings.
function PikSendCache.compressIfNeeded(photoPath, quality)
  -- Validate inputs
  if not photoPath or photoPath == "" then
    return nil, false
  end
  
  if not quality then
    quality = 100
  end
  
  -- Ensure quality is in valid range
  if quality < 1 then
    quality = 1
  elseif quality > 100 then
    quality = 100
  end
  
  -- Check if file exists
  if not LrFileUtils.exists(photoPath) then
    return nil, false
  end
  
  -- Determine if compression is needed
  local needsCompression = quality < 100
  
  if needsCompression then
    -- Generate a path for the compressed version
    -- In practice, Lightroom's export process will create this file
    local directory = LrPathUtils.parent(photoPath)
    local filename = LrPathUtils.leafName(photoPath)
    local basename = LrPathUtils.removeExtension(filename)
    local extension = LrPathUtils.extension(photoPath)
    
    -- Create a compressed filename
    local compressedFilename = basename .. "_q" .. quality .. "." .. extension
    local compressedPath = LrPathUtils.child(directory, compressedFilename)
    
    return compressedPath, true
  else
    -- No compression needed, return original path
    return photoPath, false
  end
end

--------------------------------------------------------------------------------
-- Cache Statistics
--------------------------------------------------------------------------------

-- Get cache statistics
-- @return table - Cache stats {entryCount, totalSize}
function PikSendCache.getCacheStats()
  local cache = getUploadCache()
  
  local stats = {
    entryCount = 0,
    oldestEntry = nil,
    newestEntry = nil,
  }
  
  for key, entry in pairs(cache) do
    stats.entryCount = stats.entryCount + 1
    
    if entry.timestamp then
      if not stats.oldestEntry or entry.timestamp < stats.oldestEntry then
        stats.oldestEntry = entry.timestamp
      end
      if not stats.newestEntry or entry.timestamp > stats.newestEntry then
        stats.newestEntry = entry.timestamp
      end
    end
  end
  
  return stats
end

return PikSendCache
