/**
 * Test Vrew Web Version with Playwright (headless mode)
 * This script runs in the background without taking over the desktop
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testVrewWeb() {
    console.log('=== Vrew Web Version Test (Headless Mode) ===\n');

    // Launch browser in headless mode (no visible window)
    const browser = await chromium.launch({
        headless: true,  // Runs in background, doesn't take over screen
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    try {
        console.log('1. Navigating to Vrew website...');
        await page.goto('https://vrew.ai', { waitUntil: 'networkidle', timeout: 30000 });

        // Take screenshot
        const outputDir = path.join(__dirname, '..', 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await page.screenshot({ path: path.join(outputDir, 'vrew_web_home.png'), fullPage: true });
        console.log('   Screenshot saved: vrew_web_home.png');

        // Get page title and content
        const title = await page.title();
        console.log(`   Page title: ${title}`);

        // Look for login/signup buttons
        console.log('\n2. Searching for key elements...');

        const buttons = await page.locator('button, a').allTextContents();
        const uniqueButtons = [...new Set(buttons)].filter(b => b.trim().length > 0 && b.trim().length < 50);
        console.log('   Found buttons/links:');
        uniqueButtons.slice(0, 15).forEach(b => console.log(`     - ${b.trim()}`));

        // Look for "Start" or "Create" buttons
        const startButton = await page.locator('text=/start|begin|create|作成|始める/i').first();
        if (await startButton.count() > 0) {
            console.log('\n3. Found start/create button, clicking...');
            await startButton.click();
            await page.waitForTimeout(3000);

            await page.screenshot({ path: path.join(outputDir, 'vrew_web_after_click.png'), fullPage: true });
            console.log('   Screenshot saved: vrew_web_after_click.png');
        }

        // Check current URL
        console.log(`\n4. Current URL: ${page.url()}`);

        // Look for text-to-video feature
        const textToVideo = await page.locator('text=/text.*video|テキスト.*動画|script.*video/i').first();
        if (await textToVideo.count() > 0) {
            console.log('   Found text-to-video feature!');
        }

        console.log('\n=== Test Complete ===');
        console.log('Vrew web version can be automated with Playwright in headless mode.');
        console.log('This means automation runs in background without taking over your screen!');

    } catch (error) {
        console.error('Error:', error.message);
        await page.screenshot({ path: path.join(outputDir, 'vrew_web_error.png') });
    } finally {
        await browser.close();
    }
}

testVrewWeb().catch(console.error);
