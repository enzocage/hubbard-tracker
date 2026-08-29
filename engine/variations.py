"""
Rob Hubbard Melodic & Harmonic Variation Algorithms
Recombines, transposes, and gently varies authentic Rob Hubbard motifs.
Zero random generation: strictly grounded in the 19 original SID works.
"""

from engine.corpus import ORIGINAL_MELODIC_MOTIFS, ORIGINAL_HARMONIC_CYCLES

def transpose_motif(motif, semitone_offset):
    """Transposes an authentic motif by a given number of semitones."""
    return [(pitch + semitone_offset, dur) for pitch, dur in motif]

def recombine_motifs(motif_a_name, motif_b_name, split_ratio=0.5):
    """
    Recombines the Antecedent (Vordersatz) of Motif A with the Consequent (Nachsatz) of Motif B.
    """
    motif_a = ORIGINAL_MELODIC_MOTIFS[motif_a_name]
    motif_b = ORIGINAL_MELODIC_MOTIFS[motif_b_name]

    split_a = max(1, int(len(motif_a) * split_ratio))
    split_b = max(1, int(len(motif_b) * (1.0 - split_ratio)))

    head = motif_a[:split_a]
    tail = motif_b[-split_b:]

    return head + tail

def apply_rhythmic_diminution(motif, factor=0.5):
    """
    Speeds up a motif for virtuoso solo runs (e.g., halving durations for 16th/32nd notes).
    """
    out = []
    for pitch, dur in motif:
        new_dur = max(1, int(dur * factor))
        out.append((pitch, new_dur))
    return out

def apply_rhythmic_augmentation(motif, factor=2.0):
    """
    Slows down a motif for spacious intros or epic ballad themes.
    """
    out = []
    for pitch, dur in motif:
        new_dur = max(1, int(dur * factor))
        out.append((pitch, new_dur))
    return out

def apply_melodic_inversion(motif):
    """
    Inverts the melodic intervals of an authentic motif around its starting pitch.
    """
    if not motif:
        return []
    root = motif[0][0]
    return [(root - (pitch - root), dur) for pitch, dur in motif]

def get_archetype_motif_palette(archetype):
    """
    Returns the authentic motif repertoire for each Rob Hubbard archetype.
    """
    if archetype == "SpeedAction":
        return {
            "intro": "Commando_BridgeFanfare",
            "theme_a": "Commando_MainTheme",
            "theme_b": "Monty_ThemeA",
            "solo_heads": ["Monty_ViolinSolo", "Monty_ThemeB", "CrazyComets_FunkHook"]
        }
    elif archetype == "SpaceProg":
        return {
            "intro": "Delta_SpaceTheme",
            "theme_a": "Lightforce_MainHook",
            "theme_b": "Delta_Bridge",
            "solo_heads": ["Lightforce_ArpLead", "Sanxion_BaroqueRun", "Sanxion_HeroicLead"]
        }
    elif archetype == "BaroqueBallad":
        return {
            "intro": "Spellbound_Theme",
            "theme_a": "MasterOfMagic_Ballad",
            "theme_b": "Spellbound_Theme",
            "solo_heads": ["Sanxion_BaroqueRun", "MasterOfMagic_Ballad"]
        }
    elif archetype == "JazzFunk":
        return {
            "intro": "CrazyComets_FunkHook",
            "theme_a": "IK_KumoiFlute",
            "theme_b": "IK_ThemeB",
            "solo_heads": ["ThingOnASpring_Lead", "IK_KumoiFlute", "CrazyComets_FunkHook"]
        }
    elif archetype == "CyberMetal":
        return {
            "intro": "Zoids_CyberTheme",
            "theme_a": "LastV8_TurboRiff",
            "theme_b": "Zoids_CyberTheme",
            "solo_heads": ["LastV8_TurboRiff", "Monty_ViolinSolo", "Sanxion_BaroqueRun"]
        }
    else:
        return get_archetype_motif_palette("SpeedAction")
