import { Icon } from './Icon';
import { pwa, type PwaState } from '../pwa';

export function PwaPanel({ state }: { state: PwaState }) {
  const description = {
    desktop: '桌面版的全部资源随安装包提供，可以直接离线阅读。',
    unsupported: '安装与离线阅读需要使用支持 PWA 的浏览器，并通过 HTTPS 打开游戏。',
    downloading: '正在下载完整第一章。完成前请保持联网，仍然可以开始阅读。',
    ready: state.online ? '完整第一章已保存在这台设备上，可以断网重开并继续阅读。' : '正在使用已下载的第一章。阅读和存档均可正常使用。',
    error: '离线下载没有完成。联网时可以阅读，重试成功后才能断网重开。',
  }[state.status];
  return <div className="pwa-panel">
    <div className="pwa-summary"><Icon name={state.status === 'ready' || state.status === 'desktop' ? 'check' : 'download'} size={25} /><div><h3>{state.status === 'ready' || state.status === 'desktop' ? '可以离线阅读' : state.status === 'downloading' ? '正在准备离线阅读' : '安装与离线阅读'}</h3><p>{description}</p></div></div>
    {state.status === 'error' && <button className="secondary" onClick={() => { void pwa.retry(); }}>重新下载</button>}
    {state.status !== 'desktop' && <>
      <div className="pwa-instructions"><h3>{state.installed ? '已安装到这台设备' : '把故事放到主屏幕'}</h3>{state.canInstall ? <button className="primary" onClick={() => { void pwa.install(); }}>安装游戏 <Icon name="download" size={17} /></button> : !state.installed && <><p>Android / 电脑：在浏览器菜单中选择“安装应用”或“添加到主屏幕”。</p><p>iPhone / iPad：用 Safari 打开游戏，在分享菜单中选择“添加到主屏幕”。</p></>}<p className="soft-note">离线下载与安装分别完成。请看到“可以离线阅读”后再断网。浏览器清理网站数据会删除本地存档，可先导出备份。</p></div>
      {state.status !== 'unsupported' && <div className="pwa-update"><div><h3>{state.updateReady ? '新版本已下载' : `当前版本 v${__APP_VERSION__}`}</h3><p>{state.updateReady ? '关闭所有游戏窗口，再次打开即可使用新版本。当前阅读不会被打断。' : '新版本完整下载后，会在关闭游戏并再次打开时接管。'}</p></div><button className="secondary" disabled={state.checking || state.status === 'downloading' || state.status === 'error'} onClick={() => { void pwa.checkUpdate(); }}>{state.checking ? '检查中…' : '检查更新'}</button></div>}
    </>}
    <div className="pwa-orientation"><h3>让故事横向铺开</h3><p>安装后优先横屏阅读。网页也可旋转手机，并通过标题页或阅读界面的全屏按钮展开画面；竖屏时仍可继续阅读。</p><p className="soft-note">若画面没有转向，请开启系统的自动旋转。部分浏览器需要手动旋转手机。</p></div>
    {state.message && <p className="pwa-message" role="status">{state.message}</p>}
  </div>;
}
