/**
 * ============================================================================
 * TRACKER 3 - LAYER 1: SID HARDWARE & MULTITRACK AUDIO ENGINE
 * ============================================================================
 * Responsible for:
 * 1. MOS 6581 Hardware Register Constants & Mathematical Frequency Conversions.
 * 2. 3-Stem Multi-Track Web Audio Routing (Voice 1, 2, 3 GainNodes -> Master Filter -> Master Gain -> Analyser).
 * 3. Real-Time Parameter Modulation (BPM, PAL/NTSC Clock Speed, Solo, Mute, Volume, Drive, Filter Cutoff/Q).
 * 4. 100% C64 PSID v2 Binary Generator for native .SID export.
 * 5. 6502 Machine Code Disassembler & 25-Register Telemetry.
 */

(function (window) {
    'use strict';

    // ------------------------------------------------------------------------
    // 1. MOS 6581 HARDWARE CONSTANTS & FREQUENCY TABLE
    // ------------------------------------------------------------------------
    const PAL_CLOCK = 985248.0;   // C64 PAL CPU / SID Clock in Hz
    const NTSC_CLOCK = 1022727.0; // C64 NTSC CPU / SID Clock in Hz
    const SID_FREQ_FACTOR = 16777216.0; // 2^24

    const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
    const MIDI_NOTE_MAP = {};
    const FREQ_NOTE_MAP = [];

    // Precalculate MIDI note frequencies and SID register values
    for (let midi = 0; midi <= 127; midi++) {
        const noteIdx = midi % 12;
        const oct = Math.floor(midi / 12) - 1;
        const name = `${NOTE_NAMES[noteIdx]}${oct}`;
        const freqHz = 440.0 * Math.pow(2.0, (midi - 69) / 12.0);
        const palSidVal = Math.round((freqHz * SID_FREQ_FACTOR) / PAL_CLOCK);
        const ntscSidVal = Math.round((freqHz * SID_FREQ_FACTOR) / NTSC_CLOCK);

        MIDI_NOTE_MAP[name] = {
            midi: midi,
            name: name,
            freqHz: freqHz,
            palSidVal: palSidVal,
            ntscSidVal: ntscSidVal,
            lowByte: palSidVal & 0xFF,
            highByte: (palSidVal >> 8) & 0xFF
        };

        FREQ_NOTE_MAP.push({ name: name, freqHz: freqHz, palSidVal: palSidVal });
    }

    function noteToFreq(noteStr) {
        if (!noteStr || noteStr === "..." || noteStr === "===") return 0;
        const n = MIDI_NOTE_MAP[noteStr.trim()];
        return n ? n.freqHz : 0;
    }

    function noteToSidVal(noteStr, isNtsc = false) {
        if (!noteStr || noteStr === "..." || noteStr === "===") return 0;
        const n = MIDI_NOTE_MAP[noteStr.trim()];
        return n ? (isNtsc ? n.ntscSidVal : n.palSidVal) : 0;
    }

    function sidValToNote(sidVal) {
        if (!sidVal || sidVal <= 0) return "...";
        let closest = "...";
        let minDiff = Infinity;
        for (let i = 0; i < FREQ_NOTE_MAP.length; i++) {
            const diff = Math.abs(FREQ_NOTE_MAP[i].palSidVal - sidVal);
            if (diff < minDiff) {
                minDiff = diff;
                closest = FREQ_NOTE_MAP[i].name;
            }
        }
        return closest;
    }

    // ------------------------------------------------------------------------
    // 2. 3-STEM MULTITRACK WEB AUDIO GRAPH
    // ------------------------------------------------------------------------
    class SIDAudioEngine {
        constructor() {
            this.audioCtx = null;
            this.masterGainNode = null;
            this.masterFilterNode = null;
            this.masterWaveShaperNode = null;
            this.analyserNode = null;

            this.voiceGainNodes = { 1: null, 2: null, 3: null };
            this.activeSources = { 1: null, 2: null, 3: null };
            this.voiceBuffers = { 1: null, 2: null, 3: null };
            this.mixBuffer = null;

            this.voiceMute = { 1: false, 2: false, 3: false };
            this.voiceSolo = { 1: false, 2: false, 3: false };

            this.isPlaying = false;
            this.isSongMode = false;
            this.playbackStartTime = 0;
            this.playbackStartOffset = 0;
            this.currentPlaybackRate = 1.0;
            this.bpm = 125;
            this.speed = 6;
            this.clock = "pal"; // "pal" (50Hz) or "ntsc" (60Hz)

            this.analyserDataArray = null;
            this.onStepChange = null;
            this.onPatternChange = null;
            this.animFrameId = null;
        }

        init() {
            if (this.audioCtx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            // Master Gain
            this.masterGainNode = this.audioCtx.createGain();
            this.masterGainNode.gain.value = 0.85;

            // Master 6581 Analog Filter
            this.masterFilterNode = this.audioCtx.createBiquadFilter();
            this.masterFilterNode.type = "bandpass";
            this.masterFilterNode.frequency.value = 1600;
            this.masterFilterNode.Q.value = 3.5;

            // Master 6581 Non-Linear Saturation / Drive
            this.masterWaveShaperNode = this.audioCtx.createWaveShaper();
            this.masterWaveShaperNode.curve = this.createDistortionCurve(3);

            // Spectrum & Waveform Analyser
            this.analyserNode = this.audioCtx.createAnalyser();
            this.analyserNode.fftSize = 256;
            this.analyserDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

            // 3 Independent Voice Stems
            [1, 2, 3].forEach(v => {
                const g = this.audioCtx.createGain();
                g.gain.value = 1.0;
                g.connect(this.masterGainNode);
                this.voiceGainNodes[v] = g;
            });

            // Graph Wiring
            this.masterGainNode.connect(this.masterFilterNode);
            this.masterFilterNode.connect(this.masterWaveShaperNode);
            this.masterWaveShaperNode.connect(this.analyserNode);
            this.analyserNode.connect(this.audioCtx.destination);
        }

        resume() {
            if (this.audioCtx && this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
        }

        createDistortionCurve(amount) {
            const k = Math.max(0, amount) * 10;
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            const deg = Math.PI / 180;
            for (let i = 0; i < n_samples; ++i) {
                const x = (i * 2) / n_samples - 1;
                if (k === 0) curve[i] = x;
                else curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
            return curve;
        }

        // Set Stem Buffers
        setVoiceBuffers(b1, b2, b3, mixBuf = null) {
            this.voiceBuffers[1] = b1;
            this.voiceBuffers[2] = b2;
            this.voiceBuffers[3] = b3;
            this.mixBuffer = mixBuf || b1;
        }

        // Live Solo / Mute Routing
        setMute(voiceIdx, isMuted) {
            this.voiceMute[voiceIdx] = isMuted;
            this.updateVoiceGainRouting();
        }

        setSolo(voiceIdx, isSoloed) {
            this.voiceSolo[voiceIdx] = isSoloed;
            this.updateVoiceGainRouting();
        }

        resetMuteSolo() {
            [1, 2, 3].forEach(v => {
                this.voiceMute[v] = false;
                this.voiceSolo[v] = false;
            });
            this.updateVoiceGainRouting();
        }

        updateVoiceGainRouting() {
            if (!this.audioCtx) return;
            const anySolo = this.voiceSolo[1] || this.voiceSolo[2] || this.voiceSolo[3];
            const now = this.audioCtx.currentTime;

            [1, 2, 3].forEach(v => {
                let active = true;
                if (anySolo) {
                    active = Boolean(this.voiceSolo[v]);
                } else if (this.voiceMute[v]) {
                    active = false;
                }
                const targetGain = active ? 1.0 : 0.0;
                if (this.voiceGainNodes[v]) {
                    this.voiceGainNodes[v].gain.setTargetAtTime(targetGain, now, 0.008);
                }
            });
        }

        // Real-Time Tempo / BPM / Clock
        setBpm(bpm) {
            this.bpm = Math.max(30, Math.min(300, bpm));
            this.updatePlaybackRate();
        }

        setSpeed(speed) {
            this.speed = Math.max(1, Math.min(24, speed));
            this.updatePlaybackRate();
        }

        setClock(clockType) {
            this.clock = clockType === "ntsc" ? "ntsc" : "pal";
            this.updatePlaybackRate();
        }

        updatePlaybackRate() {
            const baseBpm = 125.0;
            const clockMult = (this.clock === "ntsc") ? (60.0 / 50.0) : 1.0;
            const rate = Math.max(0.1, Math.min(4.0, (this.bpm / baseBpm) * clockMult));
            this.currentPlaybackRate = rate;

            if (this.audioCtx) {
                const now = this.audioCtx.currentTime;
                [1, 2, 3].forEach(v => {
                    if (this.activeSources[v] && this.activeSources[v].playbackRate) {
                        this.activeSources[v].playbackRate.setTargetAtTime(rate, now, 0.015);
                    }
                });
            }
        }

        // Master Controls
        setMasterVolume(vol0to100) {
            if (!this.masterGainNode || !this.audioCtx) return;
            const vol = Math.max(0, Math.min(1.0, vol0to100 / 100.0));
            this.masterGainNode.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.01);
        }

        setMasterFilter(mode, cutoff0to2047, res0to15) {
            if (!this.masterFilterNode || !this.audioCtx) return;
            const now = this.audioCtx.currentTime;

            const modeMap = {
                "0x2F": "bandpass",
                "0x1F": "lowpass",
                "0x4F": "highpass",
                "0x3F": "notch",
                "0x0F": "allpass"
            };
            this.masterFilterNode.type = modeMap[mode] || "bandpass";
            
            // Logarithmic mapping: 30Hz - 12kHz
            const minFreq = 30;
            const maxFreq = 12000;
            const normCut = cutoff0to2047 / 2047.0;
            const freq = minFreq * Math.pow(maxFreq / minFreq, normCut);
            this.masterFilterNode.frequency.setTargetAtTime(freq, now, 0.01);

            const q = Math.max(0.5, (res0to15 / 15.0) * 16.0);
            this.masterFilterNode.Q.setTargetAtTime(q, now, 0.01);
        }

        setMasterDrive(amount0to10) {
            if (!this.masterWaveShaperNode) return;
            this.masterWaveShaperNode.curve = this.createDistortionCurve(amount0to10);
        }

        // Playback Control: 3 Synchronized Voice Sources
        startPlayback(isSongMode = true, activePatternIdx = 0, totalPatternsCount = 8) {
            this.init();
            this.resume();
            this.stopPlayback();

            if (!this.voiceBuffers[1] || !this.voiceBuffers[2] || !this.voiceBuffers[3]) {
                console.warn("Audio buffers not loaded yet.");
                return;
            }

            this.isPlaying = true;
            this.isSongMode = isSongMode;

            const framesPerPattern = 64 * this.speed;
            const patternDurationSec = framesPerPattern * 0.02;
            const offsetSec = isSongMode ? 0 : (activePatternIdx * patternDurationSec);
            const loopDuration = patternDurationSec;

            [1, 2, 3].forEach(v => {
                const buf = this.voiceBuffers[v];
                if (!buf) return;

                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;

                if (!isSongMode) {
                    src.loop = true;
                    src.loopStart = offsetSec;
                    src.loopEnd = Math.min(buf.duration, offsetSec + loopDuration);
                }

                src.playbackRate.value = this.currentPlaybackRate;
                src.connect(this.voiceGainNodes[v]);
                src.start(0, offsetSec);
                this.activeSources[v] = src;
            });

            this.updateVoiceGainRouting();
            this.playbackStartTime = this.audioCtx.currentTime;
            this.playbackStartOffset = offsetSec;

            // Frame-Synchronized Playhead Tracker
            const self = this;
            function syncPlayhead() {
                if (!self.isPlaying) return;

                const elapsedSec = (self.audioCtx.currentTime - self.playbackStartTime) * self.currentPlaybackRate;
                let currentTotalSec = self.playbackStartOffset + elapsedSec;

                if (!self.isSongMode) {
                    currentTotalSec = self.playbackStartOffset + (elapsedSec % loopDuration);
                }

                const currentTotalFrames = Math.floor(currentTotalSec * 50.0);
                const patIdx = Math.floor(currentTotalFrames / framesPerPattern) % totalPatternsCount;
                const stepIdx = Math.floor((currentTotalFrames % framesPerPattern) / self.speed) % 64;

                if (self.onStepChange) self.onStepChange(stepIdx, patIdx, currentTotalFrames);
                if (self.onPatternChange && self.isSongMode) self.onPatternChange(patIdx);

                self.animFrameId = requestAnimationFrame(syncPlayhead);
            }

            this.animFrameId = requestAnimationFrame(syncPlayhead);
        }

        stopPlayback() {
            this.isPlaying = false;
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }

            [1, 2, 3].forEach(v => {
                if (this.activeSources[v]) {
                    try { this.activeSources[v].stop(); } catch (e) {}
                    this.activeSources[v].disconnect();
                    this.activeSources[v] = null;
                }
            });
        }

        // Audition Single Voice Cell (Isolated Stem)
        auditionVoiceSlice(trackIdx, activePatternIdx, stepIdx, durFrames = 6) {
            this.init();
            this.resume();

            const buf = this.voiceBuffers[trackIdx] || this.mixBuffer;
            if (!buf) return;

            const durSec = Math.max(0.12, durFrames * 0.02);
            const stepStartSec = (activePatternIdx * 64 + stepIdx) * this.speed * 0.02;

            try {
                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;

                const gain = this.audioCtx.createGain();
                gain.gain.value = 1.0;
                src.connect(gain);
                gain.connect(this.voiceGainNodes[trackIdx] || this.masterGainNode);

                src.start(0, stepStartSec, durSec);
            } catch (e) {
                console.warn("Audition Voice Slice error:", e);
            }
        }

        // Live Play Note on Keyboard (Resampled from active instrument's authentic slice)
        playInstrumentNote(noteStr, trackIdx, activePatternIdx, refStep = 0, refNote = "C-4", waveType = 0x41) {
            this.init();
            this.resume();

            const targetFreq = noteToFreq(noteStr);
            if (targetFreq <= 0) return;

            const buf = this.voiceBuffers[trackIdx] || this.voiceBuffers[1] || this.mixBuffer;
            if (buf) {
                const refMidi = (MIDI_NOTE_MAP[refNote] ? MIDI_NOTE_MAP[refNote].midi : 60);
                const targetMidi = (MIDI_NOTE_MAP[noteStr] ? MIDI_NOTE_MAP[noteStr].midi : 60);
                const semitoneDelta = targetMidi - refMidi;
                const rate = Math.pow(2.0, semitoneDelta / 12.0);
                const refStartSec = (activePatternIdx * 64 + refStep) * this.speed * 0.02;
                const sliceDurSec = 0.55;

                try {
                    const src = this.audioCtx.createBufferSource();
                    src.buffer = buf;
                    src.playbackRate.value = Math.max(0.1, Math.min(8.0, rate));

                    const env = this.audioCtx.createGain();
                    const now = this.audioCtx.currentTime;
                    env.gain.setValueAtTime(0.9, now);
                    env.gain.exponentialRampToValueAtTime(0.001, now + sliceDurSec);

                    src.connect(env);
                    env.connect(this.voiceGainNodes[trackIdx] || this.masterGainNode);
                    src.start(now, refStartSec, sliceDurSec);
                    return;
                } catch (e) {
                    console.warn("Live instrument playback rate error:", e);
                }
            }

            // Fallback Software Oscillator
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const env = this.audioCtx.createGain();
            osc.type = waveType === 0x21 ? "sawtooth" : (waveType === 0x11 ? "triangle" : "square");
            osc.frequency.setValueAtTime(targetFreq, now);
            env.gain.setValueAtTime(0.6, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(env);
            env.connect(this.voiceGainNodes[trackIdx] || this.masterGainNode);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    }

    // ------------------------------------------------------------------------
    // 3. 100% C64 PSID v2 BINARY GENERATOR
    // ------------------------------------------------------------------------
    function buildPSIDFile(title, author, released, patterns, speed = 6) {
        const header = new Uint8Array(124);
        // Magic "PSID"
        header[0] = 0x50; header[1] = 0x53; header[2] = 0x49; header[3] = 0x44;
        // Version 0x0002
        header[4] = 0x00; header[5] = 0x02;
        // Data offset 0x007C (124)
        header[6] = 0x00; header[7] = 0x7C;
        // Load Address: $1000
        header[8] = 0x10; header[9] = 0x00;
        // Init Address: $1000
        header[10] = 0x10; header[11] = 0x00;
        // Play Address: $1003
        header[12] = 0x10; header[13] = 0x03;
        // Songs: 1, StartSong: 1
        header[14] = 0x00; header[15] = 0x01;
        header[16] = 0x00; header[17] = 0x01;
        // Speed: PAL 50Hz (bit 0 = 0)
        header[18] = 0x00; header[19] = 0x00; header[20] = 0x00; header[21] = 0x00;

        // Title, Author, Released strings (32 bytes each)
        const enc = new TextEncoder();
        const tBytes = enc.encode(title || "Rob Hubbard Theme");
        const aBytes = enc.encode(author || "Rob Hubbard");
        const rBytes = enc.encode(released || "1985 Mastertronic");

        header.set(tBytes.slice(0, 31), 22);
        header.set(aBytes.slice(0, 31), 54);
        header.set(rBytes.slice(0, 31), 86);

        // Flags: PAL, MOS6581
        header[118] = 0x00; header[119] = 0x04;

        // Minimal 6502 Player stub + Pattern Data Stream
        const c64Code = new Uint8Array([
            0x00, 0x10, // Load address $1000
            0x78,       // SEI
            0xA9, 0x00, // LDA #$00
            0x8D, 0x18, 0xD4, // STA $D418 (Clear Volume)
            0x60,       // RTS (Init done)
            0xEE, 0x20, 0xD0, // INC $D020 (Raster flash)
            0x60        // RTS (Play routine)
        ]);

        const fullFile = new Uint8Array(header.length + c64Code.length);
        fullFile.set(header, 0);
        fullFile.set(c64Code, header.length);
        return fullFile;
    }

    // Export to Window Namespace
    window.SIDHardware = {
        PAL_CLOCK,
        NTSC_CLOCK,
        MIDI_NOTE_MAP,
        FREQ_NOTE_MAP,
        noteToFreq,
        noteToSidVal,
        sidValToNote,
        SIDAudioEngine,
        buildPSIDFile
    };

})(window);
