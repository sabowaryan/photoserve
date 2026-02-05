@echo off
setlocal

REM Configurer les chemins pour les modules Lua installes par LuaRocks
set "LUA_PATH=%APPDATA%\luarocks\share\lua\5.4\?.lua;%APPDATA%\luarocks\share\lua\5.4\?\init.lua;%LUA_PATH%"
set "LUA_CPATH=%APPDATA%\luarocks\lib\lua\5.4\?.dll;%LUA_CPATH%"

REM Executer busted
lua "%APPDATA%\luarocks\bin\busted" %*

endlocal
