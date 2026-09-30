# Hainan toponymy synthetic demonstrations

The seven current playback buttons use **Google Cloud Gemini 2.5 Pro TTS,
Leda**, with a bright, playful, clear delivery prompt. This is a stock synthetic
voice, not Klee's official voice or a replica of the original performer.
The current filenames end in `-gemini.wav`, so cached older eSpeak media cannot
be selected by the new buttons. Older files remain for existing links.

Six clips illustrate approximate segments and schematic tone contours for
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
| mandarin | 通过。杂志。通过。杂志。 | cmn-CN | separately cut /tʰuŋ/ and /tsa/ |

The seventh clip illustrates the **Mandarin** reading of 通什, tōng zá,
`[tʰuŋ˥˥ tsa˧˥]`. Its syllables are extracted from 通过 and 杂志 and joined
with a 60 ms interval, avoiding the usual dictionary reading of 什. It is not
the Hlai or Hainanese pronunciation, or an unedited utterance of the place name.

Praat overlap-add resynthesis through praat-parselmouth 0.4.7 applies the
indicated contours. Pitch levels 1–5 are 200, 225, 250, 275 and 300 Hz solely
to demonstrate relative direction; they are not measured Hlai frequencies.
Source durations are retained. In particular, the Mandarin /ta/ source does
not establish Hlai vowel quantity. Vowels, aspiration, phonation, duration
and connected speech have not been validated against native speakers.

Browser checks establish successful loading and playback completion. Acoustic
checks establish the intended approximate pitch direction. Neither establishes
native pronunciation or subjective listening quality.

## Reproduction and new synthesis

The five original neural outputs are preserved in
`docs/hainan-toponymy-audio-sources/`. Its `sources.json` contains request bodies,
SHA-256 hashes and cut boundaries, without credentials or a cloud project ID.
The per-demo manifest `docs/hainan-toponymy-audio.json` records source cuts,
processing parameters, target notation and output hashes.

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
