--[[----------------------------------------------------------------------------

test_property_metadata.lua
Property-based tests for metadata extraction and management

Tests the following properties:
- Property 34: Transfert complet des métadonnées
- Property 35: Respect de la confidentialité de la géolocalisation
- Property 36: Génération d'alt-text
- Property 37: Application des métadonnées par défaut

**Validates: Requirements 8.1-8.5, 8.7, 8.8, 8.9**

------------------------------------------------------------------------------]]

-- Mock Lightroom SDK
_G.import = function(module)
  return {}
end

-- Load mocks
local MockLrPhoto = require('tests/mocks/mock_LrPhoto')

-- Load the module under test
local PikSendMetadata = require 'PikSendMetadata'

--------------------------------------------------------------------------------
-- Helper Functions
--------------------------------------------------------------------------------

-- Generate random string
local function generateRandomString(length)
  if length <= 0 then return '' end
  
  local chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
  local result = {}
  
  for i = 1, length do
    local idx = math.random(1, #chars)
    table.insert(result, chars:sub(idx, idx))
  end
  
  return table.concat(result)
end

-- Count non-nil fields in a table
local function countFields(tbl)
  if not tbl then return 0 end
  local count = 0
  for k, v in pairs(tbl) do
    if v ~= nil and v ~= '' then
      count = count + 1
    end
  end
  return count
end

--------------------------------------------------------------------------------
-- Property 34: Transfert complet des métadonnées
-- **Validates: Requirements 8.1-8.5**
--------------------------------------------------------------------------------

print('\n=== Property 34: Transfert complet des métadonnées ===')
print('Testing that all enabled metadata fields are included in extraction\n')

local MIN_ITERATIONS = 100
local passCount = 0
local failCount = 0

for i = 1, MIN_ITERATIONS do
  -- Create a photo with all metadata fields
  local photo = MockLrPhoto.new({
    title = 'Test Photo ' .. i,
    caption = 'Test description ' .. i,
    keywordTags = {'keyword1', 'keyword2', 'keyword3'},
    copyright = 'Copyright 2024',
    cameraMake = 'Canon',
    cameraModel = 'EOS R5',
    lens = 'RF 24-70mm',
    isoSpeedRating = 400,
    aperture = 2.8,
    shutterSpeed = '1/1000',
    focalLength = '50 mm',
    dateTimeOriginal = '2024-01-15',
    raw = {
      gps = {
        latitude = 48.8566,
        longitude = 2.3522,
      }
    }
  })
  
  -- Test with all metadata enabled
  local settings = {
    metadata = {
      includeTitle = true,
      includeDescription = true,
      includeKeywords = true,
      includeCopyright = true,
      includeExif = true,
      includeGPS = true,
    }
  }
  
  local metadata = PikSendMetadata.extractMetadata(photo, settings)
  
  -- Verify all fields are present
  local allPresent = true
  local missingFields = {}
  
  if not metadata.title then
    allPresent = false
    table.insert(missingFields, 'title')
  end
  
  if not metadata.description then
    allPresent = false
    table.insert(missingFields, 'description')
  end
  
  if not metadata.keywords or #metadata.keywords == 0 then
    allPresent = false
    table.insert(missingFields, 'keywords')
  end
  
  if not metadata.copyright then
    allPresent = false
    table.insert(missingFields, 'copyright')
  end
  
  if not metadata.exif or countFields(metadata.exif) == 0 then
    allPresent = false
    table.insert(missingFields, 'exif')
  end
  
  if not metadata.gps then
    allPresent = false
    table.insert(missingFields, 'gps')
  end
  
  if allPresent then
    passCount = passCount + 1
  else
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Missing fields: %s', 
      i, table.concat(missingFields, ', ')))
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: All metadata fields transferred correctly')
end

--------------------------------------------------------------------------------
-- Property 35: Respect de la confidentialité de la géolocalisation
-- **Validates: Requirements 8.7**
--------------------------------------------------------------------------------

print('\n=== Property 35: Respect de la confidentialité de la géolocalisation ===')
print('Testing that GPS data is only included when explicitly enabled\n')

passCount = 0
failCount = 0

for i = 1, MIN_ITERATIONS do
  -- Create a photo with GPS data
  local photo = MockLrPhoto.new({
    title = 'Test Photo',
    raw = {
      gps = {
        latitude = (math.random() * 180) - 90,
        longitude = (math.random() * 360) - 180,
      }
    }
  })
  
  -- Test with GPS disabled (default)
  local settingsDisabled = {
    metadata = {
      includeGPS = false,
    }
  }
  
  local metadataDisabled = PikSendMetadata.extractMetadata(photo, settingsDisabled)
  
  -- GPS should NOT be present
  if metadataDisabled.gps then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: GPS present when disabled', i))
  else
    passCount = passCount + 1
  end
  
  -- Test with GPS enabled
  local settingsEnabled = {
    metadata = {
      includeGPS = true,
    }
  }
  
  local metadataEnabled = PikSendMetadata.extractMetadata(photo, settingsEnabled)
  
  -- GPS SHOULD be present
  if not metadataEnabled.gps then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: GPS missing when enabled', i))
  else
    passCount = passCount + 1
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS * 2))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: GPS privacy settings respected')
end

--------------------------------------------------------------------------------
-- Property 36: Génération d'alt-text
-- **Validates: Requirements 8.8**
--------------------------------------------------------------------------------

print('\n=== Property 36: Génération d\'alt-text ===')
print('Testing that alt-text is generated from title and description\n')

passCount = 0
failCount = 0

for i = 1, MIN_ITERATIONS do
  local hasTitle = math.random() > 0.5
  local hasDescription = math.random() > 0.5
  
  local title = hasTitle and ('Title ' .. i) or nil
  local description = hasDescription and ('Description ' .. i) or nil
  
  local altText = PikSendMetadata.generateAltText(title, description)
  
  -- Alt-text should never be nil or empty
  if not altText or altText == '' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Alt-text is empty', i))
  else
    passCount = passCount + 1
    
    -- If title is present, it should be in alt-text
    if title and not string.find(altText, title, 1, true) then
      failCount = failCount + 1
      print(string.format('❌ FAILED iteration %d: Title not in alt-text', i))
    end
    
    -- If description is present, it should be in alt-text (or truncated version)
    if description then
      local descStart = description:sub(1, 50)
      if not string.find(altText, descStart, 1, true) then
        failCount = failCount + 1
        print(string.format('❌ FAILED iteration %d: Description not in alt-text', i))
      end
    end
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: Alt-text generated correctly')
end

--------------------------------------------------------------------------------
-- Property 37: Application des métadonnées par défaut
-- **Validates: Requirements 8.9**
--------------------------------------------------------------------------------

print('\n=== Property 37: Application des métadonnées par défaut ===')
print('Testing that default metadata is applied to photos without it\n')

passCount = 0
failCount = 0

for i = 1, MIN_ITERATIONS do
  -- Create metadata with some missing fields
  local metadata = {}
  
  local hasTitle = math.random() > 0.5
  local hasDescription = math.random() > 0.5
  local hasCopyright = math.random() > 0.5
  
  if hasTitle then
    metadata.title = 'Original Title'
  end
  
  if hasDescription then
    metadata.description = 'Original Description'
  end
  
  if hasCopyright then
    metadata.copyright = 'Original Copyright'
  end
  
  -- Define defaults
  local defaults = {
    title = 'Default Title',
    description = 'Default Description',
    copyright = 'Default Copyright',
    keywords = {'default', 'keywords'},
  }
  
  -- Apply defaults
  local result = PikSendMetadata.applyDefaultMetadata(metadata, defaults)
  
  -- Verify that original values are preserved
  if hasTitle and result.title ~= 'Original Title' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Original title overwritten', i))
  elseif not hasTitle and result.title ~= 'Default Title' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Default title not applied', i))
  else
    passCount = passCount + 1
  end
  
  if hasDescription and result.description ~= 'Original Description' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Original description overwritten', i))
  elseif not hasDescription and result.description ~= 'Default Description' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Default description not applied', i))
  else
    passCount = passCount + 1
  end
  
  if hasCopyright and result.copyright ~= 'Original Copyright' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Original copyright overwritten', i))
  elseif not hasCopyright and result.copyright ~= 'Default Copyright' then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Default copyright not applied', i))
  else
    passCount = passCount + 1
  end
  
  -- Keywords should always be applied if missing
  if not metadata.keywords and not result.keywords then
    failCount = failCount + 1
    print(string.format('❌ FAILED iteration %d: Default keywords not applied', i))
  else
    passCount = passCount + 1
  end
end

print(string.format('\nResults: %d/%d tests passed', passCount, MIN_ITERATIONS * 4))

if failCount > 0 then
  print(string.format('❌ FAILED: %d tests failed', failCount))
  os.exit(1)
else
  print('✅ PASSED: Default metadata applied correctly')
end

--------------------------------------------------------------------------------
-- Edge Cases
--------------------------------------------------------------------------------

print('\n=== Testing Edge Cases ===\n')

-- Test with nil photo
print('Test: extractMetadata with nil settings should use defaults')
local photo = MockLrPhoto.new({
  title = 'Test',
  caption = 'Description',
})
local metadata = PikSendMetadata.extractMetadata(photo, nil)
if metadata.title and metadata.description then
  print('✅ PASSED: nil settings handled correctly')
else
  print('❌ FAILED: nil settings not handled correctly')
  os.exit(1)
end

-- Test with empty settings
print('Test: extractMetadata with empty settings should include metadata')
metadata = PikSendMetadata.extractMetadata(photo, {})
if metadata.title and metadata.description then
  print('✅ PASSED: empty settings handled correctly')
else
  print('❌ FAILED: empty settings not handled correctly')
  os.exit(1)
end

-- Test alt-text with very long description
print('Test: generateAltText should truncate long descriptions')
local longDesc = generateRandomString(500)
local altText = PikSendMetadata.generateAltText('Title', longDesc)
if #altText < #longDesc then
  print('✅ PASSED: long description truncated')
else
  print('❌ FAILED: long description not truncated')
  os.exit(1)
end

-- Test alt-text with no title or description
print('Test: generateAltText with no title/description should return default')
altText = PikSendMetadata.generateAltText(nil, nil)
if altText and altText ~= '' then
  print('✅ PASSED: default alt-text returned')
else
  print('❌ FAILED: no default alt-text')
  os.exit(1)
end

-- Test applyDefaultMetadata with nil defaults
print('Test: applyDefaultMetadata with nil defaults should return original')
local original = { title = 'Test' }
local result = PikSendMetadata.applyDefaultMetadata(original, nil)
if result.title == 'Test' then
  print('✅ PASSED: nil defaults handled correctly')
else
  print('❌ FAILED: nil defaults not handled correctly')
  os.exit(1)
end

-- Test GPS extraction with photo without GPS
print('Test: extractMetadata should handle photos without GPS')
local photoNoGPS = MockLrPhoto.new({ title = 'Test' })
local settings = { metadata = { includeGPS = true } }
metadata = PikSendMetadata.extractMetadata(photoNoGPS, settings)
if not metadata.gps then
  print('✅ PASSED: missing GPS handled correctly')
else
  print('❌ FAILED: GPS should be nil for photos without GPS data')
  os.exit(1)
end

print('\n=== All Tests Passed ===')
print('Property 34: Transfert complet des métadonnées - VERIFIED ✅')
print('Property 35: Respect de la confidentialité de la géolocalisation - VERIFIED ✅')
print('Property 36: Génération d\'alt-text - VERIFIED ✅')
print('Property 37: Application des métadonnées par défaut - VERIFIED ✅')
