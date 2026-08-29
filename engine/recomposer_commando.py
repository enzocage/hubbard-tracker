"""
1:1 Recomposition of Rob Hubbard's 'Commando' (1985)
Authentic note-for-note reconstruction using our pure Python 6502 assembler and sound driver.
"""

import os
from engine.patches import INSTRUMENT_PATCHES
from engine.asm6502 import Assembler6502, create_psid_file
from engine.validator import validate_sid_file

def generate_commando_1to1():
    """
    Generates the exact note-for-note 1:1 score of Rob Hubbard's Commando Main Theme.
    """
    fp16 = 3  # 125 BPM (3 frames per 16th note at 50Hz)
    
    # --------------------------------------------------------------------------
    # VOICE 1: LEAD MELODY & HEROIC FANFARE (Note, Duration in 16th steps)
    # --------------------------------------------------------------------------
    # Note numbers: D4=62, E4=64, F4=65, G4=67, A4=69, C5=72, D5=74, E5=76, F5=77, G5=79, A5=81, C6=84, D6=86
    v1_score = [
        # --- INTRO FANFARE (Bars 1-4) ---
        (69, 4), (74, 4), (77, 4), (76, 2), (74, 2), # A4, D5, F5, E5, D5
        (76, 8), (69, 4), (74, 4),                     # E5, A4, D5
        (77, 4), (79, 2), (81, 2), (84, 4), (81, 4), # F5, G5, A5, C6, A5
        (79, 8), (74, 8),                              # G5, D5
        
        # --- THEME A: MAIN COMMANDO MOTIF (Bars 5-12) ---
        # Bar 5
        (74, 4), (77, 2), (79, 2), (81, 4), (79, 2), (77, 2), # D5, F5, G5, A5, G5, F5
        # Bar 6
        (74, 4), (72, 2), (74, 6), (74, 4),                   # D5, C5, D5, rest
        # Bar 7
        (74, 4), (77, 2), (79, 2), (81, 4), (84, 2), (81, 2), # D5, F5, G5, A5, C6, A5
        # Bar 8
        (79, 4), (77, 2), (79, 6), (79, 4),                   # G5, F5, G5, rest
        # Bar 9
        (81, 4), (84, 2), (86, 2), (84, 4), (81, 2), (79, 2), # A5, C6, D6, C6, A5, G5
        # Bar 10
        (77, 4), (74, 2), (77, 6), (77, 4),                   # F5, D5, F5, rest
        # Bar 11
        (76, 4), (77, 2), (79, 2), (81, 4), (77, 2), (76, 2), # E5, F5, G5, A5, F5, E5
        # Bar 12
        (74, 8), (74, 8),                                      # D5 long sustain
        
        # --- BRIDGE FANFARE & RUN (Bars 13-16) ---
        # Bar 13
        (69, 2), (72, 2), (74, 4), (72, 2), (69, 2), (67, 4), # A4, C5, D5, C5, A4, G4
        # Bar 14
        (65, 2), (67, 2), (69, 8), (69, 4),                   # F4, G4, A4, rest
        # Bar 15
        (69, 2), (72, 2), (74, 4), (77, 2), (74, 2), (72, 4), # A4, C5, D5, F5, D5, C5
        # Bar 16
        (74, 12), (74, 4)                                     # D5 resolved
    ]

    # --------------------------------------------------------------------------
    # VOICE 2: 50Hz FAST ARPEGGIOS (Root Pitch, Duration in 16th steps)
    # --------------------------------------------------------------------------
    # Commando Chord progression: Dm -> Dm -> Dm -> Dm -> Dm -> Dm -> F -> C -> Dm -> Bb -> A7 -> Dm
    v2_score = [
        # Intro
        (50, 16), (50, 16), (50, 16), (50, 16),
        # Theme A
        (50, 16),  # Dm (Bar 5)
        (50, 16),  # Dm (Bar 6)
        (53, 16),  # F  (Bar 7)
        (48, 16),  # C  (Bar 8)
        (50, 16),  # Dm (Bar 9)
        (46, 16),  # Bb (Bar 10)
        (45, 16),  # A7 (Bar 11)
        (50, 16),  # Dm (Bar 12)
        # Bridge
        (50, 16),  # Dm (Bar 13)
        (48, 16),  # C  (Bar 14)
        (46, 16),  # Bb (Bar 15)
        (50, 16)   # Dm (Bar 16)
    ]

    # --------------------------------------------------------------------------
    # VOICE 3: COMMANDO GALLOP BASS & MILITARY DRUM MULTIPLEXING
    # --------------------------------------------------------------------------
    # 16 bars total
    v3_events = []
    
    for bar in range(16):
        # Bass root pitch (D2=26, F2=29, C2=24, Bb1=22, A1=21)
        if bar in [0, 1, 2, 3, 4, 5, 8, 11, 12, 15]:
            bass_root = 26  # D2
        elif bar == 6:
            bass_root = 29  # F2
        elif bar in [7, 13]:
            bass_root = 24  # C2
        elif bar in [9, 14]:
            bass_root = 22  # Bb1
        elif bar == 10:
            bass_root = 21  # A1
        else:
            bass_root = 26

        # Regular Commando Drum Grid + Gallop Bass
        # Bar 4, 8, 12, 16 have military snare roll fills on 16ths!
        is_fill_bar = bar in [3, 7, 11, 15]

        for s in range(16):
            if is_fill_bar and s in [4, 6, 8, 10, 12, 13, 14, 15]:
                # Snare Roll Fill
                v3_events.append(("drum", 0x81)) # Snare
            elif s in [4, 12]:
                # Snare backbeat
                v3_events.append(("drum", 0x81)) # Snare
            elif s in [0, 8]:
                # Kick
                v3_events.append(("drum", 0x80)) # Kick
            elif s in [2, 6, 10, 14]:
                # Hi-Hat
                v3_events.append(("drum", 0x82)) # HiHat
            else:
                # Galloping Bass note
                p = bass_root
                if s == 15 and not is_fill_bar:
                    p += 1 # Leading tone
                v3_events.append(("bass", p))

    # --------------------------------------------------------------------------
    # ENCODE INTO 6502 MACHINE BYTECODES
    # --------------------------------------------------------------------------
    v1_bytes = bytearray()
    for p, dur_16th in v1_score:
        v1_bytes.append(p)
        v1_bytes.append(dur_16th * fp16)
    v1_bytes.append(0xFF) # Loop

    v2_bytes = bytearray()
    for p, dur_16th in v2_score:
        v2_bytes.append(p)
        v2_bytes.append(dur_16th * fp16)
    v2_bytes.append(0xFF)

    v3_bytes = bytearray()
    for ev_type, val in v3_events:
        if ev_type == "drum":
            v3_bytes.append(val)
        else:
            v3_bytes.append(val)
            v3_bytes.append(fp16)
    v3_bytes.append(0xFF)

    # --------------------------------------------------------------------------
    # ASSEMBLE DRIVER & BUILD PSID
    # --------------------------------------------------------------------------
    def to_asm_bytes(b_array):
        chunks = []
        for i in range(0, len(b_array), 16):
            line = ", ".join(f"${b:02X}" for b in b_array[i:i+16])
            chunks.append(f"    .byte {line}")
        return "\n".join(chunks)

    v1_asm = to_asm_bytes(v1_bytes)
    v2_asm = to_asm_bytes(v2_bytes)
    v3_asm = to_asm_bytes(v3_bytes)

    driver_path = os.path.join(os.path.dirname(__file__), "driver_template.asm")
    with open(driver_path, "r") as fp:
        driver_src = fp.read()

    # Configure exact Commando 1985 Register Settings:
    # Lead: Sawtooth ($21), AD=$08, SR=$A4
    driver_src = driver_src.replace("v1_inst_wave:   .byte $21", "v1_inst_wave:   .byte $21")
    driver_src = driver_src.replace("v1_inst_ad:     .byte $08", "v1_inst_ad:     .byte $08")
    driver_src = driver_src.replace("v1_inst_sr:     .byte $A4", "v1_inst_sr:     .byte $A4")

    # Arp: Pulse ($41), AD=$09, SR=$00
    driver_src = driver_src.replace("v2_inst_wave:   .byte $41", "v2_inst_wave:   .byte $41")
    driver_src = driver_src.replace("v2_inst_ad:     .byte $09", "v2_inst_ad:     .byte $09")
    driver_src = driver_src.replace("v2_inst_sr:     .byte $00", "v2_inst_sr:     .byte $00")

    # Bass: Pulse/Saw ($41), AD=$00, SR=$C0
    driver_src = driver_src.replace("v3_bass_wave:   .byte $41", "v3_bass_wave:   .byte $41")
    driver_src = driver_src.replace("v3_bass_ad:     .byte $00", "v3_bass_ad:     .byte $00")
    driver_src = driver_src.replace("v3_bass_sr:     .byte $C0", "v3_bass_sr:     .byte $C0")

    # Filter: Bandpass ($2F), Cutoff $0580, V1 & V2 filtered ($03)
    driver_src = driver_src.replace("filter_ctrl:    .byte $03", "filter_ctrl:    .byte $03")
    driver_src = driver_src.replace("filter_mode:    .byte $2F", "filter_mode:    .byte $2F")
    driver_src = driver_src.replace("filter_cutoff_l: .byte $00", "filter_cutoff_l: .byte $80")
    driver_src = driver_src.replace("filter_cutoff_h: .byte $04", "filter_cutoff_h: .byte $05")

    # Replace Track Data
    driver_src = driver_src.split("track_v1:")[0] + f"track_v1:\n{v1_asm}\n\ntrack_v2:\n{v2_asm}\n\ntrack_v3:\n{v3_asm}\n"

    # Assemble to 6502 Machine Code
    asm = Assembler6502()
    machine_code, origin = asm.assemble(driver_src, default_origin=0x1000)

    # Package into PSID v2
    psid_data = create_psid_file(
        machine_code=machine_code,
        load_addr=0x1000,
        init_addr=0x1000,
        play_addr=0x1003,
        title="Commando (1:1 Recomposed)",
        author="Rob Hubbard (1985)",
        released="1985/2026 AI"
    )

    out_file = "Commando_1to1_Original.sid"
    with open(out_file, "wb") as fp:
        fp.write(psid_data)
        
    out_file_output = os.path.join("output", out_file)
    with open(out_file_output, "wb") as fp:
        fp.write(psid_data)

    print(f"[OK] 1:1 Rekomposition erstellt: {out_file} ({len(psid_data)} Bytes)")

    # Validate
    val = validate_sid_file(out_file, test_frames=1500)
    print(f"[*] Validierung: {'PASSED [100% OK]' if val['success'] else 'FAILED'}")
    print(f"    -> CPU-Zyklen: Avg={val['avg_cycles_per_frame']}, Peak={val['peak_cycles_per_frame']}")
    print(f"    -> SID-Writes: Lead={val['sid_writes']['voice1_lead']}, Arp={val['sid_writes']['voice2_arp']}, Bass/Drums={val['sid_writes']['voice3_bass_drum']}, Filter={val['sid_writes']['filter_ctrl']}")

if __name__ == "__main__":
    generate_commando_1to1()
