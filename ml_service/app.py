from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
import os
import sys
import datetime
import logging

# Configure logging — console only (no disk log files)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from ml_service.prediction.predictor import predictor
from ml_service.utils.alert_system import AlertSystem

app = Flask(__name__)

# ── CORS ─────────────────────────────────────────────────────────────────────
# The ML service is an internal API — the Node.js backend (port 4005) is the
# ONLY legitimate caller.  All browser traffic goes through the backend proxy,
# so no browser origin ever needs direct ML access.
# Allowed origins are read from ALLOWED_ORIGINS env var so they can be
# overridden per environment without code changes.
_raw_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:4005,http://127.0.0.1:4005')
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(',') if o.strip()]

CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS}},
    supports_credentials=False,  # No cookies needed for M2M
)

logger.info(f"CORS restricted to: {ALLOWED_ORIGINS}")

# Replace print with logging.info
def log_info(msg):
    logging.info(msg)
    print(msg)

alert_system = AlertSystem()

@app.route('/test', methods=['GET'])
def test_connection():
    return jsonify({"status": "ok", "message": "ML Service is reachable"})

@app.route('/test-alert', methods=['GET'])
def test_alert():
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    alert_system.trigger_alert("TEST_DETECTION", "High", timestamp, "System Test Loopback")
    return jsonify({"status": "sent", "message": "Test alert triggered. Check console/logs for results."})

@app.route('/send-video-alert', methods=['POST'])
def send_video_alert():
    try:
        # Check for video file
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        behavior = request.form.get('behavior', 'Suspicious Activity')
        timestamp = request.form.get('timestamp', datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        source = request.form.get('source', 'Live Auto-Capture')

        # Save temporarily
        temp_path = os.path.join(os.path.dirname(__file__), "temp_incident.webm")
        video_file.save(temp_path)
        
        # Trigger alert with video
        alert_system.trigger_alert(behavior, "High", timestamp, source, video_path=temp_path)
        
        # Clean up
        if os.path.exists(temp_path):
            # Give SMAL but of time for email thread to finish reading
            pass 
            
        return jsonify({"status": "ok", "message": "Video alert processing started"})
        
    except Exception as e:
        logger.error(f"Error in send_video_alert: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/demo_mode', methods=['POST'])
def set_demo_mode():
    data = request.json
    behavior = data.get('behavior') # 'Fighting', 'Assault', or 'Normal'
    
    if behavior == 'None' or not behavior:
        predictor.set_demo_mode(None)
        return jsonify({"message": "Demo mode disabled"})
    
    if predictor.set_demo_mode(behavior):
        return jsonify({"message": f"Demo mode enabled for {behavior}"})
    else:
        return jsonify({"error": "Invalid behavior class"}), 400

@app.route('/predict/webcam', methods=['POST'])
def predict_webcam():
    try:
        data = request.json
        frame_data = data.get('frame')
        location = data.get('location') # Extract GPS
        session_id = data.get('session_id', 'default')

        # Periodic cleanup of idle sessions (1% chance per request to keep it simple)
        if np.random.random() < 0.01:
            predictor.cleanup_old_sessions()

        if not frame_data:
            return jsonify({"error": "No frame provided"}), 400

        # Decode base64
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Decoding failed"}), 400

        result = predictor.predict_frame(frame, session_id=session_id)
        if result is None:
             return jsonify({"error": "Prediction failed"}), 500
        
        # Check for alert trigger
        if result['risk'] == 'High':
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            alert_system.trigger_alert(result['class'], "High", timestamp, "Webcam Live Feed", frame=frame, location=location)
        
        return jsonify(result)

    except Exception as e:
        print(f"Error in webcam prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS format"""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

@app.route('/analyze-video', methods=['POST'])
def analyze_video():
    """
    Analyze video for violence detection with incident timestamps.
    Accepts both file uploads and file paths (JSON).
    Returns structured incident data with timestamps, confidence, and risk levels.
    """
    try:
        video_path = None
        
        # Check if file was uploaded via multipart/form-data
        if 'video' in request.files:
            video_file = request.files['video']
            if video_file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Save video temporarily
            temp_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
            os.makedirs(temp_dir, exist_ok=True)
            video_path = os.path.join(temp_dir, f"{int(datetime.datetime.now().timestamp())}_{video_file.filename}")
            video_file.save(video_path)
            logger.info(f"File uploaded: {video_path}")
        else:
            # Try to get JSON path (application/json)
            try:
                data = request.get_json()
                if data and 'video_path' in data:
                    video_path = data.get('video_path')
                    logger.info(f"Using provided path: {video_path}")
            except:
                logger.warning("Failed to parse JSON, checking for form data")
                video_path = request.form.get('video_path')
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({"error": "Invalid video path or file"}), 400
        
        logger.info(f"Processing video: {video_path}")
        try:
            # Run prediction
            results = predictor.predict_video_detailed(video_path)
            
            # Format incidents with proper timestamp strings
            incidents = []
            for event in results.get('events', []):
                incident = {
                    "start_time": format_timestamp(event.get('start_time', 0)),
                    "end_time": format_timestamp(event.get('end_time', event.get('start_time', 0))),
                    "peak_confidence": round(event.get('max_confidence', 0), 3),
                    "avg_confidence": round(event.get('avg_confidence', 0), 3),
                    "duration_frames": event.get('count', 0),
                    "risk_level": "High" if event.get('max_confidence', 0) > 0.6 else "Medium",
                    "behavior": event.get('type', 'Violence')
                }
                incidents.append(incident)
            
            # Determine overall risk
            overall_risk = results['summary']['risk_level']
            
            response_data = {
                "incidents": incidents,
                "total_incidents": len(incidents),
                "video_duration": format_timestamp(results['summary']['total_duration']),
                "overall_risk": overall_risk,
                "raw_duration_seconds": results['summary']['total_duration']
            }
            
            logger.info(f"Analysis complete: {len(incidents)} incidents found, risk: {overall_risk}")
            
            # Trigger alert if high risk
            if overall_risk == 'High':
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                behavior = incidents[0]['behavior'] if incidents else "Violence"
                video_name = os.path.basename(video_path)
                alert_system.trigger_alert(behavior, "High", timestamp, f"Video: {video_name}")
            
            return jsonify(response_data), 200
            
        finally:
            # Clean up temp file if it was uploaded
            if video_path and 'temp_uploads' in video_path:
                try:
                    if os.path.exists(video_path):
                        os.remove(video_path)
                        logger.info(f"Cleaned up temp file: {video_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Cleanup error: {cleanup_err}")
    
    except Exception as e:
        logger.error(f"Error in analyze_video: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "details": traceback.format_exc()}), 500

@app.route('/predict/video', methods=['POST'])
def predict_video():
    try:
        data = request.json
        video_path = data.get('video_path')
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({"error": "Invalid video path"}), 400

        # Use new detailed method
        results = predictor.predict_video_detailed(video_path)
        
        if results['summary']['risk_level'] == 'High':
             timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
             behavior = next((e['type'] for e in results['events']), "Unknown")
             alert_system.trigger_alert(behavior, "High", timestamp, f"Video: {os.path.basename(video_path)}")

        return jsonify(results)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # debug=True exposes the interactive Werkzeug debugger — never enable in production.
    # Set FLASK_DEBUG=1 in the environment only for local development.
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    if debug_mode:
        logger.warning("⚠️  Flask debug mode is ON — for local development only!")
    app.run(host='0.0.0.0', port=5000, debug=debug_mode, threaded=True)
