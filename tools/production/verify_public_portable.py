"""Run an immutable public Electron portable wrapper on an isolated Windows runner.

The normal renderer remains sandboxed. CDP is enabled only by this verifier's
launch arguments. The shipped executable is downloaded and never modified.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request

from playwright.sync_api import expect, sync_playwright


def download(url, target, expected):
    request = urllib.request.Request(url, headers={'User-Agent': 'Healing-Public-Portable-Verification'})
    with urllib.request.urlopen(request, timeout=120) as response, target.open('wb') as out:
        shutil.copyfileobj(response, out)
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    if actual != expected:
        raise RuntimeError('Public portable bytes do not match the pinned release SHA-256')
    return actual


def run(request_path, output):
    if os.name != 'nt':
        raise RuntimeError('Actual Windows execution is required')
    identity = json.loads(request_path.read_text(encoding='utf-8'))
    output.parent.mkdir(parents=True, exist_ok=True)
    sandbox = Path(tempfile.mkdtemp(prefix='Healing-public-portable-'))
    temporary = sandbox / 'temp'
    temporary.mkdir()
    executable = sandbox / identity['asset']
    report = dict(schema=1, status='running', version=identity['version'],
                  runtimeCommit=identity['runtimeCommit'], sourceRun=identity['sourceRun'],
                  checkedAt=datetime.now(timezone.utc).isoformat(), checks=[], pageErrors=[])
    child = None
    try:
        report['portableSha256'] = download(identity['url'], executable, identity['portableSha256'])
        with socket.socket() as reservation:
            reservation.bind(('127.0.0.1', 0))
            port = reservation.getsockname()[1]
        environment = {**os.environ, 'TEMP': str(temporary), 'TMP': str(temporary)}
        log = (output.parent / 'portable-process.log').open('w', encoding='utf-8')
        try:
            child = subprocess.Popen([str(executable), f'--remote-debugging-port={port}',
                                      f'--user-data-dir={sandbox / "profile"}'],
                                     env=environment, stdout=log, stderr=subprocess.STDOUT)
            endpoint = f'http://127.0.0.1:{port}'
            deadline = time.monotonic() + 120
            while time.monotonic() < deadline:
                try:
                    with urllib.request.urlopen(endpoint + '/json/version', timeout=2) as response:
                        assert json.load(response)['Browser']
                    break
                except Exception:
                    time.sleep(.25)
            else:
                raise RuntimeError('The portable outer wrapper did not expose its launched renderer')
            with sync_playwright() as playwright:
                browser = playwright.chromium.connect_over_cdp(endpoint)
                context = browser.contexts[0]
                deadline = time.monotonic() + 30
                while not context.pages and time.monotonic() < deadline:
                    time.sleep(.1)
                page = next((p for p in context.pages if 'app.asar' in p.url), None)
                if page is None:
                    raise RuntimeError('No packaged game page was launched by the outer wrapper')
                page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
                decoded = urllib.parse.unquote(urllib.parse.urlparse(page.url).path)
                if decoded.startswith('/') and len(decoded) > 2 and decoded[2] == ':':
                    decoded = decoded[1:]
                if '/resources/app.asar/' not in decoded.replace('\\', '/'):
                    raise RuntimeError('The portable renderer did not load the packaged ASAR')
                asar_path = Path(decoded.split('/resources/app.asar/')[0]) / 'resources' / 'app.asar'
                if not asar_path.resolve().is_relative_to(sandbox.resolve()):
                    raise RuntimeError('The wrapper did not extract into its isolated temporary directory')
                report['asarSha256'] = hashlib.sha256(asar_path.read_bytes()).hexdigest()
                if report['asarSha256'] != identity['asarSha256']:
                    raise RuntimeError('Portable child ASAR differs from the exact verified installed game')
                report['checks'].append('public wrapper launches exact previously verified packaged ASAR')
                expect(page.get_by_role('heading', level=1)).to_contain_text('湿性愈合')
                expect(page.locator('.title-footer')).to_contain_text('v' + identity['version'])
                page.evaluate("localStorage.setItem('moist-healing:v1:settings',JSON.stringify({textSpeed:0,music:false,ambience:false,soundEffects:false,voiceEnabled:false}))")
                page.reload()
                page.get_by_role('button', name='开始阅读', exact=True).click()
                expect(page.locator('.game-screen')).to_have_attribute('data-line', '0')
                page.get_by_role('button', name='显示下一段', exact=True).click()
                expect(page.locator('.game-screen')).to_have_attribute('data-line', '1')
                page.wait_for_function("() => JSON.parse(localStorage.getItem('moist-healing:v1:save:auto') || 'null')?.state.line === 1")
                before = page.evaluate("JSON.parse(localStorage.getItem('moist-healing:v1:save:auto')).state")
                page.reload()
                page.get_by_role('button', name='继续上次的故事', exact=True).click()
                expect(page.locator('.game-screen')).to_have_attribute('data-line', '1')
                after = page.evaluate("JSON.parse(localStorage.getItem('moist-healing:v1:save:auto')).state")
                if before != after:
                    raise RuntimeError('Portable reading reload changed the saved route')
                report['checks'].extend(['current title and version render from public portable wrapper',
                                         'start and actual automatic save', 'reload and Continue restore the same saved state'])
                page.screenshot(path=str(output.parent / 'portable-reading.png'))
                if report['pageErrors']:
                    raise RuntimeError(str(report['pageErrors']))
                report['checks'].append('no renderer page errors during the exercised reading')
                browser.close()
            report['status'] = 'passed'
        finally:
            log.close()
    except Exception as error:
        report.update(status='failed', error=str(error))
        raise
    finally:
        if child is not None:
            # Only the launched wrapper and its descendants belong to this test.
            subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'], capture_output=True)
            try:
                child.wait(timeout=15)
            except subprocess.TimeoutExpired:
                child.kill()
        # A detached portable child still has its executable within this one
        # sandbox. Do not terminate arbitrary Electron or user processes.
        escaped = str(sandbox).replace("'", "''")
        subprocess.run(['powershell', '-NoProfile', '-Command',
                        "$r='" + escaped + "'; Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($r,[System.StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], capture_output=True)
        for attempt in range(30):
            try:
                shutil.rmtree(sandbox)
                break
            except (PermissionError, OSError):
                time.sleep(.25)
        report['temporarySandboxRemoved'] = not sandbox.exists()
        if sandbox.exists():
            report['status'] = 'failed'
            report['cleanupError'] = 'Isolated portable sandbox could not be removed'
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False))
        if report['status'] != 'passed':
            raise RuntimeError('Public portable verification failed; see its preserved report')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--request', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    arguments = parser.parse_args()
    run(arguments.request, arguments.output)
