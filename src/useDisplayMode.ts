import { useCallback, useEffect, useState } from 'react';

const portraitQuery = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)';
const coarseQuery = '(pointer: coarse)';

export function useDisplayMode(notify: (message: string) => void) {
  const [portrait, setPortrait] = useState(() => matchMedia(portraitQuery).matches);
  const [dismissed, setDismissed] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(() => !!document.fullscreenElement);
  const [immersive, setImmersive] = useState(false);
  const [busy, setBusy] = useState(false);
  const fullscreen = nativeFullscreen || immersive;

  useEffect(() => {
    const media = matchMedia(portraitQuery);
    const resize = () => setPortrait(media.matches);
    const change = () => {
      setNativeFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) setImmersive(false);
    };
    media.addEventListener('change', resize);
    document.addEventListener('fullscreenchange', change);
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('fullscreenchange', change);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('immersive-reading', immersive);
    return () => document.documentElement.classList.remove('immersive-reading');
  }, [immersive]);

  const toggleFullscreen = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (immersive) {
        setImmersive(false);
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (matchMedia(coarseQuery).matches) {
        setImmersive(true);
        requestAnimationFrame(() => window.scrollTo(0, 1));
        return;
      }

      if (!document.documentElement.requestFullscreen || document.fullscreenEnabled === false) {
        notify('当前浏览器不支持系统全屏。可以继续使用沉浸阅读；桌面版也可按 F11。');
        return;
      }

      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      window.scrollTo(0, 0);
    } catch {
      notify(document.fullscreenElement ? '暂时无法退出全屏，可按 Esc。' : '暂时无法进入全屏。');
    } finally {
      setBusy(false);
    }
  }, [busy, immersive, notify]);

  return {
    fullscreen,
    busy,
    showRotationHint: portrait && !dismissed,
    dismissRotationHint: () => setDismissed(true),
    toggleFullscreen,
  };
}

export type DisplayMode = ReturnType<typeof useDisplayMode>;
