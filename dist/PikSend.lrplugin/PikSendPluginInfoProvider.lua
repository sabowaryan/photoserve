--[[----------------------------------------------------------------------------

PikSendPluginInfoProvider.lua
Plugin information provider for PikSend

Displays plugin information, settings, and about dialog

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'
local LrHttp = import 'LrHttp'
local LrPrefs = import 'LrPrefs'

local PikSendLogger = require 'PikSendLogger'
local PikSendUtils = require 'PikSendUtils'
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

--------------------------------------------------------------------------------
-- Plugin Info Provider
--------------------------------------------------------------------------------

local pluginInfoProvider = {}

-- Sections for top of dialog
function pluginInfoProvider.sectionsForTopOfDialog(f, propertyTable)
  local prefs = LrPrefs.prefsForPlugin()
  
  -- Get plugin version from Info.lua
  local pluginInfo = _PLUGIN or {}
  local version = pluginInfo.VERSION or { major = 1, minor = 0, revision = 0 }
  local versionString = string.format('%d.%d.%d',
    version.major,
    version.minor,
    version.revision)
  
  return {
    {
      title = 'Authentification',
      
      f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = 'Statut de connexion',
          font = '<system/bold>',
        },
        
        f:row {
          f:static_text {
            title = LrView.bind {
              key = 'authStatus',
              transform = function(value)
                return value or 'Non connecté'
              end,
            },
          },
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:push_button {
            title = 'Se connecter',
            action = function()
              -- Log to file
              local logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
              if logFile then
                logFile:write(string.format('[%s] [DEBUG] Login button clicked\n', os.date('%Y-%m-%d %H:%M:%S')))
                logFile:close()
              end
              
              local PikSendAuth = require 'PikSendAuth'
              if PikSendAuth.showLoginDialog() then
                local userInfo = PikSendAuth.getUserInfo()
                if userInfo then
                  propertyTable.authStatus = 'Connecté: ' .. userInfo.name
                  LrDialogs.message('Succès', 'Authentification réussie!', 'info')
                end
              end
            end,
          },
          
          f:push_button {
            title = 'Se déconnecter',
            action = function()
              local PikSendAuth = require 'PikSendAuth'
              if PikSendAuth.showLogoutDialog() then
                propertyTable.authStatus = 'Non connecté'
              end
            end,
          },
        },
      },
    },
    
    {
      title = LOC('pluginAbout'),
      
      f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = LOC('pluginForLightroom'),
          font = '<system/bold>',
        },
        
        f:static_text {
          title = LOC('pluginVersion', { version = versionString }),
        },
        
        f:spacer { height = 10 },
        
        f:static_text {
          title = LOC('pluginAboutDescription'),
          width_in_chars = 50,
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:push_button {
            title = LOC('helpWebsite'),
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com')
            end,
          },
          
          f:push_button {
            title = LOC('helpDocumentation'),
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com/docs/lightroom')
            end,
          },
          
          f:push_button {
            title = LOC('helpSupport'),
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com/support')
            end,
          },
        },
      },
    },
    
    {
      title = LOC('settingsTitle'),
      
      f:column {
        spacing = f:control_spacing(),
        
        -- Debug mode
        f:row {
          f:checkbox {
            title = LOC('settingsDebugMode'),
            value = LrView.bind('debugMode'),
          },
        },
        
        f:spacer { height = 10 },
        
        -- Log management
        f:static_text {
          title = LOC('settingsLogs'),
          font = '<system/bold>',
        },
        
        f:row {
          f:static_text {
            title = LOC('settingsLogFile'),
            width = LrView.share('label_width'),
          },
          f:static_text {
            title = PikSendLogger.getLogPath(),
            width_in_chars = 40,
          },
        },
        
        f:row {
          f:push_button {
            title = LOC('settingsViewLogs'),
            action = function()
              local logContent = PikSendLogger.readLog(100)
              LrDialogs.message(LOC('settingsLogs'), logContent, 'info')
            end,
          },
          
          f:push_button {
            title = LOC('settingsClearLogs'),
            action = function()
              local result = LrDialogs.confirm(
                LOC('settingsClearLogs'),
                LOC('settingsClearLogsConfirm'),
                LOC('delete'),
                LOC('cancel')
              )
              
              if result == 'ok' then
                PikSendLogger.clearLog()
                LrDialogs.message(LOC('settingsLogsCleared'), LOC('settingsLogsClearedMessage'), 'info')
              end
            end,
          },
        },
        
        f:spacer { height = 10 },
        
        -- Cache management
        f:static_text {
          title = LOC('settingsCache'),
          font = '<system/bold>',
        },
        
        f:row {
          f:push_button {
            title = LOC('settingsClearCache'),
            action = function()
              local result = LrDialogs.confirm(
                LOC('settingsClearCache'),
                LOC('settingsClearCacheConfirm'),
                LOC('delete'),
                LOC('cancel')
              )
              
              if result == 'ok' then
                local PikSendCache = require 'PikSendCache'
                local PikSendGallery = require 'PikSendGallery'
                
                PikSendCache.clearUploadCache()
                PikSendGallery.clearCache()
                
                LrDialogs.message(LOC('settingsCacheCleared'), LOC('settingsCacheClearedMessage'), 'info')
              end
            end,
          },
          
          f:push_button {
            title = LOC('settingsCacheStats'),
            action = function()
              local PikSendCache = require 'PikSendCache'
              local stats = PikSendCache.getCacheStats()
              
              local message = string.format(
                'Entrées dans le cache: %d\n\nLe cache permet d\'éviter de re-uploader des photos identiques.',
                stats.entryCount
              )
              
              LrDialogs.message('Statistiques du cache', message, 'info')
            end,
          },
        },
      },
    },
    
    {
      title = LOC('updatesTitle'),
      
      f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = LOC('updatesCurrentVersion') .. ' ' .. versionString,
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:push_button {
            title = LOC('updatesCheck'),
            action = function()
              local PikSendAPI = require 'PikSendAPI'
              local updateInfo = PikSendAPI.checkForUpdates()
              
              if updateInfo and updateInfo.available then
                local message = string.format(
                  'Une nouvelle version est disponible: %s\n\n%s',
                  updateInfo.version,
                  updateInfo.changelog or ''
                )
                
                local result = LrDialogs.confirm(
                  LOC('updatesAvailable'),
                  message,
                  LOC('updatesDownload'),
                  LOC('updatesLater')
                )
                
                if result == 'ok' and updateInfo.downloadUrl then
                  LrHttp.openUrlInBrowser(updateInfo.downloadUrl)
                end
              else
                LrDialogs.message(
                  LOC('updatesNone'),
                  LOC('updatesNoneMessage'),
                  'info'
                )
              end
            end,
          },
        },
      },
    },
  }
end

-- Start dialog
function pluginInfoProvider.startDialog(propertyTable)
  -- Log immediately to verify plugin loads
  local logFile = io.open(_PLUGIN.path .. '/PikSend.log', 'a')
  if logFile then
    logFile:write(string.format('[%s] [DEBUG] PluginInfoProvider.startDialog called\n', os.date('%Y-%m-%d %H:%M:%S')))
    logFile:close()
  end
  
  local prefs = LrPrefs.prefsForPlugin()
  
  -- Initialize property table with preferences
  propertyTable.debugMode = PikSendLogger.isDebugMode()
  
  -- Initialize auth status
  local PikSendAuth = require 'PikSendAuth'
  if PikSendAuth.isAuthenticated() then
    local userInfo = PikSendAuth.getUserInfo()
    if userInfo then
      propertyTable.authStatus = 'Connecté: ' .. userInfo.name
    else
      propertyTable.authStatus = 'Connecté'
    end
  else
    propertyTable.authStatus = 'Non connecté'
  end
  
  -- Observe changes to debug mode
  propertyTable:addObserver('debugMode', function()
    PikSendLogger.setDebugMode(propertyTable.debugMode)
  end)
end

-- End dialog
function pluginInfoProvider.endDialog(propertyTable)
  -- Nothing to do
end

--------------------------------------------------------------------------------

return pluginInfoProvider
