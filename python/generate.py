"""
CLI Generation Tool for Rob Hubbard SID Composer
Generates and validates all 5 Rob Hubbard Style Archetypes into playable .sid files.
"""

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from engine.composer import HubbardComposer, ARCHETYPE_CONFIGS
from engine.validator import validate_sid_file

def main():
    print("=" * 80)
    print("     ROB HUBBARD SID COMPOSER - AUTOMATED PRODUCTION PIPELINE")
    print("=" * 80)
    print("Generiere abspielbare .sid-Dateien basierend auf dem 50-Kriterien-System...\n")

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    archetypes = [
        ("SpeedAction", "Hubbard_Action_Anthem.sid"),
        ("SpaceProg", "Hubbard_Space_Odyssey.sid"),
        ("BaroqueBallad", "Hubbard_Mystic_Ballad.sid"),
        ("JazzFunk", "Hubbard_Dragon_Funk.sid"),
        ("CyberMetal", "Hubbard_Cyber_V8.sid")
    ]

    results = []

    for arch_name, filename in archetypes:
        out_path = os.path.join(output_dir, filename)
        composer = HubbardComposer(archetype=arch_name)
        
        print(f"[*] Komponiere: {composer.config['title']:<25} ({arch_name})")
        size = composer.build_sid(out_path)
        print(f"    -> Erstellt: {out_path} ({size} Bytes)")

        # Validate with 6502 Emulator Testbench
        print(f"    -> Starte 6502-Validierung (1500 Frames / 30 Sek. Playback @ 50Hz)...")
        val_res = validate_sid_file(out_path, test_frames=1500)

        if val_res["success"]:
            print(f"    [OK] VALIDIERUNG ERFOLGREICH:")
            print(f"         - CPU Zyklen/Frame: Avg = {val_res['avg_cycles_per_frame']}, Peak = {val_res['peak_cycles_per_frame']}")
            print(f"         - SID Writes: Voice1={val_res['sid_writes']['voice1_lead']}, Voice2={val_res['sid_writes']['voice2_arp']}, Voice3={val_res['sid_writes']['voice3_bass_drum']}, Filter={val_res['sid_writes']['filter_ctrl']}")
        else:
            print(f"    [FEHLER] Validierung fehlgeschlagen: {val_res.get('error')}")

        results.append((arch_name, filename, size, val_res))
        print("-" * 80)

    print("\n" + "=" * 80)
    print("     PRODUKTIONS-ZUSAMMENFASSUNG")
    print("=" * 80)
    all_ok = True
    for arch_name, filename, size, val in results:
        status = "PASSED [100% PLAYABLE]" if val["success"] else "FAILED"
        if not val["success"]:
            all_ok = False
        print(f"  {filename:<30} | Size: {size:5} B | Avg CPU: {val.get('avg_cycles_per_frame', 0):6} | {status}")
    print("=" * 80)

    if all_ok:
        print("\n[ERFOLG] Alle 5 .sid-Dateien wurden erfolgreich generiert und sind 100% abspielbar!")
    else:
        print("\n[WARNUNG] Mindestens eine Datei hat die Validierung nicht bestanden.")

if __name__ == "__main__":
    main()
