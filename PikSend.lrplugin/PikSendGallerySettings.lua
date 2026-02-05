--[[----------------------------------------------------------------------------

PikSendGallerySettings.lua
Advanced gallery settings management for PikSend plugin

Handles:
- Gallery settings configuration (password, expiration, watermark, visibility)
- Share link generation
- Gallery statistics retrieval and display

------------------------------------------------------------------------------]]

local LrDialogs = import 'LrDialogs'
local LrFunctionContext = import 'LrFunctionContext'
local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDate = import 'LrDate'
local LrTasks = import 'LrTasks'
local LrApplication = import 'LrApplication'

local PikSendAPI = require 'PikSendAPI'
local PikSendAuth = require 'PikSendAuth'
local PikSendLogger = require 'PikSendLogger'
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

local PikSendGallerySettings = {}

--------------------------------------------------------------------------------
-- Gallery Settings Configuration
--------------------------------------------------------------------------------

-- Configure gallery settings
-- @param galleryId string - The gallery ID to configure
-- @param currentSettings table - Current gallery settings (optional)
-- @return boolean - true if settings updated successfully
function PikSendGallerySettings.configureGallerySettings(galleryId, currentSettings)
  if not galleryId then
    LrDialogs.message(LOC('error'), LOC('galleryErrorMessage'), 'critical')
    return false
  end
  
  return LrFunctionContext.callWithContext('configureGallerySettings', function(context)
    local f = LrView.osFactory()
    
    -- Initialize properties with current settings or defaults
    local properties = LrBinding.makePropertyTable(context)
    properties.hasPassword = (currentSettings and currentSettings.password ~= nil) or false
    properties.password = currentSettings and currentSettings.password or ''
    properties.hasExpiration = (currentSettings and currentSettings.expiresAt ~= nil) or false
    properties.expirationDays = 30
    properties.isPublic = (currentSettings and currentSettings.isPublic) or true
    properties.hasWatermark = (currentSettings and currentSettings.watermark ~= nil) or false
    properties.watermarkText = currentSettings and currentSettings.watermark or ''
    
    -- Calculate expiration days if expiresAt is set
    if currentSettings and currentSettings.expiresAt then
      local expiresAt = LrDate.timeFromIsoDate(currentSettings.expiresAt)
      local now = LrDate.currentTime()
      local daysRemaining = math.ceil((expiresAt - now) / 86400)
      properties.expirationDays = math.max(1, daysRemaining)
    end
    
    local contents = f:column {
      bind_to_object = properties,
      spacing = f:control_spacing(),
      
      f:static_text {
        title = 'Paramètres de la galerie',
        font = '<system/bold>',
      },
      
      f:spacer { height = 10 },
      
      -- Visibility
      f:group_box {
        title = 'Visibilité',
        fill_horizontal = 1,
        
        f:column {
          spacing = f:control_spacing(),
          
          f:radio_button {
            title = 'Galerie publique',
            value = LrView.bind('isPublic'),
            checked_value = true,
          },
          
          f:radio_button {
            title = 'Galerie privée',
            value = LrView.bind('isPublic'),
            checked_value = false,
          },
        },
      },
      
      f:spacer { height = 10 },
      
      -- Password Protection
      f:group_box {
        title = 'Protection par mot de passe',
        fill_horizontal = 1,
        
        f:column {
          spacing = f:control_spacing(),
          
          f:checkbox {
            title = 'Protéger par mot de passe',
            value = LrView.bind('hasPassword'),
          },
          
          f:row {
            f:static_text {
              title = 'Mot de passe:',
              width = LrView.share('label_width'),
              enabled = LrView.bind('hasPassword'),
            },
            f:password_field {
              value = LrView.bind('password'),
              width_in_chars = 30,
              enabled = LrView.bind('hasPassword'),
            },
          },
        },
      },
      
      f:spacer { height = 10 },
      
      -- Expiration
      f:group_box {
        title = 'Expiration',
        fill_horizontal = 1,
        
        f:column {
          spacing = f:control_spacing(),
          
          f:checkbox {
            title = 'Définir une date d\'expiration',
            value = LrView.bind('hasExpiration'),
          },
          
          f:row {
            f:static_text {
              title = 'Expire dans:',
              width = LrView.share('label_width'),
              enabled = LrView.bind('hasExpiration'),
            },
            f:edit_field {
              value = LrView.bind('expirationDays'),
              width_in_chars = 10,
              enabled = LrView.bind('hasExpiration'),
            },
            f:static_text {
              title = 'jours',
              enabled = LrView.bind('hasExpiration'),
            },
          },
        },
      },
      
      f:spacer { height = 10 },
      
      -- Watermark
      f:group_box {
        title = 'Filigrane',
        fill_horizontal = 1,
        
        f:column {
          spacing = f:control_spacing(),
          
          f:checkbox {
            title = 'Ajouter un filigrane',
            value = LrView.bind('hasWatermark'),
          },
          
          f:row {
            f:static_text {
              title = 'Texte du filigrane:',
              width = LrView.share('label_width'),
              enabled = LrView.bind('hasWatermark'),
            },
            f:edit_field {
              value = LrView.bind('watermarkText'),
              width_in_chars = 30,
              enabled = LrView.bind('hasWatermark'),
            },
          },
        },
      },
    }
    
    local result = LrDialogs.presentModalDialog {
      title = 'Paramètres de la galerie',
      contents = contents,
      actionVerb = 'Enregistrer',
    }
    
    if result == 'ok' then
      -- Build settings data
      local settingsData = {
        isPublic = properties.isPublic,
      }
      
      -- Add password if enabled
      if properties.hasPassword and properties.password ~= '' then
        settingsData.password = properties.password
      else
        settingsData.password = nil  -- Remove password if disabled
      end
      
      -- Add expiration if enabled
      if properties.hasExpiration then
        local expirationDate = LrDate.currentTime() + (properties.expirationDays * 86400)
        settingsData.expiresAt = LrDate.timeToIsoDate(expirationDate)
      else
        settingsData.expiresAt = nil  -- Remove expiration if disabled
      end
      
      -- Add watermark if enabled
      if properties.hasWatermark and properties.watermarkText ~= '' then
        settingsData.watermark = properties.watermarkText
      else
        settingsData.watermark = nil  -- Remove watermark if disabled
      end
      
      -- Update gallery via API
      local token = PikSendAuth.getToken()
      if not token then
        LrDialogs.message(LOC('authError'), LOC('authTokenRequiredMessage'), 'critical')
        return false
      end
      
      PikSendLogger.info('Updating gallery settings: ' .. galleryId, 'PikSendGallerySettings')
      
      local gallery, errorInfo = PikSendAPI.updateGallery(token, galleryId, settingsData)
      
      if gallery then
        PikSendLogger.info('Gallery settings updated successfully', 'PikSendGallerySettings')
        LrDialogs.message(
          'Paramètres enregistrés',
          'Les paramètres de la galerie ont été mis à jour avec succès.',
          'info'
        )
        return true
      else
        local errorMsg = errorInfo and errorInfo.message or 'Erreur inconnue'
        PikSendLogger.error('Failed to update gallery settings: ' .. errorMsg, 'PikSendGallerySettings')
        LrDialogs.message(
          'Erreur',
          'Impossible de mettre à jour les paramètres: ' .. errorMsg,
          'critical'
        )
        return false
      end
    end
    
    return false
  end)
end

--------------------------------------------------------------------------------
-- Share Link Generation
--------------------------------------------------------------------------------

-- Generate share link for gallery
-- @param galleryId string - The gallery ID
-- @return string - Share URL in format https://piksend.com/g/{galleryId}
function PikSendGallerySettings.generateShareLink(galleryId)
  if not galleryId or galleryId == '' then
    PikSendLogger.error('Cannot generate share link: galleryId is empty', 'PikSendGallerySettings')
    return nil
  end
  
  local shareLink = 'https://piksend.com/g/' .. galleryId
  PikSendLogger.debug('Generated share link: ' .. shareLink, 'PikSendGallerySettings')
  
  return shareLink
end

-- Show share link dialog with copy to clipboard
-- @param galleryId string - The gallery ID
-- @param galleryTitle string - The gallery title (optional)
function PikSendGallerySettings.showShareLinkDialog(galleryId, galleryTitle)
  if not galleryId then
    LrDialogs.message(LOC('error'), LOC('galleryErrorMessage'), 'critical')
    return
  end
  
  local shareLink = PikSendGallerySettings.generateShareLink(galleryId)
  if not shareLink then
    LrDialogs.message(LOC('error'), LOC('galleryErrorMessage'), 'critical')
    return
  end
  
  LrFunctionContext.callWithContext('showShareLinkDialog', function(context)
    local f = LrView.osFactory()
    
    local title = galleryTitle and ('Lien de partage - ' .. galleryTitle) or 'Lien de partage'
    
    local contents = f:column {
      spacing = f:control_spacing(),
      
      f:static_text {
        title = 'Partagez ce lien pour donner accès à votre galerie:',
        font = '<system>',
      },
      
      f:spacer { height = 10 },
      
      f:edit_field {
        value = shareLink,
        width_in_chars = 50,
        enabled = false,
      },
      
      f:spacer { height = 10 },
      
      f:row {
        f:push_button {
          title = 'Copier dans le presse-papiers',
          action = function()
            -- Copy to clipboard using LrApplication
            LrApplication.setClipboard(shareLink)
            LrDialogs.message(LOC('success'), LOC('exportCompleteMessage'), 'info')
          end,
        },
        
        f:push_button {
          title = 'Ouvrir dans le navigateur',
          action = function()
            LrHttp.openUrlInBrowser(shareLink)
          end,
        },
      },
    }
    
    LrDialogs.presentModalDialog {
      title = title,
      contents = contents,
    }
  end)
end

--------------------------------------------------------------------------------
-- Gallery Statistics
--------------------------------------------------------------------------------

-- Fetch gallery statistics
-- @param galleryId string - The gallery ID
-- @return table|nil - Statistics {views, downloads} or nil on error
function PikSendGallerySettings.fetchGalleryStats(galleryId)
  if not galleryId or galleryId == '' then
    PikSendLogger.error('Cannot fetch stats: galleryId is empty', 'PikSendGallerySettings')
    return nil
  end
  
  local token = PikSendAuth.getToken()
  if not token then
    PikSendLogger.error('Cannot fetch stats: not authenticated', 'PikSendGallerySettings')
    return nil
  end
  
  PikSendLogger.debug('Fetching gallery stats: ' .. galleryId, 'PikSendGallerySettings')
  
  local stats, errorInfo = PikSendAPI.getGalleryStats(token, galleryId)
  
  if stats then
    PikSendLogger.info('Gallery stats fetched successfully', 'PikSendGallerySettings')
    return stats
  else
    local errorMsg = errorInfo and errorInfo.message or 'Erreur inconnue'
    PikSendLogger.error('Failed to fetch gallery stats: ' .. errorMsg, 'PikSendGallerySettings')
    return nil
  end
end

-- Show gallery statistics dialog
-- @param galleryId string - The gallery ID
-- @param galleryTitle string - The gallery title (optional)
function PikSendGallerySettings.showGalleryStatsDialog(galleryId, galleryTitle)
  if not galleryId then
    LrDialogs.message(LOC('error'), LOC('galleryErrorMessage'), 'critical')
    return
  end
  
  LrTasks.startAsyncTask(function()
    local stats = PikSendGallerySettings.fetchGalleryStats(galleryId)
    
    if not stats then
      LrDialogs.message(
        'Erreur',
        'Impossible de récupérer les statistiques de la galerie.',
        'critical'
      )
      return
    end
    
    LrFunctionContext.callWithContext('showGalleryStatsDialog', function(context)
      local f = LrView.osFactory()
      
      local title = galleryTitle and ('Statistiques - ' .. galleryTitle) or 'Statistiques de la galerie'
      
      local contents = f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = 'Statistiques de la galerie',
          font = '<system/bold>',
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:static_text {
            title = 'Vues:',
            width = LrView.share('label_width'),
          },
          f:static_text {
            title = tostring(stats.views or 0),
            font = '<system/bold>',
          },
        },
        
        f:row {
          f:static_text {
            title = 'Téléchargements:',
            width = LrView.share('label_width'),
          },
          f:static_text {
            title = tostring(stats.downloads or 0),
            font = '<system/bold>',
          },
        },
        
        f:spacer { height = 10 },
        
        f:push_button {
          title = 'Rafraîchir',
          action = function()
            -- Close and reopen to refresh
            LrDialogs.stopModalWithResult('cancel')
            PikSendGallerySettings.showGalleryStatsDialog(galleryId, galleryTitle)
          end,
        },
      }
      
      LrDialogs.presentModalDialog {
        title = title,
        contents = contents,
      }
    end)
  end)
end

return PikSendGallerySettings
