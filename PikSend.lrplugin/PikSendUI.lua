--[[----------------------------------------------------------------------------

PikSendUI.lua
UI components and dialogs for PikSend plugin

Provides:
- Reusable UI components
- Progress dialogs
- Error dialogs
- Confirmation dialogs

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrFunctionContext = import 'LrFunctionContext'
local LrBinding = import 'LrBinding'
local LrTasks = import 'LrTasks'

local PikSendUtils = require 'PikSendUtils'

local PikSendUI = {}

--------------------------------------------------------------------------------
-- Progress Dialog
--------------------------------------------------------------------------------

-- Show upload progress dialog
-- @param uploadState table - Upload state object
-- @param onPause function - Callback for pause button
-- @param onResume function - Callback for resume button
-- @param onCancel function - Callback for cancel button
function PikSendUI.showProgressDialog(uploadState, onPause, onResume, onCancel)
  LrFunctionContext.callWithContext('showProgressDialog', function(context)
    local f = LrView.osFactory()
    
    local properties = LrBinding.makePropertyTable(context)
    properties.percentage = 0
    properties.statusText = 'Préparation...'
    properties.uploadedCount = 0
    properties.totalCount = uploadState.totalCount
    properties.uploadedSize = '0 B'
    properties.totalSize = PikSendUtils.formatFileSize(uploadState.totalSize)
    properties.speed = '0 MB/s'
    properties.timeRemaining = '--'
    properties.isPaused = false
    
    -- Update progress periodically
    local updateTask = LrTasks.startAsyncTask(function()
      while not uploadState.isCancelled do
        -- Update properties from state
        properties.percentage = math.floor((uploadState.uploadedSize / uploadState.totalSize) * 100)
        properties.uploadedCount = uploadState.completedCount
        properties.uploadedSize = PikSendUtils.formatFileSize(uploadState.uploadedSize)
        properties.isPaused = uploadState.isPaused
        
        -- Calculate progress info
        local progress = require('PikSendUpload').calculateProgress(uploadState)
        properties.speed = string.format('%.2f MB/s', progress.speed)
        properties.timeRemaining = PikSendUtils.formatDurationShort(progress.timeRemaining)
        
        -- Update status text
        if uploadState.isPaused then
          properties.statusText = 'En pause'
        elseif uploadState.isCancelled then
          properties.statusText = 'Annulé'
        else
          properties.statusText = string.format('Upload en cours... %d/%d photos', 
            uploadState.completedCount, uploadState.totalCount)
        end
        
        -- Check if complete
        if uploadState.completedCount + uploadState.failedCount >= uploadState.totalCount then
          break
        end
        
        LrTasks.sleep(0.5)
      end
    end)
    
    local contents = f:column {
      bind_to_object = properties,
      spacing = f:control_spacing(),
      
      f:static_text {
        title = LrView.bind('statusText'),
        font = '<system/bold>',
      },
      
      f:spacer { height = 10 },
      
      -- Progress bar (simulated with text)
      f:row {
        f:static_text {
          title = 'Progression:',
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind {
            key = 'percentage',
            transform = function(value)
              return string.format('%d%%', value or 0)
            end,
          },
        },
      },
      
      -- Photos count
      f:row {
        f:static_text {
          title = 'Photos:',
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind {
            keys = {'uploadedCount', 'totalCount'},
            operation = function(binder, uploadedCount, totalCount)
              return string.format('%d / %d', uploadedCount or 0, totalCount or 0)
            end,
          },
        },
      },
      
      -- Size
      f:row {
        f:static_text {
          title = 'Taille:',
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind {
            keys = {'uploadedSize', 'totalSize'},
            operation = function(binder, uploadedSize, totalSize)
              return string.format('%s / %s', uploadedSize or '0 B', totalSize or '0 B')
            end,
          },
        },
      },
      
      -- Speed
      f:row {
        f:static_text {
          title = 'Vitesse:',
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind('speed'),
        },
      },
      
      -- Time remaining
      f:row {
        f:static_text {
          title = 'Temps restant:',
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind('timeRemaining'),
        },
      },
      
      f:spacer { height = 10 },
      
      -- Control buttons
      f:row {
        f:push_button {
          title = LrView.bind {
            key = 'isPaused',
            transform = function(value)
              return value and 'Reprendre' or 'Pause'
            end,
          },
          action = function()
            if properties.isPaused then
              if onResume then onResume() end
            else
              if onPause then onPause() end
            end
          end,
        },
        
        f:push_button {
          title = 'Annuler',
          action = function()
            if onCancel then onCancel() end
          end,
        },
      },
    }
    
    LrDialogs.presentModalDialog {
      title = 'Upload vers PikSend',
      contents = contents,
    }
  end)
end

--------------------------------------------------------------------------------
-- Error Dialog
--------------------------------------------------------------------------------

-- Show error dialog with retry option
-- @param title string - Dialog title
-- @param message string - Error message
-- @param canRetry boolean - Show retry button
-- @return string - 'retry' or 'cancel'
function PikSendUI.showErrorDialog(title, message, canRetry)
  local buttons = canRetry and 
    {
      {label = 'Réessayer', verb = 'retry'},
      {label = 'Annuler', verb = 'cancel'},
    } or
    {
      {label = 'OK', verb = 'ok'},
    }
  
  local result = LrDialogs.presentModalDialog {
    title = title,
    message = message,
    actionVerb = buttons[1].verb,
    cancelVerb = buttons[2] and buttons[2].verb or nil,
  }
  
  return result
end

--------------------------------------------------------------------------------
-- Confirmation Dialog
--------------------------------------------------------------------------------

-- Show confirmation dialog
-- @param title string - Dialog title
-- @param message string - Confirmation message
-- @param actionVerb string - Action button label (default 'OK')
-- @param cancelVerb string - Cancel button label (default 'Annuler')
-- @return boolean - true if confirmed
function PikSendUI.showConfirmDialog(title, message, actionVerb, cancelVerb)
  local result = LrDialogs.confirm(
    title,
    message,
    actionVerb or 'OK',
    cancelVerb or 'Annuler'
  )
  
  return result == 'ok'
end

--------------------------------------------------------------------------------
-- Info Dialog
--------------------------------------------------------------------------------

-- Show info dialog
-- @param title string - Dialog title
-- @param message string - Info message
function PikSendUI.showInfoDialog(title, message)
  LrDialogs.message(title, message, 'info')
end

--------------------------------------------------------------------------------
-- Settings Section Helpers
--------------------------------------------------------------------------------

-- Create authentication section for settings
-- @param f LrView.osFactory - View factory
-- @param propertyTable table - Property table
-- @return table - View descriptor
function PikSendUI.createAuthSection(f, propertyTable)
  return {
    title = 'Compte PikSend',
    
    f:row {
      f:static_text {
        title = LrView.bind {
          key = 'userName',
          transform = function(value, fromTable)
            if value then
              return 'Connecté en tant que: ' .. value
            else
              return 'Non connecté'
            end
          end,
        },
      },
      
      f:push_button {
        title = LrView.bind {
          key = 'userName',
          transform = function(value)
            return value and 'Déconnexion' or 'Connexion'
          end,
        },
        action = function()
          local PikSendAuth = require 'PikSendAuth'
          
          if propertyTable.userName then
            if PikSendAuth.showLogoutDialog() then
              propertyTable.userName = nil
            end
          else
            if PikSendAuth.showLoginDialog() then
              local userInfo = PikSendAuth.getUserInfo()
              if userInfo then
                propertyTable.userName = userInfo.name
              end
            end
          end
        end,
      },
    },
  }
end

-- Create gallery selection section
-- @param f LrView.osFactory - View factory
-- @param propertyTable table - Property table
-- @return table - View descriptor
function PikSendUI.createGallerySection(f, propertyTable)
  return {
    title = 'Galerie de destination',
    
    f:row {
      f:popup_menu {
        value = LrView.bind('selectedGallery'),
        items = LrView.bind('galleries'),
        width_in_chars = 40,
      },
      
      f:push_button {
        title = 'Rafraîchir',
        action = function()
          local PikSendGallery = require 'PikSendGallery'
          PikSendGallery.refreshGalleries(propertyTable)
        end,
      },
      
      f:push_button {
        title = 'Nouvelle galerie',
        action = function()
          local PikSendGallery = require 'PikSendGallery'
          PikSendGallery.showCreateGalleryDialog(propertyTable)
        end,
      },
    },
  }
end

return PikSendUI
