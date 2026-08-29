# 🕹️ Rob Hubbard SID Tracker & Remix Studio (HTF Studio Pro)

A cycle-accurate **Commodore 64 MOS 6581 SID Music Workstation, 6502 Bytecode Decompiler, and Chiptune Tracker** built specifically for the compositions of legendary Commodore 64 composer **Rob Hubbard**.

![HTF Studio Pro](https://img.shields.io/badge/6502-Cycle--Accurate-00f0ff?style=for-the-badge)
![MOS 6581](https://img.shields.io/badge/Audio-MOS%206581%2044.1kHz-4ade80?style=for-the-badge)
![PAL 50Hz](https://img.shields.io/badge/Timing-PAL%2050.0Hz-fbbf24?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-HTF%20v1.0-f43f5e?style=for-the-badge)

---

## 🌟 Key Features

### 1. 🌟 Hubbard Motif Tracker 4 (`tracker4.html`) — Pattern-Centric Reusable Motif Workstation
* **Pattern & Motif Decomposer:** Automatically splits continuous 3-voice SID compositions into reusable atomic motifs (`M01`, `M02` Melody Lead, `A01`, `A02` Arpeggios, `B01`, `D01` Bass & Drum Riffs).
* **3-Voice Multi-Track Arranger Timeline:** 3 independent horizontal lanes with colored motif blocks, duration metrics, solo/mute controls, and real-time VU-meters.
* **Modular Motif & Pitch Matrix Editor:** Visual step-by-step pitch grid with instant transposition (±1 / ±12), scale quantization, reverse/invert, and single-voice acoustic WYSIWYG audition.
* **Integrated MOS 6581 Sound Sculptor:** Real-time waveform matrix ($41, $21, $11, $81, $15, $43), pulse width duty cycle meter, ADSR envelope canvas, and sub-tick macro arpeggios.
* **Live Piano & PC Keyboard Mapping:** Play and record with the active motif's authentic instrument across all octaves.

### 2. 🚀 Hubbard Tracker 3 (`tracker3.html`) — Modular 3-Tier Layered Architecture
* Layer 1 (SID Hardware & Audio), Layer 2 (Stream & Pattern Mining), Layer 3 (Visual Editor & Resizable Splitters).

### 3. 🎛️ HTF Studio Pro v2 (`tracker2.html`) — Native Hubbard Tracker Format
* HTF v1.0 5-Field Cell Architecture `[ NOTE | DUR | INST | WAVE | FX ]`, 6502 bytecode telemetry.

### 4. 🎛️ Ableton-Style Remix DAW Studio (`index.html`)
* Multi-track modular score analyzer and 4-Lane signalflow matrix.

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
