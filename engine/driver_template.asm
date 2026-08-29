; ==============================================================================
; ROB HUBBARD 6502 SID MUSIC DRIVER
; Standard C64 Player Architecture with Voice-3 Multiplexer, Pitch Scoop,
; Delayed Vibrato, 50Hz Arpeggios and Dynamic Filter Automation.
; ==============================================================================

; Zero-Page Pointers for Indirect Indexed Addressing (LDA ($zp),Y)
v1_ptr      = $FB    ; $FB-$FC
v2_ptr      = $FD    ; $FD-$FE
v3_ptr      = $02    ; $02-$03
v2_arp_ptr  = $04    ; $04-$05

.org $1000

; Entry Points
init_sound:
    JMP driver_init
play_frame:
    JMP driver_play

; ------------------------------------------------------------------------------
; DRIVER VARIABLES ($1006 - $10FF)
; ------------------------------------------------------------------------------
v1_timer:       .byte $01
v1_base_note:   .byte $30
v1_target_freq_l: .byte $00
v1_target_freq_h: .byte $00
v1_curr_freq_l: .byte $00
v1_curr_freq_h: .byte $00
v1_scoop_timer: .byte $00
v1_vib_delay:   .byte $06
v1_vib_phase:   .byte $00
v1_inst_wave:   .byte $21
v1_inst_ad:     .byte $08
v1_inst_sr:     .byte $A4

v2_timer:       .byte $01
v2_base_note:   .byte $24
v2_arp_len:     .byte $04
v2_arp_idx:     .byte $00
v2_inst_wave:   .byte $41
v2_inst_ad:     .byte $09
v2_inst_sr:     .byte $00

v3_timer:       .byte $01
v3_bass_note:   .byte $18
v3_drum_timer:  .byte $00
v3_bass_freq_l: .byte $00
v3_bass_freq_h: .byte $00
v3_bass_wave:   .byte $41
v3_bass_ad:     .byte $00
v3_bass_sr:     .byte $C0
v3_gate_timer:  .byte $00

pwm_val_l:      .byte $00
pwm_val_h:      .byte $04
pwm_dir:        .byte $01

filter_cutoff_l: .byte $00
filter_cutoff_h: .byte $04
filter_ctrl:    .byte $03        ; Voice 1 & 2 filtered, Voice 3 unfiltered
filter_mode:    .byte $2F        ; Bandpass + Max Volume $0F

global_tick:    .byte $00

; ------------------------------------------------------------------------------
; DRIVER INIT ($1000)
; ------------------------------------------------------------------------------
driver_init:
    SEI
    ; Clear SID Registers $D400 - $D418
    LDX #$18
    LDA #$00
clr_sid_loop:
    STA $D400,X
    DEX
    BPL clr_sid_loop

    ; Set Master Volume & Filter
    LDA filter_mode
    STA $D418
    LDA filter_ctrl
    STA $D417

    ; Reset Zero-Page Pointers
    LDA #<track_v1
    STA v1_ptr
    LDA #>track_v1
    STA v1_ptr+1
    LDA #$01
    STA v1_timer

    LDA #<track_v2
    STA v2_ptr
    LDA #>track_v2
    STA v2_ptr+1
    LDA #$01
    STA v2_timer

    LDA #<arp_table_0
    STA v2_arp_ptr
    LDA #>arp_table_0
    STA v2_arp_ptr+1
    LDA #$04
    STA v2_arp_len

    LDA #<track_v3
    STA v3_ptr
    LDA #>track_v3
    STA v3_ptr+1
    LDA #$01
    STA v3_timer
    LDA #$00
    STA v3_drum_timer

    CLI
    RTS

; ------------------------------------------------------------------------------
; DRIVER PLAY FRAME ($1003) - CALLED AT 50Hz
; ------------------------------------------------------------------------------
driver_play:
    INC global_tick

    ; 1. FILTER & PWM AUTOMATION
    JSR update_pwm
    JSR update_filter

    ; 2. VOICE 1: LEAD & SOLO PHRASING
    JSR process_voice1

    ; 3. VOICE 2: ARPEGGIO & CHORD HARMONY
    JSR process_voice2

    ; 4. VOICE 3: BASS & DRUM MULTIPLEXER
    JSR process_voice3

    RTS

; ------------------------------------------------------------------------------
; PWM SWEEPER ENGINE
; ------------------------------------------------------------------------------
update_pwm:
    LDA pwm_dir
    BEQ pwm_down
pwm_up:
    LDA pwm_val_l
    CLC
    ADC #$08
    STA pwm_val_l
    LDA pwm_val_h
    ADC #$00
    STA pwm_val_h
    CMP #$0E
    BCC apply_pwm
    LDA #$00
    STA pwm_dir
    JMP apply_pwm
pwm_down:
    LDA pwm_val_l
    SEC
    SBC #$08
    STA pwm_val_l
    LDA pwm_val_h
    SBC #$00
    STA pwm_val_h
    CMP #$02
    BCS apply_pwm
    LDA #$01
    STA pwm_dir
apply_pwm:
    LDA pwm_val_l
    STA $D402
    STA $D409
    LDA pwm_val_h
    STA $D403
    STA $D40A
    RTS

; ------------------------------------------------------------------------------
; DYNAMIC FILTER AUTOMATION
; ------------------------------------------------------------------------------
update_filter:
    LDA filter_cutoff_h
    STA $D416
    LDA filter_cutoff_l
    STA $D415
    RTS

; ------------------------------------------------------------------------------
; VOICE 1 ENGINE (LEAD / PITCH SCOOP / DELAYED VIBRATO)
; ------------------------------------------------------------------------------
process_voice1:
    DEC v1_timer
    BNE v1_frame_effects_jmp

    ; Fetch Next Byte from Track 1
v1_fetch:
    LDY #$00
    LDA (v1_ptr),Y
    CMP #$FF
    BNE v1_check_cmd
    ; Loop track
    LDA #<track_v1
    STA v1_ptr
    LDA #>track_v1
    STA v1_ptr+1
    JMP v1_fetch

v1_frame_effects_jmp:
    JMP v1_frame_effects

v1_check_cmd:
    ; Check command / Note
    STA v1_base_note
    ; Inc pointer
    INC v1_ptr
    BNE v1_fetch_dur
    INC v1_ptr+1
v1_fetch_dur:
    LDY #$00
    LDA (v1_ptr),Y
    STA v1_timer
    INC v1_ptr
    BNE v1_trigger_note
    INC v1_ptr+1

v1_trigger_note:
    ; Lookup Frequency for Target Pitch
    LDX v1_base_note
    LDA freq_table_l,X
    STA v1_target_freq_l
    LDA freq_table_h,X
    STA v1_target_freq_h

    ; Gate-Clear to avoid ADSR freeze bug
    LDA #$00
    STA $D404

    ; Pitch Scoop Setup (Start 2 semitones lower)
    CPX #$02
    BCC v1_no_scoop
    DEX
    DEX
    LDA freq_table_l,X
    STA v1_curr_freq_l
    LDA freq_table_h,X
    STA v1_curr_freq_h
    LDA #$03
    STA v1_scoop_timer
    JMP v1_apply_trigger
v1_no_scoop:
    LDA v1_target_freq_l
    STA v1_curr_freq_l
    LDA v1_target_freq_h
    STA v1_curr_freq_h
    LDA #$00
    STA v1_scoop_timer

v1_apply_trigger:
    LDA v1_curr_freq_l
    STA $D400
    LDA v1_curr_freq_h
    STA $D401

    ; Set ADSR & Waveform
    LDA v1_inst_ad
    STA $D405
    LDA v1_inst_sr
    STA $D406
    LDA v1_inst_wave
    STA $D404

    ; Reset Vibrato Delay
    LDA #$06
    STA v1_vib_delay
    LDA #$00
    STA v1_vib_phase
    RTS

v1_frame_effects:
    ; Handle Pitch Scoop
    LDA v1_scoop_timer
    BEQ v1_handle_vibrato
    DEC v1_scoop_timer
    BEQ v1_reach_target
    ; Linear Slide toward target
    LDA v1_curr_freq_l
    CLC
    ADC #$30
    STA v1_curr_freq_l
    LDA v1_curr_freq_h
    ADC #$00
    STA v1_curr_freq_h
    STA $D401
    LDA v1_curr_freq_l
    STA $D400
    RTS
v1_reach_target:
    LDA v1_target_freq_l
    STA v1_curr_freq_l
    STA $D400
    LDA v1_target_freq_h
    STA v1_curr_freq_h
    STA $D401
    RTS

v1_handle_vibrato:
    LDA v1_vib_delay
    BEQ v1_do_vibrato
    DEC v1_vib_delay
    RTS
v1_do_vibrato:
    INC v1_vib_phase
    LDA v1_vib_phase
    AND #$07
    TAX
    LDA vib_offsets,X
    CLC
    ADC v1_target_freq_l
    STA $D400
    LDA v1_target_freq_h
    ADC #$00
    STA $D401
    RTS

; ------------------------------------------------------------------------------
; VOICE 2 ENGINE (FAST 50Hz ARPEGGIO & CHORDS)
; ------------------------------------------------------------------------------
process_voice2:
    DEC v2_timer
    BNE v2_frame_arp_jmp

v2_fetch:
    LDY #$00
    LDA (v2_ptr),Y
    CMP #$FF
    BNE v2_read_note
    ; Loop
    LDA #<track_v2
    STA v2_ptr
    LDA #>track_v2
    STA v2_ptr+1
    JMP v2_fetch

v2_frame_arp_jmp:
    JMP v2_frame_arp

v2_read_note:
    STA v2_base_note
    INC v2_ptr
    BNE v2_fetch_dur
    INC v2_ptr+1
v2_fetch_dur:
    LDY #$00
    LDA (v2_ptr),Y
    STA v2_timer
    INC v2_ptr
    BNE v2_trigger_arp
    INC v2_ptr+1

v2_trigger_arp:
    LDA #$00
    STA $D40B        ; Gate clear
    LDA v2_inst_ad
    STA $D40C
    LDA v2_inst_sr
    STA $D40D
    LDA v2_inst_wave
    STA $D40B        ; Gate on
    LDA #$00
    STA v2_arp_idx

v2_frame_arp:
    ; Read offset from active Arp Table
    LDY v2_arp_idx
    LDA (v2_arp_ptr),Y
    CLC
    ADC v2_base_note
    TAX
    LDA freq_table_l,X
    STA $D407
    LDA freq_table_h,X
    STA $D408

    ; Next Arp Step
    INC v2_arp_idx
    LDA v2_arp_idx
    CMP v2_arp_len
    BCC v2_arp_done
    LDA #$00
    STA v2_arp_idx
v2_arp_done:
    RTS

; ------------------------------------------------------------------------------
; VOICE 3 ENGINE (BASSLINE + DRUM MULTIPLEXER)
; ------------------------------------------------------------------------------
process_voice3:
    ; Check if Drum is actively playing
    LDA v3_drum_timer
    BEQ v3_check_bass
    DEC v3_drum_timer
    BNE v3_drum_frame_effect

    ; Drum Finished -> Glitchless Restore Bass
    LDA v3_bass_freq_l
    STA $D40E
    LDA v3_bass_freq_h
    STA $D40F
    LDA v3_bass_ad
    STA $D412
    LDA v3_bass_sr
    STA $D413
    LDA v3_bass_wave
    STA $D414
    RTS

v3_drum_frame_effect:
    ; Pitch drop for Kick Drum
    LDA #$00
    STA $D40E
    RTS

v3_check_bass:
    DEC v3_timer
    BNE v3_gate_handler_jmp

v3_fetch:
    LDY #$00
    LDA (v3_ptr),Y
    CMP #$FF
    BNE v3_check_event
    ; Loop
    LDA #<track_v3
    STA v3_ptr
    LDA #>track_v3
    STA v3_ptr+1
    JMP v3_fetch

v3_gate_handler_jmp:
    JMP v3_gate_handler

v3_check_event:
    ; Event Type:
    ; $80-$83: Drum Hit (80=Kick, 81=Snare, 82=HiHat)
    ; $00-$7F: Bass Note
    CMP #$80
    BCS v3_handle_drum
    JMP v3_play_bass_note

v3_handle_drum:
    ; Trigger Drum Event
    INC v3_ptr
    BNE v3_parse_drum
    INC v3_ptr+1
v3_parse_drum:
    CMP #$80
    BEQ v3_trigger_kick
    CMP #$81
    BEQ v3_trigger_snare
    JMP v3_trigger_hihat

v3_trigger_snare:
    LDA #$02
    STA v3_drum_timer
    LDA #$00
    STA $D414        ; Gate clear
    LDA #$00
    STA $D40E
    LDA #$84
    STA $D40F        ; Freq $8400
    LDA #$08
    STA $D412        ; AD
    LDA #$00
    STA $D413        ; SR
    LDA #$81         ; Noise + Gate
    STA $D414
    LDA #$01
    STA v3_timer
    RTS

v3_trigger_kick:
    LDA #$02
    STA v3_drum_timer
    LDA #$00
    STA $D414
    LDA #$00
    STA $D40E
    LDA #$12
    STA $D40F        ; Freq $1200
    LDA #$09
    STA $D412
    LDA #$00
    STA $D413
    LDA #$11         ; Triangle + Gate
    STA $D414
    LDA #$01
    STA v3_timer
    RTS

v3_trigger_hihat:
    LDA #$01
    STA v3_drum_timer
    LDA #$00
    STA $D414
    LDA #$00
    STA $D40E
    LDA #$E0
    STA $D40F        ; Freq $E000
    LDA #$04
    STA $D412
    LDA #$00
    STA $D413
    LDA #$81         ; Noise + Gate
    STA $D414
    LDA #$01
    STA v3_timer
    RTS

v3_play_bass_note:
    STA v3_bass_note
    INC v3_ptr
    BNE v3_fetch_bass_dur
    INC v3_ptr+1
v3_fetch_bass_dur:
    LDY #$00
    LDA (v3_ptr),Y
    STA v3_timer
    INC v3_ptr
    BNE v3_trigger_bass
    INC v3_ptr+1

v3_trigger_bass:
    LDX v3_bass_note
    LDA freq_table_l,X
    STA v3_bass_freq_l
    STA $D40E
    LDA freq_table_h,X
    STA v3_bass_freq_h
    STA $D40F

    LDA #$00
    STA $D414        ; Gate clear
    LDA v3_bass_ad
    STA $D412
    LDA v3_bass_sr
    STA $D413
    LDA v3_bass_wave
    STA $D414

    LDA #$02
    STA v3_gate_timer
    RTS

v3_gate_handler:
    LDA v3_gate_timer
    BEQ v3_gate_done
    DEC v3_gate_timer
    BNE v3_gate_done
    ; Slap Bass Gate-Clear
    LDA v3_bass_wave
    AND #$FE         ; Gate off
    STA $D414
v3_gate_done:
    RTS

; ------------------------------------------------------------------------------
; LOOKUP TABLES
; ------------------------------------------------------------------------------
vib_offsets:
    .byte $00, $08, $10, $08, $00, $F8, $F0, $F8

; PAL 16-Bit Frequency Table (96 Notes: C0 to B7)
freq_table_l:
    .byte $16, $27, $39, $4B, $5F, $74, $8A, $A1, $BA, $D4, $F0, $0E
    .byte $2D, $4E, $71, $96, $BE, $E8, $14, $43, $74, $A9, $E1, $1C
    .byte $5B, $9D, $E3, $2D, $7C, $CF, $28, $86, $E9, $53, $C3, $39
    .byte $B6, $3B, $C7, $5A, $F8, $9F, $51, $0D, $D3, $A6, $86, $72
    .byte $6D, $76, $8E, $B5, $EF, $3E, $A2, $1A, $A7, $4D, $0C, $E5
    .byte $DA, $ED, $1D, $6B, $DE, $7C, $45, $34, $4E, $9A, $18, $CB
    .byte $B5, $DB, $3A, $D6, $BC, $F8, $8A, $68, $9C, $35, $31, $97
    .byte $6B, $B6, $75, $AD, $79, $F0, $15, $D0, $38, $6A, $62, $2E

freq_table_h:
    .byte $01, $01, $01, $01, $01, $01, $01, $01, $01, $01, $01, $02
    .byte $02, $02, $02, $02, $02, $02, $03, $03, $03, $03, $03, $04
    .byte $04, $04, $04, $05, $05, $05, $06, $06, $06, $07, $07, $08
    .byte $08, $09, $09, $0A, $0A, $0B, $0C, $0D, $0D, $0E, $0F, $10
    .byte $11, $12, $13, $14, $15, $17, $18, $1A, $1B, $1D, $1F, $21
    .byte $23, $25, $27, $29, $2B, $2E, $31, $34, $37, $3A, $3E, $42
    .byte $46, $4B, $4F, $53, $57, $5C, $62, $68, $6E, $75, $7C, $84
    .byte $8D, $96, $9E, $A7, $AF, $B9, $C5, $D1, $DD, $EA, $F9, $FF

; Standard Arpeggio Tables
arp_table_0:  ; m7 (4-step)
    .byte $00, $03, $07, $0A
arp_table_1:  ; m9 (5-step)
    .byte $00, $03, $07, $0A, $0E
arp_table_2:  ; m11 (6-step Lightforce)
    .byte $00, $03, $07, $0A, $0E, $11
arp_table_3:  ; sus4
    .byte $00, $05, $07, $0C
arp_table_4:  ; maj7
    .byte $00, $04, $07, $0B
arp_table_5:  ; power chord
    .byte $00, $07, $0C

; Track Data Placeholders (Injected by Composer Engine)
track_v1:
    .byte $30, $04, $32, $04, $33, $04, $35, $04, $FF

track_v2:
    .byte $24, $10, $29, $10, $2B, $10, $24, $10, $FF

track_v3:
    .byte $80, $81, $82, $18, $02, $18, $02, $81, $FF
