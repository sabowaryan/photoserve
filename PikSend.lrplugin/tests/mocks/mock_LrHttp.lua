--[[----------------------------------------------------------------------------

mock_LrHttp.lua
Mock implementation of Lightroom LrHttp module for testing

------------------------------------------------------------------------------]]

local json = require('json')

local mockLrHttp = {}

-- State for mocking responses
local nextResponse = nil
local nextStatusCode = 200

-- Set the next response to be returned
function mockLrHttp.setNextResponse(statusCode, data)
  nextStatusCode = statusCode
  nextResponse = data
end

-- Mock GET request
function mockLrHttp.get(url, headers)
  if nextResponse then
    local response = json.encode(nextResponse)
    local hdrs = {
      status = nextStatusCode
    }
    
    -- Reset for next call
    local result = response
    nextResponse = nil
    nextStatusCode = 200
    
    return result, hdrs
  end
  
  -- Default: return nil (simulating network error)
  return nil, nil
end

-- Mock POST request
function mockLrHttp.post(url, body, headers, method, timeout)
  if nextResponse then
    local response = json.encode(nextResponse)
    local hdrs = {
      status = nextStatusCode
    }
    
    -- Reset for next call
    local result = response
    nextResponse = nil
    nextStatusCode = 200
    
    return result, hdrs
  end
  
  -- Default: return nil (simulating network error)
  return nil, nil
end

-- Mock opening URL in browser
function mockLrHttp.openUrlInBrowser(url)
  -- Do nothing in tests
  return true
end

return mockLrHttp
