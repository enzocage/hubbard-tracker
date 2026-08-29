# 🕹️ Rob Hubbard SID Tracker & Remix Studio (HTF Studio Pro)

A cycle-accurate **Commodore 64 MOS 6581 SID Music Workstation, 6502 Bytecode Decompiler, and Chiptune Tracker** built specifically for the compositions of legendary Commodore 64 composer **Rob Hubbard**.

![HTF Studio Pro](https://img.shields.io/badge/6502-Cycle--Accurate-00f0ff?style=for-the-badge)
![MOS 6581](https://img.shields.io/badge/Audio-MOS%206581%2044.1kHz-4ade80?style=for-the-badge)
![PAL 50Hz](https://img.shields.io/badge/Timing-PAL%2050.0Hz-fbbf24?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-HTF%20v1.0-f43f5e?style=for-the-badge)

---

## 🌟 Key Features

### 1. 🚀 HTF Studio Pro (`tracker2.html`) — Native Hubbard Tracker Format
* **HTF v1.0 5-Field Cell Architecture:** `[ NOTE | DUR | INST | WAVE | MACRO ]`
* **Real-Time 6502 Bytecode Disassembler:** Live assembly translation (`LDA`, `STA $D400`, `.byte $..`) as you compose or edit notes.
* **100% Bit-Exact MOS 6581 Software Synthesis:** 44.1 kHz PCM rendering of all 19 Rob Hubbard SIDs with sub-tick arpeggios, pitch scoops, and Galois LFSR noise drums.
* **Multi-Voice Solo & Mute with VU-Meters:** Independent muting and soloing for Track 1 (Lead), Track 2 (Arpeggios), and Track 3 (Bass & Drums).
* **20 Rob Hubbard Signature Presets & Sound Lab:**
  * *Commando Lead*, *Monty Hi-Speed Violin*, *Delta Space Arp*, *IK+ Slap Bass*, *Sanxion Snare*, *Crazy Comets Laser*, *Spellbound Dark Sub*, *Magic Flute*, *Lightforce m11 Arp*, *Warhawk Kick*, *Knucklebusters RingMod*...
* **Interactive ADSR Canvas & PWM LFO:** Real-time visual envelope curve with millisecond readout and pulse width duty cycle meter.
* **Modular Song Arranger & Timeline Matrix:** Drag, reorder, duplicate, and chain modular pattern phrases (`P00`, `P01`, `P02`...).
* **Web MIDI API Integration:** Connect any USB MIDI master keyboard and play SID instruments live.
* **5 Visual Color Themes:** *Cyber Slate*, *FastTracker II Retro*, *C64 Classic Blue*, *Matrix Green*, *Dracula Pro Studio*.
* **Multi-Format Export Suite:** `.SID` (C64 Binary), `.HTF` (JSON Project), `.MID` (Standard MIDI File for Ableton/FL Studio), `.WAV` (44.1kHz Audio), `.STEMS` (Separate voice WAVs).

### 2. 🎛️ Ableton-Style Remix DAW Studio (`index.html`)
* Multi-track modular score analyzer and 4-Lane signalflow matrix.
* Sub-pattern slicing, hybrid song splicing, and live 50-Criteria analyzer.
* X-Ray inspector revealing raw $D400–$D418 hardware registers.

### 3. 💾 Classical 3-Track SID Tracker (`tracker.html`)
* 64-Row FastTracker II style editor with octave shift, transpose tools, and interactive 6581 filters.

---

## 🎼 Included Rob Hubbard SIDs (19 Masterpieces)

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
* **HTF Studio Pro (New Tracker):** [http://localhost:8080/tracker2.html](http://localhost:8080/tracker2.html)
* **Classical SID Tracker:** [http://localhost:8080/tracker.html](http://localhost:8080/tracker.html)
* **Ableton Live Remix Studio:** [http://localhost:8080/](http://localhost:8080/)

---

## 📖 Technical Documentation

* [HTF Format Specification (`htf-spezifikation.md`)](htf-spezifikation.md) — Specification of the Hubbard Tracker Format v1.0.
* [SID Internal Architecture (`sid-struktur.md`)](sid-struktur.md) — 6502 machine code state machine vs tracker paradigm.
* [Commando Score Analysis (`struktur.md`)](struktur.md) — Multi-track modular score analysis.

---

## 📜 License
MIT License. Created with love for 8-bit chiptune music and the legacy of Rob Hubbard.
