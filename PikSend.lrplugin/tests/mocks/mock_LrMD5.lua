--[[----------------------------------------------------------------------------

mock_LrMD5.lua
Mock implementation of Lightroom LrMD5 module for testing

------------------------------------------------------------------------------]]

local mock_LrMD5 = {}

-- Simple MD5 implementation for testing
-- In real tests, we'll use a proper MD5 library or just return predictable values
function mock_LrMD5.digest(content)
  if not content or content == "" then
    return nil
  end
  
  -- For testing purposes, we'll create a simple hash based on content length and first chars
  -- In a real implementation, this would use a proper MD5 algorithm
  local hash = string.format("%032x", #content)
  
  -- Add some variation based on content
  if #content > 0 then
    local firstChar = string.byte(content, 1)
    local lastChar = string.byte(content, #content)
    hash = string.format("%02x%s%02x", firstChar, hash:sub(3, -3), lastChar)
  end
  
  return hash
end

return mock_LrMD5
