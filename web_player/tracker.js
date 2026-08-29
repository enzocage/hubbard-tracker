/**
 * ROB HUBBARD CHIPTUNE MUSIC TRACKER ENGINE
 * Web Audio MOS 6581 Synthesizer, 19-SID Decompiler, Pattern Editor, Live Piano Keyboard
 */

document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. STATE & CONSTANTS
    // =========================================================================
    const NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
    const KEYBOARD_MAP = {
        "KeyZ": "C-3", "KeyS": "C#3", "KeyX": "D-3", "KeyD": "D#3", "KeyC": "E-3", "KeyV": "F-3", "KeyG": "F#3", "KeyB": "G-3", "KeyH": "G#3", "KeyN": "A-3", "KeyJ": "A#3", "KeyM": "B-3",
        "KeyA": "C-4", "KeyW": "C#4", "KeyS": "D-4", "KeyE": "D#4", "KeyD": "E-4", "KeyF": "F-4", "KeyT": "F#4", "KeyG": "G-4", "KeyY": "G#4", "KeyH": "A-4", "KeyU": "A#4", "KeyJ": "B-4", "KeyK": "C-5", "KeyO": "C#5", "KeyL": "D-5", "KeyP": "D#5"
    };

    let trackerState = {
        title: "Commando",
        author: "Rob Hubbard (1985)",
        bpm: 125,
        speed: 6,
        octave: 4,
        step: 1,
        editMode: true,
        isPlaying: false,
        activePatternIdx: 0,
        currentRow: 0,
        cursorTrack: 1, // 1, 2, or 3
        cursorCol: "note", // note, inst, fx
        activeInstId: 1,
        instruments: [
            { id: 1, name: "Heroic Pulse Lead", wave: 0x41, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, filter: true, fx: "scoop" },
            { id: 2, name: "RingMod Fanfare", wave: 0x15, pw: 2048, attack: 0, decay: 9, sustain: 0, release: 0, filter: true, fx: "none" },
            { id: 3, name: "50Hz Arp Pulse", wave: 0x43, pw: 2048, attack: 0, decay: 0, sustain: 15, release: 0, filter: false, fx: "none" },
            { id: 4, name: "Saw Staccato Solo", wave: 0x21, pw: 0, attack: 0, decay: 2, sustain: 0, release: 0, filter: true, fx: "none" },
            { id: 5, name: "16th Slap-Bass Pulse", wave: 0x41, pw: 1024, attack: 0, decay: 0, sustain: 9, release: 0, filter: false, fx: "slap" },
            { id: 6, name: "Space-Bass Triangle", wave: 0x11, pw: 0, attack: 0, decay: 0, sustain: 11, release: 0, filter: false, fx: "none" },
            { id: 7, name: "Military Snare Noise", wave: 0x81, pw: 0, attack: 0, decay: 0, sustain: 0, release: 0, filter: false, fx: "none" },
            { id: 8, name: "Pitch-Drop Kick", wave: 0x11, pw: 0, attack: 0, decay: 1, sustain: 0, release: 0, filter: false, fx: "none" },
            { id: 9, name: "Short Noise Hat", wave: 0x81, pw: 0, attack: 0, decay: 0, sustain: 0, release: 0, filter: false, fx: "none" },
            { id: 10, name: "PWM String Chorus Pad", wave: 0x41, pw: 2048, attack: 0, decay: 9, sustain: 15, release: 0, filter: true, fx: "vibrato" }
        ],
        patterns: []
    };

    // =========================================================================
    // 2. WEB AUDIO SYNTHESIZER (MOS 6581 EMULATION FOR LIVE AUDITION)
    // =========================================================================
    let audioCtx = null;
    let masterFilterNode = null;
    let masterGainNode = null;
    let analyserNode = null;

    function initAudio() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.value = 0.4;

        masterFilterNode = audioCtx.createBiquadFilter();
        masterFilterNode.type = "bandpass";
        masterFilterNode.frequency.value = 1600;
        masterFilterNode.Q.value = 4.0;

        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;

        masterFilterNode.connect(masterGainNode);
        masterGainNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        startScopeVisualizer();
    }

    function noteToFreq(noteStr) {
        if (!noteStr || noteStr === "...") return 0;
        const noteName = noteStr.slice(0, -1);
        const oct = parseInt(noteStr.slice(-1));
        const semi = NOTE_NAMES.indexOf(noteName);
        if (semi === -1 || isNaN(oct)) return 0;
        const midi = (oct + 1) * 12 + semi;
        return 440.0 * Math.pow(2.0, (midi - 69) / 12.0);
    }

    function playLiveNote(noteStr, inst) {
        initAudio();
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        const freq = noteToFreq(noteStr);
        if (freq <= 0) return;

        const now = audioCtx.currentTime;
        const isNoise = (inst.wave & 0x80) !== 0;

        if (isNoise) {
            // White noise buffer
            const bufferSize = audioCtx.sampleRate * 0.15;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            const env = audioCtx.createGain();
            env.gain.setValueAtTime(0.6, now);
            env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            noise.connect(env);
            env.connect(masterGainNode);
            noise.start(now);
            noise.stop(now + 0.15);
            return;
        }

        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();

        // Waveform mapping
        if (inst.wave === 0x21) osc.type = "sawtooth";
        else if (inst.wave === 0x11 || inst.wave === 0x15) osc.type = "triangle";
        else osc.type = "square"; // Pulse $41 / $43

        // Pitch scoop FX
        if (inst.fx === "scoop") {
            osc.frequency.setValueAtTime(freq * 0.89, now); // -2 HT
            osc.frequency.exponentialRampToValueAtTime(freq, now + 0.08);
        } else {
            osc.frequency.setValueAtTime(freq, now);
        }

        // ADSR Envelope
        const attTime = Math.max(0.002, inst.attack * 0.04);
        const decTime = Math.max(0.02, inst.decay * 0.06);
        const susLevel = Math.max(0.01, (inst.sustain / 15.0) * 0.5);

        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(0.5, now + attTime);
        env.gain.exponentialRampToValueAtTime(susLevel, now + attTime + decTime);
        env.gain.exponentialRampToValueAtTime(0.0001, now + attTime + decTime + 0.4);

        if (inst.filter) {
            osc.connect(env);
            env.connect(masterFilterNode);
        } else {
            osc.connect(env);
            env.connect(masterGainNode);
        }

        osc.start(now);
        osc.stop(now + attTime + decTime + 0.5);
    }

    // =========================================================================
    // 3. UI GENERATION & EVENT HANDLERS
    // =========================================================================
    const instListContainer = document.getElementById("inst-list-container");
    const pianoKeyboard = document.getElementById("piano-keyboard");
    const patternGridTable = document.getElementById("pattern-grid-table");
    const patternGridScroll = document.getElementById("pattern-grid-scroll");

    // Generate Default 64-Row Patterns if empty
    function generateDefaultPattern() {
        const rows = [];
        for (let r = 0; r < 64; r++) {
            rows.push({
                row: r,
                t1: { note: "...", inst: "00", fx: "..." },
                t2: { note: "...", inst: "00", fx: "..." },
                t3: { note: "...", inst: "00", fx: "..." }
            });
        }
        return rows;
    }

    trackerState.patterns = [generateDefaultPattern(), generateDefaultPattern(), generateDefaultPattern(), generateDefaultPattern()];

    // Render Instrument List
    function renderInstrumentList() {
        instListContainer.innerHTML = "";
        trackerState.instruments.forEach(inst => {
            const div = document.createElement("div");
            div.className = `inst-item ${inst.id === trackerState.activeInstId ? "active" : ""}`;
            div.innerHTML = `
                <span class="inst-num">${String(inst.id).padStart(2, '0')}</span>
                <span class="inst-name">${inst.name}</span>
            `;
            div.addEventListener("click", () => selectInstrument(inst.id));
            instListContainer.appendChild(div);
        });
    }

    function selectInstrument(id) {
        trackerState.activeInstId = id;
        renderInstrumentList();
        const inst = trackerState.instruments.find(i => i.id === id);
        if (!inst) return;

        // Update Editor UI
        document.getElementById("inst-editor-title").textContent = `KLANGFARBEN-EDITOR: #${String(inst.id).padStart(2, '0')} ${inst.name}`;
        
        // Wave buttons
        document.querySelectorAll(".btn-wave").forEach(b => {
            b.classList.toggle("active", parseInt(b.dataset.wave) === inst.wave);
        });

        // Sliders
        document.getElementById("inst-pw").value = inst.pw;
        document.getElementById("lbl-inst-pw").textContent = `${inst.pw} (${Math.round((inst.pw/4095)*100)}%)`;

        document.getElementById("inst-att").value = inst.attack;
        document.getElementById("lbl-inst-att").textContent = inst.attack;

        document.getElementById("inst-dec").value = inst.decay;
        document.getElementById("lbl-inst-dec").textContent = inst.decay;

        document.getElementById("inst-sus").value = inst.sustain;
        document.getElementById("lbl-inst-sus").textContent = inst.sustain;

        document.getElementById("inst-rel").value = inst.release;
        document.getElementById("lbl-inst-rel").textContent = inst.release;

        document.getElementById("inst-flt-route").checked = inst.filter;
        document.getElementById("inst-fx-select").value = inst.fx || "none";
    }

    // Connect Instrument Editor Controls
    document.querySelectorAll(".btn-wave").forEach(btn => {
        btn.addEventListener("click", () => {
            const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId);
            if (inst) {
                inst.wave = parseInt(btn.dataset.wave);
                selectInstrument(inst.id);
            }
        });
    });

    document.getElementById("inst-pw").addEventListener("input", (e) => {
        const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId);
        if (inst) {
            inst.pw = parseInt(e.target.value);
            document.getElementById("lbl-inst-pw").textContent = `${inst.pw} (${Math.round((inst.pw/4095)*100)}%)`;
        }
    });

    ["att", "dec", "sus", "rel"].forEach(prop => {
        const slider = document.getElementById(`inst-${prop}`);
        slider.addEventListener("input", (e) => {
            const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId);
            if (inst) {
                const fullProp = prop === "att" ? "attack" : (prop === "dec" ? "decay" : (prop === "sus" ? "sustain" : "release"));
                inst[fullProp] = parseInt(e.target.value);
                document.getElementById(`lbl-inst-${prop}`).textContent = e.target.value;
            }
        });
    });

    document.getElementById("inst-flt-route").addEventListener("change", (e) => {
        const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId);
        if (inst) inst.filter = e.target.checked;
    });

    document.getElementById("inst-fx-select").addEventListener("change", (e) => {
        const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId);
        if (inst) inst.fx = e.target.value;
    });

    // Render Virtual Piano Keyboard (Octaves 3 & 4)
    function renderPianoKeyboard() {
        pianoKeyboard.innerHTML = "";
        const keys = [
            { note: "C-3", sc: "Z", black: false }, { note: "C#3", sc: "S", black: true },
            { note: "D-3", sc: "X", black: false }, { note: "D#3", sc: "D", black: true },
            { note: "E-3", sc: "C", black: false },
            { note: "F-3", sc: "V", black: false }, { note: "F#3", sc: "G", black: true },
            { note: "G-3", sc: "B", black: false }, { note: "G#3", sc: "H", black: true },
            { note: "A-3", sc: "N", black: false }, { note: "A#3", sc: "J", black: true },
            { note: "B-3", sc: "M", black: false },
            { note: "C-4", sc: "A", black: false }, { note: "C#4", sc: "W", black: true },
            { note: "D-4", sc: "S", black: false }, { note: "D#4", sc: "E", black: true },
            { note: "E-4", sc: "D", black: false },
            { note: "F-4", sc: "F", black: false }, { note: "F#4", sc: "T", black: true },
            { note: "G-4", sc: "G", black: false }, { note: "G#4", sc: "Y", black: true },
            { note: "A-4", sc: "H", black: false }, { note: "A#4", sc: "U", black: true },
            { note: "B-4", sc: "J", black: false },
            { note: "C-5", sc: "K", black: false }
        ];

        keys.forEach(k => {
            const el = document.createElement("div");
            el.className = `piano-key ${k.black ? "black" : "white"}`;
            el.dataset.note = k.note;
            el.innerHTML = `
                ${!k.black ? `<span class="key-note-lbl">${k.note}</span>` : ""}
                <span class="key-sc-lbl">${k.sc}</span>
            `;

            el.addEventListener("mousedown", () => {
                triggerPianoNote(k.note, el);
            });
            pianoKeyboard.appendChild(el);
        });
    }

    function triggerPianoNote(noteStr, keyEl) {
        const inst = trackerState.instruments.find(i => i.id === trackerState.activeInstId) || trackerState.instruments[0];
        playLiveNote(noteStr, inst);

        if (keyEl) {
            keyEl.classList.add("playing");
            setTimeout(() => keyEl.classList.remove("playing"), 200);
        }

        // If edit mode is on, insert note into active cell and advance cursor
        if (trackerState.editMode) {
            insertNoteAtCursor(noteStr);
        }
    }

    function insertNoteAtCursor(noteStr) {
        const pat = trackerState.patterns[trackerState.activePatternIdx];
        if (!pat) return;
        const row = pat[trackerState.currentRow];
        if (!row) return;

        const trackKey = `t${trackerState.cursorTrack}`;
        row[trackKey].note = noteStr;
        row[trackKey].inst = String(trackerState.activeInstId).padStart(2, '0');

        renderPatternGrid();

        // Advance step
        const step = trackerState.step;
        if (step > 0) {
            trackerState.currentRow = Math.min(63, trackerState.currentRow + step);
            highlightCursor();
            scrollToRow(trackerState.currentRow);
        }
    }

    // Render 64-Row Pattern Grid
    function renderPatternGrid() {
        patternGridTable.innerHTML = "";
        const pat = trackerState.patterns[trackerState.activePatternIdx];
        if (!pat) return;

        pat.forEach((row, r) => {
            const rowDiv = document.createElement("div");
            const isBeat4 = r % 4 === 0;
            const isBeat16 = r % 16 === 0;
            rowDiv.className = `grid-row ${r % 2 === 0 ? "even" : "odd"} ${isBeat16 ? "beat-16" : (isBeat4 ? "beat-4" : "")}`;
            rowDiv.id = `trk-row-${r}`;

            // Row Num
            const colNum = document.createElement("div");
            colNum.className = "row-num-cell";
            colNum.textContent = String(r).padStart(2, '0');
            rowDiv.appendChild(colNum);

            // 3 Tracks
            [1, 2, 3].forEach(t => {
                const tData = row[`t${t}`];
                const trackCol = document.createElement("div");
                trackCol.className = `track-cell track-${t}`;
                trackCol.dataset.row = r;
                trackCol.dataset.track = t;

                const isSet = tData.note !== "...";
                const isInstSet = tData.inst !== "00";
                const isFxSet = tData.fx !== "...";

                trackCol.innerHTML = `
                    <span class="c-note">${tData.note}</span>
                    <span class="c-inst ${isInstSet ? "set" : ""}">${tData.inst}</span>
                    <span class="c-fx ${isFxSet ? "set" : ""}">${tData.fx}</span>
                `;

                trackCol.addEventListener("click", () => {
                    trackerState.currentRow = r;
                    trackerState.cursorTrack = t;
                    highlightCursor();
                });

                rowDiv.appendChild(trackCol);
            });

            patternGridTable.appendChild(rowDiv);
        });

        highlightCursor();
    }

    function highlightCursor() {
        document.querySelectorAll(".grid-row").forEach(r => r.classList.remove("playhead"));
        document.querySelectorAll(".track-cell").forEach(c => c.classList.remove("cursor"));

        const curRowEl = document.getElementById(`trk-row-${trackerState.currentRow}`);
        if (curRowEl) {
            curRowEl.classList.add("playhead");
            const curCell = curRowEl.querySelector(`.track-${trackerState.cursorTrack}`);
            if (curCell) curCell.classList.add("cursor");
        }

        document.getElementById("stat-row").textContent = `ROW: ${String(trackerState.currentRow).padStart(2, '0')} / 63`;
    }

    function scrollToRow(r) {
        const rowEl = document.getElementById(`trk-row-${r}`);
        if (rowEl) {
            const containerHeight = patternGridScroll.clientHeight;
            patternGridScroll.scrollTop = rowEl.offsetTop - containerHeight / 2 + 11;
        }
    }

    // =========================================================================
    // 4. COMPUTER KEYBOARD HANDLER (LIVE PLAY & TRACKER NAVIGATION)
    // =========================================================================
    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

        // Space: Toggle Play / Stop
        if (e.code === "Space") {
            e.preventDefault();
            if (trackerState.isPlaying) stopPlayback();
            else startPlayback(false);
            return;
        }

        // Escape: Stop
        if (e.code === "Escape") {
            stopPlayback();
            return;
        }

        // Delete / Backspace: Clear note
        if (e.code === "Delete" || e.code === "Backspace") {
            e.preventDefault();
            insertNoteAtCursor("...");
            return;
        }

        // Arrow Navigation
        if (e.code === "ArrowUp") {
            e.preventDefault();
            trackerState.currentRow = Math.max(0, trackerState.currentRow - 1);
            highlightCursor();
            scrollToRow(trackerState.currentRow);
            return;
        }
        if (e.code === "ArrowDown") {
            e.preventDefault();
            trackerState.currentRow = Math.min(63, trackerState.currentRow + 1);
            highlightCursor();
            scrollToRow(trackerState.currentRow);
            return;
        }
        if (e.code === "ArrowLeft") {
            e.preventDefault();
            trackerState.cursorTrack = Math.max(1, trackerState.cursorTrack - 1);
            highlightCursor();
            return;
        }
        if (e.code === "ArrowRight") {
            e.preventDefault();
            trackerState.cursorTrack = Math.min(3, trackerState.cursorTrack + 1);
            highlightCursor();
            return;
        }

        // Piano Key Press
        if (KEYBOARD_MAP[e.code]) {
            const baseNote = KEYBOARD_MAP[e.code];
            const noteName = baseNote.slice(0, -1);
            const baseOct = parseInt(baseNote.slice(-1));
            const shiftedOct = Math.min(7, Math.max(1, baseOct + (trackerState.octave - 4)));
            const finalNote = `${noteName}${shiftedOct}`;

            const keyEl = document.querySelector(`.piano-key[data-note="${baseNote}"]`);
            triggerPianoNote(finalNote, keyEl);
        }
    });

    // =========================================================================
    // 5. TRACKER PLAYBACK ENGINE
    // =========================================================================
    let playTimer = null;

    function startPlayback(isSongMode = false) {
        initAudio();
        stopPlayback();
        trackerState.isPlaying = true;

        const bpm = parseInt(document.getElementById("inp-bpm").value) || 125;
        const speed = parseInt(document.getElementById("inp-speed").value) || 6;
        // 50Hz clock = 20ms per frame. row interval = speed * 20ms
        const rowIntervalMs = (speed * 20.0) * (125.0 / bpm);

        playTimer = setInterval(() => {
            const pat = trackerState.patterns[trackerState.activePatternIdx];
            if (!pat) return;

            const row = pat[trackerState.currentRow];
            if (row) {
                // Play Track 1
                if (row.t1.note !== "...") {
                    const inst1 = trackerState.instruments.find(i => i.id === parseInt(row.t1.inst)) || trackerState.instruments[0];
                    playLiveNote(row.t1.note, inst1);
                }
                // Play Track 2
                if (row.t2.note !== "...") {
                    const inst2 = trackerState.instruments.find(i => i.id === parseInt(row.t2.inst)) || trackerState.instruments[2];
                    playLiveNote(row.t2.note, inst2);
                }
                // Play Track 3
                if (row.t3.note !== "...") {
                    const inst3 = trackerState.instruments.find(i => i.id === parseInt(row.t3.inst)) || trackerState.instruments[4];
                    playLiveNote(row.t3.note, inst3);
                }
            }

            highlightCursor();
            scrollToRow(trackerState.currentRow);

            trackerState.currentRow++;
            if (trackerState.currentRow >= 64) {
                trackerState.currentRow = 0;
                if (isSongMode) {
                    trackerState.activePatternIdx = (trackerState.activePatternIdx + 1) % trackerState.patterns.length;
                    document.getElementById("sel-pattern").value = trackerState.activePatternIdx;
                    renderPatternGrid();
                }
            }
        }, rowIntervalMs);
    }

    function stopPlayback() {
        trackerState.isPlaying = false;
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
        highlightCursor();
    }

    document.getElementById("btn-play-song").addEventListener("click", () => startPlayback(true));
    document.getElementById("btn-play-pat").addEventListener("click", () => startPlayback(false));
    document.getElementById("btn-stop").addEventListener("click", stopPlayback);

    document.getElementById("btn-record-mode").addEventListener("click", (e) => {
        trackerState.editMode = !trackerState.editMode;
        document.getElementById("btn-record-mode").classList.toggle("active", trackerState.editMode);
        document.getElementById("stat-edit-mode").textContent = trackerState.editMode ? "MODE: EDIT READY" : "MODE: AUDITION";
    });

    document.getElementById("sel-pattern").addEventListener("change", (e) => {
        trackerState.activePatternIdx = parseInt(e.target.value);
        trackerState.currentRow = 0;
        renderPatternGrid();
    });

    document.getElementById("inp-octave").addEventListener("change", (e) => {
        trackerState.octave = parseInt(e.target.value) || 4;
    });

    document.getElementById("inp-step").addEventListener("change", (e) => {
        trackerState.step = parseInt(e.target.value) || 1;
    });

    // Transpose Buttons
    document.getElementById("btn-trans-up").addEventListener("click", () => transposePattern(1));
    document.getElementById("btn-trans-down").addEventListener("click", () => transposePattern(-1));

    function transposePattern(delta) {
        const pat = trackerState.patterns[trackerState.activePatternIdx];
        if (!pat) return;

        pat.forEach(row => {
            [1, 2, 3].forEach(t => {
                const curNote = row[`t${t}`].note;
                if (curNote !== "...") {
                    const noteName = curNote.slice(0, -1);
                    const oct = parseInt(curNote.slice(-1));
                    const semi = NOTE_NAMES.indexOf(noteName);
                    if (semi !== -1) {
                        let newSemi = semi + delta;
                        let newOct = oct;
                        if (newSemi >= 12) { newSemi -= 12; newOct++; }
                        else if (newSemi < 0) { newSemi += 12; newOct--; }
                        if (newOct >= 1 && newOct <= 7) {
                            row[`t${t}`].note = `${NOTE_NAMES[newSemi]}${newOct}`;
                        }
                    }
                }
            });
        });
        renderPatternGrid();
    }

    document.getElementById("btn-clear-pat").addEventListener("click", () => {
        if (confirm("Aktuelles Pattern wirklich komplett leeren?")) {
            trackerState.patterns[trackerState.activePatternIdx] = generateDefaultPattern();
            renderPatternGrid();
        }
    });

    // =========================================================================
    // 6. SID DECOMPILER & SID LOADER
    // =========================================================================
    async function loadSID(sidPath) {
        try {
            document.getElementById("disp-song-title").textContent = "LÄDT DECOMPILER...";
            const res = await fetch(`/api/decompile_tracker?sid=${encodeURIComponent(sidPath)}`);
            if (!res.ok) throw new Error("Decompile failed");

            const data = await res.json();
            trackerState.title = data.title || "Unbekannt";
            trackerState.author = data.author || "Rob Hubbard";
            trackerState.bpm = data.bpm || 125;
            trackerState.speed = data.speed || 6;
            trackerState.patterns = data.patterns || [generateDefaultPattern()];
            trackerState.activePatternIdx = 0;
            trackerState.currentRow = 0;

            document.getElementById("disp-song-title").textContent = trackerState.title.toUpperCase();
            document.getElementById("disp-song-author").textContent = `${trackerState.author} • 3 Voices PAL SID`;
            document.getElementById("inp-bpm").value = trackerState.bpm;
            document.getElementById("inp-speed").value = trackerState.speed;

            renderPatternGrid();
            selectInstrument(1);
        } catch (err) {
            console.error(err);
            alert("Fehler beim Decompilieren der SID-Datei: " + err.message);
        }
    }

    const sidSelectEl = document.getElementById("sid-select");
    if (sidSelectEl) {
        sidSelectEl.addEventListener("change", (e) => {
            loadSID(e.target.value);
        });
    }

    document.getElementById("btn-load-sid").addEventListener("click", () => {
        const selPath = document.getElementById("sid-select").value;
        loadSID(selPath);
    });

    // Export SID
    document.getElementById("btn-export-sid").addEventListener("click", async () => {
        try {
            const payload = {
                title: `${trackerState.title} Tracker Edit`,
                speed: trackerState.speed,
                instruments: trackerState.instruments,
                patterns: trackerState.patterns
            };
            const res = await fetch("/api/export_tracker_sid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${trackerState.title.replace(/\s+/g, "_")}_Tracker.sid`;
            a.click();
        } catch (e) {
            alert("Fehler beim Exportieren des SID-Files: " + e.message);
        }
    });

    // Export WAV
    document.getElementById("btn-export-wav").addEventListener("click", async () => {
        try {
            const payload = {
                active_pattern: trackerState.activePatternIdx,
                speed: trackerState.speed,
                instruments: trackerState.instruments,
                patterns: trackerState.patterns
            };
            const res = await fetch("/api/render_tracker_pattern", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("WAV Render failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${trackerState.title.replace(/\s+/g, "_")}_Pattern${trackerState.activePatternIdx}.wav`;
            a.click();
        } catch (e) {
            alert("Fehler beim WAV-Export: " + e.message);
        }
    });

    // 60FPS Scope Canvas
    function startScopeVisualizer() {
        const canvas = document.getElementById("tracker-scope-canvas");
        if (!canvas || !analyserNode) return;
        const ctx = canvas.getContext("2d");
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            requestAnimationFrame(draw);
            analyserNode.getByteTimeDomainData(dataArray);

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#00f0ff";
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }
        draw();
    }

    // Initial Setup
    renderInstrumentList();
    renderPianoKeyboard();
    selectInstrument(1);
    loadSID("sid/Commando.sid");
});
