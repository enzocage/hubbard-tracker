# HTF (Hubbard Tracker Format) – Spezifikation v1.0
### Das native Tracker-Format für Rob Hubbard C64 SID Kompositionen

---

## 🎯 Motivation & Konzept

Klassische Tracker-Formate (wie `.mod` oder `.xm`) basieren auf einer starren Zeilen-Tick-Matrix. Dies führt bei der Emulation von C64 SID-Musik zu massiven Problemen:
1. **Variable Gate-Längen:** Eine Note im 6502-Assembler dauert oft krumme Frame-Längen (z.B. 5 Frames = 100ms, 18 Frames = 360ms).
2. **Sub-Tick-Modulationen:** 50Hz-Arpeggios, Pitch-Scoops und PWM-Sweeps laufen auf jedem einzelnen PAL-Interrupt ($20\text{ ms}$) ab.
3. **Interrupt-Multiplexing:** Drums auf Stimme 3 unterbrechen den Bass für 2 Frames und stellen danach den Originalklang wieder her.

Das **Hubbard Tracker Format (HTF)** löst diese Diskrepanz, indem es das klassische Tracker-Interface mit der **Frame-basierten Bytecode-Zustandsmaschine** des C64 verschmilzt.

---

## 📐 1. Die HTF-Zellen-Struktur (Row Syntax)

In HTF besteht jeder Schritt auf einer der 3 Stimmen aus 5 atomaren Feldern:

```
┌───────┬───────┬───────┬───────┬────────────┐
│ NOTE  │ DUR   │ INST  │ WAVE  │ MACRO / FX │
├───────┼───────┼───────┼───────┼────────────┤
│  E-7  │  L06  │  02   │  $15  │    P02     │
└───────┴───────┴───────┴───────┴────────────┘
```

### Die 5 Parameter einer HTF-Zelle:

1. **`NOTE` (Tonhöhe / Tonname):**
   * Format: `C-1` bis `B-7` oder `...` (Halte-Ton / Pause) oder `===` (Note-Off / Gate Release).
   * Verweist auf die exakte 16-Bit Frequenztabelle des MOS 6581 ($985.248\text{ Hz}$ PAL Basis).

2. **`DUR` (Duration / Frame-Länge):**
   * Format: `L01` bis `L99` (z.B. `L06` = 6 Frames = $120\text{ ms}$, `L12` = 12 Frames = $240\text{ ms}$, `L48` = 1 ganzer Takt).
   * Bestimmt, wie viele 50Hz-Interrupts die Note gehalten wird. Im UI wird dies durch einen horizontalen Notenbalken visualisiert.

3. **`INST` (Instrumenten-ID):**
   * Format: `01` bis `16`. Verweist auf die Instrumenten-Tabelle mit Hüllkurven (ADSR), Basis-Wellenform und Filter-Routing.

4. **`WAVE` (Hardware-Wellenform-Byte):**
   * `$11` = Dreieck (Triangle / Sub-Bass)
   * `$21` = Sägezahn (Sawtooth / Solo Lead)
   * `$41` = Rechteck (Pulse / Slap Bass & Lead)
   * `$81` = Rauschen (Noise / Snare & Hi-Hat)
   * `$15` = Dreieck + RingModulation (Hubbard Signalhorn Fanfare)
   * `$43` = Rechteck + HardSync (Hubbard 50Hz Arpeggios)

5. **`MACRO / FX` (Sub-Tick Modulations-Befehl):**
   * `Pxx` = **Pitch-Scoop:** Startet die Note $xx$ Halbtöne tiefer und zieht sie exponentiell hoch (z.B. `P02` = -2 Halbtöne).
   * `Axx` = **50Hz Arpeggio-Macro:** Führt eine Sub-Tick-Tabelle aus (`Am7`, `Am9`, `m11`, `SUS4`).
   * `Vxx` = **Delayed Vibrato:** Startet nach $x$ Frames ein moduliertes $5.5\text{ Hz}$ Sinus-Vibrato.
   * `Wxx` = **PWM LFO Sweep:** Aktiviert einen Pulsweiten-Sweep mit Tiefe $xx$.
   * `Dxx` = **Drum-Interrupt:** Schaltet Stimme 3 für 2 Frames auf Noise/Snare und restauriert danach die Tonhöhe.
   * `Sxx` = **Slap-Pop:** Erzeugt einen stochastischen Oktavsprung ($+12\text{ HT}$) auf 16tel-Offbeats.

---

## 🎼 2. Beispiel: `Commando.sid` in HTF-Notation

```
=== PATTERN 00: COMMANDO INTRO & THEMA A (64 STEPS) ===

STEP | TRACK 1: LEAD SOLO ($D400)      | TRACK 2: ARPEGGIO ($D407)        | TRACK 3: BASS & DRUMS ($D40E)     | 6502 BYTECODE GENERIERT
─────┼─────────────────────────────────┼──────────────────────────────────┼───────────────────────────────────┼────────────────────────────────────
 00  | E-7  L06  02  $15  P02 (Scoop)  | ...  L06  00  ---  ---           | A-1  L06  05  $41  ... (Galopp)   | .byte $3C, $06, $81, $15, $82, $09
 01  | ...  L06  00  ---  ---          | ...  L06  00  ---  ---           | A-1  L06  05  $41  ...            | .byte $00, $06
 02  | ...  L06  00  ---  ---          | ...  L06  00  ---  ---           | D-4  L02  07  $81  D-SD (Snare)   | .byte $28, $02, $81, $81
 03  | ...  L06  00  ---  ---          | ...  L06  00  ---  ---           | A-1  L04  05  $41  ...            | .byte $00, $04
 04  | A-4  L12  01  $41  V08 (Vibrato)| A-3  L12  03  $43  A-Am (50Hz)   | A-1  L06  05  $41  ...            | .byte $20, $0C, $81, $41, $FE, $08
 05  | ...  L06  00  ---  ---          | C-4  L06  03  $43  ...           | A-2  L06  05  $41  S12 (Slap-Pop) | .byte $0C, $06, $80, $0C
 06  | C-5  L06  01  $41  ...          | E-4  L06  03  $43  ...           | A-1  L06  05  $41  ...            | .byte $23, $06
 07  | B-4  L06  01  $41  T02 (Triller)| A-3  L06  03  $43  ...           | D-4  L02  07  $81  D-SD (Snare)   | .byte $22, $06, $FD, $02
```

---

## 🎛️ 3. Instrumenten- & Macro-Definition in HTF

Ein HTF-Instrument vereint statische Register-Werte mit dynamischen Transitions-Skripten:

```json
{
  "id": 1,
  "name": "Heroic Pulse Lead",
  "waveform_attack": "0x41",
  "waveform_sustain": "0x41",
  "pulse_width": 2048,
  "adsr": { "attack": 0, "decay": 9, "sustain": 0, "release": 0 },
  "filter_routing": true,
  "macro": {
    "type": "pitch_scoop",
    "offset_semitones": -2,
    "duration_frames": 4,
    "vibrato_delay_frames": 8,
    "vibrato_speed_hz": 5.5,
    "vibrato_depth_cents": 25
  }
}
```

---

## 💾 4. Dateiformat-Struktur (`.htf` JSON / Binary)

Eine HTF-Projektdatei speichert das gesamte Arrangement in einer lesbaren JSON-Struktur:

1. **`header`:** Songtitel, Komponist, BPM, PAL-Clock-Basis, Master-Filter-Einstellung.
2. **`order_list`:** Abspielfolge der Patterns (z.B. `[0, 1, 1, 2, 3, 1, 4]`).
3. **`instruments`:** Array der 16 Instrumenten- und Macro-Definitionen.
4. **`patterns`:** Array von Patterns, die jeweils 3 parallele Spuren mit Array von Event-Zellen (`note`, `dur`, `inst`, `wave`, `fx`) enthalten.
5. **`6502_compiler_config`:** Startadressen (`$1000` / `$1003`) für den Direkt-Export in spielbare C64 `.sid`-Binärdateien.
