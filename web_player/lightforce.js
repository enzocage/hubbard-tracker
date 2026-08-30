/**
 * ============================================================================
 * LIGHTFORCE (1986) - 4-LAYER DECOMPOSITION & MOTIF TRACKER
 * ============================================================================
 * Focuses exclusively on Rob Hubbard's masterpiece "Lightforce":
 * - Ebene 4: Song-Arrangement & Makro-Timeline (8 Phrasen)
 * - Ebene 3: 3-Spur Wiederkehrende Motif-Entitäten (Lead, Arp m11, Slap-Bass)
 * - Ebene 2: Dekomprimierte Noten- & Tracker-Matrix (Sequenzielles Editieren)
 * - Ebene 1: MOS 6581 Sound-Lab & Synthese (D-Dorisch, PWM LFO, Filter-Sweeps)
 */

(function () {
    'use strict';

    // ------------------------------------------------------------------------
    // 1. CONSTANTS & LIGHTFORCE HARMONIC DATA
    // ------------------------------------------------------------------------
    const PAL_CLOCK = 985248.0;
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

        MIDI_NOTE_MAP[name] = { midi, name, freqHz, palSidVal };
        FREQ_NOTE_MAP.push({ name, freqHz, palSidVal });
    }

    const KEYBOARD_MAP = {
        KeyZ: "C-3", KeyS: "C#3", KeyX: "D-3", KeyD: "D#3", KeyC: "E-3", KeyV: "F-3",
        KeyG: "F#3", KeyB: "G-3", KeyH: "G#3", KeyN: "A-3", KeyJ: "A#3", KeyM: "B-3",
        KeyQ: "C-4", Digit2: "C#4", KeyW: "D-4", Digit3: "D#4", KeyE: "E-4", KeyR: "F-4",
        Digit5: "F#4", KeyT: "G-4", Digit6: "G#4", KeyY: "A-4", Digit7: "A#4", KeyU: "B-4",
        KeyI: "C-5", Digit9: "C#5", KeyO: "D-5", Digit0: "D#5", KeyP: "E-5"
    };

    const LIGHTFORCE_SCALES = {
        dorian: [2, 4, 5, 7, 9, 11, 0],   // D-Dorian (D, E, F, G, A, B, C)
        aeolian: [2, 4, 5, 7, 9, 10, 0],  // D-Aeolian (D, E, F, G, A, Bb, C)
        major: [5, 7, 9, 10, 0, 2, 4],    // F-Major (F, G, A, Bb, C, D, E)
        blues: [2, 5, 7, 8, 9, 0]         // D-Blues (D, F, G, Ab, A, C)
    };

    const LIGHTFORCE_PRESETS = {
        "01_dorian_lead": { id: 1, name: "Heroic Dorian Lead", wave: 0x41, attack: 0, decay: 8, sustain: 6, release: 2, pw: 2048, macro: "P02", filter: true },
        "02_dual_lead_saw": { id: 2, name: "Dual-Lead 3rd Harmony Saw", wave: 0x21, attack: 0, decay: 7, sustain: 4, release: 1, pw: 0, macro: "V08", filter: false },
        "03_m11_arpeggio": { id: 3, name: "Signature m11 Arpeggio", wave: 0x41, attack: 0, decay: 3, sustain: 0, release: 0, pw: 1800, macro: "A-m11", filter: true },
        "04_slap_bass": { id: 4, name: "Driving 16th Slap Bass", wave: 0x41, attack: 0, decay: 5, sustain: 0, release: 0, pw: 600, macro: "S12", filter: false },
        "05_snare_kick": { id: 5, name: "Galois Noise Snare & Kick", wave: 0x81, attack: 0, decay: 6, sustain: 0, release: 0, pw: 0, macro: "D-SD", filter: false },
        "06_space_pad": { id: 6, name: "Ambient Bandpass Space Pad", wave: 0x41, attack: 4, decay: 9, sustain: 8, release: 6, pw: 2600, macro: "none", filter: true }
    };

    const SECTION_TITLES = [
        "00: INTRO - SPACE PULSE",
        "01: INTRO - HARMONIC CHORD SWELL",
        "02: INTRO - 50Hz m11 INCEPTION",
        "03: GROOVE - SLAP BASS & BEAT ENTRANCE",
        "04: THEME A - HEROIC DORIAN HOOK",
        "05: THEME A - OCTAVE ELEVATION",
        "06: THEME A - 3RD HARMONY RESPONSE",
        "07: THEME A - CADENCE RESOLUTION",
        "08: BRIDGE 1 - DUAL-LEAD 3RDS & 6THS",
        "09: BRIDGE 1 - MODAL TRANSITION (F-MAJ)",
        "10: BRIDGE 1 - SYNCOPATED SLAP RUN",
        "11: BRIDGE 1 - TURNAROUND",
        "12: SOLO CLIMAX - 32ND VIRTUOSO RUNS",
        "13: SOLO CLIMAX - ARPEGGIO CASCADES",
        "14: SOLO CLIMAX - HIGH OCTAVE PEAK",
        "15: SOLO CLIMAX - CADENCE DESCENT",
        "16: THEME B - PROGRESSIVE DRIVE",
        "17: THEME B - m11 ARPEGGIO EXPANSION",
        "18: THEME B - COUNTER-MELODY RIFF",
        "19: THEME B - DYNAMIC SWELL",
        "20: BREAKDOWN - SLAP-BASS SOLO",
        "21: BREAKDOWN - 12dB FILTER SWEEP",
        "22: BREAKDOWN - SNARE INTERRUPT FILL",
        "23: BREAKDOWN - RE-ENTRY BUILD",
        "24: FINALE - FULL 3-VOICE TUTTI",
        "25: FINALE - VIRTUOSO LEAD LAYER",
        "26: FINALE - MASTER CADENCE (DORIAN 6TH)",
        "27: FINALE - HARMONIC PEAK",
        "28: OUTRO - SPACE PULSE RECAP",
        "29: OUTRO - ARPEGGIO ECHO FADE",
        "30: OUTRO - SLAP-BASS VAMP",
        "31: OUTRO - MASTER LOOP POINT"
    ];

    // ------------------------------------------------------------------------
    // 2. 4-LAYER DATA MODEL FOR LIGHTFORCE
    // ------------------------------------------------------------------------
    class LightforceModel {
        constructor() {
            this.title = "Lightforce";
            this.author = "Rob Hubbard";
            this.year = "1986";
            this.publisher = "FTL Games";
            this.bpm = 125;
            this.speed = 6;
            this.clock = "pal";

            // EBENE 4: Song-Arrangement Timeline (All 32 Pattern Slots)
            this.orderList = Array.from({length: 32}, (_, i) => i);
            this.activeSlotIdx = 0;

            // EBENE 3: Reusable Motifs Pool per voice
            this.motifs = {};
            this.timelineLanes = { 1: [], 2: [], 3: [] };

            // EBENE 2: Active Motif & Step Cursor
            this.activeMotifId = "L01";
            this.activeStep = 0;
            this.activeEventIdx = 0;
            this.activeOctave = 4;
            this.editMode = true;
            this.viewMode = "events"; // 'events' (default) or 'grid'

            // EBENE 1: MOS 6581 Sound Sculptor Instrument Patch
            this.activeInstrument = JSON.parse(JSON.stringify(LIGHTFORCE_PRESETS["01_dorian_lead"]));

            this.undoStack = [];
            this.redoStack = [];
        }

        // Decompile Lightforce.sid into 4 Layers (Full 32 Patterns)
        async decompileLightforce() {
            const res = await fetch(`/api/decompile_tracker?sid=sid/Lightforce.sid&patterns=32&rows=64&speed=6`);
            if (!res.ok) throw new Error("Fehler beim Dekompilieren von Lightforce.sid");

            const data = await res.json();
            this.bpm = data.bpm || 125;
            this.speed = data.speed || 6;
            this.orderList = data.order_list && data.order_list.length ? data.order_list : Array.from({length: 32}, (_, i) => i);

            this.motifs = {};
            this.timelineLanes = { 1: [], 2: [], 3: [] };

            const numPatterns = data.patterns.length;

            // Deconstruct repeating phrases into modular Motifs per voice
            for (let t = 1; t <= 3; t++) {
                const prefix = (t === 1) ? "L" : ((t === 2) ? "A" : "B");
                const trackMotifMap = {};

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
                            fx: (t === 2) ? "A-m11" : (t === 1 ? "P02" : "...")
                        };
                    });

                    const sig = steps.map(s => `${s.note}:${s.dur}`).join("|");
                    if (!trackMotifMap[sig]) {
                        const count = Object.keys(this.motifs).filter(k => k.startsWith(prefix)).length + 1;
                        const motifId = `${prefix}${String(count).padStart(2, '0')}`;
                        const motifName = (t === 1) ? `Lead Hook ${count}` : ((t === 2) ? `m11 Arp Pattern ${count}` : `Slap Bass Riff ${count}`);

                        const rawEvents = (data.pattern_events && data.pattern_events[pIdx] && data.pattern_events[pIdx][t]) ? data.pattern_events[pIdx][t] : [];

                        this.motifs[motifId] = {
                            id: motifId,
                            track: t,
                            name: motifName,
                            steps: steps,
                            events: JSON.parse(JSON.stringify(rawEvents)),
                            instId: t
                        };
                        trackMotifMap[sig] = motifId;
                    }

                    this.timelineLanes[t].push(trackMotifMap[sig]);
                }
            }

            this.activeMotifId = Object.keys(this.motifs)[0] || "L01";
            this.activeSlotIdx = 0;
            this.activeStep = 0;
        }

        saveUndo() {
            this.undoStack.push({
                orderList: [...this.orderList],
                motifs: JSON.parse(JSON.stringify(this.motifs)),
                timelineLanes: JSON.parse(JSON.stringify(this.timelineLanes)),
                activeMotifId: this.activeMotifId,
                activeStep: this.activeStep
            });
            if (this.undoStack.length > 50) this.undoStack.shift();
            this.redoStack = [];
        }

        undo() {
            if (this.undoStack.length === 0) return false;
            this.redoStack.push({
                orderList: [...this.orderList],
                motifs: JSON.parse(JSON.stringify(this.motifs)),
                timelineLanes: JSON.parse(JSON.stringify(this.timelineLanes)),
                activeMotifId: this.activeMotifId,
                activeStep: this.activeStep
            });
            const prev = this.undoStack.pop();
            this.orderList = prev.orderList;
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
            this.orderList = next.orderList;
            this.motifs = next.motifs;
            this.timelineLanes = next.timelineLanes;
            this.activeMotifId = next.activeMotifId;
            this.activeStep = next.activeStep;
            return true;
        }

        getMotifDensity(motifId) {
            const m = this.motifs[motifId];
            if (!m) return 0;
            const count = m.steps.filter(s => s.note && s.note !== "..." && s.note !== "===").length;
            return Math.min(100, Math.round((count / 64) * 100));
        }

        createNewMotif(trackIdx = 1) {
            this.saveUndo();
            const prefix = (trackIdx === 1) ? "L" : ((trackIdx === 2) ? "A" : "B");
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
                    fx: (trackIdx === 2) ? "A-m11" : "..."
                });
            }

            this.motifs[motifId] = {
                id: motifId,
                track: trackIdx,
                name: `Neues Lightforce Motiv ${count}`,
                steps: steps,
                instId: trackIdx
            };

            this.activeMotifId = motifId;
            return motifId;
        }

        createVariation(slotIdx) {
            this.saveUndo();
            [1, 2, 3].forEach(t => {
                const curMotifId = this.timelineLanes[t][slotIdx];
                const srcMotif = this.motifs[curMotifId];
                if (srcMotif) {
                    const prefix = (t === 1) ? "L" : ((t === 2) ? "A" : "B");
                    const count = Object.keys(this.motifs).filter(k => k.startsWith(prefix)).length + 1;
                    const newId = `${prefix}${String(count).padStart(2, '0')}`;

                    this.motifs[newId] = {
                        id: newId,
                        track: t,
                        name: `${srcMotif.name} (Var ${count})`,
                        steps: JSON.parse(JSON.stringify(srcMotif.steps)),
                        instId: srcMotif.instId
                    };
                    this.timelineLanes[t][slotIdx] = newId;
                }
            });
        }
    }

    // ------------------------------------------------------------------------
    // 3. MULTI-TRACK WEB AUDIO ENGINE & LIGHTFORCE STEM SYNTHESIS
    // ------------------------------------------------------------------------
    class LightforceAudioEngine {
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
            this.masterFilter.Q.value = 2.0;

            this.masterDrive = this.audioCtx.createWaveShaper();
            this.masterDrive.curve = this.createDistortionCurve(0); // Clean 1:1 by default

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

            [1, 2, 3].forEach(v => {
                const g = this.audioCtx.createGain();
                g.gain.value = 0.75;
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
            if (!amount || amount <= 0) return null;
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

        updateVoiceGains() {
            if (!this.audioCtx) return;
            const anySolo = this.voiceSolo[1] || this.voiceSolo[2] || this.voiceSolo[3];
            const now = this.audioCtx.currentTime;

            [1, 2, 3].forEach(v => {
                let active = true;
                if (anySolo) active = Boolean(this.voiceSolo[v]);
                else if (this.voiceMute[v]) active = false;

                if (this.voiceGains[v]) {
                    const targetGain = active ? (anySolo ? 1.0 : 0.75) : 0.0;
                    this.voiceGains[v].gain.setTargetAtTime(targetGain, now, 0.008);
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
            const safeSlotIdx = Math.max(0, Math.min(slotIdx, model.orderList.length - 1));
            const offsetSec = safeSlotIdx * slotDurSec;

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

        // Audition Single Voice Step Slice (100% Exact Authentic SID Recording from the Song)
        auditionStepSlice(trackIdx, stepIdx, durFrames = 6, isCustomEdit = false, customNote = null) {
            this.init();
            this.resume();

            // If note was manually entered/edited in Edit-Mode:
            if (isCustomEdit && customNote && customNote !== "..." && customNote !== "===") {
                this.playNoteLive(customNote, model.activeInstrument);
                return;
            }

            const buf = this.voiceBuffers[trackIdx];

            // Determine timeline slot index for this motif
            let slotIdx = model.activeSlotIdx;
            const laneSlots = model.timelineLanes[trackIdx] || [];
            if (slotIdx === undefined || slotIdx < 0 || laneSlots[slotIdx] !== model.activeMotifId) {
                const foundIdx = laneSlots.indexOf(model.activeMotifId);
                slotIdx = (foundIdx !== -1) ? foundIdx : 0;
            }

            const stepSec = this.speed * 0.02; // 0.12s per step (6 frames * 20ms)
            const slotOffsetSec = slotIdx * 64 * stepSec;
            const startSec = slotOffsetSec + (stepIdx * stepSec);
            const durSec = Math.max(0.24, durFrames * 0.02);

            if (buf && startSec < buf.duration) {
                try {
                    const src = this.audioCtx.createBufferSource();
                    src.buffer = buf;

                    const env = this.audioCtx.createGain();
                    const now = this.audioCtx.currentTime;
                    // Smooth de-click envelope
                    env.gain.setValueAtTime(0.001, now);
                    env.gain.linearRampToValueAtTime(1.0, now + 0.004);
                    env.gain.setValueAtTime(1.0, now + durSec - 0.02);
                    env.gain.linearRampToValueAtTime(0.001, now + durSec);

                    src.connect(env);
                    // Route to masterGain so audition is always loud, isolated, and crystal-clear
                    env.connect(this.masterGain);
                    src.start(now, Math.max(0, startSec), durSec);
                    return;
                } catch (e) {
                    console.error("Audition slice playback error:", e);
                }
            }

            // Fallback to Live Synthesizer if stems not loaded
            const curStep = model.motifs[model.activeMotifId]?.steps[stepIdx];
            if (curStep && curStep.note && curStep.note !== "..." && curStep.note !== "===") {
                this.playNoteLive(curStep.note, model.activeInstrument);
            }
        }

        // Live Play Note with Active Ebene 1 MOS 6581 Patch
        playNoteLive(noteStr, instPatch) {
            this.init();
            this.resume();

            const noteObj = MIDI_NOTE_MAP[noteStr];
            if (!noteObj || noteObj.freqHz <= 0) return;

            const inst = instPatch || model.activeInstrument;
            const now = this.audioCtx.currentTime;

            // Attack & Decay/Release timing tables (MOS 6581 Hardware spec in seconds)
            const attackTable = [0.002, 0.008, 0.016, 0.024, 0.038, 0.056, 0.068, 0.080, 0.100, 0.250, 0.500, 0.800, 1.0, 3.0, 5.0, 8.0];
            const decayReleaseTable = [0.006, 0.024, 0.048, 0.072, 0.114, 0.168, 0.204, 0.240, 0.300, 0.750, 1.5, 2.4, 3.0, 9.0, 15.0, 24.0];

            const attSec = attackTable[inst.attack] !== undefined ? attackTable[inst.attack] : 0.002;
            const decSec = decayReleaseTable[inst.decay] !== undefined ? decayReleaseTable[inst.decay] : 0.1;
            const susLvl = Math.max(0.001, (inst.sustain / 15.0));
            const relSec = decayReleaseTable[inst.release] !== undefined ? decayReleaseTable[inst.release] : 0.1;
            const holdSec = 0.35; // Note audition hold duration

            const env = this.audioCtx.createGain();
            env.gain.setValueAtTime(0.0001, now);
            env.gain.linearRampToValueAtTime(0.85, now + attSec);
            env.gain.exponentialRampToValueAtTime(Math.max(0.0001, susLvl * 0.85), now + attSec + decSec);
            env.gain.setValueAtTime(Math.max(0.0001, susLvl * 0.85), now + holdSec);
            env.gain.exponentialRampToValueAtTime(0.0001, now + holdSec + relSec);

            // Audio Routing: Filtered or Dry
            const curMotif = model.motifs[model.activeMotifId];
            const track = inst.track || (curMotif ? curMotif.track : 1);
            const voiceGain = this.voiceGains[track] || this.masterGain;

            if (inst.filter) {
                env.connect(this.masterFilter);
            } else {
                env.connect(voiceGain);
            }

            const totalDur = holdSec + relSec + 0.05;

            // 1. Galois Noise Generator ($81 - Snare / Drum)
            if (inst.wave === 0x81) {
                const bufferSize = Math.floor(this.audioCtx.sampleRate * Math.min(1.0, totalDur));
                const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2.0 - 1.0;
                }
                const noise = this.audioCtx.createBufferSource();
                noise.buffer = buffer;

                const noiseFilter = this.audioCtx.createBiquadFilter();
                noiseFilter.type = "highpass";
                noiseFilter.frequency.value = 1200;

                noise.connect(noiseFilter);
                noiseFilter.connect(env);
                noise.start(now);
                noise.stop(now + totalDur);
                return;
            }

            // 2. Continuous Tone Oscillators ($41 Pulse, $21 Saw, $11 Tri, $15 Ringmod, $43 Sync)
            const osc = this.audioCtx.createOscillator();
            const baseFreq = noteObj.freqHz;

            if (inst.wave === 0x41) {
                // Pulse Waveform with Fourier Series for variable Duty Cycle (PW)
                const pwNorm = Math.max(0.05, Math.min(0.95, (inst.pw || 2048) / 4095.0));
                const numHarmonics = 48;
                const real = new Float32Array(numHarmonics);
                const imag = new Float32Array(numHarmonics);
                for (let n = 1; n < numHarmonics; n++) {
                    imag[n] = (2.0 / (n * Math.PI)) * Math.sin(n * Math.PI * pwNorm);
                }
                try {
                    const wave = this.audioCtx.createPeriodicWave(real, imag, { disableNormalization: false });
                    osc.setPeriodicWave(wave);
                } catch (e) {
                    osc.type = "square";
                }
            } else if (inst.wave === 0x21) {
                osc.type = "sawtooth";
            } else if (inst.wave === 0x11) {
                osc.type = "triangle";
            } else if (inst.wave === 0x15) {
                // Ring Modulation: Two harmonically related triangle oscillators
                osc.type = "triangle";
                const ringOsc = this.audioCtx.createOscillator();
                ringOsc.type = "triangle";
                ringOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
                const ringGain = this.audioCtx.createGain();
                ringOsc.connect(ringGain.gain);
                ringOsc.start(now);
                ringOsc.stop(now + totalDur);
            } else if (inst.wave === 0x43) {
                // Hard-Sync Formant Simulation
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(baseFreq * 2.8, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.06);
            } else {
                osc.type = "sawtooth";
            }

            // 3. Sub-Tick Macro Modulators:
            if (inst.macro === "P02") {
                // Heroic Pitch-Scoop: Starts 2 semitones down, glides up in 50ms
                const startFreq = baseFreq * Math.pow(2.0, -2.0 / 12.0);
                osc.frequency.setValueAtTime(startFreq, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.05);
            } else if (inst.macro === "S12") {
                // Slap Bass Octave Pop: +12 semitones on note attack
                osc.frequency.setValueAtTime(baseFreq * 2.0, now);
                osc.frequency.setValueAtTime(baseFreq, now + 0.035);
            } else if (inst.macro === "V08") {
                // Delayed Vibrato: 5.5Hz LFO starting after 150ms
                const vibLfo = this.audioCtx.createOscillator();
                const vibGain = this.audioCtx.createGain();
                vibLfo.frequency.value = 5.5;
                vibGain.gain.setValueAtTime(0, now);
                vibGain.gain.setValueAtTime(0, now + 0.15);
                vibGain.gain.linearRampToValueAtTime(baseFreq * 0.025, now + 0.3);
                vibLfo.connect(vibGain);
                vibGain.connect(osc.frequency);
                vibLfo.start(now);
                vibLfo.stop(now + totalDur);
                osc.frequency.setValueAtTime(baseFreq, now);
            } else if (inst.macro === "A-m11") {
                // Lightforce 6-step m11 Arpeggio loop (+0, +3, +7, +10, +14, +17 semitones)
                const arpOffsets = [0, 3, 7, 10, 14, 17];
                const frameSec = 0.02;
                for (let step = 0; step < 20; step++) {
                    const semi = arpOffsets[step % arpOffsets.length];
                    const f = baseFreq * Math.pow(2.0, semi / 12.0);
                    osc.frequency.setValueAtTime(f, now + step * frameSec);
                }
            } else if (inst.wave !== 0x43) {
                osc.frequency.setValueAtTime(baseFreq, now);
            }

            osc.connect(env);
            osc.start(now);
            osc.stop(now + totalDur);
        }
    }

    // ------------------------------------------------------------------------
    // 4. WORKSPACE CONTROLLER
    // ------------------------------------------------------------------------
    const model = new LightforceModel();
    const audio = new LightforceAudioEngine();

    // 4.1 UI Renderers

    // Render Ebene 4: Arrangement Timeline
    function renderArrangementTimeline() {
        const container = document.getElementById("timeline-slots-container");
        if (!container) return;
        container.innerHTML = "";

        model.orderList.forEach((patIdx, slotIdx) => {
            const sectionName = SECTION_TITLES[slotIdx % SECTION_TITLES.length];
            const isSelected = (slotIdx === model.activeSlotIdx);

            const m1 = model.timelineLanes[1][slotIdx] || "L01";
            const m2 = model.timelineLanes[2][slotIdx] || "A01";
            const m3 = model.timelineLanes[3][slotIdx] || "B01";

            const d1 = model.getMotifDensity(m1);
            const d2 = model.getMotifDensity(m2);
            const d3 = model.getMotifDensity(m3);

            const card = document.createElement("div");
            card.className = `timeline-slot-card ${isSelected ? "active" : ""}`;
            card.id = `tsc-slot-${slotIdx}`;
            card.title = `Slot #${slotIdx} • ${sectionName} • Klicken zum Auswählen`;

            card.innerHTML = `
                <div class="tsc-head">
                    <span class="tsc-idx">#${String(slotIdx).padStart(2, '0')}</span>
                    <span class="tsc-bars">4 Takte</span>
                </div>
                <div class="tsc-name">${sectionName}</div>
                <div class="tsc-sparklines">
                    <div class="tsc-s-row"><div class="tsc-s-fill t1" style="width: ${Math.max(5, d1)}%"></div></div>
                    <div class="tsc-s-row"><div class="tsc-s-fill t2" style="width: ${Math.max(5, d2)}%"></div></div>
                    <div class="tsc-s-row"><div class="tsc-s-fill t3" style="width: ${Math.max(5, d3)}%"></div></div>
                </div>
            `;

            card.addEventListener("click", () => {
                model.activeSlotIdx = slotIdx;
                const curMotif = model.motifs[model.activeMotifId];
                const track = curMotif ? curMotif.track : 1;
                const motifAtSlot = model.timelineLanes[track][slotIdx] || model.timelineLanes[1][slotIdx];
                if (motifAtSlot) {
                    model.activeMotifId = motifAtSlot;
                }
                renderArrangementTimeline();
                renderMotifLanes();
                renderMotifPool();
                renderDecompressedMatrix();

                if (audio.isPlaying) {
                    audio.startPlayback(audio.isMotifLoop, slotIdx);
                }
            });

            container.appendChild(card);
        });

        const totalSlots = model.orderList.length;
        const durSec = totalSlots * 64 * model.speed * 0.02;
        const min = Math.floor(durSec / 60);
        const sec = String(Math.floor(durSec % 60)).padStart(2, '0');
        const badge = document.getElementById("arranger-stats-badge");
        if (badge) {
            badge.textContent = `${totalSlots} PHRASEN • ${totalSlots * 4} TAKTE • ${min}:${sec} MIN • ${Object.keys(model.motifs).length} MOTIFS`;
        }
    }

    // Render Ebene 3: 3-Voice Motif Lanes
    function renderMotifLanes() {
        [1, 2, 3].forEach(track => {
            const laneEl = document.getElementById(`lane-motifs-${track}`);
            if (!laneEl) return;
            laneEl.innerHTML = "";

            const laneMotifIds = model.timelineLanes[track];
            laneMotifIds.forEach((motifId, slotIdx) => {
                const motif = model.motifs[motifId] || { name: "Motif", steps: [] };
                const density = model.getMotifDensity(motifId);
                const isSelected = (motifId === model.activeMotifId);

                const block = document.createElement("div");
                block.className = `motif-block ${isSelected ? "active" : ""}`;
                block.id = `mb-t${track}-s${slotIdx}`;
                block.title = `Slot #${slotIdx} • [${motifId}] ${motif.name} • Klicken zum Editieren in Ebene 2`;

                block.innerHTML = `
                    <div class="mb-head">
                        <span class="mb-id">${motifId}</span>
                        <span class="mb-bars">4 Takte</span>
                    </div>
                    <div class="mb-name">${motif.name}</div>
                    <div class="mb-spark">
                        <div class="mb-spark-f" style="width: ${Math.max(5, density)}%"></div>
                    </div>
                `;

                block.addEventListener("click", () => {
                    model.activeMotifId = motifId;
                    model.activeSlotIdx = slotIdx;
                    renderArrangementTimeline();
                    renderMotifLanes();
                    renderMotifPool();
                    renderDecompressedMatrix();

                    if (audio.isPlaying) {
                        audio.startPlayback(audio.isMotifLoop, slotIdx);
                    }
                });

                laneEl.appendChild(block);
            });
        });
    }

    // Render Motif Library Pool (Sidebar)
    function renderMotifPool() {
        [1, 2, 3].forEach(track => {
            const container = document.getElementById(`pool-list-${track}`);
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
                    renderMotifLanes();
                    renderMotifPool();
                    renderDecompressedMatrix();
                });

                container.appendChild(item);
            });
        });
    }

    // Render Ebene 2: Event-Driven Musical Strike & Pulse Sequence
    function renderEventNotation() {
        const motif = model.motifs[model.activeMotifId];
        if (!motif) return;

        const container = document.getElementById("matrix-events-container");
        if (!container) return;
        container.innerHTML = "";

        // If motif doesn't have events extracted yet, build them dynamically from steps
        if (!motif.events || !motif.events.length) {
            motif.events = buildEventsFromSteps(motif.steps, motif.track);
        }

        motif.events.forEach((ev, evIdx) => {
            const card = document.createElement("div");
            const isRest = (ev.note === "..." || ev.note === "===");
            card.className = `strike-event-card lane-${motif.track} ${evIdx === model.activeEventIdx ? "active" : ""}`;
            card.id = `ev-card-${evIdx}`;
            card.dataset.startFrame = ev.start_frame;
            card.dataset.durFrames = ev.dur_frames;

            const durWidthPercent = Math.min(100, Math.max(8, (ev.dur_frames / 48) * 100));

            card.innerHTML = `
                <div class="sec-head">
                    <div class="sec-left">
                        <span class="sec-badge">#${String(ev.event_idx || evIdx + 1).padStart(2, '0')}</span>
                        <span class="sec-bar">Takt ${ev.bar_pos || '1.1.1'}</span>
                        <span class="sec-time">${(ev.start_sec !== undefined ? ev.start_sec : (ev.start_frame * 0.02)).toFixed(2)}s (Frame ${String(ev.start_frame).padStart(3, '0')})</span>
                    </div>
                    <div class="sec-right">
                        <span class="sec-dur-tag">${ev.dur_label || '1/16'} • ${ev.dur_frames}F (${ev.dur_ms || ev.dur_frames * 20}ms)</span>
                    </div>
                </div>

                <div class="sec-main">
                    <div class="sec-pitch-box ${isRest ? 'rest' : ''}">
                        <span class="sec-pitch">${ev.note}</span>
                    </div>

                    <div class="sec-body">
                        <div class="sec-inst-row">
                            <span class="sec-inst-name">${ev.inst_name || 'Instrument'}</span>
                            <span class="sec-wave-badge">${ev.wave || '$41'}</span>
                        </div>

                        <!-- Visual Note Duration & Sustain Flow Bar -->
                        <div class="sec-dur-bar-track" title="Klingende Dauer des Instruments: ${ev.dur_frames} Frames">
                            <div class="sec-dur-bar-fill" style="width: ${durWidthPercent}%;"></div>
                        </div>

                        <!-- Dynamic Sound Flow during the Note -->
                        <div class="sec-macro-flow">
                            <span class="macro-chip attack" title="Anschlag & Einschwing-Impuls">${ev.attack_fx || '⚡ Anschlag'}</span>
                            <span class="macro-arrow">➔</span>
                            <span class="macro-chip sustain" title="Körper-Modulation & Ausklang">${ev.evolution || '🌊 Sustain'}</span>
                        </div>
                    </div>

                    <!-- Direct WYSIWYG Actions on this Event -->
                    <div class="sec-actions">
                        <button class="btn-sec-play" title="Diesen Anschlag isoliert anhören">▶</button>
                        <div class="sec-btn-col">
                            <button class="sec-btn btn-ev-up" title="Halbton höher (+1)">▲</button>
                            <button class="sec-btn btn-ev-dn" title="Halbton tiefer (-1)">▼</button>
                        </div>
                        <div class="sec-btn-col">
                            <button class="sec-btn btn-ev-len-up" title="Note verlängern (+6 Frames)">⏱+</button>
                            <button class="sec-btn btn-ev-len-dn" title="Note verkürzen (-6 Frames)">⏱-</button>
                        </div>
                    </div>
                </div>
            `;

            // Card Click: Audition & Select
            card.addEventListener("click", (e) => {
                if (e.target.closest("button")) return;
                model.activeEventIdx = evIdx;
                model.activeStep = Math.floor(ev.start_frame / 6);
                document.querySelectorAll(".strike-event-card").forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                audio.auditionStepSlice(motif.track, Math.floor(ev.start_frame / 6), ev.dur_frames, ev._edited, ev.note);
            });

            // Play Button
            const btnPlay = card.querySelector(".btn-sec-play");
            btnPlay.addEventListener("click", (e) => {
                e.stopPropagation();
                model.activeEventIdx = evIdx;
                document.querySelectorAll(".strike-event-card").forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                audio.auditionStepSlice(motif.track, Math.floor(ev.start_frame / 6), ev.dur_frames, ev._edited, ev.note);
            });

            // Transpose Up
            const btnUp = card.querySelector(".btn-ev-up");
            btnUp.addEventListener("click", (e) => {
                e.stopPropagation();
                if (ev.note !== "..." && ev.note !== "===") {
                    model.saveUndo();
                    const midi = MIDI_NOTE_MAP[ev.note] ? MIDI_NOTE_MAP[ev.note].midi : 62;
                    const nextMidi = Math.min(108, midi + 1);
                    const nObj = FREQ_NOTE_MAP[nextMidi];
                    if (nObj) {
                        ev.note = nObj.name;
                        ev._edited = true;
                        const sIdx = Math.floor(ev.start_frame / 6);
                        if (motif.steps[sIdx]) motif.steps[sIdx].note = ev.note;
                        renderEventNotation();
                        renderDecompressedMatrix();
                        audio.playNoteLive(ev.note, model.activeInstrument);
                    }
                }
            });

            // Transpose Down
            const btnDn = card.querySelector(".btn-ev-dn");
            btnDn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (ev.note !== "..." && ev.note !== "===") {
                    model.saveUndo();
                    const midi = MIDI_NOTE_MAP[ev.note] ? MIDI_NOTE_MAP[ev.note].midi : 62;
                    const nextMidi = Math.max(12, midi - 1);
                    const nObj = FREQ_NOTE_MAP[nextMidi];
                    if (nObj) {
                        ev.note = nObj.name;
                        ev._edited = true;
                        const sIdx = Math.floor(ev.start_frame / 6);
                        if (motif.steps[sIdx]) motif.steps[sIdx].note = ev.note;
                        renderEventNotation();
                        renderDecompressedMatrix();
                        audio.playNoteLive(ev.note, model.activeInstrument);
                    }
                }
            });

            // Duration +6 Frames
            const btnLenUp = card.querySelector(".btn-ev-len-up");
            btnLenUp.addEventListener("click", (e) => {
                e.stopPropagation();
                model.saveUndo();
                ev.dur_frames = Math.min(192, ev.dur_frames + 6);
                ev.dur_ms = ev.dur_frames * 20;
                ev.dur_label = ev.dur_frames <= 6 ? "1/16" : (ev.dur_frames <= 12 ? "1/8" : (ev.dur_frames <= 18 ? "1/8 Pkt" : (ev.dur_frames <= 24 ? "1/4" : (ev.dur_frames <= 48 ? "1/2" : "Ganze"))));
                renderEventNotation();
                audio.auditionStepSlice(motif.track, Math.floor(ev.start_frame / 6), ev.dur_frames, ev._edited, ev.note);
            });

            // Duration -6 Frames
            const btnLenDn = card.querySelector(".btn-ev-len-dn");
            btnLenDn.addEventListener("click", (e) => {
                e.stopPropagation();
                model.saveUndo();
                ev.dur_frames = Math.max(2, ev.dur_frames - 6);
                ev.dur_ms = ev.dur_frames * 20;
                ev.dur_label = ev.dur_frames <= 6 ? "1/16" : (ev.dur_frames <= 12 ? "1/8" : (ev.dur_frames <= 18 ? "1/8 Pkt" : (ev.dur_frames <= 24 ? "1/4" : (ev.dur_frames <= 48 ? "1/2" : "Ganze"))));
                renderEventNotation();
                audio.auditionStepSlice(motif.track, Math.floor(ev.start_frame / 6), ev.dur_frames, ev._edited, ev.note);
            });

            container.appendChild(card);
        });
    }

    function buildEventsFromSteps(steps, track) {
        const events = [];
        let curNote = null;
        let startStep = 0;
        let curInst = "01";
        let curWave = "$41";
        let curFx = "...";

        steps.forEach((s, sIdx) => {
            if (s.note && s.note !== "..." && s.note !== "===") {
                if (curNote !== null && curNote !== "...") {
                    const durF = (sIdx - startStep) * 6;
                    const startF = startStep * 6;
                    const bar = 1 + Math.floor(startF / 96);
                    const beat = 1 + Math.floor((startF % 96) / 24);
                    const sixteenth = 1 + Math.floor((startF % 24) / 6);
                    const durLabel = durF <= 6 ? "1/16" : (durF <= 12 ? "1/8" : (durF <= 18 ? "1/8 Pkt" : (durF <= 24 ? "1/4" : (durF <= 48 ? "1/2" : "Ganze"))));
                    events.push({
                        event_idx: events.length + 1,
                        bar_pos: `${bar}.${beat}.${sixteenth}`,
                        start_frame: startF,
                        start_sec: +(startF * 0.02).toFixed(3),
                        dur_frames: durF,
                        dur_ms: durF * 20,
                        dur_label: durLabel,
                        note: curNote,
                        inst_id: curInst,
                        inst_name: track === 1 ? "Heroic Dorian Lead" : (track === 2 ? "Signature m11 Arpeggio" : "Driving 16th Slap Bass"),
                        wave: curWave,
                        attack_fx: track === 1 ? "🚀 Pitch-Scoop (-2 HT)" : (track === 2 ? "⚡ 50Hz Arp Trigger" : "💥 Slap-Pop (+12 HT)"),
                        evolution: track === 1 ? "🌊 Dynamic PWM Modulation" : (track === 2 ? "🔄 6-Step m11 Loop" : "🎸 16tel Slap-Bass Run")
                    });
                }
                curNote = s.note;
                startStep = sIdx;
                curInst = s.inst || "01";
                curWave = s.wave || "$41";
                curFx = s.fx || "...";
            }
        });

        if (curNote !== null && curNote !== "...") {
            const durF = (64 - startStep) * 6;
            const startF = startStep * 6;
            const bar = 1 + Math.floor(startF / 96);
            const beat = 1 + Math.floor((startF % 96) / 24);
            const sixteenth = 1 + Math.floor((startF % 24) / 6);
            const durLabel = durF <= 6 ? "1/16" : (durF <= 12 ? "1/8" : (durF <= 18 ? "1/8 Pkt" : (durF <= 24 ? "1/4" : (durF <= 48 ? "1/2" : "Ganze"))));
            events.push({
                event_idx: events.length + 1,
                bar_pos: `${bar}.${beat}.${sixteenth}`,
                start_frame: startF,
                start_sec: +(startF * 0.02).toFixed(3),
                dur_frames: durF,
                dur_ms: durF * 20,
                dur_label: durLabel,
                note: curNote,
                inst_id: curInst,
                inst_name: track === 1 ? "Heroic Dorian Lead" : (track === 2 ? "Signature m11 Arpeggio" : "Driving 16th Slap Bass"),
                wave: curWave,
                attack_fx: track === 1 ? "🚀 Pitch-Scoop (-2 HT)" : (track === 2 ? "⚡ 50Hz Arp Trigger" : "💥 Slap-Pop (+12 HT)"),
                evolution: track === 1 ? "🌊 Dynamic PWM Modulation" : (track === 2 ? "🔄 6-Step m11 Loop" : "🎸 16tel Slap-Bass Run")
            });
        }

        return events;
    }

    // Render Ebene 2: Main Switcher (Events vs 64-Grid)
    function renderDecompressedMatrix() {
        const motif = model.motifs[model.activeMotifId];
        if (!motif) return;

        // Automatically sync active instrument on Ebene 1 with the selected track's signature preset
        const trackPresetKeyMap = {
            1: "01_dorian_lead",
            2: "03_m11_arpeggio",
            3: "04_slap_bass"
        };
        const presetKey = trackPresetKeyMap[motif.track] || "01_dorian_lead";
        if (model.activeInstrument.track !== motif.track) {
            Object.assign(model.activeInstrument, LIGHTFORCE_PRESETS[presetKey], { track: motif.track });
            const selPreset = document.getElementById("sel-lf-preset");
            if (selPreset) selPreset.value = presetKey;
            updateSynthUI();
        }

        document.getElementById("active-motif-badge").textContent = motif.id;
        document.getElementById("active-motif-name").textContent = `${motif.name.toUpperCase()} (SPUR ${motif.track} • D-DORISCH)`;

        const evContainer = document.getElementById("matrix-events-container");
        const gridTable = document.getElementById("matrix-grid-table");

        if (model.viewMode === "events") {
            if (evContainer) evContainer.style.display = "flex";
            if (gridTable) gridTable.style.display = "none";
            renderEventNotation();
        } else {
            if (evContainer) evContainer.style.display = "none";
            if (gridTable) gridTable.style.display = "flex";
            render64StepGridTable();
        }

        updateSynthUI();
    }

    function render64StepGridTable() {
        const motif = model.motifs[model.activeMotifId];
        if (!motif) return;

        const table = document.getElementById("matrix-grid-table");
        if (!table) return;
        table.innerHTML = "";

        motif.steps.forEach((step, sIdx) => {
            const isBeat4 = sIdx % 4 === 0;
            const isBeat16 = sIdx % 16 === 0;
            const row = document.createElement("div");
            row.className = `matrix-row ${sIdx % 2 === 0 ? "even" : "odd"} ${isBeat16 ? "beat-16" : (isBeat4 ? "beat-4" : "")} ${sIdx === model.activeStep ? "cursor" : ""}`;
            row.id = `m-row-${sIdx}`;

            const isNoteEmpty = step.note === "..." || !step.note;
            const isWaveEmpty = step.wave === "---" || !step.wave;
            const isFxEmpty = step.fx === "..." || !step.fx;

            row.innerHTML = `
                <div class="m-step">${String(sIdx).padStart(2, '0')}</div>
                <div class="m-note ${isNoteEmpty ? 'empty' : ''}">${step.note}</div>
                <div class="m-dur ${isNoteEmpty ? 'empty' : ''}">${step.dur}</div>
                <div class="m-inst ${isNoteEmpty ? 'empty' : ''}">${step.inst}</div>
                <div class="m-wave ${isWaveEmpty ? 'empty' : ''}">${step.wave}</div>
                <div class="m-fx ${isFxEmpty ? 'empty' : ''}">${step.fx}</div>
            `;

            row.addEventListener("click", () => {
                model.activeStep = sIdx;
                document.querySelectorAll(".matrix-row").forEach(r => r.classList.remove("cursor"));
                row.classList.add("cursor");

                let durFrames = 6;
                if (step.dur && step.dur.startsWith("L")) {
                    durFrames = parseInt(step.dur.slice(1)) || 6;
                } else if (step.dur) {
                    durFrames = parseInt(step.dur) || 6;
                }
                durFrames = Math.max(8, durFrames);

                audio.auditionStepSlice(motif.track, sIdx, durFrames, step._edited, step.note);
            });

            table.appendChild(row);
        });
    }

    // Render Ebene 1: MOS 6581 Synth Controls
    function updateSynthUI() {
        const inst = model.activeInstrument;
        document.getElementById("lbl-active-inst").textContent = `INST #${String(inst.id).padStart(2, '0')}`;
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

        document.getElementById("lbl-adsr-txt").textContent = `A:${inst.attack} D:${inst.decay} S:${inst.sustain} R:${inst.release}`;

        document.querySelectorAll(".wave-matrix .btn-w").forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.dataset.wave) === inst.wave);
        });

        document.getElementById("sel-macro").value = inst.macro || "none";
        document.getElementById("chk-filter").checked = Boolean(inst.filter);

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

    function renderPiano() {
        const container = document.getElementById("piano-keys-container");
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
        const motif = model.motifs[model.activeMotifId];
        const inst = model.activeInstrument;

        if (model.editMode) {
            model.saveUndo();
            if (motif && motif.steps[model.activeStep]) {
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
                        fx: inst.macro,
                        _edited: true
                    };
                }

                renderDecompressedMatrix();
                renderArrangementTimeline();
                renderMotifLanes();

                model.activeStep = Math.min(63, model.activeStep + 1);
                const nextRow = document.getElementById(`m-row-${model.activeStep}`);
                if (nextRow) {
                    document.querySelectorAll(".matrix-row").forEach(r => r.classList.remove("cursor"));
                    nextRow.classList.add("cursor");
                }
            }
        }

        // Always synthesize and play the note with the active instrument from Ebene 1!
        if (noteStr !== "..." && noteStr !== "===") {
            audio.playNoteLive(noteStr, inst);
        }
    }

    // ------------------------------------------------------------------------
    // 5. BOOTSTRAP & EVENT BINDINGS
    // ------------------------------------------------------------------------
    async function init() {
        await model.decompileLightforce();
        renderArrangementTimeline();
        renderMotifLanes();
        renderMotifPool();
        renderDecompressedMatrix();
        renderPiano();

        // Load 44.1kHz authentic audio stems for Lightforce (3 isolated voice stems for all 32 patterns = 12,288 frames)
        try {
            audio.init();
            const totalFrames = 32 * 64 * 6; // 12,288 frames = ~4:05 min full length piece
            const [res1, res2, res3] = await Promise.all([
                fetch(`/api/render?sid=sid/Lightforce.sid&v1=1&v2=0&v3=0&start=0&end=${totalFrames}`),
                fetch(`/api/render?sid=sid/Lightforce.sid&v1=0&v2=1&v3=0&start=0&end=${totalFrames}`),
                fetch(`/api/render?sid=sid/Lightforce.sid&v1=0&v2=0&v3=1&start=0&end=${totalFrames}`)
            ]);

            const [ab1, ab2, ab3] = await Promise.all([
                res1.arrayBuffer(),
                res2.arrayBuffer(),
                res3.arrayBuffer()
            ]);

            const [buf1, buf2, buf3] = await Promise.all([
                audio.audioCtx.decodeAudioData(ab1),
                audio.audioCtx.decodeAudioData(ab2),
                audio.audioCtx.decodeAudioData(ab3)
            ]);

            audio.setVoiceBuffers(buf1, buf2, buf3);
        } catch (e) {
            console.error("Lightforce multi-stem load error:", e);
        }

        // Scope Animation
        const canvas = document.getElementById("scope-canvas");
        if (canvas) {
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

        // Real-Time Playhead Sync
        audio.onStepTick = (step, slot, frames) => {
            document.querySelectorAll(".matrix-row").forEach(r => r.classList.remove("playhead"));
            const r = document.getElementById(`m-row-${step}`);
            if (r) r.classList.add("playhead");

            // Real-time Event Card Highlight
            const relFrame = (frames % 384);
            document.querySelectorAll(".strike-event-card").forEach(c => {
                const startF = parseInt(c.dataset.startFrame) || 0;
                const durF = parseInt(c.dataset.durFrames) || 6;
                const isPlayingEvent = (relFrame >= startF && relFrame < startF + durF);
                c.classList.toggle("playing", isPlayingEvent);
            });

            document.getElementById("tele-step").textContent = `STEP: ${String(step).padStart(2, '0')} / 63`;
            document.getElementById("tele-frame").textContent = `FRAME: ${String(frames).padStart(4, '0')}`;

            // Highlight playing slot in Ebene 4 and motif blocks in Ebene 3
            document.querySelectorAll(".timeline-slot-card").forEach((c, idx) => {
                c.classList.toggle("playing", idx === slot);
            });
            [1, 2, 3].forEach(t => {
                document.querySelectorAll(`.lane-${t} .motif-block`).forEach((mb, idx) => {
                    mb.classList.toggle("playing", idx === slot);
                });
            });
        };

        // View Mode Switcher (Events vs Grid)
        const btnViewEv = document.getElementById("btn-view-events");
        const btnViewGrid = document.getElementById("btn-view-grid");
        const evContainer = document.getElementById("matrix-events-container");
        const gridTable = document.getElementById("matrix-grid-table");

        if (btnViewEv && btnViewGrid) {
            btnViewEv.addEventListener("click", () => {
                model.viewMode = "events";
                btnViewEv.classList.add("active");
                btnViewGrid.classList.remove("active");
                if (evContainer) evContainer.style.display = "flex";
                if (gridTable) gridTable.style.display = "none";
                renderDecompressedMatrix();
            });

            btnViewGrid.addEventListener("click", () => {
                model.viewMode = "grid";
                btnViewGrid.classList.add("active");
                btnViewEv.classList.remove("active");
                if (evContainer) evContainer.style.display = "none";
                if (gridTable) gridTable.style.display = "flex";
                renderDecompressedMatrix();
            });
        }

        // Master Transport Listeners
        document.getElementById("btn-play-song").addEventListener("click", () => audio.startPlayback(false, model.activeSlotIdx));
        document.getElementById("btn-play-motif").addEventListener("click", () => audio.startPlayback(true, model.activeSlotIdx));
        document.getElementById("btn-stop").addEventListener("click", () => audio.stopPlayback());

        // Edit / Record Mode Toggle Button
        const btnRec = document.getElementById("btn-rec-mode");
        if (btnRec) {
            btnRec.addEventListener("click", () => {
                model.editMode = !model.editMode;
                btnRec.classList.toggle("active", model.editMode);
            });
        }

        // Solo & Mute Listeners
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

        // Ebene 4 Timeline Actions
        document.getElementById("btn-add-order-slot").addEventListener("click", () => {
            model.saveUndo();
            const nextPat = (model.orderList[model.orderList.length - 1] + 1) % 8;
            model.orderList.push(nextPat);
            [1, 2, 3].forEach(t => {
                const lane = model.timelineLanes[t];
                lane.push(lane[lane.length - 1] || (t === 1 ? "L01" : (t === 2 ? "A01" : "B01")));
            });
            renderArrangementTimeline();
            renderMotifLanes();
        });

        document.getElementById("btn-dup-order-slot").addEventListener("click", () => {
            model.saveUndo();
            const curPat = model.orderList[model.activeSlotIdx];
            model.orderList.splice(model.activeSlotIdx + 1, 0, curPat);
            [1, 2, 3].forEach(t => {
                const lane = model.timelineLanes[t];
                lane.splice(model.activeSlotIdx + 1, 0, lane[model.activeSlotIdx]);
            });
            renderArrangementTimeline();
            renderMotifLanes();
        });

        document.getElementById("btn-var-order-slot").addEventListener("click", () => {
            model.createVariation(model.activeSlotIdx);
            renderArrangementTimeline();
            renderMotifLanes();
            renderMotifPool();
            renderDecompressedMatrix();
        });

        document.getElementById("btn-del-order-slot").addEventListener("click", () => {
            if (model.orderList.length > 1) {
                model.saveUndo();
                model.orderList.splice(model.activeSlotIdx, 1);
                [1, 2, 3].forEach(t => model.timelineLanes[t].splice(model.activeSlotIdx, 1));
                model.activeSlotIdx = Math.max(0, model.activeSlotIdx - 1);
                renderArrangementTimeline();
                renderMotifLanes();
            }
        });

        document.getElementById("btn-move-left").addEventListener("click", () => {
            if (model.activeSlotIdx > 0) {
                model.saveUndo();
                const p = model.orderList[model.activeSlotIdx];
                model.orderList[model.activeSlotIdx] = model.orderList[model.activeSlotIdx - 1];
                model.orderList[model.activeSlotIdx - 1] = p;
                [1, 2, 3].forEach(t => {
                    const m = model.timelineLanes[t][model.activeSlotIdx];
                    model.timelineLanes[t][model.activeSlotIdx] = model.timelineLanes[t][model.activeSlotIdx - 1];
                    model.timelineLanes[t][model.activeSlotIdx - 1] = m;
                });
                model.activeSlotIdx--;
                renderArrangementTimeline();
                renderMotifLanes();
            }
        });

        document.getElementById("btn-move-right").addEventListener("click", () => {
            if (model.activeSlotIdx < model.orderList.length - 1) {
                model.saveUndo();
                const p = model.orderList[model.activeSlotIdx];
                model.orderList[model.activeSlotIdx] = model.orderList[model.activeSlotIdx + 1];
                model.orderList[model.activeSlotIdx + 1] = p;
                [1, 2, 3].forEach(t => {
                    const m = model.timelineLanes[t][model.activeSlotIdx];
                    model.timelineLanes[t][model.activeSlotIdx] = model.timelineLanes[t][model.activeSlotIdx + 1];
                    model.timelineLanes[t][model.activeSlotIdx + 1] = m;
                });
                model.activeSlotIdx++;
                renderArrangementTimeline();
                renderMotifLanes();
            }
        });

        document.getElementById("btn-new-motif").addEventListener("click", () => {
            const curMotif = model.motifs[model.activeMotifId];
            const track = curMotif ? curMotif.track : 1;
            model.createNewMotif(track);
            renderArrangementTimeline();
            renderMotifLanes();
            renderMotifPool();
            renderDecompressedMatrix();
        });

        // Ebene 2 Pitch & Timing Transformations
        document.getElementById("btn-undo").addEventListener("click", () => {
            if (model.undo()) {
                renderArrangementTimeline();
                renderMotifLanes();
                renderMotifPool();
                renderDecompressedMatrix();
            }
        });

        document.getElementById("btn-redo").addEventListener("click", () => {
            if (model.redo()) {
                renderArrangementTimeline();
                renderMotifLanes();
                renderMotifPool();
                renderDecompressedMatrix();
            }
        });

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
            renderDecompressedMatrix();
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
            renderDecompressedMatrix();
        });

        document.getElementById("btn-oct-up").addEventListener("click", () => {
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
            renderDecompressedMatrix();
        });

        document.getElementById("btn-oct-dn").addEventListener("click", () => {
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
            renderDecompressedMatrix();
        });

        document.getElementById("btn-quantize").addEventListener("click", () => {
            const scaleKey = document.getElementById("sel-quantize").value;
            if (scaleKey === "none" || !LIGHTFORCE_SCALES[scaleKey]) return;
            model.saveUndo();
            const scale = LIGHTFORCE_SCALES[scaleKey];
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;

            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 60;
                    const pc = midi % 12;
                    let closest = scale[0];
                    let minDiff = Infinity;
                    scale.forEach(sp => {
                        const diff = Math.abs(pc - sp);
                        if (diff < minDiff) { minDiff = diff; closest = sp; }
                    });
                    const newMidi = midi - pc + closest;
                    const n = FREQ_NOTE_MAP[newMidi];
                    if (n) s.note = n.name;
                }
            });
            renderDecompressedMatrix();
        });

        document.getElementById("btn-reverse").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            motif.steps.reverse();
            motif.steps.forEach((s, idx) => s.step = idx);
            renderDecompressedMatrix();
        });

        document.getElementById("btn-invert").addEventListener("click", () => {
            model.saveUndo();
            const motif = model.motifs[model.activeMotifId];
            if (!motif) return;
            const valid = motif.steps.filter(s => s.note !== "..." && s.note !== "===");
            if (valid.length === 0) return;
            const centerMidi = 62; // D-4 (Lightforce Root)
            motif.steps.forEach(s => {
                if (s.note && s.note !== "..." && s.note !== "===") {
                    const midi = MIDI_NOTE_MAP[s.note] ? MIDI_NOTE_MAP[s.note].midi : 62;
                    const delta = midi - centerMidi;
                    const newMidi = Math.max(12, Math.min(108, centerMidi - delta));
                    const n = FREQ_NOTE_MAP[newMidi];
                    if (n) s.note = n.name;
                }
            });
            renderDecompressedMatrix();
        });

        document.getElementById("btn-insert-noteoff").addEventListener("click", () => insertNote("==="));

        // Lightforce Preset Selector
        document.getElementById("sel-lf-preset").addEventListener("change", (e) => {
            const p = LIGHTFORCE_PRESETS[e.target.value];
            if (p) {
                Object.assign(model.activeInstrument, p);
                updateSynthUI();
                audio.playNoteLive("D-4", model.activeInstrument);
            }
        });

        document.querySelectorAll(".wave-matrix .btn-w").forEach(btn => {
            btn.addEventListener("click", () => {
                model.activeInstrument.wave = parseInt(btn.dataset.wave);
                updateSynthUI();
                audio.playNoteLive("D-4", model.activeInstrument);
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
                updateSynthUI();
            });
        });

        document.getElementById("sel-macro").addEventListener("change", (e) => {
            model.activeInstrument.macro = e.target.value;
            audio.playNoteLive("D-4", model.activeInstrument);
        });

        document.getElementById("chk-filter").addEventListener("change", (e) => {
            model.activeInstrument.filter = e.target.checked;
        });

        document.getElementById("btn-kb-oct-dn").addEventListener("click", () => {
            model.activeOctave = Math.max(1, model.activeOctave - 1);
            renderPiano();
        });

        document.getElementById("btn-kb-oct-up").addEventListener("click", () => {
            model.activeOctave = Math.min(7, model.activeOctave + 1);
            renderPiano();
        });

        // Master Filter & Volume
        document.getElementById("inp-flt-cut").addEventListener("input", (e) => {
            const cut = parseInt(e.target.value) || 1200;
            const res = parseInt(document.getElementById("inp-flt-res").value) || 14;
            const mode = document.getElementById("sel-flt-mode").value;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("inp-flt-res").addEventListener("input", (e) => {
            const res = parseInt(e.target.value) || 14;
            const cut = parseInt(document.getElementById("inp-flt-cut").value) || 1200;
            const mode = document.getElementById("sel-flt-mode").value;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("sel-flt-mode").addEventListener("change", (e) => {
            const mode = e.target.value;
            const cut = parseInt(document.getElementById("inp-flt-cut").value) || 1200;
            const res = parseInt(document.getElementById("inp-flt-res").value) || 14;
            audio.setMasterFilter(mode, cut, res);
        });

        document.getElementById("inp-flt-drive").addEventListener("input", (e) => {
            audio.setMasterDrive(parseInt(e.target.value) || 3);
        });

        document.getElementById("inp-master-vol").addEventListener("input", (e) => {
            audio.setMasterVolume(parseInt(e.target.value) || 85);
        });

        // Themes
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

        // Global PC Keyboard Navigation & Note Playing
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
                else audio.startPlayback(false, model.activeSlotIdx);
                return;
            }

            if (e.code === "Escape") { audio.stopPlayback(); return; }

            if (e.ctrlKey && e.code === "KeyZ") {
                e.preventDefault();
                if (model.undo()) {
                    renderArrangementTimeline();
                    renderMotifLanes();
                    renderMotifPool();
                    renderDecompressedMatrix();
                }
                return;
            }
            if (e.ctrlKey && e.code === "KeyY") {
                e.preventDefault();
                if (model.redo()) {
                    renderArrangementTimeline();
                    renderMotifLanes();
                    renderMotifPool();
                    renderDecompressedMatrix();
                }
                return;
            }

            if (e.code === "Digit1" || e.code === "CapsLock") { e.preventDefault(); insertNote("==="); return; }
            if (e.code === "Delete" || e.code === "Backspace") { e.preventDefault(); insertNote("..."); return; }

            if (e.code === "ArrowUp") {
                e.preventDefault();
                model.activeStep = Math.max(0, model.activeStep - 1);
                document.querySelectorAll(".matrix-row").forEach(r => r.classList.remove("cursor"));
                const r = document.getElementById(`m-row-${model.activeStep}`);
                if (r) r.classList.add("cursor");
                return;
            }
            if (e.code === "ArrowDown") {
                e.preventDefault();
                model.activeStep = Math.min(63, model.activeStep + 1);
                document.querySelectorAll(".matrix-row").forEach(r => r.classList.remove("cursor"));
                const r = document.getElementById(`m-row-${model.activeStep}`);
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

        // Export Handlers
        document.getElementById("btn-export-htf").addEventListener("click", () => {
            const htfData = {
                title: "Lightforce (Remix / Variation)",
                author: "Rob Hubbard",
                bpm: model.bpm,
                speed: model.speed,
                order_list: model.orderList,
                motifs: model.motifs,
                timeline: model.timelineLanes
            };
            const blob = new Blob([JSON.stringify(htfData, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "Lightforce_4Layer_Project.htf";
            a.click();
        });

        document.getElementById("btn-export-wav").addEventListener("click", () => {
            const totalFrames = model.orderList.length * 64 * model.speed;
            window.location.href = `/api/render?sid=sid/Lightforce.sid&v1=1&v2=1&v3=1&start=0&end=${totalFrames}`;
        });
    }

    document.addEventListener("DOMContentLoaded", init);

})();
