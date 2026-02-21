$content = Get-Content -Raw -Path "limits.json"
try {
    $object = $content | ConvertFrom-Json
    if ($object) {
        $object | ConvertTo-Json -Depth 20 | Set-Content -Path "limits.json" -Encoding UTF8
        Write-Host "SUCCESS: JSON cleaned and saved."
    } else {
        Write-Host "ERROR: JSON object is empty."
    }
} catch {
    Write-Host "ERROR: Failed to parse JSON. Message: $($_.Exception.Message)"
}
