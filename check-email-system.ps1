# Check Email System Status
# Diagnostic script to check email configuration

Write-Host "Checking email system status..." -ForegroundColor Cyan
Write-Host ""

try {
    # Check queue status
    Write-Host "1. Queue Status:" -ForegroundColor Yellow
    $queueStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/emails/queue/status" -Method GET
    Write-Host "  Pending: $($queueStatus.pending)" -ForegroundColor White
    Write-Host "  Processing: $($queueStatus.processing)" -ForegroundColor White
    Write-Host "  Sent (24h): $($queueStatus.sent)" -ForegroundColor Green
    Write-Host "  Failed (24h): $($queueStatus.failed)" -ForegroundColor Red
    Write-Host ""
    
    # Try to process queue with verbose output
    Write-Host "2. Processing Queue:" -ForegroundColor Yellow
    try {
        $processResult = Invoke-RestMethod -Uri "http://localhost:3000/api/emails/queue/process" `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"batchSize": 1}'
        
        Write-Host "  Processed: $($processResult.processed)" -ForegroundColor White
        Write-Host "  Successful: $($processResult.successful)" -ForegroundColor Green
        Write-Host "  Failed: $($processResult.failed)" -ForegroundColor Red
        
        if ($processResult.results.Count -gt 0) {
            Write-Host ""
            Write-Host "  Details:" -ForegroundColor Cyan
            foreach ($result in $processResult.results) {
                Write-Host "    ID: $($result.id)" -ForegroundColor White
                Write-Host "    Success: $($result.success)" -ForegroundColor $(if ($result.success) { 'Green' } else { 'Red' })
                if ($result.error) {
                    Write-Host "    Error: $($result.error)" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Check your terminal logs for detailed error messages" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
