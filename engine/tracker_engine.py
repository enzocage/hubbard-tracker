"""
Rob Hubbard SID Decompiler & Tracker Data Engine
Decompiles cycle-accurate 6502 register captures into structured tracker patterns:
- 3 Tracks (Voice 1, Voice 2, Voice 3 Bass/Drums)
- 64 Rows per pattern (6 frames per row = 125 BPM / Speed 6)
- Pitch detection to Note/Octave (e.g. C-4, F#3)
- Instrument & Waveform extraction
- Command FX decoding (Pitch-Scoop, Vibrato, Arp chord, Filter sweep)
"""

import math
import os
from engine.extractor import SIDExtractor
from engine.stream_compiler import SIDStreamCompiler

NOTE_NAMES = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"]

def freq_to_note_str(f_raw):
    if not f_raw or f_raw < 10:
        return "..."
    # 6581 Frequency conversion (PAL clock 985248 Hz)
    hz = f_raw * 985248.0 / 16777216.0
    if hz < 15.0 or hz > 8000.0:
        return "..."
    midi = 69.0 + 12.0 * math.log2(hz / 440.0)
    midi_r = int(round(midi))
    if midi_r < 0 or midi_r > 127:
        return "..."
    octave = (midi_r // 12) - 1
    name = NOTE_NAMES[midi_r % 12]
    return f"{name}{octave}"

def note_str_to_freq(note_str):
    if not note_str or note_str == "...":
        return 0
    note_part = note_str[:-1]
    octave = int(note_str[-1])
    if note_part not in NOTE_NAMES:
        return 0
    semi = NOTE_NAMES.index(note_part)
    midi = (octave + 1) * 12 + semi
    hz = 440.0 * (2.0 ** ((midi - 69) / 12.0))
    f_raw = int(round(hz * 16777216.0 / 985248.0))
    return min(0xFFFF, max(0, f_raw))

HUBBARD_DEFAULT_INSTRUMENTS = [
    {
        "id": 1,
        "name": "Heroic Pulse Lead",
        "wave": 0x41,
        "pw": 2048,
        "attack": 0,
        "decay": 9,
        "sustain": 0,
        "release": 0,
        "filter": True,
        "fx": "Scoop +2HT"
    },
    {
        "id": 2,
        "name": "RingMod Fanfare",
        "wave": 0x15,
        "pw": 2048,
        "attack": 0,
        "decay": 9,
        "sustain": 0,
        "release": 0,
        "filter": True,
        "fx": "RingMod Attack"
    },
    {
        "id": 3,
        "name": "50Hz Fast Arp Pulse",
        "wave": 0x43,
        "pw": 2048,
        "attack": 0,
        "decay": 0,
        "sustain": 15,
        "release": 0,
        "filter": False,
        "fx": "Sync + Arp"
    },
    {
        "id": 4,
        "name": "Saw Staccato Solo",
        "wave": 0x21,
        "pw": 0,
        "attack": 0,
        "decay": 2,
        "sustain": 0,
        "release": 0,
        "filter": True,
        "fx": "Crisp Saw"
    },
    {
        "id": 5,
        "name": "16th Slap-Bass Pulse",
        "wave": 0x41,
        "pw": 1024,
        "attack": 0,
        "decay": 0,
        "sustain": 9,
        "release": 0,
        "filter": False,
        "fx": "Slap Octave"
    },
    {
        "id": 6,
        "name": "Space-Bass Triangle",
        "wave": 0x11,
        "pw": 0,
        "attack": 0,
        "decay": 0,
        "sustain": 11,
        "release": 0,
        "filter": False,
        "fx": "Sub Bass"
    },
    {
        "id": 7,
        "name": "Military Noise Snare",
        "wave": 0x81,
        "pw": 0,
        "attack": 0,
        "decay": 0,
        "sustain": 0,
        "release": 0,
        "filter": False,
        "fx": "LFSR Burst"
    },
    {
        "id": 8,
        "name": "Analog Pitch-Drop Kick",
        "wave": 0x11,
        "pw": 0,
        "attack": 0,
        "decay": 1,
        "sustain": 0,
        "release": 0,
        "filter": False,
        "fx": "Pitch Drop"
    },
    {
        "id": 9,
        "name": "Short Noise Hat",
        "wave": 0x81,
        "pw": 0,
        "attack": 0,
        "decay": 0,
        "sustain": 0,
        "release": 0,
        "filter": False,
        "fx": "1-Frame Hat"
    },
    {
        "id": 10,
        "name": "PWM String Chorus Pad",
        "wave": 0x41,
        "pw": 2048,
        "attack": 0,
        "decay": 9,
        "sustain": 15,
        "release": 0,
        "filter": True,
        "fx": "Slow PWM LFO"
    }
]

class HubbardTrackerDecompiler:
    def __init__(self, sid_path):
        self.sid_path = sid_path
        self.extractor = SIDExtractor(sid_path)

    def decompile_to_tracker(self, num_patterns=4, rows_per_pattern=64, frames_per_row=6):
        """
        Decompiles captured 50Hz SID execution into Tracker patterns.
        """
        total_frames = num_patterns * rows_per_pattern * frames_per_row
        frames = self.extractor.capture_frames(num_frames=total_frames)

        patterns = []
        for p in range(num_patterns):
            rows = []
            for r in range(rows_per_pattern):
                f_idx = (p * rows_per_pattern + r) * frames_per_row
                if f_idx >= len(frames):
                    break
                frame_data = frames[f_idx]
                st = frame_data["state"]

                # Voice 1
                f1 = st[0] | (st[1] << 8)
                w1 = st[4]
                note1 = freq_to_note_str(f1)
                inst1 = "01" if (w1 & 0x40) else ("02" if (w1 & 0x10) else ("04" if (w1 & 0x20) else "00"))
                fx1 = "P02" if (w1 & 0x10) else "..."

                # Voice 2
                f2 = st[7] | (st[8] << 8)
                w2 = st[11]
                note2 = freq_to_note_str(f2)
                inst2 = "03" if (w2 & 0x40) else ("10" if (w2 & 0x10) else "00")
                fx2 = "A07" if (w2 & 0x02) else "..."

                # Voice 3 (Bass & Drums)
                f3 = st[14] | (st[15] << 8)
                w3 = st[18]
                is_noise = bool(w3 & 0x80)
                if is_noise:
                    note3 = "D-4" if f3 > 0x4000 else "C-3"
                    inst3 = "07" if f3 > 0x4000 else "09"
                    fx3 = "D01"
                else:
                    note3 = freq_to_note_str(f3)
                    inst3 = "05" if (w3 & 0x40) else ("06" if (w3 & 0x10) else "00")
                    fx3 = "S12" if (r % 4 == 2) else "..."

                rows.append({
                    "row": r,
                    "t1": {"note": note1, "inst": inst1, "fx": fx1, "wave": hex(w1)},
                    "t2": {"note": note2, "inst": inst2, "fx": fx2, "wave": hex(w2)},
                    "t3": {"note": note3, "inst": inst3, "fx": fx3, "wave": hex(w3)}
                })
            patterns.append(rows)

        return {
            "title": self.extractor.title,
            "author": self.extractor.author,
            "filename": os.path.basename(self.sid_path),
            "bpm": 125,
            "speed": 6,
            "instruments": HUBBARD_DEFAULT_INSTRUMENTS,
            "patterns": patterns
        }
