import { test, expect } from '@playwright/test';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Run with: npx playwright test scripts/4_upload_tiktok.spec.ts --headed

const DB_PATH = path.resolve(__dirname, '../database.db');

function getNextVideo(): Promise<any> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        // Find a video that is created but not yet marked as uploaded to tiktok
        // For simplicity, we reuse 'created' status, but in production we'd want 'uploaded_tiktok'
        db.get("SELECT * FROM videos WHERE status='created' LIMIT 1", (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

test('Upload to TikTok', async ({ page }) => {
    const video = await getNextVideo();
    if (!video) {
        console.log("No videos found with status='created'.");
        return;
    }

    const filePath = video.file_path; // Should be absolute path
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    console.log(`Uploading to TikTok: ${video.title}`);

    // 1. Navigate to Upload Page
    await page.goto('https://www.tiktok.com/upload?lang=en');

    // 2. Check Login
    try {
        // Wait for upload container or iframe
        await page.waitForSelector('input[type="file"]', { timeout: 15000 });
    } catch (e) {
        console.log("Please log in to TikTok manually in the browser window.");
        await page.pause(); // Wait for user to login
    }

    // 3. Select File
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // 4. Wait for Upload Progress
    // TikTok shows a progress bar or a "Uploaded" state.
    // We wait for the "Post" button to become enabled or the progress to complete.
    console.log("Waiting for upload to complete...");

    // Wait for the caption area to be ready (it usually is)
    // The caption is often in a contenteditable div
    const captionSelector = '.public-DraftEditor-content';
    try {
        await page.waitForSelector(captionSelector, { timeout: 60000 });
        await page.click(captionSelector);
        // Clear existing text if any (sometimes filename is auto-filled)
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');

        // Type title + hashtags
        await page.keyboard.type(`${video.title} #fyp #ai #shorts`);
    } catch (e) {
        console.log("Could not focus caption area, skipping caption or manual intervention needed.");
    }

    // 5. Click Post
    // The Post button usually has text "Post"
    const postButton = page.getByRole('button', { name: 'Post', exact: true });

    // Wait for it to be enabled (upload finished)
    await expect(postButton).toBeEnabled({ timeout: 120000 });
    await postButton.click();

    // 6. Confirm success
    // Usually redirects or shows a modal "Your video is being uploaded"
    await page.waitForTimeout(5000);
    // await page.getByText('Your video is being uploaded').waitFor();

    console.log("TikTok upload sequence finished.");

    // Ideally update DB here
    // updateStatusTikTok(video.id);
});
