// Shared logger for main process
// Logs can be retrieved via diag:logs IPC call

const logs: string[] = []
const MAX_LOGS = 200

export function log(message: string): void {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}`
  logs.push(logEntry)
  console.log(logEntry)

  // Keep only last MAX_LOGS entries
  while (logs.length > MAX_LOGS) {
    logs.shift()
  }
}

export function getLogs(): string[] {
  return [...logs]
}

export function clearLogs(): void {
  logs.length = 0
}
