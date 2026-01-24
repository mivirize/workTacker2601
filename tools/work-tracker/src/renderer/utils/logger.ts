/**
 * Renderer process logger utility.
 * Only logs in development mode to keep production console clean.
 */

const isDev = import.meta.env.DEV

export function log(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.log(`[Renderer] ${message}`, ...args)
  }
}

export function logError(message: string, error?: unknown): void {
  if (isDev) {
    console.error(`[Renderer] ${message}`, error)
  }
}

export function logWarn(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.warn(`[Renderer] ${message}`, ...args)
  }
}
