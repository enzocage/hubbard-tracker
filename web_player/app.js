/**
 * Rob Hubbard Master Remix Studio - Ableton Live Multi-Track DAW Engine
 * Features: Selective Mini Audition Play Buttons, Clip Launcher Matrix, 16-Step Drums & 30+ SID Parameters
 */

document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. GLOBAL STATE & PARAMETERS
    // =========================================================================
    let tracks = [];
    let activeTrack = null;
    let isPlaying = false;
    let isLooping = false;
    let currentAuditionTarget = null;
    
    let voiceStates = {
        v1: { active: true, solo: false, mute: false },
        v2: { active: true, solo: false, mute: false },
        v3: { active: true, solo: false, mute: false }
    };

    let startFrame = 0;
    let endFrame = 600;
    let maxFrames = 600;

    // Ableton Session View / Clip Matrix (Modular Timeline Chain)
    let sequenceSlots = [
        { type: "intro", transpose: 0, repeats: 1, fill: false },
        { type: "theme_a", transpose: 0, repeats: 1, fill: false },
        { type: "varied", transpose: 0, repeats: 1, fill: false },
        { type: "bridge_filter", transpose: 0, repeats: 1, fill: true },
        { type: "climax", transpose: 12, repeats: 1, fill: true }
    ];

    // 16-Step Drum Matrix State
    let drumGrid16 = {
        kick:  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    };

    // =========================================================================
    // 2. DOM ELEMENTS
    // =========================================================================
    const navTabs = document.querySelectorAll(".nav-tab");
    const studioViews = document.querySelectorAll(".studio-view");

    // Track Explorer Elements
    const trackListEl = document.getElementById("track-list");
    const trackCountEl = document.getElementById("track-count");
    const trackSearchInput = document.getElementById("track-search");
    const catButtons = document.querySelectorAll(".cat-btn");
    
    const npTitle = document.getElementById("np-title");
    const npMeta = document.getElementById("np-meta");
    const npCategory = document.getElementById("np-category");
    const chipTime = document.getElementById("chip-time");

    // Slicer Elements
    const sliderStart = document.getElementById("slider-start");
    const sliderEnd = document.getElementById("slider-end");
    const labelStart = document.getElementById("label-start");
    const labelEnd = document.getElementById("label-end");
    const rangeHighlight = document.getElementById("range-highlight");
    const presetButtons = document.querySelectorAll(".preset-btn");

    // Transport Elements
    const btnPlay = document.getElementById("btn-play");
    const btnStop = document.getElementById("btn-stop");
    const btnLoop = document.getElementById("btn-loop");
    const playText = document.getElementById("play-text");
    const globalTime = document.getElementById("global-time");
    const globalTrackLabel = document.getElementById("global-track-label");
    const btnDownloadWav = document.getElementById("btn-download-wav");
    const audioEl = document.getElementById("audio-player");
    const auditionIndicator = document.getElementById("audition-indicator");

    // Oscilloscope
    const canvas = document.getElementById("oscilloscope-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    // Ableton Master & Action Buttons
    const btnRenderUltra = document.getElementById("btn-render-ultra");
    const btnExportUltraSid = document.getElementById("btn-export-ultra-sid");
    const btnRandomRemix = document.getElementById("btn-random-remix");
    const btnAddSlot = document.getElementById("btn-add-slot");
    const btnResetSlots = document.getElementById("btn-reset-slots");
    const slotsTimeline = document.getElementById("slots-timeline");

    // Track 1 Elements
    const uV1Active = document.getElementById("u-v1-active");
    const uV1Trans = document.getElementById("u-v1-transpose");
    const lblUTrans = document.getElementById("lbl-u-trans");
    const uV1Cents = document.getElementById("u-v1-cents");
    const lblUCents = document.getElementById("lbl-u-cents");
    const uV1Ornament = document.getElementById("u-v1-ornament");
    const lblUOrnament = document.getElementById("lbl-u-ornament");
    const uV1Passing = document.getElementById("u-v1-passing");
    const lblUPassing = document.getElementById("lbl-u-passing");
    const uV1ScoopOffset = document.getElementById("u-v1-scoop-offset");
    const uV1ScoopFrames = document.getElementById("u-v1-scoop-frames");
    const uV1ScoopCurve = document.getElementById("u-v1-scoop-curve");
    const uV1VibDelay = document.getElementById("u-v1-vib-delay");
    const lblUVibDelay = document.getElementById("lbl-u-vib-delay");
    const uV1VibRate = document.getElementById("u-v1-vib-rate");
    const lblUVibRate = document.getElementById("lbl-u-vib-rate");
    const uV1VibDepth = document.getElementById("u-v1-vib-depth");
    const lblUVibDepth = document.getElementById("lbl-u-vib-depth");
    const uV1Ringburst = document.getElementById("u-v1-ringburst");
    const lblURingburst = document.getElementById("lbl-u-ringburst");
    const uV1WaveOverride = document.getElementById("u-v1-wave-override");

    // Track 2 Elements
    const uV2Active = document.getElementById("u-v2-active");
    const uV2ArpMode = document.getElementById("u-v2-arp-mode");
    const uV2Subtick = document.getElementById("u-v2-subtick");
    const uV2Inversion = document.getElementById("u-v2-inversion");
    const uV2PwmCenter = document.getElementById("u-v2-pwm-center");
    const lblUPwmCenter = document.getElementById("lbl-u-pwm-center");
    const uV2PwmDepth = document.getElementById("u-v2-pwm-depth");
    const lblUPwmDepth = document.getElementById("lbl-u-pwm-depth");
    const uV2PwmSpeed = document.getElementById("u-v2-pwm-speed");
    const lblUPwmSpeed = document.getElementById("lbl-u-pwm-speed");

    // Track 3 Elements
    const uV3Active = document.getElementById("u-v3-active");
    const uV3BassPattern = document.getElementById("u-v3-bass-pattern");
    const uV3SlapPop = document.getElementById("u-v3-slap-pop");
    const lblUSlapPop = document.getElementById("lbl-u-slap-pop");
    const uV3SlapOctave = document.getElementById("u-v3-slap-octave");

    // Track 4 & Master Filter Elements
    const stepsKick = document.getElementById("steps-kick");
    const stepsSnare = document.getElementById("steps-snare");
    const stepsHihat = document.getElementById("steps-hihat");
    const uFltMode = document.getElementById("u-flt-mode");
    const uFltRes = document.getElementById("u-flt-res");
    const lblURes = document.getElementById("lbl-u-res");
    const uFltLfoShape = document.getElementById("u-flt-lfo-shape");
    const uFltLfoSpeed = document.getElementById("u-flt-lfo-speed");
    const lblULfoRate = document.getElementById("lbl-u-lfo-rate");
    const uFltV1 = document.getElementById("u-flt-v1");
    const uFltV2 = document.getElementById("u-flt-v2");
    const uFltV3 = document.getElementById("u-flt-v3");

    // Hybrid Controls
    const hybridV1Select = document.getElementById("hybrid-v1-select");
    const hybridV2Select = document.getElementById("hybrid-v2-select");
    const hybridV3Select = document.getElementById("hybrid-v3-select");
    const btnRenderHybrid = document.getElementById("btn-render-hybrid");
    const btnExportHybridSid = document.getElementById("btn-export-hybrid-sid");

    // Telemetry Elements
    const teleTrackName = document.getElementById("tele-track-name");
    const scTimbre = document.getElementById("sc-timbre");
    const scHarmony = document.getElementById("sc-harmony");
    const scRhythm = document.getElementById("sc-rhythm");
    const scFilter = document.getElementById("sc-filter");
    const scMicrofx = document.getElementById("sc-microfx");
    const barTimbre = document.getElementById("bar-timbre");
    const barHarmony = document.getElementById("bar-harmony");
    const barRhythm = document.getElementById("bar-rhythm");
    const barFilter = document.getElementById("bar-filter");
    const barMicrofx = document.getElementById("bar-microfx");
    const regGrid = document.getElementById("reg-grid");

    // =========================================================================
    // 3. TAB NAVIGATION
    // =========================================================================
    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            navTabs.forEach(t => t.classList.remove("active"));
            studioViews.forEach(v => v.style.display = "none");

            tab.classList.add("active");
            const targetId = tab.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.style.display = targetId === "view-player" ? "grid" : "flex";
            }

            if (targetId === "view-telemetry" && activeTrack) {
                loadTelemetry(activeTrack);
            }
            if (targetId === "view-flowchart") {
                selectFlowchartNode("v1_s1");
            }
        });
    });

    // =========================================================================
    // 3.5 MODULAR FLOWCHART & DEEP X-RAY INSPECTOR DATA & ENGINE
    // =========================================================================
    const flowchartNodesData = {
        "v1_s1": {
            title: "FANFARE & PITCH-SCOOP ENGINE",
            badge: "STIMME 1: LEAD (SZENE 1)",
            badgeClass: "v1",
            solo: "v1",
            osc: "Voice 1",
            wave: "Tri+RingMod $15",
            pitchFx: "Scoop -2 HT",
            adsr: "$09 / $00 (2ms / 750ms)",
            out: "Filter Bus",
            notes: "E-7 (2636.1 Hz) ➔ G-4 ➔ A-4",
            harmony: "Dominant-Signalhorn & Vorhalts-Triller",
            timing: "4 Frames Scoop (Exponentiell), 50Hz PAL Clock",
            remixHint: "Im Remix-Labor steuerbar über Stimme 1 Scoop-Offset & Triller-Dichte",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x15, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v1_s2": {
            title: "HAUPTTHEMA A (HEROIC LEAD)",
            badge: "STIMME 1: LEAD (SZENE 2)",
            badgeClass: "v1",
            solo: "v1",
            osc: "Voice 1",
            wave: "Pulse $41 (50% PW)",
            pitchFx: "5.5Hz Vibrato",
            adsr: "$09 / $00",
            out: "Master Mix",
            notes: "A-4 (440 Hz) ➔ C-5 ➔ B-4 ➔ A-4",
            harmony: "Heroisches Thema in A-Moll (Aeolisch)",
            timing: "6-Frame 16tel-Schritte, 8f Delayed Vibrato",
            remixHint: "Im Remix-Labor transponierbar von -24 bis +24 Halbtöne mit Passing Tones",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v1_s3": {
            title: "LYRISCHE TERZEN-VARIATION",
            badge: "STIMME 1: LEAD (SZENE 3)",
            badgeClass: "v1",
            solo: "v1",
            osc: "Voice 1",
            wave: "Pulse $41",
            pitchFx: "+2 HT Triller",
            adsr: "$09 / $00",
            out: "Master Mix",
            notes: "E-5 (659 Hz) ➔ F-5 ➔ G-5 ➔ A-5",
            harmony: "Lyrische Aufwärtsbewegung über Quintfallsequenz",
            timing: "2-Frame Appoggiatura-Vorhalte auf der Takteins",
            remixHint: "Modulierbar im Remix-Labor über 'Vorhalts-Triller-Dichte'",
            regs: [0x80, 0x2A, 0x00, 0x08, 0x41, 0x09, 0x00, 0xD0, 0x0B, 0x00, 0x08, 0x43, 0x00, 0xF0, 0xC0, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v1_s4": {
            title: "STACCATO PASSING SOLO",
            badge: "STIMME 1: LEAD (SZENE 4)",
            badgeClass: "v1",
            solo: "v1",
            osc: "Voice 1",
            wave: "Sawtooth $21",
            pitchFx: "Chromatik",
            adsr: "$02 / $00 (Knackig)",
            out: "Bandpass Filter",
            notes: "16tel Staccato-Läufe in C-Dur / D-Moll",
            harmony: "Modulation & Überleitung zur Reprise",
            timing: "Schnelle 50Hz Anschläge (2ms Attack, 50ms Decay)",
            remixHint: "Im Remix-Labor steuerbar über 'Wellenform-Erzwingung' und 'Passing Tones'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x21, 0x02, 0x00, 0x00, 0x08, 0x00, 0x08, 0x41, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v1_s5": {
            title: "+12 HT OKTAVEN-CLIMAX",
            badge: "STIMME 1: LEAD (SZENE 5)",
            badgeClass: "v1",
            solo: "v1",
            osc: "Voice 1",
            wave: "Pulse $41 + PWM",
            pitchFx: "+12 HT Oktave",
            adsr: "$09 / $00",
            out: "Master Mix",
            notes: "A-5 (880 Hz) ➔ C-6 (1046 Hz)",
            harmony: "Tonaler Höhepunkt & Schlusssatz",
            timing: "Maximale Pitch-Dynamik & Vibrato",
            remixHint: "Wird im Phrasen-Sequencer über den 'Climax'-Slot getriggert",
            regs: [0xB8, 0x38, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v2_s1": {
            title: "3-TON 50Hz PULSE ARPEGGIO",
            badge: "STIMME 2: ARPEGGIO (SZENE 1)",
            badgeClass: "v2",
            solo: "v2",
            osc: "Voice 2",
            wave: "Pulse+Sync $43",
            pitchFx: "50Hz Sub-Tick",
            adsr: "$00 / $F0 (Sustain Max)",
            out: "Master Bus",
            notes: "Am [A3-C4-E4] ➔ F [F3-A3-C4] ➔ E [E3-G#3-B3]",
            harmony: "Phrygische Kadenz (Am - F - Dm - E)",
            timing: "1 Frame (20ms) pro Arpeggio-Note",
            remixHint: "Im Remix-Labor steuerbar über 'Akkord-Arpeggio-Modus'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v2_s2": {
            title: "4-TON m7 ARPEGGIO + PWM",
            badge: "STIMME 2: ARPEGGIO (SZENE 2)",
            badgeClass: "v2",
            solo: "v2",
            osc: "Voice 2",
            wave: "Pulse $43",
            pitchFx: "PWM LFO Sweep",
            adsr: "$00 / $F0",
            out: "Master Bus",
            notes: "Am7 [A3-C4-E4-G4] mit 1. Umkehrung",
            harmony: "Moll-Septime & schwebender Streicher-Chorus",
            timing: "1.25 Hz PWM Sweep zwischen 30% und 70% Pulsbreite",
            remixHint: "Im Remix-Labor einstellbar über 'PWM Center' und 'PWM Sweep-Tiefe'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0x5C, 0x0E, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v2_s3": {
            title: "EXTENDED m9 JAZZ CHORDS",
            badge: "STIMME 2: ARPEGGIO (SZENE 3)",
            badgeClass: "v2",
            solo: "v2",
            osc: "Voice 2",
            wave: "Pulse $43",
            pitchFx: "5-Step Arp",
            adsr: "$00 / $F0",
            out: "Master Bus",
            notes: "Dm9 [D3-F3-A3-C4-E4] ➔ G7 ➔ Cmaj7",
            harmony: "Jazz-inspirierte None & Quintfallsequenz",
            timing: "5 Töne pro 5 Frames (100ms Periode)",
            remixHint: "Im Remix-Labor wählbar als 'm9 (5-Schritt Jazz-Non)'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v2_s4": {
            title: "BREITER PWM-STREICHER-PAD",
            badge: "STIMME 2: ARPEGGIO (SZENE 4)",
            badgeClass: "v2",
            solo: "v2",
            osc: "Voice 2",
            wave: "Pulse $41",
            pitchFx: "Fläche ohne Arp",
            adsr: "$09 / $F0 (Sanft)",
            out: "Bandpass Filter",
            notes: "Akkord-Haltetöne C-Dur / D-Moll",
            harmony: "Sphärische Ruhe vor dem Climax",
            timing: "Langsamer 0.5Hz Pulsbreiten-LFO",
            remixHint: "Im Remix-Labor steuerbar über 'Pulsweiten-Chorus'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0x00, 0x08, 0x00, 0x08, 0x41, 0x09, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v2_s5": {
            title: "LIGHTFORCE m11 KASKADE",
            badge: "STIMME 2: ARPEGGIO (SZENE 5)",
            badgeClass: "v2",
            solo: "v2",
            osc: "Voice 2",
            wave: "Pulse $43",
            pitchFx: "6-Step Arp",
            adsr: "$00 / $F0",
            out: "Master Bus",
            notes: "Am11 [A3-C4-E4-G4-A4-D5]",
            harmony: "Rob Hubbards berühmteste Arpeggio-Signatur",
            timing: "6 Töne pro 6 Frames (120ms Vollzyklus)",
            remixHint: "Im Remix-Labor auswählbar als 'm11 (Lightforce 6-Schritt)'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0x5C, 0x1C, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v3_s1": {
            title: "16tel-MILITÄR-BASS-GALOPP",
            badge: "STIMME 3: BASS & DRUMS (SZENE 1)",
            badgeClass: "v3",
            solo: "v3_bass",
            osc: "Voice 3 (Multiplexed)",
            wave: "Pulse $41 / Noise $81",
            pitchFx: "Galopp-Rhythmus",
            adsr: "$00 / $90 (Tight Slap)",
            out: "Master Mix",
            notes: "A-1 (55.0 Hz) Bass + BD auf 1 + SD auf 2,4",
            harmony: "Grundton-Fundament auf der Tonika A",
            timing: "3 Sechzehntel-Noten gefolgt von einer Pause",
            remixHint: "Im Remix-Labor steuerbar über 'Bass-Rhythmus-Muster: Commando Galopp'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v3_s2": {
            title: "SLAP-BASS OKTAV-POPS",
            badge: "STIMME 3: BASS & DRUMS (SZENE 2)",
            badgeClass: "v3",
            solo: "v3_bass",
            osc: "Voice 3",
            wave: "Pulse $41 / Triangle $11",
            pitchFx: "+12 HT Slap Pop",
            adsr: "$00 / $90",
            out: "Master Mix",
            notes: "A-1 (55Hz) ➔ A-2 (110Hz) Slap-Pops",
            harmony: "Funk-inspirierter Oktavsprung auf 16tel-Offbeats",
            timing: "Stochastischer Trigger auf 16tel-Offbeats 3 & 9",
            remixHint: "Im Remix-Labor steuerbar über 'Slap-Bass Oktav-Pops Dichte' & 'Pop-Oktave'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0xC0, 0x02, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v3_s3": {
            title: "KONTRAPUNKTISCHER WALKING BASS",
            badge: "STIMME 3: BASS & DRUMS (SZENE 3)",
            badgeClass: "v3",
            solo: "v3_bass",
            osc: "Voice 3",
            wave: "Triangle $11 + Noise $81",
            pitchFx: "Linear Walk",
            adsr: "$00 / $A0",
            out: "Master Mix",
            notes: "D-1 ➔ G-1 ➔ C-2 ➔ F-1 ➔ B-1 ➔ E-1",
            harmony: "Gegenbewegung zur Lead-Melodie",
            timing: "Synkopierte 8tel-Schritte mit Ghost-Hi-Hats",
            remixHint: "Im Remix-Labor modulierbar über 'IK+ Slap-Funk' oder 'Delta Rolling'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x80, 0x01, 0x00, 0x08, 0x11, 0x00, 0xA0, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v3_s4": {
            title: "STACCATO STRIDE BASS",
            badge: "STIMME 3: BASS & DRUMS (SZENE 4)",
            badgeClass: "v3",
            solo: "v3_bass",
            osc: "Voice 3",
            wave: "Pulse $41",
            pitchFx: "Tight Decay",
            adsr: "$00 / $40 (Sehr kurz)",
            out: "Filter Bus",
            notes: "C-1 ➔ D-1 ➔ E-1 Staccato",
            harmony: "Spannungsaufbau vor der Reprise",
            timing: "Extrem trockene Dämpfung für perkussiven Groove",
            remixHint: "Kann über die 'Swing & Micro-Timing'-Steuerung verzögert werden",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x40, 0x00, 0x80, 0xE7, 0x2F]
        },
        "v3_s5": {
            title: "RAPID 2-FRAME SNARE ROLLS",
            badge: "STIMME 3: BASS & DRUMS (SZENE 5)",
            badgeClass: "v3",
            solo: "drums",
            osc: "Voice 3 (Noise Mode)",
            wave: "Galois LFSR Noise $81",
            pitchFx: "Roll-Trigger",
            adsr: "$00 / $00 (Ultra Fast)",
            out: "Master Mix",
            notes: "2-Frame Rapid Fire Snare Wirbel",
            harmony: "Rhythmischer Höhepunkt & Fill zum Loop-Neustart",
            timing: "40ms Schussfolge (25 Hits/Sekunde)",
            remixHint: "Im Remix-Labor steuerbar über 'Snare-Roll-Fill Dichte'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x00, 0x84, 0x00, 0x00, 0x81, 0x00, 0x00, 0x00, 0x80, 0xE7, 0x2F]
        },
        "flt_s1": {
            title: "DRY MASTER / FILTER BYPASS",
            badge: "MASTER FILTER (SZENE 1)",
            badgeClass: "flt",
            solo: "filter",
            osc: "Analog Sum Bus",
            wave: "Alle 3 Stimmen",
            pitchFx: "Bypass",
            adsr: "Vol 15 ($D418=$0F)",
            out: "Line Out",
            notes: "Vollfrequentes Spektrum ohne Bedämpfung",
            harmony: "Maximaler Punch für das Intro",
            timing: "Statisch",
            remixHint: "Im Remix-Labor kann der Filter jederzeit aktiviert werden",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x00, 0x00, 0x0F]
        },
        "flt_s2": {
            title: "WARMER TIEFPASS 12dB",
            badge: "MASTER FILTER (SZENE 2)",
            badgeClass: "flt",
            solo: "filter",
            osc: "Analog Filter ($D415)",
            wave: "12dB Lowpass ($1F)",
            pitchFx: "Cutoff 1.2 kHz",
            adsr: "Resonanz Q=8",
            out: "Line Out",
            notes: "Subtile analoge Wärme & Höhenbedämpfung",
            harmony: "Betont den 55Hz Sub-Bass & Grundtöne",
            timing: "Statische Kennlinie",
            remixHint: "Im Remix-Labor umschaltbar auf 'Warmer Tiefpass 12dB'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x60, 0x87, 0x1F]
        },
        "flt_s3": {
            title: "BANDPASS RESONANZ Q=14",
            badge: "MASTER FILTER (SZENE 3)",
            badgeClass: "flt",
            solo: "filter",
            osc: "Analog Filter ($D415)",
            wave: "12dB Bandpass ($2F)",
            pitchFx: "Resonanz $E7",
            adsr: "Max Self-Oscillation",
            out: "Line Out",
            notes: "Schneidende Hubbard-Bandpass-Peaks",
            harmony: "Verstärkt die Obertöne der Arpeggios & Leads",
            timing: "50Hz Frame Synchronisation",
            remixHint: "Im Remix-Labor einstellbar über 'Resonanz-Güte (Q)'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        },
        "flt_s4": {
            title: "LFO FILTER-DROP SWEEP",
            badge: "MASTER FILTER (SZENE 4)",
            badgeClass: "flt",
            solo: "filter",
            osc: "Analog Filter ($D415)",
            wave: "Bandpass LFO Sweep",
            pitchFx: "400Hz ➔ 3.2kHz",
            adsr: "Sägezahn LFO (4.0Hz)",
            out: "Line Out",
            notes: "Dynamische Cutoff-Fahrt über die Bridge",
            harmony: "Frequenz-Filter-Drop",
            timing: "4.0 Hz Sweep-Rate",
            remixHint: "Im Remix-Labor modulierbar über 'LFO Sweep: Sägezahn' & 'Speed'",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0xC0, 0xE7, 0x2F]
        },
        "flt_s5": {
            title: "NONLINEARE SATURATION",
            badge: "MASTER FILTER (SZENE 5)",
            badgeClass: "flt",
            solo: "filter",
            osc: "MOS 6581 Analog Bus",
            wave: "Master Saturation",
            pitchFx: "Soft-Clipping",
            adsr: "Vol 15 Peak",
            out: "Line Out",
            notes: "Authentische C64 6581 Röhren-ähnliche Verzerrung",
            harmony: "Fügt harmonische Obertöne zum Finale hinzu",
            timing: "Dynamisch abhängig vom Pegel",
            remixHint: "Wird bei allen Remix-Exporten in 44.1kHz Bit-Exakt modelliert",
            regs: [0x5C, 0x1C, 0x00, 0x08, 0x41, 0x09, 0x00, 0xB0, 0x09, 0x00, 0x08, 0x43, 0x00, 0xF0, 0x60, 0x01, 0x00, 0x08, 0x41, 0x00, 0x90, 0x00, 0x80, 0xE7, 0x2F]
        }
    };

    let activeFlowchartNodeKey = "v1_s1";

    function selectFlowchartNode(nodeKey) {
        activeFlowchartNodeKey = nodeKey;
        const data = flowchartNodesData[nodeKey];
        if (!data) return;

        // Highlight selected node
        document.querySelectorAll(".flow-block").forEach(b => b.classList.remove("active"));
        const targetBlock = document.getElementById(`fnode-${nodeKey.replace('_', '-')}`);
        if (targetBlock) targetBlock.classList.add("active");

        // Update X-Ray Inspector Header & Badge
        const xrayBadge = document.getElementById("xray-badge");
        const xrayTitle = document.getElementById("xray-title");
        if (xrayBadge) {
            xrayBadge.textContent = data.badge;
            xrayBadge.className = `elem-badge ${data.badgeClass}`;
        }
        if (xrayTitle) xrayTitle.textContent = data.title;

        // Update Synthesis Pipeline Boxes
        const pOsc = document.getElementById("xray-pipe-osc");
        const pWave = document.getElementById("xray-pipe-wave");
        const pPitch = document.getElementById("xray-pipe-pitch");
        const pAdsr = document.getElementById("xray-pipe-adsr");
        const pOut = document.getElementById("xray-pipe-out");
        if (pOsc) pOsc.textContent = data.osc;
        if (pWave) pWave.textContent = data.wave;
        if (pPitch) pPitch.textContent = data.pitchFx;
        if (pAdsr) pAdsr.textContent = data.adsr;
        if (pOut) pOut.textContent = data.out;

        // Update Musical Analysis text
        const mNotes = document.getElementById("xray-notes");
        const mHarmony = document.getElementById("xray-harmony");
        const mTiming = document.getElementById("xray-timing");
        const mHint = document.getElementById("xray-remix-hint");
        if (mNotes) mNotes.textContent = data.notes;
        if (mHarmony) mHarmony.textContent = data.harmony;
        if (mTiming) mTiming.textContent = data.timing;
        if (mHint) mHint.textContent = data.remixHint;

        // Update 25 Register Grid
        const regGrid = document.getElementById("xray-reg-grid");
        if (regGrid && data.regs) {
            regGrid.innerHTML = "";
            data.regs.forEach((val, i) => {
                const cell = document.createElement("div");
                cell.className = "xray-reg-cell";
                const addr = `$D4${i.toString(16).toUpperCase().padStart(2, '0')}`;
                cell.innerHTML = `
                    <span class="xreg-addr">${addr}</span>
                    <span class="xreg-val">$${val.toString(16).toUpperCase().padStart(2, '0')}</span>
                    <span class="xreg-name">${regNames[i] || ""}</span>
                `;
                regGrid.appendChild(cell);
            });
        }
    }

    // Setup Flowchart Node Clicks
    document.querySelectorAll(".flow-block").forEach(block => {
        block.addEventListener("click", () => {
            const key = block.dataset.node;
            selectFlowchartNode(key);
        });
    });

    // Setup Node Audition Mini Buttons
    document.querySelectorAll(".btn-node-audition").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const soloTarget = btn.dataset.nodeAudition;
            triggerAudition(soloTarget, btn);
        });
    });

    // X-Ray Inspector Audition Button
    const btnXrayAudition = document.getElementById("btn-xray-audition");
    if (btnXrayAudition) {
        btnXrayAudition.addEventListener("click", () => {
            const data = flowchartNodesData[activeFlowchartNodeKey];
            if (data && data.solo) {
                triggerAudition(data.solo, btnXrayAudition);
            }
        });
    }

    // Flowchart Quick Track Switchers
    document.querySelectorAll(".flowchart-quick-tracks button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".flowchart-quick-tracks button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const trackPath = btn.dataset.flowTrack;
            const targetTrack = tracks.find(t => t.path === trackPath);
            if (targetTrack) {
                selectTrack(targetTrack);
            }
        });
    });

    // =========================================================================
    // 4. ABLETON SESSION SCENE / CLIP MATRIX WITH MINI PLAY BUTTONS
    // =========================================================================
    function renderSlotsTimeline() {
        if (!slotsTimeline) return;
        slotsTimeline.innerHTML = "";

        sequenceSlots.forEach((slot, idx) => {
            const card = document.createElement("div");
            card.className = "slot-card";
            card.innerHTML = `
                <div class="slot-card-top">
                    <button class="btn-mini-audition clip-audition" data-slot-idx="${idx}" title="Diesen Clip isoliert vorhören">
                        <span class="mini-play-icon">▶</span> #${idx + 1}
                    </button>
                    ${sequenceSlots.length > 1 ? `<button class="slot-del-btn" data-idx="${idx}">✕</button>` : ''}
                </div>
                <select class="slot-select" data-idx="${idx}">
                    <option value="intro" ${slot.type === "intro" ? "selected" : ""}>Intro (Filter Cut)</option>
                    <option value="theme_a" ${slot.type === "theme_a" ? "selected" : ""}>Thema A (1:1 Original)</option>
                    <option value="theme_b" ${slot.type === "theme_b" ? "selected" : ""}>Thema B (Original 2)</option>
                    <option value="varied" ${slot.type === "varied" ? "selected" : ""}>Variation (Triller)</option>
                    <option value="bridge_filter" ${slot.type === "bridge_filter" ? "selected" : ""}>Bridge (Bandpass Sweep)</option>
                    <option value="solo_break" ${slot.type === "solo_break" ? "selected" : ""}>Solo Break</option>
                    <option value="climax" ${slot.type === "climax" ? "selected" : ""}>Climax (+12 HT Riser)</option>
                </select>
                <div class="slot-ctrl-row">
                    <span>Trans:</span>
                    <input type="number" class="slot-trans-inp" data-idx="${idx}" min="-24" max="24" value="${slot.transpose}">
                    <span>Reps:</span>
                    <input type="number" class="slot-reps-inp" data-idx="${idx}" min="1" max="8" value="${slot.repeats}">
                </div>
                <div class="slot-ctrl-row">
                    <label><input type="checkbox" class="slot-fill-chk" data-idx="${idx}" ${slot.fill ? "checked" : ""}> Snare-Fill</label>
                </div>
            `;

            // Clip Audition Mini-Play Event
            const clipBtn = card.querySelector(".clip-audition");
            clipBtn.addEventListener("click", () => {
                triggerAudition(`slot_${idx}`, clipBtn);
            });

            // Input Listeners
            card.querySelector(".slot-select").addEventListener("change", (e) => {
                sequenceSlots[idx].type = e.target.value;
            });
            card.querySelector(".slot-trans-inp").addEventListener("input", (e) => {
                sequenceSlots[idx].transpose = parseInt(e.target.value) || 0;
            });
            card.querySelector(".slot-reps-inp").addEventListener("input", (e) => {
                sequenceSlots[idx].repeats = Math.max(1, parseInt(e.target.value) || 1);
            });
            card.querySelector(".slot-fill-chk").addEventListener("change", (e) => {
                sequenceSlots[idx].fill = e.target.checked;
            });
            const delBtn = card.querySelector(".slot-del-btn");
            if (delBtn) {
                delBtn.addEventListener("click", () => {
                    sequenceSlots.splice(idx, 1);
                    renderSlotsTimeline();
                });
            }

            slotsTimeline.appendChild(card);
        });
    }

    if (btnAddSlot) {
        btnAddSlot.addEventListener("click", () => {
            sequenceSlots.push({ type: "varied", transpose: 0, repeats: 1, fill: false });
            renderSlotsTimeline();
        });
    }

    if (btnResetSlots) {
        btnResetSlots.addEventListener("click", () => {
            sequenceSlots = [
                { type: "intro", transpose: 0, repeats: 1, fill: false },
                { type: "theme_a", transpose: 0, repeats: 1, fill: false },
                { type: "varied", transpose: 0, repeats: 1, fill: false },
                { type: "bridge_filter", transpose: 0, repeats: 1, fill: true },
                { type: "climax", transpose: 12, repeats: 1, fill: true }
            ];
            renderSlotsTimeline();
        });
    }

    renderSlotsTimeline();

    // =========================================================================
    // 5. 16-STEP INTERACTIVE DRUM MATRIX
    // =========================================================================
    function renderDrumGrid() {
        const rows = [
            { id: stepsKick, key: "kick" },
            { id: stepsSnare, key: "snare" },
            { id: stepsHihat, key: "hihat" }
        ];

        rows.forEach(({ id, key }) => {
            if (!id) return;
            id.innerHTML = "";
            for (let s = 0; s < 16; s++) {
                const btn = document.createElement("div");
                btn.className = `step-btn ${drumGrid16[key][s] ? 'active' : ''}`;
                btn.addEventListener("click", () => {
                    drumGrid16[key][s] = drumGrid16[key][s] ? 0 : 1;
                    btn.classList.toggle("active", Boolean(drumGrid16[key][s]));
                });
                id.appendChild(btn);
            }
        });
    }

    renderDrumGrid();

    // =========================================================================
    // 6. LIVE ULTRA-PARAMETER LISTENERS (SLIDERS & LABELS)
    // =========================================================================
    if (uV1Trans) uV1Trans.addEventListener("input", (e) => lblUTrans.textContent = `${e.target.value > 0 ? `+${e.target.value}` : e.target.value} HT`);
    if (uV1Cents) uV1Cents.addEventListener("input", (e) => lblUCents.textContent = `${e.target.value} ct`);
    if (uV1Ornament) uV1Ornament.addEventListener("input", (e) => lblUOrnament.textContent = `${e.target.value}%`);
    if (uV1Passing) uV1Passing.addEventListener("input", (e) => lblUPassing.textContent = `${e.target.value}%`);
    if (uV1VibDelay) uV1VibDelay.addEventListener("input", (e) => lblUVibDelay.textContent = `${e.target.value}f`);
    if (uV1VibRate) uV1VibRate.addEventListener("input", (e) => lblUVibRate.textContent = `${(e.target.value/10.0).toFixed(1)}Hz`);
    if (uV1VibDepth) uV1VibDepth.addEventListener("input", (e) => lblUVibDepth.textContent = `${e.target.value} ct`);
    if (uV1Ringburst) uV1Ringburst.addEventListener("input", (e) => lblURingburst.textContent = `${e.target.value}f`);
    if (uV2PwmCenter) uV2PwmCenter.addEventListener("input", (e) => lblUPwmCenter.textContent = `${e.target.value}`);
    if (uV2PwmDepth) uV2PwmDepth.addEventListener("input", (e) => lblUPwmDepth.textContent = `${e.target.value}`);
    if (uV2PwmSpeed) uV2PwmSpeed.addEventListener("input", (e) => lblUPwmSpeed.textContent = `${(e.target.value/10.0).toFixed(1)} Hz`);
    if (uV3SlapPop) uV3SlapPop.addEventListener("input", (e) => lblUSlapPop.textContent = `${e.target.value}%`);
    if (uFltRes) uFltRes.addEventListener("input", (e) => lblURes.textContent = `${e.target.value}`);
    if (uFltLfoSpeed) uFltLfoSpeed.addEventListener("input", (e) => lblULfoRate.textContent = `${(e.target.value/10.0).toFixed(1)}Hz`);

    function getUltraRemixPayload(soloElement = null) {
        if (!activeTrack) return {};
        const p = {
            sid: activeTrack.path,
            slots: sequenceSlots,
            solo_element: soloElement,
            v1_active: uV1Active ? uV1Active.checked : true,
            v1_transpose: parseInt(uV1Trans ? uV1Trans.value : 0),
            v1_cents: parseInt(uV1Cents ? uV1Cents.value : 0),
            v1_ornament_prob: parseFloat(uV1Ornament ? uV1Ornament.value : 25) / 100.0,
            v1_passing_tone_prob: parseFloat(uV1Passing ? uV1Passing.value : 15) / 100.0,
            v1_scoop_offset: parseInt(uV1ScoopOffset ? uV1ScoopOffset.value : 2),
            v1_scoop_frames: parseInt(uV1ScoopFrames ? uV1ScoopFrames.value : 4),
            v1_scoop_curve: uV1ScoopCurve ? uV1ScoopCurve.value : "exp",
            v1_vibrato_delay: parseInt(uV1VibDelay ? uV1VibDelay.value : 8),
            v1_vibrato_rate: parseFloat(uV1VibRate ? uV1VibRate.value : 55) / 10.0,
            v1_vibrato_depth: parseInt(uV1VibDepth ? uV1VibDepth.value : 25),
            v1_ringmod_burst: parseInt(uV1Ringburst ? uV1Ringburst.value : 2),
            v1_wave_override: uV1WaveOverride ? uV1WaveOverride.value : "original",

            v2_active: uV2Active ? uV2Active.checked : true,
            v2_arp_mode: uV2ArpMode ? uV2ArpMode.value : "original",
            v2_subtick_rate: uV2Subtick ? uV2Subtick.value : "50Hz",
            v2_inversion: parseInt(uV2Inversion ? uV2Inversion.value : 0),
            v2_pwm_center: parseInt(uV2PwmCenter ? uV2PwmCenter.value : 2048),
            v2_pwm_depth: parseInt(uV2PwmDepth ? uV2PwmDepth.value : 1024),
            v2_pwm_speed: parseFloat(uV2PwmSpeed ? uV2PwmSpeed.value : 12) / 10.0,

            v3_active: uV3Active ? uV3Active.checked : true,
            v3_bass_pattern: uV3BassPattern ? uV3BassPattern.value : "original",
            v3_slap_pop_prob: parseFloat(uV3SlapPop ? uV3SlapPop.value : 50) / 100.0,
            v3_slap_pop_octave: parseInt(uV3SlapOctave ? uV3SlapOctave.value : 12),

            drum_grid_16: drumGrid16,

            flt_mode: parseInt(uFltMode ? uFltMode.value : "0x2F", 16),
            flt_resonance: parseInt(uFltRes ? uFltRes.value : 14),
            flt_lfo_shape: uFltLfoShape ? uFltLfoShape.value : "sine",
            flt_lfo_speed: parseFloat(uFltLfoSpeed ? uFltLfoSpeed.value : 40) / 10.0,
            flt_route_v1: uFltV1 ? uFltV1.checked : true,
            flt_route_v2: uFltV2 ? uFltV2.checked : true,
            flt_route_v3: uFltV3 ? uFltV3.checked : false
        };
        return p;
    }

    // =========================================================================
    // 7. ABLETON MINI-AUDITION ENGINE (SELECTIVE SOLO PREVIEW)
    // =========================================================================
    async function triggerAudition(targetName, triggerBtn) {
        if (!activeTrack) return;
        
        // Reset previous audition buttons
        document.querySelectorAll(".btn-mini-audition").forEach(b => b.classList.remove("active"));

        if (currentAuditionTarget === targetName && isPlaying) {
            audioEl.pause();
            isPlaying = false;
            currentAuditionTarget = null;
            if (auditionIndicator) auditionIndicator.classList.remove("active");
            return;
        }

        currentAuditionTarget = targetName;
        if (triggerBtn) triggerBtn.classList.add("active");
        if (auditionIndicator) auditionIndicator.classList.add("active");

        const payload = getUltraRemixPayload(targetName);
        try {
            const res = await fetch("/api/ultra_remix_render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const blob = await res.blob();
            audioEl.src = URL.createObjectURL(blob);
            audioEl.loop = true;
            audioEl.play().then(() => {
                isPlaying = true;
                playText.textContent = "PAUSE";
                globalTrackLabel.textContent = `Audition: ${targetName.toUpperCase()}`;
            });
        } catch (e) {
            console.error("Audition failed:", e);
        }
    }

    // Setup Track Header Mini-Audition Buttons
    document.querySelectorAll(".btn-mini-audition[data-solo]").forEach(btn => {
        btn.addEventListener("click", () => {
            const soloTarget = btn.dataset.solo;
            triggerAudition(soloTarget, btn);
        });
    });

    // Setup DAW Solo / Mute Buttons
    [1, 2, 3].forEach(num => {
        const key = `v${num}`;
        const sBtn = document.getElementById(`daw-solo-v${num}`);
        const mBtn = document.getElementById(`daw-mute-v${num}`);

        if (sBtn) {
            sBtn.addEventListener("click", () => {
                voiceStates[key].solo = !voiceStates[key].solo;
                sBtn.classList.toggle("active", voiceStates[key].solo);
                if (btnRenderUltra) btnRenderUltra.click();
            });
        }

        if (mBtn) {
            mBtn.addEventListener("click", () => {
                voiceStates[key].mute = !voiceStates[key].mute;
                mBtn.classList.toggle("active", voiceStates[key].mute);
                if (btnRenderUltra) btnRenderUltra.click();
            });
        }
    });

    // Master Launch Button
    if (btnRenderUltra) {
        btnRenderUltra.addEventListener("click", async () => {
            if (!activeTrack) return;
            document.querySelectorAll(".btn-mini-audition").forEach(b => b.classList.remove("active"));
            if (auditionIndicator) auditionIndicator.classList.remove("active");
            currentAuditionTarget = null;

            const payload = getUltraRemixPayload();
            btnRenderUltra.innerHTML = "<span class='icon'>⏳</span> RENDERING...";
            try {
                const res = await fetch("/api/ultra_remix_render", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const blob = await res.blob();
                audioEl.src = URL.createObjectURL(blob);
                audioEl.loop = true;
                audioEl.play().then(() => {
                    isPlaying = true;
                    btnRenderUltra.innerHTML = "<span class='icon'>⏹</span> MASTER STOP";
                    playText.textContent = "PAUSE";
                    globalTrackLabel.textContent = `${activeTrack.title} (Ultra Remix Master)`;
                });
            } catch (e) {
                console.error("Master launch render failed:", e);
                btnRenderUltra.innerHTML = "<span class='icon'>▶</span> MASTER LAUNCH";
            }
        });
    }

    // Export Ultra-Remix .SID
    if (btnExportUltraSid) {
        btnExportUltraSid.addEventListener("click", async () => {
            if (!activeTrack) return;
            const payload = getUltraRemixPayload();
            try {
                const res = await fetch("/api/export_ultra_remix_sid", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const blob = await res.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${activeTrack.filename.replace('.sid', '')}_Ultra_Remix.sid`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                console.error("SID export failed:", e);
            }
        });
    }

    // Random Hubbard Remixer
    if (btnRandomRemix) {
        btnRandomRemix.addEventListener("click", () => {
            const arpModes = ["m7", "m9", "m11", "sus4", "octave"];
            const bassPats = ["Commando_Gallop", "IK_SlapFunk", "Delta_Rolling", "LastV8_Rock"];
            
            if (uV1Trans) uV1Trans.value = [0, 2, 5, 7, -2][Math.floor(Math.random() * 5)];
            if (uV1Ornament) uV1Ornament.value = Math.floor(Math.random() * 60) + 10;
            if (uV2ArpMode) uV2ArpMode.value = arpModes[Math.floor(Math.random() * arpModes.length)];
            if (uV3BassPattern) uV3BassPattern.value = bassPats[Math.floor(Math.random() * bassPats.length)];
            if (uV3SlapPop) uV3SlapPop.value = Math.floor(Math.random() * 80) + 20;
            if (uFltRes) uFltRes.value = Math.floor(Math.random() * 6) + 10;

            if (uV1Trans) uV1Trans.dispatchEvent(new Event("input"));
            if (uV1Ornament) uV1Ornament.dispatchEvent(new Event("input"));
            if (uV3SlapPop) uV3SlapPop.dispatchEvent(new Event("input"));
            if (uFltRes) uFltRes.dispatchEvent(new Event("input"));

            if (btnRenderUltra) btnRenderUltra.click();
        });
    }

    // =========================================================================
    // 8. TRACK LIST & HYBRID CONTROLS
    // =========================================================================
    async function loadTrackList() {
        try {
            const res = await fetch("/api/tracks");
            tracks = await res.json();
            trackCountEl.textContent = `${tracks.length} SIDs`;
            renderTrackList(tracks);
            populateHybridDropdowns(tracks);

            if (tracks.length > 0) {
                selectTrack(tracks[0]);
            }
        } catch (e) {
            console.error("Failed to load tracks:", e);
        }
    }

    function renderTrackList(list) {
        trackListEl.innerHTML = "";
        list.forEach(t => {
            const item = document.createElement("div");
            item.className = `track-item ${activeTrack && activeTrack.path === t.path ? 'active' : ''}`;
            item.innerHTML = `
                <div class="track-item-header">
                    <span class="track-item-title">${t.title}</span>
                    <span class="track-item-badge">${t.category}</span>
                </div>
                <span class="track-item-meta">${t.author} • ${t.filename}</span>
            `;
            item.addEventListener("click", () => selectTrack(t));
            trackListEl.appendChild(item);
        });
    }

    function populateHybridDropdowns(list) {
        [hybridV1Select, hybridV2Select, hybridV3Select].forEach((select, idx) => {
            if (!select) return;
            select.innerHTML = "";
            list.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.path;
                opt.textContent = `${t.title} (${t.filename})`;
                select.appendChild(opt);
            });
            if (idx === 0) select.value = "sid/Commando.sid";
            if (idx === 1) select.value = "sid/Monty_on_the_Run.sid";
            if (idx === 2) select.value = "sid/IK_plus.sid";
        });
    }

    let activeCat = "all";
    function applyFilters() {
        const query = trackSearchInput.value.toLowerCase();
        const filtered = tracks.filter(t => {
            const matchQuery = t.title.toLowerCase().includes(query) || t.filename.toLowerCase().includes(query);
            const matchCat = (activeCat === "all") || (t.category.toLowerCase().includes(activeCat));
            return matchQuery && matchCat;
        });
        renderTrackList(filtered);
    }

    trackSearchInput.addEventListener("input", applyFilters);
    catButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            catButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCat = btn.dataset.cat;
            applyFilters();
        });
    });

    function selectTrack(track) {
        activeTrack = track;
        npTitle.textContent = track.title;
        npMeta.textContent = `Komponist: ${track.author} | Release: ${track.released} | Datei: ${track.filename}`;
        npCategory.textContent = track.category.toUpperCase();
        globalTrackLabel.textContent = `${track.title} (${track.category})`;

        maxFrames = track.frames || 600;
        sliderStart.max = maxFrames;
        sliderEnd.max = maxFrames;
        sliderStart.value = 0;
        sliderEnd.value = Math.min(600, maxFrames);
        startFrame = 0;
        endFrame = parseInt(sliderEnd.value);
        updateRangeUI();

        document.querySelectorAll(".track-item").forEach(el => el.classList.remove("active"));
        renderTrackList(tracks);

        if (isPlaying) playCurrentSnippet();
    }

    // =========================================================================
    // 9. RANGE SLICER & PRESETS
    // =========================================================================
    function updateRangeUI() {
        let s = parseInt(sliderStart.value);
        let e = parseInt(sliderEnd.value);

        if (s >= e) {
            if (s === maxFrames) s = maxFrames - 10;
            e = s + 10;
            sliderEnd.value = e;
        }

        startFrame = s;
        endFrame = e;

        labelStart.textContent = `Start: ${(s/50.0).toFixed(1)}s (Frame ${s})`;
        labelEnd.textContent = `Ende: ${(e/50.0).toFixed(1)}s (Frame ${e})`;
        chipTime.textContent = `${(s/50.0).toFixed(1)}s - ${(e/50.0).toFixed(1)}s (${((e-s)/50.0).toFixed(1)}s)`;
        globalTime.textContent = `${(s/50.0).toFixed(1)}s - ${(e/50.0).toFixed(1)}s`;

        const leftPercent = (s / maxFrames) * 100;
        const widthPercent = ((e - s) / maxFrames) * 100;
        rangeHighlight.style.left = `${leftPercent}%`;
        rangeHighlight.style.width = `${widthPercent}%`;
    }

    sliderStart.addEventListener("input", updateRangeUI);
    sliderEnd.addEventListener("input", updateRangeUI);

    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            presetButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            sliderStart.value = parseInt(btn.dataset.start);
            sliderEnd.value = Math.min(maxFrames, parseInt(btn.dataset.end));
            updateRangeUI();
            if (isPlaying) playCurrentSnippet();
        });
    });

    // =========================================================================
    // 10. BASIC AUDIO PLAYER ENGINE (TAB 1)
    // =========================================================================
    function setupVoiceButtons(vNum) {
        const btnSolo = document.getElementById(`btn-solo-${vNum}`);
        const btnMute = document.getElementById(`btn-mute-${vNum}`);
        const card = document.getElementById(`card-v${vNum}`);
        const key = `v${vNum}`;

        if (!btnSolo || !btnMute) return;

        btnSolo.addEventListener("click", () => {
            const current = voiceStates[key].solo;
            Object.keys(voiceStates).forEach(k => voiceStates[k].solo = false);
            voiceStates[key].solo = !current;
            updateVoiceMasks();
            if (isPlaying) playCurrentSnippet();
        });

        btnMute.addEventListener("click", () => {
            voiceStates[key].mute = !voiceStates[key].mute;
            updateVoiceMasks();
            if (isPlaying) playCurrentSnippet();
        });
    }

    setupVoiceButtons(1);
    setupVoiceButtons(2);
    setupVoiceButtons(3);

    function updateVoiceMasks() {
        const hasSolo = Object.values(voiceStates).some(v => v.solo);

        [1, 2, 3].forEach(n => {
            const key = `v${n}`;
            const btnSolo = document.getElementById(`btn-solo-${n}`);
            const btnMute = document.getElementById(`btn-mute-${n}`);
            const card = document.getElementById(`card-v${n}`);

            if (hasSolo) {
                voiceStates[key].active = voiceStates[key].solo;
            } else {
                voiceStates[key].active = !voiceStates[key].mute;
            }

            if (btnSolo) btnSolo.classList.toggle("active", voiceStates[key].solo);
            if (btnMute) btnMute.classList.toggle("active", voiceStates[key].mute);
            if (card) card.classList.toggle("muted", !voiceStates[key].active);
        });
    }

    function getPlayerRenderUrl() {
        if (!activeTrack) return "";
        const v1 = voiceStates.v1.active ? 1 : 0;
        const v2 = voiceStates.v2.active ? 1 : 0;
        const v3 = voiceStates.v3.active ? 1 : 0;
        return `/api/render?sid=${encodeURIComponent(activeTrack.path)}&v1=${v1}&v2=${v2}&v3=${v3}&start=${startFrame}&end=${endFrame}`;
    }

    function playCurrentSnippet() {
        if (!activeTrack) return;
        const url = getPlayerRenderUrl();
        audioEl.src = url;
        audioEl.loop = isLooping;
        audioEl.play().then(() => {
            isPlaying = true;
            playText.textContent = "PAUSE";
            btnPlay.classList.add("main-play");
        }).catch(e => console.error("Playback error:", e));
    }

    function pausePlayback() {
        audioEl.pause();
        isPlaying = false;
        playText.textContent = "PLAY";
    }

    function stopPlayback() {
        audioEl.pause();
        audioEl.currentTime = 0;
        isPlaying = false;
        playText.textContent = "PLAY";
    }

    btnPlay.addEventListener("click", () => {
        if (isPlaying) pausePlayback(); else playCurrentSnippet();
    });

    btnStop.addEventListener("click", stopPlayback);

    btnLoop.addEventListener("click", () => {
        isLooping = !isLooping;
        btnLoop.classList.toggle("active", isLooping);
        audioEl.loop = isLooping;
        document.getElementById("label-loop-status").textContent = `Modus: ${isLooping ? 'Endlosschleife (Loop)' : 'Einmalig'}`;
    });

    audioEl.addEventListener("ended", () => {
        if (!isLooping) {
            isPlaying = false;
            playText.textContent = "PLAY";
        }
    });

    btnDownloadWav.addEventListener("click", () => {
        if (!activeTrack) return;
        const url = getPlayerRenderUrl();
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeTrack.filename.replace('.sid', '')}_master.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // =========================================================================
    // 11. HYBRID SPLICING CONTROLS
    // =========================================================================
    if (btnRenderHybrid) {
        btnRenderHybrid.addEventListener("click", () => {
            const v1 = hybridV1Select.value;
            const v2 = hybridV2Select.value;
            const v3 = hybridV3Select.value;
            const url = `/api/hybrid_render?v1_sid=${encodeURIComponent(v1)}&v2_sid=${encodeURIComponent(v2)}&v3_sid=${encodeURIComponent(v3)}&frames=600`;
            
            audioEl.src = url;
            audioEl.loop = true;
            audioEl.play().then(() => {
                isPlaying = true;
                playText.textContent = "PAUSE";
                globalTrackLabel.textContent = "Hubbard Allstars Hybrid Splicing";
            }).catch(e => console.error("Hybrid render error:", e));
        });
    }

    if (btnExportHybridSid) {
        btnExportHybridSid.addEventListener("click", () => {
            const v1 = hybridV1Select.value;
            const v2 = hybridV2Select.value;
            const v3 = hybridV3Select.value;
            const url = `/api/export_hybrid_sid?v1_sid=${encodeURIComponent(v1)}&v2_sid=${encodeURIComponent(v2)}&v3_sid=${encodeURIComponent(v3)}&frames=600`;
            const a = document.createElement("a");
            a.href = url;
            a.download = "Hubbard_Allstars_Hybrid.sid";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // =========================================================================
    // 12. 50-KRITERIEN & TELEMETRIE
    // =========================================================================
    const regNames = [
        "V1 FREQ LO", "V1 FREQ HI", "V1 PW LO", "V1 PW HI", "V1 CONTROL", "V1 ATK/DEC", "V1 SUS/REL",
        "V2 FREQ LO", "V2 FREQ HI", "V2 PW LO", "V2 PW HI", "V2 CONTROL", "V2 ATK/DEC", "V2 SUS/REL",
        "V3 FREQ LO", "V3 FREQ HI", "V3 PW LO", "V3 PW HI", "V3 CONTROL", "V3 ATK/DEC", "V3 SUS/REL",
        "FLT CUT LO", "FLT CUT HI", "FLT RES/ROUT", "FLT MODE/VOL"
    ];

    async function loadTelemetry(track) {
        if (!track) return;
        teleTrackName.textContent = track.filename;
        try {
            const res = await fetch(`/api/criteria?sid=${encodeURIComponent(track.path)}`);
            const data = await res.json();
            
            scTimbre.textContent = `${data.scores.timbre_complexity}%`;
            barTimbre.style.width = `${data.scores.timbre_complexity}%`;

            scHarmony.textContent = `${data.scores.harmony_depth}%`;
            barHarmony.style.width = `${data.scores.harmony_depth}%`;

            scRhythm.textContent = `${data.scores.rhythm_syncopation}%`;
            barRhythm.style.width = `${data.scores.rhythm_syncopation}%`;

            scFilter.textContent = `${data.scores.filter_resonance}%`;
            barFilter.style.width = `${data.scores.filter_resonance}%`;

            scMicrofx.textContent = `${data.scores.subframe_microfx}%`;
            barMicrofx.style.width = `${data.scores.subframe_microfx}%`;

            regGrid.innerHTML = "";
            data.registers_sample.forEach((val, i) => {
                const cell = document.createElement("div");
                cell.className = "reg-cell";
                const addr = `$D4${i.toString(16).toUpperCase().padStart(2, '0')}`;
                cell.innerHTML = `
                    <span class="reg-addr">${addr}</span>
                    <span class="reg-val">$${val.toString(16).toUpperCase().padStart(2, '0')}</span>
                    <span class="reg-desc">${regNames[i] || ""}</span>
                `;
                regGrid.appendChild(cell);
            });
        } catch (e) {
            console.error("Telemetry load error:", e);
        }
    }

    // =========================================================================
    // 13. 60 FPS CANVAS OSCILLOSCOPE
    // =========================================================================
    let animPhase = 0.0;
    function drawOscilloscope() {
        requestAnimationFrame(drawOscilloscope);
        if (!ctx || !canvas) return;

        ctx.fillStyle = "#03060c";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        if (isPlaying) animPhase += 0.08;
        const amp = isPlaying ? 1.0 : 0.05;

        // V1: Cyan
        if (voiceStates.v1.active) {
            ctx.strokeStyle = "#00f0ff";
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = isPlaying ? 8 : 0;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x++) {
                const p = (x * 0.03 + animPhase * 2.0) % 1.0;
                const wave = (2.0 * p - 1.0) * 28 * amp;
                const y = 40 + wave;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // V2: Amber
        if (voiceStates.v2.active) {
            ctx.strokeStyle = "#ffb700";
            ctx.shadowColor = "#ffb700";
            ctx.shadowBlur = isPlaying ? 8 : 0;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x++) {
                const p = (x * 0.02 + animPhase * 1.5) % 1.0;
                const wave = (p < 0.4 ? 1.0 : -1.0) * 24 * amp;
                const y = 80 + wave;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // V3: Green
        if (voiceStates.v3.active) {
            ctx.strokeStyle = "#00ff88";
            ctx.shadowColor = "#00ff88";
            ctx.shadowBlur = isPlaying ? 8 : 0;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x++) {
                const p = (x * 0.015 + animPhase) % 1.0;
                const wave = (2.0 * Math.abs(2.0 * p - 1.0) - 1.0) * 26 * amp;
                const y = 120 + wave;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    drawOscilloscope();
    loadTrackList();
});
