# 🕹️ Musiksynthese & Register-Struktur bei Rob Hubbard (C64 MOS 6581)

Dieses Dokument erklärt im Detail, wie die legendäre Musiksynthese von **Rob Hubbard** auf dem **MOS 6581 SID-Soundchip** des Commodore 64 funktioniert. Es beschreibt exakt, welche Hardware-Register existieren, wie oft sie moduliert werden und wie aus dem scheinbar kontinuierlichen Register-Stream **wiederholbare musikalische Patterns, Motifs und modulare Instrumente** entstehen, die Sie im Tracker editieren und remixen können.

---

## 1. Die 25 Hardware-Register des MOS 6581 ($D400–$D418)

Der MOS 6581 besitzt **25 beschreibbare Steuerregister**, die im C64-Speicher von `$D400` bis `$D418` gemappt sind. Sie sind in vier funktionale Blöcke unterteilt:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOS 6581 REGISTER-MAPPING ($D400–$D418)                  │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ STIMME 1 (Voice 1)│ STIMME 2 (Voice 2)│ STIMME 3 (Voice 3)│ MASTER & FILTER │
├───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ $D400: FREQ_LO    │ $D407: FREQ_LO    │ $D40E: FREQ_LO    │ $D415: CUTOFF_LO│
│ $D401: FREQ_HI    │ $D408: FREQ_HI    │ $D40F: FREQ_HI    │ $D416: CUTOFF_HI│
│ $D402: PW_LO      │ $D409: PW_LO      │ $D410: PW_LO      │ $D417: RES_ROUT │
│ $D403: PW_HI      │ $D40A: PW_HI      │ $D411: PW_HI      │ $D418: MODE_VOL │
│ $D404: CONTROL    │ $D40B: CONTROL    │ $D412: CONTROL    │                 │
│ $D405: ATTACK_DEC │ $D40C: ATTACK_DEC │ $D413: ATTACK_DEC │                 │
│ $D406: SUST_REL   │ $D40D: SUST_REL   │ $D414: SUST_REL   │                 │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

### Detaillierte Register-Bedeutung pro Stimme (Voice $v \in \{1, 2, 3\}$):

| Offset | Register-Name | Bits | Funktion & Wertebereich |
| :--- | :--- | :--- | :--- |
| `+$00` | **FREQ_LO** | 8 Bit | Untere 8 Bits der 16-Bit Oszillator-Frequenz (`$00`–`$FF`). |
| `+$01` | **FREQ_HI** | 8 Bit | Obere 8 Bits der 16-Bit Oszillator-Frequenz (`$00`–`$FF`). |
| `+$02` | **PW_LO** | 8 Bit | Untere 8 Bits der 12-Bit Pulsbreite (`$00`–`$FF`). |
| `+$03` | **PW_HI** | 4 Bit | Obere 4 Bits der Pulsbreite (Bits 0–3: `$0`–`$F`). Gesamt: 0–4095. |
| `+$04` | **CONTROL** | 8 Bit | **Wellenform & Generator-Flags:**<br>• Bit 0: **GATE** (1 = Note On / Attack, 0 = Release)<br>• Bit 1: **SYNC** (Hard-Sync mit Vorgängerstimme)<br>• Bit 2: **RINGMOD** (Ring-Modulation mit Vorgängerstimme)<br>• Bit 3: **TEST** (Oszillator zurücksetzen)<br>• Bit 4: **TRIANGLE** (`$11` mit Gate)<br>• Bit 5: **SAWTOOTH** (`$21` mit Gate)<br>• Bit 6: **PULSE/RECT** (`$41` mit Gate)<br>• Bit 7: **NOISE** (`$81` mit Gate, Galois LFSR) |
| `+$05` | **ATTACK_DEC** | 8 Bit | High-Nibble (Bits 7–4) = **Attack** (2ms – 8s)<br>Low-Nibble (Bits 3–0) = **Decay** (6ms – 24s) |
| `+$06` | **SUST_REL** | 8 Bit | High-Nibble (Bits 7–4) = **Sustain-Lautstärke** (0–15)<br>Low-Nibble (Bits 3–0) = **Release-Zeit** (6ms – 24s) |

### Globale Filter- & Master-Register:

| Adresse | Register-Name | Funktion |
| :--- | :--- | :--- |
| `$D415` | **CUTOFF_LO** | Untere 3 Bits der 11-Bit Filter-Cutoff-Frequenz (Bits 0–2). |
| `$D416` | **CUTOFF_HI** | Obere 8 Bits der Filter-Cutoff-Frequenz (30 Hz bis 12 kHz). |
| `$D417` | **RES_ROUT** | Bits 7–4: **Resonanz (Q-Faktor 0–15)**.<br>Bits 3–0: **Filter-Routing** (Bit 0 = V1 filtern, Bit 1 = V2 filtern, Bit 2 = V3 filtern, Bit 3 = Externer Eingang). |
| `$D418` | **MODE_VOL** | Bits 7–4: **Filter-Modus** (`$10` = Lowpass, `$20` = Bandpass, `$40` = Highpass, `$30` = Notch).<br>Bits 3–0: **Master-Lautstärke (0–15)**. |

---

## 2. Timing-Hierarchie: Wie oft werden die Register aktualisiert?

Rob Hubbard nutzte die **PAL-Bildwiederholfrequenz (Raster-Interrupts des VIC-II Grafikchips)** als Master-Clock für seine Sound-Engine:

* **PAL Bildrate:** Exakt **50,0 Hz** (Europäischer C64).
* **Interrupt-Intervall:** Alle **20,0 Millisekunden** ($1 / 50 = 0.02\,\text{s}$).
* **NTSC Bildrate:** **60,0 Hz** (16,6 Millisekunden).

```
 1 Sekunde Audio (1000ms)
 ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬ ⋯ ┬────┐
 │F00 │F01 │F02 │F03 │F04 │F05 │F06 │F07 │F08 │F09 │   │F49 │  (50 Frames / Register-Schreibzyklen)
 └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴ ⋯ ┴────┘
   │
   ▼ Alle 20 Millisekunden (1 Frame = 1 Tick) ruft der C64 die Play-Routine auf:
   - Berechnet neue Tonhöhen (Frequenzen) für Stimme 1, 2, 3
   - Moduliert Pulsbreiten-LFOs (PWM)
   - Führt Hüllkurven- & Arpeggio-Schritte aus
   - Schreibt bis zu 25 Bytes in die SID-Register $D400–$D418
```

### Musikalische Noten-Geschwindigkeit (Speed & BPM):
In Standard-Hubbard-Tracks läuft ein musikalischer 16tel-Schritt mit **Speed 6**:
* **1 Step (16tel Note)** = 6 Frames = $6 \times 20\,\text{ms} = 120\,\text{ms}$.
* **1 Viertelnote (4 Steps)** = 24 Frames = $480\,\text{ms}$.
* **BPM (Tempo)** = $\frac{60\,000\,\text{ms}}{480\,\text{ms}} = \mathbf{125{,}0\ \text{BPM}}$.

---

## 3. Die 5 Kern-Modulationen von Rob Hubbard

Rob Hubbard hat die Grenzen des 3-stimmigen SID-Chips durch 5 charakteristische Register-Modulationen überwunden:

### 1. 50Hz Ultra-Fast Arpeggio Chords (Harmonie-Simulation auf 1 Stimme)
* **Problem:** Der SID hat nur 3 Stimmen. Wenn 1 Stimme Lead und 1 Stimme Bass/Drums spielt, bleibt nur 1 Stimme für Akkorde.
* **Hubbards Lösung:** Er ändert die Frequenzregister `$D407/$D408` **jeden Frame (alle 20ms)** zyklisch zwischen 3 oder 4 Tönen hin und her:
  * Frame 0: Grundton (z. B. A-3 $\rightarrow$ `$0E28`)
  * Frame 1: Kleine Terz C-4 $\rightarrow$ `$10DA` (+3 Halbtöne)
  * Frame 2: Quinte E-4 $\rightarrow$ `$141F` (+7 Halbtöne)
  * Frame 3: Kleine Septime G-4 $\rightarrow$ `$1830` (+10 Halbtöne)
* **Akustischer Effekt:** Das menschliche Gehör kann 20ms-Wechsel nicht mehr als Einzeltöne trennen, sondern nimmt einen dichten, schwebenden **Moll-7 Akkord** wahr!

### 2. PWM-LFO Modulation (Der breite Hubbard-Chorus-Sound)
* **Register:** `$D402/$D403` (PW Stimme 1), `$D409/$D40A` (PW Stimme 2).
* **Modulation:** In jedem Frame erhöht Hubbard die 12-Bit Pulsbreite um einen festen Wert (z. B. $+32$), bis 3800 erreicht ist, und zählt dann wieder herunter auf 300.
* **Akustischer Effekt:** Die Pulsbreite moduliert stufenlos von 10% bis 90%. Dadurch entsteht ein extrem fetter, analoger Flanger/Chorus-Sound ohne externe Effekte.

### 3. Pitch-Scoops & Vibrato (Das "Heroic" Solo-Feeling)
* **Register:** `$D400/$D401` (Voice 1 Frequenz).
* **Pitch-Scoop:** Beim Anschlag einer neuen Note startet Hubbard 2 Halbtöne tiefer und gleitet in 3 Frames (60ms) auf die Zieltonhöhe.
* **Delayed Vibrato:** Nach 12 Frames (240ms) schaltet die Engine einen 5,5Hz Sinus/Dreieck-LFO auf die Frequenz auf ($\pm 15$ Frequenz-Einheiten).

### 4. Voice 3 Drum Multiplexing (Der "Interrupt-Trick")
* **Problem:** Der C64 hat keine dedizierte Drum-Spur.
* **Hubbards Lösung:** Stimme 3 teilt sich Bassline und Schlagzeug.
  * Spielt normalerweise eine tiefe Bassline (Sägezahn `$21`).
  * Auf den Beats 4, 12, 20... schaltet die Routine `$D412` schlagartig auf **Rauschen (`$81`)** und setzt `$D413` auf schnellen Attack/Decay (`$06`).
  * Nach 4 Frames (80ms) schaltet sie zurück auf Sägezahn (`$21`) und spielt die Bassline weiter.

### 5. Analoge 6581 Filter-Sweeps
* **Register:** `$D415` & `$D416` (Cutoff) + `$D418` (Modus `$2F` Bandpass).
* **Modulation:** In Meilensteinen wie *Delta*, *Sanxion* oder *Spellbound* läuft ein 11-Bit Envelope-Generator über den Filter-Cutoff (von 200 Hz bis 8 kHz).

---

## 4. Wie entstehen daraus wiederholbare Patterns & Motifs?

Obwohl die Register 50 Mal pro Sekunde geschrieben werden, besteht Rob Hubbards Musik nicht aus endlosem Chaos, sondern aus einer **strengen 4-Ebenen-Hierarchie**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               DIE 4-EBENEN-HIERARCHIE DER HUBBARD-KOMPOSITION                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  EBENE 4: SONG-ARRANGEMENT (Order-Liste)                                               │
│  [ Phrase 00 ] ──➔ [ Phrase 01 ] ──➔ [ Phrase 02 ] ──➔ [ Phrase 00 (Wdh.) ] ──➔ ...     │
│  (Legt fest, welches 64-Step Pattern in welcher Reihenfolge abgespielt wird)           │
│                                                                                        │
│  EBENE 3: 3-SPUR PATTERNS / MOTIFS (64 Steps = 4 Takte)                                │
│  ┌────────────────────────┬────────────────────────┬────────────────────────┐          │
│  │ SPUR 1: LEAD MOTIF     │ SPUR 2: ARP MOTIF      │ SPUR 3: BASS/DRUM RIFF │          │
│  │ Step 00: C-4 (Inst 01) │ Step 00: A-m7 (Inst 03)│ Step 00: D-SD (Snare)  │          │
│  │ Step 06: D#4 (Inst 01) │ Step 06: A-m7 (Inst 03)│ Step 04: C-2  (Bass)   │          │
│  └────────────────────────┴────────────────────────┴────────────────────────┘          │
│                                                                                        │
│  EBENE 2: MODULARE INSTRUMENTE & MACRO-TABELLEN                                        │
│  Inst #01 (Lead): Wellenform $41, ADSR $0900, PulseWidth 2048, Macro "P02 Pitch-Scoop" │
│  Inst #03 (Arp):  Wellenform $41, ADSR $0400, Macro "A-m7 Arp Table (+0, +3, +7, +10)"│
│  Inst #07 (Snare):Wellenform $81 (Noise), ADSR $0600, Filter Bypass                    │
│                                                                                        │
│  EBENE 1: 50Hz REGISTER-STREAM (Der Hardware-Ausgabestrom)                             │
│  Frame 0: $D400=$28, $D401=$0E, $D404=$41, $D407=$28, $D408=$0E, $D418=$2F ...        │
│  Frame 1: $D400=$3A, $D401=$0E, $D404=$41, $D407=$DA, $D408=$10, $D418=$2F ...        │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Warum ist das für Sie als Remixer so entscheidend?
1. **Separation von Noten und Sound:** Die Notenwerte (Tonhöhe und Zeitpunkt) sind in Ebene 3 definiert. Der eigentliche SID-Sound (ADSR, Filter, PWM, Arpeggios) ist in Ebene 2 gekapselt.
2. **Punktgenaues Editieren:** Wenn Sie im Tracker eine Note von `C-4` auf `D-4` ändern, muss der Tracker nicht den 50Hz-Filter-Sweep oder die PWM neu erfinden. Er tauscht nur die 16-Bit Basis-Frequenz aus – **alle analogen Filter-Sweeps, PWM-Wellen und Drum-Interrupts bleiben zu 100% originalgetreu erhalten!**

---

## 5. Konkrete Register-Muster berühmter Hubbard-Klassiker

| Track | Stimme 1 (Lead) | Stimme 2 (Akkord/Arp) | Stimme 3 (Bass/Drums) | Filter ($D415–$D418) |
| :--- | :--- | :--- | :--- | :--- |
| **Commando** (1985) | `$41` Puls (PW: 50%), Pitch-Scoop `$0900` ADSR | `$41` Puls, 50Hz Arp (`A-m7`: +0, +3, +7, +10) | Multiplex: `$81` Noise Snare + `$41` Slap-Bass | `$2F` 12dB Bandpass auf Stimme 1 & 2 |
| **Monty on the Run** (1985)| `$21` Sägezahn, Ultra-Fast 16tel Runs | `$41` Puls mit stufenlosem PWM-LFO (10%–90%) | `$81` Hi-Speed Snare-Rolls & Bass-Pops | Bypass oder dezenter Lowpass `$1F` |
| **Delta** (1987) | `$41` Puls + Delayed Vibrato | `$43` Hard-Sync + `$15` RingMod Sweeps | `$11` Dreieck Sub-Bass + Noise Kick | Dynamischer 11-Bit Bandpass Filter-Sweep |
| **IK+** (1987) | `$11` Flöte mit Vibrato & `$41` Lead | `$41` 50Hz Arpeggios (Moll 9) | `$41` Slap-Bass mit Oktav-Pop (+12 HT) | `$2F` Bandpass mit hoher Resonanz (Q=14) |
| **Sanxion** (1986) | `$21` Sägezahn Lead | `$41` Puls Arp mit schneller PWM | `$81` Trash-Snare + `$11` Bass | Extremer Resonanz-Sweep ($D417=$F7) |

---

## 6. So nutzen Sie dieses Wissen in Tracker 3 & Tracker 4

1. **Tonhöhen ändern (Pitches):**
   * Im Notengrid ändern Sie einfach den Ton (z. B. mit Tastatur <kbd>A</kbd>, <kbd>W</kbd>, <kbd>S</kbd>).
   * Der Decompiler berechnet sofort die 16-Bit Registerwerte für `$D400/$D401` neu.
2. **Instrumenten-Sound anpassen (Patches):**
   * Im **MOS 6581 Sound Lab** ändern Sie Wellenformen (Puls `$41`, Säge `$21`, RingMod `$15`, Sync `$43`), Pulsbreite oder ADSR.
   * Dies aktualisiert sofort die Register `$D402–$D406` bzw. `$D409–$D40D`.
3. **Wiederkehrende Patterns neu anordnen (Arrangieren / Remixen):**
   * In der **Song-Timeline** können Sie die Motifs (`M01`, `M02`, `A01`, `B01`) duplizieren, verschieben oder durch neue eigene Phrasen ersetzen.
4. **Als C64-Binary exportieren:**
   * Klick auf `💾 .SID` generiert eine echte, 100% abspielbare **PSID v2 Datei**, die auf echter C64-Hardware und in jedem SID-Player läuft!
