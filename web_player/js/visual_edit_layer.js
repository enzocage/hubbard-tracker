/**
 * ============================================================================
 * TRACKER 3 - LAYER 3: VISUAL & INTERACTIVE EDIT LAYER
 * ============================================================================
 * Responsible for:
 * 1. Visual 3-Track Pattern Matrix & Cursor Navigation.
 * 2. Note Pitch, Timing & Duration Editing (Transpose, Quantize, Reverse, Invert).
 * 3. 3-Voice MOS 6581 Sound Lab & ADSR Canvas Visualizer.
 * 4. Song Arranger & Pattern Pool Matrix.
 * 5. Undo / Redo History Stack.
 * 6. PC Keyboard & Virtual Piano Event Mapping.
 */

(function (window) {
    'use strict';

    const SECTION_NAMES = [
        "INTRO", "THEME A", "SOLO LEAD", "THEME B", 
        "BRIDGE", "CLIMAX", "VARIATION", "OUTRO", "SOLO 2", "FINALE"
    ];

    const SCALES = {
        minor: [0, 2, 3, 5, 7, 8, 10],
        harm_minor: [0, 2, 3, 5, 7, 8, 11],
        major: [0, 2, 4, 5, 7, 9, 11],
        pentatonic: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10]
    };

    const KEYBOARD_MAP = {
        KeyZ: "C-3", KeyS: "C#3", KeyX: "D-3", KeyD: "D#3", KeyC: "E-3", KeyV: "F-3",
        KeyG: "F#3", KeyB: "G-3", KeyH: "G#3", KeyN: "A-3", KeyJ: "A#3", KeyM: "B-3",
        KeyQ: "C-4", Digit2: "C#4", KeyW: "D-4", Digit3: "D#4", KeyE: "E-4", KeyR: "F-4",
        Digit5: "F#4", KeyT: "G-4", Digit6: "G#4", KeyY: "A-4", Digit7: "A#4", KeyU: "B-4",
        KeyI: "C-5", Digit9: "C#5", KeyO: "D-5", Digit0: "D#5", KeyP: "E-5"
    };

    class VisualEditLayer {
        constructor(streamMiner, audioEngine) {
            this.miner = streamMiner;
            this.audio = audioEngine;

            this.currentStep = 0;
            this.cursorTrack = 1;     // 1, 2, 3
            this.cursorField = "note";// "note", "dur", "inst", "wave", "fx"
            this.activeInstId = 1;
            this.activeOctave = 4;
            this.editStepJump = 1;
            this.defaultDuration = "L06";
            this.editMode = true;

            this.undoStack = [];
            this.redoStack = [];
            this.clipboardTrack = null;

            // Debounced audio re-render timer
            this.debounceTimer = null;
        }

        // Initialize UI Elements
        initUI() {
            this.renderOrderTimeline();
            this.renderPatternPool();
            this.renderMatrixGrid();
            this.renderInstrumentList();
            this.renderPianoKeyboard();
            this.updateInstrumentLab(this.activeInstId);
            this.update6502Telemetry();
            this.bindGlobalKeyboard();
        }

        // --------------------------------------------------------------------
        // 1. UNDO / REDO STATE MANAGEMENT
        // --------------------------------------------------------------------
        saveUndoState() {
            const snap = {
                patterns: JSON.parse(JSON.stringify(this.miner.patterns)),
                orderList: [...this.miner.orderList],
                instruments: JSON.parse(JSON.stringify(this.miner.instruments)),
                activePatternIdx: this.miner.activePatternIdx,
                currentStep: this.currentStep
            };
            this.undoStack.push(snap);
            if (this.undoStack.length > 50) this.undoStack.shift();
            this.redoStack = [];
        }

        applyUndo() {
            if (this.undoStack.length === 0) return;
            const current = {
                patterns: JSON.parse(JSON.stringify(this.miner.patterns)),
                orderList: [...this.miner.orderList],
                instruments: JSON.parse(JSON.stringify(this.miner.instruments)),
                activePatternIdx: this.miner.activePatternIdx,
                currentStep: this.currentStep
            };
            this.redoStack.push(current);

            const prev = this.undoStack.pop();
            this.miner.patterns = prev.patterns;
            this.miner.orderList = prev.orderList;
            this.miner.instruments = prev.instruments;
            this.miner.activePatternIdx = prev.activePatternIdx;
            this.currentStep = prev.currentStep;

            this.renderOrderTimeline();
            this.renderPatternPool();
            this.renderMatrixGrid();
            this.renderInstrumentList();
            this.scheduleAudioUpdate();
        }

        applyRedo() {
            if (this.redoStack.length === 0) return;
            const next = this.redoStack.pop();
            this.saveUndoState();

            this.miner.patterns = next.patterns;
            this.miner.orderList = next.orderList;
            this.miner.instruments = next.instruments;
            this.miner.activePatternIdx = next.activePatternIdx;
            this.currentStep = next.currentStep;

            this.renderOrderTimeline();
            this.renderPatternPool();
            this.renderMatrixGrid();
            this.renderInstrumentList();
            this.scheduleAudioUpdate();
        }

        // --------------------------------------------------------------------
        // 2. MATRIX GRID & CURSOR NAVIGATION
        // --------------------------------------------------------------------
        renderMatrixGrid() {
            const table = document.getElementById("htf-grid-table");
            if (!table) return;
            table.innerHTML = "";

            const pat = this.miner.patterns[this.miner.activePatternIdx];
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
                        this.currentStep = s;
                        this.cursorTrack = t;
                        this.highlightCursor();
                        this.update6502Telemetry();

                        // Auto-select instrument for immediate keyboard playability
                        const instId = parseInt(tData.inst);
                        if (instId > 0) {
                            this.selectInstrument(instId);
                        }

                        // 100% Isolated Voice Audition
                        let durFrames = 6;
                        if (tData.dur && tData.dur.startsWith("L")) {
                            durFrames = parseInt(tData.dur.slice(1)) || 6;
                        }
                        this.audio.auditionVoiceSlice(t, this.miner.activePatternIdx, s, durFrames);
                    });

                    rowDiv.appendChild(trackCol);
                });

                table.appendChild(rowDiv);
            });

            this.highlightCursor();
        }

        highlightCursor() {
            document.querySelectorAll(".htf-row").forEach(r => r.classList.remove("playhead"));
            document.querySelectorAll(".htf-track-cell").forEach(c => c.classList.remove("cursor"));

            const curRowEl = document.getElementById(`htf-row-${this.currentStep}`);
            if (curRowEl) {
                curRowEl.classList.add("playhead");
                const curCell = curRowEl.querySelector(`.track-${this.cursorTrack}`);
                if (curCell) curCell.classList.add("cursor");
            }

            const stepBadge = document.getElementById("htf-stat-step");
            if (stepBadge) stepBadge.textContent = `STEP: ${String(this.currentStep).padStart(2, '0')} / 63`;

            const frameBadge = document.getElementById("htf-stat-frames");
            if (frameBadge) frameBadge.textContent = `FRAME: ${String(this.currentStep * this.miner.speed).padStart(4, '0')}`;
        }

        scrollToStep(stepIdx) {
            const pane = document.getElementById("matrix-scroll-pane");
            const row = document.getElementById(`htf-row-${stepIdx}`);
            if (pane && row) {
                const targetY = row.offsetTop - (pane.clientHeight / 2) + 11;
                pane.scrollTop = targetY;
            }
        }

        // --------------------------------------------------------------------
        // 3. NOTE PITCH, TIMING & DURATION EDITING
        // --------------------------------------------------------------------
        insertNoteAtCursor(noteStr) {
            if (!this.editMode) return;
            this.saveUndoState();

            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat || !pat[this.currentStep]) return;

            const inst = this.miner.instruments.find(i => i.id === this.activeInstId);
            const instStr = String(this.activeInstId).padStart(2, '0');
            const waveStr = inst ? `$${inst.wave.toString(16).toUpperCase()}` : "$41";
            const fxStr = inst ? inst.macro : "...";

            if (noteStr === "...") {
                pat[this.currentStep][`t${this.cursorTrack}`] = {
                    note: "...", dur: "L06", inst: "00", wave: "---", fx: "..."
                };
            } else if (noteStr === "===") {
                pat[this.currentStep][`t${this.cursorTrack}`] = {
                    note: "===", dur: "L06", inst: instStr, wave: "---", fx: "OFF"
                };
            } else {
                pat[this.currentStep][`t${this.cursorTrack}`] = {
                    note: noteStr,
                    dur: this.defaultDuration,
                    inst: instStr,
                    wave: waveStr,
                    fx: fxStr
                };

                // Play live audition
                this.audio.playInstrumentNote(noteStr, this.cursorTrack, this.miner.activePatternIdx, this.currentStep, noteStr, inst ? inst.wave : 0x41);
            }

            this.miner.isModified = true;
            this.renderMatrixGrid();
            this.update6502Telemetry();
            this.scheduleAudioUpdate();

            if (this.editStepJump > 0) {
                this.currentStep = Math.min(63, this.currentStep + this.editStepJump);
                this.highlightCursor();
                this.scrollToStep(this.currentStep);
            }
        }

        transposeTrack(deltaSemi) {
            this.saveUndoState();
            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat) return;

            pat.forEach(row => {
                const c = row[`t${this.cursorTrack}`];
                if (c && c.note && c.note !== "..." && c.note !== "===") {
                    const midi = window.SIDHardware.MIDI_NOTE_MAP[c.note] ? window.SIDHardware.MIDI_NOTE_MAP[c.note].midi : 60;
                    const newMidi = Math.max(12, Math.min(108, midi + deltaSemi));
                    const nName = window.SIDHardware.FREQ_NOTE_MAP[newMidi] ? window.SIDHardware.FREQ_NOTE_MAP[newMidi].name : c.note;
                    c.note = nName;
                }
            });

            this.miner.isModified = true;
            this.renderMatrixGrid();
            this.scheduleAudioUpdate();
        }

        quantizeTrack(scaleName) {
            if (scaleName === "none" || !SCALES[scaleName]) return;
            this.saveUndoState();
            const scale = SCALES[scaleName];
            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat) return;

            pat.forEach(row => {
                const c = row[`t${this.cursorTrack}`];
                if (c && c.note && c.note !== "..." && c.note !== "===") {
                    const midi = window.SIDHardware.MIDI_NOTE_MAP[c.note] ? window.SIDHardware.MIDI_NOTE_MAP[c.note].midi : 60;
                    const pitchClass = midi % 12;
                    let closest = scale[0];
                    let minDiff = Infinity;
                    scale.forEach(sPitch => {
                        const diff = Math.abs(pitchClass - sPitch);
                        if (diff < minDiff) { minDiff = diff; closest = sPitch; }
                    });
                    const newMidi = midi - pitchClass + closest;
                    const nName = window.SIDHardware.FREQ_NOTE_MAP[newMidi] ? window.SIDHardware.FREQ_NOTE_MAP[newMidi].name : c.note;
                    c.note = nName;
                }
            });

            this.miner.isModified = true;
            this.renderMatrixGrid();
            this.scheduleAudioUpdate();
        }

        reversePattern() {
            this.saveUndoState();
            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat) return;

            const tEvents = pat.map(r => ({ ...r[`t${this.cursorTrack}`] }));
            tEvents.reverse();
            pat.forEach((r, i) => { r[`t${this.cursorTrack}`] = tEvents[i]; });

            this.miner.isModified = true;
            this.renderMatrixGrid();
            this.scheduleAudioUpdate();
        }

        invertPattern() {
            this.saveUndoState();
            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat) return;

            const validNotes = pat.filter(r => r[`t${this.cursorTrack}`].note !== "..." && r[`t${this.cursorTrack}`].note !== "===");
            if (validNotes.length === 0) return;

            const centerMidi = 60; // Middle C (C-4)
            pat.forEach(row => {
                const c = row[`t${this.cursorTrack}`];
                if (c && c.note && c.note !== "..." && c.note !== "===") {
                    const midi = window.SIDHardware.MIDI_NOTE_MAP[c.note] ? window.SIDHardware.MIDI_NOTE_MAP[c.note].midi : 60;
                    const delta = midi - centerMidi;
                    const newMidi = Math.max(12, Math.min(108, centerMidi - delta));
                    const nName = window.SIDHardware.FREQ_NOTE_MAP[newMidi] ? window.SIDHardware.FREQ_NOTE_MAP[newMidi].name : c.note;
                    c.note = nName;
                }
            });

            this.miner.isModified = true;
            this.renderMatrixGrid();
            this.scheduleAudioUpdate();
        }

        // --------------------------------------------------------------------
        // 4. 3-VOICE MOS 6581 SOUND LAB & ADSR CANVAS VISUALIZER
        // --------------------------------------------------------------------
        selectInstrument(instId) {
            this.activeInstId = instId;
            document.querySelectorAll(".htf-inst-item").forEach(item => {
                item.classList.toggle("active", parseInt(item.dataset.id) === instId);
            });
            this.updateInstrumentLab(instId);
        }

        renderInstrumentList() {
            const container = document.getElementById("htf-inst-list");
            if (!container) return;
            container.innerHTML = "";

            this.miner.instruments.forEach(inst => {
                const div = document.createElement("div");
                div.className = `htf-inst-item ${inst.id === this.activeInstId ? "active" : ""}`;
                div.dataset.id = inst.id;
                div.innerHTML = `
                    <span class="i-num">#${String(inst.id).padStart(2, '0')}</span>
                    <span class="i-name">${inst.name}</span>
                    <span class="i-wave">$${inst.wave.toString(16).toUpperCase()}</span>
                `;
                div.addEventListener("click", () => this.selectInstrument(inst.id));
                container.appendChild(div);
            });
        }

        updateInstrumentLab(instId) {
            const inst = this.miner.instruments.find(i => i.id === instId);
            if (!inst) return;

            const titleEl = document.getElementById("htf-editor-title");
            if (titleEl) titleEl.textContent = `#${String(inst.id).padStart(2, '0')} ${inst.name.toUpperCase()}`;

            const pwInput = document.getElementById("htf-pw");
            if (pwInput) {
                pwInput.value = inst.pw;
                document.getElementById("lbl-htf-pw").textContent = `${inst.pw} (${Math.round((inst.pw / 4095) * 100)}%)`;
                document.getElementById("pw-duty-fill").style.width = `${(inst.pw / 4095) * 100}%`;
            }

            ["att", "dec", "sus", "rel"].forEach(p => {
                const keyMap = { att: "attack", dec: "decay", sus: "sustain", rel: "release" };
                const el = document.getElementById(`htf-${p}`);
                if (el) {
                    el.value = inst[keyMap[p]];
                    document.getElementById(`lbl-htf-${p}`).textContent = inst[keyMap[p]];
                }
            });

            document.querySelectorAll(".wave-buttons .btn-w").forEach(btn => {
                btn.classList.toggle("active", parseInt(btn.dataset.wave) === inst.wave);
            });

            const macroSel = document.getElementById("htf-macro-select");
            if (macroSel) macroSel.value = inst.macro || "none";

            const fltChk = document.getElementById("chk-filter-route");
            if (fltChk) fltChk.checked = Boolean(inst.filter);

            this.drawADSRCurve(inst.attack, inst.decay, inst.sustain, inst.release);
        }

        drawADSRCurve(a, d, s, r) {
            const canvas = document.getElementById("adsr-canvas");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5);
            ctx.stroke();

            const aW = Math.max(8, (a / 15.0) * (w * 0.25));
            const dW = Math.max(8, (d / 15.0) * (w * 0.25));
            const sH = h - ((s / 15.0) * (h - 8)) - 4;
            const sW = w * 0.25;
            const rW = Math.max(8, (r / 15.0) * (w * 0.25));

            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, h - 2);
            ctx.lineTo(aW, 4);                     // Attack Peak
            ctx.lineTo(aW + dW, sH);              // Decay to Sustain
            ctx.lineTo(aW + dW + sW, sH);         // Sustain Hold
            ctx.lineTo(aW + dW + sW + rW, h - 2); // Release
            ctx.stroke();

            // Gradient Glow Fill
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
            grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
            ctx.fillStyle = grad;
            ctx.lineTo(0, h - 2);
            ctx.fill();
        }

        // --------------------------------------------------------------------
        // 5. SONG ARRANGER & PATTERN POOL MATRIX
        // --------------------------------------------------------------------
        renderOrderTimeline() {
            const container = document.getElementById("order-slots-container");
            if (!container) return;
            container.innerHTML = "";

            const durPerPat = 64 * this.miner.speed * 0.02;

            this.miner.orderList.forEach((patIdx, idx) => {
                const density = this.miner.getPatternDensity(patIdx);
                const sectionName = SECTION_NAMES[idx % SECTION_NAMES.length];

                const slot = document.createElement("div");
                slot.className = `order-slot ${idx === this.miner.activeOrderIdx ? "active" : ""}`;
                slot.id = `order-slot-${idx}`;
                slot.dataset.order = idx;
                slot.title = `Slot #${idx} • Pattern P${String(patIdx).padStart(2, '0')} (${sectionName}) • Klicken zum Bearbeiten`;

                slot.innerHTML = `
                    <div class="os-head">
                        <span class="os-idx">#${String(idx).padStart(2, '0')}</span>
                        <span class="os-section">${sectionName}</span>
                    </div>
                    <div class="os-main">
                        <span class="os-pat-id">P${String(patIdx).padStart(2, '0')}</span>
                        <span class="os-bars">4 Takte • ${durPerPat.toFixed(1)}s</span>
                    </div>
                    <div class="os-density-bars" title="Spur-Dichte: T1 ${density.t1}%, T2 ${density.t2}%, T3 ${density.t3}%">
                        <div class="os-d-row"><div class="os-d-fill t1" style="width: ${Math.max(5, density.t1)}%"></div></div>
                        <div class="os-d-row"><div class="os-d-fill t2" style="width: ${Math.max(5, density.t2)}%"></div></div>
                        <div class="os-d-row"><div class="os-d-fill t3" style="width: ${Math.max(5, density.t3)}%"></div></div>
                    </div>
                `;

                slot.addEventListener("click", () => {
                    this.miner.activeOrderIdx = idx;
                    this.miner.activePatternIdx = patIdx;
                    const sel = document.getElementById("sel-active-pat");
                    if (sel) sel.value = patIdx;
                    this.renderOrderTimeline();
                    this.renderPatternPool();
                    this.renderMatrixGrid();
                    this.update6502Telemetry();
                });

                container.appendChild(slot);

                if (idx < this.miner.orderList.length - 1) {
                    const arr = document.createElement("span");
                    arr.className = "order-arr";
                    arr.textContent = "➔";
                    container.appendChild(arr);
                }
            });

            const loopTag = document.createElement("span");
            loopTag.className = "order-arr loop";
            loopTag.textContent = "↺ LOOP";
            container.appendChild(loopTag);

            const totalSec = this.miner.orderList.length * durPerPat;
            const totalMin = Math.floor(totalSec / 60);
            const remSec = String(Math.floor(totalSec % 60)).padStart(2, '0');
            const statEl = document.getElementById("order-sub-stat");
            if (statEl) {
                statEl.textContent = `${this.miner.orderList.length} PHRASEN • ${this.miner.orderList.length * 4} TAKTE • ${totalMin}:${remSec} MIN • ${this.miner.patterns.length} PATTERNS IM POOL`;
            }
        }

        renderPatternPool() {
            const container = document.getElementById("pattern-pool-container");
            if (!container) return;
            container.innerHTML = "";

            this.miner.patterns.forEach((pat, pIdx) => {
                const density = this.miner.getPatternDensity(pIdx);
                const item = document.createElement("div");
                item.className = `pool-item ${pIdx === this.miner.activePatternIdx ? "active" : ""}`;
                item.innerHTML = `
                    <span>P${String(pIdx).padStart(2, '0')}</span>
                    <span class="pool-notes-count">${density.total} ♫</span>
                `;
                item.title = `Pattern P${String(pIdx).padStart(2, '0')} • ${density.total} Noten • Klicken zum Laden`;

                item.addEventListener("click", () => {
                    this.miner.activePatternIdx = pIdx;
                    const sel = document.getElementById("sel-active-pat");
                    if (sel) sel.value = pIdx;
                    this.renderOrderTimeline();
                    this.renderPatternPool();
                    this.renderMatrixGrid();
                    this.update6502Telemetry();
                });

                container.appendChild(item);
            });
        }

        // --------------------------------------------------------------------
        // 6. 6502 DISASSEMBLER & 25-REGISTER TELEMETRY
        // --------------------------------------------------------------------
        update6502Telemetry() {
            const disasmEl = document.getElementById("htf-disasm-view");
            if (!disasmEl) return;

            const pat = this.miner.patterns[this.miner.activePatternIdx];
            if (!pat || !pat[this.currentStep]) return;

            const row = pat[this.currentStep];
            const v1Sid = window.SIDHardware.noteToSidVal(row.t1.note);
            const v2Sid = window.SIDHardware.noteToSidVal(row.t2.note);
            const v3Sid = window.SIDHardware.noteToSidVal(row.t3.note);

            const v1Low = (v1Sid & 0xFF).toString(16).padStart(2, '0').toUpperCase();
            const v1High = ((v1Sid >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
            const v2Low = (v2Sid & 0xFF).toString(16).padStart(2, '0').toUpperCase();
            const v2High = ((v2Sid >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
            const v3Low = (v3Sid & 0xFF).toString(16).padStart(2, '0').toUpperCase();
            const v3High = ((v3Sid >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();

            disasmEl.innerHTML = `
; ===================================================
; ROB HUBBARD 6502 SOUND DRIVER - FRAME TICK: $${(this.currentStep * this.miner.speed).toString(16).padStart(4, '0').toUpperCase()}
; PATTERN: P${String(this.miner.activePatternIdx).padStart(2, '0')} | STEP: #${String(this.currentStep).padStart(2, '0')}
; ===================================================

PLAY_ROUTINE:
    SEI                     ; Disable IRQ during SID write
    LDA #$${v1Low}          ; V1 Pitch Low  (${row.t1.note})
    STA $D400
    LDA #$${v1High}          ; V1 Pitch High
    STA $D401
    LDA #$41                ; V1 Waveform (Pulse)
    STA $D404

    LDA #$${v2Low}          ; V2 Pitch Low  (${row.t2.note})
    STA $D407
    LDA #$${v2High}          ; V2 Pitch High
    STA $D408

    LDA #$${v3Low}          ; V3 Pitch Low  (${row.t3.note})
    STA $D40E
    LDA #$${v3High}          ; V3 Pitch High
    STA $D40F

    LDA #$2F                ; Master Bandpass Filter
    STA $D418
    CLI                     ; Re-enable IRQ
    RTS
            `.trim();

            this.update25RegisterGrid(v1Low, v1High, v2Low, v2High, v3Low, v3High);
        }

        update25RegisterGrid(v1L, v1H, v2L, v2H, v3L, v3H) {
            const grid = document.getElementById("htf-reg-grid");
            if (!grid) return;

            const regDefs = [
                { a: "$D400", n: "V1_FREQ_LO", v: `$${v1L}` },
                { a: "$D401", n: "V1_FREQ_HI", v: `$${v1H}` },
                { a: "$D402", n: "V1_PW_LO",   v: "$00" },
                { a: "$D403", n: "V1_PW_HI",   v: "$08" },
                { a: "$D404", n: "V1_CTRL",    v: "$41" },
                { a: "$D405", n: "V1_AD",      v: "$09" },
                { a: "$D406", n: "V1_SR",      v: "$00" },
                { a: "$D407", n: "V2_FREQ_LO", v: `$${v2L}` },
                { a: "$D408", n: "V2_FREQ_HI", v: `$${v2H}` },
                { a: "$D409", n: "V2_PW_LO",   v: "$00" },
                { a: "$D40A", n: "V2_PW_HI",   v: "$06" },
                { a: "$D40B", n: "V2_CTRL",    v: "$41" },
                { a: "$D40C", n: "V2_AD",      v: "$04" },
                { a: "$D40D", n: "V2_SR",      v: "$00" },
                { a: "$D40E", n: "V3_FREQ_LO", v: `$${v3L}` },
                { a: "$D40F", n: "V3_FREQ_HI", v: `$${v3H}` },
                { a: "$D410", n: "V3_PW_LO",   v: "$00" },
                { a: "$D411", n: "V3_PW_HI",   v: "$00" },
                { a: "$D412", n: "V3_CTRL",    v: "$81" },
                { a: "$D413", n: "V3_AD",      v: "$00" },
                { a: "$D414", n: "V3_SR",      v: "$F0" },
                { a: "$D415", n: "FLT_CUT_LO", v: "$00" },
                { a: "$D416", n: "FLT_CUT_HI", v: "$80" },
                { a: "$D417", n: "FLT_RES_VO", v: "$F7" },
                { a: "$D418", n: "FLT_VOL_MD", v: "$2F" }
            ];

            grid.innerHTML = "";
            regDefs.forEach(r => {
                const cell = document.createElement("div");
                cell.className = "htf-reg-cell";
                cell.innerHTML = `
                    <span class="hrc-addr">${r.a}</span>
                    <span class="hrc-val">${r.v}</span>
                    <span class="hrc-name">${r.n}</span>
                `;
                grid.appendChild(cell);
            });
        }

        // --------------------------------------------------------------------
        // 7. PIANO KEYBOARD & LIVE AUDITION
        // --------------------------------------------------------------------
        renderPianoKeyboard() {
            const kb = document.getElementById("htf-piano-keyboard");
            if (!kb) return;
            kb.innerHTML = "";

            const notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
            const octaves = [this.activeOctave, this.activeOctave + 1];

            octaves.forEach(oct => {
                notes.forEach(note => {
                    const fullName = `${note}${oct}`;
                    const isSharp = note.includes("#");
                    const keyEl = document.createElement("div");
                    keyEl.className = `p-key ${isSharp ? "black" : "white"}`;
                    keyEl.dataset.note = fullName;
                    keyEl.innerHTML = `<span class="key-lbl">${fullName}</span>`;

                    keyEl.addEventListener("mousedown", () => {
                        this.insertNoteAtCursor(fullName);
                        keyEl.classList.add("pressed");
                    });

                    keyEl.addEventListener("mouseup", () => keyEl.classList.remove("pressed"));
                    keyEl.addEventListener("mouseleave", () => keyEl.classList.remove("pressed"));

                    kb.appendChild(keyEl);
                });
            });

            const octLabel = document.getElementById("lbl-cur-oct");
            if (octLabel) octLabel.textContent = `OKT: ${this.activeOctave}`;
        }

        // --------------------------------------------------------------------
        // 8. GLOBAL KEYBOARD BINDING
        // --------------------------------------------------------------------
        bindGlobalKeyboard() {
            window.addEventListener("keydown", (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

                if (e.code === "F1") {
                    e.preventDefault();
                    const m = document.getElementById("help-modal");
                    if (m) m.style.display = m.style.display === "none" ? "flex" : "none";
                    return;
                }

                // Solo / Mute Shortcuts
                if (e.code === "F9") { this.audio.setMute(1, !this.audio.voiceMute[1]); document.getElementById("btn-mute-1").classList.toggle("active", this.audio.voiceMute[1]); return; }
                if (e.code === "F10") { this.audio.setMute(2, !this.audio.voiceMute[2]); document.getElementById("btn-mute-2").classList.toggle("active", this.audio.voiceMute[2]); return; }
                if (e.code === "F11") { this.audio.setMute(3, !this.audio.voiceMute[3]); document.getElementById("btn-mute-3").classList.toggle("active", this.audio.voiceMute[3]); return; }
                if (e.code === "F12") { this.audio.resetMuteSolo(); [1, 2, 3].forEach(v => { document.getElementById(`btn-mute-${v}`).classList.remove("active"); document.getElementById(`btn-solo-${v}`).classList.remove("active"); }); return; }

                // Undo / Redo
                if (e.ctrlKey && e.code === "KeyZ") { e.preventDefault(); this.applyUndo(); return; }
                if (e.ctrlKey && e.code === "KeyY") { e.preventDefault(); this.applyRedo(); return; }

                // Transport
                if (e.code === "Space") {
                    e.preventDefault();
                    if (this.audio.isPlaying) this.audio.stopPlayback();
                    else this.audio.startPlayback(true, this.miner.activePatternIdx, this.miner.patterns.length);
                    return;
                }

                if (e.code === "Escape") {
                    this.audio.stopPlayback();
                    return;
                }

                if (e.code === "Digit1" || e.code === "CapsLock") {
                    e.preventDefault();
                    this.insertNoteAtCursor("===");
                    return;
                }

                if (e.code === "Delete" || e.code === "Backspace") {
                    e.preventDefault();
                    this.insertNoteAtCursor("...");
                    return;
                }

                // Arrow Navigation
                if (e.code === "ArrowUp") { e.preventDefault(); this.currentStep = Math.max(0, this.currentStep - 1); this.highlightCursor(); this.scrollToStep(this.currentStep); this.update6502Telemetry(); return; }
                if (e.code === "ArrowDown") { e.preventDefault(); this.currentStep = Math.min(63, this.currentStep + 1); this.highlightCursor(); this.scrollToStep(this.currentStep); this.update6502Telemetry(); return; }
                if (e.code === "ArrowLeft") { e.preventDefault(); this.cursorTrack = Math.max(1, this.cursorTrack - 1); this.highlightCursor(); this.update6502Telemetry(); return; }
                if (e.code === "ArrowRight") { e.preventDefault(); this.cursorTrack = Math.min(3, this.cursorTrack + 1); this.highlightCursor(); this.update6502Telemetry(); return; }

                // Note Typing Mapping
                if (KEYBOARD_MAP[e.code]) {
                    const baseNote = KEYBOARD_MAP[e.code];
                    const noteName = baseNote.slice(0, -1);
                    const baseOct = parseInt(baseNote.slice(-1));
                    const shiftedOct = Math.min(7, Math.max(1, baseOct + (this.activeOctave - 4)));
                    const finalNote = `${noteName}${shiftedOct}`;

                    this.insertNoteAtCursor(finalNote);
                    const keyEl = document.querySelector(`.p-key[data-note="${finalNote}"]`);
                    if (keyEl) {
                        keyEl.classList.add("pressed");
                        setTimeout(() => keyEl.classList.remove("pressed"), 180);
                    }
                }
            });
        }

        // Debounced Background Stem Re-Rendering
        scheduleAudioUpdate() {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                try {
                    const stems = await this.miner.renderStems(this.audio.audioCtx);
                    this.audio.setVoiceBuffers(stems.b1, stems.b2, stems.b3);
                } catch (e) {
                    console.error("Background audio re-render error:", e);
                }
            }, 300);
        }
    }

    // Export to Window Namespace
    window.VisualEditLayer = VisualEditLayer;

})(window);
