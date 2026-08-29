"""
Zero-Dependency 6502 Assembler and PSID-v2 Builder for Rob Hubbard SID Composer
"""

import struct
import re

OPCODES = {
    # ADC
    "ADC": {
        "IMM": 0x69, "ZP": 0x65, "ZPX": 0x75, "ABS": 0x6D, "ABSX": 0x7D, "ABSY": 0x79, "INDX": 0x61, "INDY": 0x71
    },
    # AND
    "AND": {
        "IMM": 0x29, "ZP": 0x25, "ZPX": 0x35, "ABS": 0x2D, "ABSX": 0x3D, "ABSY": 0x39, "INDX": 0x21, "INDY": 0x31
    },
    # ASL
    "ASL": {
        "ACC": 0x0A, "ZP": 0x06, "ZPX": 0x16, "ABS": 0x0E, "ABSX": 0x1E
    },
    # BCC, BCS, BEQ, BMI, BNE, BPL, BVC, BVS
    "BCC": {"REL": 0x90},
    "BCS": {"REL": 0xB0},
    "BEQ": {"REL": 0xF0},
    "BMI": {"REL": 0x30},
    "BNE": {"REL": 0xD0},
    "BPL": {"REL": 0x10},
    "BVC": {"REL": 0x50},
    "BVS": {"REL": 0x70},
    # BIT
    "BIT": {"ZP": 0x24, "ABS": 0x2C},
    # BRK, CLC, CLD, CLI, CLV, SEC, SED, SEI
    "BRK": {"IMP": 0x00},
    "CLC": {"IMP": 0x18},
    "CLD": {"IMP": 0xD8},
    "CLI": {"IMP": 0x58},
    "CLV": {"IMP": 0xB8},
    "SEC": {"IMP": 0x38},
    "SED": {"IMP": 0xF8},
    "SEI": {"IMP": 0x78},
    # CMP, CPX, CPY
    "CMP": {
        "IMM": 0xC9, "ZP": 0xC5, "ZPX": 0xD5, "ABS": 0xCD, "ABSX": 0xDD, "ABSY": 0xD9, "INDX": 0xC1, "INDY": 0xD1
    },
    "CPX": {"IMM": 0xE0, "ZP": 0xE4, "ABS": 0xEC},
    "CPY": {"IMM": 0xC0, "ZP": 0xC4, "ABS": 0xCC},
    # DEC, DEX, DEY
    "DEC": {"ZP": 0xC6, "ZPX": 0xD6, "ABS": 0xCE, "ABSX": 0xDE},
    "DEX": {"IMP": 0xCA},
    "DEY": {"IMP": 0x88},
    # EOR
    "EOR": {
        "IMM": 0x49, "ZP": 0x45, "ZPX": 0x55, "ABS": 0x4D, "ABSX": 0x5D, "ABSY": 0x59, "INDX": 0x41, "INDY": 0x51
    },
    # INC, INX, INY
    "INC": {"ZP": 0xE6, "ZPX": 0xF6, "ABS": 0xEE, "ABSX": 0xFE},
    "INX": {"IMP": 0xE8},
    "INY": {"IMP": 0xC8},
    # JMP, JSR
    "JMP": {"ABS": 0x4C, "IND": 0x6C},
    "JSR": {"ABS": 0x20},
    # LDA, LDX, LDY
    "LDA": {
        "IMM": 0xA9, "ZP": 0xA5, "ZPX": 0xB5, "ABS": 0xAD, "ABSX": 0xBD, "ABSY": 0xB9, "INDX": 0xA1, "INDY": 0xB1
    },
    "LDX": {
        "IMM": 0xA2, "ZP": 0xA6, "ZPY": 0xB6, "ABS": 0xAE, "ABSY": 0xBE
    },
    "LDY": {
        "IMM": 0xA0, "ZP": 0xA4, "ZPX": 0xB4, "ABS": 0xAC, "ABSX": 0xBC
    },
    # LSR
    "LSR": {
        "ACC": 0x4A, "ZP": 0x46, "ZPX": 0x56, "ABS": 0x4E, "ABSX": 0x5E
    },
    # NOP
    "NOP": {"IMP": 0xEA},
    # ORA
    "ORA": {
        "IMM": 0x09, "ZP": 0x05, "ZPX": 0x15, "ABS": 0x0D, "ABSX": 0x1D, "ABSY": 0x19, "INDX": 0x01, "INDY": 0x11
    },
    # PHA, PHP, PLA, PLP
    "PHA": {"IMP": 0x48},
    "PHP": {"IMP": 0x08},
    "PLA": {"IMP": 0x68},
    "PLP": {"IMP": 0x28},
    # ROL, ROR
    "ROL": {
        "ACC": 0x2A, "ZP": 0x26, "ZPX": 0x36, "ABS": 0x2E, "ABSX": 0x3E
    },
    "ROR": {
        "ACC": 0x6A, "ZP": 0x66, "ZPX": 0x76, "ABS": 0x6E, "ABSX": 0x7E
    },
    # RTI, RTS
    "RTI": {"IMP": 0x40},
    "RTS": {"IMP": 0x60},
    # SBC
    "SBC": {
        "IMM": 0xE9, "ZP": 0xE5, "ZPX": 0xF5, "ABS": 0xED, "ABSX": 0xFD, "ABSY": 0xF9, "INDX": 0xE1, "INDY": 0xF1
    },
    # STA, STX, STY
    "STA": {
        "ZP": 0x85, "ZPX": 0x95, "ABS": 0x8D, "ABSX": 0x9D, "ABSY": 0x99, "INDX": 0x81, "INDY": 0x91
    },
    "STX": {
        "ZP": 0x86, "ZPY": 0x96, "ABS": 0x8E
    },
    "STY": {
        "ZP": 0x84, "ZPX": 0x94, "ABS": 0x8C
    },
    # TAX, TAY, TSX, TXA, TXS, TYA
    "TAX": {"IMP": 0xAA},
    "TAY": {"IMP": 0xA8},
    "TSX": {"IMP": 0xBA},
    "TXA": {"IMP": 0x8A},
    "TXS": {"IMP": 0x9A},
    "TYA": {"IMP": 0x98},
}

class Assembler6502:
    def __init__(self):
        self.labels = {}
        self.origin = 0x1000
        self.pc = 0x1000

    def is_zp_operand(self, op_str, symbols):
        op_str = op_str.strip()
        if op_str.startswith('<'):
            return True
        if op_str.startswith('$'):
            try:
                v = int(op_str[1:], 16)
                return v <= 0xFF
            except ValueError:
                pass
        if op_str.startswith('%'):
            try:
                v = int(op_str[1:], 2)
                return v <= 0xFF
            except ValueError:
                pass
        if op_str in symbols:
            return symbols[op_str] <= 0xFF
        # Math with + or -
        if '+' in op_str or '-' in op_str:
            op = '+' if '+' in op_str else '-'
            left = op_str.split(op, 1)[0].strip()
            if left in symbols:
                return symbols[left] <= 0xFF
        return False

    def parse_value(self, val_str, symbols):
        val_str = val_str.strip()
        if not val_str:
            return 0
            
        # Check high/low byte operators < and >
        if val_str.startswith('<'):
            v = self.parse_value(val_str[1:], symbols)
            return v & 0xFF
        if val_str.startswith('>'):
            v = self.parse_value(val_str[1:], symbols)
            return (v >> 8) & 0xFF

        # Check math expressions like label+offset or label-offset
        for op in ['+', '-']:
            if op in val_str and not val_str.startswith('$') and not val_str.startswith('%'):
                parts = val_str.rsplit(op, 1)
                left = self.parse_value(parts[0], symbols)
                right = self.parse_value(parts[1], symbols)
                return (left + right) if op == '+' else (left - right)

        if val_str in symbols:
            return symbols[val_str]
        elif val_str.startswith('$'):
            return int(val_str[1:], 16)
        elif val_str.startswith('%'):
            return int(val_str[1:], 2)
        elif val_str.startswith("'") and val_str.endswith("'") and len(val_str) == 3:
            return ord(val_str[1])
        else:
            try:
                return int(val_str, 10)
            except ValueError:
                return 0

    def assemble(self, source_code, default_origin=0x1000):
        lines = source_code.splitlines()
        self.origin = default_origin
        self.labels = {}
        
        # Pass 1: Determine Origin & Label Addresses
        self.pc = self.origin
        first_org = True
        for line in lines:
            clean = line.split(';', 1)[0].strip()
            if not clean:
                continue
            if clean.upper().startswith(".ORG"):
                val = self.parse_value(clean[4:], self.labels)
                if first_org:
                    self.origin = val
                    first_org = False
                self.pc = val
                continue
            if ':' in clean:
                lbl, rest = clean.split(':', 1)
                self.labels[lbl.strip()] = self.pc
                clean = rest.strip()
                if not clean:
                    continue
            elif '=' in clean:
                sym, val = clean.split('=', 1)
                self.labels[sym.strip()] = self.parse_value(val, self.labels)
                continue
                
            self._step_pc(clean)

        # Pass 2: Generate Bytecode
        self.pc = self.origin
        output_buffer = bytearray()
        
        for line in lines:
            clean = line.split(';', 1)[0].strip()
            if not clean:
                continue
            if clean.upper().startswith(".ORG"):
                target_pc = self.parse_value(clean[4:], self.labels)
                if target_pc > self.pc:
                    pad_len = target_pc - self.pc
                    output_buffer.extend(b'\x00' * pad_len)
                    self.pc = target_pc
                elif target_pc < self.pc:
                    self.pc = target_pc
                continue
            if ':' in clean:
                _, rest = clean.split(':', 1)
                clean = rest.strip()
                if not clean:
                    continue
            elif '=' in clean:
                continue
                
            chunk = self._emit_bytes(clean)
            if chunk:
                output_buffer.extend(chunk)
                
        return bytes(output_buffer), self.origin

    def _step_pc(self, line):
        tokens = line.split(None, 1)
        mnemonic = tokens[0].upper()
        operand = tokens[1].strip() if len(tokens) > 1 else ""

        if mnemonic == ".BYTE":
            parts = [p.strip() for p in operand.split(',')]
            self.pc += len(parts)
            return
        elif mnemonic == ".WORD":
            parts = [p.strip() for p in operand.split(',')]
            self.pc += len(parts) * 2
            return
        elif mnemonic == ".TEXT":
            m = re.search(r'"([^"]*)"', operand)
            txt = m.group(1) if m else operand
            self.pc += len(txt)
            return

        if mnemonic not in OPCODES:
            if not operand:
                self.labels[mnemonic] = self.pc
            return

        opcode_table = OPCODES[mnemonic]
        if not operand or operand.upper() == "A":
            self.pc += 1
        elif operand.startswith('#'):
            self.pc += 2
        elif "REL" in opcode_table:
            self.pc += 2
        elif operand.startswith('(') and operand.upper().endswith(',X)'):
            self.pc += 2
        elif operand.startswith('(') and operand.upper().endswith('),Y'):
            self.pc += 2
        elif operand.startswith('(') and operand.endswith(')'):
            self.pc += 3
        elif operand.upper().endswith(',X'):
            base = operand[:-2].strip()
            self.pc += 2 if (self.is_zp_operand(base, self.labels) and "ZPX" in opcode_table) else 3
        elif operand.upper().endswith(',Y'):
            base = operand[:-2].strip()
            self.pc += 2 if (self.is_zp_operand(base, self.labels) and "ZPY" in opcode_table) else 3
        else:
            self.pc += 2 if (self.is_zp_operand(operand, self.labels) and "ZP" in opcode_table) else 3

    def _emit_bytes(self, line):
        tokens = line.split(None, 1)
        mnemonic = tokens[0].upper()
        operand = tokens[1].strip() if len(tokens) > 1 else ""

        if mnemonic == ".BYTE":
            parts = [p.strip() for p in operand.split(',')]
            b_out = bytearray()
            for p in parts:
                b_out.append(self.parse_value(p, self.labels) & 0xFF)
            self.pc += len(b_out)
            return b_out
        elif mnemonic == ".WORD":
            parts = [p.strip() for p in operand.split(',')]
            b_out = bytearray()
            for p in parts:
                v = self.parse_value(p, self.labels) & 0xFFFF
                b_out.append(v & 0xFF)
                b_out.append((v >> 8) & 0xFF)
            self.pc += len(b_out)
            return b_out
        elif mnemonic == ".TEXT":
            m = re.search(r'"([^"]*)"', operand)
            txt = m.group(1) if m else operand
            b_out = bytearray(txt.encode('latin1'))
            self.pc += len(b_out)
            return b_out

        opcode_table = OPCODES[mnemonic]

        # 1. Implied / Accumulator
        if not operand or operand.upper() == "A":
            self.pc += 1
            opc = opcode_table.get("IMP", opcode_table.get("ACC"))
            return bytes([opc])

        # 2. Immediate
        if operand.startswith('#'):
            val = self.parse_value(operand[1:], self.labels) & 0xFF
            self.pc += 2
            return bytes([opcode_table["IMM"], val])

        # 3. Relative (Branches)
        if "REL" in opcode_table:
            dest = self.parse_value(operand, self.labels)
            offset = dest - (self.pc + 2)
            if offset < -128 or offset > 127:
                raise ValueError(f"Branch out of range ({offset}) from 0x{self.pc:04X} to 0x{dest:04X}")
            self.pc += 2
            return bytes([opcode_table["REL"], offset & 0xFF])

        # 4. Indexed Indirect ($zp,X)
        if operand.startswith('(') and operand.upper().endswith(',X)'):
            val = self.parse_value(operand[1:-3], self.labels) & 0xFF
            self.pc += 2
            return bytes([opcode_table["INDX"], val])

        # 5. Indirect Indexed ($zp),Y
        if operand.startswith('(') and operand.upper().endswith('),Y'):
            val = self.parse_value(operand[1:-3], self.labels) & 0xFF
            self.pc += 2
            return bytes([opcode_table["INDY"], val])

        # 6. Indirect ($abs) (JMP ($xxxx))
        if operand.startswith('(') and operand.endswith(')'):
            val = self.parse_value(operand[1:-1], self.labels) & 0xFFFF
            self.pc += 3
            return bytes([opcode_table["IND"], val & 0xFF, (val >> 8) & 0xFF])

        # 7. Absolute,X or ZeroPage,X
        if operand.upper().endswith(',X'):
            base = operand[:-2].strip()
            val = self.parse_value(base, self.labels)
            if self.is_zp_operand(base, self.labels) and "ZPX" in opcode_table:
                self.pc += 2
                return bytes([opcode_table["ZPX"], val & 0xFF])
            elif "ABSX" in opcode_table:
                self.pc += 3
                return bytes([opcode_table["ABSX"], val & 0xFF, (val >> 8) & 0xFF])

        # 8. Absolute,Y or ZeroPage,Y
        if operand.upper().endswith(',Y'):
            base = operand[:-2].strip()
            val = self.parse_value(base, self.labels)
            if self.is_zp_operand(base, self.labels) and "ZPY" in opcode_table:
                self.pc += 2
                return bytes([opcode_table["ZPY"], val & 0xFF])
            elif "ABSY" in opcode_table:
                self.pc += 3
                return bytes([opcode_table["ABSY"], val & 0xFF, (val >> 8) & 0xFF])

        # 9. ZeroPage or Absolute
        val = self.parse_value(operand, self.labels)
        if self.is_zp_operand(operand, self.labels) and "ZP" in opcode_table:
            self.pc += 2
            return bytes([opcode_table["ZP"], val & 0xFF])
        elif "ABS" in opcode_table:
            self.pc += 3
            return bytes([opcode_table["ABS"], val & 0xFF, (val >> 8) & 0xFF])

        raise ValueError(f"Cannot assemble: {mnemonic} {operand} at PC=0x{self.pc:04X}")


def create_psid_file(machine_code, load_addr=0x1000, init_addr=0x1000, play_addr=0x1003,
                     title="Rob Hubbard AI Track", author="Rob Hubbard Composer", released="2026 AI"):
    header = bytearray(124)
    header[0:4] = b'PSID'
    header[4:6] = struct.pack('>H', 0x0002)
    header[6:8] = struct.pack('>H', 0x007C)
    header[8:10] = struct.pack('>H', load_addr)
    header[10:12] = struct.pack('>H', init_addr)
    header[12:14] = struct.pack('>H', play_addr)
    header[14:16] = struct.pack('>H', 1)
    header[16:18] = struct.pack('>H', 1)
    header[18:22] = struct.pack('>I', 0)
    title_bytes = title.encode('latin1', errors='ignore')[:31]
    header[22:22+len(title_bytes)] = title_bytes
    author_bytes = author.encode('latin1', errors='ignore')[:31]
    header[54:54+len(author_bytes)] = author_bytes
    rel_bytes = released.encode('latin1', errors='ignore')[:31]
    header[86:86+len(rel_bytes)] = rel_bytes
    header[118:120] = struct.pack('>H', 0x0014)

    return bytes(header) + bytes(machine_code)
