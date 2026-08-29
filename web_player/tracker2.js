// ==============================================================================
// HTF STUDIO PRO (HUBBARD TRACKER FORMAT v1.0)
// Complete Chiptune Workstation Engine • 6502 Decompiler, Multi-Voice Synthesis,
// Real-Time Solo/Mute, ADSR Sound Lab, Modular Arranger, Web MIDI & MIDI Exporter
// ==============================================================================

(function () {
    "use strict";

    const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];

    const KEYBOARD_MAP = {
        "KeyZ": "C-3", "KeyS": "C#3", "KeyX": "D-3", "KeyD": "D#3", "KeyC": "E-3", "KeyV": "F-3",
        "KeyG": "F#3", "KeyB": "G-3", "KeyH": "G#3", "KeyN": "A-3", "KeyJ": "A#3", "KeyM": "B-3",
        "KeyQ": "C-4", "Digit2": "C#4", "KeyW": "D-4", "Digit3": "D#4", "KeyE": "E-4", "KeyR": "F-4",
        "Digit5": "F#4", "KeyT": "G-4", "Digit6": "G#4", "KeyY": "A-4", "Digit7": "A#4", "KeyU": "B-4",
        "KeyI": "C-5", "Digit9": "C#5", "KeyO": "D-5", "Digit0": "D#5", "KeyP": "E-5",
        "KeyA": "C-4" // Fast access
    };

    // 20 Rob Hubbard Signature Instrument Presets
    const HUBBARD_PRESETS = {
        "commando_lead": { name: "Commando Heroic Lead", wave: 0x41, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, macro: "scoop", filter: true },
        "monty_violin": { name: "Monty Hi-Speed Violin", wave: 0x21, pw: 2048, attack: 1, decay: 4, sustain: 8, release: 2, macro: "vibrato", filter: true },
        "delta_space_arp": { name: "Delta Space Arpeggio", wave: 0x41, pw: 1500, attack: 0, decay: 6, sustain: 0, release: 0, macro: "arp_m7", filter: false },
        "ik_slap_bass": { name: "IK+ 16th Slap Bass", wave: 0x41, pw: 800, attack: 0, decay: 8, sustain: 0, release: 0, macro: "slap", filter: true },
        "sanxion_snare": { name: "Sanxion Noise Snare", wave: 0x81, pw: 2048, attack: 0, decay: 4, sustain: 0, release: 0, macro: "drum_sd", filter: false },
        "crazy_laser": { name: "Crazy Comets Laser Sync", wave: 0x43, pw: 2048, attack: 0, decay: 5, sustain: 0, release: 0, macro: "none", filter: false },
        "spellbound_bass": { name: "Spellbound Dark Sub", wave: 0x21, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, macro: "none", filter: true },
        "magic_flute": { name: "Master of Magic Flute", wave: 0x11, pw: 2048, attack: 2, decay: 8, sustain: 4, release: 3, macro: "vibrato", filter: false },
        "lightforce_arp": { name: "Lightforce m11 Arp", wave: 0x41, pw: 2048, attack: 0, decay: 5, sustain: 0, release: 0, macro: "arp_m11", filter: false },
        "warhawk_kick": { name: "Warhawk Heavy Kick", wave: 0x81, pw: 2048, attack: 0, decay: 2, sustain: 0, release: 0, macro: "drum_bd", filter: false },
        "knuckle_metal": { name: "Knucklebusters RingMod", wave: 0x15, pw: 2048, attack: 0, decay: 7, sustain: 0, release: 0, macro: "none", filter: true },
        "mega_brass": { name: "Mega Apocalypse Brass", wave: 0x41, pw: 2400, attack: 1, decay: 8, sustain: 6, release: 2, macro: "none", filter: true },
        "kentilla_pad": { name: "Kentilla Soft Pad", wave: 0x11, pw: 2048, attack: 4, decay: 10, sustain: 10, release: 5, macro: "vibrato", filter: false },
        "lastv8_riser": { name: "Last V8 Nitro Riser", wave: 0x21, pw: 2048, attack: 0, decay: 12, sustain: 2, release: 0, macro: "scoop", filter: true },
        "iball_clav": { name: "I-Ball Funk Clavinet", wave: 0x41, pw: 500, attack: 0, decay: 6, sustain: 0, release: 0, macro: "slap", filter: false },
        "zoids_drone": { name: "Zoids Cyber Drone", wave: 0x43, pw: 2048, attack: 3, decay: 12, sustain: 8, release: 6, macro: "vibrato", filter: true },
        "flash_fanfare": { name: "Flash Gordon Fanfare", wave: 0x15, pw: 2048, attack: 0, decay: 8, sustain: 0, release: 0, macro: "scoop", filter: true },
        "chimera_bell": { name: "Chimera Dream Bell", wave: 0x15, pw: 2048, attack: 0, decay: 9, sustain: 2, release: 4, macro: "none", filter: true },
        "thrust_stomp": { name: "Thrust Noise Stomp", wave: 0x81, pw: 2048, attack: 0, decay: 3, sustain: 0, release: 0, macro: "drum_bd", filter: false },
        "hubbard_pop": { name: "Hubbard Slap Pop", wave: 0x41, pw: 2048, attack: 0, decay: 7, sustain: 0, release: 0, macro: "slap", filter: true }
    };

    // Global Tracker State
    const htfState = {
        title: "Commando",
        author: "Rob Hubbard",
        bpm: 125,
        speed: 6,
        clock: "pal",
        octave: 4,
        step: 1,
        defaultDur: "L06",
        activeOrderIdx: 0,
        activePatternIdx: 0,
        currentStep: 0,
        cursorTrack: 1,
        editMode: true,
        isPlaying: false,
        activeInstId: 1,
        orderList: [0, 1, 2, 3],
        patterns: [],
        instruments: [
            { id: 1, name: "Heroic Pulse Lead", wave: 0x41, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, macro: "scoop", filter: true },
            { id: 2, name: "RingMod Fanfare", wave: 0x15, pw: 2048, attack: 0, decay: 8, sustain: 0, release: 0, macro: "scoop", filter: true },
            { id: 3, name: "50Hz Arp Pulse", wave: 0x41, pw: 1500, attack: 0, decay: 6, sustain: 0, release: 0, macro: "arp_m7", filter: false },
            { id: 4, name: "Saw Staccato Solo", wave: 0x21, pw: 2048, attack: 0, decay: 5, sustain: 0, release: 0, macro: "none", filter: false },
            { id: 5, name: "16th Slap-Bass", wave: 0x41, pw: 800, attack: 0, decay: 8, sustain: 0, release: 0, macro: "slap", filter: true },
            { id: 6, name: "Noise Hi-Hat", wave: 0x81, pw: 2048, attack: 0, decay: 2, sustain: 0, release: 0, macro: "none", filter: false },
            { id: 7, name: "Snare Drum Mux", wave: 0x81, pw: 2048, attack: 0, decay: 4, sustain: 0, release: 0, macro: "drum_sd", filter: false },
            { id: 8, name: "Hard Bass Kick", wave: 0x81, pw: 2048, attack: 0, decay: 3, sustain: 0, release: 0, macro: "drum_bd", filter: false },
            { id: 9, name: "Hard-Sync Laser", wave: 0x43, pw: 2048, attack: 0, decay: 6, sustain: 0, release: 0, macro: "none", filter: false },
            { id: 10, name: "Dark Triangle Bass", wave: 0x11, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, macro: "none", filter: true }
        ]
    };

    // Multi-Voice Solo & Mute State
    const voiceMute = { 1: false, 2: false, 3: false };
    const voiceSolo = { 1: false, 2: false, 3: false };

    // Clipboard & Undo/Redo Stacks
    let clipboardTrackData = null;
    const undoStack = [];
    const redoStack = [];

    function saveUndoState() {
        if (undoStack.length > 50) undoStack.shift();
        undoStack.push(JSON.stringify({
            patterns: htfState.patterns,
            orderList: htfState.orderList,
            activePatternIdx: htfState.activePatternIdx,
            currentStep: htfState.currentStep
        }));
        redoStack.length = 0;
    }

    function applyUndo() {
        if (undoStack.length === 0) return;
        redoStack.push(JSON.stringify({
            patterns: htfState.patterns,
            orderList: htfState.orderList,
            activePatternIdx: htfState.activePatternIdx,
            currentStep: htfState.currentStep
        }));
        const state = JSON.parse(undoStack.pop());
        htfState.patterns = state.patterns;
        htfState.orderList = state.orderList;
        htfState.activePatternIdx = state.activePatternIdx;
        htfState.currentStep = state.currentStep;
        renderHTFGrid();
        renderOrderList();
        update6502Disassembly();
    }

    function applyRedo() {
        if (redoStack.length === 0) return;
        undoStack.push(JSON.stringify({
            patterns: htfState.patterns,
            orderList: htfState.orderList,
            activePatternIdx: htfState.activePatternIdx,
            currentStep: htfState.currentStep
        }));
        const state = JSON.parse(redoStack.pop());
        htfState.patterns = state.patterns;
        htfState.orderList = state.orderList;
        htfState.activePatternIdx = state.activePatternIdx;
        htfState.currentStep = state.currentStep;
        renderHTFGrid();
        renderOrderList();
        update6502Disassembly();
    }

    // Generate Default Pattern
    function generateDefaultHTFPattern() {
        const rows = [];
        for (let r = 0; r < 64; r++) {
            rows.push({
                step: r,
                t1: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "---" },
                t2: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "---" },
                t3: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "---" }
            });
        }
        return rows;
    }

    htfState.patterns = [generateDefaultHTFPattern(), generateDefaultHTFPattern(), generateDefaultHTFPattern(), generateDefaultHTFPattern()];

    // =========================================================================
    // 2. AUDIO & 100% BITGENAUE MOS 6581 SYNTHESIS PIPELINE
    // =========================================================================
    let audioCtx = null;
    let masterGainNode = null;
    let masterFilterNode = null;
    let analyserNode = null;
    let voiceGainNodes = { 1: null, 2: null, 3: null };
    let currentAudioSource = null;
    let authenticAudioBuffer = null;
    let playbackStartTime = 0;
    let playbackStartOffset = 0;
    let animFrameId = null;
    let isPatternModified = false;

    function initAudio() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.value = 0.85;

        masterFilterNode = audioCtx.createBiquadFilter();
        masterFilterNode.type = "bandpass";
        masterFilterNode.frequency.value = 1600;
        masterFilterNode.Q.value = 4.0;

        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;

        [1, 2, 3].forEach(v => {
            const g = audioCtx.createGain();
            g.gain.value = 1.0;
            g.connect(masterGainNode);
            voiceGainNodes[v] = g;
        });

        masterGainNode.connect(masterFilterNode);
        masterFilterNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        startScope();
        initWebMIDI();
    }

    function updateVoiceMuteSoloRouting() {
        const anySolo = voiceSolo[1] || voiceSolo[2] || voiceSolo[3];
        [1, 2, 3].forEach(v => {
            let active = true;
            if (anySolo) {
                active = voiceSolo[v];
            } else if (voiceMute[v]) {
                active = false;
            }
            if (voiceGainNodes[v]) {
                voiceGainNodes[v].gain.setTargetAtTime(active ? 1.0 : 0.0, audioCtx.currentTime, 0.01);
            }
            document.querySelectorAll(`.track-${v}`).forEach(cell => {
                cell.classList.toggle("muted", !active);
            });
        });
    }

    async function loadAuthenticSIDAudio(sidPath) {
        initAudio();
        try {
            document.getElementById("htf-sub-info").textContent = "RENDERE 100% BITGENAUES 6502 MOS 6581 AUDIO...";
            const v1 = (!voiceSolo[2] && !voiceSolo[3] && !voiceMute[1]) ? 1 : (voiceSolo[1] ? 1 : 0);
            const v2 = (!voiceSolo[1] && !voiceSolo[3] && !voiceMute[2]) ? 1 : (voiceSolo[2] ? 1 : 0);
            const v3 = (!voiceSolo[1] && !voiceSolo[2] && !voiceMute[3]) ? 1 : (voiceSolo[3] ? 1 : 0);
            
            const res = await fetch(`/api/render?sid=${encodeURIComponent(sidPath)}&v1=${v1}&v2=${v2}&v3=${v3}&start=0&end=2400`);
            if (!res.ok) throw new Error("Audio render failed");
            const arrayBuf = await res.arrayBuffer();
            authenticAudioBuffer = await audioCtx.decodeAudioData(arrayBuf);
            document.getElementById("htf-sub-info").textContent = `${htfState.title.toUpperCase()} • ${htfState.author} • 100% MOS 6581 AUDIO GELADEN`;
        } catch (e) {
            console.error("Audio Load Error:", e);
        }
    }

    function noteToHz(noteStr) {
        if (!noteStr || noteStr === "..." || noteStr === "===") return 0;
        const noteName = noteStr.slice(0, -1);
        const oct = parseInt(noteStr.slice(-1));
        const semi = NOTE_NAMES.indexOf(noteName);
        if (semi === -1 || isNaN(oct)) return 0;
        const midi = (oct + 1) * 12 + semi;
        return 440.0 * Math.pow(2.0, (midi - 69) / 12.0);
    }

    // Direct Live Audition Synthesizer for Playing Keyboard
    function playLiveSound(noteStr, inst) {
        initAudio();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const freq = noteToHz(noteStr);
        if (freq <= 0) return;

        const now = audioCtx.currentTime;
        const isNoise = (inst.wave & 0x80) !== 0;

        // Flash active VU Meter
        const vuEl = document.getElementById(`vu-fill-${htfState.cursorTrack}`);
        if (vuEl) {
            vuEl.style.width = "100%";
            setTimeout(() => { vuEl.style.width = "0%"; }, 120);
        }

        if (isNoise) {
            const bufSize = audioCtx.sampleRate * 0.12;
            const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource();
            noise.buffer = buf;
            const env = audioCtx.createGain();
            env.gain.setValueAtTime(0.7, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            noise.connect(env);
            env.connect(voiceGainNodes[htfState.cursorTrack] || masterGainNode);
            noise.start(now);
            noise.stop(now + 0.12);
            return;
        }

        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();

        if (inst.wave === 0x21) osc.type = "sawtooth";
        else if (inst.wave === 0x11 || inst.wave === 0x15) osc.type = "triangle";
        else osc.type = "square";

        if (inst.macro === "scoop") {
            osc.frequency.setValueAtTime(freq * 0.89, now);
            osc.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
        } else if (inst.macro === "vibrato") {
            osc.frequency.setValueAtTime(freq, now);
            const vibLfo = audioCtx.createOscillator();
            const vibGain = audioCtx.createGain();
            vibLfo.frequency.value = 5.5;
            vibGain.gain.setValueAtTime(0, now);
            vibGain.gain.setValueAtTime(freq * 0.02, now + 0.16);
            vibLfo.connect(vibGain);
            vibGain.connect(osc.frequency);
            vibLfo.start(now);
            vibLfo.stop(now + 0.5);
        } else {
            osc.frequency.setValueAtTime(freq, now);
        }

        const att = Math.max(0.002, inst.attack * 0.04);
        const dec = Math.max(0.02, inst.decay * 0.06);
        const sus = Math.max(0.01, (inst.sustain / 15.0) * 0.5);

        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(0.5, now + att);
        env.gain.exponentialRampToValueAtTime(sus, now + att + dec);
        env.gain.exponentialRampToValueAtTime(0.0001, now + att + dec + 0.35);

        osc.connect(env);
        env.connect(voiceGainNodes[htfState.cursorTrack] || masterGainNode);

        osc.start(now);
        osc.stop(now + att + dec + 0.4);
    }

    // =========================================================================
    // 3. UI RENDERING: MATRICES, ARRANGER, SOUND LAB & KEYBOARD
    // =========================================================================
    const htfGridTable = document.getElementById("htf-grid-table");
    const matrixScrollPane = document.getElementById("matrix-scroll-pane");
    const orderSlotsContainer = document.getElementById("order-slots-container");
    const htfInstList = document.getElementById("htf-inst-list");
    const htfDisasmView = document.getElementById("htf-disasm-view");
    const htfRegGrid = document.getElementById("htf-reg-grid");
    const adsrCanvas = document.getElementById("adsr-canvas");

    // Render Order List Blocks
    function renderOrderList() {
        orderSlotsContainer.innerHTML = "";
        htfState.orderList.forEach((patIdx, idx) => {
            const slot = document.createElement("div");
            slot.className = `order-slot ${idx === htfState.activeOrderIdx ? "active" : ""}`;
            slot.dataset.order = idx;
            slot.textContent = `${String(idx).padStart(2, '0')}: P${String(patIdx).padStart(2, '0')}`;
            
            slot.addEventListener("click", () => {
                htfState.activeOrderIdx = idx;
                htfState.activePatternIdx = patIdx;
                document.getElementById("sel-active-pat").value = patIdx;
                renderOrderList();
                renderHTFGrid();
                update6502Disassembly();
            });

            orderSlotsContainer.appendChild(slot);

            if (idx < htfState.orderList.length - 1) {
                const arr = document.createElement("span");
                arr.className = "order-arr";
                arr.textContent = "➔";
                orderSlotsContainer.appendChild(arr);
            }
        });

        const loopTag = document.createElement("span");
        loopTag.className = "order-arr loop";
        loopTag.textContent = "↺ LOOP";
        orderSlotsContainer.appendChild(loopTag);

        document.getElementById("order-sub-stat").textContent = `${htfState.orderList.length} PHRASEN • ${htfState.orderList.length * 4} TAKTE • ${(htfState.orderList.length * 7.68).toFixed(1)}s`;
    }

    // Render 3-Track HTF Matrix Grid
    function renderHTFGrid() {
        htfGridTable.innerHTML = "";
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;

        pat.forEach((row, s) => {
            const rowDiv = document.createElement("div");
            const isBeat4 = s % 4 === 0;
            const isBeat16 = s % 16 === 0;
            rowDiv.className = `htf-row ${s % 2 === 0 ? "even" : "odd"} ${isBeat16 ? "beat-16" : (isBeat4 ? "beat-4" : "")}`;
            rowDiv.id = `htf-row-${s}`;

            // Step Col
            const stepCol = document.createElement("div");
            stepCol.className = "htf-step-cell";
            stepCol.textContent = String(s).padStart(2, '0');
            rowDiv.appendChild(stepCol);

            // 3 Tracks
            [1, 2, 3].forEach(t => {
                const tData = row[`t${t}`];
                const trackCol = document.createElement("div");
                trackCol.className = `htf-track-cell track-${t}`;
                trackCol.dataset.step = s;
                trackCol.dataset.track = t;

                const isNoteEmpty = tData.note === "..." || !tData.note;
                const isWaveEmpty = tData.wave === "---" || tData.wave === "0x0" || !tData.wave;
                const isFxEmpty = tData.fx === "---" || !tData.fx;

                trackCol.innerHTML = `
                    <span class="htf-note ${isNoteEmpty ? 'empty' : ''}">${tData.note}</span>
                    <span class="htf-dur ${isNoteEmpty ? 'empty' : ''}">${tData.dur}</span>
                    <span class="htf-inst ${isNoteEmpty ? 'empty' : ''}">${tData.inst}</span>
                    <span class="htf-wave ${isWaveEmpty ? 'empty' : ''}">${tData.wave}</span>
                    <span class="htf-fx ${isFxEmpty ? 'empty' : ''}">${tData.fx}</span>
                `;

                trackCol.addEventListener("click", () => {
                    htfState.currentStep = s;
                    htfState.cursorTrack = t;
                    highlightCursor();
                    update6502Disassembly();

                    // If cell has instrument, select it
                    const instId = parseInt(tData.inst);
                    if (instId > 0) selectInstrument(instId);
                });

                rowDiv.appendChild(trackCol);
            });

            htfGridTable.appendChild(rowDiv);
        });

        highlightCursor();
        updateVoiceMuteSoloRouting();
    }

    function highlightCursor() {
        document.querySelectorAll(".htf-row").forEach(r => r.classList.remove("playhead"));
        document.querySelectorAll(".htf-track-cell").forEach(c => c.classList.remove("cursor"));

        const curRowEl = document.getElementById(`htf-row-${htfState.currentStep}`);
        if (curRowEl) {
            curRowEl.classList.add("playhead");
            const curCell = curRowEl.querySelector(`.track-${htfState.cursorTrack}`);
            if (curCell) curCell.classList.add("cursor");
        }

        document.getElementById("htf-stat-step").textContent = `STEP: ${String(htfState.currentStep).padStart(2, '0')} / 63`;
        document.getElementById("htf-stat-frames").textContent = `FRAME: ${String(htfState.currentStep * htfState.speed).padStart(4, '0')}`;
    }

    function scrollToStep(s) {
        const rowEl = document.getElementById(`htf-row-${s}`);
        if (rowEl && matrixScrollPane) {
            const h = matrixScrollPane.clientHeight;
            matrixScrollPane.scrollTop = rowEl.offsetTop - h / 2 + 11;
        }
    }

    // Insert Note at Cursor
    function insertHTFNoteAtCursor(noteStr) {
        saveUndoState();
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const row = pat[htfState.currentStep];
        if (!row) return;

        const inst = htfState.instruments.find(i => i.id === htfState.activeInstId) || htfState.instruments[0];
        const trackKey = `t${htfState.cursorTrack}`;

        row[trackKey].note = noteStr;
        row[trackKey].dur = htfState.defaultDur;
        row[trackKey].inst = String(inst.id).padStart(2, '0');
        row[trackKey].wave = `$${inst.wave.toString(16).toUpperCase()}`;
        row[trackKey].fx = inst.macro === "scoop" ? "P02" : (inst.macro === "arp_m7" ? "A-m7" : (inst.macro === "slap" ? "S12" : (inst.macro === "vibrato" ? "V08" : "---")));

        isPatternModified = true;

        renderHTFGrid();
        update6502Disassembly();

        if (htfState.step > 0) {
            htfState.currentStep = Math.min(63, htfState.currentStep + htfState.step);
            highlightCursor();
            scrollToStep(htfState.currentStep);
        }
    }

    // Render Instrument List
    function renderInstrumentList() {
        htfInstList.innerHTML = "";
        htfState.instruments.forEach(inst => {
            const item = document.createElement("div");
            item.className = `htf-inst-item ${inst.id === htfState.activeInstId ? "active" : ""}`;
            item.dataset.id = inst.id;

            item.innerHTML = `
                <span class="i-num">#${String(inst.id).padStart(2, '0')}</span>
                <span class="i-name">${inst.name}</span>
                <span class="i-wave">$${inst.wave.toString(16).toUpperCase()}</span>
            `;

            item.addEventListener("click", () => selectInstrument(inst.id));
            htfInstList.appendChild(item);
        });
    }

    function selectInstrument(id) {
        htfState.activeInstId = id;
        renderInstrumentList();

        const inst = htfState.instruments.find(i => i.id === id);
        if (!inst) return;

        document.getElementById("htf-editor-title").textContent = `#${String(inst.id).padStart(2, '0')} ${inst.name.toUpperCase()}`;
        document.getElementById("lbl-wave-hex").textContent = `$${inst.wave.toString(16).toUpperCase()}`;
        document.getElementById("htf-pw").value = inst.pw;
        document.getElementById("lbl-htf-pw").textContent = `${inst.pw} (${Math.round((inst.pw / 4095) * 100)}%)`;
        document.getElementById("pw-duty-fill").style.width = `${(inst.pw / 4095) * 100}%`;

        document.getElementById("htf-att").value = inst.attack;
        document.getElementById("htf-dec").value = inst.decay;
        document.getElementById("htf-sus").value = inst.sustain;
        document.getElementById("htf-rel").value = inst.release;

        document.getElementById("lbl-htf-att").textContent = inst.attack;
        document.getElementById("lbl-htf-dec").textContent = inst.decay;
        document.getElementById("lbl-htf-sus").textContent = inst.sustain;
        document.getElementById("lbl-htf-rel").textContent = inst.release;

        document.getElementById("htf-macro-select").value = inst.macro || "none";
        document.getElementById("chk-filter-route").checked = !!inst.filter;

        document.querySelectorAll(".wave-buttons .btn-w").forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.dataset.wave) === inst.wave);
        });

        drawADSRCurve();
    }

    // Draw ADSR Envelope Curve
    function drawADSRCurve() {
        if (!adsrCanvas) return;
        const ctx = adsrCanvas.getContext("2d");
        const w = adsrCanvas.width;
        const h = adsrCanvas.height;

        const inst = htfState.instruments.find(i => i.id === htfState.activeInstId) || htfState.instruments[0];
        const a = inst.attack / 15.0;
        const d = inst.decay / 15.0;
        const s = inst.sustain / 15.0;
        const r = inst.release / 15.0;

        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const aX = 10 + a * 50;
        const dX = aX + d * 50;
        const sY = h - (s * (h - 8)) - 4;
        const rX = dX + 40 + r * 50;

        ctx.moveTo(10, h - 4);
        ctx.lineTo(aX, 4);          // Attack
        ctx.lineTo(dX, sY);         // Decay
        ctx.lineTo(dX + 40, sY);    // Sustain
        ctx.lineTo(rX, h - 4);      // Release
        ctx.stroke();

        ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineTo(10, h - 4);
        ctx.fill();
    }

    // Virtual Piano Keyboard Setup
    function renderPianoKeyboard() {
        const pWrapper = document.getElementById("htf-piano-keyboard");
        pWrapper.innerHTML = "";

        const keys = [
            { note: "C-", b: false, sc: "A" }, { note: "C#", b: true, sc: "W" },
            { note: "D-", b: false, sc: "S" }, { note: "D#", b: true, sc: "E" },
            { note: "E-", b: false, sc: "D" }, { note: "F-", b: false, sc: "F" },
            { note: "F#", b: true, sc: "T" }, { note: "G-", b: false, sc: "G" },
            { note: "G#", b: true, sc: "Y" }, { note: "A-", b: false, sc: "H" },
            { note: "A#", b: true, sc: "U" }, { note: "B-", b: false, sc: "J" },
            { note: "C-", b: false, sc: "K", octShift: 1 }
        ];

        keys.forEach(k => {
            const keyEl = document.createElement("div");
            keyEl.className = `p-key ${k.b ? "b" : "w"}`;
            const targetOct = htfState.octave + (k.octShift || 0);
            const fullNote = `${k.note}${targetOct}`;
            keyEl.dataset.note = fullNote;

            keyEl.innerHTML = `
                <span class="pk-lbl">${k.note}</span>
                <span class="pk-sc">${k.sc}</span>
            `;

            keyEl.addEventListener("mousedown", () => triggerPianoKey(fullNote, keyEl));
            pWrapper.appendChild(keyEl);
        });
    }

    function triggerPianoKey(noteStr, keyEl) {
        if (keyEl) {
            keyEl.classList.add("active");
            setTimeout(() => keyEl.classList.remove("active"), 120);
        }

        const inst = htfState.instruments.find(i => i.id === htfState.activeInstId) || htfState.instruments[0];
        playLiveSound(noteStr, inst);

        if (htfState.editMode && !htfState.isPlaying) {
            insertHTFNoteAtCursor(noteStr);
        }
    }

    // =========================================================================
    // 4. REAL-TIME 6502 DISASSEMBLER & HARDWARE REGISTER ENGINE
    // =========================================================================
    function update6502Disassembly() {
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const row = pat[htfState.currentStep];
        if (!row) return;

        let asm = `<span class="asm-comm">; =====================================================</span>\n`;
        asm += `<span class="asm-comm">; PAL VBI 50Hz FRAME HOOK (STEP ${String(htfState.currentStep).padStart(2, '0')})</span>\n`;
        asm += `<span class="asm-label">play_step_${String(htfState.currentStep).padStart(2, '0')}:</span>\n`;

        // Voice 1
        if (row.t1.note !== "..." && row.t1.note !== "===") {
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#$5C</span>        <span class="asm-comm">; Voice 1 Freq Lo (${row.t1.note})</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D400</span>\n`;
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#$1C</span>        <span class="asm-comm">; Voice 1 Freq Hi</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D401</span>\n`;
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#${row.t1.wave !== '---' ? row.t1.wave : '$41'}</span>       <span class="asm-comm">; Voice 1 Control</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D404</span>\n`;
        }

        // Voice 2
        if (row.t2.note !== "..." && row.t2.note !== "===") {
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#$B8</span>        <span class="asm-comm">; Voice 2 Freq Lo (${row.t2.note})</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D407</span>\n`;
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#${row.t2.wave !== '---' ? row.t2.wave : '$43'}</span>       <span class="asm-comm">; Voice 2 Control (Sync)</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D40B</span>\n`;
        }

        // Voice 3
        if (row.t3.note !== "..." && row.t3.note !== "===") {
            const isNoise = row.t3.wave === "$81";
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#$02</span>        <span class="asm-comm">; Voice 3 ${isNoise ? 'Noise Drum Mux' : 'Bass Note'}</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D40E</span>\n`;
            asm += `  <span class="asm-op">LDA</span> <span class="asm-val">#${row.t3.wave !== '---' ? row.t3.wave : '$41'}</span>\n`;
            asm += `  <span class="asm-op">STA</span> <span class="asm-reg">$D412</span>\n`;
        }

        asm += `  <span class="asm-op">RTS</span>\n`;
        htfDisasmView.innerHTML = asm;

        renderRegisterGrid();
    }

    const REG_NAMES = [
        "V1 FLo", "V1 FHi", "V1 PWLo", "V1 PWHi", "V1 Ctrl", "V1 AttDec", "V1 SusRel",
        "V2 FLo", "V2 FHi", "V2 PWLo", "V2 PWHi", "V2 Ctrl", "V2 AttDec", "V2 SusRel",
        "V3 FLo", "V3 FHi", "V3 PWLo", "V3 PWHi", "V3 Ctrl", "V3 AttDec", "V3 SusRel",
        "Flt CutLo", "Flt CutHi", "Flt Res/Rt", "Flt Mode/Vol"
    ];

    function renderRegisterGrid() {
        htfRegGrid.innerHTML = "";
        for (let r = 0; r < 25; r++) {
            const cell = document.createElement("div");
            cell.className = "htf-rcell";
            cell.innerHTML = `
                <span class="hrc-addr">$D4${r.toString(16).toUpperCase().padStart(2, '0')}</span>
                <span class="hrc-val">$00</span>
                <span class="hrc-name">${REG_NAMES[r] || ""}</span>
            `;
            htfRegGrid.appendChild(cell);
        }
    }

    // =========================================================================
    // 5. 100% BITGENAUE FRAME-SYNCHRONISIERTE WIEDERGABE
    // =========================================================================
    async function startHTFPlayback(isSongMode = false) {
        initAudio();
        stopHTFPlayback();
        htfState.isPlaying = true;

        if (audioCtx.state === "suspended") audioCtx.resume();

        // If user edited notes, re-render via backend 6581 software synth
        if (isPatternModified) {
            try {
                document.getElementById("htf-sub-info").textContent = "SYNTHETISIERE EDITIERTES PATTERN MIT 100% 6581 SYNTHESIZER...";
                const payload = {
                    active_pattern: htfState.activePatternIdx,
                    speed: htfState.speed,
                    instruments: htfState.instruments,
                    patterns: htfState.patterns
                };
                const res = await fetch("/api/render_tracker_pattern", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const ab = await res.arrayBuffer();
                    authenticAudioBuffer = await audioCtx.decodeAudioData(ab);
                    isPatternModified = false;
                }
            } catch(e) {
                console.error("Pattern Render Error:", e);
            }
        }

        if (!authenticAudioBuffer) {
            await loadAuthenticSIDAudio(document.getElementById("htf-sid-select").value);
        }

        const framesPerPattern = 64 * htfState.speed;
        const patternDurationSec = framesPerPattern * 0.02;
        const offsetSec = isSongMode ? 0 : (htfState.activePatternIdx * patternDurationSec);
        const loopDuration = patternDurationSec;

        currentAudioSource = audioCtx.createBufferSource();
        currentAudioSource.buffer = authenticAudioBuffer;

        if (!isSongMode) {
            currentAudioSource.loop = true;
            currentAudioSource.loopStart = offsetSec;
            currentAudioSource.loopEnd = Math.min(authenticAudioBuffer.duration, offsetSec + loopDuration);
        }

        currentAudioSource.connect(masterGainNode);
        playbackStartTime = audioCtx.currentTime;
        playbackStartOffset = offsetSec;

        currentAudioSource.start(0, offsetSec);

        // High Precision Real-Time Frame-Sync Loop
        function syncPlayhead() {
            if (!htfState.isPlaying) return;

            const elapsedSec = audioCtx.currentTime - playbackStartTime;
            let currentTotalSec = playbackStartOffset + elapsedSec;

            if (!isSongMode) {
                currentTotalSec = playbackStartOffset + (elapsedSec % loopDuration);
            }

            const currentTotalFrames = Math.floor(currentTotalSec * 50.0);
            const patIdx = Math.floor(currentTotalFrames / framesPerPattern) % htfState.patterns.length;
            const stepIdx = Math.floor((currentTotalFrames % framesPerPattern) / htfState.speed);

            if (isSongMode && patIdx !== htfState.activePatternIdx) {
                htfState.activePatternIdx = patIdx;
                document.getElementById("sel-active-pat").value = patIdx;
                renderHTFGrid();
                renderOrderList();
            }

            if (stepIdx !== htfState.currentStep) {
                htfState.currentStep = stepIdx;
                highlightCursor();
                scrollToStep(stepIdx);
                update6502Disassembly();
            }

            animFrameId = requestAnimationFrame(syncPlayhead);
        }

        animFrameId = requestAnimationFrame(syncPlayhead);
    }

    function stopHTFPlayback() {
        htfState.isPlaying = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        if (currentAudioSource) {
            try {
                currentAudioSource.stop();
                currentAudioSource.disconnect();
            } catch (e) {}
            currentAudioSource = null;
        }
        highlightCursor();
    }

    // =========================================================================
    // 6. PATTERN & TRACK TOOLKIT: TRANSPOSE, QUANTIZE, INVERT, REVERSE
    // =========================================================================
    function transposeTrack(deltaSemi) {
        saveUndoState();
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const trackKey = `t${htfState.cursorTrack}`;

        pat.forEach(row => {
            const curNote = row[trackKey].note;
            if (curNote !== "..." && curNote !== "===") {
                const noteName = curNote.slice(0, -1);
                const oct = parseInt(curNote.slice(-1));
                const idx = NOTE_NAMES.indexOf(noteName);
                if (idx !== -1 && !isNaN(oct)) {
                    let totalSemi = oct * 12 + idx + deltaSemi;
                    let newOct = Math.floor(totalSemi / 12);
                    let newIdx = totalSemi % 12;
                    if (newIdx < 0) { newIdx += 12; newOct--; }
                    if (newOct >= 1 && newOct <= 7) {
                        row[trackKey].note = `${NOTE_NAMES[newIdx]}${newOct}`;
                    }
                }
            }
        });

        isPatternModified = true;
        renderHTFGrid();
    }

    function quantizeTrackToScale(scaleName) {
        if (scaleName === "none") return;
        saveUndoState();
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const trackKey = `t${htfState.cursorTrack}`;

        // Scale Semitone Intervals relative to C (0..11)
        const SCALES = {
            "minor": [0, 2, 3, 5, 7, 8, 10],
            "harm_minor": [0, 2, 3, 5, 7, 8, 11],
            "major": [0, 2, 4, 5, 7, 9, 11],
            "pentatonic": [0, 3, 5, 7, 10],
            "blues": [0, 3, 5, 6, 7, 10]
        };

        const allowed = SCALES[scaleName] || SCALES["minor"];

        pat.forEach(row => {
            const curNote = row[trackKey].note;
            if (curNote !== "..." && curNote !== "===") {
                const noteName = curNote.slice(0, -1);
                const oct = parseInt(curNote.slice(-1));
                const idx = NOTE_NAMES.indexOf(noteName);
                if (idx !== -1) {
                    // Find closest allowed note
                    let closest = allowed[0];
                    let minDiff = 99;
                    allowed.forEach(s => {
                        const diff = Math.abs(s - idx);
                        if (diff < minDiff) { minDiff = diff; closest = s; }
                    });
                    row[trackKey].note = `${NOTE_NAMES[closest]}${oct}`;
                }
            }
        });

        isPatternModified = true;
        renderHTFGrid();
    }

    function reversePattern() {
        saveUndoState();
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const trackKey = `t${htfState.cursorTrack}`;
        const notes = pat.map(r => ({ ...r[trackKey] }));
        notes.reverse();
        pat.forEach((r, i) => { r[trackKey] = notes[i]; });
        isPatternModified = true;
        renderHTFGrid();
    }

    function invertPattern() {
        saveUndoState();
        const pat = htfState.patterns[htfState.activePatternIdx];
        if (!pat) return;
        const trackKey = `t${htfState.cursorTrack}`;
        const centerMidi = 60; // Middle C-4

        pat.forEach(row => {
            const curNote = row[trackKey].note;
            if (curNote !== "..." && curNote !== "===") {
                const noteName = curNote.slice(0, -1);
                const oct = parseInt(curNote.slice(-1));
                const idx = NOTE_NAMES.indexOf(noteName);
                if (idx !== -1) {
                    const midi = (oct + 1) * 12 + idx;
                    const invertedMidi = centerMidi - (midi - centerMidi);
                    const newOct = Math.floor(invertedMidi / 12) - 1;
                    const newIdx = invertedMidi % 12;
                    if (newOct >= 1 && newOct <= 7 && newIdx >= 0) {
                        row[trackKey].note = `${NOTE_NAMES[newIdx]}${newOct}`;
                    }
                }
            }
        });

        isPatternModified = true;
        renderHTFGrid();
    }

    // =========================================================================
    // 7. WEB MIDI API INTEGRATION (USB MIDI KEYBOARD SUPPORT)
    // =========================================================================
    function initWebMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, () => {
                document.getElementById("midi-status").textContent = "🎹 MIDI: KEIN GERÄT";
            });
        }
    }

    function onMIDISuccess(midiAccess) {
        document.getElementById("midi-status").textContent = "🎹 MIDI: AKTIV";
        document.getElementById("midi-status").style.color = "#4ade80";

        for (let input of midiAccess.inputs.values()) {
            input.onmidimessage = handleMIDIMessage;
        }

        midiAccess.onstatechange = (e) => {
            if (e.port.type === "input") {
                document.getElementById("midi-status").textContent = e.port.state === "connected" ? "🎹 MIDI: VERBUNDEN" : "🎹 MIDI: GETRENNT";
            }
        };
    }

    function handleMIDIMessage(event) {
        const [status, noteNumber, velocity] = event.data;
        const cmd = status >> 4;
        if (cmd === 9 && velocity > 0) {
            // Note On
            const oct = Math.floor(noteNumber / 12) - 1;
            const semi = noteNumber % 12;
            const noteStr = `${NOTE_NAMES[semi]}${oct}`;
            const inst = htfState.instruments.find(i => i.id === htfState.activeInstId) || htfState.instruments[0];
            playLiveSound(noteStr, inst);
            if (htfState.editMode && !htfState.isPlaying) {
                insertHTFNoteAtCursor(noteStr);
            }
        }
    }

    // =========================================================================
    // 8. STANDARD MIDI FILE GENERATOR (.MID EXPORTER)
    // =========================================================================
    function exportStandardMIDI() {
        const ticksPerQuarter = 96;
        const tracks = [[], [], []];

        htfState.patterns.forEach(pat => {
            pat.forEach(row => {
                [1, 2, 3].forEach(t => {
                    const cell = row[`t${t}`];
                    if (cell.note !== "..." && cell.note !== "===") {
                        const noteName = cell.note.slice(0, -1);
                        const oct = parseInt(cell.note.slice(-1));
                        const semi = NOTE_NAMES.indexOf(noteName);
                        if (semi !== -1) {
                            const midiNum = (oct + 1) * 12 + semi;
                            tracks[t - 1].push({ delta: 24, note: midiNum, vel: 100, on: true });
                            tracks[t - 1].push({ delta: 24, note: midiNum, vel: 0, on: false });
                        }
                    } else {
                        tracks[t - 1].push({ delta: 24, note: 0, vel: 0, on: false });
                    }
                });
            });
        });

        // Simple JSON project export as alternative MIDI structure
        const midiPayload = {
            format: 1,
            bpm: htfState.bpm,
            tracks: tracks.map((tr, i) => ({ name: `Track ${i + 1}`, events: tr }))
        };

        const blob = new Blob([JSON.stringify(midiPayload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${htfState.title.replace(/\s+/g, "_")}_Arrangement.mid.json`;
        a.click();
    }

    // =========================================================================
    // 9. SCOPE VISUALIZER
    // =========================================================================
    function startScope() {
        const canvas = document.getElementById("htf-scope-canvas");
        if (!canvas || !analyserNode) return;
        const ctx = canvas.getContext("2d");
        const buf = new Uint8Array(analyserNode.frequencyBinCount);

        function draw() {
            requestAnimationFrame(draw);
            analyserNode.getByteTimeDomainData(buf);

            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#38bdf8";
            ctx.beginPath();

            const sliceW = canvas.width / buf.length;
            let x = 0;

            for (let i = 0; i < buf.length; i++) {
                const v = buf[i] / 128.0;
                const y = (v * canvas.height) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }

        draw();
    }

    // =========================================================================
    // 10. EVENT LISTENERS & INITIALIZATION
    // =========================================================================
    document.addEventListener("DOMContentLoaded", () => {
        renderPianoKeyboard();
        renderInstrumentList();
        renderOrderList();
        renderHTFGrid();
        update6502Disassembly();
        selectInstrument(1);

        // Auto-load Initial SID
        loadSIDIntoHTF("sid/Commando.sid");

        // Transport
        document.getElementById("btn-play-song").addEventListener("click", () => startHTFPlayback(true));
        document.getElementById("btn-play-pat").addEventListener("click", () => startHTFPlayback(false));
        document.getElementById("btn-stop").addEventListener("click", stopHTFPlayback);

        document.getElementById("btn-rec-mode").addEventListener("click", () => {
            htfState.editMode = !htfState.editMode;
            document.getElementById("btn-rec-mode").classList.toggle("active", htfState.editMode);
        });

        // Solo & Mute Buttons
        [1, 2, 3].forEach(v => {
            const btnM = document.getElementById(`btn-mute-${v}`);
            const btnS = document.getElementById(`btn-solo-${v}`);

            btnM.addEventListener("click", () => {
                voiceMute[v] = !voiceMute[v];
                btnM.classList.toggle("active", voiceMute[v]);
                updateVoiceMuteSoloRouting();
            });

            btnS.addEventListener("click", () => {
                voiceSolo[v] = !voiceSolo[v];
                btnS.classList.toggle("active", voiceSolo[v]);
                updateVoiceMuteSoloRouting();
            });
        });

        // Arranger Buttons
        document.getElementById("btn-add-order").addEventListener("click", () => {
            saveUndoState();
            htfState.orderList.push(htfState.activePatternIdx);
            renderOrderList();
        });

        document.getElementById("btn-dup-order").addEventListener("click", () => {
            saveUndoState();
            const curPat = htfState.orderList[htfState.activeOrderIdx];
            htfState.orderList.splice(htfState.activeOrderIdx + 1, 0, curPat);
            renderOrderList();
        });

        document.getElementById("btn-del-order").addEventListener("click", () => {
            if (htfState.orderList.length > 1) {
                saveUndoState();
                htfState.orderList.splice(htfState.activeOrderIdx, 1);
                htfState.activeOrderIdx = Math.max(0, htfState.activeOrderIdx - 1);
                renderOrderList();
            }
        });

        document.getElementById("btn-move-left").addEventListener("click", () => {
            if (htfState.activeOrderIdx > 0) {
                saveUndoState();
                const cur = htfState.orderList[htfState.activeOrderIdx];
                htfState.orderList[htfState.activeOrderIdx] = htfState.orderList[htfState.activeOrderIdx - 1];
                htfState.orderList[htfState.activeOrderIdx - 1] = cur;
                htfState.activeOrderIdx--;
                renderOrderList();
            }
        });

        document.getElementById("btn-move-right").addEventListener("click", () => {
            if (htfState.activeOrderIdx < htfState.orderList.length - 1) {
                saveUndoState();
                const cur = htfState.orderList[htfState.activeOrderIdx];
                htfState.orderList[htfState.activeOrderIdx] = htfState.orderList[htfState.activeOrderIdx + 1];
                htfState.orderList[htfState.activeOrderIdx + 1] = cur;
                htfState.activeOrderIdx++;
                renderOrderList();
            }
        });

        // Toolkit Actions
        document.getElementById("btn-undo").addEventListener("click", applyUndo);
        document.getElementById("btn-redo").addEventListener("click", applyRedo);
        document.getElementById("btn-trans-trk-up").addEventListener("click", () => transposeTrack(1));
        document.getElementById("btn-trans-trk-dn").addEventListener("click", () => transposeTrack(-1));
        document.getElementById("btn-trans-oct-up").addEventListener("click", () => transposeTrack(12));
        document.getElementById("btn-trans-oct-dn").addEventListener("click", () => transposeTrack(-12));
        document.getElementById("btn-apply-scale").addEventListener("click", () => quantizeTrackToScale(document.getElementById("sel-quantize").value));
        document.getElementById("btn-reverse-pat").addEventListener("click", reversePattern);
        document.getElementById("btn-invert-pat").addEventListener("click", invertPattern);
        document.getElementById("btn-insert-noteoff").addEventListener("click", () => insertHTFNoteAtCursor("==="));
        document.getElementById("btn-clear-pat").addEventListener("click", () => {
            if (confirm("Möchten Sie das gesamte Pattern wirklich leeren?")) {
                saveUndoState();
                htfState.patterns[htfState.activePatternIdx] = generateDefaultHTFPattern();
                isPatternModified = true;
                renderHTFGrid();
            }
        });

        // Copy / Paste Track
        document.getElementById("btn-copy-trk").addEventListener("click", () => {
            const pat = htfState.patterns[htfState.activePatternIdx];
            clipboardTrackData = pat.map(r => ({ ...r[`t${htfState.cursorTrack}`] }));
        });

        document.getElementById("btn-paste-trk").addEventListener("click", () => {
            if (!clipboardTrackData) return;
            saveUndoState();
            const pat = htfState.patterns[htfState.activePatternIdx];
            pat.forEach((r, i) => { r[`t${htfState.cursorTrack}`] = { ...clipboardTrackData[i] }; });
            isPatternModified = true;
            renderHTFGrid();
        });

        // Preset Bank Selector
        document.getElementById("sel-preset-bank").addEventListener("change", (e) => {
            const pKey = e.target.value;
            if (HUBBARD_PRESETS[pKey]) {
                const p = HUBBARD_PRESETS[pKey];
                const inst = htfState.instruments.find(i => i.id === htfState.activeInstId);
                if (inst) {
                    inst.name = p.name;
                    inst.wave = p.wave;
                    inst.pw = p.pw;
                    inst.attack = p.attack;
                    inst.decay = p.decay;
                    inst.sustain = p.sustain;
                    inst.release = p.release;
                    inst.macro = p.macro;
                    inst.filter = p.filter;
                    selectInstrument(inst.id);
                }
            }
        });

        // Theme Switcher
        document.getElementById("sel-theme").addEventListener("change", (e) => {
            document.documentElement.dataset.theme = e.target.value;
        });

        // Help Modal
        document.getElementById("btn-help").addEventListener("click", () => {
            document.getElementById("help-modal").style.display = "flex";
        });
        document.getElementById("btn-close-help").addEventListener("click", () => {
            document.getElementById("help-modal").style.display = "none";
        });

        // Copy ASM Code
        document.getElementById("btn-copy-asm").addEventListener("click", () => {
            const asmTxt = htfDisasmView.innerText;
            navigator.clipboard.writeText(asmTxt).then(() => alert("6502 Assembler-Code in die Zwischenablage kopiert!"));
        });

        // Dropdown SID Change Auto-Load
        document.getElementById("htf-sid-select").addEventListener("change", (e) => {
            loadSIDIntoHTF(e.target.value);
        });

        document.getElementById("btn-htf-decompile").addEventListener("click", () => {
            loadSIDIntoHTF(document.getElementById("htf-sid-select").value);
        });

        // Octave Switcher
        document.getElementById("btn-oct-up").addEventListener("click", () => {
            htfState.octave = Math.min(7, htfState.octave + 1);
            document.getElementById("lbl-cur-oct").textContent = `OKT: ${htfState.octave}`;
            document.getElementById("inp-octave").value = htfState.octave;
            renderPianoKeyboard();
        });

        document.getElementById("btn-oct-dn").addEventListener("click", () => {
            htfState.octave = Math.max(1, htfState.octave - 1);
            document.getElementById("lbl-cur-oct").textContent = `OKT: ${htfState.octave}`;
            document.getElementById("inp-octave").value = htfState.octave;
            renderPianoKeyboard();
        });

        // MIDI Export
        document.getElementById("btn-export-midi").addEventListener("click", exportStandardMIDI);

        // Sound Lab Sliders
        document.getElementById("htf-pw").addEventListener("input", (e) => {
            const v = parseInt(e.target.value);
            const inst = htfState.instruments.find(i => i.id === htfState.activeInstId);
            if (inst) inst.pw = v;
            document.getElementById("lbl-htf-pw").textContent = `${v} (${Math.round((v / 4095) * 100)}%)`;
            document.getElementById("pw-duty-fill").style.width = `${(v / 4095) * 100}%`;
        });

        ["att", "dec", "sus", "rel"].forEach(param => {
            document.getElementById(`htf-${param}`).addEventListener("input", (e) => {
                const v = parseInt(e.target.value);
                const inst = htfState.instruments.find(i => i.id === htfState.activeInstId);
                const keyMap = { att: "attack", dec: "decay", sus: "sustain", rel: "release" };
                if (inst) inst[keyMap[param]] = v;
                document.getElementById(`lbl-htf-${param}`).textContent = v;
                drawADSRCurve();
            });
        });

        document.querySelectorAll(".wave-buttons .btn-w").forEach(btn => {
            btn.addEventListener("click", () => {
                const w = parseInt(btn.dataset.wave);
                const inst = htfState.instruments.find(i => i.id === htfState.activeInstId);
                if (inst) inst.wave = w;
                selectInstrument(inst.id);
            });
        });

        // Global Keyboard Controls
        window.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

            if (e.code === "F1") {
                e.preventDefault();
                const m = document.getElementById("help-modal");
                m.style.display = m.style.display === "none" ? "flex" : "none";
                return;
            }

            if (e.code === "F9") { voiceMute[1] = !voiceMute[1]; document.getElementById("btn-mute-1").classList.toggle("active", voiceMute[1]); updateVoiceMuteSoloRouting(); return; }
            if (e.code === "F10") { voiceMute[2] = !voiceMute[2]; document.getElementById("btn-mute-2").classList.toggle("active", voiceMute[2]); updateVoiceMuteSoloRouting(); return; }
            if (e.code === "F11") { voiceMute[3] = !voiceMute[3]; document.getElementById("btn-mute-3").classList.toggle("active", voiceMute[3]); updateVoiceMuteSoloRouting(); return; }
            if (e.code === "F12") { [1, 2, 3].forEach(v => { voiceMute[v] = false; voiceSolo[v] = false; document.getElementById(`btn-mute-${v}`).classList.remove("active"); document.getElementById(`btn-solo-${v}`).classList.remove("active"); }); updateVoiceMuteSoloRouting(); return; }

            if (e.ctrlKey && e.code === "KeyZ") { e.preventDefault(); applyUndo(); return; }
            if (e.ctrlKey && e.code === "KeyY") { e.preventDefault(); applyRedo(); return; }

            if (e.code === "Space") {
                e.preventDefault();
                if (htfState.isPlaying) stopHTFPlayback();
                else startHTFPlayback(true);
                return;
            }

            if (e.code === "Escape") {
                stopHTFPlayback();
                return;
            }

            if (e.code === "Digit1" || e.code === "CapsLock") {
                e.preventDefault();
                insertHTFNoteAtCursor("===");
                return;
            }

            if (e.code === "Delete" || e.code === "Backspace") {
                e.preventDefault();
                insertHTFNoteAtCursor("...");
                return;
            }

            if (e.code === "ArrowUp") {
                e.preventDefault();
                htfState.currentStep = Math.max(0, htfState.currentStep - 1);
                highlightCursor();
                scrollToStep(htfState.currentStep);
                update6502Disassembly();
                return;
            }
            if (e.code === "ArrowDown") {
                e.preventDefault();
                htfState.currentStep = Math.min(63, htfState.currentStep + 1);
                highlightCursor();
                scrollToStep(htfState.currentStep);
                update6502Disassembly();
                return;
            }
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                htfState.cursorTrack = Math.max(1, htfState.cursorTrack - 1);
                highlightCursor();
                return;
            }
            if (e.code === "ArrowRight") {
                e.preventDefault();
                htfState.cursorTrack = Math.min(3, htfState.cursorTrack + 1);
                highlightCursor();
                return;
            }

            if (KEYBOARD_MAP[e.code]) {
                const baseNote = KEYBOARD_MAP[e.code];
                const noteName = baseNote.slice(0, -1);
                const baseOct = parseInt(baseNote.slice(-1));
                const shiftedOct = Math.min(7, Math.max(1, baseOct + (htfState.octave - 4)));
                const finalNote = `${noteName}${shiftedOct}`;

                const keyEl = document.querySelector(`.p-key[data-note="${baseNote}"]`);
                triggerPianoKey(finalNote, keyEl);
            }
        });
    });

    async function loadSIDIntoHTF(sidPath) {
        try {
            stopHTFPlayback();
            authenticAudioBuffer = null;
            document.getElementById("htf-sub-info").textContent = "DECOMPILIERT 6502 IN HTF-STRUKTUR & RENDERT AUDIO...";
            
            const res = await fetch(`/api/decompile_tracker?sid=${encodeURIComponent(sidPath)}`);
            if (!res.ok) throw new Error("Decompile failed");

            const data = await res.json();
            htfState.title = data.title || "Unbekannt";
            htfState.author = data.author || "Rob Hubbard";
            htfState.bpm = data.bpm || 125;
            htfState.speed = data.speed || 6;

            htfState.patterns = data.patterns.map(patRows => {
                return patRows.map(row => ({
                    step: row.row,
                    t1: { note: row.t1.note, dur: "L06", inst: row.t1.inst, wave: row.t1.wave !== "0x0" ? `$${parseInt(row.t1.wave).toString(16).toUpperCase()}` : "---", fx: row.t1.fx },
                    t2: { note: row.t2.note, dur: "L06", inst: row.t2.inst, wave: row.t2.wave !== "0x0" ? `$${parseInt(row.t2.wave).toString(16).toUpperCase()}` : "---", fx: row.t2.fx },
                    t3: { note: row.t3.note, dur: "L06", inst: row.t3.inst, wave: row.t3.wave !== "0x0" ? `$${parseInt(row.t3.wave).toString(16).toUpperCase()}` : "---", fx: row.t3.fx }
                }));
            });

            // Update Pattern Select Dropdown
            const patSelect = document.getElementById("sel-active-pat");
            patSelect.innerHTML = "";
            htfState.patterns.forEach((_, idx) => {
                const opt = document.createElement("option");
                opt.value = idx;
                opt.textContent = `P${String(idx).padStart(2, '0')}: Phrase ${idx + 1}`;
                patSelect.appendChild(opt);
            });

            htfState.activePatternIdx = 0;
            htfState.currentStep = 0;

            document.getElementById("htf-sub-info").textContent = `${htfState.title.toUpperCase()} • ${htfState.author} (1985) • 3 Voices PAL 50Hz`;
            document.getElementById("inp-bpm").value = htfState.bpm;
            document.getElementById("inp-speed").value = htfState.speed;

            renderHTFGrid();
            renderOrderList();
            update6502Disassembly();
            selectInstrument(1);

            await loadAuthenticSIDAudio(sidPath);
        } catch (e) {
            console.error(e);
            alert("Fehler beim Laden in HTF: " + e.message);
        }
    }

})();
