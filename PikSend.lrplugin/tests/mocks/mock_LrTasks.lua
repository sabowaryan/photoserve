--[[----------------------------------------------------------------------------

mock_LrTasks.lua
Mock implementation of Lightroom LrTasks module for testing

------------------------------------------------------------------------------]]

local mock_LrTasks = {}

-- Track active tasks for concurrency testing
mock_LrTasks._activeTasks = 0
mock_LrTasks._maxActiveTasks = 0
mock_LrTasks._trackConcurrency = false

-- Mock task object
local MockTask = {}
MockTask.__index = MockTask

function MockTask:new()
  local task = {
    _done = false,
    _result = nil
  }
  setmetatable(task, MockTask)
  return task
end

function MockTask:isDone()
  return self._done
end

function MockTask:waitForCompletion()
  self._done = true
  return self._result
end

function MockTask:cancel()
  self._done = true
end

-- Start an asynchronous task
function mock_LrTasks.startAsyncTask(func)
  local task = MockTask:new()
  
  -- Track concurrency if enabled
  if mock_LrTasks._trackConcurrency then
    mock_LrTasks._activeTasks = mock_LrTasks._activeTasks + 1
    if mock_LrTasks._activeTasks > mock_LrTasks._maxActiveTasks then
      mock_LrTasks._maxActiveTasks = mock_LrTasks._activeTasks
    end
  end
  
  -- Execute function immediately in mock (synchronous for testing)
  local success, result = pcall(func)
  task._result = result
  task._done = true
  
  -- Decrement active tasks
  if mock_LrTasks._trackConcurrency then
    mock_LrTasks._activeTasks = mock_LrTasks._activeTasks - 1
  end
  
  return task
end

-- Sleep for specified seconds
function mock_LrTasks.sleep(seconds)
  -- In mock, we don't actually sleep
  -- Just record that sleep was called
  if not mock_LrTasks._sleepCalls then
    mock_LrTasks._sleepCalls = {}
  end
  table.insert(mock_LrTasks._sleepCalls, seconds)
end

-- Yield to allow other tasks to run
function mock_LrTasks.yield()
  -- No-op in mock
end

-- Reset mock state (for testing)
function mock_LrTasks._reset()
  mock_LrTasks._sleepCalls = {}
  mock_LrTasks._activeTasks = 0
  mock_LrTasks._maxActiveTasks = 0
  mock_LrTasks._trackConcurrency = false
end

-- Enable concurrency tracking
function mock_LrTasks._enableConcurrencyTracking()
  mock_LrTasks._trackConcurrency = true
  mock_LrTasks._activeTasks = 0
  mock_LrTasks._maxActiveTasks = 0
end

-- Get max concurrent tasks observed
function mock_LrTasks._getMaxActiveTasks()
  return mock_LrTasks._maxActiveTasks
end

return mock_LrTasks
