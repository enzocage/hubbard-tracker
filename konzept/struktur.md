# Musikalische & Modulare Struktur von `Commando.sid`
### Rob Hubbard (1985) – Rekonstruktion als Ableton Live Multi-Track Sequencer

---

## 🎛️ DAW Session-Header & Globale Parameter (Ableton Master)

| Parameter | Wert | SID 6502 Hardware-Entsprechung |
| :--- | :--- | :--- |
| **Globales Tempo** | **125.00 BPM** | $50.0\text{ Hz}$ PAL VBI-Interrupt (6 Frames pro $16\text{tel}$-Note) |
| **Taktart (Meter)** | **4 / 4 Takt** | $48\text{ Frames}$ pro Takt ($0.96\text{ Sekunden}$) |
| **Grundtonart / Skala**| **A-Moll (Aeolisch / Phrygisch)** | Grundfrequenzen: $\text{A-1} = \$0160$, $\text{A-4} = \$1C5C$ |
| **Global Quantize** | **1/16 Note (6 Frames)** | $16\text{tel}$-Sub-Ticks auf $50\text{ Hz}$-Basis |
| **Kanalbelegung** | **3 Stimmen + Mux-Drums** | Stimme 1: Lead, Stimme 2: Arp, Stimme 3: Bass+Drums |

---

## 🎼 1. Modulare Szenen- & Clip-Matrix (Ableton Session View)

In einem modularen Sequencer wie Ableton Live gliedert sich *Commando* in **5 modulare Szenen (Scenes)**, die als eigenständige Clips parallel über alle 3 Spuren abgefeuert werden:

```
┌────────────┬───────────────────────┬───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ SCENE      │ TAKTE (FRAMES)        │ TRACK 1: LEAD SOLO (Cyan)     │ TRACK 2: ARPEGGIO CHORD (Gelb)│ TRACK 3: BASS & DRUMS (Grün)  │
├────────────┼───────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ [Scene 1]  │ Takt 1–8              │ [Clip 1.1: Fanfare & Signal]  │ [Clip 1.2: 50Hz Pulse-Arp]    │ [Clip 1.3: 16th Military Gall]│
│ INTRO      │ Frame 0–384           │ Tri+RingMod ($15), Pitch-Scoop│ Am → F → Dm → E7 (3-Ton Arp)  │ A-1 Gallop + BD/SD Backbeat   │
├────────────┼───────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ [Scene 2]  │ Takt 9–16             │ [Clip 2.1: Hauptthema A]      │ [Clip 2.2: Harmonische Dichte]│ [Clip 2.3: Driving Bassline]  │
│ THEMA A    │ Frame 384–768         │ A4-C5-B4 Heroic Lead ($41)    │ 4-Ton m7 Arpeggios ($43)      │ A1 → A#1 → E1 + Snare Fills   │
├────────────┼───────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ [Scene 3]  │ Takt 17–24            │ [Clip 3.1: Lyrische Variation]│ [Clip 3.2: Extended Chords]   │ [Clip 3.3: Slap-Oktav-Bass]   │
│ THEMA B    │ Frame 768–1152        │ E5-F5-D5 Sexten & Triller     │ Am9 → Dm7 → E7sus4            │ A1/A2 Oktav-Pops + Hi-Hat Hat │
├────────────┼───────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ [Scene 4]  │ Takt 25–32            │ [Clip 4.1: Staccato Solo]     │ [Clip 4.2: PWM String Pad]    │ [Clip 4.3: Walking Bassline]  │
│ BRIDGE     │ Frame 1152–1536       │ 16tel Passing Notes ($21 Saw) │ Breiter PWM-Chorus ($D409)    │ Kontrapunktischer Walking-Bass│
├────────────┼───────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ [Scene 5]  │ Takt 33–40            │ [Clip 5.1: Octave Climax]     │ [Clip 5.2: Lightforce Cascade]│ [Clip 5.3: Heavy Snare Rolls] │
│ CLIMAX     │ Frame 1536–1920       │ +12 HT Oktave Riser (A5→C6)   │ 6-Step m11 Arpeggio Kaskade   │ 2-Frame Rapid Military Rolls  │
└────────────┴───────────────────────┴───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

---

## 🎹 2. Parallele 3-Stimmen-Partitur (Takt für Takt)

### Szene 1: INTRO & MILITARY GROOVE (Takte 1–8 / Frames 0–384)
* **Harmonik:** $\text{A-Moll} \rightarrow \text{F-Dur} \rightarrow \text{D-Moll} \rightarrow \text{E-Dur}$ (Phrygische Kadenz)
* **Spur 1 (Lead Solo):**
  * *Takt 1–2:* Hohe Signalhorn-Fanfare auf $\text{E-7}$ ($2636\text{ Hz}$, Tri+RingMod $\$15$) mit steilem Pitch-Scoop von $-2\text{ HT}$.
  * *Takt 3–4:* Abfallende Antwortphrase $\text{G-4} \rightarrow \text{A-4}$ mit schnellem Einschwing-Triller.
  * *Takt 5–8:* Wiederholung mit Modulation über $\text{A\#-1}$ (Neapolitanischer Bezug).
* **Spur 2 (Arpeggios & Chords):**
  * Durchgehende $50\text{ Hz}$-Arpeggios im $3$-Ton-Muster ($1\text{ Frame pro Note}$):
    * $\text{A-Moll: } \text{A-3} \rightarrow \text{C-4} \rightarrow \text{E-4}$ (Takte 1–2)
    * $\text{F-Dur: } \text{F-3} \rightarrow \text{A-3} \rightarrow \text{C-4}$ (Takte 3–4)
    * $\text{E-Dur: } \text{E-3} \rightarrow \text{G\#-3} \rightarrow \text{B-3}$ (Takte 7–8)
* **Spur 3 (Bassline & Drums - Multiplexed):**
  * *Groove:* Legendärer $16\text{tel}$-Galopp auf $\text{A-1}$ ($55.0\text{ Hz}$, Rechteck $\$41$, PW $\$0800$).
  * *Drums:* BD (Dreieck-Drop $\$11$) auf $1$, Snare (Weißes Rauschen $\$81$) auf $2$ und $4$.

```
Spur 1 (Lead):  | E7(Scoop) - - - | A4 - - - | G4 - A4 - | A4(Hold) - | E7(Scoop) - - - | A4 - - - | G4 - D5 - | A4 - - - |
Spur 2 (Arp):   | [A-C-E] 50Hz-Arp| [A-C-E]  | [F-A-C]   | [E-G#-B]   | [A-C-E]         | [F-A-C]  | [D-F-A]   | [E-G#-B] |
Spur 3 (Bass):  | A1-A1-A1-A1 Gal | A1-A1-.. | A1-A1-..  | A1-A1-..   | A#1-A#1-Galopp  | A#1-..   | E1-E1-..  | E1(Snare)|
```

---

### Szene 2: THEMA A – DAS HAUPTTHEMA (Takte 9–16 / Frames 384–768)
* **Harmonik:** $\text{Am} \rightarrow \text{Am/G} \rightarrow \text{F} \rightarrow \text{Dm} \rightarrow \text{E7}$
* **Spur 1 (Lead Solo):**
  * *Takt 9–10:* $\text{A-4} \rightarrow \text{C-5} \rightarrow \text{B-4} \rightarrow \text{A-4}$ (Heroischer Marsch-Duktus, Puls $\$41$, ADSR $\$0900$).
  * *Takt 11–12:* $\text{G-4} \rightarrow \text{A-4} \rightarrow \text{E-5}$ mit $5.5\text{ Hz}$ Delayed Vibrato ($25\text{ Cents}$).
  * *Takt 13–16:* Fortspinnung mit chromatischen Passing Notes ($\text{G\#-4}$) zur Dominante $\text{E-Dur}$.
* **Spur 2 (Arpeggios):**
  * Umschaltung auf $4$-Ton $m^7$-Arpeggios mit Inversion ($\text{A-C-E-G}$).
  * Dynamische Pulsweitenmodulation ($1.25\text{ Hz}$ LFO zwischen $30\%$ und $70\%$).
* **Spur 3 (Bass & Drums):**
  * Wechselbass $\text{A-1} \rightarrow \text{A-2}$ mit stochastischen Slap-Pops auf den $16\text{tel}$-Offbeats.
  * Takt 16: $6$-Frame Snare-Roll-Fill vor der Überleitung.

---

### Szene 3: THEMA B – LYRISCHE VARIATION (Takte 17–24 / Frames 768–1152)
* **Harmonik:** $\text{Dm7} \rightarrow \text{G7} \rightarrow \text{Cmaj7} \rightarrow \text{Fmaj7} \rightarrow \text{Bdim} \rightarrow \text{E7}$ (Quintfallsequenz)
* **Spur 1 (Lead Solo):**
  * Aufsteigende Melodielinie in die hohe Lage: $\text{E-5} \rightarrow \text{F-5} \rightarrow \text{G-5} \rightarrow \text{A-5}$.
  * Vorhalts-Triller (Upper Appoggiatura) auf jeder Takteins ($+2\text{ HT}$ für 2 Frames).
* **Spur 2 (Arpeggios):**
  * Jazz-inspirierte $m^9$-Arpeggios ($\text{D-F-A-C-E}$) erzeugen schwebende Weite.
* **Spur 3 (Bassline):**
  * Melodischer Kontrapunkt-Bass mit $8\text{tel}$-Synkopen und durchgehenden Ghost-Hi-Hats.

---

### Szene 4: BRIDGE & FILTER SWEEP (Takte 25–32 / Frames 1152–1536)
* **Harmonik:** $\text{C-Dur} \rightarrow \text{D-Moll} \rightarrow \text{E-Dur}$
* **Spur 1 (Lead):** Staccato $16\text{tel}$-Läufe mit Sägezahn-Wellenform ($\$21$).
* **Spur 2 (Fläche):** Breite PWM-Streicherfläche ($41$) ohne Arpeggierung (Akkord-Haltetöne).
* **Master Filter ($D415–$D418):**
  * Aktivierung des **$12\text{dB}$ Bandpass-Filters** ($\$2F$).
  * Resonanz auf Maximum ($Q=14, \$D417 = \$E3$).
  * Cutoff-LFO sweepet von $400\text{ Hz}$ bis $3.2\text{ kHz}$ über 8 Takte.

---

### Szene 5: CLIMAX & OKTAV-REPRISE (Takte 33–40 / Frames 1536–1920)
* **Harmonik:** $\text{A-Moll} \rightarrow \text{F} \rightarrow \text{G} \rightarrow \text{A-Moll}$
* **Spur 1 (Lead):** $+12\text{ HT}$ Transposition (Oktavsprung nach $\text{A-5} \dots \text{C-6}$) für maximales Finale.
* **Spur 2 (Arpeggios):** $6$-Step $m^{11}$-Kaskade ($\text{A-C-E-G-A-D}$) im Lightforce-Stil.
* **Spur 3 (Bass & Drums):** Dichteste Drum-Fills mit $2\text{ Frames}$ Rapid-Fire Snare-Wirbeln vor dem nahtlosen Loop-Restart bei Takt 1.

---

## 🎛️ 3. Ableton Live Device-Rack Mapping (Kanal-Architektur)

```
TRACK 1: LEAD SOLO [Cyan]
├── [MIDI / Pattern Trigger]  --> 6502 Machine Code ($0160-$1C5C)
├── [Pitch & Scale Device]   --> Transpose (0 HT), Fine Tune (0 ct)
├── [Pitch-Scoop Device]     --> +2 HT Offset, 4 Frames, Exponential Curve
├── [Vibrato LFO Device]     --> 8 Frames Delay, 5.5 Hz Rate, 25 Cents Depth
├── [Transient Shaper]       --> 2 Frames RingMod ($15) Attack Burst
└── [SID Oscillator 1]       --> Pulse $41 / Saw $21 (ADSR: $0900)

TRACK 2: ARPEGGIO CHORD [Gelb]
├── [Arp Clock Device]       --> 50.0 Hz (1 Frame per Note) / 100 Hz Sub-Tick
├── [Harmonizer Device]      --> 14 Chords: m, M, m7, M7, m9, m11, sus4
├── [Inversion Device]       --> Root / 1st / 2nd Inversion
├── [PWM LFO Device]         --> Center 2048, Depth 1024, Speed 1.25 Hz
└── [SID Oscillator 2]       --> Pulse $43 with Sync/RingMod (ADSR: $00F0)

TRACK 3: SLAP BASS [Grün]
├── [Groove Pattern Gen]     --> Commando 16th Military Gallop
├── [Slap-Pop Generator]     --> 50% Probability, +12 HT Octave Jump
├── [Micro-Displacement]     --> 16th Swing / -1 Frame Drag
└── [SID Oscillator 3]       --> Pulse $41 / Triangle $11 (ADSR: $0090)

TRACK 4: NOISE DRUMS [Orange] (V3 Mux)
├── [16-Step Drum Grid]      --> BD: Steps 1,9 | SD: Steps 5,13 | HH: All 16
├── [Snare-Roll Fill Engine] --> 2-Frame Burst Triggers at Bar Ends
└── [SID Noise Generator]    --> Galois LFSR White Noise ($81)

MASTER BUS: MOS 6581 FILTER [Lila]
├── [Analog Filter Core]     --> 12dB Resonant Bandpass ($2F)
├── [Resonance Control]      --> Q = 14 ($D417 = $E7)
├── [Filter LFO Sweep]       --> Saw / Sine LFO (0.1 - 20.0 Hz)
└── [Nonlinear Saturation]   --> Authentic MOS 6581 Soft-Clipping Distortion
```

---

## 📊 4. Register-Telemetrie der Original-Komposition ($D400–$D418)

| SID-Register | Hex-Adresse | Typische Belegung in Commando | Funktion im Arrangement |
| :--- | :--- | :--- | :--- |
| **V1 FREQ** | `$D400/$D401` | `$5C / $1C` ($\text{A-4} = 440\text{ Hz}$) | Hauptmelodie-Tonhöhe |
| **V1 PW** | `$D402/$D403` | `$00 / $08` ($50\%$ Puls) | Rechteck-Klangfarbe Lead |
| **V1 CONTROL** | `$D404` | `$41` (Puls+Gate) / `$15` (Attack) | Anschlagdynamik & Wellenform |
| **V1 ADSR** | `$D405/$D406` | `$09 / $00` | Attack $2\text{ms}$, Decay $750\text{ms}$ |
| **V2 FREQ** | `$D407/$D408` | `$B0 / $09` $\dots$ `$5C / $1C` | $50\text{Hz}$-Arpeggio-Schritte |
| **V2 CONTROL** | `$D40B` | `$43` (Puls+Sync+Gate) | Shimmering Arp-Chorus |
| **V3 FREQ** | `$D40E/$D40F` | `$60 / $01` ($\text{A-1} = 55\text{ Hz}$) | Tiefer Sub-Bass-Galopp |
| **V3 CONTROL** | `$D412` | `$41` (Bass) / `$81` (Snare Noise) | $50\text{Hz}$ Multiplexing Bass/Drums |
| **FLT CUTOFF** | `$D415/$D416` | `$00 / $80` ($1.6\text{ kHz}$) | Bandpass-Mittenfrequenz |
| **FLT RES/ROUT**| `$D417` | `$E7` (Resonanz 14, Rout: V1+V2+V3)| Maximale analoge Filtersättigung |
| **FLT MODE** | `$D418` | `$2F` (Bandpass 12dB + Vol 15) | Rob Hubbards legendärer Signature-Sound |

---

*Erstellt für das Rob Hubbard Master Studio & Ableton Live Sequencer Lab.*
