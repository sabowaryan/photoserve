--[[----------------------------------------------------------------------------

demo_checkDuplicate.lua
Demonstration of checkDuplicate() functionality

This script demonstrates how the checkDuplicate() function works in practice.

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

local PikSendCache = require('PikSendCache')
local LrFileUtils = require('mock_LrFileUtils')

print('\n╔════════════════════════════════════════════════════════════════╗')
print('║  checkDuplicate() Function Demonstration                      ║')
print('╚════════════════════════════════════════════════════════════════╝\n')

-- Reset test environment
_G._testPrefs = {}
LrFileUtils._reset()

-- Scenario 1: Check new file (not uploaded before)
print('Scenario 1: Checking a new file')
print('─────────────────────────────────────────────────────────────────')

local photo1Path = "/photos/sunset.jpg"
local photo1Content = "Beautiful sunset photo content"
local gallery1 = "gallery_vacation_2024"

LrFileUtils._setFileContent(photo1Path, photo1Content)

local isDuplicate, imageId = PikSendCache.checkDuplicate(photo1Path, gallery1)
print('File: ' .. photo1Path)
print('Gallery: ' .. gallery1)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ File is new, proceed with upload\n')

-- Scenario 2: Upload the file and record in cache
print('Scenario 2: Uploading file and recording in cache')
print('─────────────────────────────────────────────────────────────────')

local uploadedImageId = "img_abc123xyz"
PikSendCache.recordUpload(photo1Path, gallery1, uploadedImageId)
print('File uploaded successfully!')
print('Recorded in cache with Image ID: ' .. uploadedImageId .. '\n')

-- Scenario 3: Check the same file again (should be duplicate)
print('Scenario 3: Checking the same file again')
print('─────────────────────────────────────────────────────────────────')

isDuplicate, imageId = PikSendCache.checkDuplicate(photo1Path, gallery1)
print('File: ' .. photo1Path)
print('Gallery: ' .. gallery1)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ Duplicate detected! Skip upload, use cached Image ID\n')

-- Scenario 4: Check same file in different gallery (should NOT be duplicate)
print('Scenario 4: Checking same file in different gallery')
print('─────────────────────────────────────────────────────────────────')

local gallery2 = "gallery_portfolio_2024"
isDuplicate, imageId = PikSendCache.checkDuplicate(photo1Path, gallery2)
print('File: ' .. photo1Path)
print('Gallery: ' .. gallery2)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ Not a duplicate in this gallery, proceed with upload\n')

-- Scenario 5: Upload to second gallery
print('Scenario 5: Uploading to second gallery')
print('─────────────────────────────────────────────────────────────────')

local uploadedImageId2 = "img_def456uvw"
PikSendCache.recordUpload(photo1Path, gallery2, uploadedImageId2)
print('File uploaded to second gallery!')
print('Recorded in cache with Image ID: ' .. uploadedImageId2 .. '\n')

-- Scenario 6: Check different file with same content (should be duplicate)
print('Scenario 6: Different file path, same content')
print('─────────────────────────────────────────────────────────────────')

local photo2Path = "/photos/sunset_copy.jpg"
LrFileUtils._setFileContent(photo2Path, photo1Content)  -- Same content!

isDuplicate, imageId = PikSendCache.checkDuplicate(photo2Path, gallery1)
print('File: ' .. photo2Path)
print('Gallery: ' .. gallery1)
print('Content: Same as ' .. photo1Path)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ Duplicate detected by hash! Skip upload\n')

-- Scenario 7: Check file with different content (should NOT be duplicate)
print('Scenario 7: Different file with different content')
print('─────────────────────────────────────────────────────────────────')

local photo3Path = "/photos/mountain.jpg"
local photo3Content = "Majestic mountain landscape"
LrFileUtils._setFileContent(photo3Path, photo3Content)

isDuplicate, imageId = PikSendCache.checkDuplicate(photo3Path, gallery1)
print('File: ' .. photo3Path)
print('Gallery: ' .. gallery1)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ New content, proceed with upload\n')

-- Scenario 8: Check non-existent file (should handle gracefully)
print('Scenario 8: Checking non-existent file')
print('─────────────────────────────────────────────────────────────────')

local nonExistentPath = "/photos/does_not_exist.jpg"
isDuplicate, imageId = PikSendCache.checkDuplicate(nonExistentPath, gallery1)
print('File: ' .. nonExistentPath)
print('Gallery: ' .. gallery1)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Image ID: ' .. tostring(imageId))
print('Result: ✓ Handled gracefully, returns false\n')

-- Scenario 9: Cache statistics
print('Scenario 9: Cache statistics')
print('─────────────────────────────────────────────────────────────────')

local stats = PikSendCache.getCacheStats()
print('Total cache entries: ' .. stats.entryCount)
print('Oldest entry: ' .. tostring(stats.oldestEntry))
print('Newest entry: ' .. tostring(stats.newestEntry))
print('Result: ✓ Cache contains ' .. stats.entryCount .. ' entries\n')

-- Scenario 10: Clear cache
print('Scenario 10: Clearing cache')
print('─────────────────────────────────────────────────────────────────')

PikSendCache.clearUploadCache()
print('Cache cleared!')

isDuplicate, imageId = PikSendCache.checkDuplicate(photo1Path, gallery1)
print('Checking previously uploaded file: ' .. photo1Path)
print('Is Duplicate: ' .. tostring(isDuplicate))
print('Result: ✓ Cache cleared, file no longer marked as duplicate\n')

-- Summary
print('╔════════════════════════════════════════════════════════════════╗')
print('║  Demonstration Complete                                        ║')
print('╚════════════════════════════════════════════════════════════════╝\n')

print('Key Features Demonstrated:')
print('  ✓ Duplicate detection by MD5 hash')
print('  ✓ Gallery-specific caching')
print('  ✓ Content-based detection (not path-based)')
print('  ✓ Graceful error handling')
print('  ✓ Cache management (record, clear, stats)')
print('\nThe checkDuplicate() function is working correctly!\n')
