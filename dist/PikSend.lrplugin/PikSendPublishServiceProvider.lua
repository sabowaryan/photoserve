--[[----------------------------------------------------------------------------

PikSendPublishServiceProvider.lua
Publish Service Provider for PikSend plugin

Handles:
- Published collections management
- Photo synchronization
- Change detection
- Bidirectional sync with PikSend

Requirements: 7.1-7.10 (Synchronisation et Publish Service)
Properties: 30, 31, 32, 33, 54

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'
local LrFunctionContext = import 'LrFunctionContext'
local LrTasks = import 'LrTasks'
local LrApplication = import 'LrApplication'
local LrPrefs = import 'LrPrefs'

local PikSendAuth = require 'PikSendAuth'
local PikSendLogger = require 'PikSendLogger'
local PikSendAPI = require 'PikSendAPI'
local PikSendGallery = require 'PikSendGallery'
local PikSendCache = require 'PikSendCache'
local PikSendMetadata = require 'PikSendMetadata'
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

--------------------------------------------------------------------------------
-- Service Provider Definition
--------------------------------------------------------------------------------

local publishServiceProvider = {}

-- Plugin name
publishServiceProvider.supportsIncrementalPublish = 'only'

-- Allow file formats
publishServiceProvider.allowFileFormats = {'JPEG', 'PNG', 'TIFF'}

-- Allow color spaces
publishServiceProvider.allowColorSpaces = {'sRGB', 'AdobeRGB'}

-- Hide sections we don't need
publishServiceProvider.hideSections = {'exportLocation'}

-- Can export video
publishServiceProvider.canExportVideo = false

--------------------------------------------------------------------------------
-- Published Collection Management
--------------------------------------------------------------------------------

-- Store collection settings in preferences
-- @param collectionInfo table - Collection info from Lightroom
-- @param galleryId string - PikSend gallery ID
local function storeCollectionSettings(collectionInfo, galleryId)
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.publishedCollections then
    prefs.publishedCollections = {}
  end
  
  local localId = collectionInfo.localCollectionId
  
  prefs.publishedCollections[localId] = {
    galleryId = galleryId,
    name = collectionInfo.name,
    createdAt = os.time(),
    lastSync = nil,
  }
  
  PikSendLogger.info('Stored collection settings: ' .. localId .. ' -> ' .. galleryId, 'PublishService')
end

-- Get collection settings from preferences
-- @param collectionInfo table - Collection info from Lightroom
-- @return table|nil - Collection settings or nil
local function getCollectionSettings(collectionInfo)
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.publishedCollections then
    return nil
  end
  
  local localId = collectionInfo.localCollectionId
  return prefs.publishedCollections[localId]
end

-- Update last sync time for collection
-- @param collectionInfo table - Collection info from Lightroom
local function updateLastSync(collectionInfo)
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.publishedCollections then
    return
  end
  
  local localId = collectionInfo.localCollectionId
  
  if prefs.publishedCollections[localId] then
    prefs.publishedCollections[localId].lastSync = os.time()
  end
end

-- Get gallery ID for published collection
-- @param publishSettings table - Publish settings
-- @return string|nil - Gallery ID or nil
local function getGalleryIdForCollection(publishSettings)
  if publishSettings and publishSettings.galleryId then
    return publishSettings.galleryId
  end
  return nil
end

--------------------------------------------------------------------------------
-- Dialog Sections
--------------------------------------------------------------------------------

-- Sections for top of dialog
function publishServiceProvider.sectionsForTopOfDialog(f, propertyTable)
  PikSendLogger.info('Publish Service dialog opened', 'PublishService')
  
  -- Initialize property table
  if not propertyTable.userName then
    local prefs = LrPrefs.prefsForPlugin()
    propertyTable.userName = prefs.userName
  end
  
  return {
    {
      title = LOC('authAccountSection'),
      
      f:row {
        f:static_text {
          title = LrView.bind {
            key = 'userName',
            transform = function(value, fromTable)
              if value then
                return LOC('authConnected', { name = value })
              else
                return LOC('authNotConnected')
              end
            end,
          },
        },
        
        f:push_button {
          title = LrView.bind {
            key = 'userName',
            transform = function(value)
              return value and LOC('authLogout') or LOC('authLogin')
            end,
          },
          action = function()
            if propertyTable.userName then
              PikSendAuth.clearToken()
              propertyTable.userName = nil
            else
              if PikSendAuth.showLoginDialog() then
                local prefs = LrPrefs.prefsForPlugin()
                propertyTable.userName = prefs.userName
              end
            end
          end,
        },
      },
    },
    
    {
      title = LOC('galleryPikSend'),
      
      f:static_text {
        title = LOC('gallerySyncDescription'),
        width_in_chars = 50,
      },
      
      f:spacer { height = 10 },
      
      f:row {
        f:popup_menu {
          value = LrView.bind('galleryId'),
          items = LrView.bind('galleries'),
          width_in_chars = 40,
        },
        
        f:push_button {
          title = LOC('galleryRefresh'),
          action = function()
            PikSendGallery.refreshGalleries(propertyTable)
          end,
        },
        
        f:push_button {
          title = LOC('galleryCreate'),
          action = function()
            if PikSendGallery.showCreateGalleryDialog(propertyTable) then
              PikSendGallery.refreshGalleries(propertyTable)
            end
          end,
        },
      },
    },
  }
end

-- Called when a new published collection is created
function publishServiceProvider.startDialog(propertyTable)
  PikSendLogger.info('Starting publish service dialog', 'PublishService')
  
  -- Initialize galleries list
  PikSendGallery.refreshGalleries(propertyTable)
end

-- Called when dialog is about to close
function publishServiceProvider.endDialog(propertyTable)
  PikSendLogger.info('Ending publish service dialog', 'PublishService')
end

--------------------------------------------------------------------------------
-- Change Detection
--------------------------------------------------------------------------------

-- Store photo metadata for change detection
-- @param photo LrPhoto - Lightroom photo object
-- @param remoteId string - Remote photo ID
local function storePhotoMetadata(photo, remoteId)
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.photoMetadata then
    prefs.photoMetadata = {}
  end
  
  local photoId = photo:getRawMetadata('uuid')
  
  -- Calculate hash of photo content
  local photoPath = photo:getRawMetadata('path')
  local contentHash = PikSendCache.calculateHash(photoPath)
  
  -- Store metadata snapshot
  prefs.photoMetadata[photoId] = {
    remoteId = remoteId,
    contentHash = contentHash,
    title = photo:getFormattedMetadata('title'),
    caption = photo:getFormattedMetadata('caption'),
    keywords = table.concat(photo:getRawMetadata('keywords') or {}, ','),
    copyright = photo:getFormattedMetadata('copyright'),
    lastModified = photo:getRawMetadata('lastEditTime'),
    lastChecked = os.time(),
  }
  
  PikSendLogger.debug('Stored metadata for photo: ' .. photoId, 'PublishService')
end

-- Get stored photo metadata
-- @param photo LrPhoto - Lightroom photo object
-- @return table|nil - Stored metadata or nil
local function getStoredPhotoMetadata(photo)
  local prefs = LrPrefs.prefsForPlugin()
  
  if not prefs.photoMetadata then
    return nil
  end
  
  local photoId = photo:getRawMetadata('uuid')
  return prefs.photoMetadata[photoId]
end

-- Check if photo has been modified
-- @param photo LrPhoto - Lightroom photo object
-- @return boolean, string - (isModified, reason)
local function hasPhotoBeenModified(photo)
  local stored = getStoredPhotoMetadata(photo)
  
  if not stored then
    -- No stored metadata means it's new
    return true, 'new'
  end
  
  -- Check content hash
  local photoPath = photo:getRawMetadata('path')
  local currentHash = PikSendCache.calculateHash(photoPath)
  
  if currentHash ~= stored.contentHash then
    return true, 'content_changed'
  end
  
  -- Check metadata changes
  local currentTitle = photo:getFormattedMetadata('title') or ''
  local currentCaption = photo:getFormattedMetadata('caption') or ''
  local currentKeywords = table.concat(photo:getRawMetadata('keywords') or {}, ',')
  local currentCopyright = photo:getFormattedMetadata('copyright') or ''
  
  if currentTitle ~= (stored.title or '') then
    return true, 'title_changed'
  end
  
  if currentCaption ~= (stored.caption or '') then
    return true, 'caption_changed'
  end
  
  if currentKeywords ~= (stored.keywords or '') then
    return true, 'keywords_changed'
  end
  
  if currentCopyright ~= (stored.copyright or '') then
    return true, 'copyright_changed'
  end
  
  -- Check edit time
  local currentEditTime = photo:getRawMetadata('lastEditTime')
  if currentEditTime and stored.lastModified and currentEditTime > stored.lastModified then
    return true, 'edited'
  end
  
  return false, 'unchanged'
end

--------------------------------------------------------------------------------
-- Collection Management
--------------------------------------------------------------------------------

-- Process rendered photos for publishing
function publishServiceProvider.processRenderedPhotos(functionContext, exportContext)
  local exportSession = exportContext.exportSession
  local publishSettings = exportContext.propertyTable
  
  PikSendLogger.info('Publish Service: processRenderedPhotos started', 'PublishService')
  
  -- Get API token
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    LrDialogs.message(LOC('authError'), LOC('authTokenRequiredMessage'), 'critical')
    return
  end
  
  -- Get gallery ID
  local galleryId = getGalleryIdForCollection(publishSettings)
  if not galleryId then
    LrDialogs.message(LOC('galleryRequired'), LOC('galleryRequiredMessage'), 'critical')
    return
  end
  
  local nPhotos = exportSession:countRenditions()
  local progressScope = exportContext:configureProgress {
    title = LOC('progressPublishingTo'),
  }
  
  PikSendLogger.info('Publishing ' .. nPhotos .. ' photos to gallery: ' .. galleryId, 'PublishService')
  
  -- Process each photo
  for i, rendition in exportContext:renditions() do
    local photo = rendition.photo
    
    -- Check if photo needs to be published
    local isModified, reason = hasPhotoBeenModified(photo)
    
    if isModified then
      PikSendLogger.debug('Photo needs publishing: ' .. reason, 'PublishService')
      
      -- Wait for photo to be rendered
      local success, pathOrMessage = rendition:waitForRender()
      
      if success then
        progressScope:setPortionComplete(i - 1, nPhotos)
        progressScope:setCaption(LOC('progressUploading', { current = i, total = nPhotos }))
        
        -- Extract metadata
        local metadata = PikSendMetadata.extractMetadata(photo, publishSettings)
        
        -- Upload photo
        local result, errorInfo = PikSendAPI.uploadImage(apiToken, galleryId, pathOrMessage, metadata)
        
        if result and result.imageId then
          -- Record successful publish
          rendition:recordPublishedPhotoId(result.imageId)
          rendition:recordPublishedPhotoUrl(result.url)
          
          -- Store metadata for change detection
          storePhotoMetadata(photo, result.imageId)
          
          PikSendLogger.info('Photo published: ' .. result.imageId, 'PublishService')
        else
          -- Record error
          local errorMsg = errorInfo and errorInfo.message or 'Échec de l\'upload'
          rendition:recordPublishError(errorMsg)
          PikSendLogger.error('Failed to publish photo: ' .. errorMsg, 'PublishService')
        end
        
        -- Clean up temporary file
        local LrFileUtils = import 'LrFileUtils'
        LrFileUtils.delete(pathOrMessage)
      else
        -- Render failed
        rendition:recordPublishError(pathOrMessage)
        PikSendLogger.error('Failed to render photo: ' .. pathOrMessage, 'PublishService')
      end
    else
      -- Photo hasn't changed, skip
      PikSendLogger.debug('Photo unchanged, skipping', 'PublishService')
      rendition:skipRender()
    end
  end
  
  progressScope:done()
  PikSendLogger.info('Publish Service: processRenderedPhotos completed', 'PublishService')
end

-- Delete photos from published collection
function publishServiceProvider.deletePhotosFromPublishedCollection(publishSettings, arrayOfPhotoIds, deletedCallback)
  PikSendLogger.info('Publish Service: deletePhotosFromPublishedCollection called', 'PublishService')
  
  -- Get API token
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    PikSendLogger.error('Not authenticated, cannot delete photos', 'PublishService')
    return
  end
  
  -- Get gallery ID
  local galleryId = getGalleryIdForCollection(publishSettings)
  if not galleryId then
    PikSendLogger.error('No gallery ID found, cannot delete photos', 'PublishService')
    return
  end
  
  PikSendLogger.info('Deleting ' .. #arrayOfPhotoIds .. ' photos from gallery: ' .. galleryId, 'PublishService')
  
  -- Delete each photo
  for _, photoId in ipairs(arrayOfPhotoIds) do
    local success, errorInfo = PikSendAPI.deleteImage(apiToken, galleryId, photoId)
    
    if success then
      PikSendLogger.info('Photo deleted: ' .. photoId, 'PublishService')
      deletedCallback(photoId)
    else
      local errorMsg = errorInfo and errorInfo.message or 'Failed to delete photo'
      PikSendLogger.error('Failed to delete photo ' .. photoId .. ': ' .. errorMsg, 'PublishService')
    end
  end
  
  PikSendLogger.info('Publish Service: deletePhotosFromPublishedCollection completed', 'PublishService')
end

--------------------------------------------------------------------------------
-- Conflict Management
--------------------------------------------------------------------------------

-- Check for conflicts between local and remote
-- This function is called by Lightroom to detect if photos have been deleted remotely
function publishServiceProvider.shouldReverseDeletePhotosFromPublishedCollection(publishSettings, arrayOfPhotoIds)
  -- For now, we don't automatically delete local photos when they're deleted remotely
  -- Return false to keep local photos
  return false
end

-- Handle conflicts when syncing
-- @param publishSettings table - Publish settings
-- @return table - Array of conflicts {photoId, localState, remoteState}
local function detectConflicts(publishSettings)
  local conflicts = {}
  
  -- Get gallery ID
  local galleryId = getGalleryIdForCollection(publishSettings)
  if not galleryId then
    return conflicts
  end
  
  -- Get API token
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    return conflicts
  end
  
  -- TODO: Implement conflict detection by comparing local and remote states
  -- This would require an API endpoint to list all photos in a gallery
  -- For now, we rely on the change detection mechanism
  
  return conflicts
end

-- Resolve conflicts
-- @param conflicts table - Array of conflicts
-- @param resolution string - Resolution strategy ('keep_local', 'keep_remote', 'ask_user')
local function resolveConflicts(conflicts, resolution)
  if #conflicts == 0 then
    return
  end
  
  PikSendLogger.info('Resolving ' .. #conflicts .. ' conflicts with strategy: ' .. resolution, 'PublishService')
  
  for _, conflict in ipairs(conflicts) do
    if resolution == 'keep_local' then
      -- Re-upload local version
      PikSendLogger.debug('Keeping local version for: ' .. conflict.photoId, 'PublishService')
    elseif resolution == 'keep_remote' then
      -- Download remote version (not implemented)
      PikSendLogger.debug('Keeping remote version for: ' .. conflict.photoId, 'PublishService')
    elseif resolution == 'ask_user' then
      -- Show dialog to user
      local result = LrDialogs.confirm(
        'Conflit détecté',
        'La photo a été modifiée localement et à distance. Quelle version souhaitez-vous conserver?',
        'Version locale',
        'Version distante'
      )
      
      if result == 'ok' then
        -- Keep local
        PikSendLogger.debug('User chose local version for: ' .. conflict.photoId, 'PublishService')
      else
        -- Keep remote
        PikSendLogger.debug('User chose remote version for: ' .. conflict.photoId, 'PublishService')
      end
    end
  end
end

--------------------------------------------------------------------------------

return publishServiceProvider
