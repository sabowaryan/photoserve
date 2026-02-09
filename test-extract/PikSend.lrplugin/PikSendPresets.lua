--[[----------------------------------------------------------------------------

PikSendPresets.lua
Export preset management for PikSend plugin

Handles:
- Saving export configuration presets
- Loading existing presets
- Managing preset storage in Lightroom preferences
- Validating preset data integrity

Preset Structure:
- name: string - Unique identifier for the preset
- format: "jpeg" | "png" | "tiff" - Export format
- jpegQuality: number (1-100) - JPEG compression quality
- resize: table - Resize settings
  - enabled: boolean
  - maxWidth: number
  - maxHeight: number
- watermark: table - Watermark settings
  - enabled: boolean
  - imagePath: string
  - position: string - "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center"
  - opacity: number (0-100)
- metadata: table - Metadata inclusion settings
  - includeTitle: boolean
  - includeDescription: boolean
  - includeKeywords: boolean
  - includeCopyright: boolean
  - includeExif: boolean
  - includeGPS: boolean

Validates requirements: 4.8 (save presets), 4.9 (load presets)
Validates property: 14 (Round-trip preservation)

------------------------------------------------------------------------------]]

local LrPrefs = import 'LrPrefs'

local PikSendPresets = {}

--------------------------------------------------------------------------------
-- Constants
--------------------------------------------------------------------------------

local PRESETS_KEY = 'exportPresets'

-- Valid format values
local VALID_FORMATS = {
  jpeg = true,
  png = true,
  tiff = true,
}

-- Valid watermark positions
local VALID_POSITIONS = {
  topLeft = true,
  topRight = true,
  bottomLeft = true,
  bottomRight = true,
  center = true,
}

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Deep copy a table
-- @param orig table - Original table to copy
-- @return table - Deep copy of the table
local function deepCopy(orig)
  local orig_type = type(orig)
  local copy
  
  if orig_type == 'table' then
    copy = {}
    for orig_key, orig_value in pairs(orig) do
      copy[orig_key] = deepCopy(orig_value)
    end
  else
    copy = orig
  end
  
  return copy
end

-- Validate preset structure
-- @param preset table - Preset to validate
-- @return boolean, string - (valid, error_message)
local function validatePreset(preset)
  -- Check required fields
  if not preset.name or type(preset.name) ~= 'string' or preset.name == '' then
    return false, 'Preset name is required and must be a non-empty string'
  end
  
  if not preset.format or not VALID_FORMATS[preset.format] then
    return false, 'Invalid format: must be jpeg, png, or tiff'
  end
  
  if preset.jpegQuality then
    if type(preset.jpegQuality) ~= 'number' or preset.jpegQuality < 1 or preset.jpegQuality > 100 then
      return false, 'JPEG quality must be a number between 1 and 100'
    end
  end
  
  -- Validate resize settings
  if preset.resize then
    if type(preset.resize) ~= 'table' then
      return false, 'Resize settings must be a table'
    end
    
    if preset.resize.enabled ~= nil and type(preset.resize.enabled) ~= 'boolean' then
      return false, 'Resize enabled must be a boolean'
    end
    
    if preset.resize.maxWidth and (type(preset.resize.maxWidth) ~= 'number' or preset.resize.maxWidth <= 0) then
      return false, 'Max width must be a positive number'
    end
    
    if preset.resize.maxHeight and (type(preset.resize.maxHeight) ~= 'number' or preset.resize.maxHeight <= 0) then
      return false, 'Max height must be a positive number'
    end
  end
  
  -- Validate watermark settings
  if preset.watermark then
    if type(preset.watermark) ~= 'table' then
      return false, 'Watermark settings must be a table'
    end
    
    if preset.watermark.enabled ~= nil and type(preset.watermark.enabled) ~= 'boolean' then
      return false, 'Watermark enabled must be a boolean'
    end
    
    if preset.watermark.imagePath and type(preset.watermark.imagePath) ~= 'string' then
      return false, 'Watermark image path must be a string'
    end
    
    if preset.watermark.position and not VALID_POSITIONS[preset.watermark.position] then
      return false, 'Invalid watermark position'
    end
    
    if preset.watermark.opacity then
      if type(preset.watermark.opacity) ~= 'number' or preset.watermark.opacity < 0 or preset.watermark.opacity > 100 then
        return false, 'Watermark opacity must be a number between 0 and 100'
      end
    end
  end
  
  -- Validate metadata settings
  if preset.metadata then
    if type(preset.metadata) ~= 'table' then
      return false, 'Metadata settings must be a table'
    end
    
    local booleanFields = {
      'includeTitle',
      'includeDescription',
      'includeKeywords',
      'includeCopyright',
      'includeExif',
      'includeGPS',
    }
    
    for _, field in ipairs(booleanFields) do
      if preset.metadata[field] ~= nil and type(preset.metadata[field]) ~= 'boolean' then
        return false, field .. ' must be a boolean'
      end
    end
  end
  
  return true, nil
end

-- Get all presets from preferences
-- @return table - Table of presets indexed by name
local function getAllPresets()
  local prefs = LrPrefs.prefsForPlugin()
  local presets = prefs[PRESETS_KEY]
  
  if not presets or type(presets) ~= 'table' then
    presets = {}
    prefs[PRESETS_KEY] = presets
  end
  
  return presets
end

--------------------------------------------------------------------------------
-- Public API
--------------------------------------------------------------------------------

-- Save an export preset
-- @param preset table - Preset configuration to save
-- @return boolean, string - (success, error_message)
function PikSendPresets.savePreset(preset)
  -- Validate preset structure
  local valid, error = validatePreset(preset)
  if not valid then
    return false, error
  end
  
  -- Get all presets
  local prefs = LrPrefs.prefsForPlugin()
  local presets = getAllPresets()
  
  -- Deep copy the preset to avoid reference issues
  local presetCopy = deepCopy(preset)
  
  -- Save preset indexed by name
  presets[preset.name] = presetCopy
  
  -- Update preferences
  prefs[PRESETS_KEY] = presets
  
  return true, nil
end

-- Load an export preset by name
-- @param name string - Name of the preset to load
-- @return table|nil, string - (preset, error_message)
function PikSendPresets.loadPreset(name)
  if not name or type(name) ~= 'string' or name == '' then
    return nil, 'Preset name is required'
  end
  
  -- Get all presets
  local presets = getAllPresets()
  
  -- Find preset by name
  local preset = presets[name]
  
  if not preset then
    return nil, 'Preset not found: ' .. name
  end
  
  -- Deep copy to avoid reference issues
  return deepCopy(preset), nil
end

-- Get list of all preset names
-- @return table - Array of preset names
function PikSendPresets.listPresets()
  local presets = getAllPresets()
  local names = {}
  
  for name, _ in pairs(presets) do
    table.insert(names, name)
  end
  
  -- Sort alphabetically
  table.sort(names)
  
  return names
end

-- Delete a preset by name
-- @param name string - Name of the preset to delete
-- @return boolean, string - (success, error_message)
function PikSendPresets.deletePreset(name)
  if not name or type(name) ~= 'string' or name == '' then
    return false, 'Preset name is required'
  end
  
  -- Get all presets
  local prefs = LrPrefs.prefsForPlugin()
  local presets = getAllPresets()
  
  -- Check if preset exists
  if not presets[name] then
    return false, 'Preset not found: ' .. name
  end
  
  -- Delete preset
  presets[name] = nil
  
  -- Update preferences
  prefs[PRESETS_KEY] = presets
  
  return true, nil
end

-- Check if a preset exists
-- @param name string - Name of the preset to check
-- @return boolean - true if preset exists
function PikSendPresets.presetExists(name)
  if not name or type(name) ~= 'string' or name == '' then
    return false
  end
  
  local presets = getAllPresets()
  return presets[name] ~= nil
end

-- Create a default preset structure
-- @param name string - Name for the preset
-- @return table - Default preset configuration
function PikSendPresets.createDefaultPreset(name)
  return {
    name = name or 'Default',
    format = 'jpeg',
    jpegQuality = 90,
    resize = {
      enabled = false,
      maxWidth = 1920,
      maxHeight = 1080,
    },
    watermark = {
      enabled = false,
      imagePath = '',
      position = 'bottomRight',
      opacity = 50,
    },
    metadata = {
      includeTitle = true,
      includeDescription = true,
      includeKeywords = true,
      includeCopyright = true,
      includeExif = true,
      includeGPS = false,
    },
  }
end

-- Validate export settings for Pro plan constraints
-- Validates requirement 4.10: Maximum file size (500 MB), format, and quality parameters
-- @param settings table - Export settings to validate
--   - format: string - Export format (jpeg, png, tiff)
--   - jpegQuality: number - JPEG quality (1-100)
--   - fileSize: number - File size in bytes (optional, for validation)
-- @return boolean, string - (valid, error_message)
function PikSendPresets.validateExportSettings(settings)
  if not settings or type(settings) ~= 'table' then
    return false, 'Export settings must be a table'
  end
  
  -- Validate format parameter
  if not settings.format then
    return false, 'Export format is required'
  end
  
  if type(settings.format) ~= 'string' then
    return false, 'Export format must be a string'
  end
  
  local format = string.lower(settings.format)
  if not VALID_FORMATS[format] then
    return false, 'Invalid format: must be jpeg, png, or tiff'
  end
  
  -- Validate JPEG quality parameter (only for JPEG format)
  if format == 'jpeg' then
    if not settings.jpegQuality then
      return false, 'JPEG quality is required for JPEG format'
    end
    
    if type(settings.jpegQuality) ~= 'number' then
      return false, 'JPEG quality must be a number'
    end
    
    if settings.jpegQuality < 1 or settings.jpegQuality > 100 then
      return false, 'JPEG quality must be between 1 and 100'
    end
  end
  
  -- Validate maximum file size (500 MB for Pro plan)
  if settings.fileSize then
    if type(settings.fileSize) ~= 'number' then
      return false, 'File size must be a number'
    end
    
    if settings.fileSize < 0 then
      return false, 'File size cannot be negative'
    end
    
    local MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 -- 500 MB in bytes
    
    if settings.fileSize > MAX_FILE_SIZE_BYTES then
      local fileSizeMB = settings.fileSize / (1024 * 1024)
      return false, string.format('File size (%.2f MB) exceeds maximum allowed size (500 MB)', fileSizeMB)
    end
  end
  
  return true, nil
end

return PikSendPresets
