#!/usr/bin/env lua
--[[----------------------------------------------------------------------------

run_tests.lua
Simple test runner for PikSend Lightroom Plugin tests

This is a minimal test runner that doesn't require Busted.
For full testing, tests should be run within Lightroom environment.

Usage:
  lua run_tests.lua [test_file.lua]

------------------------------------------------------------------------------]]

-- Simple test framework
local TestRunner = {}
TestRunner.tests = {}
TestRunner.passed = 0
TestRunner.failed = 0
TestRunner.errors = {}

function describe(name, func)
  print("\n" .. name)
  func()
end

function it(name, func)
  local success, err = pcall(func)
  if success then
    TestRunner.passed = TestRunner.passed + 1
    print("  ✓ " .. name)
  else
    TestRunner.failed = TestRunner.failed + 1
    print("  ✗ " .. name)
    print("    Error: " .. tostring(err))
    table.insert(TestRunner.errors, {name = name, error = err})
  end
end

-- Simple assertions
assert = {
  is_true = function(value, message)
    if not value then
      error(message or "Expected true, got false")
    end
  end,
  
  is_false = function(value, message)
    if value then
      error(message or "Expected false, got true")
    end
  end,
  
  equals = function(actual, expected, message)
    if actual ~= expected then
      error(message or string.format("Expected %s, got %s", tostring(expected), tostring(actual)))
    end
  end,
  
  is_nil = function(value, message)
    if value ~= nil then
      error(message or "Expected nil, got " .. tostring(value))
    end
  end,
  
  is_not_nil = function(value, message)
    if value == nil then
      error(message or "Expected non-nil value")
    end
  end,
}

-- Run tests
local function runTests(testFile)
  print("===========================================")
  print("PikSend Lightroom Plugin - Test Runner")
  print("===========================================")
  
  if testFile then
    print("\nRunning: " .. testFile)
    local success, err = pcall(dofile, testFile)
    if not success then
      print("\nError loading test file: " .. tostring(err))
      return 1
    end
  else
    -- Run all test files
    local testFiles = {
      "test_auth_token_storage.lua",
      "test_property_auth_token_storage.lua",
      "test_auth_dialog.lua",
      -- Add more test files here as they are created
    }
    
    for _, file in ipairs(testFiles) do
      local path = "tests/" .. file
      print("\nRunning: " .. path)
      local success, err = pcall(dofile, path)
      if not success then
        print("  Error loading test file: " .. tostring(err))
      end
    end
  end
  
  -- Print summary
  print("\n===========================================")
  print("Test Summary")
  print("===========================================")
  print(string.format("Passed: %d", TestRunner.passed))
  print(string.format("Failed: %d", TestRunner.failed))
  print(string.format("Total:  %d", TestRunner.passed + TestRunner.failed))
  
  if TestRunner.failed > 0 then
    print("\nFailed Tests:")
    for _, err in ipairs(TestRunner.errors) do
      print("  - " .. err.name)
      print("    " .. tostring(err.error))
    end
  end
  
  print("===========================================")
  
  return TestRunner.failed > 0 and 1 or 0
end

-- Main
local testFile = arg[1]
os.exit(runTests(testFile))
