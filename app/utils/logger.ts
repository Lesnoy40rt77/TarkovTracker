type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && value in levelPriority;
}
const fallbackLogLevel: LogLevel = import.meta.env.DEV ? 'info' : 'warn';
const resolveLogLevel = (): LogLevel => {
  const nuxtApp = tryUseNuxtApp();
  const runtimeLevel = nuxtApp?.$config?.public?.VITE_LOG_LEVEL;
  const envLevel = import.meta.env.VITE_LOG_LEVEL;
  const rawLevel = typeof runtimeLevel === 'string' ? runtimeLevel : envLevel;
  const normalizedLevel = typeof rawLevel === 'string' ? rawLevel.toLowerCase() : undefined;
  return isLogLevel(normalizedLevel) ? normalizedLevel : fallbackLogLevel;
};
const shouldLog = (level: LogLevel) => levelPriority[level] >= levelPriority[resolveLogLevel()];
export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(...args);
  },
  error: (...args: unknown[]) => console.error(...args),
};
function createDevLogger(method: 'debug' | 'warn' | 'error') {
  return (message: string, ...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console[method](`[DEV] ${message}`, ...args);
    }
  };
}
export const devLog = createDevLogger('debug');
export const devWarn = createDevLogger('warn');
export const devError = createDevLogger('error');
