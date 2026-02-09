@echo off
echo Nettoyage du cache Next.js et des fonts...

REM Supprimer le dossier .next
if exist .next (
    echo Suppression de .next...
    rmdir /s /q .next
)

REM Supprimer le cache node_modules
if exist node_modules\.cache (
    echo Suppression de node_modules\.cache...
    rmdir /s /q node_modules\.cache
)

REM Supprimer les fichiers temporaires
if exist .turbo (
    echo Suppression de .turbo...
    rmdir /s /q .turbo
)

echo.
echo Cache nettoyé avec succès!
echo.
echo Exécutez maintenant: npm run dev
pause
