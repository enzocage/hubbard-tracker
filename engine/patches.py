"""
SID Instrument Patches, PAL Frequency Table, Arpeggio Tables and Harmonic Presets
"""

import math

def generate_pal_freq_table():
    """Calculates the standard 96-entry 16-bit SID frequency table for PAL (985248 Hz clock)."""
    table = []
    for n in range(96):
        # A4 = note index 57 (440 Hz)
        freq_hz = 440.0 * (2.0 ** ((n - 57) / 12.0))
        sid_val = int(round((freq_hz * 16777216.0) / 985248.0))
        sid_val = max(0, min(0xFFFF, sid_val))
        table.append(sid_val)
    return table

PAL_FREQ_TABLE = generate_pal_freq_table()

INSTRUMENT_PATCHES = {
    # 0: Lead Sawtooth
    0: {"name": "LeadSaw", "wave": 0x21, "pw": 0x0000, "ad": 0x08, "sr": 0xA4, "scoop": True, "vibrato": True},
    # 1: Lead Pulse (PWM)
    1: {"name": "LeadPulse", "wave": 0x41, "pw": 0x0400, "ad": 0x06, "sr": 0x85, "scoop": True, "vibrato": True},
    # 2: Funky Slap Bass
    2: {"name": "SlapBass", "wave": 0x41, "pw": 0x0250, "ad": 0x00, "sr": 0xC0, "scoop": False, "vibrato": False},
    # 3: Space Arp Pluck
    3: {"name": "SpaceArp", "wave": 0x41, "pw": 0x0800, "ad": 0x09, "sr": 0x00, "scoop": False, "vibrato": False},
    # 4: Snare Drum Hit
    4: {"name": "Snare", "wave": 0x81, "pw": 0x0000, "ad": 0x08, "sr": 0x00, "freq": 0x8400, "frames": 2},
    # 5: Bass Kick Drum
    5: {"name": "Kick", "wave": 0x11, "pw": 0x0000, "ad": 0x09, "sr": 0x00, "freq": 0x1200, "frames": 2},
    # 6: Hi-Hat Click
    6: {"name": "HiHat", "wave": 0x81, "pw": 0x0000, "ad": 0x04, "sr": 0x00, "freq": 0xE000, "frames": 1},
    # 7: Metal Sync Lead
    7: {"name": "MetalSync", "wave": 0x23, "pw": 0x0000, "ad": 0x0B, "sr": 0x65, "scoop": True, "vibrato": True},
    # 8: Oriental Flute (Ringmod)
    8: {"name": "OrientalFlute", "wave": 0x15, "pw": 0x0000, "ad": 0x29, "sr": 0x86, "scoop": True, "vibrato": True},
    # 9: Pipe Organ
    9: {"name": "PipeOrgan", "wave": 0x51, "pw": 0x0400, "ad": 0x00, "sr": 0xF0, "scoop": False, "vibrato": False},
}

ARPEGGIO_TABLES = {
    0: [0, 3, 7, 10],            # m7 (4-step)
    1: [0, 3, 7, 10, 14],        # m9 (5-step)
    2: [0, 3, 7, 10, 14, 17],    # m11 (6-step Lightforce)
    3: [0, 5, 7, 12],            # sus4 (4-step)
    4: [0, 4, 7, 11],            # maj7 (4-step)
    5: [0, 7, 12],               # power chord (3-step)
    6: [0, 12],                  # octave bounce (2-step)
    7: [0, 3, 6, 9]              # dim7 (4-step)
}

SCALE_PRESETS = {
    "Aeolian": [0, 2, 3, 5, 7, 8, 10],
    "Dorian": [0, 2, 3, 5, 7, 9, 10],
    "HarmonicMinor": [0, 2, 3, 5, 7, 8, 11],
    "Kumoi": [0, 2, 3, 7, 8],
    "Major": [0, 2, 4, 5, 7, 9, 11]
}

CHORD_PROGRESSION_TEMPLATES = {
    "CircleOfFifths": [
        ("i", 0, 0), ("iv7", 5, 0), ("VII7", 10, 4), ("IIImaj7", 3, 4),
        ("VImaj7", 8, 4), ("ii_dim", 2, 7), ("V7", 7, 3), ("i", 0, 0)
    ],
    "DorianVamp": [
        ("i7", 0, 0), ("IV7", 5, 3), ("i7", 0, 0), ("IV7", 5, 3),
        ("bVII", 10, 4), ("IV7", 5, 3), ("i7", 0, 0), ("i7", 0, 2)
    ],
    "LamentoStepDown": [
        ("i", 0, 0), ("bVII", 10, 4), ("bVI", 8, 4), ("V7", 7, 3)
    ],
    "PedalVamp": [
        ("i/Pedal", 0, 0), ("bVII/Pedal", 10, 4), ("bVI/Pedal", 8, 4), ("bVII/Pedal", 10, 4)
    ],
    "PowerRock": [
        ("i", 0, 5), ("bVI", 8, 5), ("bVII", 10, 5), ("i", 0, 5)
    ]
}
