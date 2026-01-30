--[[----------------------------------------------------------------------------

PikSendPublishServiceProvider.lua
Publish Service Provider for PikSend plugin

Handles:
- Published collections management
- Photo synchronization
- Change detection
- Bidirectional sync with PikSend

This is a stub implementation. Full implementation will be done in later tasks.

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'

local PikSendAuth = require 'PikSendAuth'
local PikSendLogger = require 'PikSendLogger'

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
-- Dialog Sections
--------------------------------------------------------------------------------

-- Sections for top of dialog
function publishServiceProvider.sectionsForTopOfDialog(f, propertyTable)
  PikSendLogger.info('Publish Service dialog opened', 'PublishService')
  
  return {
    {
      title = 'PikSend Publish Service',
      
      f:static_text {
        title = 'Le Publish Service permet de synchroniser automatiquement vos collections Lightroom avec PikSend.',
        width_in_chars = 50,
      },
      
      f:spacer { height = 10 },
      
      f:static_text {
        title = 'Cette fonctionnalité sera implémentée dans les prochaines tâches.',
        font = '<system/bold>',
      },
    },
  }
end

--------------------------------------------------------------------------------
-- Collection Management
--------------------------------------------------------------------------------

-- Process rendered photos (stub)
function publishServiceProvider.processRenderedPhotos(functionContext, exportContext)
  PikSendLogger.info('Publish Service: processRenderedPhotos called (stub)', 'PublishService')
  
  LrDialogs.message(
    'Fonctionnalité à venir',
    'Le Publish Service sera implémenté dans les prochaines tâches.',
    'info'
  )
end

-- Delete photos from published collection (stub)
function publishServiceProvider.deletePhotosFromPublishedCollection(publishSettings, arrayOfPhotoIds, deletedCallback)
  PikSendLogger.info('Publish Service: deletePhotosFromPublishedCollection called (stub)', 'PublishService')
end

--------------------------------------------------------------------------------

return publishServiceProvider
