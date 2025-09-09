# Test script for messaging functionality
Write-Host "Testing Messaging Functionality..." -ForegroundColor Green

# Create test users
$testUser1 = @{
    firstName = "John"
    lastName = "Client"  
    email = "john.client@test.com"
    username = "johnclient"
    password = "password123"
    role = "CLIENT"
}

$testUser2 = @{
    firstName = "Sarah"
    lastName = "Lawyer"
    email = "sarah.lawyer@test.com"
    username = "sarahlawyer"
    password = "password123"
    role = "LAWYER"
}

try {
    Write-Host "Creating test users..." -ForegroundColor Yellow
    
    # Create user 1 (Client)
    $json1 = $testUser1 | ConvertTo-Json
    $user1Response = Invoke-RestMethod -Uri "http://localhost:4000/api/users/register" -Method POST -Body $json1 -ContentType "application/json"
    Write-Host "User 1 created: $($user1Response.data.id)" -ForegroundColor Green
    
    # Create user 2 (Lawyer)
    $json2 = $testUser2 | ConvertTo-Json
    $user2Response = Invoke-RestMethod -Uri "http://localhost:4000/api/users/register" -Method POST -Body $json2 -ContentType "application/json"
    Write-Host "User 2 created: $($user2Response.data.id)" -ForegroundColor Green
    
    # Test sending a message
    Write-Host "Testing message sending..." -ForegroundColor Yellow
    $message = @{
        senderId = $user1Response.data.id
        receiverId = $user2Response.data.id
        content = "Hello Sarah! I need legal advice about my case."
    }
    
    $messageJson = $message | ConvertTo-Json
    $messageResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/messages" -Method POST -Body $messageJson -ContentType "application/json"
    Write-Host "Message sent successfully: $($messageResponse.data.id)" -ForegroundColor Green
    
    # Test getting conversation
    Write-Host "Testing conversation retrieval..." -ForegroundColor Yellow
    $conversationResponse = Invoke-RestMethod -Uri "http://localhost:4000/api/messages/$($user1Response.data.id)/$($user2Response.data.id)" -Method GET
    Write-Host "Conversation retrieved with $($conversationResponse.data.Count) messages" -ForegroundColor Green
    
    Write-Host "All messaging tests passed!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
