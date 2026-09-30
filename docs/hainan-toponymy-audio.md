# Hainan toponymy synthetic demonstrations

The current playback controls reuse seventeen clips from **Google Cloud
Gemini 2.5 Pro TTS, Leda**: twelve Hlai word demonstrations and five Mandarin
readings. Hlai uses supported-language speech with schematic pitch contours;
Mandarin retains original connected speech without exaggerated acting. This is a stock synthetic voice, not Klee's official voice or a replica
of the original performer.
The contour filenames end in `-gemini.wav`; Mandarin uses
`*-mandarin-natural.wav`. New URLs bypass cached superseded clips.
Older files remain for existing links.

Twelve clips illustrate approximate segments and schematic tone contours for
word forms transcribed in Norquest (2007). They are **not Hlai speaker
recordings**, and are not evidence for a place-name etymology. Regional labels
refer to the printed transcriptions, not the provenance of the synthetic voice.
Gemini is not assumed to pronounce arbitrary Hlai IPA correctly.

The neural source clips instead use words in supported languages:

| Base | Input | Locale | Use |
| --- | --- | --- | --- |
| field | 搭。搭。搭。 | cmn-CN | approximate unaspirated /ta/ |
| big-u | lung linh. lung linh. lung linh. | vi-VN | cut the first syllable, approximate /luŋ/ |
| big-o | lông chim. lông chim. lông chim. | vi-VN | cut the first syllable, approximate /loŋ/ |
| sand | 抛。抛。抛。 | cmn-CN | approximate /pʰaw/ |
| village-baw | bào gỗ. bào gỗ. bào gỗ. | vi-VN | first syllable, approximate /ɓaw/ |
| village-faan | ฟาน ฟาน ฟาน | th-TH | approximate /faːn/ |
| new-paan | ปาน ปาน ปาน | th-TH | approximate /paːn/ |
| new-noo | โน โน โน | th-TH | approximate /noː/ |
| old-maan | มาน มาน มาน | th-TH | approximate /maːn/, shared by two contours |
| sanya-context | 海南三亚，三亚，三亚。 | cmn-CN | one complete standalone 三亚 occurrence |
| niulu-natural | 牛路。牛路。牛路。 | cmn-CN | one complete 牛路 occurrence |
| lou-natural | 漏。漏。漏。 | cmn-CN | one complete 漏 occurrence |
| lu-natural | 路。路。路。 | cmn-CN | one complete 路 occurrence |
| tongshi-natural | 通杂，通杂，通杂。 | cmn-CN | one complete /tʰuŋ tsa/ utterance, original connected speech |

The approved Mandarin clip illustrates 通什, tōng zá, `[tʰuŋ˥˥ tsa˧˥]`. The neural
request uses the same-sounding spelling 通杂 to avoid the ordinary dictionary
reading of 什; its prompt explicitly specifies the place-name reading. One
complete occurrence is cropped from the repeated-name source, with no cut
inside the name. Original PCM samples, syllable transitions, pitch, duration
and amplitude are retained: **no joining syllables or Praat processing**.
Model-assisted transcription of the full source reported three repetitions
of /tʰuŋ tsa/, with first and second tones. This auxiliary check does not
establish subjective listening quality or replace a human pronunciation check.

The added Mandarin readings are 三亚, 牛路, 漏 and 路, all contiguous crops
with unchanged PCM. Full-source model-assisted transcription checks supported
the intended segment sequences; these are auxiliary checks, not human listening.
The user-approved 通什 audio and the six existing Hlai outputs remain
byte-identical. Multiple 牛漏 candidates were rejected because auxiliary
transcription repeatedly returned 牛肉; no such uncertain clip is published.

The article's principal tables compare the same complete name across Hlai,
local Hainanese and Mandarin. Missing native/local whole-name data are explicitly
marked; ordinary word recordings are not inserted into those gaps. Tables 2 and 6
retain their separate role as component vocabulary comparisons. No Hainanese
full-name recording is supplied by these synthetic clips.

The earlier clip assembled from 通过 and 杂志 was withdrawn after the user
reported unnatural syllable transitions and voice quality. Its public file
and the older source `mandarin.wav` remain historical artifacts; current
buttons and rendering no longer use that source. The new Mandarin clip is
not the Hlai or Hainanese pronunciation of the place name.

For the twelve Hlai demonstrations only, Praat overlap-add resynthesis through
praat-parselmouth 0.4.7 applies the indicated contours. Pitch levels 1–5 are 200, 225, 250, 275 and 300 Hz solely
to demonstrate relative direction; they are not measured Hlai frequencies.
Source durations are retained. In particular, the Mandarin /ta/ source does
not establish Hlai vowel quantity. Vowels, aspiration, phonation, duration
and connected speech have not been validated against native speakers.

Browser checks establish successful loading and playback completion. Acoustic
checks establish the intended approximate pitch direction. Neither establishes
native pronunciation or subjective listening quality.

## Reproduction and new synthesis

The fourteen current neural sources and the superseded Mandarin source are preserved in
`docs/hainan-toponymy-audio-sources/`. Its `sources.json` contains request bodies,
SHA-256 hashes and cut boundaries, without credentials or a cloud project ID.
The per-demo manifest `docs/hainan-toponymy-audio.json` records source cuts,
processing parameters, target notation and output hashes. A test checks that
the delivered Mandarin PCM is an unchanged contiguous range of its source.

With Python packages `numpy` and `praat-parselmouth==0.4.7` installed, run:

```sh
python3 scripts/generate-hainan-audio.py
```

This renders the stored sources locally without a cloud call. To obtain fresh
candidates, authenticate `gcloud` and explicitly supply a billing-enabled
project with the Text-to-Speech API enabled:

```sh
python3 scripts/generate-hainan-audio.py --generate-bases /tmp/hainan-audio-candidates --project YOUR_PROJECT
```

Cloud synthesis may incur charges. Neural generation is nondeterministic;
new candidates require phonetic review and new cut boundaries before replacing
the stored sources. The renderer checks source hashes and refuses to apply the
existing boundaries to an unfamiliar recording. Cloud tokens remain in process
memory and are never written to the manifest. Model documentation:
<https://cloud.google.com/text-to-speech/docs/gemini-tts>.

IPA font: unmodified Charis 7.000 Regular WOFF2 from
<https://software.sil.org/charis/download/>, licensed under the SIL Open Font
License 1.1. The license is distributed at
`static/assets/fonts/CHARIS-OFL.txt`.
