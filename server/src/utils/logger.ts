import pino from "pino";
import { config } from "../config/index.js";

/**
 * Creates a structured logger instance
 */
export const logger = pino({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Creates a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
