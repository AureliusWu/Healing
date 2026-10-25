"""Render, linearly master, encode and validate the eight instrumental scores."""
from pathlib import Path
import hashlib
import json
import math
import os
import shutil
import subprocess

import numpy as np

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output'
RAW=ROOT/'raw'
RATE=48000


def run(args,**kwargs):
    return subprocess.run(args,check=True,**kwargs)


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def loudness(path,raw=False):
    args=['ffmpeg','-nostdin','-hide_banner','-v','info']
    if raw:args+=['-f','f32le','-ar',str(RATE),'-ac','2']
    args+=['-i',str(path),'-af','loudnorm=I=-18:TP=-2.5:LRA=11:print_format=json','-f','null','-']
    log=run(args,capture_output=True,text=True).stderr
    text=log[log.rfind('{'):log.rfind('}')+1]
    data=json.loads(text)
    return {key:float(data[key]) for key in ['input_i','input_tp','input_lra']}


def decode(path):
    result=run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(path),'-f','f32le','-ar',str(RATE),'-ac','2','pipe:1'],capture_output=True)
    return np.frombuffer(result.stdout,dtype='<f4').reshape(-1,2)


def prepare(raw,stem,loop):
    frames=raw.stat().st_size//8
    source=raw
    pad=RATE//3
    if loop:
        source=RAW/(stem+'_padded.f32')
        a=np.memmap(raw,dtype='<f4',mode='r',shape=(frames,2))
        with source.open('wb') as writer:
            writer.write(a[-pad:].tobytes())
            with raw.open('rb') as reader:shutil.copyfileobj(reader,writer)
            writer.write(a[:pad].tobytes())
    prepared=RAW/(stem+'_prepared.f32')
    filters='highpass=f=32,lowpass=f=15000,equalizer=f=280:t=q:w=0.9:g=-1.2'
    if loop:
        filters+=f',atrim=start_sample={pad}:end_sample={pad+frames},asetpts=PTS-STARTPTS'
    else:
        filters+=f',afade=t=in:ss=0:ns={round(1.1*RATE)},afade=t=out:ss={frames-round(1.4*RATE)}:ns={round(1.4*RATE)}'
    run(['ffmpeg','-nostdin','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i',str(source),'-af',filters,'-f','f32le',str(prepared)])
    if prepared.stat().st_size!=frames*8:raise ValueError('Incorrect filtered frame count')
    measured=loudness(prepared,True)
    target=-21 if loop else -18
    gain_db=min(target-measured['input_i'],-2.5-measured['input_tp'])
    if not math.isfinite(gain_db):raise ValueError('Empty / non-finite programme loudness')
    a=np.fromfile(prepared,dtype='<f4').reshape(-1,2)
    a*=10**(gain_db/20)
    boundary_before=float(np.max(np.abs(a[0]-a[-1])))
    if loop:
        if boundary_before>.025:raise ValueError(f'Loop discontinuity too large: {boundary_before}')
        # Smooth only the tiny numerical / block-quantization residual. No
        # fade-to-silence is inserted in the loop's musical content.
        n=480
        a[-n:]+=(a[0]-a[-1])[None,:]*np.linspace(0,1,n,dtype=np.float32)[:,None]**2
    if not np.isfinite(a).all() or float(np.abs(a).max())>=.91:raise ValueError('Invalid samples or inadequate headroom')
    mastered=RAW/(stem+'_mastered.f32');a.astype('<f4').tofile(mastered)
    return mastered,dict(measuredInput=measured,linearGainDb=round(gain_db,6),targetLufs=target,
                        pcmFrames=frames,seconds=round(frames/RATE,6),
                        samplePeak=float(np.abs(a).max()),boundaryBeforeCorrection=boundary_before,
                        boundaryAfterCorrection=float(np.max(np.abs(a[0]-a[-1]))))


def encode(source,output,score,kind):
    output.parent.mkdir(parents=True,exist_ok=True)
    temporary=output.with_name(output.stem+'_writing'+output.suffix)
    args=['ffmpeg','-nostdin','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i',str(source),
          '-metadata','title='+score['title']+('（循环版）' if kind=='loop' else ''),
          '-metadata','album=四作·纯音乐原声集 Vol.1','-metadata','artist=AureliusWu Projects',
          '-metadata','genre=Instrumental / Game Soundtrack','-metadata','date=2026',
          '-metadata','comment=Original composition; GeneralUser GS 2.0.3 instrument rendering; no vocals']
    if output.suffix=='.flac':args+=['-c:a','flac','-compression_level','8','-sample_fmt','s32','-bits_per_raw_sample','24']
    elif output.suffix=='.mp3':args+=['-c:a','libmp3lame','-b:a','320k','-id3v2_version','3']
    else:args+=['-c:a','libvorbis','-q:a','5']
    run(args+[str(temporary)])
    with temporary.open('rb') as finished:os.fsync(finished.fileno())
    temporary.replace(output)


def quality(path,loop=False):
    samples=decode(path)
    finite=bool(np.isfinite(samples).all())
    peak=float(np.abs(samples).max())
    rms=float(np.sqrt(np.mean(samples.astype(np.float64)**2)))
    blocks=len(samples)//48000
    seconds_rms=np.sqrt(np.mean(samples[:blocks*48000].reshape(blocks,48000,2).astype(np.float64)**2,axis=(1,2)))
    measured=loudness(path)
    result=dict(path=path.relative_to(OUT).as_posix(),bytes=path.stat().st_size,sha256=digest(path),
                sampleRate=RATE,channels=2,frames=len(samples),seconds=round(len(samples)/RATE,6),
                finite=finite,samplePeakDbfs=round(20*math.log10(peak),4),rmsDbfs=round(20*math.log10(rms),4),
                integratedLufs=measured['input_i'],truePeakDbtp=measured['input_tp'],loudnessRangeLu=measured['input_lra'],
                loopBoundaryDelta=float(np.max(np.abs(samples[0]-samples[-1]))) if loop else None,
                humanListening='pending')
    if not finite or peak>=.93 or rms<.008 or measured['input_tp']>-1.5:raise ValueError('Audio quality failed: '+str(result))
    if loop and (result['loopBoundaryDelta']>.025 or float(seconds_rms.min())<.002):raise ValueError('Loop gap / seam failed: '+str(result))
    return result


def main():
    RAW.mkdir(exist_ok=True)
    bank=ROOT/'generaluser/GeneralUser-GS.sf2'
    expected='9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe'
    if digest(bank)!=expected:raise ValueError('Unexpected SoundFont bytes')
    reports=[]
    for score_path in sorted((OUT/'scores').glob('*.json')):
        score=json.loads(score_path.read_text());stem=score['fileStem']
        print('PRODUCE',score['project'],score['title'],flush=True)
        item=dict(id=score['id'],project=score['project'],title=score['title'],files=[],processing={})
        for kind in ['master','loop']:
            raw=RAW/(stem+'_'+kind+'.f32')
            run(['node',str(ROOT/'render.cjs'),str(score_path),str(bank),kind,str(raw)])
            prepared,processing=prepare(raw,stem+'_'+kind,kind=='loop')
            item['processing'][kind]=processing
            outputs=[OUT/'masters'/(stem+'.flac'),OUT/'listen'/(stem+'.mp3')] if kind=='master' else [OUT/'loops'/(stem+'_loop.ogg')]
            for target in outputs:
                encode(prepared,target,score,kind)
                item['files'].append(quality(target,kind=='loop'))
        reports.append(item)
        (OUT/'audio-validation.json').write_text(json.dumps({'schema':1,'tracks':reports,'humanListening':'pending'},ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'done':score['title'],'seconds':item['files'][0]['seconds'],'loopSeconds':item['files'][-1]['seconds'],'lufs':item['files'][0]['integratedLufs'],'loopJoin':item['files'][-1]['loopBoundaryDelta']},ensure_ascii=False),flush=True)
    print('COMPLETE',len(reports),'tracks',flush=True)


if __name__=='__main__':main()
