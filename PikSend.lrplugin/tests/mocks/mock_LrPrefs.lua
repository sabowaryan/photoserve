--[[----------------------------------------------------------------------------

mock_LrPrefs.lua
Mock implementation of Lightroom LrPrefs module for testing

Provides a simple in-memory preferences storage for testing purposes.

------------------------------------------------------------------------------]]

local mockLrPrefs = {}

-- Mock preferences storage (in-memory)
local mockPrefs = {}

-- Get preferences table for plugin
-- Returns a table that can be used to store/retrieve preferences
function mockLrPrefs.prefsForPlugin()
  return mockPrefs
end

-- Reset mock preferences (for testing)
function mockLrPrefs.reset()
  mockPrefs = {}
end

-- Alias for reset (used in tests)
function mockLrPrefs._reset()
  mockPrefs = {}
end

-- Get all preferences (for debugging/testing)
function mockLrPrefs._getAllPrefs()
  return mockPrefs
end

return mockLrPrefs
