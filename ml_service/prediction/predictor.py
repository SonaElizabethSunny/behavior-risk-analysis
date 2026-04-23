import os
import time
import numpy as np
import tensorflow as tf
# Limit TF thread pool — CNN model is only a fallback; prevent TF from
# monopolizing CPU cores that PyTorch/YOLO needs for real-time inference.
tf.config.threading.set_intra_op_parallelism_threads(2)
tf.config.threading.set_inter_op_parallelism_threads(1)
from collections import deque
import sys
try:
    import torch
except ImportError:
    torch = None

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from ml_service.preprocessing.image_processor import preprocess_frame


import cv2
try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

# ── Model paths with BASE_DIR pattern ───────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVICE_DIR = os.path.dirname(BASE_DIR)

# CNN model for behavior classification
CNN_MODEL_PATH = os.path.join(ML_SERVICE_DIR, 'model', 'cnn_model.h5')

# Fight classifier (PyTorch model)
FIGHT_CLASSIFIER_PATH = os.path.join(ML_SERVICE_DIR, 'models', 'fight_classifier.pt')

# Classes for CNN model (original training order)
# Index 0 = Fighting, 1 = Assault, 2 = Normal
# We merge Fighting + Assault into a single 'Assault' output label
CLASSES = ['Fighting', 'Assault', 'Normal']
WINDOW_SIZE = 15  # Smaller window = faster response to violence onset

# YOLOv8 fight classifier image size (must match training IMG_SIZE=224)
YOLO_CLASSIFY_IMG_SIZE = 224

class _DummyCtx:
    """No-op context manager used when torch is not available."""
    def __enter__(self): return self
    def __exit__(self, *a): pass

class Predictor:
    def __init__(self):
        self.model = None
        self.fight_classifier = None
        self.person_model = None
        self.demo_class = None

        # Session states: {session_id: {state_vars}}
        self.sessions = {}

        self.load_model()
        self._load_yolo()

    def _load_yolo(self):
        """Load the YOLOv8 person-detection model at startup with FP16 for speed."""
        if YOLO:
            try:
                self.person_model = YOLO("yolov8n.pt")
                # Enable FP16 (half precision) for faster inference
                if torch and torch.cuda.is_available():
                    self.person_model.model = self.person_model.model.half()
                print("✅ YOLOv8 Person Detector loaded (FP16 enabled if GPU available).")
            except Exception as e:
                print(f"⚠️ Warning: Could not load YOLO model: {e}")
        else:
            print("⚠️ Ultralytics not found. Human detection disabled.")

    def _get_session_state(self, session_id):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "prediction_window": deque(maxlen=WINDOW_SIZE),
                "prev_frame_gray": None,
                "prev_person_boxes": [],
                "temporal_violence_score": 0.0,
                "last_reason": "Initializing session...",
                "last_active": time.time()
            }
        self.sessions[session_id]["last_active"] = time.time()
        return self.sessions[session_id]

    def cleanup_old_sessions(self, max_idle=300):
        """Expire sessions that have been idle for longer than `max_idle` seconds."""
        current_time = time.time()
        expired = [sid for sid, state in self.sessions.items() if current_time - state["last_active"] > max_idle]
        for sid in expired:
            del self.sessions[sid]
        if expired:
            print(f"🧹 Cleaned up {len(expired)} idle ML sessions.")

    def set_demo_mode(self, behavior_class):
        if behavior_class in CLASSES or behavior_class is None:
            self.demo_class = behavior_class
            print(f"Demo mode set to: {self.demo_class}")
            return True
        return False

    def load_model(self):
        try:
            # ── Load CNN Model ──
            print(f"\n📦 Loading CNN Model...")
            print(f"  Path: {CNN_MODEL_PATH}")
            print(f"  Exists: {os.path.exists(CNN_MODEL_PATH)}")
            
            if os.path.exists(CNN_MODEL_PATH):
                self.model = tf.keras.models.load_model(CNN_MODEL_PATH)
                print(f"  ✅ CNN Model loaded successfully.")
            else:
                print(f"  ⚠️  CNN Model not found at {CNN_MODEL_PATH}. Please train the model first.")
            
            # ── Load Fight Classifier (YOLOv8-cls) ──
            print(f"\n📦 Loading Fight Classifier...")
            print(f"  Path: {FIGHT_CLASSIFIER_PATH}")
            print(f"  Exists: {os.path.exists(FIGHT_CLASSIFIER_PATH)}")
            
            if YOLO and os.path.exists(FIGHT_CLASSIFIER_PATH):
                try:
                    # MUST use YOLO() constructor — NOT torch.load()!
                    # torch.load() returns a raw state dict, not a runnable model.
                    self.fight_classifier = YOLO(FIGHT_CLASSIFIER_PATH)
                    print(f"  ✅ Fight Classifier loaded via YOLO() successfully.")
                    # Quick sanity check — verify it has classes
                    if hasattr(self.fight_classifier, 'names'):
                        print(f"  Classes: {self.fight_classifier.names}")
                except Exception as e:
                    print(f"  ⚠️  Error loading Fight Classifier: {e}")
                    import traceback
                    traceback.print_exc()
                    self.fight_classifier = None
            else:
                if not YOLO:
                    print(f"  ⚠️  Ultralytics not available. Fight Classifier skipped.")
                else:
                    print(f"  ⚠️  Fight Classifier not found at {FIGHT_CLASSIFIER_PATH}")
                self.fight_classifier = None
                
        except Exception as e:
            print(f"❌ Error in load_model: {e}")
            import traceback
            traceback.print_exc()

    def predict_frame(self, frame, session_id="default"):
        state = self._get_session_state(session_id)
        
        if self.demo_class:
            predicted_class = self.demo_class
            confidence = 0.95 + (np.random.random() * 0.04) 
            
            state["prediction_window"].append(predicted_class)
            risk_level = self.calculate_risk(session_id)
            
            return {
                "class": predicted_class,
                "confidence": confidence,
                "risk": risk_level
            }

        if self.model is None:
            # Fallback for demo if model isn't trained
            return {"class": "Normal", "confidence": 0.0, "risk": "Low"}

        # 1. Color Space Conversion (BGR -> RGB)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 1.5 Full-frame crop (use the whole scene, not just center)
        # Center-cropping was causing false positives from phone screens held by users.
        h, w, _ = frame_rgb.shape
        final_frame = frame_rgb

        # 3. Motion Gating
        gray = cv2.cvtColor(final_frame, cv2.COLOR_RGB2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        motion_score = 0
        if state["prev_frame_gray"] is not None:
             delta_frame = cv2.absdiff(state["prev_frame_gray"], gray)
             motion_score = np.mean(delta_frame)
        
        state["prev_frame_gray"] = gray

        # Debug Motion
        # print(f"Motion Score: {motion_score:.2f}")

        # ── Inference path: prefer SCVD YOLOv8 classifier, fall back to CNN ──
        use_cnn_fallback = False

        if self.fight_classifier is not None:
            try:
                # Resize to 224×224 for YOLOv8-cls (must match training IMG_SIZE)
                img_yolo = cv2.resize(final_frame, (YOLO_CLASSIFY_IMG_SIZE, YOLO_CLASSIFY_IMG_SIZE))
                _ctx = torch.no_grad() if torch else _DummyCtx()
                with _ctx:
                    cls_results = self.fight_classifier(img_yolo, verbose=False)
                probs = cls_results[0].probs.data.cpu().numpy()
                
                # Use model.names to find correct class indices (don't hardcode)
                names = self.fight_classifier.names  # e.g. {0: 'fight', 1: 'normal'}
                fight_idx = None
                normal_idx = None
                for idx, name in names.items():
                    if 'fight' in name.lower() or 'violence' in name.lower():
                        fight_idx = idx
                    elif 'normal' in name.lower():
                        normal_idx = idx
                
                if fight_idx is not None and normal_idx is not None:
                    fighting_prob = float(probs[fight_idx])
                    normal_prob   = float(probs[normal_idx])
                else:
                    # Fallback: assume alphabetical order (fight=0, normal=1)
                    fighting_prob = float(probs[0])
                    normal_prob   = float(probs[1])
                
                assault_prob = 0.0  # YOLO model has no separate 'assault' class
            except Exception as cls_err:
                print(f"⚠️ Fight classifier inference failed: {cls_err}")
                use_cnn_fallback = True
        else:
            use_cnn_fallback = True

        if use_cnn_fallback:
            # Fallback: old CNN model (64×64 input)
            processed_frame = preprocess_frame(final_frame)
            if processed_frame is None:
                return None
            preds = self.model.predict(processed_frame, verbose=0)
            fighting_prob = float(preds[0][0])
            assault_prob  = float(preds[0][1])
            normal_prob   = float(preds[0][2])
        
        # --- HUMAN DETECTION & DEEP SPATIAL ANALYSIS ---
        num_persons = 0
        current_boxes = []
        proximity_warning = False
        high_energy_interaction = False
        postures = [] # List of 'standing', 'sitting/sitting-close', 'unclear'

        if self.person_model:
            # Resize frame to 416x416 before YOLO for faster processing
            frame_yolo = cv2.resize(frame, (416, 416))
            # Run YOLO with conf=0.35 — lowered from 0.50 to detect partially
            # visible persons in close-up fight scenes (e.g. grappling, cropped frames).
            _yolo_ctx = torch.no_grad() if torch else _DummyCtx()
            with _yolo_ctx:
                results = self.person_model(frame_yolo, classes=[0], verbose=False, conf=0.35)
            boxes = results[0].boxes
            num_persons = len(boxes)

            if num_persons > 0:
                for box in boxes:
                    xyxy = box.xyxy[0].cpu().numpy()
                    current_boxes.append(xyxy)
                    
                    # Posture Estimation (Simplified)
                    bw, bh = xyxy[2] - xyxy[0], xyxy[3] - xyxy[1]
                    aspect_ratio = bh / (bw + 1e-6)
                    if aspect_ratio > 1.8:
                        postures.append("standing")
                    elif aspect_ratio > 1.0:
                        postures.append("standing/sitting")
                    else:
                        postures.append("crouching/sitting")
                    
                # 1. Proximity & Interaction Analysis
                if num_persons >= 2:
                    for i in range(num_persons):
                        for j in range(i + 1, num_persons):
                            b1, b2 = current_boxes[i], current_boxes[j]
                            area1 = (b1[2]-b1[0]) * (b1[3]-b1[1])
                            area2 = (b2[2]-b2[0]) * (b2[3]-b2[1])
                            
                            ratio = min(area1, area2) / (max(area1, area2) + 1e-6)
                            if ratio < 0.15:
                                continue

                            def is_contained(inner, outer):
                                return inner[0] > outer[0] and inner[1] > outer[1] and \
                                       inner[2] < outer[2] and inner[3] < outer[3]
                            
                            if is_contained(b1, b2) or is_contained(b2, b1):
                                continue

                            c1 = [(b1[0] + b1[2])/2, (b1[1] + b1[3])/2]
                            c2 = [(b2[0] + b2[2])/2, (b2[1] + b2[3])/2]
                            dist = np.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2)
                            
                            avg_h = ((b1[3]-b1[1]) + (b2[3]-b2[1])) / 2
                            rel_dist = dist / (avg_h + 1e-6)
                            
                            if rel_dist < 0.85:
                                proximity_warning = True
                
                # 2. Velocity Tracking (Energy)
                if len(state["prev_person_boxes"]) > 0 and num_persons > 0:
                    max_displacement = 0
                    for curr in current_boxes:
                        c_curr = [(curr[0]+curr[2])/2, (curr[1]+curr[3])/2]
                        min_d = float('inf')
                        for prev in state["prev_person_boxes"]:
                            c_prev = [(prev[0]+prev[2])/2, (prev[1]+prev[3])/2]
                            d = np.sqrt((c_curr[0]-c_prev[0])**2 + (c_curr[1]-c_prev[1])**2)
                            if d < min_d: min_d = d
                        
                        if min_d != float('inf'):
                            max_displacement = max(max_displacement, min_d)
                    
                    if max_displacement > 45: 
                        high_energy_interaction = True

                            
            state["prev_person_boxes"] = current_boxes

        # --- MULTI-FACTOR MOTION SCORING ---
        # has_motion: meaningful movement (raised from 3.0 — webcam noise / slight
        # head sway easily exceeds 3.0 and was causing false positives).
        has_motion = motion_score > 5.0
        # is_high_motion: genuinely energetic scene-level movement
        is_high_motion = motion_score > 10.0
        # is_dynamic: requires real high-energy YOLO box displacement OR high pixel motion
        is_dynamic = has_motion and (high_energy_interaction or is_high_motion)

        screen_false_positive_risk = False

        # --- SCENE UNDERSTANDING & CLASSIFICATION RULES ---
        # IMPORTANT: The fight classifier gives high scores (~0.8-1.0) even for
        # normal scenes (single person sitting still).  Therefore the classifier
        # CANNOT be trusted alone.  Every rule requires MULTIPLE confirming
        # signals: person count >= 2, dynamic motion, proximity, etc.
        reason = "Normal Activity"
        is_violent_candidate = False

        fight_score = fighting_prob  # single fight probability from YOLO (0..1)

        # Rule 0: Multi-person + dynamic motion + classifier signal
        # Most reliable path — 2+ people actively moving + model says fight.
        if fight_score > 0.50 and num_persons >= 2 and is_dynamic:
            is_violent_candidate = True
            if proximity_warning:
                reason = "High-confidence close-contact violence"
            else:
                reason = "High-confidence multi-person violence"
        # Rule 1: Multi-person proximity fight + motion (proximity is a strong signal)
        elif fight_score > 0.40 and proximity_warning and num_persons >= 2 and has_motion:
            is_violent_candidate = True
            reason = "Close-contact multi-person violence"
        # Rule 2: Multi-person + high classifier + basic motion
        elif fight_score > 0.65 and num_persons >= 2 and has_motion:
            is_violent_candidate = True
            reason = "Multi-person violence signal"
        # Rule 3: Single/multi person — VERY strict (requires dynamic + very high score)
        # Guards against false positives from the classifier on static scenes.
        elif fight_score > 0.80 and num_persons >= 1 and is_dynamic:
            is_violent_candidate = True
            reason = "High-energy violent activity"
        # Rule 4: Classifier-override fallback — YOLO person detection failed but
        # the fight classifier is extremely confident AND there is strong motion.
        # Handles close-up fights, grappling, or partially-cropped frames where
        # YOLO cannot see full-body persons but violence is clearly occurring.
        elif fight_score > 0.75 and num_persons == 0 and is_high_motion:
            is_violent_candidate = True
            reason = "Classifier-override: strong violence signal despite no detected persons"
        # Normal cases
        elif not has_motion:
            reason = "Static scene"
        elif num_persons == 0:
            reason = "No persons in frame"
        else:
            reason = "Normal activity"

        # --- TEMPORAL VIOLENCE SCORE (TVS) ---
        # Faster build-up for confirmed violent candidates.
        threshold_to_build = 0.25 if (is_violent_candidate and proximity_warning) else 0.35

        if is_violent_candidate and fight_score > threshold_to_build:
            # Build-up: +0.60 per frame — triggers on first strong violent frame
            state["temporal_violence_score"] = min(1.0, state["temporal_violence_score"] + 0.60)
        else:
            # Decay: -0.15 per frame — resets in ~7 frames of inactivity
            state["temporal_violence_score"] = max(0.0, state["temporal_violence_score"] - 0.15)

        # --- CLASSIFICATION (Two labels only: 'Assault' or 'Normal') ---
        predicted_class = "Normal"
        confidence = normal_prob

        # TVS trigger at 0.55
        if state["temporal_violence_score"] > 0.55:
            if fight_score > 0.30 and num_persons >= 1:
                predicted_class = "Assault"
                confidence = fighting_prob
            else:
                reason = "Ambiguous pattern - suppressing"

        # Update sliding window
        state["prediction_window"].append(predicted_class)
        state["last_reason"] = reason

        # Risk Logic: only 'Low' or 'High'
        risk_level = self.calculate_risk(session_id)

        return {
            "class": predicted_class,
            "confidence": confidence,
            "risk": risk_level,
            "reason": reason,
            "debug_probs": {"fighting": fighting_prob, "assault": assault_prob, "normal": normal_prob},
            "motion": float(motion_score),
            "tvs": float(round(state["temporal_violence_score"], 3)),
            "persons": int(num_persons),
            "screen_risk": bool(screen_false_positive_risk),
            "threshold": 0.75,
            "boxes": [box.tolist() for box in current_boxes]
        }

    def calculate_risk(self, session_id="default"):
        """Returns only 'Low' or 'High' — no Medium tier."""
        state = self._get_session_state(session_id)
        window = state["prediction_window"]
        if len(window) < 3:
            return "Low"  # Not enough history yet

        # Count Assault frames in the last 45-frame window
        assault_count = sum(1 for p in window if p == 'Assault')
        total = len(window)
        assault_ratio = assault_count / total

        # High: >= 8% of the window is Assault AND at least 2 assault frames
        # Fires faster — 2 violent frames in quick succession = real threat.
        if assault_ratio >= 0.08 and assault_count >= 2:
            return "High"
        else:
            return "Low"

    def predict_video_detailed(self, video_path):
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps == 0: fps = 15  # Fallback

        # Create an isolated session for this video so it doesn't share or
        # pollute state with any live webcam sessions running concurrently.
        video_session_id = f"video_{os.path.basename(video_path)}_{time.time()}"

        frame_count = 0
        events = []
        current_event = None

        process_every = max(1, int(fps / 2))

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % process_every == 0:
                    res = self.predict_frame(frame, session_id=video_session_id)
                    res['frame_index'] = frame_count
                    res['timestamp'] = round(frame_count / fps, 2)

                    is_violent = res['class'] != 'Normal'
                    if is_violent:
                        if current_event is None:
                            current_event = {
                                "start_time": res['timestamp'],
                                "start_frame": frame_count,
                                "type": res['class'],
                                "max_confidence": res['confidence'],
                                "avg_confidence": res['confidence'],
                                "count": 1,
                                "humans_present": res.get('persons', 0) > 0
                            }
                        else:
                            current_event["end_time"] = res['timestamp']
                            current_event["end_frame"] = frame_count
                            current_event["max_confidence"] = max(current_event["max_confidence"], res['confidence'])
                            current_event["avg_confidence"] = (
                                current_event["avg_confidence"] * current_event["count"] + res['confidence']
                            ) / (current_event["count"] + 1)
                            current_event["count"] += 1
                            if res.get('persons', 0) > 0:
                                current_event["humans_present"] = True
                    else:
                        if current_event:
                            if current_event["count"] >= 2:
                                events.append(current_event)
                            current_event = None

                frame_count += 1

            if current_event:
                events.append(current_event)
        finally:
            cap.release()
            # Always clean up the temporary video session to free memory.
            self.sessions.pop(video_session_id, None)
        
        high_risk = any(e for e in events if e['avg_confidence'] > 0.4 or e['count'] > 5)
        filtered_events = [e for e in events if e['count'] >= 2]
        
        return {
            "summary": {
                "risk_level": "High" if high_risk else ("Medium" if filtered_events else "Low"),
                "total_duration": round(total_frames / fps, 2),
                "event_count": len(filtered_events)
            },
            "events": filtered_events
        }


    def predict_video(self, video_path):
        results = self.predict_video_detailed(video_path)
        risk = results['summary']['risk_level']
        behavior = results['events'][0]['type'] if results['events'] else "Normal"
        return risk, behavior

# Singleton instance
predictor = Predictor()
