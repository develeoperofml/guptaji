"""Trim two interesting 5s DJ-night clips, mute audio by writing video-only, web sizes."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "dist" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

CLIPS = [
    {
        "src": Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\video\WhatsApp Video 2026-11-15 at 12.23.29 PM.mp4"),
        "start": 3.2,
        "duration": 5.0,
        "out_name": "stranger-dj-portrait",
        "max_w": 720,
        "label": "portrait dance + tents",
    },
    {
        "src": Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\video\WhatsApp Video 2026-11-15 at 12.23.31 PM.mp4"),
        "start": 24.4,
        "duration": 5.0,
        "out_name": "stranger-dj-crowd",
        "max_w": 1280,
        "label": "landscape DJ crowd",
    },
]


def find_ffmpeg() -> str | None:
    candidates = [
        ROOT / "tools" / "ffmpeg" / "bin" / "ffmpeg.exe",
        ROOT / "tools" / "ffmpeg.exe",
        ROOT / "node_modules" / "@ffmpeg-installer" / "win32-x64" / "ffmpeg.exe",
        ROOT / "node_modules" / "ffmpeg-static" / "ffmpeg.exe",
    ]
    for candidate in candidates:
        if not candidate.exists():
            continue
        # Incomplete npm stubs are a few MB; real builds are much larger.
        if candidate.stat().st_size < 5_000_000:
            continue
        return str(candidate)
    try:
        import imageio_ffmpeg

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists() and Path(exe).stat().st_size >= 5_000_000:
            return exe
    except Exception:
        pass
    return None


def trim_with_ffmpeg(ffmpeg: str, clip: dict) -> Path:
    src = clip["src"]
    out = ASSETS / f"{clip['out_name']}.mp4"
    # Scale by orientation while keeping aspect; strip audio (-an)
    scale = (
        f"scale='min({clip['max_w']},iw)':-2"
        if True
        else f"scale={clip['max_w']}:-2"
    )
    cmd = [
        ffmpeg,
        "-y",
        "-ss",
        str(clip["start"]),
        "-t",
        str(clip["duration"]),
        "-i",
        str(src),
        "-an",
        "-vf",
        scale,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "28",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(out),
    ]
    print(" ", " ".join(cmd))
    subprocess.run(cmd, check=True)
    return out


def trim_with_cv2(clip: dict) -> Path:
    """Fallback: silent mp4 via OpenCV (may need remux later)."""
    src = clip["src"]
    cap = cv2.VideoCapture(str(src))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {src}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    start_f = int(clip["start"] * fps)
    end_f = int((clip["start"] + clip["duration"]) * fps)
    scale = min(1.0, clip["max_w"] / max(w, 1))
    ow, oh = int(w * scale) // 2 * 2, int(h * scale) // 2 * 2
    out = ASSETS / f"{clip['out_name']}.mp4"
    # Try H264 then mp4v
    writer = None
    for fourcc_name in ("avc1", "H264", "mp4v"):
        fourcc = cv2.VideoWriter_fourcc(*fourcc_name)
        writer = cv2.VideoWriter(str(out), fourcc, fps, (ow, oh))
        if writer.isOpened():
            print(f"  OpenCV writer {fourcc_name} {ow}x{oh} @ {fps:.2f}")
            break
        writer.release()
        writer = None
    if writer is None:
        raise RuntimeError("No OpenCV video writer available")

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_f)
    written = 0
    for fno in range(start_f, end_f):
        ok, frame = cap.read()
        if not ok:
            break
        if scale < 1:
            frame = cv2.resize(frame, (ow, oh), interpolation=cv2.INTER_AREA)
        elif (frame.shape[1], frame.shape[0]) != (ow, oh):
            frame = cv2.resize(frame, (ow, oh))
        writer.write(frame)
        written += 1
    writer.release()
    cap.release()
    print(f"  wrote {written} frames -> {out}")
    return out


def main() -> int:
    ffmpeg = find_ffmpeg()
    print("ffmpeg:", ffmpeg or "(none — OpenCV fallback)")
    results = []
    for clip in CLIPS:
        print(f"\n[{clip['label']}] {clip['src'].name} @ {clip['start']}s")
        if ffmpeg:
            out = trim_with_ffmpeg(ffmpeg, clip)
        else:
            out = trim_with_cv2(clip)
        size = out.stat().st_size
        cap = cv2.VideoCapture(str(out))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = cap.get(cv2.CAP_PROP_FPS) or 0
        cap.release()
        results.append(
            {
                "out": str(out),
                "bytes": size,
                "width": w,
                "height": h,
                "frames": n,
                "fps": round(fps, 2),
                "duration": round(n / fps, 2) if fps else 0,
            }
        )
        print(f"  -> {out.name} {w}x{h} {size/1024:.0f} KiB")
    print("\nDONE")
    for r in results:
        print(r)
    return 0


if __name__ == "__main__":
    sys.exit(main())
