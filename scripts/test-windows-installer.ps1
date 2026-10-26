$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$install = Join-Path $env:LOCALAPPDATA 'Programs\TIGHT'
$shortcut = Join-Path ([Environment]::GetFolderPath('Programs')) 'TIGHT.lnk'
$directory = Join-Path $env:LOCALAPPDATA 'TIGHT'
$profile = Join-Path $env:APPDATA 'TIGHT'
if ($env:GITHUB_ACTIONS -ne 'true' -or -not $env:RUNNER_TEMP) { throw 'Run the disposable installer check in Windows CI.' }
if (Test-Path $profile) { throw 'The disposable installer check must not use an existing desktop profile.' }
if (Test-Path $directory) { throw 'The disposable installer check must not use existing saved games.' }
if (Test-Path $install) { throw "An existing TIGHT installation must not be replaced: $install" }
$setups = @(Get-ChildItem (Join-Path $root 'release\installer') -Filter '*-preview-setup.exe')
if ($setups.Count -ne 1) { throw 'Expected exactly one preview setup executable.' }
$setup = $setups[0].FullName
$signature = Get-AuthenticodeSignature -FilePath $setup
if ($signature.Status -ne 'NotSigned') { throw 'The preview artifact must be explicitly unsigned.' }
$exe = Join-Path $install 'TIGHT.exe'
$uninstall = Join-Path $install 'Uninstall TIGHT.exe'
function Install-Tight {
    $result = Start-Process -FilePath $setup -ArgumentList '/S' -Wait -PassThru
    if ($result.ExitCode -ne 0) { throw "Installer failed with exit code $($result.ExitCode)" }
    foreach ($file in @($exe, $uninstall, $shortcut, (Join-Path $install 'LICENSE'), (Join-Path $install 'TIGHT-LICENSE.txt'), (Join-Path $install 'THIRD-PARTY-NOTICES.txt'), (Join-Path $install 'LICENSES.chromium.html'))) {
        if (-not (Test-Path $file)) { throw "Missing installed file: $file" }
    }
    $shell = New-Object -ComObject WScript.Shell
    if ($shell.CreateShortcut($shortcut).TargetPath -ne $exe) { throw 'Start menu shortcut must launch the installed executable.' }
    $registration = @(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' | Where-Object { $_.DisplayName -eq 'TIGHT preview' })
    if ($registration.Count -ne 1) { throw 'Expected a per-user uninstall registration.' }
}
function Uninstall-Tight {
    $result = Start-Process -FilePath $uninstall -ArgumentList '/S' -Wait -PassThru
    if ($result.ExitCode -ne 0) { throw "Uninstaller failed with exit code $($result.ExitCode)" }
    if (Test-Path $exe) { throw 'Uninstall left the app executable behind.' }
    if (Test-Path $shortcut) { throw 'Uninstall left the Start menu shortcut behind.' }
    if (-not (Test-Path (Join-Path $directory 'games.sqlite'))) { throw 'Uninstall removed saved games.' }
    if (-not (Test-Path $profile)) { throw 'Uninstall removed the desktop profile.' }
}
try {
    Install-Tight
    & node (Join-Path $root 'tests\installer\installed-app.mjs') create $exe $directory
    if ($LASTEXITCODE -ne 0) { throw 'The installed application could not create a saved game.' }
    & node (Join-Path $root 'tests\installer\installed-app.mjs') blocked-update $exe $directory $setup
    if ($LASTEXITCODE -ne 0) { throw 'Setup or uninstall interrupted a running host.' }
    Install-Tight
    & node (Join-Path $root 'tests\installer\installed-app.mjs') resume $exe $directory
    if ($LASTEXITCODE -ne 0) { throw 'An in-place installation did not preserve saved games, library details and device permissions.' }
    Uninstall-Tight
    Install-Tight
    & node (Join-Path $root 'tests\installer\installed-app.mjs') resume $exe $directory
    if ($LASTEXITCODE -ne 0) { throw 'The reinstalled application could not restore its saved game.' }
    Uninstall-Tight
} finally {
    if (Test-Path $uninstall) { Start-Process -FilePath $uninstall -ArgumentList '/S' -Wait | Out-Null }
    if (Test-Path $directory) { Remove-Item $directory -Recurse -Force }
    if (Test-Path $profile) { Remove-Item $profile -Recurse -Force }
}
