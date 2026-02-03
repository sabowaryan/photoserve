--[[----------------------------------------------------------------------------

test_presets.lua
Unit tests for PikSendPresets module

Tests:
- Saving presets
- Loading presets
- Listing presets
- Deleting presets
- Preset validation
- Default preset creation

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
local mockPrefs = {}

_G.import = function(module)
  if module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        return mockPrefs
      end
    }
  end
  error('Unknown module: ' .. module)
end

-- Load module under test
local PikSendPresets = dofile('PikSendPresets.lua')

--------------------------------------------------------------------------------
-- Test Utilities
--------------------------------------------------------------------------------

local testsPassed = 0
local testsFailed = 0

local function resetPrefs()
  mockPrefs.exportPresets = {}
end

local function assert_true(condition, message)
  if condition then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_false(condition, message)
  if not condition then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_equal(actual, expected, message)
  if actual == expected then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: ' .. tostring(expected))
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_nil(actual, message)
  if actual == nil then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected: nil')
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

local function assert_not_nil(actual, message)
  if actual ~= nil then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    return false
  end
end

local function assert_matches(actual, pattern, message)
  if type(actual) == 'string' and actual:find(pattern) then
    testsPassed = testsPassed + 1
    print('✓ PASS: ' .. message)
    return true
  else
    testsFailed = testsFailed + 1
    print('✗ FAIL: ' .. message)
    print('  Expected to match: ' .. pattern)
    print('  Actual: ' .. tostring(actual))
    return false
  end
end

--------------------------------------------------------------------------------
-- Tests
--------------------------------------------------------------------------------

print('\n=== Testing PikSendPresets ===\n')

-- Test 1: Save a valid preset
print('Test 1: Save a valid preset')
resetPrefs()
local preset = {
  name = 'Test Preset',
  format = 'jpeg',
  jpegQuality = 85,
  resize = {
    enabled = true,
    maxWidth = 1920,
    maxHeight = 1080,
  },
  watermark = {
    enabled = false,
    imagePath = '',
    position = 'bottomRight',
    opacity = 50,
  },
  metadata = {
    includeTitle = true,
    includeDescription = true,
    includeKeywords = true,
    includeCopyright = true,
    includeExif = true,
    includeGPS = false,
  },
}

local success, error = PikSendPresets.savePreset(preset)
assert_true(success, 'Should save valid preset')
assert_nil(error, 'Should not return error')

-- Test 2: Reject preset without name
print('\nTest 2: Reject preset without name')
resetPrefs()
local presetNoName = {
  format = 'jpeg',
  jpegQuality = 85,
}

success, error = PikSendPresets.savePreset(presetNoName)
assert_false(success, 'Should reject preset without name')
assert_not_nil(error, 'Should return error message')
assert_matches(error, 'name', 'Error should mention name')

-- Test 3: Reject preset with empty name
print('\nTest 3: Reject preset with empty name')
resetPrefs()
local presetEmptyName = {
  name = '',
  format = 'jpeg',
  jpegQuality = 85,
}

success, error = PikSendPresets.savePreset(presetEmptyName)
assert_false(success, 'Should reject preset with empty name')
assert_not_nil(error, 'Should return error message')

-- Test 4: Reject preset with invalid format
print('\nTest 4: Reject preset with invalid format')
resetPrefs()
local presetBadFormat = {
  name = 'Test',
  format = 'bmp',
  jpegQuality = 85,
}

success, error = PikSendPresets.savePreset(presetBadFormat)
assert_false(success, 'Should reject invalid format')
assert_matches(error, 'format', 'Error should mention format')

-- Test 5: Reject preset with invalid JPEG quality
print('\nTest 5: Reject preset with invalid JPEG quality')
resetPrefs()
local presetBadQuality = {
  name = 'Test',
  format = 'jpeg',
  jpegQuality = 150,
}

success, error = PikSendPresets.savePreset(presetBadQuality)
assert_false(success, 'Should reject invalid quality')
assert_matches(error, 'quality', 'Error should mention quality')

-- Test 6: Accept all valid formats
print('\nTest 6: Accept all valid formats')
resetPrefs()
local formats = {'jpeg', 'png', 'tiff'}

for _, format in ipairs(formats) do
  local p = {
    name = 'Test ' .. format,
    format = format,
    jpegQuality = 85,
  }
  
  success, error = PikSendPresets.savePreset(p)
  assert_true(success, 'Should accept format: ' .. format)
end

-- Test 7: Load a saved preset
print('\nTest 7: Load a saved preset')
resetPrefs()
local savePreset = {
  name = 'Test Preset',
  format = 'jpeg',
  jpegQuality = 85,
  resize = {
    enabled = true,
    maxWidth = 1920,
    maxHeight = 1080,
  },
}

PikSendPresets.savePreset(savePreset)
local loaded, loadError = PikSendPresets.loadPreset('Test Preset')

assert_not_nil(loaded, 'Should load saved preset')
assert_nil(loadError, 'Should not return error')
assert_equal(loaded.name, 'Test Preset', 'Name should match')
assert_equal(loaded.format, 'jpeg', 'Format should match')
assert_equal(loaded.jpegQuality, 85, 'Quality should match')
assert_true(loaded.resize.enabled, 'Resize enabled should match')
assert_equal(loaded.resize.maxWidth, 1920, 'Max width should match')

-- Test 8: Return error for non-existent preset
print('\nTest 8: Return error for non-existent preset')
resetPrefs()
loaded, loadError = PikSendPresets.loadPreset('Non-existent')

assert_nil(loaded, 'Should not load non-existent preset')
assert_not_nil(loadError, 'Should return error')
assert_matches(loadError, 'not found', 'Error should mention not found')

-- Test 9: List presets
print('\nTest 9: List presets')
resetPrefs()
PikSendPresets.savePreset({name = 'Preset A', format = 'jpeg', jpegQuality = 85})
PikSendPresets.savePreset({name = 'Preset B', format = 'png', jpegQuality = 90})
PikSendPresets.savePreset({name = 'Preset C', format = 'tiff', jpegQuality = 95})

local names = PikSendPresets.listPresets()

assert_equal(#names, 3, 'Should list 3 presets')

-- Test 10: List returns sorted names
print('\nTest 10: List returns sorted names')
resetPrefs()
PikSendPresets.savePreset({name = 'Zebra', format = 'jpeg', jpegQuality = 85})
PikSendPresets.savePreset({name = 'Apple', format = 'png', jpegQuality = 90})
PikSendPresets.savePreset({name = 'Mango', format = 'tiff', jpegQuality = 95})

names = PikSendPresets.listPresets()

assert_equal(names[1], 'Apple', 'First should be Apple')
assert_equal(names[2], 'Mango', 'Second should be Mango')
assert_equal(names[3], 'Zebra', 'Third should be Zebra')

-- Test 11: Delete a preset
print('\nTest 11: Delete a preset')
resetPrefs()
PikSendPresets.savePreset({name = 'Test', format = 'jpeg', jpegQuality = 85})

success, error = PikSendPresets.deletePreset('Test')

assert_true(success, 'Should delete preset')
assert_nil(error, 'Should not return error')

loaded = PikSendPresets.loadPreset('Test')
assert_nil(loaded, 'Preset should be deleted')

-- Test 12: Preset exists check
print('\nTest 12: Preset exists check')
resetPrefs()
PikSendPresets.savePreset({name = 'Test', format = 'jpeg', jpegQuality = 85})

assert_true(PikSendPresets.presetExists('Test'), 'Should find existing preset')
assert_false(PikSendPresets.presetExists('Non-existent'), 'Should not find non-existent preset')

-- Test 13: Create default preset
print('\nTest 13: Create default preset')
local defaultPreset = PikSendPresets.createDefaultPreset('My Preset')

assert_equal(defaultPreset.name, 'My Preset', 'Name should be set')
assert_equal(defaultPreset.format, 'jpeg', 'Should have default format')
assert_equal(defaultPreset.jpegQuality, 90, 'Should have default quality')
assert_not_nil(defaultPreset.resize, 'Should have resize settings')
assert_not_nil(defaultPreset.watermark, 'Should have watermark settings')
assert_not_nil(defaultPreset.metadata, 'Should have metadata settings')

-- Test 14: Default preset is saveable
print('\nTest 14: Default preset is saveable')
resetPrefs()
defaultPreset = PikSendPresets.createDefaultPreset('Test')

success, error = PikSendPresets.savePreset(defaultPreset)

assert_true(success, 'Default preset should be saveable')
assert_nil(error, 'Should not return error')

-- Test 15: Overwrite existing preset
print('\nTest 15: Overwrite existing preset')
resetPrefs()
local preset1 = {name = 'Test', format = 'jpeg', jpegQuality = 85}
local preset2 = {name = 'Test', format = 'png', jpegQuality = 95}

PikSendPresets.savePreset(preset1)
PikSendPresets.savePreset(preset2)

loaded = PikSendPresets.loadPreset('Test')

assert_equal(loaded.format, 'png', 'Should have new format')
assert_equal(loaded.jpegQuality, 95, 'Should have new quality')

-- Test 16: Data isolation (deep copy)
print('\nTest 16: Data isolation (deep copy)')
resetPrefs()
local originalPreset = {
  name = 'Test',
  format = 'jpeg',
  jpegQuality = 85,
  resize = {
    enabled = true,
    maxWidth = 1920,
  },
}

PikSendPresets.savePreset(originalPreset)
loaded = PikSendPresets.loadPreset('Test')

-- Modify loaded preset
loaded.jpegQuality = 50
loaded.resize.maxWidth = 800

-- Load again and verify original values
local loaded2 = PikSendPresets.loadPreset('Test')

assert_equal(loaded2.jpegQuality, 85, 'Quality should be unchanged')
assert_equal(loaded2.resize.maxWidth, 1920, 'Max width should be unchanged')

-- Test 17: Validate export settings - valid JPEG settings
print('\nTest 17: Validate export settings - valid JPEG settings')
local settings = {
  format = 'jpeg',
  jpegQuality = 85,
  fileSize = 100 * 1024 * 1024, -- 100 MB
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept valid JPEG settings')
assert_nil(error, 'Should not return error')

-- Test 18: Validate export settings - valid PNG settings
print('\nTest 18: Validate export settings - valid PNG settings')
settings = {
  format = 'png',
  fileSize = 200 * 1024 * 1024, -- 200 MB
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept valid PNG settings')
assert_nil(error, 'Should not return error')

-- Test 19: Validate export settings - valid TIFF settings
print('\nTest 19: Validate export settings - valid TIFF settings')
settings = {
  format = 'tiff',
  fileSize = 300 * 1024 * 1024, -- 300 MB
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept valid TIFF settings')
assert_nil(error, 'Should not return error')

-- Test 20: Validate export settings - reject missing format
print('\nTest 20: Validate export settings - reject missing format')
settings = {
  jpegQuality = 85,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject missing format')
assert_not_nil(error, 'Should return error message')
assert_matches(error, 'format', 'Error should mention format')

-- Test 21: Validate export settings - reject invalid format
print('\nTest 21: Validate export settings - reject invalid format')
settings = {
  format = 'bmp',
  jpegQuality = 85,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject invalid format')
assert_matches(error, 'format', 'Error should mention format')

-- Test 22: Validate export settings - reject missing JPEG quality
print('\nTest 22: Validate export settings - reject missing JPEG quality')
settings = {
  format = 'jpeg',
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject missing JPEG quality')
assert_matches(error, 'quality', 'Error should mention quality')

-- Test 23: Validate export settings - reject JPEG quality below 1
print('\nTest 23: Validate export settings - reject JPEG quality below 1')
settings = {
  format = 'jpeg',
  jpegQuality = 0,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject quality below 1')
assert_matches(error, 'quality', 'Error should mention quality')

-- Test 24: Validate export settings - reject JPEG quality above 100
print('\nTest 24: Validate export settings - reject JPEG quality above 100')
settings = {
  format = 'jpeg',
  jpegQuality = 101,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject quality above 100')
assert_matches(error, 'quality', 'Error should mention quality')

-- Test 25: Validate export settings - accept JPEG quality at boundary (1)
print('\nTest 25: Validate export settings - accept JPEG quality at boundary (1)')
settings = {
  format = 'jpeg',
  jpegQuality = 1,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept quality at lower boundary')
assert_nil(error, 'Should not return error')

-- Test 26: Validate export settings - accept JPEG quality at boundary (100)
print('\nTest 26: Validate export settings - accept JPEG quality at boundary (100)')
settings = {
  format = 'jpeg',
  jpegQuality = 100,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept quality at upper boundary')
assert_nil(error, 'Should not return error')

-- Test 27: Validate export settings - reject file size over 500 MB
print('\nTest 27: Validate export settings - reject file size over 500 MB')
settings = {
  format = 'jpeg',
  jpegQuality = 85,
  fileSize = 501 * 1024 * 1024, -- 501 MB
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject file size over 500 MB')
assert_matches(error, '500 MB', 'Error should mention 500 MB limit')

-- Test 28: Validate export settings - accept file size at 500 MB boundary
print('\nTest 28: Validate export settings - accept file size at 500 MB boundary')
settings = {
  format = 'jpeg',
  jpegQuality = 85,
  fileSize = 500 * 1024 * 1024, -- Exactly 500 MB
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept file size at 500 MB boundary')
assert_nil(error, 'Should not return error')

-- Test 29: Validate export settings - reject negative file size
print('\nTest 29: Validate export settings - reject negative file size')
settings = {
  format = 'jpeg',
  jpegQuality = 85,
  fileSize = -100,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_false(success, 'Should reject negative file size')
assert_matches(error, 'negative', 'Error should mention negative')

-- Test 30: Validate export settings - accept zero file size
print('\nTest 30: Validate export settings - accept zero file size')
settings = {
  format = 'jpeg',
  jpegQuality = 85,
  fileSize = 0,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept zero file size')
assert_nil(error, 'Should not return error')

-- Test 31: Validate export settings - case insensitive format
print('\nTest 31: Validate export settings - case insensitive format')
settings = {
  format = 'JPEG',
  jpegQuality = 85,
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept uppercase format')
assert_nil(error, 'Should not return error')

-- Test 32: Validate export settings - PNG without JPEG quality
print('\nTest 32: Validate export settings - PNG without JPEG quality')
settings = {
  format = 'png',
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept PNG without JPEG quality')
assert_nil(error, 'Should not return error')

-- Test 33: Validate export settings - TIFF without JPEG quality
print('\nTest 33: Validate export settings - TIFF without JPEG quality')
settings = {
  format = 'tiff',
}

success, error = PikSendPresets.validateExportSettings(settings)
assert_true(success, 'Should accept TIFF without JPEG quality')
assert_nil(error, 'Should not return error')

-- Test 34: Validate export settings - reject nil settings
print('\nTest 34: Validate export settings - reject nil settings')
success, error = PikSendPresets.validateExportSettings(nil)
assert_false(success, 'Should reject nil settings')
assert_not_nil(error, 'Should return error message')

-- Test 35: Validate export settings - reject non-table settings
print('\nTest 35: Validate export settings - reject non-table settings')
success, error = PikSendPresets.validateExportSettings('not a table')
assert_false(success, 'Should reject non-table settings')
assert_not_nil(error, 'Should return error message')

--------------------------------------------------------------------------------
-- Summary
--------------------------------------------------------------------------------

print('\n=== Test Summary ===')
print('Passed: ' .. testsPassed)
print('Failed: ' .. testsFailed)
print('Total: ' .. (testsPassed + testsFailed))

if testsFailed == 0 then
  print('\n✓ All tests passed!')
  os.exit(0)
else
  print('\n✗ Some tests failed')
  os.exit(1)
end
