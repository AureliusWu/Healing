import { useCallback, useEffect, useRef, useState } from 'react';

const portraitQuery = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)';
const mobileUa = /Android|iPhone|iPad|iPod/i;
type ExtendedOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void>; unlock?: () => void };

export function useDisplayMode(notify: (message: string) => void) {
  const [portrait, setPortrait] = useState(() => matchMedia(portraitQuery).matches);
  const [dismissed, setDismissed] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(() => !!document.fullscreenElement);
  const [immersive, setImmersive] = useState(false);
  const [busy, setBusy] = useState(false);
  const orientationLocked = useRef(false);
  const fullscreen = nativeFullscreen || immersive;

  const unlockOrientation = useCallback(() => {
    if (!orientationLocked.current) return;
    const orientation = screen.orientation as ExtendedOrientation | undefined;
    try { orientation?.unlock?.(); } catch { /* best effort */ }
    orientationLocked.current = false;
  }, []);

  useEffect(() => {
    const media = matchMedia(portraitQuery);
    const resize = () => setPortrait(media.matches);
    const change = () => {
      const active = !!document.fullscreenElement;
      setNativeFullscreen(active);
      if (active) setImmersive(false);
      else unlockOrientation();
    };
    media.addEventListener('change', resize);
    document.addEventListener('fullscreenchange', change);
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('fullscreenchange', change);
      unlockOrientation();
    };
  }, [unlockOrientation]);

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
        unlockOrientation();
        return;
      }

      const touchStandalone = matchMedia('(display-mode: standalone)').matches && navigator.maxTouchPoints > 0;
      if (mobileUa.test(navigator.userAgent) || touchStandalone) {
        setImmersive(true);
        requestAnimationFrame(() => window.scrollTo(0, 1));
        return;
      }

      if (!document.documentElement.requestFullscreen || document.fullscreenEnabled === false) {
        notify('当前浏览器不支持全屏。可以继续使用沉浸阅读；桌面版也可按 F11。');
        return;
      }

      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      try {
        const orientation = screen.orientation as ExtendedOrientation | undefined;
        if (orientation?.lock) {
          await orientation.lock('landscape');
          orientationLocked.current = true;
        }
      } catch {
        notify('已进入全屏；如未自动横屏，请手动旋转设备。');
      }
      window.scrollTo(0, 0);
    } catch {
      notify(document.fullscreenElement ? '暂时无法退出全屏，可按 Esc。' : '暂时无法进入全屏。');
    } finally {
      setBusy(false);
    }
  }, [busy, immersive, notify, unlockOrientation]);

  return {
    fullscreen,
    busy,
    showRotationHint: portrait && !dismissed,
    dismissRotationHint: () => setDismissed(true),
    toggleFullscreen,
  };
}

export type DisplayMode = ReturnType<typeof useDisplayMode>;
