--[[----------------------------------------------------------------------------

test_export_dialog.lua
Unit tests for PikSendExportServiceProvider dialog sections

Tests:
- sectionsForTopOfDialog() creates correct structure
- All required sections are present
- UI bindings are correct
- Default values are set properly

------------------------------------------------------------------------------]]

-- Add the plugin directory to the package path
package.path = package.path .. ';PikSend.lrplugin/?.lua'

-- Mock Lightroom SDK
_G.import = function(module)
  if module == 'LrView' then
    return {
      bind = function(key)
        if type(key) == 'table' then
          return {_bind = key}
        end
        return {_bind = {key = key}}
      end,
      share = function(name)
        return {_share = name}
      end,
    }
  elseif module == 'LrBinding' then
    return {}
  elseif module == 'LrDialogs' then
    return {}
  elseif module == 'LrTasks' then
    return {}
  elseif module == 'LrFileUtils' then
    return {}
  elseif module == 'LrPathUtils' then
    return {}
  elseif module == 'LrPrefs' then
    return {
      prefsForPlugin = function()
        return {}
      end,
    }
  end
  return {}
end

-- Mock modules
package.loaded['PikSendAPI'] = {}
package.loaded['PikSendAuth'] = {
  isAuthenticated = function() return false end,
  getUserInfo = function() return nil end,
}
package.loaded['PikSendGallery'] = {
  refreshGalleries = function() end,
}
package.loaded['PikSendUpload'] = {}
package.loaded['PikSendMetadata'] = {}
package.loaded['PikSendLogger'] = {
  info = function() end,
  debug = function() end,
  error = function() end,
}
package.loaded['PikSendUI'] = {
  createAuthSection = function(f, pt)
    return {
      title = 'Compte PikSend',
      _type = 'auth_section',
    }
  end,
  createGallerySection = function(f, pt)
    return {
      title = 'Galerie de destination',
      _type = 'gallery_section',
    }
  end,
}

-- Load the module
local exportServiceProvider = require('PikSendExportServiceProvider')

-- Create mock factory
local mockFactory = {
  row = function(...) 
    local contents = {...}
    local result = {_type = 'row'}
    for i, v in ipairs(contents) do
      result[i] = v
    end
    return result
  end,
  column = function(...) 
    local contents = {...}
    local result = {_type = 'column'}
    for i, v in ipairs(contents) do
      result[i] = v
    end
    return result
  end,
  static_text = function(props) return {_type = 'static_text', props} end,
  popup_menu = function(props) return {_type = 'popup_menu', props} end,
  slider = function(props) return {_type = 'slider', props} end,
  checkbox = function(props) return {_type = 'checkbox', props} end,
  edit_field = function(props) return {_type = 'edit_field', props} end,
  push_button = function(props) return {_type = 'push_button', props} end,
  spacer = function(props) return {_type = 'spacer', props} end,
  control_spacing = function() return 5 end,
}

-- Helper function to find element in section
local function findElement(section, elementType, bindKey)
  for i = 1, #section do
    local item = section[i]
    if item._type == 'row' then
      -- Row contains elements as array items
      for j = 1, #item do
        local element = item[j]
        if element and element._type == elementType then
          if bindKey then
            -- Check if this element has the right binding
            if element.value and type(element.value) == 'table' and element.value._bind then
              local key = element.value._bind.key or (element.value._bind.keys and element.value._bind.keys[1])
              if key == bindKey then
                return element
              end
            end
          else
            return element
          end
        end
      end
    elseif item._type == elementType then
      -- Direct element (not in a row)
      if bindKey then
        if item.value and type(item.value) == 'table' and item.value._bind then
          local key = item.value._bind.key or (item.value._bind.keys and item.value._bind.keys[1])
          if key == bindKey then
            return item
          end
        end
      else
        return item
      end
    end
  end
  return nil
end

describe("PikSendExportServiceProvider - Dialog Sections", function()
  
  describe("sectionsForTopOfDialog()", function()
    it("should return a table with sections", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      
      assert.is_not_nil(sections)
      assert.is_true(type(sections) == 'table')
      assert.is_true(#sections > 0)
    end)
    
    it("should have exactly 3 sections", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      
      assert.equals(3, #sections)
    end)
    
    it("should have authentication section as first section", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      
      assert.equals('Compte PikSend', sections[1].title)
      assert.equals('auth_section', sections[1]._type)
    end)
    
    it("should have gallery selection section as second section", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      
      assert.equals('Galerie de destination', sections[2].title)
      assert.equals('gallery_section', sections[2]._type)
    end)
    
    it("should have export parameters section as third section", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      
      assert.equals('Paramètres d\'export', sections[3].title)
    end)
    
    it("should initialize galleries array in property table", function()
      local freshPropertyTable = {}
      exportServiceProvider.sectionsForTopOfDialog(mockFactory, freshPropertyTable)
      
      assert.is_not_nil(freshPropertyTable.galleries)
      assert.is_true(type(freshPropertyTable.galleries) == 'table')
    end)
  end)
  
  describe("Export Parameters Section", function()
    
    it("should have format selection with 3 options", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local formatPopup = findElement(exportSection, 'popup_menu', 'exportFormat')
      assert.is_not_nil(formatPopup, "Format popup menu not found")
      assert.is_not_nil(formatPopup.items)
      assert.equals(3, #formatPopup.items)
      assert.equals('jpeg', formatPopup.items[1].value)
      assert.equals('png', formatPopup.items[2].value)
      assert.equals('tiff', formatPopup.items[3].value)
    end)
    
    it("should have JPEG quality slider with range 1-100", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local qualitySlider = findElement(exportSection, 'slider', 'jpegQuality')
      assert.is_not_nil(qualitySlider, "JPEG quality slider not found")
      assert.equals(1, qualitySlider.min)
      assert.equals(100, qualitySlider.max)
    end)
    
    it("should have resolution selection with 4 options", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local resolutionPopup = findElement(exportSection, 'popup_menu', 'resolution')
      assert.is_not_nil(resolutionPopup, "Resolution popup menu not found")
      assert.is_not_nil(resolutionPopup.items)
      assert.equals(4, #resolutionPopup.items)
      assert.equals('original', resolutionPopup.items[1].value)
      assert.equals('hd', resolutionPopup.items[2].value)
      assert.equals('web', resolutionPopup.items[3].value)
      assert.equals('custom', resolutionPopup.items[4].value)
    end)
    
    it("should have resize checkbox", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local resizeCheckbox = findElement(exportSection, 'checkbox', 'enableResize')
      assert.is_not_nil(resizeCheckbox, "Resize checkbox not found")
    end)
    
    it("should have max width and height fields", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local maxWidthField = findElement(exportSection, 'edit_field', 'maxWidth')
      local maxHeightField = findElement(exportSection, 'edit_field', 'maxHeight')
      
      assert.is_not_nil(maxWidthField, "Max width field not found")
      assert.is_not_nil(maxHeightField, "Max height field not found")
    end)
    
    it("should have watermark checkbox", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local watermarkCheckbox = findElement(exportSection, 'checkbox', 'enableWatermark')
      assert.is_not_nil(watermarkCheckbox, "Watermark checkbox not found")
    end)
    
    it("should have watermark position selection with 5 options", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local positionPopup = findElement(exportSection, 'popup_menu', 'watermarkPosition')
      assert.is_not_nil(positionPopup, "Watermark position popup not found")
      assert.is_not_nil(positionPopup.items)
      assert.equals(5, #positionPopup.items)
      assert.equals('topLeft', positionPopup.items[1].value)
      assert.equals('topRight', positionPopup.items[2].value)
      assert.equals('bottomLeft', positionPopup.items[3].value)
      assert.equals('bottomRight', positionPopup.items[4].value)
      assert.equals('center', positionPopup.items[5].value)
    end)
    
    it("should have watermark opacity slider with range 0-100", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local opacitySlider = findElement(exportSection, 'slider', 'watermarkOpacity')
      assert.is_not_nil(opacitySlider, "Watermark opacity slider not found")
      assert.equals(0, opacitySlider.min)
      assert.equals(100, opacitySlider.max)
    end)
    
    it("should have metadata checkbox", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local metadataCheckbox = findElement(exportSection, 'checkbox', 'includeMetadata')
      assert.is_not_nil(metadataCheckbox, "Metadata checkbox not found")
    end)
    
    it("should have GPS checkbox", function()
      local mockPropertyTable = {galleries = {}}
      local sections = exportServiceProvider.sectionsForTopOfDialog(mockFactory, mockPropertyTable)
      local exportSection = sections[3]
      
      local gpsCheckbox = findElement(exportSection, 'checkbox', 'includeGPS')
      assert.is_not_nil(gpsCheckbox, "GPS checkbox not found")
    end)
  end)
  
  describe("Export Preset Fields", function()
    it("should define all required preset fields", function()
      assert.is_not_nil(exportServiceProvider.exportPresetFields)
      assert.is_true(type(exportServiceProvider.exportPresetFields) == 'table')
      
      local fields = {}
      for _, field in ipairs(exportServiceProvider.exportPresetFields) do
        fields[field.key] = field.default
      end
      
      -- Check all required fields exist
      assert.is_not_nil(fields.selectedGallery)
      assert.is_not_nil(fields.exportFormat)
      assert.is_not_nil(fields.jpegQuality)
      assert.is_not_nil(fields.resolution)
      assert.is_not_nil(fields.enableResize)
      assert.is_not_nil(fields.maxWidth)
      assert.is_not_nil(fields.maxHeight)
      assert.is_not_nil(fields.enableWatermark)
      assert.is_not_nil(fields.watermarkPosition)
      assert.is_not_nil(fields.watermarkOpacity)
      assert.is_not_nil(fields.includeMetadata)
      assert.is_not_nil(fields.includeGPS)
    end)
    
    it("should have correct default values", function()
      local fields = {}
      for _, field in ipairs(exportServiceProvider.exportPresetFields) do
        fields[field.key] = field.default
      end
      
      assert.equals('jpeg', fields.exportFormat)
      assert.equals(90, fields.jpegQuality)
      assert.equals('original', fields.resolution)
      assert.equals(false, fields.enableResize)
      assert.equals(1920, fields.maxWidth)
      assert.equals(1080, fields.maxHeight)
      assert.equals(false, fields.enableWatermark)
      assert.equals('bottomRight', fields.watermarkPosition)
      assert.equals(50, fields.watermarkOpacity)
      assert.equals(true, fields.includeMetadata)
      assert.equals(false, fields.includeGPS)
    end)
  end)
end)

