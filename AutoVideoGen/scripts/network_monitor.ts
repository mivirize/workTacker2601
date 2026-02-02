/**
 * Vrew API Reverse Engineering - Network Monitor
 *
 * This script monitors all network requests during the video generation process
 * to identify Vrew's backend API endpoints.
 *
 * Usage: npx ts-node scripts/network_monitor.ts
 */

import { chromium, BrowserContext, Page, Request, Response } from 'playwright';
import path from 'path';
import fs from 'fs';

// Configuration
const OUTPUT_DIR = path.resolve(__dirname, '../output/api_analysis');
const userDataDir = path.resolve(__dirname, '../user_data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface RequestLog {
    timestamp: string;
    method: string;
    url: string;
    resourceType: string;
    headers: Record<string, string>;
    postData?: string;
    response?: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        body?: string;
    };
}

const requestLogs: RequestLog[] = [];

// Filter function - only log API-related requests
function isApiRequest(url: string): boolean {
    return (
        url.includes('api') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('graphql') ||
        url.includes('.json') ||
        url.includes('render') ||
        url.includes('export') ||
        url.includes('project') ||
        url.includes('video') ||
        url.includes('generate') ||
        url.includes('auth') ||
        url.includes('token') ||
        url.includes('session')
    );
}

// Skip static resources
function shouldSkip(url: string): boolean {
    const skipPatterns = [
        '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
        '.css', '.woff', '.woff2', '.ttf', '.eot',
        'analytics', 'gtag', 'ga.js', 'pixel', 'tracking',
        'fonts.googleapis', 'fonts.gstatic'
    ];
    return skipPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('Vrew API Reverse Engineering - Network Monitor');
    console.log('='.repeat(60) + '\n');

    // Launch browser
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
        ],
        viewport: { width: 1280, height: 720 },
    });

    const page = context.pages()[0] || await context.newPage();

    // Enable request interception
    console.log('Setting up network monitoring...\n');

    // Monitor requests
    page.on('request', (request: Request) => {
        const url = request.url();

        if (shouldSkip(url)) return;

        const log: RequestLog = {
            timestamp: new Date().toISOString(),
            method: request.method(),
            url: url,
            resourceType: request.resourceType(),
            headers: request.headers(),
        };

        if (request.postData()) {
            log.postData = request.postData();
        }

        requestLogs.push(log);

        // Log important requests to console
        if (isApiRequest(url) || request.method() !== 'GET') {
            console.log(`[${request.method()}] ${url}`);
            if (log.postData) {
                try {
                    const parsed = JSON.parse(log.postData);
                    console.log('  Body:', JSON.stringify(parsed, null, 2).substring(0, 200));
                } catch {
                    console.log('  Body:', log.postData.substring(0, 200));
                }
            }
        }
    });

    // Monitor responses
    page.on('response', async (response: Response) => {
        const url = response.url();

        if (shouldSkip(url)) return;

        // Find corresponding request log
        const log = requestLogs.find(l => l.url === url && !l.response);
        if (!log) return;

        log.response = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
        };

        // Try to capture response body for API calls
        if (isApiRequest(url) && response.status() === 200) {
            try {
                const contentType = response.headers()['content-type'] || '';
                if (contentType.includes('json')) {
                    const body = await response.text();
                    log.response.body = body;
                    console.log(`  Response (${response.status()}):`, body.substring(0, 300));
                }
            } catch (e) {
                // Response body not available
            }
        }
    });

    // Navigate to Vrew
    console.log('\nNavigating to Vrew...\n');
    await page.goto('https://vrew.ai/ja/try/index.html');

    console.log('\n' + '='.repeat(60));
    console.log('INSTRUCTIONS:');
    console.log('='.repeat(60));
    console.log('1. Log in to Vrew if needed');
    console.log('2. Create a new video project');
    console.log('3. Enter title and script');
    console.log('4. Generate the video');
    console.log('5. Export as MP4');
    console.log('6. Observe all API calls logged above');
    console.log('7. Press Ctrl+C when done');
    console.log('='.repeat(60) + '\n');

    // Wait for user to interact
    await page.waitForTimeout(600000); // 10 minutes max

    // Save logs
    saveResults();
}

function saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Save all logs
    const allLogsPath = path.join(OUTPUT_DIR, `all_requests_${timestamp}.json`);
    fs.writeFileSync(allLogsPath, JSON.stringify(requestLogs, null, 2));
    console.log(`\nAll requests saved to: ${allLogsPath}`);

    // Filter and save API-only logs
    const apiLogs = requestLogs.filter(log =>
        isApiRequest(log.url) || log.method !== 'GET'
    );

    const apiLogsPath = path.join(OUTPUT_DIR, `api_requests_${timestamp}.json`);
    fs.writeFileSync(apiLogsPath, JSON.stringify(apiLogs, null, 2));
    console.log(`API requests saved to: ${apiLogsPath}`);

    // Generate summary
    const summary = generateSummary(apiLogs);
    const summaryPath = path.join(OUTPUT_DIR, `api_summary_${timestamp}.md`);
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary saved to: ${summaryPath}`);

    console.log(`\nTotal requests captured: ${requestLogs.length}`);
    console.log(`API requests captured: ${apiLogs.length}`);
}

function generateSummary(logs: RequestLog[]): string {
    const endpoints = new Map<string, { method: string; count: number; samples: RequestLog[] }>();

    for (const log of logs) {
        try {
            const url = new URL(log.url);
            const key = `${log.method} ${url.hostname}${url.pathname}`;

            if (!endpoints.has(key)) {
                endpoints.set(key, { method: log.method, count: 0, samples: [] });
            }

            const entry = endpoints.get(key)!;
            entry.count++;
            if (entry.samples.length < 3) {
                entry.samples.push(log);
            }
        } catch { }
    }

    let md = '# Vrew API Analysis Summary\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Discovered Endpoints\n\n`;

    const sortedEndpoints = Array.from(endpoints.entries())
        .sort((a, b) => b[1].count - a[1].count);

    for (const [endpoint, data] of sortedEndpoints) {
        md += `### ${endpoint}\n`;
        md += `- **Count:** ${data.count}\n`;

        if (data.samples[0]?.postData) {
            md += `- **Sample Body:**\n\`\`\`json\n${data.samples[0].postData.substring(0, 500)}\n\`\`\`\n`;
        }

        if (data.samples[0]?.response?.body) {
            md += `- **Sample Response:**\n\`\`\`json\n${data.samples[0].response.body.substring(0, 500)}\n\`\`\`\n`;
        }

        md += '\n';
    }

    return md;
}

// Handle exit
process.on('SIGINT', () => {
    console.log('\n\nSaving results before exit...');
    saveResults();
    process.exit(0);
});

main().catch(console.error);
