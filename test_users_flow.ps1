$prefix = "http://localhost:3001/api/v1"
$email = "test_user_$(Get-Random)@example.com"
$password = "password123"

Write-Host "1. Registering user: $email"
try {
    $regResponse = Invoke-RestMethod -Uri "$prefix/auth/register" -Method Post -ContentType "application/json" -Body (@{email=$email; password=$password} | ConvertTo-Json)
    $accessToken = $regResponse.access_token
    Write-Host "Registration successful."
} catch {
    Write-Error "Registration failed: $_"
    exit 1
}

Write-Host "2. Getting current user profile"
try {
    $profileResponse = Invoke-RestMethod -Uri "$prefix/users/me" -Method Get -ContentType "application/json" -Headers @{Authorization="Bearer $accessToken"}
    Write-Host "Get Profile successful. Email: $($profileResponse.email)"
    if ($profileResponse.email -ne $email) {
        Write-Error "Email mismatch!"
        exit 1
    }
} catch {
    Write-Error "Get Profile failed: $_"
    exit 1
}

Write-Host "3. Updating user profile"
$newEmail = "updated_$(Get-Random)@example.com"
try {
    $updateResponse = Invoke-RestMethod -Uri "$prefix/users/me" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $accessToken"} -Body (@{email=$newEmail} | ConvertTo-Json)
    Write-Host "Update Profile successful. New Email: $($updateResponse.email)"
    if ($updateResponse.email -ne $newEmail) {
        Write-Error "Email mismatch after update!"
        exit 1
    }
} catch {
    Write-Error "Update Profile failed: $_"
    exit 1
}

Write-Host "4. Verifying update with Get Profile"
try {
    $verifyResponse = Invoke-RestMethod -Uri "$prefix/users/me" -Method Get -ContentType "application/json" -Headers @{Authorization="Bearer $accessToken"}
    if ($verifyResponse.email -ne $newEmail) {
        Write-Error "Verification failed! Expected $newEmail, got $($verifyResponse.email)"
        exit 1
    }
    Write-Host "Verification successful."
} catch {
    Write-Error "Verification failed: $_"
    exit 1
}

Write-Host "All tests passed!"
