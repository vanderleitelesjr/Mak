"""
Extract scene-detected keyframes from a video so Claude can "watch" it via images.

Usage:
    python scripts/video-watch/extract.py <youtube_url_or_local_path> <entity_folder>
    python scripts/video-watch/extract.py <input> <entity> --threshold 27.0 --max-frames 60

Examples:
    python scripts/video-watch/extract.py https://youtube.com/watch?v=XXX 2026-04-30_video-watch-test
    python scripts/video-watch/extract.py ./video.mp4 2026-04-30_my-task --max-frames 30

Pipeline:
    1. Download video via yt-dlp (or use local file)
    2. Detect scene cuts via PySceneDetect (ContentDetector)
    3. Save one keyframe per scene as JPG
    4. Cap by --max-frames (uniformly subsample if exceeded)

Output: workspace/<entity>/
    - source.mp4         (downloaded video, if URL)
    - frames/0001.jpg ... (keyframes, zero-padded)
    - frames.json        (metadata: scene timestamps, frame paths)
    - report.html        (visual grid of all keyframes for the dashboard)
"""

import argparse
import html as html_utils
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
WORKSPACE = ROOT / "workspace"


def is_url(s: str) -> bool:
    return s.startswith("http://") or s.startswith("https://")


def download_video(url: str, out_dir: Path) -> Path:
    """Download video-only, H.264 720p, so OpenCV can decode without ffmpeg.

    We don't need audio for character/visual analysis. Forcing avc1 (H.264)
    avoids AV1/VP9 codecs that OpenCV's bundled FFmpeg can't always read.
    """
    out_path = out_dir / "source.mp4"
    if out_path.exists():
        print(f"[skip] source.mp4 already exists: {out_path}")
        return out_path

    print(f"[download] {url}")
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "-f", "bestvideo[height<=720][ext=mp4][vcodec^=avc1]/bestvideo[height<=720][vcodec^=avc1]/best[height<=720][ext=mp4]/best[height<=720]",
        "-o", str(out_path),
        url,
    ]
    subprocess.run(cmd, check=True)
    if not out_path.exists():
        # yt-dlp may keep its own extension if container differs
        candidates = sorted(out_dir.glob("source.*"))
        if candidates:
            return candidates[0]
        raise RuntimeError("yt-dlp finished but no source file found")
    return out_path


def detect_scenes(video_path: Path, threshold: float):
    """Return list of (start_frame, start_time_seconds) for each detected scene."""
    from scenedetect import detect, ContentDetector
    print(f"[detect] scene threshold={threshold}")
    scene_list = detect(str(video_path), ContentDetector(threshold=threshold))
    scenes = []
    for start, _end in scene_list:
        scenes.append((start.get_frames(), start.get_seconds()))
    if not scenes:
        # Empty result = single scene = whole video. Add frame 0.
        scenes = [(0, 0.0)]
    print(f"[detect] {len(scenes)} scenes")
    return scenes


def subsample(scenes, max_frames):
    """Uniformly pick max_frames items from scenes if it's longer."""
    if len(scenes) <= max_frames:
        return scenes
    step = len(scenes) / max_frames
    picked = [scenes[int(i * step)] for i in range(max_frames)]
    print(f"[subsample] {len(scenes)} -> {len(picked)}")
    return picked


def extract_frames(video_path: Path, scenes, out_dir: Path, jpeg_quality: int = 85):
    """Save one JPG per scene at its start frame using OpenCV."""
    import cv2

    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"OpenCV cannot open: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    print(f"[video] fps={fps:.2f} frames={total}")

    saved = []
    for idx, (frame_no, seconds) in enumerate(scenes, start=1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
        ok, frame = cap.read()
        if not ok or frame is None:
            print(f"[warn] could not read frame {frame_no}")
            continue
        name = f"{idx:04d}.jpg"
        path = out_dir / name
        cv2.imwrite(str(path), frame, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
        saved.append({
            "index": idx,
            "frame": frame_no,
            "timestamp": round(seconds, 2),
            "path": f"frames/{name}",
        })
    cap.release()
    return saved


def fmt_time(s: float) -> str:
    m, sec = divmod(s, 60)
    return f"{int(m):02d}:{sec:05.2f}"


def make_report(entity_dir: Path, meta: dict):
    """Write a simple grid-of-frames HTML report so the dashboard can display it."""
    rows = []
    for f in meta["frames"]:
        rows.append(f"""
        <figure>
          <a href="{html_utils.escape(f['path'], quote=True)}"><img src="{html_utils.escape(f['path'], quote=True)}" alt="Frame at {fmt_time(f['timestamp'])}" loading="lazy" /></a>
          <figcaption>#{f['index']:02d} &middot; {fmt_time(f['timestamp'])}</figcaption>
        </figure>""")

    html = f"""<!doctype html>
<html lang="en" data-mak-report="document"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Video Watch &mdash; {html_utils.escape(meta['entity'])}</title>
<link rel="stylesheet" href="../_shared/report.css"/>
<script defer src="../_shared/report.js"></script>
<style>
  body {{ margin: 0; padding: 24px; background: #111; color: #ddd;
         font-family: -apple-system, system-ui, sans-serif; }}
  h1 {{ font-size: 18px; font-weight: 500; margin: 0 0 6px; }}
  .meta {{ font-size: 12px; color: #888; margin-bottom: 20px; }}
  .meta a {{ color: #6cf; text-decoration: none; }}
  .grid {{ display: grid; gap: 14px;
          grid-template-columns: repeat(auto-fill, minmax(min(100%,320px), 1fr)); }}
  figure {{ margin: 0; }}
  figure img {{ width: 100%; border-radius: 6px; display: block;
               background: #000; }}
  figcaption {{ font-size: 11px; color: #888; padding: 6px 2px;
               font-variant-numeric: tabular-nums; }}
</style></head>
<body>
  <h1>Video Watch &mdash; {html_utils.escape(meta['entity'])}</h1>
  <div class="meta">
    Source: {html_utils.escape(meta['input'])}
    &nbsp;&middot;&nbsp; {meta['frame_count']} keyframes &nbsp;&middot;&nbsp;
    threshold {meta['threshold']}
  </div>
  <div class="grid">{''.join(rows)}
  </div>
</body></html>"""
    (entity_dir / "report.html").write_text(html, encoding="utf-8")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input", help="YouTube URL or local video file path")
    p.add_argument("entity", help="Workspace entity folder name (e.g. 2026-04-30_my-task)")
    p.add_argument("--threshold", type=float, default=27.0,
                   help="Scene-detection content threshold (lower = more scenes). Default 27.")
    p.add_argument("--max-frames", type=int, default=60,
                   help="Cap on number of keyframes saved. Default 60.")
    p.add_argument("--quality", type=int, default=85, help="JPEG quality 1-100")
    args = p.parse_args()

    if not 1 <= args.quality <= 100 or args.max_frames < 1 or args.threshold <= 0:
        p.error("Use quality 1-100, at least one frame and a positive threshold.")
    entity_dir = (WORKSPACE / args.entity).resolve()
    if entity_dir.parent != WORKSPACE.resolve():
        p.error("Entity must be a single folder name directly inside workspace.")
    entity_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = entity_dir / "frames"

    # 1. Get video
    if is_url(args.input):
        video_path = download_video(args.input, entity_dir)
    else:
        src = Path(args.input).resolve()
        if not src.exists():
            sys.exit(f"ERROR: file not found: {src}")
        video_path = entity_dir / f"source{src.suffix}"
        if not video_path.exists():
            shutil.copy2(src, video_path)

    # 2. Detect scenes
    scenes = detect_scenes(video_path, args.threshold)

    # 3. Cap
    scenes = subsample(scenes, args.max_frames)

    # 4. Extract
    saved = extract_frames(video_path, scenes, frames_dir, args.quality)

    # 5. Metadata
    meta = {
        "input": args.input,
        "entity": args.entity,
        "threshold": args.threshold,
        "max_frames": args.max_frames,
        "frame_count": len(saved),
        "frames": saved,
    }
    (entity_dir / "frames.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    make_report(entity_dir, meta)
    print(f"[done] {len(saved)} frames -> {frames_dir}")
    print(f"[done] metadata     -> {entity_dir / 'frames.json'}")
    print(f"[done] report       -> {entity_dir / 'report.html'}")


if __name__ == "__main__":
    main()
