"""
VM上でMBTI動画を自動生成するスクリプト (v2)

改善点:
- デバッグスクリーンショット機能（--debug）
- 9:16縦型選択の改善（複数戦略 + フォールバック）
- エクスポートフロー修正（ファイルリネーム方式）
- ステップ検証付きリトライ
- バッチ生成のエラーリカバリー

Usage:
    # デバッグモードで1本生成
    python scripts/create_video_on_vm.py --type INTJ --category love --debug

    # バッチ生成
    python scripts/create_video_on_vm.py --input scripts/test_intj.json --limit 5

    # 直接指定
    python scripts/create_video_on_vm.py --title "タイトル" --script "台本テキスト"
"""

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# VM接続設定
VM_HOST = os.environ.get("VM_HOST", "192.168.1.28")
VM_PORT = 8888
VM_BASE_URL = f"http://{VM_HOST}:{VM_PORT}"

# デバッグ設定
DEBUG_MODE = False
DEBUG_DIR = Path(__file__).parent.parent / "debug_screenshots"

# Vrew のデフォルト出力先（VM上）
# Vrewはシステムのドキュメントフォルダに書き出す
VREW_OUTPUT_DIR = "C:/Users/rmiak/OneDrive/ドキュメント"


# ============================================================
# Low-level helpers
# ============================================================

def vm_request(endpoint: str, data: dict = None, method: str = "POST",
               timeout: int = 15) -> dict:
    """VMのリモートコントロールサーバーにリクエスト送信"""
    url = f"{VM_BASE_URL}/{endpoint}"
    if data:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method=method,
        )
    else:
        req = urllib.request.Request(url, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"  [ERROR] VM request failed ({endpoint}): {e}")
        return {"success": False, "error": str(e)}


def vm_python(code: str, timeout: int = 15) -> str:
    """VM上でPythonコードを実行"""
    result = vm_request("python", {"code": code}, timeout=timeout)
    if not result.get("success", False) and result.get("error"):
        print(f"  [WARN] Python exec error: {result['error']}")
    return result.get("result", "")


def cdp_eval(js: str, timeout: int = 15) -> str:
    """VM経由でCDP JavaScriptを実行"""
    code = (
        "import json, urllib.request, websocket\n"
        "resp = urllib.request.urlopen('http://127.0.0.1:9222/json')\n"
        "tabs = json.loads(resp.read())\n"
        "ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], suppress_origin=True)\n"
        f"ws.send(json.dumps({{'id': 1, 'method': 'Runtime.evaluate', "
        f"'params': {{'expression': {repr(js)}}}}}))\n"
        "r = json.loads(ws.recv())\n"
        "ws.close()\n"
        "result = r.get('result', {}).get('result', {}).get('value', '')\n"
        "result"
    )
    return vm_python(code, timeout=timeout)


def cdp_click(x: int, y: int) -> None:
    """VM経由でCDPクリック"""
    code = (
        "import json, urllib.request, websocket\n"
        "resp = urllib.request.urlopen('http://127.0.0.1:9222/json')\n"
        "tabs = json.loads(resp.read())\n"
        "ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], suppress_origin=True)\n"
        f"for evt in ['mousePressed', 'mouseReleased']:\n"
        f"    ws.send(json.dumps({{'id': 1, 'method': 'Input.dispatchMouseEvent', "
        f"'params': {{'type': evt, 'x': {x}, 'y': {y}, "
        f"'button': 'left', 'clickCount': 1}}}}))\n"
        "    ws.recv()\n"
        "ws.close()\n"
        f"result = 'clicked {x},{y}'\n"
        "result"
    )
    vm_python(code)


def cdp_type_text(text: str) -> None:
    """VM経由でCDPテキスト入力（base64でエスケープ）"""
    b64 = base64.b64encode(text.encode("utf-8")).decode("ascii")
    code = (
        "import json, urllib.request, websocket, base64\n"
        f"text = base64.b64decode('{b64}').decode('utf-8')\n"
        "resp = urllib.request.urlopen('http://127.0.0.1:9222/json')\n"
        "tabs = json.loads(resp.read())\n"
        "ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], suppress_origin=True)\n"
        "ws.send(json.dumps({'id': 1, 'method': 'Input.insertText', "
        "'params': {'text': text}}))\n"
        "ws.recv()\n"
        "ws.close()\n"
        "result = 'typed ' + str(len(text)) + ' chars'\n"
        "result"
    )
    vm_python(code)


# ============================================================
# Debug helpers
# ============================================================

def take_screenshot(name: str) -> None:
    """CDPスクリーンショットを取得して保存（debugモードのみ）

    CDPの Page.captureScreenshot を使用してVrewのレンダラーを直接キャプチャ。
    PyAutoGUIと異なり、他のウィンドウに遮られない。
    """
    if not DEBUG_MODE:
        return

    DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%H%M%S")
    filename = f"{timestamp}_{name}.png"

    # CDP Page.captureScreenshot でVrew内部を直接キャプチャ
    code = (
        "import json, urllib.request, websocket, base64\n"
        "resp = urllib.request.urlopen('http://127.0.0.1:9222/json')\n"
        "tabs = json.loads(resp.read())\n"
        "ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], suppress_origin=True)\n"
        "ws.send(json.dumps({'id': 1, 'method': 'Page.captureScreenshot', "
        "'params': {'format': 'png'}}))\n"
        "r = json.loads(ws.recv())\n"
        "ws.close()\n"
        "result = r.get('result', {}).get('data', '')\n"
        "result"
    )
    img_b64 = vm_python(code, timeout=15)

    if img_b64 and len(str(img_b64)) > 100:
        filepath = DEBUG_DIR / filename
        img_bytes = base64.b64decode(img_b64)
        if img_bytes[:4] == b'\x89PNG':
            filepath.write_bytes(img_bytes)
            print(f"  [DEBUG] CDP screenshot saved: {filepath.name}")
        else:
            print(f"  [DEBUG] CDP screenshot: invalid PNG data, skipped")
    else:
        # フォールバック: PyAutoGUI screenshot via remote_control (raw PNG)
        try:
            url = f"http://{VM_HOST}:{VM_PORT}/screenshot?format=raw"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as resp:
                img_bytes = resp.read()
            if img_bytes[:4] == b'\x89PNG':
                filepath = DEBUG_DIR / filename
                filepath.write_bytes(img_bytes)
                print(f"  [DEBUG] PyAutoGUI screenshot saved: {filepath.name}")
            else:
                print(f"  [DEBUG] Screenshot: invalid PNG data, skipped")
        except Exception as e:
            print(f"  [DEBUG] Screenshot failed: {e}")


def get_page_state() -> dict:
    """現在のVrew画面の状態を取得"""
    js = """(() => {
        const text = document.body.innerText;
        const has = (s) => text.includes(s);
        const hasVideo = !!document.querySelector('video');
        const hasExport = has('書き出し');

        // 新規プロジェクトメニュー（カード形式の選択画面）
        const isNewProject = has('テキストから動画を作成')
            && (has('ビデオ') || has('オーディオ') || has('新規で作成'));

        // エディタ = 動画ありかつ書き出しボタンがある
        const isEditor = hasVideo && hasExport;

        // ホーム画面 = 新規作成ボタンがあるが、エディタではない
        const isHome = has('新規で作成') && !isEditor;

        return JSON.stringify({
            isHome: isHome,
            isNewProject: isNewProject,
            isStyleSelect: has('スタイルを選択'),
            isScriptInput: has('台本の作成') || has('AIで作文')
                || has('台本を入力'),
            isGenSettings: has('画面比率') && has('完了'),
            isConfirmDialog: has('動画作成を始めますか')
                || has('動画を作成しますか'),
            isSaveDialog: has('保存しますか') || has('変更を保存')
                || has('保存されていない') || has('保存せずに'),
            isGenerating: has('生成中') || has('作成中') || has('動画を準備')
                || has('台本を読んでいます') || has('AI音声が台本'),
            isEditor: isEditor,
            isExportDone: has('書き出しが完了しました')
                || has('完了しました'),
            isExportDialog: has('動画を書き出す'),
            diskWarning: has('空き容量が')
        });
    })()"""
    raw = cdp_eval(js)
    try:
        return json.loads(raw) if raw else {}
    except (json.JSONDecodeError, TypeError):
        return {}


# ============================================================
# UI interaction helpers
# ============================================================

def find_element_coords(text_unicode: str, min_y: int = 0,
                        exact: bool = True,
                        max_w: int = 0, max_h: int = 0,
                        selectors: str = '*') -> dict | None:
    """テキストを含む要素の座標を取得（最小面積の要素を選択）

    Args:
        text_unicode: 検索テキスト
        min_y: 最小Y座標
        exact: True=完全一致, False=部分一致
        max_w: 最大幅（0=無制限）
        max_h: 最大高さ（0=無制限）
        selectors: CSSセレクタ
    Returns:
        座標辞書 {x, y, w, h, t} or None
    """
    match_cond = f"t === '{text_unicode}'" if exact else f"t.includes('{text_unicode}')"
    w_cond = f"&& rect.width < {max_w}" if max_w else ""
    h_cond = f"&& rect.height < {max_h}" if max_h else ""
    js = f"""(() => {{
        const all = document.querySelectorAll('{selectors}');
        let best = null;
        let bestArea = Infinity;
        for (const el of all) {{
            const t = el.textContent.trim();
            const rect = el.getBoundingClientRect();
            if ({match_cond} && rect.height > 0 && rect.width > 0
                && rect.y >= {min_y} {w_cond} {h_cond}) {{
                const area = rect.width * rect.height;
                if (area < bestArea) {{
                    best = {{x: rect.x, y: rect.y, w: rect.width,
                             h: rect.height, t: t.substring(0, 30)}};
                    bestArea = area;
                }}
            }}
        }}
        return best ? JSON.stringify(best) : null;
    }})()"""
    raw = cdp_eval(js)
    try:
        return json.loads(raw) if raw else None
    except (json.JSONDecodeError, TypeError):
        return None


def find_and_click(text_unicode: str, min_y: int = 0) -> str:
    """テキストを含む要素を見つけてCDPクリック（el.click()は使わない）"""
    pos = find_element_coords(text_unicode, min_y=min_y, exact=True)
    if pos:
        cx = int(pos["x"] + pos["w"] / 2)
        cy = int(pos["y"] + pos["h"] / 2)
        cdp_click(cx, cy)
        return (f"clicked: {pos['t']} at ({int(pos['x'])},{int(pos['y'])}) "
                f"{int(pos['w'])}x{int(pos['h'])}")
    return f"not found: {text_unicode}"


def find_and_click_button(text: str, min_y: int = 0) -> str:
    """ボタンテキストで検索してCDPクリック（完全一致→部分一致のフォールバック）"""
    pos = find_element_coords(
        text, min_y=min_y, exact=True, max_w=300, max_h=80,
        selectors='button, [role=button], div, span',
    )
    if not pos:
        pos = find_element_coords(
            text, min_y=min_y, exact=False, max_w=300, max_h=80,
            selectors='button, [role=button], div, span',
        )
    if pos:
        cx = int(pos["x"] + pos["w"] / 2)
        cy = int(pos["y"] + pos["h"] / 2)
        cdp_click(cx, cy)
        return (f"clicked: {pos['t']} at ({int(pos['x'])},{int(pos['y'])}) "
                f"{int(pos['w'])}x{int(pos['h'])}")
    return f"not found: {text}"


def close_dialogs() -> None:
    """各種ダイアログを閉じる（保存/復元/警告/エラーダイアログ含む）"""
    # まずエラーダイアログ (D56等) を閉じる
    dismiss_all_error_dialogs(max_attempts=3)
    # 汎用ダイアログを閉じる
    for text in ['閉じる', '今後表示しない', 'OK', 'Close',
                 '保存しない', 'いいえ', 'キャンセル',
                 '削除', '後で']:
        try:
            result = find_and_click(text, min_y=100)
            if 'clicked' in str(result):
                print(f"  Closed dialog: {result}")
                time.sleep(1)
        except Exception:
            pass


def dismiss_error_dialog() -> bool:
    """D56等のエラーダイアログを閉じる。閉じた場合True"""
    js = """(() => {
        const text = document.body.innerText;
        if (text.includes('エラー') && text.includes('エラーコード')) {
            const btns = document.querySelectorAll('button, [role=button], div, span');
            let best = null;
            let bestArea = Infinity;
            for (const btn of btns) {
                const t = btn.textContent.trim();
                const rect = btn.getBoundingClientRect();
                if (t === '確認' && rect.height > 0 && rect.width > 0
                    && rect.y > 200 && rect.width < 200 && rect.height < 60) {
                    const area = rect.width * rect.height;
                    if (area < bestArea) {
                        best = {x: rect.x + rect.width / 2,
                                y: rect.y + rect.height / 2};
                        bestArea = area;
                    }
                }
            }
            return best ? JSON.stringify(best) : '"no_btn"';
        }
        return null;
    })()"""
    raw = cdp_eval(js)
    try:
        pos = json.loads(raw) if raw and raw != 'no_btn' else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos and isinstance(pos, dict):
        cdp_click(int(pos["x"]), int(pos["y"]))
        time.sleep(1)
        return True
    return False


def dismiss_all_error_dialogs(max_attempts: int = 5) -> int:
    """エラーダイアログを繰り返し閉じる。閉じた回数を返す"""
    dismissed = 0
    for _ in range(max_attempts):
        if dismiss_error_dialog():
            dismissed += 1
            time.sleep(1)
        else:
            break
    return dismissed


def dismiss_startup_dialogs() -> None:
    """起動時に表示されるダイアログをすべて閉じる

    対象:
    - エラーダイアログ (D56等)
    - セッション復元ダイアログ（復元/削除/後で）→ 「削除」をクリック
    - ディスク容量警告（×ボタンで閉じる）
    - その他の通知バナー
    """
    # 0. エラーダイアログ (D56等) を先に閉じる
    dismissed = dismiss_all_error_dialogs()
    if dismissed:
        print(f"  Dismissed {dismissed} error dialog(s)")

    # 1. セッション復元ダイアログの処理 → 座標取得してCDPクリック
    js_recovery = """(() => {
        const text = document.body.innerText;
        if (text.includes('作業内容を復元') || text.includes('復元しますか')) {
            const btns = document.querySelectorAll('button, [role=button]');
            for (const btn of btns) {
                const t = btn.textContent.trim();
                const rect = btn.getBoundingClientRect();
                if (t === '削除' && rect.height > 0 && rect.width > 0) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2),
                        t: '削除'
                    });
                }
            }
            for (const btn of btns) {
                const t = btn.textContent.trim();
                const rect = btn.getBoundingClientRect();
                if (t === '後で' && rect.height > 0 && rect.width > 0) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2),
                        t: '後で'
                    });
                }
            }
            return '"recovery_no_btn"';
        }
        return null;
    })()"""
    raw = cdp_eval(js_recovery)
    try:
        pos = json.loads(raw) if raw and raw != 'recovery_no_btn' else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos and isinstance(pos, dict):
        cdp_click(pos["x"], pos["y"])
        print(f"  Recovery dialog: dismissed via {pos['t']} at ({pos['x']},{pos['y']})")
        time.sleep(2)
    elif raw and 'recovery_no_btn' in str(raw):
        print("  Recovery dialog found but no button to click")

    # 2. ディスク容量警告の×ボタンを閉じる → CDPクリック
    js_disk_warn = """(() => {
        const text = document.body.innerText;
        if (text.includes('空き容量') || text.includes('ディスク')) {
            const closes = document.querySelectorAll(
                'button, [role=button], svg, [class*=close], [class*=Close]'
            );
            for (const el of closes) {
                const rect = el.getBoundingClientRect();
                if (rect.x > 500 && rect.y < 200
                    && rect.width < 40 && rect.height < 40
                    && rect.width > 5 && rect.height > 5) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2)
                    });
                }
            }
            const all = document.querySelectorAll('*');
            for (const el of all) {
                const t = el.textContent.trim();
                const rect = el.getBoundingClientRect();
                if ((t === '×' || t === '✕' || t === 'X')
                    && rect.x > 500 && rect.y < 200
                    && rect.height < 40 && rect.height > 5) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2)
                    });
                }
            }
            return '"disk_no_close"';
        }
        return null;
    })()"""
    raw = cdp_eval(js_disk_warn)
    try:
        pos = json.loads(raw) if raw and raw != 'disk_no_close' else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos and isinstance(pos, dict):
        cdp_click(pos["x"], pos["y"])
        print(f"  Disk warning: dismissed at ({pos['x']},{pos['y']})")
        time.sleep(1)
    elif raw and 'disk_no_close' in str(raw):
        print("  Disk warning found but close button not found")

    # 3. 残りの汎用ダイアログを閉じる
    close_dialogs()


def handle_save_dialog(max_attempts: int = 3) -> bool:
    """保存確認ダイアログを検知して「保存しない」をクリック"""
    for attempt in range(max_attempts):
        # 複数のテキストパターンで保存ダイアログを検知
        js_detect = """(() => {
            const text = document.body.innerText;
            const patterns = [
                '保存しますか', '変更を保存', '保存されていない',
                '作業中の内容を保存', '保存せずに'
            ];
            for (const p of patterns) {
                if (text.includes(p)) return 'save_dialog: ' + p;
            }
            return 'no_dialog';
        })()"""
        result = cdp_eval(js_detect)

        if 'no_dialog' in str(result):
            return True  # no dialog to handle

        print(f"  Save dialog detected: {result}")

        # 「保存しない」系のボタンを探してCDPクリック
        js_dismiss = """(() => {
            const btns = document.querySelectorAll('button, [role=button]');
            const dismissTexts = ['保存しない', 'いいえ', 'Don\\'t Save', '破棄'];
            for (const btn of btns) {
                const t = btn.textContent.trim();
                const rect = btn.getBoundingClientRect();
                if (rect.height > 0 && rect.width > 0) {
                    for (const dt of dismissTexts) {
                        if (t === dt || t.includes(dt)) {
                            return JSON.stringify({
                                x: Math.round(rect.x + rect.width / 2),
                                y: Math.round(rect.y + rect.height / 2),
                                t: t
                            });
                        }
                    }
                }
            }
            return null;
        })()"""
        raw = cdp_eval(js_dismiss)
        try:
            pos = json.loads(raw) if raw else None
        except (json.JSONDecodeError, TypeError):
            pos = None
        if pos:
            cdp_click(pos["x"], pos["y"])
            dismiss = f"dismissed: {pos['t']}"
        else:
            dismiss = "no dismiss button found"
        print(f"  Dismiss: {dismiss}")

        if pos:
            time.sleep(2)
            return True

        time.sleep(1)

    return False


def wait_for_state(check_fn, description: str, timeout: int = 30,
                   interval: int = 2) -> bool:
    """指定条件が満たされるまで待機"""
    for i in range(timeout // interval):
        if check_fn():
            return True
        time.sleep(interval)
    print(f"  [WARN] Timeout waiting for: {description}")
    return False


def retry(fn, description: str, max_attempts: int = 3, delay: float = 2) -> bool:
    """関数をリトライ"""
    for attempt in range(max_attempts):
        try:
            result = fn()
            if result:
                return True
        except Exception as e:
            print(f"  [WARN] {description} attempt {attempt + 1} failed: {e}")
        if attempt < max_attempts - 1:
            time.sleep(delay)
    print(f"  [ERROR] {description} failed after {max_attempts} attempts")
    return False


# ============================================================
# 9:16 selection (improved)
# ============================================================

def set_vertical_format() -> str:
    """生成設定画面で9:16縦型を選択（複数戦略）"""

    # Strategy 1: テキスト完全一致で座標取得 → CDPクリック
    js_strategy1 = """(() => {
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const t = el.textContent.trim();
            const rect = el.getBoundingClientRect();
            if ((t === '9:16' || t === '9：16') && rect.height > 0
                && rect.width > 0 && rect.width < 100) {
                return JSON.stringify({
                    x: Math.round(rect.x + rect.width / 2),
                    y: Math.round(rect.y + rect.height / 2),
                    w: Math.round(rect.width),
                    h: Math.round(rect.height)
                });
            }
        }
        return null;
    })()"""
    raw = cdp_eval(js_strategy1)
    try:
        pos = json.loads(raw) if raw else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos:
        cdp_click(pos["x"], pos["y"])
        result = (f"strategy1: clicked 9:16 at ({pos['x']},{pos['y']}) "
                  f"{pos['w']}x{pos['h']}")
        return result

    # Strategy 2: label/input の関連でラジオボタンを探す → CDPクリック
    js_strategy2 = """(() => {
        const labels = document.querySelectorAll('label, [class*=ratio], [class*=Ratio]');
        for (const el of labels) {
            const t = el.textContent.trim();
            if (t.includes('9:16') || t.includes('9：16')) {
                const rect = el.getBoundingClientRect();
                if (rect.height > 0 && rect.width > 0) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2)
                    });
                }
            }
        }
        return null;
    })()"""
    raw = cdp_eval(js_strategy2)
    try:
        pos = json.loads(raw) if raw else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos:
        cdp_click(pos["x"], pos["y"])
        result = f"strategy2: clicked label at ({pos['x']},{pos['y']})"
        return result

    # Strategy 3: 「画面比率」セクション内の2番目の選択肢 → CDPクリック
    js_strategy3 = """(() => {
        const all = document.querySelectorAll('*');
        let ratioSection = null;
        for (const el of all) {
            if (el.textContent.trim().startsWith('画面比率')) {
                ratioSection = el.parentElement;
                break;
            }
        }
        if (!ratioSection) return null;

        const items = ratioSection.querySelectorAll(
            'label, button, [role=radio], div[class*=item], div[class*=option], span'
        );
        let clickTargets = [];
        for (const item of items) {
            const rect = item.getBoundingClientRect();
            const t = item.textContent.trim();
            if (rect.width > 20 && rect.width < 80 && rect.height > 15
                && rect.height < 50 && t.match(/^\\d+[：:]\\d+$/)) {
                clickTargets.push({text: t,
                    x: Math.round(rect.x + rect.width / 2),
                    y: Math.round(rect.y + rect.height / 2)});
            }
        }
        for (const target of clickTargets) {
            if (target.text.includes('9')) {
                return JSON.stringify(target);
            }
        }
        return null;
    })()"""
    raw = cdp_eval(js_strategy3)
    try:
        pos = json.loads(raw) if raw else None
    except (json.JSONDecodeError, TypeError):
        pos = None
    if pos:
        cdp_click(pos["x"], pos["y"])
        result = f"strategy3: clicked {pos.get('text','')} at ({pos['x']},{pos['y']})"
        return result

    # Strategy 4: 座標フォールバック (v5_05スクリーンショットから推定)
    # 16:9の右隣が9:16（約x=145, y=190 in settings panel area）
    print("  [WARN] Using coordinate fallback for 9:16")
    result = cdp_eval("""(() => {
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const t = el.textContent.trim();
            if (t === '16:9' || t === '16：9') {
                const rect = el.getBoundingClientRect();
                if (rect.width < 80 && rect.height > 0) {
                    return JSON.stringify({x: Math.round(rect.x + rect.width + 20),
                        y: Math.round(rect.y + rect.height / 2)});
                }
            }
        }
        return null;
    })()""")
    try:
        pos = json.loads(result) if result else None
    except (json.JSONDecodeError, TypeError):
        pos = None

    if pos:
        cdp_click(pos["x"], pos["y"])
        return f"strategy4: clicked right of 16:9 at ({pos['x']},{pos['y']})"

    return "all strategies failed"


# ============================================================
# Export helpers
# ============================================================

def list_vm_files(directory: str, pattern: str = "*.mp4") -> list:
    """VM上の指定ディレクトリのファイル一覧を取得"""
    code = (
        "import glob, os, json\n"
        f"files = glob.glob(os.path.join(r'{directory}', '{pattern}'))\n"
        "info = []\n"
        "for f in files:\n"
        "    stat = os.stat(f)\n"
        "    info.append({'path': f, 'size': stat.st_size, 'mtime': stat.st_mtime})\n"
        "result = json.dumps(info)\n"
        "result"
    )
    raw = vm_python(code, timeout=10)
    try:
        return json.loads(raw) if raw else []
    except (json.JSONDecodeError, TypeError):
        return []


def rename_vm_file(old_path: str, new_name: str) -> str:
    """VM上のファイルをリネーム"""
    safe_name = re.sub(r'[\\/:*?"<>|]', '', new_name)
    safe_name = safe_name.replace('【', '').replace('】', '')
    if len(safe_name) > 80:
        safe_name = safe_name[:80]
    if not safe_name.endswith('.mp4'):
        safe_name += '.mp4'

    b64_old = base64.b64encode(old_path.encode("utf-8")).decode("ascii")
    b64_new = base64.b64encode(safe_name.encode("utf-8")).decode("ascii")
    code = (
        "import os, base64\n"
        f"old = base64.b64decode('{b64_old}').decode('utf-8')\n"
        f"new_name = base64.b64decode('{b64_new}').decode('utf-8')\n"
        "new_path = os.path.join(os.path.dirname(old), new_name)\n"
        "if os.path.exists(old):\n"
        "    os.rename(old, new_path)\n"
        "    result = 'renamed to: ' + new_name\n"
        "else:\n"
        "    result = 'file not found: ' + old\n"
        "result"
    )
    return vm_python(code, timeout=10)


def find_new_export_file(files_before: list) -> str:
    """エクスポート前後のファイル比較で新しいファイルを特定"""
    files_after = list_vm_files(VREW_OUTPUT_DIR)
    paths_before = {f["path"] for f in files_before}

    new_files = [f for f in files_after if f["path"] not in paths_before]
    if new_files:
        newest = max(new_files, key=lambda f: f["mtime"])
        return newest["path"]

    # メインディレクトリで見つからない場合、最新の変更ファイルを確認
    if files_after:
        newest = max(files_after, key=lambda f: f["mtime"])
        if not files_before or newest["mtime"] > max(f["mtime"] for f in files_before):
            return newest["path"]

    # フォールバック: 複数ディレクトリを検索（直近5分以内のmp4）
    fallback_code = (
        "import os, glob, json, time\n"
        "now = time.time()\n"
        "search_dirs = [\n"
        "    os.path.expanduser('~/OneDrive/ドキュメント'),\n"
        "    os.path.expanduser('~/Documents'),\n"
        "    os.path.expanduser('~/Videos'),\n"
        "    os.path.expanduser('~/Desktop'),\n"
        "]\n"
        "found = []\n"
        "for d in search_dirs:\n"
        "    if os.path.exists(d):\n"
        "        for f in glob.glob(os.path.join(d, '*.mp4')):\n"
        "            st = os.stat(f)\n"
        "            if now - st.st_mtime < 300:\n"
        "                found.append({'path': f, 'mtime': st.st_mtime})\n"
        "result = json.dumps(found)\n"
        "result"
    )
    raw = vm_python(fallback_code, timeout=15)
    try:
        fallback_files = json.loads(raw) if raw else []
    except (json.JSONDecodeError, TypeError):
        fallback_files = []
    if fallback_files:
        newest = max(fallback_files, key=lambda f: f["mtime"])
        print(f"  Fallback: found {newest['path']}")
        return newest["path"]

    return ""


# ============================================================
# Video generation flow
# ============================================================

def reset_to_home() -> bool:
    """Vrewをホーム画面に戻す"""
    print("  Resetting to home screen...")
    dismiss_startup_dialogs()
    time.sleep(1)

    state = get_page_state()
    if state.get("isHome") or state.get("isNewProject"):
        return True

    # Escapeで閉じてみる
    vm_request("key", {"key": "escape"})
    time.sleep(1)
    close_dialogs()
    time.sleep(1)

    state = get_page_state()
    return bool(state.get("isHome") or state.get("isEditor"))


def generate_video(title: str, script: str, video_num: int = 1) -> bool:
    """
    VM上でVrewを使って動画を生成・書き出しする

    Args:
        title: 動画タイトル（ファイル名にも使用）
        script: 台本テキスト
        video_num: バッチ内の通し番号

    Returns:
        bool: 成功したかどうか
    """
    print(f"\n{'=' * 60}")
    print(f"[Video {video_num}] {title}")
    print(f"Script: {len(script)} chars")
    print(f"{'=' * 60}")

    # ============ Step 1: ダイアログを閉じる ============
    print("\n[Step 1] Closing any dialogs...")
    dismiss_startup_dialogs()
    time.sleep(1)
    take_screenshot(f"v{video_num}_01_start")

    # ============ Step 2: 新規で作成をクリック ============
    print("\n[Step 2] Clicking 'New Project'...")

    # ホーム画面の場合: 中央の大きなカードをクリック（CDPマウスイベント使用）
    state = get_page_state()
    if state.get("isHome"):
        # カードの中心座標を取得してCDPマウスクリックで送信
        # 注意: 親コンテナ(両カード含む)ではなく、最も小さいマッチ要素を選択
        js_home_card = """(() => {
            const all = document.querySelectorAll('*');
            let best = null;
            let bestArea = Infinity;
            for (const el of all) {
                const t = el.textContent.trim();
                const rect = el.getBoundingClientRect();
                if (t.includes('新規で作成') && !t.includes('プロジェクトを開く')
                    && rect.height > 100 && rect.width > 100 && rect.y > 150) {
                    const area = rect.width * rect.height;
                    if (area < bestArea) {
                        best = rect;
                        bestArea = area;
                    }
                }
            }
            if (best) {
                return JSON.stringify({
                    x: Math.round(best.x + best.width / 2),
                    y: Math.round(best.y + best.height / 2),
                    w: Math.round(best.width),
                    h: Math.round(best.height)
                });
            }
            return null;
        })()"""
        card_pos = cdp_eval(js_home_card)
        try:
            pos = json.loads(card_pos) if card_pos else None
        except (json.JSONDecodeError, TypeError):
            pos = None

        if pos:
            cdp_click(pos["x"], pos["y"])
            result = (f"CDP clicked home card center at ({pos['x']},{pos['y']}) "
                      f"{pos['w']}x{pos['h']}")
        else:
            # 最終フォールバック: 画面中央左のカード位置
            cdp_click(345, 380)
            result = "CDP clicked fallback (345,380)"
    else:
        # エディタ画面の場合: ツールバーボタンをクリック
        result = find_and_click_button('新規で作成')
        if 'not found' in str(result):
            cdp_click(58, 79)

    print(f"  Result: {result}")
    time.sleep(2)

    # 保存確認ダイアログを処理（既存プロジェクトがある場合）
    print("  Checking for save dialog...")
    if not handle_save_dialog():
        print("  [ERROR] Could not dismiss save dialog")
        take_screenshot(f"v{video_num}_02_save_dialog_stuck")
        return False

    time.sleep(2)
    take_screenshot(f"v{video_num}_02_new")

    # ============ Step 3: テキストから動画を作成 ============
    print("\n[Step 3] Clicking 'Text to Video'...")

    # 新規プロジェクト画面が表示されるまで待機
    found_new_project = wait_for_state(
        lambda: get_page_state().get("isNewProject")
                or get_page_state().get("isStyleSelect"),
        "new project screen",
        timeout=8,
    )

    if not found_new_project:
        # もう一度保存ダイアログチェック
        handle_save_dialog()
        time.sleep(2)
        found_new_project = wait_for_state(
            lambda: get_page_state().get("isNewProject")
                    or get_page_state().get("isStyleSelect"),
            "new project screen (retry)",
            timeout=5,
        )

    if not found_new_project:
        print("  [ERROR] Failed to reach new project screen")
        take_screenshot(f"v{video_num}_03_stuck")
        return False

    # テキストから動画を作成カードの座標を取得してCDPクリック
    # el.click()はElectronで効かないためCDPマウスイベントを使用
    js_text_to_video = """(() => {
        const all = document.querySelectorAll('*');
        let best = null;
        let bestArea = Infinity;
        // 最も小さい「テキストから動画を作成」要素を探す（カード本体）
        for (const el of all) {
            const t = el.textContent.trim();
            const rect = el.getBoundingClientRect();
            if (t === 'テキストから動画を作成'
                && rect.height > 20 && rect.width > 50
                && rect.y > 100) {
                const area = rect.width * rect.height;
                if (area < bestArea) {
                    best = {x: rect.x, y: rect.y, w: rect.width, h: rect.height};
                    bestArea = area;
                }
            }
        }
        // fallback: 部分一致で最小要素
        if (!best) {
            for (const el of all) {
                const t = el.textContent.trim();
                const rect = el.getBoundingClientRect();
                if (t.includes('テキストから動画を作成')
                    && rect.height > 30 && rect.height < 300
                    && rect.width > 80 && rect.width < 400
                    && rect.y > 100) {
                    const area = rect.width * rect.height;
                    if (area < bestArea) {
                        best = {x: rect.x, y: rect.y, w: rect.width, h: rect.height};
                        bestArea = area;
                    }
                }
            }
        }
        if (best) {
            return JSON.stringify({
                x: Math.round(best.x + best.w / 2),
                y: Math.round(best.y + best.h / 2),
                w: Math.round(best.w),
                h: Math.round(best.h)
            });
        }
        return null;
    })()"""
    card_pos = cdp_eval(js_text_to_video)
    try:
        pos = json.loads(card_pos) if card_pos else None
    except (json.JSONDecodeError, TypeError):
        pos = None

    if pos:
        cdp_click(pos["x"], pos["y"])
        result = (f"CDP clicked テキストから動画を作成 at ({pos['x']},{pos['y']}) "
                  f"{pos['w']}x{pos['h']}")
    else:
        # フォールバック座標クリック（中央カードの推定位置）
        cdp_click(490, 390)
        result = "CDP clicked fallback (490,390)"
    print(f"  Result: {result}")

    time.sleep(3)

    # テキストから動画を作成クリック後に保存ダイアログが出る場合がある
    if not handle_save_dialog():
        print("  [WARN] Save dialog handling issue after text-to-video click")
    time.sleep(2)

    take_screenshot(f"v{video_num}_03_text_to_video")

    # ============ Step 4: スタイル選択で「次へ」============
    print("\n[Step 4] Style selection - clicking 'Next'...")

    # スタイル選択画面が表示されるまで待機
    found_style = wait_for_state(
        lambda: get_page_state().get("isStyleSelect"),
        "style selection screen",
        timeout=15,
    )

    if not found_style:
        print("  [WARN] Style screen not detected, checking state...")
        state = get_page_state()
        print(f"  State: {json.dumps(state)}")

        # 保存ダイアログがまだ出ているか確認
        if state.get("isSaveDialog"):
            print("  Save dialog still present, handling...")
            handle_save_dialog()
            time.sleep(3)
            found_style = wait_for_state(
                lambda: get_page_state().get("isStyleSelect"),
                "style selection screen (after save)",
                timeout=10,
            )

        # スクリプト入力画面なら既にスキップ済み
        if not found_style and not state.get("isScriptInput"):
            print("  [ERROR] Not on style or script screen, aborting")
            take_screenshot(f"v{video_num}_04_stuck")
            return False

    result = find_and_click_button('次へ')
    if 'not found' in str(result):
        cdp_click(880, 600)
    print(f"  Result: {result}")
    time.sleep(3)
    take_screenshot(f"v{video_num}_04_style_next")

    # ============ Step 5: 台本入力 ============
    print("\n[Step 5] Entering script...")

    # 台本入力画面が表示されるまで待機
    found_script = wait_for_state(
        lambda: get_page_state().get("isScriptInput"),
        "script input screen",
        timeout=15,
    )

    if not found_script:
        print("  [ERROR] Script input screen not found, aborting")
        take_screenshot(f"v{video_num}_05_stuck")
        return False

    # 右側の大きなtextarea（台本直接入力エリア）にフォーカス
    js_focus = """(() => {
        const textareas = document.querySelectorAll('textarea');
        let best = null;
        let bestArea = 0;
        for (const ta of textareas) {
            const rect = ta.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > bestArea && rect.width > 200) {
                best = ta;
                bestArea = area;
            }
        }
        if (best) {
            best.focus();
            best.click();
            best.value = '';
            best.dispatchEvent(new Event('input', {bubbles: true}));
            const rect = best.getBoundingClientRect();
            return 'focused textarea ' + Math.round(rect.width) + 'x'
                + Math.round(rect.height) + ' at ('
                + Math.round(rect.x) + ',' + Math.round(rect.y) + ')';
        }
        // contenteditable divを試す
        const editables = document.querySelectorAll('[contenteditable=true]');
        for (const ed of editables) {
            const rect = ed.getBoundingClientRect();
            if (rect.width > 200 && rect.height > 100) {
                ed.focus();
                ed.click();
                return 'focused editable ' + Math.round(rect.width) + 'x'
                    + Math.round(rect.height) + ' at ('
                    + Math.round(rect.x) + ',' + Math.round(rect.y) + ')';
            }
        }
        return 'no textarea found';
    })()"""
    result = cdp_eval(js_focus)
    print(f"  Focus: {result}")
    time.sleep(0.5)

    if 'no textarea' in str(result):
        cdp_click(680, 350)
        time.sleep(0.5)

    cdp_type_text(script)
    print(f"  Typed {len(script)} chars")
    time.sleep(1)
    take_screenshot(f"v{video_num}_05_script")

    # ============ Step 6: 次へ（生成設定画面へ）============
    print("\n[Step 6] Clicking 'Next' to generation settings...")
    result = find_and_click_button('次へ')
    if 'not found' in str(result):
        cdp_click(880, 600)
    print(f"  Result: {result}")
    time.sleep(3)
    take_screenshot(f"v{video_num}_06_settings")

    # ============ Step 7: 9:16縦型を選択 ============
    print("\n[Step 7] Selecting 9:16 vertical format...")

    # 生成設定画面が表示されるまで待機
    wait_for_state(
        lambda: get_page_state().get("isGenSettings"),
        "generation settings screen",
        timeout=10,
    )

    result = set_vertical_format()
    print(f"  Format: {result}")
    time.sleep(1)

    # 選択結果を検証
    js_verify = """(() => {
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const t = el.textContent.trim();
            if ((t === '9:16' || t === '9：16') && el.offsetWidth > 0) {
                const style = window.getComputedStyle(el.parentElement || el);
                const bg = style.backgroundColor;
                const border = style.borderColor;
                return 'found 9:16, bg=' + bg + ', border=' + border;
            }
        }
        return 'verification failed';
    })()"""
    verify = cdp_eval(js_verify)
    print(f"  Verify: {verify}")
    take_screenshot(f"v{video_num}_07_format")

    # ============ Step 7.5: 字幕の長さを「長く」に設定 ============
    print("\n[Step 7.5] Setting subtitle length to 'long'...")
    js_subtitle_long = """(() => {
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const t = el.textContent.trim();
            if (t === '長く') {
                const rect = el.getBoundingClientRect();
                if (rect.height > 0 && rect.width > 0 && rect.width < 100 && rect.height < 50) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2),
                        w: Math.round(rect.width),
                        h: Math.round(rect.height)
                    });
                }
            }
        }
        return null;
    })()"""
    raw = cdp_eval(js_subtitle_long)
    try:
        sub_pos = json.loads(raw) if raw else None
    except (json.JSONDecodeError, TypeError):
        sub_pos = None
    if sub_pos:
        cdp_click(sub_pos["x"], sub_pos["y"])
        print(f"  Clicked '長く' at ({sub_pos['x']},{sub_pos['y']}) {sub_pos['w']}x{sub_pos['h']}")
    else:
        # フォールバック: find_and_click_button
        result = find_and_click_button('長く')
        print(f"  Fallback: {result}")
    time.sleep(1)
    take_screenshot(f"v{video_num}_07b_subtitle")

    # ============ Step 8: 完了をクリック ============
    print("\n[Step 8] Clicking 'Complete'...")
    result = find_and_click_button('完了', min_y=400)
    if 'not found' in str(result):
        # フォールバック: 右下の完了/次へボタン位置
        cdp_click(880, 599)
    print(f"  Result: {result}")
    time.sleep(3)
    take_screenshot(f"v{video_num}_08_complete")

    # ============ Step 9: 確認ダイアログ ============
    print("\n[Step 9] Handling confirmation dialog...")

    wait_for_state(
        lambda: get_page_state().get("isConfirmDialog"),
        "confirmation dialog",
        timeout=10,
    )

    result = find_and_click_button('確認', min_y=200)
    if 'not found' in str(result):
        # フォールバック: ダイアログ中央のボタン座標取得 → CDPクリック
        js_confirm = """(() => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
                const t = btn.textContent.trim();
                const rect = btn.getBoundingClientRect();
                if (t === '確認' && rect.y > 200 && rect.height > 20
                    && rect.width > 50 && rect.width < 200) {
                    return JSON.stringify({
                        x: Math.round(rect.x + rect.width / 2),
                        y: Math.round(rect.y + rect.height / 2)
                    });
                }
            }
            return null;
        })()"""
        raw = cdp_eval(js_confirm)
        try:
            pos = json.loads(raw) if raw else None
        except (json.JSONDecodeError, TypeError):
            pos = None
        if pos:
            cdp_click(pos["x"], pos["y"])
            result = f"clicked confirm at ({pos['x']},{pos['y']})"
        else:
            result = "confirm button not found"
    print(f"  Confirm: {result}")
    time.sleep(3)
    take_screenshot(f"v{video_num}_09_confirmed")

    # ============ Step 10: 生成完了を待機 ============
    print("\n[Step 10] Waiting for generation (up to 10 min)...")
    gen_start = time.time()
    generation_complete = False
    generation_started = False

    for i in range(60):
        time.sleep(10)
        elapsed = int(time.time() - gen_start)

        check_video = cdp_eval(
            "document.querySelector('video') ? 'has_video' : 'no_video'"
        )
        check_progress = cdp_eval(
            "(() => {"
            "  const t = document.body.innerText;"
            "  if (t.includes('生成中')) return 'generating';"
            "  if (t.includes('作成中')) return 'creating';"
            "  if (t.includes('動画を準備')) return 'preparing';"
            "  if (t.includes('台本を読んでいます')) return 'reading_script';"
            "  if (t.includes('AI音声が台本')) return 'ai_voice_script';"
            "  if (t.includes('読み込み中')) return 'loading';"
            "  if (t.includes('ダウンロード中')) return 'downloading';"
            "  if (t.includes('変換中')) return 'converting';"
            "  if (t.includes('画像を生成')) return 'generating_images';"
            "  if (t.includes('ご存じでしたか')) return 'generating_tips';"
            "  return 'idle';"
            "})()"
        )
        print(f"  [{elapsed}s] video={check_video}, status={check_progress}")

        # エラーダイアログが表示された場合は閉じる
        if dismiss_error_dialog():
            print(f"  [WARN] Error dialog detected, dismissed")
            time.sleep(1)

        # 生成が開始されたことを検知
        if str(check_progress) not in ('idle', ''):
            generation_started = True

        # まだ生成中なら完了判定しない
        still_generating = str(check_progress) in (
            'generating', 'creating', 'preparing', 'reading_script',
            'ai_voice_script', 'loading', 'downloading', 'converting',
            'generating_images', 'generating_tips'
        )
        if still_generating:
            continue

        # 生成完了条件：生成中ステータスが消えてエディタ画面になった
        state = get_page_state()
        if state.get("isEditor"):
            if generation_started or elapsed > 10:
                print("  Generation complete! (editor detected)")
                generation_complete = True
                break

        # 最初の90秒以内に何も始まらなければエラー
        if elapsed > 90 and not generation_started and not state.get("isEditor"):
            print("  [ERROR] Generation did not start")
            take_screenshot(f"v{video_num}_10_gen_not_started")
            return False

    if not generation_complete:
        print("  [ERROR] Generation timeout!")
        take_screenshot(f"v{video_num}_10_gen_timeout")
        return False

    time.sleep(3)
    take_screenshot(f"v{video_num}_10_generated")

    # ============ Step 11: 書き出し ============
    print("\n[Step 11] Starting export...")

    # まずエラーダイアログを全て閉じる（D56等が生成後に出ることが多い）
    dismissed = dismiss_all_error_dialogs()
    if dismissed:
        print(f"  Dismissed {dismissed} error dialog(s) before export")
    time.sleep(1)

    # エクスポート前のファイル一覧を取得
    files_before = list_vm_files(VREW_OUTPUT_DIR)
    print(f"  Files before export: {len(files_before)}")

    # --- エクスポートメニュー → MP4選択 → 書き出しボタン（リトライ付き） ---
    export_started = False
    for attempt in range(3):
        if attempt > 0:
            print(f"  [Retry {attempt}] Retrying export flow...")
            dismissed = dismiss_all_error_dialogs()
            if dismissed:
                print(f"  Dismissed {dismissed} error dialog(s)")
            time.sleep(2)

        # 書き出しメニューボタン → CDPクリック（ツールバーの書き出しボタン）
        # 最小の要素（SPANテキスト）を優先して検出
        pos = find_element_coords('書き出し', min_y=0, exact=True,
                                  max_w=100, max_h=30)
        if not pos:
            # フォールバック: より大きい要素も許可
            pos = find_element_coords('書き出し', min_y=0, exact=True,
                                      max_w=200, max_h=100)
        if pos:
            cx = int(pos["x"] + pos["w"] / 2)
            cy = int(pos["y"] + pos["h"] / 2)
            cdp_click(cx, cy)
            print(f"  Export menu: clicked at ({cx},{cy})")
        else:
            print("  Export menu: not found")
            continue
        time.sleep(3)  # トースト通知が消えるまで待機

        # エラーダイアログが出たら閉じて再試行
        if dismiss_error_dialog():
            print("  Error dialog appeared after menu click, dismissed")
            time.sleep(1)
            continue

        # MP4を選択（mp4, 動画ファイル, video等に対応）
        js_mp4 = """(() => {
            const all = document.querySelectorAll('*');
            let best = null;
            let bestArea = Infinity;
            for (const el of all) {
                const t = el.textContent.trim();
                const tl = t.toLowerCase();
                const rect = el.getBoundingClientRect();
                const match = (tl.includes('mp4') || t.includes('動画ファイル')
                    || t.includes('動画として'));
                if (match && rect.height > 15 && rect.height < 80
                    && rect.width > 50 && rect.y > 60 && rect.width < 400) {
                    const area = rect.width * rect.height;
                    if (area < bestArea) {
                        best = {x: rect.x + rect.width / 2,
                                y: rect.y + rect.height / 2,
                                w: rect.width, h: rect.height, t: t.substring(0, 40)};
                        bestArea = area;
                    }
                }
            }
            return best ? JSON.stringify(best) : null;
        })()"""
        raw = cdp_eval(js_mp4)
        try:
            mp4_pos = json.loads(raw) if raw else None
        except (json.JSONDecodeError, TypeError):
            mp4_pos = None

        if mp4_pos:
            cdp_click(int(mp4_pos["x"]), int(mp4_pos["y"]))
            label = mp4_pos.get("t", "mp4")
            print(f"  MP4: clicked '{label}' at ({int(mp4_pos['x'])},{int(mp4_pos['y'])})")
            time.sleep(3)
        else:
            print("  MP4: not found in dropdown (may be direct export)")
            take_screenshot(f"v{video_num}_11_after_export_click_attempt{attempt}")
            # ドロップダウンが出ない場合 = 直接ダイアログが開いた可能性
            # 書き出しダイアログがあるかチェック
            time.sleep(2)

        # エラーダイアログが出たら閉じて再試行
        if dismiss_error_dialog():
            print("  Error dialog appeared, dismissed")
            time.sleep(1)
            continue

        take_screenshot(f"v{video_num}_11_export_dialog")

        # 書き出しダイアログの「書き出し」ボタン → CDPクリック
        # (y > 200のボタンのみ = ダイアログ内のボタン、ツールバーではない)
        pos = find_element_coords('書き出し', min_y=200, exact=True,
                                  max_w=200, max_h=60,
                                  selectors='button, [role=button]')
        if not pos:
            # 「書き出す」「エクスポート」「Export」等も試す
            for alt_text in ['書き出す', 'エクスポート', 'Export']:
                pos = find_element_coords(alt_text, min_y=200, exact=True,
                                          max_w=200, max_h=60,
                                          selectors='button, [role=button]')
                if pos:
                    break
        if pos:
            cx = int(pos["x"] + pos["w"] / 2)
            cy = int(pos["y"] + pos["h"] / 2)
            cdp_click(cx, cy)
            print(f"  Export button: clicked at ({cx},{cy})")
            export_started = True
        else:
            print("  Export button: not found in dialog")
            take_screenshot(f"v{video_num}_11_no_export_btn_attempt{attempt}")
            # Escで閉じてリトライ
            vm_request("key", {"key": "escape"})
            time.sleep(1)
            continue
        time.sleep(3)

        # Windows保存ダイアログが出た場合はPyAutoGUIでEnterを送信
        # (CDP keyイベントはネイティブWindowsダイアログに届かないためPyAutoGUI使用)
        time.sleep(2)
        vm_python('import pyautogui, time; time.sleep(1); pyautogui.press("enter"); time.sleep(0.5)')
        time.sleep(2)
        break

    if not export_started:
        print("  [ERROR] Could not start export after 3 attempts")
        take_screenshot(f"v{video_num}_11_export_failed")
        return False

    # ============ Step 12: 書き出し完了を待機 ============
    print("\n[Step 12] Waiting for export to complete (up to 12 min)...")
    export_complete = False
    export_start = time.time()

    for i in range(72):
        time.sleep(10)
        elapsed = int(time.time() - export_start)

        # エラーダイアログが出たら閉じる
        if dismiss_error_dialog():
            print(f"  [{elapsed}s] Dismissed error dialog during export")

        # エクスポート状態チェック（複数パターン対応）
        result = cdp_eval(
            "(() => {"
            "  const t = document.body.innerText;"
            "  if (t.includes('完了しました')) return 'done';"
            "  if (t.includes('書き出し完了')) return 'done';"
            "  if (t.includes('エクスポート完了')) return 'done';"
            "  const pct = t.match(/(\\d+)\\s*%/);"
            "  if (pct) return 'progress_' + pct[1];"
            "  return 'waiting';"
            "})()"
        )
        print(f"  [{elapsed}s] export: {result}")

        if 'done' in str(result):
            print("  Export complete!")
            export_complete = True
            break

    if not export_complete:
        print("  [ERROR] Export timeout!")
        take_screenshot(f"v{video_num}_12_export_timeout")
        return False

    take_screenshot(f"v{video_num}_12_export_done")

    # ============ Step 13: ファイルリネーム ============
    print("\n[Step 13] Renaming exported file...")
    time.sleep(2)

    exported_file = find_new_export_file(files_before)
    if exported_file:
        print(f"  Found: {exported_file}")
        rename_result = rename_vm_file(exported_file, title)
        print(f"  Rename: {rename_result}")
    else:
        print("  [WARN] Could not find exported file to rename")

    # ============ Step 14: 完了ダイアログを閉じる ============
    print("\n[Step 14] Closing completion dialog...")
    find_and_click('閉じる')
    time.sleep(2)
    close_dialogs()
    take_screenshot(f"v{video_num}_14_done")

    print(f"\n{'=' * 60}")
    print(f"[Video {video_num}] '{title}' - DONE")
    print(f"{'=' * 60}")
    return True


# ============================================================
# Main
# ============================================================

def main():
    global DEBUG_MODE, VM_BASE_URL, VREW_OUTPUT_DIR

    parser = argparse.ArgumentParser(description="VM上でMBTI動画を自動生成 (v2)")
    parser.add_argument("--type", "-t", help="MBTIタイプ (e.g., INTJ)")
    parser.add_argument("--category", "-c", help="カテゴリ (e.g., love)")
    parser.add_argument("--input", "-i", help="JSONファイルから台本を読み込み")
    parser.add_argument("--limit", "-l", type=int, default=1, help="生成数の上限")
    parser.add_argument("--title", help="直接タイトルを指定")
    parser.add_argument("--script", help="直接台本を指定")
    parser.add_argument("--debug", action="store_true",
                        help="デバッグモード（各ステップでスクリーンショット保存）")
    parser.add_argument("--host", default=VM_HOST, help="VM IP address")
    parser.add_argument("--port", type=int, default=VM_PORT, help="VM port")
    parser.add_argument("--output-dir", default=VREW_OUTPUT_DIR,
                        help="Vrew output directory on VM")

    args = parser.parse_args()

    # グローバル設定の更新
    VM_BASE_URL = f"http://{args.host}:{args.port}"
    VREW_OUTPUT_DIR = args.output_dir
    DEBUG_MODE = args.debug

    if DEBUG_MODE:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[DEBUG] Screenshots will be saved to: {DEBUG_DIR}")

    scripts_to_process = []

    if args.title and args.script:
        scripts_to_process = [{"title": args.title, "script": args.script}]

    elif args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            scripts_to_process = json.load(f)

    elif args.type:
        sys.path.insert(0, str(Path(__file__).parent))
        from mbti_script_generator import generate_script, generate_all_for_type

        mbti_type = args.type.upper()
        if args.category:
            result = generate_script(mbti_type, args.category)
            if result:
                scripts_to_process = [result]
        else:
            scripts_to_process = generate_all_for_type(mbti_type)

    else:
        parser.print_help()
        print("\nExamples:")
        print("  python scripts/create_video_on_vm.py --type INTJ --category love --debug")
        print("  python scripts/create_video_on_vm.py --input scripts/test_intj.json --limit 5")
        return 0

    if not scripts_to_process:
        print("No scripts to process.")
        return 1

    scripts_to_process = scripts_to_process[:args.limit]

    print(f"\n{'=' * 60}")
    print(f"AutoVideoGen v2 - Processing {len(scripts_to_process)} video(s)")
    print(f"VM: {args.host}:{args.port}")
    print(f"Debug: {'ON' if DEBUG_MODE else 'OFF'}")
    print(f"{'=' * 60}")

    # VM接続確認
    print("\nChecking VM connection...")
    try:
        status = vm_request("status", method="GET", timeout=5)
        if status.get("status") == "running":
            print(f"  VM OK: {status.get('hostname', 'unknown')}")
        else:
            print(f"  VM status: {status}")
            return 1
    except Exception as e:
        print(f"  VM connection failed: {e}")
        print(f"  Ensure remote_control.py is running on {args.host}:{args.port}")
        return 1

    # CDP接続確認
    print("Checking Vrew CDP connection...")
    cdp_check = vm_python(
        "import urllib.request, json\n"
        "try:\n"
        "    r = urllib.request.urlopen('http://127.0.0.1:9222/json', timeout=3)\n"
        "    tabs = json.loads(r.read())\n"
        "    result = 'CDP OK: ' + str(len(tabs)) + ' tabs'\n"
        "except Exception as e:\n"
        "    result = 'CDP FAIL: ' + str(e)\n"
        "result",
        timeout=10,
    )
    print(f"  {cdp_check}")
    if "FAIL" in str(cdp_check):
        print("  Ensure Vrew is running with --remote-debugging-port=9222")
        return 1

    # 起動時ダイアログを閉じる
    print("Dismissing startup dialogs...")
    dismiss_startup_dialogs()
    time.sleep(2)

    # 初期状態チェック
    state = get_page_state()
    print(f"  Page state: {json.dumps(state, indent=2)}")

    completed = 0
    failed = 0
    results = []

    for i, s in enumerate(scripts_to_process):
        video_num = i + 1
        print(f"\n{'#' * 60}")
        print(f"# Video {video_num}/{len(scripts_to_process)}")
        print(f"{'#' * 60}")

        try:
            success = generate_video(s["title"], s["script"], video_num=video_num)
        except Exception as e:
            print(f"  [ERROR] Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            success = False

        results.append({
            "title": s["title"],
            "success": success,
            "video_num": video_num,
        })

        if success:
            completed += 1
        else:
            failed += 1
            # バッチモード: 失敗時にリカバリーを試みて次の動画へ
            if len(scripts_to_process) > 1:
                print("\n[Recovery] Attempting to reset for next video...")
                reset_to_home()
                time.sleep(3)

    # 結果サマリー
    print(f"\n{'=' * 60}")
    print(f"RESULTS: {completed} completed, {failed} failed "
          f"/ {len(scripts_to_process)} total")
    print(f"{'=' * 60}")
    for r in results:
        status_icon = "OK" if r["success"] else "FAIL"
        print(f"  [{status_icon}] #{r['video_num']}: {r['title']}")

    if DEBUG_MODE:
        print(f"\nDebug screenshots: {DEBUG_DIR}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
