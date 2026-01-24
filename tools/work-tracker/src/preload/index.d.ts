import type {
  Activity,
  Category,
  Tag,
  Project,
  AppSettings,
  TrackingState,
  DailySummary,
  WeeklySummary,
  MonthlySummary,
  AppDuration,
  SearchFilters,
  Goal,
  GoalProgress,
  CreateActivityInput,
  UpdateActivityInput,
  CalendarDaySummary,
} from '../shared/types';

declare const api: {
  diag: {
    ping: () => Promise<{
      message: string;
      timestamp: number;
      platform: string;
      nodeVersion: string;
      electronVersion: string;
    }>;
    getLogs: () => Promise<string[]>;
    testEncoding: () => Promise<{
      success: boolean;
      tempFile?: string;
      rawJson?: string;
      hasBOM?: boolean;
      firstBytesHex?: string;
      parsed?: { title: string; appName: string; path: string };
      error?: string;
    }>;
  };
  test: {
    ping: () => Promise<{ message: string; timestamp: number }>;
  };
  tracking: {
    start: () => Promise<TrackingState>;
    stop: () => Promise<TrackingState>;
    pause: () => Promise<TrackingState>;
    resume: () => Promise<TrackingState>;
    getState: () => Promise<TrackingState>;
  };
  activities: {
    getToday: () => Promise<Activity[]>;
    getForDate: (date: string) => Promise<Activity[]>;
    getForRange: (startDate: string, endDate: string) => Promise<Activity[]>;
    search: (filters: SearchFilters) => Promise<Activity[]>;
    updateCategory: (activityId: number, categoryId: number | null) => Promise<void>;
    create: (input: CreateActivityInput) => Promise<Activity>;
    update: (input: UpdateActivityInput) => Promise<Activity>;
    delete: (activityId: number) => Promise<void>;
    getById: (activityId: number) => Promise<Activity | null>;
  };
  calendar: {
    getMonthSummary: (yearMonth: string) => Promise<CalendarDaySummary[]>;
  };
  stats: {
    getDaily: (date: string) => Promise<DailySummary>;
    getWeekly: (weekStart: string) => Promise<WeeklySummary>;
    getMonthly: (yearMonth: string) => Promise<MonthlySummary>;
    getAppUsage: (startDate: string, endDate: string) => Promise<AppDuration[]>;
  };
  categories: {
    getAll: () => Promise<Category[]>;
    create: (category: Omit<Category, 'id'>) => Promise<Category>;
    update: (category: Category) => Promise<Category>;
    delete: (categoryId: number) => Promise<void>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  };
  goals: {
    getAll: () => Promise<Goal[]>;
    create: (goal: Omit<Goal, 'id'>) => Promise<Goal>;
    update: (goal: Goal) => Promise<Goal>;
    delete: (goalId: number) => Promise<void>;
    getProgress: () => Promise<GoalProgress[]>;
  };
  tags: {
    getAll: () => Promise<Tag[]>;
    create: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
    update: (tag: Tag) => Promise<Tag>;
    delete: (tagId: number) => Promise<void>;
    setForActivity: (activityId: number, tagIds: number[]) => Promise<void>;
    reapplyToAll: () => Promise<{ processedCount: number; updatedCount: number }>;
  };
  projects: {
    getAll: () => Promise<Project[]>;
    create: (project: Omit<Project, 'id'>) => Promise<Project>;
    update: (project: Project) => Promise<Project>;
    delete: (projectId: number) => Promise<void>;
  };
  export: {
    toCSV: (startDate: string, endDate: string) => Promise<string>;
    toJSON: (startDate: string, endDate: string) => Promise<string>;
  };
};

declare global {
  interface Window {
    api: typeof api;
  }
}

export {};
