--[[----------------------------------------------------------------------------

mock_LrDate.lua
Mock implementation of Lightroom LrDate module for testing

------------------------------------------------------------------------------]]

local mockLrDate = {}

-- Mock current time (returns a fixed timestamp for testing)
local mockTime = 1704067200 -- 2024-01-01 00:00:00

function mockLrDate.currentTime()
  return mockTime
end

-- Set the mock time
function mockLrDate.setMockTime(time)
  mockTime = time
end

-- Format time (simplified mock)
function mockLrDate.timeToUserFormat(time, format)
  return os.date(format or "%Y-%m-%d %H:%M:%S", time)
end

-- Parse time (simplified mock)
function mockLrDate.timeFromComponents(components)
  return os.time(components)
end

-- Reset mock state
function mockLrDate.reset()
  mockTime = 1704067200 -- Reset to default: 2024-01-01 00:00:00
end

return mockLrDate
