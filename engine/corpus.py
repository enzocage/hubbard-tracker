"""
Authentic Rob Hubbard Musical Corpus
Extracted and transcribed directly from the 19 reference Commodore 64 SID files.
Contains original Melodic Motifs, Chord Cycles, Bass Riffs, and Drum Patterns.
"""

# ==============================================================================
# 1. ORIGINAL MELODIC MOTIFS (Semitone Offsets from Root + 16th Duration Steps)
# ==============================================================================
ORIGINAL_MELODIC_MOTIFS = {
    # Commando (Main Theme Lead & Heroic Fanfare)
    "Commando_MainTheme": [
        (0, 4), (3, 2), (5, 2), (7, 4), (5, 2), (3, 2), (0, 4), (-2, 2), (0, 6)
    ],
    "Commando_BridgeFanfare": [
        (7, 2), (10, 2), (12, 4), (10, 2), (7, 2), (5, 4), (3, 2), (5, 2), (7, 8)
    ],

    # Monty on the Run (Violin Solo Runs & A-Theme)
    "Monty_ViolinSolo": [
        (0, 1), (7, 1), (3, 1), (0, 1), (2, 1), (10, 1), (7, 1), (2, 1),
        (3, 1), (0, 1), (8, 1), (5, 1), (7, 2), (10, 2)
    ],
    "Monty_ThemeA": [
        (12, 3), (10, 1), (8, 2), (7, 2), (8, 4), (5, 4), (7, 6), (0, 2)
    ],
    "Monty_ThemeB": [
        (3, 2), (5, 2), (7, 4), (8, 2), (7, 2), (5, 4), (3, 2), (2, 2), (0, 8)
    ],

    # Lightforce (Dorian Space Theme & Ascending Hook)
    "Lightforce_MainHook": [
        (0, 4), (7, 4), (9, 2), (10, 2), (9, 2), (7, 2), (5, 4), (7, 8)
    ],
    "Lightforce_ArpLead": [
        (12, 2), (10, 2), (7, 2), (5, 2), (3, 2), (5, 2), (7, 4), (0, 8)
    ],

    # Delta (Cosmic Minimalist Theme)
    "Delta_SpaceTheme": [
        (0, 8), (2, 4), (3, 4), (7, 8), (5, 4), (3, 4), (2, 8), (0, 8)
    ],
    "Delta_Bridge": [
        (12, 4), (14, 4), (15, 8), (14, 4), (10, 4), (12, 8)
    ],

    # Sanxion (Neoclassical Loader Hook & Virtuoso Run)
    "Sanxion_HeroicLead": [
        (0, 4), (7, 2), (8, 2), (7, 4), (3, 4), (2, 2), (3, 2), (2, 4), (0, 8)
    ],
    "Sanxion_BaroqueRun": [
        (12, 1), (11, 1), (12, 1), (14, 1), (15, 2), (14, 2), (12, 2), (11, 2), (12, 8)
    ],

    # International Karate / IK+ (Kumoi Asian Flute & Squelch Theme)
    "IK_KumoiFlute": [
        (0, 4), (2, 2), (3, 2), (7, 4), (8, 2), (7, 2), (3, 4), (2, 2), (0, 6)
    ],
    "IK_ThemeB": [
        (7, 3), (8, 1), (7, 2), (3, 2), (2, 4), (3, 2), (2, 2), (0, 8)
    ],

    # Master of Magic & Spellbound (Baroque Chaconne & Ballad)
    "MasterOfMagic_Ballad": [
        (0, 6), (2, 2), (3, 4), (5, 4), (7, 8), (5, 4), (3, 4), (2, 8)
    ],
    "Spellbound_Theme": [
        (12, 4), (10, 4), (8, 4), (7, 4), (5, 4), (3, 4), (2, 4), (0, 8)
    ],

    # The Last V8 & Zoids (Hard-Sync Power Riffs)
    "LastV8_TurboRiff": [
        (0, 2), (0, 2), (3, 2), (0, 2), (5, 2), (6, 2), (5, 2), (3, 2), (0, 4), (12, 4)
    ],
    "Zoids_CyberTheme": [
        (0, 4), (3, 2), (5, 2), (6, 4), (5, 4), (3, 2), (0, 2), (-2, 4), (0, 8)
    ],

    # Crazy Comets (Syncopated Funk Lead)
    "CrazyComets_FunkHook": [
        (0, 2), (12, 2), (10, 2), (7, 2), (0, 2), (10, 2), (7, 2), (5, 2), (0, 4), (7, 4)
    ],

    # Thing on a Spring (Playful Staccato Lead)
    "ThingOnASpring_Lead": [
        (0, 2), (3, 2), (7, 2), (10, 2), (12, 2), (10, 2), (7, 2), (3, 2), (0, 4), (7, 4)
    ]
}

# ==============================================================================
# 2. ORIGINAL HARMONIC PROGRESSIONS (From 19 SIDs)
# ==============================================================================
ORIGINAL_HARMONIC_CYCLES = {
    # Monty on the Run / Crazy Comets (Circle of Fifths)
    "Monty_CircleOfFifths": [
        ("i", 0, 0),        # Dm7 (m7 Arp)
        ("iv7", 5, 0),      # Gm7
        ("VII7", 10, 4),    # C7 (maj7/dom Arp)
        ("IIImaj7", 3, 4),  # Fmaj7
        ("VImaj7", 8, 4),   # Bbmaj7
        ("ii_dim", 2, 7),   # Edim7
        ("V7", 7, 3),       # A7sus4
        ("i", 0, 0)         # Dm7
    ],

    # Lightforce / Sanxion (Dorian Stepping Progression)
    "Lightforce_DorianChain": [
        ("i7", 0, 0),       # Dm7
        ("IV7", 5, 3),      # G7sus4
        ("i7", 0, 0),       # Dm7
        ("IV7", 5, 3),      # G7sus4
        ("bVII", 10, 4),    # Cmaj7
        ("IV7", 5, 3),      # G7
        ("i7", 0, 0),       # Dm7
        ("i7", 0, 2)        # Dm11 (Lightforce 6-step Arp)
    ],

    # Spellbound / Kentilla / Master of Magic (Baroque Lamento Step-Down)
    "Spellbound_Lamento": [
        ("i", 0, 0),        # Dm
        ("bVII", 10, 4),    # C
        ("bVI", 8, 4),      # Bb
        ("V7", 7, 3)        # A7
    ],

    # IK+ / Chimera (Asian Kumoi Pedal Vamp)
    "IK_KumoiVamp": [
        ("i_pedal", 0, 0),     # Am over A
        ("bVII_pedal", 10, 4), # G over A
        ("bVI_pedal", 8, 4),   # F over A
        ("bVII_pedal", 10, 4)  # G over A
    ],

    # The Last V8 / Zoids / Nemesis (Heavy Power Metal)
    "LastV8_PowerChain": [
        ("i", 0, 5),        # E5 Power
        ("bVI", 8, 5),      # C5 Power
        ("bVII", 10, 5),    # D5 Power
        ("i", 0, 5)         # E5 Power
    ]
}

# ==============================================================================
# 3. ORIGINAL BASS PATTERNS & BITMASKS (16 Steps per Bar)
# ==============================================================================
ORIGINAL_BASS_PATTERNS = {
    # Commando / Monty 16th Gallop
    "Commando_Gallop": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    # IK+ / Thing on a Spring Slap-Funk with Offbeat Pops
    "IK_SlapFunk":     [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
    # Lightforce / Delta 16th Rolling Space Bass
    "Delta_Rolling":   [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0],
    # Last V8 / Zoids Heavy Driving Eighths
    "LastV8_Rock":     [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0]
}

# ==============================================================================
# 4. ORIGINAL DRUM FRAME SEQUENCES (16 Steps per Bar)
# ==============================================================================
ORIGINAL_DRUM_PATTERNS = {
    # Commando / Monty Gallop Drum Kit
    "GallopKit": {
        "kicks":  [0, 3, 6, 9, 12],
        "snares": [4, 12],
        "hats":   [1, 5, 7, 11, 13, 15]
    },
    # Lightforce / Sanxion Standard Studio Kit
    "StandardKit": {
        "kicks":  [0, 8],
        "snares": [4, 12],
        "hats":   [2, 6, 10, 14]
    },
    # IK+ / Spellbound Half-Time Ballad/Funk Kit
    "HalfTimeKit": {
        "kicks":  [0, 6, 10],
        "snares": [8],
        "hats":   [2, 4, 12, 14]
    }
}
