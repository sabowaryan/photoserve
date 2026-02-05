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
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

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
    properties.statusText = LOC('progressPreparing')
    properties.uploadedCount = 0
    properties.totalCount = uploadState.totalCount
    properties.uploadedSize = '0 B'
    properties.totalSize = PikSendUtils.formatFileSize(uploadState.totalSize)
    properties.speed = '0 MB/s'
    properties.timeRemaining = '--'
    properties.isPaused = false
    properties.photoStatusList = ''
    
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
          properties.statusText = LOC('progressPaused')
        elseif uploadState.isCancelled then
          properties.statusText = LOC('progressCancelled')
        else
          properties.statusText = LOC('progressUploading', {
            current = uploadState.completedCount,
            total = uploadState.totalCount
          })
        end
        
        -- Update photo status list (Requirement 6.6)
        local statusLines = {}
        for i, photo in ipairs(uploadState.photos) do
          local statusIcon = ''
          if photo.status == 'completed' then
            statusIcon = '✓'
          elseif photo.status == 'failed' then
            statusIcon = '✗'
          elseif photo.status == 'uploading' then
            statusIcon = '↑'
          else
            statusIcon = '○'
          end
          
          local photoName = photo.path:match("([^/\\]+)$") or photo.path
          local statusLine = string.format('%s %s - %s', statusIcon, photoName, photo.status)
          
          if photo.status == 'uploading' and photo.progress then
            statusLine = statusLine .. string.format(' (%d%%)', photo.progress)
          elseif photo.status == 'failed' and photo.error then
            statusLine = statusLine .. string.format(' - %s', photo.error)
          end
          
          table.insert(statusLines, statusLine)
        end
        properties.photoStatusList = table.concat(statusLines, '\n')
        
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
          title = LOC('progressTitle'),
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
          title = LOC('progressPhotos'),
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
          title = LOC('progressSize'),
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
          title = LOC('progressSpeed'),
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind('speed'),
        },
      },
      
      -- Time remaining
      f:row {
        f:static_text {
          title = LOC('progressTimeRemaining'),
          width = LrView.share('label_width'),
        },
        f:static_text {
          title = LrView.bind('timeRemaining'),
        },
      },
      
      f:spacer { height = 10 },
      
      -- Photo status details (Requirement 6.6)
      f:group_box {
        title = LOC('progressPhotoDetails'),
        fill_horizontal = 1,
        
        f:scrolled_view {
          width = 500,
          height = 150,
          
          f:column {
            bind_to_object = properties,
            
            f:static_text {
              title = LrView.bind('photoStatusList'),
              width_in_chars = 60,
            },
          },
        },
      },
      
      f:spacer { height = 10 },
      
      -- Control buttons
      f:row {
        f:push_button {
          title = LrView.bind {
            key = 'isPaused',
            transform = function(value)
              return value and LOC('progressResume') or LOC('progressPause')
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
          title = LOC('progressCancel'),
          action = function()
            if onCancel then onCancel() end
          end,
        },
      },
    }
    
    LrDialogs.presentModalDialog {
      title = LOC('progressUploadingTo'),
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
      {label = LOC('retry'), verb = 'retry'},
      {label = LOC('cancel'), verb = 'cancel'},
    } or
    {
      {label = LOC('ok'), verb = 'ok'},
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
    actionVerb or LOC('ok'),
    cancelVerb or LOC('cancel')
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

-- Create a progress bar component (reusable)
-- @param f LrView.osFactory - View factory
-- @param properties table - Property table with 'percentage' key
-- @param label string - Label for the progress bar (optional)
-- @return table - View descriptor
function PikSendUI.createProgressBar(f, properties, label)
  return f:row {
    bind_to_object = properties,
    
    f:static_text {
      title = label or LOC('progressTitle'),
      width = LrView.share('label_width'),
    },
    
    f:static_text {
      title = LrView.bind {
        key = 'percentage',
        transform = function(value)
          local pct = value or 0
          local barLength = 20
          local filled = math.floor(barLength * pct / 100)
          local empty = barLength - filled
          return string.format('[%s%s] %d%%', 
            string.rep('█', filled), 
            string.rep('░', empty), 
            pct)
        end,
      },
    },
  }
end

-- Create a photo status item component (reusable)
-- @param f LrView.osFactory - View factory
-- @param photoName string - Name of the photo
-- @param status string - Status: 'pending', 'uploading', 'completed', 'failed'
-- @param progress number - Progress percentage (optional, for uploading status)
-- @param error string - Error message (optional, for failed status)
-- @return table - View descriptor
function PikSendUI.createPhotoStatusItem(f, photoName, status, progress, error)
  local statusIcon = ''
  local statusText = status
  
  if status == 'completed' then
    statusIcon = '✓'
    statusText = LOC('publishPublished')
  elseif status == 'failed' then
    statusIcon = '✗'
    statusText = LOC('publishError')
  elseif status == 'uploading' then
    statusIcon = '↑'
    statusText = LOC('progressUploading')
  else
    statusIcon = '○'
    statusText = LOC('progressPreparing')
  end
  
  local displayText = string.format('%s %s - %s', statusIcon, photoName, statusText)
  
  if status == 'uploading' and progress then
    displayText = displayText .. string.format(' (%d%%)', progress)
  elseif status == 'failed' and error then
    displayText = displayText .. string.format(' - %s', error)
  end
  
  return f:static_text {
    title = displayText,
  }
end

-- Create authentication section for settings
-- @param f LrView.osFactory - View factory
-- @param propertyTable table - Property table
-- @return table - View descriptor
function PikSendUI.createAuthSection(f, propertyTable)
  return {
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
    title = LOC('galleryDestination'),
    
    f:row {
      f:popup_menu {
        value = LrView.bind('selectedGallery'),
        items = LrView.bind('galleries'),
        width_in_chars = 40,
      },
      
      f:push_button {
        title = LOC('galleryRefresh'),
        action = function()
          local PikSendGallery = require 'PikSendGallery'
          PikSendGallery.refreshGalleries(propertyTable)
        end,
      },
      
      f:push_button {
        title = LOC('galleryCreate'),
        action = function()
          local PikSendGallery = require 'PikSendGallery'
          PikSendGallery.showCreateGalleryDialog(propertyTable)
        end,
      },
    },
  }
end

-- Create export settings section
-- @param f LrView.osFactory - View factory
-- @param propertyTable table - Property table
-- @return table - View descriptor
function PikSendUI.createExportSettingsSection(f, propertyTable)
  return {
    title = LOC('exportSettings'),
    
    f:row {
      f:static_text {
        title = LOC('exportFormat'),
        width = LrView.share('label_width'),
      },
      f:popup_menu {
        value = LrView.bind('exportFormat'),
        items = {
          { title = LOC('exportFormatJPEG'), value = 'jpeg' },
          { title = LOC('exportFormatPNG'), value = 'png' },
          { title = LOC('exportFormatTIFF'), value = 'tiff' },
        },
      },
    },
    
    f:row {
      f:static_text {
        title = LOC('exportQuality'),
        width = LrView.share('label_width'),
      },
      f:slider {
        value = LrView.bind('jpegQuality'),
        min = 1,
        max = 100,
        width_in_chars = 20,
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
        title = LOC('exportResize'),
        value = LrView.bind('resizeEnabled'),
      },
    },
    
    f:row {
      f:static_text {
        title = LOC('exportMaxWidth'),
        width = LrView.share('label_width'),
        enabled = LrView.bind('resizeEnabled'),
      },
      f:edit_field {
        value = LrView.bind('maxWidth'),
        width_in_chars = 10,
        enabled = LrView.bind('resizeEnabled'),
      },
      f:static_text {
        title = LOC('exportPixels'),
        enabled = LrView.bind('resizeEnabled'),
      },
    },
    
    f:row {
      f:static_text {
        title = LOC('exportMaxHeight'),
        width = LrView.share('label_width'),
        enabled = LrView.bind('resizeEnabled'),
      },
      f:edit_field {
        value = LrView.bind('maxHeight'),
        width_in_chars = 10,
        enabled = LrView.bind('resizeEnabled'),
      },
      f:static_text {
        title = LOC('exportPixels'),
        enabled = LrView.bind('resizeEnabled'),
      },
    },
  }
end

return PikSendUI
