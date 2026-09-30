# Hainan toponymy synthetic demonstrations

These six audio clips illustrate approximate segments and schematic tone
contours for the word forms printed in Norquest (2007). They are **not Hlai
speaker recordings** and must not be treated as source evidence for any place
name. The regional labels on the article refer to the source transcriptions,
not to the provenance of the synthetic voice.

Generation uses eSpeak NG 1.52.0's Vietnamese phoneme inventory and Praat
overlap-add resynthesis through praat-parselmouth 0.4.7. The `ph` input is an
explicit p+h approximation, not a validated Hlai aspirated stop. Pitch levels
1–5 use 100, 120, 140, 160 and 180 Hz solely to demonstrate relative direction.
These are not measured Hlai pitch frequencies. Timbre, duration, phonation
and contextual pronunciation have not been validated against native speakers.

With eSpeak NG and Python packages `numpy`, `praat-parselmouth` installed,
run `python3 scripts/generate-hainan-audio.py` from the repository root.
The per-clip manifest records the target notation, synthesis parameters and
limitations. Browser playback checks verify media loading and completion;
they do not validate native pronunciation.

IPA font: unmodified Charis 7.000 Regular WOFF2 from
<https://software.sil.org/charis/download/>, licensed under the SIL Open Font
License 1.1. The license is distributed at
`static/assets/fonts/CHARIS-OFL.txt`.
