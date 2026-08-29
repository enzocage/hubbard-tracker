/**
 * ============================================================================
 * HUBBARD TRACKER 3 - MAIN APPLICATION CONTROLLER
 * ============================================================================
 * Coordinates:
 * - Layer 1: SID Hardware & Multitrack Web Audio Engine (js/sid_layer.js)
 * - Layer 2: Register Stream & Pattern-Mining Layer (js/stream_layer.js)
 * - Layer 3: Visual & Interactive Edit Layer (js/visual_edit_layer.js)
 */

(function () {
    'use strict';

    // Instantiate 3-Tier Layer Architecture
    const audioEngine = new window.SIDHardware.SIDAudioEngine();
    const streamMiner = new window.StreamLayer.StreamPatternMiner();
    const visualEditor = new window.VisualEditLayer(streamMiner, audioEngine);

    // Wire Real-Time Audio Playhead Callbacks
    audioEngine.onStepChange = function (stepIdx, patIdx, totalFrames) {
        visualEditor.currentStep = stepIdx;
        visualEditor.highlightCursor();
        visualEditor.scrollToStep(stepIdx);
        visualEditor.update6502Telemetry();

        // Highlight playing timeline slot
        if (audioEngine.isSongMode) {
            document.querySelectorAll(".order-slot").forEach((el, idx) => {
                el.classList.toggle("playing", idx === patIdx);
            });
        }
    };

    audioEngine.onPatternChange = function (patIdx) {
        if (patIdx !== streamMiner.activePatternIdx) {
            streamMiner.activePatternIdx = patIdx;
            const sel = document.getElementById("sel-active-pat");
            if (sel) sel.value = patIdx;
            visualEditor.renderOrderTimeline();
            visualEditor.renderPatternPool();
            visualEditor.renderMatrixGrid();
        }
    };

    // ------------------------------------------------------------------------
    // OSCILLOSCOPE & SPECTRUM VISUALIZER
    // ------------------------------------------------------------------------
    function startScope() {
        const canvas = document.getElementById("htf-scope-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        function drawScope() {
            requestAnimationFrame(drawScope);
            if (!audioEngine.analyserNode) {
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, w, h);
                return;
            }

            audioEngine.analyserNode.getByteTimeDomainData(audioEngine.analyserDataArray);
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, w, h);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#38bdf8";

            ctx.beginPath();
            const sliceWidth = (w * 1.0) / audioEngine.analyserDataArray.length;
            let x = 0;

            for (let i = 0; i < audioEngine.analyserDataArray.length; i++) {
                const v = audioEngine.analyserDataArray[i] / 128.0;
                const y = (v * h) / 2.0;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }

            ctx.lineTo(w, h / 2.0);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        drawScope();
    }

    // ------------------------------------------------------------------------
    // RESIZABLE SPLITTERS & RESPONSIVE PANELS
    // ------------------------------------------------------------------------
    function initSplitters() {
        const leftPanel = document.getElementById("htf-left-panel");
        const rightPanel = document.getElementById("htf-right-panel");
        const resizerLeft = document.getElementById("resizer-left");
        const resizerRight = document.getElementById("resizer-right");
        const btnCollapseLeft = document.getElementById("btn-collapse-left");
        const btnCollapseRight = document.getElementById("btn-collapse-right");
        const respTabs = document.querySelectorAll(".resp-tab");

        if (resizerLeft && leftPanel) {
            let isDragging = false, startX = 0, startW = 0;
            resizerLeft.addEventListener("mousedown", (e) => {
                isDragging = true; startX = e.clientX; startW = leftPanel.offsetWidth;
                resizerLeft.classList.add("dragging");
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
            });

            resizerLeft.addEventListener("dblclick", () => {
                leftPanel.classList.toggle("collapsed");
                if (btnCollapseLeft) btnCollapseLeft.textContent = leftPanel.classList.contains("collapsed") ? "▶" : "◀";
            });

            window.addEventListener("mousemove", (e) => {
                if (!isDragging) return;
                const newW = Math.max(160, Math.min(650, startW + (e.clientX - startX)));
                leftPanel.style.width = `${newW}px`;
                leftPanel.classList.remove("collapsed");
                if (btnCollapseLeft) btnCollapseLeft.textContent = "◀";
            });

            window.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    resizerLeft.classList.remove("dragging");
                    document.body.style.cursor = "";
                    document.body.style.userSelect = "";
                }
            });
        }

        if (resizerRight && rightPanel) {
            let isDragging = false, startX = 0, startW = 0;
            resizerRight.addEventListener("mousedown", (e) => {
                isDragging = true; startX = e.clientX; startW = rightPanel.offsetWidth;
                resizerRight.classList.add("dragging");
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
            });

            resizerRight.addEventListener("dblclick", () => {
                rightPanel.classList.toggle("collapsed");
                if (btnCollapseRight) btnCollapseRight.textContent = rightPanel.classList.contains("collapsed") ? "◀" : "▶";
            });

            window.addEventListener("mousemove", (e) => {
                if (!isDragging) return;
                const newW = Math.max(160, Math.min(650, startW + (startX - e.clientX)));
                rightPanel.style.width = `${newW}px`;
                rightPanel.classList.remove("collapsed");
                if (btnCollapseRight) btnCollapseRight.textContent = "▶";
            });

            window.addEventListener("mouseup", () => {
                if (isDragging) {
                    isDragging = false;
                    resizerRight.classList.remove("dragging");
                    document.body.style.cursor = "";
                    document.body.style.userSelect = "";
                }
            });
        }

        if (btnCollapseLeft && leftPanel) {
            btnCollapseLeft.addEventListener("click", () => {
                leftPanel.classList.toggle("collapsed");
                btnCollapseLeft.textContent = leftPanel.classList.contains("collapsed") ? "▶" : "◀";
            });
        }

        if (btnCollapseRight && rightPanel) {
            btnCollapseRight.addEventListener("click", () => {
                rightPanel.classList.toggle("collapsed");
                btnCollapseRight.textContent = rightPanel.classList.contains("collapsed") ? "◀" : "▶";
            });
        }

        respTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                respTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                const view = tab.dataset.view;
                document.body.classList.remove("view-tracker", "view-instruments", "view-disasm");
                if (view !== "all") {
                    document.body.classList.add(`view-${view}`);
                }
            });
        });
    }

    // ------------------------------------------------------------------------
    // LOAD SID PROJECT
    // ------------------------------------------------------------------------
    async function loadSID(sidPath) {
        try {
            audioEngine.stopPlayback();
            const subInfo = document.getElementById("htf-sub-info");
            if (subInfo) subInfo.textContent = "DECOMPILIERE 50Hz SID & EXTRAHIERE INSTRUMENTE...";

            const project = await streamMiner.decompileSID(sidPath);

            if (subInfo) subInfo.textContent = `${project.title.toUpperCase()} • ${project.author} (1985) • 3 Voices PAL 50Hz`;
            document.getElementById("inp-bpm").value = project.bpm;
            document.getElementById("inp-speed").value = project.speed;

            audioEngine.bpm = project.bpm;
            audioEngine.speed = project.speed;

            // Populate Pattern Selector
            const patSelect = document.getElementById("sel-active-pat");
            if (patSelect) {
                patSelect.innerHTML = "";
                project.patterns.forEach((_, idx) => {
                    const opt = document.createElement("option");
                    opt.value = idx;
                    opt.textContent = `P${String(idx).padStart(2, '0')}: Phrase ${idx + 1}`;
                    patSelect.appendChild(opt);
                });
            }

            visualEditor.initUI();

            // Render and load 3 authentic stems
            const stems = await streamMiner.renderStems(audioEngine.audioCtx || new (window.AudioContext || window.webkitAudioContext)());
            audioEngine.init();
            audioEngine.setVoiceBuffers(stems.b1, stems.b2, stems.b3);
        } catch (e) {
            console.error(e);
            alert("Fehler beim Laden: " + e.message);
        }
    }

    // ------------------------------------------------------------------------
    // INITIALIZATION ON DOM READY
    // ------------------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", () => {
        initSplitters();
        startScope();

        // Load Default Commando SID
        loadSID("sid/Commando.sid");

        // SID Selector
        const sidSelect = document.getElementById("htf-sid-select");
        if (sidSelect) {
            sidSelect.addEventListener("change", (e) => {
                loadSID(e.target.value);
            });
        }

        // Transport Buttons
        document.getElementById("btn-play-song").addEventListener("click", () => {
            audioEngine.startPlayback(true, streamMiner.activePatternIdx, streamMiner.patterns.length);
        });

        document.getElementById("btn-play-pat").addEventListener("click", () => {
            audioEngine.startPlayback(false, streamMiner.activePatternIdx, streamMiner.patterns.length);
        });

        document.getElementById("btn-stop").addEventListener("click", () => {
            audioEngine.stopPlayback();
        });

        document.getElementById("btn-rec-mode").addEventListener("click", (e) => {
            visualEditor.editMode = !visualEditor.editMode;
            e.currentTarget.classList.toggle("active", visualEditor.editMode);
        });

        // Solo & Mute Buttons
        [1, 2, 3].forEach(v => {
            const btnM = document.getElementById(`btn-mute-${v}`);
            const btnS = document.getElementById(`btn-solo-${v}`);

            btnM.addEventListener("click", () => {
                audioEngine.setMute(v, !audioEngine.voiceMute[v]);
                btnM.classList.toggle("active", audioEngine.voiceMute[v]);
            });

            btnS.addEventListener("click", () => {
                audioEngine.setSolo(v, !audioEngine.voiceSolo[v]);
                btnS.classList.toggle("active", audioEngine.voiceSolo[v]);
            });
        });

        // BPM, Speed, Clock, Octave, Step Jump
        document.getElementById("inp-bpm").addEventListener("input", (e) => {
            const bpm = parseInt(e.target.value) || 125;
            streamMiner.bpm = bpm;
            audioEngine.setBpm(bpm);
        });

        document.getElementById("inp-speed").addEventListener("input", (e) => {
            const spd = parseInt(e.target.value) || 6;
            streamMiner.speed = spd;
            audioEngine.setSpeed(spd);
            visualEditor.renderOrderTimeline();
        });

        document.getElementById("sel-clock").addEventListener("change", (e) => {
            audioEngine.setClock(e.target.value);
        });

        document.getElementById("inp-octave").addEventListener("input", (e) => {
            visualEditor.activeOctave = Math.max(1, Math.min(7, parseInt(e.target.value) || 4));
            visualEditor.renderPianoKeyboard();
        });

        document.getElementById("inp-step").addEventListener("input", (e) => {
            visualEditor.editStepJump = Math.max(0, Math.min(16, parseInt(e.target.value) || 1));
        });

        document.getElementById("sel-default-dur").addEventListener("change", (e) => {
            visualEditor.defaultDuration = e.target.value;
        });

        document.getElementById("sel-active-pat").addEventListener("change", (e) => {
            streamMiner.activePatternIdx = parseInt(e.target.value) || 0;
            visualEditor.renderOrderTimeline();
            visualEditor.renderPatternPool();
            visualEditor.renderMatrixGrid();
            visualEditor.update6502Telemetry();
        });

        // Arranger Buttons
        document.getElementById("btn-add-order").addEventListener("click", () => {
            visualEditor.saveUndoState();
            streamMiner.orderList.push(streamMiner.activePatternIdx);
            visualEditor.renderOrderTimeline();
        });

        document.getElementById("btn-dup-order").addEventListener("click", () => {
            visualEditor.saveUndoState();
            const cur = streamMiner.orderList[streamMiner.activeOrderIdx];
            streamMiner.orderList.splice(streamMiner.activeOrderIdx + 1, 0, cur);
            visualEditor.renderOrderTimeline();
        });

        document.getElementById("btn-del-order").addEventListener("click", () => {
            if (streamMiner.orderList.length > 1) {
                visualEditor.saveUndoState();
                streamMiner.orderList.splice(streamMiner.activeOrderIdx, 1);
                streamMiner.activeOrderIdx = Math.max(0, streamMiner.activeOrderIdx - 1);
                visualEditor.renderOrderTimeline();
            }
        });

        document.getElementById("btn-move-left").addEventListener("click", () => {
            if (streamMiner.activeOrderIdx > 0) {
                visualEditor.saveUndoState();
                const cur = streamMiner.orderList[streamMiner.activeOrderIdx];
                streamMiner.orderList[streamMiner.activeOrderIdx] = streamMiner.orderList[streamMiner.activeOrderIdx - 1];
                streamMiner.orderList[streamMiner.activeOrderIdx - 1] = cur;
                streamMiner.activeOrderIdx--;
                visualEditor.renderOrderTimeline();
            }
        });

        document.getElementById("btn-move-right").addEventListener("click", () => {
            if (streamMiner.activeOrderIdx < streamMiner.orderList.length - 1) {
                visualEditor.saveUndoState();
                const cur = streamMiner.orderList[streamMiner.activeOrderIdx];
                streamMiner.orderList[streamMiner.activeOrderIdx] = streamMiner.orderList[streamMiner.activeOrderIdx + 1];
                streamMiner.orderList[streamMiner.activeOrderIdx + 1] = cur;
                streamMiner.activeOrderIdx++;
                visualEditor.renderOrderTimeline();
            }
        });

        document.getElementById("btn-new-pattern").addEventListener("click", () => {
            visualEditor.saveUndoState();
            const newPatIdx = streamMiner.patterns.length;
            streamMiner.patterns.push(streamMiner.createBlankPattern());
            streamMiner.activePatternIdx = newPatIdx;

            const sel = document.getElementById("sel-active-pat");
            const opt = document.createElement("option");
            opt.value = newPatIdx;
            opt.textContent = `P${String(newPatIdx).padStart(2, '0')}: Neue Phrase`;
            sel.appendChild(opt);
            sel.value = newPatIdx;

            visualEditor.renderOrderTimeline();
            visualEditor.renderPatternPool();
            visualEditor.renderMatrixGrid();
            visualEditor.update6502Telemetry();
            visualEditor.scheduleAudioUpdate();
        });

        // Toolkit Buttons
        document.getElementById("btn-undo").addEventListener("click", () => visualEditor.applyUndo());
        document.getElementById("btn-redo").addEventListener("click", () => visualEditor.applyRedo());
        document.getElementById("btn-trans-trk-up").addEventListener("click", () => visualEditor.transposeTrack(1));
        document.getElementById("btn-trans-trk-dn").addEventListener("click", () => visualEditor.transposeTrack(-1));
        document.getElementById("btn-trans-oct-up").addEventListener("click", () => visualEditor.transposeTrack(12));
        document.getElementById("btn-trans-oct-dn").addEventListener("click", () => visualEditor.transposeTrack(-12));
        document.getElementById("btn-apply-scale").addEventListener("click", () => visualEditor.quantizeTrack(document.getElementById("sel-quantize").value));
        document.getElementById("btn-reverse-pat").addEventListener("click", () => visualEditor.reversePattern());
        document.getElementById("btn-invert-pat").addEventListener("click", () => visualEditor.invertPattern());
        document.getElementById("btn-insert-noteoff").addEventListener("click", () => visualEditor.insertNoteAtCursor("==="));
        document.getElementById("btn-clear-pat").addEventListener("click", () => {
            if (confirm("Möchten Sie das gesamte Pattern wirklich leeren?")) {
                visualEditor.saveUndoState();
                streamMiner.patterns[streamMiner.activePatternIdx] = streamMiner.createBlankPattern();
                visualEditor.renderMatrixGrid();
                visualEditor.scheduleAudioUpdate();
            }
        });

        // Copy / Paste Track
        document.getElementById("btn-copy-trk").addEventListener("click", () => {
            const pat = streamMiner.patterns[streamMiner.activePatternIdx];
            visualEditor.clipboardTrack = pat.map(r => ({ ...r[`t${visualEditor.cursorTrack}`] }));
        });

        document.getElementById("btn-paste-trk").addEventListener("click", () => {
            if (!visualEditor.clipboardTrack) return;
            visualEditor.saveUndoState();
            const pat = streamMiner.patterns[streamMiner.activePatternIdx];
            pat.forEach((r, i) => { r[`t${visualEditor.cursorTrack}`] = { ...visualEditor.clipboardTrack[i] }; });
            visualEditor.renderMatrixGrid();
            visualEditor.scheduleAudioUpdate();
        });

        // Sound Lab Controls
        document.getElementById("htf-pw").addEventListener("input", (e) => {
            const v = parseInt(e.target.value);
            const inst = streamMiner.instruments.find(i => i.id === visualEditor.activeInstId);
            if (inst) inst.pw = v;
            document.getElementById("lbl-htf-pw").textContent = `${v} (${Math.round((v / 4095) * 100)}%)`;
            document.getElementById("pw-duty-fill").style.width = `${(v / 4095) * 100}%`;
            visualEditor.scheduleAudioUpdate();
        });

        ["att", "dec", "sus", "rel"].forEach(param => {
            document.getElementById(`htf-${param}`).addEventListener("input", (e) => {
                const v = parseInt(e.target.value);
                const inst = streamMiner.instruments.find(i => i.id === visualEditor.activeInstId);
                const keyMap = { att: "attack", dec: "decay", sus: "sustain", rel: "release" };
                if (inst) inst[keyMap[param]] = v;
                document.getElementById(`lbl-htf-${param}`).textContent = v;
                visualEditor.drawADSRCurve(inst.attack, inst.decay, inst.sustain, inst.release);
                visualEditor.scheduleAudioUpdate();
            });
        });

        document.querySelectorAll(".wave-buttons .btn-w").forEach(btn => {
            btn.addEventListener("click", () => {
                const w = parseInt(btn.dataset.wave);
                const inst = streamMiner.instruments.find(i => i.id === visualEditor.activeInstId);
                if (inst) inst.wave = w;
                visualEditor.selectInstrument(inst.id);
                visualEditor.scheduleAudioUpdate();
            });
        });

        // Master Filter & Saturation Controls
        document.getElementById("htf-flt-cutoff").addEventListener("input", (e) => {
            const cut = parseInt(e.target.value) || 1024;
            const res = parseInt(document.getElementById("htf-flt-res").value) || 14;
            const mode = document.getElementById("htf-flt-mode").value;
            audioEngine.setMasterFilter(mode, cut, res);
        });

        document.getElementById("htf-flt-res").addEventListener("input", (e) => {
            const res = parseInt(e.target.value) || 14;
            const cut = parseInt(document.getElementById("htf-flt-cutoff").value) || 1024;
            const mode = document.getElementById("htf-flt-mode").value;
            audioEngine.setMasterFilter(mode, cut, res);
        });

        document.getElementById("htf-flt-mode").addEventListener("change", (e) => {
            const mode = e.target.value;
            const cut = parseInt(document.getElementById("htf-flt-cutoff").value) || 1024;
            const res = parseInt(document.getElementById("htf-flt-res").value) || 14;
            audioEngine.setMasterFilter(mode, cut, res);
        });

        document.getElementById("htf-master-drive").addEventListener("input", (e) => {
            audioEngine.setMasterDrive(parseInt(e.target.value) || 3);
        });

        document.getElementById("htf-master-vol").addEventListener("input", (e) => {
            audioEngine.setMasterVolume(parseInt(e.target.value) || 85);
        });

        // Octave Switcher
        document.getElementById("btn-oct-dn").addEventListener("click", () => {
            visualEditor.activeOctave = Math.max(1, visualEditor.activeOctave - 1);
            document.getElementById("inp-octave").value = visualEditor.activeOctave;
            visualEditor.renderPianoKeyboard();
        });

        document.getElementById("btn-oct-up").addEventListener("click", () => {
            visualEditor.activeOctave = Math.min(7, visualEditor.activeOctave + 1);
            document.getElementById("inp-octave").value = visualEditor.activeOctave;
            visualEditor.renderPianoKeyboard();
        });

        // Themes
        document.getElementById("sel-theme").addEventListener("change", (e) => {
            document.body.setAttribute("data-theme", e.target.value);
        });

        // Help Modal
        document.getElementById("btn-help").addEventListener("click", () => {
            const m = document.getElementById("help-modal");
            m.style.display = m.style.display === "none" ? "flex" : "none";
        });
        document.getElementById("btn-close-help").addEventListener("click", () => {
            document.getElementById("help-modal").style.display = "none";
        });

        // Export Actions
        document.getElementById("btn-export-sid").addEventListener("click", () => {
            const psidData = window.SIDHardware.buildPSIDFile(
                streamMiner.title, streamMiner.author, "1985", streamMiner.patterns, streamMiner.speed
            );
            const blob = new Blob([psidData], { type: "application/octet-stream" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${streamMiner.title.replace(/\s+/g, '_')}_RobHubbard.sid`;
            a.click();
        });

        document.getElementById("btn-export-htf").addEventListener("click", () => {
            const htfData = {
                title: streamMiner.title,
                author: streamMiner.author,
                bpm: streamMiner.bpm,
                speed: streamMiner.speed,
                instruments: streamMiner.instruments,
                order_list: streamMiner.orderList,
                patterns: streamMiner.patterns
            };
            const blob = new Blob([JSON.stringify(htfData, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${streamMiner.title.replace(/\s+/g, '_')}.htf`;
            a.click();
        });

        document.getElementById("btn-export-wav").addEventListener("click", async () => {
            const sid = document.getElementById("htf-sid-select").value;
            window.location.href = `/api/render?sid=${encodeURIComponent(sid)}&v1=1&v2=1&v3=1&start=0&end=2400`;
        });
    });

})();
