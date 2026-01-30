--[[----------------------------------------------------------------------------

Info.lua
Plugin metadata and configuration for PikSend Lightroom Plugin

------------------------------------------------------------------------------]]

return {
  -- SDK Version
  LrSdkVersion = 6.0,
  LrSdkMinimumVersion = 6.0,
  
  -- Plugin Identification
  LrToolkitIdentifier = 'com.piksend.lightroom',
  LrPluginName = 'PikSend',
  
  -- Plugin Information
  LrPluginInfoUrl = 'https://piksend.com/lightroom',
  LrPluginInfoProvider = 'PikSendPluginInfoProvider.lua',
  
  -- Export Service Provider
  LrExportServiceProvider = {
    title = 'PikSend',
    file = 'PikSendExportServiceProvider.lua',
  },
  
  -- Publish Service Provider
  LrPublishServiceProvider = {
    title = 'PikSend',
    file = 'PikSendPublishServiceProvider.lua',
  },
  
  -- Version Information
  VERSION = { 
    major = 1, 
    minor = 0, 
    revision = 0,
    build = 0,
  },
}
