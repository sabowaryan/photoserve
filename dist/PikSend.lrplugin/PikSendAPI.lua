--[[----------------------------------------------------------------------------

PikSendAPI.lua
REST API client for PikSend service

This module handles all HTTP communication with the PikSend API including:
- Authentication and token validation
- Gallery management (list, create, update)
- Image upload with multipart/form-data
- Error handling and retry logic

------------------------------------------------------------------------------]]

local LrHttp = import 'LrHttp'
local LrPathUtils = import 'LrPathUtils'
local LrFileUtils = import 'LrFileUtils'
local LrDate = import 'LrDate'

-- JSON library will be loaded from dependencies
local json = require 'json'
local PikSendErrorHandler = require 'PikSendErrorHandler'
local PikSendLogger = require 'PikSendLogger'
local PikSendUtils = require 'PikSendUtils'

local PikSendAPI = {}

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------

-- DEVELOPMENT: Change this to your local URL when testing
-- PRODUCTION: Use https://piksend.com
PikSendAPI.baseURL = 'https://piksend.com'  -- Production URL
PikSendAPI.timeout = 10  -- seconds

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Validate URL before making request (Security: Requirements 11.1, 11.6)
-- Ensures all URLs use HTTPS and are from PikSend domain
local function validateRequestUrl(url)
  if not PikSendUtils.validatePikSendUrl(url) then
    PikSendLogger.error('Security violation: Invalid URL attempted: ' .. tostring(url), 'PikSendAPI')
    error('Security error: URL must be HTTPS and from piksend.com domain')
  end
  return true
end

-- Build authorization headers
local function buildHeaders(apiToken, contentType)
  local headers = {
    { field = 'Authorization', value = 'Bearer ' .. apiToken },
  }
  
  if contentType then
    table.insert(headers, { field = 'Content-Type', value = contentType })
  end
  
  return headers
end

-- Parse JSON response safely
local function parseResponse(response)
  if not response then
    return nil, 'No response received'
  end
  
  local success, data = pcall(json.decode, response)
  if not success then
    return nil, 'Failed to parse JSON response'
  end
  
  return data, nil
end

-- Build multipart/form-data body
local function buildMultipartBody(boundary, imagePath, metadata)
  local body = {}
  
  -- Add metadata fields
  if metadata then
    for key, value in pairs(metadata) do
      if type(value) == 'string' then
        table.insert(body, '--' .. boundary)
        table.insert(body, 'Content-Disposition: form-data; name="' .. key .. '"')
        table.insert(body, '')
        table.insert(body, value)
      end
    end
  end
  
  -- Add image file
  table.insert(body, '--' .. boundary)
  local filename = LrPathUtils.leafName(imagePath)
  table.insert(body, 'Content-Disposition: form-data; name="image"; filename="' .. filename .. '"')
  table.insert(body, 'Content-Type: application/octet-stream')
  table.insert(body, '')
  
  -- Read file content
  local fileContent = LrFileUtils.readFile(imagePath)
  if fileContent then
    table.insert(body, fileContent)
  end
  
  -- End boundary
  table.insert(body, '--' .. boundary .. '--')
  
  return table.concat(body, '\r\n')
end

--------------------------------------------------------------------------------
-- Authentication API
--------------------------------------------------------------------------------

-- Validate API token
-- @param apiToken string - The API token to validate
-- @return boolean, table|nil, table|nil - (valid, user, errorInfo) 
function PikSendAPI.validateToken(apiToken)
  -- Log entry
  local logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] validateToken: entry\n', os.date('%Y-%m-%d %H:%M:%S')))
    logFile:close()
  end
  
  if not apiToken or apiToken == '' then
    local errorInfo = PikSendErrorHandler.handleValidationError('TOKEN_INVALID')
    return false, nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/plugin/auth/validate'
  
  -- Log URL
  logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] validateToken: URL=%s\n', os.date('%Y-%m-%d %H:%M:%S'), url))
    logFile:close()
  end
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  local urlValid = validateRequestUrl(url)
  
  -- Log URL validation
  logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] validateToken: URL valid=%s\n', os.date('%Y-%m-%d %H:%M:%S'), tostring(urlValid)))
    logFile:close()
  end
  
  local headers = buildHeaders(apiToken)
  
  PikSendLogger.debug('Validating token', 'PikSendAPI')
  
  -- Log before HTTP call
  logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] validateToken: calling LrHttp.post\n', os.date('%Y-%m-%d %H:%M:%S')))
    logFile:write(string.format('[%s] [DEBUG] validateToken: headers count=%d\n', os.date('%Y-%m-%d %H:%M:%S'), #headers))
    logFile:close()
  end
  
  -- Try simple POST without any optional parameters
  local response, hdrs = LrHttp.post(url, '', headers)
  
  -- Log HTTP response
  logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] validateToken: POST returned\n', os.date('%Y-%m-%d %H:%M:%S')))
    logFile:write(string.format('[%s] [DEBUG] validateToken: response=%s, hdrs=%s\n', os.date('%Y-%m-%d %H:%M:%S'), tostring(response ~= nil), tostring(hdrs ~= nil)))
    if hdrs and hdrs.status then
      logFile:write(string.format('[%s] [DEBUG] validateToken: status=%s\n', os.date('%Y-%m-%d %H:%M:%S'), tostring(hdrs.status)))
    end
    if response then
      logFile:write(string.format('[%s] [DEBUG] validateToken: response body length=%d\n', os.date('%Y-%m-%d %H:%M:%S'), #response))
      logFile:write(string.format('[%s] [DEBUG] validateToken: response body=%s\n', os.date('%Y-%m-%d %H:%M:%S'), response))
    end
    logFile:close()
  end
  
  if response then
    local data, err = parseResponse(response)
    if data and data.valid then
      PikSendLogger.info('Token validated successfully', 'PikSendAPI')
      return true, data.user, nil
    else
      -- Parse error from response
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return false, nil, errorInfo
    end
  else
    -- Network error - no response received
    logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
    if logFile then
      logFile:write(string.format('[%s] [DEBUG] validateToken: no response received\n', os.date('%Y-%m-%d %H:%M:%S')))
      logFile:close()
    end
    local errorInfo = PikSendErrorHandler.handleNetworkError('No response from server')
    return false, nil, errorInfo
  end
end

--------------------------------------------------------------------------------
-- Gallery API
--------------------------------------------------------------------------------

-- Get all galleries for the authenticated user
-- @param apiToken string - The API token
-- @return table|nil, table|nil - (galleries, errorInfo)
function PikSendAPI.getGalleries(apiToken)
  if not apiToken or apiToken == '' then
    local errorInfo = PikSendErrorHandler.handleValidationError('TOKEN_INVALID')
    return nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/galleries'
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken)
  
  PikSendLogger.debug('Fetching galleries', 'PikSendAPI')
  
  local response, hdrs = LrHttp.get(url, headers)
  
  if response then
    local data, err = parseResponse(response)
    if data and data.galleries then
      PikSendLogger.info('Fetched ' .. #data.galleries .. ' galleries', 'PikSendAPI')
      return data.galleries, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('No response from server')
    return nil, errorInfo
  end
end

-- Create a new gallery
-- @param apiToken string - The API token
-- @param galleryData table - Gallery configuration {title, description, expires_at, password, allow_downloads, allow_comments, watermark_enabled}
-- @return table|nil, table|nil - (gallery, errorInfo)
function PikSendAPI.createGallery(apiToken, galleryData)
  if not apiToken or apiToken == '' then
    local errorInfo = PikSendErrorHandler.handleValidationError('TOKEN_INVALID')
    return nil, errorInfo
  end
  
  if not galleryData or not galleryData.title then
    local errorInfo = PikSendErrorHandler.handleValidationError('TITLE_TOO_SHORT')
    return nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/plugin/galleries'
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken, 'application/json')
  
  PikSendLogger.debug('Creating gallery: ' .. galleryData.title, 'PikSendAPI')
  
  local body = json.encode(galleryData)
  local response, hdrs = LrHttp.post(url, body, headers)
  
  if response then
    local data, err = parseResponse(response)
    if data and data.success and data.gallery then
      PikSendLogger.info('Gallery created: ' .. data.gallery.id, 'PikSendAPI')
      return data.gallery, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('No response from server')
    return nil, errorInfo
  end
end

-- Update gallery settings
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @param galleryData table - Gallery configuration to update
-- @return table|nil, table|nil - (gallery, errorInfo)
function PikSendAPI.updateGallery(apiToken, galleryId, galleryData)
  if not apiToken or apiToken == '' or not galleryId then
    local errorInfo = PikSendErrorHandler.handleValidationError('GALLERY_NOT_FOUND')
    return nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/galleries/' .. galleryId
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken, 'application/json')
  
  PikSendLogger.debug('Updating gallery: ' .. galleryId, 'PikSendAPI')
  
  local body = json.encode(galleryData)
  local response, hdrs = LrHttp.post(url, body, headers, 'PUT')
  
  if response then
    local data, err = parseResponse(response)
    if data then
      PikSendLogger.info('Gallery updated: ' .. galleryId, 'PikSendAPI')
      return data, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('No response from server')
    return nil, errorInfo
  end
end

--------------------------------------------------------------------------------
-- Image Upload API
--------------------------------------------------------------------------------

-- Upload images to a gallery (batch upload)
-- This function uploads images that are already on Cloudinary
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @param images table - Array of image data {cloudinary_public_id, cloudinary_url, title, description, width, height, format, size}
-- @return table|nil, table|nil - (uploadResult, errorInfo)
function PikSendAPI.uploadImagesToGallery(apiToken, galleryId, images)
  if not apiToken or apiToken == '' or not galleryId or not images then
    local errorInfo = PikSendErrorHandler.handleValidationError('UPLOAD_FAILED', 'Missing required parameters')
    return nil, errorInfo
  end
  
  if type(images) ~= 'table' or #images == 0 then
    local errorInfo = PikSendErrorHandler.handleValidationError('UPLOAD_FAILED', 'No images provided')
    return nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/plugin/galleries/' .. galleryId .. '/images'
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken, 'application/json')
  
  PikSendLogger.debug('Uploading ' .. #images .. ' images to gallery: ' .. galleryId, 'PikSendAPI')
  
  local body = json.encode({ images = images })
  local response, hdrs = LrHttp.post(url, body, headers, 'POST', PikSendAPI.timeout)
  
  if response then
    local data, err = parseResponse(response)
    if data and data.success then
      PikSendLogger.info('Images uploaded: ' .. (data.count or 0) .. ' images', 'PikSendAPI')
      return data, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('Upload timeout or connection lost')
    return nil, errorInfo
  end
end

-- Upload a single image to Cloudinary
-- This is a helper function that uploads to Cloudinary first
-- @param imagePath string - Path to the image file
-- @param metadata table - Image metadata {title, description}
-- @return table|nil, table|nil - (cloudinaryData, errorInfo)
function PikSendAPI.uploadToCloudinary(imagePath, metadata)
  if not imagePath or not LrFileUtils.exists(imagePath) then
    local errorInfo = PikSendErrorHandler.handleValidationError('FILE_NOT_FOUND', imagePath)
    return nil, errorInfo
  end
  
  -- Check file size
  local fileSize = LrFileUtils.fileAttributes(imagePath).fileSize or 0
  local maxSize = 500 * 1024 * 1024  -- 500 MB
  if fileSize > maxSize then
    local errorInfo = PikSendErrorHandler.handleValidationError('FILE_TOO_LARGE', 
      string.format('File size: %.2f MB', fileSize / (1024 * 1024)))
    return nil, errorInfo
  end
  
  -- Get Cloudinary configuration from environment
  local cloudinaryCloudName = _PLUGIN.cloudinaryCloudName or 'dvjxn1apr'
  local cloudinaryUploadPreset = _PLUGIN.cloudinaryUploadPreset or 'piksend'
  
  local url = 'https://api.cloudinary.com/v1_1/' .. cloudinaryCloudName .. '/image/upload'
  
  PikSendLogger.debug('Uploading to Cloudinary: ' .. LrPathUtils.leafName(imagePath), 'PikSendAPI')
  
  -- Build multipart form data for Cloudinary
  local boundary = 'LrBoundary' .. tostring(LrDate.currentTime())
  local headers = {
    { field = 'Content-Type', value = 'multipart/form-data; boundary=' .. boundary }
  }
  
  -- Build form data
  local body = {}
  
  -- Add upload preset
  table.insert(body, '--' .. boundary)
  table.insert(body, 'Content-Disposition: form-data; name="upload_preset"')
  table.insert(body, '')
  table.insert(body, cloudinaryUploadPreset)
  
  -- Add folder
  table.insert(body, '--' .. boundary)
  table.insert(body, 'Content-Disposition: form-data; name="folder"')
  table.insert(body, '')
  table.insert(body, 'piksend/galleries')
  
  -- Add file
  table.insert(body, '--' .. boundary)
  local filename = LrPathUtils.leafName(imagePath)
  table.insert(body, 'Content-Disposition: form-data; name="file"; filename="' .. filename .. '"')
  table.insert(body, 'Content-Type: application/octet-stream')
  table.insert(body, '')
  
  local fileContent = LrFileUtils.readFile(imagePath)
  if fileContent then
    table.insert(body, fileContent)
  end
  
  table.insert(body, '--' .. boundary .. '--')
  
  local bodyStr = table.concat(body, '\r\n')
  
  local response, hdrs = LrHttp.post(url, bodyStr, headers, 'POST', 60)  -- 60 second timeout for uploads
  
  if response then
    local data, err = parseResponse(response)
    if data and data.public_id and data.secure_url then
      PikSendLogger.info('Uploaded to Cloudinary: ' .. data.public_id, 'PikSendAPI')
      return {
        cloudinary_public_id = data.public_id,
        cloudinary_url = data.secure_url,
        width = data.width,
        height = data.height,
        format = data.format,
        size = data.bytes,
        title = metadata and metadata.title or nil,
        description = metadata and metadata.description or nil,
      }, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('Cloudinary upload timeout')
    return nil, errorInfo
  end
end

-- Delete an image from a gallery
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @param imageId string - The image ID
-- @return boolean, table|nil - (success, errorInfo)
function PikSendAPI.deleteImage(apiToken, galleryId, imageId)
  if not apiToken or apiToken == '' or not galleryId or not imageId then
    local errorInfo = PikSendErrorHandler.handleValidationError('UPLOAD_FAILED', 'Missing required parameters')
    return false, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/galleries/' .. galleryId .. '/images/' .. imageId
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken)
  
  PikSendLogger.debug('Deleting image: ' .. imageId, 'PikSendAPI')
  
  local response, hdrs = LrHttp.post(url, '', headers, 'DELETE')
  
  if response then
    PikSendLogger.info('Image deleted: ' .. imageId, 'PikSendAPI')
    return true, nil
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('Failed to delete image')
    return false, errorInfo
  end
end

--------------------------------------------------------------------------------
-- Gallery Statistics API
--------------------------------------------------------------------------------

-- Get gallery statistics
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @return table|nil, table|nil - (stats, errorInfo)
function PikSendAPI.getGalleryStats(apiToken, galleryId)
  if not apiToken or apiToken == '' or not galleryId then
    local errorInfo = PikSendErrorHandler.handleValidationError('GALLERY_NOT_FOUND')
    return nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/galleries/' .. galleryId .. '/stats'
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  local headers = buildHeaders(apiToken)
  
  PikSendLogger.debug('Fetching gallery stats: ' .. galleryId, 'PikSendAPI')
  
  local response, hdrs = LrHttp.get(url, headers)
  
  if response then
    local data, err = parseResponse(response)
    if data then
      return data, nil
    else
      local statusCode = hdrs and hdrs.status
      local errorInfo = PikSendErrorHandler.handleAPIError(response, statusCode)
      return nil, errorInfo
    end
  else
    local errorInfo = PikSendErrorHandler.handleNetworkError('No response from server')
    return nil, errorInfo
  end
end

--------------------------------------------------------------------------------
-- Update Check API
--------------------------------------------------------------------------------

-- Check for plugin updates
-- @return table|nil - Update info {version, downloadUrl, fileSize, changelog, releaseDate, minLightroomVersion} or nil
function PikSendAPI.checkForUpdates()
  local url = PikSendAPI.baseURL .. '/api/plugin/version'
  
  -- Security: Validate URL before making request (Requirements 11.1, 11.6)
  validateRequestUrl(url)
  
  PikSendLogger.debug('Checking for plugin updates', 'PikSendAPI')
  
  local response, hdrs = LrHttp.get(url)
  
  if response then
    local data, err = parseResponse(response)
    if data then
      PikSendLogger.info('Update check completed. Latest version: ' .. (data.version or 'unknown'), 'PikSendAPI')
      return data
    end
  end
  
  PikSendLogger.warn('Failed to check for updates', 'PikSendAPI')
  return nil
end

return PikSendAPI
