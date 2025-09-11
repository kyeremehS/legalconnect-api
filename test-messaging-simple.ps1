# Test script for messaging functionality with existing users
Write-Host "Testing Messaging Functionality with existing users..." -ForegroundColor Green

try {
    # Let's try with different test emails or existing users
    $testMessage = @{
        senderId = "cm0w6fmpa0000uh1b5u0mqo2r"  # Example ID - we'll need real ones
        receiverId = "cm0w6fmpa0001uh1b5u0mqo3s"  # Example ID - we'll need real ones
        senderRole = "CLIENT"  # Add the missing senderRole field
        content = "Hello! This is a test message from the messaging system."
    }
    
    Write-Host "Testing message sending..." -ForegroundColor Yellow
    $messageJson = $testMessage | ConvertTo-Json
    
    try {
        $messageResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/messages" -Method POST -Body $messageJson -ContentType "application/json"
        Write-Host "Message sent successfully: $($messageResponse.data.id)" -ForegroundColor Green
        
        # Test getting conversation
        Write-Host "Testing conversation retrieval..." -ForegroundColor Yellow
        $conversationResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/messages/$($testMessage.senderId)/$($testMessage.receiverId)" -Method GET
        Write-Host "Conversation retrieved with $($conversationResponse.data.Count) messages" -ForegroundColor Green
        
        Write-Host "All messaging tests passed!" -ForegroundColor Green
        
    } catch {
        Write-Host "Message test failed - this might be due to invalid user IDs" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Let's test with a simpler approach - just test the endpoint availability
        Write-Host "Testing if messaging endpoints are accessible..." -ForegroundColor Yellow
        try {
            # This should return a validation error but confirms endpoint is working
            $emptyMessage = @{} | ConvertTo-Json
            Invoke-RestMethod -Uri "http://localhost:4000/api/messages" -Method POST -Body $emptyMessage -ContentType "application/json"
        } catch {
            if ($_.ErrorDetails.Message -like "*required*" -or $_.ErrorDetails.Message -like "*validation*") {
                Write-Host "✅ Message endpoint is working (validation error expected)" -ForegroundColor Green
            } else {
                Write-Host "❌ Message endpoint error: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
