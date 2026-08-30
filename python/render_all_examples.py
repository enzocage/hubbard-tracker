"""
Renders all 12 Instrument Types and 15 Musical Stylistic Devices as MP3 audio examples.
"""
import os
import sys
import subprocess

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from engine.synth import SIDSynthesizer

OUT_DIR = os.path.join(PROJECT_ROOT, "web_player", "audio_examples")
os.makedirs(OUT_DIR, exist_ok=True)

# Also create audio_examples in project root for direct relative file access
ROOT_OUT_DIR = os.path.join(PROJECT_ROOT, "audio_examples")
os.makedirs(ROOT_OUT_DIR, exist_ok=True)

synth = SIDSynthesizer(sample_rate=44100)

EXAMPLES = [
    # --- 12 INSTRUMENT TYPES ---
    {
        "filename": "inst_01_heroic_pulse_lead",
        "sid": "sid/Commando.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 350,
        "desc": "Heroic Pulse Lead (PWM Solo Synth) mit Pitch-Scoop aus Commando (Voice 1)"
    },
    {
        "filename": "inst_02_slap_bass",
        "sid": "sid/IK_plus.sid",
        "voice_mask": (False, False, True),
        "start": 50, "end": 350,
        "desc": "Funky 16th Slap-Bass mit Oktav-Pops aus International Karate + (Voice 3)"
    },
    {
        "filename": "inst_03_arp_chord",
        "sid": "sid/Delta.sid",
        "voice_mask": (False, True, False),
        "start": 0, "end": 350,
        "desc": "50Hz Fast-Arpeggio Chord Generator aus Delta (Voice 2)"
    },
    {
        "filename": "inst_04_noise_snare",
        "sid": "sid/Commando.sid",
        "voice_mask": (False, False, True),
        "start": 0, "end": 250,
        "desc": "Multiplexed Noise Snare Drum aus Commando (Voice 3 Interrupt)"
    },
    {
        "filename": "inst_05_virtuoso_violin",
        "sid": "sid/Monty_on_the_Run.sid",
        "voice_mask": (True, False, False),
        "start": 50, "end": 350,
        "desc": "Virtuoso Violin / Saw Guitar 32tel-Läufe aus Monty on the Run (Voice 1)"
    },
    {
        "filename": "inst_06_pitch_drop_kick",
        "sid": "sid/Warhawk.sid",
        "voice_mask": (False, False, True),
        "start": 0, "end": 250,
        "desc": "Pitch-Drop Bass Kick Drum aus Warhawk (Voice 3)"
    },
    {
        "filename": "inst_07_triangle_sub_bass",
        "sid": "sid/Spellbound.sid",
        "voice_mask": (False, False, True),
        "start": 0, "end": 300,
        "desc": "Dark Triangle Sub-Bass aus Spellbound (Voice 3)"
    },
    {
        "filename": "inst_08_hardsync_laser",
        "sid": "sid/Last_V8.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 300,
        "desc": "Hard-Sync Metallic Laser / Overdrive Lead aus The Last V8 (Voice 1)"
    },
    {
        "filename": "inst_09_ringmod_bell",
        "sid": "sid/IK_plus.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 250,
        "desc": "Ring-Modulation Cyber Bell / Oriental Gong aus IK+ (Voice 1)"
    },
    {
        "filename": "inst_10_woodwind_flute",
        "sid": "sid/Spellbound.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 300,
        "desc": "Pastoral Woodwind Flute mit Vibrato aus Spellbound (Voice 1)"
    },
    {
        "filename": "inst_11_pipe_organ",
        "sid": "sid/Nemesis_the_Warlock.sid",
        "voice_mask": (True, True, True),
        "start": 0, "end": 350,
        "desc": "Sacred Pipe Organ Double-Stop aus Nemesis the Warlock"
    },
    {
        "filename": "inst_12_ambient_filter_pad",
        "sid": "sid/Delta.sid",
        "voice_mask": (True, False, False),
        "start": 200, "end": 550,
        "desc": "Ambient Space Filter-Pad mit Bandpass-Sweep aus Delta (Voice 1)"
    },

    # --- 15 MUSICAL STYLISTIC DEVICES ---
    {
        "filename": "style_01_50hz_micro_arpeggio",
        "sid": "sid/Delta.sid",
        "voice_mask": (False, True, False),
        "start": 50, "end": 350,
        "desc": "50Hz Mikro-Arpeggios (Polyphone Akkord-Illusion) aus Delta"
    },
    {
        "filename": "style_02_drum_multiplexing",
        "sid": "sid/Commando.sid",
        "voice_mask": (False, False, True),
        "start": 50, "end": 350,
        "desc": "Voice-3 Time-Division Multiplexing (Bass/Drum Interleaving) aus Commando"
    },
    {
        "filename": "style_03_pwm_lfo_modulation",
        "sid": "sid/Lightforce.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 350,
        "desc": "Kontinuierliche PWM-LFO Modulation (Breiter Chorus/Phasing) aus Lightforce"
    },
    {
        "filename": "style_04_heroic_pitch_scoop",
        "sid": "sid/Flash_Gordon.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 300,
        "desc": "Heroic Pitch-Scooping (Noten-Einschwing-Glissando um -2 HT) aus Flash Gordon"
    },
    {
        "filename": "style_05_delayed_vibrato",
        "sid": "sid/Monty_on_the_Run.sid",
        "voice_mask": (True, False, False),
        "start": 0, "end": 300,
        "desc": "Delayed Vibrato & Expressive Pitch-LFO nach Haltezeit aus Monty on the Run"
    },
    {
        "filename": "style_06_slap_bass_octave_pop",
        "sid": "sid/IK_plus.sid",
        "voice_mask": (False, False, True),
        "start": 0, "end": 300,
        "desc": "Slap-Bass Oktav-Popping & Ghost-Notes (+12 HT) aus International Karate +"
    },
    {
        "filename": "style_07_32nd_scale_runs",
        "sid": "sid/Monty_on_the_Run.sid",
        "voice_mask": (True, True, True),
        "start": 50, "end": 350,
        "desc": "Rasende 32tel Virtuosen-Läufe & Skalenketten ('Devil's Gallop') aus Monty on the Run"
    },
    {
        "filename": "style_08_filter_sweeps",
        "sid": "sid/Sanxion.sid",
        "voice_mask": (True, True, True),
        "start": 0, "end": 350,
        "desc": "Analoge 11-Bit Resonanz-Filter-Sweeps (Bandpass Cutoff Sweep) aus Sanxion"
    },
    {
        "filename": "style_09_dorian_6th_harmony",
        "sid": "sid/Lightforce.sid",
        "voice_mask": (True, True, True),
        "start": 50, "end": 400,
        "desc": "Modale Harmonik & Dorische Sexte (Dorian 6th mit Moll-9/11) aus Lightforce"
    },
    {
        "filename": "style_10_circle_of_fifths",
        "sid": "sid/Spellbound.sid",
        "voice_mask": (True, True, True),
        "start": 0, "end": 400,
        "desc": "Barocke Quintfallsequenzen & 4-3 Vorhalte aus Spellbound"
    },
    {
        "filename": "style_11_call_and_response",
        "sid": "sid/Flash_Gordon.sid",
        "voice_mask": (True, True, True),
        "start": 50, "end": 350,
        "desc": "Kontrapunktische Call-and-Response Dialoge (V1 <-> V2) aus Flash Gordon"
    },
    {
        "filename": "style_12_hardsync_ringmod_fx",
        "sid": "sid/Last_V8.sid",
        "voice_mask": (True, True, True),
        "start": 0, "end": 300,
        "desc": "Hard-Sync & Ring-Modulation Formantverzerrung aus The Last V8"
    },
    {
        "filename": "style_13_polyrhythms_5_4",
        "sid": "sid/Delta.sid",
        "voice_mask": (True, True, True),
        "start": 0, "end": 400,
        "desc": "Asymmetrische Polyrhythmik (5/4-Takt & Phasenverschiebung) aus Delta"
    },
    {
        "filename": "style_14_software_echo_delay",
        "sid": "sid/Master_of_Magic.sid",
        "voice_mask": (True, True, True),
        "start": 50, "end": 350,
        "desc": "Ghost-Arpeggios & Software-Echo (Tape Delay Simulation) aus Master of Magic"
    },
    {
        "filename": "style_15_tierce_de_picardie",
        "sid": "sid/Spellbound.sid",
        "voice_mask": (True, True, True),
        "start": 300, "end": 600,
        "desc": "Tierce de Picardie (Triumphale Dur-Schlüsse in Moll-Werken) aus Spellbound"
    }
]

print(f"Rendering {len(EXAMPLES)} audio examples...")
for i, ex in enumerate(EXAMPLES, 1):
    wav_path = os.path.join(OUT_DIR, f"{ex['filename']}.wav")
    mp3_path = os.path.join(OUT_DIR, f"{ex['filename']}.mp3")
    root_mp3_path = os.path.join(ROOT_OUT_DIR, f"{ex['filename']}.mp3")
    print(f"[{i}/{len(EXAMPLES)}] Rendering {ex['filename']} from {ex['sid']} (frames {ex['start']}-{ex['end']})...")

    # 1. Render PCM
    pcm_16, total_samples = synth.render_sid_file(
        sid_path=ex["sid"],
        voice_mask=ex["voice_mask"],
        start_frame=ex["start"],
        end_frame=ex["end"]
    )

    # 2. Write WAV
    synth.save_wav(pcm_16, wav_path)

    # 3. Convert to MP3 via ffmpeg
    subprocess.run([
        'ffmpeg', '-y', '-i', wav_path,
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        mp3_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Copy to root audio_examples as well
    if os.path.exists(mp3_path):
        import shutil
        shutil.copy2(mp3_path, root_mp3_path)

    # Clean up WAV
    if os.path.exists(wav_path):
        os.remove(wav_path)

print("All 27 audio examples rendered successfully to web_player/audio_examples/ and audio_examples/!")
