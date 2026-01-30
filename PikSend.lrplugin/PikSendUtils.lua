--[[----------------------------------------------------------------------------

PikSendUtils.lua
Utility functions for PikSend plugin

Provides:
- File size formatting
- Duration formatting
- Filename sanitization
- URL validation
- String utilities

------------------------------------------------------------------------------]]

local PikSendUtils = {}

--------------------------------------------------------------------------------
-- File Size Formatting
--------------------------------------------------------------------------------

-- Format file size in human-readable format
-- @param bytes number - Size in bytes
-- @return string - Formatted size (e.g., "1.5 MB")
function PikSendUtils.formatFileSize(bytes)
  if not bytes or bytes < 0 then
    return '0 B'
  end
  
  local units = {'B', 'KB', 'MB', 'GB', 'TB'}
  local unitIndex = 1
  local size = bytes
  
  while size >= 1024 and unitIndex < #units do
    size = size / 1024
    unitIndex = unitIndex + 1
  end
  
  if unitIndex == 1 then
    return string.format('%d %s', size, units[unitIndex])
  else
    return string.format('%.2f %s', size, units[unitIndex])
  end
end

--------------------------------------------------------------------------------
-- Duration Formatting
--------------------------------------------------------------------------------

-- Format duration in human-readable format
-- @param seconds number - Duration in seconds
-- @return string - Formatted duration (e.g., "1h 23m 45s")
function PikSendUtils.formatDuration(seconds)
  if not seconds or seconds < 0 then
    return '0s'
  end
  
  local hours = math.floor(seconds / 3600)
  local minutes = math.floor((seconds % 3600) / 60)
  local secs = math.floor(seconds % 60)
  
  local parts = {}
  
  if hours > 0 then
    table.insert(parts, string.format('%dh', hours))
  end
  
  if minutes > 0 then
    table.insert(parts, string.format('%dm', minutes))
  end
  
  if secs > 0 or #parts == 0 then
    table.insert(parts, string.format('%ds', secs))
  end
  
  return table.concat(parts, ' ')
end

-- Format duration in short format (for time remaining)
-- @param seconds number - Duration in seconds
-- @return string - Formatted duration (e.g., "1:23:45")
function PikSendUtils.formatDurationShort(seconds)
  if not seconds or seconds < 0 then
    return '0:00'
  end
  
  local hours = math.floor(seconds / 3600)
  local minutes = math.floor((seconds % 3600) / 60)
  local secs = math.floor(seconds % 60)
  
  if hours > 0 then
    return string.format('%d:%02d:%02d', hours, minutes, secs)
  else
    return string.format('%d:%02d', minutes, secs)
  end
end

--------------------------------------------------------------------------------
-- Filename Utilities
--------------------------------------------------------------------------------

-- Sanitize filename by removing invalid characters
-- @param filename string - Original filename
-- @return string - Sanitized filename
function PikSendUtils.sanitizeFilename(filename)
  if not filename then
    return 'untitled'
  end
  
  -- Remove or replace invalid characters
  local sanitized = filename
  
  -- Replace invalid characters with underscore
  sanitized = string.gsub(sanitized, '[<>:"/\\|?*]', '_')
  
  -- Remove leading/trailing spaces and dots
  sanitized = string.gsub(sanitized, '^[%s%.]+', '')
  sanitized = string.gsub(sanitized, '[%s%.]+$', '')
  
  -- Ensure filename is not empty
  if sanitized == '' then
    sanitized = 'untitled'
  end
  
  return sanitized
end

--------------------------------------------------------------------------------
-- URL Validation
--------------------------------------------------------------------------------

-- Validate that URL uses HTTPS
-- @param url string - URL to validate
-- @return boolean - true if URL is HTTPS
function PikSendUtils.validateUrl(url)
  if not url then
    return false
  end
  
  -- Check if URL starts with https://
  return string.sub(url, 1, 8) == 'https://'
end

-- Validate that URL is from PikSend domain
-- @param url string - URL to validate
-- @return boolean - true if URL is from PikSend domain
function PikSendUtils.validatePikSendUrl(url)
  if not PikSendUtils.validateUrl(url) then
    return false
  end
  
  -- Check if URL contains piksend.com domain
  return string.find(url, 'piksend%.com', 1, false) ~= nil
end

-- Build URL with query parameters
-- @param baseUrl string - Base URL
-- @param params table - Query parameters
-- @return string - Complete URL with parameters
function PikSendUtils.buildUrl(baseUrl, params)
  if not params or next(params) == nil then
    return baseUrl
  end
  
  local queryParts = {}
  for key, value in pairs(params) do
    local encodedValue = PikSendUtils.urlEncode(tostring(value))
    table.insert(queryParts, key .. '=' .. encodedValue)
  end
  
  return baseUrl .. '?' .. table.concat(queryParts, '&')
end

-- URL encode a string
-- @param str string - String to encode
-- @return string - URL encoded string
function PikSendUtils.urlEncode(str)
  if not str then
    return ''
  end
  
  str = string.gsub(str, '\n', '\r\n')
  str = string.gsub(str, '([^%w%-%.%_%~ ])',
    function(c)
      return string.format('%%%02X', string.byte(c))
    end)
  str = string.gsub(str, ' ', '+')
  
  return str
end

--------------------------------------------------------------------------------
-- String Utilities
--------------------------------------------------------------------------------

-- Trim whitespace from string
-- @param str string - String to trim
-- @return string - Trimmed string
function PikSendUtils.trim(str)
  if not str then
    return ''
  end
  
  return string.gsub(str, '^%s*(.-)%s*$', '%1')
end

-- Check if string is empty or nil
-- @param str string - String to check
-- @return boolean - true if empty or nil
function PikSendUtils.isEmpty(str)
  return not str or str == '' or PikSendUtils.trim(str) == ''
end

-- Split string by delimiter
-- @param str string - String to split
-- @param delimiter string - Delimiter
-- @return table - Array of parts
function PikSendUtils.split(str, delimiter)
  if not str then
    return {}
  end
  
  local result = {}
  local pattern = '([^' .. delimiter .. ']+)'
  
  for part in string.gmatch(str, pattern) do
    table.insert(result, part)
  end
  
  return result
end

-- Truncate string to maximum length
-- @param str string - String to truncate
-- @param maxLength number - Maximum length
-- @param suffix string - Suffix to add if truncated (default '...')
-- @return string - Truncated string
function PikSendUtils.truncate(str, maxLength, suffix)
  if not str then
    return ''
  end
  
  suffix = suffix or '...'
  
  if string.len(str) <= maxLength then
    return str
  end
  
  return string.sub(str, 1, maxLength - string.len(suffix)) .. suffix
end

--------------------------------------------------------------------------------
-- Table Utilities
--------------------------------------------------------------------------------

-- Deep copy a table
-- @param orig table - Original table
-- @return table - Deep copy
function PikSendUtils.deepCopy(orig)
  local orig_type = type(orig)
  local copy
  
  if orig_type == 'table' then
    copy = {}
    for orig_key, orig_value in next, orig, nil do
      copy[PikSendUtils.deepCopy(orig_key)] = PikSendUtils.deepCopy(orig_value)
    end
    setmetatable(copy, PikSendUtils.deepCopy(getmetatable(orig)))
  else
    copy = orig
  end
  
  return copy
end

-- Count items in table
-- @param tbl table - Table to count
-- @return number - Number of items
function PikSendUtils.tableCount(tbl)
  if not tbl then
    return 0
  end
  
  local count = 0
  for _ in pairs(tbl) do
    count = count + 1
  end
  
  return count
end

--------------------------------------------------------------------------------
-- Version Comparison
--------------------------------------------------------------------------------

-- Compare version strings
-- @param version1 string - First version (e.g., "1.2.3")
-- @param version2 string - Second version (e.g., "1.3.0")
-- @return number - -1 if v1 < v2, 0 if equal, 1 if v1 > v2
function PikSendUtils.compareVersions(version1, version2)
  local v1Parts = PikSendUtils.split(version1, '.')
  local v2Parts = PikSendUtils.split(version2, '.')
  
  local maxParts = math.max(#v1Parts, #v2Parts)
  
  for i = 1, maxParts do
    local v1Part = tonumber(v1Parts[i]) or 0
    local v2Part = tonumber(v2Parts[i]) or 0
    
    if v1Part < v2Part then
      return -1
    elseif v1Part > v2Part then
      return 1
    end
  end
  
  return 0
end

return PikSendUtils
