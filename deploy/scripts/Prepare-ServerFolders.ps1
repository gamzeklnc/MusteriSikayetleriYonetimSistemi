param(
    [string]$BasePath = "C:\Apps\Complaints"
)

$ErrorActionPreference = "Stop"

$folders = @(
    $BasePath,
    (Join-Path $BasePath "backend"),
    (Join-Path $BasePath "backend\wwwroot"),
    (Join-Path $BasePath "backend\wwwroot\uploads"),
    (Join-Path $BasePath "backend\wwwroot\uploads\complaint-documents"),
    (Join-Path $BasePath "backend\logs"),
    (Join-Path $BasePath "frontend")
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Olusturuldu: $folder"
    }
    else {
        Write-Host "Zaten var: $folder"
    }
}

Write-Host "Klasor hazirligi tamamlandi."
