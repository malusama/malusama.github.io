from pathlib import Path
import subprocess, json, wave, tempfile
import parselmouth as pm
from parselmouth.praat import call
import numpy as np
out=Path('static/audio/hainan-toponymy'); out.mkdir(parents=True,exist_ok=True)
work=Path(tempfile.mkdtemp(prefix='hainan-phonetic-'))
# Synthetic contour demonstrations, not recordings of Hlai speakers.
# eSpeak NG's Vietnamese phoneme inventory supplies approximations to u, o,
# a:, l, t, p, h, w, N; /ph/ is an explicit p+h approximation to aspiration.
samples=[('field-zhongsha','ta:',55,'[taː˥˥]'),('field-tongzha','ta:',121,'[taː˩˨˩]'),('big-zhongsha','luN',53,'[luŋ˥˧]'),('big-tongzha','loN',33,'[loŋ˧˧]'),('sand-zhongsha','phaw',55,'[pʰaw˥˥]'),('sand-tongzha','phaw',51,'[pʰaw˥˩]')]
manifest=[]
for slug,phones,tone,ipa in samples:
 base=work/(slug+'-base.wav')
 subprocess.run(['espeak-ng','-D','-v','vi','-s','100','-p','45','-P','0','-z','-w',str(base),'[['+phones+']]'],check=True)
 snd=pm.Sound(str(base)); pitch=snd.to_pitch_ac(time_step=.01,pitch_floor=65,pitch_ceiling=320)
 ts=pitch.xs(); hz=pitch.selected_array['frequency']; voiced=ts[hz>0]
 if len(voiced)<8: raise RuntimeError('No sufficient voiced segment: '+slug)
 start,end=float(voiced[0]),float(voiced[-1]); manipulation=call(snd,'To Manipulation',.01,65,320)
 tier=call(manipulation,'Extract pitch tier'); call(tier,'Remove points between',0,snd.duration)
 digits=[int(x) for x in str(tone)]
 # Five pitch levels at 100, 120, 140, 160, 180 Hz: schematic equal intervals.
 for x in np.linspace(start,end,31):
  level=np.interp((x-start)/(end-start),np.linspace(0,1,len(digits)),digits)
  call(tier,'Add point',float(x),float(80+20*level))
 call([tier,manipulation],'Replace pitch tier')
 result=call(manipulation,'Get resynthesis (overlap-add)')
 a=result.values[0]; threshold=max(abs(a))*.008; active=np.where(abs(a)>threshold)[0]
 a=a[max(0,active[0]-int(.06*result.sampling_frequency)):min(len(a),active[-1]+int(.14*result.sampling_frequency))]
 a=a/max(abs(a))*.75
 with wave.open(str(out/(slug+'.wav')),'wb') as w:
  w.setparams((1,2,int(result.sampling_frequency),0,'NONE','not compressed'));w.writeframes((a*32767).astype('<i2').tobytes())
 manifest.append({'file':slug+'.wav','targetIPA':ipa,'tone':str(tone),'kind':'synthetic-contour-demonstration','phonemeInput':phones,'engine':'eSpeak NG 1.52.0, Vietnamese phoneme inventory; Praat via praat-parselmouth 0.4.7','limitations':'Generic synthetic timbre; explicit p+h approximates aspiration; equal pitch intervals are schematic and not measured Hlai F0; not a native-speaker word recording.','pitchLevelsHz':[100,120,140,160,180],'voicedSegmentSeconds':[start,end]})
Path('docs/hainan-toponymy-audio.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(manifest),'synthetic contour demos')
