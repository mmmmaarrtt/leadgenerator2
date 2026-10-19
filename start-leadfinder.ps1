# Startet den Lead Finder lokal (http://localhost:8765) und leitet Datenabfragen an OpenStreetMap weiter.
param([switch]$NoBrowser)
$root = $PSScriptRoot
$port = if ($env:PORT) { $env:PORT } else { '8765' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$port/")
$l.Start()
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]12288  # TLS 1.2 + 1.3
Add-Type -AssemblyName System.Net.Http
$http = New-Object System.Net.Http.HttpClient
$http.Timeout = [TimeSpan]::FromSeconds(50)
$http.DefaultRequestHeaders.UserAgent.ParseAdd('LeadFinderStuttgart/1.0')
Write-Host "Lead Finder laeuft auf http://localhost:$port  (Fenster offen lassen, Strg+C beendet)"
if (-not $NoBrowser) { Start-Process "http://localhost:$port/" }

while ($l.IsListening) {
  $ctx = $l.GetContext()
  $res = $ctx.Response
  try {
    $path = $ctx.Request.Url.AbsolutePath.TrimStart('/')
    if ($path -eq 'overpass') {
      $data = $ctx.Request.QueryString['data']
      $r = $null
      # Hauptserver ist oft kurz ueberlastet (502/504) -> mehrfach versuchen, dann Spiegelserver
      $main = 'https://overpass-api.de/api/interpreter'
      foreach ($ep in $main, $main, $main,'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter') {
        if ($r) { Start-Sleep -Seconds 2 }
        try {
          $r = $http.GetAsync($ep + '?data=' + [uri]::EscapeDataString($data)).GetAwaiter().GetResult()
          Write-Host "$(Get-Date -Format T) $ep -> $([int]$r.StatusCode)"
          if ($r.IsSuccessStatusCode) { break }
        } catch { Write-Host "$(Get-Date -Format T) $ep -> Fehler: $($_.Exception.InnerException.InnerException.Message)"; $r = $null }
      }
      if ($r -and $r.IsSuccessStatusCode) {
        $b = $r.Content.ReadAsByteArrayAsync().Result
        $res.ContentType = 'application/json; charset=utf-8'
      } else {
        $res.StatusCode = 502
        $b = [Text.Encoding]::UTF8.GetBytes('{"error":"Overpass nicht erreichbar"}')
      }
    } else {
      if (-not $path) { $path = 'lead-finder-stuttgart.html' }
      $f = Join-Path $root $path
      if ($path -notmatch '\.\.' -and (Test-Path $f -PathType Leaf)) {
        $b = [IO.File]::ReadAllBytes($f)
        $res.ContentType = 'text/html; charset=utf-8'
      } else { $res.StatusCode = 404; $b = @() }
    }
    if ($b.Length) { $res.OutputStream.Write($b, 0, $b.Length) }
  } catch { $res.StatusCode = 500 }
  $res.Close()
}
