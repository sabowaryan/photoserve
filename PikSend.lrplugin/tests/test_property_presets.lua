--[[----------------------------------------------------------------------------

test_property_presets.lua
Property-based tests for PikSendPresets export preset management

Tests property-based invariants with minimum 100 iterations per property.

Property Tests:
- Property 14: Round-trip des presets d'export
  For ANY export preset, after saving then loading, the loaded preset must be
  identical to the original
  **Validates: Requirements 4.8**

------------------------------------------------------------------------------]]

-- Setup test environment
package.path = package.path .. ';../?.lua;mocks/?.lua'

-- Mock Lightroom SDK modules
_G.import = function(module)
  if module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        if not _G._testPrefs then
          _G._testPrefs = {}
        end
        return _G._testPrefs
      end
    }
  end
  return {}
end

local PikSendPresets = require('PikSendPresets')

--------------------------------------------------------------------------------
-- Property Test Utilities
--------------------------------------------------------------------------------

local propertiesPassed = 0
local propertiesFailed = 0
local totalIterations = 0
local failedIterations = {}

-- Random string generator for property testing
-- @param minLen number - Minimum length
-- @param maxLen number - Maximum length
-- @return string - Random string
local function generateRandomString(minLen, maxLen)
  local length = math.random(minLen, maxLen)
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-'
  local result = {}
  
  for i = 1, length do
    local randIndex = math.random(1, #chars)
    table.insert(result, string.sub(chars, randIndex, randIndex))
  end
  
  return table.concat(result)
end

-- Generate random preset name
-- @return string - Random preset name
local function generateRandomPresetName()
  local prefixes = {'Quick', 'Pro', 'Web', 'HD', 'Print', 'Social', 'Archive', 'Custom'}
  local suffixes = {'Export', 'Preset', 'Config', 'Settings', 'Profile'}
  
  local prefix = prefixes[math.random(1, #prefixes)]
  local suffix = suffixes[math.random(1, #suffixes)]
  local number = math.random(1, 999)
  
  return prefix .. ' ' .. suffix .. ' ' .. number
end

-- Generate random format
-- @return string - Random format
local function generateRandomFormat()
  local formats = {'jpeg', 'png', 'tiff'}
  return formats[math.random(1, #formats)]
end

-- Generate random JPEG quality
-- @return number - Random JPEG quality (1-100)
local function generateRandomJpegQuality()
  return math.random(1, 100)
end

-- Generate random resize settings
-- @return table - Random resize settings
local function generateRandomResize()
  return {
    enabled = math.random() > 0.5,
    maxWidth = math.random(800, 4000),
    maxHeight = math.random(600, 3000),
  }
end

-- Generate random watermark position
-- @return string - Random watermark position
local function generateRandomWatermarkPosition()
  local positions = {'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'}
  return positions[math.random(1, #positions)]
end

-- Generate random watermark settings
-- @return table - Random watermark settings
local function generateRandomWatermark()
  return {
    enabled = math.random() > 0.5,
    imagePath = '/path/to/watermark' .. math.random(1, 100) .. '.png',
    position = generateRandomWatermarkPosition(),
    opacity = math.random(0, 100),
  }
end

-- Generate random metadata settings
-- @return table - Random metadata settings
local function generateRandomMetadata()
  return {
    includeTitle = math.random() > 0.5,
    includeDescription = math.random() > 0.5,
    includeKeywords = math.random() > 0.5,
    includeCopyright = math.random() > 0.5,
    includeExif = math.random() > 0.5,
    includeGPS = math.random() > 0.5,
  }
end

-- Generate random preset
-- @return table - Random preset configuration
local function generateRandomPreset()
  return {
    name = generateRandomPresetName(),
    format = generateRandomFormat(),
    jpegQuality = generateRandomJpegQuality(),
    resize = generateRandomResize(),
    watermark = generateRandomWatermark(),
    metadata = generateRandomMetadata(),
  }
end

-- Deep equality comparison for tables
-- @param t1 table - First table
-- @param t2 table - Second table
-- @return boolean - true if tables are deeply equal
local function deepEqual(t1, t2)
  if t1 == t2 then return true end
  
  local type1 = type(t1)
  local type2 = type(t2)
  
  if type1 ~= type2 then return false end
  if type1 ~= 'table' then return t1 == t2 end
  
  -- Check all keys in t1
  for k, v in pairs(t1) do
    if not deepEqual(v, t2[k]) then
      return false
    end
  end
  
  -- Check all keys in t2
  for k, v in pairs(t2) do
    if not deepEqual(t1[k], v) then
      return false
    end
  end
  
  return true
end

-- Format table for display
-- @param t table - Table to format
-- @param indent number - Indentation level
-- @return string - Formatted table
local function formatTable(t, indent)
  indent = indent or 0
  local indentStr = string.rep('  ', indent)
  local result = {}
  
  if type(t) ~= 'table' then
    return tostring(t)
  end
  
  table.insert(result, '{')
  for k, v in pairs(t) do
    if type(v) == 'table' then
      table.insert(result, indentStr .. '  ' .. tostring(k) .. ' = ' .. formatTable(v, indent + 1))
    else
      table.insert(result, indentStr .. '  ' .. tostring(k) .. ' = ' .. tostring(v))
    end
  end
  table.insert(result, indentStr .. '}')
  
  return table.concat(result, '\n')
end

-- Run a property test with multiple iterations
-- @param propertyName string - Name of the property being tested
-- @param propertyNumber number - Property number from design doc
-- @param iterations number - Number of iterations to run
-- @param testFunc function - Test function that returns (success, message)
local function runPropertyTest(propertyName, propertyNumber, iterations, testFunc)
  print('\n=== Property ' .. propertyNumber .. ': ' .. propertyName .. ' ===')
  print('Running ' .. iterations .. ' iterations...\n')
  
  local passed = 0
  local failed = 0
  local failures = {}
  
  for i = 1, iterations do
    local success, message, testData = testFunc(i)
    totalIterations = totalIterations + 1
    
    if success then
      passed = passed + 1
    else
      failed = failed + 1
      table.insert(failures, {
        iteration = i,
        message = message,
        data = testData
      })
      
      -- Print first few failures for debugging
      if failed <= 3 then
        print('✗ Iteration ' .. i .. ' FAILED: ' .. message)
        if testData then
          print('  Test data: ' .. testData)
        end
      end
    end
  end
  
  -- Print summary for this property
  print('\nProperty ' .. propertyNumber .. ' Results:')
  print('  Passed: ' .. passed .. '/' .. iterations)
  print('  Failed: ' .. failed .. '/' .. iterations)
  
  if failed == 0 then
    print('  ✓ PROPERTY HOLDS')
    propertiesPassed = propertiesPassed + 1
    return true
  else
    print('  ✗ PROPERTY VIOLATED')
    propertiesFailed = propertiesFailed + 1
    
    -- Store failures for final report
    table.insert(failedIterations, {
      property = propertyNumber,
      name = propertyName,
      failures = failures
    })
    
    return false
  end
end

--------------------------------------------------------------------------------
-- Property Tests
--------------------------------------------------------------------------------

print('\n╔════════════════════════════════════════════════════════════════╗')
print('║  Property-Based Tests: PikSendPresets Export Presets          ║')
print('║  Feature: lightroom-plugin                                     ║')
print('╚════════════════════════════════════════════════════════════════╝')

-- Seed random number generator for reproducibility
math.randomseed(os.time())

--------------------------------------------------------------------------------
-- Property 14: Round-trip des presets d'export
-- **Validates: Requirements 4.8**
--
-- For ANY export preset, after saving then loading, the loaded preset must be
-- identical to the original
--------------------------------------------------------------------------------

-- Property 14.1: Basic round-trip preservation
runPropertyTest(
  'Basic round-trip preservation of preset data',
  14.1,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Generate random preset
    local originalPreset = generateRandomPreset()
    
    -- Save preset
    local saveSuccess, saveError = PikSendPresets.savePreset(originalPreset)
    
    if not saveSuccess then
      return false,
             'Failed to save preset: ' .. tostring(saveError),
             'Preset name: ' .. originalPreset.name
    end
    
    -- Load preset
    local loadedPreset, loadError = PikSendPresets.loadPreset(originalPreset.name)
    
    if not loadedPreset then
      return false,
             'Failed to load preset: ' .. tostring(loadError),
             'Preset name: ' .. originalPreset.name
    end
    
    -- Compare original and loaded
    if deepEqual(originalPreset, loadedPreset) then
      return true, 'Round-trip preserved all data'
    else
      return false,
             'Round-trip did not preserve all data',
             'Original:\n' .. formatTable(originalPreset) .. '\n\nLoaded:\n' .. formatTable(loadedPreset)
    end
  end
)

-- Property 14.2: Round-trip preserves all format types
runPropertyTest(
  'Round-trip preserves all format types',
  14.2,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Test each format type
    local formats = {'jpeg', 'png', 'tiff'}
    local format = formats[((iteration - 1) % #formats) + 1]
    
    local preset = {
      name = 'Format Test ' .. iteration,
      format = format,
      jpegQuality = 85,
      resize = { enabled = false, maxWidth = 1920, maxHeight = 1080 },
      watermark = { enabled = false, imagePath = '', position = 'center', opacity = 50 },
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and loaded.format == format then
      return true, 'Format preserved: ' .. format
    else
      return false,
             'Format not preserved',
             'Expected: ' .. format .. ', Got: ' .. tostring(loaded and loaded.format or 'nil')
    end
  end
)

-- Property 14.3: Round-trip preserves JPEG quality values
runPropertyTest(
  'Round-trip preserves JPEG quality values',
  14.3,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Test various quality values
    local quality = math.random(1, 100)
    
    local preset = {
      name = 'Quality Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = quality,
      resize = { enabled = false, maxWidth = 1920, maxHeight = 1080 },
      watermark = { enabled = false, imagePath = '', position = 'center', opacity = 50 },
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and loaded.jpegQuality == quality then
      return true, 'JPEG quality preserved: ' .. quality
    else
      return false,
             'JPEG quality not preserved',
             'Expected: ' .. quality .. ', Got: ' .. tostring(loaded and loaded.jpegQuality or 'nil')
    end
  end
)

-- Property 14.4: Round-trip preserves resize settings
runPropertyTest(
  'Round-trip preserves resize settings',
  14.4,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    local preset = {
      name = 'Resize Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = 90,
      resize = generateRandomResize(),
      watermark = { enabled = false, imagePath = '', position = 'center', opacity = 50 },
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and deepEqual(preset.resize, loaded.resize) then
      return true, 'Resize settings preserved'
    else
      return false,
             'Resize settings not preserved',
             'Original:\n' .. formatTable(preset.resize) .. '\n\nLoaded:\n' .. formatTable(loaded and loaded.resize or {})
    end
  end
)

-- Property 14.5: Round-trip preserves watermark settings
runPropertyTest(
  'Round-trip preserves watermark settings',
  14.5,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    local preset = {
      name = 'Watermark Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = 90,
      resize = { enabled = false, maxWidth = 1920, maxHeight = 1080 },
      watermark = generateRandomWatermark(),
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and deepEqual(preset.watermark, loaded.watermark) then
      return true, 'Watermark settings preserved'
    else
      return false,
             'Watermark settings not preserved',
             'Original:\n' .. formatTable(preset.watermark) .. '\n\nLoaded:\n' .. formatTable(loaded and loaded.watermark or {})
    end
  end
)

-- Property 14.6: Round-trip preserves metadata settings
runPropertyTest(
  'Round-trip preserves metadata settings',
  14.6,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    local preset = {
      name = 'Metadata Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = 90,
      resize = { enabled = false, maxWidth = 1920, maxHeight = 1080 },
      watermark = { enabled = false, imagePath = '', position = 'center', opacity = 50 },
      metadata = generateRandomMetadata(),
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and deepEqual(preset.metadata, loaded.metadata) then
      return true, 'Metadata settings preserved'
    else
      return false,
             'Metadata settings not preserved',
             'Original:\n' .. formatTable(preset.metadata) .. '\n\nLoaded:\n' .. formatTable(loaded and loaded.metadata or {})
    end
  end
)

-- Property 14.7: Round-trip preserves all watermark positions
runPropertyTest(
  'Round-trip preserves all watermark positions',
  14.7,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Test each position
    local positions = {'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'}
    local position = positions[((iteration - 1) % #positions) + 1]
    
    local preset = {
      name = 'Position Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = 90,
      resize = { enabled = false, maxWidth = 1920, maxHeight = 1080 },
      watermark = {
        enabled = true,
        imagePath = '/path/to/watermark.png',
        position = position,
        opacity = 75,
      },
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and loaded.watermark.position == position then
      return true, 'Watermark position preserved: ' .. position
    else
      return false,
             'Watermark position not preserved',
             'Expected: ' .. position .. ', Got: ' .. tostring(loaded and loaded.watermark.position or 'nil')
    end
  end
)

-- Property 14.8: Multiple presets can coexist without interference
runPropertyTest(
  'Multiple presets can coexist without interference',
  14.8,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Create multiple presets
    local numPresets = math.random(3, 10)
    local presets = {}
    
    for i = 1, numPresets do
      local preset = generateRandomPreset()
      preset.name = 'Multi Test ' .. iteration .. ' - ' .. i
      table.insert(presets, preset)
      
      -- Save preset
      local success, error = PikSendPresets.savePreset(preset)
      if not success then
        return false,
               'Failed to save preset ' .. i .. ': ' .. tostring(error),
               'Preset name: ' .. preset.name
      end
    end
    
    -- Load and verify all presets
    for i, originalPreset in ipairs(presets) do
      local loaded, error = PikSendPresets.loadPreset(originalPreset.name)
      
      if not loaded then
        return false,
               'Failed to load preset ' .. i .. ': ' .. tostring(error),
               'Preset name: ' .. originalPreset.name
      end
      
      if not deepEqual(originalPreset, loaded) then
        return false,
               'Preset ' .. i .. ' was corrupted by other presets',
               'Preset name: ' .. originalPreset.name
      end
    end
    
    return true, 'All ' .. numPresets .. ' presets coexist correctly'
  end
)

-- Property 14.9: Round-trip preserves boolean flags correctly
runPropertyTest(
  'Round-trip preserves boolean flags correctly',
  14.9,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Test all combinations of boolean flags
    local preset = {
      name = 'Boolean Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = 90,
      resize = {
        enabled = math.random() > 0.5,
        maxWidth = 1920,
        maxHeight = 1080,
      },
      watermark = {
        enabled = math.random() > 0.5,
        imagePath = '/path/to/watermark.png',
        position = 'center',
        opacity = 50,
      },
      metadata = {
        includeTitle = math.random() > 0.5,
        includeDescription = math.random() > 0.5,
        includeKeywords = math.random() > 0.5,
        includeCopyright = math.random() > 0.5,
        includeExif = math.random() > 0.5,
        includeGPS = math.random() > 0.5,
      },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    -- Check all boolean flags
    if loaded then
      if preset.resize.enabled ~= loaded.resize.enabled then
        return false, 'resize.enabled not preserved', 'Expected: ' .. tostring(preset.resize.enabled)
      end
      if preset.watermark.enabled ~= loaded.watermark.enabled then
        return false, 'watermark.enabled not preserved', 'Expected: ' .. tostring(preset.watermark.enabled)
      end
      for key, value in pairs(preset.metadata) do
        if value ~= loaded.metadata[key] then
          return false, 'metadata.' .. key .. ' not preserved', 'Expected: ' .. tostring(value)
        end
      end
      return true, 'All boolean flags preserved'
    else
      return false, 'Failed to load preset', 'Preset name: ' .. preset.name
    end
  end
)

-- Property 14.10: Round-trip preserves numeric boundary values
runPropertyTest(
  'Round-trip preserves numeric boundary values',
  14.10,
  100,
  function(iteration)
    -- Reset test environment
    _G._testPrefs = {}
    
    -- Test boundary values
    local boundaryTests = {
      { jpegQuality = 1, opacity = 0 },
      { jpegQuality = 100, opacity = 100 },
      { jpegQuality = 50, opacity = 50 },
    }
    
    local test = boundaryTests[((iteration - 1) % #boundaryTests) + 1]
    
    local preset = {
      name = 'Boundary Test ' .. iteration,
      format = 'jpeg',
      jpegQuality = test.jpegQuality,
      resize = { enabled = false, maxWidth = 1, maxHeight = 1 },
      watermark = {
        enabled = true,
        imagePath = '/path/to/watermark.png',
        position = 'center',
        opacity = test.opacity,
      },
      metadata = { includeTitle = true, includeDescription = true, includeKeywords = true,
                   includeCopyright = true, includeExif = true, includeGPS = false },
    }
    
    -- Save and load
    PikSendPresets.savePreset(preset)
    local loaded, _ = PikSendPresets.loadPreset(preset.name)
    
    if loaded and loaded.jpegQuality == test.jpegQuality and loaded.watermark.opacity == test.opacity then
      return true, 'Boundary values preserved'
    else
      return false,
             'Boundary values not preserved',
             'Expected quality: ' .. test.jpegQuality .. ', opacity: ' .. test.opacity
    end
  end
)

--------------------------------------------------------------------------------
-- Property 15: Validation de la taille maximale
-- **Validates: Requirements 4.10**
--
-- For ANY file, the validation must reject files > 500 MB and accept files <= 500 MB
--------------------------------------------------------------------------------

-- Property 15.1: Files at or below 500 MB are accepted
runPropertyTest(
  'Files at or below 500 MB are accepted',
  15.1,
  100,
  function(iteration)
    -- Generate random file size between 0 and 500 MB
    local maxSize = 500 * 1024 * 1024 -- 500 MB in bytes
    local fileSize = math.random(0, maxSize)
    
    local settings = {
      format = 'jpeg',
      jpegQuality = math.random(1, 100),
      fileSize = fileSize,
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if valid then
      return true, 'File size ' .. fileSize .. ' bytes accepted'
    else
      return false,
             'File size ' .. fileSize .. ' bytes rejected but should be accepted',
             'Error: ' .. tostring(error)
    end
  end
)

-- Property 15.2: Files above 500 MB are rejected
runPropertyTest(
  'Files above 500 MB are rejected',
  15.2,
  100,
  function(iteration)
    -- Generate random file size above 500 MB
    local minSize = 500 * 1024 * 1024 + 1 -- Just over 500 MB
    local maxSize = 1000 * 1024 * 1024 -- Up to 1 GB
    local fileSize = math.random(minSize, maxSize)
    
    local settings = {
      format = 'jpeg',
      jpegQuality = math.random(1, 100),
      fileSize = fileSize,
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if not valid then
      -- Check that error message mentions the limit
      if error and error:find('500 MB') then
        return true, 'File size ' .. fileSize .. ' bytes correctly rejected'
      else
        return false,
               'File size rejected but error message does not mention 500 MB limit',
               'Error: ' .. tostring(error)
      end
    else
      return false,
             'File size ' .. fileSize .. ' bytes accepted but should be rejected',
             'File size exceeds 500 MB limit'
    end
  end
)

-- Property 15.3: Boundary value at exactly 500 MB is accepted
runPropertyTest(
  'Boundary value at exactly 500 MB is accepted',
  15.3,
  100,
  function(iteration)
    local fileSize = 500 * 1024 * 1024 -- Exactly 500 MB
    
    local settings = {
      format = 'jpeg',
      jpegQuality = math.random(1, 100),
      fileSize = fileSize,
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if valid then
      return true, 'Boundary value 500 MB accepted'
    else
      return false,
             'Boundary value 500 MB rejected but should be accepted',
             'Error: ' .. tostring(error)
    end
  end
)

-- Property 15.4: All valid formats are accepted with valid file sizes
runPropertyTest(
  'All valid formats are accepted with valid file sizes',
  15.4,
  100,
  function(iteration)
    local formats = {'jpeg', 'png', 'tiff', 'JPEG', 'PNG', 'TIFF'}
    local format = formats[math.random(1, #formats)]
    local fileSize = math.random(0, 500 * 1024 * 1024)
    
    local settings = {
      format = format,
      fileSize = fileSize,
    }
    
    -- Add JPEG quality if format is JPEG
    if format:lower() == 'jpeg' then
      settings.jpegQuality = math.random(1, 100)
    end
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if valid then
      return true, 'Format ' .. format .. ' with size ' .. fileSize .. ' accepted'
    else
      return false,
             'Valid format and size rejected',
             'Format: ' .. format .. ', Size: ' .. fileSize .. ', Error: ' .. tostring(error)
    end
  end
)

-- Property 15.5: Invalid formats are rejected regardless of file size
runPropertyTest(
  'Invalid formats are rejected regardless of file size',
  15.5,
  100,
  function(iteration)
    local invalidFormats = {'bmp', 'gif', 'webp', 'raw', 'psd', 'svg', 'pdf'}
    local format = invalidFormats[math.random(1, #invalidFormats)]
    local fileSize = math.random(0, 500 * 1024 * 1024)
    
    local settings = {
      format = format,
      jpegQuality = 85,
      fileSize = fileSize,
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if not valid then
      -- Check that error message mentions format
      if error and error:find('format') then
        return true, 'Invalid format ' .. format .. ' correctly rejected'
      else
        return false,
               'Invalid format rejected but error message does not mention format',
               'Error: ' .. tostring(error)
      end
    else
      return false,
             'Invalid format ' .. format .. ' accepted but should be rejected',
             'Only jpeg, png, tiff are valid'
    end
  end
)

-- Property 15.6: JPEG quality must be between 1 and 100
runPropertyTest(
  'JPEG quality must be between 1 and 100',
  15.6,
  100,
  function(iteration)
    -- Test both valid and invalid quality values
    local quality
    local shouldBeValid
    
    if iteration % 2 == 0 then
      -- Valid quality
      quality = math.random(1, 100)
      shouldBeValid = true
    else
      -- Invalid quality (outside 1-100 range)
      if math.random() > 0.5 then
        quality = math.random(-100, 0) -- Below 1
      else
        quality = math.random(101, 200) -- Above 100
      end
      shouldBeValid = false
    end
    
    local settings = {
      format = 'jpeg',
      jpegQuality = quality,
      fileSize = math.random(0, 500 * 1024 * 1024),
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if shouldBeValid then
      if valid then
        return true, 'Valid JPEG quality ' .. quality .. ' accepted'
      else
        return false,
               'Valid JPEG quality ' .. quality .. ' rejected',
               'Error: ' .. tostring(error)
      end
    else
      if not valid then
        if error and error:find('quality') then
          return true, 'Invalid JPEG quality ' .. quality .. ' correctly rejected'
        else
          return false,
                 'Invalid quality rejected but error does not mention quality',
                 'Error: ' .. tostring(error)
        end
      else
        return false,
               'Invalid JPEG quality ' .. quality .. ' accepted but should be rejected',
               'Quality must be between 1 and 100'
      end
    end
  end
)

-- Property 15.7: PNG and TIFF do not require JPEG quality
runPropertyTest(
  'PNG and TIFF do not require JPEG quality',
  15.7,
  100,
  function(iteration)
    local formats = {'png', 'tiff', 'PNG', 'TIFF'}
    local format = formats[math.random(1, #formats)]
    
    local settings = {
      format = format,
      fileSize = math.random(0, 500 * 1024 * 1024),
      -- Intentionally omit jpegQuality
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if valid then
      return true, 'Format ' .. format .. ' accepted without JPEG quality'
    else
      return false,
             'Format ' .. format .. ' rejected without JPEG quality',
             'Error: ' .. tostring(error)
    end
  end
)

-- Property 15.8: JPEG format requires JPEG quality
runPropertyTest(
  'JPEG format requires JPEG quality',
  15.8,
  100,
  function(iteration)
    local settings = {
      format = 'jpeg',
      fileSize = math.random(0, 500 * 1024 * 1024),
      -- Intentionally omit jpegQuality
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if not valid then
      if error and error:find('quality') then
        return true, 'JPEG without quality correctly rejected'
      else
        return false,
               'JPEG rejected but error does not mention quality',
               'Error: ' .. tostring(error)
      end
    else
      return false,
             'JPEG without quality accepted but should be rejected',
             'JPEG format requires jpegQuality parameter'
    end
  end
)

-- Property 15.9: Validation handles missing format parameter
runPropertyTest(
  'Validation handles missing format parameter',
  15.9,
  100,
  function(iteration)
    local settings = {
      jpegQuality = math.random(1, 100),
      fileSize = math.random(0, 500 * 1024 * 1024),
      -- Intentionally omit format
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if not valid then
      if error and error:find('format') then
        return true, 'Missing format correctly rejected'
      else
        return false,
               'Missing format rejected but error does not mention format',
               'Error: ' .. tostring(error)
      end
    else
      return false,
             'Missing format accepted but should be rejected',
             'Format parameter is required'
    end
  end
)

-- Property 15.10: Validation handles negative file sizes
runPropertyTest(
  'Validation handles negative file sizes',
  15.10,
  100,
  function(iteration)
    local fileSize = -math.random(1, 1000000)
    
    local settings = {
      format = 'jpeg',
      jpegQuality = math.random(1, 100),
      fileSize = fileSize,
    }
    
    local valid, error = PikSendPresets.validateExportSettings(settings)
    
    if not valid then
      if error and error:find('negative') then
        return true, 'Negative file size correctly rejected'
      else
        return false,
               'Negative file size rejected but error does not mention negative',
               'Error: ' .. tostring(error)
      end
    else
      return false,
             'Negative file size accepted but should be rejected',
             'File size cannot be negative'
    end
  end
)

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n╔════════════════════════════════════════════════════════════════╗')
print('║  Property-Based Test Summary                                   ║')
print('╚════════════════════════════════════════════════════════════════╝')
print('\nProperties Tested: ' .. (propertiesPassed + propertiesFailed))
print('Properties Passed: ' .. propertiesPassed)
print('Properties Failed: ' .. propertiesFailed)
print('Total Iterations:  ' .. totalIterations)

if propertiesFailed > 0 then
  print('\n╔════════════════════════════════════════════════════════════════╗')
  print('║  Failed Properties Details                                     ║')
  print('╚════════════════════════════════════════════════════════════════╝')
  
  for _, failure in ipairs(failedIterations) do
    print('\nProperty ' .. failure.property .. ': ' .. failure.name)
    print('Failed iterations: ' .. #failure.failures)
    print('Sample failures:')
    
    for i = 1, math.min(3, #failure.failures) do
      local f = failure.failures[i]
      print('  Iteration ' .. f.iteration .. ': ' .. f.message)
      if f.data then
        print('    ' .. f.data)
      end
    end
  end
end

print('\n╔════════════════════════════════════════════════════════════════╗')

if propertiesFailed == 0 then
  print('║  ✓ ALL PROPERTIES HOLD - Tests Passed!                        ║')
  print('╚════════════════════════════════════════════════════════════════╝\n')
  os.exit(0)
else
  print('║  ✗ SOME PROPERTIES VIOLATED - Tests Failed!                   ║')
  print('╚════════════════════════════════════════════════════════════════╝\n')
  os.exit(1)
end
