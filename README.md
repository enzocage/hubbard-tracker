# 🕹️ Rob Hubbard SID Tracker & Master Studio (HTF Studio Pro)

Eine **zyklengenaue Commodore 64 MOS 6581 SID Musik-Workstation, ein 6502-Bytecode-Dekompiler und Chiptune-Tracker**, der speziell für die bahnbrechenden Kompositionen des legendären C64-Musikpioniers **Rob Hubbard** entwickelt wurde.

![MOS 6581](https://img.shields.io/badge/Audio-MOS%206581%2044.1kHz-4ade80?style=for-the-badge)
![PAL 50Hz](https://img.shields.io/badge/Timing-PAL%2050.0Hz-fbbf24?style=for-the-badge)
![6502 Engine](https://img.shields.io/badge/Engine-6502%20Cycle--Accurate-00f0ff?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-HTF%20v1.0-f43f5e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)

---

## 📑 Inhaltsverzeichnis
1. [Übersicht aller Web-Applikationen & Tracker-HTML-Dateien](#-übersicht-aller-web-applikationen--tracker-html-dateien)
   - [1. `lightforce.html` — Die 4-Ebenen Workstation & Impuls-Tracker](#1-lightforcehtml--die-4-ebenen-workstation--impuls-tracker)
   - [2. `tracker4.html` — Hubbard Motif Tracker 4.0 (Motif Recomposition Studio)](#2-tracker4html--hubbard-motif-tracker-40-motif-recomposition-studio)
   - [3. `tracker3.html` — 3-Tier Layered Architecture Studio](#3-tracker3html--3-tier-layered-architecture-studio)
   - [4. `tracker2.html` — HTF Studio Pro v2 (3-Spur Matrix & 50-Kriterien Telemetrie)](#4-tracker2html--htf-studio-pro-v2-3-spur-matrix--50-kriterien-telemetrie)
   - [5. `tracker.html` — Hubbard Tracker 1.0 (Core Proof-of-Concept)](#5-trackerhtml--hubbard-tracker-10-core-proof-of-concept)
   - [6. `index.html` — Rob Hubbard AI Master Studio (Ableton-Style Remix DAW & Splicer)](#6-indexhtml--rob-hubbard-ai-master-studio-ableton-style-remix-daw--splicer)
2. [Die zugrundeliegende Python & 6502 Synthesizer-Engine](#-die-zugrundeliegende-python--6502-synthesizer-engine)
3. [Die 21 enthaltenen Rob Hubbard Meisterwerke](#-die-21-enthaltenen-rob-hubbard-meisterwerke)
4. [Schnellstart (Quick Start)](#-schnellstart-quick-start)
5. [Tastenkombinationen (Keyboard Shortcuts)](#-tastenkombinationen-keyboard-shortcuts)

---

## 🌟 Übersicht aller Web-Applikationen & Tracker-HTML-Dateien

Das Repository bietet 6 spezialisierte Web-Oberflächen, die unterschiedliche Schwerpunkte bei der Dekompilierung, Analyse, Synthese und Variation von Rob Hubbards Chiptune-Musik setzen:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                ÜBERSICHT DER WEB-APPLIKATIONEN (HTML-SUITE)                                      │
├───────────────────┬─────────────────────────────────────────────────────────────────┬───────────────────────────┤
│ DATEINAME         │ SCHWERPUNKT & BESCHREIBUNG                                      │ HAUPTMERKMALE             │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ lightforce.html   │ 🚀 4-Ebenen Workstation & Impuls-Notation (Lightforce 1986)     │ 32 Phrasen Timeline,      │
│                   │    Vollständige Dekonstruktion von Makro- bis Mikroebene        │ Event-Anschlagskarten,    │
│                   │                                                                 │ 3 Multi-Stems, Sound-Lab  │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ tracker4.html     │ 🌟 Motif & Pattern Recomposition Studio (Alle 19 SIDs)          │ Horizontale Motif-Lanes,  │
│                   │    Fokus auf musikalische Wiederholungsmuster & Variationen     │ Auto-Mining, Variations   │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ tracker3.html     │ 📐 3-Layer Modular Architecture Tracker                         │ Hardware / Stream / Edit, │
│                   │    Saubere Trennung von SID-, Stream- und Edit-Layer            │ Resizable UI Splitter     │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ tracker2.html     │ 🎛️ HTF Studio Pro v2 (Klassische 3-Spur Matrix & Telemetrie)    │ 5-Feld Zelle, 50 Kriterien│
│                   │    Tracker mit 6502-Bytecode-Analyse & Hubb-Style Scoring       │ Oszilloskop, C64-Themes   │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ tracker.html      │ 🔬 Hubbard Tracker 1.0 (Core Proof-of-Concept)                  │ Bytecode-Dekompiler,      │
│                   │    Erster Prototyp für elementare Tracker-Muster-Extraktion     │ Note-Offs, WAV-Preview    │
├───────────────────┼─────────────────────────────────────────────────────────────────┼───────────────────────────┤
│ index.html        │ 🎛️ Rob Hubbard AI Master Studio (Remix DAW & Hybrid Splicer)    │ Granular-Remix Cockpit,   │
│                   │    Ableton-Style Player für alle 21 Songs mit Cross-SID Splicing│ Hybrid-SID Splicing, DAW  │
└───────────────────┴─────────────────────────────────────────────────────────────────┴───────────────────────────┘
```

---

### 1. `lightforce.html` — Die 4-Ebenen Workstation & Impuls-Tracker
> **URL:** `http://localhost:8080/lightforce.html`  
> **Zugehörige Dateien:** [`lightforce.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/lightforce.html), [`lightforce.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/lightforce.css), [`lightforce.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/lightforce.js)

`lightforce.html` ist die fortschrittlichste Workstation im Projekt. Sie dekonstruiert das 1986er Meisterwerk ***Lightforce*** (FTL Games, D-Dorisch, 125 BPM) in **4 hierarchische musikalische Ebenen** und bietet sowohl eine revolutionäre **musikalische Impuls- & Anschlags-Notation** als auch die klassische 64-Schritt-Matrix.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                EBENE 4: SONG-ARRANGEMENT TIMELINE                                       │
│ [00: Intro Pulse] [04: Theme A Hook] [08: Bridge 3rds] [12: Solo 32nds] ... [31: Outro Loop] (32 Slots) │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                EBENE 3: 3-SPUR MOTIF-LANES & POOL                                       │
│  Spur 1 (Lead Hook):     [ L01 ][ L02 ][ L01 ][ L03 ] ...                                               │
│  Spur 2 (m11 Arpeggio):  [ A01 ][ A01 ][ A02 ][ A01 ] ...                                               │
│  Spur 3 (Bass / Drums):  [ B01 ][ B02 ][ B01 ][ D01 ] ...                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                EBENE 2: NOTEN- & IMPULS-SEQUENZER                                       │
│  #01 • Takt 1.1.1 (0.00s) | D-4 | 1/8 (12F) | [01 Heroic Lead $41] | ⚡ HardSync ➔ 🌊 PWM Sweep         │
│  #02 • Takt 1.2.1 (0.24s) | F-4 | 1/8 (12F) | [01 Heroic Lead $41] | 🚀 Pitch-Scoop ➔ 🎶 Vibrato       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                EBENE 1: MOS 6581 SOUND-LAB & KLAVIER                                    │
│  Presets: 01 Lead ($41) | PW: 50% | ADSR: 0/8/6/2 | Macro: P02 | Virtuelles Piano & PC-Keyboard        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Die 4 Ebenen im Detail:
* **Ebene 4 — Makro Song-Arrangement Timeline (32 Slots • 128 Takte • 4:05 Min):**
  * Zeigt alle 32 Phrasen des ungekürzten Werks mit thematischer Benennung (*Intro, Theme A, Octave Elevation, Bridge Dual-Lead 3rds, Virtuoso Soli 32nd Climax, Theme B m11 Expansion, 12dB Breakdown Sweeps, Tutti Finale, Outro*).
  * **Interaktives Suchen & Loopen:** Ein Klick auf einen Slot springt im 44.1kHz-Audio sofort an diese exakte Songstelle; **`🔁 MOTIF`** loopt den gewählten Abschnitt nahtlos.
* **Ebene 3 — 3-Spur Reusable Motif Lanes & Motif-Bibliothek:**
  * **Spur 1 (Lead Melodien):** Motifs `L01..L14` (Heroic Hooks, Soli, Arp-Cascades).
  * **Spur 2 (50Hz m11 Arpeggios):** Motifs `A01..A10` (Harmonie-Sweeps, Akkord-Zerlegungen).
  * **Spur 3 (Slap-Bass & Galois Drums):** Motifs `B01..B12` (16tel-Slap-Riffs) & `D01` (Snare/Kick Interrupts).
  * **Spur-Features:** Echte phasenreine **Solo (`S`) & Mute (`M`) Schalter** pro Stimme; **`✨ VARIATION`**-Generator zum Erzeugen musikalischer Abwandlungen.
* **Ebene 2 — Musikalische Impuls- & Anschlags-Notation (Event-Driven Strike Flow):**
  * **Keine starre 64er-Raster-Zerstückelung mehr:** Jeder Notenanschlag bildet eine zusammenhängende visuelle Einheit mit **Takt-Position**, **Notenhöhe (`D-4`)**, **grafischem Haltedauer-Balken (`1/16..Ganze Note`)**, **Instrumenten-Zuweisung** und **Klangkörper-Evolution (Attack-Transiente ➔ Sustain-Modulation)**.
  * **Direkte WYSIWYG-Aktionen pro Note:**
    * **`▶` (Play):** Spielt sofort den echten, isolierten 44.1kHz-Ausschnitt genau dieses Anschlags aus dem Song ab.
    * **`▲ / ▼`:** Transponiert die Note in Halbtonschritten direkt in der dorischen Skala.
    * **`⏱+ / ⏱-`:** Verlängert oder verkürzt die Haltedauer um 6 Frames (120ms).
  * **Umschaltbar:** Wechsel zwischen **`⚡ IMPULS-NOTATION`** (Standard) und **`▦ 64-STEP GRID`** (für klassische Hex-Bearbeitung).
* **Ebene 1 — MOS 6581 Sound-Lab & Spielbares Live-Keyboard:**
  * **6 Signature Presets:** *01 Heroic Dorian Lead ($41), 02 Dual-Lead 3rd Saw ($21), 03 Signature m11 Arpeggio ($41), 04 16th Slap Bass ($41 narrow), 05 Galois Noise Snare & Kick ($81), 06 Ambient Space Pad ($41)*.
  * **Echte Fourier-PWM:** Dynamische Pulsbreite von 0% bis 100%.
  * **C64 Hardware ADSR-Zeittabellen:** Attack (2ms–8s), Decay/Release (6ms–24s), Sustain (0–15).
  * **Sub-Tick Macros:** `A-m11` (6-Step Arpeggio-Loop), `P02` (Pitch-Scoop Glissando), `V08` (Delayed 5.5Hz Vibrato), `S12` (Slap-Bass +12HT Pop).
  * **`🔴 EDIT` Modus:** Bei aktivem Record-Modus tragen Tastenanschläge (PC-Tastatur <kbd>A</kbd>, <kbd>W</kbd>, <kbd>S</kbd>... oder Piano) Noten in die Matrix ein; bei inaktivem Modus kann frei gejammt werden.
* **Multi-Stem Audio-Engine:**
  * Lädt 3 isolierte Stems (`v1=1&v2=0&v3=0`, `v1=0&v2=1&v3=0`, `v1=0&v2=0&v3=1`) parallel vom Server, was 100% störungsfreie Einzelstimmensolos und klickfreies Muten ermöglicht.

---

### 2. `tracker4.html` — Hubbard Motif Tracker 4.0 (Motif Recomposition Studio)
> **URL:** `http://localhost:8080/tracker4.html`  
> **Zugehörige Dateien:** [`tracker4.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker4.html), [`tracker4.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker4.css), [`tracker4.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker4.js)

`tracker4.html` ist ein universelles **Motif- und Pattern-Kompositionsstudio für alle 19 Original-SIDs** von Rob Hubbard. Das Ziel von Tracker 4 ist es, nicht nur lineare Hex-Zeilen darzustellen, sondern die modulare Struktur seiner Kompositionen greifbar zu machen.

#### Hauptmerkmale:
* **Universelle Songauswahl:** Unterstützt alle 19 Meisterwerke (*Commando, Delta, Monty, IK+, Sanxion, Warhawk, Spellbound, Last V8, etc.*).
* **Automatisches Pattern- & Motif-Mining:** Erkennt wiederkehrende 64-Step-Sequenzen und fasst identische Phrasen automatisch zu wiederverwendbaren Motifs (`M01`, `M02`...) zusammen.
* **Horizontale 3-Spur Arrangement-Lanes:** Jede der 3 SID-Stimmen besitzt eine eigene Zeitleiste, in der Motif-Blöcke per Klick ausgewählt, verschoben und angehört werden können.
* **Echtzeit-Variations-Algorithmen:** Ermöglicht das Duplizieren und intelligente Variieren von Motifs (z. B. Oktavierung, synkopierte Rhythmen, dorische Umkehrung).
* **Live Register-Stream Resynthese:** Änderungen an Noten oder Motifs werden in Echtzeit über die 6502 Register-Patching-Engine zurück in den 50Hz-Audiostream gerechnet.

---

### 3. `tracker3.html` — 3-Tier Layered Architecture Studio
> **URL:** `http://localhost:8080/tracker3.html`  
> **Zugehörige Dateien:** [`tracker3.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker3.html), [`tracker3.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker3.css), [`tracker3.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker3.js)

`tracker3.html` implementiert eine **dreistufige, modulare Architektur**, die den Dekompilierungs- und Syntheseprozess in drei klar getrennte Schichten unterteilt:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: VISUAL EDIT & NOTATION LAYER (Tracker-Grid, Pianorolle, Resizable UI)   │
├───────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: REGISTER STREAM & INSTRUMENT LAYER (Wiederholungsmuster, Noten-Mining)   │
├───────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 1: SID PHYSICAL HARDWARE LAYER (6502 Emulation, Register, 44.1kHz PCM)     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

#### Hauptmerkmale:
* **Layer 1 (SID Hardware):** Überwacht direkt die 29 SID-Register ($D400–$D41C), Frame-Deltas und den 50Hz Interrupt-Takt.
* **Layer 2 (Register Stream Abstraction):** Wandelt rohe Frequenz- und Kontrollregister in musikalische Tonhöhen, Hüllkurven und Instrumenten-IDs um.
* **Layer 3 (Visual Editor):** Eine vollständig responsive und resizable Oberfläche mit verschiebbaren Splittern (**Resizable Panels**), anpassbaren Spaltenbreiten und Zoom-Funktionen.
* **Single-Voice Audition:** Ermöglicht das gezielte Anhören einzelner Stimmen direkt beim Anklicken einer Zelle im Editor.

---

### 4. `tracker2.html` — HTF Studio Pro v2 (3-Spur Matrix & 50-Kriterien Telemetrie)
> **URL:** `http://localhost:8080/tracker2.html`  
> **Zugehörige Dateien:** [`tracker2.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker2.html), [`tracker2.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker2.css), [`tracker2.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker2.js)

`tracker2.html` ist die moderne Inkarnation des klassischen Chiptune-Trackers im Stil von *FastTracker 2*, erweitert um das native **Hubbard Tracker Format (HTF v1.0)** und ein integriertes **50-Kriterien Telemetrie-Dashboard**.

#### Hauptmerkmale:
* **Klassische 3-Spuren-Matrix (Side-by-Side):**
  * Jede Zelle besteht aus 5 dedizierten Feldern: `[ NOTE | DUR | INST | WAVE | FX ]` (z. B. `D-4 | L06 | 01 | $41 | P02`).
* **50-Kriterien Hubbard-Stil Analyse & Live-Scoring:**
  * Prüft in Echtzeit, wie authentisch ein Pattern zu Rob Hubbards Kompositionsstil passt:
    * *Dorian / Aeolian Skalenreinheit*
    * *50Hz m11 / Triad Arpeggio Speed*
    * *16tel Slap-Bass Dichte & Oktav-Pops*
    * *12dB Multimode Filter-Einsatz & Resonanz*
    * *Noise-Drum Multiplexing auf Spur 3*
* **Theme-Engine:** Umschaltbar zwischen **Cyber Glow**, **FastTracker 2 Classic**, **C64 Phosphor Green**, **Matrix** und **Dracula Dark**.
* **Audio-Visualisierung:** Integriertes 60 FPS Web Audio Oszilloskop und Stereo-VU-Meter.

---

### 5. `tracker.html` — Hubbard Tracker 1.0 (Core Proof-of-Concept)
> **URL:** `http://localhost:8080/tracker.html`  
> **Zugehörige Dateien:** [`tracker.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker.html), [`tracker.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker.css), [`tracker.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/tracker.js)

Der erste funktionale Prototyp der Tracker-Serie:
* Dekompiliert SID-Dateien direkt über die Python-Backend-API in ein tabellarisches 64-Zeilen-Format.
* Bietet grundlegende Funktionen zum Einfügen von Noten, Note-Offs (`===`) und Pausen (`...`).
* Rendert editierte Abschnitte on-the-fly als WAV-Datei zur akustischen Kontrolle.

---

### 6. `index.html` — Rob Hubbard AI Master Studio (Ableton-Style Remix DAW & Splicer)
> **URL:** `http://localhost:8080/`  
> **Zugehörige Dateien:** [`index.html`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/index.html), [`style.css`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/style.css), [`app.js`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/web_player/app.js)

`index.html` ist das **Flaggschiff-Remix- und Mastering-Studio** im Stil von Ableton Live. Es richtet sich an Produzenten und Hörer, die alle 21 SID-Dateien live abspielen, modular remixen und hybrid kombinieren möchten.

#### Hauptmerkmale:
* **Jukebox & Multi-Track Analyzer:** Nahtlose Wiedergabe aller 21 enthaltenen Rob Hubbard Meisterwerke mit separaten VU-Metern und Wellenformanzeigen pro Stimme.
* **Granular Remix Parameter Matrix:**
  * **Tonhöhe & Transposition:** Ganzton- und Oktav-Riser.
  * **Arpeggio-Modulator:** Umschalten zwischen *Original*, *m11 Signature*, *Vermindert (Diminished)* und *Harmonisch Moll*.
  * **Bass-Groove Transformer:** Umschalten zwischen *Original*, *Driving 16th Slap-Bass* und *Walking Funk Bass*.
  * **Drum-Fills & Percussion Generator:** Einstellbare Dichte von Snare-Rolls und Noise-Interrupts.
  * **12dB Analog Filter Matrix:** Echtzeit-Steuerung von Cutoff-Frequenz, Resonanz ($00–$0F) und Filter-Modus (*Bandpass $2F, Lowpass $1F, Highpass $4F*).
* **Cross-SID Hybrid Splicing Engine:**
  * Ermöglicht das freie Kombinieren von Stimmen aus völlig unterschiedlichen Songs zu einer neuen Komposition:
    * *Beispiel:* **Stimme 1 von Commando** (Lead) + **Stimme 2 von Delta** (m11 Arp) + **Stimme 3 von IK+** (Slap-Bass & Drums) ➔ Synthetisiert zu einem eigenständigen Hybrid-Track!
* **Export-Optionen:**
  * **`.SID` Export:** Erzeugt eine bitgenaue, lauffähige Commodore 64 `.SID`-Datei für echte Hardware oder Emulatoren (VICE, SIDPlay).
  * **`.WAV` Export:** Rendert die Master-Remixe in 44.1kHz Studioqualität.

---

## ⚙️ Die zugrundeliegende Python & 6502 Synthesizer-Engine

Das Backend basiert auf einer maßgeschneiderten Python-Architektur, die echte 6502-Maschinensprache-Ausführung mit einem Software-Synthesizer koppelt:

```
                       ┌──────────────────────────────────────────────┐
                       │           ROB HUBBARD .SID DATEI             │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │     engine/extractor.py (6502 CPU EMULATION) │
                       │  • Führt INIT & PLAY bei 50Hz PAL aus        │
                       │  • Erfasst 29 SID-Register ($D400-$D41C)     │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │      50Hz ZYKLENGENAUER REGISTER-STREAM      │
                       └──────────────┬────────────────┬──────────────┘
                                      │                │
             ┌────────────────────────┘                └────────────────────────┐
             ▼                                                                  ▼
┌──────────────────────────────────────────┐      ┌───────────────────────────────────────────┐
│     engine/tracker_engine.py             │      │          engine/synth.py                  │
│ • Dekompiliert in Noten & Tonhöhen       │      │ • 44.1kHz MOS 6581 Software Synthesizer   │
│ • Erkennt Wellenformen ($41, $21, $81)   │      │ • Fourier-PWM ($41), Galois-Noise ($81)   │
│ • Erzeugt Impuls- & Anschlagskarten      │      │ • Resonanter 12dB Multimode-Filter        │
│ • Extrahiert Motifs & Phrasen            │      │ • Echte Hardware-ADSR Zeittabellen        │
└──────────────────────────────────────────┘      └───────────────────────────────────────────┘
```

### Die Backend-Module im Überblick:
* [`engine/extractor.py`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/engine/extractor.py): Emuliert den 6502-Prozessor und liest die Register-Schreibzugriffe des C64-Treibers framegenau mit 50.0 Hz aus.
* [`engine/synth.py`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/engine/synth.py): 44.1kHz MOS 6581 Software-Synthesizer mit Waveforms (Rechteck/PWM mit variabler Pulsbreite, Sägezahn, Dreieck, Galois LFSR Rauschgenerator, Ring-Modulation und Hard-Sync), 6581 ADSR-Kurven und analogem State-Variable-Filter.
* [`engine/tracker_engine.py`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/engine/tracker_engine.py): Wandelt den 50Hz-Datenstrom in musikalische Noten, Hüllkurvendauern und Anschlagseinheiten um.
* [`engine/stream_compiler.py`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/engine/stream_compiler.py): Schreibt Notenänderungen bitgenau in den 6502-Stream zurück, ohne Filter-Sweeps oder PWM-LFOs zu zerstören.
* [`player_server.py`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/player_server.py): Asynchroner HTTP/REST-Server auf Port 8080 für Audio-Streaming, Stem-Rendering und Tracker-APIs.

---

## 🎼 Die 21 enthaltenen Rob Hubbard Meisterwerke

Das Projekt enthält 21 Original-Klassiker von Rob Hubbard (1985–1987) im Verzeichnis [`sid/`](file:///c:/Users/enzoc/Desktop/AI%20Code/hubb/sid):

| # | Titel | Jahr | Publisher | Musikalische Stilmerkmale & Innovationen |
|---|---|---|---|---|
| 01 | **Commando** | 1985 | Elite Systems | Heroischer Lead-Hook, Triolen-Bass, Snare-Fills, dorische Tonalität |
| 02 | **Monty on the Run** | 1985 | Gremlin Graphics | Virtuoses Highspeed-Violinen-Solo, Slap-Bass, progressive Taktwechsel |
| 03 | **Delta** | 1987 | Thalamus | Epische 50Hz m11-Arpeggios, Pink Floyd Anleihen, tiefe Filter-Swells |
| 04 | **International Karate +** | 1987 | System 3 | Asiatische Pentatonik, Gong Ring-Modulation, Funky Slap-Bass |
| 05 | **Lightforce** | 1986 | FTL Games | Reines D-Dorisch, 6-Step m11 Arps, 32 Phrasen, triumphale Lead-Hooks |
| 06 | **Sanxion** | 1986 | Thalamus | Ungerader 11/8 & 7/8 Takt, Hard-Sync Formanten, Highspeed-Läufe |
| 07 | **Warhawk** | 1986 | Proteus Software | Flötiger Dreieck-Sound, treibender Disco-Beat, Resonanzfilter |
| 08 | **Spellbound** | 1985 | Mastertronic | Melancholische Moll-Ballade, langsamer PWM-Chorus, weite Flächen |
| 09 | **The Last V8** | 1985 | Mastertronic | Düstere Cyberpunk-Dissonanzen, RingMod-Sirenen, Turbo-Bass |
| 10 | **Crazy Comets** | 1985 | Martech | Energetischer Hi-NRG Disco-Rhythmus, Laser Hard-Sync, Slap-Pops |
| 11 | **Master of Magic** | 1985 | Mastertronic | Synergy (Larry Fast) Cover, schwebende Pads, akustische Gitarren-Sim |
| 12 | **Flash Gordon** | 1986 | Mastertronic | Schnelle Fanfaren, perkussive Sägezahn-Läufe, Queen-Hommage |
| 13 | **Nemesis the Warlock** | 1987 | Martech | Monumentales Intro, Kirchenorgel-Simulation, virtuoser Choral |
| 14 | **Zoids** | 1985 | Martech | Mechanische Industrieklänge, metallische Ring-Modulation |
| 15 | **I-Ball** | 1987 | Firebird | Acid-Basslines, experimentelle Glitch-Percussion |
| 16 | **Knucklebusters** | 1986 | Melbourne House | Ausgedehnte 17-Minuten Prog-Rock Suite, dynamische Themen |
| 17 | **Mega Apocalypse** | 1987 | Martech | Hochenergetischer Synthwave-Vorläufer, treibende Sequenzen |
| 18 | **Kentilla** | 1986 | Mastertronic | Mittelalterliche Lauten-Arpeggios, pastorale Flöten |
| 19 | **Chimera** | 1985 | Firebird | Barocke Kontrapunkt-Fugen, 3 unabhängige Stimmen |
| 20 | **The Human Race** | 1985 | Mastertronic | Progressive Funk-Basslines, dynamische Tempowechsel |
| 21 | **Thrust** | 1986 | Firebird | Hypnotischer Arpeggio-Groove, minimale Akkordverschiebungen |

---

## 🚀 Schnellstart (Quick Start)

### 1. Voraussetzungen
* **Python 3.8+** (inklusive `numpy`)
* Ein moderner Webbrowser (Chrome, Firefox, Edge oder Safari)

### 2. Server starten
Starten Sie das Multitrack-Audio- und Tracker-Backend mit:
```bash
python player_server.py
```
*(Der Server startet standardmäßig auf Port 8080).*

### 3. Im Browser öffnen
* 🚀 **Lightforce 4-Ebenen Workstation:** [http://localhost:8080/lightforce.html](http://localhost:8080/lightforce.html)
* 🌟 **Hubbard Motif Tracker 4:** [http://localhost:8080/tracker4.html](http://localhost:8080/tracker4.html)
* 📐 **Layered 3-Tier Tracker 3:** [http://localhost:8080/tracker3.html](http://localhost:8080/tracker3.html)
* 🎛️ **HTF Studio Pro Tracker v2:** [http://localhost:8080/tracker2.html](http://localhost:8080/tracker2.html)
* 🎛️ **Ableton-Style Master Studio:** [http://localhost:8080/](http://localhost:8080/)

---

## ⌨️ Tastenkombinationen (Keyboard Shortcuts)

In allen Tracker-Oberflächen können Noten und Befehle direkt über die PC-Tastatur eingegeben werden:

| Taste | Aktion | Beschreibung |
|---|---|---|
| <kbd>Leertaste</kbd> | **Play / Stop** | Startet oder stoppt die Song-Wiedergabe |
| <kbd>A</kbd>, <kbd>W</kbd>, <kbd>S</kbd>, <kbd>E</kbd>, <kbd>D</kbd>, <kbd>F</kbd>... | **Noten C-4 bis B-4** | Untere Noten-Oktave (Weiß/Schwarz wie Klavier) |
| <kbd>Q</kbd>, <kbd>2</kbd>, <kbd>W</kbd>, <kbd>3</kbd>, <kbd>E</kbd>, <kbd>R</kbd>... | **Noten C-5 bis B-5** | Obere Noten-Oktave |
| <kbd>1</kbd> oder <kbd>CapsLock</kbd> | **Note-Off (`===`)** | Schließt das Gate / leitet Release-Phase ein |
| <kbd>Entf</kbd> / <kbd>Backspace</kbd> | **Pause (`...`)** | Löscht die Note im aktuellen Schritt |
| <kbd>▲</kbd> / <kbd>▼</kbd> | **Cursor Schritt** | Navigiert vertikal durch die Schritte / Events |
| <kbd>Strg</kbd> + <kbd>Z</kbd> | **Undo** | Macht die letzte Änderung rückgängig |
| <kbd>Strg</kbd> + <kbd>Y</kbd> | **Redo** | Wiederholt die letzte rückgängig gemachte Aktion |
| <kbd>+</kbd> / <kbd>-</kbd> (Numpad) | **Oktave wechseln** | Schaltet die Basis-Oktave für die Tastatur um |

---

## 📜 Lizenz & Danksagung

Dieses Projekt ist unter der **MIT-Lizenz** veröffentlicht.  
Ein großes Dankeschön an **Rob Hubbard** für seine unsterblichen Meisterwerke und die Pionierarbeit in der Chiptune-Musik des Commodore 64! 🕹️🎹🎶
