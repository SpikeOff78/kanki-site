# KANKI - petit serveur local (aucune installation : PowerShell est deja dans Windows)
# Sert ce dossier sur http://localhost:3000 . Ferme la fenetre pour l'arreter.
$racine = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 3000
$serveur = New-Object System.Net.HttpListener
$serveur.Prefixes.Add("http://localhost:$port/")
try { $serveur.Start() } catch {
  Write-Host ""
  Write-Host "  Impossible d'ouvrir le port $port : il est deja utilise." -ForegroundColor Red
  Write-Host "  Ferme l'autre fenetre de serveur, puis relance lancer.bat."
  exit 1
}
Write-Host ""
Write-Host "  KANKI tourne sur  http://localhost:$port" -ForegroundColor Red
Write-Host "  Laisse cette fenetre ouverte. Ferme-la pour arreter le site."
Write-Host ""
Start-Process "http://localhost:$port/"
$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp';
  '.gif'='image/gif'; '.svg'='image/svg+xml'; '.mp4'='video/mp4'; '.ico'='image/x-icon'; '.glb'='model/gltf-binary'
}
while ($serveur.IsListening) {
  try {
    $ctx = $serveur.GetContext()
    $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($chemin -eq '') { $chemin = 'index.html' }
    $plein = [IO.Path]::GetFullPath((Join-Path $racine $chemin))
    if (-not $plein.StartsWith($racine) -or -not (Test-Path $plein -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $o = [Text.Encoding]::UTF8.GetBytes('404 - fichier introuvable')
      $ctx.Response.OutputStream.Write($o, 0, $o.Length); $ctx.Response.Close(); continue
    }
    $ext = [IO.Path]::GetExtension($plein).ToLower()
    $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $octets = [IO.File]::ReadAllBytes($plein)
    $ctx.Response.ContentLength64 = $octets.Length
    $ctx.Response.OutputStream.Write($octets, 0, $octets.Length)
    $ctx.Response.Close()
    Write-Host ("  " + $ctx.Request.HttpMethod + " /" + $chemin)
  } catch { }
}
