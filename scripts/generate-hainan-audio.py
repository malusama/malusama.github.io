"""Render approximate demonstrations from reviewed Gemini TTS source clips.

Fresh neural synthesis is nondeterministic: --generate-bases writes candidates
for review, never applies stored cut points to an unreviewed new recording.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request
import wave

import numpy as np
import parselmouth as pm
from parselmouth.praat import call

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'docs/hainan-toponymy-audio-sources'
OUTPUT_DIR = ROOT / 'static/audio/hainan-toponymy'
PITCH_LEVELS = [200, 225, 250, 275, 300]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def generate_candidates(destination, project, sources):
    if not project:
        raise SystemExit('--generate-bases requires an explicitly supplied --project')
    if destination.resolve() == SOURCE_DIR.resolve():
        raise SystemExit('Generate candidates in a separate directory; review before replacing sources')
    destination.mkdir(parents=True, exist_ok=True)
    token = subprocess.run(
        ['gcloud', 'auth', 'print-access-token'], check=True,
        capture_output=True, text=True, timeout=30,
    ).stdout.strip()
    for name, source in sources.items():
        request = urllib.request.Request(
            'https://texttospeech.googleapis.com/v1/text:synthesize',
            data=json.dumps(source['request']).encode(),
            headers={'Authorization': 'Bearer ' + token,
                     'Content-Type': 'application/json',
                     'x-goog-user-project': project},
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.load(response)
        (destination / (name + '.wav')).write_bytes(base64.b64decode(result['audioContent']))
        (destination / (name + '.json')).write_text(
            json.dumps(source['request'], ensure_ascii=False, indent=2) + '\n')
        print('Generated candidate:', name)


def render_segment(source_path, cut, tone):
    source = pm.Sound(str(source_path))
    snd = source.extract_part(from_time=cut[0], to_time=cut[1], preserve_times=False)
    pitch = snd.to_pitch_ac(time_step=.01, pitch_floor=100, pitch_ceiling=700)
    voiced = pitch.xs()[pitch.selected_array['frequency'] > 0]
    if len(voiced) < 8:
        raise RuntimeError('Insufficient voiced segment: ' + str(source_path))
    start, end = float(voiced[0]), float(voiced[-1])
    manipulation = call(snd, 'To Manipulation', .01, 100, 700)
    tier = call(manipulation, 'Extract pitch tier')
    call(tier, 'Remove points between', 0, snd.duration)
    digits = [int(x) for x in tone]
    for time in np.linspace(start, end, 41):
        level = np.interp((time - start) / (end - start),
                          np.linspace(0, 1, len(digits)), digits)
        hz = np.interp(level, [1, 2, 3, 4, 5], PITCH_LEVELS)
        call(tier, 'Add point', float(time), float(hz))
    call([tier, manipulation], 'Replace pitch tier')
    result = call(manipulation, 'Get resynthesis (overlap-add)')
    audio = result.values[0].copy()
    # Short boundary fades avoid cut clicks; no duration stretching is applied.
    fade = min(int(.005 * result.sampling_frequency), len(audio) // 2)
    audio[:fade] *= np.linspace(0, 1, fade)
    audio[-fade:] *= np.linspace(1, 0, fade)
    return audio, int(result.sampling_frequency), [start, end]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-dir', type=Path, default=SOURCE_DIR)
    parser.add_argument('--generate-bases', type=Path, metavar='CANDIDATE_DIR')
    parser.add_argument('--project', help='Billing-enabled Google Cloud project for candidate synthesis')
    args = parser.parse_args()
    sources = json.loads((SOURCE_DIR / 'sources.json').read_text())
    if args.generate_bases:
        generate_candidates(args.generate_bases, args.project, sources)
        return
    for name, source in sources.items():
        if digest(args.base_dir / (name + '.wav')) != source['sha256']:
            raise SystemExit('Unreviewed source recording: ' + name + '; inspect cuts and update sources.json first')

    specifications = [
        ('field-zhongsha', '[taː˥˥]', [('field', '55')]),
        ('field-tongzha', '[taː˩˨˩]', [('field', '121')]),
        ('big-zhongsha', '[luŋ˥˧]', [('big-u', '53')]),
        ('big-tongzha', '[loŋ˧˧]', [('big-o', '33')]),
        ('sand-zhongsha', '[pʰaw˥˥]', [('sand', '55')]),
        ('sand-tongzha', '[pʰaw˥˩]', [('sand', '51')]),
    ]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for slug, ipa, segments in specifications:
        audio_parts, details = [], []
        for segment, tone in segments:
            source_name = segment
            source = sources[source_name]
            cut = source['cuts'][segment]
            audio, sample_rate, voiced = render_segment(args.base_dir / (source_name + '.wav'), cut, tone)
            if audio_parts:
                audio_parts.append(np.zeros(int(.06 * sample_rate)))
            audio_parts.append(audio)
            details.append({'source': source_name + '.wav', 'sourceSHA256': source['sha256'],
                            'sourceCutSeconds': cut, 'tone': tone, 'voicedSegmentSeconds': voiced})
        audio = np.concatenate(audio_parts)
        audio = audio / np.max(np.abs(audio)) * .75
        filename = slug + '-gemini.wav'
        with wave.open(str(OUTPUT_DIR / filename), 'wb') as output:
            output.setparams((1, 2, sample_rate, 0, 'NONE', 'not compressed'))
            output.writeframes((audio * 32767).astype('<i2').tobytes())
        manifest.append({'file': filename, 'targetIPA': ipa,
                         'tone': ' '.join(t for _, t in segments),
                         'kind': 'synthetic-contour-demonstration',
                         'engine': 'Google Cloud Gemini 2.5 Pro TTS, Leda; Praat via praat-parselmouth 0.4.7',
                         'segments': details, 'pitchLevelsHz': PITCH_LEVELS,
                         'limitations': 'Approximate segments from supported-language words, with schematic pitch contours. Not native Hlai or Hainanese recordings, not measured local F0, no native-speaker validation of quantity, phonation or connected speech.',
                         'sha256': digest(OUTPUT_DIR / filename)})
    # Mandarin is one continuous neural utterance. Preserve sample values and
    # the syllable transition; only remove silence/repeated whole-name examples.
    source = sources['tongshi-natural']
    cut = source['cuts']['whole-name']
    with wave.open(str(args.base_dir / 'tongshi-natural.wav'), 'rb') as recording:
        sample_rate = recording.getframerate()
        params = recording.getparams()
        frames = [round(time * sample_rate) for time in cut]
        recording.setpos(frames[0])
        original_samples = recording.readframes(frames[1] - frames[0])
    filename = 'tongshi-mandarin-natural.wav'
    with wave.open(str(OUTPUT_DIR / filename), 'wb') as output:
        output.setparams(params)
        output.writeframes(original_samples)
    manifest.append({'file': filename, 'targetIPA': '[tʰuŋ˥˥ tsa˧˥]',
                     'kind': 'synthetic-mandarin-utterance',
                     'engine': 'Google Cloud Gemini 2.5 Pro TTS, Leda',
                     'source': 'tongshi-natural.wav', 'sourceSHA256': source['sha256'],
                     'sourceCutSeconds': cut, 'sourceFrameRange': frames,
                     'processing': 'One contiguous whole-name crop retaining original PCM samples; no syllable concatenation, pitch manipulation, time stretching, normalization or resynthesis.',
                     'limitations': 'Synthetic Mandarin reading of the written place name; not Hlai or Hainanese field evidence. Model-assisted transcription checks are not human listening validation.',
                     'sha256': digest(OUTPUT_DIR / filename)})
    (ROOT / 'docs/hainan-toponymy-audio.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('Rendered', len(manifest), 'Gemini voice demonstrations')


if __name__ == '__main__':
    main()
