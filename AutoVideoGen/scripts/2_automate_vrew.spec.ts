import { test, expect } from '@playwright/test';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Type definitions
interface VideoRecord {
    id: number;
    title: string;
    script: string;
    status?: string;
    file_path?: string;
}

type VideoStatus = 'planned' | 'processing' | 'downloaded' | 'failed';

// Timeout constants
const TIMEOUTS = {
    SHORT: 1000,
    MEDIUM: 5000,
    LONG: 30000,
    EXPORT_WAIT: 300000,  // 5 minutes
    FILE_AGE_THRESHOLD: 300000,  // 5 minutes
} as const;

// Configuration - use environment variables with fallbacks
const DB_PATH = path.resolve(__dirname, '../database.db');
const VIDEO_OUTPUT_DIR = path.resolve(__dirname, '../output/videos');
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.join(os.homedir(), 'Documents');

// Environment variables for credentials (security fix)
const VREW_EMAIL = process.env.VREW_EMAIL;
const VREW_PASSWORD = process.env.VREW_PASSWORD;

// Validate credentials early
if (!VREW_EMAIL || !VREW_PASSWORD) {
    console.warn('Warning: VREW_EMAIL or VREW_PASSWORD not set. Manual login may be required.');
}

function getNextVideo(): Promise<VideoRecord | undefined> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(new Error(`Database connection failed: ${err.message}`));
                return;
            }
        });

        db.get("SELECT id, title, script FROM videos WHERE status='planned' LIMIT 1", (err, row) => {
            db.close((closeErr) => {
                if (closeErr) console.error('Error closing database:', closeErr);
            });

            if (err) reject(err);
            else resolve(row as VideoRecord | undefined);
        });
    });
}

function updateStatus(id: number, status: VideoStatus, filename: string): Promise<void> {
    const validStatuses: VideoStatus[] = ['planned', 'processing', 'downloaded', 'failed'];
    if (!validStatuses.includes(status)) {
        return Promise.reject(new Error(`Invalid status: ${status}`));
    }

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(new Error(`Database connection failed: ${err.message}`));
                return;
            }
        });

        db.run("UPDATE videos SET status=?, file_path=? WHERE id=?", [status, filename, id], function(err) {
            db.close((closeErr) => {
                if (closeErr) console.error('Error closing database:', closeErr);
            });

            if (err) {
                console.error("Error updating DB:", err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

const userDataDir = path.resolve(__dirname, '../user_data');

// File System Access API Mock - Creates a fake file handle that writes to our target directory
const createFileSystemAccessMock = (outputDir: string) => `
(function() {
    const OUTPUT_DIR = ${JSON.stringify(outputDir)};
    let fileCounter = 0;

    // Mock FileSystemFileHandle
    class MockFileSystemFileHandle {
        constructor(name) {
            this.kind = 'file';
            this.name = name || 'video_' + Date.now() + '.mp4';
            this._chunks = [];
        }

        async createWritable() {
            const self = this;
            return {
                _chunks: [],
                async write(data) {
                    if (data instanceof Blob) {
                        const buffer = await data.arrayBuffer();
                        this._chunks.push(new Uint8Array(buffer));
                    } else if (data instanceof ArrayBuffer) {
                        this._chunks.push(new Uint8Array(data));
                    } else if (data instanceof Uint8Array) {
                        this._chunks.push(data);
                    } else if (typeof data === 'object' && data.data) {
                        // Handle {type: 'write', data: ...} format
                        const actualData = data.data;
                        if (actualData instanceof Blob) {
                            const buffer = await actualData.arrayBuffer();
                            this._chunks.push(new Uint8Array(buffer));
                        } else if (actualData instanceof ArrayBuffer) {
                            this._chunks.push(new Uint8Array(actualData));
                        } else if (actualData instanceof Uint8Array) {
                            this._chunks.push(actualData);
                        }
                    }
                    console.log('[FSA Mock] Write called, chunk count:', this._chunks.length);
                },
                async close() {
                    console.log('[FSA Mock] Close called, finalizing file:', self.name);

                    // Combine all chunks
                    let totalLength = 0;
                    for (const chunk of this._chunks) {
                        totalLength += chunk.length;
                    }

                    const combined = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of this._chunks) {
                        combined.set(chunk, offset);
                        offset += chunk.length;
                    }

                    // Create blob and trigger download
                    const blob = new Blob([combined], { type: 'video/mp4' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = self.name;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 1000);

                    console.log('[FSA Mock] Download triggered for:', self.name, 'Size:', totalLength);

                    // Dispatch custom event for tracking
                    window.dispatchEvent(new CustomEvent('fsa-download-complete', {
                        detail: { filename: self.name, size: totalLength }
                    }));
                }
            };
        }

        async getFile() {
            return new File([], this.name);
        }
    }

    // Override showSaveFilePicker
    window.showSaveFilePicker = async function(options = {}) {
        console.log('[FSA Mock] showSaveFilePicker called with options:', JSON.stringify(options));

        let filename = 'video_' + Date.now() + '.mp4';

        if (options.suggestedName) {
            filename = options.suggestedName;
        } else if (options.types && options.types[0] && options.types[0].description) {
            filename = options.types[0].description.replace(/[^a-z0-9]/gi, '_') + '.mp4';
        }

        console.log('[FSA Mock] Returning mock handle for:', filename);
        return new MockFileSystemFileHandle(filename);
    };

    // Override showOpenFilePicker
    window.showOpenFilePicker = async function(options = {}) {
        console.log('[FSA Mock] showOpenFilePicker blocked');
        throw new DOMException('User cancelled', 'AbortError');
    };

    // Override showDirectoryPicker
    window.showDirectoryPicker = async function(options = {}) {
        console.log('[FSA Mock] showDirectoryPicker blocked');
        throw new DOMException('User cancelled', 'AbortError');
    };

    // Make them non-configurable
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: false, writable: false });
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: false, writable: false });
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: false, writable: false });

    console.log('[FSA Mock] File System Access API fully mocked');
})();
`;

test('Automate Vrew Web', async ({ playwright }) => {
    // Disable timeout for manual observation
    test.setTimeout(0);

    // Launch persistent context with enhanced settings
    const context = await playwright.chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=FileSystemAccess,FileSystemAccessAPI,NativeFileSystem,FileSystemAccessLocal',
            '--disable-file-system',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files'
        ],
        viewport: { width: 1280, height: 720 },
        acceptDownloads: true,
        downloadsPath: VIDEO_OUTPUT_DIR,
    });

    // 1. Get Video Data first so listeners can use it
    const video = await getNextVideo();
    if (!video) {
        console.log("No videos to create.");
        await context.close();
        return;
    }
    const videoData = video;
    console.log(`Processing: ${videoData.title}`);

    // Inject File System Access mock BEFORE any page loads
    await context.addInitScript(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    // Track FSA mock downloads via custom event
    await page.exposeFunction('notifyFSADownload', async (filename: string, size: number) => {
        console.log(`[FSA Callback] Download complete: ${filename}, size: ${size}`);
    });

    // Listen for our custom FSA download event
    await page.evaluate(() => {
        window.addEventListener('fsa-download-complete', (e: any) => {
            console.log('[Page] FSA download complete event:', e.detail);
            // @ts-ignore
            window.notifyFSADownload(e.detail.filename, e.detail.size);
        });
    });

    // Handle standard downloads automatically
    let downloadTriggered = false;
    let downloadedFilePath: string | null = null;

    page.on('download', async (download) => {
        const suggested = download.suggestedFilename();
        console.log(`[DOWNLOAD EVENT] Started: ${suggested}`);
        downloadTriggered = true;

        const safeTitle = videoData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
        const dlPath = path.join(VIDEO_OUTPUT_DIR, `video_${videoData.id}_${safeTitle}.mp4`);

        try {
            await download.saveAs(dlPath);
            console.log(`[DOWNLOAD EVENT] Saved to: ${dlPath}`);
            downloadedFilePath = dlPath;

            await updateStatus(videoData.id, 'downloaded', dlPath).catch(e =>
                console.error('Failed to update status:', e));
        } catch (e) {
            console.log(`[DOWNLOAD EVENT] Error saving: ${e}`);
        }
    });

    // FORCE DOWNLOAD BEHAVIOR via CDP (Browser level)
    const setupCDP = async (p: any) => {
        try {
            const client = await p.context().newCDPSession(p);

            // Set download behavior at browser level
            await client.send('Browser.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: VIDEO_OUTPUT_DIR,
                eventsEnabled: true
            });

            // Also set at page level as fallback
            await client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: VIDEO_OUTPUT_DIR
            });

            // Listen for download events via CDP
            client.on('Browser.downloadProgress', (event: any) => {
                console.log(`[CDP] Download progress: ${event.state} - ${event.receivedBytes}/${event.totalBytes}`);
                if (event.state === 'completed') {
                    console.log(`[CDP] Download completed: ${event.guid}`);
                }
            });

            console.log("CDP Download behavior set (Browser + Page level).");
        } catch (e) {
            console.log("CDP setup error:", e);
        }
    };
    await setupCDP(page);

    // 2. Go to Vrew Web
    await page.goto('https://vrew.ai/ja/try/index.html');

    // Re-inject FSA mock after navigation (belt and suspenders)
    await page.evaluate(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

    // 3. Login Check / Manual Login Wait
    try {
        await page.waitForSelector('.start-button', { timeout: 5000 });
    } catch (e) {
        console.log("Please log in to Vrew in the browser window if needed.");
    }

    // 3. Popup Handling (Browser Support / Welcome)
    console.log("Looking for popups...");
    try {
        const confirmBtn = page.getByRole('button', { name: '確認' });
        if (await confirmBtn.isVisible({ timeout: 5000 })) {
            console.log("Found 'Browser not supported' popup. Clicking 'Confirm'...");
            await confirmBtn.click();
            await page.waitForTimeout(1000);
        }
    } catch (e) {
        console.log("No 'Browser not supported' popup found.");
    }

    // 3.5 Login Handling (If Login button exists)
    console.log("Checking for Login...");
    if (VREW_EMAIL && VREW_PASSWORD) {
        try {
            const loginLink = page.getByText('ログイン', { exact: true }).or(page.getByText('Login', { exact: true }));
            if (await loginLink.isVisible({ timeout: 3000 })) {
                console.log("Login button found. Attempting login...");
                await loginLink.click();

                await page.getByPlaceholder('メールアドレス', { exact: false }).fill(VREW_EMAIL);

                const passField = page.getByPlaceholder('パスワード', { exact: false });
                if (await passField.isVisible()) {
                    await passField.fill(VREW_PASSWORD);
                } else {
                    await page.getByRole('button', { name: '次へ' }).click().catch(() => { });
                    await page.getByPlaceholder('パスワード', { exact: false }).fill(VREW_PASSWORD);
                }

                await page.getByRole('button', { name: 'ログイン' }).click();
                await page.waitForTimeout(5000);
            }
        } catch (e) {
            console.log("Login skipped or failed (Already logged in?): " + e);
        }
    } else {
        console.log("No credentials configured. Assuming already logged in or manual login required.");
    }

    // 3.6 Initial "Start" Screen (Vrewへようこそ！)
    console.log("Looking for 'Start' (始める) button...");
    try {
        const checkbox = page.getByRole('checkbox');
        if (await checkbox.isVisible()) {
            await checkbox.check();
        }

        const startBtn = page.getByRole('button', { name: '始める' });
        if (await startBtn.isVisible({ timeout: 5000 })) {
            await startBtn.click();
            console.log("Clicked '始める' button.");
            await page.waitForTimeout(2000);
        }
    } catch (e) {
        console.log("Skipped 'Start' button step.");
    }

    // 4. Start New Project (Text to Video)
    console.log("Looking for 'New Project' button...");
    await page.getByText('新規で作成', { exact: false }).first().click({ timeout: 10000 }).catch(() =>
        console.log("Could not find '新規で作成', you might be already on the project screen."));

    try {
        const afterNewProjectConfirm = page.getByRole('button', { name: '確認' });
        if (await afterNewProjectConfirm.isVisible({ timeout: 3000 })) {
            console.log("Found 'Confirm' button after New Project. Clicking...");
            await afterNewProjectConfirm.click();
            await page.waitForTimeout(1000);
        }
    } catch (e) { }

    // 5. Select "Text to Video" mode
    console.log("Looking for 'Text to Video' button...");
    try {
        await page.getByText('テキストから動画', { exact: false }).first().click({ timeout: 5000 });
    } catch (e) {
        console.log("Could not find 'Text to Video' button. Continuing...");
    }

    // 5.5 Handle Style Selection (Step 1 of Wizard)
    console.log("Checking for Style Selection modal...");
    try {
        const styleHeader = page.getByText('スタイルを選択', { exact: false }).or(page.getByText('ビデオスタイル', { exact: false }));
        if (await styleHeader.first().isVisible({ timeout: 5000 })) {
            console.log("Style Selection detected. Clicking 'Next'...");

            await page.getByRole('button', { name: '次へ' }).first().click({ force: true, timeout: 1000 }).catch(() => { });
            await page.getByText('次へ').last().click({ force: true, timeout: 1000 }).catch(() => { });

            try {
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, div, span'));
                    const nextBtn = buttons.find(el => el.textContent?.includes('次へ'));
                    if (nextBtn) (nextBtn as HTMLElement).click();
                });
            } catch (e) { }

            await page.waitForTimeout(2000);
        }
    } catch (e) {
        console.log("Style selection step skipped: " + e);
    }

    // 6. Input Script & Theme (Step 2: 台本の作成)
    console.log("Waiting for Step 2: Script Input...");
    try {
        try {
            console.log("Looking for Theme input...");
            const themeInput = page.getByPlaceholder('テーマを入力', { exact: false }).first();
            if (await themeInput.isVisible({ timeout: 3000 })) {
                await themeInput.click({ force: true });
                await page.waitForTimeout(200);
                await themeInput.fill(video.title.substring(0, 50));
                console.log("Theme filled.");
            }
        } catch (e) { console.log("Theme input skipped/not found: " + e); }

        console.log("Looking for Script input...");

        const scriptArea = page.getByPlaceholder('台本を入力', { exact: false })
            .or(page.getByText('台本を入力してください', { exact: false }))
            .or(page.locator('textarea').nth(1))
            .first();

        await scriptArea.waitFor({ state: 'visible', timeout: 5000 });
        console.log("Found script area. Clicking...");

        await scriptArea.click({ force: true });
        await page.waitForTimeout(500);

        console.log("Pasting script...");
        await page.evaluate((text) => navigator.clipboard.writeText(text), video.script);
        await page.keyboard.press('Control+v');

        await page.waitForTimeout(2000);

    } catch (e) {
        console.log("Error during input attempts: " + e);
    }

    // HARD VALIDATION
    console.log("Verifying script content...");
    const finalContent = await page.evaluate(() => {
        const editors = Array.from(document.querySelectorAll('[contenteditable="true"], textarea, .ProseMirror'));
        return editors.map(e => e.textContent).join('');
    });

    if (!finalContent || finalContent.length < 10) {
        console.log("!!! SCRIPT INPUT FAILED OR EMPTY !!!");
        console.log(">> PLEASE MANUALLY PASTE THE SCRIPT INTO THE BOX <<");
        await page.pause();
    } else {
        console.log("Script content verified. Proceeding.");
    }

    // Handle "Script is empty" popup
    try {
        const emptyPopup = page.getByText('台本が空です', { exact: false });
        if (await emptyPopup.isVisible({ timeout: 2000 })) {
            console.log("Popup: 'Script is empty'. Clicking Confirm...");
            await page.getByRole('button', { name: '確認' }).click({ force: true });
            await page.pause();
        }
    } catch (e) { }

    // Click "Next" after script input
    console.log("Clicking 'Next' after script...");
    await page.getByRole('button', { name: '次へ' }).or(page.getByText('次へ')).last().click();

    // 7. Customize Video (Step 3: ビデオをカスタマイズ)
    console.log("Waiting for Step 3: Customization...");
    try {
        const verticalButton = page.getByText('9:16', { exact: true }).or(page.getByRole('button', { name: '9:16' }));
        await verticalButton.first().waitFor({ state: 'visible', timeout: 10000 });
        console.log("Found 9:16 button. Clicking for Vertical Video...");
        await verticalButton.first().click({ force: true });
        await page.waitForTimeout(1000);

        console.log("Clicking 'Done' to start generation...");
        await page.getByRole('button', { name: '完了' }).or(page.getByText('完了')).last().click();

        console.log("Checking for final confirmation popup...");
        try {
            const confirmStart = page.getByText('動画作成を始めますか？', { exact: false });
            if (await confirmStart.isVisible({ timeout: 5000 })) {
                console.log("Confirmation popup detected. Clicking 'Confirm'...");
                await page.getByRole('button', { name: '確認' }).last().click({ force: true });
            }
        } catch (e) {
            console.log("No confirmation popup or error: " + e);
        }

    } catch (e) {
        console.log("Error in Step 3 (Customization): " + e);
        console.log(">> PLEASE MANUALLY SELECT 9:16 AND CLICK DONE <<");
        await page.pause();
    }

    // 8. Wait for Generation & Export
    console.log("Waiting for AI generation to complete (looking for Editor UI)...");

    const exportBtn = page.getByRole('button', { name: '書き出し' }).or(page.getByText('書き出し', { exact: true }));
    try {
        await exportBtn.first().waitFor({ state: 'visible', timeout: TIMEOUTS.EXPORT_WAIT });
        console.log("Generation complete! Editor loaded.");
    } catch (e) {
        console.log("Timeout waiting for generation. It might still be running or failed.");
        await page.pause();
    }

    // 9. Start Export Process
    // Clean up potential previous files in Downloads
    try {
        const existingFiles = fs.readdirSync(DOWNLOADS_DIR).filter(f =>
            (f.startsWith('無題動画') || f.startsWith('video_')) && f.endsWith('.mp4'));
        for (const file of existingFiles) {
            try {
                fs.unlinkSync(path.join(DOWNLOADS_DIR, file));
            } catch (e) {
                console.warn(`Failed to delete ${file}:`, e);
            }
        }
        console.log("Cleaned up previous video files in Downloads folder.");
    } catch (e) {
        console.warn("Could not clean up Downloads folder:", e);
    }

    // Re-inject FSA mock before export (in case page context changed)
    await page.evaluate(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

    console.log("Starting Export...");
    await exportBtn.first().click();
    await page.waitForTimeout(1000);

    // Select MP4
    console.log("Selecting MP4 format...");
    await page.getByText('動画ファイル(mp4)', { exact: false }).click();
    await page.waitForTimeout(1000);

    // Handle "Unsupported Browser" popup
    try {
        const unsupportedPopup = page.getByText('サポートされていないブラウザ', { exact: false });
        if (await unsupportedPopup.isVisible({ timeout: 3000 })) {
            console.log("Popup: 'Unsupported Browser'. Clicking Confirm...");
            await page.getByRole('button', { name: '確認' }).click({ force: true });
            await page.waitForTimeout(1000);
        }
    } catch (e) { }

    // DIAGNOSTIC: Capture modal state
    console.log("Clicking Final Export Button...");
    try {
        await page.screenshot({ path: path.join(VIDEO_OUTPUT_DIR, 'debug_export_modal.png') });
    } catch (e) { }

    const possibleConfirmSelectors = [
        '.footer-buttons .blue-button:has-text("書き出し")',
        'button.blue-button:has-text("書き出し")',
        'button.blue-button:has(span:text("書き出し"))',
        'button:has-text("書き出し")',
        '.modal-content button:has-text("書き出し")'
    ];

    // Try clicking each candidate
    let clicked = false;
    for (const sel of possibleConfirmSelectors) {
        try {
            const btn = page.locator(sel).filter({ visible: true }).first();
            if (await btn.isVisible({ timeout: 2000 })) {
                console.log(`FOUND MODAL BUTTON: clicking "${sel}"`);
                await btn.click({ force: true });
                await page.waitForTimeout(1000);
                clicked = true;
                break;
            }
        } catch (e) { }
    }

    if (!clicked) {
        console.log("WARNING: Could not find modal 'Export' button. Trying generic role search.");
        await page.getByRole('button', { name: '書き出し' }).last().click({ force: true }).catch(() => null);
    }

    console.log(">> Export started. Entering Watcher loop (Progress & File monitoring) <<");

    // 10. Handle Download / Watch File System
    const safeTitle = videoData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    const finalOutputPath = path.resolve(VIDEO_OUTPUT_DIR, `video_${videoData.id}_${safeTitle}.mp4`);

    const checkDirs = [
        DOWNLOADS_DIR,
        DOCUMENTS_DIR,
        VIDEO_OUTPUT_DIR,
        path.join(userDataDir, 'Default', 'Downloads')
    ];

    console.log("Checking directories:", checkDirs);

    // Watcher loop (Poll for 300 seconds)
    let lastAction = '';
    const maxIterations = 150;

    for (let i = 0; i < maxIterations; i++) {
        await page.waitForTimeout(2000);

        // Check if download already completed via event
        if (downloadedFilePath) {
            console.log(`Download already completed via event: ${downloadedFilePath}`);
            break;
        }

        // Progress screenshot every 5 iterations
        if (i % 5 === 0) {
            const statusShot = path.join(VIDEO_OUTPUT_DIR, `watcher_status_${i}.png`);
            await page.screenshot({ path: statusShot }).catch(() => { });
            console.log(`[Watcher] Progress check - loop ${i}/${maxIterations}. Screenshot: ${statusShot}`);

            // PowerShell native dialog handler (fallback)
            const { exec } = require('child_process');
            const psCmd = `$wshell = New-Object -ComObject WScript.Shell; $titles = @('名前を付けて保存', 'Save As', 'Vrew', 'Export'); foreach ($title in $titles) { if ($wshell.AppActivate($title)) { Start-Sleep -m 500; $wshell.SendKeys('%s'); Start-Sleep -m 500; $wshell.SendKeys('~'); break; } }`;
            exec(`powershell -Command "${psCmd}"`, (err: any) => {
                if (!err) console.log("[PowerShell] Attempted dialog dismiss");
            });
        }

        // Status check & recovery
        try {
            const pageText = await page.evaluate(() => document.body.innerText).catch(() => "");
            const progressMatch = pageText.match(/(\d+)%/);

            if (progressMatch) {
                console.log(`Vrew Status: Progress ${progressMatch[0]}`);
                lastAction = 'exporting';
            } else {
                // Stage detection for recovery
                const exportModalTitle = page.getByText(/動画を書き出す/).filter({ visible: true });
                const mp4Item = page.locator('li, div').filter({ hasText: /動画ファイル.*mp4/ }).filter({ visible: true });
                const headerButtons = page.locator('span, div').filter({ hasText: /^書き出し$/ }).filter({ visible: true });

                const sCount = await exportModalTitle.count();
                const dCount = await mp4Item.count();
                const hCount = await headerButtons.count();

                if (i % 10 === 0) {
                    console.log(`[Diagnostic] UI State - Modals: ${sCount}, Dropdowns: ${dCount}, Buttons: ${hCount}, LastAction: ${lastAction}`);

                    if (hCount === 0 && dCount === 0 && sCount === 0) {
                        try {
                            const html = await page.content();
                            fs.writeFileSync(path.join(VIDEO_OUTPUT_DIR, `debug_page_dump_${i}.html`), html);
                            console.log(`[Diagnostic] Saved HTML dump to debug_page_dump_${i}.html`);
                        } catch (e) { }
                    }
                }

                // Recovery actions
                if (sCount > 0) {
                    console.log("[Recovery] At Settings Modal. Clicking final '書き出し'...");
                    const exportBtns = page.locator('button, div[role="button"], span').filter({ hasText: /^書き出し$/ }).filter({ visible: true });
                    const count = await exportBtns.count();
                    if (count > 0) {
                        await exportBtns.last().click({ force: true }).catch(() => { });
                    }
                    lastAction = 'clicked_modal_export';
                } else if (dCount > 0) {
                    console.log("[Recovery] At Format Dropdown. Clicking MP4...");
                    const target = mp4Item.first();
                    try {
                        await target.scrollIntoViewIfNeeded();
                        await target.hover();
                        await page.waitForTimeout(200);
                        await target.dispatchEvent('click', { bubbles: true, cancelable: true });
                        console.log("Dispatched click to MP4 item");
                    } catch (e) {
                        await target.click({ force: true }).catch(() => { });
                    }
                    lastAction = 'clicked_mp4';
                    await page.waitForTimeout(3000);
                } else if (hCount > 0 && lastAction !== 'clicked_mp4') {
                    console.log("[Recovery] At Editor. Clicking '書き出し' button...");
                    await headerButtons.first().click({ force: true }).catch(() => { });
                    lastAction = 'clicked_editor_export';
                }
            }

            // Completion popup check
            const completePopup = page.getByText('動画の出力が完了しました').or(page.getByText('出力が完了しました'));
            if (await completePopup.isVisible({ timeout: 500 })) {
                console.log("Completion popup detected. Clicking 'Confirm'...");
                await page.getByRole('button', { name: '確認' }).click({ force: true }).catch(() => { });
            }
        } catch (e) { }

        // Reactive popup handling
        try {
            // Handle error dialogs first
            const errorDialog = page.getByText('エラー', { exact: true }).filter({ visible: true });
            if (await errorDialog.isVisible({ timeout: 500 })) {
                console.log("[ERROR] Error dialog detected!");
                // Take screenshot of error
                await page.screenshot({ path: path.join(VIDEO_OUTPUT_DIR, `error_dialog_${i}.png`) }).catch(() => {});

                // Click close button
                const closeBtn = page.getByRole('button', { name: /閉じる|Close/ }).filter({ visible: true });
                if (await closeBtn.isVisible({ timeout: 500 })) {
                    console.log("[ERROR] Clicking 'Close' button...");
                    await closeBtn.click({ force: true });
                    await page.waitForTimeout(1000);

                    // Re-click export button after closing error
                    console.log("[ERROR] Retrying export...");
                    await exportBtn.first().click().catch(() => {});
                    lastAction = 'error_recovery';
                }
            }

            const popupBtn = page.getByRole('button', { name: /確認|はい|出力する|次へ|OK|同意|閉じる/ }).filter({ visible: true });
            if (await popupBtn.first().isVisible({ timeout: 500 })) {
                const btnName = await popupBtn.first().innerText().catch(() => "Confirm");
                console.log(`Detected popup button: "${btnName}". Clicking...`);
                await popupBtn.first().click({ force: true });
            }

            const blueBtn = page.locator('.modal-content .blue-button, .footer-buttons .blue-button').filter({ visible: true });
            if (await blueBtn.isVisible({ timeout: 500 })) {
                console.log("Detected blue modal button. Clicking...");
                await blueBtn.click({ force: true });
            }
        } catch (e) { }

        // File system check
        for (const dir of checkDirs) {
            try {
                if (!fs.existsSync(dir)) continue;

                const allFiles = fs.readdirSync(dir).filter(f =>
                    f.endsWith('.mp4') && !f.startsWith('video_'));

                const recentFiles = allFiles.map(f => {
                    try {
                        const fullPath = path.join(dir, f);
                        const stats = fs.statSync(fullPath);
                        return { name: f, dir: dir, mtime: stats.mtime, size: stats.size };
                    } catch (e) { return null; }
                }).filter((f): f is { name: string, dir: string, mtime: Date, size: number } => f !== null)
                    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

                if (recentFiles.length > 0) {
                    const newest = recentFiles[0];
                    const age = Date.now() - newest.mtime.getTime();

                    if (age < TIMEOUTS.FILE_AGE_THRESHOLD) {
                        console.log(`Found recent video: ${newest.name} in ${newest.dir} (Age: ${age}ms)`);
                        const sourcePath = path.join(newest.dir, newest.name);

                        // Wait for file stability (ensure write complete)
                        let prevSize = -1;
                        let stableCycles = 0;
                        for (let j = 0; j < 10; j++) {
                            await page.waitForTimeout(1000);
                            try {
                                const currentSize = fs.statSync(sourcePath).size;
                                if (currentSize === prevSize && currentSize > 0) {
                                    stableCycles++;
                                    if (stableCycles >= 2) break;
                                } else {
                                    stableCycles = 0;
                                }
                                prevSize = currentSize;
                            } catch (e) { break; }
                        }

                        console.log(`Finalizing: moving to ${finalOutputPath}`);
                        try {
                            if (fs.existsSync(finalOutputPath)) fs.unlinkSync(finalOutputPath);
                            fs.renameSync(sourcePath, finalOutputPath);
                            downloadedFilePath = finalOutputPath;
                            break;
                        } catch (err) {
                            console.log("Move failed (file locked?): " + err);
                            // Try copy instead
                            try {
                                fs.copyFileSync(sourcePath, finalOutputPath);
                                downloadedFilePath = finalOutputPath;
                                console.log("Copied file instead of moving.");
                                break;
                            } catch (e2) { }
                        }
                    }
                }
            } catch (e) { }
            if (downloadedFilePath) break;
        }

        if (downloadedFilePath) break;
        if (i % 10 === 0) console.log(`Waiting... loop ${i}/${maxIterations}`);
    }

    // Final result
    if (downloadedFilePath) {
        console.log(`✓ Video successfully saved to: ${downloadedFilePath}`);
        await updateStatus(videoData.id, 'downloaded', downloadedFilePath).catch(e =>
            console.error('Failed to update status:', e));
    } else {
        console.log("✗ TIMEOUT: Download could not be confirmed.");
        console.log("Please check browser for status...");
        await page.pause();
    }

    console.log("Automation task finished.");
});
