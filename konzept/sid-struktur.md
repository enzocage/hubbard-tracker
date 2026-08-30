# Die innere Organisation von SID-Dateien (C64)
### Technische Architektur, 6502-Maschinencode-Laufzeit & Abgrenzung zur Tracker-Struktur

---

## 🧭 Übersicht & Grundlegendes Paradigma

Eine C64 `.sid`-Datei (im PSID- oder RSID-Standard) unterscheidet sich fundamental von klassischen Musik- und Tracker-Formaten wie `.mod`, `.xm`, `.it`, `.s3m` oder MIDI. 

> [!IMPORTANT]
> Eine SID-Datei ist **keine statische Noten-Datentabelle**, sondern ein **vollwertiges, kompiliertes 6502-Maschinencode-Programm**. Es existiert kein genormtes "Tracker-Pattern", kein standardisierter Noten-Event-Stream und keine feste Instrumenten-Struktur im Dateiformat. Jede Note, jede Hüllkurve und jeder Klang wird zur Laufzeit algorithmisch durch Assembler-Routinen des MOS 6510 Prozessors berechnet.

---

## 🏛️ 1. Dateistruktur: Das PSID / RSID Dateiformat

Eine `.sid`-Datei gliedert sich in zwei Hauptsegmente:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PSID / RSID HEADER (32 bis 124 Bytes)                               │
│    • Magic Bytes: 'PSID' ($50 53 49 44) oder 'RSID'                    │
│    • Version: Version 1, 2, 3 oder 4 ($0002)                           │
│    • Data Offset: Byte-Position des 6502-Programms (z.B. $007C)        │
│    • Load Address: Zieladresse im C64-RAM (z.B. $1000 oder $8000)      │
│    • Init Address: Einsprungpunkt zur Initialisierung (z.B. JSR $1000) │
│    • Play Address: Einsprungpunkt für 50Hz Interrupt (z.B. JSR $1003)  │
│    • Songs / Default Song: Anzahl enthaltener Subtunes                 │
│    • Speed Flag: 0 = 50 Hz PAL VBI Interrupt, 1 = CIA 1 Timer          │
│    • Metadaten: Name (32B), Artist (32B), Copyright (32B)              │
├────────────────────────────────────────────────────────────────────────┤
│ 2. 6502 MASCHINENCODE & PROPRIETÄRE DATENSTRÖME                        │
│    • Assembler-Routinen (LDA, STA $D400, JSR, RTS, INX, BNE...)        │
│    • Frequenz-Lookup-Tabellen (16-Bit $D400-Werte für alle Halbtöne)   │
│    • Proprietäre Sequenz-, Befehls- & Phrasen-Streams des Komponisten  │
│    • Zero-Page Laufzeitvariablen ($02-$FF)                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Technische Header-Felder (PSID-v2):

| Offset | Länge | Feld | Bedeutung |
| :--- | :--- | :--- | :--- |
| `+$00` | 4 Bytes | `magicID` | `'PSID'` oder `'RSID'` (ASCII) |
| `+$04` | 2 Bytes | `version` | `$0001` (v1) oder `$0002` (v2/v3/v4) |
| `+$06` | 2 Bytes | `dataOffset`| Offset zum Maschinencode (üblicherweise `$007C`) |
| `+$08` | 2 Bytes | `loadAddress`| C64-Speicheradresse (wenn `$0000`, erste 2 Bytes des Codes) |
| `+$0A` | 2 Bytes | `initAddress`| Startadresse der Initialisierungs-Routine |
| `+$0C` | 2 Bytes | `playAddress`| Startadresse der 50Hz Play-Interrupt-Routine |
| `+$0E` | 2 Bytes | `songs` | Anzahl der Lieder in dieser Datei |
| `+$10` | 2 Bytes | `startSong` | Standard-Liednummer (1-basiert) |
| `+$12` | 4 Bytes | `speed` | 32-Bit Bitmaske (0 = VBI 50Hz, 1 = CIA Timer) |
| `+$16` | 32 Bytes | `title` | Titel des Musikstücks (Null-terminierter ASCII-String) |
| `+$36` | 32 Bytes | `author` | Name des Komponisten (z.B. "Rob Hubbard") |
| `+$56` | 32 Bytes | `released` | Copyright / Erscheinungsjahr (z.B. "1985 Mastertronic") |

---

## ⚙️ 2. Die 6502-Maschinencode Laufzeit-Architektur

Im Commodore 64 existieren zwei zentrale Einsprungpunkte, über die das Betriebssystem die Musik ansteuert:

```
                               C64 KERNEL / HARDWARE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
           Einmalig beim Start                     Alle 20 Millisekunden (50 Hz)
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │   JSR initAddress     │                       │    JSR playAddress    │
     │      (z.B. $1000)     │                       │      (z.B. $1003)     │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 ▼                                               ▼
     • Stummschalten aller Stimmen                   • Asynchroner Zustandsautomat
     • Register $D400..$D418 = 0                     • Dekrementiert Frame-Zähler
     • Akkumulator A = Subtune-ID                    • Liest Bytecode-Ströme
     • Setzt Pointers auf Phrasen-Tabellen           • Führt Micro-Pitch/Arps aus
                                                     • Schreibt Frequenzen & ADSR
```

### 1. Die `INIT`-Routine (`JSR $1000`):
* Wird beim Start des Programms oder beim Titelwechsel genau **einmal** aufgerufen.
* Schreibt `$00` in alle 25 SID-Register (`$D400`–`$D418`), um Rauschen und Störgeräusche zu verhindern.
* Liest die Liednummer aus dem Register `A` und initialisiert die Zero-Page-Zeiger auf die Song-Sequenz-Tabellen.

### 2. Die `PLAY`-Routine (`JSR $1003`):
* Wird exakt **50-mal pro Sekunde** (alle $20.0\text{ ms}$) über den C64 PAL-Rasterstrahl-Interrupt (Vertical Blank Interrupt - VBI) aufgerufen.
* Arbeitet als **asynchroner Zustandsautomat (State Machine)**. Es gibt keine Schleifen mit Wartezeiten; jeder Aufruf muss innerhalb von maximal $2000$ bis $4000$ CPU-Zyklen beendet sein und mit `RTS` zurückkehren.

---

## 🧬 3. Rob Hubbards Bytecode- & Treiber-Organisation

Rob Hubbard nutzte keinen Standard-Tracker (die es 1985 noch gar nicht gab), sondern programmierte ein hochoptimiertes, eigenes Bytecode-Treibersystem direkt in Assembler:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ROB HUBBARD BYTECODE-STREAM STRUKTUR                                   │
├──────────────┬─────────────────────────┬───────────────────────────────┤
│ BYTE-BEREICH │ BEDEUTUNG               │ AKTION IM 6502-TREIBER        │
├──────────────┼─────────────────────────┼───────────────────────────────┤
│ $00 .. $5F   │ Noten-Tonhöhe (Index)   │ Schlägt 16-Bit Frequenz in    │
│              │ (z.B. $24 = A-4)        │ interner ROM-Tabelle nach     │
├──────────────┼─────────────────────────┼───────────────────────────────┤
│ $60 .. $7F   │ Tondauer (Gate/Frames)  │ Setzt Notendauer-Zähler       │
│              │ (z.B. $66 = 6 Frames)   │ auf N Ticks (N * 20ms)        │
├──────────────┼─────────────────────────┼───────────────────────────────┤
│ $80 .. $FE   │ Befehls- & Modulations- │ Ändert Wellenform ($41, $15), │
│              │ Opcodes (Escape Codes)  │ setzt ADSR, startet LFO/Filter│
├──────────────┼─────────────────────────┼───────────────────────────────┤
│ $FF          │ Phrasen-Ende / Loop     │ Setzt Zeiger auf Start zurück │
└──────────────┴─────────────────────────┴───────────────────────────────┘
```

### Assembler-Beispiel aus Rob Hubbards Engine:

```assembly
; Fragment aus dem Rob Hubbard Sound-Driver
play_voice1:
    dec voice1_duration        ; Dekrementiere Noten-Restdauer
    bne update_pitch_effects   ; Wenn Dauer > 0, nur Pitch-FX (Scoop/Vibrato) berechnen
    
fetch_next_byte:
    ldy voice1_ptr             ; Lese Zeiger auf Notenstream
    lda (voice1_stream),y
    iny
    sty voice1_ptr
    
    cmp #$FF                   ; Ist es das Ende der Sequenz?
    beq loop_sequence
    cmp #$80                   ; Ist es ein Steuerbefehl (Wellenform/ADSR)?
    bcs execute_command
    
    ; Note setzen: Frequenz aus Tabelle holen
    tax
    lda freq_table_lo,x        ; Low-Byte Frequenz
    sta $D400                  ; SID Stimme 1 Frequenz Low
    lda freq_table_hi,x        ; High-Byte Frequenz
    sta $D401                  ; SID Stimme 1 Frequenz High
    rts
```

---

## 🎛️ 4. Sub-Tick Modulatoren & Hardware-Multiplexing

In SID-Dateien existieren kontinuierliche Klangphänomene, die völlig außerhalb des klassischen Tracker-Rasters operieren:

```
┌───────────────────────────────────┬────────────────────────────────────────────────────────┐
│ SUB-TICK MODULATOR                │ HARDWARE-FUNKTIONSWEISE IM 6502 DRIVER                 │
├───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Exponentieller Pitch-Scoop     │ Auf jedem 50Hz-Frame addiert der 6502 einen Offset     │
│    (Signature Hubbard Attack)     │ ($D400 = $D400 + Delta) bis der Zielton erreicht ist.  │
├───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 2. 50Hz Sub-Tick Arpeggios        │ Ein Frame-Zähler modulo 3 oder 4 schaltet bei jedem    │
│    (Akkorde auf 1 Stimme)         │ VBI-Interrupt zwischen den Tönen um (1 Frame pro Ton). │
├───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 3. Dynamischer PWM LFO Sweep      │ Ein 16-Bit Software-Akkumulator moduliert die Puls-    │
│    (Breiter Analogsound)          │ weite ($D402/$D403) kontinuierlich rauf und runter.    │
├───────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 4. Stimme 3 Interrupt-Muxing      │ Stimme 3 spielt Bass ($41). Beim Drum-Hit wird die     │
│    (Bass + Drums gleichzeitig)    │ Stimme für 2 Frames auf Rauschen ($81) geschaltet und  │
│                                   │ danach wieder auf den vorherigen Bass-Ton restauriert. │
└───────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## ⚖️ 5. Detaillierter Systemvergleich: SID vs. Tracker

| Dimension | Klassischer Tracker (ProTracker / FastTracker / MOD) | Rob Hubbard C64 SID-Dateien |
| :--- | :--- | :--- |
| **Grundnatur** | Statische **Datenmatrix** aus Pattern-Reihen und Sample-Headern. | **Kompiliertes 6502-Maschinencode-Programm**, das zur Laufzeit ausgeführt wird. |
| **Portabilität** | Universell von jedem Tracker abspielbar, da Standard-Format. | Jeder Komponist (Hubbard, Galway, Tel) hat seinen eigenen, inkompatiblen Code geschrieben. |
| **Noten-Konzept** | Diskrete Events (`Note-On`, `Note-Off`, `Instrument-ID`, `Volume`). | Kontinuierliche 16-Bit Register-Schreibzugriffe auf die Adressen `$D400`–`$D418`. |
| **Zeitauflösung** | Zeilen-basiert (Rows), gesteuert über BPM und Ticks pro Zeile. | Exakter 50.0 Hz Hardware-Interrupt (jeder Frame dauert exakt 20 Millisekunden). |
| **Instrumenten-Modell**| Feste Instrumenten-Slots mit statischen Hüllkurven und Samples. | Algorithmischer Zustandsautomat: Instrumente können sich von Frame zu Frame transformieren. |
| **Polyphonie / Drums**| Feste Spurenanzahl (z.B. Track 4 = exklusiv für Samples/Drums). | Nur 3 Hardware-Oszillatoren: Drums teilen sich Stimme 3 über Zeitschlitz-Multiplexing. |
| **Arpeggios** | Effekt-Befehl (z.B. `047` für Moll-Akkord). | Manuelle CPU-Interrupt-Tabellen, die die Oszillator-Frequenz 50-mal/s umschreiben. |

---

## 🔄 6. Rekonstruktion & Übersetzung in das Tracker-Format

Damit ein moderner Musiker eine SID-Datei in einer Tracker-Oberfläche wie **`tracker.html`** betrachten und editieren kann, muss ein mehrstufiger Decompilations-Prozess durchlaufen werden:

```
┌────────────────────────┐
│ .SID DATEI (6502 CODE) │
└───────────┬────────────┘
            │ 1. 6502-CPU-Emulation führt JSR $1000 (Init) und 50Hz JSR $1003 (Play) aus
            ▼
┌────────────────────────┐
│ REGISTER-TELEMETRIE    │ Capture aller 25 Hardware-Register ($D400-$D418) pro 50Hz-Frame
└───────────┬────────────┘
            │ 2. Frequenz-Detektion über PAL-Formel: Hz = (f_raw * 985248) / 16777216
            │ 3. Noten-Mapping: MIDI = 69 + 12 * log2(Hz / 440) ➔ "C-4", "E-7", "A-1"
            │ 4. Instrumenten-Klassifikation über Steuerregister ($D404, $D405, $D406)
            │ 5. Trennung von Stimme-3-Multiplexing (Bass $41 vs. Noise-Drum $81)
            ▼
┌────────────────────────┐
│ 64-ZEILEN PATTERN-GRID │
│ (TRACKER.HTML)         │ Standardisiertes, editierbares Tracker-Raster (6 Frames/Zeile)
└────────────────────────┘
```

Durch diese Pipeline wird die komplexe, kontinuierliche 6502-Assembler-Zustandsmaschine in eine musikalisch intuitive, voll editierbare und wieder exportierbare Tracker-Partitur transformiert.
