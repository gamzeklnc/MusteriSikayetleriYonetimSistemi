param(
    [string]$NssmPath = "C:\Tools\nssm\nssm.exe",
    [string]$DotnetPath = "C:\Program Files\dotnet\dotnet.exe",
    [string]$NodePath = "C:\Program Files\nodejs\node.exe",
    [string]$BackendPath = "C:\Apps\Complaints\backend",
    [string]$FrontendPath = "C:\Apps\Complaints\frontend"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $NssmPath)) {
    throw "NSSM bulunamadi: $NssmPath"
}

if (!(Test-Path $DotnetPath)) {
    throw ".NET bulunamadi: $DotnetPath"
}

if (!(Test-Path $NodePath)) {
    throw "Node.js bulunamadi: $NodePath"
}

if (!(Test-Path $BackendPath)) {
    throw "Backend klasoru bulunamadi: $BackendPath"
}

if (!(Test-Path $FrontendPath)) {
    throw "Frontend klasoru bulunamadi: $FrontendPath"
}

$backendDll = Join-Path $BackendPath "ComplaintsAPI.dll"
if (!(Test-Path $backendDll)) {
    throw "Backend DLL bulunamadi: $backendDll"
}

$nextBin = Join-Path $FrontendPath "node_modules\next\dist\bin\next"
if (!(Test-Path $nextBin)) {
    throw "Next.js binary bulunamadi: $nextBin. Once frontend tarafinda npm install --omit=dev calistirin."
}

& $NssmPath install ComplaintsApi $DotnetPath $backendDll
& $NssmPath set ComplaintsApi AppDirectory $BackendPath
& $NssmPath set ComplaintsApi AppEnvironmentExtra "ASPNETCORE_ENVIRONMENT=Production" "ASPNETCORE_URLS=http://127.0.0.1:5000"
& $NssmPath set ComplaintsApi Start SERVICE_AUTO_START
& $NssmPath set ComplaintsApi AppStdout (Join-Path $BackendPath "logs\service-out.log")
& $NssmPath set ComplaintsApi AppStderr (Join-Path $BackendPath "logs\service-err.log")

& $NssmPath install ComplaintsFrontend $NodePath $nextBin "start" "-p" "3000" "-H" "127.0.0.1"
& $NssmPath set ComplaintsFrontend AppDirectory $FrontendPath
& $NssmPath set ComplaintsFrontend Start SERVICE_AUTO_START
& $NssmPath set ComplaintsFrontend AppStdout (Join-Path $FrontendPath "service-out.log")
& $NssmPath set ComplaintsFrontend AppStderr (Join-Path $FrontendPath "service-err.log")

Write-Host "Servisler olusturuldu. Sonraki adim: Start-Service ComplaintsApi ve Start-Service ComplaintsFrontend"
