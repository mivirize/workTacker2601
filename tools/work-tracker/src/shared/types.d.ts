export interface Activity {
    id: number;
    appName: string;
    windowTitle: string;
    startTime: number;
    endTime: number | null;
    durationSeconds: number;
    categoryId: number | null;
    isIdle: boolean;
    url?: string;
}
export interface Category {
    id: number;
    name: string;
    color: string;
    rules: CategoryRule[];
    isDefault: boolean;
}
export interface CategoryRule {
    type: 'app' | 'title' | 'url';
    pattern: string;
    isRegex: boolean;
}
export interface Application {
    id: number;
    name: string;
    executablePath?: string;
    icon?: string;
    totalDuration: number;
    categoryId: number | null;
}
export interface ActiveWindowInfo {
    title: string;
    owner: {
        name: string;
        path?: string;
    };
    url?: string;
    timestamp: number;
}
export interface TrackingState {
    isTracking: boolean;
    isPaused: boolean;
    lastActivity: number;
    isIdle: boolean;
}
export interface DailySummary {
    date: string;
    totalDuration: number;
    productiveDuration: number;
    idleDuration: number;
    categoryBreakdown: CategoryDuration[];
    appBreakdown: AppDuration[];
    timeline: TimelineEntry[];
}
export interface CategoryDuration {
    categoryId: number;
    categoryName: string;
    color: string;
    duration: number;
    percentage: number;
}
export interface AppDuration {
    appName: string;
    duration: number;
    percentage: number;
    categoryId: number | null;
}
export interface TimelineEntry {
    startTime: number;
    endTime: number;
    appName: string;
    windowTitle: string;
    categoryId: number | null;
    isIdle: boolean;
}
export interface WeeklySummary {
    weekStart: string;
    weekEnd: string;
    dailySummaries: DailySummary[];
    totalDuration: number;
    averageDailyDuration: number;
    topApps: AppDuration[];
    topCategories: CategoryDuration[];
}
export interface AppSettings {
    trackingIntervalMs: number;
    idleThresholdMs: number;
    excludedApps: string[];
    dataRetentionDays: number;
    launchOnStartup: boolean;
    minimizeToTray: boolean;
    showNotifications: boolean;
}
export declare const DEFAULT_SETTINGS: AppSettings;
export type IpcChannels = {
    'tracking:start': () => void;
    'tracking:stop': () => void;
    'tracking:pause': () => void;
    'tracking:resume': () => void;
    'tracking:state': () => TrackingState;
    'activities:today': () => Activity[];
    'activities:range': (startDate: string, endDate: string) => Activity[];
    'activities:updateCategory': (activityId: number, categoryId: number) => void;
    'stats:daily': (date: string) => DailySummary;
    'stats:weekly': (weekStart: string) => WeeklySummary;
    'stats:appUsage': (startDate: string, endDate: string) => AppDuration[];
    'categories:list': () => Category[];
    'categories:create': (category: Omit<Category, 'id'>) => Category;
    'categories:update': (category: Category) => Category;
    'categories:delete': (categoryId: number) => void;
    'settings:get': () => AppSettings;
    'settings:update': (settings: Partial<AppSettings>) => AppSettings;
    'export:csv': (startDate: string, endDate: string) => string;
    'export:json': (startDate: string, endDate: string) => string;
};
export declare const DEFAULT_CATEGORIES: Omit<Category, 'id'>[];
//# sourceMappingURL=types.d.ts.map