--[[----------------------------------------------------------------------------

PikSendGallery.lua
Gallery management for PikSend plugin

Handles:
- Gallery listing and caching
- Gallery creation and configuration
- Gallery search and filtering
- Gallery validation

------------------------------------------------------------------------------]]

local LrDialogs = import 'LrDialogs'
local LrFunctionContext = import 'LrFunctionContext'
local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDate = import 'LrDate'
local LrTasks = import 'LrTasks'

local PikSendAPI = require 'PikSendAPI'
local PikSendAuth = require 'PikSendAuth'

local PikSendGallery = {}

--------------------------------------------------------------------------------
-- Constants
--------------------------------------------------------------------------------

local CACHE_DURATION = 300  -- 5 minutes in seconds
local MIN_TITLE_LENGTH = 1
local MAX_TITLE_LENGTH = 200

--------------------------------------------------------------------------------
-- Cache Management
--------------------------------------------------------------------------------

local galleryCache = {
  galleries = nil,
  timestamp = 0,
}

-- Check if cache is valid
local function isCacheValid()
  local now = LrDate.currentTime()
  return galleryCache.galleries ~= nil and (now - galleryCache.timestamp) < CACHE_DURATION
end

-- Update cache
local function updateCache(galleries)
  galleryCache.galleries = galleries
  galleryCache.timestamp = LrDate.currentTime()
end

-- Clear cache
function PikSendGallery.clearCache()
  galleryCache.galleries = nil
  galleryCache.timestamp = 0
end

--------------------------------------------------------------------------------
-- Gallery Validation
--------------------------------------------------------------------------------

-- Validate gallery title
-- @param title string - The gallery title to validate
-- @return boolean, string - (valid, errorMessage)
function PikSendGallery.validateTitle(title)
  if not title or title == '' then
    return false, 'Le titre est requis'
  end
  
  local length = string.len(title)
  
  if length < MIN_TITLE_LENGTH then
    return false, 'Le titre doit contenir au moins ' .. MIN_TITLE_LENGTH .. ' caractère'
  end
  
  if length > MAX_TITLE_LENGTH then
    return false, 'Le titre ne peut pas dépasser ' .. MAX_TITLE_LENGTH .. ' caractères'
  end
  
  return true, nil
end

--------------------------------------------------------------------------------
-- Gallery Retrieval
--------------------------------------------------------------------------------

-- Get galleries with caching
-- @param forceRefresh boolean - Force refresh from API
-- @return table|nil - Array of galleries or nil on error
function PikSendGallery.getGalleries(forceRefresh)
  -- Check cache first
  if not forceRefresh and isCacheValid() then
    return galleryCache.galleries
  end
  
  -- Get token
  local token = PikSendAuth.getToken()
  if not token then
    return nil
  end
  
  -- Fetch from API
  local galleries = PikSendAPI.getGalleries(token)
  
  if galleries then
    -- Sort by creation date (descending)
    table.sort(galleries, function(a, b)
      return (a.createdAt or '') > (b.createdAt or '')
    end)
    
    -- Update cache
    updateCache(galleries)
    
    return galleries
  end
  
  return nil
end

-- Refresh galleries in property table
-- @param propertyTable table - The property table to update
function PikSendGallery.refreshGalleries(propertyTable)
  LrTasks.startAsyncTask(function()
    local galleries = PikSendGallery.getGalleries(true)
    
    if galleries then
      -- Convert to menu items
      local items = {}
      for _, gallery in ipairs(galleries) do
        local status = gallery.status == 'expired' and ' (Expirée)' or ''
        local label = gallery.title .. ' (' .. (gallery.imageCount or 0) .. ' photos)' .. status
        
        table.insert(items, {
          title = label,
          value = gallery.id,
        })
      end
      
      propertyTable.galleries = items
      
      if #items > 0 and not propertyTable.selectedGallery then
        propertyTable.selectedGallery = items[1].value
      end
    else
      LrDialogs.message(
        'Erreur',
        'Impossible de récupérer les galeries. Vérifiez votre connexion.',
        'critical'
      )
    end
  end)
end

-- Search galleries by name
-- @param galleries table - Array of galleries
-- @param query string - Search query
-- @return table - Filtered array of galleries
function PikSendGallery.searchGalleries(galleries, query)
  if not query or query == '' then
    return galleries
  end
  
  local results = {}
  local lowerQuery = string.lower(query)
  
  for _, gallery in ipairs(galleries) do
    local lowerTitle = string.lower(gallery.title or '')
    if string.find(lowerTitle, lowerQuery, 1, true) then
      table.insert(results, gallery)
    end
  end
  
  return results
end

--------------------------------------------------------------------------------
-- Gallery Creation
--------------------------------------------------------------------------------

-- Show create gallery dialog
-- @param propertyTable table - The property table to update after creation
-- @return boolean - true if gallery created successfully
function PikSendGallery.showCreateGalleryDialog(propertyTable)
  return LrFunctionContext.callWithContext('showCreateGalleryDialog', function(context)
    local f = LrView.osFactory()
    
    local properties = LrBinding.makePropertyTable(context)
    properties.title = ''
    properties.description = ''
    properties.isPublic = true
    properties.hasExpiration = false
    properties.expirationDays = 30
    properties.hasPassword = false
    properties.password = ''
    
    local contents = f:column {
      bind_to_object = properties,
      spacing = f:control_spacing(),
      
      f:static_text {
        title = 'Créer une nouvelle galerie',
        font = '<system/bold>',
      },
      
      f:spacer { height = 10 },
      
      -- Title
      f:row {
        f:static_text {
          title = 'Titre:',
          width = LrView.share('label_width'),
        },
        f:edit_field {
          value = LrView.bind('title'),
          width_in_chars = 40,
          immediate = true,
        },
      },
      
      -- Description
      f:row {
        f:static_text {
          title = 'Description:',
          width = LrView.share('label_width'),
        },
        f:edit_field {
          value = LrView.bind('description'),
          width_in_chars = 40,
          height_in_lines = 3,
        },
      },
      
      f:spacer { height = 10 },
      
      -- Public/Private
      f:row {
        f:checkbox {
          title = 'Galerie publique',
          value = LrView.bind('isPublic'),
        },
      },
      
      -- Expiration
      f:row {
        f:checkbox {
          title = 'Définir une date d\'expiration',
          value = LrView.bind('hasExpiration'),
        },
      },
      
      f:row {
        f:static_text {
          title = 'Expire dans:',
          width = LrView.share('label_width'),
          enabled = LrView.bind('hasExpiration'),
        },
        f:edit_field {
          value = LrView.bind('expirationDays'),
          width_in_chars = 10,
          enabled = LrView.bind('hasExpiration'),
        },
        f:static_text {
          title = 'jours',
          enabled = LrView.bind('hasExpiration'),
        },
      },
      
      -- Password protection
      f:row {
        f:checkbox {
          title = 'Protéger par mot de passe',
          value = LrView.bind('hasPassword'),
        },
      },
      
      f:row {
        f:static_text {
          title = 'Mot de passe:',
          width = LrView.share('label_width'),
          enabled = LrView.bind('hasPassword'),
        },
        f:password_field {
          value = LrView.bind('password'),
          width_in_chars = 30,
          enabled = LrView.bind('hasPassword'),
        },
      },
    }
    
    local result = LrDialogs.presentModalDialog {
      title = 'Nouvelle Galerie',
      contents = contents,
      actionVerb = 'Créer',
    }
    
    if result == 'ok' then
      -- Validate title
      local valid, errorMsg = PikSendGallery.validateTitle(properties.title)
      if not valid then
        LrDialogs.message('Titre invalide', errorMsg, 'critical')
        return false
      end
      
      -- Build gallery data
      local galleryData = {
        title = properties.title,
        description = properties.description ~= '' and properties.description or nil,
        isPublic = properties.isPublic,
      }
      
      -- Add expiration if enabled
      if properties.hasExpiration then
        local expirationDate = LrDate.currentTime() + (properties.expirationDays * 86400)
        galleryData.expiresAt = LrDate.timeToIsoDate(expirationDate)
      end
      
      -- Add password if enabled
      if properties.hasPassword and properties.password ~= '' then
        galleryData.password = properties.password
      end
      
      -- Create gallery via API
      local token = PikSendAuth.getToken()
      if not token then
        LrDialogs.message('Non authentifié', 'Veuillez vous connecter.', 'critical')
        return false
      end
      
      local gallery = PikSendAPI.createGallery(token, galleryData)
      
      if gallery then
        -- Clear cache to force refresh
        PikSendGallery.clearCache()
        
        -- Refresh gallery list
        if propertyTable then
          PikSendGallery.refreshGalleries(propertyTable)
        end
        
        LrDialogs.message(
          'Galerie créée',
          'La galerie "' .. properties.title .. '" a été créée avec succès.',
          'info'
        )
        return true
      else
        LrDialogs.message(
          'Erreur',
          'Impossible de créer la galerie. Veuillez réessayer.',
          'critical'
        )
        return false
      end
    end
    
    return false
  end)
end

--------------------------------------------------------------------------------
-- Gallery Information
--------------------------------------------------------------------------------

-- Get gallery by ID
-- @param galleryId string - The gallery ID
-- @return table|nil - Gallery data or nil
function PikSendGallery.getGalleryById(galleryId)
  local galleries = PikSendGallery.getGalleries(false)
  
  if galleries then
    for _, gallery in ipairs(galleries) do
      if gallery.id == galleryId then
        return gallery
      end
    end
  end
  
  return nil
end

-- Generate share link for gallery
-- @param galleryId string - The gallery ID
-- @return string - Share URL
function PikSendGallery.generateShareLink(galleryId)
  return 'https://piksend.com/g/' .. galleryId
end

return PikSendGallery
