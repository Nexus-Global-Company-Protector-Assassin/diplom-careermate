$prefix = "http://localhost:3001/api/v1"
$email = "test_user_$(Get-Random)@example.com"
$password = "password123"

Write-Host "1. Registering user: $email"
try {
    $regResponse = Invoke-RestMethod -Uri "$prefix/auth/register" -Method Post -ContentType "application/json" -Body (@{email=$email; password=$password} | ConvertTo-Json)
    Write-Host "Registration successful."
    $accessToken = $regResponse.access_token
    $refreshToken = $regResponse.refresh_token
    
    if (-not $accessToken -or -not $refreshToken) {
        Write-Error "Tokens missing in registration response."
        exit 1
    }
} catch {
    Write-Error "Registration failed: $_"
    exit 1
}

Write-Host "2. Logging in"
try {
    $loginResponse = Invoke-RestMethod -Uri "$prefix/auth/login" -Method Post -ContentType "application/json" -Body (@{email=$email; password=$password} | ConvertTo-Json)
    Write-Host "Login successful."
    $accessToken = $loginResponse.access_token
    $refreshToken = $loginResponse.refresh_token
} catch {
    Write-Error "Login failed: $_"
    exit 1
}

Write-Host "3. Refreshing tokens"
try {
    $refreshResponse = Invoke-RestMethod -Uri "$prefix/auth/refresh" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $refreshToken"}
    Write-Host "Refresh successful."
    $newAccessToken = $refreshResponse.access_token
    $newRefreshToken = $refreshResponse.refresh_token
    
    if (-not $newAccessToken -or -not $newRefreshToken) {
        Write-Error "Tokens missing in refresh response."
        exit 1
    }
} catch {
    Write-Error "Refresh failed: $_"
    exit 1
}

Write-Host "4. Logging out"
try {
    Invoke-RestMethod -Uri "$prefix/auth/logout" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $newAccessToken"}
    Write-Host "Logout successful."
} catch {
    Write-Error "Logout failed: $_"
    exit 1
}

Write-Host "All tests passed!"
