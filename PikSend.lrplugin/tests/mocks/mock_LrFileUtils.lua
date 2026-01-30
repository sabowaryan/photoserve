--[[----------------------------------------------------------------------------

mock_LrFileUtils.lua
Mock implementation of Lightroom LrFileUtils module for testing

------------------------------------------------------------------------------]]

local mockLrFileUtils = {}

-- Mock file system state
local mockFiles = {}

-- Set mock file content
function mockLrFileUtils.setMockFile(path, content)
  mockFiles[path] = content
end

-- Clear all mock files
function mockLrFileUtils.clearMockFiles()
  mockFiles = {}
end

-- Check if file exists
function mockLrFileUtils.exists(path)
  if not path then return false end
  return mockFiles[path] ~= nil
end

-- Read file content
function mockLrFileUtils.readFile(path)
  if not path then return nil end
  return mockFiles[path]
end

-- Write file content (mock)
function mockLrFileUtils.writeFile(path, content)
  if not path then return false end
  mockFiles[path] = content
  return true
end

-- Delete file (mock)
function mockLrFileUtils.delete(path)
  if not path then return false end
  mockFiles[path] = nil
  return true
end

-- Check if path is a directory (mock)
function mockLrFileUtils.isDirectory(path)
  -- For testing, assume paths ending with / are directories
  if not path then return false end
  return path:sub(-1) == "/"
end

-- Get file attributes (mock)
function mockLrFileUtils.fileAttributes(path)
  if not path or not mockFiles[path] then
    return nil
  end
  
  local content = mockFiles[path]
  return {
    fileSize = #content,
    mode = 'file'
  }
end

-- Move/rename file (mock)
function mockLrFileUtils.move(sourcePath, destPath)
  if not sourcePath or not destPath then return false end
  if not mockFiles[sourcePath] then return false end
  
  mockFiles[destPath] = mockFiles[sourcePath]
  mockFiles[sourcePath] = nil
  return true
end

-- Copy file (mock)
function mockLrFileUtils.copy(sourcePath, destPath)
  if not sourcePath or not destPath then return false end
  if not mockFiles[sourcePath] then return false end
  
  mockFiles[destPath] = mockFiles[sourcePath]
  return true
end

-- Helper function to get file content (for tests)
function mockLrFileUtils.getFileContent(path)
  return mockFiles[path]
end

-- Helper function to reset mock state
function mockLrFileUtils.reset()
  mockFiles = {}
end

-- Alias for reset (used in tests)
function mockLrFileUtils._reset()
  mockFiles = {}
end

-- Alias for setMockFile (used in tests)
function mockLrFileUtils._setFileContent(path, content)
  mockFiles[path] = content
end

return mockLrFileUtils
