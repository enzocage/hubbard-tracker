# Das 50-Kriterien-System zur Analyse und algorithmischen Komposition von Rob-Hubbard-SID-Dateien
## Technischer Standard & Algorithmen-Katalog für den *Rob Hubbard SID Composer*

---

## 1. Einleitung & System-Architektur

Dieses Dokument definiert das **vollständige 50-Kriterien-System**, das als informationstheoretische und musikwissenschaftliche Brücke zwischen der Analyse historischer Commodore-64-Musikdateien (`.sid`) von **Rob Hubbard** und einem automatisierten, generativen **Rob Hubbard AI/Algorithmic Composer** dient.

Die 50 Kriterien sind in **10 funktionale Dimensionen** unterteilt. Für jedes Kriterium werden vier essenzielle Ebenen spezifiziert:
1. **Analyse- & Extraktions-Fokus:** Was wird aus den binären SID-Dateien / dem 6502-Maschinencode gemessen?
2. **Mathematisches Datenmodell & Datenstruktur:** Wie wird das extrahierte Merkmal als Vektor, Matrix, Graph oder Zeitreihe formalisiert?
3. **Generative Regel & Kompositions-Algorithmus:** Wie nutzt der Composer dieses Pattern zur Synthese neuer Musikdaten?
4. **SID-Register & Code-Referenz:** Welche Low-Level-Parameter des MOS 6581 (`$D400`–`$D418`) oder 6502-Treiberstrukturen sind direkt betroffen?

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         DER 50-KRITERIEN PIPELINE- & GENERIERUNGS-WORKFLOW                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [19 Original-SIDs] ──► [6502/SID Parser & Tracer] ──► [50-Kriterien Feature-Extraktion]          │
│                                                                  │                               │
│                                                                  ▼                               │
│ [Generierter .sid Code] ◄── [6502 ASM Compiler] ◄── [Rob Hubbard Generative Composer Engine]    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Die 50 Kriterien im Detail (10 Dimensionen)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ÜBERSICHT DER 10 DIMENSIONEN                                   │
├────────────────────────────────┬────────────────────────────────┬────────────────────────────────┤
│ 1. Makro-Struktur & Dramaturgie│ 2. Tonalität & Harmonik-Graph  │ 3. Bassline-Architektur        │
│    (Kriterien 1–5)             │    (Kriterien 6–10)            │    (Kriterien 11–15)           │
├────────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ 4. Melodieführung & Virtuosität│ 5. Micro-Pitch & Artikulation  │ 6. Voice-Multiplexing & 3-Voice│
│    (Kriterien 16–20)           │    (Kriterien 21–25)           │    (Kriterien 26–30)           │
├────────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ 7. Percussion- & Drum-Synthese │ 8. Arpeggio-Tabellen & Timbre  │ 9. PWM & Filter-Automation     │
│    (Kriterien 31–35)           │    (Kriterien 36–40)           │    (Kriterien 41–45)           │
├────────────────────────────────┴────────────────────────────────┴────────────────────────────────┤
│ 10. Low-Level 6502-Treiber, ADSR-Clustering & Bytecode-Grammatik (Kriterien 46–50)               │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Dimension 1: Makro-Struktur, Form-Architektur & Song-Dramaturgie

#### Kriterium 1: Formteil-Zustandsübergangsmatrix (Macro-State Machine)
- **Analyse-Fokus:** Erkennung und Klassifikation der übergeordneten Formteile (`Intro`, `Thema A`, `Thema B`, `Bridge`, `Solo`, `Breakdown`, `Reprise`, `Coda`) und deren zeitliche Abfolge.
- **Mathematisches Datenmodell:** $N \times N$ stochastische Übergangsmatrix $P(S_{t+1} \mid S_t)$ mit Zustandsmenge:
  $$S = \{\text{Intro}, \text{ThemeA}, \text{ThemeB}, \text{Bridge}, \text{Solo}, \text{Breakdown}, \text{Reprise}, \text{Coda}\}$$
  $$\sum_{j} P(S_j \mid S_i) = 1.0 \quad \forall i$$
- **Generative Anwendung:** Die Form-Engine durchläuft den Markov-Zustandsgraphen zur Erzeugung des Makro-Ablaufs und verhindert unauthentische Sprünge (z. B. Solo direkt nach Intro).
- **SID-Referenz:** Sequencer-Orderlist / Pattern-Pointer-Tabelle im Treiber.

#### Kriterium 2: Phrasen-Symmetrie & Taktgruppen-Histogramm (Bar Count Probability)
- **Analyse-Fokus:** Häufigkeitsverteilung von Phrasenlängen in Takten (4, 8, 12, 16 vs. asymmetrische 6, 10 Takte).
- **Mathematisches Datenmodell:** Diskrete Wahrscheinlichkeitsverteilung:
  $$P(L_{\text{bars}}) = [p_4: 0.15, p_8: 0.45, p_{12}: 0.05, p_{16}: 0.30, p_{\text{odd}}: 0.05]$$
- **Generative Anwendung:** Zuweisung exakter Taktbudgets pro Formteil zur Gewährleistung der periodischen Hubbard-Symmetrie.
- **SID-Referenz:** Pattern-Längenzähler / Loop-Zähler in 6502-Registern.

#### Kriterium 3: Dynamisches Spannungsprofil & Energy-Curve Trajectory
- **Analyse-Fokus:** Quantifizierung der musikalischen Dichte (Notenanzahl/Sekunde, Filteröffnung, Registerhöhe, Drum-Aktivität) über den gesamten Track.
- **Mathematisches Datenmodell:** Zeitreihe $E(t) \in [0.0, 1.0]$ mit Spline-Interpolation über $k$ Stützstellen:
  $$E(t) = \alpha \cdot \text{Density}(t) + \beta \cdot \text{PitchHeight}(t) + \gamma \cdot \text{FilterCutoff}(t) + \delta \cdot \text{DrumRate}(t)$$
- **Generative Anwendung:** Globale Leitkurve für alle Sub-Generatoren; steuert Notendichte im Solo und Modulationstiefe.
- **SID-Referenz:** Globales Volume (`$D418`), Filter Cutoff (`$D416`), Arpeggio-Dichte.

#### Kriterium 4: Modulations-Topologie & Tonart-Wechsel-Graph
- **Analyse-Fokus:** Identifikation von Tonartwechseln (z. B. D-Moll $\to$ F-Moll, Ganzton-Riser, Quintschritte) und deren Verweildauer.
- **Mathematisches Datenmodell:** Gerichteter gewichteter Graph $G = (V, E)$, wobei $V = \{\text{Keys}\}$ und $E = \{P(\text{Key}_B \mid \text{Key}_A)\}$.
- **Generative Anwendung:** Triggert Tonartwechsel im Solo- oder Reprise-Teil zur dramatischen Intensivierung.
- **SID-Referenz:** Frequenztabelle-Basisoffset / Transpositions-Byte im Pattern.

#### Kriterium 5: Metrische Konsistenz & Taktart-Wechsel-Vektor
- **Analyse-Fokus:** Erkennung von Taktarten (4/4, 3/4, 5/4, 7/8 in *Delta*, *Knucklebusters*) und Hemiolen.
- **Mathematisches Datenmodell:** Sequenz $\mathbf{M} = [(T_0, B_0), (T_1, B_1), \dots]$ mit $T_i \in \{4/4, 5/4, 7/8, 3/4, 6/8\}$ und Taktanzahl $B_i$.
- **Generative Anwendung:** Ermöglicht das gezielte Einflechten progressiver Metren für den Space-/Prog-Archetyp.
- **SID-Referenz:** Taktteilungs-Konstante im Raster-Interrupt.

---

### Dimension 2: Tonalität, Skalen & Harmonik-Graph

#### Kriterium 6: Skalen- & Modus-Klassifikationsprofil (Pitch Class Profile)
- **Analyse-Fokus:** Statistische Auswertung aller gespielten Noten gegen modale Schablonen (Äolisch, Dorisch, Harmonisch Moll, Moll-Pentatonik, Blues, Kumoi).
- **Mathematisches Datenmodell:** 12-dimensionaler normierter Chroma-Vektor $\mathbf{C} \in [0, 1]^{12}$ und Cosinus-Ähnlichkeit zu Modus-Vektoren $\mathbf{M}_k$:
  $$\text{Score}(k) = \frac{\mathbf{C} \cdot \mathbf{M}_k}{\|\mathbf{C}\| \|\mathbf{M}_k\|}$$
- **Generative Anwendung:** Definiert den Tonvorrat für Melodie- und Akkordgenerierung passend zum gewählten Modus.
- **SID-Referenz:** Noten-Mapping-Tabelle im Treiber.

#### Kriterium 7: Harmonische Dichte & Akkordwechsel-Rhythmus (Harmonic Rhythm)
- **Analyse-Fokus:** Zeitlicher Abstand zwischen zwei Akkordwechseln (gemessen in Beats / Viertelnoten).
- **Mathematisches Datenmodell:** Diskrete Verteilung $P(\Delta t_{\text{chord}}) \in \{1, 2, 4, 8, 16\text{ Beats}\}$.
- **Generative Anwendung:** Taktet die harmonischen Wechsel synchron zu Phrasengrenzen und Bassline-Zyklen.
- **SID-Referenz:** Arpeggio-Basisnoten-Wechsel im Sequencer.

#### Kriterium 8: Akkord-Progressions-Markov-Kette (Chord Transition Matrix)
- **Analyse-Fokus:** Stufen-Übergangswahrscheinlichkeiten in Moll- und Dur-Kontexten ($i, iv^7, VII^7, III^{maj7}, VI^{maj7}, ii^{\circ7}, V^7$).
- **Mathematisches Datenmodell:** $K \times K$ stochastische Matrix $P(\text{Chord}_{t+1} \mid \text{Chord}_t)$.
- **Generative Anwendung:** Generiert Hubbard-typische Kadenzen (Quintfall-Ketten, dorische Pendelakkorde, Lamento-Bässe).
- **SID-Referenz:** Root-Note-Tabelle für Stimme 2 und Stimme 3.

#### Kriterium 9: Akkord-Komplexitäts- & Erweiterungs-Index
- **Analyse-Fokus:** Häufigkeit von Dreiklängen, Vierklängen ($m^7, maj^7$), Fünfklängen ($m^9$), Sechsklängen ($m^{11}$) und Vorhalten ($sus^4$).
- **Mathematisches Datenmodell:** Vektor der Erweiterungswahrscheinlichkeiten:
  $$\mathbf{E} = [p_{\text{triad}}: 0.20, p_{7}: 0.40, p_{9}: 0.20, p_{11}: 0.05, p_{sus4}: 0.10, p_{dim}: 0.05]$$
- **Generative Anwendung:** Bestimmt die Auswahl der Halbton-Offsets beim Zusammenbau der Arpeggio-Tabellen.
- **SID-Referenz:** Halbton-Offset-Listen in den Soundtabellen.

#### Kriterium 10: Kadenzen- & Phrasenschluss-Muster (Cadential Archetypes)
- **Analyse-Fokus:** Typische Schlusswendungen an Phrasenenden (authentische Kadenz, Halbkadenzen, Picardische Terz $i \to I$).
- **Mathematisches Datenmodell:** Klassifikationsvektor der 2-Takt-Schlusssequenzen:
  $$\text{Type} \in \{\text{FullCadence}, \text{HalfCadence}, \text{PicardyThird}, \text{DeceptiveCadence}, \text{ModalDorianEnd}\}$$
- **Generative Anwendung:** Erzwingt formale harmonische Auflösungen an Abschnittsgrenzen.
- **SID-Referenz:** Finale Note/Akkord vor Pattern-Ende.

---

### Dimension 3: Bassline-Architektur & Rhythmisches Fundament

#### Kriterium 11: Bassline-Rhythmus-Raster (16tel-Binary-Pattern-Matrix)
- **Analyse-Fokus:** Bitmaske der Anschläge, Haltedauern und Pausen auf den 16 Sechzehntel-Slots eines Taktes.
- **Mathematisches Datenmodell:** 16-Bit Binärmaske $\mathbf{B} \in \{0, 1\}^{16}$ mit Wahrscheinlichkeitsverteilung über Bit-Positionen:
  $$\mathbf{P}_{\text{hit}} = [p_0, p_1, \dots, p_{15}] \quad (\text{Peak auf } 0, 3, 6, 8, 10, 12, 14)$$
- **Generative Anwendung:** Wählt rhythmische Schablonen für Bassriffs aus und sichert den Hubbard-Drive.
- **SID-Referenz:** Noten-Trigger im Voice-3-Pattern.

#### Kriterium 12: Slap-Bass-Oktavierungs-Koeffizient (Octave-Popping Rate)
- **Analyse-Fokus:** Häufigkeit und rhythmische Positionierung von Oktavsprüngen mit ultrakurzem Gate (Pop-Noten).
- **Mathematisches Datenmodell:** Ratio $R_{\text{oct}} = \frac{N_{\text{octave-jumps}}}{N_{\text{total-bass-notes}}}$ plus Slot-Vektor $\mathbf{S}_{\text{pop}} \subset \{0..15\}$ (typisch Slots 2, 6, 10, 14).
- **Generative Anwendung:** Streut akzentuierte Oktav-Pops in Basslines ein.
- **SID-Referenz:** Voice 3 Frequenzregister `$D40E/$D40F` (Sprung um $+12$ Halbtöne) und Gate-Clear nach 1 Frame.

#### Kriterium 13: Bass-Harmonie-Relation (Root vs. Inversion vs. Pedal Point)
- **Analyse-Fokus:** Funktion des Basstons im Verhältnis zum aktuellen Akkord (Grundton, Terz/Quinte, statischer Pedalton).
- **Mathematisches Datenmodell:** Kategoriale Verteilung $P(\text{Relation}) = [\text{Root}: 0.75, \text{3rd}: 0.08, \text{5th}: 0.07, \text{Pedal}: 0.10]$.
- **Generative Anwendung:** Entscheidet, ob der Bass der Akkordfolge folgt oder als Orgelpunkt stur stehen bleibt.
- **SID-Referenz:** Tonhöhenberechnung in der Bass-Engine.

#### Kriterium 14: Motorischer 16tel-Puls-Index (Continuous Momentum Factor)
- **Analyse-Fokus:** Grad des kontinuierlichen Vorwärtsdrangs ohne Pausen (Galopp-Drive vs. synkopierte Funk-Pausen).
- **Mathematisches Datenmodell:** Autokorrelationskoeffizient $R(1)$ der 16tel-Event-Folge:
  $$R(1) = \frac{\sum (x_t - \bar{x})(x_{t+1} - \bar{x})}{\sum (x_t - \bar{x})^2} \quad (R(1) > 0.85 \text{ für Speed-Action})$$
- **Generative Anwendung:** Füllt Pausen automatisch mit Ghost-Notes oder Arpeggio-Fills auf.
- **SID-Referenz:** Gate-On/Off-Häufigkeit auf Stimme 3.

#### Kriterium 15: Walking-Bass & Chromatische Übergangs-Wahrscheinlichkeit
- **Analyse-Fokus:** Vorkommen von Halbton-Überleitungen auf Zählzeit $4+$ zum nächsten Akkordgrundton ($G \to G\# \to A$).
- **Mathematisches Datenmodell:** Bedingte Wahrscheinlichkeit $P(\text{Note}_{15} = \text{Root}_{t+1} \pm 1 \mid \text{ChordChange})$.
- **Generative Anwendung:** Schiebt vor Taktanfängen automatisch chromatische Übergangsnoten ein.
- **SID-Referenz:** Letzte 16tel-Note im Voice-3-Pattern.

---

### Dimension 4: Melodieführung, Solotechnik & Virtuosität

#### Kriterium 16: Melodischer Ambitus & Register-Spannweite
- **Analyse-Fokus:** Gesamter und effektiver Tonumfang der Melodiestimme (typisch C4 bis C7, 36 Halbtöne).
- **Mathematisches Datenmodell:** Intervall $[\text{Note}_{\text{min}}, \text{Note}_{\text{max}}]$ und Normalverteilung $\mathcal{N}(\mu, \sigma^2)$ der Melodietonhöhen.
- **Generative Anwendung:** Hält generierte Melodielinien im optimalen Frequenzbereich des SID-Chips.
- **SID-Referenz:** Voice 1 Frequenzregister `$D400/$D401`.

#### Kriterium 17: Melodische Intervallsprung-Matrix (Pitch Jump Histogram)
- **Analyse-Fokus:** Statistische Häufigkeit von Sekundschritten (Skalenläufen) vs. Terzen, Quarten, Quinten und Oktaven.
- **Mathematisches Datenmodell:** Histogramm über Intervallweiten $\Delta \in [-24, +24]$ Halbtönen.
- **Generative Anwendung:** Erzeugt fließende, sangliche Melodiebögen mit gezielten dramatischen Oktav- und Quintsprüngen.
- **SID-Referenz:** Frequenzdifferenzen aufeinanderfolgender Noten-Events.

#### Kriterium 18: Notenwert-Dichte & Rhythmisches Spektrum der Melodie
- **Analyse-Fokus:** Verteilung der Tondauern (Ganze, Halbe, Viertel, Achtel, 16tel, 32tel-Läufe).
- **Mathematisches Datenmodell:** Diskretes Wahrscheinlichkeits-Histogramm:
  $$H(T) = [p_{1}: 0.05, p_{1/2}: 0.10, p_{1/4}: 0.25, p_{1/8}: 0.30, p_{1/16}: 0.20, p_{1/32}: 0.10]$$
- **Generative Anwendung:** Balanciert ruhige Themenpassagen gegen virtuose Sololäufe aus.
- **SID-Referenz:** Duration-Bytes im Melodie-Pattern.

#### Kriterium 19: Melodische Kontur-Archetypen (Contour Shape Classifier)
- **Analyse-Fokus:** Geometrische Form von 2- bis 4-Takt-Melodiebögen (Aufsteigend, Absteigend, Bogen $\cap$, Wanne $\cup$, Zick-Zack).
- **Mathematisches Datenmodell:** Quantisierte Richtungsmatrix (Huron-Kontur-Klassifikation mit Climax-Position bei $\approx 70\%$).
- **Generative Anwendung:** Formt natürliche melodische Phrasen mit klarem Höhepunkt.
- **SID-Referenz:** Tonhöhen-Hüllkurve über Phrasengrenzen.

#### Kriterium 20: Motiv-Wiederholungs- & Variationsgrad (Theme Mutation Rate)
- **Analyse-Fokus:** Grad der rhythmischen und melodischen Veränderung eines Motivs bei seiner Wiederholung.
- **Mathematisches Datenmodell:** Sequenz-Distanzmatrix $D(\text{Motiv}_A, \text{Motiv}_B) \in [0.15, 0.40]$ (Levenshtein-/Alignment-Distanz).
- **Generative Anwendung:** Variiert Motive organisch (Inversion, rhythmische Verschiebung, Sequenzierung).
- **SID-Referenz:** Pattern-Wiederholungen mit Transpositions-Offsets.

---

### Dimension 5: Micro-Pitch-Artikulation & Expressivität

#### Kriterium 21: Pitch-Scoop-Tiefe & Anstiegsdauer (Attack-Slide Profile)
- **Analyse-Fokus:** Start-Frequenzversatz (1–3 Halbtöne unter Zielnote) und Slide-Dauer (2–5 Frames @ 50Hz).
- **Mathematisches Datenmodell:** Parameter-Tripel $(\Delta \text{Semi}_{\text{start}} \in [-3, -1], T_{\text{frames}} \in [2, 5], \text{Curve}_{\text{exp}})$.
- **Generative Anwendung:** Versieht akzentuierte Töne automatisch mit dem charakteristischen Hubbard-Attack-Bending.
- **SID-Referenz:** Software-Frequenz-Slide-Routine vor Erreichen des finalen `$D400/$D401`-Wertes.

#### Kriterium 22: Delayed-Vibrato-Onset-Latenz (Vibrato Delay Frames)
- **Analyse-Fokus:** Exakte Frame-Anzahl vom Note-On bis zum Start der Frequenzmodulation (nie bei Frame 0!).
- **Mathematisches Datenmodell:** Wahrscheinlichkeitsverteilung über $t_{\text{delay}} \in [4, 10]$ Frames (80–200 ms).
- **Generative Anwendung:** Hält Notenanfänge absolut rein und blendet das Vibrato erst bei Haltetönen ein.
- **SID-Referenz:** Vibrato-Delay-Counter im Instrumenten-Handler.

#### Kriterium 23: Vibrato-Modulationsfrequenz & -Tiefe (LFO Parameters)
- **Analyse-Fokus:** Modulationsrate in Hz (5.5–7.2 Hz) und Auslenkung in Cents ($\pm 6$ bis $\pm 18$ Cents).
- **Mathematisches Datenmuster:** Wertepaar $(f_{\text{LFO}}, A_{\text{cents}})$ mit Dreiecks- oder Sinus-Schwingungsform.
- **Generative Anwendung:** Verleiht gehaltenen Tönen Wärme und instrumentale Lebendigkeit.
- **SID-Referenz:** Frequenz-Offset-Inkrement in der Interrupt-Routine.

#### Kriterium 24: Portamento- & Glissando-Gleitgeschwindigkeits-Vektor
- **Analyse-Fokus:** Frequenz-Schrittweite pro Frame bei Legato-Übergängen zwischen fernen Noten.
- **Mathematisches Datenmodell:** Gleitratenfunktion $\Delta F = k \cdot (\text{TargetFreq} - \text{CurrentFreq})^\alpha$.
- **Generative Anwendung:** Ermöglicht weiche Tonhöhenübergänge bei schnellen Synthesizer-Soli.
- **SID-Referenz:** Portamento-Flags im Noten-Bytecode.

#### Kriterium 25: Verzierungs-Dichte (Ornaments & Trills per Bar)
- **Analyse-Fokus:** Vorkommen von Vorschlägen (Grace Notes), Trillern und Mordenten pro Takt.
- **Mathematisches Datenmodell:** Poisson-Verteilung $\mathcal{P}(\lambda)$ mit $\lambda \in [0.5, 2.0]$ Events pro 4 Takte.
- **Generative Anwendung:** Streut filigrane Verzierungen zur Steigerung der Virtuosität ein.
- **SID-Referenz:** 1-Frame-Noteneinschübe im Pattern.

---

### Dimension 6: Voice-Multiplexing & 3-Stimmen-Ökonomie

#### Kriterium 26: Rollen-Allokations-Matrix der 3 SID-Oszillatoren
- **Analyse-Fokus:** Zuweisung der 3 Kanäle zu musikalischen Rollen (Voice 1 = Lead, Voice 2 = Chords/Arp, Voice 3 = Bass/Drums).
- **Mathematisches Datenmodell:** Funktionsvektor $\mathbf{V}(t) = [V_1(t), V_2(t), V_3(t)] \in \{\text{Lead}, \text{Harmony}, \text{Bass}, \text{Drum}, \text{SFX}\}^3$.
- **Generative Anwendung:** Weist den drei SID-Kanälen ihre festen Aufgaben nach Hubbards Modell zu.
- **SID-Referenz:** Oszillator-Basisadressen `$D400`, `$D407`, `$D40E`.

#### Kriterium 27: Drum-Stealing-Unterbrechungsdauer auf Stimme 3 (Frames per Hit)
- **Analyse-Fokus:** Zeitspanne in 50Hz-Frames, für die der Bass durch ein Drum-Geräusch ersetzt wird.
- **Mathematisches Datenmodell:** Dauer-Vektor $T_{\text{steal}} = [\text{Kick}: 2\text{f}, \text{Snare}: 2\text{f}, \text{HiHat}: 1\text{f}, \text{Tom}: 3\text{f}]$.
- **Generative Anwendung:** Schaltet Stimme 3 für exakt 1–3 Frames auf Rauschen/Puls um und triggert Drums.
- **SID-Referenz:** Register `$D412`–`$D414` (ADSR & Waveform Stimme 3).

#### Kriterium 28: Bass-Restaurierungs-Präzision & Phasen-Klick-Vermeidung
- **Analyse-Fokus:** Nahtloses Wiederherstellen von Frequenz, Waveform, Gate und ADSR der unterbrochenen Bassnote.
- **Mathematisches Datenmodell:** Deterministisches Zustandsübergangsprotokoll im Frame-Scheduler.
- **Generative Anwendung:** Verhindert Knack- und Klickgeräusche beim Rücksprung von Drum auf Bass.
- **SID-Referenz:** Puffer-Register für Bass-Frequenz und Gate-Zustand.

#### Kriterium 29: Polyphone Dichte & Kontrapunkt-Unabhängigkeits-Grad
- **Analyse-Fokus:** Grad der melodischen und rhythmischen Unabhängigkeit zwischen Stimme 1 und Stimme 2 (Gegenbewegung).
- **Mathematisches Datenmodell:** Kreuzkorrelation $r_{\text{poly}} \in [-1.0, 1.0]$ der melodischen Richtungsvektoren.
- **Generative Anwendung:** Erzeugt echte polyphone Kontrapunkt-Gegenstimmen.
- **SID-Referenz:** Simultane Noten-Events auf Stimme 1 und 2.

#### Kriterium 30: Zweistimmige Harmonisierungs-Intervall-Verteilung
- **Analyse-Fokus:** Intervallverhältnisse bei paralleler Stimmführung (Voice 2 doppelt Voice 1 in Terzen/Sexten).
- **Mathematisches Datenmodell:** Diskrete Verteilung $P(\text{Interval}) = [3\text{rd}: 0.55, 6\text{th}: 0.25, 4\text{th}: 0.12, 5\text{th}: 0.08]$.
- **Generative Anwendung:** Harmonisiert Lead-Passagen in hymnischen Abschnitten (*Lightforce*).
- **SID-Referenz:** Berechneter Halbton-Versatz für Stimme 2.

---

### Dimension 7: Percussion- & Drum-Synthese-Muster

#### Kriterium 31: Snare-Drum-Rausch-Hüllkurven- & Frequenz-Trajektorie
- **Analyse-Fokus:** Frequenzwerte und Rausch-Filterung während des 2-Frame-Snare-Crack-Events.
- **Mathematisches Datenmodell:** Frame-Tabelle:
  $$\text{Snare} = [(F_0: \$8400, \text{Wave}: \$81, \text{ADSR}: \$08/\$00), (F_1: \$4200, \text{Wave}: \$81, \text{ADSR}: \$00/\$00)]$$
- **Generative Anwendung:** Erzeugt den peitschenden Hubbard-Snare-Sound.
- **SID-Referenz:** `$D40E/$D40F` (Freq 3), `$D414` (Noise Bit 7).

#### Kriterium 32: Bass-Drum Pitch-Drop-Kurve (Exponential Frequency Drop)
- **Analyse-Fokus:** Start-/Endfrequenz und Fallkurve der Dreieckswelle bei Kickdrums.
- **Mathematisches Datenmodell:** Exponentieller Frequenzverlauf:
  $$F(t) = F_0 \cdot e^{-k \cdot t} \quad (\text{Frame 0: } \$1200 \to \text{Frame 1: } \$0400 \to \text{Frame 2: } \$0180)$$
- **Generative Anwendung:** Liefert druckvolle, perkussive Kicks auf Oszillator 3.
- **SID-Referenz:** `$D40E/$D40F` (Freq 3), `$D414` (Triangle Bit 4).

#### Kriterium 33: Hi-Hat- & Cymbal-Trigger-Dauer & Frequenzregister
- **Analyse-Fokus:** Ultrahohe Rauschfrequenzen (`$D000`–`$F000`) und extrem kurze Gate-Zeiten (1 Frame / 20 ms).
- **Mathematisches Datenmodell:** Parameter-Tupel $(F_{\text{noise}}=\$E000, \text{ADSR}=\$0400, \text{Duration}=1\text{ Frame})$.
- **Generative Anwendung:** Setzt feine 16tel-Hi-Hat-Akzente zwischen Bassnoten.
- **SID-Referenz:** `$D40E/$D40F`, `$D414`.

#### Kriterium 34: Snare-Roll-Muster & Dynamik-Stufen (Wirbel-Algorithmus)
- **Analyse-Fokus:** 32tel-Trigger-Abfolge mit Frequenzmodulation für Snare-Rolls (*Commando*).
- **Mathematisches Datenmodell:** 32tel-Trigger-Matrix mit alternierenden Frequenzen (`$5000 \leftrightarrow \$7000`) und Amplituden-Ramp.
- **Generative Anwendung:** Baut dramatische Trommelwirbel vor Formteil-Wechseln ein.
- **SID-Referenz:** Schnelle Interrupt-Trigger auf Oszillator 3.

#### Kriterium 35: Standard-Drum-Grid-Matrix (16-Step Beat Archetypes)
- **Analyse-Fokus:** Platzierung von Kick (1, 3), Snare (2, 4) und Hats im 16tel-Takt.
- **Mathematisches Datenmodell:** $3 \times 16$ binäre Pattern-Matrix $\mathbf{D} \in \{0, 1\}^{3 \times 16}$.
- **Generative Anwendung:** Dient als Rhythmus-Skelett für den Drum-Scheduler.
- **SID-Referenz:** Drum-Track-Bytecode.

---

### Dimension 8: Arpeggio-Tabellen, Timbre & Waveform-Modulation

#### Kriterium 36: Arpeggio-Geschwindigkeit & Tick-Rate (Speed Ratio)
- **Analyse-Fokus:** Notenwechsel-Frequenz innerhalb der Arpeggio-Tabelle (1 Frame = 50Hz, 2 Frames = 25Hz).
- **Mathematisches Datenmodell:** Ganzzahliger Teiler $S_{\text{arp}} \in \{1, 2, 3\}$.
- **Generative Anwendung:** Bestimmt das Abspieltempo von Akkordbrechungen auf Stimme 2.
- **SID-Referenz:** Table-Pointer-Inkrement im Player-Interrupt.

#### Kriterium 37: Arpeggio-Noten-Offsets & Akkord-Inversions-Tabellen
- **Analyse-Fokus:** Halbton-Abstände zur Basisnote in der Arp-Tabelle ($[0, 3, 7, 10]$ für $m^7$, $[0, 7, 12]$ für Powerchords).
- **Mathematisches Datenmodell:** Array von Halbton-Listen pro Akkordtyp und Inversion.
- **Generative Anwendung:** Wandelt abstrakte Akkorde in framegenaue SID-Arp-Tabellen um.
- **SID-Referenz:** Offset-Tabellen im ROM/RAM des C64.

#### Kriterium 38: Waveform-Cycling innerhalb von Arpeggios (Timbre-Arps)
- **Analyse-Fokus:** Synchroner Wechsel der Wellenform (Saw $\leftrightarrow$ Pulse $\leftrightarrow$ Tri) innerhalb eines Arpeggio-Durchlaufs.
- **Mathematisches Datenmodell:** Synchrone Tabelle `[(Offset_i, Waveform_i, PulseWidth_i)]`.
- **Generative Anwendung:** Erzeugt schillernde, lebendige Klangfarben (*Crazy Comets*, *Delta*).
- **SID-Referenz:** Register `$D40B` (Waveform 2) und `$D409/$D40A` (PW 2).

#### Kriterium 39: Hard-Sync-Trigger & Frequenzdifferenz-Verhältnis ($D404 Bit 1)
- **Analyse-Fokus:** Zeitpunkt der Aktivierung von Hard-Sync und Frequenzabstand zwischen Master und Slave.
- **Mathematisches Datenmodell:** Frequenzverhältnis-Funktion $\frac{F_{\text{slave}}}{F_{\text{master}}}(t) \in [1.2, 4.5]$.
- **Generative Anwendung:** Erzeugt schneidende, metallische Sync-Lead-Sounds (*The Last V8*).
- **SID-Referenz:** `$D404` Bit 1 (Sync) und Frequenzregister Oszillator 1 & 3.

#### Kriterium 40: Ring-Modulation-Frequenzrelationen ($D404 Bit 2)
- **Analyse-Fokus:** Harmonische Intervalle (Quinte, Tritonus, Oktave) zwischen Oszillator 1 und 3 bei Ringmod-Einsatz.
- **Mathematisches Datenmodell:** Intervall-Multiplikatoren für Glocken- und Fernost-Sounds (*IK+*).
- **Generative Anwendung:** Generiert authentische asiatische Flöten und perkussive Gongs.
- **SID-Referenz:** `$D404` Bit 2 (Ring Mod) und Dreieckswelle (`$15`).

---

### Dimension 9: Pulsweitenmodulation & Analoge Filter-Automation

#### Kriterium 41: PWM-LFO-Rate & Modulationsgeschwindigkeit
- **Analyse-Fokus:** Schrittweite pro Frame beim Hoch- und Runterzählen des 12-Bit-PW-Wertes (`$D402/$D403`).
- **Mathematisches Datenmodell:** Schrittweite $\Delta \text{PW} \in [\$02, \$08]$ pro 50Hz-Frame.
- **Generative Anwendung:** Erzeugt den breiten, warmen Chorus-Effekt auf Lead- und Pad-Stimmen.
- **SID-Referenz:** Register `$D402/$D403` (PW 1) und `$D409/$D40A` (PW 2).

#### Kriterium 42: PWM-Grenzwerte & Asymmetrie-Bereich (Duty-Cycle Limits)
- **Analyse-Fokus:** Minimal- und Maximalwerte der Pulsweite zur Vermeidung von Signalauslöschung.
- **Mathematisches Datenmodell:** Wertebereich $[\text{PW}_{\text{min}}, \text{PW}_{\text{max}}] \subseteq [\$0150, \$0EB0]$ (ca. 8% bis 92% Duty Cycle).
- **Generative Anwendung:** Sichert den optimalen klanglichen Sweet-Spot der Pulsweitenmodulation.
- **SID-Referenz:** High/Low-Limit-Vergleiche im PWM-Handler.

#### Kriterium 43: Filter-Routing-Matrix pro Stimme & Formteil
- **Analyse-Fokus:** Zuweisung der Filter-Enable-Bits im Register `$D417` für Stimme 1, 2 und 3.
- **Mathematisches Datenmodell:** 3-Bit Binärmaske $[b_{\text{v1}}, b_{\text{v2}}, b_{\text{v3}}] \in \{0, 1\}^3$ (typisch: `%0011` $\to$ V1 & V2 gefiltert, V3 ungefiltert).
- **Generative Anwendung:** Schützt Bass und Drums vor Dämpfung, während Leads/Pads gefiltert werden.
- **SID-Referenz:** Register `$D417` (Bits 0, 1, 2).

#### Kriterium 44: Filter-Modus-Selektion & Resonanz-Tiefe
- **Analyse-Fokus:** Wahl von Lowpass, Bandpass, Highpass oder Kombinationen (`$D418`) und Resonanzwert `$0\dots F$ (`$D417`).
- **Mathematisches Datenmodell:** Parameterpaar $(\text{Mode} \in \{\text{LP}, \text{BP}, \text{HP}, \text{LP+BP}\}, \text{Resonance} \in [8, 14])$.
- **Generative Anwendung:** Verleiht Space- und Funk-Stücken analogen Synthesizer-Charakter.
- **SID-Referenz:** Register `$D417` (High Nibble) und `$D418` (Low Nibble).

#### Kriterium 45: Cutoff-Automations-Trajektorien (Filter-Sweeps vs. Envelope Squelch)
- **Analyse-Fokus:** Verlauf der 11-Bit Cutoff-Frequenz als langsamer LFO-Sweep oder perkussiver Decay-Envelope.
- **Mathematisches Datenmodell:** Zeitfunktion $f_{\text{cutoff}}(t)$ mit Parametern $(\text{Type}_{\text{LFO/Env}}, \text{Start}, \text{Target}, \text{Rate})$.
- **Generative Anwendung:** Automatisiert dramatische Filterfahrten über Formteilgrenzen hinweg.
- **SID-Referenz:** Register `$D415` (Bits 0–2) und `$D416` (Bits 0–7).

---

### Dimension 10: Low-Level 6502-Treiber, ADSR-Clustering & Bytecode-Grammatik

#### Kriterium 46: ADSR-Hüllkurven-Clustering (Instrumenten-Archetypen)
- **Analyse-Fokus:** Häufigste Wertekombinationen von Attack/Decay (`$D405`) und Sustain/Release (`$D406`).
- **Mathematisches Datenmodell:** $k$-Means Clusterzentren über alle 4D-ADSR-Vektoren $(A, D, S, R) \in [0, 15]^4$.
- **Generative Anwendung:** Liefert eine kuratierte Bibliothek fertiger Instrumenten-Hüllkurven.
- **SID-Referenz:** Instrumententabellen im Treiber.

#### Kriterium 47: ADSR-Bug-Bypass & Gate-Clear-Timing (6581 Silicon Workaround)
- **Analyse-Fokus:** Timing des Gate-Bit-Resets vor neuem Note-On zur Vermeidung des SID-Hüllkurven-Einfrierens.
- **Mathematisches Datenmodell:** Deterministische Befehlssequenz: `LDA #$00 -> STA $D404 -> NOP -> LDA #$21 -> STA $D404`.
- **Generative Anwendung:** Verhindert Hüllkurven-Hänger in der compilierten 6502-Assembler-Ausgabe.
- **SID-Referenz:** 6502-Opcodes in der Noten-Trigger-Routine.

#### Kriterium 48: Treiber-Update-Frequenz & Raster-Interrupt-Timing
- **Analyse-Fokus:** Synchronisation über PAL-Rasterzeilen (50Hz) vs. CIA-Timer-Interrupts (60Hz) vs. Multi-Speed (100Hz).
- **Mathematisches Datenmodell:** Timing-Deskriptor $(\text{SyncType} \in \{\text{Raster}, \text{CIA}\}, \text{Rate}_{\text{Hz}} \in \{50, 60, 100\})$.
- **Generative Anwendung:** Konfiguriert den Interrupt-Handler im Header der generierten `.sid`-Datei.
- **SID-Referenz:** PSID-Header Speed-Flags und `$D011/$D012` bzw. `$DC04/$DC05`.

#### Kriterium 49: Frequenztuning- & Tonhöhen-Lookup-Tabellen
- **Analyse-Fokus:** Verwendete 16-Bit SID-Frequenztabelle ($F_{\text{reg}} = \frac{f_{\text{Hz}} \cdot 16777216}{F_{\text{clock}}}$ mit $F_{\text{clock}} = 985248\text{ Hz}$ für PAL).
- **Mathematisches Datenmodell:** 96-Elemente Array von 16-Bit Ganzzahlen für die Halbtöne $C_0 \dots B_7$.
- **Generative Anwendung:** Wandelt abstrakte MIDI-Notennummern verlustfrei in exakte 6502-Frequenzregisterwerte um.
- **SID-Referenz:** 16-Bit-Tabellen `freq_low` und `freq_high` im Maschinencode.

#### Kriterium 50: Bytecode-Grammatik & Pattern-Kompressions-Syntax
- **Analyse-Fokus:** Binäre Datenstruktur für Noten, Dauern, Instrumentenwechsel, Loop-Points und Transponier-Befehle im Treiber.
- **Mathematisches Datenmodell:** Formale Grammatik $G = (V_N, \Sigma, R, S)$ mit Kontroll-Byte-Befehlssatz (z. B. Byte $< \$80 =$ Note, Byte $\ge \$80 =$ Command).
- **Generative Anwendung:** Kompiliert das generierte Musikstück direkt in kompakten, lauffähigen 6502-Maschinencode für die finale `.sid`-Datei.
- **SID-Referenz:** Binärer Bytecode der Track-Daten im RAM.

---

## 3. Daten-Pipeline: Von der SID-Analyse zum generativen Composer

```
 ┌────────────────────────┐
 │ 19 Original-SID-Dateien│
 └───────────┬────────────┘
             │
             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 6502-Emulator & SID-Register-Tracer (libsidplayfp)     │
 │ Extrahiert Frame-genaue Writes auf $D400-$D418         │
 └───────────┬────────────────────────────────────────────┘
             │
             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 50-Kriterien Feature-Extractor & Profil-Generator      │
 │ Berechnet Markov-Matrizen, Bitmasken, ADSR-Cluster     │
 └───────────┬────────────────────────────────────────────┘
             │
             ▼
 ┌────────────────────────────────────────────────────────┐
 │ JSON-Regelwerk / Modell-Gewichte                       │
 └───────────┬────────────────────────────────────────────┘
             │
             ▼
 ┌────────────────────────────────────────────────────────┐
 │ ROB HUBBARD GENERATIVE COMPOSER ENGINE                 │
 │ Generiert Formteile, Harmonien, Leads, Bass & Arps     │
 └───────────┬────────────────────────────────────────────┘
             │
             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 6502-Assembler-Compiler (acme / ca65)                  │
 └───────────┬────────────────────────────────────────────┘
             │
             ▼
 ┌────────────────────────┐
 │ Neue Rob-Hubbard .sid  │
 └────────────────────────┘
```

---

## 4. Quick-Reference Matrix aller 50 Kriterien

| ID | Kriterium | Dimension | Datentyp | Generatives Zielmodul |
|:---|:---|:---|:---|:---|
| 01 | Formteil-Zustandsmatrix | 1. Makro-Struktur | $N \times N$ Matrix | Macro State Machine |
| 02 | Phrasen-Symmetrie | 1. Makro-Struktur | Diskrete Verteilung | Bar Budget Allocator |
| 03 | Dynamische Energy-Curve | 1. Makro-Struktur | Zeitreihe $[0, 1]$ | Global Tension Controller |
| 04 | Modulations-Topologie | 1. Makro-Struktur | Gerichteter Graph | Key Modulation Engine |
| 05 | Metrische Konsistenz | 1. Makro-Struktur | Sequenz-Vektor | Time Signature Engine |
| 06 | Skalen- & Modus-Profil | 2. Harmonik | 12-Bit Chroma-Vektor | Scale & Pitch Quantizer |
| 07 | Harmonische Dichte | 2. Harmonik | Histogramm | Chord Rhythm Scheduler |
| 08 | Akkord-Markov-Kette | 2. Harmonik | $K \times K$ Matrix | Chord Progression Generator |
| 09 | Akkord-Erweiterungen | 2. Harmonik | Wahrscheinlichkeits-Vektor | Arpeggio Offset Builder |
| 10 | Kadenzen-Muster | 2. Harmonik | Kategorielles Array | Section Cadence Resolver |
| 11 | Bassline-Rhythmus-Raster | 3. Bassline | 16-Bit Bitmasken | Bass Pattern Generator |
| 12 | Slap-Oktavierungs-Rate | 3. Bassline | Ratio & Slot-Vektor | Bass Pop Accent Engine |
| 13 | Bass-Harmonie-Relation | 3. Bassline | Kategoriale Verteilung | Root vs. Pedal Selector |
| 14 | Motorischer 16tel-Puls | 3. Bassline | Autokorrelation $R(1)$ | Momentum & Fill Engine |
| 15 | Chromatische Übergänge | 3. Bassline | Übergangs-Wahrscheinlichkeit | Walking Bass Connector |
| 16 | Melodischer Ambitus | 4. Melodik | Intervall & $\mathcal{N}(\mu, \sigma)$ | Pitch Range Clamper |
| 17 | Intervallsprung-Matrix | 4. Melodik | Histogramm $[-24, +24]$ | Melodic Step/Jump Engine |
| 18 | Notenwert-Dichte | 4. Melodik | Diskretes Histogramm | Rhythm & Speed Selector |
| 19 | Kontur-Archetypen | 4. Melodik | Huron-Konturmatrix | Phrase Shape Generator |
| 20 | Motiv-Variationsgrad | 4. Melodik | Ähnlichkeits-Score | Theme Mutation Engine |
| 21 | Pitch-Scoop-Profil | 5. Micro-Pitch | Tripel (Semi, Frame, Curve) | Lead Note Attack Bending |
| 22 | Delayed-Vibrato-Onset | 5. Micro-Pitch | Wahrscheinlichkeitsverteilung | Vibrato Delay Timer |
| 23 | Vibrato LFO Parameter | 5. Micro-Pitch | Wertepaar $(f_{\text{LFO}}, A_{\text{cents}})$ | Pitch LFO Modulator |
| 24 | Portamento-Gleitrate | 5. Micro-Pitch | Nichtlineare Funktion | Legato Slide Handler |
| 25 | Verzierungs-Dichte | 5. Micro-Pitch | Poisson-Verteilung $\lambda$ | Grace Note & Trill Inserter |
| 26 | Rollen-Allokation | 6. Voice-Multiplex | 3D-Zustandsvektor | Channel Role Matrix |
| 27 | Drum-Stealing-Dauer | 6. Voice-Multiplex | Dauer-Vektor (1–3 Frames) | Voice 3 Steal Scheduler |
| 28 | Bass-Restaurierung | 6. Voice-Multiplex | Zustandsübergangs-Protokoll | Voice 3 Glitchless Restorer |
| 29 | Polyphone Dichte | 6. Voice-Multiplex | Kreuzkorrelation $r_{\text{poly}}$ | Counterpoint Generator |
| 30 | Harmonisierungs-Intervalle | 6. Voice-Multiplex | Intervall-Histogramm | 2nd Voice Harmony Engine |
| 31 | Snare-Rausch-Trajektorie | 7. Percussion | 2-Frame Registertabelle | Snare Crack Synthesizer |
| 32 | Kick-Drum Pitch-Drop | 7. Percussion | Exponentieller Frequenzfall | Kick Drum Synthesizer |
| 33 | Hi-Hat Register & Gate | 7. Percussion | Parameter-Tupel | Hi-Hat Synthesizer |
| 34 | Snare-Roll-Muster | 7. Percussion | 32tel-Trigger-Matrix | Military Roll Generator |
| 35 | Standard-Drum-Grid | 7. Percussion | $3 \times 16$ Binärmatrix | Beat Rhythm Grid |
| 36 | Arpeggio-Geschwindigkeit | 8. Arpeggio/Timbre | Teilerfaktor $\{1, 2, 3\}$ | Arp Speed Controller |
| 37 | Arpeggio-Noten-Offsets | 8. Arpeggio/Timbre | Halbton-Offset-Listen | Arp Table Compiler |
| 38 | Waveform-Cycling | 8. Arpeggio/Timbre | Schritt-Tabelle (Wave/PW) | Timbre Arp Generator |
| 39 | Hard-Sync-Trigger | 8. Arpeggio/Timbre | Frequenzverhältnis-Kurve | Sync Lead Synthesizer |
| 40 | Ring-Modulation-Ratio | 8. Arpeggio/Timbre | Multiplikator-Matrix | Ringmod Bell Synthesizer |
| 41 | PWM-LFO-Rate | 9. PWM & Filter | Delta-Wert $\Delta \text{PW}$ / Frame | PWM LFO Controller |
| 42 | PWM-Grenzwerte | 9. PWM & Filter | Intervall $[\text{PW}_{\text{min}}, \text{PW}_{\text{max}}]$ | PWM Sweet-Spot Limiter |
| 43 | Filter-Routing-Matrix | 9. PWM & Filter | 3-Bit Binärmaske | Filter Voice Assigner |
| 44 | Filter-Modus & Resonanz | 9. PWM & Filter | Konfigurationspaar | Filter Mode/Q Controller |
| 45 | Cutoff-Trajektorien | 9. PWM & Filter | Zeitfunktion $f(t)$ | Filter Sweep Automation |
| 46 | ADSR-Clustering | 10. Low-Level Driver | $k$-Means Clusterzentren | Instrument Preset Library |
| 47 | ADSR-Bug-Bypass | 10. Low-Level Driver | 6502 Opcode-Sequenz | Gate-Reset Guard |
| 48 | Raster/CIA-Timing | 10. Low-Level Driver | Timing-Deskriptor | SID Header Speed Config |
| 49 | Frequenz-Lookup-Tabelle | 10. Low-Level Driver | 96-Werte 16-Bit Array | Pitch-to-Freq Converter |
| 50 | Bytecode-Grammatik | 10. Low-Level Driver | Formale Grammatik $G$ | 6502 Machine Code Exporter |

---

Dieses 50-Kriterien-System bildet das vollständige Fundament für die automatisierte Analyse und algorithmische Komposition authentischer Rob-Hubbard-SID-Musik.
