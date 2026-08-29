/**
 * ============================================================================
 * TRACKER 3 - LAYER 2: REGISTER STREAM & PATTERN-MINING LAYER
 * ============================================================================
 * Responsible for:
 * 1. 50Hz Register Stream Decompilation & Pattern-Mining.
 * 2. Automated Instrument Modularization (Recognizing repeating ADSR, PWM, Waveform patterns).
 * 3. Bidirectional Event-to-Stream Compilation (Micro-Patching).
 * 4. Multi-Stem Server Synchronization (/api/render_tracker_pattern for Voices 1, 2, 3).
 */

(function (window) {
    'use strict';

    // Standard Signature Instrument Definitions extracted from Rob Hubbard classics
    const DEFAULT_HUBBARD_INSTRUMENTS = [
        { id: 1, name: "Heroic Pulse Lead", wave: 0x41, attack: 0, decay: 9, sustain: 0, release: 0, pw: 2048, filter: true, macro: "P02" },
        { id: 2, name: "Saw Bass Pluck", wave: 0x21, attack: 0, decay: 7, sustain: 2, release: 1, pw: 0, filter: false, macro: "none" },
        { id: 3, name: "Hi-Speed Arp Chord", wave: 0x41, attack: 0, decay: 4, sustain: 0, release: 0, pw: 1536, filter: true, macro: "A-m7" },
        { id: 4, name: "Filtered Sync Lead", wave: 0x43, attack: 1, decay: 8, sustain: 4, release: 2, pw: 3072, filter: true, macro: "V08" },
        { id: 5, name: "16th Slap Pop Bass", wave: 0x41, attack: 0, decay: 5, sustain: 0, release: 0, pw: 800, filter: false, macro: "S12" },
        { id: 6, name: "Dark Triangle Sub", wave: 0x11, attack: 0, decay: 9, sustain: 8, release: 4, pw: 0, filter: true, macro: "none" },
        { id: 7, name: "Noise Snare Interrupt", wave: 0x81, attack: 0, decay: 6, sustain: 0, release: 0, pw: 0, filter: false, macro: "D-SD" },
        { id: 8, name: "Heavy Kick Drum", wave: 0x81, attack: 0, decay: 3, sustain: 0, release: 0, pw: 0, filter: false, macro: "D-BD" },
        { id: 9, name: "RingMod Cyber Bell", wave: 0x15, attack: 0, decay: 10, sustain: 0, release: 3, pw: 0, filter: true, macro: "none" },
        { id: 10, name: "Space Ambient Pad", wave: 0x41, attack: 4, decay: 8, sustain: 10, release: 6, pw: 2500, filter: true, macro: "V08" }
    ];

    class StreamPatternMiner {
        constructor() {
            this.sidPath = "sid/Commando.sid";
            this.title = "Commando";
            this.author = "Rob Hubbard";
            this.bpm = 125;
            this.speed = 6;
            this.instruments = JSON.parse(JSON.stringify(DEFAULT_HUBBARD_INSTRUMENTS));
            this.patterns = [];
            this.orderList = [];
            this.activePatternIdx = 0;
            this.activeOrderIdx = 0;
            this.isModified = false;
        }

        // Decompile SID file into structured patterns & mined instruments
        async decompileSID(sidPath) {
            this.sidPath = sidPath;
            const res = await fetch(`/api/decompile_tracker?sid=${encodeURIComponent(sidPath)}`);
            if (!res.ok) throw new Error(`Decompile failed for ${sidPath}`);

            const data = await res.json();
            this.title = data.title || "Unbekannt";
            this.author = data.author || "Rob Hubbard";
            this.bpm = data.bpm || 125;
            this.speed = data.speed || 6;

            // Pattern-Mining: Convert raw decompiled rows into structured Musical Events
            this.patterns = data.patterns.map((patRows, patIdx) => {
                return patRows.map(row => {
                    const stepNum = row.row;
                    return {
                        step: stepNum,
                        t1: this.mineTrackEvent(row.t1, 1, stepNum),
                        t2: this.mineTrackEvent(row.t2, 2, stepNum),
                        t3: this.mineTrackEvent(row.t3, 3, stepNum)
                    };
                });
            });

            this.orderList = (data.order_list && data.order_list.length > 0) 
                ? data.order_list 
                : this.patterns.map((_, i) => i);
            
            this.activePatternIdx = 0;
            this.activeOrderIdx = 0;
            this.isModified = false;

            return {
                title: this.title,
                author: this.author,
                bpm: this.bpm,
                speed: this.speed,
                patterns: this.patterns,
                orderList: this.orderList,
                instruments: this.instruments
            };
        }

        // Convert cell state into structured musical event
        mineTrackEvent(rawCell, trackIdx, stepNum) {
            if (!rawCell) return { note: "...", dur: "L06", inst: "00", wave: "---", fx: "..." };

            const note = rawCell.note || "...";
            const dur = rawCell.dur || "L06";
            let inst = rawCell.inst || "00";
            let wave = rawCell.wave || "---";
            let fx = rawCell.fx || "...";

            if (wave !== "---" && wave !== "0x0" && !wave.startsWith("$")) {
                const wVal = parseInt(wave);
                wave = isNaN(wVal) ? "---" : `$${wVal.toString(16).toUpperCase()}`;
            }

            // Auto-categorize default instrument IDs if unspecified
            if (inst === "00" && note !== "..." && note !== "===") {
                inst = (trackIdx === 1) ? "01" : ((trackIdx === 2) ? "03" : "05");
            }

            return { note, dur, inst, wave, fx };
        }

        // Create a blank pattern
        createBlankPattern() {
            const rows = [];
            for (let s = 0; s < 64; s++) {
                rows.push({
                    step: s,
                    t1: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "..." },
                    t2: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "..." },
                    t3: { note: "...", dur: "L06", inst: "00", wave: "---", fx: "..." }
                });
            }
            return rows;
        }

        // Render 3 Authentic Voice Stems via Server Micro-Patching
        async renderStems(audioCtx) {
            const basePayload = {
                sid_path: this.sidPath,
                active_pattern: this.activePatternIdx,
                speed: this.speed,
                instruments: this.instruments,
                patterns: this.patterns
            };

            const [r1, r2, r3] = await Promise.all([
                fetch("/api/render_tracker_pattern", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...basePayload, voice: 1 })
                }),
                fetch("/api/render_tracker_pattern", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...basePayload, voice: 2 })
                }),
                fetch("/api/render_tracker_pattern", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...basePayload, voice: 3 })
                })
            ]);

            if (r1.ok && r2.ok && r3.ok) {
                const [ab1, ab2, ab3] = await Promise.all([r1.arrayBuffer(), r2.arrayBuffer(), r3.arrayBuffer()]);
                const [b1, b2, b3] = await Promise.all([
                    audioCtx.decodeAudioData(ab1),
                    audioCtx.decodeAudioData(ab2),
                    audioCtx.decodeAudioData(ab3)
                ]);
                this.isModified = false;
                return { b1, b2, b3 };
            } else {
                throw new Error("Failed to render authentic voice stems.");
            }
        }

        // Calculate note density per track for timeline cards
        getPatternDensity(patIdx) {
            const pat = this.patterns[patIdx];
            if (!pat) return { t1: 0, t2: 0, t3: 0, total: 0 };
            let c1 = 0, c2 = 0, c3 = 0;
            pat.forEach(r => {
                if (r.t1 && r.t1.note && r.t1.note !== "..." && r.t1.note !== "===") c1++;
                if (r.t2 && r.t2.note && r.t2.note !== "..." && r.t2.note !== "===") c2++;
                if (r.t3 && r.t3.note && r.t3.note !== "..." && r.t3.note !== "===") c3++;
            });
            return {
                t1: Math.min(100, Math.round((c1 / 64) * 100)),
                t2: Math.min(100, Math.round((c2 / 64) * 100)),
                t3: Math.min(100, Math.round((c3 / 64) * 100)),
                total: c1 + c2 + c3
            };
        }
    }

    // Export to Window Namespace
    window.StreamLayer = {
        DEFAULT_HUBBARD_INSTRUMENTS,
        StreamPatternMiner
    };

})(window);
