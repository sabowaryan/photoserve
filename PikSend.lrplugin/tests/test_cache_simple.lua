--[[----------------------------------------------------------------------------

test_cache_simple.lua
Simple unit tests for PikSendCache module (no busted required)

Tests:
- calculateHash() function
- Basic cache operationss

------------------------------------------------------------------------------]]

-- Setup test environment
package.path = package.path .. ';../?.lua;mocks/?.lua'

-- Mock Lightroom SDK modules
_G.import = function(module)
  if module == 'LrFileUtils' then
    return require('mock_LrFileUtils')
  elseif module == 'LrPathUtils' then
    return require('mock_LrPathUtils')
  elseif module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        if not _G._testPrefs then
          _G._testPrefs = {}
        end
        return _G._testPrefs
      end
    }
  elseif module == 'LrMD5' then
    return require('mock_LrMD5')
  end
  return {}
end

-- Simple test framework
local tests_passed = 0
local tests_failed = 0

local function test(name, func)
  local success, err = pcall(func)
  if success then
    tests_passed = tests_passed + 1
    print("  ✓ " .. name)
  else
    tests_failed = tests_failed + 1
    print("  ✗ " .. name)
    print("    Error: " .. tostring(err))
  end
end

local function assert_nil(value, message)
  if value ~= nil then
    error(message or "Expected nil, got " .. tostring(value))
  end
end

local function assert_not_nil(value, message)
  if value == nil then
    error(message or "Expected non-nil v