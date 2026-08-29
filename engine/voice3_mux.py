"""
Voice 3 Drum Multiplexer & Bassline Engine for Rob Hubbard SID Composer
Integrates authentic Bass Patterns and Drum Sequences from the 19 Reference SIDs.
"""

from engine.corpus import ORIGINAL_BASS_PATTERNS, ORIGINAL_DRUM_PATTERNS

class Voice3Engine:
    def __init__(self):
        self.drum_timer = 0
        self.current_bass_note = 36  # C2
        self.current_bass_inst = 2   # Slap Bass

    def generate_measure(self, root_pitch, pattern_type="IK_SlapFunk", has_drums=True, drum_style="StandardKit"):
        """
        Generates 16 steps (one 4/4 measure) of authentic interleaved Bass + Drums.
        """
        steps = []
        
        # Select authentic bass pattern
        if pattern_type in ORIGINAL_BASS_PATTERNS:
            bass_mask = ORIGINAL_BASS_PATTERNS[pattern_type]
        else:
            bass_mask = ORIGINAL_BASS_PATTERNS["Commando_Gallop"]

        # Select authentic drum kit
        if drum_style in ORIGINAL_DRUM_PATTERNS:
            kit = ORIGINAL_DRUM_PATTERNS[drum_style]
        else:
            kit = ORIGINAL_DRUM_PATTERNS["StandardKit"]

        kicks = kit["kicks"]
        snares = kit["snares"]
        hats = kit["hats"]

        for s in range(16):
            drum_hit = None
            if has_drums:
                if s in snares:
                    drum_hit = "snare"
                elif s in kicks:
                    drum_hit = "kick"
                elif s in hats:
                    drum_hit = "hihat"

            is_bass_hit = bool(bass_mask[s])
            is_octave_pop = False
            
            # Slap Bass Octave Popping on Offbeat 16ths (Slots 3, 7, 11, 15)
            if is_bass_hit and "Slap" in pattern_type and s in [3, 7, 11, 15]:
                is_octave_pop = True

            # Walking bass note on last 16th step (Authentic Hubbard Chromatic Step)
            step_pitch = root_pitch
            if s == 15 and pattern_type == "Commando_Gallop":
                step_pitch = root_pitch + 1 # Leading tone

            steps.append({
                "step": s,
                "bass_hit": is_bass_hit,
                "pitch": step_pitch + (12 if is_octave_pop else 0),
                "is_pop": is_octave_pop,
                "drum_hit": drum_hit
            })

        return steps
