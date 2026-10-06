import { useCallback, useEffect, useRef, useState } from 'react';

type LandscapeOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };
const portraitQuery = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)';

export function useDisplayMode(notify: (message: string) => void) {
  const [portrait, setPortrait] = useState(() => matchMedia(portraitQuery).matches);
  const [dismissed, setDismissed] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const pending = useRef(false);

  const unlock = useCallback(() => {
    if (!locked.current) return;
    locked.current = false;
    try { window.screen.orientation?.unlock(); } catch { /* The browser may already have released the lock. */ }
  }, []);

  useEffect(() => {
    const media = matchMedia(portraitQuery);
    const resize = () => setPortrait(media.matches);
    const change = () => {
      setFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) unlock();
    };
    media.addEventListener('change', resize);
    document.addEventListener('fullscreenchange', change);
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('fullscreenchange', change);
      unlock();
    };
  }, [unlock]);

  const toggleFullscreen = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      if (document.fullscreenElement) {
        unlock();
        await document.exitFullscreen();
        return;
      }
      if (!document.documentElement.requestFullscreen || document.fullscreenEnabled === false) {
        notify('当前浏览器不支持全屏。请将手机横过来，或安装到主屏幕后阅读；桌面版也可按 F11。');
        return;
      }
      // Called directly from a button gesture; never enter fullscreen automatically.
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      window.scrollTo(0, 0);
      if (matchMedia('(pointer: coarse)').matches) {
        const orientation = window.screen.orientation as LandscapeOrientation | undefined;
        try {
          if (!orientation?.lock) throw new Error('Orientation lock unavailable');
          await orientation.lock('landscape');
          locked.current = true;
          if (!document.fullscreenElement) unlock();
        } catch {
          notify('已进入全屏。请将手机横过来；若画面没有转向，请开启系统的自动旋转。');
        }
      }
    } catch {
      notify(document.fullscreenElement ? '暂时无法退出全屏，请使用系统的返回键或 Esc。' : '暂时无法进入全屏。可以直接横屏阅读，桌面版也可按 F11。');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, [notify, unlock]);

  return { fullscreen, busy, showRotationHint: portrait && !dismissed, dismissRotationHint: () => setDismissed(true), toggleFullscreen };
}

export type DisplayMode = ReturnType<typeof useDisplayMode>;
