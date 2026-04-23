/**
 * Voice Alert System
 * Provides spoken alerts when threats are detected
 */

class VoiceAlertSystem {
    constructor() {
        this.enabled = true;
        this.lastAlertTime = 0;
        this.alertCooldown = 5000; // 5 seconds between voice alerts
        this.synthesis = window.speechSynthesis;
        this.voice = null;
        this.volume = 1.0;
        this.rate = 1.0;
        this.pitch = 1.0;

        // Initialize voice
        this.initializeVoice();
    }

    initializeVoice() {
        // Wait for voices to load
        if (this.synthesis.getVoices().length === 0) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.selectBestVoice();
            });
        } else {
            this.selectBestVoice();
        }
    }

    selectBestVoice() {
        const voices = this.synthesis.getVoices();

        // Prefer English voices
        const englishVoices = voices.filter(voice =>
            voice.lang.startsWith('en-')
        );

        // Try to find a good quality voice
        const preferredVoices = [
            'Google US English',
            'Microsoft David',
            'Microsoft Zira',
            'Alex',
            'Samantha',
            'Google UK English Female',
            'Google UK English Male'
        ];

        for (const preferred of preferredVoices) {
            const voice = englishVoices.find(v => v.name.includes(preferred));
            if (voice) {
                this.voice = voice;
                console.log('✅ Voice selected:', voice.name);
                return;
            }
        }

        // Fallback to first English voice
        if (englishVoices.length > 0) {
            this.voice = englishVoices[0];
            console.log('✅ Voice selected (fallback):', this.voice.name);
        } else if (voices.length > 0) {
            this.voice = voices[0];
            console.log('⚠️ Voice selected (non-English):', this.voice.name);
        }
    }

    speak(text, priority = 'normal') {
        if (!this.enabled) return;

        // Check cooldown (except for critical alerts)
        const now = Date.now();
        if (priority !== 'critical' && (now - this.lastAlertTime) < this.alertCooldown) {
            console.log('🔇 Voice alert suppressed (cooldown)');
            return;
        }

        // Cancel any ongoing speech for critical alerts
        if (priority === 'critical') {
            this.synthesis.cancel();
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice properties
        if (this.voice) {
            utterance.voice = this.voice;
        }
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;

        // Adjust for priority
        if (priority === 'critical') {
            utterance.rate = 1.1; // Slightly faster
            utterance.pitch = 1.1; // Slightly higher pitch for urgency
        }

        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speaking:', text);
        };

        utterance.onend = () => {
            console.log('✅ Speech completed');
        };

        utterance.onerror = (event) => {
            console.error('❌ Speech error:', event.error);
        };

        // Speak
        this.synthesis.speak(utterance);
        this.lastAlertTime = now;
    }

    // Predefined alert messages
    alertHighRisk(behaviorType = 'Violence') {
        const messages = [
            `Alert! High risk ${behaviorType} detected!`,
            `Warning! ${behaviorType} detected! Emergency response initiated!`,
            `Attention! High threat level! ${behaviorType} in progress!`
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.speak(message, 'critical');
    }

    alertMediumRisk(behaviorType = 'Suspicious Activity') {
        const messages = [
            `Caution! Medium risk detected. ${behaviorType} observed.`,
            `Warning! Suspicious behavior detected. Monitoring closely.`,
            `Alert! Potential threat detected. ${behaviorType} in progress.`
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.speak(message, 'normal');
    }

    alertFighting() {
        this.speak('Critical alert! Fighting detected! Emergency services notified!', 'critical');
    }

    alertAssault() {
        this.speak('Critical alert! Assault detected! Emergency response initiated!', 'critical');
    }

    alertAudioViolence(reason = 'Screaming') {
        this.speak(`Audio alert! ${reason} detected! Investigating threat!`, 'critical');
    }

    alertCombinedThreat(videoType, audioReason) {
        this.speak(`Critical combined threat! ${videoType} and ${audioReason} detected! Emergency response activated!`, 'critical');
    }

    alertRiskLevelChange(oldLevel, newLevel) {
        if (newLevel === 'High' && oldLevel !== 'High') {
            this.speak('Risk level elevated to high! Immediate attention required!', 'critical');
        } else if (newLevel === 'Medium' && oldLevel === 'Low') {
            this.speak('Risk level increased to medium. Monitoring situation.', 'normal');
        } else if (newLevel === 'Low' && oldLevel !== 'Low') {
            this.speak('Risk level decreased to low. Situation stabilizing.', 'normal');
        }
    }

    alertSystemStatus(status) {
        if (status === 'started') {
            this.speak('Sentinel AI monitoring system activated. Live detection in progress.', 'normal');
        } else if (status === 'stopped') {
            this.speak('Monitoring system deactivated.', 'normal');
        } else if (status === 'error') {
            this.speak('System error detected. Please check connection.', 'normal');
        }
    }

    alertRecordingStarted() {
        this.speak('Recording started. Capturing incident for evidence.', 'normal');
    }

    alertRecordingStopped() {
        this.speak('Recording stopped. Incident captured.', 'normal');
    }

    alertEmergencyContacted() {
        this.speak('Emergency services have been contacted. Help is on the way.', 'critical');
    }

    // Custom alert
    customAlert(message, priority = 'normal') {
        this.speak(message, priority);
    }

    // Control methods
    enable() {
        this.enabled = true;
        console.log('✅ Voice alerts enabled');
    }

    disable() {
        this.enabled = false;
        this.synthesis.cancel();
        console.log('🔇 Voice alerts disabled');
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.synthesis.cancel();
        }
        console.log(this.enabled ? '✅ Voice alerts enabled' : '🔇 Voice alerts disabled');
        return this.enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log('🔊 Volume set to:', this.volume);
    }

    setRate(rate) {
        this.rate = Math.max(0.5, Math.min(2, rate));
        console.log('⏩ Speech rate set to:', this.rate);
    }

    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        console.log('🎵 Pitch set to:', this.pitch);
    }

    stop() {
        this.synthesis.cancel();
        console.log('⏹️ Speech stopped');
    }

    test() {
        this.speak('Voice alert system test. All systems operational.', 'normal');
    }
}

// Create singleton instance
const voiceAlerts = new VoiceAlertSystem();

export default voiceAlerts;
