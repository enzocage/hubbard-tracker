# Umsetzungs- & Entwicklungsplan: Rob Hubbard SID Composer
## Vom Regelwerk zu lauffähigen, abspielbaren Commodore-64 `.sid`-Dateien

---

## 1. Executive Summary & Zielsetzung

Auf Basis der in `hubbard.md`, `50criteria.md` und `patterns_and_algorythms.md` erarbeiteten 50 Kriterien, mathematischen Modelle und Algorithmen wird in diesem Dokument der **konkrete technische Entwicklungsplan** festgelegt.

**Das finale Ziel:** Ein vollständig integriertes, autonomes Python-basiertes Kompositions- und Build-System, das auf Knopfdruck **vollständig valide, fehlerfreie und auf jedem C64-Emulator / SID-Player abspielbare `.sid`-Dateien** im unverkennbaren Stil von Rob Hubbard generiert.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         END-TO-END PIPELINE DES ROB HUBBARD COMPOSERS                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Parameter / Prompt ──► [Genre-Archetyp: SpeedAction / SpaceProg / Ballad / Funk / Cyber]      │
│                                           │                                                      │
│                                           ▼                                                      │
│ 2. Generative Engine   ──► [Form-Planer ──► Harmonik ──► Melodie ──► Arp-Tables ──► Bass/Drums]  │
│                                           │                                                      │
│                                           ▼                                                      │
│ 3. 6502-Data-Compiler  ──► [Bytecode-Generator: Noten-Sequenzen, Instrumenten- & Filtertabellen] │
│                                           │                                                      │
│                                           ▼                                                      │
│ 4. Assembler & Linker  ──► [Injektion in 6502-Hubbard-Sound-Driver ──► PSID-v2-Header Builder]   │
│                                           │                                                      │
│                                           ▼                                                      │
│ 5. Validierung/Testing ──► [6502-CPU/SID-Emulator Headless Test ──► Register-Trace-Prüfung]      │
│                                           │                                                      │
│                                           ▼                                                      │
│ 6. Output-Artefakt     ──► [Lauffähige *.sid Datei (z.B. Action_Anthem.sid)]                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System-Architektur & Modulübersicht

Das Gesamtsystem wird in vier modulare, sauber gekapselte Komponenten gegliedert:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MODUL-ARCHITEKTUR DES COMPOSERS                                 │
├────────────────────────────────┬────────────────────────────────┬────────────────────────────────┤
│ MODUL A: GENERATIVE COMPOSER   │ MODUL B: 6502 SOUND DRIVER     │ MODUL C: BUILD & ASSEMBLER     │
│ (Python Engine)                │ (6502 Assembler Template)      │ (Zero-Dependency Python Tools) │
├────────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ • Macro-Form-Planer            │ • Frame-Interrupt Play-Routine │ • Integrierter 6502-Assembler  │
│ • Chord Progression Generator  │ • Voice 1 Lead & Pitch-Scoop   │ • PSID v2 Header-Generator     │
│ • Lead/Solo Phraser            │ • Voice 2 Arp- & Pad-Engine    │ • Bytecode-Packer & Linker     │
│ • Voice 3 Drum Multiplexer     │ • Voice 3 Bass & Drum Steal    │                                │
│ • Filter- & PWM-Automator      │ • Dynamic Filter Automation    │                                │
├────────────────────────────────┴────────────────────────────────┴────────────────────────────────┤
│ MODUL D: VALIDIERUNG & EMULATIONSTEST (Python 6502 Virtual Machine)                              │
│ • Führt 6502-Init ($1000) und 500+ Play-Frames ($1003) headless aus                              │
│ • Verifiziert fehlerfreie $D400-$D418 Schreibzugriffe, kein Einfrieren, ADSR-Integrität          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phasen-Roadmap zur Realisierung

Die Entwicklung erfolgt in **5 strukturierten Phasen**:

```
[Phase 1: 6502 Driver Core] ──► [Phase 2: Assembler & PSID] ──► [Phase 3: Generative Engine]
                                                                        │
                                                                        ▼
[Phase 5: Finale SID-Releases] ◄── [Phase 4: Testbench & Emulation] ◄───┘
```

---

### Phase 1: Der Rob Hubbard 6502 Sound Driver (`hubbard_driver.asm`)

**Ziel:** Erstellung eines hochoptimierten, standardkonformen 6502-Assembler-Musiktreibers, der die Hardware des MOS 6581 exakt nach Rob Hubbards Spielregeln ansteuert.

#### Kernaufgaben:
1. **Memory Map festlegen:**
   - `$1000`–`$1002`: `JMP init_sound` (Einsprungadresse für SID-Init).
   - `$1003`–`$1005`: `JMP play_frame` (Einsprungadresse für 50Hz Raster-Interrupt).
   - `$1006`–`$15FF`: Treibercode (Player-Engine, Voice-Handler, Filter-Automation).
   - `$1600`–`$17FF`: Instrumenten-, Arpeggio-, PWM- und Filter-Tabellen.
   - `$1800`–`$1FFF`: Sequencer-Orderlists und Track-Bytecode für Voice 1, 2 und 3.
2. **Implementierung des Voice 1 Lead-Handlers:**
   - Pitch-Scoop: Noten starten optional $-1..-3$ Halbtöne tiefer und sliden in 3 Frames hoch.
   - Delayed Vibrato: Nach $N$ Frames startet Dreiecks-LFO auf Frequenzregister `$D400/$D401`.
   - Portamento: Automatischer Halbton-Slide bei gesetztem Legato-Bit.
3. **Implementierung des Voice 2 Arpeggio- & Pad-Handlers:**
   - 50Hz Single-Frame Arp-Engine (Pointer liest pro Frame nächsten Halbton-Offset).
   - Waveform-Cycling: Synchrones Umschalten von Saw/Pulse/Tri pro Arpeggio-Schritt.
4. **Implementierung des Voice 3 Bass- & Drum-Multiplexers:**
   - State-Machine: Bei Drum-Trigger (Kick, Snare, Hat) wird Stimme 3 für 1–3 Frames auf Noise/Pulse umgestellt.
   - Nach Ablauf des Drum-Timers: Sofortige, klickfreie Wiederherstellung von Basston, Waveform und ADSR.
5. **Implementierung der Filter- & PWM-Automation:**
   - LFO-gesteuerter Cutoff-Sweep über `$D415/$D416`.
   - PWM-LFO über `$D402/$D403` und `$D409/$D40A`.
   - ADSR-Bug-Workaround: Sicheres Gate-Clearing vor Notenneustart.

---

### Phase 2: Zero-Dependency 6502-Assembler & PSID-Builder (`sid_builder.py`)

**Ziel:** Eine leichtgewichtige, plattformunabhängige Python-Toolchain, die aus 6502-Assembly und generierten Datenbytes direkt eine abspielbare `.sid`-Datei erzeugt, ohne externe Compiler installieren zu müssen.

#### Kernaufgaben:
1. **Integrierter 6502-Assembler / Byte-Linker:**
   - Übersetzung von Opcodes (LDA, STA, JSR, RTS, BNE, etc.) und Adressierungsmodi (Immediate, Absolute, Zero-Page, Absolute,X/Y, Indirect,Y).
   - Symbol- und Label-Auflösung in zwei Durchläufen (Pass 1: Symbol-Table, Pass 2: Bytecode-Generierung).
2. **PSID v2 Header-Packer:**
   - Generierung des standardisierten 124-Byte PSID-Headers:
     - Magic: `'PSID'` (4 Bytes).
     - Version: `$0002` (2 Bytes).
     - Data Offset: `$007C` (124 Bytes).
     - Load Address: `$1000` (oder `$0000` mit 2-Byte C64-Load-Header).
     - Init Address: `$1000`.
     - Play Address: `$1003`.
     - Songs: `1`, StartSong: `1`.
     - Speed: `$00000000` (50Hz Vertical Blank / PAL Rasterzeile).
     - Title, Author, Released: Null-terminierte ASCII-Strings (z.B. "Commando 2026", "Rob Hubbard AI Composer", "2026 AI").
     - Flags: `$0014` (PAL, MOS 6581).
3. **Automatischer `.sid`-Dateiexport.**

---

### Phase 3: Die Generative Kompositions-Engine (`hubbard_composer.py`)

**Ziel:** Die programmtechnische Implementierung der 50 Kriterien und 5 Genre-Archetypen in Python.

#### Kernaufgaben:
1. **Archetyp-Konfigurations-Profile:**
   - `SpeedAction` (*Monty*, *Commando*, *Warhawk*): 135–152 BPM, Äolisch/Dorisch, Gallop-Bass, 32nd Solo.
   - `SpaceProg` (*Delta*, *Lightforce*, *Sanxion*): 124–132 BPM, Dorisch, $m^{11}$-Arps, Bandpass-Filter-Sweep.
   - `BaroqueBallad` (*Spellbound*, *Kentilla*): 88–110 BPM, Äolisch, Quintfall-Kadenzen, $4\to 3$ Vorhalte.
   - `JazzFunk` (*IK+*, *I, Ball*): 108–125 BPM, Kumoi/Dorisch, Slap-Bass-Oktaven, Ringmod-Percussion.
   - `CyberMetal` (*The Last V8*, *Zoids*): 120–138 BPM, Phrygisch, Hard-Sync-Lead, Powerchord-Arps.
2. **Harmonie- & Progressions-Generator:**
   - Erzeugt Stufenfolgen via Markov-Matrizen (Quintfall, Dorischer Pendel, Lamento-Bass).
   - Generiert frame-genaue Arpeggio-Offset-Tabellen ($m^7, m^9, m^{11}, sus^4$).
3. **Melodie- & Solo-Phrasierungs-Generator:**
   - Formt Melodiebögen nach Huron-Konturen.
   - Platziert Pitch-Scoops (+1..3 Halbtöne Slide) und Delayed-Vibrato (ab Frame 6).
   - Generiert 32tel-Skalenläufe für Solo-Passagen.
4. **Bass- & Percussion-Scheduler (Voice 3 Multiplexer):**
   - Wählt 16tel-Bitmasken für Bassriffs und streut Slap-Oktav-Pops auf Offbeats ein.
   - Verschachtelt Kick-, Snare- und Hi-Hat-Events frame-genau in die Basslinie.
5. **Filter- & Patch-Automator:**
   - Erzeugt Cutoff-Sweep-Tabellen und PWM-Parameter passend zum Spannungsverlauf $E(t)$.

---

### Phase 4: Validierung, Testbench & Emulation (`sid_validator.py`)

**Ziel:** Automatisierte Qualitäts- und Playback-Prüfung ohne manuelle Eingriffe.

#### Kernaufgaben:
1. **Headless 6502 CPU & SID Execution Testbench:**
   - Virtuelle 6502-CPU initialisiert den Song durch Aufruf von `JSR $1000`.
   - Ruft anschließend in einer Schleife 1500 Frames lang (entspricht 30 Sekunden Musik @ 50Hz) `JSR $1003` auf.
2. **Register-Schreib-Validierung:**
   - Loggen aller Zugriffe auf `$D400`–`$D418`.
   - Prüfen, ob alle 3 Stimmen Frequenzen, Gate-Signale und ADSR-Werte erhalten.
   - Prüfen, ob keine Deadlocks, Endlosschleifen oder illegalen Opcodes auftreten.
   - CPU-Zyklen-Messung: Jeder Frame-Aufruf muss unter 2.500 CPU-Zyklen bleiben (garantierte ruckelfreie C64-Ausführung).

---

### Phase 5: Generierung, Hörprobe & Auslieferung der Referenz-SIDs

**Ziel:** Produktion von 5 vollwertigen, abspielbaren Demonstrationsstücken als Beweis der Funktionsfähigkeit.

#### Zu generierende `.sid`-Dateien:
1. `Hubbard_Action_Anthem.sid` (High-Speed Action im Stil von *Commando* / *Monty on the Run*).
2. `Hubbard_Space_Odyssey.sid` (Progressive Space-Suite im Stil von *Delta* / *Lightforce*).
3. `Hubbard_Mystic_Ballad.sid` (Melancholische Barock-Ballade im Stil von *Spellbound*).
4. `Hubbard_Dragon_Funk.sid` (Fernöstlicher Jazz-Funk im Stil von *IK+*).
5. `Hubbard_Cyber_V8.sid` (Dystopischer Heavy Cyber-Rock im Stil von *The Last V8* / *Zoids*).

---

## 4. Detaillierte Dateistruktur des Composer-Projekts

```
c:\Users\enzoc\Desktop\AI Code\hubb\
├── sid/                         # 19 Original-Referenz-SIDs (unverändert)
├── hubbard.md                   # Musikalische & technische Charakteristika
├── 50criteria.md                # Das 50-Kriterien-System
├── patterns_and_algorythms.md   # Empirische Auswertung & mathematische Modelle
├── plan.md                      # Dieser Umsetzungs- & Entwicklungsplan
│
├── engine/                      # Der SID-Composer Quellcode
│   ├── __init__.py
│   ├── asm6502.py               # Zero-Dependency 6502-Assembler & PSID-Packer
│   ├── driver_template.asm      # 6502 Rob Hubbard Sound Driver Quellcode
│   ├── composer.py              # Generative Haupt-Engine (Macro, Harmonie, Melodie)
│   ├── voice3_mux.py            # Voice-3-Multiplexing & Drum-Scheduler
│   ├── patches.py               # SID-Instrumenten- & Filter-Bibliothek
│   └── validator.py             # 6502-Emulator & SID-Register-Tracer Testbench
│
├── generate.py                  # CLI-Interface zum Generieren neuer SIDs
└── output/                      # Generierte, abspielbare *.sid Dateien
    ├── Hubbard_Action_Anthem.sid
    ├── Hubbard_Space_Odyssey.sid
    ├── Hubbard_Mystic_Ballad.sid
    ├── Hubbard_Dragon_Funk.sid
    └── Hubbard_Cyber_V8.sid
```

---

## 5. Meilensteine & Checkliste zur Ausführung

- [ ] **Meilenstein 1:** `engine/asm6502.py` erstellen (voll funktionsfähiger 6502-Assembler mit PSID-Header-Export in purem Python).
- [ ] **Meilenstein 2:** `engine/driver_template.asm` schreiben (vollständiger Rob-Hubbard-kompatibler 6502-Treiber mit Voice 1–3 Engine und Filter-Automation).
- [ ] **Meilenstein 3:** `engine/patches.py` & `engine/voice3_mux.py` implementieren (Instrumenten-Presets, Arp-Tabellen, Drum-Stealing).
- [ ] **Meilenstein 4:** `engine/composer.py` & `generate.py` fertigstellen (Makro-Planer, Melodie-Generator mit Pitch-Scoop/Vibrato, Harmonie-Ketten).
- [ ] **Meilenstein 5:** `engine/validator.py` bauen (Headless 6502-Emulator zur Validierung der Bytecode-Integrität).
- [ ] **Meilenstein 6:** Generierung aller 5 Stil-SIDs in `output/` und finale Validierung.

Mit diesem Plan liegt das vollständige, sofort umsetzbare Konzept vor, um das theoretische Wissen aus den Markdown-Dateien in **reale, abspielbare SID-Dateien** zu transformieren.
