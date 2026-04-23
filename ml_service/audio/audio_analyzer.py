import numpy as np
import time
from collections import deque

class AudioAnalyzer:
    """
    Analyzes audio for violence indicators:
    - Screaming/Shouting (high frequency, high amplitude)
    - Glass breaking (sharp transients)
    - Loud impacts (sudden amplitude spikes)
    - Aggressive speech patterns
    """
    
    def __init__(self):
        self.sample_rate = 44100  # Standard audio sample rate
        self.audio_history = deque(maxlen=50)  # Last 50 audio frames
        self.violence_score = 0.0
        self.last_alert_time = 0
        self.alert_cooldown = 2.0  # Seconds between alerts
        
        # Thresholds
        self.volume_threshold = 0.3  # 30% of max volume
        self.scream_freq_min = 1000  # Hz (screaming typically 1-4kHz)
        self.scream_freq_max = 4000  # Hz
        self.impact_threshold = 0.7  # 70% sudden spike
        
    def analyze_audio_chunk(self, audio_data):
        """
        Analyze a chunk of audio data for violence indicators
        
        Args:
            audio_data: numpy array of audio samples (mono, normalized -1 to 1)
            
        Returns:
            dict with analysis results
        """
        if audio_data is None or len(audio_data) == 0:
            return {
                "violence_detected": False,
                "violence_score": 0.0,
                "reason": "No audio data",
                "volume": 0.0
            }
        
        # Ensure audio is numpy array
        if not isinstance(audio_data, np.ndarray):
            audio_data = np.array(audio_data, dtype=np.float32)
        
        # Normalize if needed
        if audio_data.max() > 1.0:
            audio_data = audio_data / 32768.0  # Convert from int16 to float
        
        # Calculate features
        volume = self._calculate_volume(audio_data)
        frequency_profile = self._analyze_frequency(audio_data)
        is_sudden_spike = self._detect_sudden_spike(volume)
        is_scream = self._detect_scream(frequency_profile, volume)
        is_impact = self._detect_impact(audio_data)
        
        # Update history
        self.audio_history.append({
            "volume": volume,
            "frequency": frequency_profile,
            "timestamp": time.time()
        })
        
        # Calculate violence score
        violence_indicators = 0
        reason_parts = []
        
        if volume > self.volume_threshold:
            violence_indicators += 1
            reason_parts.append("High volume")
        
        if is_scream:
            violence_indicators += 2  # Screaming is strong indicator
            reason_parts.append("Scream detected")
        
        if is_impact:
            violence_indicators += 2  # Impact sounds are strong indicator
            reason_parts.append("Impact sound")
        
        if is_sudden_spike:
            violence_indicators += 1
            reason_parts.append("Sudden spike")
        
        # Calculate final score (0-1)
        raw_score = min(1.0, violence_indicators / 4.0)
        
        # Temporal smoothing
        self.violence_score = 0.7 * self.violence_score + 0.3 * raw_score
        
        # Determine if violence detected
        violence_detected = self.violence_score > 0.5
        
        # Check cooldown
        current_time = time.time()
        if violence_detected and (current_time - self.last_alert_time) < self.alert_cooldown:
            violence_detected = False  # Suppress rapid alerts
        
        if violence_detected:
            self.last_alert_time = current_time
        
        reason = " + ".join(reason_parts) if reason_parts else "Normal audio"
        
        return {
            "violence_detected": violence_detected,
            "violence_score": float(self.violence_score),
            "reason": reason,
            "volume": float(volume),
            "is_scream": is_scream,
            "is_impact": is_impact,
            "frequency_profile": frequency_profile
        }
    
    def _calculate_volume(self, audio_data):
        """Calculate RMS volume (0-1)"""
        rms = np.sqrt(np.mean(audio_data ** 2))
        return float(rms)
    
    def _analyze_frequency(self, audio_data):
        """Analyze frequency content using FFT"""
        # Perform FFT
        fft = np.fft.rfft(audio_data)
        freqs = np.fft.rfftfreq(len(audio_data), 1/self.sample_rate)
        magnitudes = np.abs(fft)
        
        # Normalize
        if magnitudes.max() > 0:
            magnitudes = magnitudes / magnitudes.max()
        
        # Find dominant frequency
        dominant_idx = np.argmax(magnitudes)
        dominant_freq = freqs[dominant_idx]
        
        # Calculate energy in scream range
        scream_mask = (freqs >= self.scream_freq_min) & (freqs <= self.scream_freq_max)
        scream_energy = np.sum(magnitudes[scream_mask]) / (np.sum(scream_mask) + 1e-6)
        
        return {
            "dominant_freq": float(dominant_freq),
            "scream_energy": float(scream_energy),
            "total_energy": float(np.sum(magnitudes))
        }
    
    def _detect_sudden_spike(self, current_volume):
        """Detect sudden volume spikes"""
        if len(self.audio_history) < 3:
            return False
        
        recent_volumes = [h["volume"] for h in list(self.audio_history)[-3:]]
        avg_volume = np.mean(recent_volumes)
        
        # Spike if current volume is 2x average
        return current_volume > (avg_volume * 2.0) and current_volume > 0.2
    
    def _detect_scream(self, frequency_profile, volume):
        """Detect screaming (high frequency + high volume)"""
        dominant_freq = frequency_profile["dominant_freq"]
        scream_energy = frequency_profile["scream_energy"]
        
        # Scream characteristics:
        # 1. Dominant frequency in scream range (1-4kHz)
        # 2. High energy in scream range
        # 3. High volume
        
        is_scream_freq = self.scream_freq_min <= dominant_freq <= self.scream_freq_max
        is_high_scream_energy = scream_energy > 0.3
        is_loud = volume > 0.25
        
        return is_scream_freq and is_high_scream_energy and is_loud
    
    def _detect_impact(self, audio_data):
        """Detect impact sounds (glass breaking, hitting)"""
        # Impact sounds have:
        # 1. Very short duration spike
        # 2. High amplitude
        # 3. Broad frequency spectrum
        
        # Calculate envelope
        envelope = np.abs(audio_data)
        
        # Find peaks
        threshold = self.impact_threshold * envelope.max()
        peaks = envelope > threshold
        
        # Count peak clusters (impacts are short bursts)
        if np.any(peaks):
            # Check if peak is short and intense
            peak_duration = np.sum(peaks) / len(audio_data)
            is_short = peak_duration < 0.1  # Less than 10% of chunk
            is_intense = envelope.max() > 0.6
            
            return is_short and is_intense
        
        return False
    
    def reset(self):
        """Reset analyzer state"""
        self.audio_history.clear()
        self.violence_score = 0.0
        self.last_alert_time = 0

# Singleton instance
audio_analyzer = AudioAnalyzer()
