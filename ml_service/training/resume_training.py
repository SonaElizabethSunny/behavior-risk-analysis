"""
Quick resume script — skips download & frame extraction,
goes straight to YOLOv8 training on the already-prepared frames.

Run: python ml_service/training/resume_training.py
"""
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
FRAMES_DIR = SCRIPT_DIR / "scvd_frames"
MODEL_OUT  = SCRIPT_DIR.parent / "models" / "fight_classifier.pt"
RUNS_DIR   = SCRIPT_DIR / "runs"

# Training config
EPOCHS     = 40
BATCH      = 16
IMG_SIZE   = 224
BASE_MODEL = "yolov8n-cls.pt"

def log(msg):
    sys.stdout.buffer.write((f"[TRAIN] {msg}\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()

def main():
    log("=" * 60)
    log("  SCVD - Resuming Training (frames already extracted)")
    log("=" * 60)

    # Check frames exist
    fight_train = FRAMES_DIR / "train" / "fight"
    normal_train = FRAMES_DIR / "train" / "normal"
    if not fight_train.exists() or not normal_train.exists():
        log("ERROR: Frames not found. Run the full training script instead:")
        log("  python ml_service/training/train_fight_classifier.py")
        sys.exit(1)

    n_fight  = len(list(fight_train.glob("*.jpg")))
    n_normal = len(list(normal_train.glob("*.jpg")))
    log(f"Found frames - fight: {n_fight}, normal: {n_normal}")
    log(f"Starting training: {EPOCHS} epochs, batch={BATCH}, img={IMG_SIZE}")

    # Remove old incomplete run so YOLO can use same name
    old_run = RUNS_DIR / "scvd_fight_cls"
    if old_run.exists():
        log("Removing incomplete previous run folder...")
        shutil.rmtree(old_run)

    from ultralytics import YOLO
    model = YOLO(BASE_MODEL)
    model.train(
        data       = str(FRAMES_DIR),
        task       = "classify",
        epochs     = EPOCHS,
        imgsz      = IMG_SIZE,
        batch      = BATCH,
        name       = "scvd_fight_cls",
        project    = str(RUNS_DIR),
        patience   = 10,
        save       = True,
        plots      = True,
        workers    = 0,           # 0 = no multiprocessing (fixes Windows deadlock)
        exist_ok   = True,
        verbose    = True,
    )

    # Save best model
    candidates = sorted(
        (RUNS_DIR / "scvd_fight_cls").rglob("best.pt"),
        key=lambda p: p.stat().st_mtime
    )
    if candidates:
        MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(str(candidates[-1]), str(MODEL_OUT))
        log(f"DONE - Model saved -> {MODEL_OUT}")
        log("Restart the ML Service window to activate the new model!")
    else:
        log("WARNING: best.pt not found. Check runs/scvd_fight_cls/weights/")

if __name__ == "__main__":
    main()
