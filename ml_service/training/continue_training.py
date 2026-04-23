"""
Continue training from the existing fight_classifier.pt (epochs 1-16).
Fine-tunes from that checkpoint for 25 more epochs with workers=0 (Windows-safe).

Run:
    python ml_service/training/continue_training.py
"""
import sys
import shutil
from pathlib import Path

SCRIPT_DIR  = Path(__file__).resolve().parent
FRAMES_DIR  = SCRIPT_DIR / "scvd_frames"
RUNS_DIR    = SCRIPT_DIR / "runs"
MODEL_SRC   = SCRIPT_DIR.parent / "models" / "fight_classifier.pt"
MODEL_OUT   = MODEL_SRC  # overwrite with better version when done

def log(msg: str):
    sys.stdout.buffer.write((f"[TRAIN] {msg}\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def main():
    log("=" * 60)
    log("  SCVD - Fine-tuning from existing fight_classifier.pt")
    log("=" * 60)

    if not MODEL_SRC.exists():
        log(f"ERROR: Model not found: {MODEL_SRC}")
        sys.exit(1)

    if not (FRAMES_DIR / "train" / "fight").exists():
        log(f"ERROR: Training frames not found at: {FRAMES_DIR}")
        log("Run the full training pipeline first.")
        sys.exit(1)

    log(f"Base model: {MODEL_SRC}")
    log(f"Size: {MODEL_SRC.stat().st_size / 1024 / 1024:.2f} MB")
    log(f"Frames dir: {FRAMES_DIR}")
    log("")

    # Clean up broken/incomplete run folder
    old_run = RUNS_DIR / "scvd_fight_cls"
    if old_run.exists():
        log("Cleaning up old incomplete run folder...")
        shutil.rmtree(old_run)

    from ultralytics import YOLO

    # Load from previously trained model — keeps the learned weights
    model = YOLO(str(MODEL_SRC))

    log("Starting fine-tune: 25 epochs, batch=16, img=224, workers=0")
    log("")

    model.train(
        data       = str(FRAMES_DIR),
        task       = "classify",
        epochs     = 25,        # 25 more epochs on top of existing weights
        imgsz      = 224,
        batch      = 16,
        name       = "scvd_fight_cls",
        project    = str(RUNS_DIR),
        patience   = 10,
        save       = True,
        plots      = True,
        workers    = 0,         # Windows-safe: no multiprocessing deadlock
        exist_ok   = True,
        verbose    = True,
    )

    # Copy best.pt to models/fight_classifier.pt
    best_pt = RUNS_DIR / "scvd_fight_cls" / "weights" / "best.pt"
    if best_pt.exists():
        MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(str(best_pt), str(MODEL_OUT))
        log("")
        log("=" * 60)
        log("  Training Complete!")
        log(f"  Best model saved -> {MODEL_OUT}")
        log("  Restart the ML service to activate the new model.")
        log("=" * 60)
    else:
        log("WARNING: best.pt not found. Check runs/scvd_fight_cls/weights/")


if __name__ == "__main__":
    main()
