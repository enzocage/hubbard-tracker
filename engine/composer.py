"""
Rob Hubbard Generative Composer Engine
Recombines and gently varies authentic melodic, harmonic, and rhythmic elements
exclusively extracted from the 19 original Rob Hubbard reference SID files.
"""

import os
from engine.patches import INSTRUMENT_PATCHES
from engine.corpus import (
    ORIGINAL_MELODIC_MOTIFS,
    ORIGINAL_HARMONIC_CYCLES,
    ORIGINAL_BASS_PATTERNS,
    ORIGINAL_DRUM_PATTERNS
)
from engine.variations import (
    transpose_motif,
    recombine_motifs,
    apply_rhythmic_diminution,
    apply_rhythmic_augmentation,
    apply_melodic_inversion,
    get_archetype_motif_palette
)
from engine.voice3_mux import Voice3Engine
from engine.asm6502 import Assembler6502, create_psid_file

ARCHETYPE_CONFIGS = {
    "SpeedAction": {
        "title": "Hubbard Action Anthem",
        "root": 50,  # D3
        "tempo_frames_per_16th": 3,
        "v1_inst": 0, # Saw Lead
        "v2_inst": 3, # Fast Arp
        "v3_inst": 2, # Slap Bass
        "bass_pattern": "Commando_Gallop",
        "drum_style": "GallopKit",
        "progression": "Monty_CircleOfFifths",
        "filter_mode": 0x2F,
        "filter_ctrl": 0x03,
        "filter_cutoff": (0x00, 0x06)
    },
    "SpaceProg": {
        "title": "Hubbard Space Odyssey",
        "root": 50,  # D3
        "tempo_frames_per_16th": 3,
        "v1_inst": 1, # Pulse PWM Lead
        "v2_inst": 3, # m11 Space Arp
        "v3_inst": 2, # Deep Space Bass
        "bass_pattern": "Delta_Rolling",
        "drum_style": "StandardKit",
        "progression": "Lightforce_DorianChain",
        "filter_mode": 0x2F,
        "filter_ctrl": 0x03,
        "filter_cutoff": (0x50, 0x06)
    },
    "BaroqueBallad": {
        "title": "Hubbard Mystic Ballad",
        "root": 48,  # C3
        "tempo_frames_per_16th": 4, # Andante
        "v1_inst": 8, # Oriental Flute / Ringmod
        "v2_inst": 3, # Arp Pluck
        "v3_inst": 2, # Bass
        "bass_pattern": "Delta_Rolling",
        "drum_style": "HalfTimeKit",
        "progression": "Spellbound_Lamento",
        "filter_mode": 0x1F, # Soft Lowpass
        "filter_ctrl": 0x03,
        "filter_cutoff": (0x00, 0x04)
    },
    "JazzFunk": {
        "title": "Hubbard Dragon Funk",
        "root": 45,  # A2
        "tempo_frames_per_16th": 3,
        "v1_inst": 8, # Kumoi Flute Lead
        "v2_inst": 3, # Space Arp
        "v3_inst": 2, # Slap Bass
        "bass_pattern": "IK_SlapFunk",
        "drum_style": "HalfTimeKit",
        "progression": "IK_KumoiVamp",
        "filter_mode": 0x1F, # Lowpass Squelch
        "filter_ctrl": 0x07, # All voices filtered
        "filter_cutoff": (0x00, 0x05)
    },
    "CyberMetal": {
        "title": "Hubbard Cyber V8",
        "root": 40,  # E2
        "tempo_frames_per_16th": 3,
        "v1_inst": 7, # Metal Sync Lead
        "v2_inst": 3, # Power Arp
        "v3_inst": 2, # Distorted Bass
        "bass_pattern": "LastV8_Rock",
        "drum_style": "StandardKit",
        "progression": "LastV8_PowerChain",
        "filter_mode": 0x2F, # Resonant Bandpass
        "filter_ctrl": 0x03,
        "filter_cutoff": (0x80, 0x06)
    }
}

class HubbardComposer:
    def __init__(self, archetype="SpeedAction"):
        if archetype not in ARCHETYPE_CONFIGS:
            archetype = "SpeedAction"
        self.config = dict(ARCHETYPE_CONFIGS[archetype])
        self.archetype = archetype
        self.v3_engine = Voice3Engine()
        self.palette = get_archetype_motif_palette(archetype)

    def generate_full_song(self):
        """
        Recombines authentic Hubbard motifs across 4 distinct form parts:
        1. Intro (Spacious thematic opening)
        2. Theme A (Heroic lead phrase with harmonic cycle)
        3. Solo (Virtuoso 16th/32nd diminution runs + Ganzton-Riser)
        4. Reprise (Thematic climax with Picardic Third cadence)
        """
        base_root = self.config["root"]
        fp16 = self.config["tempo_frames_per_16th"]
        progression = ORIGINAL_HARMONIC_CYCLES[self.config["progression"]]

        # Fetch authentic motifs
        intro_motif = ORIGINAL_MELODIC_MOTIFS[self.palette["intro"]]
        theme_a_motif = ORIGINAL_MELODIC_MOTIFS[self.palette["theme_a"]]
        theme_b_motif = ORIGINAL_MELODIC_MOTIFS[self.palette["theme_b"]]
        solo_heads = [ORIGINAL_MELODIC_MOTIFS[m] for m in self.palette["solo_heads"]]

        # Recombined motif for Theme B: Antecedent of A + Consequent of B
        recombined_theme = recombine_motifs(self.palette["theme_a"], self.palette["theme_b"])

        parts = [
            {"name": "Intro",   "bars": 4, "root_offset": 0, "drums": False, "motif": intro_motif, "solo": False},
            {"name": "ThemeA",  "bars": 8, "root_offset": 0, "drums": True,  "motif": theme_a_motif, "solo": False},
            {"name": "ThemeB",  "bars": 8, "root_offset": 0, "drums": True,  "motif": recombined_theme, "solo": False},
            {"name": "Solo",    "bars": 8, "root_offset": 2, "drums": True,  "motif": solo_heads[0], "solo": True}, # +2 Ganzton Riser
            {"name": "Reprise", "bars": 4, "root_offset": 0, "drums": True,  "motif": theme_a_motif, "solo": False}
        ]

        v1_bytes = bytearray()
        v2_bytes = bytearray()
        v3_bytes = bytearray()

        for part in parts:
            part_root = base_root + part["root_offset"]
            num_bars = part["bars"]
            has_drums = part["drums"]
            is_solo = part["solo"]
            base_motif = part["motif"]

            for bar in range(num_bars):
                chord_idx = bar % len(progression)
                chord_name, chord_semi, arp_tab_id = progression[chord_idx]
                curr_root = part_root + chord_semi

                # -------------------------------------------------------------
                # 1. VOICE 1 (LEAD & SOLI) - AUTHENTIC MOTIF VARIATIONS
                # -------------------------------------------------------------
                if part["name"] == "Intro":
                    # Slow thematic introduction (rhythmically augmented)
                    active_phrase = apply_rhythmic_augmentation(base_motif, factor=1.5)
                elif is_solo:
                    # Virtuoso solo runs: Rhythmic diminution of authentic Hubbard solo runs
                    head_idx = bar % len(solo_heads)
                    active_phrase = apply_rhythmic_diminution(solo_heads[head_idx], factor=0.5)
                elif part["name"] == "ThemeB" and bar >= 4:
                    # Melodic Inversion of authentic theme in second half of Theme B
                    active_phrase = apply_melodic_inversion(base_motif)
                else:
                    # Authentic theme phrase
                    active_phrase = base_motif

                # Transpose phrase to current chord and scale degree
                transposed_phrase = transpose_motif(active_phrase, curr_root + 12)

                # Fit phrase notes into bar (16 16th steps = 16 * fp16 frames)
                total_dur = 0
                max_bar_dur = 16 * fp16
                for p, dur_16th in transposed_phrase:
                    dur_frames = dur_16th * fp16
                    if total_dur + dur_frames > max_bar_dur:
                        dur_frames = max_bar_dur - total_dur
                    if dur_frames <= 0:
                        break
                    v1_bytes.append(min(95, max(0, p)))
                    v1_bytes.append(min(254, max(1, dur_frames)))
                    total_dur += dur_frames

                # Pad remainder of bar if needed
                if total_dur < max_bar_dur:
                    v1_bytes.append(min(95, max(0, curr_root + 12)))
                    v1_bytes.append(max_bar_dur - total_dur)

                # -------------------------------------------------------------
                # 2. VOICE 2 (AUTHENTIC HARMONIC ARPEGGIO PROGRESSION)
                # -------------------------------------------------------------
                # 1 chord per bar
                v2_bytes.append(min(95, max(0, curr_root)))
                v2_bytes.append(min(254, 16 * fp16))

                # -------------------------------------------------------------
                # 3. VOICE 3 (AUTHENTIC BASS & DRUM MULTIPLEXER)
                # -------------------------------------------------------------
                v3_steps = self.v3_engine.generate_measure(
                    root_pitch=curr_root - 12,
                    pattern_type=self.config["bass_pattern"],
                    has_drums=has_drums,
                    drum_style=self.config["drum_style"]
                )

                for step in v3_steps:
                    if step["drum_hit"] == "kick":
                        v3_bytes.append(0x80)
                    elif step["drum_hit"] == "snare":
                        v3_bytes.append(0x81)
                    elif step["drum_hit"] == "hihat":
                        v3_bytes.append(0x82)
                    elif step["bass_hit"]:
                        v3_bytes.append(min(95, max(0, step["pitch"])))
                        v3_bytes.append(fp16)
                    else:
                        v3_bytes.append(0x00) # C0 rest
                        v3_bytes.append(fp16)

        # Loop markers
        v1_bytes.append(0xFF)
        v2_bytes.append(0xFF)
        v3_bytes.append(0xFF)

        return v1_bytes, v2_bytes, v3_bytes

    def build_sid(self, output_path):
        """
        Assembles driver + tracks into binary .sid file.
        """
        v1_data, v2_data, v3_data = self.generate_full_song()

        def to_asm_bytes(b_array):
            chunks = []
            for i in range(0, len(b_array), 16):
                line = ", ".join(f"${b:02X}" for b in b_array[i:i+16])
                chunks.append(f"    .byte {line}")
            return "\n".join(chunks)

        v1_asm = to_asm_bytes(v1_data)
        v2_asm = to_asm_bytes(v2_data)
        v3_asm = to_asm_bytes(v3_data)

        driver_path = os.path.join(os.path.dirname(__file__), "driver_template.asm")
        with open(driver_path, "r") as fp:
            driver_src = fp.read()

        v1_p = INSTRUMENT_PATCHES[self.config["v1_inst"]]
        v2_p = INSTRUMENT_PATCHES[self.config["v2_inst"]]
        v3_p = INSTRUMENT_PATCHES[self.config["v3_inst"]]

        driver_src = driver_src.replace("v1_inst_wave:   .byte $21", f"v1_inst_wave:   .byte ${v1_p['wave']:02X}")
        driver_src = driver_src.replace("v1_inst_ad:     .byte $08", f"v1_inst_ad:     .byte ${v1_p['ad']:02X}")
        driver_src = driver_src.replace("v1_inst_sr:     .byte $A4", f"v1_inst_sr:     .byte ${v1_p['sr']:02X}")

        driver_src = driver_src.replace("v2_inst_wave:   .byte $41", f"v2_inst_wave:   .byte ${v2_p['wave']:02X}")
        driver_src = driver_src.replace("v2_inst_ad:     .byte $09", f"v2_inst_ad:     .byte ${v2_p['ad']:02X}")
        driver_src = driver_src.replace("v2_inst_sr:     .byte $00", f"v2_inst_sr:     .byte ${v2_p['sr']:02X}")

        driver_src = driver_src.replace("v3_bass_wave:   .byte $41", f"v3_bass_wave:   .byte ${v3_p['wave']:02X}")
        driver_src = driver_src.replace("v3_bass_ad:     .byte $00", f"v3_bass_ad:     .byte ${v3_p['ad']:02X}")
        driver_src = driver_src.replace("v3_bass_sr:     .byte $C0", f"v3_bass_sr:     .byte ${v3_p['sr']:02X}")

        driver_src = driver_src.replace("filter_ctrl:    .byte $03", f"filter_ctrl:    .byte ${self.config['filter_ctrl']:02X}")
        driver_src = driver_src.replace("filter_mode:    .byte $2F", f"filter_mode:    .byte ${self.config['filter_mode']:02X}")
        driver_src = driver_src.replace("filter_cutoff_l: .byte $00", f"filter_cutoff_l: .byte ${self.config['filter_cutoff'][0]:02X}")
        driver_src = driver_src.replace("filter_cutoff_h: .byte $04", f"filter_cutoff_h: .byte ${self.config['filter_cutoff'][1]:02X}")

        driver_src = driver_src.split("track_v1:")[0] + f"track_v1:\n{v1_asm}\n\ntrack_v2:\n{v2_asm}\n\ntrack_v3:\n{v3_asm}\n"

        asm = Assembler6502()
        machine_code, origin = asm.assemble(driver_src, default_origin=0x1000)

        psid_data = create_psid_file(
            machine_code=machine_code,
            load_addr=0x1000,
            init_addr=0x1000,
            play_addr=0x1003,
            title=self.config["title"],
            author="Rob Hubbard AI Composer",
            released="2026 AI"
        )

        dir_name = os.path.dirname(output_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        with open(output_path, "wb") as fp:
            fp.write(psid_data)

        return len(psid_data)
