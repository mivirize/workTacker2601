import { test, expect } from '@playwright/test';
import sqlite3 from 'sqlite3';
import path from 'path';

// This is a Playwright Test script, run with: npx playwright test scripts/3_upload_videos.ts --headed

const DB_PATH = path.resolve(__dirname, '../database.db');

function getNextVideo(): Promise<any> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.get("SELECT * FROM videos WHERE status='created' LIMIT 1", (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function updateStatus(id: number) {
    const db = new sqlite3.Database(DB_PATH);
    db.run("UPDATE videos SET status='uploaded' WHERE id=?", [id], (err) => {
        db.close();
    });
}

test('Upload to YouTube', async ({ page }) => {
    // 1. Get Video
    const video = await getNextVideo();
    if (!video) {
        console.log("No videos to upload.");
        return;
    }
    console.log(`Uploading: ${video.title}`);

    // 2. Login (Manual or Save authentication state first)
    // Suggest running with --save-storage first or logging in manually
    await page.goto('https://studio.youtube.com');

    // Check if logged in
    try {
        await page.waitForSelector('#create-icon', { timeout: 10000 });
    } catch (e) {
        console.log("Please log in to YouTube manually in the browser window.");
        await page.pause(); // Wait for user to login
    }

    // 3. Start Upload
    await page.click('#create-icon');
    await page.click('#text-item-0'); // "Upload videos"

    // 4. File Input
    const fileInput = await page.waitForSelector('input[type="file"]');
    await fileInput.setInputFiles(video.file_path);

    // 5. Fill Details
    await page.waitForSelector('#textbox[aria-label="Add a title that describes your video"]');

    // Title
    await page.fill('#textbox[aria-label="Add a title that describes your video"]', video.title);

    // Description
    await page.fill('#textbox[aria-label="Tell viewers about your video"]', video.summary);

    // Kids check (No, it's not for kids)
    await page.click('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');

    // Next... Next... Next...
    await page.click('#next-button');
    await page.click('#next-button');
    await page.click('#next-button');

    // Visibility: Public
    await page.click('tp-yt-paper-radio-button[name="PUBLIC"]');

    // Publish
    await page.click('#done-button');

    // Wait for "Video published" or close dialog
    await page.waitForTimeout(5000);

    console.log("Upload complete!");
    updateStatus(video.id);
});
