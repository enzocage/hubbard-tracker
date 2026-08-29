# 🕹️ Rob Hubbard SID Tracker & Remix Studio (HTF Studio Pro)

A cycle-accurate **Commodore 64 MOS 6581 SID Music Workstation, 6502 Bytecode Decompiler, and Chiptune Tracker** built specifically for the compositions of legendary Commodore 64 composer **Rob Hubbard**.

![HTF Studio Pro](https://img.shields.io/badge/6502-Cycle--Accurate-00f0ff?style=for-the-badge)
![MOS 6581](https://img.shields.io/badge/Audio-MOS%206581%2044.1kHz-4ade80?style=for-the-badge)
![PAL 50Hz](https://img.shields.io/badge/Timing-PAL%2050.0Hz-fbbf24?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-HTF%20v1.0-f43f5e?style=for-the-badge)

---

## 🌟 Key Features

### 1. 🚀 Hubbard Tracker 3 (`tracker3.html`) — Modular 3-Tier Architecture
* **Layer 1: SID Hardware & Multitrack Audio Engine (`js/sid_layer.js`):** 3-Stem synchronized Web Audio routing, MOS 6581 filter & saturation modeling, PAL 50Hz / NTSC 60Hz timing, and 100% C64 PSID v2 export.
* **Layer 2: Register Stream & Pattern-Miner Layer (`js/stream_layer.js`):** 50Hz register stream analysis, automated instrument modularization (mining ADSR, PWM, and Waveform cycles), and bidirectional micro-patching.
* **Layer 3: Visual & Interactive Edit Layer (`js/visual_edit_layer.js`):** High-precision note pitch, timing, duration and 3-voice instrument editing with instant isolated voice audition and live keyboard playback.
* **Full Song Arranger & Timeline Matrix:** 8-pattern timeline cards with 3-track sparkline note density and interactive pattern pool.
* **Draggable Splitters & Responsive Layout:** Resizable panels, double-click collapse toggles, and responsive tablet/mobile layouts.

### 2. 🎛️ HTF Studio Pro v2 (`tracker2.html`) — Native Hubbard Tracker Format
* HTF v1.0 5-Field Cell Architecture `[ NOTE | DUR | INST | WAVE | FX ]`, 6502 bytecode telemetry, and acoustic WYSIWYG editing.

### 3. 🎛️ Ableton-Style Remix DAW Studio (`index.html`)
* Multi-track modular score analyzer and 4-Lane signalflow matrix.
* Sub-pattern slicing, hybrid song splicing, and live 50-Criteria analyzer.

---

## 🎼 Included Rob Hubbard SIDs (21 Masterpieces)

1. **Commando** (1985)
2. **Monty on the Run** (1985)
3. **Delta** (1987)
4. **International Karate +** (1987)
5. **Crazy Comets** (1985)
6. **Sanxion** (1986)
7. **Spellbound** (1985)
8. **Warhawk** (1986)
9. **Master of Magic** (1985)
10. **Zoids** (1985)
11. **Flash Gordon** (1986)
12. **Lightforce** (1986)
13. **Nemesis the Warlock** (1987)
14. **The Last V8** (1985)
15. **I-Ball** (1987)
16. **Knucklebusters** (1986)
17. **Mega Apocalypse** (1987)
18. **Kentilla** (1986)
19. **Chimera** (1985)
20. **The Human Race** (1985)
21. **Thrust** (1986)

---

## 🚀 Quick Start

### 1. Requirements
* Python 3.8+ (with `numpy`)
* Any modern web browser (Chrome, Firefox, Edge, Safari)

### 2. Launch the Workstation Server
```bash
python player_server.py
```

### 3. Open in Browser
* **Hubbard Tracker 3 (New Modular Workstation):** [http://localhost:8080/tracker3.html](http://localhost:8080/tracker3.html)
* **HTF Studio Pro v2:** [http://localhost:8080/tracker2.html](http://localhost:8080/tracker2.html)
* **Ableton Live Remix Studio:** [http://localhost:8080/](http://localhost:8080/)

---

## 📖 Technical Documentation

* [HTF Format Specification (`htf-spezifikation.md`)](htf-spezifikation.md) — Specification of the Hubbard Tracker Format v1.0.
* [SID Internal Architecture (`sid-struktur.md`)](sid-struktur.md) — 6502 machine code state machine vs tracker paradigm.
* [Commando Score Analysis (`struktur.md`)](struktur.md) — Multi-track modular score analysis.

---

## 📜 License
MIT License. Created with love for 8-bit chiptune music and the legacy of Rob Hubbard.
