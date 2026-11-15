import cv2
import json
from pathlib import Path

vids = [
    Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\video\WhatsApp Video 2026-11-15 at 12.23.29 PM.mp4"),
    Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\video\WhatsApp Video 2026-11-15 at 12.23.31 PM.mp4"),
    Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\roam-and-beyond\manali_images\WhatsApp Video 2026-11-14 at 2.12.23 PM.mp4"),
]
out = Path(r"C:\Users\AnkitKhandelwal\Desktop\jaip\roam-and-beyond\.tmp-video-analysis")
out.mkdir(parents=True, exist_ok=True)
report = []

for v in vids:
    cap = cv2.VideoCapture(str(v))
    if not cap.isOpened():
        report.append({"file": v.name, "error": "cannot open"})
        continue
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    dur = n / fps if fps else 0.0

    samples = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]
    frame_paths = []
    for i, t in enumerate(samples):
        fno = min(max(int(t * n), 0), max(n - 1, 0))
        cap.set(cv2.CAP_PROP_POS_FRAMES, fno)
        ok, frame = cap.read()
        if not ok:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        bright = float(gray.mean())
        sat = float(cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)[:, :, 1].mean())
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in v.stem)[:48]
        p = out / f"{safe}_{i}_{int(t * 100)}.jpg"
        scale = 720 / max(h, 1)
        preview = cv2.resize(frame, (int(w * scale), int(h * scale))) if scale < 1 else frame
        cv2.imwrite(str(p), preview, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        frame_paths.append(
            {
                "t": round(t * dur, 2),
                "path": str(p),
                "bright": round(bright, 1),
                "sat": round(sat, 1),
            }
        )

    step = max(int(fps * 0.5), 1)
    motion = []
    prev = None
    for fno in range(0, n, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fno)
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(frame, (160, 90))
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        if prev is not None:
            diff = cv2.absdiff(g, prev)
            motion.append({"t": round(fno / fps, 2), "energy": float(diff.mean())})
        prev = g
    cap.release()

    best = []
    win = 5.0
    if motion:
        scored = []
        for m in motion:
            t0 = m["t"]
            t1 = t0 + win
            if t1 > dur + 0.2:
                continue
            chunk = [x for x in motion if t0 <= x["t"] < t1]
            if not chunk:
                continue
            score = sum(x["energy"] for x in chunk) / len(chunk)
            scored.append({"start": t0, "score": round(score, 3)})
        scored.sort(key=lambda x: x["score"], reverse=True)
        picked = []
        for b in scored:
            if all(abs(b["start"] - p["start"]) >= 3 for p in picked):
                picked.append(b)
            if len(picked) >= 3:
                break
        best = picked

    report.append(
        {
            "file": str(v),
            "name": v.name,
            "width": w,
            "height": h,
            "fps": round(fps, 2),
            "frames": n,
            "duration_s": round(dur, 2),
            "size_mb": round(v.stat().st_size / 1024 / 1024, 2),
            "orientation": "portrait" if h > w else "landscape",
            "samples": frame_paths,
            "best_5s": best,
        }
    )

print(json.dumps(report, indent=2))
(out / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"\nWrote {out / 'report.json'}")
