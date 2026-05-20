# KhidmatApp Backend Stress Test Script
# Runs 5 scenarios and saves results to docs/

$baseUrl = "http://localhost:5000"
$docsDir = "c:\Users\hnase\Desktop\Khidmat_App\antigravity-service-app\backend\docs"
$allResults = @{}

function Invoke-ApiCall {
    param(
        [string]$Endpoint,
        [hashtable]$Body,
        [string]$Method = "POST"
    )
    try {
        $json = $Body | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Body $json -ContentType "application/json" -ErrorAction Stop
        return @{ success = $true; data = $response; error = $null }
    } catch {
        $errorBody = $null
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $reader.Close()
            } catch {
                $errorBody = $_.Exception.Message
            }
        }
        return @{ success = $false; data = $errorBody; error = $_.Exception.Message; statusCode = $_.Exception.Response.StatusCode.value__ }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCENARIO 1: No provider available" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scenario1 = Invoke-ApiCall -Endpoint "/api/match-providers" -Body @{
    service_type = "spaceship mechanic"
    location = "Blue Area"
}
Write-Host ($scenario1 | ConvertTo-Json -Depth 10)
$scenario1Result = @{
    scenario = "Scenario 1: No provider available"
    endpoint = "POST /api/match-providers"
    request = @{ service_type = "spaceship mechanic"; location = "Blue Area" }
    response = $scenario1
    timestamp = (Get-Date -Format "o")
    expected = "success=true, empty providers array, or message about no providers found"
}
$scenario1Result | ConvertTo-Json -Depth 10 | Out-File "$docsDir\scenario_1_no_provider.json" -Encoding UTF8
$allResults["scenario_1"] = $scenario1Result

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCENARIO 2: Provider cancels / reschedule" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# First booking
$scenario2a = Invoke-ApiCall -Endpoint "/api/book-service" -Body @{
    user_id = "user_stress_02"
    provider_id = "prov_ac_001"
    date = "2026-05-22"
    time_slot = "09:00-12:00"
    price_total = 5000
}
Write-Host "First booking:" ($scenario2a | ConvertTo-Json -Depth 10)

# Second booking (same slot, different user)
$scenario2b = Invoke-ApiCall -Endpoint "/api/book-service" -Body @{
    user_id = "user_stress_02b"
    provider_id = "prov_ac_001"
    date = "2026-05-22"
    time_slot = "09:00-12:00"
    price_total = 5000
}
Write-Host "Second booking:" ($scenario2b | ConvertTo-Json -Depth 10)

$scenario2Result = @{
    scenario = "Scenario 2: Provider cancels after confirmation / auto-reschedule"
    endpoint = "POST /api/book-service"
    first_booking = @{
        request = @{ user_id = "user_stress_02"; provider_id = "prov_ac_001"; date = "2026-05-22"; time_slot = "09:00-12:00"; price_total = 5000 }
        response = $scenario2a
    }
    second_booking = @{
        request = @{ user_id = "user_stress_02b"; provider_id = "prov_ac_001"; date = "2026-05-22"; time_slot = "09:00-12:00"; price_total = 5000 }
        response = $scenario2b
    }
    timestamp = (Get-Date -Format "o")
    expected = "Second call returns conflict=true, suggested_slots array"
}
$scenario2Result | ConvertTo-Json -Depth 10 | Out-File "$docsDir\scenario_2_reschedule.json" -Encoding UTF8
$allResults["scenario_2"] = $scenario2Result

# Extract booking_id for scenario 5
$bookingId = $null
if ($scenario2a.data -and $scenario2a.data.booking_id) {
    $bookingId = $scenario2a.data.booking_id
} elseif ($scenario2a.data -and $scenario2a.data.bookingId) {
    $bookingId = $scenario2a.data.bookingId
} elseif ($scenario2a.data -and $scenario2a.data.booking -and $scenario2a.data.booking.id) {
    $bookingId = $scenario2a.data.booking.id
} else {
    $bookingId = "booking_stress_test_001"
}
Write-Host "Using booking_id for scenario 5: $bookingId"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCENARIO 3: Misspelled/ambiguous input" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scenario3 = Invoke-ApiCall -Endpoint "/api/parse-intent" -Body @{
    userInput = "asdfghjkl random gibberish xyz"
}
Write-Host ($scenario3 | ConvertTo-Json -Depth 10)
$scenario3Result = @{
    scenario = "Scenario 3: Misspelled/ambiguous input clarification"
    endpoint = "POST /api/parse-intent"
    request = @{ userInput = "asdfghjkl random gibberish xyz" }
    response = $scenario3
    timestamp = (Get-Date -Format "o")
    expected = "Low confidence score or clarification_needed=true"
}
$scenario3Result | ConvertTo-Json -Depth 10 | Out-File "$docsDir\scenario_3_clarification.json" -Encoding UTF8
$allResults["scenario_3"] = $scenario3Result

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCENARIO 4: Double-booking prevention" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# First booking
$scenario4a = Invoke-ApiCall -Endpoint "/api/book-service" -Body @{
    user_id = "user_race_A"
    provider_id = "prov_ac_003"
    date = "2026-05-22"
    time_slot = "09:00-12:00"
    price_total = 4000
}
Write-Host "Race booking A:" ($scenario4a | ConvertTo-Json -Depth 10)

# Second booking (same slot)
$scenario4b = Invoke-ApiCall -Endpoint "/api/book-service" -Body @{
    user_id = "user_race_B"
    provider_id = "prov_ac_003"
    date = "2026-05-22"
    time_slot = "09:00-12:00"
    price_total = 4000
}
Write-Host "Race booking B:" ($scenario4b | ConvertTo-Json -Depth 10)

$scenario4Result = @{
    scenario = "Scenario 4: Double-booking prevention (race condition)"
    endpoint = "POST /api/book-service"
    first_booking = @{
        request = @{ user_id = "user_race_A"; provider_id = "prov_ac_003"; date = "2026-05-22"; time_slot = "09:00-12:00"; price_total = 4000 }
        response = $scenario4a
    }
    second_booking = @{
        request = @{ user_id = "user_race_B"; provider_id = "prov_ac_003"; date = "2026-05-22"; time_slot = "09:00-12:00"; price_total = 4000 }
        response = $scenario4b
    }
    timestamp = (Get-Date -Format "o")
    expected = "First succeeds, second returns conflict=true"
}
$scenario4Result | ConvertTo-Json -Depth 10 | Out-File "$docsDir\scenario_4_double_booking.json" -Encoding UTF8
$allResults["scenario_4"] = $scenario4Result

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SCENARIO 5: Price dispute / decision tree" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scenario5 = Invoke-ApiCall -Endpoint "/api/file-dispute" -Body @{
    booking_id = $bookingId
    user_id = "user_stress_02"
    provider_id = "prov_ac_001"
    issue_type = "quality"
    severity = "serious"
    details = "Provider damaged my AC unit"
}
Write-Host ($scenario5 | ConvertTo-Json -Depth 10)
$scenario5Result = @{
    scenario = "Scenario 5: Price dispute / decision tree"
    endpoint = "POST /api/file-dispute"
    request = @{
        booking_id = $bookingId
        user_id = "user_stress_02"
        provider_id = "prov_ac_001"
        issue_type = "quality"
        severity = "serious"
        details = "Provider damaged my AC unit"
    }
    response = $scenario5
    timestamp = (Get-Date -Format "o")
    expected = "dispute_status=escalated_human, provider_flagged info"
}
$scenario5Result | ConvertTo-Json -Depth 10 | Out-File "$docsDir\scenario_5_dispute.json" -Encoding UTF8
$allResults["scenario_5"] = $scenario5Result

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SAVING COMBINED RESULTS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$allResults | ConvertTo-Json -Depth 15 | Out-File "$docsDir\stress_test_results.json" -Encoding UTF8

Write-Host "All results saved to $docsDir"
Write-Host "Files created:"
Get-ChildItem "$docsDir\scenario_*.json", "$docsDir\stress_test_results.json" | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Length) bytes)" }
Write-Host ""
Write-Host "STRESS TEST COMPLETE" -ForegroundColor Green
