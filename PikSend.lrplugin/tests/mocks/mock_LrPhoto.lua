--[[----------------------------------------------------------------------------

mock_LrPhoto.lua
Mock implementation of Lightroom Photo object for testing

------------------------------------------------------------------------------]]

local MockLrPhoto = {}

-- Create a new mock photo with specified metadata
function MockLrPhoto.new(metadata)
  local photo = {
    _metadata = metadata or {},
    _rawMetadata = metadata and metadata.raw or {},
  }
  
  -- Mock getFormattedMetadata
  function photo:getFormattedMetadata(key)
    return self._metadata[key]
  end
  
  -- Mock getRawMetadata
  function photo:getRawMetadata(key)
    return self._rawMetadata[key]
  end
  
  return photo
end

-- Generate a random photo with random metadata
function MockLrPhoto.generateRandom(options)
  options = options or {}
  
  local metadata = {}
  local rawMetadata = {}
  
  -- Randomly include title
  if options.includeTitle ~= false and math.random() > 0.3 then
    metadata.title = 'Photo ' .. math.random(1, 1000)
  end
  
  -- Randomly include caption/description
  if options.includeDescription ~= false and math.random() > 0.3 then
    metadata.caption = 'Description for photo ' .. math.random(1, 1000)
  end
  
  -- Randomly include keywords
  if options.includeKeywords ~= false and math.random() > 0.3 then
    local keywordCount = math.random(1, 10)
    local keywords = {}
    for i = 1, keywordCount do
      table.insert(keywords, 'keyword' .. i)
    end
    metadata.keywordTags = keywords
  end
  
  -- Randomly include copyright
  if options.includeCopyright ~= false and math.random() > 0.3 then
    metadata.copyright = 'Copyright ' .. math.random(2020, 2024)
  end
  
  -- Randomly include EXIF data
  if options.includeExif ~= false and math.random() > 0.5 then
    metadata.cameraMake = 'Canon'
    metadata.cameraModel = 'EOS R5'
    metadata.lens = 'RF 24-70mm F2.8'
    metadata.isoSpeedRating = math.random(100, 6400)
    metadata.aperture = math.random(14, 80) / 10  -- f/1.4 to f/8.0
    metadata.shutterSpeed = '1/' .. math.random(30, 8000)
    metadata.focalLength = math.random(24, 200) .. ' mm'
    metadata.dateTimeOriginal = '2024-01-15 14:30:00'
  end
  
  -- Randomly include GPS data
  if options.includeGPS == true and math.random() > 0.5 then
    rawMetadata.gps = {
      latitude = (math.random() * 180) - 90,  -- -90 to 90
      longitude = (math.random() * 360) - 180,  -- -180 to 180
    }
  end
  
  return MockLrPhoto.new({
    title = metadata.title,
    caption = metadata.caption,
    keywordTags = metadata.keywordTags,
    copyright = metadata.copyright,
    cameraMake = metadata.cameraMake,
    cameraModel = metadata.cameraModel,
    lens = metadata.lens,
    isoSpeedRating = metadata.isoSpeedRating,
    aperture = metadata.aperture,
    shutterSpeed = metadata.shutterSpeed,
    focalLength = metadata.focalLength,
    dateTimeOriginal = metadata.dateTimeOriginal,
    raw = rawMetadata,
  })
end

return MockLrPhoto
