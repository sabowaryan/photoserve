--[[----------------------------------------------------------------------------

PikSendCloudinaryUpload.lua
Cloudinary upload management for PikSend plugin

Handles:
- Direct upload to Cloudinary
- Batch image registration in galleries
- Progress tracking
- Error handling and retry logic

------------------------------------------------------------------------------]]

local LrTasks = import 'LrTasks'
local LrProgressScope = import 'LrProgressScope'
local LrDialogs = import 'LrDialogs'

local PikSendAPI = require 'PikSendAPI'
local PikSendAuth = require 'PikSendAuth'
local PikSendLogger = require 'PikSendLogger'
local PikSendRetry = require 'PikSendRetry'

local PikSendCloudinaryUpload = {}

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------

local MAX_BATCH_SIZE = 10  -- Upload images in batches of 10
local RETRY_ATTEMPTS = 3

--------------------------------------------------------------------------------
-- Upload Functions
--------------------------------------------------------------------------------

-- Upload a single image to Cloudinary
-- @param imagePath string - Path to the image file
-- @param metadata table - Image metadata {title, description}
-- @param progressScope object - Progress scope for UI updates
-- @return table|nil, table|nil - (cloudinaryData, errorInfo)
local function uploadSingleImage(imagePath, metadata, progressScope)
  if progressScope then
    progressScope:setCaption('Uploading to Cloudinary...')
  end
  
  -- Upload to Cloudinary with retry logic
  local cloudinaryData, errorInfo = PikSendRetry.withRetry(
    function()
      return PikSendAPI.uploadToCloudinary(imagePath, metadata)
    end,
    RETRY_ATTEMPTS,
    'Cloudinary upload'
  )
  
  if not cloudinaryData then
    PikSendLogger.error('Failed to upload to Cloudinary: ' .. (errorInfo and errorInfo.message or 'Unknown error'), 'PikSendCloudinaryUpload')
    return nil, errorInfo
  end
  
  return cloudinaryData, nil
end

-- Register images in a gallery
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @param images table - Array of Cloudinary image data
-- @param progressScope object - Progress scope for UI updates
-- @return boolean, table|nil - (success, errorInfo)
local function registerImagesInGallery(apiToken, galleryId, images, progressScope)
  if progressScope then
    progressScope:setCaption('Registering images in gallery...')
  end
  
  -- Register images with retry logic
  local result, errorInfo = PikSendRetry.withRetry(
    function()
      return PikSendAPI.uploadImagesToGallery(apiToken, galleryId, images)
    end,
    RETRY_ATTEMPTS,
    'Gallery registration'
  )
  
  if not result then
    PikSendLogger.error('Failed to register images in gallery: ' .. (errorInfo and errorInfo.message or 'Unknown error'), 'PikSendCloudinaryUpload')
    return false, errorInfo
  end
  
  return true, nil
end

--------------------------------------------------------------------------------
-- Batch Upload
--------------------------------------------------------------------------------

-- Upload multiple images to a gallery
-- @param galleryId string - The gallery ID
-- @param imagePaths table - Array of image file paths
-- @param metadata table - Optional metadata for all images {title, description}
-- @return boolean, table - (success, results {uploaded, failed, errors})
function PikSendCloudinaryUpload.uploadImagesToGallery(galleryId, imagePaths, metadata)
  if not galleryId or not imagePaths or #imagePaths == 0 then
    return false, {
      uploaded = 0,
      failed = 0,
      errors = {'No images to upload'}
    }
  end
  
  -- Get API token
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    return false, {
      uploaded = 0,
      failed = #imagePaths,
      errors = {'Authentication required'}
    }
  end
  
  local totalImages = #imagePaths
  local uploadedCount = 0
  local failedCount = 0
  local errors = {}
  
  -- Create progress scope
  local progressScope = LrProgressScope {
    title = 'Uploading images to PikSend',
    functionContext = nil,
  }
  
  progressScope:setPortionComplete(0, totalImages)
  
  -- Process images in batches
  local currentBatch = {}
  
  for i, imagePath in ipairs(imagePaths) do
    if progressScope:isCanceled() then
      PikSendLogger.info('Upload canceled by user', 'PikSendCloudinaryUpload')
      break
    end
    
    progressScope:setCaption(string.format('Processing image %d of %d', i, totalImages))
    
    -- Upload to Cloudinary
    local cloudinaryData, errorInfo = uploadSingleImage(imagePath, metadata, progressScope)
    
    if cloudinaryData then
      table.insert(currentBatch, cloudinaryData)
      
      -- Register batch when it reaches MAX_BATCH_SIZE or is the last image
      if #currentBatch >= MAX_BATCH_SIZE or i == totalImages then
        local success, batchError = registerImagesInGallery(apiToken, galleryId, currentBatch, progressScope)
        
        if success then
          uploadedCount = uploadedCount + #currentBatch
          PikSendLogger.info('Batch of ' .. #currentBatch .. ' images registered successfully', 'PikSendCloudinaryUpload')
        else
          failedCount = failedCount + #currentBatch
          table.insert(errors, 'Batch registration failed: ' .. (batchError and batchError.message or 'Unknown error'))
          PikSendLogger.error('Batch registration failed', 'PikSendCloudinaryUpload')
        end
        
        -- Clear batch
        currentBatch = {}
      end
    else
      failedCount = failedCount + 1
      table.insert(errors, 'Upload failed for ' .. imagePath .. ': ' .. (errorInfo and errorInfo.message or 'Unknown error'))
    end
    
    progressScope:setPortionComplete(i, totalImages)
  end
  
  progressScope:done()
  
  -- Show summary
  if uploadedCount > 0 then
    local message = string.format('%d image(s) uploaded successfully', uploadedCount)
    if failedCount > 0 then
      message = message .. string.format('\n%d image(s) failed', failedCount)
    end
    
    LrDialogs.message('Upload Complete', message, failedCount > 0 and 'warning' or 'info')
  else
    LrDialogs.message('Upload Failed', 'No images were uploaded successfully', 'critical')
  end
  
  return uploadedCount > 0, {
    uploaded = uploadedCount,
    failed = failedCount,
    errors = errors
  }
end

--------------------------------------------------------------------------------
-- Single Image Upload
--------------------------------------------------------------------------------

-- Upload a single image to a gallery
-- @param galleryId string - The gallery ID
-- @param imagePath string - Path to the image file
-- @param metadata table - Optional metadata {title, description}
-- @return boolean, string|nil - (success, errorMessage)
function PikSendCloudinaryUpload.uploadSingleImage(galleryId, imagePath, metadata)
  -- Get API token
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    return false, 'Authentication required'
  end
  
  -- Upload to Cloudinary
  local cloudinaryData, errorInfo = uploadSingleImage(imagePath, metadata, nil)
  
  if not cloudinaryData then
    return false, errorInfo and errorInfo.message or 'Upload to Cloudinary failed'
  end
  
  -- Register in gallery
  local success, registerError = registerImagesInGallery(apiToken, galleryId, {cloudinaryData}, nil)
  
  if not success then
    return false, registerError and registerError.message or 'Failed to register image in gallery'
  end
  
  return true, nil
end

return PikSendCloudinaryUpload
