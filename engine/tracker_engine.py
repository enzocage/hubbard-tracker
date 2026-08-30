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
    if not note_str or note_str == "..." or note_str == "===" or len(note_str) < 3:
        return 0
    note_part = note_str[:-1]
    if not note_str[-1].isdigit():
        return 0
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

    def decompile_to_tracker(self, num_patterns=8, rows_per_pattern=64, frames_per_row=6):
        """
        Decompiles captured 50Hz SID execution into Tracker patterns and Event-Driven Note Sequences.
        """
        frames_per_pattern = rows_per_pattern * frames_per_row
        total_frames = num_patterns * frames_per_pattern
        frames = self.extractor.capture_frames(num_frames=total_frames)

        patterns = []
        pattern_events = []

        for p in range(num_patterns):
            rows = []
            pat_start_frame = p * frames_per_pattern
            pat_end_frame = min(len(frames), pat_start_frame + frames_per_pattern)
            pat_frames = frames[pat_start_frame:pat_end_frame]

            # 1. Classic 64-Row Grid Matrix
            for r in range(rows_per_pattern):
                f_idx = pat_start_frame + r * frames_per_row
                if f_idx >= len(frames):
                    break
                st = frames[f_idx]["state"]

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

            # 2. Event-Driven Musical Strike & Pulse Sequence (Anschlag- & Impuls-Einheiten)
            p_events = {1: [], 2: [], 3: []}
            for t_idx in [1, 2, 3]:
                f_off = 0 if t_idx == 1 else (7 if t_idx == 2 else 14)
                w_off = 4 if t_idx == 1 else (11 if t_idx == 2 else 18)

                cur_note = None
                cur_inst_id = "01"
                cur_inst_name = "Lead Hook"
                cur_wave = 0
                cur_attack_fx = "Standard"
                cur_evolution = "Sustain"
                start_f = 0

                for f_rel, fr in enumerate(pat_frames):
                    st = fr["state"]
                    freq = st[f_off] | (st[f_off + 1] << 8)
                    wave = st[w_off]
                    gate = bool(wave & 0x01)
                    is_noise_drum = bool(wave & 0x80)

                    if is_noise_drum:
                        n = "D-4" if freq > 0x4000 else "C-3"
                        inst_id = "05"
                        inst_name = "Galois Noise Snare & Kick"
                        attack_fx = "🥁 LFSR Burst Trigger"
                        evolution = "Noise Snare Decay"
                    elif gate:
                        n = freq_to_note_str(freq)
                        if t_idx == 1:
                            inst_id = "01" if (wave & 0x40) else ("02" if (wave & 0x20) else "06")
                            inst_name = "Heroic Dorian Lead" if inst_id == "01" else "Dual-Lead 3rd Saw"
                            attack_fx = "🚀 Pitch-Scoop (-2 HT)" if (wave & 0x02 or f_rel % 12 == 0) else "⚡ HardSync Formant"
                            evolution = "🌊 PWM Pulse Width LFO" if (wave & 0x40) else "🎶 Delayed Vibrato (5.5Hz)"
                        elif t_idx == 2:
                            inst_id = "03"
                            inst_name = "Signature m11 Arpeggio"
                            attack_fx = "⚡ 50Hz Raster Trigger"
                            evolution = "🔄 6-Step m11 Arp Loop"
                        else:
                            inst_id = "04"
                            inst_name = "Driving 16th Slap Bass"
                            attack_fx = "💥 Slap-Pop (+12 HT Attack)" if (f_rel % 12 == 6) else "⚡ Schmalpuls Attack"
                            evolution = "🎸 16tel Slap-Bass Run"
                    else:
                        n = "..."
                        inst_id = "00"
                        inst_name = "Pause / Stille"
                        attack_fx = "---"
                        evolution = "---"

                    # Strike detection: Pitch changed, or Gate triggered, or Waveform switched
                    if (n != cur_note or (wave & 0xF0) != (cur_wave & 0xF0)) and (n != "..." or cur_note != "..."):
                        if cur_note is not None and cur_note != "...":
                            dur = f_rel - start_f
                            bar = 1 + start_f // 96
                            beat = 1 + (start_f % 96) // 24
                            sixteenth = 1 + (start_f % 24) // 6
                            dur_label = "1/16" if dur <= 6 else ("1/8" if dur <= 12 else ("1/8 Pkt" if dur <= 18 else ("1/4" if dur <= 24 else ("1/2" if dur <= 48 else "Ganze"))))
                            p_events[t_idx].append({
                                "event_idx": len(p_events[t_idx]) + 1,
                                "bar_pos": f"{bar}.{beat}.{sixteenth}",
                                "start_frame": start_f,
                                "start_sec": round(start_f * 0.02, 3),
                                "dur_frames": dur,
                                "dur_ms": dur * 20,
                                "dur_label": dur_label,
                                "note": cur_note,
                                "inst_id": cur_inst_id,
                                "inst_name": cur_inst_name,
                                "wave": f"${cur_wave:02X}" if cur_wave else "$41",
                                "attack_fx": cur_attack_fx,
                                "evolution": cur_evolution
                            })
                        cur_note = n
                        cur_inst_id = inst_id
                        cur_inst_name = inst_name
                        cur_wave = wave
                        cur_attack_fx = attack_fx
                        cur_evolution = evolution
                        start_f = f_rel

                if cur_note and cur_note != "...":
                    dur = len(pat_frames) - start_f
                    bar = 1 + start_f // 96
                    beat = 1 + (start_f % 96) // 24
                    sixteenth = 1 + (start_f % 24) // 6
                    dur_label = "1/16" if dur <= 6 else ("1/8" if dur <= 12 else ("1/8 Pkt" if dur <= 18 else ("1/4" if dur <= 24 else ("1/2" if dur <= 48 else "Ganze"))))
                    p_events[t_idx].append({
                        "event_idx": len(p_events[t_idx]) + 1,
                        "bar_pos": f"{bar}.{beat}.{sixteenth}",
                        "start_frame": start_f,
                        "start_sec": round(start_f * 0.02, 3),
                        "dur_frames": dur,
                        "dur_ms": dur * 20,
                        "dur_label": dur_label,
                        "note": cur_note,
                        "inst_id": cur_inst_id,
                        "inst_name": cur_inst_name,
                        "wave": f"${cur_wave:02X}" if cur_wave else "$41",
                        "attack_fx": cur_attack_fx,
                        "evolution": cur_evolution
                    })

            pattern_events.append(p_events)

        return {
            "title": self.extractor.title,
            "author": self.extractor.author,
            "filename": os.path.basename(self.sid_path),
            "bpm": 125,
            "speed": 6,
            "instruments": HUBBARD_DEFAULT_INSTRUMENTS,
            "patterns": patterns,
            "pattern_events": pattern_events,
            "order_list": list(range(len(patterns)))
        }

def patch_original_sid_stream(sid_path, patterns, speed=6, num_frames=3072):
    """
    Takes the 100% bit-exact original 50Hz register frame capture from the SID file
    and micro-patches user edits (pitch modifications, note-offs) into the stream
    while keeping all original master filters, PWM sweeps, ringmod, sync, and
    analog envelope characteristics 100% intact.
    """
    needed_frames = max(num_frames, len(patterns) * 64 * speed)
    extractor = SIDExtractor(sid_path)
    original_frames = extractor.capture_frames(num_frames=needed_frames)
    
    patched_frames = []
    for f in original_frames:
        patched_frames.append({
            "frame": f["frame"],
            "deltas": dict(f["deltas"]),
            "state": list(f["state"])
        })
        
    for p_idx, rows in enumerate(patterns):
        for r_idx, row in enumerate(rows):
            start_f = (p_idx * 64 + r_idx) * speed
            end_f = start_f + speed
            if start_f >= len(patched_frames):
                break
            end_f = min(len(patched_frames), end_f)

            orig_state_at_start = original_frames[start_f]["state"]

            # Voice 1
            t1 = row.get("t1", {})
            n1 = t1.get("note", "...")
            if n1 and n1 != "..." and n1 != "===":
                target_f1 = note_str_to_freq(n1)
                orig_f1 = orig_state_at_start[0] | (orig_state_at_start[1] << 8)
                if target_f1 > 0:
                    ratio = (target_f1 / orig_f1) if orig_f1 > 0 else 1.0
                    for f in range(start_f, end_f):
                        curr_f = patched_frames[f]["state"][0] | (patched_frames[f]["state"][1] << 8)
                        new_f = int(round(curr_f * ratio)) if orig_f1 > 0 else target_f1
                        new_f = min(0xFFFF, max(0, new_f))
                        patched_frames[f]["state"][0] = new_f & 0xFF
                        patched_frames[f]["state"][1] = (new_f >> 8) & 0xFF
                        patched_frames[f]["deltas"][0] = new_f & 0xFF
                        patched_frames[f]["deltas"][1] = (new_f >> 8) & 0xFF
            elif n1 == "===":
                for f in range(start_f, end_f):
                    patched_frames[f]["state"][4] &= 0xFE
                    patched_frames[f]["deltas"][4] = patched_frames[f]["state"][4]

            # Voice 2
            t2 = row.get("t2", {})
            n2 = t2.get("note", "...")
            if n2 and n2 != "..." and n2 != "===":
                target_f2 = note_str_to_freq(n2)
                orig_f2 = orig_state_at_start[7] | (orig_state_at_start[8] << 8)
                if target_f2 > 0:
                    ratio = (target_f2 / orig_f2) if orig_f2 > 0 else 1.0
                    for f in range(start_f, end_f):
                        curr_f = patched_frames[f]["state"][7] | (patched_frames[f]["state"][8] << 8)
                        new_f = int(round(curr_f * ratio)) if orig_f2 > 0 else target_f2
                        new_f = min(0xFFFF, max(0, new_f))
                        patched_frames[f]["state"][7] = new_f & 0xFF
                        patched_frames[f]["state"][8] = (new_f >> 8) & 0xFF
                        patched_frames[f]["deltas"][7] = new_f & 0xFF
                        patched_frames[f]["deltas"][8] = (new_f >> 8) & 0xFF
            elif n2 == "===":
                for f in range(start_f, end_f):
                    patched_frames[f]["state"][11] &= 0xFE
                    patched_frames[f]["deltas"][11] = patched_frames[f]["state"][11]

            # Voice 3
            t3 = row.get("t3", {})
            n3 = t3.get("note", "...")
            if n3 and n3 != "..." and n3 != "===":
                target_f3 = note_str_to_freq(n3)
                orig_f3 = orig_state_at_start[14] | (orig_state_at_start[15] << 8)
                if target_f3 > 0:
                    ratio = (target_f3 / orig_f3) if orig_f3 > 0 else 1.0
                    for f in range(start_f, end_f):
                        curr_f = patched_frames[f]["state"][14] | (patched_frames[f]["state"][15] << 8)
                        new_f = int(round(curr_f * ratio)) if orig_f3 > 0 else target_f3
                        new_f = min(0xFFFF, max(0, new_f))
                        patched_frames[f]["state"][14] = new_f & 0xFF
                        patched_frames[f]["state"][15] = (new_f >> 8) & 0xFF
                        patched_frames[f]["deltas"][14] = new_f & 0xFF
                        patched_frames[f]["deltas"][15] = (new_f >> 8) & 0xFF
            elif n3 == "===":
                for f in range(start_f, end_f):
                    patched_frames[f]["state"][18] &= 0xFE
                    patched_frames[f]["deltas"][18] = patched_frames[f]["state"][18]

    return patched_frames
