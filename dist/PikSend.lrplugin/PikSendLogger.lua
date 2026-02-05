--[[----------------------------------------------------------------------------

PikSendLogger.lua
Logging system for PikSend plugin

Handles:
- Multi-level logging (ERROR, WARN, INFO, DEBUG)
- Log file management with rotation
- Token sanitization for security
- Debug mode toggle

------------------------------------------------------------------------------]]

local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrDate = import 'LrDate'
local LrPrefs = import 'LrPrefs'

local PikSendLogger = {}

--------------------------------------------------------------------------------
-- Constants
--------------------------------------------------------------------------------

local LOG_LEVELS = {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

local LOG_LEVEL_NAMES = {
  [1] = 'ERROR',
  [2] = 'WARN',
  [3] = 'INFO',
  [4] = 'DEBUG',
}

local MAX_LOG_SIZE = 10 * 1024 * 1024  -- 10 MB
local LOG_FILENAME = 'PikSend.log'

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------

-- Get log file path
-- @return string - Path to log file
function PikSendLogger.getLogPath()
  local pluginPath = _PLUGIN.path
  return LrPathUtils.child(pluginPath, LOG_FILENAME)
end

-- Check if debug mode is enabled
-- @return boolean - true if debug mode is on
function PikSendLogger.isDebugMode()
  local prefs = LrPrefs.prefsForPlugin()
  return prefs.debugMode == true
end

-- Set debug mode
-- @param enabled boolean - Enable or disable debug mode
function PikSendLogger.setDebugMode(enabled)
  local prefs = LrPrefs.prefsForPlugin()
  prefs.debugMode = enabled
end

-- Get current log level
-- @return number - Current log level
local function getCurrentLogLevel()
  if PikSendLogger.isDebugMode() then
    return LOG_LEVELS.DEBUG
  else
    return LOG_LEVELS.INFO
  end
end

--------------------------------------------------------------------------------
-- Log File Management
--------------------------------------------------------------------------------

-- Check log file size and rotate if needed
local function rotateLogIfNeeded()
  local logPath = PikSendLogger.getLogPath()
  
  if LrFileUtils.exists(logPath) then
    local fileSize = LrFileUtils.fileAttributes(logPath).fileSize or 0
    
    if fileSize >= MAX_LOG_SIZE then
      -- Rotate log file
      local backupPath = logPath .. '.old'
      
      -- Delete old backup if exists
      if LrFileUtils.exists(backupPath) then
        LrFileUtils.delete(backupPath)
      end
      
      -- Rename current log to backup
      LrFileUtils.move(logPath, backupPath)
    end
  end
end

--------------------------------------------------------------------------------
-- Message Sanitization
--------------------------------------------------------------------------------

-- Sanitize message to remove sensitive data
-- @param message string - Message to sanitize
-- @return string - Sanitized message
local function sanitizeMessage(message)
  if not message then
    return ''
  end
  
  -- Remove API tokens (Bearer tokens)
  message = string.gsub(message, 'Bearer%s+[%w%-_%.]+', 'Bearer [REDACTED]')
  
  -- Remove tokens in other formats
  message = string.gsub(message, 'token[%s:=]+[%w%-_%.]+', 'token=[REDACTED]')
  message = string.gsub(message, 'apiToken[%s:=]+[%w%-_%.]+', 'apiToken=[REDACTED]')
  
  -- Remove passwords
  message = string.gsub(message, 'password[%s:=]+[^%s,}]+', 'password=[REDACTED]')
  
  return message
end

--------------------------------------------------------------------------------
-- Logging Functions
--------------------------------------------------------------------------------

-- Write log entry
-- @param level number - Log level
-- @param message string - Log message
-- @param module string - Module name (optional)
local function writeLog(level, message, module)
  -- Check if we should log this level
  if level > getCurrentLogLevel() then
    return
  end
  
  -- Rotate log if needed
  rotateLogIfNeeded()
  
  -- Format timestamp
  local timestamp = LrDate.timeToUserFormat(LrDate.currentTime(), '%Y-%m-%d %H:%M:%S')
  
  -- Format log entry
  local levelName = LOG_LEVEL_NAMES[level] or 'UNKNOWN'
  local moduleName = module or 'PikSend'
  local sanitizedMessage = sanitizeMessage(message)
  
  local logEntry = string.format('[%s] [%s] %s: %s\n', 
    timestamp, levelName, moduleName, sanitizedMessage)
  
  -- Write to file
  local logPath = PikSendLogger.getLogPath()
  local file = io.open(logPath, 'a')
  
  if file then
    file:write(logEntry)
    file:close()
  end
end

-- Log error message
-- @param message string - Error message
-- @param module string - Module name (optional)
function PikSendLogger.error(message, module)
  writeLog(LOG_LEVELS.ERROR, message, module)
end

-- Log warning message
-- @param message string - Warning message
-- @param module string - Module name (optional)
function PikSendLogger.warn(message, module)
  writeLog(LOG_LEVELS.WARN, message, module)
end

-- Log info message
-- @param message string - Info message
-- @param module string - Module name (optional)
function PikSendLogger.info(message, module)
  writeLog(LOG_LEVELS.INFO, message, module)
end

-- Log debug message
-- @param message string - Debug message
-- @param module string - Module name (optional)
function PikSendLogger.debug(message, module)
  writeLog(LOG_LEVELS.DEBUG, message, module)
end

--------------------------------------------------------------------------------
-- Log Viewing
--------------------------------------------------------------------------------

-- Read log file contents
-- @param maxLines number - Maximum number of lines to read (optional)
-- @return string - Log file contents
function PikSendLogger.readLog(maxLines)
  local logPath = PikSendLogger.getLogPath()
  
  if not LrFileUtils.exists(logPath) then
    return 'No log file found'
  end
  
  local content = LrFileUtils.readFile(logPath)
  
  if not content then
    return 'Unable to read log file'
  end
  
  -- Limit to last N lines if specified
  if maxLines then
    local lines = {}
    for line in string.gmatch(content, '[^\n]+') do
      table.insert(lines, line)
    end
    
    local startIndex = math.max(1, #lines - maxLines + 1)
    local limitedLines = {}
    for i = startIndex, #lines do
      table.insert(limitedLines, lines[i])
    end
    
    return table.concat(limitedLines, '\n')
  end
  
  return content
end

-- Clear log file
function PikSendLogger.clearLog()
  local logPath = PikSendLogger.getLogPath()
  
  if LrFileUtils.exists(logPath) then
    LrFileUtils.delete(logPath)
  end
  
  PikSendLogger.info('Log file cleared')
end

-- Export log file to user-specified location
-- @param destinationPath string - Destination path for log export
-- @return boolean - true on success
function PikSendLogger.exportLog(destinationPath)
  local logPath = PikSendLogger.getLogPath()
  
  if not LrFileUtils.exists(logPath) then
    return false
  end
  
  local success = pcall(function()
    LrFileUtils.copy(logPath, destinationPath)
  end)
  
  return success
end

--------------------------------------------------------------------------------
-- Initialization
--------------------------------------------------------------------------------

-- Initialize logger
PikSendLogger.info('PikSend plugin initialized')

return PikSendLogger
