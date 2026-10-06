import { Icon } from './Icon';
import type { DisplayMode } from '../useDisplayMode';

export function FullscreenButton({ display, compact = false }: { display: DisplayMode; compact?: boolean }) {
  const label = display.fullscreen ? '退出全屏' : '全屏阅读';
  return <button className={compact ? 'paper-button' : 'sound-button fullscreen-button'} aria-label={label} aria-pressed={display.fullscreen} disabled={display.busy} onClick={() => { void display.toggleFullscreen(); }}>
    <Icon name={display.fullscreen ? 'shrink' : 'expand'} size={18} />
    {!compact && <span>{label}</span>}
  </button>;
}

export function RotationHint({ display, reading }: { display: DisplayMode; reading: boolean }) {
  if (!display.showRotationHint) return null;
  return <aside className={`rotation-hint ${reading ? 'while-reading' : ''}`} aria-label="横屏提示">
    <Icon name="rotate" size={25} />
    <div><strong>横过来，让故事铺开</strong><p>横屏能看见更多校园与角色。</p></div>
    <button onClick={display.dismissRotationHint}>继续竖屏</button>
  </aside>;
}
