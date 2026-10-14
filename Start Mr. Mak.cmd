@echo off
setlocal
set "MRMAK_LAUNCH_ROOT=%~dp0"
if exist "%LOCALAPPDATA%\Mr. Mak Workspace\mrmak-workspace.exe" (
  start "" "%LOCALAPPDATA%\Mr. Mak Workspace\mrmak-workspace.exe" --repo "%MRMAK_LAUNCH_ROOT%."
  exit /b 0
)
if exist "%MRMAK_LAUNCH_ROOT%src-tauri\target\release\mrmak-workspace.exe" (
  start "" "%MRMAK_LAUNCH_ROOT%src-tauri\target\release\mrmak-workspace.exe" --repo "%MRMAK_LAUNCH_ROOT%."
  exit /b 0
)
echo Install Mr. Mak Workspace from this project's GitHub Releases.
echo Or build with: powershell -NoProfile -ExecutionPolicy Bypass -File Setup.ps1 -Mode Desktop
echo See docs\getting-started.md for agent-guided setup.
pause
