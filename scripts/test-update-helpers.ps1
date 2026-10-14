$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'update-helpers.ps1')
$taskFixture = @(
  [pscustomobject]@{ Name='mrmak-workspace.exe'; ProcessId=101; ParentProcessId=1; ExecutablePath='D:\My Apps\Mak\mrmak-workspace.exe' },
  [pscustomobject]@{ Name='node.exe'; ProcessId=102; ParentProcessId=101; ExecutablePath='D:\My Apps\Mak\runtime\node.exe' },
  [pscustomobject]@{ Name='powershell.exe'; ProcessId=103; ParentProcessId=102; ExecutablePath='C:\Windows\powershell.exe' },
  [pscustomobject]@{ Name='node.exe'; ProcessId=104; ParentProcessId=1; ExecutablePath='C:\Program Files\nodejs\node.exe' }
)
if (-not (Test-MakAncestor $taskFixture 103)) { throw 'Managed terminal was not detected.' }
if (Test-MakAncestor $taskFixture 104) { throw 'Unrelated process was blocked.' }
$taskRunning = @(Get-MakUpdateProcesses $taskFixture @('D:\My Apps\Mak'))
if ($taskRunning.Count -ne 2) { throw 'Custom install/service matching failed.' }
$taskOrphan = @(Get-MakUpdateProcesses @($taskFixture[1], $taskFixture[3]) @('D:\My Apps\Mak'))
if ($taskOrphan.Count -ne 1 -or $taskOrphan[0].ProcessId -ne 102) { throw 'Service tail was missed or an unrelated node process was included.' }
'Updater process checks passed; no installation or process termination performed.'
