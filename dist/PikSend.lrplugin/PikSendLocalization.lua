--[[----------------------------------------------------------------------------

PikSendLocalization.lua
Localization module for PikSend Lightroom plugin

Provides the LOC() function to retrieve translated strings based on the
current Lightroom language setting.

Covers requirements 13.1-13.10 for documentation and support

------------------------------------------------------------------------------]]

local LrSystemInfo = import 'LrSystemInfo'

local PikSendLocalization = {}

-- Cache for loaded translations
local translations = nil
local currentLanguage = nil

--[[
  Load translations for the current language
  
  Returns the translations table for the current language, or English as fallback
]]
local function loadTranslations()
  -- Get Lightroom's current language
  -- LrSystemInfo.language can be either a function or a property
  local language = type(LrSystemInfo.language) == 'function' 
    and LrSystemInfo.language() 
    or LrSystemInfo.language 
    or 'en'
  
  -- Map Lightroom language codes to our translation files
  -- Lightroom uses ISO 639-1 codes (en, fr, de, etc.)
  local languageMap = {
    en = 'en',
    fr = 'fr',
    -- Add more languages as needed
  }
  
  local langCode = languageMap[language] or 'en' -- Default to English
  
  -- Only reload if language changed
  if currentLanguage == langCode and translations then
    return translations
  end
  
  currentLanguage = langCode
  
  -- Get plugin path
  local LrPathUtils = import 'LrPathUtils'
  local pluginPath = _PLUGIN.path
  
  -- Load the translation file using dofile
  local translationPath = LrPathUtils.child(pluginPath, 'localization')
  translationPath = LrPathUtils.child(translationPath, langCode .. '.lua')
  
  local success, result = pcall(function()
    return dofile(translationPath)
  end)
  
  if success and result then
    translations = result
  else
    -- Fallback to English if translation file not found
    local enPath = LrPathUtils.child(pluginPath, 'localization')
    enPath = LrPathUtils.child(enPath, 'en.lua')
    translations = dofile(enPath)
  end
  
  return translations
end

--[[
  Get a localized string by key
  
  @param key (string) The translation key
  @param substitutions (table, optional) Table of substitutions for placeholders
  
  Returns the translated string with substitutions applied
  
  Example:
    LOC('authSuccessMessage', { name = 'John' })
    Returns: "Welcome John! You are now connected to PikSend."
]]
function PikSendLocalization.LOC(key, substitutions)
  local trans = loadTranslations()
  
  -- Get the translation
  local text = trans[key]
  
  -- If key not found, return the key itself as fallback
  if not text then
    return '[' .. key .. ']'
  end
  
  -- Apply substitutions if provided
  if substitutions then
    for placeholder, value in pairs(substitutions) do
      -- Replace $/{placeholder} with value
      text = string.gsub(text, '%$/' .. placeholder, tostring(value))
    end
  end
  
  return text
end

-- Export the LOC function globally for convenience
_G.LOC = PikSendLocalization.LOC

return PikSendLocalization
