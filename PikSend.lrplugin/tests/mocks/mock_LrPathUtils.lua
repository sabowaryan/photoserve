--[[----------------------------------------------------------------------------

mock_LrPathUtils.lua
Mock implementation of Lightroom LrPathUtils module for testing

------------------------------------------------------------------------------]]

local mockLrPathUtils = {}

-- Extract the filename from a path
function mockLrPathUtils.leafName(path)
  if not path then return nil end
  
  -- Handle both Unix and Windows paths
  local name = path:match("([^/\\]+)$")
  return name or path
end

-- Get the parent directory of a path
function mockLrPathUtils.parent(path)
  if not path then return nil end
  
  local parent = path:match("(.+)[/\\][^/\\]+$")
  return parent or ""
end

-- Join path components
function mockLrPathUtils.child(parent, child)
  if not parent or not child then return nil end
  
  -- Use forward slash for consistency
  return parent .. "/" .. child
end

-- Get file extension
function mockLrPathUtils.extension(path)
  if not path then return nil end
  
  local ext = path:match("%.([^%.]+)$")
  return ext
end

-- Remove file extension from path
function mockLrPathUtils.removeExtension(path)
  if not path then return nil end
  
  -- Remove the last extension
  local withoutExt = path:match("(.+)%.[^%.]+$")
  return withoutExt or path
end

-- Reset mock state (no state to reset, but included for consistency)
function mockLrPathUtils.reset()
  -- No state to reset
end

return mockLrPathUtils
