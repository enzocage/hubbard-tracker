"""
Fast Vectorized MOS 6581 / 8580 SID Software Synthesizer in Pure Python + NumPy
Renders 44.1 kHz 16-bit PCM audio directly from SID register frame streams.
Supports Voice Isolation (Solo/Mute), Sub-Pattern Slicing, and WAV export.
"""

import numpy as np
import wave
import struct
from engine.extractor import SIDExtractor

class SIDSynthesizer:
    def __init__(self, sample_rate=44100, pal_clock=985248.0):
        self.sample_rate = sample_rate
        self.pal_clock = pal_clock
        self.samples_per_frame = int(sample_rate / 50.0) # 882 samples @ 44.1kHz

    def render_sid_file(self, sid_path, num_frames=800, voice_mask=(True, True, True), start_frame=0, end_frame=None):
        """
        Renders a .sid file into 44.1kHz 16-bit PCM audio.
        :param voice_mask: (v1_active, v2_active, v3_active)
        :param start_frame: First frame to render (sub-pattern start)
        :param end_frame: Last frame to render (sub-pattern end)
        """
        extractor = SIDExtractor(sid_path)
        total_capture = num_frames if end_frame is None else max(num_frames, end_frame)
        frames = extractor.capture_frames(num_frames=total_capture)
        
        return self.render_frame_stream(
            frames=frames,
            voice_mask=voice_mask,
            start_frame=start_frame,
            end_frame=end_frame
        )

    def render_frame_stream(self, frames, voice_mask=(True, True, True), start_frame=0, end_frame=None):
        """
        Synthesizes 44.1kHz PCM samples from a list of captured 50Hz register frames.
        """
        if end_frame is None or end_frame > len(frames):
            end_frame = len(frames)
        start_frame = max(0, min(start_frame, end_frame - 1))

        sliced_frames = frames[start_frame:end_frame]
        total_samples = len(sliced_frames) * self.samples_per_frame

        # Audio buffers for 3 voices
        v1_out = np.zeros(total_samples, dtype=np.float32)
        v2_out = np.zeros(total_samples, dtype=np.float32)
        v3_out = np.zeros(total_samples, dtype=np.float32)

        # Oscillator phases (0.0 to 1.0)
        phase_v1 = 0.0
        phase_v2 = 0.0
        phase_v3 = 0.0

        # ADSR Envelopes (0.0 to 1.0)
        env_v1 = 0.0
        env_v2 = 0.0
        env_v3 = 0.0
        env_state_v1 = "idle"
        env_state_v2 = "idle"
        env_state_v3 = "idle"

        # LFSR Noise Shift Registers
        lfsr_v1 = 0x7FFFF8
        lfsr_v2 = 0x7FFFF8
        lfsr_v3 = 0x7FFFF8

        # ADSR Rates in seconds (Standard 6581 lookup approximations)
        attack_times  = [0.002, 0.008, 0.016, 0.024, 0.038, 0.056, 0.068, 0.080,
                         0.100, 0.250, 0.500, 0.800, 1.000, 3.000, 5.000, 8.000]
        decay_times   = [0.006, 0.024, 0.048, 0.072, 0.114, 0.168, 0.204, 0.240,
                         0.300, 0.750, 1.500, 2.400, 3.000, 9.000, 15.00, 24.00]

        dt = 1.0 / self.sample_rate

        for f_idx, f_data in enumerate(sliced_frames):
            state = f_data["state"]
            sample_offset = f_idx * self.samples_per_frame
            s_end = sample_offset + self.samples_per_frame

            # --- VOICE 1 REGISTERS ---
            f1_raw = state[0] | (state[1] << 8)
            f1_hz = (f1_raw * self.pal_clock) / 16777216.0
            pw1 = ((state[2] | ((state[3] & 0x0F) << 8)) / 4095.0)
            wave1 = state[4]
            gate1 = wave1 & 0x01
            ad1 = state[5]
            sr1 = state[6]
            att1 = attack_times[(ad1 >> 4) & 0x0F]
            dec1 = decay_times[ad1 & 0x0F]
            sus1 = ((sr1 >> 4) & 0x0F) / 15.0
            rel1 = decay_times[sr1 & 0x0F]

            # --- VOICE 2 REGISTERS ---
            f2_raw = state[7] | (state[8] << 8)
            f2_hz = (f2_raw * self.pal_clock) / 16777216.0
            pw2 = ((state[9] | ((state[10] & 0x0F) << 8)) / 4095.0)
            wave2 = state[11]
            gate2 = wave2 & 0x01
            ad2 = state[12]
            sr2 = state[13]
            att2 = attack_times[(ad2 >> 4) & 0x0F]
            dec2 = decay_times[ad2 & 0x0F]
            sus2 = ((sr2 >> 4) & 0x0F) / 15.0
            rel2 = decay_times[sr2 & 0x0F]

            # --- VOICE 3 REGISTERS ---
            f3_raw = state[14] | (state[15] << 8)
            f3_hz = (f3_raw * self.pal_clock) / 16777216.0
            pw3 = ((state[16] | ((state[17] & 0x0F) << 8)) / 4095.0)
            wave3 = state[18]
            gate3 = wave3 & 0x01
            ad3 = state[19]
            sr3 = state[20]
            att3 = attack_times[(ad3 >> 4) & 0x0F]
            dec3 = decay_times[ad3 & 0x0F]
            sus3 = ((sr3 >> 4) & 0x0F) / 15.0
            rel3 = decay_times[sr3 & 0x0F]

            # Vectorized sample generation for this frame (882 samples)
            t_steps = np.arange(self.samples_per_frame)

            # 1. Voice 1 Oscillator
            if voice_mask[0] and f1_hz > 10.0:
                phases = (phase_v1 + t_steps * (f1_hz / self.sample_rate)) % 1.0
                phase_v1 = (phase_v1 + self.samples_per_frame * (f1_hz / self.sample_rate)) % 1.0
                
                # Waveforms
                w_type = wave1 & 0xF0
                if w_type & 0x10: # Triangle
                    raw_s = 2.0 * np.abs(2.0 * phases - 1.0) - 1.0
                elif w_type & 0x20: # Sawtooth
                    raw_s = 2.0 * phases - 1.0
                elif w_type & 0x40: # Pulse
                    raw_s = np.where(phases < pw1, 1.0, -1.0)
                elif w_type & 0x80: # Noise
                    raw_s = np.random.uniform(-1.0, 1.0, size=self.samples_per_frame)
                else:
                    raw_s = np.zeros(self.samples_per_frame)

                # Envelope
                if gate1:
                    env_v1 = min(1.0, env_v1 + (self.samples_per_frame * dt / att1))
                    if env_v1 >= 1.0:
                        env_v1 = max(sus1, env_v1 - (self.samples_per_frame * dt / dec1))
                else:
                    env_v1 = max(0.0, env_v1 - (self.samples_per_frame * dt / rel1))

                v1_out[sample_offset:s_end] = raw_s * env_v1

            # 2. Voice 2 Oscillator
            if voice_mask[1] and f2_hz > 10.0:
                phases = (phase_v2 + t_steps * (f2_hz / self.sample_rate)) % 1.0
                phase_v2 = (phase_v2 + self.samples_per_frame * (f2_hz / self.sample_rate)) % 1.0
                
                w_type = wave2 & 0xF0
                if w_type & 0x10: raw_s = 2.0 * np.abs(2.0 * phases - 1.0) - 1.0
                elif w_type & 0x20: raw_s = 2.0 * phases - 1.0
                elif w_type & 0x40: raw_s = np.where(phases < pw2, 1.0, -1.0)
                elif w_type & 0x80: raw_s = np.random.uniform(-1.0, 1.0, size=self.samples_per_frame)
                else: raw_s = np.zeros(self.samples_per_frame)

                if gate2:
                    env_v2 = min(1.0, env_v2 + (self.samples_per_frame * dt / att2))
                    if env_v2 >= 1.0:
                        env_v2 = max(sus2, env_v2 - (self.samples_per_frame * dt / dec2))
                else:
                    env_v2 = max(0.0, env_v2 - (self.samples_per_frame * dt / rel2))

                v2_out[sample_offset:s_end] = raw_s * env_v2

            # 3. Voice 3 Oscillator
            if voice_mask[2] and f3_hz > 10.0:
                phases = (phase_v3 + t_steps * (f3_hz / self.sample_rate)) % 1.0
                phase_v3 = (phase_v3 + self.samples_per_frame * (f3_hz / self.sample_rate)) % 1.0
                
                w_type = wave3 & 0xF0
                if w_type & 0x10: raw_s = 2.0 * np.abs(2.0 * phases - 1.0) - 1.0
                elif w_type & 0x20: raw_s = 2.0 * phases - 1.0
                elif w_type & 0x40: raw_s = np.where(phases < pw3, 1.0, -1.0)
                elif w_type & 0x80: raw_s = np.random.uniform(-1.0, 1.0, size=self.samples_per_frame)
                else: raw_s = np.zeros(self.samples_per_frame)

                if gate3:
                    env_v3 = min(1.0, env_v3 + (self.samples_per_frame * dt / att3))
                    if env_v3 >= 1.0:
                        env_v3 = max(sus3, env_v3 - (self.samples_per_frame * dt / dec3))
                else:
                    env_v3 = max(0.0, env_v3 - (self.samples_per_frame * dt / rel3))

                v3_out[sample_offset:s_end] = raw_s * env_v3

        # Master Mix
        master_mix = (v1_out + v2_out + v3_out) / 3.0
        # Soft limiter / normalization
        max_peak = np.max(np.abs(master_mix))
        if max_peak > 0.001:
            master_mix = (master_mix / max_peak) * 0.90

        # Convert to 16-bit signed PCM
        pcm_16 = np.int16(master_mix * 32767.0)
        return pcm_16, total_samples

    def save_wav(self, pcm_data, output_wav_path):
        """
        Saves PCM int16 array to a standard .wav audio file.
        """
        with wave.open(output_wav_path, "wb") as wav_file:
            wav_file.setnchannels(1) # Mono
            wav_file.setsampwidth(2) # 16-bit
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(pcm_data.tobytes())
        return len(pcm_data)
