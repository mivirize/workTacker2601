"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    // Tracking
    tracking: {
        start: () => electron_1.ipcRenderer.invoke('tracking:start'),
        stop: () => electron_1.ipcRenderer.invoke('tracking:stop'),
        pause: () => electron_1.ipcRenderer.invoke('tracking:pause'),
        resume: () => electron_1.ipcRenderer.invoke('tracking:resume'),
        getState: () => electron_1.ipcRenderer.invoke('tracking:state'),
    },
    // Activities
    activities: {
        getToday: () => electron_1.ipcRenderer.invoke('activities:today'),
        getForDate: (date) => electron_1.ipcRenderer.invoke('activities:date', date),
        getForRange: (startDate, endDate) => electron_1.ipcRenderer.invoke('activities:range', startDate, endDate),
        updateCategory: (activityId, categoryId) => electron_1.ipcRenderer.invoke('activities:updateCategory', activityId, categoryId),
    },
    // Statistics
    stats: {
        getDaily: (date) => electron_1.ipcRenderer.invoke('stats:daily', date),
        getWeekly: (weekStart) => electron_1.ipcRenderer.invoke('stats:weekly', weekStart),
        getAppUsage: (startDate, endDate) => electron_1.ipcRenderer.invoke('stats:appUsage', startDate, endDate),
    },
    // Categories
    categories: {
        getAll: () => electron_1.ipcRenderer.invoke('categories:list'),
        create: (category) => electron_1.ipcRenderer.invoke('categories:create', category),
        update: (category) => electron_1.ipcRenderer.invoke('categories:update', category),
        delete: (categoryId) => electron_1.ipcRenderer.invoke('categories:delete', categoryId),
    },
    // Settings
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        update: (settings) => electron_1.ipcRenderer.invoke('settings:update', settings),
    },
    // Export
    export: {
        toCSV: (startDate, endDate) => electron_1.ipcRenderer.invoke('export:csv', startDate, endDate),
        toJSON: (startDate, endDate) => electron_1.ipcRenderer.invoke('export:json', startDate, endDate),
    },
};
electron_1.contextBridge.exposeInMainWorld('api', api);
//# sourceMappingURL=index.js.map