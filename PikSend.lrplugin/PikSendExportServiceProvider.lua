--[[----------------------------------------------------------------------------

PikSendExportServiceProvider.lua
Export Service Provider for PikSend plugin

Handles:
- Export dialog configuration
- Photo rendering and export
- Upload to PikSend galleries
- Progress tracking

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'
local LrTasks = import 'LrTasks'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrPrefs = import 'LrPrefs'

local PikSendAPI = require 'PikSendAPI'
local PikSendAuth = require 'PikSendAuth'
local PikSendGallery = require 'PikSendGallery'
local PikSendUpload = require 'PikSendUpload'
local PikSendMetadata = require 'PikSendMetadata'
local PikSendLogger = require 'PikSendLogger'
local PikSendUI = require 'PikSendUI'

--------------------------------------------------------------------------------
-- Service Provider Definition
--------------------------------------------------------------------------------

local exportServiceProvider = {}

-- Plugin name
exportServiceProvider.exportPresetFields = {
  { key = 'selectedGallery', default = nil },
  { key = 'exportFormat', default = 'jpeg' },
  { key = 'jpegQuality', default = 90 },
  { key = 'includeMetadata', default = true },
  { key = 'includeGPS', default = false },
}

-- Allow file formats
exportServiceProvider.allowFileFormats = {'JPEG', 'PNG', 'TIFF'}

-- Allow color spaces
exportServiceProvider.allowColorSpaces = {'sRGB', 'AdobeRGB'}

-- Hide sections we don't need
exportServiceProvider.hideSections = {'exportLocation'}

-- Can export video
exportServiceProvider.canExportVideo = false

--------------------------------------------------------------------------------
-- Dialog Sections
--------------------------------------------------------------------------------

-- Sections for top of dialog
function exportServiceProvider.sectionsForTopOfDialog(f, propertyTable)
  -- Initialize property table
  if not propertyTable.galleries then
    propertyTable.galleries = {}
  end
  
  -- Load user info if authenticated
  if PikSendAuth.isAuthenticated() then
    local userInfo = PikSendAuth.getUserInfo()
    if userInfo then
      propertyTable.userName = userInfo.name
    end
    
    -- Load galleries
    PikSendGallery.refreshGalleries(propertyTable)
  end
  
  return {
    -- Authentication section
    PikSendUI.createAuthSection(f, propertyTable),
    
    -- Gallery selection section
    PikSendUI.createGallerySection(f, propertyTable),
    
    -- Export settings section
    {
      title = 'Paramètres d\'export',
      
      f:row {
        f:static_text {
          title = 'Format:',
          width = LrView.share('label_width'),
        },
        f:popup_menu {
          value = LrView.bind('exportFormat'),
          items = {
            { title = 'JPEG', value = 'jpeg' },
            { title = 'PNG', value = 'png' },
            { title = 'TIFF', value = 'tiff' },
          },
        },
      },
      
      f:row {
        f:static_text {
          title = 'Qualité JPEG:',
          width = LrView.share('label_width'),
        },
        f:slider {
          value = LrView.bind('jpegQuality'),
          min = 1,
          max = 100,
          width_in_digits = 3,
        },
        f:static_text {
          title = LrView.bind {
            key = 'jpegQuality',
            transform = function(value)
              return tostring(value or 90)
            end,
          },
        },
      },
      
      f:row {
        f:checkbox {
          title = 'Inclure les métadonnées',
          value = LrView.bind('includeMetadata'),
        },
      },
      
      f:row {
        f:checkbox {
          title = 'Inclure la géolocalisation (GPS)',
          value = LrView.bind('includeGPS'),
          enabled = LrView.bind('includeMetadata'),
        },
      },
    },
  }
end

--------------------------------------------------------------------------------
-- Export Process
--------------------------------------------------------------------------------

-- Process rendered photos
function exportServiceProvider.processRenderedPhotos(functionContext, exportContext)
  local exportSession = exportContext.exportSession
  local exportSettings = exportContext.propertyTable
  
  PikSendLogger.info('Starting export process', 'ExportService')
  
  -- Ensure authenticated
  if not PikSendAuth.ensureAuthenticated() then
    LrDialogs.message(
      'Authentification requise',
      'Veuillez vous connecter à votre compte PikSend pour continuer.',
      'critical'
    )
    return
  end
  
  local apiToken = PikSendAuth.getToken()
  
  -- Check gallery selection
  local galleryId = exportSettings.selectedGallery
  if not galleryId then
    LrDialogs.message(
      'Galerie requise',
      'Veuillez sélectionner ou créer une galerie de destination.',
      'critical'
    )
    return
  end
  
  PikSendLogger.info('Exporting to gallery: ' .. galleryId, 'ExportService')
  
  -- Get number of photos
  local nPhotos = exportSession:countRenditions()
  
  -- Configure progress
  local progressScope = exportContext:configureProgress {
    title = 'Upload vers PikSend',
  }
  
  -- Process each photo
  local successCount = 0
  local failCount = 0
  
  for i, rendition in exportContext:renditions() do
    -- Check for cancellation
    if progressScope:isCanceled() then
      break
    end
    
    -- Update progress
    progressScope:setPortionComplete(i - 1, nPhotos)
    progressScope:setCaption(string.format('Upload %d sur %d', i, nPhotos))
    
    -- Wait for render
    local success, pathOrMessage = rendition:waitForRender()
    
    if success then
      local photo = rendition.photo
      
      -- Extract metadata
      local metadata = nil
      if exportSettings.includeMetadata then
        local metadataSettings = {
          metadata = {
            includeTitle = true,
            includeDescription = true,
            includeKeywords = true,
            includeCopyright = true,
            includeExif = true,
            includeGPS = exportSettings.includeGPS,
          },
        }
        metadata = PikSendMetadata.extractMetadata(photo, metadataSettings)
        metadata = PikSendMetadata.formatForAPI(metadata)
      end
      
      -- Upload photo
      PikSendLogger.debug('Uploading photo: ' .. pathOrMessage, 'ExportService')
      local result = PikSendAPI.uploadImage(apiToken, galleryId, pathOrMessage, metadata)
      
      if result and result.imageId then
        -- Success
        successCount = successCount + 1
        rendition:recordPublishedPhotoId(result.imageId)
        PikSendLogger.info('Photo uploaded successfully: ' .. result.imageId, 'ExportService')
      else
        -- Failure
        failCount = failCount + 1
        rendition:recordPublishError('Échec de l\'upload')
        PikSendLogger.error('Failed to upload photo: ' .. pathOrMessage, 'ExportService')
      end
      
      -- Clean up temporary file
      if LrFileUtils.exists(pathOrMessage) then
        LrFileUtils.delete(pathOrMessage)
      end
    else
      -- Render failed
      failCount = failCount + 1
      PikSendLogger.error('Failed to render photo: ' .. pathOrMessage, 'ExportService')
    end
  end
  
  -- Complete progress
  progressScope:done()
  
  -- Show completion message
  local gallery = PikSendGallery.getGalleryById(galleryId)
  local galleryUrl = PikSendGallery.generateShareLink(galleryId)
  
  if failCount == 0 then
    LrDialogs.message(
      'Export terminé',
      string.format('%d photo(s) uploadée(s) avec succès vers la galerie "%s".\n\nLien: %s',
        successCount, gallery and gallery.title or 'Unknown', galleryUrl),
      'info'
    )
  else
    LrDialogs.message(
      'Export terminé avec erreurs',
      string.format('%d photo(s) uploadée(s), %d échec(s).\n\nLien: %s',
        successCount, failCount, galleryUrl),
      'warning'
    )
  end
  
  PikSendLogger.info(string.format('Export complete: %d success, %d failed', successCount, failCount), 'ExportService')
end

--------------------------------------------------------------------------------

return exportServiceProvider
