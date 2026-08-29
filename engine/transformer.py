"""
Parametric Frame-Stream Transformer & Re-Composer
Applies musically accurate transformations (Transposition, Tempo, Filter Sweep, Voice Splicing)
directly to captured 50Hz register streams from original Rob Hubbard SID files.
"""

import math
import copy

class StreamTransformer:
    @staticmethod
    def transpose(frame_stream, semitones=2, transpose_bass=True):
        """
        Transposes all musical frequencies in the frame stream by N semitones.
        Preserves noise/drum hits without pitch distortion.
        """
        factor = 2.0 ** (semitones / 12.0)
        new_stream = copy.deepcopy(frame_stream)

        for f in new_stream:
            deltas = f["deltas"]
            state = f["state"]

            # Voice 1 Freq ($D400-$D401)
            v1_wave = state[4]
            if not (v1_wave & 0x80): # If not noise
                if 0 in deltas or 1 in deltas:
                    f_old = state[0] | (state[1] << 8)
                    if f_old > 0:
                        f_new = min(0xFFFF, max(1, int(round(f_old * factor))))
                        deltas[0] = f_new & 0xFF
                        deltas[1] = (f_new >> 8) & 0xFF
                        state[0] = deltas[0]
                        state[1] = deltas[1]

            # Voice 2 Freq ($D407-$D408)
            v2_wave = state[11]
            if not (v2_wave & 0x80):
                if 7 in deltas or 8 in deltas:
                    f_old = state[7] | (state[8] << 8)
                    if f_old > 0:
                        f_new = min(0xFFFF, max(1, int(round(f_old * factor))))
                        deltas[7] = f_new & 0xFF
                        deltas[8] = (f_new >> 8) & 0xFF
                        state[7] = deltas[7]
                        state[8] = deltas[8]

            # Voice 3 Freq ($D40E-$D40F)
            if transpose_bass:
                v3_wave = state[18]
                if not (v3_wave & 0x80): # Don't transpose noise snares/hats
                    if 14 in deltas or 15 in deltas:
                        f_old = state[14] | (state[15] << 8)
                        if f_old > 0:
                            f_new = min(0xFFFF, max(1, int(round(f_old * factor))))
                            deltas[14] = f_new & 0xFF
                            deltas[15] = (f_new >> 8) & 0xFF
                            state[14] = deltas[14]
                            state[15] = deltas[15]

        return new_stream

    @staticmethod
    def modulate_filter(frame_stream, resonance=0x0F, filter_mode=0x2F):
        """
        Applies a dynamic LFO sweep to the SID Filter Cutoff ($D415-$D416)
        and enables Bandpass resonance.
        """
        new_stream = copy.deepcopy(frame_stream)
        num_frames = len(new_stream)

        for i, f in enumerate(new_stream):
            deltas = f["deltas"]
            # 6.25 Hz triangle sweep
            sweep = int(1024 + 800 * math.sin(2 * math.pi * i / 50.0))
            deltas[21] = sweep & 0x07          # Cutoff Low ($D415)
            deltas[22] = (sweep >> 3) & 0xFF   # Cutoff High ($D416)
            deltas[23] = (resonance << 4) | 0x03 # Voice 1 & 2 Filtered ($D417)
            deltas[24] = filter_mode            # Mode & Vol ($D418)

        return new_stream

    @staticmethod
    def splice_hybrid(stream_v1, stream_v2, stream_v3):
        """
        Combines Voice 1 from track A, Voice 2 from track B, and Voice 3 from track C!
        """
        min_len = min(len(stream_v1), len(stream_v2), len(stream_v3))
        current_state = [0] * 25
        hybrid_stream = []
        for i in range(min_len):
            deltas = {}
            # V1 from track A ($D400-$D406)
            for r in range(0, 7):
                if r in stream_v1[i]["deltas"]:
                    deltas[r] = stream_v1[i]["deltas"][r]
                    current_state[r] = deltas[r]
            # V2 from track B ($D407-$D40D)
            for r in range(7, 14):
                if r in stream_v2[i]["deltas"]:
                    deltas[r] = stream_v2[i]["deltas"][r]
                    current_state[r] = deltas[r]
            # V3 from track C ($D40E-$D414)
            for r in range(14, 21):
                if r in stream_v3[i]["deltas"]:
                    deltas[r] = stream_v3[i]["deltas"][r]
                    current_state[r] = deltas[r]
            # Filter from track A ($D415-$D418)
            for r in range(21, 25):
                if r in stream_v1[i]["deltas"]:
                    deltas[r] = stream_v1[i]["deltas"][r]
                    current_state[r] = deltas[r]

            hybrid_stream.append({
                "frame": i,
                "deltas": deltas,
                "state": list(current_state)
            })

        return hybrid_stream
