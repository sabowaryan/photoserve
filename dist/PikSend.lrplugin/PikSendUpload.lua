--[[----------------------------------------------------------------------------

PikSendUpload.lua
Upload management for PikSend plugin

Handles:
- Parallel upload management
- Progress tracking
- Pause/resume/cancel functionality
- Retry logic with exponential backoff

------------------------------------------------------------------------------]]

local LrTasks = import 'LrTasks'
local LrFileUtils = import 'LrFileUtils'
local LrDate = import 'LrDate'

local PikSendAPI = require 'PikSendAPI'
local PikSendRetry = require 'PikSendRetry'

local PikSendUpload = {}

--------------------------------------------------------------------------------
-- Constants
--------------------------------------------------------------------------------

local DEFAULT_MAX_CONCURRENT = 3

--------------------------------------------------------------------------------
-- Upload State Management
--------------------------------------------------------------------------------

-- Photo upload states
PikSendUpload.PhotoState = {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

-- Create new upload state
-- @param photos table - Array of photo data
-- @return table - Upload state object
function PikSendUpload.createUploadState(photos)
  local state = {
    photos = {},
    totalCount = #photos,
    completedCount = 0,
    failedCount = 0,
    totalSize = 0,
    uploadedSize = 0,
    startTime = LrDate.currentTime(),
    isPaused = false,
    isCancelled = false,
    activeUploads = 0,
  }
  
  -- Initialize photo states
  for i, photo in ipairs(photos) do
    state.photos[i] = {
      photoId = photo.id,
      path = photo.path,
      size = photo.size or 0,
      status = PikSendUpload.PhotoState.PENDING,
      progress = 0,
      error = nil,
      retryCount = 0,
    }
    state.totalSize = state.totalSize + (photo.size or 0)
  end
  
  return state
end

--------------------------------------------------------------------------------
-- Progress Calculation
--------------------------------------------------------------------------------

-- Calculate upload progress
-- @param state table - Upload state
-- @return table - Progress info {percentage, speed, timeRemaining}
function PikSendUpload.calculateProgress(state)
  local progress = {
    percentage = 0,
    speed = 0,  -- MB/s
    timeRemaining = 0,  -- seconds
  }
  
  if state.totalSize > 0 then
    progress.percentage = (state.uploadedSize / state.totalSize) * 100
  end
  
  local elapsed = LrDate.currentTime() - state.startTime
  if elapsed > 0 and state.uploadedSize > 0 then
    -- Calculate speed in MB/s
    progress.speed = (state.uploadedSize / (1024 * 1024)) / elapsed
    
    -- Calculate time remaining
    local remaining = state.totalSize - state.uploadedSize
    if progress.speed > 0 then
      progress.timeRemaining = remaining / (progress.speed * 1024 * 1024)
    end
  end
  
  return progress
end

--------------------------------------------------------------------------------
-- Upload Control
--------------------------------------------------------------------------------

-- Pause upload
-- @param state table - Upload state
function PikSendUpload.pause(state)
  state.isPaused = true
end

-- Resume upload
-- @param state table - Upload state
function PikSendUpload.resume(state)
  state.isPaused = false
end

-- Cancel upload and clean up temporary files
-- @param state table - Upload state
function PikSendUpload.cancel(state)
  state.isCancelled = true
  state.isPaused = true
  
  -- Clean up temporary files for all photos
  PikSendUpload.cleanupTempFiles(state)
end

-- Check if upload should continue
-- @param state table - Upload state
-- @return boolean - true if should continue
local function shouldContinue(state)
  return not state.isPaused and not state.isCancelled
end

--------------------------------------------------------------------------------
-- Upload Execution
--------------------------------------------------------------------------------

-- Upload single photo
-- @param apiToken string - API token
-- @param galleryId string - Gallery ID
-- @param photoState table - Photo state object
-- @param metadata table - Photo metadata
-- @return boolean - true on success
local function uploadPhoto(apiToken, galleryId, photoState, metadata)
  photoState.status = PikSendUpload.PhotoState.UPLOADING
  
  local success, result = PikSendRetry.executeWithRetry(function()
    return PikSendAPI.uploadImage(apiToken, galleryId, photoState.path, metadata)
  end, {
    maxAttempts = PikSendRetry.MAX_RETRY_ATTEMPTS,
    context = 'uploadImage:' .. (photoState.photoId or 'unknown'),
    onRetry = function(attempt, delay, error)
      photoState.retryCount = attempt + 1
    end
  })
  
  if success and result then
    photoState.status = PikSendUpload.PhotoState.COMPLETED
    photoState.progress = 100
    photoState.imageId = result.imageId
    return true
  else
    photoState.status = PikSendUpload.PhotoState.FAILED
    photoState.error = 'Upload failed after ' .. (PikSendRetry.MAX_RETRY_ATTEMPTS + 1) .. ' attempts: ' .. tostring(result)
    return false
  end
end

-- Upload photos in parallel
-- @param apiToken string - API token
-- @param galleryId string - Gallery ID
-- @param state table - Upload state
-- @param metadataExtractor function - Function to extract metadata from photo
-- @param progressCallback function - Progress update callback
-- @param maxConcurrent number - Maximum concurrent uploads (optional)
function PikSendUpload.uploadPhotosParallel(apiToken, galleryId, state, metadataExtractor, progressCallback, maxConcurrent)
  maxConcurrent = maxConcurrent or DEFAULT_MAX_CONCURRENT
  
  -- Validate max concurrent
  if maxConcurrent < 1 or maxConcurrent > 5 then
    maxConcurrent = DEFAULT_MAX_CONCURRENT
  end
  
  local photoIndex = 1
  local activeTasks = {}
  
  -- Process photos
  while photoIndex <= #state.photos or #activeTasks > 0 do
    -- Check if should continue
    if not shouldContinue(state) then
      break
    end
    
    -- Start new uploads if slots available
    while #activeTasks < maxConcurrent and photoIndex <= #state.photos do
      if not shouldContinue(state) then
        break
      end
      
      local photoState = state.photos[photoIndex]
      photoIndex = photoIndex + 1
      
      -- Skip already completed or failed photos
      if photoState.status == PikSendUpload.PhotoState.PENDING then
        state.activeUploads = state.activeUploads + 1
        
        -- Start upload task
        local task = LrTasks.startAsyncTask(function()
          local metadata = metadataExtractor and metadataExtractor(photoState) or {}
          local success = uploadPhoto(apiToken, galleryId, photoState, metadata)
          
          -- Update state
          state.activeUploads = state.activeUploads - 1
          
          if success then
            state.completedCount = state.completedCount + 1
            state.uploadedSize = state.uploadedSize + photoState.size
          else
            state.failedCount = state.failedCount + 1
          end
          
          -- Call progress callback
          if progressCallback then
            progressCallback(state)
          end
        end)
        
        table.insert(activeTasks, task)
      end
    end
    
    -- Wait a bit before checking again
    LrTasks.sleep(0.1)
    
    -- Remove completed tasks
    local newActiveTasks = {}
    for _, task in ipairs(activeTasks) do
      if not task:isDone() then
        table.insert(newActiveTasks, task)
      end
    end
    activeTasks = newActiveTasks
  end
  
  -- Wait for all active tasks to complete
  for _, task in ipairs(activeTasks) do
    task:waitForCompletion()
  end
end

--------------------------------------------------------------------------------
-- Cleanup
--------------------------------------------------------------------------------

-- Clean up temporary files
-- @param state table - Upload state
-- @param onlyCompleted boolean - If true, only clean completed uploads (default: false)
function PikSendUpload.cleanupTempFiles(state, onlyCompleted)
  onlyCompleted = onlyCompleted or false
  
  for _, photoState in ipairs(state.photos) do
    -- Clean completed photos, or all photos if not onlyCompleted
    local shouldClean = (onlyCompleted and photoState.status == PikSendUpload.PhotoState.COMPLETED) or not onlyCompleted
    
    if shouldClean and photoState.path then
      -- Only delete if it's a temporary file
      if string.find(photoState.path, 'temp', 1, true) or string.find(photoState.path, 'tmp', 1, true) then
        pcall(function()
          LrFileUtils.delete(photoState.path)
        end)
      end
    end
  end
end

return PikSendUpload
