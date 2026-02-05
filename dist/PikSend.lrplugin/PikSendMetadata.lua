--[[----------------------------------------------------------------------------

PikSendMetadata.lua
Metadata extraction and management for PikSend plugin

Handles:
- IPTC metadata extraction (title, description, keywords, copyright)
- EXIF data extraction (camera, lens, settings)
- Alt-text generation
- Privacy settings (GPS filtering)
- Default metadata application

------------------------------------------------------------------------------]]

local PikSendMetadata = {}

--------------------------------------------------------------------------------
-- Metadata Extraction
--------------------------------------------------------------------------------

-- Extract metadata from photo
-- @param photo LrPhoto - Lightroom photo object
-- @param settings table - Export settings with metadata preferences
-- @return table - Metadata object
function PikSendMetadata.extractMetadata(photo, settings)
  local metadata = {}
  
  -- Get metadata preferences (default to true if not specified)
  local prefs = settings and settings.metadata or {}
  local includeTitle = prefs.includeTitle ~= false
  local includeDescription = prefs.includeDescription ~= false
  local includeKeywords = prefs.includeKeywords ~= false
  local includeCopyright = prefs.includeCopyright ~= false
  local includeExif = prefs.includeExif ~= false
  local includeGPS = prefs.includeGPS == true  -- Default to false for privacy
  
  -- Extract IPTC Title
  if includeTitle then
    local title = photo:getFormattedMetadata('title')
    if title and title ~= '' then
      metadata.title = title
    end
  end
  
  -- Extract IPTC Caption/Description
  if includeDescription then
    local caption = photo:getFormattedMetadata('caption')
    if caption and caption ~= '' then
      metadata.description = caption
    end
  end
  
  -- Extract IPTC Keywords
  if includeKeywords then
    local keywords = photo:getFormattedMetadata('keywordTags')
    if keywords and #keywords > 0 then
      metadata.keywords = keywords
    end
  end
  
  -- Extract Copyright
  if includeCopyright then
    local copyright = photo:getFormattedMetadata('copyright')
    if copyright and copyright ~= '' then
      metadata.copyright = copyright
    end
  end
  
  -- Extract EXIF data
  if includeExif then
    metadata.exif = PikSendMetadata.extractExifData(photo)
  end
  
  -- Extract GPS data (only if explicitly enabled)
  if includeGPS then
    local gps = PikSendMetadata.extractGPSData(photo)
    if gps then
      metadata.gps = gps
    end
  end
  
  -- Generate alt-text
  metadata.altText = PikSendMetadata.generateAltText(metadata.title, metadata.description)
  
  return metadata
end

-- Extract EXIF data
-- @param photo LrPhoto - Lightroom photo object
-- @return table - EXIF data
function PikSendMetadata.extractExifData(photo)
  local exif = {}
  
  -- Camera make and model
  local cameraMake = photo:getFormattedMetadata('cameraMake')
  local cameraModel = photo:getFormattedMetadata('cameraModel')
  if cameraMake and cameraMake ~= '' then
    exif.cameraMake = cameraMake
  end
  if cameraModel and cameraModel ~= '' then
    exif.cameraModel = cameraModel
  end
  
  -- Lens
  local lens = photo:getFormattedMetadata('lens')
  if lens and lens ~= '' then
    exif.lens = lens
  end
  
  -- ISO
  local iso = photo:getFormattedMetadata('isoSpeedRating')
  if iso then
    exif.iso = iso
  end
  
  -- Aperture
  local aperture = photo:getFormattedMetadata('aperture')
  if aperture then
    exif.aperture = aperture
  end
  
  -- Shutter speed
  local shutterSpeed = photo:getFormattedMetadata('shutterSpeed')
  if shutterSpeed then
    exif.shutterSpeed = shutterSpeed
  end
  
  -- Focal length
  local focalLength = photo:getFormattedMetadata('focalLength')
  if focalLength then
    exif.focalLength = focalLength
  end
  
  -- Date taken
  local dateTime = photo:getFormattedMetadata('dateTimeOriginal')
  if dateTime then
    exif.dateTimeOriginal = dateTime
  end
  
  return exif
end

-- Extract GPS data
-- @param photo LrPhoto - Lightroom photo object
-- @return table|nil - GPS data {latitude, longitude} or nil
function PikSendMetadata.extractGPSData(photo)
  local gps = photo:getRawMetadata('gps')
  
  if gps and gps.latitude and gps.longitude then
    return {
      latitude = gps.latitude,
      longitude = gps.longitude,
    }
  end
  
  return nil
end

--------------------------------------------------------------------------------
-- Alt-Text Generation
--------------------------------------------------------------------------------

-- Generate alt-text from title and description
-- @param title string|nil - Photo title
-- @param description string|nil - Photo description
-- @return string - Generated alt-text
function PikSendMetadata.generateAltText(title, description)
  local parts = {}
  
  if title and title ~= '' then
    table.insert(parts, title)
  end
  
  if description and description ~= '' then
    -- Limit description length for alt-text
    local maxDescLength = 100
    local desc = description
    if string.len(desc) > maxDescLength then
      desc = string.sub(desc, 1, maxDescLength) .. '...'
    end
    table.insert(parts, desc)
  end
  
  if #parts > 0 then
    return table.concat(parts, ' - ')
  end
  
  return 'Photo'  -- Default alt-text
end

--------------------------------------------------------------------------------
-- Default Metadata Application
--------------------------------------------------------------------------------

-- Apply default metadata to photos that don't have it
-- @param metadata table - Extracted metadata
-- @param defaults table - Default metadata values
-- @return table - Metadata with defaults applied
function PikSendMetadata.applyDefaultMetadata(metadata, defaults)
  if not defaults then
    return metadata
  end
  
  local result = {}
  
  -- Copy existing metadata
  for key, value in pairs(metadata) do
    result[key] = value
  end
  
  -- Apply defaults for missing fields
  for key, value in pairs(defaults) do
    if not result[key] or result[key] == '' then
      result[key] = value
    end
  end
  
  return result
end

--------------------------------------------------------------------------------
-- Metadata Validation
--------------------------------------------------------------------------------

-- Validate metadata object
-- @param metadata table - Metadata to validate
-- @return boolean, string - (valid, errorMessage)
function PikSendMetadata.validateMetadata(metadata)
  if not metadata then
    return false, 'Metadata is required'
  end
  
  -- Validate title length if present
  if metadata.title then
    local titleLength = string.len(metadata.title)
    if titleLength > 200 then
      return false, 'Title cannot exceed 200 characters'
    end
  end
  
  -- Validate description length if present
  if metadata.description then
    local descLength = string.len(metadata.description)
    if descLength > 5000 then
      return false, 'Description cannot exceed 5000 characters'
    end
  end
  
  -- Validate keywords count if present
  if metadata.keywords then
    if #metadata.keywords > 50 then
      return false, 'Cannot have more than 50 keywords'
    end
  end
  
  return true, nil
end

--------------------------------------------------------------------------------
-- Metadata Formatting
--------------------------------------------------------------------------------

-- Format metadata for API submission
-- @param metadata table - Metadata object
-- @return table - Formatted metadata for API
function PikSendMetadata.formatForAPI(metadata)
  local formatted = {}
  
  -- Simple string fields
  if metadata.title then
    formatted.title = metadata.title
  end
  
  if metadata.description then
    formatted.description = metadata.description
  end
  
  if metadata.altText then
    formatted.altText = metadata.altText
  end
  
  if metadata.copyright then
    formatted.copyright = metadata.copyright
  end
  
  -- Keywords as comma-separated string
  if metadata.keywords and #metadata.keywords > 0 then
    formatted.keywords = table.concat(metadata.keywords, ',')
  end
  
  -- EXIF as JSON string
  if metadata.exif then
    local json = require 'json'
    formatted.exif = json.encode(metadata.exif)
  end
  
  -- GPS as separate fields
  if metadata.gps then
    formatted.latitude = tostring(metadata.gps.latitude)
    formatted.longitude = tostring(metadata.gps.longitude)
  end
  
  return formatted
end

return PikSendMetadata
