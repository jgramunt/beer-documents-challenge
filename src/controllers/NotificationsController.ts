import {
  NotificationsService,
  Notification,
} from "../services/NotificationsService";
import { Notifications } from "../components/Notifications";
import { NotificationsWindow } from "../components/NotificationsWindow";

export class NotificationsController {
  private service: NotificationsService;
  private notificationsComponent: Notifications;
  private notificationsWindow: NotificationsWindow;
  private unsubscribe: (() => void) | null = null;

  constructor(service: NotificationsService) {
    this.service = service;
    this.notificationsComponent = new Notifications();
    this.notificationsWindow = new NotificationsWindow();
  }

  public async initialize(): Promise<void> {
    await this.service.connect();

    this.unsubscribe = this.service.subscribe((notification: Notification) => {
      this.onNotificationReceived(notification);
    });
  }

  private onNotificationReceived(notification: Notification): void {

    const message = `${notification.UserName} created "${notification.DocumentTitle}"`;
    this.notificationsComponent.showMessage(message, 4000);

    this.notificationsWindow.addNotification(message, "New Document");
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
