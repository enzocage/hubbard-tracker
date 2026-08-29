/**
 * ============================================================================
 * HUBBARD MOTIF TRACKER 4 - CORE APPLICATION CONTROLLER
 * ============================================================================
 * Architecture:
 * 1. Pattern & Motif Decomposer (Grouping repeating musical phrases per voice)
 * 2. 3-Track Multi-Voice Arranger Timeline (Sequencing reusable motifs)
 * 3. Step & Pitch Matrix Editor (Editing notes, timings, and durations of motifs)
 * 4. MOS 6581 Instrument Sculptor & Real-time Web Audio Multi-Stem Engine
 */

(function () {
    'use strict';

    // ------------------------------------------------------------------------
    // 1. CONSTANTS & HARDWARE CONVERSION TABLES
    // ------------------------------------------------------------------------
    const PAL_CLOCK = 985248.0;
    const NTSC_CLOCK = 1022727.0;
    const SID_FREQ_FACTOR = 16777216.0;

    const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
    const MIDI_NOTE_MAP = {};
    const FREQ_NOTE_MAP = [];

    for (let midi = 0; midi <= 127; midi++) {
        const noteIdx = midi % 12;
        const oct = Math.floor(midi / 12) - 1;
        const name = `${NOTE_NAMES[noteIdx]}${oct}`;
        const freqHz = 440.0 * Math.pow(2.0, (midi - 69) / 12.0);
        const palSidVal = Math.round((freqHz * SID_FREQ_FACTOR) / PAL_CLOCK);
        const ntscSidVal = Math.round((freqHz * SID_FREQ_FACTOR) / NTSC_CLOCK);

        MIDI_NOTE_MAP[name] = {
            midi, name, freqHz, palSidVal, ntscSidVal,
            lowByte: palSidVal & 0xFF,
            highByte: (palSidVal >> 8) & 0xFF
        };
        FREQ_NOTE_MAP.push({ name, freqHz, palSidVal });
    }

    const KEYBOARD_MAP = {
        KeyZ: "C-3", KeyS: "C#3", KeyX: "D-3", KeyD: "D#3", KeyC: "E-3", KeyV: "F-3",
        KeyG: "F#3", KeyB: "G-3", KeyH: "G#3", KeyN: "A-3", KeyJ: "A#3", KeyM: "B-3",
        KeyQ: "C-4", Digit2: "C#4", KeyW: "D-4", Digit3: "D#4", KeyE: "E-4", KeyR: "F-4",
        Digit5: "F#4", KeyT: "G-4", Digit6: "G#4", KeyY: "A-4", Digit7: "A#4", KeyU: "B-4",
        KeyI: "C-5", Digit9: "C#5", KeyO: "D-5", Digit0: "D#5", KeyP: "E-5"
    };

    const SCALES = {
        minor: [0, 2, 3, 5, 7, 8, 10],
        harm_minor: [0, 2, 3, 5, 7, 8, 11],
        major: [0, 2, 4, 5, 7, 9, 11],
        pentatonic: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10]
    };

    const SIGNATURE_PRESETS = {
        commando_lead: { name: "Commando Heroic Pulse", wave: 0x41, attack: 0, decay: 9, sustain: 0, release: 0, pw: 2048, macro: "P02", filter: true },
        monty_violin: { name: "Monty Hi-Speed Violin Saw", wave: 0x21, attack: 0, decay: 8, sustain: 2, release: 1, pw: 0, macro: "none", filter: false },
        delta_space_arp: { name: "Delta Space 50Hz Arp", wave: 0x41, attack: 0, decay: 4, sustain: 0, release: 0, pw: 1536, macro: "A-m7", filter: true },
        ik_slap_bass: { name: "IK+ 16th Slap Pop Bass", wave: 0x41, attack: 0, decay: 5, sustain: 0, release: 0, pw: 800, macro: "S12", filter: false },
        sanxion_snare: { name: "Sanxion Noise Snare", wave: 0x81, attack: 0, decay: 6, sustain: 0, release: 0, pw: 0, macro: "D-SD", filter: false },
        crazy_laser: { name: "Crazy Comets Laser Sync", wave: 0x43, attack: 1, decay: 7, sustain: 2, release: 2, pw: 3000, macro: "P02", filter: true },
        spellbound_bass: { name: "Spellbound Dark Triangle", wave: 0x11, attack: 0, decay: 9, sustain: 8, release: 4, pw: 0, macro: "none", filter: true },
        magic_flute: { name: "Master of Magic Flute", wave: 0x11, attack: 2, decay: 6, sustain: 6, release: 3, pw: 0, macro: "V08", filter: true },
        lightforce_arp: { name: "Lightforce m11 Arp", wave: 0x41, attack: 0, decay: 3, sustain: 0, release: 0, pw: 2048, macro: "A-m11", filter: true },
        warhawk_kick: { name: "Warhawk Heavy Kick", wave: 0x81, attack: 0, decay: 3, sustain: 0, release: 0, pw: 0, macro: "D-BD", filter: false },
        knuckle_metal: { name: "Knucklebusters RingMod Bell", wave: 0x15, attack: 0, decay: 10, sustain: 0, release: 3, pw: 0, macro: "none", filter: true },
        mega_brass: { name: "Mega Apocalypse Brass", wave: 0x21, attack: 2, decay: 7, sustain: 5, release: 2, pw: 0, macro: "none", filter: true }
    };

    // ------------------------------------------------------------------------
    // 2. DATA MODEL (MOTIFS, LANES & INSTRUMENTS)
    // ------------------------------------------------------------------------
    class MotifProjectModel {
        constructor() {
            this.sidPath = "sid/Commando.sid";
            this.title = "Commando";
            this.author = "Rob Hubbard";
            this.bpm = 125;
            this.speed = 6;
            this.clock = "pal";

            // Motif Pool categorized by voice
            this.motifs = {};

            // 3-Voice Timeline Sequences (List of Motif IDs per lane)
            this.timelineLanes = {
                1: [], // Voice 1 (Lead Motifs)
                2: [], // Voice 2 (Arp Motifs)
                3: []  // Voice 3 (Bass/Drum Motifs)
            };

            // Active State
            this.activeMotifId = "M01";
            this.activeSlotIdx = 0;
            this.activeStep = 0;
            this.activeOctave = 4;

            // Instrument definition for the active motif
            this.activeInstrument = {
                id: 1,
                name: "Heroic Pulse Lead",
                wave: 0x41,
                attack: 0,
                decay: 9,
                sustain: 0,
                release: 0,
                pw: 2048,
                macro: "P02",
                filter: true
            };

            this.undoStack = [];
            this.redoStack = [];
        }

        // Decompile SID into discrete Repeating Motifs
        async decompileSID(sidPath) {
            this.sidPath = sidPath;
            const res = await fetch(`/api/decompile_tracker?sid=${encodeURIComponent(sidPath)}`);
            if (!res.ok) throw new Error(`Decompile failed for ${sidPath}`);

            const data = await res.json();
            this.title = data.title || "Commando";
            this.author = data.author || "Rob Hubbard";
            this.bpm = data.bpm || 125;
            this.speed = data.speed || 6;

            this.motifs = {};
            this.timelineLanes = { 1: [], 2: [], 3: [] };

            const numPatterns = data.patterns.length;

            // Group 64-row patterns into reusable Motifs per track
            for (let t = 1; t <= 3; t++) {
                const prefix = (t === 1) ? "M" : ((t === 2) ? "A" : "B");
                const trackMotifMap = {}; // hash of note sequence -> motifId

                for (let pIdx = 0; pIdx < numPatterns; pIdx++) {
                    const patRows = data.patterns[pIdx];
                    const steps = patRows.map((r, sIdx) => {
                        const cell = r[`t${t}`] || { note: "...", dur: "L06", inst: "01", wave: "---", fx: "..." };
                        return {
                            step: sIdx,
                            note: cell.note || "...",
                            dur: cell.dur || "L06",
                            inst: cell.inst || String(t).padStart(2, '0'),
                            wave: cell.wave || (t === 1 ? "$41" : (t === 2 ? "$41" : "$21")),
                            fx: cell.fx || "..."
                        };
                    });

                    // Check if identical step sequence already exists in pool
                    const sig = steps.map(s => `${s.note}:${s.dur}:${s.wave}`).join("|");
                    if (!trackMotifMap[sig]) {
                        const count = Object.keys(this.motifs).filter(k => k.startsWith(prefix)).length + 1;
                        const motifId = `${prefix}${String(count).padStart(2, '0')}`;
                        const motifName = (t === 1) ? `Lead Theme ${count}` : ((t === 2) ? `Arp Pattern ${count}` : `Bass/Drum Riff ${count}`);

                        this.motifs[motifId] = {
                            id: motifId,
                            track: t,
                            name: motifName,
                            steps: steps,
                            instId: t
                        };
                        trackMotifMap[sig] = motifId;
                    }

                    this.timelineLanes[t].push(trackMotifMap[sig]);
                }
            }

            // Set initial active motif
            const firstM = Object.keys(this.motifs)[0] || "M01";
            this.activeMotifId = firstM;
            this.activeStep = 0;
            this.activeSlotIdx = 0;
        }

        saveUndo() {
            this.undoStack.push({
                motifs: JSON.parse(JSON.stringify(this.motifs)),
                timelineLanes: JSON.parse(JSON.stringify(this.timelineLanes)),
                activeMotifId: this.activeMotifId,
                activeStep: this.activeStep
            });
            if (this.undoStack.length > 40) this.undoStack.shift();
            this.redoStack = [];
        }

        undo() {
            if (this.undoStack.length === 0) return false;
            this.redoStack.push({
                motifs: JSON.parse(JSON.stringify(this.motifs)),
                timelineLanes: JSON.parse(JSON.stringify(this.timelineLanes)),
                activeMotifId: this.activeMotifId,
                activeStep: this.activeStep
            });
            const prev = this.undoStack.pop();
            this.motifs = prev.motifs;
            this.timelineLanes = prev.timelineLanes;
            this.activeMotifId = prev.activeMotifId;
            this.activeStep = prev.activeStep;
            return true;
        }

        redo() {
            if (this.redoStack.length === 0) return false;
            this.saveUndo();
            const next = this.redoStack.pop();
            this.motifs = next.motifs;
            this.timelineLanes = next.timelineLanes;
            this.activeMotifId = next.activeMotifId;
            this.activeStep = next.activeStep;
            return true;
        }

        // Calculate note density of a motif
        getMotifDensity(motifId) {
            const m = this.motifs[motifId];
            if (!m) return 0;
            const filled = m.steps.filter(s => s.note && s.note !== "..." && s.note !== "===").length;
            return Math.min(100, Math.round((filled / 64) * 100));
        }

        // Create a new blank motif
        createNewMotif(trackIdx = 1) {
            this.saveUndo();
            const prefix = (trackIdx === 1) ? "M" : ((trackIdx === 2) ? "A" : "B");
            const count = Object.keys(this.motifs).filter(k => k.startsWith(prefix)).length + 1;
            const motifId = `${prefix}${String(count).padStart(2, '0')}`;

            const steps = [];
            for (let s = 0; s < 64; s++) {
                steps.push({
                    step: s,
                    note: "...",
                    dur: "L06",
                    inst: String(trackIdx).padStart(2, '0'),
                    wave: (trackIdx === 1 ? "$41" : (trackIdx === 2 ? "$41" : "$21")),
                    fx: "..."
                });
            }

            this.motifs[motifId] = {
                id: motifId,
                track: trackIdx,
                name: `Neues Motiv ${count}`,
                steps: steps,
                instId: trackIdx
            };

            this.activeMotifId = motifId;
            return motifId;
        }
    }

    // ------------------------------------------------------------------------
    // 3. MULTITRACK AUDIO ENGINE & MICRO-PATCH SYNTHESIS
    // ------------------------------------------------------------------------
    class MultiStemAudioEngine {
        constructor() {
            this.audioCtx = null;
            this.masterGain = null;
            this.masterFilter = null;
            this.masterDrive = null;
            this.analyser = null;

            this.voiceGains = { 1: null, 2: null, 3: null };
            this.voiceSources = { 1: null, 2: null, 3: null };
            this.voiceBuffers = { 1: null, 2: null, 3: null };

            this.voiceMute = { 1: false, 2: false, 3: false };
            this.voiceSolo = { 1: false, 2: false, 3: false };

            this.isPlaying = false;
            this.isMotifLoop = false;
            this.bpm = 125;
            this.speed = 6;
            this.clock = "pal";

            this.playbackStartTime = 0;
            this.playbackOffset = 0;
            this.analyserData = null;
            this.onStepTick = null;
            this.animId = null;
        }

        init() {
            if (this.audioCtx) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AC();

            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.85;

            this.masterFilter = this.audioCtx.createBiquadFilter();
            this.masterFilter.type = "bandpass";
            this.masterFilter.frequency.value = 1600;
            this.masterFilter.Q.value = 3.5;

            this.masterDrive = this.audioCtx.createWaveShaper();
            this.masterDrive.curve = this.createDistortionCurve(3);

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

            [1, 2, 3].forEach(v => {
                const g = this.audioCtx.createGain();
                g.gain.value = 1.0;
                g.connect(this.masterGain);
                this.voiceGains[v] = g;
            });

            this.masterGain.connect(this.masterFilter);
            this.masterFilter.connect(this.masterDrive);
            this.masterDrive.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
        }

        resume() {
            if (this.audioCtx && this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }
        }

        createDistortionCurve(amount) {
            const k = Math.max(0, amount) * 10;
            const n = 44100;
            const curve = new Float32Array(n);
            const deg = Math.PI / 180;
            for (let i = 0; i < n; ++i) {
                const x = (i * 2) / n - 1;
                if (k === 0) curve[i] = x;
                else curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
            return curve;
        }

        setVoiceBuffers(b1, b2, b3) {
            this.voiceBuffers[1] = b1;
            this.voiceBuffers[2] = b2;
            this.voiceBuffers[3] = b3;
        }

        setMute(voiceIdx, isMuted) {
            this.voiceMute[voiceIdx] = isMuted;
            this.updateVoiceGains();
        }

        setSolo(voiceIdx, isSoloed) {
            this.voiceSolo[voiceIdx] = isSoloed;
            this.updateVoiceGains();
        }

        resetMuteSolo() {
            [1, 2, 3].forEach(v => { this.voiceMute[v] = false; this.voiceSolo[v] = false; });
            this.updateVoiceGains();
        }

        updateVoiceGains() {
            if (!this.audioCtx) return;
            const anySolo = this.voiceSolo[1] || this.voiceSolo[2] || this.voiceSolo[3];
            const now = this.audioCtx.currentTime;

            [1, 2, 3].forEach(v => {
                let active = true;
                if (anySolo) active = Boolean(this.voiceSolo[v]);
                else if (this.voiceMute[v]) active = false;

                if (this.voiceGains[v]) {
                    this.voiceGains[v].gain.setTargetAtTime(active ? 1.0 : 0.0, now, 0.008);
                }
            });
        }

        setBpm(bpm) {
            this.bpm = Math.max(40, Math.min(240, bpm));
            this.updatePlaybackRate();
        }

        setSpeed(speed) {
            this.speed = Math.max(1, Math.min(16, speed));
            this.updatePlaybackRate();
        }

        setClock(clock) {
            this.clock = clock === "ntsc" ? "ntsc" : "pal";
            this.updatePlaybackRate();
        }

        updatePlaybackRate() {
            const baseBpm = 125.0;
            const clockMult = (this.clock === "ntsc") ? (60.0 / 50.0) : 1.0;
            const rate = Math.max(0.1, Math.min(4.0, (this.bpm / baseBpm) * clockMult));

            if (this.audioCtx) {
                const now = this.audioCtx.currentTime;
                [1, 2, 3].forEach(v => {
                    if (this.voiceSources[v] && this.voiceSources[v].playbackRate) {
                        this.voiceSources[v].playbackRate.setTargetAtTime(rate, now, 0.015);
                    }
                });
            }
        }

        setMasterFilter(mode, cutoff, res) {
            if (!this.masterFilter || !this.audioCtx) return;
            const modeMap = { "0x2F": "bandpass", "0x1F": "lowpass", "0x4F": "highpass", "0x3F": "notch", "0x0F": "allpass" };
            this.masterFilter.type = modeMap[mode] || "bandpass";

            const normCut = cutoff / 2047.0;
            const freq = 30 * Math.pow(12000 / 30, normCut);
            this.masterFilter.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.01);
            this.masterFilter.Q.setTargetAtTime(Math.max(0.5, (res / 15.0) * 16.0), this.audioCtx.currentTime, 0.01);
        }

        setMasterDrive(amount) {
            if (this.masterDrive) this.masterDrive.curve = this.createDistortionCurve(amount);
        }

        setMasterVolume(vol) {
            if (this.masterGain && this.audioCtx) {
                this.masterGain.gain.setTargetAtTime(vol / 100.0, this.audioCtx.currentTime, 0.01);
            }
        }

        startPlayback(isMotifLoop = false, slotIdx = 0) {
            this.init();
            this.resume();
            this.stopPlayback();

            if (!this.voiceBuffers[1] || !this.voiceBuffers[2] || !this.voiceBuffers[3]) return;

            this.isPlaying = true;
            this.isMotifLoop = isMotifLoop;

            const framesPerSlot = 64 * this.speed;
            const slotDurSec = framesPerSlot * 0.02;
            const offsetSec = isMotifLoop ? (slotIdx * slotDurSec) : 0;

            [1, 2, 3].forEach(v => {
                const buf = this.voiceBuffers[v];
                if (!buf) return;

                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;
                if (isMotifLoop) {
                    src.loop = true;
                    src.loopStart = offsetSec;
                    src.loopEnd = Math.min(buf.duration, offsetSec + slotDurSec);
                }
                src.playbackRate.value = (this.bpm / 125.0);
                src.connect(this.voiceGains[v]);
                src.start(0, offsetSec);
                this.voiceSources[v] = src;
            });

            this.updateVoiceGains();
            this.playbackStartTime = this.audioCtx.currentTime;
            this.playbackOffset = offsetSec;

            const self = this;
            function runSync() {
                if (!self.isPlaying) return;
                const elapsed = (self.audioCtx.currentTime - self.playbackStartTime) * (self.bpm / 125.0);
                const currentSec = isMotifLoop ? (offsetSec + (elapsed % slotDurSec)) : (offsetSec + elapsed);
                const totalFrames = Math.floor(currentSec * 50.0);
                const curSlot = Math.floor(totalFrames / framesPerSlot);
                const curStep = Math.floor((totalFrames % framesPerSlot) / self.speed) % 64;

                if (self.onStepTick) self.onStepTick(curStep, curSlot, totalFrames);
                self.animId = requestAnimationFrame(runSync);
            }

            this.animId = requestAnimationFrame(runSync);
        }

        stopPlayback() {
            this.isPlaying = false;
            if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
            [1, 2, 3].forEach(v => {
                if (this.voiceSources[v]) {
                    try { this.voiceSources[v].stop(); } catch (e) {}
                    this.voiceSources[v].disconnect();
                    this.voiceSources[v] = null;
                }
            });
        }

        // Audition Single Voice Step Slice
        auditionStepSlice(trackIdx, stepIdx, durFrames = 6) {
            this.init();
            this.resume();
            const buf = this.voiceBuffers[trackIdx];
            if (!buf) return;

            const durSec = Math.max(0.12, durFrames * 0.02);
            const startSec = stepIdx * this.speed * 0.02;

            try {
                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;
                const g = this.audioCtx.createGain();
                g.gain.value = 1.0;
                src.connect(g);
                g.connect(this.voiceGains[trackIdx]);
                src.start(0, startSec, durSec);
            } catch (e) {
                console.warn(e);
            }
        }

        // Live Play Note on Keyboard
        playNoteLive(noteStr, trackIdx, instWave = 0x41) {
            this.init();
            this.resume();
            const noteObj = MIDI_NOTE_MAP[noteStr];
            if (!noteObj || noteObj.freqHz <= 0) return;

            const buf = this.voiceBuffers[trackIdx] || this.voiceBuffers[1];
            if (buf) {
                const refMidi = 60; // C-4
                const rate = Math.pow(2.0, (noteObj.midi - refMidi) / 12.0);
                try {
                    const src = this.audioCtx.createBufferSource();
                    src.buffer = buf;
                    src.playbackRate.value = Math.max(0.1, Math.min(8.0, rate));
                    const env = this.audioCtx.createGain();
                    const now = this.audioCtx.currentTime;
                    env.gain.setValueAtTime(0.9, now);
                    env.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    src.connect(env);
                    env.connect(this.voiceGains[trackIdx]);
                    src.start(now, 0, 0.5);
                    return;
                } catch (e) {}
            }

            // Software Oscillator fallback
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const env = this.audioCtx.createGain();
            osc.type = (instWave === 0x21) ? "sawtooth" : ((instWave === 0x11) ? "triangle" : "square");
            osc.frequency.setValueAtTime(noteObj.freqHz, now);
            env.gain.setValueAtTime(0.6, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(env);
            env.connect(this.voiceGains[trackIdx]);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    }

    // ------------------------------------------------------------------------
    // 4. MAIN WORKSPACE CONTROLLER
    // ------------------------------------------------------------------------
    const model = new MotifProjectModel();
    const audio = new MultiStemAudioEngine();

    // 4.1 UI Renderers
    function renderArrangerTimeline() {
        [1, 2, 3].forEach(track => {
            const laneEl = document.getElementById(`lane-blocks-${track}`);
            if (!laneEl) return;
            laneEl.innerHTML = "";

            const laneMotifs = model.timelineLanes[track];
            laneMotifs.forEach((motifId, slotIdx) => {
                const motif = model.motifs[motifId] || { name: "Motif", steps: [] };
                const density = model.getMotifDensity(motifId);
                const isSelected = (motifId === model.activeMotifId);

                const block = document.createElement("div");
                block.className = `motif-block ${isSelected ? "active" : ""}`;
                block.id = `mb-t${track}-s${slotIdx}`;
                block.title = `Slot #${slotIdx} • [${motifId}] ${motif.name} • Klicken zum Editieren`;

                block.innerHTML = `
                    <div class="mb-head">
                        <span class="mb-id">${motifId}</span>
                        <span class="mb-bars">4 Takte</span>
                    </div>
                    <div class="mb-name">${motif.name}</div>
                    <div class="mb-sparkline">
                        <div class="mb-spark-fill" style="width: ${Math.max(5, density)}%"></div>
                    </div>
                `;

                block.addEventListener("click", () => {
                    model.activeMotifId = motifId;
                    model.activeSlotIdx = slotIdx;
                    renderArrangerTimeline();
                    renderMotifPool();
                    renderMotifEditor();
                });

                laneEl.appendChild(block);
            });
        });

        const totalSlots = model.timelineLanes[1].length;
        const durSec = totalSlots * 64 * model.speed * 0.02;
        const min = Math.floor(durSec / 60);
        const sec = String(Math.floor(durSec % 60)).padStart(2, '0');
        const badge = document.getElementById("arranger-stats-badge");
        if (badge) {
            badge.textContent = `${totalSlots} ABSCHNITTE • ${totalSlots * 4} TAKTE • ${min}:${sec} MIN • ${Object.keys(model.motifs).length} MOTIFS`;
        }
    }

    function renderMotifPool() {
        [1, 2, 3].forEach(track => {
            const container = document.getElementById(`pool-list-track-${track}`);
            if (!container) return;
            container.innerHTML = "";

            const trackMotifs = Object.values(model.motifs).filter(m => m.track === track);
            trackMotifs.forEach(motif => {
                const isSelected = (motif.id === model.activeMotifId);
                const item = document.createElement("div");
                item.className = `pool-item ${isSelected ? "active" : ""}`;
                item.innerHTML = `
                    <div class="pi-left">
                        <span class="pi-id">${motif.id}</span>
                        <span class="pi-name">${motif.name}</span>
                    </div>
                    <span class="pi-notes">${motif.steps.filter(s => s.note !== '...' && s.note !== '===').length} ♫</span>
                `;

                item.addEventListener("click", () => {
                    model.activeMotifId = motif.id;
                    renderArrangerTimeline();
                    renderMotifPool();
                    renderMotifEditor();
                });

                container.appendChild(item);
            });
        });
    }

    function renderMotifEditor() {
        const motif = model.motifs[model.activeMotifId];
        if (!motif) return;

        document.getElementById("active-motif-badge").textContent = motif.id;
        document.getElementById("active-motif-title").textContent = `${motif.name.toUpperCase()} (SPUR ${motif.track})`;

        const table = document.getElementById("motif-grid-table");
        if (!table) return;
        table.innerHTML = "";

        motif.steps.forEach((step, sIdx) => {
            const isBeat4 = sIdx % 4 === 0;
            const isBeat16 = sIdx % 16 === 0;
            const row = document.createElement("div");
            row.className = `t4-grid-row ${sIdx % 2 === 0 ? "even" : "odd"} ${isBeat16 ? "beat-16" : (isBeat4 ? "beat-4" : "")} ${sIdx === model.activeStep ? "cursor" : ""}`;
            row.id = `t4-row-${sIdx}`;

            const isNoteEmpty = step.note === "..." || !step.note;
            const isWaveEmpty = step.wave === "---" || !step.wave;
            const isFxEmpty = step.fx === "..." || !step.fx;

            row.innerHTML = `
                <div class="t4-step-idx">${String(sIdx).padStart(2, '0')}</div>
                <div class="t4-note-val ${isNoteEmpty ? 'empty' : ''}">${step.note}</div>
                <div class="t4-dur-val ${isNoteEmpty ? 'empty' : ''}">${step.dur}</div>
                <div class="t4-inst-val ${isNoteEmpty ? 'empty' : ''}">${step.inst}</div>
                <div class="t4-wave-val ${isWaveEmpty ? 'empty' : ''}">${step.wave}</div>
                <div class="t4-fx-val ${isFxEmpty ? 'empty' : ''}">${step.fx}</div>
            `;

            row.addEventListener("click", () => {
                model.activeStep = sIdx;
                document.querySelectorAll(".t4-grid-row").forEach(r => r.classList.remove("cursor"));
                row.classList.add("cursor");

                let durFrames = 6;
                if (step.dur && step.dur.startsWith("L")) durFrames = parseInt(step.dur.slice(1)) || 6;
                audio.auditionStepSlice(motif.track, sIdx, durFrames);
            });

            table.appendChild(row);
        });

        updateInstrumentStudioUI();
    }

    function updateInstrumentStudioUI() {
        const inst = model.activeInstrument;
        document.getElementById("lbl-active-inst-id").textContent = `INST #${String(inst.id).padStart(2, '0')}`;
        document.getElementById("inp-pw").value = inst.pw;
        document.getElementById("lbl-pw-val").textContent = `${inst.pw} (${Math.round((inst.pw / 4095) * 100)}%)`;
        document.getElementById("pw-fill").style.width = `${(inst.pw / 4095) * 100}%`;

        document.getElementById("inp-att").value = inst.attack;
        document.getElementById("lbl-att").textContent = inst.attack;
        document.getElementById("inp-dec").value = inst.decay;
        document.getElementById("lbl-dec").textContent = inst.decay;
        document.getElementById("inp-sus").value = inst.sustain;
        document.getElementById("lbl-sus").textContent = inst.sustain;
        document.getElementById("inp-rel").value = inst.release;
        document.getElementById("lbl-rel").textContent = inst.release;

        document.getElementById("lbl-adsr-readout").textContent = `A:${inst.attack} D:${inst.decay} S:${inst.sustain} R:${inst.release}`;

        document.querySelectorAll(".wave-matrix .btn-wave").forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.dataset.wave) === inst.wave);
        });

        document.getElementById("sel-macro").value = inst.macro || "none";
        document.getElementById("chk-flt-route").checked = Boolean(inst.filter);

        drawADSR(inst.attack, inst.decay, inst.sustain, inst.release);
    }

    function drawADSR(a, d, s, r) {
        const canvas = document.getElementById("adsr-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, w, h);

        const aW = Math.max(8, (a / 15.0) * (w * 0.25));
        const dW = Math.max(8, (d / 15.0) * (w * 0.25));
        const sH = h - ((s / 15.0) * (h - 8)) - 4;
        const sW = w * 0.25;
        const rW = Math.max(8, (r / 15.0) * (w * 0.25));

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, h - 2);
        ctx.lineTo(aW, 4);
        ctx.lineTo(aW + dW, sH);
        ctx.lineTo(aW + dW + sW, sH);
        ctx.lineTo(aW + dW + sW + rW, h - 2);
        ctx.stroke();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
        ctx.fillStyle = grad;
        ctx.lineTo(0, h - 2);
        ctx.fill();
    }

    function renderVirtualPiano() {
        const container = document.getElementById("t4-piano-keys");
        if (!container) return;
        container.innerHTML = "";

        const notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
        const octs = [model.activeOctave, model.activeOctave + 1];

        octs.forEach(oct => {
            notes.forEach(note => {
                const fullName = `${note}${oct}`;
                const isSharp = note.includes("#");
                const key = document.createElement("div");
                key.className = `p-key ${isSharp ? "black" : "white"}`;
                key.dataset.note = fullName;
                key.innerHTML = `<span class="key-txt">${fullName}</span>`;

                key.addEventListener("mousedown", () => {
                    insertNote(fullName);
                    key.classList.add("pressed");
                });
                key.addEventListener("mouseup", () => key.classList.remove("pressed"));
                key.addEventListener("mouseleave", () => key.classList.remove("pressed"));

                container.appendChild(key);
            });
        });

        document.getElementById("lbl-kb-oct").textContent = `OKT: ${model.activeOctave}`;
    }

    function insertNote(noteStr) {
        model.saveUndo();
        const motif = model.motifs[model.activeMotifId];
        if (!motif || !motif.steps[model.activeStep]) return;

        const inst = model.activeInstrument;
        if (noteStr === "...") {
            motif.steps[model.activeStep] = { step: model.activeStep, note: "...", dur: "L06", inst: "00", wave: "---", fx: "..." };
        } else if (noteStr === "===") {
            motif.steps[model.activeStep] = { step: model.activeStep, note: "===", dur: "L06", inst: "01", wave: "---", fx: "OFF" };
        } else {
            motif.steps[model.activeStep] = {
                step: model.activeStep,
                note: noteStr,
                dur: "L06",
                inst: String(inst.id).padStart(2, '0'),
                wave: `$${inst.wave.toString(16).toUpperCase()}`,
                fx: inst.macro
            };
            audio.playNoteLive(noteStr, motif.track, inst.wave);
        }

        renderMotifEditor();
        renderArrangerTimeline();

        model.activeStep = Math.min(63, model.activeStep + 1);
        const nextRow = document.getElementById(`t4-row-${model.activeStep}`);
        if (nextRow) {
            document.querySelectorAll(".t4-grid-row").forEach(r => r.classList.remove("cursor"));
            nextRow.classList.add("cursor");
        }
    }

    // ------------------------------------------------------------------------
    // 5. EVENT LISTENERS & INITIALIZATION
    // ------------------------------------------------------------------------
    async function loadProject(sidPath) {
        audio.stopPlayback();
        document.getElementById("t4-sub-info").textContent = "DEKOMPILIERE 50Hz SID & ZERLEGE IN MOTIFS...";

        await model.decompileSID(sidPath);
        document.getElementById("t4-sub-info").textContent = `${model.title.toUpperCase()} • ${model.author} (1985) • 3-Spur Pattern-Dekomposition`;
        document.getElementById("inp-bpm").value = model.bpm;
        document.getElementById("inp-speed").value = model.speed;

        audio.bpm = model.bpm;
        audio.speed = model.speed;

        renderArrangerTimeline();
        renderMotifPool();
        renderMotifEditor();
        renderVirtualPiano();

        // Render authentic audio stems
        try {
            const res = await fetch(`/api/render?sid=${encodeURIComponent(sidPath)}&v1=1&v2=1&v3=1&start=0&end=2400`);
            if (res.ok) {
                const ab = await res.arrayBuffer();
                audio.init();
                const buf = await audio.audioCtx.decodeAudioData(ab);
                audio.setVoiceBuffers(buf, buf, buf);
            }
        } catch (e) {
            console.error("Audio stem error:", e);
        }
    }

    function startScope() {
        const canvas = document.getElementById("scope-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;

        function draw() {
            requestAnimationFrame(draw);
            if (!audio.analyser) {
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, w, h);
                return;
            }

            audio.analyser.getByteTimeDomainData(audio.analyserData);
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, w, h);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#38bdf8";
            ctx.beginPath();
            const slice = (w * 1.0) / audio.analyserData.length;
            let x = 0;
            for (let i = 0; i < audio.analyserData.length; i++) {
                const v = audio.analyserData[i] / 128.0;
                const y = (v * h) / 2.0;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += slice;
            }
            ctx.lineTo(w, h / 2.0);
            ctx.stroke();
        }
        draw();
    }

    document.addEventListener("DOMContentLoaded", () => {
        startScope();
        loadProject("sid/Commando.sid");

        // SID Selector
        document.getElementById("t4-sid-select").addEventListener("change", (e) => loadProject(e.target.value));

        // Transport
        document.getElementById("btn-play-song").addEventListener("click", () => audio.startPlayback(false));
        document.getElementById("btn-play-motif").addEventListener("click", () => audio.startPlayback(true, model.activeSlotIdx));
        document.getElementById("btn-stop").addEventListener("click", () => audio.stopPlayback());

        audio.onStepTick = (step, slot, frames) => {
            document.querySelectorAll(".t4-grid-row").forEach(r => r.classList.remove("playhead"));
            const r = document.getElementById(`t4-row-${step}`);
            if (r) r.classList.add("playhead");

            document.getElementById("t-stat-step").textContent = `STEP: ${String(step).padStart(2, '0')} / 63`;
            document.getElementById("t-stat-frames").textContent = `FRAME: ${String(frames).padStart(4, '0')}`;

            // Highlight playing motif blocks in timeline
            [1, 2, 3].forEach(t => {
                document.querySelectorAll(`.lane-${t} .motif-block`).forEach((mb, idx) => {
                    mb.classList.toggle("playing", idx === slot);
                });
            });
        };

        // Solo / Mute
        [1, 2, 3].forEach(v => {
            const btnM = document.getElementById(`btn-mute-${v}`);
            const btnS = document.getElementById(`btn-solo-${v}`);
            btnM.addEventListener("click", () => {
                audio.setMute(v, !audio.voiceMute[v]);
                btnM.classList.toggle("active", audio.voiceMute[v]);
            });
            btnS.addEventListener("click", () => {
                audio.setSolo(v, !audio.voiceSolo[v]);
                btnS.classList.toggle("active", audio.voiceSolo[v]);
            });
        });

        // Parameters
        document.getElementById("inp-bpm").addEventListener("input", (e) => audio.setBpm(parseInt(e.target.value) || 125));
        document.getElementById("inp-speed").addEventListener("input", (e) => audio.setSpeed(parseInt(e.target.value) || 6));
        document.getElementById("sel-clock").addEventListener("change", (e) => audio.setClock(e.target.value));

        // Arranger Timeline Actions
        document.getElementById("btn-add-timeline-col").addEventListener("click", () => {
            model.saveUndo();
            [1, 2, 3].forEach(t => {
                const cur = model.timelineLanes[t];
                cur.push(cur[cur.length - 1] || "M01");
            });
            renderArrangerTimeline();
        });

        document.getElementById("btn-dup-timeline-col").addEventListener("click", () => {
            model.saveUndo();
            [1, 2, 3].forEach(t => {
                const cur = model.timelineLanes[t];
                cur.splice(model.activeSlotIdx + 1, 0, cur[model.activeSlotIdx]);
            });
            renderArrangerTimeline();
        });

        document.getElementById("btn-del-timeline-col").addEventListener("click", () => {
            if (model.timelineLanes[1].length > 1) {
                model.saveUndo();
                [1, 2, 3].forEach(t => model.timelineLanes[t].splice(model.activeSlotIdx, 1));
                model.activeSlotIdx = Math.max(0, model.activeSlotIdx - 1);
                renderArrangerTimeline();
            }
        });

        document.getElementById("btn-shift-left").addEventListener("click", () => {
            if (model.activeSlotIdx > 0) {
                model.saveUndo();
                [1, 2, 3].forEach(t => {
                    const c = model.timelineLanes[t][model.activeSlotIdx];
                    model.timelineLanes[t][model.activeSlotIdx] = model.timelineLanes[t][model.activeSlotIdx - 1];
                    model.timelineLanes[t][model.activeSlotIdx - 1] = c;
                });
                model.activeSlotIdx--;
                renderArrangerTimeline();
            }
        });

        document.getElementById("btn-shift-right").addEventListener("click", () => {
            if (model.activeSlotIdx < model.timelineLanes[1].length - 1) {
                model.saveUndo();
                [1, 2, 3].forEach(t => {
                    const c = model.timelineLanes[t][model.activeSlotIdx];
                    model.timelineLanes[t][model.activeSlotIdx] = model.timelineLanes[t][model.activeSlotIdx + 1];
                    model.timelineLanes[t][model.activeSlotIdx + 1] = c;
                });
                model.activeSlotIdx++;
                renderArrangerTimeline();
            }
        });

        document.getElementById("btn-create-new-motif").addEventListener("click", () => {
            const curMotif = model.motifs[model.activeMotifId];
            const track = curMotif ? curMotif.track : 1;
            model.createNewMotif(track);
            renderArrangerTimeline();
            renderMotifPool();
            renderMotifEditor();
        });

        // Transformations
        document.getElementById("btn-undo").addEventListener("click", () => { if (model.undo()) { renderArrangerTimeline(); renderMotifPool(); renderMotifEditor(); } });
        document.getElementById("btn-redo").addEventListener("click", () => { if (model.redo()) { renderArrangerTimeline(); renderMotifPool(); renderMotifEditor(); } });

        document.getElementById("btn-trans-up").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 60;
                    const n = FREQ_NOTE_MAP[Math.min(108, midi + 1)];
                    if (n) s.note = n.name;
                }
            });
            renderMotifEditor();
        });

        document.getElementById("btn-trans-dn").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 60;
                    const n = FREQ_NOTE_MAP[Math.max(12, midi - 1)];
                    if (n) s.note = n.name;
                }
            });
            renderMotifEditor();
        });

        document.getElementById("btn-oct-up-btn").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 60;
                    const n = FREQ_NOTE_MAP[Math.min(108, midi + 12)];
                    if (n) s.note = n.name;
                }
            });
            renderMotifEditor();
        });

        document.getElementById("btn-oct-dn-btn").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 60;
                    const n = FREQ_NOTE_MAP[Math.max(12, midi - 12)];
                    if (n) s.note = n.name;
                }
            });
            renderMotifEditor();
        });

        document.getElementById("btn-reverse").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.reverse();
            motif.steps.forEach((s, idx) => s.step = idx);
            renderMotifEditor();
        });

        document.getElementById("btn-insert-noteoff").addEventListener("click", () => insertNote("==="));

        // Instrument Studio Controls
        document.getElementById("sel-inst-preset").addEventListener("change", (e) => {
            const p = SIGNATURE_PRESETS[e.target.value];
            if (p) {
                Object.assign(model.activeInstrument, p);
                updateInstrumentStudioUI();
            }
        });

        document.querySelectorAll(".wave-matrix .btn-wave").forEach(btn => {
            btn.addEventListener("click", () => {
                model.activeInstrument.wave = parseInt(btn.dataset.wave);
                updateInstrumentStudioUI();
            });
        });

        document.getElementById("inp-pw").addEventListener("input", (e) => {
            model.activeInstrument.pw = parseInt(e.target.value);
            document.getElementById("lbl-pw-val").textContent = `${model.activeInstrument.pw} (${Math.round((model.activeInstrument.pw / 4095) * 100)}%)`;
            document.getElementById("pw-fill").style.width = `${(model.activeInstrument.pw / 4095) * 100}%`;
        });

        ["att", "dec", "sus", "rel"].forEach(p => {
            const kMap = { att: "attack", dec: "decay", sus: "sustain", rel: "release" };
            document.getElementById(`inp-${p}`).addEventListener("input", (e) => {
                model.activeInstrument[kMap[p]] = parseInt(e.target.value);
                document.getElementById(`lbl-${p}`).textContent = e.target.value;
                updateInstrumentStudioUI();
            });
        });

        document.getElementById("btn-kb-oct-dn").addEventListener("click", () => {
            model.activeOctave = Math.max(1, model.activeOctave - 1);
            renderVirtualPiano();
        });

        document.getElementById("btn-kb-oct-up").addEventListener("click", () => {
            model.activeOctave = Math.min(7, model.activeOctave + 1);
            renderVirtualPiano();
        });

        // Master Filter & Volume
        document.getElementById("inp-flt-cut").addEventListener("input", (e) => {
            const cut = parseInt(e.target.value) || 1024;
            const res = parseInt(document.getElementById("inp-flt-res").value) || 14;
            const mode = document.getElementById("sel-flt-mode").value;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("inp-flt-res").addEventListener("input", (e) => {
            const res = parseInt(e.target.value) || 14;
            const cut = parseInt(document.getElementById("inp-flt-cut").value) || 1024;
            const mode = document.getElementById("sel-flt-mode").value;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("sel-flt-mode").addEventListener("change", (e) => {
            const mode = e.target.value;
            const cut = parseInt(document.getElementById("inp-flt-cut").value) || 1024;
            const res = parseInt(document.getElementById("inp-flt-res").value) || 14;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("inp-flt-drive").addEventListener("input", (e) => {
            audio.setMasterDrive(parseInt(e.target.value) || 3);
        });

        document.getElementById("inp-master-vol").addEventListener("input", (e) => {
            audio.setMasterVolume(parseInt(e.target.value) || 85);
        });

        // Theme Selector
        document.getElementById("sel-theme").addEventListener("change", (e) => {
            document.body.setAttribute("data-theme", e.target.value);
        });

        // Help Modal
        document.getElementById("btn-help").addEventListener("click", () => {
            document.getElementById("help-modal").style.display = "flex";
        });
        document.getElementById("btn-close-help").addEventListener("click", () => {
            document.getElementById("help-modal").style.display = "none";
        });

        // Global Keyboard Mapping
        window.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

            if (e.code === "F1") {
                e.preventDefault();
                const m = document.getElementById("help-modal");
                m.style.display = m.style.display === "none" ? "flex" : "none";
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                if (audio.isPlaying) audio.stopPlayback();
                else audio.startPlayback(false);
                return;
            }

            if (e.code === "Escape") { audio.stopPlayback(); return; }

            if (e.ctrlKey && e.code === "KeyZ") { e.preventDefault(); if (model.undo()) { renderArrangerTimeline(); renderMotifPool(); renderMotifEditor(); } return; }
            if (e.ctrlKey && e.code === "KeyY") { e.preventDefault(); if (model.redo()) { renderArrangerTimeline(); renderMotifPool(); renderMotifEditor(); } return; }

            if (e.code === "Digit1" || e.code === "CapsLock") { e.preventDefault(); insertNote("==="); return; }
            if (e.code === "Delete" || e.code === "Backspace") { e.preventDefault(); insertNote("..."); return; }

            if (e.code === "ArrowUp") {
                e.preventDefault();
                model.activeStep = Math.max(0, model.activeStep - 1);
                document.querySelectorAll(".t4-grid-row").forEach(r => r.classList.remove("cursor"));
                const r = document.getElementById(`t4-row-${model.activeStep}`);
                if (r) r.classList.add("cursor");
                return;
            }
            if (e.code === "ArrowDown") {
                e.preventDefault();
                model.activeStep = Math.min(63, model.activeStep + 1);
                document.querySelectorAll(".t4-grid-row").forEach(r => r.classList.remove("cursor"));
                const r = document.getElementById(`t4-row-${model.activeStep}`);
                if (r) r.classList.add("cursor");
                return;
            }

            if (KEYBOARD_MAP[e.code]) {
                const baseNote = KEYBOARD_MAP[e.code];
                const noteName = baseNote.slice(0, -1);
                const baseOct = parseInt(baseNote.slice(-1));
                const shiftedOct = Math.min(7, Math.max(1, baseOct + (model.activeOctave - 4)));
                insertNote(`${noteName}${shiftedOct}`);
            }
        });

        // Export handlers
        document.getElementById("btn-export-htf").addEventListener("click", () => {
            const htfData = {
                title: model.title,
                author: model.author,
                bpm: model.bpm,
                speed: model.speed,
                motifs: model.motifs,
                timeline: model.timelineLanes
            };
            const blob = new Blob([JSON.stringify(htfData, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${model.title.replace(/\s+/g, '_')}_motifs.htf`;
            a.click();
        });

        document.getElementById("btn-export-wav").addEventListener("click", () => {
            const sid = document.getElementById("t4-sid-select").value;
            window.location.href = `/api/render?sid=${encodeURIComponent(sid)}&v1=1&v2=1&v3=1&start=0&end=2400`;
        });
    });

})();
