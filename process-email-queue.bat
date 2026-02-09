@echo off
REM Process Email Queue Script
REM Manually trigger email queue processing

echo.
echo Processing email queue...
echo.

curl -X POST http://localhost:3000/api/emails/queue/process ^
  -H "Content-Type: application/json" ^
  -d "{\"batchSize\": 10}"

echo.
echo.
echo Done! Check the output above for results.
echo.
pause
