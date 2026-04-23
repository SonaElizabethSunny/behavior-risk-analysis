"""
=============================================================
  SCVD Violence Classifier — YOLOv8 Training Pipeline
  Dataset: toluwaniaremu/smartcity-cctv-violence-detection-dataset-scvd
=============================================================
  Steps:
    1. Download dataset via kagglehub  (needs kaggle.json)
    2. Inspect folder structure & auto-detect fight/normal videos
    3. Extract frames evenly from each video
    4. Train YOLOv8n-cls (nano image classifier — fast & accurate)
    5. Save best weights → ml_service/models/fight_classifier.pt

  Run:
    python ml_service/training/train_fight_classifier.py

  One-time setup (Kaggle API token):
    1. Go to https://www.kaggle.com/settings  →  API  →  Create New Token
    2. Save kaggle.json to:  C:/Users/<YourUser>/.kaggle/kaggle.json
=============================================================
"""

import os, sys, shutil, random, json
from pathlib import Path

import cv2
import numpy as np
from tqdm import tqdm

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
ML_DIR      = SCRIPT_DIR.parent
FRAMES_DIR  = SCRIPT_DIR / "scvd_frames"       # extracted frames live here
MODEL_OUT   = ML_DIR / "models" / "fight_classifier.pt"

# ──────────────────────────────────────────────────────────────────────────────
# Training hyper-parameters  (change these if needed)
# ──────────────────────────────────────────────────────────────────────────────
FRAMES_PER_VIDEO = 50      # frames to sample per clip  (more = better accuracy)
IMG_SIZE         = 224     # YOLOv8-cls input size
EPOCHS           = 40      # training epochs  (50-100 for production)
BATCH            = 16      # lower if you run out of RAM
TRAIN_RATIO      = 0.80    # 80 % train / 20 % val
BASE_MODEL       = "yolov8n-cls.pt"   # swap to yolov8s-cls.pt for higher accuracy

# ──────────────────────────────────────────────────────────────────────────────
# Dataset: SCVD keyword mapping
# ──────────────────────────────────────────────────────────────────────────────
FIGHT_KEYWORDS  = ["violence", "fight", "assault", "aggress", "attack",
                   "violent", "combat", "brawl", "shooting", "stabbing"]
NORMAL_KEYWORDS = ["nonviolence", "non_violence", "noviolence", "normal",
                   "no_fight", "daily", "peaceful", "nonviolent"]

VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v"}


def log(msg: str):
    # Use errors='replace' to avoid cp1252 crash on Windows console
    sys.stdout.buffer.write((f"[TRAIN] {msg}\n").encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()


def check_kaggle_credentials():
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        log("=" * 60)
        log("KAGGLE CREDENTIALS NOT FOUND")
        log("=" * 60)
        log("")
        log("  Follow these steps to set up your Kaggle API token:")
        log("  1. Go to: https://www.kaggle.com/settings")
        log("  2. Scroll to 'API' section -> click 'Create New Token'")
        log("  3. A file 'kaggle.json' will be downloaded")
        log(f"  4. Move it to: {kaggle_json}")
        log("")
        log("  Then run this script again.")
        log("=" * 60)
        sys.exit(1)
    log(f"OK - Kaggle credentials found at {kaggle_json}")


def download_dataset() -> Path:
    import kagglehub
    log("Downloading SCVD dataset from Kaggle...")
    log("  toluwaniaremu/smartcity-cctv-violence-detection-dataset-scvd")
    path = kagglehub.dataset_download(
        "toluwaniaremu/smartcity-cctv-violence-detection-dataset-scvd"
    )
    root = Path(path)
    log(f"  Downloaded -> {root}")
    return root


def classify_video(rel_path: str):
    """Return 'fight', 'normal', or None based on path keywords."""
    p = rel_path.lower().replace("\\", "/")
    if any(kw in p for kw in FIGHT_KEYWORDS):
        return "fight"
    if any(kw in p for kw in NORMAL_KEYWORDS):
        return "normal"
    return None


def collect_videos(root: Path):
    fight, normal, unknown = [], [], []
    for p in root.rglob("*"):
        if p.suffix.lower() not in VIDEO_EXTS:
            continue
        label = classify_video(str(p.relative_to(root)))
        if label == "fight":
            fight.append(p)
        elif label == "normal":
            normal.append(p)
        else:
            unknown.append(p)
    return fight, normal, unknown


def smart_auto_split(root: Path, fight: list, normal: list, unknown: list):
    """
    If auto-detection missed videos, try splitting top-level folders evenly.
    The SCVD dataset usually has two top-level dirs: Violence / NonViolence.
    """
    if fight and normal:
        return fight, normal  # already split, nothing to do

    log("  Auto-detection missed some videos - scanning top-level folders...")
    top_dirs = sorted([d for d in root.iterdir() if d.is_dir()])
    log(f"  Top-level folders: {[d.name for d in top_dirs]}")

    for d in top_dirs:
        vids = []
        for ext in VIDEO_EXTS:
            vids.extend(d.rglob(f"*{ext}"))
        label = classify_video(d.name)
        if label == "fight":
            fight.extend(vids)
        elif label == "normal":
            normal.extend(vids)
        else:
            # Last resort: if exactly 2 dirs, assume first=fight second=normal
            if len(top_dirs) == 2:
                idx = top_dirs.index(d)
                if idx == 0:
                    fight.extend(vids)
                    log(f"  Assumed FIGHT -> {d.name}  ({len(vids)} videos)")
                else:
                    normal.extend(vids)
                    log(f"  Assumed NORMAL -> {d.name}  ({len(vids)} videos)")

    return fight, normal


def extract_frames(video_path: Path, out_dir: Path, n: int = FRAMES_PER_VIDEO) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    cap   = cv2.VideoCapture(str(video_path))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return 0

    step  = max(1, total // n)
    saved = 0
    stem  = video_path.stem.replace(" ", "_")[:35]

    for i in range(n):
        frame_pos = min(i * step, total - 1)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
        cv2.imwrite(str(out_dir / f"{stem}_{i:04d}.jpg"), frame,
                    [cv2.IMWRITE_JPEG_QUALITY, 90])
        saved += 1

    cap.release()
    return saved


def build_frame_dataset(fight_vids, normal_vids):
    log(f"Extracting {FRAMES_PER_VIDEO} frames/video -> {FRAMES_DIR}")
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)

    for split in ("train", "val"):
        for cls in ("fight", "normal"):
            (FRAMES_DIR / split / cls).mkdir(parents=True, exist_ok=True)

    stats = {}
    for cls, vids in [("fight", fight_vids), ("normal", normal_vids)]:
        random.shuffle(vids)
        n_train = int(len(vids) * TRAIN_RATIO)
        splits  = {"train": vids[:n_train], "val": vids[n_train:]}
        total   = 0
        for split, clip_list in splits.items():
            out = FRAMES_DIR / split / cls
            for v in tqdm(clip_list, desc=f"  {cls}/{split}", unit="clip"):
                total += extract_frames(v, out)
        stats[cls] = total
        log(f"  {cls}: {len(vids)} clips -> {total} frames")

    # Sanity check balance
    f, n = stats.get("fight", 0), stats.get("normal", 0)
    ratio = min(f, n) / max(f, n, 1)
    if ratio < 0.4:
        log(f"  WARNING: Class imbalance (fight={f}, normal={n}).")
        log("      Consider increasing FRAMES_PER_VIDEO for the minority class.")


def train_yolo():
    from ultralytics import YOLO
    log(f"Starting YOLOv8 training  [{BASE_MODEL}]")
    log(f"  Epochs={EPOCHS}  Batch={BATCH}  ImgSize={IMG_SIZE}x{IMG_SIZE}")
    log(f"  Data directory: {FRAMES_DIR}")

    model = YOLO(BASE_MODEL)
    model.train(
        data     = str(FRAMES_DIR),
        task     = "classify",
        epochs   = EPOCHS,
        imgsz    = IMG_SIZE,
        batch    = BATCH,
        name     = "scvd_fight_cls",
        project  = str(SCRIPT_DIR / "runs"),
        patience = 10,
        save     = True,
        plots    = True,
        workers  = 4,
        verbose  = True,
    )

    # Locate and copy best.pt
    candidates = sorted(
        (SCRIPT_DIR / "runs" / "scvd_fight_cls").rglob("best.pt"),
        key=lambda p: p.stat().st_mtime
    )
    if candidates:
        MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(str(candidates[-1]), str(MODEL_OUT))
        log(f"DONE - Best model saved -> {MODEL_OUT}")
    else:
        log("WARNING - Could not locate best.pt -- check the runs/ folder manually.")


def print_summary(fight_vids, normal_vids):
    log("=" * 60)
    log("  Dataset Summary")
    log("=" * 60)
    log(f"  Fight clips  : {len(fight_vids)}")
    log(f"  Normal clips : {len(normal_vids)}")
    log(f"  Frames/clip  : {FRAMES_PER_VIDEO}")
    log(f"  ~Total frames: {(len(fight_vids) + len(normal_vids)) * FRAMES_PER_VIDEO}")
    log(f"  Epochs       : {EPOCHS}")
    log(f"  Base model   : {BASE_MODEL}")
    log("=" * 60)


def main():
    log("=" * 60)
    log("  SCVD Violence Classifier - Training Pipeline")
    log("=" * 60)

    # ── 1. Kaggle credentials ─────────────────────────────────────
    check_kaggle_credentials()

    # ── 2. Download ───────────────────────────────────────────────
    dataset_root = download_dataset()

    # ── 3. Collect & classify videos ─────────────────────────────
    log("\nScanning dataset for fight/normal videos...")
    fight_vids, normal_vids, unknown_vids = collect_videos(dataset_root)
    log(f"  Auto-detected  - fight: {len(fight_vids)}, normal: {len(normal_vids)}, unknown: {len(unknown_vids)}")

    fight_vids, normal_vids = smart_auto_split(
        dataset_root, fight_vids, normal_vids, unknown_vids
    )

    if len(fight_vids) == 0 or len(normal_vids) == 0:
        log("Could not find both fight AND normal videos.")
        log(f"    Please inspect the dataset at: {dataset_root}")
        for p in list(dataset_root.rglob("*"))[:25]:
            log(f"    {p.relative_to(dataset_root)}")
        sys.exit(1)

    print_summary(fight_vids, normal_vids)

    # ── 4. Extract frames ─────────────────────────────────────────
    log("\nExtracting frames from videos...")
    build_frame_dataset(fight_vids, normal_vids)

    # ── 5. Train ──────────────────────────────────────────────────
    log("\nStarting YOLO training...")
    train_yolo()

    log("")
    log("=" * 60)
    log("  Training Complete!")
    log(f"  Model -> {MODEL_OUT}")
    log("  Restart the ML service to activate the new model.")
    log("  Detection mode: YOLOv8-Classifier + Optical Flow (hybrid)")
    log("=" * 60)


if __name__ == "__main__":
    main()
