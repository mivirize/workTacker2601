/**
 * Batch Video Automation Script
 *
 * DB内の全ての未処理動画（status='planned'）を連続で処理します。
 * 使用方法: npx ts-node scripts/batch_automate_vrew.ts
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
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
    BETWEEN_VIDEOS: 5000,  // 5 seconds between videos
} as const;

// Configuration
const DB_PATH = path.resolve(__dirname, '../database.db');
const VIDEO_OUTPUT_DIR = path.resolve(__dirname, '../output/videos');
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.join(os.homedir(), 'Documents');
const userDataDir = path.resolve(__dirname, '../user_data');

// Environment variables for credentials
const VREW_EMAIL = process.env.VREW_EMAIL;
const VREW_PASSWORD = process.env.VREW_PASSWORD;

// Ensure output directory exists
if (!fs.existsSync(VIDEO_OUTPUT_DIR)) {
    fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
}

// Database functions
function getAllPlannedVideos(): Promise<VideoRecord[]> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(new Error(`Database connection failed: ${err.message}`));
                return;
            }
        });

        db.all("SELECT id, title, script FROM videos WHERE status='planned' ORDER BY id", (err, rows) => {
            db.close((closeErr) => {
                if (closeErr) console.error('Error closing database:', closeErr);
            });

            if (err) reject(err);
            else resolve(rows as VideoRecord[]);
        });
    });
}

function updateStatus(id: number, status: VideoStatus, filename: string = ''): Promise<void> {
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

// File System Access API Mock
const createFileSystemAccessMock = (outputDir: string) => `
(function() {
    const OUTPUT_DIR = ${JSON.stringify(outputDir)};

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
                    console.log('[FSA Mock] Write called, chunks:', this._chunks.length);
                },
                async close() {
                    console.log('[FSA Mock] Finalizing:', self.name);
                    let totalLength = 0;
                    for (const chunk of this._chunks) totalLength += chunk.length;

                    const combined = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of this._chunks) {
                        combined.set(chunk, offset);
                        offset += chunk.length;
                    }

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

                    console.log('[FSA Mock] Download triggered:', self.name, 'Size:', totalLength);
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

    window.showSaveFilePicker = async function(options = {}) {
        console.log('[FSA Mock] showSaveFilePicker intercepted');
        let filename = options.suggestedName || ('video_' + Date.now() + '.mp4');
        return new MockFileSystemFileHandle(filename);
    };

    window.showOpenFilePicker = async () => { throw new DOMException('Cancelled', 'AbortError'); };
    window.showDirectoryPicker = async () => { throw new DOMException('Cancelled', 'AbortError'); };

    Object.defineProperty(window, 'showSaveFilePicker', { configurable: false, writable: false });
    Object.defineProperty(window, 'showOpenFilePicker', { configurable: false, writable: false });
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: false, writable: false });

    console.log('[FSA Mock] Initialized');
})();
`;

// Main processing function for a single video
async function processVideo(
    context: BrowserContext,
    page: Page,
    video: VideoRecord,
    isFirstVideo: boolean
): Promise<boolean> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing video ${video.id}: ${video.title}`);
    console.log(`${'='.repeat(60)}\n`);

    let downloadedFilePath: string | null = null;
    const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    const finalOutputPath = path.resolve(VIDEO_OUTPUT_DIR, `video_${video.id}_${safeTitle}.mp4`);

    // Mark as processing
    await updateStatus(video.id, 'processing');

    // Setup download handler for this video
    const downloadHandler = async (download: any) => {
        const suggested = download.suggestedFilename();
        console.log(`[DOWNLOAD] Started: ${suggested}`);

        try {
            await download.saveAs(finalOutputPath);
            console.log(`[DOWNLOAD] Saved to: ${finalOutputPath}`);
            downloadedFilePath = finalOutputPath;
        } catch (e) {
            console.log(`[DOWNLOAD] Error: ${e}`);
        }
    };

    page.on('download', downloadHandler);

    try {
        // Re-inject FSA mock
        await page.evaluate(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

        if (isFirstVideo) {
            // Navigate to Vrew (only for first video)
            await page.goto('https://vrew.ai/ja/try/index.html');
            await page.evaluate(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

            // Handle popups
            await handlePopups(page);

            // Login if needed
            await handleLogin(page);
        }

        // Create new project
        await createNewProject(page, video);

        // Wait for generation and export
        await waitForGenerationAndExport(page, video);

        // Wait for download
        downloadedFilePath = await waitForDownload(page, video, finalOutputPath, downloadedFilePath);

        if (downloadedFilePath) {
            console.log(`✓ Video ${video.id} completed: ${downloadedFilePath}`);
            await updateStatus(video.id, 'downloaded', downloadedFilePath);
            return true;
        } else {
            console.log(`✗ Video ${video.id} failed: Download not confirmed`);
            await updateStatus(video.id, 'failed', '');
            return false;
        }
    } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        await updateStatus(video.id, 'failed', '');
        return false;
    } finally {
        page.off('download', downloadHandler);
    }
}

async function handlePopups(page: Page): Promise<void> {
    console.log("Handling popups...");

    try {
        const confirmBtn = page.getByRole('button', { name: '確認' });
        if (await confirmBtn.isVisible({ timeout: 5000 })) {
            await confirmBtn.click();
            await page.waitForTimeout(TIMEOUTS.SHORT);
        }
    } catch (e) { }

    try {
        const checkbox = page.getByRole('checkbox');
        if (await checkbox.isVisible({ timeout: 2000 })) {
            await checkbox.check();
        }

        const startBtn = page.getByRole('button', { name: '始める' });
        if (await startBtn.isVisible({ timeout: 3000 })) {
            await startBtn.click();
            await page.waitForTimeout(2000);
        }
    } catch (e) { }
}

async function handleLogin(page: Page): Promise<void> {
    if (!VREW_EMAIL || !VREW_PASSWORD) {
        console.log("No credentials configured. Assuming already logged in.");
        return;
    }

    try {
        const loginLink = page.getByText('ログイン', { exact: true }).or(page.getByText('Login', { exact: true }));
        if (await loginLink.isVisible({ timeout: 3000 })) {
            console.log("Logging in...");
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
            await page.waitForTimeout(TIMEOUTS.MEDIUM);
        }
    } catch (e) {
        console.log("Login skipped (already logged in?)");
    }
}

async function createNewProject(page: Page, video: VideoRecord): Promise<void> {
    console.log("Creating new project...");

    // Click "New Project"
    await page.getByText('新規で作成', { exact: false }).first().click({ timeout: 10000 }).catch(() => { });

    try {
        const confirmBtn = page.getByRole('button', { name: '確認' });
        if (await confirmBtn.isVisible({ timeout: 3000 })) {
            await confirmBtn.click();
            await page.waitForTimeout(TIMEOUTS.SHORT);
        }
    } catch (e) { }

    // Select "Text to Video"
    try {
        await page.getByText('テキストから動画', { exact: false }).first().click({ timeout: TIMEOUTS.MEDIUM });
    } catch (e) {
        console.log("Could not find 'Text to Video' button");
    }

    // Handle style selection
    try {
        const styleHeader = page.getByText('スタイルを選択', { exact: false });
        if (await styleHeader.first().isVisible({ timeout: TIMEOUTS.MEDIUM })) {
            await page.getByRole('button', { name: '次へ' }).first().click({ force: true }).catch(() => { });
            await page.getByText('次へ').last().click({ force: true }).catch(() => { });
            await page.waitForTimeout(2000);
        }
    } catch (e) { }

    // Fill theme and script
    console.log("Filling theme and script...");

    try {
        const themeInput = page.getByPlaceholder('テーマを入力', { exact: false }).first();
        if (await themeInput.isVisible({ timeout: 3000 })) {
            await themeInput.click({ force: true });
            await themeInput.fill(video.title.substring(0, 50));
        }
    } catch (e) { }

    try {
        const scriptArea = page.getByPlaceholder('台本を入力', { exact: false })
            .or(page.locator('textarea').nth(1))
            .first();

        await scriptArea.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
        await scriptArea.click({ force: true });
        await page.waitForTimeout(500);

        await page.evaluate((text) => navigator.clipboard.writeText(text), video.script);
        await page.keyboard.press('Control+v');
        await page.waitForTimeout(2000);
    } catch (e) {
        console.log("Error filling script:", e);
    }

    // Click Next
    await page.getByRole('button', { name: '次へ' }).or(page.getByText('次へ')).last().click();

    // Select 9:16 and start generation
    try {
        const verticalButton = page.getByText('9:16', { exact: true });
        await verticalButton.first().waitFor({ state: 'visible', timeout: 10000 });
        await verticalButton.first().click({ force: true });
        await page.waitForTimeout(TIMEOUTS.SHORT);

        await page.getByRole('button', { name: '完了' }).or(page.getByText('完了')).last().click();

        // Handle confirmation popup
        try {
            const confirmStart = page.getByText('動画作成を始めますか？', { exact: false });
            if (await confirmStart.isVisible({ timeout: TIMEOUTS.MEDIUM })) {
                await page.getByRole('button', { name: '確認' }).last().click({ force: true });
            }
        } catch (e) { }
    } catch (e) {
        console.log("Error in customization step:", e);
    }
}

async function waitForGenerationAndExport(page: Page, video: VideoRecord): Promise<void> {
    console.log("Waiting for AI generation...");

    const exportBtn = page.getByRole('button', { name: '書き出し' }).or(page.getByText('書き出し', { exact: true }));

    try {
        await exportBtn.first().waitFor({ state: 'visible', timeout: TIMEOUTS.EXPORT_WAIT });
        console.log("Generation complete!");
    } catch (e) {
        console.log("Timeout waiting for generation");
        throw new Error("Generation timeout");
    }

    // Re-inject FSA mock
    await page.evaluate(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

    // Start export
    console.log("Starting export...");
    await exportBtn.first().click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Select MP4
    await page.getByText('動画ファイル(mp4)', { exact: false }).click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Handle unsupported browser popup
    try {
        const unsupportedPopup = page.getByText('サポートされていないブラウザ', { exact: false });
        if (await unsupportedPopup.isVisible({ timeout: 3000 })) {
            await page.getByRole('button', { name: '確認' }).click({ force: true });
        }
    } catch (e) { }

    // Click export button in modal
    const exportSelectors = [
        '.footer-buttons .blue-button:has-text("書き出し")',
        'button.blue-button:has-text("書き出し")',
        'button:has-text("書き出し")'
    ];

    for (const sel of exportSelectors) {
        try {
            const btn = page.locator(sel).filter({ visible: true }).first();
            if (await btn.isVisible({ timeout: 2000 })) {
                await btn.click({ force: true });
                break;
            }
        } catch (e) { }
    }
}

async function waitForDownload(
    page: Page,
    video: VideoRecord,
    finalOutputPath: string,
    currentDownloadPath: string | null
): Promise<string | null> {
    console.log("Waiting for download...");

    const checkDirs = [DOWNLOADS_DIR, DOCUMENTS_DIR, VIDEO_OUTPUT_DIR];
    const maxIterations = 150;

    for (let i = 0; i < maxIterations; i++) {
        await page.waitForTimeout(2000);

        if (currentDownloadPath && fs.existsSync(currentDownloadPath)) {
            return currentDownloadPath;
        }

        // Progress monitoring
        if (i % 5 === 0) {
            console.log(`[Watcher] Loop ${i}/${maxIterations}`);

            // PowerShell dialog handler
            const { exec } = require('child_process');
            const psCmd = `$wshell = New-Object -ComObject WScript.Shell; $titles = @('名前を付けて保存', 'Save As'); foreach ($t in $titles) { if ($wshell.AppActivate($t)) { Start-Sleep -m 500; $wshell.SendKeys('~'); break; } }`;
            exec(`powershell -Command "${psCmd}"`);
        }

        // Check page status
        try {
            const pageText = await page.evaluate(() => document.body.innerText).catch(() => "");
            const progressMatch = pageText.match(/(\d+)%/);
            if (progressMatch) {
                console.log(`Export progress: ${progressMatch[0]}`);
            }

            // Handle popups
            const popupBtn = page.getByRole('button', { name: /確認|はい|OK/ }).filter({ visible: true });
            if (await popupBtn.first().isVisible({ timeout: 500 })) {
                await popupBtn.first().click({ force: true });
            }
        } catch (e) { }

        // File system check
        for (const dir of checkDirs) {
            try {
                if (!fs.existsSync(dir)) continue;

                const files = fs.readdirSync(dir).filter(f =>
                    f.endsWith('.mp4') && !f.startsWith('video_'));

                for (const f of files) {
                    const fullPath = path.join(dir, f);
                    const stats = fs.statSync(fullPath);
                    const age = Date.now() - stats.mtime.getTime();

                    if (age < TIMEOUTS.FILE_AGE_THRESHOLD && stats.size > 0) {
                        console.log(`Found video: ${f} in ${dir}`);

                        // Wait for stability
                        let prevSize = -1;
                        for (let j = 0; j < 5; j++) {
                            await page.waitForTimeout(TIMEOUTS.SHORT);
                            const currentSize = fs.statSync(fullPath).size;
                            if (currentSize === prevSize) break;
                            prevSize = currentSize;
                        }

                        // Move to output
                        try {
                            if (fs.existsSync(finalOutputPath)) fs.unlinkSync(finalOutputPath);
                            fs.renameSync(fullPath, finalOutputPath);
                            return finalOutputPath;
                        } catch (err) {
                            fs.copyFileSync(fullPath, finalOutputPath);
                            return finalOutputPath;
                        }
                    }
                }
            } catch (e) { }
        }
    }

    return null;
}

// Main execution
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('AutoVideoGen - Batch Processing');
    console.log('='.repeat(60) + '\n');

    // Get all planned videos
    const videos = await getAllPlannedVideos();

    if (videos.length === 0) {
        console.log("No videos to process (status='planned')");
        return;
    }

    console.log(`Found ${videos.length} video(s) to process:\n`);
    videos.forEach((v, i) => console.log(`  ${i + 1}. [${v.id}] ${v.title}`));
    console.log('');

    // Launch browser
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=FileSystemAccess,FileSystemAccessAPI,NativeFileSystem',
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
        viewport: { width: 1280, height: 720 },
        acceptDownloads: true,
        downloadsPath: VIDEO_OUTPUT_DIR,
    });

    // Inject FSA mock
    await context.addInitScript(createFileSystemAccessMock(VIDEO_OUTPUT_DIR));

    const page = context.pages()[0] || await context.newPage();

    // Setup CDP
    try {
        const client = await context.newCDPSession(page);
        await client.send('Browser.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: VIDEO_OUTPUT_DIR,
            eventsEnabled: true
        });
    } catch (e) { }

    // Process stats
    let successCount = 0;
    let failCount = 0;

    // Process each video
    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const isFirst = i === 0;

        try {
            const success = await processVideo(context, page, video, isFirst);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error(`Fatal error for video ${video.id}:`, error);
            failCount++;
        }

        // Wait between videos (except for last one)
        if (i < videos.length - 1) {
            console.log(`\nWaiting ${TIMEOUTS.BETWEEN_VIDEOS / 1000}s before next video...\n`);
            await page.waitForTimeout(TIMEOUTS.BETWEEN_VIDEOS);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('BATCH PROCESSING COMPLETE');
    console.log('='.repeat(60));
    console.log(`  Total: ${videos.length}`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('='.repeat(60) + '\n');

    await context.close();
}

// Run
main().catch(console.error);
