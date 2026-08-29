"""
Rob Hubbard SID Player & Pattern Inspector CLI Tool
Play full .sid files, solo/mute individual voices, or isolate sub-patterns and snippets.
"""

import sys
import os
import argparse
import winsound
import tempfile
from engine.synth import SIDSynthesizer
from engine.extractor import SIDExtractor

def list_tracks():
    """Lists all available .sid files in workspace, sid/, and output/."""
    print("=" * 80)
    print("   VERFÜGBARE ROB HUBBARD .SID DATEIEN IM PROJEKT")
    print("=" * 80)

    dirs = [".", "sid", "output"]
    found = []

    for d in dirs:
        if os.path.exists(d):
            for f in sorted(os.listdir(d)):
                if f.lower().endswith(".sid"):
                    full_path = os.path.normpath(os.path.join(d, f))
                    found.append(full_path)

    for idx, path in enumerate(found, 1):
        try:
            ext = SIDExtractor(path)
            title = ext.title or os.path.basename(path)
            author = ext.author or "Rob Hubbard"
            print(f"  [{idx:02d}] {path:<40} | '{title}' ({author})")
        except Exception:
            print(f"  [{idx:02d}] {path:<40}")

    print("=" * 80)
    return found

def play_or_render(sid_path, solo_voice=None, mute_voice=None, start_frame=0, end_frame=None, num_frames=600, save_wav=None, loop=False):
    """
    Renders and plays back or exports the requested SID track/snippet.
    """
    if not os.path.exists(sid_path):
        # Search in sid/ and output/
        alt_paths = [os.path.join("sid", sid_path), os.path.join("output", sid_path)]
        found = False
        for p in alt_paths:
            if os.path.exists(p):
                sid_path = p
                found = True
                break
        if not found:
            print(f"[FEHLER] Datei nicht gefunden: {sid_path}")
            return

    # Calculate voice mask
    v1_active = True
    v2_active = True
    v3_active = True

    if solo_voice == 1:
        v1_active, v2_active, v3_active = True, False, False
    elif solo_voice == 2:
        v1_active, v2_active, v3_active = False, True, False
    elif solo_voice == 3:
        v1_active, v2_active, v3_active = False, False, True

    if mute_voice == 1: v1_active = False
    elif mute_voice == 2: v2_active = False
    elif mute_voice == 3: v3_active = False

    voice_mask = (v1_active, v2_active, v3_active)

    # Print Information
    print("=" * 80)
    print("   ROB HUBBARD SID PLAYER")
    print("=" * 80)
    print(f"  Datei:        {sid_path}")
    print(f"  Spuren:       Stimme 1 (Lead): {'[AKTIV]' if v1_active else '[STUMM]'} | Stimme 2 (Arp): {'[AKTIV]' if v2_active else '[STUMM]'} | Stimme 3 (Bass/Drums): {'[AKTIV]' if v3_active else '[STUMM]'}")
    if start_frame > 0 or end_frame is not None:
        print(f"  Ausschnitt:   Frames {start_frame} bis {end_frame or num_frames} ({((end_frame or num_frames)-start_frame)/50.0:.2f} Sekunden)")
    else:
        print(f"  Länge:        {num_frames/50.0:.1f} Sekunden ({num_frames} Frames @ 50Hz)")

    synth = SIDSynthesizer()
    print("\n[*] Synthetisiere 6581/8580 Audio in 44.1 kHz 16-Bit PCM...")
    pcm_data, num_samples = synth.render_sid_file(
        sid_path=sid_path,
        num_frames=num_frames,
        voice_mask=voice_mask,
        start_frame=start_frame,
        end_frame=end_frame
    )
    print(f"[*] Audio fertiggestellt ({num_samples} Samples, {num_samples/44100.0:.2f}s).")

    if save_wav:
        synth.save_wav(pcm_data, save_wav)
        print(f"[OK] WAV-Datei exportiert nach: {save_wav}")

    # Temporary file for Windows Audio playback
    temp_wav = os.path.join(tempfile.gettempdir(), "hubbard_preview.wav")
    synth.save_wav(pcm_data, temp_wav)

    print("\n[PLAY] Starte Audiowiedergabe (Drücken Sie Strg+C zum Abbrechen)...")
    try:
        flags = winsound.SND_FILENAME
        if loop:
            flags |= winsound.SND_LOOP | winsound.SND_ASYNC
            winsound.PlaySound(temp_wav, flags)
            input("Wiedergabe läuft in Endlosschleife. Drücken Sie Enter zum Stoppen...")
            winsound.PlaySound(None, winsound.SND_PURGE)
        else:
            winsound.PlaySound(temp_wav, flags)
        print("[STOP] Wiedergabe beendet.")
    except KeyboardInterrupt:
        winsound.PlaySound(None, winsound.SND_PURGE)
        print("\n[STOP] Wiedergabe durch Benutzer unterbrochen.")
    finally:
        if os.path.exists(temp_wav):
            try: os.remove(temp_wav)
            except Exception: pass

def main():
    parser = argparse.ArgumentParser(description="Rob Hubbard SID Player & Snippet Inspector")
    subparsers = parser.add_subparsers(dest="command")

    # List command
    subparsers.add_parser("list", help="Alle verfügbaren .sid Dateien auflisten")

    # Play command
    play_p = subparsers.add_parser("play", help=".sid Datei oder Ausschnitt abspielen")
    play_p.add_argument("sid_file", help="Pfad oder Name der .sid Datei")
    play_p.add_argument("--solo", type=int, choices=[1, 2, 3], help="Isoliert Stimme 1, 2 oder 3 (Solo)")
    play_p.add_argument("--mute", type=int, choices=[1, 2, 3], help="Schaltet Stimme 1, 2 oder 3 stumm")
    play_p.add_argument("--start", type=int, default=0, help="Start-Frame (z.B. 0)")
    play_p.add_argument("--end", type=int, default=None, help="End-Frame (z.B. 250)")
    play_p.add_argument("--frames", type=int, default=600, help="Gesamtzahl der Frames (Standard 600 = 12s)")
    play_p.add_argument("--save", type=str, default=None, help="Als .wav Datei speichern")
    play_p.add_argument("--loop", action="store_true", help="Endlosschleife abspielen")

    args = parser.parse_args()

    if args.command == "list" or len(sys.argv) == 1:
        list_tracks()
    elif args.command == "play":
        play_or_render(
            sid_path=args.sid_file,
            solo_voice=args.solo,
            mute_voice=args.mute,
            start_frame=args.start,
            end_frame=args.end,
            num_frames=args.frames,
            save_wav=args.save,
            loop=args.loop
        )
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
