/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: "http://localhost:8080",
  DOCUMENTS_ENDPOINT: "/documents",
  NOTIFICATIONS_WS_URL: "ws://localhost:8080/notifications",
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  MAX_NOTIFICATIONS: 30,
  NOTIFICATION_DURATION: 4000,
};

/**
 * Document Title Validation Configuration
 */
export const VALIDATION_CONFIG = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 150,
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  CACHE_KEY: "documents_cache",
};
