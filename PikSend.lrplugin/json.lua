--[[----------------------------------------------------------------------------

json.lua
Simple JSON encoder/decoder for Lua

This is a minimal JSON library for the PikSend Lightroom plugin.
For production use, consider using a more robust JSON library like dkjson.

------------------------------------------------------------------------------]]

local json = {}

--------------------------------------------------------------------------------
-- JSON Encoding
--------------------------------------------------------------------------------

-- Escape string for JSON
local function escapeString(str)
  local replacements = {
    ['\\'] = '\\\\',
    ['"'] = '\\"',
    ['\b'] = '\\b',
    ['\f'] = '\\f',
    ['\n'] = '\\n',
    ['\r'] = '\\r',
    ['\t'] = '\\t',
  }
  
  return str:gsub('[\\"\b\f\n\r\t]', replacements)
end

-- Encode value to JSON
local function encodeValue(value, indent, level)
  local valueType = type(value)
  
  if valueType == 'nil' then
    return 'null'
  elseif valueType == 'boolean' then
    return value and 'true' or 'false'
  elseif valueType == 'number' then
    return tostring(value)
  elseif valueType == 'string' then
    return '"' .. escapeString(value) .. '"'
  elseif valueType == 'table' then
    -- Check if array or object
    local isArray = true
    local count = 0
    
    for k, v in pairs(value) do
      count = count + 1
      if type(k) ~= 'number' or k ~= count then
        isArray = false
        break
      end
    end
    
    if isArray and count > 0 then
      -- Encode as array
      local parts = {}
      for i = 1, count do
        table.insert(parts, encodeValue(value[i], indent, level + 1))
      end
      return '[' .. table.concat(parts, ',') .. ']'
    else
      -- Encode as object
      local parts = {}
      for k, v in pairs(value) do
        local key = type(k) == 'string' and k or tostring(k)
        table.insert(parts, '"' .. escapeString(key) .. '":' .. encodeValue(v, indent, level + 1))
      end
      return '{' .. table.concat(parts, ',') .. '}'
    end
  else
    error('Cannot encode value of type ' .. valueType)
  end
end

-- Encode Lua table to JSON string
-- @param value any - Value to encode
-- @return string - JSON string
function json.encode(value)
  return encodeValue(value, false, 0)
end

--------------------------------------------------------------------------------
-- JSON Decoding
--------------------------------------------------------------------------------

-- Skip whitespace
local function skipWhitespace(str, pos)
  while pos <= #str do
    local char = str:sub(pos, pos)
    if char ~= ' ' and char ~= '\t' and char ~= '\n' and char ~= '\r' then
      break
    end
    pos = pos + 1
  end
  return pos
end

-- Decode string
local function decodeString(str, pos)
  local result = {}
  pos = pos + 1  -- Skip opening quote
  
  while pos <= #str do
    local char = str:sub(pos, pos)
    
    if char == '"' then
      return table.concat(result), pos + 1
    elseif char == '\\' then
      pos = pos + 1
      local escapeChar = str:sub(pos, pos)
      
      if escapeChar == 'n' then
        table.insert(result, '\n')
      elseif escapeChar == 'r' then
        table.insert(result, '\r')
      elseif escapeChar == 't' then
        table.insert(result, '\t')
      elseif escapeChar == 'b' then
        table.insert(result, '\b')
      elseif escapeChar == 'f' then
        table.insert(result, '\f')
      else
        table.insert(result, escapeChar)
      end
      pos = pos + 1
    else
      table.insert(result, char)
      pos = pos + 1
    end
  end
  
  error('Unterminated string')
end

-- Decode number
local function decodeNumber(str, pos)
  local numStr = str:match('^-?%d+%.?%d*[eE]?[+-]?%d*', pos)
  if numStr then
    return tonumber(numStr), pos + #numStr
  end
  error('Invalid number at position ' .. pos)
end

-- Forward declaration
local decodeValue

-- Decode array
local function decodeArray(str, pos)
  local result = {}
  pos = pos + 1  -- Skip opening bracket
  pos = skipWhitespace(str, pos)
  
  -- Check for empty array
  if str:sub(pos, pos) == ']' then
    return result, pos + 1
  end
  
  while pos <= #str do
    local value, newPos = decodeValue(str, pos)
    table.insert(result, value)
    pos = skipWhitespace(str, newPos)
    
    local char = str:sub(pos, pos)
    if char == ']' then
      return result, pos + 1
    elseif char == ',' then
      pos = skipWhitespace(str, pos + 1)
    else
      error('Expected , or ] at position ' .. pos)
    end
  end
  
  error('Unterminated array')
end

-- Decode object
local function decodeObject(str, pos)
  local result = {}
  pos = pos + 1  -- Skip opening brace
  pos = skipWhitespace(str, pos)
  
  -- Check for empty object
  if str:sub(pos, pos) == '}' then
    return result, pos + 1
  end
  
  while pos <= #str do
    -- Decode key
    pos = skipWhitespace(str, pos)
    if str:sub(pos, pos) ~= '"' then
      error('Expected string key at position ' .. pos)
    end
    
    local key, newPos = decodeString(str, pos)
    pos = skipWhitespace(str, newPos)
    
    -- Expect colon
    if str:sub(pos, pos) ~= ':' then
      error('Expected : at position ' .. pos)
    end
    pos = skipWhitespace(str, pos + 1)
    
    -- Decode value
    local value
    value, pos = decodeValue(str, pos)
    result[key] = value
    
    pos = skipWhitespace(str, pos)
    local char = str:sub(pos, pos)
    
    if char == '}' then
      return result, pos + 1
    elseif char == ',' then
      pos = skipWhitespace(str, pos + 1)
    else
      error('Expected , or } at position ' .. pos)
    end
  end
  
  error('Unterminated object')
end

-- Decode value
decodeValue = function(str, pos)
  pos = skipWhitespace(str, pos)
  local char = str:sub(pos, pos)
  
  if char == '"' then
    return decodeString(str, pos)
  elseif char == '{' then
    return decodeObject(str, pos)
  elseif char == '[' then
    return decodeArray(str, pos)
  elseif char == 't' then
    if str:sub(pos, pos + 3) == 'true' then
      return true, pos + 4
    end
  elseif char == 'f' then
    if str:sub(pos, pos + 4) == 'false' then
      return false, pos + 5
    end
  elseif char == 'n' then
    if str:sub(pos, pos + 3) == 'null' then
      return nil, pos + 4
    end
  elseif char == '-' or (char >= '0' and char <= '9') then
    return decodeNumber(str, pos)
  end
  
  error('Unexpected character at position ' .. pos .. ': ' .. char)
end

-- Decode JSON string to Lua table
-- @param str string - JSON string
-- @return any - Decoded value
function json.decode(str)
  if not str or str == '' then
    return nil
  end
  
  local value, pos = decodeValue(str, 1)
  return value
end

--------------------------------------------------------------------------------

return json
