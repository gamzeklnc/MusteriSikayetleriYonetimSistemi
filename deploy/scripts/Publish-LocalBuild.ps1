param(
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$backendProject = Join-Path $ProjectRoot "backend\ComplaintsAPI\src\ComplaintsAPI"
$frontendProject = Join-Path $ProjectRoot "frontend\complaints-app"
$publishPath = "C:\Apps\Complaints\backend"

Push-Location $backendProject
dotnet restore
dotnet publish -c Release -o $publishPath
Pop-Location

Push-Location $frontendProject
npm install
npm run build
Pop-Location

Write-Host "Local build tamamlandi. Frontend klasorunu ayri olarak sunucuya kopyalayin."
