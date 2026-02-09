# Check Email Logs Script
# Query the email_logs table to see what happened

Write-Host "Checking email logs..." -ForegroundColor Cyan

try {
    # Get recent email logs
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/emails/logs?limit=5" `
        -Method GET
    
    Write-Host ""
    Write-Host "Recent email logs:" -ForegroundColor Yellow
    Write-Host ""
    
    if ($response.logs.Count -gt 0) {
        foreach ($log in $response.logs) {
            Write-Host "ID: $($log.id)" -ForegroundColor White
            Write-Host "  Status: $($log.status)" -ForegroundColor $(if ($log.status -eq 'sent') { 'Green' } else { 'Red' })
            Write-Host "  From: $($log.from_address)" -ForegroundColor White
            Write-Host "  To: $($log.to_address)" -ForegroundColor White
            Write-Host "  Subject: $($log.subject)" -ForegroundColor White
            Write-Host "  Provider: $($log.provider)" -ForegroundColor White
            if ($log.provider_message_id) {
                Write-Host "  Provider Message ID: $($log.provider_message_id)" -ForegroundColor Cyan
            }
            if ($log.error_message) {
                Write-Host "  Error: $($log.error_message)" -ForegroundColor Red
            }
            Write-Host "  Created: $($log.created_at)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "No email logs found" -ForegroundColor Blue
    }
    
} catch {
    Write-Host ""
    Write-Host "Error checking logs:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
