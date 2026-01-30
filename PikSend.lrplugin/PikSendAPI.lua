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

local PikSendAPI = {}

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------

PikSendAPI.baseURL = 'https://api.piksend.com'
PikSendAPI.timeout = 30  -- seconds

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

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
  if not apiToken or apiToken == '' then
    local errorInfo = PikSendErrorHandler.handleValidationError('TOKEN_INVALID')
    return false, nil, errorInfo
  end
  
  local url = PikSendAPI.baseURL .. '/api/auth/validate-token'
  local headers = buildHeaders(apiToken)
  
  PikSendLogger.debug('Validating token', 'PikSendAPI')
  
  local response, hdrs = LrHttp.get(url, headers)
  
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
-- @param galleryData table - Gallery configuration {title, description, expiresAt, password, isPublic}
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
  
  local url = PikSendAPI.baseURL .. '/api/galleries'
  local headers = buildHeaders(apiToken, 'application/json')
  
  PikSendLogger.debug('Creating gallery: ' .. galleryData.title, 'PikSendAPI')
  
  local body = json.encode(galleryData)
  local response, hdrs = LrHttp.post(url, body, headers)
  
  if response then
    local data, err = parseResponse(response)
    if data and data.id then
      PikSendLogger.info('Gallery created: ' .. data.id, 'PikSendAPI')
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

-- Upload an image to a gallery
-- @param apiToken string - The API token
-- @param galleryId string - The gallery ID
-- @param imagePath string - Path to the image file
-- @param metadata table - Image metadata {title, description, altText, keywords, exif}
-- @return table|nil, table|nil - (uploadResult, errorInfo)
function PikSendAPI.uploadImage(apiToken, galleryId, imagePath, metadata)
  if not apiToken or apiToken == '' or not galleryId or not imagePath then
    local errorInfo = PikSendErrorHandler.handleValidationError('UPLOAD_FAILED', 'Missing required parameters')
    return nil, errorInfo
  end
  
  -- Check if file exists
  if not LrFileUtils.exists(imagePath) then
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
  
  local url = PikSendAPI.baseURL .. '/api/galleries/' .. galleryId .. '/images'
  
  PikSendLogger.debug('Uploading image: ' .. LrPathUtils.leafName(imagePath), 'PikSendAPI')
  
  -- Build multipart form data
  local boundary = 'LrBoundary' .. tostring(LrDate.currentTime())
  local headers = buildHeaders(apiToken, 'multipart/form-data; boundary=' .. boundary)
  
  local body = buildMultipartBody(boundary, imagePath, metadata)
  
  local response, hdrs = LrHttp.post(url, body, headers, 'POST', PikSendAPI.timeout)
  
  if response then
    local data, err = parseResponse(response)
    if data and data.imageId then
      PikSendLogger.info('Image uploaded: ' .. data.imageId, 'PikSendAPI')
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
-- @return table|nil - Update info {available, version, downloadUrl, changelog} or nil
function PikSendAPI.checkForUpdates()
  local url = PikSendAPI.baseURL .. '/api/plugin/lightroom/version'
  
  local response, hdrs = LrHttp.get(url)
  
  if response then
    local data, err = parseResponse(response)
    return data
  end
  
  return nil
end

return PikSendAPI
