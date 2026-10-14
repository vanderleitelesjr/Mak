# Inspecting video references

Use the local extractor for a timestamped visual overview of a clip. A scene
sample helps locate material; it is not a frame-by-frame motion measurement.

```powershell
python -m venv .venv-video
.\.venv-video\Scripts\python.exe -m pip install -r scripts/video-watch/requirements.txt
.\.venv-video\Scripts\python.exe scripts/video-watch/extract.py "path\to\clip.mp4" 2026-09-15_motion-reference --max-frames 40
```

The output folder contains a local source copy, JPEG frames, `frames.json` with
timestamps and `report.html`. The script does not create a registry entry; add
the report as a step in the relevant card using the Workspace authoring skill.
Source videos can be large. Keep or publish them according to the task's needs.

For URL inputs, install FFmpeg if the downloader requires it. Downloads prefer
a modest-resolution video-only stream. Analyze speech from the original audio
with a separately configured transcription tool; do not assume audio exists in
the downloaded visual reference.

Open the extracted images and cite timestamps in your summary. For a walk cycle,
look for contact, passing, lift and recovery poses. If scene detection returns
too few frames for continuous motion, sample a denser sequence from the original
with FFmpeg or the editor. Verify the actual motion by playback before exporting
an animation based on it.

Use a new output folder for a different source. The helper deliberately reuses
an existing downloaded source to avoid repeating work.
