param([Parameter(Mandatory = $true)][string]$AppDirectory, [Parameter(Mandatory = $true)][string]$InstallerPath)
$ErrorActionPreference = 'Stop'
$publisher = $null
foreach ($file in @((Join-Path $AppDirectory 'TIGHT.exe'), $InstallerPath)) {
    $signature = Get-AuthenticodeSignature -LiteralPath $file
    if ($signature.Status -ne 'Valid') { throw "Release requires a valid publisher signature: $file" }
    $thumbprint = $signature.SignerCertificate.Thumbprint
    if (-not $thumbprint) { throw "Release requires an identifiable publisher certificate: $file" }
    if ($publisher -and $publisher -ne $thumbprint) { throw 'The app and installer must be signed by the same publisher certificate.' }
    $publisher = $thumbprint
}
