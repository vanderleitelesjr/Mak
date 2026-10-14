$ErrorActionPreference = 'Stop'
python (Join-Path $PSScriptRoot 'setup-local-voice.py') read-aloud
if ($LASTEXITCODE -ne 0) { throw 'Local voice setup failed. Check the output above and use Python 3.10-3.12.' }
