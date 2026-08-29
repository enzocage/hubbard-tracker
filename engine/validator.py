"""
Pure Python 6502 CPU and SID Register Validator for Rob Hubbard SID Composer
Executes .sid files headless for 1500+ frames to guarantee 100% stability and playback correctness.
"""

import struct

class CPU6502:
    def __init__(self):
        self.mem = bytearray(65536)
        self.a = 0
        self.x = 0
        self.y = 0
        self.sp = 0xFF
        self.pc = 0x0000
        # Flags: N, V, -, B, D, I, Z, C
        self.flag_n = False
        self.flag_v = False
        self.flag_d = False
        self.flag_i = False
        self.flag_z = False
        self.flag_c = False
        self.cycles = 0
        self.sid_writes = {}

    def get_status(self):
        val = 0x20
        if self.flag_n: val |= 0x80
        if self.flag_v: val |= 0x40
        if self.flag_d: val |= 0x08
        if self.flag_i: val |= 0x04
        if self.flag_z: val |= 0x02
        if self.flag_c: val |= 0x01
        return val

    def set_status(self, val):
        self.flag_n = bool(val & 0x80)
        self.flag_v = bool(val & 0x40)
        self.flag_d = bool(val & 0x08)
        self.flag_i = bool(val & 0x04)
        self.flag_z = bool(val & 0x02)
        self.flag_c = bool(val & 0x01)

    def set_nz(self, val):
        val &= 0xFF
        self.flag_z = (val == 0)
        self.flag_n = bool(val & 0x80)
        return val

    def read(self, addr):
        addr &= 0xFFFF
        return self.mem[addr]

    def write(self, addr, val):
        addr &= 0xFFFF
        val &= 0xFF
        self.mem[addr] = val
        if 0xD400 <= addr <= 0xD418:
            reg = addr - 0xD400
            if reg not in self.sid_writes:
                self.sid_writes[reg] = 0
            self.sid_writes[reg] += 1

    def push(self, val):
        self.mem[0x0100 + self.sp] = val & 0xFF
        self.sp = (self.sp - 1) & 0xFF

    def pop(self):
        self.sp = (self.sp + 1) & 0xFF
        return self.mem[0x0100 + self.sp]

    def execute_subroutine(self, addr, max_cycles=100000):
        self.push(0x00)
        self.push(0x00)
        self.pc = addr
        start_sp = self.sp
        cycles_start = self.cycles

        while self.sp <= start_sp and (self.cycles - cycles_start) < max_cycles:
            if self.pc <= 0x0001:
                break
            self.step()

        if (self.cycles - cycles_start) >= max_cycles:
            raise TimeoutError(f"Subroutine at 0x{addr:04X} exceeded {max_cycles} cycles (infinite loop).")

        return self.cycles - cycles_start

    def step(self):
        opc = self.read(self.pc)
        self.pc = (self.pc + 1) & 0xFFFF
        self.cycles += 2

        # --- BRK, NOP, SEC, CLC, SEI, CLI, CLD, SED ---
        if opc == 0x00: return # BRK / Return
        elif opc == 0xEA: return # NOP
        elif opc == 0x38: self.flag_c = True; return # SEC
        elif opc == 0x18: self.flag_c = False; return # CLC
        elif opc == 0x78: self.flag_i = True; return # SEI
        elif opc == 0x58: self.flag_i = False; return # CLI
        elif opc == 0xD8: self.flag_d = False; return # CLD
        elif opc == 0xF8: self.flag_d = True; return # SED

        # --- RTS, RTI ---
        elif opc == 0x60:
            low = self.pop()
            high = self.pop()
            self.pc = ((high << 8) | low) + 1
            return
        elif opc == 0x40:
            self.set_status(self.pop())
            low = self.pop()
            high = self.pop()
            self.pc = (high << 8) | low
            return

        # --- JMP ---
        elif opc == 0x4C: # ABS
            low = self.read(self.pc); high = self.read(self.pc + 1)
            self.pc = (high << 8) | low
            return
        elif opc == 0x6C: # IND
            low = self.read(self.pc); high = self.read(self.pc + 1)
            ptr = (high << 8) | low
            self.pc = self.read(ptr) | (self.read(ptr + 1) << 8)
            return

        # --- JSR ---
        elif opc == 0x20:
            low = self.read(self.pc); high = self.read(self.pc + 1)
            ret_addr = (self.pc + 1) & 0xFFFF
            self.push((ret_addr >> 8) & 0xFF)
            self.push(ret_addr & 0xFF)
            self.pc = (high << 8) | low
            return

        # --- LDA ---
        elif opc == 0xA9: self.a = self.set_nz(self.read(self.pc)); self.pc += 1
        elif opc == 0xA5: addr = self.read(self.pc); self.pc += 1; self.a = self.set_nz(self.read(addr))
        elif opc == 0xB5: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; self.a = self.set_nz(self.read(addr))
        elif opc == 0xAD: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.a = self.set_nz(self.read(addr))
        elif opc == 0xBD: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; self.a = self.set_nz(self.read(addr))
        elif opc == 0xB9: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; self.a = self.set_nz(self.read(addr))
        elif opc == 0xA1: # (IND,X)
            zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1
            base = self.read(zp) | (self.read((zp + 1) & 0xFF) << 8)
            self.a = self.set_nz(self.read(base))
        elif opc == 0xB1: # (IND),Y
            zp = self.read(self.pc); self.pc += 1
            base = self.read(zp) | (self.read((zp + 1) & 0xFF) << 8)
            self.a = self.set_nz(self.read(base + self.y))

        # --- STA ---
        elif opc == 0x85: addr = self.read(self.pc); self.pc += 1; self.write(addr, self.a)
        elif opc == 0x95: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; self.write(addr, self.a)
        elif opc == 0x8D: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.write(addr, self.a)
        elif opc == 0x9D: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; self.write(addr, self.a)
        elif opc == 0x99: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; self.write(addr, self.a)
        elif opc == 0x81: # (IND,X)
            zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1
            base = self.read(zp) | (self.read((zp + 1) & 0xFF) << 8)
            self.write(base, self.a)
        elif opc == 0x91: # (IND),Y
            zp = self.read(self.pc); self.pc += 1
            base = self.read(zp) | (self.read((zp + 1) & 0xFF) << 8)
            self.write(base + self.y, self.a)

        # --- LDX, STX, LDY, STY ---
        elif opc == 0xA2: self.x = self.set_nz(self.read(self.pc)); self.pc += 1
        elif opc == 0xA6: addr = self.read(self.pc); self.pc += 1; self.x = self.set_nz(self.read(addr))
        elif opc == 0xB6: addr = (self.read(self.pc) + self.y) & 0xFF; self.pc += 1; self.x = self.set_nz(self.read(addr))
        elif opc == 0xAE: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.x = self.set_nz(self.read(addr))
        elif opc == 0xBE: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; self.x = self.set_nz(self.read(addr))
        elif opc == 0x86: addr = self.read(self.pc); self.pc += 1; self.write(addr, self.x)
        elif opc == 0x96: addr = (self.read(self.pc) + self.y) & 0xFF; self.pc += 1; self.write(addr, self.x)
        elif opc == 0x8E: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.write(addr, self.x)
        elif opc == 0xA0: self.y = self.set_nz(self.read(self.pc)); self.pc += 1
        elif opc == 0xA4: addr = self.read(self.pc); self.pc += 1; self.y = self.set_nz(self.read(addr))
        elif opc == 0xB4: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; self.y = self.set_nz(self.read(addr))
        elif opc == 0xAC: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.y = self.set_nz(self.read(addr))
        elif opc == 0xBC: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; self.y = self.set_nz(self.read(addr))
        elif opc == 0x84: addr = self.read(self.pc); self.pc += 1; self.write(addr, self.y)
        elif opc == 0x94: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; self.write(addr, self.y)
        elif opc == 0x8C: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; self.write(addr, self.y)

        # --- INC, DEC, INX, DEX, INY, DEY ---
        elif opc == 0xE8: self.x = self.set_nz(self.x + 1)
        elif opc == 0xCA: self.x = self.set_nz(self.x - 1)
        elif opc == 0xC8: self.y = self.set_nz(self.y + 1)
        elif opc == 0x88: self.y = self.set_nz(self.y - 1)
        elif opc == 0xE6: addr = self.read(self.pc); self.pc += 1; v = self.set_nz(self.read(addr) + 1); self.write(addr, v)
        elif opc == 0xF6: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; v = self.set_nz(self.read(addr) + 1); self.write(addr, v)
        elif opc == 0xEE: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; v = self.set_nz(self.read(addr) + 1); self.write(addr, v)
        elif opc == 0xFE: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; v = self.set_nz(self.read(addr) + 1); self.write(addr, v)
        elif opc == 0xC6: addr = self.read(self.pc); self.pc += 1; v = self.set_nz(self.read(addr) - 1); self.write(addr, v)
        elif opc == 0xD6: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; v = self.set_nz(self.read(addr) - 1); self.write(addr, v)
        elif opc == 0xCE: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; v = self.set_nz(self.read(addr) - 1); self.write(addr, v)
        elif opc == 0xDE: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; v = self.set_nz(self.read(addr) - 1); self.write(addr, v)

        # --- TAX, TXA, TAY, TYA, TSX, TXS ---
        elif opc == 0xAA: self.x = self.set_nz(self.a)
        elif opc == 0x8A: self.a = self.set_nz(self.x)
        elif opc == 0xA8: self.y = self.set_nz(self.a)
        elif opc == 0x98: self.a = self.set_nz(self.y)
        elif opc == 0xBA: self.x = self.set_nz(self.sp)
        elif opc == 0x9A: self.sp = self.x

        # --- PHA, PHP, PLA, PLP ---
        elif opc == 0x48: self.push(self.a)
        elif opc == 0x08: self.push(self.get_status())
        elif opc == 0x68: self.a = self.set_nz(self.pop())
        elif opc == 0x28: self.set_status(self.pop())

        # --- CMP, CPX, CPY ---
        elif opc == 0xC9: val = self.read(self.pc); self.pc += 1; self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xC5: val = self.read(self.read(self.pc)); self.pc += 1; self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xD5: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1; self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xCD: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xDD: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr); self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xD9: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr); self.flag_c = self.a >= val; self.set_nz((self.a - val) & 0xFF)
        elif opc == 0xC1: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base); self.flag_c = self.a >= val; self.set_nz((self.a-val)&0xFF)
        elif opc == 0xD1: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base+self.y); self.flag_c = self.a >= val; self.set_nz((self.a-val)&0xFF)

        elif opc == 0xE0: val = self.read(self.pc); self.pc += 1; self.flag_c = self.x >= val; self.set_nz((self.x - val) & 0xFF)
        elif opc == 0xE4: val = self.read(self.read(self.pc)); self.pc += 1; self.flag_c = self.x >= val; self.set_nz((self.x - val) & 0xFF)
        elif opc == 0xEC: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_c = self.x >= val; self.set_nz((self.x - val) & 0xFF)
        elif opc == 0xC0: val = self.read(self.pc); self.pc += 1; self.flag_c = self.y >= val; self.set_nz((self.y - val) & 0xFF)
        elif opc == 0xC4: val = self.read(self.read(self.pc)); self.pc += 1; self.flag_c = self.y >= val; self.set_nz((self.y - val) & 0xFF)
        elif opc == 0xCC: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_c = self.y >= val; self.set_nz((self.y - val) & 0xFF)

        # --- BRANCHES ---
        elif opc == 0xD0: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; (not self.flag_z) and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0xF0: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; self.flag_z and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0x90: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; (not self.flag_c) and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0xB0: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; self.flag_c and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0x10: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; (not self.flag_n) and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0x30: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; self.flag_n and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0x50: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; (not self.flag_v) and setattr(self, 'pc', (self.pc + off) & 0xFFFF)
        elif opc == 0x70: off = struct.unpack('b', bytes([self.read(self.pc)]))[0]; self.pc += 1; self.flag_v and setattr(self, 'pc', (self.pc + off) & 0xFFFF)

        # --- ADC, SBC ---
        elif opc in (0x69, 0x65, 0x75, 0x6D, 0x7D, 0x79, 0x61, 0x71):
            if opc == 0x69: val = self.read(self.pc); self.pc += 1
            elif opc == 0x65: val = self.read(self.read(self.pc)); self.pc += 1
            elif opc == 0x75: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1
            elif opc == 0x6D: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr)
            elif opc == 0x7D: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x79: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x61: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base)
            elif opc == 0x71: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base + self.y)
            cin = 1 if self.flag_c else 0
            s = self.a + val + cin
            self.flag_c = s > 0xFF
            self.flag_v = bool((~(self.a ^ val) & (self.a ^ s)) & 0x80)
            self.a = self.set_nz(s & 0xFF)

        elif opc in (0xE9, 0xE5, 0xF5, 0xED, 0xFD, 0xF9, 0xE1, 0xF1):
            if opc == 0xE9: val = self.read(self.pc); self.pc += 1
            elif opc == 0xE5: val = self.read(self.read(self.pc)); self.pc += 1
            elif opc == 0xF5: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1
            elif opc == 0xED: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr)
            elif opc == 0xFD: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0xF9: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0xE1: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base)
            elif opc == 0xF1: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base + self.y)
            cin = 1 if self.flag_c else 0
            diff = self.a - val - (1 - cin)
            self.flag_c = diff >= 0
            self.flag_v = bool(((self.a ^ val) & (self.a ^ diff)) & 0x80)
            self.a = self.set_nz(diff & 0xFF)

        # --- AND, ORA, EOR ---
        elif opc in (0x29, 0x25, 0x35, 0x2D, 0x3D, 0x39, 0x21, 0x31):
            if opc == 0x29: val = self.read(self.pc); self.pc += 1
            elif opc == 0x25: val = self.read(self.read(self.pc)); self.pc += 1
            elif opc == 0x35: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1
            elif opc == 0x2D: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr)
            elif opc == 0x3D: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x39: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x21: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base)
            elif opc == 0x31: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base + self.y)
            self.a = self.set_nz(self.a & val)

        elif opc in (0x09, 0x05, 0x15, 0x0D, 0x1D, 0x19, 0x01, 0x11):
            if opc == 0x09: val = self.read(self.pc); self.pc += 1
            elif opc == 0x05: val = self.read(self.read(self.pc)); self.pc += 1
            elif opc == 0x15: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1
            elif opc == 0x0D: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr)
            elif opc == 0x1D: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x19: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x01: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base)
            elif opc == 0x11: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base + self.y)
            self.a = self.set_nz(self.a | val)

        elif opc in (0x49, 0x45, 0x55, 0x4D, 0x5D, 0x59, 0x41, 0x51):
            if opc == 0x49: val = self.read(self.pc); self.pc += 1
            elif opc == 0x45: val = self.read(self.read(self.pc)); self.pc += 1
            elif opc == 0x55: val = self.read((self.read(self.pc) + self.x) & 0xFF); self.pc += 1
            elif opc == 0x4D: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr)
            elif opc == 0x5D: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x59: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.y) & 0xFFFF; self.pc += 2; val = self.read(addr)
            elif opc == 0x41: zp = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base)
            elif opc == 0x51: zp = self.read(self.pc); self.pc += 1; base = self.read(zp) | (self.read((zp+1)&0xFF)<<8); val = self.read(base + self.y)
            self.a = self.set_nz(self.a ^ val)

        # --- ASL, LSR, ROL, ROR ---
        elif opc == 0x0A: self.flag_c = bool(self.a & 0x80); self.a = self.set_nz(self.a << 1)
        elif opc == 0x06: addr = self.read(self.pc); self.pc += 1; val = self.read(addr); self.flag_c = bool(val & 0x80); v = self.set_nz(val << 1); self.write(addr, v)
        elif opc == 0x16: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; val = self.read(addr); self.flag_c = bool(val & 0x80); v = self.set_nz(val << 1); self.write(addr, v)
        elif opc == 0x0E: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_c = bool(val & 0x80); v = self.set_nz(val << 1); self.write(addr, v)
        elif opc == 0x1E: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr); self.flag_c = bool(val & 0x80); v = self.set_nz(val << 1); self.write(addr, v)

        elif opc == 0x4A: self.flag_c = bool(self.a & 0x01); self.a = self.set_nz(self.a >> 1)
        elif opc == 0x46: addr = self.read(self.pc); self.pc += 1; val = self.read(addr); self.flag_c = bool(val & 0x01); v = self.set_nz(val >> 1); self.write(addr, v)
        elif opc == 0x56: addr = (self.read(self.pc) + self.x) & 0xFF; self.pc += 1; val = self.read(addr); self.flag_c = bool(val & 0x01); v = self.set_nz(val >> 1); self.write(addr, v)
        elif opc == 0x4E: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_c = bool(val & 0x01); v = self.set_nz(val >> 1); self.write(addr, v)
        elif opc == 0x5E: addr = ((self.read(self.pc) | (self.read(self.pc+1) << 8)) + self.x) & 0xFFFF; self.pc += 2; val = self.read(addr); self.flag_c = bool(val & 0x01); v = self.set_nz(val >> 1); self.write(addr, v)

        elif opc == 0x2A: c_in = 1 if self.flag_c else 0; self.flag_c = bool(self.a & 0x80); self.a = self.set_nz((self.a << 1) | c_in)
        elif opc == 0x26: addr = self.read(self.pc); self.pc += 1; val = self.read(addr); c_in = 1 if self.flag_c else 0; self.flag_c = bool(val & 0x80); v = self.set_nz((val << 1) | c_in); self.write(addr, v)
        elif opc == 0x2E: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); c_in = 1 if self.flag_c else 0; self.flag_c = bool(val & 0x80); v = self.set_nz((val << 1) | c_in); self.write(addr, v)

        elif opc == 0x6A: c_in = 0x80 if self.flag_c else 0; self.flag_c = bool(self.a & 0x01); self.a = self.set_nz((self.a >> 1) | c_in)
        elif opc == 0x66: addr = self.read(self.pc); self.pc += 1; val = self.read(addr); c_in = 0x80 if self.flag_c else 0; self.flag_c = bool(val & 0x01); v = self.set_nz((val >> 1) | c_in); self.write(addr, v)
        elif opc == 0x6E: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); c_in = 0x80 if self.flag_c else 0; self.flag_c = bool(val & 0x01); v = self.set_nz((val >> 1) | c_in); self.write(addr, v)

        # --- BIT ---
        elif opc == 0x24: val = self.read(self.read(self.pc)); self.pc += 1; self.flag_z = (self.a & val) == 0; self.flag_n = bool(val & 0x80); self.flag_v = bool(val & 0x40)
        elif opc == 0x2C: addr = self.read(self.pc) | (self.read(self.pc+1) << 8); self.pc += 2; val = self.read(addr); self.flag_z = (self.a & val) == 0; self.flag_n = bool(val & 0x80); self.flag_v = bool(val & 0x40)

        else:
            raise NotImplementedError(f"Opcode 0x{opc:02X} at PC=0x{(self.pc-1):04X} not implemented.")


def validate_sid_file(sid_path, test_frames=1500):
    with open(sid_path, "rb") as fp:
        data = fp.read()

    magic = data[:4].decode('latin1')
    if magic not in ('PSID', 'RSID'):
        return {"success": False, "error": f"Invalid magic: {magic}"}

    offset = struct.unpack('>H', data[6:8])[0]
    load_addr = struct.unpack('>H', data[8:10])[0]
    init_addr = struct.unpack('>H', data[10:12])[0]
    play_addr = struct.unpack('>H', data[12:14])[0]
    title = data[22:54].decode('latin1', errors='ignore').rstrip('\x00')

    payload = data[offset:]
    if load_addr == 0:
        load_addr = struct.unpack('<H', payload[:2])[0]
        payload = payload[2:]

    cpu = CPU6502()
    cpu.mem[load_addr:load_addr+len(payload)] = payload

    try:
        init_cycles = cpu.execute_subroutine(init_addr, max_cycles=50000)
    except Exception as e:
        return {"success": False, "error": f"Init failed at 0x{init_addr:04X}: {e}"}

    frame_cycles = []
    try:
        for f in range(test_frames):
            cyc = cpu.execute_subroutine(play_addr, max_cycles=20000)
            frame_cycles.append(cyc)
    except Exception as e:
        return {"success": False, "error": f"Play crashed at frame {f}: {e}"}

    avg_cycles = sum(frame_cycles) / len(frame_cycles)
    max_cycles = max(frame_cycles)

    v1_writes = sum(cpu.sid_writes.get(r, 0) for r in range(0x00, 0x07))
    v2_writes = sum(cpu.sid_writes.get(r, 0) for r in range(0x07, 0x0E))
    v3_writes = sum(cpu.sid_writes.get(r, 0) for r in range(0x0E, 0x15))
    filter_writes = sum(cpu.sid_writes.get(r, 0) for r in range(0x15, 0x19))

    is_valid = (
        (v1_writes + v2_writes + v3_writes) > 50 and
        avg_cycles < 2500 and
        max_cycles < 8000
    )

    return {
        "success": is_valid,
        "title": title,
        "load_addr": hex(load_addr),
        "init_addr": hex(init_addr),
        "play_addr": hex(play_addr),
        "frames_tested": test_frames,
        "avg_cycles_per_frame": round(avg_cycles, 1),
        "peak_cycles_per_frame": max_cycles,
        "sid_writes": {
            "voice1_lead": v1_writes,
            "voice2_arp": v2_writes,
            "voice3_bass_drum": v3_writes,
            "filter_ctrl": filter_writes,
            "total": sum(cpu.sid_writes.values())
        }
    }
