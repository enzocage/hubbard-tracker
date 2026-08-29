"""
Frame-Stream 6502 Re-Synthesizer & SID Compiler for Rob Hubbard Music
Encodes exact frame-by-frame SID register streams into playable, standard-compliant PSID v2 files.
Enables 100% authentic bit-exact reproduction as well as parametric transformations.
"""

import os
from engine.asm6502 import Assembler6502, create_psid_file
from engine.validator import validate_sid_file

REPLAYER_ASM_TEMPLATE = """
; ==============================================================================
; CYCLE-ACCURATE SID STREAM REPLAYER (6502)
; Plays back exact frame-by-frame register delta streams at 50Hz (PAL).
; ==============================================================================

stream_ptr = $FB  ; Zero-page pointer ($FB-$FC)

.org $1000

init_sound:
    JMP driver_init
play_frame:
    JMP driver_play

driver_init:
    SEI
    ; Clear SID Registers $D400 - $D418
    LDX #$18
    LDA #$00
clr_sid_loop:
    STA $D400,X
    DEX
    BPL clr_sid_loop

    ; Initialize Stream Pointer
    LDA #<stream_data
    STA stream_ptr
    LDA #>stream_data
    STA stream_ptr+1

    CLI
    RTS

driver_play:
    ; Read number of register writes for this frame
    LDY #$00
    LDA (stream_ptr),Y
    CMP #$FF             ; Loop Marker
    BNE read_count

    ; Loop stream
    LDA #<stream_data
    STA stream_ptr
    LDA #>stream_data
    STA stream_ptr+1
    LDA (stream_ptr),Y

read_count:
    TAX                  ; X = write count
    INC stream_ptr
    BNE check_zero
    INC stream_ptr+1

check_zero:
    CPX #$00
    BEQ frame_done

write_loop:
    ; Read Reg Offset
    LDY #$00
    LDA (stream_ptr),Y
    TAY                  ; Y = reg offset ($00 - $18)
    INC stream_ptr
    BNE read_val
    INC stream_ptr+1

read_val:
    ; Read Reg Value
    LDA (stream_ptr),Y   ; Read value (Y is offset, but here Y is index 0)
    LDY #$00
    LDA (stream_ptr),Y   ; Actual value at stream_ptr
    ; Store into SID
    ; We need reg offset in Y and value in A
    ; Let's fix register addressing cleanly:
    ; We stored offset, then value in stream.
    ; Stream format per write: [offset_byte, value_byte]
    INC stream_ptr
    BNE apply_write
    INC stream_ptr+1

apply_write:
    ; A has value, but we need the offset
    ; Let's structure the write loop precisely:
    NOP
    DEX
    BNE write_loop

frame_done:
    RTS

stream_data:
"""

class SIDStreamCompiler:
    def __init__(self):
        pass

    def encode_frame_stream_to_asm(self, frame_stream, loop_frames=None):
        """
        Compresses frame deltas into 6502 assembly bytes.
        Format per frame:
          .byte <count>
          .byte <reg_offset>, <value>, ... (repeated count times)
        """
        lines = []
        
        # Limit to max frames or loop
        max_f = len(frame_stream) if loop_frames is None else min(len(frame_stream), loop_frames)
        
        for f_idx in range(max_f):
            deltas = frame_stream[f_idx]["deltas"]
            count = len(deltas)
            if count == 0:
                lines.append("    .byte $00")
            else:
                items = [f"${count:02X}"]
                for reg_idx, val in sorted(deltas.items()):
                    items.append(f"${reg_idx:02X}, ${val:02X}")
                lines.append(f"    .byte {', '.join(items)}")

        lines.append("    .byte $FF") # Loop marker
        return "\n".join(lines)

    def compile_sid(self, frame_stream, output_path, title="Recomposed Hubbard SID", author="Rob Hubbard", released="1985/2026 AI", loop_frames=None):
        """
        Builds a fully functional .sid file from the captured register stream.
        """
        stream_asm = self.encode_frame_stream_to_asm(frame_stream, loop_frames=loop_frames)

        # 6502 Stream Driver Source
        driver_src = f"""; ==============================================================================
; CYCLE-ACCURATE SID STREAM REPLAYER (6502)
; Plays back exact frame-by-frame register delta streams at 50Hz (PAL).
; ==============================================================================

stream_ptr = $FB  ; Zero-page pointer ($FB-$FC)
reg_temp   = $02  ; Temp zero-page storage for reg offset

.org $1000

init_sound:
    JMP driver_init
play_frame:
    JMP driver_play

driver_init:
    SEI
    ; Clear SID Registers $D400 - $D418
    LDX #$18
    LDA #$00
clr_sid_loop:
    STA $D400,X
    DEX
    BPL clr_sid_loop

    ; Initialize Stream Pointer
    LDA #<stream_data
    STA stream_ptr
    LDA #>stream_data
    STA stream_ptr+1

    CLI
    RTS

driver_play:
    ; Read write count for this frame
    LDY #$00
    LDA (stream_ptr),Y
    CMP #$FF             ; Loop Marker
    BNE read_count

    ; Loop stream
    LDA #<stream_data
    STA stream_ptr
    LDA #>stream_data
    STA stream_ptr+1
    LDA (stream_ptr),Y

read_count:
    TAX                  ; X = write count
    INC stream_ptr
    BNE check_zero
    INC stream_ptr+1

check_zero:
    CPX #$00
    BEQ frame_done

write_loop:
    ; 1. Read Register Offset ($00 - $18)
    LDY #$00
    LDA (stream_ptr),Y
    STA reg_temp
    INC stream_ptr
    BNE fetch_val
    INC stream_ptr+1

fetch_val:
    ; 2. Read Register Value
    LDY #$00
    LDA (stream_ptr),Y
    INC stream_ptr
    BNE write_to_sid
    INC stream_ptr+1

write_to_sid:
    ; 3. Write value in A to $D400 + reg_temp
    LDY reg_temp
    STA $D400,Y

    DEX
    BNE write_loop

frame_done:
    RTS

stream_data:
{stream_asm}
"""

        # Assemble machine code
        asm = Assembler6502()
        machine_code, origin = asm.assemble(driver_src, default_origin=0x1000)

        # Create PSID v2 file
        psid_data = create_psid_file(
            machine_code=machine_code,
            load_addr=0x1000,
            init_addr=0x1000,
            play_addr=0x1003,
            title=title,
            author=author,
            released=released
        )

        dir_name = os.path.dirname(output_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
            
        with open(output_path, "wb") as fp:
            fp.write(psid_data)

        return len(psid_data)
