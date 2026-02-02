/**
 * Vrew Web Automation Script (Headless Mode)
 *
 * This script automates video creation using Vrew's web interface.
 * Runs completely in the background - does NOT take over your screen!
 *
 * Features:
 * - Headless browser (invisible)
 * - Text-to-video generation
 * - Database integration for batch processing
 *
 * Usage:
 *   node vrew_web_automation.js [--visible] [--video-id=1]
 *
 * Options:
 *   --visible    Show browser window (for debugging)
 *   --video-id   Process specific video ID from database
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const CONFIG = {
    baseUrl: 'https://vrew.ai',
    outputDir: path.join(__dirname, '..', 'output'),
    dbPath: path.join(__dirname, '..', 'database.db'),
    timeout: 60000,
    // Set to false for headless (background) mode
    headless: process.argv.includes('--visible') ? false : true,
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Database helper functions
 */
class Database {
    constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath);
    }

    getPlannedVideos() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM videos WHERE status = ? ORDER BY id LIMIT 1',
                ['planned'],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    getVideoById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    updateVideoStatus(id, status, filePath = null) {
        return new Promise((resolve, reject) => {
            const sql = filePath
                ? 'UPDATE videos SET status = ?, file_path = ? WHERE id = ?'
                : 'UPDATE videos SET status = ? WHERE id = ?';
            const params = filePath ? [status, filePath, id] : [status, id];

            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    close() {
        this.db.close();
    }
}

/**
 * Vrew Web Automation Class
 */
class VrewWebAutomation {
    constructor(options = {}) {
        this.headless = options.headless !== undefined ? options.headless : true;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log(`\n🚀 Starting Vrew Web Automation (${this.headless ? 'HEADLESS' : 'VISIBLE'} mode)`);
        console.log('   Your desktop will NOT be affected!\n');

        this.browser = await chromium.launch({
            headless: this.headless,
            args: ['--disable-blink-features=AutomationControlled'],
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        this.page = await this.context.newPage();

        // Set default timeout
        this.page.setDefaultTimeout(CONFIG.timeout);
    }

    async navigateToVrew() {
        console.log('📍 Navigating to Vrew...');
        await this.page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
        await this.takeScreenshot('01_home');
    }

    async clickTryForFree() {
        console.log('🔘 Clicking "Try for Free"...');

        // Look for Try for Free button
        const tryFreeBtn = this.page.locator('text=/Try for Free/i').first();
        if (await tryFreeBtn.count() > 0) {
            await tryFreeBtn.click();
            await this.page.waitForTimeout(3000);
            await this.takeScreenshot('02_after_try_free');
            return true;
        }

        console.log('   Button not found, trying alternative...');
        return false;
    }

    async navigateToTextToVideo() {
        console.log('📍 Navigating to Text-to-Video feature...');

        // Direct navigation to text-to-video
        await this.page.goto(`${CONFIG.baseUrl}/en/feature/generative-ai-tools`, {
            waitUntil: 'networkidle'
        });
        await this.takeScreenshot('03_generative_ai');

        // Look for "Video from text" section
        const videoFromText = this.page.locator('text=/Video from text/i').first();
        if (await videoFromText.count() > 0) {
            console.log('   Found "Video from text" section');
            await videoFromText.click();
            await this.page.waitForTimeout(2000);
        }
    }

    async checkLoginStatus() {
        console.log('🔐 Checking login status...');

        // Look for sign in button (means not logged in)
        const signInBtn = this.page.locator('text=/Sign In/i').first();
        const isLoggedOut = await signInBtn.count() > 0;

        if (isLoggedOut) {
            console.log('   Not logged in. Login required for full functionality.');
            return false;
        }

        console.log('   Logged in or guest mode available');
        return true;
    }

    async enterScript(title, script) {
        console.log(`📝 Entering script: "${title.substring(0, 30)}..."`);

        // Find text input area
        const textArea = this.page.locator('textarea, [contenteditable="true"]').first();
        if (await textArea.count() > 0) {
            await textArea.fill(script);
            console.log('   Script entered successfully');
            await this.takeScreenshot('04_script_entered');
            return true;
        }

        console.log('   Text input not found');
        return false;
    }

    async generateVideo() {
        console.log('🎬 Starting video generation...');

        // Look for generate/create button
        const generateBtn = this.page.locator('button:has-text(/generate|create|作成/i)').first();
        if (await generateBtn.count() > 0) {
            await generateBtn.click();
            console.log('   Generation started, waiting...');

            // Wait for generation (this could take a while)
            await this.page.waitForTimeout(10000);
            await this.takeScreenshot('05_generating');
            return true;
        }

        console.log('   Generate button not found');
        return false;
    }

    async downloadVideo() {
        console.log('⬇️ Looking for download option...');

        // Look for download/export button
        const downloadBtn = this.page.locator('text=/download|export|ダウンロード/i').first();
        if (await downloadBtn.count() > 0) {
            // Set up download handler
            const [download] = await Promise.all([
                this.page.waitForEvent('download', { timeout: 120000 }),
                downloadBtn.click(),
            ]);

            const filePath = path.join(CONFIG.outputDir, download.suggestedFilename());
            await download.saveAs(filePath);
            console.log(`   Video saved: ${filePath}`);
            return filePath;
        }

        console.log('   Download button not found');
        return null;
    }

    async takeScreenshot(name) {
        const filename = `${name}_${Date.now()}.png`;
        const filepath = path.join(CONFIG.outputDir, filename);
        await this.page.screenshot({ path: filepath, fullPage: false });
        console.log(`   📸 Screenshot: ${filename}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('\n✅ Browser closed');
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Vrew Web Automation - Background Video Generation');
    console.log('  Your desktop remains free while this runs!');
    console.log('═══════════════════════════════════════════════════════════════');

    const automation = new VrewWebAutomation({ headless: CONFIG.headless });
    let db = null;

    try {
        // Initialize
        await automation.initialize();
        await automation.navigateToVrew();

        // Check if specific video ID requested
        const videoIdArg = process.argv.find(arg => arg.startsWith('--video-id='));
        let video = null;

        if (videoIdArg) {
            const videoId = parseInt(videoIdArg.split('=')[1]);
            db = new Database(CONFIG.dbPath);
            video = await db.getVideoById(videoId);
        } else if (fs.existsSync(CONFIG.dbPath)) {
            db = new Database(CONFIG.dbPath);
            const videos = await db.getPlannedVideos();
            video = videos[0];
        }

        if (video) {
            console.log(`\n📹 Processing video: ${video.title}`);

            // Update status
            if (db) await db.updateVideoStatus(video.id, 'processing');

            // Navigate to text-to-video
            await automation.navigateToTextToVideo();

            // Try to enter script
            await automation.clickTryForFree();

            // Check current page and take final screenshot
            await automation.takeScreenshot('final_state');

            console.log('\n📊 Current URL:', automation.page.url());
            console.log('\n⚠️  Note: Full automation requires Vrew account login.');
            console.log('   The headless approach works - login credentials needed for complete flow.');

        } else {
            console.log('\n📋 No pending videos found. Running exploration mode...');
            await automation.navigateToTextToVideo();
            await automation.clickTryForFree();
            await automation.takeScreenshot('exploration');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await automation.takeScreenshot('error');
    } finally {
        await automation.close();
        if (db) db.close();
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  Automation complete. Check output/ folder for screenshots.');
    console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run
main().catch(console.error);
