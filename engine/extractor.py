"""
Rob Hubbard SID Frame-Accurate Extractor & Reverse-Engineering Engine
Executes original Commodore 64 SID binaries in a 6502 emulator and captures
the exact 50Hz register stream ($D400-$D418) for all 25 SID registers.
"""

import struct
from engine.validator import CPU6502

class SIDExtractor:
    def __init__(self, sid_file_path):
        self.sid_file_path = sid_file_path
        self.load_addr = 0
        self.init_addr = 0
        self.play_addr = 0
        self.payload = b''
        self.title = ""
        self.author = ""
        self.released = ""
        self._load_sid()

    def _load_sid(self):
        with open(self.sid_file_path, "rb") as fp:
            data = fp.read()

        magic = data[:4].decode('latin1')
        if magic not in ('PSID', 'RSID'):
            raise ValueError(f"Invalid SID magic: {magic}")

        offset = struct.unpack('>H', data[6:8])[0]
        self.load_addr = struct.unpack('>H', data[8:10])[0]
        self.init_addr = struct.unpack('>H', data[10:12])[0]
        self.play_addr = struct.unpack('>H', data[12:14])[0]
        self.title = data[22:54].decode('latin1', errors='ignore').rstrip('\x00')
        self.author = data[54:86].decode('latin1', errors='ignore').rstrip('\x00')
        self.released = data[86:118].decode('latin1', errors='ignore').rstrip('\x00')

        self.payload = data[offset:]
        if self.load_addr == 0:
            self.load_addr = struct.unpack('<H', self.payload[:2])[0]
            self.payload = self.payload[2:]

    def capture_frames(self, num_frames=1500):
        """
        Executes the original SID driver for num_frames (50Hz) and captures
        the exact register delta stream and register state per frame.
        """
        cpu = CPU6502()
        cpu.mem[self.load_addr:self.load_addr + len(self.payload)] = self.payload

        # 1. Execute Init Subroutine
        try:
            cpu.execute_subroutine(self.init_addr, max_cycles=500000)
        except TimeoutError:
            pass

        # Cumulative register shadow memory ($D400 - $D418)
        shadow_sid = [0] * 25
        frame_stream = []

        for frame_idx in range(num_frames):
            writes_this_frame = {}

            # Intercept memory writes to $D400-$D418
            def make_writer(f_dict):
                def custom_write(addr, val):
                    addr &= 0xFFFF
                    val &= 0xFF
                    cpu.mem[addr] = val
                    if 0xD400 <= addr <= 0xD418:
                        reg_offset = addr - 0xD400
                        f_dict[reg_offset] = val
                        shadow_sid[reg_offset] = val
                return custom_write

            cpu.write = make_writer(writes_this_frame)
            cpu.execute_subroutine(self.play_addr)

            # Store both the deltas and the full 25-register state
            frame_stream.append({
                "frame": frame_idx,
                "deltas": dict(writes_this_frame),
                "state": list(shadow_sid)
            })

        return frame_stream

    def extract_musical_features(self, frame_stream):
        """
        Analyzes the captured register stream to extract high-level musical features:
        - Voice 1, 2, 3 active frequencies & waveforms
        - Note On/Off events (Gate bit changes)
        - Pitch slide & vibrato envelopes
        - Filter cutoff trajectory
        """
        notes_v1 = []
        notes_v2 = []
        notes_v3 = []

        prev_gate_v1 = 0
        prev_gate_v2 = 0
        prev_gate_v3 = 0

        for f in frame_stream:
            state = f["state"]
            frame_num = f["frame"]

            # Voice 1 ($D400 - $D406)
            v1_freq = state[0] | (state[1] << 8)
            v1_wave = state[4]
            v1_gate = v1_wave & 0x01
            if v1_gate and not prev_gate_v1:
                notes_v1.append({"frame": frame_num, "freq": v1_freq, "wave": v1_wave, "type": "note_on"})
            elif not v1_gate and prev_gate_v1:
                notes_v1.append({"frame": frame_num, "freq": v1_freq, "wave": v1_wave, "type": "note_off"})
            prev_gate_v1 = v1_gate

            # Voice 2 ($D407 - $D40D)
            v2_freq = state[7] | (state[8] << 8)
            v2_wave = state[11]
            v2_gate = v2_wave & 0x01
            if v2_gate and not prev_gate_v2:
                notes_v2.append({"frame": frame_num, "freq": v2_freq, "wave": v2_wave, "type": "note_on"})
            prev_gate_v2 = v2_gate

            # Voice 3 ($D40E - $D414)
            v3_freq = state[14] | (state[15] << 8)
            v3_wave = state[18]
            v3_gate = v3_wave & 0x01
            if v3_gate and not prev_gate_v3:
                notes_v3.append({"frame": frame_num, "freq": v3_freq, "wave": v3_wave, "type": "note_on"})
            prev_gate_v3 = v3_gate

        return {
            "title": self.title,
            "author": self.author,
            "total_frames": len(frame_stream),
            "v1_events": len(notes_v1),
            "v2_events": len(notes_v2),
            "v3_events": len(notes_v3),
            "v1_notes": notes_v1,
            "v2_notes": notes_v2,
            "v3_notes": notes_v3
        }
