"""Eight project-specific instrumental compositions; original note arrangements.

No stock melodies, recordings, voice tracks or music-generation prompts are used.
The SoundFont supplies instrument timbres only. MIDI and JSON retain every note.
"""
from pathlib import Path
from fractions import Fraction
import hashlib
import json
import math
import random
import struct


ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output'
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]


TRACKS = [
 dict(id='rain-platform', project='Rain', title='雨后的站台', english='The Platform After Rain',
      bpm=78, tonic=62, mode='major', key='D major', signature=2, style='chamber',
      use='车站重逢、搬书与日常交谈；主场景的安静底色。',
      lead=0, accompaniment=0, pad=48, bass=42, counter=46,
      instruments=['原声钢琴','室内弦乐','大提琴','竖琴'],
      chords=[0,4,5,2,3,0,1,4], bridge=[5,2,3,0,1,5,3,4],
      a=['5:1 6:.5 5:.5 3:1 2:1','2:1 3:1 5:1.5 0:.5',
         '6:1 8:.5 7:.5 6:1 5:1','3:2 2:1 0:1',
         '4:1 5:.5 6:.5 8:1 7:1','5:1 3:1 2:1 1:1',
         '2:1 3:1 4:1 6:1','5:2 2:1 0:1'],
      b=['8:1.5 7:.5 6:1 5:1','7:1 6:1 3:2',
         '6:1 8:1 9:1 8:1','5:1.5 3:.5 2:2',
         '4:1 6:.5 8:.5 9:1 6:1','6:1 5:1 3:1 2:1',
         '4:1.5 3:.5 2:1 1:1','2:2 5:1 0:1']),
 dict(id='rain-letter', project='Rain', title='留到天亮的信', english='A Letter Kept Until Dawn',
      bpm=72, tonic=65, mode='major', key='F major', signature=-1, style='letter',
      use='信件、释怀与结局回忆；先克制，再给出明亮的和声。',
      lead=0, accompaniment=46, pad=49, bass=42, counter=11,
      instruments=['柔和钢琴','竖琴','慢弦乐','大提琴','颤音琴'],
      chords=[5,3,0,4,5,1,3,4], bridge=[3,0,1,5,3,0,1,4],
      a=['3:1.5 2:.5 1:2','3:1 4:.5 3:.5 2:2',
         '5:1 3:1 2:1 1:1','2:2 0:1 5:1',
         '6:1.5 5:.5 3:1 2:1','4:1 3:1 2:2',
         '4:1 6:1 5:1 3:1','2:3 0:1'],
      b=['6:1 8:1 7:1 6:1','5:2 3:1 2:1',
         '4:1.5 6:.5 9:1 8:1','6:2 5:2',
         '4:1 6:1 8:1.5 7:.5','5:1 3:1 2:1 1:1',
         '2:1 4:.5 6:.5 5:1 4:1','2:2 0:2']),
 dict(id='healing-desks', project='Healing', title='课桌间的光', english='Light Between the Desks',
      bpm=94, tonic=67, mode='major', key='G major', signature=1, style='campus',
      use='校园、旧刊室、同学合做校刊；轻快但给对白留出空间。',
      lead=73, accompaniment=24, pad=48, bass=32, counter=0,
      instruments=['长笛','尼龙弦吉他','钢琴','轻弦乐','木贝司','轻打击乐'],
      chords=[0,4,5,2,3,0,1,4], bridge=[3,0,1,4,5,2,3,4],
      a=['3:.5 5:.5 6:1 5:.5 3:.5 2:1','2:1 3:.5 2:.5 1:1 0:1',
         '3:.5 5:.5 6:.5 8:.5 6:1 5:1','3:1.5 2:.5 0:2',
         '4:.5 6:.5 8:1 6:.5 5:.5 4:1','3:1 2:.5 1:.5 5:2',
         '2:.5 3:.5 4:1 6:1 4:1','2:1 5:1 0:2'],
      b=['6:.5 8:.5 9:1 8:.5 6:.5 5:1','5:1 3:.5 2:.5 1:2',
         '4:.5 6:.5 8:1 9:1 6:1','7:1 5:.5 3:.5 2:2',
         '6:1 8:.5 7:.5 6:1 5:1','3:.5 5:.5 7:1 6:1 3:1',
         '4:1 6:1 5:.5 4:.5 3:1','2:1 5:.5 7:.5 5:1 0:1']),
 dict(id='healing-developed', project='Healing', title='显影之后', english='After the Image Appears',
      bpm=80, tonic=64, mode='minor', key='E minor', signature=1, style='memory',
      use='争执后的谈话、样张和成长回忆；低处起笔，后段展开。',
      lead=0, accompaniment=25, pad=48, bass=42, counter=71,
      instruments=['原声钢琴','钢弦吉他','单簧管','弦乐','大提琴'],
      chords=[0,5,2,6,3,0,5,4], bridge=[5,2,6,0,5,2,3,4],
      a=['5:1 3:.5 2:.5 1:2','3:1.5 5:.5 6:2',
         '5:1 7:1 8:1 7:1','5:2 2:1 0:1',
         '4:1.5 3:.5 2:1 1:1','3:1 2:1 1:2',
         '6:1 8:.5 7:.5 5:1 3:1','2:3 0:1'],
      b=['6:1 8:1 10:1.5 9:.5','7:1 8:1 5:2',
         '7:1.5 9:.5 8:1 7:1','5:1 3:1 2:1 1:1',
         '6:1 8:.5 10:.5 9:1 8:1','7:1 5:1 3:2',
         '4:1 6:1 5:1 3:1','2:2 5:1 0:1']),
 dict(id='netlove-windowlight', project='NetLove', title='屏幕那端的灯', english='A Light Beyond the Screen',
      bpm=88, tonic=62, mode='major', key='D major', signature=2, style='signal',
      use='初识、互助与日常消息；有轻微律动的温暖电子底色。',
      lead=4, accompaniment=28, pad=89, bass=33, counter=11,
      instruments=['Rhodes 电钢琴','弱音电吉他','暖合成器铺底','指弹贝司','颤音琴','轻鼓组'],
      chords=[0,2,5,3,0,4,1,4], bridge=[5,2,3,0,1,5,3,4],
      a=['0:.5 3:.5 5:1 6:.5 5:.5 3:1','2:1.5 3:.5 5:1 0:1',
         '6:.5 5:.5 3:1 2:.5 3:.5 5:1','4:2 6:1 0:1',
         '3:1 5:.5 8:.5 7:1 5:1','2:1 5:1 3:.5 2:.5 0:1',
         '4:.5 3:.5 2:1 4:1 6:1','5:1.5 2:.5 0:2'],
      b=['8:1 7:.5 6:.5 5:1 3:1','7:1.5 6:.5 5:1 0:1',
         '6:.5 8:.5 9:1 8:1 6:1','5:2 3:1 0:1',
         '4:1 6:.5 8:.5 9:1 8:1','6:1 5:.5 3:.5 2:2',
         '6:1.5 5:.5 4:1 3:1','2:1 5:1 0:2']),
 dict(id='netlove-offline', project='NetLove', title='离线以后还在', english='Still Here When Offline',
      bpm=76, tonic=57, mode='minor', key='A minor', signature=0, style='offline',
      use='联系暂断、夜间独白与认真道别；稀疏节拍和较长呼吸。',
      lead=5, accompaniment=24, pad=89, bass=33, counter=11,
      instruments=['柔和电钢琴','尼龙弦吉他','颤音琴','暖合成器','指弹贝司','轻打击乐'],
      chords=[0,5,2,6,3,0,5,4], bridge=[5,2,6,0,3,5,1,4],
      a=['8:1.5 7:.5 5:1 0:1','6:2 5:1 3:1',
         '7:1 8:.5 7:.5 5:2','5:1 2:1 0:2',
         '6:1.5 4:.5 3:1 2:1','3:2 1:1 0:1',
         '6:1 8:1 7:1 5:1','2:2 0:2'],
      b=['8:1 10:1 9:1.5 8:.5','7:1 5:1 3:2',
         '9:1 8:.5 7:.5 5:2','8:1.5 7:.5 5:2',
         '6:1 8:1 9:1 8:1','6:1 5:1 3:1 2:1',
         '4:1 6:1 8:1 7:1','5:2 2:1 0:1']),
 dict(id='circuit-thirteen', project='Circuit', title='十三号回声', english='The Thirteenth Echo',
      bpm=68, tonic=62, mode='minor', key='D minor', signature=-1, style='suspense',
      use='夜班调查、异常记录与旧楼；低弦、稀疏钟音和半音张力。',
      lead=8, accompaniment=12, pad=49, bass=43, counter=14,
      instruments=['钢片琴','马林巴','低弦乐','低音提琴','管钟'],
      chords=[0,0,5,3,0,6,1,4], bridge=[5,3,0,6,5,1,3,4],
      a=['1:1 0:1 5:.5 6:.5 5:1','b2:.5 1:1.5 0:2',
         '6:1.5 5:.5 3:1 0:1','4:1 0:1 2:2',
         '1:.5 5:.5 8:1 7:1 0:1','7:1.5 5:.5 2:1 0:1',
         '2:1 b2:.5 1:.5 0:2','5:1 0:1 2:1 0:1'],
      b=['6:1 8:.5 7:.5 5:1 0:1','4:1.5 6:.5 5:1 0:1',
         '8:1 b9:.5 8:.5 5:2','7:1 5:1 2:1 0:1',
         '6:1 8:1 7:1 5:1','2:1 b2:.5 1:.5 0:2',
         '4:1.5 3:.5 2:1 0:1','5:1 2:1 0:2']),
 dict(id='circuit-nightshift', project='Circuit', title='回路未眠', english='The Circuit Never Sleeps',
      bpm=84, tonic=64, mode='minor', key='E minor', signature=1, style='nightshift',
      use='走访、现场推理与推进调查；带脉冲的克制紧张感。',
      lead=0, accompaniment=45, pad=48, bass=43, counter=12,
      instruments=['低音钢琴','拨奏弦乐','弦乐组','低音提琴','马林巴','低鼓'],
      chords=[0,5,3,6,0,5,1,4], bridge=[3,5,0,6,3,1,5,4],
      a=['5:.5 8:.5 7:1 5:.5 3:.5 0:1','6:1 5:.5 3:.5 2:1 0:1',
         '4:.5 6:.5 5:1 4:.5 3:.5 2:1','7:1.5 5:.5 0:2',
         '8:.5 7:.5 5:1 3:.5 2:.5 1:1','6:1 8:.5 7:.5 5:2',
         '2:.5 4:.5 6:1 5:.5 4:.5 2:1','5:2 2:1 0:1'],
      b=['6:.5 8:.5 9:1 8:.5 6:.5 4:1','8:1.5 7:.5 6:1 0:1',
         '8:.5 7:.5 5:1 3:.5 5:.5 8:1','7:2 5:1 2:1',
         '6:1 8:.5 9:.5 8:1 6:1','4:.5 6:.5 8:1 7:.5 5:.5 2:1',
         '6:1 5:.5 3:.5 2:1 1:1','2:1 5:1 0:2']),
]


def scale_note(tonic, scale, degree):
    index = degree - 1
    return tonic + 12 * (index // 7) + scale[index % 7]


def phrase(text, track):
    notes = []
    cursor = Fraction(0)
    for word in text.split():
        pitch, length = word.split(':')
        duration = Fraction(length)
        accidental = -1 if pitch.startswith('b') else (1 if pitch.startswith('#') else 0)
        degree = int(pitch.lstrip('b#'))
        note = None if degree == 0 else scale_note(track['tonic'], MAJOR if track['mode'] == 'major' else MINOR, degree) + accidental
        notes.append((float(cursor), note, float(duration)))
        cursor += duration
    if cursor != 4:
        raise ValueError(f'{track["id"]}: bar must sum to four beats: {text} = {cursor}')
    return notes


def smf_varlen(value):
    value = int(value)
    result = [value & 0x7f]
    while value >> 7:
        value >>= 7
        result.insert(0, (value & 0x7f) | 0x80)
    return bytes(result)


def midi_file(score):
    ppq = 960
    chunks = []
    def chunk(events):
        result = bytearray(); last = 0
        for tick, priority, data in sorted(events, key=lambda e:(e[0], e[1])):
            result += smf_varlen(tick - last) + data; last = tick
        result += b'\x00\xff\x2f\x00'
        return b'MTrk' + struct.pack('>I', len(result)) + result
    title = (score['title'] + ' / ' + score['english']).encode()
    tempo = round(60_000_000 / score['bpm']).to_bytes(3, 'big')
    chunks.append(chunk([(0,0,b'\xff\x03'+smf_varlen(len(title))+title),
                         (0,1,b'\xff\x51\x03'+tempo),
                         (0,2,b'\xff\x58\x04\x04\x02\x18\x08'),
                         (0,3,b'\xff\x59\x02'+struct.pack('bB',score['signature'],score['mode']=='minor')),
                         (round(score['beats']*ppq),5,b'\xff\x01\x03END')]))
    for channel in score['channels']:
        c = channel['channel']; name = channel['role'].encode()
        events=[(0,-4,b'\xff\x03'+smf_varlen(len(name))+name),
                (0,-3,bytes([0xc0+c,channel['program']])),
                (0,-2,bytes([0xb0+c,7,channel['volume']])),
                (0,-1,bytes([0xb0+c,10,channel['pan']]))]
        for note in score['notes']:
            if note['channel']!=c:continue
            events.append((round(note['beat']*ppq),1,bytes([0x90+c,note['pitch'],note['velocity']])))
            events.append((round((note['beat']+note['length'])*ppq),0,bytes([0x80+c,note['pitch'],0])))
        for control in score['controls']:
            if control['channel']==c:events.append((round(control['beat']*ppq),-1,bytes([0xb0+c,control['control'],control['value']])))
        chunks.append(chunk(events))
    return b'MThd'+struct.pack('>IHHH',6,1,len(chunks),ppq)+b''.join(chunks)


def arrange(t):
    rng=random.Random(100_000+TRACKS.index(t)*1717)
    scale=MAJOR if t['mode']=='major' else MINOR
    notes=[];controls=[]
    electronic=t['style'] in ['signal','offline']
    suspense=t['style'] in ['suspense','nightshift']
    channels=[dict(channel=0,role='melody',program=t['lead'],volume=86 if not suspense else 73,pan=61),
              dict(channel=1,role='arpeggio',program=t['accompaniment'],volume=63,pan=43),
              dict(channel=2,role='sustained_harmony',program=t['pad'],volume=49 if electronic else 44,pan=78),
              dict(channel=3,role='bass',program=t['bass'],volume=66 if suspense else 59,pan=62),
              dict(channel=4,role='countermelody',program=t['counter'],volume=49,pan=85)]
    if electronic or t['style'] in ['campus','nightshift']:
        channels.append(dict(channel=9,role='soft_percussion',program=0,volume=49 if electronic else 37,pan=65))
    def add(channel,pitch,beat,length,velocity=60,jitter=True):
        if pitch is None:return
        grid_beat=beat
        human=rng.uniform(-.011,.011) if jitter else 0
        beat=max(0,beat+human)
        velocity=int(max(1,min(115,velocity+rng.randint(-3,3))))
        notes.append(dict(channel=channel,pitch=int(pitch),beat=round(beat,5),gridBeat=round(grid_beat,5),
                          length=round(max(.06,length),5),velocity=velocity))
    def note(degree,octave=0):return scale_note(t['tonic'],scale,degree)+12*octave
    def chord(degree):
        # Rooted seventh chords; wide lower voicing, no dense low clusters.
        base=t['tonic']-12
        tones=[scale_note(base,scale,degree+1+k) for k in [0,2,4,6]]
        while max(tones)>t['tonic']+8:tones=[x-12 for x in tones]
        return tones
    sections=[('intro',0,4,.62),('A',4,8,.83),('A_variation',12,8,.91),
              ('B',20,8,1.0),('A_return',28,8,.92),('coda',36,4,.63)]
    for name,start,bars,energy in sections:
        for local_bar in range(bars):
            bar=start+local_bar;beat=bar*4
            degree=(t['bridge'] if name=='B' else t['chords'])[local_bar%8]
            if name=='coda':degree=[3,4,0,0][local_bar] if t['mode']=='major' else [5,4,0,0][local_bar]
            tones=chord(degree)
            expression=round(107*energy)
            for c in channels:controls.append(dict(channel=c['channel'],beat=beat,control=11,value=expression))
            # Slow, overlapping string/pad voices.
            if local_bar%2==0 or degree!=(t['bridge'] if name=='B' else t['chords'])[(local_bar-1)%8]:
                for k,pitch in enumerate(tones[1:]):add(2,pitch+(12 if electronic else 0),beat+k*.026,3.85,42 if suspense else 48)
            bass=tones[0]-12
            add(3,bass,beat,2.65 if not suspense else 3.6,58)
            if name not in ['intro','coda'] and not t['style']=='suspense':
                add(3,bass+7,beat+2.5,1.25,44)
            if t['style'] in ['chamber','campus','memory','signal']:
                order=[0,2,1,3,2,1,2,3]
                for step,index in enumerate(order):
                    if name=='intro' and step%2:continue
                    add(1,tones[index]+(12 if t['style']=='signal' else 0),beat+step*.5,
                        .72 if electronic else .95,48 if step%2==0 else 40)
            elif t['style'] in ['letter','offline']:
                for step,index in enumerate([0,2,3,1]):add(1,tones[index],beat+step,1.45,43 if step%2 else 49)
            elif t['style']=='suspense':
                for step,index in [(0,0),(1.5,2),(3,1)]:add(1,tones[index]-12,beat+step,.72,39)
            else:
                for step,index in enumerate([0,2,1,2,0,3,1,2]):add(1,tones[index],beat+step*.5,.33,47 if step in [0,4] else 35)
            if name not in ['intro','coda']:
                material=t['b'] if name=='B' else t['a']
                for offset,pitch,length in phrase(material[local_bar],t):
                    # Recapitulation carries small rhythmic/velocity changes, not a new tune.
                    if name=='A_variation' and local_bar in [3,7] and offset>=2 and pitch is None:
                        add(4,tones[-1]+12,beat+offset,.9,35)
                    add(0,pitch,beat+offset,max(.08,length*.89),66 if not suspense else 53)
                if name in ['A_variation','B','A_return'] and local_bar%2==1:
                    for offset,index in [(2.5,2),(3.25,1)]:
                        pitch=tones[index]+(12 if not suspense else 0)
                        add(4,pitch,beat+offset,.6 if electronic else 1.1,39)
            elif name=='coda' and local_bar>=2:
                add(0,t['tonic']+(12 if local_bar==2 else 0),beat,3.3,43)
            if name=='intro' and local_bar in [1,3] and not suspense:
                add(4,tones[-1]+12,beat+2,1.5,36)
            if suspense and name in ['B','A_return'] and local_bar in [0,4]:
                add(4,t['tonic']-12,beat,3.4,30)
            if any(c['channel']==9 for c in channels) and name not in ['intro','coda']:
                if t['style']=='campus':
                    for x in [.5,1.5,2.5,3.5]:add(9,42,beat+x,.13,24)
                    add(9,37,beat+1,.15,33);add(9,37,beat+3,.15,31)
                    if local_bar%2==0:add(9,36,beat,.15,40)
                elif t['style']=='nightshift':
                    for x in [0,2.5]:add(9,36,beat+x,.18,38)
                    if local_bar%2==1:add(9,41,beat+3,.2,31)
                elif t['style']=='signal':
                    for x in [0,2.5]:add(9,36,beat+x,.18,51)
                    for x in [1,3]:add(9,37,beat+x,.16,43)
                    for k in range(8):add(9,42,beat+k*.5+(0.045 if k%2 else 0),.1,24 if k%2 else 20)
                else:
                    if local_bar%2==0:add(9,36,beat,.18,38)
                    add(9,37,beat+2,.15,30)
                    for x in [.5,2.5]:add(9,42,beat+x,.1,20)
    score={k:v for k,v in t.items() if k not in ['a','b','chords','bridge']}
    score.update(schema=1,sampleRate=48000,bars=40,beats=160,loopStartBeat=16,loopEndBeat=144,
                 tailSeconds=4,sections=[dict(name=n,startBar=s,bars=b) for n,s,b,e in sections],
                 channels=channels,controls=controls,notes=sorted(notes,key=lambda n:(n['beat'],n['channel'],n['pitch'])),
                 composition='original authored melodies, chords and arrangement; sample-based instrument rendering',
                 vocals=False,humanListening='pending')
    return score


def main():
    scores=OUT/'scores';scores.mkdir(parents=True,exist_ok=True)
    album=[]
    for i,t in enumerate(TRACKS,1):
        score=arrange(t)
        for n in score['notes']:
            if not (0<=n['pitch']<=127 and n['beat']<160 and n['length']>0):raise ValueError(n)
        base=f'{i:02d}_{t["project"]}_{t["id"].split("-",1)[1]}'
        score['fileStem']=base
        (scores/(base+'.json')).write_text(json.dumps(score,ensure_ascii=False,indent=2)+'\n')
        (scores/(base+'.mid')).write_bytes(midi_file(score))
        album.append({k:score[k] for k in ['id','project','title','english','bpm','key','use','instruments','fileStem']})
        print(t['project'],t['title'],'notes',len(score['notes']))
    (OUT/'album.json').write_text(json.dumps({'schema':1,'date':'2026-10-24','tracks':album},ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()
