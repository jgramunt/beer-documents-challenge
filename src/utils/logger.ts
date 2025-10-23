/**
 * Simple logger utility for consistent error and warning messages
 */
export const logger = {
  error: (context: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] ${message}`);
  },

  warn: (context: string, message: string) => {
    console.warn(`[${context}] ${message}`);
  },

  info: (context: string, message: string) => {
    console.info(`[${context}] ${message}`);
  },
};
