--[[----------------------------------------------------------------------------

PikSendUpdater.lua
Plugin update checker for PikSend Lightroom Plugin

This module handles:
- Checking for available plugin updates
- Comparing version numbers
- Notifying users of new versions
- Providing download links

------------------------------------------------------------------------------]]

local LrPrefs = import 'LrPrefs'
local LrDate = import 'LrDate'
local LrDialogs = import 'LrDialogs'
local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrFunctionContext = import 'LrFunctionContext'
local LrHttp = import 'LrHttp'

local PikSendAPI = require 'PikSendAPI'
local PikSendLogger = require 'PikSendLogger'
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

local PikSendUpdater = {}

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Get current plugin version from Info.lua
local function getCurrentVersion()
  local Info = require 'Info'
  return Info.VERSION
end

-- Convert version table to string (e.g., "1.0.0")
local function versionToString(version)
  if not version then
    return "0.0.0"
  end
  
  local major = version.major or 0
  local minor = version.minor or 0
  local revision = version.revision or 0
  
  return string.format("%d.%d.%d", major, minor, revision)
end

-- Compare two version tables
-- Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
local function compareVersions(v1, v2)
  if not v1 or not v2 then
    return 0
  end
  
  -- Compare major version
  if (v1.major or 0) > (v2.major or 0) then
    return 1
  elseif (v1.major or 0) < (v2.major or 0) then
    return -1
  end
  
  -- Compare minor version
  if (v1.minor or 0) > (v2.minor or 0) then
    return 1
  elseif (v1.minor or 0) < (v2.minor or 0) then
    return -1
  end
  
  -- Compare revision
  if (v1.revision or 0) > (v2.revision or 0) then
    return 1
  elseif (v1.revision or 0) < (v2.revision or 0) then
    return -1
  end
  
  -- Versions are equal
  return 0
end

-- Check if update check should be performed (based on last check time)
local function shouldCheckForUpdates()
  local prefs = LrPrefs.prefsForPlugin()
  
  -- If auto-check is disabled, don't check
  if prefs.autoCheckUpdates == false then
    return false
  end
  
  -- Get last check time
  local lastCheck = prefs.lastUpdateCheck or 0
  local currentTime = LrDate.currentTime()
  
  -- Check once per day (86400 seconds)
  local checkInterval = 86400
  
  return (currentTime - lastCheck) >= checkInterval
end

-- Update last check time
local function updateLastCheckTime()
  local prefs = LrPrefs.prefsForPlugin()
  prefs.lastUpdateCheck = LrDate.currentTime()
end

--------------------------------------------------------------------------------
-- Public API
--------------------------------------------------------------------------------

-- Check for available plugin updates
-- @param forceCheck boolean - Force check even if recently checked
-- @return table|nil - Update info {available, currentVersion, latestVersion, downloadUrl, changelog} or nil
function PikSendUpdater.checkForUpdates(forceCheck)
  -- Check if we should perform the update check
  if not forceCheck and not shouldCheckForUpdates() then
    PikSendLogger.debug('Skipping update check (checked recently)', 'PikSendUpdater')
    return nil
  end
  
  PikSendLogger.info('Checking for plugin updates', 'PikSendUpdater')
  
  -- Get current version
  local currentVersion = getCurrentVersion()
  local currentVersionStr = versionToString(currentVersion)
  
  -- Call API to check for updates
  local updateInfo = PikSendAPI.checkForUpdates()
  
  if not updateInfo then
    PikSendLogger.warn('Failed to check for updates', 'PikSendUpdater')
    updateLastCheckTime()
    return nil
  end
  
  -- Parse latest version from API response
  local latestVersion = updateInfo.version
  if not latestVersion then
    PikSendLogger.warn('Invalid update response: missing version', 'PikSendUpdater')
    updateLastCheckTime()
    return nil
  end
  
  local latestVersionStr = versionToString(latestVersion)
  
  -- Compare versions
  local comparison = compareVersions(latestVersion, currentVersion)
  local updateAvailable = comparison > 0
  
  if updateAvailable then
    PikSendLogger.info(
      string.format('Update available: %s -> %s', currentVersionStr, latestVersionStr),
      'PikSendUpdater'
    )
  else
    PikSendLogger.info(
      string.format('Plugin is up to date (version %s)', currentVersionStr),
      'PikSendUpdater'
    )
  end
  
  -- Update last check time
  updateLastCheckTime()
  
  -- Return update information
  return {
    available = updateAvailable,
    currentVersion = currentVersionStr,
    latestVersion = latestVersionStr,
    downloadUrl = updateInfo.downloadUrl,
    changelog = updateInfo.changelog,
  }
end

-- Get current plugin version as string
-- @return string - Version string (e.g., "1.0.0")
function PikSendUpdater.getCurrentVersionString()
  local version = getCurrentVersion()
  return versionToString(version)
end

-- Compare two version strings
-- @param v1Str string - First version string (e.g., "1.2.3")
-- @param v2Str string - Second version string (e.g., "1.0.0")
-- @return number - 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function PikSendUpdater.compareVersionStrings(v1Str, v2Str)
  -- Parse version strings
  local function parseVersion(vStr)
    if not vStr then return {major = 0, minor = 0, revision = 0} end
    
    local major, minor, revision = vStr:match("(%d+)%.(%d+)%.(%d+)")
    return {
      major = tonumber(major) or 0,
      minor = tonumber(minor) or 0,
      revision = tonumber(revision) or 0,
    }
  end
  
  local v1 = parseVersion(v1Str)
  local v2 = parseVersion(v2Str)
  
  return compareVersions(v1, v2)
end

-- Enable or disable automatic update checks
-- @param enabled boolean - Whether to enable auto-check
function PikSendUpdater.setAutoCheckEnabled(enabled)
  local prefs = LrPrefs.prefsForPlugin()
  prefs.autoCheckUpdates = enabled
  
  PikSendLogger.info(
    'Auto-check updates ' .. (enabled and 'enabled' or 'disabled'),
    'PikSendUpdater'
  )
end

-- Check if automatic update checks are enabled
-- @return boolean - Whether auto-check is enabled
function PikSendUpdater.isAutoCheckEnabled()
  local prefs = LrPrefs.prefsForPlugin()
  -- Default to true if not set
  if prefs.autoCheckUpdates == nil then
    return true
  end
  return prefs.autoCheckUpdates
end

-- Show update notification dialog
-- Displays a modal dialog with update information, changelog, and download link
-- @param updateInfo table - Update information {available, currentVersion, latestVersion, downloadUrl, changelog}
-- @return boolean - True if user chose to download, false otherwise
function PikSendUpdater.showUpdateNotification(updateInfo)
  if not updateInfo then
    PikSendLogger.error('Cannot show update notification: updateInfo is nil', 'PikSendUpdater')
    return false
  end
  
  -- If no update is available, don't show notification
  if not updateInfo.available then
    PikSendLogger.debug('No update available, skipping notification', 'PikSendUpdater')
    return false
  end
  
  PikSendLogger.info('Showing update notification dialog', 'PikSendUpdater')
  
  return LrFunctionContext.callWithContext('showUpdateNotification', function(context)
    local f = LrView.osFactory()
    
    -- Build changelog text
    local changelogText = updateInfo.changelog or LOC('updatesNoneMessage')
    
    -- Truncate changelog if too long (max 500 characters for display)
    if #changelogText > 500 then
      changelogText = changelogText:sub(1, 497) .. '...'
    end
    
    local contents = f:column {
      spacing = f:control_spacing(),
      
      f:static_text {
        title = LOC('updatesAvailableTitle'),
        font = '<system/bold>',
      },
      
      f:spacer { height = 10 },
      
      f:row {
        f:static_text {
          title = LOC('updatesCurrentVersion'),
        },
        
        f:static_text {
          title = updateInfo.currentVersion or 'Inconnue',
          font = '<system>',
        },
      },
      
      f:row {
        f:static_text {
          title = LOC('updatesNewVersion'),
        },
        
        f:static_text {
          title = updateInfo.latestVersion or 'Inconnue',
          font = '<system/bold>',
        },
      },
      
      f:spacer { height = 15 },
      
      f:static_text {
        title = LOC('updatesReleaseNotes'),
        font = '<system/bold>',
      },
      
      f:spacer { height = 5 },
      
      f:edit_field {
        value = changelogText,
        width_in_chars = 60,
        height_in_lines = 8,
        enabled = false,
        fill_horizontal = 1,
      },
      
      f:spacer { height = 15 },
      
      f:static_text {
        title = LOC('updatesDownloadNow'),
        font = '<system>',
      },
    }
    
    local result = LrDialogs.presentModalDialog {
      title = LOC('updatesAvailable'),
      contents = contents,
      actionVerb = LOC('updatesDownload'),
      cancelVerb = LOC('updatesLater'),
    }
    
    if result == 'ok' then
      -- User chose to download
      if updateInfo.downloadUrl and updateInfo.downloadUrl ~= '' then
        PikSendLogger.info('Opening download URL: ' .. updateInfo.downloadUrl, 'PikSendUpdater')
        LrHttp.openUrlInBrowser(updateInfo.downloadUrl)
        return true
      else
        PikSendLogger.error('Cannot open download URL: URL is empty', 'PikSendUpdater')
        LrDialogs.message(
          'Erreur',
          'Le lien de téléchargement n\'est pas disponible. Veuillez visiter piksend.com pour télécharger la mise à jour.',
          'critical'
        )
        return false
      end
    else
      -- User chose to skip
      PikSendLogger.info('User skipped update download', 'PikSendUpdater')
      return false
    end
  end)
end

return PikSendUpdater
