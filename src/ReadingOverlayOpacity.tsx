import { useEffect, useState } from 'react';

const STORAGE_KEY = 'moist-healing:v1:dialogue-opacity';
const DEFAULT_OPACITY = 0.72;
const clamp = (value: number) => Math.min(0.95, Math.max(0.35, value));

function readOpacity() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? clamp(value) : DEFAULT_OPACITY;
  } catch {
    return DEFAULT_OPACITY;
  }
}

export function ReadingOverlayOpacity() {
  const [opacity, setOpacity] = useState(readOpacity);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const sync = () => {
      const game = root.querySelector<HTMLElement>('.game-screen');
      const next = !!game && game.dataset.uiHidden !== 'true';
      setActive(next);
      if (!next) setOpen(false);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ui-hidden'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-overlay-opacity', opacity.toString());
    try { localStorage.setItem(STORAGE_KEY, opacity.toString()); } catch { /* Keep the current session value in memory. */ }
  }, [opacity]);

  if (!active) return null;
  const percent = Math.round(opacity * 100);

  return <div className="overlay-opacity-control">
    {open && <div className="opacity-popover" role="group" aria-label="对话框透明度设置">
      <span>对话框透明度</span>
      <strong>{percent}%</strong>
      <input aria-label="对话框透明度" type="range" min="0.35" max="0.95" step="0.05" value={opacity} onChange={event => setOpacity(clamp(Number(event.currentTarget.value)))} />
    </div>}
    <button className="opacity-toggle" aria-expanded={open} aria-label={`调整对话框透明度，当前 ${percent}%`} onClick={() => setOpen(value => !value)}>
      <span className="opacity-label">透明</span><strong>{percent}%</strong>
    </button>
  </div>;
}
