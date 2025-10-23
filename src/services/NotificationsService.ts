export interface Notification {
  Timestamp: string;
  UserID: string;
  UserName: string;
  DocumentID: string;
  DocumentTitle: string;
}

export type NotificationCallback = (notification: Notification) => void;

import { API_CONFIG } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export class NotificationsService {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: Set<NotificationCallback> = new Set();

  constructor(url: string = API_CONFIG.NOTIFICATIONS_WS_URL) {
    this.url = url;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          //   this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const notification: Notification = JSON.parse(event.data);
            this.broadcastNotification(notification);
          } catch (error) {
            logger.error("NotificationsService", error);
          }
        };

        this.ws.onerror = (error: Event) => {
          logger.error("NotificationsService", error);
          reject(error);
        };

        this.ws.onclose = () => {
          logger.info("NotificationsService", "WebSocket disconnected");
        };
      } catch (error) {
        logger.error("NotificationsService", error);
        reject(error);
      }
    });
  }

  public subscribe(callback: NotificationCallback): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private broadcastNotification(notification: Notification): void {
    this.callbacks.forEach((callback) => {
      callback(notification);
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      logger.info("NotificationsService", "WebSocket disconnected manually");
    }
  }
}
