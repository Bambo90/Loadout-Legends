param(
    [int]$MaxBackups = 10,
    [string]$TagPrefix = "backup-auto-",
    [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param([string]$Args)
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "git"
    $pinfo.Arguments = $Args
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.WorkingDirectory = $PSScriptRoot + "\.."
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) {
        throw "git $Args failed: $stderr"
    }
    return $stdout.Trim()
}

# Ensure repo
Invoke-Git "rev-parse --is-inside-work-tree" | Out-Null

# Commit changes if any
$changes = Invoke-Git "status --porcelain"
if ($changes) {
    Invoke-Git "add -A"
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
    Invoke-Git "commit -m \"Auto backup $timestamp\""
}

# Skip tagging if HEAD already matches the newest auto-backup tag
$head = Invoke-Git "rev-parse HEAD"
$latestTag = Invoke-Git "for-each-ref --sort=-creatordate --format=\"%(refname:short)\" refs/tags/$TagPrefix*" | Select-Object -First 1
if ($latestTag) {
    $latestHash = Invoke-Git "rev-list -n 1 $latestTag"
    if ($latestHash -eq $head) {
        Write-Host "No changes since last auto-backup tag; skipping."
        exit 0
    }
}

# Create a new tag on HEAD
$tag = "$TagPrefix" + (Get-Date -Format "yyyy-MM-dd_HH-mm")
Invoke-Git "tag -a $tag -m \"Auto backup $tag\""

# Push tag and commits (if any)
Invoke-Git "push $Remote --tags"

# Prune old tags beyond MaxBackups
$tags = Invoke-Git "for-each-ref --format=\"%(refname:short)\" refs/tags/$TagPrefix*"
if ($tags) {
    $tagList = $tags -split "`n" | Where-Object { $_ -like "$TagPrefix*" }
    # Sort by tag name (timestamped)
    $sorted = $tagList | Sort-Object
    if ($sorted.Count -gt $MaxBackups) {
        $toDelete = $sorted | Select-Object -First ($sorted.Count - $MaxBackups)
        foreach ($t in $toDelete) {
            Invoke-Git "tag -d $t"
            Invoke-Git "push $Remote :refs/tags/$t"
        }
    }
}
