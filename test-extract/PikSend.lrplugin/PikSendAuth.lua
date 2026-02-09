--[[----------------------------------------------------------------------------

PikSendAuth.lua
Authentication management for PikSend plugin

Handles:
- Secure token storage in Lightroom preferences
- Login/logout flows
- Token validation
- User session management

Security Implementation:
- Tokens are encrypted using XOR cipher with machine-specific key
- Encryption key is derived from plugin identifier + unique salt (MD5)
- Encrypted tokens are Base64 encoded for safe storage
- This provides basic obfuscation to prevent casual inspection
- Validates requirements: 2.6 (secure token storage), 11.2 (encrypted storage)

Note: This is basic encryption suitable for the plugin's security requirements.
For higher security needs, consider implementing AES encryption or using
platform-specific secure storage mechanisms.

------------------------------------------------------------------------------]]

local LrDialogs = import 'LrDialogs'
local LrPrefs = import 'LrPrefs'
local LrFunctionContext = import 'LrFunctionContext'
local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrHttp = import 'LrHttp'
local LrMD5 = import 'LrMD5'

local PikSendAPI = require 'PikSendAPI'
local PikSendLocalization = require 'PikSendLocalization'
local LOC = PikSendLocalization.LOC

local PikSendAuth = {}

--------------------------------------------------------------------------------
-- Encryption Utilities
--------------------------------------------------------------------------------

-- Generate a machine-specific encryption key
-- Uses a combination of plugin identifier and a fixed salt
-- @return string - Encryption key
local function getEncryptionKey()
  local prefs = LrPrefs.prefsForPlugin()
  
  -- Generate or retrieve a unique key for this installation
  if not prefs.encryptionSalt then
    -- Create a unique salt based on timestamp and random value
    prefs.encryptionSalt = LrMD5.digest(tostring(os.time()) .. tostring(math.random(1000000)))
  end
  
  -- Combine plugin identifier with salt to create encryption key
  local keySource = 'com.piksend.lightroom.' .. prefs.encryptionSalt
  return LrMD5.digest(keySource)
end

-- Bitwise XOR operation (Lua 5.1 compatible)
-- @param a number - First operand
-- @param b number - Second operand
-- @return number - XOR result
local function bitwiseXor(a, b)
  local result = 0
  local bitval = 1
  
  while a > 0 or b > 0 do
    local abit = a % 2
    local bbit = b % 2
    
    if abit ~= bbit then
      result = result + bitval
    end
    
    bitval = bitval * 2
    a = math.floor(a / 2)
    b = math.floor(b / 2)
  end
  
  return result
end

-- Simple XOR encryption/decryption
-- @param data string - Data to encrypt/decrypt
-- @param key string - Encryption key
-- @return string - Encrypted/decrypted data
local function xorCrypt(data, key)
  if not data or data == '' then
    return data
  end
  
  local result = {}
  local keyLen = #key
  
  for i = 1, #data do
    local dataByte = string.byte(data, i)
    local keyByte = string.byte(key, ((i - 1) % keyLen) + 1)
    local xorResult = bitwiseXor(dataByte, keyByte)
    table.insert(result, string.char(xorResult))
  end
  
  return table.concat(result)
end

-- Base64 encoding (for storing binary data in preferences)
-- @param data string - Data to encode
-- @return string - Base64 encoded string
local function base64Encode(data)
  local b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  local result = {}
  
  for i = 1, #data, 3 do
    local byte1 = string.byte(data, i)
    local byte2 = string.byte(data, i + 1) or 0
    local byte3 = string.byte(data, i + 2) or 0
    
    local combined = byte1 * 65536 + byte2 * 256 + byte3
    
    table.insert(result, string.sub(b64chars, math.floor(combined / 262144) + 1, math.floor(combined / 262144) + 1))
    table.insert(result, string.sub(b64chars, math.floor((combined % 262144) / 4096) + 1, math.floor((combined % 262144) / 4096) + 1))
    
    if i + 1 <= #data then
      table.insert(result, string.sub(b64chars, math.floor((combined % 4096) / 64) + 1, math.floor((combined % 4096) / 64) + 1))
    else
      table.insert(result, '=')
    end
    
    if i + 2 <= #data then
      table.insert(result, string.sub(b64chars, (combined % 64) + 1, (combined % 64) + 1))
    else
      table.insert(result, '=')
    end
  end
  
  return table.concat(result)
end

-- Base64 decoding
-- @param data string - Base64 encoded string
-- @return string - Decoded data
local function base64Decode(data)
  local b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  local result = {}
  
  -- Create reverse lookup table
  local b64lookup = {}
  for i = 1, #b64chars do
    b64lookup[string.sub(b64chars, i, i)] = i - 1
  end
  
  -- Remove padding
  data = string.gsub(data, '=', '')
  
  for i = 1, #data, 4 do
    local char1 = b64lookup[string.sub(data, i, i)] or 0
    local char2 = b64lookup[string.sub(data, i + 1, i + 1)] or 0
    local char3 = b64lookup[string.sub(data, i + 2, i + 2)] or 0
    local char4 = b64lookup[string.sub(data, i + 3, i + 3)] or 0
    
    local combined = char1 * 262144 + char2 * 4096 + char3 * 64 + char4
    
    table.insert(result, string.char(math.floor(combined / 65536)))
    
    if i + 2 <= #data then
      table.insert(result, string.char(math.floor((combined % 65536) / 256)))
    end
    
    if i + 3 <= #data then
      table.insert(result, string.char(combined % 256))
    end
  end
  
  return table.concat(result)
end

-- Encrypt token for storage
-- @param token string - Plain text token
-- @return string - Encrypted and encoded token
local function encryptToken(token)
  if not token or token == '' then
    return nil
  end
  
  local key = getEncryptionKey()
  local encrypted = xorCrypt(token, key)
  return base64Encode(encrypted)
end

-- Decrypt token from storage
-- @param encryptedToken string - Encrypted and encoded token
-- @return string - Plain text token
local function decryptToken(encryptedToken)
  if not encryptedToken or encryptedToken == '' then
    return nil
  end
  
  local key = getEncryptionKey()
  local decoded = base64Decode(encryptedToken)
  return xorCrypt(decoded, key)
end

--------------------------------------------------------------------------------
-- Token Storage
--------------------------------------------------------------------------------

-- Save API token securely
-- @param apiToken string - The API token to save
function PikSendAuth.saveToken(apiToken)
  local prefs = LrPrefs.prefsForPlugin()
  
  if apiToken and apiToken ~= '' then
    -- Encrypt token before storing
    prefs.apiToken = encryptToken(apiToken)
  else
    prefs.apiToken = nil
  end
end

-- Get stored API token
-- @return string|nil - The stored API token or nil
function PikSendAuth.getToken()
  local prefs = LrPrefs.prefsForPlugin()
  local encryptedToken = prefs.apiToken
  
  if encryptedToken then
    -- Decrypt token before returning
    return decryptToken(encryptedToken)
  end
  
  return nil
end

-- Clear stored token and user data
function PikSendAuth.clearToken()
  local prefs = LrPrefs.prefsForPlugin()
  prefs.apiToken = nil
  prefs.userName = nil
  prefs.userEmail = nil
  prefs.userPlan = nil
end

-- Check if user is authenticated
-- @return boolean - true if token exists
function PikSendAuth.isAuthenticated()
  local token = PikSendAuth.getToken()
  return token ~= nil and token ~= ''
end

--------------------------------------------------------------------------------
-- User Information
--------------------------------------------------------------------------------

-- Get stored user information
-- @return table|nil - User info {name, email, plan} or nil
function PikSendAuth.getUserInfo()
  local prefs = LrPrefs.prefsForPlugin()
  
  if prefs.userName then
    return {
      name = prefs.userName,
      email = prefs.userEmail,
      plan = prefs.userPlan,
    }
  end
  
  return nil
end

-- Save user information
-- @param user table - User data {name, email, planType}
local function saveUserInfo(user)
  local prefs = LrPrefs.prefsForPlugin()
  prefs.userName = user.name
  prefs.userEmail = user.email
  prefs.userPlan = user.planType
end

--------------------------------------------------------------------------------
-- Authentication Dialog
--------------------------------------------------------------------------------

-- Show login dialog
-- @return boolean - true if login successful, false otherwise
function PikSendAuth.showLoginDialog()
  return LrFunctionContext.callWithContext('showLoginDialog', function(context)
    local f = LrView.osFactory()
    
    local properties = LrBinding.makePropertyTable(context)
    properties.apiToken = ''
    
    local contents = f:column {
      bind_to_object = properties,
      spacing = f:control_spacing(),
      
      f:static_text {
        title = LOC('authInstructions'),
        font = '<system/bold>',
      },
      
      f:spacer { height = 5 },
      
      f:static_text {
        title = LOC('authInstructions'),
        width_in_chars = 50,
      },
      
      f:row {
        f:push_button {
          title = LOC('authOpenDashboard'),
          action = function()
            LrHttp.openUrlInBrowser('https://piksend.com/dashboard/settings/api')
          end,
        },
      },
      
      f:spacer { height = 10 },
      
      f:static_text {
        title = LOC('authTokenLabel'),
      },
      
      f:password_field {
        value = LrView.bind('apiToken'),
        width_in_chars = 50,
        immediate = true,
      },
    }
    
    local result = LrDialogs.presentModalDialog {
      title = LOC('authTitle'),
      contents = contents,
      actionVerb = LOC('authLogin'),
    }
    
    if result == 'ok' then
      local token = properties.apiToken
      
      if not token or token == '' then
        LrDialogs.message(
          'Token requis',
          'Veuillez saisir votre token API.',
          'critical'
        )
        return false
      end
      
      -- Validate the token
      local valid, user = PikSendAPI.validateToken(token)
      
      if valid and user then
        -- Check for Pro plan
        if user.planType ~= 'pro' then
          LrDialogs.message(
            'Plan Pro requis',
            'Le plugin Lightroom est réservé aux utilisateurs Pro. Veuillez upgrader votre plan sur piksend.com.',
            'critical'
          )
          return false
        end
        
        -- Save token and user info
        PikSendAuth.saveToken(token)
        saveUserInfo(user)
        
        LrDialogs.message(
          'Connexion réussie',
          'Bienvenue ' .. user.name .. '! Vous êtes maintenant connecté à PikSend.',
          'info'
        )
        return true
      else
        LrDialogs.message(
          'Erreur d\'authentification',
          'Token API invalide. Veuillez vérifier votre token et réessayer.',
          'critical'
        )
        return false
      end
    end
    
    return false
  end)
end

-- Show logout confirmation dialog
-- @return boolean - true if user confirmed logout
function PikSendAuth.showLogoutDialog()
  local result = LrDialogs.confirm(
    'Déconnexion',
    'Êtes-vous sûr de vouloir vous déconnecter de PikSend?',
    'Se déconnecter',
    'Annuler'
  )
  
  if result == 'ok' then
    PikSendAuth.clearToken()
    return true
  end
  
  return false
end

--------------------------------------------------------------------------------
-- Token Validation
--------------------------------------------------------------------------------

-- Validate current token
-- @return boolean, table|nil - (valid, user) or (false, nil)
function PikSendAuth.validateCurrentToken()
  local token = PikSendAuth.getToken()
  
  if not token then
    return false, nil
  end
  
  return PikSendAPI.validateToken(token)
end

-- Ensure user is authenticated, show login if not
-- @return boolean - true if authenticated, false otherwise
function PikSendAuth.ensureAuthenticated()
  if PikSendAuth.isAuthenticated() then
    -- Validate token is still valid
    local valid, user = PikSendAuth.validateCurrentToken()
    if valid then
      return true
    else
      -- Token expired or invalid, clear and prompt login
      PikSendAuth.clearToken()
    end
  end
  
  -- Show login dialog
  return PikSendAuth.showLoginDialog()
end

return PikSendAuth
