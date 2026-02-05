# Installation des outils de développement pour PikSend
Write-Host "Installation des outils de developpement PikSend" -ForegroundColor Cyan

# Rafraîchir le PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Vérifier Lua
Write-Host "`nVerification de Lua..." -ForegroundColor Yellow
try {
    $luaVersion = lua -v 2>&1
    Write-Host "Lua deja installe: $luaVersion" -ForegroundColor Green
} catch {
    Write-Host "Lua non trouve - deja installe via winget" -ForegroundColor Green
}

# Installer MSYS2 pour MinGW
Write-Host "`nInstallation de MSYS2 (compilateur C)..." -ForegroundColor Yellow
winget install --id MSYS2.MSYS2 -e --accept-source-agreements --accept-package-agreements

Write-Host "`nAPRES l'installation de MSYS2:" -ForegroundColor Cyan
Write-Host "1. Ouvrez 'MSYS2 MINGW64' depuis le menu Demarrer" -ForegroundColor White
Write-Host "2. Executez: pacman -S mingw-w64-x86_64-gcc" -ForegroundColor White
Write-Host "3. Fermez MSYS2" -ForegroundColor White
Write-Host "`nAppuyez sur Entree quand c'est fait..." -ForegroundColor Yellow
Read-Host

# Télécharger et installer LuaRocks
Write-Host "`nTelecharger LuaRocks..." -ForegroundColor Yellow
$luarocksUrl = "https://luarocks.github.io/luarocks/releases/luarocks-3.11.1-windows-64.zip"
$tempZip = "$env:TEMP\luarocks.zip"
$tempDir = "$env:TEMP\luarocks-extract"

Invoke-WebRequest -Uri $luarocksUrl -OutFile $tempZip
Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

# Installer LuaRocks
$luarocksDir = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1
Push-Location $luarocksDir.FullName

Write-Host "Installation de LuaRocks..." -ForegroundColor Yellow
cmd /c "install.bat /P C:\LuaRocks /LUA ""C:\Program Files\Lua"" /Q"

Pop-Location

# Ajouter au PATH
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @(
    "C:\LuaRocks",
    "C:\msys64\mingw64\bin",
    "$env:APPDATA\luarocks\bin"
)

foreach ($pathToAdd in $pathsToAdd) {
    if ($userPath -notlike "*$pathToAdd*") {
        $userPath = "$userPath;$pathToAdd"
    }
}

[System.Environment]::SetEnvironmentVariable("Path", $userPath, "User")

# Rafraîchir le PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Installer les modules Lua
Write-Host "`nInstallation des modules Lua..." -ForegroundColor Yellow
$modules = @("busted", "luafilesystem", "dkjson", "penlight")

foreach ($module in $modules) {
    Write-Host "Installation de $module..." -ForegroundColor Gray
    luarocks install $module
}

Write-Host "`n=== Installation terminee ===" -ForegroundColor Green
Write-Host "`nRedemarrez PowerShell puis testez avec:" -ForegroundColor Cyan
Write-Host "  cd PikSend.lrplugin" -ForegroundColor White
Write-Host "  busted" -ForegroundColor White
