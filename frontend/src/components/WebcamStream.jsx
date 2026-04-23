import React, { useRef, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';    // all backend (port 4005) calls go through here
import './WebcamStream.css';


const WebcamStream = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const streamingRef = useRef(false);
    const overlayRef = useRef(null);
    const locationRef = useRef(null);
    const sessionIdRef = useRef(null);
    const generationRef = useRef(0);  // Incremented on each start to kill stale loops

    // Alert state refs (mutable, no re-render needed)
    const alertSentRef = useRef(false);         // Have we already sent the alert for this event?
    const alertCooldownRef = useRef(0);          // Timestamp of last sent alert (for cooldown)
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingStartedRef = useRef(false);   // Is recording in-progress?

    const [isStreaming, setIsStreaming] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [fps, setFps] = useState(0);
    const lastFrameTimeRef = useRef(performance.now());
    const frameCountRef = useRef(0);
    const inferenceActiveRef = useRef(false);


    useEffect(() => {
        return () => stopStream();
    }, []);

    // --- Geolocation ---
    const getLiveLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    locationRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                },
                (err) => console.warn('📍 Location unavailable:', err.message)
            );
        }
    };

    const startStream = async () => {
        getLiveLocation();
        sessionIdRef.current = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        stopStream();

        // Bump generation so any old processFrame loop from a previous session self-terminates
        const thisGeneration = ++generationRef.current;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            // Guard: if stopStream was called while we awaited getUserMedia, bail out
            if (generationRef.current !== thisGeneration) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
                streamingRef.current = true;
                requestAnimationFrame(() => processFrame(thisGeneration));
            }
        } catch (err) {
            alert('Cannot access webcam: ' + err.message);
        }
    };

    const stopStream = () => {
        streamingRef.current = false;
        // Bump generation to kill any in-flight processFrame loop
        generationRef.current++;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        recordingStartedRef.current = false;
        alertSentRef.current = false;
        alertCooldownRef.current = 0;       // Reset cooldown so next session can alert immediately
        inferenceActiveRef.current = false;  // Ensure new session isn't blocked by stale flag
        setIsStreaming(false);
        setPrediction(null);
        setFps(0);
    };

    // --- Start capturing a short video clip immediately when assault detected ---
    const startRecordingClip = useCallback((predClass) => {
        if (recordingStartedRef.current || !streamRef.current) return;
        recordingStartedRef.current = true;
        recordedChunksRef.current = [];

        try {
            const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
                ? 'video/webm; codecs=vp9'
                : 'video/webm';
            const recorder = new MediaRecorder(streamRef.current, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (recordedChunksRef.current.length === 0) return;
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const file = new File([blob], `assault_${Date.now()}.webm`, { type: 'video/webm' });

                console.log('📤 Uploading assault clip to dashboard…');
                const form = new FormData();
                form.append('video', file);
                form.append('videoName', 'Live Auto-Capture');
                form.append('behavior', predClass + ' (Auto-Detected)');
                form.append('riskLevel', 'High');
                form.append('timestamp', new Date().toISOString());
                if (locationRef.current) {
                    form.append('location', JSON.stringify(locationRef.current));
                }

                try {
                    await api.post('/api/report-incident', form);
                    console.log('✅ Assault clip uploaded — dashboard updated');
                } catch (err) {
                    console.error('❌ Clip upload failed:', err.message);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            console.log('🎥 Recording assault clip…');

            // Stop after 5 seconds and upload
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    console.log('⏹️ Clip recorded (5s)');
                }
            }, 5000);
        } catch (e) {
            console.error('Recorder error:', e);
            recordingStartedRef.current = false;
        }
    }, []);

    // --- Draw bounding boxes on overlay canvas ---
    const drawOverlays = useCallback((boxes, isAssault) => {
        const canvas = overlayRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!boxes || boxes.length === 0) return;

        const scaleX = canvas.width / 416;
        const scaleY = canvas.height / 416;

        boxes.forEach((box, index) => {
            const [x1, y1, x2, y2] = box;
            const bx = x1 * scaleX, by = y1 * scaleY;
            const bw = (x2 - x1) * scaleX, bh = (y2 - y1) * scaleY;

            if (isAssault) {
                // Red pulsing box for assault
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.strokeStyle = '#ff2222';
                ctx.lineWidth = 4;
                ctx.strokeRect(bx, by, bw, bh);
                ctx.shadowBlur = 0;

                // Red label
                ctx.fillStyle = 'rgba(220, 20, 20, 0.85)';
                const labelH = 22;
                ctx.fillRect(bx, by - labelH, bw, labelH);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Inter, sans-serif';
                ctx.fillText('⚠ ASSAULT', bx + 4, by - 5);
            } else {
                // Blue box for person
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, bw, bh);
                
                // Blue background label
                ctx.fillStyle = '#3b82f6';
                const labelW = 55;
                const labelH = 16;
                ctx.fillRect(bx, by - labelH, labelW, labelH);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillText(`PERSON ${index + 1}`, bx + 4, by - 4);
            }
        });
    }, []);

    // --- Voice alert ---
    const speakAlert = () => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance('Assault detected! Alert sent to dashboard.');
        msg.rate = 1.1;
        msg.pitch = 1.2;
        msg.volume = 1.0;
        window.speechSynthesis.speak(msg);
    };

    // --- Main frame processing loop (non-blocking) ---
    // `generation` parameter ensures stale loops from previous sessions self-terminate.
    const processFrame = useCallback(async (generation) => {
        // Kill this loop if generation has changed (user stopped/restarted camera)
        if (generation !== generationRef.current) return;
        if (!videoRef.current || !streamingRef.current) return;

        // Schedule next tick IMMEDIATELY — loop never blocks on inference
        if (streamingRef.current && generation === generationRef.current) {
            setTimeout(() => requestAnimationFrame(() => processFrame(generation)), 100);
        }

        // FPS counter (visual loop rate)
        const now = performance.now();
        frameCountRef.current += 1;
        if (now - lastFrameTimeRef.current >= 1000) {
            setFps(Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current)));
            frameCountRef.current = 0;
            lastFrameTimeRef.current = now;
        }

        // Skip if ML inference is still in-flight for a previous frame
        if (inferenceActiveRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (canvas && video && video.readyState === 4) {
            // Match YOLO input size (416×416) — avoids server-side resize overhead
            canvas.width = 416;
            canvas.height = 416;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 416, 416);
            const base64Frame = canvas.toDataURL('image/jpeg', 0.6);

            inferenceActiveRef.current = true;
            try {
                // Bail out if session was stopped while we were setting up
                if (generation !== generationRef.current) return;

                const res = await api.post('/api/webcam-proxy', {
                    frame: base64Frame,
                    location: locationRef.current,
                    session_id: sessionIdRef.current
                }, { timeout: 10000 }); // 10s timeout — prevents infinite hang

                // After await — verify session is still current
                if (generation !== generationRef.current) return;

                const pred = res.data;
                const isAssault = pred.class === 'Assault';
                const isHighRisk = pred.risk === 'High';

                // ── IMMEDIATE RED BOXES as soon as any Assault detected ──────────
                drawOverlays(pred.boxes, isAssault);

                // ── ALERT LOGIC: cooldown-based, allows re-detection ─────────────
                // The cooldown timer is the SOLE gatekeeper.  Once it expires,
                // a new High-risk Assault frame will fire another alert — there is
                // no permanent "alertSentRef" blocker that requires the scene to
                // go back to Normal first.
                if (isAssault && isHighRisk) {
                    const cooldownPassed = Date.now() - alertCooldownRef.current > 15000;

                    if (cooldownPassed) {
                        alertCooldownRef.current = Date.now();

                        speakAlert();
                        console.log('🚨 ASSAULT HIGH RISK — sending alert to dashboard');
                        startRecordingClip(pred.class);
                    }
                }

                // Reset recording flag when scene is calm so next assault can record
                if (!isAssault) {
                    recordingStartedRef.current = false;
                }

                setPrediction(pred);
                setErrorMsg(null);

            } catch (err) {
                // Don't clear prediction on auth errors — keep last known state
                if (err.response?.status !== 401) {
                    setErrorMsg('Connecting to AI…');
                }
                if (overlayRef.current) {
                    const ctx = overlayRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
                }
                // Brief pause before retrying to avoid spam on a down service
                await new Promise(r => setTimeout(r, 2000));
            } finally {
                inferenceActiveRef.current = false;
            }
        }
    }, [drawOverlays, startRecordingClip]);

    // ── Derived display values ──────────────────────────────────────────────────
    const isAssault   = prediction?.class === 'Assault';
    const isHighRisk  = prediction?.risk === 'High';

    return (
        <div className="webcam-page-container">
            <div className="webcam-header">
                <div className="webcam-title">SENTINEL SURVEILLANCE FEED</div>
                <div className="system-status">
                    <span className="time-display">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            <div className="webcam-main">
                <div className="video-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`video-feed ${isHighRisk ? 'border-alert' : ''}`}
                    />
                    {/* Hidden processing canvas */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {/* Overlay canvas for bounding boxes */}
                    <canvas
                        ref={overlayRef}
                        style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%',
                            pointerEvents: 'none', zIndex: 5
                        }}
                    />

                    {isStreaming && (
                        <>
                            <div className="overlay-top-bar">
                                <span>CAM-01 [LIVE]</span>
                                <span>FPS: {fps}</span>
                            </div>
                            <div className="overlay-bottom-bar">
                                <span className="status-message">
                                    {prediction ? `>> ANALYSIS: ${prediction.class === 'Assault' ? 'ASSAULT WARNING' : 'NORMAL'} — ${prediction.persons ?? 0} PERSONS` : '>> SCANNING AREA...'}
                                </span>
                                <div className={`risk-badge ${isHighRisk ? 'high' : (isAssault ? 'medium' : 'normal')}`}>
                                    {isHighRisk ? 'HIGH' : (isAssault ? 'MED' : 'LOW')}
                                </div>
                            </div>
                        </>
                    )}

                    {!isStreaming && (
                        <div className="camera-placeholder">
                            <span>CAMERA OFFLINE</span>
                        </div>
                    )}
                </div>

                <div className="stats-bar">
                    <div className="stat-item">
                        <span className="stat-label">VIOLENCE INDEX</span>
                        <span className="stat-value">{prediction?.tvs ? prediction.tvs.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">SUBJECTS</span>
                        <span className="stat-value">{prediction?.persons ?? 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">CLASSIFICATION</span>
                        <span className="stat-value">{prediction?.class ?? 'None'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">CONF. LEVEL</span>
                        <span className="stat-value">{prediction?.confidence ? Math.round(prediction.confidence * 100) : 0}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">INCIDENTS</span>
                        <span className="stat-value">0</span>
                    </div>
                </div>

                <div className="control-bar">
                    {!isStreaming ? (
                        <button className="btn-main btn-start" onClick={startStream}>
                            START CAMERA
                        </button>
                    ) : (
                        <>
                            <button className="btn-main btn-stop" onClick={stopStream}>
                                STOP CAMERA
                            </button>
                            <button
                                className="btn-main btn-report"
                                onClick={() => startRecordingClip(prediction?.class ?? 'Assault')}
                                disabled={!isAssault}
                            >
                                REPORT LIVE CASE
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebcamStream;
