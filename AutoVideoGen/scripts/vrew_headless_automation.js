/**
 * Vrew Headless Video Automation
 *
 * ==========================================
 * 🎯 操作が奪われない自動ビデオ生成システム
 * ==========================================
 *
 * このスクリプトはHeadlessモードで実行されるため、
 * デスクトップの操作を一切妨げません。
 *
 * 使用方法:
 *
 *   【Googleアカウントログインの場合】
 *   1. 初回のみ --login フラグで手動ログイン
 *      node vrew_headless_automation.js --login
 *
 *   2. ブラウザでGoogleログインを完了
 *
 *   3. 以降は自動でHeadless実行
 *      node vrew_headless_automation.js
 *
 *   【メール/パスワードログインの場合】
 *   1. .envファイルに認証情報を設定
 *      VREW_EMAIL=your@email.com
 *      VREW_PASSWORD=your_password
 *
 *   2. 実行
 *      node vrew_headless_automation.js
 *
 * オプション:
 *   --login      Googleログイン用（ブラウザ表示、セッション保存）
 *   --visible    ブラウザを表示（デバッグ用）
 *   --test       テストモード（サンプルビデオを作成）
 *   --video-id=N 特定のビデオIDを処理
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load environment variables from .env if exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

// Configuration
const CONFIG = {
    baseUrl: 'https://vrew.ai',
    tryUrl: 'https://vrew.ai/ja/try/index.html',  // Try version (no login required)
    appUrl: 'https://app.vrew.ai',  // Web app URL
    outputDir: path.join(__dirname, '..', 'output'),
    dbPath: path.join(__dirname, '..', 'database.db'),
    headless: !process.argv.includes('--visible') && !process.argv.includes('--login'),
    credentials: {
        email: process.env.VREW_EMAIL || '',
        password: process.env.VREW_PASSWORD || '',
    },
    // Cookie storage for persistent login
    cookiePath: path.join(__dirname, '..', '.vrew_cookies.json'),
    // Persistent browser profile directory
    userDataDir: path.join(__dirname, '..', '.vrew_chrome_profile'),
    // Login mode - opens browser for manual Google login
    loginMode: process.argv.includes('--login'),
    // Test mode - create a sample video
    testMode: process.argv.includes('--test'),
    // Sample script for testing
    testScript: `こんにちは、これはVrew自動化のテストです。
AIを使ってビデオを自動生成しています。
このテストが成功すれば、バックグラウンドでビデオが作成できます。`,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Simple SQLite wrapper (without external dependency)
 */
class SimpleDB {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.sqlite = null;
        try {
            this.sqlite = require('better-sqlite3')(dbPath);
        } catch (e) {
            console.log('Using sqlite3 async mode');
            const sqlite3 = require('sqlite3').verbose();
            this.db = new sqlite3.Database(dbPath);
        }
    }

    getPlannedVideo() {
        if (this.sqlite) {
            return this.sqlite.prepare(
                'SELECT * FROM videos WHERE status = ? ORDER BY id LIMIT 1'
            ).get('planned');
        }

        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM videos WHERE status = ? ORDER BY id LIMIT 1',
                ['planned'],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });
    }

    updateStatus(id, status, filePath = null) {
        if (this.sqlite) {
            if (filePath) {
                this.sqlite.prepare(
                    'UPDATE videos SET status = ?, file_path = ? WHERE id = ?'
                ).run(status, filePath, id);
            } else {
                this.sqlite.prepare(
                    'UPDATE videos SET status = ? WHERE id = ?'
                ).run(status, id);
            }
            return;
        }

        return new Promise((resolve, reject) => {
            const sql = filePath
                ? 'UPDATE videos SET status = ?, file_path = ? WHERE id = ?'
                : 'UPDATE videos SET status = ? WHERE id = ?';
            const params = filePath ? [status, filePath, id] : [status, id];
            this.db.run(sql, params, err => err ? reject(err) : resolve());
        });
    }

    close() {
        if (this.sqlite) {
            this.sqlite.close();
        } else if (this.db) {
            this.db.close();
        }
    }
}

/**
 * Vrew Headless Automation
 */
class VrewHeadlessAutomation {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.loggedIn = false;
    }

    log(emoji, message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    async initialize() {
        this.log('🚀', `Starting Vrew Automation (${CONFIG.headless ? 'HEADLESS' : 'VISIBLE'})`);
        this.log('✨', 'Your desktop will NOT be affected!');
        console.log('');

        // Ensure user data directory exists
        if (!fs.existsSync(CONFIG.userDataDir)) {
            fs.mkdirSync(CONFIG.userDataDir, { recursive: true });
        }

        // Configure Chrome to auto-download without prompting
        const defaultDir = path.join(CONFIG.userDataDir, 'Default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }

        const prefsPath = path.join(defaultDir, 'Preferences');
        let prefs = {};
        if (fs.existsSync(prefsPath)) {
            try {
                prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
            } catch (e) {
                prefs = {};
            }
        }

        // Set download preferences to auto-save without dialog
        prefs.download = prefs.download || {};
        prefs.download.default_directory = CONFIG.outputDir.replace(/\\/g, '/');
        prefs.download.prompt_for_download = false;
        prefs.download.directory_upgrade = true;

        // Also set savefile preferences
        prefs.savefile = prefs.savefile || {};
        prefs.savefile.default_directory = CONFIG.outputDir.replace(/\\/g, '/');

        fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
        this.log('⚙️', `ダウンロード先を設定: ${CONFIG.outputDir}`);

        // Use persistent context - keeps login state between sessions
        this.context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
            headless: CONFIG.headless,
            channel: 'chrome',  // Use installed Chrome browser
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            bypassCSP: true,
            ignoreHTTPSErrors: true,
            acceptDownloads: true,  // Auto-accept downloads
            downloadsPath: CONFIG.outputDir,  // Save downloads to output directory
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                // Disable File System Access API to force regular download
                '--disable-features=FileSystemAccessAPI',
                // Additional stability flags
                '--disable-gpu',
                '--disable-software-rasterizer',
            ],
        });

        // Check if profile exists (returning user)
        const profileExists = fs.existsSync(path.join(CONFIG.userDataDir, 'Default'));
        if (profileExists) {
            this.log('🍪', 'Using saved browser profile');
        }

        this.page = this.context.pages()[0] || await this.context.newPage();
        this.page.setDefaultTimeout(60000);

        // Store browser reference for close
        this.browser = this.context;
    }

    async saveSession() {
        const storage = await this.context.storageState();
        fs.writeFileSync(CONFIG.cookiePath, JSON.stringify(storage, null, 2));
        this.log('💾', 'Session saved for next time');
    }

    async screenshot(name) {
        const filename = `${name}_${Date.now()}.png`;
        const filepath = path.join(CONFIG.outputDir, filename);
        await this.page.screenshot({ path: filepath });
        this.log('📸', `Screenshot: ${filename}`);
        return filepath;
    }

    async navigateToApp() {
        this.log('🌐', 'Navigating to Vrew Web App...');

        // First try app.vrew.ai for logged-in users
        // If it fails or redirects to login, fall back to base URL
        let targetUrl = CONFIG.appUrl;  // Try paid version first

        // Navigate with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                await this.page.goto(targetUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000,
                });
                break;
            } catch (e) {
                retries--;
                if (retries === 0) {
                    this.log('⚠️', 'Navigation failed, continuing anyway...');
                } else {
                    this.log('🔄', `Retrying... (${retries} attempts left)`);
                    await this.page.waitForTimeout(2000);
                }
            }
        }

        // Wait for loading screen to finish
        this.log('⏳', 'Waiting for app to load...');

        // Wait up to 60 seconds for the page to fully load
        const maxWait = 60000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            // Check if still on loading screen
            const isLoading = await this.page.locator('text=/準備しています/i').first().isVisible()
                .catch(() => false);

            if (!isLoading) {
                this.log('✅', 'Page loaded');
                break;
            }

            await this.page.waitForTimeout(2000);
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            this.log('⏳', `Loading... (${elapsed}s)`);
        }

        await this.page.waitForTimeout(2000);

        // Check if we landed on Try version or error page
        const currentUrl = this.page.url();
        if (currentUrl.includes('/try/') || currentUrl.includes('chrome-error')) {
            this.log('ℹ️', `現在のURL: ${currentUrl}`);
            this.log('🔄', 'Try版またはエラーページを検出。ホームページからリダイレクトを試みます...');

            // Navigate to home page
            await this.page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.page.waitForTimeout(3000);

            // Try to click on "ログイン" button to access paid editor
            // Use JavaScript to find exact button match
            this.log('🔍', 'ログインボタンを検索中...');

            const loginClicked = await this.page.evaluate(() => {
                // Find all buttons and links with "ログイン" text
                const elements = document.querySelectorAll('button, a');
                for (const el of elements) {
                    const text = (el.textContent || '').trim();
                    // Match exact "ログイン" button (not "My Vrew..." containing login)
                    if (text === 'ログイン' || text === 'ログイン会員登録' || text.length < 15 && text.includes('ログイン')) {
                        // Don't click if parent contains "My Vrew"
                        const parentText = el.closest('div, section')?.textContent || '';
                        if (!parentText.includes('My Vrew')) {
                            el.click();
                            return text;
                        }
                    }
                }
                // Fallback: try header login link
                const headerLinks = document.querySelectorAll('header a, nav a, [class*="header"] a');
                for (const el of headerLinks) {
                    const text = (el.textContent || '').trim();
                    if (text.includes('ログイン') && text.length < 20) {
                        el.click();
                        return text;
                    }
                }
                return null;
            }).catch(() => null);

            if (loginClicked) {
                this.log('🖱️', `クリック: "${loginClicked}"`);
                await this.page.waitForTimeout(3000);
            } else {
                // Fallback: try other navigation buttons
                const fallbackSelectors = [
                    'a:has-text("新規プロジェクト")',
                    'button:has-text("新規プロジェクト")',
                    'a[href*="editor"]',
                ];

                for (const selector of fallbackSelectors) {
                    try {
                        const btn = this.page.locator(selector).first();
                        if (await btn.isVisible().catch(() => false)) {
                            const text = await btn.textContent().catch(() => '');
                            this.log('🖱️', `フォールバック: "${text.trim()}"`);
                            await btn.click();
                            await this.page.waitForTimeout(3000);
                            break;
                        }
                    } catch (e) {
                        // Try next
                    }
                }
            }
        }

        await this.screenshot('01_app_loaded');
    }

    async checkLoginStatus() {
        this.log('🔐', 'Checking login status...');

        // Wait a bit for page to fully load
        await this.page.waitForTimeout(2000);

        // Check current URL
        const currentUrl = this.page.url();
        this.log('🌐', `Current URL: ${currentUrl}`);

        // Check for dashboard indicators (logged-in paid version)
        const hasDashboard = await this.page.locator('text=周期ごとの利用量').isVisible()
            .catch(() => false);
        const hasLogoutOnPage = await this.page.locator('button:has-text("ログアウト")').isVisible()
            .catch(() => false);
        const hasPlanSetting = await this.page.locator('button:has-text("プラン設定")').isVisible()
            .catch(() => false);

        const isDashboard = hasDashboard || hasLogoutOnPage || hasPlanSetting;

        if (isDashboard) {
            this.log('✅', '有料版ダッシュボードを検出！');
            this.log('📋', `ダッシュボード: ${hasDashboard}, ログアウト: ${hasLogoutOnPage}, プラン設定: ${hasPlanSetting}`);
            this.loggedIn = true;
            this.isPaidVersion = true;

            // Logged in - continue with paid features enabled on current page
            this.log('✅', 'ログイン状態で有料機能を使用します');
            return true;
        }

        // Check for paid version editor indicators
        const hasLogoutBtn = await this.page.locator('text=ログアウト').isVisible().catch(() => false);
        const hasPaidMenu = await this.page.locator('header:has-text("ファイル")').first().isVisible().catch(() => false);

        if (hasLogoutBtn || hasPaidMenu) {
            this.log('✅', '有料版にログイン済み！');
            this.loggedIn = true;
            this.isPaidVersion = true;
            return true;
        }

        // If on app.vrew.ai (not redirected to login), we're logged in
        if (currentUrl.includes('app.vrew.ai') && !currentUrl.includes('login') && !currentUrl.includes('signin')) {
            this.loggedIn = true;
            this.isPaidVersion = true;
            this.log('✅', '有料版にログイン済み！');
            return true;
        }

        // Vrew Web try version works without login
        if (currentUrl.includes('/try/')) {
            this.log('✅', 'Vrew Web Editor (Try版) 準備完了');
            this.loggedIn = true;
            this.isPaidVersion = false;
            return true;
        }

        // Check for common logged-in indicators
        const signInVisible = await this.page.locator('text=/Sign In|ログイン|無料登録/i').first().isVisible()
            .catch(() => false);

        if (!signInVisible) {
            this.loggedIn = true;
            this.log('✅', 'ログイン済み！');
            return true;
        }

        this.log('📝', 'Login required');
        return false;
    }

    async login() {
        if (!CONFIG.credentials.email || !CONFIG.credentials.password) {
            this.log('⚠️', 'No credentials provided. Set VREW_EMAIL and VREW_PASSWORD');
            this.log('💡', 'Create .env file in AutoVideoGen folder with:');
            console.log('    VREW_EMAIL=your@email.com');
            console.log('    VREW_PASSWORD=your_password');
            this.log('💡', 'Or use --login flag for Google OAuth login');
            return false;
        }

        this.log('🔑', 'Attempting login...');

        // Click Sign In
        const signInBtn = this.page.locator('text=/Sign In|ログイン/i').first();
        if (await signInBtn.isVisible()) {
            await signInBtn.click();
            await this.page.waitForTimeout(2000);
        }

        await this.screenshot('02_login_page');

        // Fill credentials
        // Look for email input
        const emailInput = this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
        if (await emailInput.isVisible()) {
            await emailInput.fill(CONFIG.credentials.email);
        }

        // Look for password input
        const passwordInput = this.page.locator('input[type="password"]').first();
        if (await passwordInput.isVisible()) {
            await passwordInput.fill(CONFIG.credentials.password);
        }

        // Click login button
        const loginBtn = this.page.locator('button[type="submit"], button:has-text(/Log ?in|Sign ?in|ログイン/i)').first();
        if (await loginBtn.isVisible()) {
            await loginBtn.click();
            await this.page.waitForTimeout(5000);
        }

        await this.screenshot('03_after_login');

        // Check if login successful
        const stillHasSignIn = await this.page.locator('text=/Sign In|ログイン/i').first().isVisible()
            .catch(() => false);

        if (!stillHasSignIn) {
            this.loggedIn = true;
            this.log('✅', 'Login successful!');
            await this.saveSession();
            return true;
        }

        this.log('❌', 'Login failed - check credentials');
        return false;
    }

    async manualGoogleLogin() {
        this.log('🔐', 'Manual Google Login Mode');
        this.log('📋', 'ブラウザでログインを完了してください:');
        console.log('');
        console.log('   1. 「無料登録」または「ログイン」をクリック');
        console.log('   2. Googleでログインを選択');
        console.log('   3. Google認証を完了');
        console.log('   4. Vrewのダッシュボードが表示されるまで待つ');
        console.log('');
        this.log('⌨️', 'ログインが完了したらEnterキーを押してください...');
        console.log('');

        // Wait for user to press Enter
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        await new Promise(resolve => {
            rl.question('   [Enterを押して続行] ', () => {
                rl.close();
                resolve();
            });
        });

        // Take screenshot to verify
        await this.screenshot('after_manual_login');

        // Check current URL
        const currentUrl = this.page.url();
        this.log('🌐', `Current URL: ${currentUrl}`);

        if (currentUrl.includes('app.vrew') || currentUrl.includes('/editor') || currentUrl.includes('/dashboard') || currentUrl.includes('/projects')) {
            this.loggedIn = true;
            this.log('✅', 'ログイン成功！');
            this.log('💾', 'ブラウザプロファイルが保存されました。');
            console.log('');
            console.log('   次回からは以下のコマンドで自動実行:');
            console.log('   node scripts/vrew_headless_automation.js');
            console.log('');
            return true;
        }

        // Check for logged-in indicators on vrew.ai
        const hasNewProject = await this.page.locator('text=/New.*Project|新規.*作成|マイページ|プロジェクト/i').first().isVisible()
            .catch(() => false);

        if (hasNewProject) {
            this.loggedIn = true;
            this.log('✅', 'ログイン成功！');
            this.log('💾', 'ブラウザプロファイルが保存されました。');
            return true;
        }

        this.log('⚠️', 'ログイン状態を確認できませんでしたが、プロファイルは保存されました。');
        this.log('💡', '次回実行時にログイン状態を確認します。');
        return true; // Profile is saved anyway
    }

    /**
     * Start a new project - click "新規で作成" or use File menu
     */
    async startNewProject() {
        this.log('🎬', '新規プロジェクトを開始...');

        // Wait for the main UI to be ready
        await this.page.waitForTimeout(2000);

        // Method 1: Try "ファイル" menu -> "新規で作成"
        const fileMenuBtn = this.page.locator('text=ファイル').first();
        if (await fileMenuBtn.isVisible().catch(() => false)) {
            const box = await fileMenuBtn.boundingBox().catch(() => null);
            // Only click if it's in the header (y < 50)
            if (box && box.y < 50) {
                this.log('🖱️', '「ファイル」メニューをクリック');
                await fileMenuBtn.click();
                await this.page.waitForTimeout(1000);

                // Look for "新規で作成" in dropdown
                const newProjectItem = this.page.locator('text=/新規で作成|新規プロジェクト/').first();
                if (await newProjectItem.isVisible().catch(() => false)) {
                    this.log('🖱️', '「新規で作成」をクリック');
                    await newProjectItem.click();
                    await this.page.waitForTimeout(3000);
                    await this.screenshot('02_new_project_clicked');
                    return true;
                }

                // Close menu and try other methods
                await this.page.keyboard.press('Escape');
            }
        }

        // Method 2: Click "新規で作成" button directly
        const createBtnSelectors = [
            'text=/新規で作成/',
            'button:has-text("新規で作成")',
            'text=/新規プロジェクト/',
            'a:has-text("新規")',
            // Toolbar buttons
            '[class*="toolbar"] button:first-child',
            'text=/^新規$/',
        ];

        for (const selector of createBtnSelectors) {
            const btn = this.page.locator(selector).first();
            if (await btn.isVisible().catch(() => false)) {
                const text = await btn.textContent().catch(() => '');
                this.log('🖱️', `「${text.trim() || '新規作成'}」をクリック`);
                await btn.click();
                await this.page.waitForTimeout(3000);
                await this.screenshot('02_new_project_clicked');
                return true;
            }
        }

        // Method 3: Keyboard shortcut Ctrl+N
        this.log('🔍', 'キーボードショートカット Ctrl+N を試行...');
        await this.page.keyboard.press('Control+n');
        await this.page.waitForTimeout(2000);

        // Check if new project dialog appeared
        const dialogAppeared = await this.page.locator('text=/テキストから動画|ビデオスタイル|プロジェクトタイプ/i').first().isVisible()
            .catch(() => false);

        if (dialogAppeared) {
            await this.screenshot('02_new_project_clicked');
            return true;
        }

        this.log('⚠️', '「新規で作成」ボタンが見つかりません');
        await this.screenshot('02_no_new_project_btn');
        return false;
    }

    /**
     * Select project type (text-to-video, etc.)
     */
    async selectProjectType(type = 'text') {
        this.log('📋', `プロジェクトタイプを選択: ${type}`);

        await this.page.waitForTimeout(2000);
        await this.screenshot('03_project_type_selection');

        // Look for text-based video creation option
        const textVideoOptions = [
            'text=/テキストから動画/i',
            'text=/テキストで始める/i',
            'text=/台本から作成/i',
            'text=/Text.*Video/i',
            'text=/スクリプト/i',
        ];

        for (const selector of textVideoOptions) {
            const option = this.page.locator(selector).first();
            if (await option.isVisible().catch(() => false)) {
                this.log('🖱️', 'テキストから動画オプションを選択');
                await option.click();
                await this.page.waitForTimeout(3000);
                await this.screenshot('04_type_selected');

                // Handle video style selection dialog if it appears
                await this.selectVideoStyle();
                return true;
            }
        }

        // If no specific option found, might already be in editor
        this.log('ℹ️', 'タイプ選択画面がスキップされました');
        return true;
    }

    /**
     * Select video style from the style selection dialog
     */
    async selectVideoStyle() {
        this.log('🎨', 'ビデオスタイルを選択中...');

        await this.page.waitForTimeout(2000);

        // Check if style selection dialog is visible
        const styleDialog = await this.page.locator('text=/ビデオスタイルを選択/i').first().isVisible()
            .catch(() => false);

        if (!styleDialog) {
            this.log('ℹ️', 'スタイル選択ダイアログがスキップされました');
            return true;
        }

        await this.screenshot('04a_style_selection');

        // First style is usually already selected (has blue border)
        // Just need to click "次へ" button

        // Try multiple selectors for the "次へ" button
        const nextButtonSelectors = [
            'text=次へ',
            'button >> text=次へ',
            'text=/^次へ$/',
            '[class*="next"]',
            '[class*="confirm"]',
            'button:last-child',
        ];

        for (const selector of nextButtonSelectors) {
            try {
                const btn = this.page.locator(selector).last(); // Use last() as button might be at bottom
                if (await btn.isVisible().catch(() => false)) {
                    this.log('🖱️', '「次へ」ボタンを発見');
                    await btn.click();
                    await this.page.waitForTimeout(3000);
                    await this.screenshot('04b_style_selected');
                    return true;
                }
            } catch (e) {
                // Try next selector
            }
        }

        // Fallback: click by text directly
        this.log('🖱️', '「次へ」をテキストで検索');
        const nextText = this.page.getByText('次へ', { exact: true });
        if (await nextText.isVisible().catch(() => false)) {
            await nextText.click();
            await this.page.waitForTimeout(3000);
            await this.screenshot('04b_style_selected');
            return true;
        }

        // Another fallback: use keyboard
        this.log('⌨️', 'Enterキーで確定を試行');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(3000);
        await this.screenshot('04b_style_keyboard');

        return true;
    }

    /**
     * Enter script text for video generation
     * Enters the script directly into the 台本 (script) area on the RIGHT side
     */
    async enterScript(script) {
        this.log('📝', '台本を入力中...');

        await this.page.waitForTimeout(2000);

        // Method 1: Use the script-textarea directly (Vrew's main script input)
        const scriptTextarea = this.page.locator('textarea[data-context-menu-id="script-textarea"]');
        if (await scriptTextarea.isVisible().catch(() => false)) {
            this.log('📝', 'script-textarea を検出');
            try {
                await scriptTextarea.click();
                await this.page.waitForTimeout(300);
                await scriptTextarea.fill(script);
                this.log('✍️', `台本入力完了 (${script.length}文字) - textarea`);
                await this.screenshot('05_script_entered');
                return true;
            } catch (e) {
                this.log('⚠️', `textarea入力エラー: ${e.message}`);
            }
        }

        // Method 2: Find any visible textarea with script-related placeholder
        const textareas = await this.page.locator('textarea').all();
        for (const textarea of textareas) {
            const placeholder = await textarea.getAttribute('placeholder').catch(() => '');
            if (placeholder && (placeholder.includes('台本') || placeholder.includes('スクリプト'))) {
                this.log('📝', 'プレースホルダー付きtextareaを検出');
                try {
                    await textarea.click();
                    await this.page.waitForTimeout(300);
                    await textarea.fill(script);
                    this.log('✍️', `台本入力完了 (${script.length}文字)`);
                    await this.screenshot('05_script_entered');
                    return true;
                } catch (e) {
                    this.log('⚠️', `入力エラー: ${e.message}`);
                }
            }
        }

        // Method 3: Fallback to contenteditable (filtered by position)
        this.log('📝', 'フォールバック: contenteditable要素を検索');
        const editableElements = await this.page.locator('[contenteditable="true"]').all();

        for (const element of editableElements) {
            const box = await element.boundingBox().catch(() => null);
            if (box && box.x > 550) {  // Right side of the dialog
                try {
                    await element.click({ force: true });
                    await this.page.waitForTimeout(500);
                    await element.fill(script);
                    this.log('✍️', `台本入力完了 (${script.length}文字) - contenteditable`);
                    await this.screenshot('05_script_entered');
                    return true;
                } catch (e) {
                    this.log('⚠️', `入力エラー: ${e.message}`);
                }
            }
        }

        // Method 4: Direct keyboard input
        this.log('📝', 'フォールバック: キーボード直接入力');
        try {
            await this.page.mouse.click(900, 400);
            await this.page.waitForTimeout(500);
            await this.page.keyboard.type(script, { delay: 5 });
            this.log('✍️', `台本入力完了 (キーボード入力)`);
            await this.screenshot('05_script_entered');
            return true;
        } catch (e) {
            this.log('❌', `フォールバック入力エラー: ${e.message}`);
        }

        return false;
    }

    /**
     * Handle confirmation/error dialogs
     */
    async handleDialog() {
        this.log('🔍', '確認ダイアログを検索中...');

        await this.page.waitForTimeout(1000);

        // Take screenshot of current state
        await this.screenshot('dialog_state');

        // Specifically look for the confirmation dialog with "動画作成を始めますか？"
        const confirmationText = await this.page.locator('text=動画作成を始めますか').isVisible()
            .catch(() => false);

        if (!confirmationText) {
            this.log('ℹ️', '確認ダイアログ「動画作成を始めますか？」が見つかりません');
            return false;
        }

        this.log('✅', '確認ダイアログを検出しました');

        // Method 1: Use JavaScript to find and click the button directly
        try {
            const clicked = await this.page.evaluate(() => {
                // Find all buttons on the page
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const text = btn.textContent || '';
                    // Look for the confirm button (確認) that's not the cancel button
                    if (text.includes('確認') && !text.includes('キャンセル')) {
                        // Check if this button is in a modal/dialog context
                        const parent = btn.closest('.ReactModal__Content, [role="dialog"], .modal');
                        if (parent || btn.closest('div')?.textContent?.includes('動画作成を始めますか')) {
                            console.log('Found confirm button:', text);
                            btn.click();
                            return true;
                        }
                    }
                }
                return false;
            });

            if (clicked) {
                this.log('✅', '確認ボタンをクリックしました (JavaScript)');
                await this.page.waitForTimeout(2000);
                await this.screenshot('dialog_after_js_click');
                return true;
            }
        } catch (e) {
            this.log('⚠️', `JavaScript click エラー: ${e.message}`);
        }

        // Method 2: Try to find button near the confirmation text
        try {
            // Find the dialog container that has the confirmation text
            const dialogContainer = this.page.locator('div:has(text="動画作成を始めますか")').first();
            const confirmBtn = dialogContainer.locator('button:has-text("確認")').first();

            if (await confirmBtn.isVisible().catch(() => false)) {
                const box = await confirmBtn.boundingBox().catch(() => null);
                this.log('📍', `確認ボタン発見: ${box ? `x=${box.x}, y=${box.y}` : 'box not found'}`);

                await confirmBtn.click({ force: true });
                this.log('✅', '確認ボタンをクリックしました (Playwright locator)');
                await this.page.waitForTimeout(2000);
                await this.screenshot('dialog_after_locator_click');
                return true;
            }
        } catch (e) {
            this.log('⚠️', `Locator click エラー: ${e.message}`);
        }

        // Method 3: Use page.click with text selector
        try {
            // Wait for the button to be clickable
            await this.page.waitForSelector('button:has-text("確認")', { state: 'visible', timeout: 5000 });

            // Get all buttons with 確認
            const buttons = await this.page.locator('button:has-text("確認")').all();
            this.log('🔍', `「確認」ボタン候補: ${buttons.length}件`);

            for (const btn of buttons) {
                const text = await btn.textContent().catch(() => '');
                const box = await btn.boundingBox().catch(() => null);

                // Skip if it contains キャンセル or is the dialog title
                if (text.includes('キャンセル') || !box) continue;

                this.log('📍', `ボタン "${text.trim()}": x=${box.x}, y=${box.y}`);

                // The confirm button in the dialog should be roughly in the center of the screen
                // and have a reasonable size
                if (box.width > 50 && box.width < 200 && box.height > 30 && box.height < 60) {
                    await btn.click({ force: true });
                    this.log('✅', '確認ボタンをクリックしました');
                    await this.page.waitForTimeout(2000);

                    // Verify dialog is closed
                    const stillVisible = await this.page.locator('text=動画作成を始めますか').isVisible()
                        .catch(() => false);
                    if (!stillVisible) {
                        this.log('✅', 'ダイアログが閉じました');
                        return true;
                    }
                }
            }
        } catch (e) {
            this.log('⚠️', `Text selector click エラー: ${e.message}`);
        }

        // Method 4: Direct coordinate click based on dialog position
        this.log('🖱️', '座標クリックを試行...');

        // Get the position of the confirmation text to estimate button position
        try {
            const textElement = this.page.locator('text=動画作成を始めますか').first();
            const textBox = await textElement.boundingBox().catch(() => null);

            if (textBox) {
                // The confirm button is typically below the text, slightly to the left
                const btnX = textBox.x + 30;  // Left side of button area
                const btnY = textBox.y + textBox.height + 40;  // Below the text

                this.log('📍', `テキスト位置: x=${textBox.x}, y=${textBox.y}`);
                this.log('🖱️', `推定ボタン座標: (${btnX}, ${btnY})`);

                await this.page.mouse.click(btnX, btnY);
                await this.page.waitForTimeout(2000);

                const stillVisible = await this.page.locator('text=動画作成を始めますか').isVisible()
                    .catch(() => false);
                if (!stillVisible) {
                    this.log('✅', 'ダイアログが閉じました (座標クリック)');
                    await this.screenshot('dialog_closed_by_coord');
                    return true;
                }
            }
        } catch (e) {
            this.log('⚠️', `座標計算エラー: ${e.message}`);
        }

        this.log('❌', '確認ボタンをクリックできませんでした');
        await this.screenshot('dialog_click_failed');
        return false;
    }

    /**
     * Start video generation (skip AI writing, use existing script)
     */
    async generateVideo() {
        this.log('🎬', 'ビデオ生成を開始...');

        // Skip AI writing - we use pre-made scripts
        // Directly click "次へ" to proceed to video customization
        const nextSelectors = [
            'text=次へ',
            'button:has-text(/次へ/)',
            '[class*="next"]',
        ];

        for (const selector of nextSelectors) {
            try {
                const btn = this.page.locator(selector).last();
                if (await btn.isVisible().catch(() => false)) {
                    this.log('🖱️', '「次へ」をクリック - ビデオカスタマイズへ');
                    await btn.click();
                    await this.page.waitForTimeout(3000);
                    await this.screenshot('06c_video_customize');

                    // Now we're on the video customization step
                    return await this.customizeAndGenerateVideo();
                }
            } catch (e) {
                // Try next selector
            }
        }

        this.log('⚠️', '「次へ」ボタンが見つかりません');
        await this.screenshot('06_no_next_button');
        return false;
    }

    /**
     * Customize video settings and start final generation
     */
    async customizeAndGenerateVideo() {
        this.log('🎨', 'ビデオをカスタマイズ中...');

        await this.page.waitForTimeout(3000);
        await this.screenshot('07_video_customization');

        // Click "完了" (Complete) button to start video generation
        const completeSelectors = [
            'button:has-text(/完了/)',
            'text=完了',
            'button:has-text(/Complete/i)',
            'button:has-text(/Finish/i)',
        ];

        for (const selector of completeSelectors) {
            try {
                const btn = this.page.locator(selector).last(); // Use last() as button is at bottom
                if (await btn.isVisible().catch(() => false)) {
                    this.log('🖱️', '「完了」をクリック - ビデオ生成開始');
                    await btn.click();
                    await this.page.waitForTimeout(2000);

                    // Handle confirmation dialog "動画作成を始めますか？"
                    const confirmDialog = await this.page.locator('text=/動画作成を始めますか/').first().isVisible()
                        .catch(() => false);

                    if (confirmDialog) {
                        this.log('🖱️', '確認ダイアログ「確認」をクリック');
                        await this.handleDialog();
                    }

                    await this.screenshot('07b_generation_started');

                    // Wait for generation to complete
                    return await this.waitForGeneration();
                }
            } catch (e) {
                // Try next selector
            }
        }

        this.log('⚠️', '「完了」ボタンが見つかりません');
        return false;
    }

    /**
     * Wait for video generation to complete
     */
    async waitForGeneration() {
        this.log('⏳', 'ビデオ生成中... (最大10分)');

        const maxWait = 10 * 60 * 1000; // 10 minutes
        const startTime = Date.now();
        let lastProgress = '';
        let dialogHandled = false;

        while (Date.now() - startTime < maxWait) {
            // First, check if confirmation dialog is still open and handle it
            const confirmDialogVisible = await this.page.locator('text=動画作成を始めますか').isVisible()
                .catch(() => false);

            if (confirmDialogVisible && !dialogHandled) {
                this.log('🔄', '確認ダイアログがまだ開いています。再度クリックを試行...');
                await this.handleDialog();
                await this.page.waitForTimeout(2000);
                dialogHandled = true;
                continue;
            }

            // Check if we're out of the customization dialog (no more "完了" button visible as main action)
            const customizeDialogVisible = await this.page.locator('.ReactModal__Content button:has-text("完了")').isVisible()
                .catch(() => false);

            // Check for progress indicators
            const progressText = await this.page.locator('text=/\\d+%|処理中|生成中|Loading/i').first().textContent()
                .catch(() => '');

            if (progressText && progressText !== lastProgress) {
                this.log('📊', `進捗: ${progressText}`);
                lastProgress = progressText;
            }

            // Check for actual completion indicators (more specific)
            // Look for export button, timeline view, or editor view
            const hasExportBtn = await this.page.locator('button:has-text("エクスポート"), [class*="export"]').first().isVisible()
                .catch(() => false);
            const hasTimeline = await this.page.locator('[class*="timeline"], [class*="editor"]').first().isVisible()
                .catch(() => false);
            const hasVideoPreview = await this.page.locator('video, [class*="preview"], [class*="player"]').first().isVisible()
                .catch(() => false);

            // Completion: No customize dialog, no confirm dialog, and we have editor elements
            const isComplete = !customizeDialogVisible && !confirmDialogVisible &&
                (hasExportBtn || hasTimeline || hasVideoPreview);

            if (isComplete) {
                this.log('✅', 'ビデオ生成完了！');
                this.log('📋', `エクスポートボタン: ${hasExportBtn}, タイムライン: ${hasTimeline}, プレビュー: ${hasVideoPreview}`);
                await this.screenshot('07_generation_complete');
                return true;
            }

            // Check for error
            const hasError = await this.page.locator('text=/エラー|Error|失敗/i').first().isVisible()
                .catch(() => false);

            if (hasError && !confirmDialogVisible) {
                this.log('❌', '生成エラーが発生しました');
                await this.screenshot('07_generation_error');
                return false;
            }

            await this.page.waitForTimeout(5000);
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            if (elapsed % 30 === 0) {
                this.log('⏳', `生成中... (${elapsed}秒経過)`);
                await this.screenshot(`07_generating_${elapsed}s`);
            }
        }

        this.log('⚠️', '生成タイムアウト');
        return false;
    }

    /**
     * Export the generated video
     */
    async exportVideo() {
        this.log('📤', 'ビデオをエクスポート中...');

        // Start Python save dialog handler in background
        const saveDialogHandler = this.startSaveDialogHandler();

        try {
            const result = await this._exportVideoInternal();
            return result;
        } finally {
            // Stop the Python handler when done
            this.stopSaveDialogHandler(saveDialogHandler);
        }
    }

    /**
     * Start Python save dialog handler as background process
     */
    startSaveDialogHandler() {
        const pythonScript = path.join(__dirname, 'save_dialog_handler.py');

        if (!fs.existsSync(pythonScript)) {
            this.log('⚠️', 'save_dialog_handler.py が見つかりません');
            return null;
        }

        this.log('🐍', 'Pythonダイアログハンドラーを起動中...');

        const handler = spawn('python', [
            pythonScript,
            '--timeout', '180',
            '--output-dir', CONFIG.outputDir,
            '--interval', '0.5'
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        handler.stdout.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => {
                if (line.includes('Save dialog detected') || line.includes('📁') || line.includes('✅')) {
                    this.log('🐍', line.trim());
                }
            });
        });

        handler.stderr.on('data', (data) => {
            this.log('🐍⚠️', data.toString().trim());
        });

        handler.on('error', (err) => {
            this.log('⚠️', `Pythonハンドラーエラー: ${err.message}`);
        });

        return handler;
    }

    /**
     * Stop Python save dialog handler
     */
    stopSaveDialogHandler(handler) {
        if (handler && !handler.killed) {
            this.log('🐍', 'Pythonダイアログハンドラーを停止中...');
            handler.kill('SIGTERM');
        }
    }

    /**
     * Internal export implementation
     */
    async _exportVideoInternal() {
        // First, close any tooltips/info dialogs by clicking elsewhere
        await this.page.mouse.click(100, 100);
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(1000);

        // Take screenshot of current state
        await this.screenshot('08_before_export');

        // Method 1: Try File menu -> Export
        try {
            this.log('🔍', 'ファイルメニューからエクスポートを探す...');

            // Find the header menu bar first
            const headerMenuSelectors = [
                'header [class*="menu"]',
                '[class*="menubar"]',
                '[class*="toolbar"] [class*="menu"]',
                'nav',
            ];

            // Click on "ファイル" in the header menu (not in sidebar)
            const fileMenuSelectors = [
                'header text=ファイル',
                '[class*="menubar"] text=ファイル',
                'nav text=ファイル',
                // More specific: menu item that's in header area (top of page)
                'text=ファイル >> nth=0',
            ];

            let menuOpened = false;
            for (const selector of fileMenuSelectors) {
                try {
                    const fileMenu = this.page.locator(selector);
                    const count = await fileMenu.count();
                    if (count > 0) {
                        const box = await fileMenu.first().boundingBox().catch(() => null);
                        // Only click if it's in the top area (header) - y < 100
                        if (box && box.y < 100) {
                            this.log('📍', `ファイルメニュー位置: x=${box.x}, y=${box.y}`);
                            await fileMenu.first().click();
                            await this.page.waitForTimeout(1500);
                            await this.screenshot('08_file_menu');
                            menuOpened = true;
                            break;
                        }
                    }
                } catch (e) {
                    // Try next selector
                }
            }

            if (menuOpened) {
                // Look for export option in the dropdown menu
                // Be specific: only match menu items, not header buttons
                const exportMenuSelectors = [
                    '[role="menuitem"]:has-text("エクスポート")',
                    '[role="menu"] :has-text("エクスポート")',
                    'li:has-text("動画をエクスポート")',
                    'li:has-text("エクスポート"):not(:has-text("アプリ"))',
                    '[class*="dropdown"] :has-text("エクスポート"):not(:has-text("アプリ"))',
                ];

                for (const selector of exportMenuSelectors) {
                    try {
                        const menuItem = this.page.locator(selector).first();
                        if (await menuItem.isVisible().catch(() => false)) {
                            const itemText = await menuItem.textContent().catch(() => '');
                            // Skip if it contains "アプリ" (app download)
                            if (!itemText.includes('アプリ')) {
                                this.log('🖱️', `メニュー項目発見: "${itemText.trim()}"`);
                                await menuItem.click();
                                await this.page.waitForTimeout(2000);
                                await this.screenshot('08_export_menu_clicked');
                                return await this.handleExportDialog();
                            }
                        }
                    } catch (e) {
                        // Try next
                    }
                }

                // Close menu if no export option found
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
            }
        } catch (e) {
            this.log('⚠️', `ファイルメニューエラー: ${e.message}`);
        }

        // Method 2: Try keyboard shortcut
        try {
            this.log('🔍', 'キーボードショートカットを試行 (Ctrl+E)...');
            await this.page.keyboard.press('Control+e');
            await this.page.waitForTimeout(2000);

            // Check if export dialog appeared
            const exportDialog = await this.page.locator('text=/エクスポート設定|Export settings/i').isVisible()
                .catch(() => false);
            if (exportDialog) {
                await this.screenshot('08_export_dialog');
                return await this.handleExportDialog();
            }
        } catch (e) {
            this.log('⚠️', `ショートカットエラー: ${e.message}`);
        }

        // Method 3: Look for export button in toolbar or UI
        // Note: Vrew uses "書き出し" (kakidashi) for export
        const exportSelectors = [
            // Primary: "書き出し" button (Vrew's export term)
            'button:has-text("書き出し")',
            'text=書き出し',
            // Specific export buttons (avoid "アプリダウンロード")
            'button:has-text("エクスポート"):not(:has-text("アプリ"))',
            '[class*="export-btn"], [class*="exportBtn"]',
            'a:has-text("エクスポート"):not(:has-text("アプリ"))',
            // Toolbar buttons
            '[class*="toolbar"] button:has-text(/エクスポート|Export|書き出し/i)',
            // Header buttons
            'header button:has-text(/エクスポート|Export|書き出し/i)',
        ];

        for (const selector of exportSelectors) {
            try {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    const btnText = await btn.textContent().catch(() => '');
                    this.log('🖱️', `エクスポートボタン発見: "${btnText}"`);

                    // Set up download handler
                    const downloadPromise = this.page.waitForEvent('download', { timeout: 300000 }).catch(() => null);

                    await btn.click();
                    await this.page.waitForTimeout(2000);
                    await this.screenshot('08_export_clicked');

                    return await this.handleExportDialog();
                }
            } catch (e) {
                // Try next selector
            }
        }

        // Method 4: Try JavaScript to find export functionality
        try {
            this.log('🔍', 'JavaScriptでエクスポート機能を探す...');
            const exportInfo = await this.page.evaluate(() => {
                // Look for any element with export-related text
                const allElements = document.querySelectorAll('button, a, [role="menuitem"], li');
                const found = [];
                for (const el of allElements) {
                    const text = el.textContent || '';
                    if (text.includes('エクスポート') || text.includes('Export') || text.includes('書き出し')) {
                        found.push({
                            tag: el.tagName,
                            text: text.substring(0, 50),
                            className: el.className,
                            visible: el.offsetParent !== null
                        });
                    }
                }
                return found;
            });

            this.log('📋', `エクスポート関連要素: ${exportInfo.length}件`);
            for (const info of exportInfo.slice(0, 5)) {
                this.log('📋', `  - [${info.tag}] "${info.text}" (visible: ${info.visible})`);
            }
        } catch (e) {
            this.log('⚠️', `JavaScript検索エラー: ${e.message}`);
        }

        // Check if this is Try version
        const isTryVersion = await this.page.url().includes('/try/');

        if (isTryVersion) {
            this.log('ℹ️', 'Vrew Web Try版を使用中');
            this.log('ℹ️', 'プロジェクトは作成されましたが、フルエクスポートにはデスクトップアプリまたは有料版が必要な場合があります');
            await this.screenshot('08_try_version_info');

            // Still mark as success since the video was generated
            return 'PROJECT_CREATED';
        }

        this.log('⚠️', 'エクスポートボタンが見つかりません');
        await this.screenshot('08_no_export_button');
        return null;
    }

    /**
     * Close blocking dialogs like cloud save info, update notifications
     */
    async closeBlockingDialogs() {
        this.log('🔄', 'ブロッキングダイアログをチェック中...');

        // Close "動画をクラウドに保存する方法" dialog
        const cloudInfoDialog = await this.page.locator('text=動画をクラウドに保存する方法').isVisible().catch(() => false);
        if (cloudInfoDialog) {
            this.log('ℹ️', 'クラウド保存説明ダイアログを閉じます...');
            // Try to find and click the close button
            const closeSelectors = [
                'button:has-text("閉じる")',
                'button:has-text("×")',
                '[class*="close"]',
                '[aria-label="close"]',
                '[aria-label="閉じる"]',
            ];

            let closed = false;
            for (const selector of closeSelectors) {
                try {
                    const closeBtn = this.page.locator(selector).first();
                    if (await closeBtn.isVisible().catch(() => false)) {
                        await closeBtn.click();
                        closed = true;
                        this.log('✅', 'ダイアログを閉じました');
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!closed) {
                // Try clicking outside the dialog or pressing Escape
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);

                // Try clicking on the backdrop/overlay
                await this.page.evaluate(() => {
                    const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="modal-bg"]');
                    for (const overlay of overlays) {
                        overlay.click();
                    }
                });
            }
            await this.page.waitForTimeout(1000);
        }

        // Close update notification popup
        const updatePopup = await this.page.locator('text=アップデートのお知らせ').isVisible().catch(() => false);
        if (updatePopup) {
            this.log('ℹ️', 'アップデート通知を閉じます...');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
        }

        // Close any other popups with "閉じる" or "×" buttons
        const genericCloseBtn = this.page.locator('button:has-text("閉じる"), button:has-text("OK")').first();
        if (await genericCloseBtn.isVisible().catch(() => false)) {
            const btnText = await genericCloseBtn.textContent().catch(() => '');
            if (!btnText.includes('書き出し') && !btnText.includes('エクスポート')) {
                await genericCloseBtn.click();
                this.log('ℹ️', `ダイアログを閉じました: ${btnText.trim()}`);
                await this.page.waitForTimeout(500);
            }
        }
    }

    /**
     * Handle export dialog and wait for download
     */
    async handleExportDialog() {
        this.log('📤', 'エクスポートダイアログを処理中...');

        // Check if we're on Try version - export may be limited
        // Use isPaidVersion flag first, then URL as fallback
        const currentUrl = this.page.url();
        const isTryVersion = !this.isPaidVersion && currentUrl.includes('/try/');

        if (isTryVersion) {
            this.log('⚠️', 'Try版を検出 - エクスポート機能が制限される可能性があります');
        } else if (this.isPaidVersion) {
            this.log('✅', '有料版でエクスポート中...');
        }

        // Close any blocking dialogs (cloud save info, update notifications)
        await this.closeBlockingDialogs();

        // Wait for export dialog to load
        await this.page.waitForTimeout(2000);
        await this.screenshot('08_export_dialog');

        // Note: downloadPromise will be set up after clicking export button
        let downloadPromise = null;

        // Step 1: Click on "動画ファイル(mp4)" option in the export panel
        const mp4Selectors = [
            'text=動画ファイル(mp4)',
            'text=動画ファイル',
            'button:has-text("動画ファイル")',
            '[class*="export"] :has-text("mp4")',
            ':has-text("動画ファイル"):has-text("mp4")',
        ];

        let mp4Clicked = false;
        for (const selector of mp4Selectors) {
            try {
                const mp4Option = this.page.locator(selector).first();
                if (await mp4Option.isVisible().catch(() => false)) {
                    const text = await mp4Option.textContent().catch(() => '');
                    this.log('🖱️', `「${text.trim()}」をクリック`);
                    await mp4Option.click();
                    await this.page.waitForTimeout(2000);
                    await this.screenshot('08_mp4_option_clicked');
                    mp4Clicked = true;
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        // If mp4 option wasn't clicked directly, try JavaScript click
        if (!mp4Clicked) {
            this.log('🔄', 'JavaScriptで動画ファイルオプションをクリック...');
            mp4Clicked = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                    const text = el.textContent || '';
                    if (text.includes('動画ファイル') && text.includes('mp4')) {
                        el.click();
                        return true;
                    }
                }
                // Also try clicking elements with just "動画ファイル"
                for (const el of elements) {
                    const text = (el.innerText || '').trim();
                    if (text === '動画ファイル(mp4)' || text.startsWith('動画ファイル')) {
                        el.click();
                        return true;
                    }
                }
                return false;
            }).catch(() => false);

            if (mp4Clicked) {
                await this.page.waitForTimeout(2000);
                await this.screenshot('08_mp4_js_clicked');
            }
        }

        // Step 2: Wait for and handle "動画を書き出す" dialog
        await this.page.waitForTimeout(1500);

        // Look for the export confirmation dialog
        const exportDialogVisible = await this.page.locator('text=動画を書き出す').isVisible()
            .catch(() => false);

        if (exportDialogVisible) {
            this.log('📋', '「動画を書き出す」ダイアログを検出');
            await this.screenshot('08_export_confirm_dialog');
        }

        // Look for confirm/start export button - specifically the "書き出し" button in the dialog
        const confirmSelectors = [
            // Primary: 書き出し button in the modal (not in the right panel)
            '[class*="modal"] button:has-text("書き出し")',
            'div[role="dialog"] button:has-text("書き出し")',
            // Button next to cancel button
            'button:has-text("書き出し"):near(button:has-text("キャンセル"))',
            // Blue/primary button with 書き出し text
            'button:has-text("書き出し"):not(:has-text("他の形式"))',
            'button:has-text(/^書き出し$/)',
            // General selectors
            'button:has-text(/OK|確定|開始|エクスポート開始|Export|書き出し開始/i)',
            '[class*="export"] button[class*="primary"]',
            '[class*="modal"] button[class*="confirm"]',
            'button[class*="primary"]:has-text(/書き出し|Export/i)',
        ];

        let exportStarted = false;
        for (const selector of confirmSelectors) {
            try {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    const btnText = await btn.textContent().catch(() => '');
                    // Skip if this is the panel button (right side)
                    if (btnText.includes('他の形式') || btnText.length > 20) {
                        continue;
                    }
                    this.log('🖱️', `エクスポート確定ボタンをクリック: "${btnText.trim()}"`);
                    await btn.click();
                    await this.page.waitForTimeout(2000);
                    await this.screenshot('08_export_started');
                    exportStarted = true;
                    break;
                }
            } catch (e) {
                // Try next
            }
        }

        // Fallback: Use JavaScript to find and click the button
        if (!exportStarted) {
            this.log('🔄', 'JavaScriptで「書き出し」ボタンをクリック...');
            exportStarted = await this.page.evaluate(() => {
                // Find the modal/dialog first
                const modals = document.querySelectorAll('[class*="modal"], [role="dialog"], div[style*="z-index"]');
                for (const modal of modals) {
                    const buttons = modal.querySelectorAll('button');
                    for (const btn of buttons) {
                        const text = btn.textContent || '';
                        // Match "書き出し" button that's NOT the "書き出し" in the right panel
                        if (text.trim() === '書き出し' || (text.includes('書き出し') && !text.includes('他の形式') && text.length < 15)) {
                            btn.click();
                            return true;
                        }
                    }
                }
                // Also try finding a blue/primary styled button
                const allButtons = document.querySelectorAll('button');
                for (const btn of allButtons) {
                    const text = btn.textContent || '';
                    const style = window.getComputedStyle(btn);
                    const bgColor = style.backgroundColor;
                    // Check if it's a blue button with "書き出し" text
                    if (text.trim() === '書き出し' && (bgColor.includes('rgb(0') || bgColor.includes('41, 121') || btn.className.includes('primary'))) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            }).catch(() => false);

            if (exportStarted) {
                await this.page.waitForTimeout(2000);
                await this.screenshot('08_export_js_started');
            }
        }

        // Set up download handler AFTER clicking export button
        downloadPromise = this.page.waitForEvent('download', { timeout: 60000 }).catch(() => null);

        // Wait for export progress or download
        this.log('⏳', 'エクスポート処理中...');

        // Check for export progress dialog
        let exportCompleted = false;
        const maxWait = 2 * 60 * 1000; // 2 minutes max for export (reduced from 5)
        const startTime = Date.now();
        let lastLogTime = 0;
        let lastProgressText = '';

        while (Date.now() - startTime < maxWait) {
            // Check for download event (with short timeout)
            try {
                const download = await Promise.race([
                    downloadPromise,
                    new Promise(resolve => setTimeout(() => resolve(null), 3000))
                ]);

                if (download) {
                    const filename = download.suggestedFilename() || `vrew_video_${Date.now()}.mp4`;
                    const filePath = path.join(CONFIG.outputDir, filename);
                    await download.saveAs(filePath);
                    this.log('✅', `ビデオ保存完了: ${filename}`);
                    await this.screenshot('08_download_complete');
                    return filePath;
                }
            } catch (e) {
                // Download timeout - continue checking
            }

            // Check for progress indicator
            const progressText = await this.page.locator('text=/\\d+%|処理中|変換中|書き出し中|Exporting/i').first().textContent()
                .catch(() => '');
            if (progressText && progressText !== lastProgressText) {
                this.log('📊', `エクスポート進捗: ${progressText}`);
                lastProgressText = progressText;
            }

            // Check for completion message
            const completeText = await this.page.locator('text=/完了|Complete|書き出し完了/i').isVisible()
                .catch(() => false);
            if (completeText) {
                this.log('✅', 'エクスポート完了メッセージを検出');
                exportCompleted = true;
                break;
            }

            // Check for error
            const errorText = await this.page.locator('text=/エラー|Error|失敗/i').isVisible()
                .catch(() => false);
            if (errorText) {
                this.log('❌', 'エクスポートエラーが発生');
                await this.screenshot('08_export_error');
                return null;
            }

            // Check if export dialog closed (might indicate completion or cancellation)
            const dialogStillOpen = await this.page.locator('text=動画を書き出す').isVisible()
                .catch(() => false);
            const exportPanelOpen = await this.page.locator('text=動画ファイル(mp4)').isVisible()
                .catch(() => false);

            if (!dialogStillOpen && !exportPanelOpen && !completeText) {
                this.log('ℹ️', 'エクスポートダイアログが閉じました');
                await this.screenshot('08_dialog_closed');

                // For Try version, this might mean export was blocked
                if (isTryVersion) {
                    this.log('⚠️', 'Try版ではエクスポートが制限されている可能性があります');
                    this.log('💡', 'ビデオ生成は完了しました。フルエクスポートには有料版が必要です。');
                    return 'TRY_VERSION_EXPORT_LIMITED';
                }
                break;
            }

            // Log progress every 15 seconds (fixed duplicate log issue)
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            if (elapsed - lastLogTime >= 15) {
                this.log('⏳', `エクスポート中... (${elapsed}秒経過)`);
                lastLogTime = elapsed;
            }

            // Short wait before next check
            await this.page.waitForTimeout(2000);
        }

        await this.screenshot('08_export_final');

        // Final check for download
        if (downloadPromise) {
            try {
                const download = await Promise.race([
                    downloadPromise,
                    new Promise(resolve => setTimeout(() => resolve(null), 5000))
                ]);

                if (download) {
                    const filename = download.suggestedFilename() || `vrew_video_${Date.now()}.mp4`;
                    const filePath = path.join(CONFIG.outputDir, filename);
                    await download.saveAs(filePath);
                    this.log('✅', `ビデオ保存完了: ${filename}`);
                    await this.screenshot('08_download_complete');
                    return filePath;
                }
            } catch (e) {
                // Final download check failed
            }
        }

        // For Try version, return special status
        if (isTryVersion) {
            this.log('ℹ️', 'Try版でのエクスポート処理が完了しました');
            this.log('💡', 'フルダウンロードには有料版が必要な場合があります');
            return 'TRY_VERSION_COMPLETED';
        }

        this.log('⚠️', 'ダウンロードがタイムアウトしました');
        await this.screenshot('08_download_timeout');

        // Fallback: Try cloud save and download
        this.log('🔄', 'クラウド保存からのダウンロードを試みます...');
        const cloudResult = await this.tryCloudSaveAndDownload();
        if (cloudResult) {
            return cloudResult;
        }

        return null;
    }

    /**
     * Try cloud save and then download from cloud
     */
    async tryCloudSaveAndDownload() {
        try {
            // Close any blocking dialogs/popups first (like update notifications)
            await this.screenshot('09_before_cloud_save');

            // Close update notification popup if present
            const updatePopup = this.page.locator('text=アップデートのお知らせ');
            if (await updatePopup.isVisible().catch(() => false)) {
                this.log('ℹ️', 'アップデート通知を閉じます...');
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
            }

            // Close the cloud save info dialog
            const cloudInfoDialog = this.page.locator('text=動画をクラウドに保存する方法');
            if (await cloudInfoDialog.isVisible().catch(() => false)) {
                this.log('ℹ️', 'クラウド保存情報ダイアログを閉じます...');
                // Try clicking close button or pressing Escape
                const closeBtn = this.page.locator('[class*="close"], button:has-text("閉じる"), button:has-text("×")').first();
                if (await closeBtn.isVisible().catch(() => false)) {
                    await closeBtn.click();
                } else {
                    await this.page.keyboard.press('Escape');
                }
                await this.page.waitForTimeout(1000);
            }

            await this.screenshot('09_dialogs_closed');

            // Try to find the project in My Vrew or click save button
            // First, try to save the current project
            const saveSelectors = [
                'button:has-text("保存"):not(:has-text("名前"))',
                '[class*="save"]:not([class*="download"])',
                'text=プロジェクトを保存',
            ];

            for (const selector of saveSelectors) {
                try {
                    const btn = this.page.locator(selector).first();
                    if (await btn.isVisible().catch(() => false)) {
                        const btnText = await btn.textContent().catch(() => '');
                        // Skip if it's installer related
                        if (btnText.includes('インストール') || btnText.includes('Installer')) {
                            continue;
                        }
                        this.log('🖱️', `保存ボタン発見: ${btnText.trim()}`);
                        await btn.click();
                        await this.page.waitForTimeout(3000);
                        await this.screenshot('09_save_clicked');
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            // Wait for save to complete
            await this.page.waitForTimeout(3000);

            // Now look for download button - but avoid installer links
            // Use JavaScript to find the correct download link
            const downloadLink = await this.page.evaluate(() => {
                const links = document.querySelectorAll('a, button');
                for (const link of links) {
                    const text = link.textContent || '';
                    const href = link.href || '';
                    // Skip installer links
                    if (href.includes('Installer') || href.includes('.exe') ||
                        text.includes('インストール') || text.includes('Installer') ||
                        text.includes('最新版')) {
                        continue;
                    }
                    // Look for video download links
                    if (text.includes('ダウンロード') || text.includes('Download')) {
                        if (href.includes('.mp4') || href.includes('video') || href.includes('export')) {
                            return { found: true, text: text.trim() };
                        }
                    }
                }
                return { found: false };
            });

            if (downloadLink.found) {
                this.log('🖱️', `ビデオダウンロードリンク発見: ${downloadLink.text}`);
            }

            // Set up download listener with filtering
            const downloadPromise = this.page.waitForEvent('download', { timeout: 60000 }).catch(() => null);

            // Click on video-related download button (avoid installer)
            const clicked = await this.page.evaluate(() => {
                const buttons = document.querySelectorAll('button, a');
                for (const btn of buttons) {
                    const text = btn.textContent || '';
                    const href = btn.href || '';
                    // Skip installer links
                    if (href.includes('Installer') || href.includes('.exe') ||
                        text.includes('インストール') || text.includes('Installer') ||
                        text.includes('最新版') || text.includes('アップデート')) {
                        continue;
                    }
                    // Click video export/download button
                    if ((text.includes('ダウンロード') || text.includes('書き出し') || text.includes('エクスポート')) &&
                        !text.includes('アプリ')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (clicked) {
                this.log('🖱️', 'ダウンロードボタンをクリックしました');
                await this.page.waitForTimeout(2000);
            }

            // Wait for download
            const download = await downloadPromise;
            if (download) {
                const filename = download.suggestedFilename() || `vrew_cloud_${Date.now()}.mp4`;

                // Verify it's not an installer
                if (filename.includes('Installer') || filename.endsWith('.exe')) {
                    this.log('⚠️', `インストーラーがダウンロードされました (スキップ): ${filename}`);
                    return null;
                }

                const filePath = path.join(CONFIG.outputDir, filename);
                await download.saveAs(filePath);
                this.log('✅', `クラウドからダウンロード完了: ${filename}`);
                await this.screenshot('09_cloud_download_complete');
                return filePath;
            }

            this.log('ℹ️', 'クラウドダウンロードは利用できませんでした');
            return null;

        } catch (e) {
            this.log('⚠️', `クラウド保存エラー: ${e.message}`);
            return null;
        }
    }

    /**
     * Full video creation workflow
     */
    async createFullVideo(title, script) {
        this.log('🎬', `ビデオ作成開始: "${title.substring(0, 30)}..."`);

        // Step 1: Start new project
        const projectStarted = await this.startNewProject();
        if (!projectStarted) {
            this.log('❌', '新規プロジェクト開始に失敗');
            return null;
        }

        // Step 2: Select project type
        await this.selectProjectType('text');

        // Step 3: Enter script
        const scriptEntered = await this.enterScript(script);
        if (!scriptEntered) {
            this.log('❌', 'スクリプト入力に失敗');
            return null;
        }

        // Step 4: Generate video
        const generated = await this.generateVideo();
        if (!generated) {
            this.log('⚠️', '生成が完了しませんでした');
            // Continue to try export anyway
        }

        // Step 5: Export video
        const filePath = await this.exportVideo();

        if (filePath) {
            this.log('🎉', `ビデオ作成成功: ${filePath}`);
        }

        return filePath;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.log('👋', 'Browser closed');
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   Vrew Headless Video Automation                              ║');
    console.log('║   🎯 操作が奪われない自動ビデオ生成                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Show login mode instructions
    if (CONFIG.loginMode) {
        console.log('🔐 LOGIN MODE - Google OAuth');
        console.log('   Browser will open for manual login.');
        console.log('   Session will be saved for future headless runs.');
        console.log('');
    }

    const automation = new VrewHeadlessAutomation();
    let db = null;

    try {
        await automation.initialize();
        await automation.navigateToApp();

        // Login mode - manual Google OAuth
        if (CONFIG.loginMode) {
            const success = await automation.manualGoogleLogin();
            if (success) {
                automation.log('🎉', 'Login setup complete!');
            }
            await automation.close();
            return;
        }

        const isLoggedIn = await automation.checkLoginStatus();

        if (!isLoggedIn) {
            automation.log('⚠️', 'ログインが必要です。--login フラグで再実行してください。');
            await automation.screenshot('final_state');
            return;
        }

        // Test mode - create a sample video
        if (CONFIG.testMode) {
            automation.log('🧪', 'テストモード - サンプルビデオを作成します');
            const filePath = await automation.createFullVideo(
                'Vrew自動化テスト',
                CONFIG.testScript
            );

            if (filePath) {
                automation.log('🎉', `テストビデオ作成成功: ${filePath}`);
            } else {
                automation.log('⚠️', 'テストビデオ作成に問題がありました');
            }
            await automation.screenshot('final_state');
            return;
        }

        // Get video from database if available
        if (fs.existsSync(CONFIG.dbPath)) {
            db = new SimpleDB(CONFIG.dbPath);
            const video = await db.getPlannedVideo();

            if (video) {
                automation.log('📹', `ビデオを処理: ${video.title}`);
                await db.updateStatus(video.id, 'processing');

                const filePath = await automation.createFullVideo(video.title, video.script);

                if (filePath) {
                    await db.updateStatus(video.id, 'completed', filePath);
                    automation.log('🎉', 'ビデオ作成完了！');
                } else {
                    await db.updateStatus(video.id, 'pending_export');
                    automation.log('⚠️', 'エクスポート待ち状態');
                }
            } else {
                automation.log('📋', 'データベースに処理待ちビデオがありません');
                automation.log('💡', 'テストモードで実行: node scripts/vrew_headless_automation.js --test');
            }
        } else {
            automation.log('📋', 'データベースが見つかりません');
            automation.log('💡', 'テストモードで実行: node scripts/vrew_headless_automation.js --test');
        }

        await automation.screenshot('final_state');

    } catch (error) {
        console.error('');
        automation.log('❌', `Error: ${error.message}`);
        await automation.screenshot('error_state');
    } finally {
        await automation.close();
        if (db) db.close();
    }

    console.log('');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('  Screenshots saved to: AutoVideoGen/output/');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
}

main().catch(console.error);
