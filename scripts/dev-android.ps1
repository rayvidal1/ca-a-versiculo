# dev-android.ps1 — inicia Metro em 8081 de forma confiavel
# Uso: npm run dev:android

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$PORT = 8081

# 1. Liberar porta 8081 se ocupada
Write-Host "`n[1/3] Verificando porta $PORT..." -ForegroundColor Cyan
$occupied = netstat -ano | Select-String " :$PORT\s"
if ($occupied) {
    $lines = $occupied | ForEach-Object { $_.ToString().Trim() }
    $pids = $lines | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne '0') {
            Write-Host "  Encerrando processo PID $p na porta $PORT..." -ForegroundColor Yellow
            try { taskkill /PID $p /F 2>$null | Out-Null } catch {}
        }
    }
    Start-Sleep -Milliseconds 800
    Write-Host "  Porta $PORT liberada." -ForegroundColor Green
} else {
    Write-Host "  Porta $PORT ja esta livre." -ForegroundColor Green
}

# 2. adb reverse
Write-Host "`n[2/3] Configurando adb reverse tcp:$PORT tcp:$PORT..." -ForegroundColor Cyan
if (Test-Path $adb) {
    $devices = & $adb devices | Select-String "device$"
    if ($devices) {
        & $adb reverse tcp:$PORT tcp:$PORT | Out-Null
        Write-Host "  adb reverse configurado." -ForegroundColor Green
    } else {
        Write-Host "  AVISO: Nenhum dispositivo Android detectado. Conecte o celular e habilite USB Debugging." -ForegroundColor Yellow
    }
} else {
    Write-Host "  AVISO: adb nao encontrado em $adb" -ForegroundColor Yellow
}

# 3. Iniciar Metro
Write-Host "`n[3/3] Iniciando Metro em localhost:$PORT (--dev-client)...`n" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\.."
npx expo start --dev-client --port $PORT
