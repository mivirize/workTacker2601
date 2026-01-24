"use strict";
// ============================================
// Core Domain Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORIES = exports.DEFAULT_SETTINGS = void 0;
exports.DEFAULT_SETTINGS = {
    trackingIntervalMs: 5000,
    idleThresholdMs: 180000, // 3 minutes
    excludedApps: [],
    dataRetentionDays: 90,
    launchOnStartup: true,
    minimizeToTray: true,
    showNotifications: true,
};
// ============================================
// Default Categories
// ============================================
exports.DEFAULT_CATEGORIES = [
    {
        name: '開発',
        color: '#10b981',
        isDefault: true,
        rules: [
            { type: 'app', pattern: 'Code', isRegex: false },
            { type: 'app', pattern: 'Visual Studio', isRegex: false },
            { type: 'app', pattern: 'WebStorm', isRegex: false },
            { type: 'app', pattern: 'IntelliJ', isRegex: false },
            { type: 'app', pattern: 'Terminal', isRegex: false },
            { type: 'app', pattern: 'iTerm', isRegex: false },
            { type: 'app', pattern: 'Windows Terminal', isRegex: false },
            { type: 'app', pattern: 'cmd', isRegex: false },
            { type: 'app', pattern: 'PowerShell', isRegex: false },
            { type: 'title', pattern: 'GitHub', isRegex: false },
            { type: 'url', pattern: 'github.com', isRegex: false },
            { type: 'url', pattern: 'stackoverflow.com', isRegex: false },
        ],
    },
    {
        name: 'コミュニケーション',
        color: '#f59e0b',
        isDefault: true,
        rules: [
            { type: 'app', pattern: 'Slack', isRegex: false },
            { type: 'app', pattern: 'Discord', isRegex: false },
            { type: 'app', pattern: 'Teams', isRegex: false },
            { type: 'app', pattern: 'Mail', isRegex: false },
            { type: 'app', pattern: 'Outlook', isRegex: false },
            { type: 'app', pattern: 'Gmail', isRegex: false },
            { type: 'title', pattern: 'Slack', isRegex: false },
            { type: 'url', pattern: 'slack.com', isRegex: false },
            { type: 'url', pattern: 'mail.google.com', isRegex: false },
        ],
    },
    {
        name: 'ドキュメント',
        color: '#6366f1',
        isDefault: true,
        rules: [
            { type: 'app', pattern: 'Word', isRegex: false },
            { type: 'app', pattern: 'Excel', isRegex: false },
            { type: 'app', pattern: 'PowerPoint', isRegex: false },
            { type: 'app', pattern: 'Notion', isRegex: false },
            { type: 'app', pattern: 'Google Docs', isRegex: false },
            { type: 'app', pattern: 'Pages', isRegex: false },
            { type: 'app', pattern: 'Numbers', isRegex: false },
            { type: 'title', pattern: 'Notion', isRegex: false },
            { type: 'url', pattern: 'notion.so', isRegex: false },
            { type: 'url', pattern: 'docs.google.com', isRegex: false },
        ],
    },
    {
        name: 'ミーティング',
        color: '#8b5cf6',
        isDefault: true,
        rules: [
            { type: 'app', pattern: 'Zoom', isRegex: false },
            { type: 'app', pattern: 'Google Meet', isRegex: false },
            { type: 'app', pattern: 'Webex', isRegex: false },
            { type: 'title', pattern: 'Zoom Meeting', isRegex: false },
            { type: 'title', pattern: 'Google Meet', isRegex: false },
            { type: 'url', pattern: 'meet.google.com', isRegex: false },
            { type: 'url', pattern: 'zoom.us', isRegex: false },
        ],
    },
    {
        name: 'ブラウジング',
        color: '#ec4899',
        isDefault: true,
        rules: [
            { type: 'app', pattern: 'Chrome', isRegex: false },
            { type: 'app', pattern: 'Firefox', isRegex: false },
            { type: 'app', pattern: 'Safari', isRegex: false },
            { type: 'app', pattern: 'Edge', isRegex: false },
            { type: 'app', pattern: 'Brave', isRegex: false },
        ],
    },
    {
        name: 'その他',
        color: '#6b7280',
        isDefault: true,
        rules: [],
    },
];
//# sourceMappingURL=types.js.map