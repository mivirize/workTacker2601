/**
 * Vrew Batch Video Automation
 *
 * ==========================================
 * 連続動画自動生成スクリプト（操作を奪う形式）
 * ==========================================
 *
 * ブラウザを表示して、指定回数だけ動画を連続生成します。
 * 保存ダイアログはpyautoguiで自動処理します。
 *
 * 使用方法:
 *   node vrew_batch_automation.js --count 5
 *   node vrew_batch_automation.js --count 10 --scripts scripts.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const CONFIG = {
    baseUrl: 'https://vrew.ai',
    tryUrl: 'https://vrew.ai/ja/try/index.html',
    outputDir: path.join(__dirname, '..', 'output'),
    userDataDir: path.join(__dirname, '..', '.vrew_chrome_profile'),
    // Number of videos to create
    videoCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '1'),
    // Scripts file (JSON array of scripts)
    scriptsFile: process.argv.find(arg => arg.startsWith('--scripts='))?.split('=')[1] || null,
    // Default test scripts
    defaultScripts: [
        'こんにちは、これは自動生成テスト動画1です。AIを使って自動的にビデオを作成しています。',
        'これは2番目の自動生成テスト動画です。Vrewの自動化機能をテストしています。',
        'テスト動画3番目です。連続してビデオを生成できることを確認しています。',
        '4番目の自動生成動画です。バッチ処理が正常に動作しています。',
        '最後のテスト動画5番目です。自動化システムが完成しました。',
    ],
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Load scripts from file if specified
let scripts = CONFIG.defaultScripts;
if (CONFIG.scriptsFile && fs.existsSync(CONFIG.scriptsFile)) {
    try {
        scripts = JSON.parse(fs.readFileSync(CONFIG.scriptsFile, 'utf8'));
        console.log(`Loaded ${scripts.length} scripts from ${CONFIG.scriptsFile}`);
    } catch (e) {
        console.error(`Failed to load scripts file: ${e.message}`);
    }
}

/**
 * Vrew Batch Automation Class
 */
class VrewBatchAutomation {
    constructor() {
        this.context = null;
        this.page = null;
        this.pythonHandler = null;
        this.videosCreated = 0;
        this.errors = [];
    }

    log(emoji, message) {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    async screenshot(name) {
        const filename = `batch_${name}_${Date.now()}.png`;
        const filepath = path.join(CONFIG.outputDir, filename);
        try {
            await this.page.screenshot({ path: filepath });
            this.log('📸', `Screenshot: ${filename}`);
        } catch (e) {
            this.log('⚠️', `Screenshot failed: ${e.message}`);
        }
        return filepath;
    }

    /**
     * Start Python save dialog handler
     */
    startPythonHandler() {
        const pythonScript = path.join(__dirname, 'save_dialog_handler.py');

        if (!fs.existsSync(pythonScript)) {
            this.log('⚠️', 'save_dialog_handler.py not found');
            return null;
        }

        this.log('🐍', 'Starting Python dialog handler...');

        this.pythonHandler = spawn('python', [
            pythonScript,
            '--timeout', '3600',  // 1 hour timeout for batch processing
            '--output-dir', CONFIG.outputDir,
            '--interval', '0.5',
            '--continuous'  // Keep monitoring for multiple dialogs
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        this.pythonHandler.stdout.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => {
                // Log ALL Python handler output for debugging
                if (line.trim()) {
                    this.log('🐍', line.trim());
                }
            });
        });

        this.pythonHandler.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (!msg.includes('Warning')) {
                this.log('🐍⚠️', msg);
            }
        });

        return this.pythonHandler;
    }

    /**
     * Stop Python handler
     */
    stopPythonHandler() {
        if (this.pythonHandler && !this.pythonHandler.killed) {
            this.log('🐍', 'Stopping Python handler...');
            this.pythonHandler.kill('SIGTERM');
            this.pythonHandler = null;
        }
    }

    /**
     * Initialize browser (visible mode)
     */
    async initialize() {
        this.log('🚀', 'Starting Vrew Batch Automation (VISIBLE MODE)');
        this.log('⚠️', 'This will take over your screen. Do not use mouse/keyboard during execution.');

        // Configure Chrome preferences for auto-download
        const defaultDir = path.join(CONFIG.userDataDir, 'Default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }

        const prefsPath = path.join(defaultDir, 'Preferences');
        let prefs = {};
        if (fs.existsSync(prefsPath)) {
            try {
                prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
            } catch (e) {
                prefs = {};
            }
        }

        prefs.download = prefs.download || {};
        prefs.download.default_directory = CONFIG.outputDir.replace(/\\/g, '/');
        prefs.download.prompt_for_download = false;
        prefs.download.directory_upgrade = true;
        fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));

        // Launch browser in visible mode - MAXIMIZED for consistent coordinates
        this.context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
            headless: false,  // Always visible
            channel: 'chrome',
            viewport: null,  // Use window size (not fixed viewport)
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            bypassCSP: true,
            ignoreHTTPSErrors: true,
            acceptDownloads: true,
            downloadsPath: CONFIG.outputDir,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--start-maximized',
            ],
        });

        this.page = this.context.pages()[0] || await this.context.newPage();
        this.page.setDefaultTimeout(120000);  // 2 minutes timeout

        // Start Python handler for save dialogs
        this.startPythonHandler();
    }

    /**
     * Navigate to Vrew and ensure logged in
     */
    async navigateAndLogin() {
        this.log('🌐', 'Navigating to Vrew...');

        try {
            await this.page.goto(CONFIG.tryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            this.log('⚠️', 'Navigation timeout, trying homepage...');
            await this.page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        await this.page.waitForTimeout(3000);

        // Check if logged in
        const hasLogout = await this.page.locator('button:has-text("ログアウト")').isVisible().catch(() => false);
        if (hasLogout) {
            this.log('✅', 'Already logged in');
            return true;
        }

        // Try to click login button
        const loginBtn = this.page.locator('button:has-text("Googleでログイン")').first();
        if (await loginBtn.isVisible().catch(() => false)) {
            this.log('🔐', 'Clicking Google login...');
            await loginBtn.click();
            await this.page.waitForTimeout(5000);
        }

        return true;
    }

    /**
     * Create a single video
     */
    async createVideo(script, index) {
        this.log('🎬', `Creating video ${index + 1}/${CONFIG.videoCount}...`);

        try {
            // Step 1: Start new project
            await this.startNewProject();

            // Step 2: Select text-to-video type
            await this.selectTextToVideo();

            // Step 3: Select style and continue
            await this.selectStyle();

            // Step 4: Enter script
            await this.enterScript(script);

            // Step 5: Generate video
            await this.generateVideo();

            // Step 6: Export video
            await this.exportVideo();

            this.videosCreated++;
            this.log('✅', `Video ${index + 1} completed! Total: ${this.videosCreated}`);
            return true;

        } catch (e) {
            this.log('❌', `Video ${index + 1} failed: ${e.message}`);
            this.errors.push({ index: index + 1, error: e.message });
            await this.screenshot(`error_video_${index + 1}`);
            return false;
        }
    }

    /**
     * Close any blocking modals/dialogs
     */
    async closeModals() {
        // Try pressing Escape to close modals
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        // Try clicking close buttons on modals
        const closeSelectors = [
            'button:has-text("閉じる")',
            'button:has-text("×")',
            '[class*="close"]',
            '.modal-overlay',
        ];

        for (const selector of closeSelectors) {
            try {
                const closeBtn = this.page.locator(selector).first();
                if (await closeBtn.isVisible().catch(() => false)) {
                    // For modal overlay, click to close
                    if (selector === '.modal-overlay') {
                        await this.page.evaluate(() => {
                            const overlay = document.querySelector('.modal-overlay');
                            if (overlay) overlay.click();
                        });
                    } else {
                        await closeBtn.click();
                    }
                    await this.page.waitForTimeout(500);
                }
            } catch (e) {
                // Ignore errors
            }
        }

        // Extra Escape to ensure modals are closed
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
    }

    async startNewProject() {
        this.log('📂', 'Starting new project...');

        // Close any blocking modals first
        await this.closeModals();

        // Try multiple methods to start a new project
        let projectStarted = false;

        // Method 1: File menu
        const fileMenu = this.page.locator('text=ファイル').first();
        if (await fileMenu.isVisible().catch(() => false)) {
            await fileMenu.click();
            await this.page.waitForTimeout(1000);

            const newProjectOptions = [
                'text=新規で作成',
                'text=新しいプロジェクト',
                'text=新規プロジェクト',
                'text=New Project',
            ];

            for (const selector of newProjectOptions) {
                const option = this.page.locator(selector).first();
                if (await option.isVisible().catch(() => false)) {
                    await option.click();
                    await this.page.waitForTimeout(2000);
                    projectStarted = true;
                    break;
                }
            }
        }

        // Method 2: "+" button or "新しいプロジェクト" button
        if (!projectStarted) {
            const newBtns = [
                'button:has-text("+")',
                'button:has-text("新しいプロジェクト")',
                '[aria-label="新規プロジェクト"]',
            ];

            for (const selector of newBtns) {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    await btn.click();
                    await this.page.waitForTimeout(2000);
                    projectStarted = true;
                    break;
                }
            }
        }

        // Method 3: Keyboard shortcut
        if (!projectStarted) {
            this.log('📂', 'Trying keyboard shortcut Ctrl+N...');
            await this.page.keyboard.press('Control+n');
            await this.page.waitForTimeout(2000);
        }

        await this.screenshot('02_new_project');
    }

    async selectTextToVideo() {
        this.log('📝', 'Selecting text-to-video project type...');
        await this.closeModals();

        // Look for text-to-video options
        const textToVideoOptions = [
            'text=テキストから動画を作成',
            'text=テキストで始める',
            'text=AI動画を作成',
            'text=スクリプトで開始',
            '[data-type="text-to-video"]',
            'text=Start with Text',
        ];

        for (const selector of textToVideoOptions) {
            const option = this.page.locator(selector).first();
            if (await option.isVisible().catch(() => false)) {
                this.log('📝', `Found text-to-video option: ${selector}`);
                await option.click();
                await this.page.waitForTimeout(2000);

                await this.screenshot('02_text_to_video_selected');
                return;
            }
        }

        // If no specific text-to-video option, we might already be in the right flow
        this.log('📝', 'No specific text-to-video option found, continuing...');
        await this.screenshot('02_project_type');
    }

    async selectStyle() {
        this.log('🎨', 'Selecting video style...');

        // Wait for style selection dialog to appear
        await this.page.waitForTimeout(2000);

        // Close popup dialog if present ("今後表示しない" button)
        const dontShowAgainBtn = this.page.locator('button:has-text("今後表示しない")');
        if (await dontShowAgainBtn.isVisible().catch(() => false)) {
            this.log('🔄', 'Closing popup dialog...');
            await dontShowAgainBtn.click();
            await this.page.waitForTimeout(1000);
        }

        // Try closing any other popup with X button or close
        const closePopupBtns = [
            'button:has-text("×")',
            '[aria-label="close"]',
            '[aria-label="閉じる"]',
        ];
        for (const selector of closePopupBtns) {
            const btn = this.page.locator(selector).first();
            if (await btn.isVisible().catch(() => false)) {
                await btn.click();
                await this.page.waitForTimeout(500);
            }
        }

        // Press Escape to close any remaining popups
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        // Select "すぐに始める" style (quick start)
        const quickStartStyle = this.page.locator('text=すぐに始める').first();
        if (await quickStartStyle.isVisible().catch(() => false)) {
            this.log('🎨', 'Selecting "すぐに始める" style...');
            await quickStartStyle.click();
            await this.page.waitForTimeout(1000);
        } else {
            // Fallback: click first available style option
            const styleOption = this.page.locator('[class*="style-item"], [class*="video-style"], [class*="template"]').first();
            if (await styleOption.isVisible().catch(() => false)) {
                this.log('🎨', 'Selecting first available style...');
                await styleOption.click();
                await this.page.waitForTimeout(1000);
            }
        }

        await this.screenshot('03_style_selected');

        // Click "次へ" button
        const nextBtn = this.page.locator('button:has-text("次へ")').first();
        if (await nextBtn.isVisible().catch(() => false)) {
            this.log('➡️', 'Clicking Next button...');
            await nextBtn.click();
            await this.page.waitForTimeout(2000);
        } else {
            this.log('⚠️', 'Next button not found, trying Enter key...');
            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(2000);
        }
    }

    async enterScript(script) {
        this.log('✍️', 'Entering script...');
        await this.closeModals();

        // Wait for script input area to be visible
        await this.page.waitForTimeout(2000);

        // Try various textarea/input selectors
        const textInputSelectors = [
            'textarea[data-context-menu-id="script-textarea"]',
            'textarea[placeholder*="スクリプト"]',
            'textarea[placeholder*="テキスト"]',
            'textarea[placeholder*="入力"]',
            'textarea',
            '[contenteditable="true"]',
            'input[type="text"][placeholder*="スクリプト"]',
        ];

        let scriptEntered = false;
        for (const selector of textInputSelectors) {
            const element = this.page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                this.log('✍️', `Found input element: ${selector}`);
                await element.click();
                await this.page.waitForTimeout(500);

                // Clear existing content
                await this.page.keyboard.press('Control+a');
                await this.page.waitForTimeout(100);

                // Type the script
                await element.fill(script);
                await this.page.waitForTimeout(500);

                this.log('✅', `Script entered (${script.length} chars)`);
                scriptEntered = true;
                break;
            }
        }

        if (!scriptEntered) {
            this.log('⚠️', 'Could not find script input area');
        }

        await this.screenshot('05_script_entered');
    }

    async generateVideo() {
        this.log('⏳', 'Generating video...');

        // Click "次へ" buttons until we reach generation/completion
        let clickCount = 0;
        const maxClicks = 5;

        while (clickCount < maxClicks) {
            await this.closeModals();

            // Look for "次へ" button
            const nextBtn = this.page.locator('button:has-text("次へ")').first();
            if (await nextBtn.isVisible().catch(() => false)) {
                this.log('➡️', `Clicking Next button (${clickCount + 1})...`);
                await nextBtn.click();
                await this.page.waitForTimeout(3000);
                clickCount++;
                continue;
            }

            // Look for "完了" button (final step)
            const completeBtn = this.page.locator('button:has-text("完了")').first();
            if (await completeBtn.isVisible().catch(() => false)) {
                this.log('✅', 'Clicking Complete button...');
                await completeBtn.click();
                await this.page.waitForTimeout(3000);
                break;
            }

            // Look for "生成" or "作成" button
            const generateBtns = [
                'button:has-text("生成")',
                'button:has-text("作成")',
                'button:has-text("Generate")',
                'button:has-text("Create")',
            ];

            let generateClicked = false;
            for (const selector of generateBtns) {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    this.log('🎬', `Clicking generate button: ${selector}`);
                    await btn.click();
                    await this.page.waitForTimeout(3000);
                    generateClicked = true;
                    break;
                }
            }

            if (generateClicked) break;

            // No more buttons found
            break;
        }

        await this.screenshot('06_generation_started');

        // Handle confirmation dialog
        await this.closeModals();
        const confirmBtns = ['button:has-text("確認")', 'button:has-text("OK")', 'button:has-text("はい")'];
        for (const selector of confirmBtns) {
            const btn = this.page.locator(selector).first();
            if (await btn.isVisible().catch(() => false)) {
                await btn.click();
                await this.page.waitForTimeout(2000);
            }
        }

        // Wait for generation to complete (max 5 minutes)
        this.log('⏳', 'Waiting for video generation...');
        const maxWait = 5 * 60 * 1000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            // Check for timeline (generation complete)
            const timeline = await this.page.locator('[class*="timeline"]').isVisible().catch(() => false);
            const preview = await this.page.locator('video').isVisible().catch(() => false);
            const exportBtn = await this.page.locator('button:has-text("書き出し")').isVisible().catch(() => false);

            if (timeline || preview || exportBtn) {
                this.log('✅', 'Video generation complete!');
                await this.screenshot('07_generation_complete');
                return;
            }

            // Log progress
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            if (elapsed % 30 === 0) {
                this.log('⏳', `Still generating... (${elapsed}s elapsed)`);
            }

            await this.page.waitForTimeout(5000);
        }

        throw new Error('Video generation timeout');
    }

    async exportVideo() {
        this.log('📤', 'Exporting video...');

        // Close any blocking dialogs
        await this.closeModals();
        await this.page.waitForTimeout(1000);

        // Debug: Log all buttons on page
        const allButtons = await this.page.locator('button').all();
        this.log('🔍', `Found ${allButtons.length} buttons on page`);

        // Look for export button - try multiple methods
        let exportClicked = false;

        // Method 1: Find button with "書き出し" text (exact match or containing)
        const exportBtnSelectors = [
            'button:has-text("書き出し")',
            'button >> text=書き出し',
            '[class*="export"] button',
            'button[class*="export"]',
            'button[class*="Export"]',
            '[aria-label*="書き出し"]',
            '[aria-label*="export"]',
            '[aria-label*="Export"]',
            // Common toolbar button patterns
            'header button:has-text("書き出し")',
            'nav button:has-text("書き出し")',
            '[class*="toolbar"] button:has-text("書き出し")',
            '[class*="header"] button:has-text("書き出し")',
        ];

        for (const selector of exportBtnSelectors) {
            try {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    this.log('📤', `Found export button: ${selector}`);
                    await btn.click({ force: true });
                    await this.page.waitForTimeout(2000);
                    exportClicked = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        // Method 2: Use evaluate to find and click button by text content
        if (!exportClicked) {
            this.log('📤', 'Trying to find export button via JavaScript...');
            const clicked = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const btn of buttons) {
                    if (btn.textContent && btn.textContent.includes('書き出し')) {
                        console.log('Found export button:', btn);
                        btn.click();
                        return true;
                    }
                }
                // Also try divs that look like buttons
                const divBtns = Array.from(document.querySelectorAll('[role="button"], [class*="btn"], [class*="button"]'));
                for (const btn of divBtns) {
                    if (btn.textContent && btn.textContent.includes('書き出し')) {
                        console.log('Found export div-button:', btn);
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (clicked) {
                this.log('📤', 'Export button clicked via JavaScript');
                exportClicked = true;
                await this.page.waitForTimeout(2000);
            }
        }

        // Method 3: Try "ファイル" menu -> "書き出し"
        if (!exportClicked) {
            this.log('📤', 'Trying File menu -> Export...');
            const fileMenu = this.page.locator('text=ファイル').first();
            if (await fileMenu.isVisible().catch(() => false)) {
                await fileMenu.click();
                await this.page.waitForTimeout(1000);

                const exportMenuItem = this.page.locator('text=書き出し').first();
                if (await exportMenuItem.isVisible().catch(() => false)) {
                    await exportMenuItem.click();
                    exportClicked = true;
                    await this.page.waitForTimeout(2000);
                }
            }
        }

        // Method 4: Try keyboard shortcut
        if (!exportClicked) {
            this.log('📤', 'Trying export via keyboard shortcut (Ctrl+Shift+E)...');
            await this.page.keyboard.press('Control+Shift+e');
            await this.page.waitForTimeout(2000);
        }

        await this.screenshot('08_export_menu_opened');

        // Select "動画ファイル(mp4)" from dropdown/menu if visible
        const mp4Selectors = [
            'text=動画ファイル(mp4)',
            'text=動画ファイル',
            'text=MP4',
            '[data-value="mp4"]',
        ];

        for (const selector of mp4Selectors) {
            const option = this.page.locator(selector).first();
            if (await option.isVisible().catch(() => false)) {
                this.log('📹', `Selecting MP4 option: ${selector}`);
                await option.click();
                await this.page.waitForTimeout(2000);
                break;
            }
        }

        await this.screenshot('08_export_options');

        // Look for the export confirmation dialog and click with pyautogui
        // (Playwright clicks don't trigger native OS file dialogs)
        this.log('📤', 'Looking for export dialog button...');

        let dialogClicked = false;
        const dialogExportBtns = [
            'div[role="dialog"] button:has-text("書き出し")',
            'button.primary:has-text("書き出し")',
            'button[type="submit"]:has-text("書き出し")',
            'button:has-text("書き出し"):visible',
        ];

        // Get button position from Playwright, then use ONLY pyautogui for the click
        // Playwright clicks don't trigger native OS file dialogs
        let buttonX = 0, buttonY = 0;

        for (const selector of dialogExportBtns) {
            try {
                const btn = this.page.locator(selector).last();
                if (await btn.isVisible().catch(() => false)) {
                    const box = await btn.boundingBox();
                    if (box) {
                        buttonX = Math.round(box.x + box.width / 2);
                        buttonY = Math.round(box.y + box.height / 2);
                        this.log('📍', `Export button found at: (${buttonX}, ${buttonY})`);
                        dialogClicked = true;
                    }
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        // Use ONLY pyautogui for the click - this triggers native file dialogs
        // NOTE: Playwright coordinates are viewport-relative, need to add window position
        if (buttonX > 0 && buttonY > 0) {
            this.log('📤', `Button viewport position: (${buttonX}, ${buttonY})`);

            const pyautoguiClick = spawn('python', ['-c', `
import pyautogui
import pygetwindow as gw
import time

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.3

# Viewport-relative coordinates from Playwright
viewport_x, viewport_y = ${buttonX}, ${buttonY}

# Find Chrome window to get its position
windows = [w for w in gw.getAllWindows() if 'chrome' in w.title.lower() or 'vrew' in w.title.lower()]
if windows:
    window = windows[0]
    # Calculate screen coordinates
    # Chrome has a title bar (~90px) and borders (~8px on each side)
    # The viewport starts below the title bar
    title_bar_height = 90  # Chrome title bar + tab bar + address bar
    border_width = 8

    screen_x = window.left + border_width + viewport_x
    screen_y = window.top + title_bar_height + viewport_y

    print(f"Window: ({window.left}, {window.top}), size: {window.width}x{window.height}")
    print(f"Viewport coords: ({viewport_x}, {viewport_y})")
    print(f"Screen coords: ({screen_x}, {screen_y})")

    # Move and click
    pyautogui.moveTo(screen_x, screen_y, duration=0.2)
    time.sleep(0.3)

    pyautogui.click(screen_x, screen_y)
    print("First click done")
    time.sleep(0.5)

    pyautogui.click(screen_x, screen_y)
    print("Second click done - waiting for save dialog...")
else:
    print("ERROR: No Chrome/Vrew window found")
`], { stdio: ['ignore', 'pipe', 'pipe'] });

            await new Promise((resolve) => {
                pyautoguiClick.on('close', resolve);
                pyautoguiClick.stdout.on('data', (data) => {
                    this.log('🐍', data.toString().trim());
                });
                pyautoguiClick.stderr.on('data', (data) => {
                    this.log('🐍⚠️', data.toString().trim());
                });
            });
        } else {
            this.log('⚠️', 'Could not detect button position');
        }

        await this.page.waitForTimeout(5000).catch(() => {});

        await this.screenshot('08_export_started');
        this.log('⏳', 'Export started, waiting for rendering and save dialog...');

        // Set up download listener for browser-based downloads
        let downloadReceived = false;
        this.page.on('download', async (download) => {
            try {
                const suggestedFilename = download.suggestedFilename();
                this.log('📥', `Download started: ${suggestedFilename}`);
                const downloadPath = path.join(CONFIG.outputDir, suggestedFilename);
                await download.saveAs(downloadPath);
                this.log('✅', `Video saved: ${downloadPath}`);
                downloadReceived = true;
            } catch (e) {
                this.log('⚠️', `Download error: ${e.message}`);
            }
        });

        // Wait for export to complete
        // Vrew may show a progress dialog, then trigger a download or save dialog
        const maxWaitTime = 180000;  // 3 minutes max
        const startTime = Date.now();

        try {
            while (Date.now() - startTime < maxWaitTime) {
                // Check if page is still valid
                try {
                    await this.page.title();
                } catch (e) {
                    this.log('⚠️', 'Page closed or navigated, export may have completed');
                    break;
                }

                // Check if download was received
                if (downloadReceived) {
                    this.log('✅', 'Download completed successfully');
                    break;
                }

                // Log progress every 30 seconds
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                if (elapsed % 30 === 0 && elapsed > 0) {
                    this.log('⏳', `Waiting for export... (${elapsed}s elapsed)`);
                    try {
                        await this.screenshot(`08_export_wait_${elapsed}s`);
                    } catch (e) {
                        // Screenshot might fail if page changed
                    }
                }

                await this.page.waitForTimeout(5000).catch(() => {});
            }
        } catch (e) {
            this.log('⚠️', `Export wait error: ${e.message}`);
        }

        // Wait a bit more for Python handler to catch save dialog
        this.log('⏳', 'Waiting for Windows save dialog (handled by Python)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        try {
            await this.screenshot('08_export_complete');
        } catch (e) {
            // Page might be closed
        }
        this.log('✅', 'Export process finished');
    }

    /**
     * Run batch processing
     */
    async runBatch() {
        console.log('\n' + '='.repeat(60));
        console.log('   Vrew Batch Video Automation');
        console.log(`   Creating ${CONFIG.videoCount} videos`);
        console.log('='.repeat(60) + '\n');

        try {
            await this.initialize();
            await this.navigateAndLogin();

            for (let i = 0; i < CONFIG.videoCount; i++) {
                const script = scripts[i % scripts.length];
                await this.createVideo(script, i);

                // Wait between videos
                if (i < CONFIG.videoCount - 1) {
                    this.log('⏳', 'Waiting before next video...');
                    await this.page.waitForTimeout(5000);
                }
            }

        } catch (e) {
            this.log('❌', `Batch error: ${e.message}`);
        } finally {
            this.stopPythonHandler();

            console.log('\n' + '='.repeat(60));
            console.log('   Batch Processing Complete');
            console.log(`   Videos created: ${this.videosCreated}/${CONFIG.videoCount}`);
            console.log(`   Errors: ${this.errors.length}`);
            if (this.errors.length > 0) {
                console.log('   Error details:');
                this.errors.forEach(e => console.log(`     - Video ${e.index}: ${e.error}`));
            }
            console.log('='.repeat(60) + '\n');

            if (this.context) {
                await this.context.close();
            }
        }
    }
}

// Main execution
const automation = new VrewBatchAutomation();
automation.runBatch().catch(console.error);
