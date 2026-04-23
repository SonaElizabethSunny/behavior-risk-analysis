const Alert = require('../models/Alert');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getIO } = require('../socket');

const ML_SERVICE_URL = 'http://127.0.0.1:5000/analyze-video';

// In-memory fallback storage
let inMemoryAlerts = [];

// Upload Video and Analyze (Detailed)
exports.analyzeVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video uploaded' });
        }

        const videoPath = req.file.path;
        const absolutePath = path.resolve(videoPath);

        try {
            const mlResponse = await axios.post('http://127.0.0.1:5000/analyze-video', {
                video_path: absolutePath
            });

            const result = mlResponse.data;

            // Trigger alert if high risk
            if (result && result.overall_risk === 'High') {
                const alertData = {
                    videoName: req.file.originalname,
                    behavior: (result.incidents && result.incidents[0]) ? result.incidents[0].behavior : 'Violence',
                    riskLevel: 'High',
                    timestamp: new Date(),
                    status: 'Pending'
                };

                // Try to save to MongoDB first
                try {
                    const dbAlert = new Alert(alertData);
                    await dbAlert.save();
                    console.log('✅ Alert saved to MongoDB:', dbAlert._id);
                } catch (dbErr) {
                    console.warn('⚠️ MongoDB save failed, using in-memory storage:', dbErr.message);
                    alertData._id = 'v_' + Date.now();
                    inMemoryAlerts.unshift(alertData);
                }
            }

            res.json(result);

        } catch (mlError) {
            console.error('ML Service Error:', mlError.response ? mlError.response.data : mlError.message);
            res.status(500).json({ error: 'ML Service failed or timed out' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};



// Get all Alerts (Filtered by authenticated user's role)
exports.getAlerts = async (req, res) => {
    try {
        // Role comes from the verified JWT payload — cannot be spoofed via query param
        const role = req.user?.role;

        const query = (role === 'police' || role === 'admin')
            ? {}
            : { hiddenFromUser: { $ne: true } };

        const dbAlerts = await Alert.find(query).sort({ timestamp: -1 }).limit(100);

        let visibleInMemory = inMemoryAlerts;
        if (role !== 'police' && role !== 'admin') {
            visibleInMemory = inMemoryAlerts.filter(a => !a.hiddenFromUser);
        }

        const allAlerts = [...visibleInMemory, ...dbAlerts]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(allAlerts);
    } catch (error) {
        console.warn('⚠️ MongoDB fetch failed, using in-memory storage only');
        const role = req.user?.role;
        const visibleInMemory = (role === 'police' || role === 'admin')
            ? inMemoryAlerts
            : inMemoryAlerts.filter(a => !a.hiddenFromUser);
        res.json(visibleInMemory);
    }
};

// Get Single Alert by ID
exports.getAlertById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check in-memory first
        const memAlert = inMemoryAlerts.find(a => a._id === id);
        if (memAlert) return res.json(memAlert);

        // Try MongoDB
        const alert = await Alert.findById(id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Add Note to Alert
exports.addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, user } = req.body;

        if (!note || !note.trim()) {
            return res.status(400).json({ error: 'Note content is required' });
        }

        const noteEntry = {
            note: note.trim(),
            user: user || req.user?.username || 'Unknown',
            timestamp: new Date()
        };

        // In-memory alert
        const memAlert = inMemoryAlerts.find(a => a._id === id);
        if (memAlert) {
            if (!memAlert.notes) memAlert.notes = [];
            memAlert.notes.push(noteEntry);
            return res.json({ success: true, alert: memAlert });
        }

        // MongoDB alert
        const alert = await Alert.findByIdAndUpdate(
            id,
            { $push: { notes: noteEntry } },
            { new: true }
        );

        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json({ success: true, alert });
    } catch (error) {
        console.error('Add Note Error:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
};

// Update Alert Status
exports.updateAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Handle in-memory alerts (prefixed IDs)
        if (id.startsWith('v_') || id.startsWith('man_') || id.startsWith('live_')) {
            const alert = inMemoryAlerts.find(a => a._id === id);
            if (alert) {
                alert.status = status;
                return res.json(alert);
            }
            return res.status(404).json({ error: 'Alert not found' });
        }

        // Handle MongoDB alerts
        try {
            const alert = await Alert.findByIdAndUpdate(id, { status }, { new: true });
            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }
            res.json(alert);
        } catch (dbErr) {
            console.error('MongoDB update failed:', dbErr.message);
            res.status(500).json({ error: 'Failed to update alert' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Create Manual Alert (Report Case)
exports.createAlert = async (req, res) => {
    try {
        const { videoName, behavior, riskLevel, timestamp } = req.body;

        const newAlert = {
            videoName: videoName || "Reported Video",
            behavior: behavior || "Suspicious Activity",
            riskLevel: riskLevel || "Medium",
            timestamp: new Date(),
            status: "Reported",
            location: req.body.location, // Capture GPS
            _id: 'man_' + Date.now() // Manual ID
        };

        // Add specific time context if available in videoName or behavior
        if (timestamp) {
            newAlert.timestamp = timestamp; // Allow overriding if specific time passed
        }

        // Add to In-Memory
        inMemoryAlerts.unshift(newAlert);

        // Try to add to MongoDB if connected
        try {
            const dbAlert = new Alert({
                videoName: newAlert.videoName,
                behavior: newAlert.behavior,
                riskLevel: newAlert.riskLevel,
                status: newAlert.status,
                timestamp: newAlert.timestamp,
                location: newAlert.location
            });
            await dbAlert.save();
        } catch (dbErr) {
            // Ignore DB error, fallback is fine
        }

        res.json({ success: true, alert: newAlert });

    } catch (error) {
        console.error("Create Alert Error:", error);
        res.status(500).json({ error: "Failed to create report" });
    }
};

// Report Incident with Video Evidence
exports.reportIncident = async (req, res) => {
    try {
        const { videoName, behavior, riskLevel, timestamp } = req.body;
        const videoPath = req.file ? `/uploads/${req.file.filename}` : null;

        const newAlert = new Alert({
            videoName: videoName || "Live Incident",
            behavior: behavior || "Aggression Detected",
            riskLevel: riskLevel || "High",
            timestamp: timestamp || new Date(),
            status: "Pending",
            videoPath: videoPath,
            location: req.body.location // Link GPS to incident
        });

        // Add to In-Memory for immediate display
        const memAlert = { ...newAlert.toObject(), _id: 'live_' + Date.now() };
        inMemoryAlerts.unshift(memAlert);

        // ── Emit to all dashboard clients instantly ────────────────────────────
        try {
            getIO().emit('alert:new', memAlert);
            console.log('📡 Socket alert emitted to dashboard');
        } catch (socketErr) {
            console.warn('⚠️ Socket emit failed (Socket.IO may not be initialised):', socketErr.message);
        }
        // Save to DB
        try {
            await newAlert.save();
            console.log('✅ Live Incident Alert saved:', newAlert._id);

            // --- TRIGGER EMAIL ALERT WITH VIDEO ---
            if (req.file) {
                const FormData = require('form-data');
                const form = new FormData();
                form.append('video', fs.createReadStream(req.file.path));
                form.append('behavior', behavior || "Aggressive Behavior");
                form.append('timestamp', timestamp || new Date().toISOString());
                form.append('source', videoName || "Live Camera Feed");

                axios.post('http://127.0.0.1:5000/send-video-alert', form, {
                    headers: form.getHeaders()
                }).then(() => {
                    console.log('📧 Evidence video forwarded to ML Service for email alerting');
                }).catch(err => {
                    console.error('❌ Failed to forward evidence video to ML Service:', err.message);
                });
            }
        } catch (dbErr) {
            console.error('⚠️ DB Save failed for incident:', dbErr.message);
        }

        res.json({ success: true, alert: newAlert });

    } catch (error) {
        console.error("Report Incident Error:", error);
        res.status(500).json({ error: "Failed to report incident" });
    }
};

// Delete All History (Mark as hidden for user)
exports.deleteAllHistory = async (req, res) => {
    try {
        // Try to mark as hidden in MongoDB if available
        try {
            await Alert.updateMany({}, { hiddenFromUser: true });
        } catch (dbErr) {
            console.warn('⚠️ MongoDB clear history failed, updating in-memory only');
        }

        // Hide in-memory alerts (This is the primary storage when DB is offline)
        inMemoryAlerts.forEach(a => a.hiddenFromUser = true);

        res.json({ success: true, message: "All history hidden from user. Data preserved for police." });
    } catch (error) {
        console.error("Delete History Error:", error);
        res.status(500).json({ error: "Failed to clear history" });
    }
};

// Delete False Alarms (Mark as hidden for user)
exports.deleteFalseAlarms = async (req, res) => {
    try {
        // Try to mark false alarms as hidden in MongoDB if available
        try {
            await Alert.updateMany({ status: 'False Alarm' }, { hiddenFromUser: true });
        } catch (dbErr) {
            console.warn('⚠️ MongoDB clear false alarms failed, updating in-memory only');
        }

        // Hide in-memory false alarms
        inMemoryAlerts.forEach(a => {
            if (a.status === 'False Alarm') a.hiddenFromUser = true;
        });

        res.json({ success: true, message: "False alarms cleared from history." });
    } catch (error) {
        console.error("Delete False Alarms Error:", error);
        res.status(500).json({ error: "Failed to clear false alarms" });
    }
};

// Permanent Delete One Alert (Police / Admin Action)
exports.deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Attempting to delete alert: ${id} (by ${req.user?.username})`);

        // 1. Remove from in-memory (always check)
        const initialCount = inMemoryAlerts.length;
        inMemoryAlerts = inMemoryAlerts.filter(a => a._id !== id);

        if (inMemoryAlerts.length < initialCount) {
            console.log('✅ Removed from in-memory storage');
        }

        // 2. Remove from MongoDB (only if it doesn't look like an in-memory ID)
        const isInMemoryId = id.startsWith('v_') || id.startsWith('yt_') || id.startsWith('man_') || id.startsWith('live_');

        if (!isInMemoryId) {
            try {
                const deleted = await Alert.findByIdAndDelete(id);
                if (deleted) {
                    console.log('✅ Removed from MongoDB storage');
                } else {
                    console.warn('⚠️ Alert not found in MongoDB');
                }
            } catch (dbErr) {
                console.warn('⚠️ MongoDB delete failed (likely invalid ID format):', dbErr.message);
            }
        } else {
            console.log('ℹ️ Skipping MongoDB delete (In-Memory ID recognized)');
        }

        res.json({ success: true, message: 'Alert removed permanently from system.' });
    } catch (error) {
        console.error('Single Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};

// Delete ALL Records Permanently (Admin Only)
exports.deleteAllRecords = async (req, res) => {
    try {
        console.log(`🗑️ DELETE ALL initiated by admin: ${req.user?.username}`);

        // Wipe MongoDB
        await Alert.deleteMany({});

        // Wipe in-memory
        inMemoryAlerts = [];

        res.json({ success: true, message: 'All records permanently deleted.' });
    } catch (error) {
        console.error('Delete All Records Error:', error);
        res.status(500).json({ error: 'Failed to delete all records' });
    }
};

// Proxy Webcam frames to ML Service
let proxyHitCount = 0;
exports.proxyWebcam = async (req, res) => {
    try {
        proxyHitCount++;
        if (proxyHitCount % 10 === 0) console.log(`Proxy hit count: ${proxyHitCount}`);
        const mlResponse = await axios.post('http://127.0.0.1:5000/predict/webcam', req.body);
        res.json(mlResponse.data);
    } catch (error) {
        console.error("Webcam Proxy Error:", error.message);
        res.status(500).json({ error: "ML Service unreachable via Proxy", details: error.message });
    }
};
